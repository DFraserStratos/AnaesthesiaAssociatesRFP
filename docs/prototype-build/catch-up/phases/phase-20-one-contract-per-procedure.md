# Phase 20 · One Contract per Procedure

**Requirements covered:**
[EP-04](../../../../requirements-board/requirements/stories/EP-04.md) (Contradicts: the route half and "the Contract decides who is billed"; the payer on the Booking lands in 21, the lock in 25),
[FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md) (Contradicts: holder, then Contract, then line; No contract (RVG) first; the RVG-code reverse lookup),
[US-04.3.1](../../../../requirements-board/requirements/stories/US-04.3.1.md) (Contradicts: exactly one Contract and, where it has lines, one line),
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (Contradicts: Contracts not lines, No contract (RVG) first, then the hospital's, then surgeons' or rooms' and the anaesthetist's own; valid on the date, holder fit, no line test; start from the holder; composite search; the reverse lookup),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (Contradicts: one No contract (RVG), held by AA, always first; nothing derived from the List's hospital),
[US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) (Contradicts: the office identifies who pays at setup, mandatory, with a "Needs a Contract" list; the line and RVG code may be left; a prepaid Contract starts prepayment, interim here; matching a hospital row is 33's),
[FT-03.4](../../../../requirements-board/requirements/stories/FT-03.4.md) (Contradicts: the anaesthetist changes the Contract and RVG code until AUTHORISED, the last change standing; office approval lands in 21),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) (Contradicts: no reason, price, rate and discount reset, audited and flagged, the pre-approval falls-through case),
[US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) (Partial: each added Procedure picks its own Contract),
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) (Contradicts: the RVG code optional, filled from the line's default code, starting values reset on a Contract change; the type-ahead and out-of-range warning are 19's, the fill 19a's);
[DM-10](../analysis/domain-model-delta.md#dm-10) (each Procedure selects one Contract and, where it has lines, one line at booking setup; the route and billing-time resolution go; DM-37's audit-derived change flag is merged into it);
[RV-18](../analysis/reverse-check.md) (the route and payment-category part; Type 1/2/3 went in 18).
**Left this phase on 2026-10-08:** DM-12 (the insurance indication on the Booking, now 21's); DM-37
(merged into DM-10, still built here); RV-27 (the feed and PDF route stamp simply goes with the route);
US-03.1.2 (seeing the Contract on each Procedure, now 20a's). **Left on 2026-10-20:** RV-08 (renumbered:
it now names the multi-procedure modifier split, Phase 23's; this phase's route finding is RV-18).
**Leans on, not covered:** [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md)
(18's holder master: kinds, "is billed" with its billable party, the practitioner link),
[US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) (18's AA code),
[US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) (18's dated versions:
valid on the procedure date, D45), [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md)
and [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (19a's lines with their
default RVG code, and the anaesthetists' price-list Contracts), [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md)
(combinations are lines of their own, 19a: just lines here), [US-05.1.1](../../../../requirements-board/requirements/stories/US-05.1.1.md)
(19's RVG type-ahead), [US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) (38a's
edit window to AUTHORISED), [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md)
and [US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) (the payer, insurer and
approval number on the Booking, 21's), [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md)
(office approval at review, 21's), [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md)
(the editable price, 24's), [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md)
(completion, 21's full list), [FT-06.2](../../../../requirements-board/requirements/stories/FT-06.2.md)
(the prepayment lifecycle, 27's), [US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md)
(keep office-only Contract complexity off anaesthetist screens; the sweep is 43a).
**Depends on:** Phases 19a, 19b and 38a, and through them 19, 18 and 31: 18's holder master (kind,
"is billed" with its billable party, an optional practitioner link), Contract settings (editable,
prepaid, default), dated versions, `aaCode`, the composite search, the single stored No contract (RVG)
held by AA, and the no-line Contracts that replaced the default Type 1s (with the route and today's
resolver still in place); 19's RVG groups and the optional RVG code picked by type-ahead; 19a's
standalone lines (line key, holder code, description, default RVG code, price, rate, discount,
units), its fill and reset of the Procedure's starting values, the anaesthetists' price-list Contracts
(Dr Souter's flagged prepaid) and the rooms-held surgeon Contracts (D48); 19b's pre-applied modifiers;
38a's edit window (the anaesthetist edits ACTIVE and SUBMITTED Lists, AUTHORISED immutable) and its
"changed since submitted" cue. Also 15b (Copy gone, ACTIVE), 15a (the warning routine, the
`prepaymentUnpaid` rule, `WARNING_SAMPLES`), 15 (Booking vocabulary) and 14 (the trigger registry).
**Answered, build the answer (no provisional label):** [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md)
(one No contract (RVG), offered first; nothing derived from the List's location); D16 as superseded on
2026-10-16 ([OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md): Contracts not lines,
in the order above, then the Contract's lines; one composite search; an RVG code finds lines by their
default code; anaesthetists see only their own price lists); D32 ([OQ-98](../../../../requirements-board/requirements/questions/OQ-98.md):
a Contract may hold no lines and is offered by context, with no test for a line); D33
([OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md): the office sets holder, Contract
and line; the line and RVG code may be left for the anaesthetist; completion needs a Contract, 21);
D63 ([OQ-26](../../../../requirements-board/requirements/questions/OQ-26.md), OQ-17: the anaesthetist may
change until AUTHORISED, the last change stands, 38a builds the window); D12 as superseded on 2026-10-16
(OQ-88, OQ-62: no procedure list, general procedure or picker tabs; the procedure is the text received);
D3 (any base units; the line's units else the RVG row's, then the Procedure's own); D17
([OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md): the Contract bills its holder when
the holder is billed, else the payer on the Booking, 21); D2 as extended on 2026-10-16
([OQ-55](../../../../requirements-board/requirements/questions/OQ-55.md): `Procedure.insurerId` goes as a
route; the Booking's insurer and approval number are 21's); D45
([OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md)); D42
([OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md): the office keeps price-list
Contracts; an anaesthetist sees only their own); D23 ([OQ-73](../../../../requirements-board/requirements/questions/OQ-73.md):
prepayment only where a person pays).
**Open, build the default (logged on the "For the owner's review" list, one provisional caption):**
D48 [OQ-105](../../../../requirements-board/requirements/questions/OQ-105.md) (a surgeon's fixed-price
arrangement is a rooms-held Contract linked to the surgeons it covers, offered on their Bookings after
the hospital's, picked by the office); D49 [OQ-106](../../../../requirements-board/requirements/questions/OQ-106.md)
(No contract (RVG) has no lines: picking it ends the pick). D28's open part (OQ-93: the Booking's insurer
does not narrow the list) is 21's default; here insurer holders simply fit every Booking.
**Pricing model in one place:** the candidate rules, the line step, the reverse lookup, the reset on a
change and the interim who-is-billed and prepayment live in `aa-prototype/src/domain/billing` (plus the
seed), behind types the UI reads. Reference shape (technical design v6):
[AR-28#booking-to-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md),
[AR-28#booking-updates](../../../../requirements-board/requirements/artifacts/AR-28.md) and
[AR-28#no-contract-rvg](../../../../requirements-board/requirements/artifacts/AR-28.md);
[AR-29#contract-selection](../../../../requirements-board/requirements/artifacts/AR-29.md),
[#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md),
[#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md) and
[#routine-procedures](../../../../requirements-board/requirements/artifacts/AR-29.md);
[AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md);
[AR-24#procedure-contract](../../../../requirements-board/requirements/artifacts/AR-24.md) (the window to
AUTHORISED).
**Estimated:** 2 sessions. Session 1: work items 1 to 10 (figures pinned; route, payment category and
insurer out; the interim prepayment; the selection rules, the store guard, the reset and the seed),
ending green with the UI edited only as far as it must compile. Session 2: items 11 to 19 (the picker,
the anaesthetist's change, the reverse lookup, the "Needs a Contract" list, creation forms, review,
invoice wording, shots, demo guide). If session 1 overruns, finish green on items 1 to 8 and 10 and
open session 2 with item 9's sweep; never defer the parity pin, the category removal or the seed remap.

## Goal

Pricing becomes one decision. `BillingRoute`, `Procedure.insurerId` as a pricing input, the engine's
route resolution and its route-based payer derivation go (DM-10, RV-18, EP-04), and so does
`PatientPaymentCategory`, everywhere (about 15 non-test files). Each Procedure carries exactly one
Contract and, where the Contract has lines, one line (US-04.3.1).

The office sets it at booking setup by identifying who pays: holder, then Contract, then line
(US-04.3.4; D33). Setting the Contract is mandatory: a Booking with a Procedure without one stays on an
Admin **"Needs a Contract"** list. The line and the RVG code may be left for the anaesthetist. Nothing is
derived from the List's hospital (US-04.3.3): feed and PDF creates arrive with no Contract.

One picker on mobile, web and Admin (FT-04.3, US-04.3.2; D16, D32):

- **No contract (RVG) first, always**, under any search, holder filter or miss; found by its default
  setting, never by name; no line step (D49).
- Then **Contracts, not lines**: the hospital's, then surgeons' or rooms' (D48), then the Booking's own
  anaesthetist's, then insurers', each valid on the procedure date and whose holder fits the Booking,
  with no test for a line, under holder headings.
- One composite search (AA code, holder codes, Contract and holder names) and "Start from a holder".
- **Picking a Contract leads to its lines.** An RVG code (on the Procedure, or typed into the picker
  through 19's type-ahead) finds the lines whose default RVG code matches, under their Contracts: the
  reverse lookup.

The RVG code (US-03.3.1) is optional and only meaningful where the Contract prices from RVG; picking a
line fills it from the line's default code. Starting values fill through 19a and reset on any Contract or
line change: price, rate, discount and starting units become the new Contract's, anything entered
before is cleared (US-03.4.1), and any base value is accepted (D3).

Per D63 the anaesthetist may change the Contract, line and RVG code until the List is AUTHORISED (FT-03.4,
US-03.4.1; 38a's window), with no reason, audited and flagged at office review, the last change
standing. The insurance-falls-through case is a switch to No contract (RVG). Additional Procedures pick
their own Contract (US-03.2.3); the primary stays first (FT-03.2 Matches today: carry it across).

Three interims keep the demo whole, each labelled in code and the Decisions log:

- **Who is billed**: the holder's billable party when the holder is billed; else the Procedure's
  existing `billablePartyId` override (BP0001 Hana Park, a guardian; BP0002, the Aria clinic); else the
  patient, until Phase 21's payer on the Booking. One selector (20a shows it, 21 re-points it). **One
  parity exception:** wherever 18 left a surgeon's arrangement whose holder is *not* billed but whom
  today's route still invoices (the seeded Doyle bariatric case, through 18's
  `routeCounterpartyForHolder`), the interim keeps today's counterparty; moving it to the payer is 21's
  recorded change.
- **`funderOverride`** stays the seeded two-funder split (Prentice, S3) until Phase 22's Split button.
- **Prepayment** reads the Contract's prepaid setting (18): a Booking requires prepayment when a
  Procedure is on a Contract whose version in force is flagged prepaid and a person is billed for it
  (D23). `prepaymentDetail` stays on the Procedure as it is (Riley's split $800, Nair's full) until
  Phase 27 replaces the deposit and split paths. It feeds 15a's unpaid-prepayment warning, never a
  completion gate (D5).

The S3, S4 and S5 figures do not move, and the interim who-is-billed reproduces every seeded payer.

> Names below are today's names at `d4db277`. Use Phase 18's names for the holder master, settings,
> versions, No contract (RVG) and the search; 19's for RVG groups, the Procedure's RVG code and the
> type-ahead; 19a's for lines, the line reference on the Procedure and the starting-value fill and
> reset; 19b's for modifier records; 38a's for the edit window, as their PROGRESS entries record them.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and open questions against the plan's baseline,
   catalogue commit `d4db277` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-04,FT-04.3,US-04.3.1,US-04.3.2,US-04.3.3,US-04.3.4,FT-03.4,US-03.4.1,US-03.2.3,US-03.3.1,US-04.1.4,US-04.1.5,US-04.2.1,US-04.2.4,US-04.2.10,US-04.2.11,US-04.2.14,US-05.1.1,US-07.2.1,US-07.2.2,US-11.2.2,US-11.4.3,US-03.5.1,US-03.6.1,US-15.0.1,FT-06.2,OQ-26,OQ-48,OQ-55,OQ-66,OQ-67,OQ-73,OQ-78,OQ-91,OQ-93,OQ-98,OQ-99,OQ-105,OQ-106
   ```

   At the plan update (2026-10-20, `60e2d1e..d4db277`) the changes that touch this phase were: the
   procedure master, two tabs and general procedure went (OQ-88); FT-04.3, US-04.3.2 and US-04.3.4
   were rewritten around holder, then Contract, then line, Contracts not lines, and the reverse lookup;
   US-04.3.3 is held by AA; US-04.3.1 gained the line; FT-03.4 and US-03.4.1 moved the window to
   AUTHORISED and the reset to price, rate and discount; US-03.3.1 became "Choose the RVG code, with
   starting units"; OQ-98 and OQ-99 were answered; OQ-105 and OQ-106 are new and open; OQ-103 no longer
   gates this phase. The plan reflects all of this; diff only for anything after `d4db277`.
2. If an item changed since `d4db277`, re-read it and adjust the work items. If one is now Retired or
   Future, drop it and record that in the PROGRESS entry. **If OQ-105 or OQ-106 has been answered**,
   build the answer and drop its part of the provisional caption (item 11). **If OQ-93's open part is
   answered** (the insurer narrows the list), apply it in item 3's fit and log it.
3. **Confirm what 15a, 15b, 18, 19, 19a, 19b and 38a delivered** (their PROGRESS entries):
   - 15a and 15b: the `prepaymentUnpaid` rule's input (`facts.prepaymentStatus`); `WARNING_SAMPLES` and
     its prepayment sample (`store/warningSamples.ts` stages it through the category this phase
     deletes); that the completion gate, `PrepaymentOverrideSheet` and `copyBooking` are gone.
   - 18: the holder master (kind, "is billed" and its billable party, the practitioner link); the
     editable, prepaid and default settings; how "in force on a date" is asked; the stored No contract
     (RVG) and how it is found; which holders got a no-line Contract; the no-version fallback with
     `billedAs` (item 6); `routeCounterpartyForHolder` and which holders are not billed but still
     invoiced (item 4); `aaCode`, `contractMatchesQuery` and `contractSearch`.
   - 19: RVG groups (the same code on several rows), the Procedure's optional RVG code reference, the
     type-ahead component and the out-of-range warning rule.
   - 19a: lines (holder code, description, default RVG code and how it is keyed, price, rate, discount,
     units), the line reference on the Procedure (if it added one), the fill and reset helper, the
     price-list Contracts (Souter's prepaid, its Rhinoplasty $1,200 line), the rooms-held surgeon
     Contracts, how the S3 fixed-rate and fixed-price Contracts were carried across (US-05.2.6), and
     whether any Christchurch Eye Surgery-held line carries `HNZCATall` (item 8 seeds one if not).
   - 19b: the helper that pre-applies age and included modifiers.
   - 38a: `editRefusal` for SUBMITTED, the "changed since submitted" cue, and whether a late edit
     reopens a Booking.

   If 18 left no stored No contract (RVG), 19a no lines with a default RVG code, or 38a no window to
   AUTHORISED, stop and record it: this phase builds none of them.
4. Record the result (including "no drift") in the PROGRESS entry.

## Reference

- **Design** (convention 17): `docs/design/Design Language.dc.html` (tokens; neutral pills; teal is the
  only action colour, so the tick and every "Change" are teal, never crimson); `Mobile App.dc.html`
  (Booking detail anatomy, bottom-sheet rows, the code picker's search field); `Admin Review.dc.html`
  (its CONTRACT column shows who pays); `Admin Day.dc.html` (right rail and drawer). No mockup covers
  the picker: extend 19's type-ahead sheet (a bottom sheet on mobile, a Dialog on web and Admin) with a
  Contract step and a line step in the same sheet.
- **Pricing model (v6):** [AR-29#contract-selection](../../../../requirements-board/requirements/artifacts/AR-29.md)
  (the default first, then every Contract valid on the date that fits the context, no line test; the
  anaesthetist may change the Contract and RVG code; values refresh),
  [#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md) (one
  Contract, at most one line, "must be not null for billing" where it has lines),
  [#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md),
  [#routine-procedures](../../../../requirements-board/requirements/artifacts/AR-29.md) (OQ-106),
  [AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md), and AR-28's
  regions above.
- **Catalogue:** the covered files, the "leans on" items and the questions in the drift check; the notes
  `requirements-board/requirements/notes/2026-10-14-aa-meeting-with-greg.md`,
  `2026-10-16-aa-meeting-with-greg.md` and `2026-10-16-pricing-model-documents-v6.md` at the numbers the
  covered items cite (`npm --prefix requirements-board run source -- --item <ID> --text`); the change log
  `changes/2026-10-16-requirements-update.md` (the EP-04, FT-04.3, US-04.3.x, FT-03.4, US-03.4.1 and
  US-03.3.1 rows); `domain-model.md` (Contract, and "Patient, payer and billable party").
- **Gap analysis:** `GAP-ANALYSIS.md` (Summary, the pricing themes, the DM-10 and RV-18 rows);
  `epics/EP-04.md` and `epics/EP-03.md`; `analysis/domain-model-delta.md` (DM-07, DM-09, DM-10, DM-11,
  DM-13, DM-43, DM-48, DM-49, DM-50); `analysis/reverse-check.md` (RV-09, RV-18, RV-19).
- **Code entry points** (line numbers at `d4db277`; later phases edit these files, so locate by name):
  - `src/domain/types.ts`: `BillingRoute` 787, `PatientPaymentCategory` 794, `PrepaymentDetail` 804,
    `Procedure` 822 (`billingRoute` 831, `governingContractId` 832, `insurerId` 838, `billablePartyId`
    844, `patientPaymentCategory` 846, `prepaymentDetail` 848, `accRelated` 855).
  - `src/domain/billing/invoiceBuild.ts`: `noBillingRoute` 66 and 180, `defaultContractFor` 86,
    `resolveContractForProcedure` 114, `counterpartyForProcedure` 192,
    `buildPrePaymentInvoiceForBooking` 456. `validateBookingForBilling.ts`: `billingReferenceMissing`
    49, the insurer direct-claims check 166 to 181, the category check 188, the prepayment checks 204
    to 215. `contracts.ts` (`selectContract`), `fixtures.ts`.
  - `src/store/bookingActions.ts` (`createBooking` 79, `addPostOpAddendum` 199, `addProcedure` 332);
    `lifecycle.ts` (`editRefusal` 50, `editProcedure` 452, `editList` 507, `reassignBooking` 574);
    `integrationActions.ts` (the S12 create's `billingRoute: 'hospital'` 166; `ingestPdfRow` 453 and its
    stamp 494); `prepaymentActions.ts`; `selectors.ts` (`bookingRequiresPrepayment` 574,
    `prepaymentStatusFor` 639, `billingContextForBooking` 1102); `warningSamples.ts`.
  - **`PatientPaymentCategory` readers (all go here):** `domain/types.ts`, `domain/billing/invoiceBuild.ts`,
    `validateBookingForBilling.ts`, `domain/seed/bookings.ts`, `draftLists.ts`, `history.ts`, `audit.ts`,
    `store/bookingActions.ts`, `selectors.ts`, `warningSamples.ts`, `shared/booking/OfficeBillingSetup.tsx`,
    `shared/capture/BtmCaptureBlock.tsx`, `shared/audit/fieldLabels.ts`,
    `shared/flows/EditBillingSetupSheet.tsx`, `ManualBookingForm.tsx`, `EditProcedureSheet.tsx`,
    `apps/admin/screens/InvoiceDocument.tsx` (`PaymentCategoryNote` 149 and 505), and their tests.
    Earlier phases may add readers: re-run the grep.
  - `src/shared/flows/EditProcedureSheet.tsx`, `EditBillingSetupSheet.tsx` (the unfiltered select with
    "None (default pricing)"), `ManualBookingForm.tsx` (route state 67, the prefill 92);
    `src/shared/booking/OfficeBillingSetup.tsx`, `BookingDetailBody.tsx`;
    `src/shared/capture/BtmCaptureBlock.tsx` (`ROUTE_LABEL` 17, `CONTEXT_FIELDS` 24, the
    `procedure-contract` line), 19's type-ahead; `src/shared/format.ts` (`ROUTE_LABELS` 42,
    `routeLabel` 48); `src/shared/audit/`.
  - `src/apps/admin/reviewFlags.ts`, `screens/ReviewScreen.tsx` (route set 76, the "Route" header
    244), `screens/BillingMonitorScreen.tsx` (`resolveAndRetry`, unchanged),
    `flows/PhoneAdviceBooking.tsx` (S2 prefill 27 and 28: `billingRoute: 'hospital'`, `insurerId:
    'I-NIB'`), the Admin Day right rail; `src/apps/mobile/screens/ListDetailScreen.tsx`;
    `src/apps/web/screens/ListDetailView.tsx`.
  - Seed: `src/domain/seed/bookings.ts` (`ProcedureSpec` 249, `billablePartyId` overrides 731 and 884
    (BP0002) and 819 (BP0001), the AIA reimbursement 760, Riley's split $800 about 835, Nair's full
    about 913, the Prentice `funderOverride` 635, the Doyle bariatric case, the filler route draw),
    `patients.ts`, `contracts.ts`, `cast.ts`, `history.ts`, `audit.ts`, `index.ts` (scenario marker
    `insuredReimbursementBooking` 823).
  - Tests that name routes today: `reviewFlags`, `invoiceBuild`, `prePaymentInvoice`,
    `validateBookingForBilling`, `seed`, `billingRun`, `captureActions`, `bookingActions`,
    `postOpAddendum`, `btmCapture`, `prepayment`, `mastersActions`, `auditNarrative`, `demoScenarios`,
    `integrationActions`, `warningSamples`.
  - Shots: `visual/mobile-interactions.spec.ts` (clicks "Billing route"), `admin-phase06.spec.ts`,
    `admin-phase07.spec.ts`.

## Work items

**Session 1: model, engine, store, seed.**

1. **Pin the figures first.** Before changing any code, extend the parity harness 18, 19, 19a and 19b
   left. Add `src/store/contractParity.test.ts` only for what it does not already pin, with literals
   generated from the current build:
   - the counterparty (`kind:id`) of every seeded non-cancelled Procedure;
   - each seeded Procedure's starting values (19a) and any fixed price;
   - the invoice totals and counterparties for Souter Mon 20 AM and PM (S3: Holt, Prentice nib plus St
     George's), Whitaker Fri 17 (S5), Ropata Thu 16 (S4 Beat 3: COS fails, its sibling bills),
     Fitzgerald's rate x time, the Doyle bariatric case, and the prepayment builds (Riley $800 split,
     Nair full netting to $0) with their ledger and draft Xero pairs (US-09.1.3).

   Items that Match only because of the old model are carried across with these fixtures as their
   parity tests: US-05.2.6's fixed rate, FT-03.2's primary Procedure, FT-08.2's grouping by
   counterparty, FT-05.5's ACC as an ordinary holder and US-09.1.3's prepayment Xero pair. Only the
   harness's context-building code may change; never update a fixture with `-u`.
2. **Types** (`domain/types.ts`):
   - Delete `BillingRoute`, `PatientPaymentCategory`, `Procedure.billingRoute`, `Procedure.insurerId`
     (D2: the Booking's insurer is 21's; put nothing on the Booking here) and
     `Procedure.patientPaymentCategory`.
   - The Procedure keeps its Contract field (`governingContractId`, or 18's name), optional in the type:
     none is the legitimate "Needs a Contract" state. It carries the line reference 19a added, or add
     `contractLineId?` here (DM-10). Add no `contractSetBy`: who changed it comes from the audit trail.
   - `prepaymentDetail` stays on the Procedure, commented "INTERIM (Phase 20): read only when the
     Procedure's Contract is prepaid; Phase 27 removes the split and deposit paths and
     prepaymentDetail". `billablePartyId` stays, commented "INTERIM override until Phase 21's payer on
     the Booking". `accRelated` and the optional RVG code stay as 18 and 19 left them.
3. **Pure Contract selection** (new `domain/billing/contractSelection.ts`, exported from the billing
   index, with `contractSelection.test.ts`; AR-29#contract-selection). The one place for the candidate
   rules; the store and every surface read it.
   - Types the UI reads: `ContractSelectionContext` (`procedureDateISO`, `hospitalId`, `surgeonId`,
     `anaesthetistId`, and the Procedure's RVG code if set); `ContractCandidate` (`contractId`, the
     version in force, holder, section `'hospital' | 'surgeon' | 'anaesthetist' | 'insurer'`, line
     count, `matched` when a search hit a code); `ContractCandidates` (`noContract`, `sections: {
     holder, candidates }[]`, `total`); `LineCandidate` (`lineId`, holder code, description, default
     RVG code, the price it sets, `matched`).
   - `contractCandidatesFor(masters, ctx, { query?, holderId? })`:
     - **No contract (RVG)** first, found by 18's default setting (never by name), under any query,
       holder filter or miss (US-04.3.3).
     - **A Contract is a candidate** when it has a version in force on the procedure date and is not
       retired (D45), and **its holder fits**: a hospital holder is the List's hospital; a surgeon or
       rooms holder is the Booking's surgeon or rooms linked to that surgeon (D48's default); a holder
       with a practitioner link fits only that anaesthetist's or surgeon's Bookings (D42: never a
       colleague's price list); an insurer (or ACC) fits every Booking (D28's default). **No test for
       a line** (D32).
     - **Order:** hospital's, then surgeons' or rooms', then the anaesthetist's own (heading reads
       their name), then insurers'; Contracts by name within each holder. Insurers last is a reading
       (the catalogue names only the first three): log it.
     - **Search** wraps 18's `contractMatchesQuery` (with 19a's line holder codes added) over the
       candidates only, never the catalogue-wide `contractSearch` and never a second matcher. An exact
       AA-code or holder-code match sorts first, with what matched (`"AA code <code>"`, `"<holder
       code> · <line description>"`).
     - **Start from a holder:** `holderId` narrows to that holder's candidates; No contract (RVG) stays.
   - `linesFor(masters, ctx, contractId, { query? })`: the version's lines; when the Procedure has an
     RVG code, the lines whose default RVG code matches come first under "Matches <code>"; search on
     holder code, description and default code. Empty for a no-line Contract and No contract (RVG)
     (D49).
   - `linesByRvgCode(masters, ctx, rvgCode)` (the reverse lookup, US-04.3.2): across the candidates,
     the lines whose default RVG code matches, grouped under their Contracts, matched as 19a keys the
     default code (the same code may sit on several RVG rows, 19).
   - `isCandidate(masters, ctx, contractId, lineId?)`: the same rule, for the store guard, the "no
     longer fits" check and the review flag.
   - `applyContractChange(masters, procedure, next)` (pure; US-03.4.1, US-03.3.1): one result: the
     Contract and line; the RVG code from the new line's default where it carries one, else kept (a
     reading: log it); and the starting values reset through 19a's fill (base units from the line else
     the RVG row, modifier units 0 plus 19b's pre-applies, price, rate and discount from the line),
     clearing anything entered under the old Contract, today's `priceOverride` included until 24
     removes it. A line change on the same Contract is a Contract change. Always, whatever the
     editable setting: 24 builds the editable gate on later price edits; no second rule here.
   - `anaesthetistChangeFor(entries, procedureId)` (pure): when the latest `procedure.contract` audit
     entry for that Procedure has the anaesthetist role, `{ who, atISO, from, to }` (Contract and line);
     else nothing. A later office change clears it (the last change stands; 21 adds approval).
   - Tests: a St George's Contract is never offered on a Southern Cross List; No contract (RVG) first
     under a query, a holder filter and a miss; a no-line Contract is offered (no line test); validity
     on the procedure date (a version ending the day before is out); each holder kind's fit (hospital,
     rooms linked to the surgeon, anaesthetist A's Booking never offers B's price list, insurer
     everywhere); the order; AA-code, holder-code (`HNZCATall` on a Christchurch Eye Surgery List,
     nothing on a Southern Cross List) and name search; start from a holder; `linesFor` with and
     without an RVG code; the reverse lookup; `applyContractChange` (values from the line, from the RVG
     row; RVG code filled from a line; an entered price cleared on every change); `anaesthetistChangeFor`;
     deterministic order.
4. **Who is billed, interim** (new `domain/billing/whoIsBilled.ts`, with a test; 21 rewrites it in
   place): one pure `billedPartyFor(procedure, contract, holders, booking)`: the holder's party as 18's
   `routeCounterpartyForHolder` gives it (the billable party for a billed holder, and today's
   counterparty for a not-billed holder the route still invoices, such as Doyle; nothing for AA, a
   price-list holder or a rooms holder with no party); else the `billablePartyId` override; else the
   patient. Do not key it on "is billed" alone yet: that moves the Doyle Bookings, which is 21's
   recorded change, and breaks item 1. Commented "INTERIM until Phase 21's payer on the Booking
   (US-11.2.2); 20a shows it as 'who is invoiced'". `counterpartyForProcedure` delegates to it;
   `funderOverride` lines behave as today (22). Tests: COS gives `{ organisation, ORG.cos }`, Doyle
   today's counterparty, Aria `BP0002`, No contract (RVG) with Grace Park's BP0001 override gives
   BP0001, without an override the patient.
5. **Validator** (`validateBookingForBilling.ts` and test; US-04.3.1):
   - Remove the route, insurer direct-claims and payment-category checks.
   - Add: missing Contract ("Choose a Contract for this procedure."), dangling ("The selected Contract
     no longer exists. Choose another.") and, where the Contract has lines, a missing line ("Choose a
     line on <Contract>."; AR-29#booking-procedure-fields). No RVG code or procedure check (D33; 21 owns
     the full completion list).
   - The prepayment check is only the split-deposit check on a Procedure whose Contract is prepaid
     (today's wording).
   - Re-key `billingReferenceMissing` from the route to the holder: a hospital, surgeon or rooms
     holder expects a reference; an insurer, a price-list holder and No contract (RVG) do not. Interim
     until 21's holder references; update both callers and check the Morrison missing-reference flag.
   - Keep the check that `billablePartyId` resolves.
6. **Engine** (`invoiceBuild.ts` and tests):
   - `resolveContractForProcedure` reads only the stored Contract and line: none is the run exception
     `noContract` ("No Contract is selected on this procedure. Choose one before billing."); a dangling
     id `contractMissing`; no version in force `contractIneffective` (S4 Beat 3's COS failure and
     `resolveAndRetry` depend on it). Delete `noBillingRoute` and its copy, the route branch, 18's
     parity fallbacks (a Contract with no version in force falling to No contract (RVG) with `billedAs`,
     and nothing stored billing the List's hospital; `billedAs` goes with them) and `selectContract` if
     it survived (DM-07). Item 8 leaves no seeded Procedure relying on them.
   - `buildPrePaymentInvoiceForBooking` covers the Procedures on a prepaid Contract whose billed party
     (item 4) is a person, reading their `prepaymentDetail`: a split raises the seeded deposit line, a
     full prepayment the fee through `feeFor`. Ledger and draft Xero pairs unchanged (US-09.1.3). No new
     wording: 27 replaces the amount with the line's price.
7. **Store actions** (new `store/contractSelectionActions.ts`; tests in `contractSelectionActions.test`,
   `bookingActions.test`, `prepayment.test`):
   - **`setProcedureContract(api, actor, procedureId, { contractId, lineId? })`**: checks 38a's
     `editRefusal` (anaesthetist: own ACTIVE and SUBMITTED Lists; office: ACTIVE and SUBMITTED;
     AUTHORISED refused); refuses `notFound`, `contractNotInEffect`, `contractOutOfScope` ("That
     Contract does not apply to this Booking.") and `lineNotOnContract`; applies `applyContractChange`
     in the same commit; writes one audited `procedure.contract` entry with the Contract, line, RVG code
     and reset values before and after. No role outranks the other. Whether a change on a SUBMITTED List
     reopens the Booking follows 38a's rule; add none.
   - 19's RVG-code action keeps its own audit and gains only 38a's window; it does not reset the
     Contract.
   - Remove the Contract field and every deleted field from `ProcedurePatch`, so `editProcedure`
     cannot bypass the guard.
   - **Creation (US-04.3.4):** `createBooking` drops `billingRoute`, `insurerId` and
     `patientPaymentCategory` and takes an optional `{ contractId, lineId? }`, checked as above. With
     none the Procedure has no Contract and the Booking joins "Needs a Contract". The S12 and PDF
     creates drop their `billingRoute: 'hospital'` stamp and pass no Contract (US-04.3.6 is Future).
   - **`addProcedure` (US-03.2.3)** takes an optional pick, checked as above; with none the new
     Procedure has no Contract. It copies the first Procedure's `billablePartyId` override (interim).
     The primary stays first (FT-03.2).
   - `addPostOpAddendum` copies the original Procedure's Contract and line until 38b replaces it.
   - **Hospital, surgeon or reassign changes** re-default nothing; stored Contracts that no longer fit
     stay and are listed (item 13).
   - **Prepayment, interim:** `bookingRequiresPrepayment` is true when a non-cancelled Procedure's
     Contract version in force is flagged prepaid and its billed party (item 4) is a person (D23);
     `prepaymentStatusFor` reads it, so 15a's rule needs no change. The `raisePreProcedureInvoice`
     refusal reads "This booking has no procedure on a prepaid Contract." No office flag and no gate
     (D5); if any part of the old gate survived, stop and record it.
   - **15a's prepayment sample** (`warningSamples.ts`): `stage` moves the target's first Procedure onto
     its anaesthetist's prepaid price-list Contract with `setProcedureContract` as the demo-trigger
     actor (log it if that anaesthetist has none and pick a target who has); `unstage` restores the
     Procedure's Contract, line and values from the pristine seed. Update its test.
   - **Selectors:** `contractCandidatesForProcedure(state, procedureId, opts)`,
     `contractCandidatesForNewBooking(state, listId, opts)`, `contractLinesFor(state, procedureId,
     contractId, opts)`, `billedPartyForProcedure`, `pendingAnaesthetistChange` and
     `needsContractBookings(state)`: across all dates, sorted by date, Bookings with a Procedure that has
     no Contract or a stored Contract that no longer fits (`isCandidate` false), each with its reason.
8. **Seed** (`seed/bookings.ts`, `draftLists.ts`, `history.ts`, `audit.ts`, `contracts.ts`, `index.ts`):
   - `ProcedureSpec` loses the route, insurer and category fields. Map every seeded Procedure:

     | Today | After this phase |
     |---|---|
     | Hospital route with a stored Contract | The same Contract and the line 19a gave its price, if it has lines |
     | Hospital route with none stored | That hospital's no-line Contract (18), holder billed |
     | Insurer route, nib (Marsh, the filler) | nib's Contract and its line where 19a gave one, else nib's no-line Contract |
     | Billable-party route, self-funded | No contract (RVG); the `billablePartyId` override stays |
     | Insured reimbursement (Webb, AIA) | No contract (RVG); AIA stays only in the description |
     | Prepayment: Riley (split $800) | Dr Souter's prepaid price list, its Rhinoplasty $1,200 line; `prepaymentDetail` unchanged |
     | Prepayment: Nair's rhinoplasty (full) | Souter's price list, on a line that reproduces today's fee (if 19a has none, add a demo line, default RVG code 41800, no price, so it prices at RVG); Nair's septoplasty unchanged |
     | Billable-party route under the Aria hourly Contract | The same Contract and line; BP0002 keeps the payer |
     | `history.ts` and `draftLists.ts` patient-route Procedures | No contract (RVG) |

   - Riley's total must stay $1,200: if the line's fixed price and the seeded fixed billing line would
     both price it, resolve it in the seed (log it), never in a fixture.
   - Run `isCandidate` over every seeded Procedure and resolve each miss so item 1 holds: the Doyle
     bariatric Booking (as 18 and 19a re-held it), the SXAP picks, Aria, the ACC and Health NZ picks, and
     the six eye Bookings on Souter's Wed 22 Christchurch Eye Surgery List. Log each call.
   - **A holder code to search on a Christchurch Eye Surgery List** (US-04.3.2): if 19a seeded none,
     add one Contract held by Christchurch Eye Surgery, "Christchurch Eye Surgery · Health NZ cataract
     schedule", AA code in 18's format, a version in force on 22 Jul, one line with holder code
     `HNZCATall`, description "Cataract, all", the cataract RVG row as its default code and a demo fixed
     price, commented as demo values. Move no seeded Booking onto it.
   - Seed one future Booking with no Contract, on a List no beat uses, so "Needs a Contract" is not
     empty at reset.
   - Seed one anaesthetist change for review with nothing stored changing: on Dr Morrison's SUBMITTED
     Mon 20 St George's List, the 10:00 "Ureteroscopy with lithotripsy, ACC claim" (ACC45-118203),
     already on St George's ACC Contract, gets a `procedure.contract` audit row by Dr Kate Morrison
     (anaesthetist role) from No contract (RVG) to that Contract, timed before the 13:10 submit.
   - Regenerate `audit.ts` histories with Contract and line fields, not routes or categories. Rename
     the scenario marker `insuredReimbursementBooking` to `aiaClaimBooking`. Keep the filler's `rng()`
     draw order and count (the route draw becomes the Contract draw). Bump `PERSIST_VERSION` by one from
     its value when this phase starts, with a comment line.
9. **Remove the retired vocabulary (RV-18):**
   - `ROUTE_LABELS` and `routeLabel`; the route and category maps in `BtmCaptureBlock`,
     `OfficeBillingSetup`, `EditProcedureSheet`, `EditBillingSetupSheet`, `ManualBookingForm` and
     `InvoiceDocument`; the insurer selects and " (direct claims)"; the S2 prefill's route and `I-NIB`;
     the route set in `ReviewScreen`; any route-keyed review flag.
   - In `shared/audit/`: field labels for the Contract ("Contract") and line ("Contract line"); action
     `procedure.contract` "Contract changed"; drop the labels of the removed fields.
   - Gates: `grep -rnE "billingRoute|BillingRoute|patientPaymentCategory|PatientPaymentCategory|ROUTE_LABELS?|routeLabel|noBillingRoute|insuredReimbursement|selfFundedPrepayment|selfFundedPostProcedure" aa-prototype/src`
     returns nothing; every remaining `insurerId` hit is the Insurer master, a Contract holder or a
     `funderOverride`.
10. **Session 1 exit:** fix the listed tests (and `fixtures.ts`). Edit the UI only as far as compiling
    needs: route, insurer and category controls removed, the Contract shown read-only where the route
    chip was. `npm run build`, `npm run build:pwa` and `npx vitest run` green; item 1 passes. Write a
    short "session 1 done" note in the PROGRESS entry.

**Session 2: the picker, the anaesthetist's change, the list, creation forms, review.**

11. **The picker** (new `src/shared/flows/ContractPickerSheet.tsx`, through `useSurface().Overlay`; a
    bottom sheet on mobile, a Dialog on web and Admin; `data-shot="contract-picker"`):
    - **Contract step:** a search field "Search by name, AA code, holder code or RVG code" and a "Start
      from a holder" chooser listing the fitting holders. **No contract (RVG)** is the first row, always,
      with the mist line "Standard RVG pricing". Then the sections under holder headings; each row
      shows the Contract's name, AA code and "<n> lines" or "RVG pricing". A code match adds what
      matched as a mist caption. Contracts may run long: never a flat select, at most 50 rows, "Showing
      50 of <n>. Type to narrow."
    - **Reverse lookup:** typing an RVG code (19's type-ahead rows) lists the lines whose default code
      matches, under their Contracts; picking one sets Contract and line in one step.
    - **Line step:** picking a Contract with lines opens its lines (holder code, description, default
      RVG code, the price where fixed), with search, the Procedure's RVG code matches first, and "Back
      to Contracts". The office may choose "Leave the line for the anaesthetist" (D33). No contract
      (RVG) and no-line Contracts skip it.
    - **The one provisional caption** (D48, D49), office view only, a mist line at the foot: "Provisional
      · surgeons' fixed prices held by their rooms, and No contract (RVG) without routine procedure
      lines, are still to confirm with AA". Nowhere else.
    - The anaesthetist's rows are the office's (pricing basis and who is invoiced are 20a's); their list
      never holds a colleague's price list. The selected row carries a teal tick. Picking calls
      `setProcedureContract` (or sets a creation form's pick) and shows any refusal verbatim. Empty
      states: "No other Contracts fit this Booking. No contract (RVG) is always available." and "No
      Contract matches "<query>"." (No contract (RVG) stays above it). There is no "None".
12. **The Contract on the Procedure and the anaesthetist's change (US-03.4.1, FT-03.4, US-03.3.1):**
    - A Contract row (name, AA code, the line's description once chosen, teal "Change") replaces the
      route chip in `BtmCaptureBlock` and the route control in `EditProcedureSheet`; 19's RVG code row
      stays beside it. A lined Contract with no line shows "Choose a line" (teal), which opens the line
      step with the Procedure's RVG code matches first.
    - The anaesthetist changes the Contract, line and RVG code on their own ACTIVE and SUBMITTED Lists,
      with no reason; AUTHORISED is read-only. Caption: "The office sees any change to the Contract at
      review."
    - After a change, a one-line notice: "Price, rate, discount and starting units reset for the new
      Contract." and, when a line filled it, "RVG code <code> filled from the line."
    - A pending anaesthetist change shows a warning-tint pill: "Changed by you · office to check" on
      anaesthetist views, "Changed by anaesthetist" on the office's.
    - `CONTEXT_FIELDS` swaps the route and insurer fields for the Contract and line. Keep the row a small
      component 20a can replace with its stack.
13. **"Needs a Contract" (US-04.3.4):**
    - A card on the Admin Day right rail under 15a's To-do card (leave room for 31's Draft Lists and
      32's pool), reading `needsContractBookings`: patient, List date, session and hospital, and a reason
      pill ("No Contract", "Contract no longer fits"); a row opens the Booking drawer at that Procedure.
      Empty state: "Every Booking has a Contract." Not a warning, no Clear: a row leaves when the
      Contract is set.
    - On the Booking (all three apps), a Procedure with no Contract shows "No Contract yet" with a teal
      "Choose Contract" for whoever may edit it; one that no longer fits shows "This Contract no longer
      fits this Booking." with the same link.
14. **Office billing setup** (`OfficeBillingSetup`, `EditBillingSetupSheet`):
    - Rows: Contract (name, AA code, holder, line), Billed to (item 4, interim), Reference, Override,
      Funders, Prepayment (read-only: "Required · prepaid Contract", "Not required", Riley "Required ·
      $800 seeded"). The Route, Category and Insurer rows and "None (default pricing)" go.
    - The sheet's title becomes "Contract and payer": a Contract row opening the picker, the guardian
      select only when the holder is not billed (interim until 21), and the reference. Save calls
      `setProcedureContract` when the Contract or line changed, then `editProcedure` for the rest. The
      button keeps its name, "Edit billing setup" (recipes and specs click it). Never call a prepaid
      amount an estimate or a deposit in new copy.
15. **Creation forms: the Contract at setup (US-04.3.4):**
    - `ManualBookingForm`'s "Billing route" block becomes a Contract row ("Choose a Contract", opening
      the picker fed by the List's hospital, surgeon and anaesthetist). Never preselected. Saving
      without one is allowed, and the form says so under the row ("Saved without a Contract, this
      Booking waits on the office's Needs a Contract list."). The RVG code stays optional (19). No
      insurer or funding field.
    - `PhoneAdviceBooking` (S2) gets the same row; its prefill drops the route and `I-NIB`. The run
      sheet picks St George's no-line Contract (holder billed, as today's hospital route), so the payer
      is unchanged.
    - The anaesthetist's add-a-booking path (mobile and web) gets the same row.
    - Add another procedure (mobile, web, Admin) opens the picker with the first Procedure's Contract
      pre-ticked when it is a candidate (one tap to confirm, never stored silently).
16. **Admin review (DM-10's change flag):**
    - `ReviewScreen`'s Route column becomes "Billed to" ("Mixed" when Procedures differ). The Contract
      column shows the primary Procedure's Contract, "+N" for more, and a marker when the anaesthetist
      changed one.
    - `reviewFlags.ts` stays pure; its inputs gain the Contract, line, `isCandidate` and the pending
      change. New warn flags: "Changed by anaesthetist · <from> to <to>", "No Contract", "No line
      chosen" and "Contract no longer fits this Booking"; "No billing reference" re-keyed (item 5). The
      flag sits beside 38a's "changed since submitted" cue, not in place of it. Approval and the payer
      are 21's.
17. **Invoice wording:** `PaymentCategoryNote` becomes a note from one pure helper,
    `patientInvoiceNote(booking, invoiceKind)`: a Booking requiring prepayment (item 7) gives today's
    prepayment wording; otherwise "Payment is due on receipt of this invoice." The insured-reimbursement
    wording loses its trigger and is retired until 21 (US-11.4.2); Phase 22 rebuilds the layout.
18. **Shots and demo surfaces:** update `visual/mobile-interactions.spec.ts`, `admin-phase06.spec.ts`
    and `admin-phase07.spec.ts`, keeping `data-shot="procedure-contract"`; add shots of the Contract
    step, the line step, a holder code and an RVG code typed, the "Needs a Contract" card and the
    phone-advice Contract row. Edit the Control Panel's S1 scenario text and the description of Phase
    14's re-homed "Fire hospital message" entry. The catalogue screenshots are the standing step below.
19. **PWA check:** the picker (both steps, search included), the Contract row and "Change" work in the
    PWA build as bottom sheets, on an ACTIVE and a SUBMITTED List.

## Demo triggers

No new harness-bar button and no new PWA entry: everything demos through normal use. This phase adds
no warning rule; 15a's prepayment sample is re-pointed at a prepaid Contract (item 7) and must still
stage and clear.

- **Admin Day: the "Needs a Contract" card** (product). Phase 14's re-homed `fire-hospital-message`
  entry: Sarah Mitchell's Booking on Souter Tue 28 Jul St George's AM arrives with no Contract, joins
  the card, and the office sets it. Update the entry's description text only.
- **Mobile, web and Admin Procedure: "Change" on the Contract** (product) opens the picker with No
  contract (RVG) first, Contracts by holder, search, the line step and the RVG reverse lookup.
- **Admin Review: the anaesthetist-change flag** (product), seeded on Dr Morrison's SUBMITTED Mon 20
  List; no new button. A live change on a SUBMITTED List shows it too (38a's window).
- **"Trigger billing failure" (S4 Beat 3)** keeps working: the COS Contract is still the stored pick
  and still dates out to `contractIneffective`. Check it after item 8.
- **PWA:** the change, before and after submit, needs no office step; Phase 14's "Office authorises
  this List" closes the window on a handset.

## Out of scope

- The payer on the Booking replacing the `billablePartyId` override; the insurer and approval number
  on the Booking with their review cues (OQ-93, D28); the child-payer warning; holder references;
  completion's full list; office approval of Contract changes at review; US-11.4.2's wording. All 21.
- The source descriptions, the invoice description from the line and the Contract stack on every
  booking screen: 20a.
- The edit window itself and the "changed since submitted" cue: 38a.
- The Split button replacing `funderOverride`, Contract-driven layout, delivery and GST: 22.
- The primary Procedure and the multi-procedure rule: 23.
- Prices on the Procedure, the editable setting's gate on price, rate and discount: 24.
- The pricing snapshot at AUTHORISED, staged Contract changes: 25.
- The prepayment lifecycle from a prepaid Contract (the line's price, approval, re-checks, removing
  deposits and `prepaymentDetail`): 26 and 27.
- A matched hospital row creating a Booking: 33, which leaves its Bookings on this phase's list.
- The holder master, settings, versions and AA code (18); RVG groups and the type-ahead (19); lines,
  fill and reset, price lists (19a); modifiers (19b); hospital data setting the Contract (US-04.3.6)
  and the not-on-schedule flag (US-04.3.7), both Future Work.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day shows the "Needs a Contract" card with the seeded Booking. Fire MSG-STG-1001:
      Sarah Mitchell's Booking on Souter Tue 28 Jul St George's AM arrives with no Contract and joins the
      card. Open it, pick holder, Contract and line: it leaves the card.
- [ ] Open the picker on any Procedure: No contract (RVG) first; then the hospital's, surgeons' or
      rooms', the anaesthetist's own and insurers' Contracts under holder headings; no "None". On a
      Southern Cross List no St George's Contract shows; a no-line Contract shows.
- [ ] Pick a Contract with lines: the line step opens; with the Procedure's RVG code set, matching lines
      come first. As the office, "Leave the line for the anaesthetist": the Booking does not join the
      card; Mark complete then refuses "Choose a line on <Contract>."
- [ ] On Souter's Wed 22 Christchurch Eye Surgery List, type `HNZCAT`: the CES Health NZ cataract
      schedule shows with "HNZCATall · Cataract, all"; its AA code puts it first with "AA code <code>";
      nonsense gives "No Contract matches", No contract (RVG) still on top. On a Southern Cross List,
      `HNZCAT` finds nothing.
- [ ] Type an RVG code a seeded line carries as its default: its lines show under their Contracts;
      picking one sets Contract, line and RVG code.
- [ ] "Start from a holder": pick Southern Cross; only its Contracts remain, No contract (RVG) first.
- [ ] As Dr Souter, mobile then web, on an ACTIVE List: change a Procedure's Contract with no reason
      asked. Price, rate, discount and starting units reset, the "Changed by you" pill shows, and
      History records who, when, from and to. Submit the List and change it again: allowed. Authorise
      it (Phase 14's trigger): read-only. Dr Souter never sees another anaesthetist's price list.
- [ ] Pre-approval falls through: move an insurer-Contract Procedure to No contract (RVG); Billed to
      becomes the patient (or the guardian override).
- [ ] Add another procedure to a guardian-paid Booking: the picker opens with the first Procedure's
      Contract pre-ticked; confirm; it bills the same guardian.
- [ ] Office: change a List's hospital from St George's to Forte. Nothing re-defaults; a St
      George's-held Contract shows "This Contract no longer fits this Booking." and the Booking joins
      the card.
- [ ] Admin phone advice (S2): a Contract row, "Choose a Contract"; pick St George's no-line Contract
      and save: audited as the office. Save another without a Contract: it lands on the card.
- [ ] Review queue, Dr Morrison Mon 20: "Billed to" replaces Route; the ACC ureteroscopy shows "Changed
      by anaesthetist · No contract (RVG) to St George's ACC" (names as seeded). Fee and payer as before.
      Change it as the office: the flag clears (last change stands). Reload: it persists.
- [ ] Prepayment: Riley's Booking shows "Required · $800 seeded" from Souter's prepaid Contract and
      15a's warning in both apps; move her Procedure to No contract (RVG): prepayment is no longer
      required. "Raise sample warnings" stages the prepayment sample and "Clear sample warnings"
      restores it.
- [ ] S3: authorise Souter Mon 20 AM and PM. Holt, Prentice nib and Prentice St George's match item
      1's figures to the cent, the Prentice split still through `funderOverride`.
- [ ] S4 Beat 1: Riley's pre-invoice gives $800 + GST with its draft Xero pair; completion is not
      blocked; Nair's full prepayment still nets the balance to $0.
- [ ] S4 Beat 3: "Trigger billing failure" fails only the COS Booking, its sibling bills, and "Resolve
      and retry" clears it.
- [ ] Mark complete on a Procedure with no Contract: refused, "Choose a Contract for this procedure."
- [ ] Invoice wording: prepayment and post-procedure wordings unchanged; the AIA Booking reads the
      post-procedure wording (logged for 21).
- [ ] No "billing route", "payment category", "Reimbursement", "None (default pricing)", "Default for
      <hospital>", "procedure" picker tab or "general procedure" text anywhere; no new "estimate" or
      "deposit" prepayment copy; no en or em dashes in new copy.
- [ ] The PWA build shows both picker steps and the Contract row as bottom sheets, search included.
- [ ] Catalogue screenshots: the recipes below created or updated, every broken recipe re-pointed, a
      full `npm run capture` with no failed recipe and no story without a recipe, the covered items'
      shots checked by eye, `npm run verify:board` green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html`. Earlier phases edit the same files (18 the cheat sheet's Type 1/2/3 lines and
S5 Beat 4; 19 and 19b S1 Beat 3; 15a S4 Beat 1; 15b the Copy and DRAFT wording; 38a the submit and
main-view wording), so locate each passage by its text:

- `03-demo-script.md`:
  - **S1 Beat 1 Expected:** Sarah's Booking arrives with no Contract and appears on the "Needs a
    Contract" card; add a Click and Say for the office setting it ("The hospital told us who the patient
    is and when. The office decides who pays: the holder, then the Contract, set before the day.").
    Remove any "default Contract" wording.
  - **S2 Beat 2:** the phone-advice form shows the Contract row; the presenter picks St George's no-line
    Contract (No contract (RVG) is first; point at it). Remove any billing route or insurer.
  - **S2 Beat 4:** a "Worth pointing at" line on Dr Morrison's "Changed by anaesthetist" flag (she may
    change it until the office authorises; approval arrives with Phase 21).
  - **S3 Beat 1 Say:** replace "It resolves the explicit payer per Procedure, applies the governing
    Contract, and groups by counterparty" with "It reads the one Contract on each Procedure, bills the
    holder when the holder pays us, otherwise the patient or whoever pays for them, and groups by who is
    billed". Figures unchanged.
  - **S4 Beat 1 Say** (as 15a left it): "Dr Souter's own price list is flagged prepaid, so this booking
    needs paying first" in place of "A patient-funded pre-payment"; no "estimate" or "deposit".
  - One "Worth pointing at" line where the picker is shown: "No contract (RVG) is always first. The rest
    are only the Contracts whose holder fits this Booking, by holder, and the lines sit inside each one.
    Typing an AA code, a holder's own code or an RVG code finds one among thousands. The anaesthetist
    can change it until the office authorises the list, and the office sees the change."
- `04-presenter-cheat-sheet.md`: glossary rows "Procedure" ("each has exactly one Contract and, where it
  has lines, one line") and "ACC route" (ACC is a holder like any other); replace "Three billing routes"
  and its bullets with "One Contract per Procedure" (holder, Contract, line at setup; No contract (RVG)
  first; the Contract decides who is billed; a "Needs a Contract" list; the anaesthetist's change
  flagged); update the myths ("Every insured patient is billed to an insurer", "ACC has its own billing
  route") and the ACC section's "ACC is not a billing route" line.
- `README.md`: "Bookings using the three main billing routes" becomes Bookings on hospital, insurer and
  No contract (RVG) Contracts (leave the RFP section titles it cites).
- `02-workflows-and-handoffs.md` ("Resolve route, Contract, fee", the manual-Booking "advised billing
  route", the route bullets) and `01-personas-and-responsibilities.md` ("Confirm that the billing route,
  Contract, Insurer and reference information make sense", "ACC route warnings"): Contract wording; the
  office's setup step identifies who pays.
- The Control Panel S1 scenario text and the Phase 14 registry entry description (item 18).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 20` first: earlier phases may have changed
these recipes. The tool lists every story under EP-04 and FT-03.4 plus US-03.2.3 and US-03.3.1; rows
owned elsewhere say so. Shots are Admin unless an app is named.

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) | partial · admin-contract-types | No change here (Phase 18 owns it); drop any "Phase 20" half of its reason |
| [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) | partial · admin-contracts, admin-edit-contract | No change here (Phase 18 owns it) beyond `--dry` |
| [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md) | absent | No change here (Phase 25 owns it) |
| [US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) | absent | No change here (Phase 18 owns it); the picker's AA-code search is US-04.3.2's `aa-code` state |
| [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) | none | No change here (Phase 18 creates it); drop any "Phase 20" half of its reason, keeping "who is invoiced, Phase 21" |
| [US-04.1.6](../../../../requirements-board/requirements/stories/US-04.1.6.md) | none | No change here (Phase 25 owns it) |
| [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) | partial · admin-contract-holder | Phase 18 owns it. Add state `narrows-picker`: a Christchurch Eye Surgery-held Contract offered on its eye Booking and absent on a Southern Cross List, holder heading highlighted, caption "A Contract is offered only where its holder fits the Booking"; drop the Phase 20 half of the reason; stays `partial` (who is invoiced, 21) |
| [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) | absent | No change here (Phase 25 owns it) |
| [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) | absent | No change here (Phase 19a owns it) |
| [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) | none | No change here (Phase 19a owns it); drop "Offering it only on her own Bookings is built in Phase 20" from its reason |
| [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) | captured · admin-pricing-basis | No change here (Phase 24 owns it) beyond `--dry` |
| [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) | partial · admin-price-rows | No change here (Phase 19a owns it) beyond `--dry` |
| [US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md) | absent | No change here (Phase 22 owns it); reword "follows the billing route" to "follows the Contract" |
| [US-04.3.1](../../../../requirements-board/requirements/stories/US-04.3.1.md) | partial · admin-procedure-contract | `captured`. Re-shoot the office Booking detail's Contract row (name, AA code, holder, line) and "Billed to", no Route, Category or Insurer; add `refused` (Mark complete with no Contract: "Choose a Contract for this procedure."). Caption "Every Procedure carries exactly one Contract and, where it has lines, one line". Drop the reason |
| [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) | partial · admin-contract-picker | `captured`. `contract-picker` states: `default` (No contract (RVG) first, holder sections, AA codes, the provisional caption), `aa-code`, `holder-code` (`HNZCAT` on the CES cataract Booking), `holder` (from Southern Cross), `lines` (a Contract's line step) and `rvg-code` (the reverse lookup); add `web-contract-picker` and `mobile-contract-picker` for the anaesthetist. Caption "No contract (RVG) first, then the Contracts that fit this Booking, by holder". Drop the reason |
| [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) | partial · admin-default-contract, web-default-contract, mobile-default-contract | Stays `partial`, reason "The payer named on the Booking arrives with Phase 21; until then No contract (RVG) bills the patient or the Booking's existing guardian override." **Replace the default-hospital captions:** re-point all three at the picker with No contract (RVG) the highlighted first row (rename to `no-contract-first`), plus `billed` on the `procedure-contract` row (office). Captions "No contract (RVG) is always first" and "No contract (RVG) bills the patient or whoever pays for them" |
| [US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) | captured · admin-billing-setup[summary,edit] | Stays `captured`. Re-caption `edit` ("Contract and payer", no route or insurer) and re-point its highlights; add `setup` (the phone-advice Contract row) and `needs-contract` (the Admin Day card). Captions "The office sets who pays when the Booking is created" and "Bookings without a Contract wait on the office's list" |
| [US-04.3.5](../../../../requirements-board/requirements/stories/US-04.3.5.md) | captured · admin-contract-before, admin-locked-contract | No change here (Phase 25 owns it); re-check the billing-setup highlights with `--dry` |
| [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) | partial · web-edit-operation, mobile-edit-operation | `captured`. **Replace "Edit operation: billing route, insurer and reference".** Re-shoot `edit-operation` on web and mobile on a SUBMITTED List (Contract row with teal "Change"); add `changed` (the pill and the reset notice) and Admin `contract-changed-flag` (Review, Morrison Mon 20). Captions "Change the Contract until the office authorises the list, no reason needed" and "Every change is audited and flagged for the office". Drop the reason |
| [US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) | partial · web-add-procedure[before,added], mobile-add-procedure[before,added] | `captured`. Re-shoot both apps; `added` shows procedure 2 with its own Contract row after its own pick. Drop the reason |
| [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) | captured · web-rvg-picker, mobile-rvg-picker[closed,open,search] | Stays `captured` (19 owns the type-ahead shots). Add `line-default` (a line picked, its default RVG code filled) and `reset` (after a Contract change, the reset values) on web and mobile. Caption "The RVG code is optional and fills from the Contract line" |

**Recipes this phase breaks.**
- `US-06.3.5` (re-check on change): its `after` state clicks "Self-funded" in the billing setup; the
  category is gone. Re-point it at moving Riley's Procedure to No contract (RVG) in the picker (the
  prepayment banner clears), keeping the shot name and the `booking-prepayment` hook; no "estimate" or
  "deposit"; Phase 27 re-shoots it.
- `US-07.2.2`: the `edit` state's "choosing the route and Contract" caption and the Route column.
  Re-caption and re-point; the button keeps its name.
- `US-11.4.2`: the reimbursement wording is retired until 21 (item 17): set `partial`, reason "The
  reimbursement wording returns with Phase 21's Contract-holder flag".
- `US-04.3.1` to `US-04.3.5` and `US-03.4.1` use `[data-shot=office-billing-setup-1]`, "Edit billing
  setup", `label:has-text("Governing contract")` and `[data-testid=procedure-header] >> text="Edit"`:
  reconcile with the table.
- `US-02.5.5` ("including billing route and contract"): re-caption without the route.
- Billing-setup recipes (`US-05.4.2`, `US-05.5.1`, `US-07.2.3`, `US-11.2.1`, `US-11.2.2`): `--dry` and
  re-point highlights; `US-11.2.2`'s `edit` state now finds the guardian select first; 21 re-shoots it.
- Reasons naming the billing route or a default hospital Contract (`US-04.2.8`, `US-04.3.6`,
  `US-15.0.5`): reword ("follows the Contract"); status unchanged.
- Prepayment recipes (`US-06.2.1`, `US-06.2.2`, `US-06.3.1` to `US-06.3.4`, `US-06.4.1`): the same
  Bookings still require prepayment, now from the prepaid Contract; `--dry` is the check.
- 18's and 19a's recipes that click Contracts by name or read the billing setup: check after the seed
  remap.

**ATLAS.md.** Seed data and IDs (each seeded Booking's Contract and line, who is billed, the prepaid
Contracts; the "Needs a Contract" Booking; notes that say "nib insurer route", "billing route" or
"hospital default"), Overlays (the picker's two steps, "Contract and payer", the phone-advice Contract
row), hooks (`contract-picker`, the card's hook, any moved `office-billing-setup-*`) and the
billing-setup button text. Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the commands are green, and before the PROGRESS entry, run the
standard adversarial review-and-fix pass (PROGRESS convention 18): independent Opus review subagents
for quality, bugs/correctness and plan adherence, plus a money-parity lens. Verify every finding against
the catalogue, this plan and the code, fix the confirmed ones, re-green and record the pass. Do not
re-raise anything settled in the Decisions log except the rulings this phase supersedes.

**Steer this phase's reviewers at:**

- **Nothing derived from the location:** no creation path, hospital change or reassign stores a
  Contract the user did not pick; feed and PDF creates arrive with none; the only "no Contract" outcomes
  are the card, the completion refusal and `noContract`.
- **The candidate rule matches US-04.3.2:** No contract (RVG) first under every query, filter and miss,
  found by its setting; Contracts not lines; no line test; valid on the date; holder fit (hospital,
  rooms linked to the surgeon, the Booking's own anaesthetist or surgeon for a practitioner-linked
  holder, insurers everywhere); the order; search inside the candidates only; the line step and the
  reverse lookup; the store refuses any non-candidate; no flat select; one rule in `domain/billing`.
- **No procedure leftovers:** no procedure pick, tabs or general procedure anywhere.
- **The reset:** every Contract or line change resets price, rate, discount and starting units through
  19a's fill in the same commit and audits before and after; no second base-unit source and no
  editable check on the reset.
- **The window:** the anaesthetist changes on own ACTIVE and SUBMITTED Lists, nobody on AUTHORISED,
  through 38a's `editRefusal`; the change flag derives from audit, the last change standing, and
  survives a reload.
- **The payment category is gone everywhere**, with prepayment read from the prepaid Contract and
  `prepaymentDetail` read only there; no Phase 27 work done early; no completion gate returns.
- **Parity:** item 1's fixtures pass unchanged; the interim who-is-billed reproduces every seeded payer
  (BP0001, BP0002 and the Doyle counterparty included); `funderOverride` still splits Prentice; the
  prepayment builders give the same amounts and pairs; the old-model Matches still hold; `rng()` draw
  order unchanged.
- **Privacy of price lists:** an anaesthetist never sees a colleague's in any picker, search, review or
  audit view they can reach.
- **One provisional caption** (D48, D49), office picker only; none for answered questions.
- **Leftovers:** the item 9 greps; `contractIneffective` kept for S4 Beat 3 and Phase 25.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry): the D48 and D49 defaults built; the readings
  below; anything logged rather than fixed; and the screens worth a look with route and persona (the
  picker's two steps on Admin, web and mobile; the reverse lookup; the "Needs a Contract" card; the
  phone-advice Contract row; the Morrison review flag; a change after submit).
- **Catalogue screenshots result:** the recipes changed, the `REPORT.md` counts (captured, partial,
  absent, failed) before and after, and the reasons handed on (US-11.4.2, US-04.3.3, US-04.1.5 and
  US-04.2.1 to 21; US-04.2.8 to 22; US-04.2.2 to 24; US-04.1.3, US-04.1.6 and US-04.2.10 to 25).
- Status row and a phase entry: the drift-check result against `d4db277`; D16, D32, D33, D63, D12, D3,
  D17, D2, D45, D42, D23 and OQ-78 built as answered; the D48 and D49 defaults; what 15a, 15b, 18, 19,
  19a, 19b and 38a provided; the session split; the adversarial pass; the tests added (selection,
  search, holder fit, lines, reverse lookup, reset, parity, store guard, audit-derived flag, prepayment
  interim); `PERSIST_VERSION` old to new; the broken recipes; and the handoffs: 20a (the stack reads
  `billedPartyFor` and the Contract row; the invoice description starts from the line), 21 (the payer
  replaces the override; `billedPartyFor` and `routeCounterpartyForHolder` give way to "is billed" and
  the payer, with the Doyle change; approval; the insurer on the Booking), 22 (`funderOverride`), 24
  (the editable gate on price edits; `priceOverride` goes), 27 (the prepaid lifecycle replaces the
  interim and `prepaymentDetail`), 33 (created Bookings join the list).
- Decisions log:
  - **Superseded:** the route model (3rd review #1; the Phase 08 decisions (1) and (2); 6th review #2);
    payment categories (2nd review #5, 7th review A2); "the Card-level pre-payment flag is derived,
    never stored" (7th review B6), now derived from the prepaid Contract; the protected default Type 1
    per hospital and insurer (with 18); the earlier catch-up plans' hospital default at creation, the
    procedure pick before the Contract, the two tabs and the general procedure, and the window ending
    at submit.
  - **Readings this phase picks where the catalogue is silent:** insurers fit every Booking and sort
    last; a line change is a Contract change; the RVG code is kept on a Contract change unless the new
    line carries a default; the entered price cleared is today's `priceOverride` until 24; a creation
    form never preselects and may save without a Contract; an added Procedure pre-ticks the first
    Procedure's Contract and copies its payer override; a hospital or surgeon change re-defaults
    nothing; an office change clears the change flag until 21; the insured-reimbursement wording is
    retired until 21; the interim who-is-billed reads 18's `routeCounterpartyForHolder`, so the Doyle
    Bookings keep today's counterparty until 21.
  - **Open, built as defaults (one caption):** D48 (OQ-105), D49 (OQ-106).
  - **Interims, with the phases that replace them:** who is billed with the `billablePartyId` override
    (21), `funderOverride` as the split (22), prepayment from the prepaid Contract with
    `prepaymentDetail` and the seeded deposit (27).
