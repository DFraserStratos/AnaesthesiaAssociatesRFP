# Phase 20 · One Contract per Procedure and the step rail

**Requirements covered:**
[US-04.3.1](../../../../requirements-board/requirements/stories/US-04.3.1.md) (Contradicts: exactly one Contract per Procedure, no line),
[US-04.3.8](../../../../requirements-board/requirements/stories/US-04.3.8.md) (Contradicts: the step rail, mirrored for the anaesthetist, answers so far kept on the Procedure),
[US-04.3.9](../../../../requirements-board/requirements/stories/US-04.3.9.md) (Contradicts: the "Other price" toggle onto 18a's open-price fallbacks, the amount typed on the Procedure, who may type it),
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (Contradicts: the candidate rule and the one search, no "show all"),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (Partial: one No contract · RVG, pinned first under Patient › Standard, never searched away),
[US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) (Partial: the office sets it at setup, mandatory, "Needs an invoice destination"; the RVG code handed to the anaesthetist; a prepaid Contract starts prepayment, interim here),
[FT-03.4](../../../../requirements-board/requirements/stories/FT-03.4.md) (Contradicts: the anaesthetist changes the Contract, RVG code and, where allowed, the price until AUTHORISED; office approval at review is 21a's),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) (Contradicts: no reason, audited, a typed price cleared and RVG detail kept, never onto or off prepaid; the review flag is 21a's),
[US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) (Partial: each added Procedure picks its own Contract),
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) (Contradicts: the RVG code required on RVG kinds only, filled from the Contract's default RVG code when empty, the range shown; the type-ahead and out-of-range warning are 19's);
[DM-10](../analysis/domain-model-delta.md#dm-10) (one Contract per Procedure; the route and billing-time resolution go; its review flags are 21a's);
[RV-18](../analysis/reverse-check.md) (the route and payment-category part) and the Insurer route of RV-39.
**Left on 2026-11-10:** EP-04 and FT-04.3, now groupings (their substance is in the stories above;
the Contract master is 18, 18a and 19a). **Earlier:** DM-12 to 21; DM-37 merged into DM-10; RV-27 goes with
the route; US-03.1.2 to 20a; RV-08 to 23.
**Leans on, not covered:** 18's Parties and flat Contracts (holder Party, bills its holder or the payer,
linked practitioners, prepaid, pricing kind, Active or Disabled, `aaCode`, No contract · RVG held by AA);
18a's specialties, funding tags and open-price fallbacks; 19's RVG groups and type-ahead; 19a's price
ranges, holder reference code, invoice description, default RVG code and starting values; 19b's
pre-applied modifiers; 38a's edit window to AUTHORISED;
[US-04.3.10](../../../../requirements-board/requirements/stories/US-04.3.10.md) (the funder's "Suggested", 21),
[US-04.3.11](../../../../requirements-board/requirements/stories/US-04.3.11.md) (a moved Booking's mismatch flagged, 21a),
[US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) (review flags and approval, 21a),
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) and
[US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) (payer, insurer and approval number, 21),
[US-03.3.9](../../../../requirements-board/requirements/stories/US-03.3.9.md) and
[US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md) (the capture form by pricing kind and completion, 21a),
[US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md) (prices, 24),
[FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md) (prepayment, 27),
[US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md) (simple anaesthetist screens, 43a).
**Depends on:** 18a, 19a, 19b and 38a, and through them 19, 18 and 31. Also 15b (Copy gone, ACTIVE), 15a
(the warning routine, `prepaymentUnpaid`, `WARNING_SAMPLES`) and 14 (the trigger registry, the PWA
demo-actions sheet).
**Decided, build the answer (no provisional or "working direction" label anywhere):** D16 as decided
on 2026-11-05 (Donald's D3, D7 and D8: the step rail, the candidate rule, the one search, no "show all",
the fallbacks partly reversing [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md);
[OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md) overtaken); D64 as extended
(Payment type under Patient, no RVG kind under Prepaid; [OQ-25](../../../../requirements-board/requirements/questions/OQ-25.md));
D12 and D3 as extended (base units from the RVG group alone; the RVG code required on RVG kinds, optional
on a fixed or open price; any value accepted) and D35 (the range shown); D33 as extended (a Contract
must be set; the RVG code may be left to the anaesthetist); D63 (change until AUTHORISED, the last change
standing); D48 as extended (a surgeon's item is its own Contract linked to its surgeons, billing the payer:
under Patient); D32 and D49 moot (no lines); D28 and D2 as extended (insurance never narrows; the
Booking's insurer or funder and "Suggested" are 21's; `Procedure.insurerId` goes); D17, D23, D42.
Readings the catalogue marks as ours are built as written: the hospital offered even when the specialty
filter empties it (A6); a fallback filled in where nothing is left (A7); a range in force (A9); any
specialty overlap (A10); the RVG code filled only when empty (A15); prepaid office-only (A17); search by
default RVG code (A34); the anaesthetist types only on No contract · Fixed price (A37); hospital-held
Contracts unlinked, only AA, insurer and funder Contracts unlinked (A38, A39).
**Open, built as the default:** D81 ([OQ-135](../../../../requirements-board/requirements/questions/OQ-135.md)):
a Procedure already on a Disabled Contract keeps it and bills as normal, with no flag; disabling hides
it from the rail only. Log it on "For the owner's review".
**Pricing model in one place:** the candidates, `destinationOf`, `openPriceFallbackFor`, the rail's path,
the Contract change and the interim who-is-billed and prepayment live in `aa-prototype/src/domain/billing`
behind types the UI reads. References:
[AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md) sections 5.1 to 5.4 and 6
(candidates L415-431, the rail L433-479, fallbacks L481-502),
[AR-61#invoice-destination](../../../../requirements-board/requirements/artifacts/AR-61.md),
[AR-62](../../../../requirements-board/requirements/artifacts/AR-62.md) (Ben's decision tree) and
[AR-24#procedure-contract](../../../../requirements-board/requirements/artifacts/AR-24.md) (the window).
AR-28, AR-29 and AR-30 are Retired: cite none of them. `contract-picker-mock/`'s "A. Step rail"
(`src/billing/StepVariants.tsx`, `paths.ts`) is the interaction reference only: no code, data, store or
conventions shared, and none of its "Suggested" tag (21).
**Estimated:** 2 sessions. Session 1: items 1 to 10 (figures pinned; route, category and insurer out;
the mandatory Contract, candidates, the office's rail with auto-fill and Other price; seed), ending green.
Session 2: items 11 to 18 (the anaesthetist's mirrored rail and change, the RVG code rules, additional
Procedures, the "Needs an invoice destination" list, creation forms, shots, demo guide). If session 1
overruns, finish green on items 1 to 8 and 10 and open session 2 with item 9's sweep; never defer the
parity pin, the category removal or the seed remap.

## Goal

Pricing becomes one decision. `BillingRoute`, `PatientPaymentCategory` (everywhere, about 15 non-test
files), `Procedure.insurerId` as a route and the engine's route resolution go (DM-10, RV-18). Each
Procedure carries exactly one Contract, with no line (US-04.3.1).

**The step rail** (US-04.3.8, decided) is the one picker, for the office on Admin and, mirrored, for the
anaesthetist on mobile, web and the PWA. A compact numbered rail, every step shown from the start, an
answered step clickable to change it (clearing the later ones):

1. **"Where does the invoice go?"** Patient, the List's hospital, or Special, each with its count. The
   destination is worked out from each candidate's own settings by `destinationOf`, never stored: bills
   the payer is Patient; bills a hospital holder with a funding tag is that hospital; anything else is
   Special. The List's hospital is offered whenever it has an Active tagged Contract, even when the
   specialty filter leaves none for this surgeon (its fallback then fills in).
2. **Then narrow it down.** Under Patient, "Payment type": Standard first, then Prepaid. Under the
   hospital, its funding tags in 18a's list order. Under Special, the Contracts grouped by holder.
3. **The Contract**, typed to search (one search over name, holder reference code, invoice description,
   AA code and default RVG code). No contract · RVG is pinned first under Patient › Standard and never
   searched away (US-04.3.3); no RVG-kind Contract is ever under Prepaid. One **"Other price"** toggle
   picks the destination's open-price fallback (18a; US-04.3.9) and asks for the amount, typed on the
   Procedure: the office on any fallback, the anaesthetist only on No contract · Fixed price.

A step with one answer fills itself in; a step with no rows fills in the fallback. Until a Contract is
chosen, the answers so far are kept on the Procedure, and whoever opens it next carries on from there.

**Candidates** (US-04.3.2), the only Contracts any step shows: Active; held by the List's hospital, or
linked to its surgeon or its anaesthetist, or unlinked and held by AA, an insurer or a funder; specialties
that include the List surgeon's, or none; for a fixed price, a price range in force on the List's date.
No "show all"; insurance never narrows (the funder's "Suggested" is 21's, inside this module). Fallbacks
are never rows. A Disabled Contract stays on a Procedure already set (D81 default).

**What follows the Contract** (by its pricing kind): a fixed price fills in the agreed fee and asks no RVG
code; an RVG kind (No contract · RVG included) hands the RVG code to the anaesthetist, whose Booking
shows it to fill in, though the office may enter it; a prepaid Contract starts the prepayment (interim
here, 27); a fallback asks for the amount. A Procedure with no Contract shows **"Needs an invoice
destination"**, and its Booking sits on the Admin Day list of that name.

**The RVG code** (US-03.3.1): required on RVG kinds, optional for reference on a fixed or open price,
filled from the Contract's default RVG code when empty, the group's published range shown, any value
accepted (D3, D35).

**The anaesthetist** (FT-03.4, US-03.4.1; D63, 38a's window) sees the rail at the same point as the office
and may finish it or change the Contract until the List is AUTHORISED, with no reason, audited (21a
flags it at review), the last change standing. Never onto or off a prepaid Contract: they are not offered
Prepaid, and a Procedure on a prepaid Contract is office-only. A Contract change clears a typed price and
keeps the RVG detail. Additional Procedures pick their own Contract (US-03.2.3).

**Interims**, each labelled in code and the Decisions log: **who is billed** from the Contract's setting
(its holder Party when it bills its holder, else the Procedure's `billablePartyId` override, else the
patient) until 21; `funderOverride` until 22; **prepayment** read from the Contract's prepaid setting with
`prepaymentDetail` kept until 27; the typed amount in one `enteredPrice` field that 24 generalises.
The S3, S4 and S5 figures do not move.

> Names below are today's names at `d4db277`. Use 18's, 18a's, 19's, 19a's, 19b's and 38a's names as
> their PROGRESS entries record them.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and open questions against the plan's baseline,
   catalogue commit `efe123c` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff US-04.3.1,US-04.3.2,US-04.3.3,US-04.3.4,US-04.3.8,US-04.3.9,US-04.3.10,US-04.3.11,FT-03.4,US-03.4.1,US-03.2.3,US-03.3.1,US-03.3.9,US-03.6.1,US-04.1.4,US-04.2.17,US-04.2.18,US-07.2.2,US-11.2.2,US-11.4.3,FT-06.2,OQ-25,OQ-26,OQ-55,OQ-78,OQ-93,OQ-99,OQ-135
   ```

   The plan reflects the catalogue at `efe123c` (Donald's 5 November decisions D1 to D11: the flat model,
   the decided step rail, the fallbacks; Donald's 10 November mirrored flow); diff only for anything
   after it.
2. If an item changed since `efe123c`, re-read it and adjust the work items. If one is now Retired or
   Future, drop it and record that in the PROGRESS entry. If OQ-135 is answered, build the answer.
3. **Confirm what 15a, 15b, 18, 18a, 19, 19a, 19b and 38a delivered** (their PROGRESS entries):
   - 15a and 15b: `prepaymentUnpaid`'s input; `WARNING_SAMPLES` and its prepayment sample (staged today
     through the category this phase deletes); the completion gate and `copyBooking` gone.
   - 18: the Party master; the Contract's holder, bills-its-holder or payer, linked practitioners,
     prepaid, pricing kind and Active/Disabled; the stored No contract · RVG and how it is found by role;
     `aaCode` and the search matcher; any interim that keeps today's counterparties (item 4).
   - 18a: specialties on surgeons and Contracts; funding tags and their order; the fallbacks and how
     each is found for a destination (Patient Standard and Prepaid, hospital and tag, Special holder).
   - 19 and 19a: the RVG code on the Procedure and the type-ahead; price ranges and "in force on a date";
     the holder reference code, invoice description and default RVG code; the starting-value helper;
     the anaesthetists' prepaid price lists (Dr Souter's) and the surgeon Contracts linked to surgeons.
   - 19b: the helper that pre-applies modifiers. 38a: `editRefusal` for SUBMITTED.

   If 18 left no stored No contract · RVG, 18a no fallbacks or funding tags, or 38a no window to
   AUTHORISED, stop and record it: this phase builds none of them.
4. Record the result (including "no drift") in the PROGRESS entry.

## Reference

- **Design** (convention 17): `docs/design/Design Language.dc.html` (tokens; neutral pills; teal the only
  action colour, so every tick, "Change" and "Other price" is teal, never crimson); `Mobile App.dc.html`
  (Booking detail, bottom-sheet rows, the code picker's search field); `Admin Review.dc.html`; `Admin
  Day.dc.html` (right rail). No mockup covers the rail: take the interaction from the mock (`npm run
  dev:picker`, port 5181) and build it in the design language (bottom sheet on mobile, Dialog on web and
  Admin).
- **Catalogue:** the covered files and the "leans on" items; `requirements-board/requirements/notes/2026-11-05-*`
  at the numbers the covered items cite (`npm --prefix requirements-board run source -- --item <ID> --text`);
  the change log `changes/2026-11-05-flat-contract-model-and-ben-vanessa-meeting.md` (the FT-03.4,
  US-03.x and US-04.3.x rows); `domain-model.md` (Contract, invoice destination, payer).
- **Gap analysis:** the DM-10 and RV-18 rows; `epics/EP-04.md` and `epics/EP-03.md`;
  `analysis/domain-model-delta.md` (DM-10); `analysis/reverse-check.md` (RV-18, RV-19).
- **Code entry points** (line numbers at `d4db277`; locate by name):
  - `src/domain/types.ts`: `BillingRoute`, `PatientPaymentCategory`, `PrepaymentDetail`, `Procedure`
    (`billingRoute`, `governingContractId`, `insurerId`, `billablePartyId`, `patientPaymentCategory`,
    `prepaymentDetail`, `priceOverride`).
  - `src/domain/billing/invoiceBuild.ts` (`noBillingRoute`, `defaultContractFor`,
    `resolveContractForProcedure`, `counterpartyForProcedure`, `buildPrePaymentInvoiceForBooking`);
    `validateBookingForBilling.ts` (`billingReferenceMissing`, the direct-claims, category, RVG-code
    and prepayment checks); `fixtures.ts`.
  - `src/store/bookingActions.ts` (`createBooking`, `addPostOpAddendum`, `addProcedure`); `lifecycle.ts`
    (`editRefusal`, `editProcedure`, `reassignBooking`); `integrationActions.ts` (the S12 and PDF
    creates' `billingRoute: 'hospital'` stamp); `prepaymentActions.ts`; `selectors.ts`
    (`bookingRequiresPrepayment`, `prepaymentStatusFor`, `billingContextForBooking`); `warningSamples.ts`.
  - **`PatientPaymentCategory` readers (all go):** `domain/types.ts`, `invoiceBuild.ts`,
    `validateBookingForBilling.ts`, `seed/bookings.ts`, `draftLists.ts`, `history.ts`, `audit.ts`,
    `store/bookingActions.ts`, `selectors.ts`, `warningSamples.ts`, `OfficeBillingSetup.tsx`,
    `BtmCaptureBlock.tsx`, `shared/audit/fieldLabels.ts`, `EditBillingSetupSheet.tsx`,
    `ManualBookingForm.tsx`, `EditProcedureSheet.tsx`, `apps/admin/screens/InvoiceDocument.tsx`
    (`PaymentCategoryNote`), and their tests. Re-run the grep.
  - UI: `EditProcedureSheet`, `EditBillingSetupSheet` (the unfiltered select, "None (default pricing)"),
    `ManualBookingForm`, `OfficeBillingSetup`, `BookingDetailBody`, `BtmCaptureBlock` (`ROUTE_LABEL`,
    `CONTEXT_FIELDS`, the `procedure-contract` line), `CodePickerSheet`, `shared/format.ts`
    (`ROUTE_LABELS`, `routeLabel`), `apps/admin/screens/ReviewScreen.tsx` (the Route column),
    `flows/PhoneAdviceBooking.tsx` (S2 prefill `billingRoute: 'hospital'`, `insurerId: 'I-NIB'`), the
    Admin Day right rail, mobile `ListDetailScreen.tsx`, web `ListDetailView.tsx`.
  - Seed: `seed/bookings.ts` (`ProcedureSpec`, the BP0001 and BP0002 overrides, the AIA reimbursement,
    Riley's $800 split, Nair's full prepayment, the Prentice `funderOverride`, the filler route draw),
    `draftLists.ts`, `history.ts`, `audit.ts`, `index.ts` (marker `insuredReimbursementBooking`).
  - Tests and shots naming routes: `reviewFlags`, `invoiceBuild`, `prePaymentInvoice`,
    `validateBookingForBilling`, `seed`, `billingRun`, `captureActions`, `bookingActions`,
    `postOpAddendum`, `btmCapture`, `prepayment`, `auditNarrative`, `demoScenarios`,
    `integrationActions`, `warningSamples`; `visual/mobile-interactions.spec.ts`, `admin-phase06.spec.ts`,
    `admin-phase07.spec.ts`.

## Work items

**Session 1: model, engine, store, seed and the office's rail.**

1. **Pin the figures first.** Extend the parity harness 18, 18a, 19, 19a and 19b left (add
   `src/store/contractParity.test.ts` only for what it does not pin), literals from the current build:
   the counterparty (`kind:id`) of every seeded non-cancelled Procedure; each one's starting values and
   any fixed price; the invoice totals and counterparties for Souter Mon 20 AM and PM (S3: Holt, Prentice
   nib plus St George's), Whitaker Fri 17 (S5), Ropata Thu 16 (S4 Beat 3), and the prepayment builds
   (Riley $800 split, Nair full netting to $0) with their ledger and draft Xero pairs (US-09.1.3). Items
   that Match only because of the old model (US-05.2.6's fixed rate, FT-03.2's primary Procedure,
   FT-08.2's grouping, FT-05.5's ACC, US-09.1.3's pair) ride on these fixtures. Never update one with `-u`.
2. **Types** (`domain/types.ts`):
   - Delete `BillingRoute`, `PatientPaymentCategory`, `Procedure.billingRoute`, `Procedure.insurerId` and
     `Procedure.patientPaymentCategory`. No line reference anywhere.
   - The Procedure's Contract field (18's name), optional in the type: none is "Needs an invoice
     destination". Add `railAnswers?: { destination: 'patient' | 'hospital' | 'special'; narrow?: 'standard'
     | 'prepaid' | <funding tag id> | <holder Party id> }`, held only while no Contract is set and cleared
     when one is (US-04.3.8). Add `enteredPrice?` (cents), commented "INTERIM (Phase 20): the amount typed
     on an open-price fallback; Phase 24 generalises it". No stored destination.
   - Comment `prepaymentDetail` "INTERIM (Phase 20): read only on a prepaid Contract; Phase 27 removes it"
     and `billablePartyId` "INTERIM override until Phase 21's payer on the Booking".
3. **One pure module** (new `domain/billing/contractRail.ts`, exported from the billing index, with
   `contractRail.test.ts`; header comment citing AR-58 sections 5 and 6, AR-61#invoice-destination and
   AR-62). Nothing outside it and `ContractRail` knows the step order.
   - `contractCandidatesFor(masters, ctx, { query? })`, `ctx` = List date, hospital, surgeon (and its
     specialties), anaesthetist: the US-04.3.2 rule (Active; held by the List's hospital, or linked to
     its surgeon or anaesthetist, or unlinked and held by AA, an insurer or a funder; specialties overlap
     the surgeon's or are empty; a fixed price has 19a's range in force on the date). Fallbacks and No
     contract · RVG are not candidates here. Search wraps 18's matcher over the candidates only, adding
     holder reference code, invoice description and default RVG code; never the catalogue-wide search.
   - `destinationOf(contract, parties)`: `patient` when it bills the payer; `{ hospital, tag }` when it
     bills a hospital holder and has a funding tag; else `{ special, holderPartyId }`.
   - `openPriceFallbackFor(masters, destination)`: 18a's fallback for Patient Standard (No contract ·
     Fixed price), Patient Prepaid (Prepaid · Fixed price), a hospital and tag, or a Special holder.
   - `contractRailFor(masters, ctx, answers, { query?, actor })` returns the three steps with their
     options and counts, the answer, whether it filled itself in, the rows of step 3 (No contract · RVG
     pinned first under Patient › Standard whatever the query; no RVG kind under Prepaid), whether "Other
     price" is available and whether this actor may type its amount, and the result once a Contract is
     known. The hospital option shows whenever the List's hospital has an Active tagged Contract; a step
     with one answer fills itself in; a step with no rows fills in the fallback. For the anaesthetist
     actor, Prepaid is not offered.
   - `railAnswersFor(masters, ctx, contractId)`: the answers that lead to a stored or searched Contract,
     so "Change" and an added Procedure open with every step answered.
   - `applyContractChange(masters, procedure, next)`: the new Contract; `enteredPrice` and today's
     `priceOverride` cleared; recorded RVG code, units and modifiers kept; the RVG code filled from the
     new Contract's default only when empty, then 19a's starting-value fill for an empty base; `railAnswers`
     cleared.
   - `rvgCodeToFill(masters, procedure)`: true when the Contract is an RVG kind and the Procedure has no
     RVG code. Derived, never stored.
   - `contractChangeRefusal(actor, procedure, next)`: the anaesthetist refused onto or off a prepaid
     Contract ("Only the office changes a prepaid Contract."), and typing an amount on any fallback but
     No contract · Fixed price ("The office types this amount.").
   - Tests: each destination's derivation (US-04.3.8's CES example: a surgeon's fixed fee billing the
     payer under Patient, a CES SXAP item under the hospital › SXAP, an insurer's under Special); each
     step 2; the one-answer auto-fill (a hospital with a single tag); the empty-step fallback (a tag the
     specialty filter emptied); No contract · RVG pinned under every query; no RVG kind under Prepaid;
     Other price on each destination; a St George's Contract never on a Southern Cross List; a surgeon
     Contract linked to S and T on S's and T's Bookings whichever anaesthetist, not U's; anaesthetist A
     never offered B's price list; a specialty mismatch excluded; Disabled excluded; a fixed price with no
     range in force excluded; search by each of the five fields; `railAnswersFor` round-tripping every
     seeded Procedure's Contract; the change (price cleared, units kept, RVG default only when empty); the
     anaesthetist refusals; deterministic order.
4. **Who is billed, interim** (new `domain/billing/whoIsBilled.ts`, with a test; 21 rewrites it):
   `billedPartyFor(procedure, contract, parties, booking)`: the holder Party when the Contract bills its
   holder; else the `billablePartyId` override; else the patient. If any seeded Procedure's counterparty
   would move under this rule, keep today's through 18's interim and log it for 21. Commented "INTERIM
   until Phase 21's payer on the Booking". `counterpartyForProcedure` delegates to it; `funderOverride`
   lines behave as today (22). Tests: a hospital-billed Contract, the Aria `BP0002`, No contract · RVG with
   the BP0001 override, without one the patient.
5. **Validator** (`validateBookingForBilling.ts` and test):
   - Remove the route, insurer direct-claims and payment-category checks.
   - Add: missing Contract ("This procedure needs an invoice destination."), dangling ("The selected
     Contract no longer exists. Choose another."), and an open-price fallback with no `enteredPrice`
     ("Type the price for this procedure."; 24's "Needs a price" replaces it).
   - The RVG code is required only on an RVG kind ("Add the RVG code for this procedure."); a fixed or
     open price completes without one (US-03.3.1). 21a splits completion out.
   - The prepayment check is only the split-deposit check on a prepaid Contract.
   - Re-key `billingReferenceMissing` from the route to the Contract: one that bills a hospital or a
     surgeon holder expects a reference; an insurer's, a price list, a fallback and No contract · RVG do
     not. Interim until 21. Keep the `billablePartyId` check.
6. **Engine** (`invoiceBuild.ts` and tests): `resolveContractForProcedure` reads only the stored Contract:
   none is the run exception `noContract`; a dangling id `contractMissing`; a fixed price with no range in
   force `contractIneffective` (S4 Beat 3's COS failure and `resolveAndRetry` depend on it). An open-price
   fallback prices from `enteredPrice` (interim until 24). Delete `noBillingRoute`, the route branch and
   18's parity fallbacks once item 8 leaves no seeded Procedure on them. A Disabled Contract bills as
   normal (D81 default). `buildPrePaymentInvoiceForBooking` covers Procedures on a prepaid Contract billed
   to a person, reading `prepaymentDetail`; ledger and Xero pairs unchanged.
7. **Store actions** (new `store/contractSelectionActions.ts` with tests):
   - **`setProcedureContract(api, actor, procedureId, contractId, { enteredPrice? })`**: 38a's
     `editRefusal` (anaesthetist: own ACTIVE and SUBMITTED Lists; office the same; AUTHORISED refused);
     refuses an unknown id, a non-candidate other than the destination's fallback or No contract · RVG
     ("That Contract does not apply to this Booking."), and `contractChangeRefusal`; applies
     `applyContractChange` in the same commit; one audited `procedure.contract` entry with the Contract,
     RVG code and price before and after. A Disabled Contract already stored is kept on a save that does
     not change it.
   - **`setRailAnswers(api, actor, procedureId, answers)`**: stores answers so far on a Procedure with no
     Contract (audited as `procedure.railAnswers`), so the other side carries on from them.
   - **`setEnteredPrice`**: the amount on a fallback, gated by `contractChangeRefusal`.
   - Remove the Contract field and every deleted field from `ProcedurePatch`, so `editProcedure` cannot
     bypass the guard. 19's RVG-code action keeps its own audit and gains only 38a's window.
   - **Creation (US-04.3.4):** `createBooking` drops route, insurer and category and takes an optional
     Contract (checked as above); with none the Procedure needs an invoice destination. The S12 and PDF
     creates drop their stamp and pass none.
   - **`addProcedure`** (US-03.2.3) takes an optional Contract; with none the new Procedure has none. It
     copies the first Procedure's `billablePartyId` override (interim). `addPostOpAddendum` copies the
     original's Contract until 38b.
   - Hospital, surgeon or reassign changes re-default nothing (the mismatch at review is 21a's).
   - **Prepayment, interim:** `bookingRequiresPrepayment` is true when a non-cancelled Procedure's
     Contract is prepaid and billed to a person (D23); `prepaymentStatusFor` reads it, so 15a's rule needs
     no change. `raisePreProcedureInvoice` refuses with "This booking has no procedure on a prepaid
     Contract." No gate (D5).
   - **15a's prepayment sample:** `stage` moves the target's first Procedure onto its anaesthetist's
     prepaid price list through `setProcedureContract` as the office; `unstage` restores it from the
     pristine seed. Update its test.
   - **Selectors:** `contractRailForProcedure(state, procedureId, answers, opts)` and its new-Booking
     twin, `rvgCodeToFillFor`, `billedPartyForProcedure` and `needsInvoiceDestinationBookings(state)`
     (all dates, sorted by date: Bookings with a Procedure that has no Contract, with the answers so far).
8. **Seed** (`seed/bookings.ts`, `draftLists.ts`, `history.ts`, `audit.ts`, `index.ts`):
   - `ProcedureSpec` loses route, insurer and category. Map every seeded Procedure onto the flat
     Contract 18 and 19a left it on, or: hospital route with none stored to the hospital's Contract that
     reproduces today's fee; nib route to nib's; self-funded and AIA (Webb) to No contract · RVG (AIA
     only in the description; the override stays); Riley and Nair onto Dr Souter's prepaid price list
     with figures unchanged (resolve any double pricing in the seed, never a fixture); `history.ts` and
     `draftLists.ts` patient-route Procedures to No contract · RVG.
   - Run the candidate rule over every seeded Procedure; resolve each miss so item 1 holds (or keep a
     non-candidate stored, as a moved Booking would, and log it for 21a). Log each call.
   - Seed one future Booking with no Contract on a List no beat uses, and one with `railAnswers` Patient ›
     Standard and no Contract on an anaesthetist's ACTIVE List, so the list and the mirrored pick-up
     both show at reset.
   - Regenerate `audit.ts` histories with Contract fields, not routes or categories. Rename the marker
     `insuredReimbursementBooking` to `aiaClaimBooking`. Keep the filler's `rng()` draw order and count.
     Bump `PERSIST_VERSION` by one from its value when this phase starts, with a comment line.
9. **Remove the retired vocabulary (RV-18):** `ROUTE_LABELS`, `routeLabel`, the route and category maps
   in the UI files above, the insurer selects and " (direct claims)", the S2 prefill's route and `I-NIB`,
   the Route column in `ReviewScreen` (now "Billed to", "Mixed" when Procedures differ), any route-keyed
   review flag. Audit labels: "Contract", "Invoice destination so far", "Typed price"; action
   `procedure.contract` "Contract changed". Gate: `grep -rnE
   "billingRoute|BillingRoute|patientPaymentCategory|PatientPaymentCategory|ROUTE_LABELS?|routeLabel|noBillingRoute|insuredReimbursement|Needs a Contract|contractLine"
   aa-prototype/src` returns nothing; every `insurerId` left is a Party or `funderOverride`.
10. **The office's rail and session 1 exit.** New `src/shared/flows/ContractRail.tsx`, the one component
    over `contractRailFor`, through `useSurface().Overlay` (bottom sheet on mobile, Dialog on web and
    Admin; `data-shot="contract-picker"`, `contract-rail-step-<n>` per step):
    - The rail down the left on web and Admin, across the top on mobile; an answered step shows its
      answer and is clickable; a step that filled itself in reads "Only option".
    - Step 1 "Where does the invoice go?": Patient, the List's hospital by name, Special, each with its
      count. Step 2: "Payment type" (Standard, Prepaid) under Patient; the hospital's funding tags; Special's
      holders. Step 3: a search field ("Type a name or code"), No contract · RVG pinned first under
      Standard, each row its name, AA code and pricing kind or fixed price, at most 50 rows ("Showing 50 of
      <n>. Type to narrow."), and the teal "Other price" toggle with an amount field.
    - Picking an RVG-kind Contract shows "The anaesthetist fills in the RVG code" with an optional "Enter
      it now" (19's type-ahead); a fixed price shows its fee; a prepaid one "Starts the prepayment".
    - Done calls `setProcedureContract`; closing mid-way calls `setRailAnswers`. Refusals verbatim.
      Empty state under a search miss: "No Contract matches "<query>"." (No contract · RVG stays above
      it). No "None", no "show all", no provisional wording.
    - Wire it into `EditBillingSetupSheet` and the office Booking, replacing the route control and the
      unfiltered select. Other surfaces show the Contract read-only until session 2.
    - Fix the listed tests and `fixtures.ts`. `npm run build`, `npm run build:pwa` and `npx vitest run`
      green; item 1 passes. Write a "session 1 done" note in the PROGRESS entry.

**Session 2: the anaesthetist's rail, the RVG code, additional Procedures, the list, forms.**

11. **The Contract on the Procedure** (all three apps, `BtmCaptureBlock`, `EditProcedureSheet`): a small
    Contract row (name, AA code, teal "Change") replacing the route chip, kept as a component 20a can
    replace. No Contract: "Needs an invoice destination" with a teal "Choose" for whoever may edit,
    opening the rail at the answers so far. After a change, one line: "Any typed price was cleared for
    the new Contract." `CONTEXT_FIELDS` swaps route and insurer for the Contract.
12. **The anaesthetist's mirrored rail and change** (FT-03.4, US-03.4.1, US-04.3.8): the same component on
    mobile, web and the PWA at the same point as the office, actor anaesthetist: no Prepaid; on a
    prepaid Contract "Change" is replaced by "Set by the office"; "Other price" types an amount only on
    No contract · Fixed price, otherwise "The office types this amount." Own ACTIVE and SUBMITTED Lists,
    no reason; AUTHORISED read-only. Caption: "The office sees any change to the Contract at review."
    Never a colleague's price list.
13. **The RVG code** (US-03.3.1, US-04.3.4): where `rvgCodeToFillFor` is true, the anaesthetist's Booking
    shows "RVG code to fill in" with a teal "Add RVG code", and their List rows a small neutral cue; the
    office sees a neutral note. The RVG code row shows the group's published range beside a ranged base
    value (any value accepted). On a fixed or open price the row reads "Optional, for reference".
14. **"Needs an invoice destination"** (US-04.3.4): a card on the Admin Day right rail under 15a's To-do
    card, reading `needsInvoiceDestinationBookings`: patient, List date, session, hospital and the answers
    so far ("Patient › Standard"); a row opens the Booking drawer at that Procedure. Empty: "Every
    Booking has an invoice destination." Not a warning, no Clear.
15. **Office billing setup** (`OfficeBillingSetup`, `EditBillingSetupSheet`): rows Contract (name, AA
    code, holder), Billed to (item 4), Reference, Override, Funders, Prepayment (read-only: "Required ·
    prepaid Contract", "Not required", Riley "Required · $800 seeded"). Route, Category, Insurer and "None
    (default pricing)" go. The sheet is titled "Contract and payer"; the button keeps its name, "Edit
    billing setup". Never call a prepaid amount an estimate or a deposit.
16. **Creation forms and added Procedures** (US-04.3.4, US-03.2.3): `ManualBookingForm`, `PhoneAdviceBooking`
    (S2; prefill drops route and `I-NIB`) and the anaesthetist's add-a-booking path get the Contract row,
    never preselected; saving without one is allowed ("Saved without a Contract, this Booking waits on
    Needs an invoice destination."). "Add another procedure" (mobile, web, Admin) opens the rail on the
    first Procedure's answers (`railAnswersFor`) with its Contract pre-ticked when it is a candidate (one
    tap to confirm, never stored silently); otherwise at step 1.
17. **Invoice wording:** `PaymentCategoryNote` becomes `patientInvoiceNote(booking, invoiceKind)`: a
    Booking requiring prepayment gives today's prepayment wording; otherwise "Payment is due on receipt
    of this invoice." The insured-reimbursement wording goes (US-11.4.2 Retired).
18. **Shots, demo surfaces, PWA:** update `visual/mobile-interactions.spec.ts`, `admin-phase06.spec.ts` and
    `admin-phase07.spec.ts` (keep `data-shot="procedure-contract"`); add shots of the rail at each step,
    Other price, a search, the anaesthetist's pick-up and the list card. Add Phase 14's PWA entry (below);
    edit the Control Panel's S1 text and the re-homed "Fire hospital message" description. Check the rail
    (every step and search), the Contract row, "Change" and the RVG cue in the PWA build on an ACTIVE and
    a SUBMITTED List.

## Demo triggers

This phase adds no warning rule; 15a's prepayment sample is re-pointed at a prepaid Contract (item 7) and
must still stage and clear.

- **Admin Day: "Needs an invoice destination"** (product). Phase 14's re-homed `fire-hospital-message`:
  Sarah Mitchell's Booking on Souter Tue 28 Jul St George's AM arrives with no Contract, joins the list,
  and the office sets it. Update the entry's description only.
- **Admin Booking: the step rail** (product): Patient › Standard fills in No contract · RVG and hands the
  RVG code to the anaesthetist; a hospital with one tag fills in its step 2; "Other price" types $2,000 on
  No contract · Fixed price.
- **Mobile, web and Admin Procedure: "Change"** (product) opens the same rail with search; no Prepaid for
  the anaesthetist; the seeded Patient › Standard Procedure picked up and finished by the anaesthetist.
- **PWA demo-actions sheet, mobile Procedure: "Office sets this Booking's Contract"** (new entry, through
  Phase 14's registry): on a Procedure needing an invoice destination, sets it as the office would
  (the List's hospital's first candidate, else No contract · RVG), audited as the office, so a handset
  demo needs no Admin screen.
- **"Trigger billing failure" (S4 Beat 3)** keeps working: the COS Contract still has no range in force
  (`contractIneffective`). Check it after item 8.

## Out of scope

- The payer on the Booking, the insurer or funder and approval number, and the funder's "Suggested" path:
  21. Review flags (an anaesthetist's change, a typed price, a Contract that no longer fits after a move,
  needing a destination or a price), completion's three conditions and the capture form by pricing kind:
  21a.
- The procedure text, invoice description and the Contract stack on every screen: 20a.
- The Split button replacing `funderOverride`, layout and delivery: 22. The primary Procedure: 23.
- Pricing kinds priced by one function, "Needs a price", the RVG override and who may change a price: 24.
- The AUTHORISED snapshot: 25. The prepayment lifecycle (Prepaid · Fixed price invoiced, approval,
  re-checks, `prepaymentDetail` gone): 27.
- Parties, Contracts and No contract · RVG (18); specialties, tags and making the fallbacks (18a); RVG
  groups (19); price ranges and the Contract's own fields (19a); modifiers (19b); the edit window (38a);
  matched hospital rows (33).

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day shows "Needs an invoice destination" with both seeded Bookings (one "Patient ›
      Standard"). Fire MSG-STG-1001: Sarah Mitchell's Booking joins it; set it through the rail: it leaves.
- [ ] The rail: three numbered steps from the start; no "None", "show all" or provisional wording.
      Patient › Standard: No contract · RVG first, still first under any search; picking it shows "The
      anaesthetist fills in the RVG code". Patient › Prepaid (office, Dr Souter's Booking): her price
      list, no RVG kind. Click an answered step: the later ones clear.
- [ ] Destinations on a Christchurch Eye Surgery List: the surgeon's fixed fee under Patient, a CES SXAP
      item under Christchurch Eye Surgery › SXAP, an insurer's under Special by holder. A hospital with one
      tag fills in step 2 ("Only option"). A tag the specialty filter empties: step 3 fills in its fallback.
- [ ] Candidates: no St George's Contract on a Southern Cross List; a Contract linked to two surgeons on
      either surgeon's Booking whichever anaesthetist, not on a third's; a specialty mismatch absent; a
      Disabled Contract absent; insurance named or not, the same Contracts.
- [ ] Search by name, AA code, holder reference code, invoice description and default RVG code each finds
      the Contract; a miss reads "No Contract matches".
- [ ] Other price: as the office on Forte › SXAP, the Procedure is on Forte · SXAP · Fixed price and asks
      for the amount; type $2,000 on No contract · Fixed price: Mark complete accepts; with no amount it
      refuses "Type the price for this procedure."
- [ ] Fixed-price Contract: the fee fills in and no RVG code is asked; completion without one passes. An
      RVG-kind Contract with no code: the anaesthetist's Booking (mobile and web) shows "RVG code to fill
      in"; add one: the cue clears; completion without one refuses.
- [ ] A ranged RVG code shows its published range; an out-of-range value is accepted (19's warning).
- [ ] As Dr Souter on mobile, open the seeded Patient › Standard Procedure: the rail opens at step 3 with
      the office's answers; choose No contract · RVG: it leaves the Admin list. Prepaid is never offered.
- [ ] As Dr Souter, mobile then web, on an ACTIVE List: "Change" opens the rail answered; change with no
      reason: a typed price clears, units and RVG code stay; History shows who, when, from and to. Submit
      and change again: allowed. Authorise (Phase 14's trigger): read-only. On Riley's prepaid Procedure:
      "Set by the office". On a hospital fallback: "The office types this amount." Never a colleague's
      price list.
- [ ] Pre-approval falls through: move an insurer-Contract Procedure to No contract · RVG; Billed to
      becomes the patient (or the guardian override).
- [ ] Add another procedure to a guardian-paid Booking: the rail opens on the first Procedure's answers
      with its Contract pre-ticked; confirm; same guardian billed.
- [ ] Office: change a List's hospital from St George's to Forte: nothing re-defaults.
- [ ] Admin phone advice (S2): the Contract row; St George's › its tag › a Contract; save, audited as the
      office. Save another without one: it joins the list.
- [ ] PWA: "Office sets this Booking's Contract" on a Procedure needing a destination sets it as the office.
- [ ] Prepayment: Riley shows "Required · $800 seeded" and 15a's warning; the office moves her to Patient ›
      Standard: not required. "Raise sample warnings" and "Clear sample warnings" stage and restore.
- [ ] S3: Souter Mon 20 AM and PM match item 1's figures to the cent, Prentice still split by
      `funderOverride`. S4 Beat 1: Riley $800 + GST with its Xero pair; Nair nets to $0. S4 Beat 3: only
      COS fails, "Resolve and retry" clears it.
- [ ] Mark complete with no Contract: "This procedure needs an invoice destination."
- [ ] No "billing route", "payment category", "Needs a Contract", "None (default pricing)", "Contract
      line", "working direction" or "Reimbursement" text anywhere; no new "estimate" or "deposit" copy; no en or
      em dashes.
- [ ] Catalogue screenshots: the recipes below created or updated, broken recipes re-pointed, a full
      `npm run capture` with no failed recipe, the covered shots checked by eye.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      green.

## Demo guide updates

Patch in the same session, in `docs/demo-guide/` and the matching sections of `master-demo-guide.html`;
earlier phases edit the same files, so locate each passage by its text:

- `03-demo-script.md`:
  - **S1 Beat 1 Expected:** Sarah's Booking arrives with no Contract and shows on "Needs an invoice
    destination"; add a Click and Say for the office setting it ("The office answers what it knows first:
    where the invoice goes, then the Contract. Where the Contract prices from the RVG, the code is the
    anaesthetist's."). Remove any "default Contract" wording.
  - **S2 Beat 2:** the phone-advice form's Contract row: St George's, its tag, a Contract; point at the RVG
    code going to the anaesthetist. Remove any billing route or insurer.
  - **S3 Beat 1 Say:** replace "It resolves the explicit payer per Procedure, applies the governing
    Contract, and groups by counterparty" with "It reads the one Contract on each Procedure, bills its
    holder or the patient as the Contract says, and groups by who is billed". Figures unchanged.
  - **S4 Beat 1 Say:** "Dr Souter's own price list is a prepaid Contract, so this booking needs paying
    first"; no "estimate" or "deposit".
  - One "Worth pointing at" where the rail is shown: "Where does the invoice go, then the Contract. Each
    step only offers Contracts that fit this List, and typing finds one among hundreds. Other price covers
    anything no price list has yet. The anaesthetist sees the same steps and can finish or change it until
    the list is authorised."
- `04-presenter-cheat-sheet.md`: glossary "Procedure" ("exactly one Contract"), "Invoice destination",
  "Other price"; replace "Three billing routes" with "One Contract per Procedure, on the step rail"; fix the
  myths ("Every insured patient is billed to an insurer", "ACC has its own billing route").
- `README.md`: "Bookings using the three main billing routes" becomes Bookings on hospital, insurer and No
  contract · RVG Contracts.
- `02-workflows-and-handoffs.md` and `01-personas-and-responsibilities.md`: route wording becomes Contract
  wording; the office's setup step answers where the invoice goes.
- The Control Panel S1 text and the Phase 14 registry entry descriptions (item 18).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), after the
review pass and before the PROGRESS entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 20` first. Shots are Admin
unless an app is named.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-04.3.8](../../../../requirements-board/requirements/stories/US-04.3.8.md) | none | Create, `captured`: `admin-step-rail[destination,payment-type,hospital-tag,contract]` (step 1 counts; Patient › Standard with No contract · RVG pinned; a single-tag hospital "Only option"; a Contract chosen) and `mobile-step-rail[picked-up]`, `web-step-rail[picked-up]` (the seeded Patient › Standard at step 3). Caption "Where the invoice goes, then the Contract" |
| [US-04.3.9](../../../../requirements-board/requirements/stories/US-04.3.9.md) | none | Create, `captured`: `admin-other-price[off,on]` (Forte › SXAP, toggle flipped, the amount asked) and `mobile-other-price` (No contract · Fixed price, amount typed). Caption "Every destination has an Other price" |
| [US-04.3.1](../../../../requirements-board/requirements/stories/US-04.3.1.md) | partial · admin-procedure-contract | `captured`: the Contract row (name, AA code), "Billed to", no Route, Category or Insurer; add `refused` ("This procedure needs an invoice destination."). Caption "Every Procedure carries exactly one Contract". Drop the reason |
| [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) | partial · admin-contract-picker | `captured`: `contract-picker[hospital,surgeon,search]` inside the rail (only the List's hospital's; a two-surgeon Contract highlighted; a holder-code search) plus `web-contract-picker` and `mobile-contract-picker`. Caption "Only the Contracts that fit this List". Drop the reason |
| [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) | partial · admin-, web-, mobile-default-contract | Stays `partial` (the payer on the Booking, 21). Rename the three to `no-contract-rvg`, re-pointed at Patient › Standard with No contract · RVG pinned and highlighted; add Admin `search-pinned`. Caption "No contract · RVG, first under Patient › Standard"; reason names 21 |
| [US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) | captured · admin-billing-setup[summary,edit] | Stays `captured`. Re-caption `edit` ("Contract and payer"); add `rvg-handoff`, `setup` (phone-advice Contract row), `needs-destination` (the Admin Day card), `web-rvg-to-fill` and `mobile-rvg-to-fill`. Captions "The office sets the Contract at setup" and "Bookings without one wait on Needs an invoice destination" |
| [FT-03.4](../../../../requirements-board/requirements/stories/FT-03.4.md) | none | No recipe of its own: US-03.4.1 and US-04.3.8 carry the shots; `--dry` only |
| [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) | partial · web-edit-operation, mobile-edit-operation | `captured`. Replace "billing route, insurer and reference": re-shoot `edit-operation` on a SUBMITTED List (Contract row, teal "Change"); add `changed` (the cleared-price notice) and `prepaid` ("Set by the office"). Captions "Change the Contract until the office authorises the list" and "Only the office moves a Procedure onto or off prepaid". Drop the reason |
| [US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) | partial · web-, mobile-add-procedure[before,added] | `captured`: `added` shows procedure 2 with its own Contract row after its own pick. Drop the reason |
| [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) | captured · web-, mobile-rvg-picker[closed,open,search] | Stays `captured` (19's shots). Add `default-filled` (the Contract's default RVG code filled), `optional` (a fixed price, "Optional, for reference") and `range` on web and mobile. Caption "Required on RVG Contracts, filled from the Contract's default" |

**Recipes this phase breaks.** `US-06.3.5` (`after` clicks "Self-funded": re-point at the office moving
Riley to Patient › Standard, keeping its shot name and hook); `US-07.2.2` (the "route and Contract" caption
and Route column); `US-02.5.5` ("billing route and contract"); the recipes using
`[data-shot=office-billing-setup-1]`, `label:has-text("Governing contract")` or the procedure header "Edit"
(US-04.3.x, US-03.4.1, `US-05.4.2`, `US-05.5.1`, `US-07.2.3`, `US-11.2.1`, `US-11.2.2`): reconcile and
`--dry`; reasons naming the billing route (`US-04.2.8`, `US-04.3.6`, `US-15.0.5`): "follows the Contract";
prepayment recipes (`US-06.2.x`, `US-06.3.1` to `US-06.3.4`, `US-06.4.1`): `--dry`; 18's, 18a's and 19a's
recipes that click Contracts by name: check after the seed remap. `US-11.4.2` stays absent.

**ATLAS.md.** Seed data (each seeded Procedure's Contract, who is billed, the prepaid Contracts, the two
"Needs an invoice destination" Bookings), Overlays (the rail's steps, Other price, "Contract and payer",
the phone-advice row), hooks (`contract-picker`, `contract-rail-step-<n>`, the RVG cue, the card), the new
PWA demo action, the billing-setup button text. Routes unchanged.

## Adversarial review (after build)

After the manual test checklist and the commands are green, and before the PROGRESS entry, run the
standard adversarial review-and-fix pass (PROGRESS convention 18): independent Opus review subagents for
quality, bugs/correctness and plan adherence, plus a money-parity lens. Verify every finding against the
catalogue, this plan and the code, fix the confirmed ones, re-green and record the pass. Do not re-raise
anything settled in the Decisions log except the rulings this phase supersedes.

**Steer this phase's reviewers at:**

- **The rail matches US-04.3.8 and AR-58:** the destination derived by `destinationOf`, never stored;
  Payment type Standard then Prepaid; the hospital's tags; Special by holder; the hospital offered when
  the specialty filter empties it; one-answer and empty-step auto-fills; No contract · RVG pinned under
  every query; no RVG kind under Prepaid; Other price onto the right fallback; answers so far kept until a
  Contract is set; one module, one component, no code from the mock, no working-direction label.
- **Candidates match US-04.3.2** everywhere (office, anaesthetist, added Procedure, search, store guard):
  Active, hospital, links, unlinked AA/insurer/funder, specialties, range in force; no "show all"; no
  line, version or reverse lookup leftovers; insurance narrows nothing.
- **The anaesthetist's limits:** never onto or off prepaid (store and UI), amount only on No contract ·
  Fixed price, own ACTIVE and SUBMITTED Lists through 38a's `editRefusal`, never a colleague's price list.
- **The change:** a typed price cleared, RVG detail kept, the default RVG code only when empty, audited
  before and after in the same commit.
- **Nothing derived from the location:** no creation path, hospital change or reassign stores a Contract
  nobody picked; the only "no Contract" outcomes are the list, the completion refusal and `noContract`.
- **The RVG code rule:** required on RVG kinds only; the hand-off derived, never stored.
- **The payment category is gone everywhere**; prepayment from the prepaid Contract only; no Phase 27 work
  early; no gate returns.
- **Parity:** item 1's fixtures unchanged; every seeded payer reproduced (BP0001, BP0002); `funderOverride`
  still splits Prentice; prepayment amounts and pairs unchanged; `rng()` draw order unchanged.
- **Leftovers:** the item 9 grep; `contractIneffective` kept for S4 Beat 3 and Phase 25.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry): D81's default (a Disabled Contract stays and bills,
  no flag; OQ-135 open); the PWA "Office sets this Booking's Contract" rule; the anaesthetist on a hospital
  fallback (may pick it, cannot type the amount); anything logged rather than fixed; the screens worth a
  look with route and persona (the rail on Admin, web and mobile; Other price; the pick-up; the list card;
  the phone-advice row; a change after submit).
- **Catalogue screenshots result:** the recipes changed and the `REPORT.md` counts before and after; the
  US-04.3.3 reason handed to 21.
- Status row and a phase entry: the drift-check result against `efe123c`; D16, D64, D12, D3, D35, D33,
  D63, D48, D28, D2, D17, D23 and D42 built as decided, D32 and D49 moot, D81 as the default; what 15a,
  15b, 18, 18a, 19, 19a, 19b and 38a provided; the session split; the adversarial pass; the tests added;
  `PERSIST_VERSION` old to new; the broken recipes; the handoffs: 20a (the Contract row and
  `billedPartyFor`), 21 (the payer replaces the override; "Suggested" goes in `contractRailFor`), 21a (the
  `procedure.contract` audit for the change flag; non-candidates kept on moved Bookings; completion), 22
  (`funderOverride`), 23 (an added Procedure's Contract through the rail on the first's answers), 24
  (`enteredPrice` and `priceOverride`), 27 (prepaid from the Contract, `prepaymentDetail`), 33 (created
  Bookings join the list).
- Decisions log:
  - **Superseded:** the route model (3rd review #1; Phase 08 decisions (1) and (2); 6th review #2);
    payment categories (2nd review #5, 7th review A2); the derived Card-level pre-payment flag (7th review
    B6), now from the prepaid Contract; the protected default Type 1s (with 18); this plan's earlier
    one-list picker, its 4 November working-direction rail, Contract lines and the RVG reverse lookup.
  - **Readings this phase picks:** answers so far stored as `railAnswers`; the PWA trigger's pick; a
    creation form never preselects and may save without a Contract; an added Procedure pre-ticks the
    first's Contract and copies its payer override; a hospital or surgeon change re-defaults nothing.
  - **Interims, with the phases that replace them:** who is billed with the `billablePartyId` override
    (21), `funderOverride` (22), `enteredPrice` (24), prepayment from the prepaid Contract with
    `prepaymentDetail` (27).
