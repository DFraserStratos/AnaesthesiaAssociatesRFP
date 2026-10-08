# Phase 20 · One Contract per Procedure

**Requirements covered:**
[EP-04](../../../../requirements-board/requirements/stories/EP-04.md) (Contradicts: the route half and "the Contract decides who is billed"; the payer on the Booking lands in 21, the lock in 25),
[FT-04.3](../../../../requirements-board/requirements/stories/FT-04.3.md) (Confirmed, Partial: the two-tab pick then the Contract, No contract (RVG) first, the RVG codes route),
[US-04.3.1](../../../../requirements-board/requirements/stories/US-04.3.1.md) (Partial: exactly one Contract, required at completion),
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (Confirmed, Partial: No contract (RVG) first, lines for the procedure, valid on the procedure date, holder fit, holder headings, start from the holder, composite search, the RVG codes route),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (Contradicts: "No contract (RVG) always offered first"; no hospital, insurer or procedure default Contracts, OQ-78 answered),
[US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) (Partial: the office sets the Contract at booking setup, mandatory, with a "Needs a Contract" list; matching a hospital row is 33's),
[FT-03.4](../../../../requirements-board/requirements/stories/FT-03.4.md) (Partial: the anaesthetist changes the procedure or the Contract until submit, seen at review; office approval lands in 21),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) (Partial: no reason, refresh, typed price cleared, audited and flagged, the pre-approval falls-through case),
[US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) (Partial: each added Procedure picks its own Contract),
[US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) (Verify, Contradicts; joined 2026-10-08: the Contract step after the two-tab pick and the refresh of starting units on a change; the two tabs are 19's, the resolver 19a's, the out-of-range warning 19's);
[DM-10](../analysis/domain-model-delta.md#dm-10) (each Procedure selects exactly one Contract at booking setup; the route and billing-time resolution go; DM-37's audit-derived change flag is merged into it);
[RV-08](../analysis/reverse-check.md) (the route and payment-category part; Type 1/2/3 went in 18).
**Left this phase on 2026-10-08:** DM-12 (the insurance indication on the Booking, now 21's, OQ-93,
D28); DM-37 (merged into DM-10, still built here); RV-27 (dropped at verification: the feed and PDF
route stamp simply goes with the route); US-03.1.2 (seeing the Contract on each Procedure, now 20a's
three-part stack).
**Leans on, not covered:** [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md)
(18's contract-holder master: the holder headings, holder fit and "is the holder billed"),
[US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) (18's AA code, shown and
searched), [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) (18's dated
versions: valid on the procedure date, D45), [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md)
and [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) (19a's Contract lines and
the anaesthetists' own first-party Contracts), [US-05.1.6](../../../../requirements-board/requirements/stories/US-05.1.6.md)
(19's procedure list and each RVG group's general procedure), [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md)
(combination Contracts: a line under each parent procedure is just a line to this picker; 23 seeds them),
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) (the payer on the Booking,
21's), [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) (office approval of every
Contract at review, 21's), [US-03.5.1](../../../../requirements-board/requirements/stories/US-03.5.1.md)
(the anaesthetist's typed price, 24's), [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md)
(completion, 21's full list), [US-15.0.1](../../../../requirements-board/requirements/stories/US-15.0.1.md)
(keep office-only Contract complexity off anaesthetist screens; the sweep is 43a).
**Depends on:** Phases 19a and 19b, and through them 19 and 18: 18's contract-holder master, dated
Contract versions, `aaCode`, `contractSearch`, the single stored No contract (RVG) and the holders'
plain RVG Contracts that replaced the per-hospital and per-insurer default Type 1s (with the route,
today's resolver and the Type 2 and Type 3 terms still in place); 19's RVG groups, procedure list,
general procedure per group and two-tab picker (`pickProcedure` or its 19 name); 19a's Contract lines
keyed by procedure, its line, procedure, group resolver (each value with its layer) and the
anaesthetists' first-party Contracts; 19b's itemised modifiers with the locked age and P1 modifiers
re-applied on a procedure change. Also 15b (Copy gone, DRAFT renamed ACTIVE), 15a (the warning
routine and the `prepaymentUnpaid` rule), 15 (Booking vocabulary) and 14 (the trigger registry).
**Answered, build the answer (no provisional label):** [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md)
(No contract (RVG) is the one default, offered first for every procedure; no hospital, insurer or
procedure defaults; nothing derived from the List's location); D16 as superseded on 2026-10-08
([OQ-66](../../../../requirements-board/requirements/questions/OQ-66.md), US-04.3.2: holder-fit candidates
under holder headings, composite search, start from the holder, no hospital default); D17 as
superseded ([OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md): the Contract bills its
holder when the holder pays AA, otherwise the payer on the Booking; 21 builds the payer); D2 as
superseded ([OQ-55](../../../../requirements-board/requirements/questions/OQ-55.md): `Procedure.insurerId`
goes as a route input; the insurance indication is 21's, OQ-93, D28); D45
([OQ-48](../../../../requirements-board/requirements/questions/OQ-48.md): the procedure date decides
which version is in force); D42 ([OQ-91](../../../../requirements-board/requirements/questions/OQ-91.md):
the office keeps first-party Contracts; an anaesthetist sees only their own); D23
([OQ-73](../../../../requirements-board/requirements/questions/OQ-73.md): prepayment only where a person
pays for the patient, which the interim flag obeys).
**Open, build the default (logged on the "For the owner's review" list, labelled provisional in one
place):** D32 [OQ-98](../../../../requirements-board/requirements/questions/OQ-98.md) (a holder's plain
RVG Contract has no lines and is offered for every procedure, by rule, when its holder fits); D33
[OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md) (the office may leave the procedure
blank at setup, choosing the Contract by holder or No contract (RVG), or set a group's general procedure
from the RVG codes tab; a procedure is required at completion, 21's block; Bookings with a blank
procedure show on the office's list); D37 [OQ-103](../../../../requirements-board/requirements/questions/OQ-103.md)
(No contract (RVG) or a plain RVG Contract picked from the RVG codes tab sets the group's general
procedure, named as 19 named it; the review flag on a general procedure is 21's).
**Pricing model in one place:** the candidate rules, the selection, the refresh on a change and the
interim who-is-billed live in `aa-prototype/src/domain/billing` (plus the seed), behind types the UI
reads, so a v5 of the draft design stays a contained edit. Reference shape:
[AR-28#booking-to-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md) and
[AR-28#what-the-anaesthetist-can-change](../../../../requirements-board/requirements/artifacts/AR-28.md)
(the plain-language guide, true as written),
[AR-29#contract-selection](../../../../requirements-board/requirements/artifacts/AR-29.md),
[AR-29#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md) and
[AR-29#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md) (the draft
technical design v4), and [AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md)
(its ERD).
**Estimated:** 2 sessions. Session 1: work items 1 to 10 (figures pinned; route, payment category and
insurer out; the interim prepayment flag; the selection rules, the store guard, the refresh and the
seed), ending green with the UI edited only as far as it must compile. Session 2: items 11 to 19 (the
picker after the two tabs, the anaesthetist's change, the RVG codes route, the "Needs a Contract" list,
creation forms, review, invoice wording, shots, demo guide). If session 1 overruns, finish green on
items 1 to 8 and 10 and open session 2 with item 9's vocabulary sweep; never defer the parity pin, the
category removal or the seed remap.

## Goal

Pricing becomes one decision. `BillingRoute`, `Procedure.insurerId` as a pricing input, the engine's
route resolution and its route-based payer derivation go (DM-10, RV-08, EP-04), and so does
`PatientPaymentCategory`, everywhere: this phase owns its removal (about 15 non-test files read it).
Each Procedure carries exactly one Contract (US-04.3.1).

The office sets the Contract at booking setup and it is mandatory (US-04.3.4): a Booking with a
Procedure that has no Contract stays on an admin **"Needs a Contract"** list until it is set. Nothing
is derived from the List's hospital (US-04.3.3; OQ-78 answered): there are no hospital, insurer or
procedure default Contracts, and integration and PDF creates arrive with no Contract for the office
to set.

The Contract pick follows the two-tab procedure pick (Phase 19) in one picker on mobile, web and Admin
(FT-04.3, US-04.3.2, US-03.3.1):

- **No contract (RVG) first, always**, under any search, holder filter or miss.
- Then the Contracts with a version valid on the procedure date and a line for the procedure, plus the
  holders' plain RVG Contracts (OQ-98's default, D32), whose holder fits the Booking (the List's
  hospital, the surgeon or rooms, and for a first-party Contract only that Booking's anaesthetist), in
  one list under holder headings.
- One composite search (AA code, holder codes, Contract and holder names) and the option to start
  from the holder (D16).
- **From the RVG codes tab** the list offers No contract (RVG) first, then every fitting line for any
  procedure in that group, each naming its procedure: a line sets its procedure, and No contract (RVG)
  or a plain RVG Contract sets the group's general procedure (OQ-103's default, D37).
- Per OQ-99's default (D33) the office may leave the procedure blank at setup, with the Contract
  chosen by holder or No contract (RVG); completion needs a procedure (Phase 21).

The anaesthetist can change the procedure or the Contract until the List is submitted (FT-03.4,
US-03.4.1), with no reason, audited and flagged at office review. On any change the resolver re-runs:
starting base and modifier units and any fixed price refresh, 19b's locked modifiers follow the
procedure, and a typed price is cleared when the new Contract is not adjustable (No contract (RVG) and
first-party Contracts are; a third party's price is read-only, AR-29#contract-behaviour). Phase 24
builds the anaesthetist's adjustment record and its gate; until then the price cleared is today's
`priceOverride`. The insurance-falls-through case is simply a switch to No contract (RVG). Additional
Procedures pick their own Contract (US-03.2.3) and the primary stays first (FT-03.2 Matches today:
carry it across).

Three interims keep the demo whole, each labelled in code and the Decisions log:

- **Who is billed**: the holder's billable party when the holder is billed; else the Procedure's
  existing `billablePartyId` override (the seeded BP0001 Hana Park, a guardian, and BP0002, the Aria
  clinic); else the patient. Phase 21 re-expresses the override as the payer on the Booking. This is
  one selector (20a shows it as "who is invoiced"; 21 re-points it). **One parity exception:** 18
  seeded `CH-DOYLE` (surgeon) as *not* billed while today's route still invoices Mr Doyle through 18's
  `routeCounterpartyForHolder`, and Phase 21 records moving the Doyle Bookings to the payer as its own
  deliberate change. So the interim takes the holder's party from `routeCounterpartyForHolder` (the
  billable party for a billed holder; Mr Doyle for `CH-DOYLE`; nothing for a first-party holder or a
  rooms holder with no party), and only then the override and the patient. Doyle's counterparty does
  not move in this phase.
- **`funderOverride`** stays the seeded two-funder split (Prentice, S3) until Phase 22's Split button.
- **Prepayment**: the payment category's prepayment meaning becomes an office-set
  `prepaymentRequired` flag on the Booking, carrying today's `prepaymentDetail` (full, or split with
  the seeded deposit) unchanged, until Phase 27 derives the flag from the anaesthetist's prepaid set
  and removes only the flag, the deposit and split paths and `prepaymentDetail`. The flag feeds 15a's
  unpaid-prepayment warning, never a completion gate (D5).

Keep the candidate rules, the selection and the refresh in one place in
`aa-prototype/src/domain/billing` behind types the UI reads (AR-28#booking-to-invoice,
AR-29#contract-selection and #booking-procedure-fields, AR-30#booking-procedure). The S3, S4 and S5
figures do not move, and the interim who-is-billed reproduces every seeded payer.

> Names below are today's names at `60e2d1e` (code unchanged since `b342a7d`, Phase 15a session 1).
> Use Phase 18's names for the holder master, dated versions, the stored No contract (RVG), the plain
> RVG Contracts and `contractSearch`; Phase 19's for the procedure list, the Procedure's link to it
> (planned as `procedureTypeId`), RVG groups, general procedures and the two-tab picker; Phase 19a's
> for Contract lines, the resolver and first-party Contracts; Phase 19b's for the modifier records
> and the locked-modifier helper; and 15b's `ACTIVE` List state, as their PROGRESS entries record them.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and open questions against the plan's baseline,
   catalogue commit `60e2d1e` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff EP-04,FT-04.3,US-04.3.1,US-04.3.2,US-04.3.3,US-04.3.4,FT-03.4,US-03.4.1,US-03.2.3,US-03.3.1,US-04.1.4,US-04.1.5,US-04.2.1,US-04.2.4,US-04.2.10,US-04.2.11,US-04.2.14,US-05.1.6,US-07.2.2,US-11.2.2,US-03.5.1,US-03.6.1,US-15.0.1,OQ-48,OQ-55,OQ-66,OQ-67,OQ-73,OQ-78,OQ-91,OQ-93,OQ-98,OQ-99,OQ-103
   ```

   At plan time (2026-10-08, `3d3a18c..60e2d1e`) the changes that touch this phase were: FT-04.3 moved
   to Confirmed and was rewritten around the two tabs, holder fit and the RVG codes route; US-04.3.2
   to Confirmed, with holder headings, start from the holder, composite search and the RVG codes route
   (surgeon and group bullets gone); US-04.3.3 became "No contract (RVG) always offered first" (one
   stored Contract, no holder, no lines; nothing derived from the location); US-04.3.4 made the
   Contract mandatory with a list of Bookings without one, and noted the blank-procedure ask (OQ-99);
   US-04.3.1 gained Greg's agreement; FT-03.4 and US-03.4.1 add the procedure change, no reason, the
   refresh, the cleared typed price and the falls-through case; US-03.3.1 became "Pick the procedure
   and Contract, with starting units" (Verify); US-03.2.3 only gained links; EP-04 was rewritten around
   contract holders. OQ-78, OQ-91 and OQ-48 were answered; OQ-98, OQ-99 and OQ-103 are new and open;
   FT-04.4, US-04.4.1 and US-04.4.2 were retired. The plan already reflects all of this; diff only for
   anything after `60e2d1e`.
2. If an item changed since `60e2d1e`, re-read it and adjust the work items. If one is now Retired or
   Future, drop it and record that in the PROGRESS entry. **If OQ-98, OQ-99 or OQ-103 has been
   answered**, build the answer instead of the default and drop its provisional caption (item 11).
   **If Greg has come back on OQ-78** (who No contract (RVG) bills), record it: the who-is-billed
   selector (item 4) is the one place to change.
3. **Confirm what 15a, 15b, 18, 19, 19a and 19b delivered** (their PROGRESS entries):
   - 15a and 15b: the warning routine and the `prepaymentUnpaid` rule's input
     (`facts.prepaymentStatus`); whether 15a's session 2 built `WARNING_SAMPLES` and its prepayment
     sample (planned to stage the condition through the route, category and `prepaymentDetail`
     fields this phase deletes); that the completion gate, `overridePrepaymentGate`,
     `PrepaymentOverrideSheet` and `copyBooking` are gone; what is left of photo capture (at most a
     badged Future-scope demo); that assigned Lists are `ACTIVE`.
   - 18: the holder master (fields, the "is the holder billed" flag and its billable party, AR-29
     #contract-holder-fields); dated versions and how "in force on a date" is asked; the id of the
     stored No contract (RVG); which holders got a plain RVG Contract in place of their default Type 1
     (each hospital, nib) and whether today's resolver still falls back to them (the no-version
     fallback with `billedAs`, item 6); `routeCounterpartyForHolder` and the seeded `CH-DOYLE` (not
     billed, still invoiced by the route; item 4); `aaCode`, `contractMatchesQuery` and
     `contractSearch`, the catalogue's holder and active filters; that the ACC review advisory is gone
     (RV-20).
   - 19: the procedure list, the Procedure's link to it and whether it may be blank, RVG groups, the
     general procedure per group and its name, the two-tab picker component, `pickProcedure` and the
     out-of-range warning rule.
   - 19a: Contract lines (keyed by procedure, with fixed price, fixed rate, fixed discount, base and
     modifier units, holder code), `lineFor`, `isPlainRvgContract`, `lineSearchText`,
     `ownPriceListFor`, the resolver's name, inputs and layer output, first-party Contracts, how
     the S3 fixed-rate and fixed-price Contracts were carried across (US-05.2.6), and which lines got
     demo holder codes (whether any Christchurch Eye Surgery-held line carries `HNZCATall`; item 8
     seeds one if not).
   - 19b: modifier records on the Procedure and the helper that applies the locked age and P1
     modifiers for a procedure.

   If 18 left no stored No contract (RVG), or 19a left no lines keyed by procedure, stop and record
   it: this phase builds neither.
4. Record the result (including "no drift") in the PROGRESS entry.

## Reference

- **Design** (convention 17): `docs/design/Design Language.dc.html` (tokens; neutral pills; teal is the
  only action colour, so the picker's tick and every "Change" are teal, never crimson);
  `docs/design/Mobile App.dc.html` (Booking detail anatomy: white cards with micro-cap headings, 14px
  radius, bottom-sheet rows for choices, the code picker sheet's search field);
  `docs/design/Admin Review.dc.html` (review table: its CONTRACT column shows who pays, the layout this
  phase moves to); `docs/design/Admin Day.dc.html` (right rail, drawer and Booking-detail chrome). No
  mockup covers the Contract step: extend 19's two-tab picker (a bottom sheet on mobile, a Dialog on
  web and Admin) with a second step in the same sheet.
- **Pricing model (draft v4; may change):** [AR-29#contract-selection](../../../../requirements-board/requirements/artifacts/AR-29.md)
  (office picks, the default first by rule not by line lookup, candidates valid on the date with a
  line and a fitting holder, the anaesthetist may change until submit, the resolver re-runs, a
  non-adjustable Contract clears the typed price and discount),
  [AR-29#booking-procedure-fields](../../../../requirements-board/requirements/artifacts/AR-29.md)
  (`procedure_id`, `contract_id`: office at setup, the anaesthetist may change),
  [AR-29#contract-behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md) (the adjustable
  rule; who is billed per kind), [AR-30#booking-procedure](../../../../requirements-board/requirements/artifacts/AR-30.md);
  [AR-28#booking-to-invoice](../../../../requirements-board/requirements/artifacts/AR-28.md) and
  [AR-28#what-the-anaesthetist-can-change](../../../../requirements-board/requirements/artifacts/AR-28.md).
- **Catalogue:** the covered files above, the "leans on" items, OQ-48, OQ-55, OQ-66, OQ-67, OQ-73,
  OQ-78, OQ-91, OQ-93, OQ-98, OQ-99, OQ-103; the notes
  `requirements-board/requirements/notes/2026-10-07-aa-meeting-with-greg.md` (#14, #16, #18, #19, #20,
  #50, #51, #52, #55, #59, #60), `2026-10-07-aa-client-meeting.md` (#26, #27, #28),
  `2026-10-07-pricing-model-documents.md` (#10, #11, #12, #27) and
  `2026-10-08-procedure-picker-and-source-text.md` (#2 to #5) (read the cited passages with
  `npm --prefix requirements-board run source -- --item <ID> --text`); the change logs
  `requirements-board/requirements/changes/2026-10-07-requirements-update.md` (the EP-04 and FT-04.3
  rows, section 9) and `2026-10-08-procedure-picker-and-source-text.md` (section 6); and
  `domain-model.md` ("Contract (draft structure)" and "Patient, payer and billable party").
- **Gap analysis:** `GAP-ANALYSIS.md` (Summary, the pricing themes, the DM-10 and RV-08 rows);
  `epics/EP-04.md` and `epics/EP-03.md` for these items; `gaps.json` (EP-04 and US-04.3.3 Contradicts;
  US-03.3.1 Contradicts; FT-04.3, US-04.3.1, US-04.3.2, US-04.3.4, FT-03.4, US-03.4.1 and US-03.2.3
  Partial); `analysis/domain-model-delta.md` (DM-07, DM-09, DM-10, DM-11, DM-13, DM-43, DM-48, DM-49,
  DM-50); `analysis/reverse-check.md` (RV-08, RV-09, RV-33).
- **Code entry points** (line numbers at `60e2d1e`, before Phases 15b to 19b edit these files; locate
  by name):
  - `src/domain/types.ts`: `BillingRoute` 418, `PatientPaymentCategory` 425, `PrepaymentDetail` 435,
    `Procedure` 453 (`billingRoute` 462, `governingContractId` 463, `insurerId` 469, `billablePartyId`
    475, `patientPaymentCategory` 477, `prepaymentDetail` 479, `accRelated` 486), `Booking`, `List`,
    `AuditEntry`.
  - `src/domain/billing/invoiceBuild.ts`: the `noBillingRoute` code 66 and 180, the private
    `defaultContractFor` 86, `resolveContractForProcedure` 114, `counterpartyForProcedure` 192,
    `buildPrePaymentInvoiceForBooking` 456. `validateBookingForBilling.ts`: `billingReferenceMissing`
    49, the insurer-route direct-claims check around 166 to 181, the category check 188, the
    prepayment checks 204 to 215. `contracts.ts` (`selectContract`), `fixtures.ts`.
  - `src/store/bookingActions.ts` (`createBooking` 78, `addPostOpAddendum` 290, `addProcedure` 422;
    `copyBooking` 196 is 15b's to delete); `lifecycle.ts` (`editRefusal` 48, `editProcedure` 438,
    `editList` 491, `reassignBooking` 635); `integrationActions.ts` (S12 `createBooking` 150 with
    `billingRoute: 'hospital'` 158; `ingestPdfRow` 434, its `createBooking` 467 with the same stamp
    475); `prepaymentActions.ts`; `selectors.ts` (`bookingRequiresPrepayment` 307,
    `prepaymentStatusFor` 372, `billingContextForBooking` 836); 15a's `warningSamples.ts` if session 2
    built it, and `domain/warnings/rules/prepaymentUnpaid.ts` (reads `facts.prepaymentStatus`, so its
    wording and strength need no change).
  - **`PatientPaymentCategory` / `patientPaymentCategory` readers (all go here):**
    `domain/types.ts`, `domain/billing/invoiceBuild.ts`, `domain/billing/validateBookingForBilling.ts`,
    `domain/seed/bookings.ts`, `domain/seed/history.ts`, `domain/seed/audit.ts`, `store/bookingActions.ts`,
    `store/selectors.ts`, `shared/booking/OfficeBillingSetup.tsx`, `shared/capture/BtmCaptureBlock.tsx`,
    `shared/audit/fieldLabels.ts`, `shared/flows/EditBillingSetupSheet.tsx`,
    `shared/flows/ManualBookingForm.tsx`, `shared/flows/EditProcedureSheet.tsx`,
    `apps/admin/screens/InvoiceDocument.tsx` (`PaymentCategoryNote` 149 and 496); tests
    `validateBookingForBilling.test`, `prePaymentInvoice.test`, `invoiceBuild.test`, `billingRun.test`,
    `postOpAddendum.test`, `bookingActions.test`. `prepaymentDetail` is also read by
    `auditNarrative.test`. Earlier phases may have added readers: re-run the grep.
  - `src/shared/flows/EditProcedureSheet.tsx`, `EditBillingSetupSheet.tsx` (the unfiltered select with
    "None (default pricing)"), `ManualBookingForm.tsx` (route state 67, the prefill 92);
    `src/shared/booking/OfficeBillingSetup.tsx`, `BookingDetailBody.tsx`;
    `src/shared/capture/BtmCaptureBlock.tsx` (`ROUTE_LABEL` 17, `CONTEXT_FIELDS` 24, the
    `procedure-contract` line), 19's procedure picker; `src/shared/format.ts` (`ROUTE_LABELS` 37,
    `routeLabel` 43); `src/shared/audit/` (`fieldLabels.ts`, `actionLabels.ts`).
  - `src/apps/admin/reviewFlags.ts`, `screens/ReviewScreen.tsx` (route set 78, the "Route" header
    244), `screens/BillingMonitorScreen.tsx` (`resolveAndRetry`, unchanged),
    `screens/InvoiceDocument.tsx`, `flows/PhoneAdviceBooking.tsx` (S2 prefill 33 and 34:
    `billingRoute: 'hospital'`, `insurerId: 'I-NIB'`), the Admin Day right rail (where 15a's To-do card
    sits); `src/apps/mobile/screens/ListDetailScreen.tsx`; `src/apps/web/screens/ListDetailView.tsx`.
  - Seed: `src/domain/seed/bookings.ts` (`ProcedureSpec` 248, `billablePartyId` overrides at 730 and
    883 (BP0002, Aria clinic) and 818 (BP0001, guardian), `morrisonSpecs`, the Prentice `funderOverride`,
    the Doyle bariatric case, the filler route draw; locate the Marsh nib insurer route, the Webb AIA
    reimbursement, Riley's split $800 and Nair's full prepayment by text), `patients.ts` (`BP`),
    `contracts.ts`, `cast.ts` (nib direct claims), `history.ts`, `audit.ts`, `index.ts` (scenario marker
    `insuredReimbursementBooking`).
  - Tests that name routes today: `reviewFlags.test`, `invoiceBuild.test`, `prePaymentInvoice.test`,
    `validateBookingForBilling.test`, `seed.test`, `billingRun.test`, `captureActions.test`,
    `bookingActions.test`, `postOpAddendum.test`, `btmCapture.test`, `prepayment.test`,
    `mastersActions.test`, `auditNarrative.test`, `demoScenarios.test`, `integrationActions.test`.
  - Shots: `visual/mobile-interactions.spec.ts` (clicks "Billing route"), `admin-phase06.spec.ts`
    (office billing setup), `admin-phase07.spec.ts` (review table).

## Work items

**Session 1: model, engine, store, seed.**

1. **Pin the figures first.** Before changing any code, extend the parity harness Phases 18, 19, 19a
   and 19b left (whatever their PROGRESS entries name). Add `src/store/contractParity.test.ts` only
   for what it does not already pin, with literals generated from the current build:
   - the counterparty (`kind:id`) of every seeded non-cancelled Procedure, from today's
     `resolveContractForProcedure` and `counterpartyForProcedure`;
   - each seeded Procedure's resolved starting base and modifier units (19a's resolver, 19b's locked
     modifiers) and any fixed price;
   - the invoice totals and counterparties the billing run produces for Souter Mon 20 AM and PM (S3:
     Holt, Prentice nib plus St George's), Whitaker Fri 17 (S5), Ropata Thu 16 (S4 Beat 3: the COS
     failure isolated, its sibling billed), Fitzgerald's rate x time, the Doyle bariatric case, and the
     prepayment builds (Riley $800 split, Nair full netting its balance to $0) with their ledger and
     draft Xero pairs (US-09.1.3).

   Items that Match only because of the old model are carried across here, with these fixtures as
   their parity tests: US-05.2.6's fixed rate (18 and 19a re-expressed Type 2's agreed rate), FT-03.2's
   primary Procedure (first, `isAdditional` false), FT-08.2's grouping by counterparty, FT-05.5's ACC as
   an ordinary holder and US-09.1.3's prepayment Xero pair. They must pass unchanged at the end of the
   phase. Only the harness's context-building code may change; never update a fixture with `-u`.
2. **Types** (`domain/types.ts`):
   - Delete `BillingRoute`, `PatientPaymentCategory`, `Procedure.billingRoute`,
     `Procedure.insurerId` (D2 as superseded: the insurance indication is 21's, OQ-93, D28; put nothing
     on the Booking or Patient here) and `Procedure.patientPaymentCategory`.
   - Move `prepaymentDetail` from the Procedure to the Booking, beside a new
     `prepaymentRequired?: boolean`, both commented "INTERIM office-set flag (Phase 20); Phase 27
     derives it from the prepaid set and removes the flag, the split and deposit paths and
     prepaymentDetail". Keep `PrepaymentDetail` as it is, so Riley's seeded deposit keeps its figures.
   - The Procedure keeps its Contract field (`governingContractId`, or 18's name), optional in the
     type: a Procedure with none is the legitimate "Needs a Contract" state before completion. Add no
     `contractSetBy`: there are no defaults to re-apply, and who changed it comes from the audit trail.
   - `billablePartyId` stays on the Procedure, commented "INTERIM override until Phase 21's payer on
     the Booking". `accRelated` stays as 18 left it.
   - The Procedure's link to the procedure list (19's) may be blank (OQ-99, D33). If 19 made it
     required, make it optional here and log it.
3. **Pure Contract selection** (new `domain/billing/contractSelection.ts`, exported from the billing
   index, with `contractSelection.test.ts`; AR-29#contract-selection). This file is the one place for
   the candidate rules; the store and every surface read it.
   - Types the UI reads: `ContractSelectionContext` (`procedureDateISO`, the List's date; `hospitalId`;
     `surgeonId` and, through 17, the surgeon's rooms; `anaesthetistId`; and either `procedureTypeId`
     (a procedure-list entry, 19's name; `procedureId` stays the booking Procedure's id, as everywhere
     in the store), or `rvgGroupId` (from the RVG codes tab), or neither (a blank procedure));
     `ContractCandidate` (`contractId`, the version in force, `holderId` or none, `lineId` or none, the
     procedure it would set and how: `'keep'`, `'line'` or `'general'`, and `matched` when a search hit
     a code); `ContractCandidates` (`noContract`, `groups: { holder, candidates }[]`, `total`).
   - `contractCandidatesFor(masters, ctx, { query?, holderId? })`:
     - **No contract (RVG)** (18's stored one) is always first, by rule rather than by line lookup,
       and stays under any query, holder filter or miss (US-04.3.3).
     - **A Contract is a candidate** when (a) it has a version in force on the procedure date and is
       not retired (18's versions; D45); (b) that version has a line for the picked procedure (19a; a
       combination Contract's line under each parent is just a line, US-04.2.11), or it is a holder's
       **plain RVG Contract** with no lines, offered for every procedure by rule (OQ-98's default, D32);
       and (c) **its holder fits** the Booking: a hospital holder is the List's hospital; a surgeon or
       rooms holder is the Booking's surgeon or that surgeon's rooms; a first-party holder is the
       Booking's anaesthetist only (D42: an anaesthetist never sees a colleague's); an insurer (or any
       holder 18 seeded with no place of its own, such as ACC if it is a holder) fits every Booking,
       because no Booking holds an insurer until 21's insurance indication (OQ-93, D28), which may
       order but never narrows. Log that reading.
     - **From the RVG codes tab** (`rvgGroupId`): the candidates are No contract (RVG), then every
       fitting line for any procedure in the group, each naming its procedure (sets `'line'`), and the
       fitting plain RVG Contracts (set `'general'`, the group's general procedure, OQ-103's default,
       D37). No contract (RVG) sets `'general'` too.
     - **With a blank procedure** (OQ-99's default, D33): No contract (RVG) and the fitting plain RVG
       Contracts; when the user started from a holder, that holder's fitting Contracts too, with the
       procedure left blank for the anaesthetist (a lined Contract then offers only its lines'
       procedures in 19's picker). Log the reading.
     - **One list under holder headings** (18's holder name; a first-party heading reads the
       anaesthetist's name), holders in name order, Contracts by name within each.
     - **Search** wraps 18's matcher `contractMatchesQuery` (with 19a's `lineSearchText` added to it)
       over the candidate set only, never 18's catalogue-wide `contractSearch` and never a second
       matcher: AA code, each line's holder code, the Contract's name, the holder's name and, from the
       RVG codes tab, the line's procedure name.
     - **Reuse, never re-implement:** 18's `noContractOf` / `isNoContract` and `versionInForce`; 19a's
       `lineFor`, `isPlainRvgContract` and `ownPriceListFor` (the first-party fit) and its resolver;
       19's general procedure per group. This file adds only the fit, the ordering and the grouping. An exact AA-code or holder-code match sorts first,
       with what matched (`"AA code <code>"`, `"<holder code> · <line description>"`).
     - **Start from the holder:** `holderId` narrows to that holder's candidates; No contract (RVG)
       stays first.
   - `isCandidate(masters, ctx, contractId, lineId?)`: the same rule without a query, for the store
     guard, the "no longer fits" check and the review flag.
   - `refreshOnChange(masters, procedure, next)` (pure): what a change of procedure or Contract
     writes, in one result: the procedure to set (from the candidate), starting base and modifier units
     re-resolved through 19a's resolver (line, then procedure, then RVG group, AR-29#resolver-layers),
     19b's locked modifiers for the new procedure, any line-derived figure the Procedure stores
     re-resolved, and `clearTypedPrice` when the new Contract is not adjustable (No contract (RVG) or a
     first-party holder is; a third party is not; AR-29#contract-behaviour). Starting units replace the
     recorded ones, as the catalogue's "refresh" says (US-03.3.1, US-03.4.1); log that reading.
     Phase 24 builds the adjustment record and its gate and reads the same adjustable rule; it does not
     add a second one.
   - `anaesthetistChangeFor(entries, procedureId)` (pure): when the latest procedure or Contract audit
     entry for that Procedure has the anaesthetist role, `{ who, atISO, from, to }` naming the
     procedure and Contract before and after; else nothing. An office pick after it clears it (interim
     until 21's approval at review, US-07.2.2).
   - Tests: the US-04.3.2 example (a St George's Contract is never offered on a Southern Cross List);
     No contract (RVG) first under a query, a holder filter and a miss; a Contract without a line for
     the procedure is not offered, a plain RVG Contract is; validity on the procedure date (a version
     ending the day before is out, the next version in); each holder kind's fit (hospital, surgeon,
     rooms, first party: anaesthetist A's Booking never offers B's; insurer everywhere); the RVG codes
     route (lines across the group, each naming its procedure; No contract (RVG) and plain RVG set the
     general procedure); the blank procedure; AA-code, holder-code (`HNZCATall` on a Christchurch Eye
     Surgery List; the same code on a Southern Cross List finds nothing) and name search; start from
     the holder; `refreshOnChange` (units from a line, from the procedure, from the group; P1 added and
     removed with a Neurosurgery or Spine procedure; typed price cleared on a third-party Contract and
     kept on No contract (RVG) and first-party); `anaesthetistChangeFor`; deterministic order.
4. **Who is billed, interim** (new `domain/billing/whoIsBilled.ts`, with a test; Phase 21 rewrites
   this file in place): one pure
   `billedPartyFor(procedure, contract, holders, booking)`: the Contract's holder's party as 18's
   `routeCounterpartyForHolder` gives it (the billable party for a billed holder, and Mr Doyle for the
   not-billed `CH-DOYLE`, which today's route still invoices; undefined for a first-party holder or a
   rooms holder with no party); else the Procedure's `billablePartyId` override; else the patient. Do
   not key it on `billsHolder` yet: that would move the Doyle Bookings to the patient, which is Phase
   21's recorded change, and break item 1. Commented "INTERIM until Phase 21's payer on the Booking
   (US-11.2.2), which deletes this and `routeCounterpartyForHolder`; 20a shows it as 'who is
   invoiced'". `counterpartyForProcedure` delegates to it; `funderOverride` lines behave as today
   (22). Tests: COS gives `{ organisation, ORG.cos }`, Doyle `{ surgeon, SURG.doyle }`, Aria `BP0002`,
   No contract (RVG) with Grace Park's BP0001 override gives BP0001, without an override the patient.
5. **Validator** (`validateBookingForBilling.ts` and test; US-04.3.1):
   - Remove the route, insurer-route direct-claims and payment-category checks.
   - Add the Contract failures: missing ("Choose a Contract for this procedure.") and dangling ("The
     selected Contract no longer exists. Choose another.").
   - The prepayment check moves to the Booking and is only the split-deposit check that guards the
     seeded data (today's wording).
   - Re-key `billingReferenceMissing` from the route to the holder: a hospital, surgeon or rooms holder
     expects a reference; an insurer, a first-party holder and No contract (RVG) do not. Interim until
     21's holder reference rules; update both callers (`OfficeBillingSetup.tsx`, `reviewFlags.ts`) and
     check it reproduces the Morrison missing-reference flag.
   - Keep the check that `billablePartyId` resolves. Keep whatever procedure check 19 left (a blank
     procedure must not complete; if 19 left none, add "Choose the procedure." and note that 21 owns
     the full completion list). The Method 3 gate is 24's.
6. **Engine** (`invoiceBuild.ts` and tests):
   - `resolveContractForProcedure` reads only the stored Contract: none is the run exception
     `noContract` ("No Contract is selected on this procedure. Choose one before billing."); a dangling
     id is `contractMissing`; no version in force on the procedure date is `contractIneffective`
     (S4 Beat 3's COS failure and `BillingMonitorScreen`'s `resolveAndRetry` depend on it). Delete the
     `noBillingRoute` code and its UI copy, the route branch, the fallbacks 18 kept for parity (a
     hospital or insurer Contract with no version in force falling to No contract (RVG) with the
     interim `billedAs` counterparty, and nothing stored on the hospital route billing the List's
     hospital; delete `billedAs` with them), and the rank-based `selectContract` if it survived (the
     picker replaces it, DM-07). Item 8's seed remap leaves no seeded Procedure relying on them.
   - `buildPrePaymentInvoiceForBooking` reads the Booking's `prepaymentRequired` and
     `prepaymentDetail` and covers the Procedures whose billed party (item 4) is a person (OQ-73): a
     split raises the seeded deposit line on the first covered Procedure, a full prepayment each
     covered Procedure's fee through `feeFor` with its own Contract. Its ledger pair and draft Xero pair
     are unchanged (US-09.1.3). No new wording: Phase 27 replaces the amount with the fixed price.
7. **Store actions** (new `store/contractSelectionActions.ts`; tests in `contractSelectionActions.test`,
   `bookingActions.test`, `prepayment.test`):
   - **`setProcedureContract(api, actor, procedureId, { contractId, lineId? })`**: checks `editRefusal`
     (anaesthetist: own `ACTIVE` Lists only; office: `ACTIVE` and SUBMITTED; AUTHORISED refused);
     refuses `notFound`, `contractNotInEffect` and `contractOutOfScope` ("That Contract does not apply
     to this procedure for this Booking."); applies `refreshOnChange` in the same commit (the procedure
     a line or the general procedure sets, the units, the locked modifiers, the cleared price); writes
     one audited `procedure.contract` entry with the Contract before and after and, where they change,
     the procedure, the units and the cleared price. The audit role is what flags the change.
   - 19's `pickProcedure` (or its name) gains the same refresh in its commit. The Contract is kept when
     it is still a candidate for the new procedure (No contract (RVG), a plain RVG Contract, or a line
     for it); otherwise it is kept and shows as "no longer fits" (item 13) and the UI opens the Contract
     step straight after the procedure step (item 12).
   - Remove the Contract field and every deleted field from `ProcedurePatch`, so `editProcedure`
     cannot bypass the guard.
   - **Creation (US-04.3.4):** `createBooking` drops `billingRoute`, `insurerId` and
     `patientPaymentCategory`, and takes an optional Contract pick, checked as above. With no pick the
     Procedure has no Contract and the Booking appears on the "Needs a Contract" list: nothing is
     derived from the hospital (US-04.3.3). The S12 and PDF creates (`integrationActions.ts`) drop their
     `billingRoute: 'hospital'` stamp and pass no Contract; a hospital message never names one
     (US-04.3.6 is Future). The photo path, if 15b kept it as a badged demo, does the same. If
     `copyBooking` survived 15b, stop and record it.
   - **`addProcedure` (US-03.2.3)** takes an optional procedure and Contract pick, checked as above;
     with none the new Procedure has no Contract. It copies the first Procedure's `billablePartyId`
     override (interim, so a guardian-paid Booking's second Procedure bills the same person). The
     primary stays first (FT-03.2).
   - `addPostOpAddendum` copies the original Procedure's Contract (same procedure), not the Booking's
     prepayment flag, until 38b replaces the addendum.
   - **Hospital, surgeon or reassign changes** (`editList`, `reassignBooking`, a surgeon edit) re-default
     nothing. Stored Contracts that no longer fit stay and are listed (item 13).
   - **Prepayment flag:** `setBookingPrepayment(api, actor, bookingId, on)` in `prepaymentActions.ts`:
     office only; refused on AUTHORISED or billed Lists; on sets `prepaymentRequired` with
     `prepaymentDetail: { type: 'full' }` (no deposit input), off clears both; refused when no
     Procedure's billed party is a person (`noPersonBilled`, "Prepayment applies only when a person
     pays for the patient.", OQ-73, D23) and once a prepayment invoice exists (`prepaymentInvoiced`);
     audited `booking.prepayment`. `bookingRequiresPrepayment` and `prepaymentStatusFor` read the
     flag, so 15a's `prepaymentUnpaid` rule needs no change. The `raisePreProcedureInvoice` refusal
     reads "This booking is not flagged for prepayment." No gate returns (D5); if any part of the old
     gate survived, stop and record it.
   - **15a's prepayment sample**, if session 2 built `WARNING_SAMPLES`: re-point it at the flag.
     `stage` sets the target's flag with `setBookingPrepayment(on)` (first moving its first Procedure
     to No contract (RVG) with `setProcedureContract` when nobody personal pays), as the demo-trigger
     actor; `unstage` restores the Booking's flag and detail and the Procedure's Contract fields from
     the pristine seed. Update its test. Phase 27 re-points it at the prepaid set.
   - **Selectors:** `contractCandidatesForProcedure(state, procedureId, opts)`,
     `contractCandidatesForNewBooking(state, listId, pick, opts)`, `billedPartyForProcedure(state,
     procedureId)`, `pendingAnaesthetistChange(state, procedureId)` and `needsContractBookings(state)`:
     the Bookings, across all dates and sorted by date, with a Procedure that has no Contract, a blank
     procedure (D33), or a stored Contract that no longer fits (`isCandidate` false), each with its
     reason.
8. **Seed** (`seed/bookings.ts`, `history.ts`, `audit.ts`, `contracts.ts`, `index.ts`):
   - `ProcedureSpec` loses the route, insurer and category fields; `addBooking` takes
     `prepaymentRequired` and `prepaymentDetail`. Map every seeded Procedure:

     | Today | After this phase |
     |---|---|
     | Hospital route with a stored Contract | The same Contract; any informational insurer dropped |
     | Hospital route with none stored (today's default fallback) | That hospital's plain RVG Contract, which 18 left in place of its default Type 1 (the holder is billed) |
     | Insurer route, nib (Marsh, the filler) | nib's Contract: its line for the procedure, else nib's plain RVG Contract |
     | Billable-party route, self-funded | No contract (RVG); the `billablePartyId` override stays (interim) |
     | Billable-party route, insured reimbursement (Webb, AIA) | No contract (RVG); AIA stays only in the description |
     | Billable-party route, prepayment (Riley split $800, Nair's rhinoplasty full) | No contract (RVG); the Booking's `prepaymentRequired` with `{ split, 800 }` and `{ full }`; Nair's septoplasty unchanged |
     | Billable-party route under the Aria hourly Contract | The same Contract; BP0002 (Aria clinic) keeps the payer |
     | `history.ts` patient-route history | No contract (RVG); the rest keep their Contracts |

   - Run `isCandidate` over every seeded Procedure and resolve each miss in the seed so item 1's
     figures hold: the Doyle bariatric Booking (Fitzgerald Tue 14, Southern Cross / Mr Doyle), the SXAP
     picks, Aria's first-party or rooms holder, the ACC and Health NZ picks, and the six eye Bookings on
     Souter's Wed 22 Christchurch Eye Surgery List (today on `cesDefault`, after 18 the Christchurch Eye
     Surgery plain RVG Contract). Log each call.
   - **A holder code to search on a Christchurch Eye Surgery List** (US-04.3.2's holder-code
     criterion; the catalogue's example is CES `HNZCATall`, domain-model.md). Neither 18 nor 19a plans
     one (19a's demo holder codes are SXAP-style `AP0126`, a Health NZ code and Doyle's `BAR-01` to
     `BAR-03`). If none is seeded by then, add one Contract held by Christchurch Eye Surgery,
     "Christchurch Eye Surgery · Health NZ cataract schedule" with an AA code in 18's format and a
     version in force on 22 Jul, whose lines cover the cataract procedures in 19's list (the 42702
     procedure at least) with holder code `HNZCATall`, description "Cataract, all" and a demo fixed
     price, commented as demo values. Do not add lines to the plain RVG Contract (it would stop being
     plain and drop the vitrectomy Bookings' fit). Move no seeded Booking onto it, so item 1's figures
     hold; it exists for the picker, the holder-code search test, the manual test and the
     `holder-code` and `narrows-picker` shots.
   - Seed the "Needs a Contract" list so it is not empty at reset, on Lists no beat uses: one future
     Booking with no Contract, and one with a blank procedure on No contract (RVG) (D33).
   - Seed one anaesthetist change for the review demo with nothing stored changing: on Dr Morrison's
     SUBMITTED Mon 20 St George's List, the 10:00 "Ureteroscopy with lithotripsy, ACC claim" (ref
     ACC45-118203, `morrisonSpecs`), already on St George's ACC Contract, gets a `procedure.contract`
     audit row by Dr Kate Morrison (anaesthetist role) from No contract (RVG) to St George's ACC Contract,
     timed before the List's 13:10 submit. Its Contract, units, fee and payer are unchanged.
   - Regenerate `audit.ts` histories so `procedure.create` and `procedure.update` entries carry
     Contract fields, not routes or categories.
   - Rename the scenario marker `insuredReimbursementBooking` (`index.ts`, `billingRun.test`) to
     `aiaClaimBooking`.
   - Keep the filler generator's `rng()` draw order and count (the route draw becomes the Contract
     draw).
   - Bump `PERSIST_VERSION` by one from its post-19b value, with a comment line.
9. **Remove the retired vocabulary (RV-08):**
   - `ROUTE_LABELS` and `routeLabel` (`format.ts`); the route and category maps in `BtmCaptureBlock`,
     `OfficeBillingSetup`, `EditProcedureSheet`, `EditBillingSetupSheet`, `ManualBookingForm` and
     `InvoiceDocument`; the insurer selects and their " (direct claims)" suffix; the S2 prefill's
     route and `I-NIB` in `PhoneAdviceBooking`; the route set in `ReviewScreen`; any route-keyed review
     flag 18 left.
   - In `shared/audit/`: fields `governingContractId` "Contract", `prepaymentRequired` "Prepayment
     required"; actions `procedure.contract` "Contract changed", `booking.prepayment` "Prepayment flag
     set"; drop the labels of the removed fields.
   - Gates: `grep -rnE "billingRoute|BillingRoute|patientPaymentCategory|PatientPaymentCategory|ROUTE_LABELS?|routeLabel|noBillingRoute|insuredReimbursement|selfFundedPrepayment|selfFundedPostProcedure" aa-prototype/src`
     returns nothing; every remaining `insurerId` hit is the Insurer master, a Contract holder or a
     `funderOverride`; and `prepaymentDetail` appears only on the Booking.
10. **Session 1 exit:** fix the listed tests (and `fixtures.ts`, and 15a's sample test if it exists).
    Edit the UI only as far as compiling needs: route, insurer and category controls removed, the
    Contract shown read-only where the route chip was. `npm run build`, `npm run build:pwa` and
    `npx vitest run` green; item 1 passes. Write a short "session 1 done" note in the PROGRESS entry.

**Session 2: the picker, the anaesthetist's change, the list, creation forms, review.**

11. **The Contract step** (new `src/shared/flows/ContractPickerSheet.tsx`, or a second step inside 19's
    two-tab picker if that reads better; through `useSurface().Overlay`, a bottom sheet on mobile and a
    Dialog on web and Admin; `data-shot="contract-picker"`):
    - A search field, "Search by name, AA code or holder code", and a "Start from a holder" chooser
      listing the fitting holders; both feed `contractCandidatesFor`.
    - **No contract (RVG)** as the first row, always visible, with one mist line "Standard RVG pricing".
    - Then the candidates under holder headings. Each row: the Contract's name and AA code; from the
      RVG codes tab, the line's procedure ("for <procedure>"); a code match adds what matched as a mist
      caption. The anaesthetist's rows and the office's are the same (pricing basis and who is invoiced
      are 20a's stack, US-03.1.2); the anaesthetist's list simply never holds a colleague's first-party
      Contract.
    - At most 50 rows, with "Showing 50 of <n>. Type to narrow." below.
    - **The one provisional caption** (D32, D33, D37), office view only, a mist line at the foot:
      "Provisional · plain RVG Contracts for every procedure, a blank procedure at setup and the general
      procedure from an RVG code are still to confirm with AA". Nowhere else. OQ-78 and OQ-66 are
      answered and carry no label.
    - The selected row carries a teal tick. Picking calls `setProcedureContract` (or sets the creation
      form's pick) and shows any refusal verbatim. Empty states: "No Contracts for this procedure at
      <hospital>. No contract (RVG) is always available." and "No Contract matches "<query>"." (No
      contract (RVG) stays above it). There is no "None".
12. **Procedure then Contract, and the anaesthetist's change (US-03.3.1, US-03.4.1, FT-03.4):**
    - On mobile, web and Admin, 19's two-tab pick flows straight into the Contract step. A procedure
      pick offers that procedure's candidates; an RVG-code pick offers the lines across the group
      (item 3), and the chosen row sets the procedure.
    - On the Procedure, a Contract row (name and AA code, teal "Change") replaces the route chip in
      `BtmCaptureBlock` and the route control in `EditProcedureSheet`. The anaesthetist can change the
      procedure or the Contract on their own `ACTIVE` List, with no reason; on SUBMITTED it is
      read-only. Caption: "The office sees any change to the procedure or Contract when you submit the
      list."
    - After a change, a one-line notice says what refreshed: "Starting units refreshed for the new
      Contract." and, when it happened, "Your typed price was cleared: this Contract's price is set by
      its holder."
    - A pending anaesthetist change shows a warning-tint pill: "Changed by you · office to check" on
      anaesthetist views, "Changed by anaesthetist" on the office's.
    - `CONTEXT_FIELDS` swaps the route and insurer fields for the Contract. 20a rebuilds this row into
      the three-part stack; keep it a small component it can replace.
13. **"Needs a Contract" (US-04.3.4):**
    - A card on the Admin Day right rail, under 15a's To-do card (leave room below for 31's Draft Lists
      and 32's notification pool), headed "Needs a Contract", reading `needsContractBookings`: patient,
      List date, session and hospital, and a reason pill ("No Contract", "Procedure to choose",
      "Contract no longer fits"); a row opens the Booking drawer at that Procedure. Empty state: "Every
      Booking has a Contract." It is not a warning and has no Clear: a row leaves only when the
      Contract is set.
    - On the Booking (all three apps), a Procedure with no Contract shows "No Contract yet" with a teal
      "Choose Contract" for whoever may edit it; a stored Contract that no longer fits shows "This
      Contract no longer fits this Booking." with the same link.
14. **Office billing setup** (`OfficeBillingSetup`, `EditBillingSetupSheet`; US-04.3.2 office side):
    - Rows: Contract (name, AA code, holder), Billed to (item 4, interim), Reference, Override, Funders.
      The Route, Category and Insurer rows and "None (default pricing)" go.
    - The sheet's title becomes "Contract and payer": a Contract row opening the picker, the guardian
      select only when the Contract does not bill its holder (interim until 21), and the reference.
      Save calls `setProcedureContract` when the Contract changed, then `editProcedure` for the rest.
      The section's button keeps its name, "Edit billing setup" (recipes and visual specs click it).
    - A "Prepayment" row ("Not required", "Required", and for Riley "Required · $800 seeded") with
      "Set prepayment", opening a new `PrepaymentFlagSheet` (`src/shared/flows/`): one switch,
      "Prepayment required", and the line "The prepayment invoice is raised before the procedure." On a
      Booking where nobody personal pays, the switch is disabled with the refusal line beneath. Never
      call the amount an estimate or a deposit in new copy. The anaesthetist keeps 15a's warning
      triangle and the warning shown on opening the Booking.
15. **Creation forms: the Contract at booking setup (US-04.3.4):**
    - `ManualBookingForm`'s "Billing route" block becomes a Contract row after 19's procedure step,
      starting as "Choose a Contract" and opening the picker (the List's hospital, surgeon and
      anaesthetist and the pick feed `contractCandidatesForNewBooking`). It is never preselected from
      the hospital. Saving without one is allowed and puts the Booking on "Needs a Contract", and the
      form says so under the row ("Saved without a Contract, this Booking waits on the office's Needs a
      Contract list."). No insurer or funding field.
    - `PhoneAdviceBooking` (office, S2) gets the same row after its procedure field; its prefill drops
      the route and `I-NIB`. The S2 run sheet picks St George's plain RVG Contract (the holder is billed,
      as today's hospital route billed St George's), so the Booking's payer is unchanged.
    - The anaesthetist's add-a-booking path (mobile and web) gets the same row and picker.
    - Add another procedure (mobile, web, Admin) runs the procedure step then the Contract step, with
      the first Procedure's Contract pre-ticked when it is a candidate (one tap to confirm, never stored
      silently).
    - If 15b kept photo capture as a badged demo, its samples drop the route and insurer and arrive
      with no Contract.
16. **Admin review (DM-10's change flag):**
    - `ReviewScreen`'s Route column becomes "Billed to" (item 4; "Mixed" when Procedures differ). The
      Contract column shows the primary Procedure's Contract, "+N" for more, and a marker when the
      anaesthetist changed one.
    - `reviewFlags.ts` stays pure; its inputs gain the Contract, `isCandidate` and the pending change. New
      warn flags: "Changed by anaesthetist · <from> to <to>" (procedure, Contract or both), "No Contract"
      and "Contract no longer fits this Booking"; "No billing reference" re-keyed (item 5). Update the
      tests. Approval, the payer and the general-procedure flag are 21's.
17. **Invoice wording:** `InvoiceDocument`'s `PaymentCategoryNote` becomes a note chosen by one pure
    helper, `patientInvoiceNote(booking, invoiceKind)`: the Booking's prepayment flag gives today's
    prepayment wording; otherwise "Payment is due on receipt of this invoice." The
    insured-reimbursement wording loses its trigger with the category and is retired until Phase 21's
    Contract-holder flag for US-11.4.2; the AIA Booking reads the standard wording meanwhile. Phase 22
    rebuilds the layout.
18. **Shots and demo surfaces:**
    - Update `visual/mobile-interactions.spec.ts`, `admin-phase06.spec.ts` and `admin-phase07.spec.ts`,
      keeping `data-shot="procedure-contract"`; add shots of the Contract step (No contract (RVG) first,
      holder headings, an AA code and a holder code typed, the RVG codes route), the "Needs a Contract"
      card and the phone-advice Contract row.
    - Edit the Control Panel's existing S1 scenario text (add nothing to that page) and the description
      of Phase 14's re-homed "Fire hospital message" entry.
    - The catalogue screenshots are the standing step below, run after the review pass.
19. **PWA check:** the Contract step, the Contract row and "Change" work in the PWA build as bottom
    sheets, search included, and any Phase 14 or 15a PWA entry touching prepayment still works against
    the Booking flag.

## Demo triggers

No new harness-bar button and no new PWA entry: everything demos through normal use. This phase adds
no warning rule, so 15a's "Raise sample warnings" needs no new sample, but its prepayment sample (if
built) is re-pointed at the Booking flag (item 7) and must still stage and clear.

- **Admin Day: the "Needs a Contract" card on the right rail** (product). Phase 14's re-homed
  `fire-hospital-message` entry (Integrations sim, Admin · Integrations and Mobile · Lists; bar and
  PWA): Sarah Mitchell's new Booking on Souter Tue 28 Jul St George's AM now arrives with no Contract,
  appears on the card, and the office sets it. Update the entry's description text only.
- **Mobile, web and Admin Procedure: "Change" on the Contract** (product) opens the Contract step with
  No contract (RVG) first, holder headings, search, start from the holder and the RVG codes route.
- **Admin Review: the anaesthetist-change flag** (product), seeded on Dr Morrison's SUBMITTED Mon 20
  List; no new button.
- **"Trigger billing failure" (S4 Beat 3)** keeps working: the COS Contract is still the stored pick and
  still dates out to `contractIneffective`. Check it after item 8.
- **PWA:** the anaesthetist's change needs no office step to demo on a handset. The "Office approves
  this Contract change" stand-in is Phase 21's.

## Out of scope

- The payer on the Booking (prefilled from the patient, editable to a guardian) replacing the
  `billablePartyId` override; the insurance indication with its review warning (OQ-93, D28); the
  child-payer warning; holder references; completion needing a procedure, a Contract's references and
  modifier explanations; the office's approval of every Contract at review with its PWA stand-in; the
  general-procedure review flag (D37); US-11.4.2's Contract-holder flag and wording. All Phase 21.
- The source wording and the three-part stack (name and holder, who is invoiced, pricing basis with
  figure) on every booking screen, and the Contract shown on the List view: Phase 20a.
- The Split button replacing `funderOverride`, Contract-driven layout, delivery and GST: Phase 22.
- Seeding combination Contracts, the primary Procedure's "Make primary" and the multi-procedure rule:
  Phase 23.
- The price precedence, the anaesthetist's adjustment record and where it is offered: Phase 24.
- The pricing snapshot at AUTHORISED (RV-01): Phase 25.
- Prepayment derived from the prepaid set, the fixed price from the anaesthetist's own Contract,
  removing the flag, deposits and `prepaymentDetail`, the invoice generated at setup: Phases 26 and 27.
- A matched hospital row creating a Booking (the "matched" half of US-04.3.4): Phase 33, which leaves
  its Bookings on this phase's list.
- Contract master editing, holders, versions and the AA code (18); RVG groups, procedures and the two
  tabs (19); lines, the resolver and first-party Contracts (19a); modifiers (19b); hospital data
  setting the Contract (US-04.3.6) and the not-on-schedule flag (US-04.3.7), both Future Work.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] Reset. Admin Day shows the "Needs a Contract" card with the two seeded Bookings ("No Contract",
      "Procedure to choose"). Fire MSG-STG-1001 (Phase 14's re-homed trigger): Sarah Mitchell's
      Booking on Souter Tue 28 Jul St George's AM arrives with no Contract and joins the card. Open it
      from the card, choose a Contract: it leaves the card.
- [ ] On any Procedure, open the Contract step: No contract (RVG) is first; candidates sit under holder
      headings; there is no "None". On a Southern Cross List no St George's Contract is offered, and a
      Contract without a line for the procedure appears only if it is a plain RVG Contract.
- [ ] On Souter's Wed 22 Christchurch Eye Surgery List, type `HNZCAT` on a cataract (42702)
      Booking: the CES Health NZ cataract schedule (item 8) shows with "HNZCATall · Cataract, all"; type its AA code: it is
      first with "AA code <code>"; type nonsense: "No Contract matches", No contract (RVG) still on top.
      On a Southern Cross List, `HNZCAT` finds nothing.
- [ ] "Start from a holder": pick Southern Cross; only its fitting Contracts remain, No contract (RVG)
      still first.
- [ ] RVG codes tab: pick a code; the step lists No contract (RVG), then lines for procedures across
      the group, each naming its procedure. Pick a line: the Procedure takes that procedure. Pick No
      contract (RVG) instead: it takes the group's general procedure.
- [ ] As Dr Souter on an `ACTIVE` List, mobile then web: change a Procedure's Contract and then its
      procedure, with no reason asked. Starting units refresh (and P1 follows a Neurosurgery or Spine
      procedure), the "Changed by you" pill shows, and History records who, when, from and to. A typed
      price is cleared on a move to a third party's Contract and kept on No contract (RVG). On a
      SUBMITTED List the row is read-only. Dr Souter never sees another anaesthetist's first-party
      Contract.
- [ ] Pre-approval falls through: move an insurer-Contract Procedure to No contract (RVG); Billed to (office
      view) becomes the patient (or the guardian override).
- [ ] Add another procedure to a guardian-paid Booking: the procedure step then the Contract step, the
      first Procedure's Contract pre-ticked; confirm; it bills the same guardian.
- [ ] Office: change a List's hospital from St George's to Forte. Nothing re-defaults; a St
      George's-held Contract shows "This Contract no longer fits this Booking." and the Booking joins the
      card.
- [ ] Admin phone advice (S2): the form shows a Contract row after the procedure, "Choose a Contract";
      pick St George's plain RVG Contract and save: the Booking carries it, audited as the office. Save a
      second one without a Contract: it lands on the card.
- [ ] Review queue, Dr Morrison Mon 20: the "Billed to" column replaces Route, and the ACC ureteroscopy
      shows "Changed by anaesthetist · No contract (RVG) to St George's ACC" (names as seeded). Fee and
      payer as before. Re-pick it as the office: the flag clears. Reload: it persists.
- [ ] Office: set prepayment on a Booking billed to a hospital: refused ("Prepayment applies only when a
      person pays for the patient."). On a patient-billed Booking the switch sets "Required", and 15a's
      unpaid-prepayment warning appears in both apps on opening the Booking. If 15a built them, "Raise
      sample warnings" still stages the prepayment sample and "Clear sample warnings" restores it.
- [ ] S3: authorise Souter Mon 20 AM and PM. Holt, Prentice nib and Prentice St George's invoices match
      item 1's figures to the cent, the Prentice split still through `funderOverride`.
- [ ] S4 Beat 1: Riley's Booking shows "Required · $800 seeded", 15a's warning shows and completion is not
      blocked; raising the pre-invoice gives $800 + GST with its draft Xero pair. Nair's full
      prepayment still nets the balance to $0.
- [ ] S4 Beat 3: Billing monitor, Demo actions, "Trigger billing failure" fails only the COS Booking,
      its sibling bills, and "Resolve and retry" clears it.
- [ ] Mark complete on a Procedure with no Contract: refused, "Choose a Contract for this procedure."
- [ ] Invoice wording: prepayment and post-procedure wordings unchanged; the AIA Booking reads the
      post-procedure wording (logged for 21).
- [ ] No "billing route", "payment category", "Reimbursement", "None (default pricing)", "Default for
      <hospital>" or "Copy booking" text anywhere in the three apps; no new "estimate" or "deposit" copy
      for prepayment; no en or em dashes in new copy.
- [ ] The PWA build shows the Contract step and row as bottom sheets, search included.
- [ ] Catalogue screenshots: the recipes in the section below are created or updated, every recipe
      this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story
      without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is
      green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      are all green.

## Demo guide updates

Patch these in the same session, in `docs/demo-guide/` and the matching sections of
`master-demo-guide.html`. Line numbers are July's; Phases 15a, 15b, 17, 18, 19, 19a and 19b edit the
same files (18 rewrites the cheat sheet's Type 1/2/3 and protected default Type 1 lines and S5 Beat 4's
"Health NZ agreed rate (Type 2)"; 19 and 19b S1 Beat 3's capture and the ASA lines; 15a S4 Beat 1; 15b
the Copy and DRAFT wording), so locate each passage by its text:

- `03-demo-script.md`:
  - **S1 Beat 1 Expected:** Sarah's Booking arrives with no Contract and appears on the Admin Day
    "Needs a Contract" card; add a Click and Say for the office setting it ("The hospital told us who
    the patient is and when. The office decides how it is billed: one Contract, set before the day.").
    Remove any "on St George's default Contract" wording.
  - **S2 Beat 2:** the phone-advice form shows the Contract row after the procedure; the presenter
    picks St George's plain RVG Contract (No contract (RVG) is first; point at it). Remove any mention of
    a billing route or an insurer.
  - **S2 Beat 4:** a "Worth pointing at" line on Dr Morrison's "Changed by anaesthetist" flag (approval
    arrives with Phase 21).
  - **S3 Beat 1 Say:** replace "It resolves the explicit payer per Procedure, applies the governing
    Contract, and groups by counterparty" with "It reads the one Contract on each Procedure, bills the
    holder when the holder pays us, otherwise the patient or whoever pays for them, and groups by who is
    billed". Figures unchanged.
  - **S4 Beat 1 Say** (as 15a left it): "The office flagged this booking for prepayment" in place of "A
    patient-funded pre-payment", keeping 15a's warning wording; no "estimate" or "deposit".
  - One "Worth pointing at" line where the Contract step is shown: "Pick the procedure, then its
    Contract. No contract (RVG) is always first; the rest are only the Contracts with a price for that
    procedure whose holder fits this Booking, grouped by holder, and typing an AA code or a holder's own
    code finds one among thousands. The anaesthetist can change it until they submit, and the office
    sees the change."
- `04-presenter-cheat-sheet.md`: glossary rows "Procedure" ("each has exactly one Contract") and "ACC
  route" (ACC is a Contract holder like any other, not a route); replace "Three billing routes" and its
  direct-insurer and insured-reimbursement bullets with "One Contract per Procedure" (set at booking
  setup, No contract (RVG) first, holder-fit candidates with search, the Contract decides who is
  billed, a "Needs a Contract" list, the anaesthetist's change flagged); update the myths ("Every insured
  patient is billed to an insurer", "ACC has its own billing route": the Contract decides) and the ACC
  section's "ACC is not a billing route: ACC-related work bills through the normal contract-holder
  routes" (ACC is a holder; its Contracts are offered like any other).
- `README.md`: "Bookings using the three main billing routes" becomes Bookings on hospital,
  insurer and No contract (RVG) Contracts (leave the RFP section titles it cites as they are).
- `02-workflows-and-handoffs.md` (the "Resolve route, Contract, fee" step, the manual-Booking "advised
  billing route", the route bullets in the billing walkthrough) and `01-personas-and-responsibilities.md`
  ("Confirm that the billing route, Contract, Insurer and reference information make sense", "ACC route
  warnings"): route and insurer wording becomes Contract wording; the office's booking-setup step
  includes setting the Contract.
- The Control Panel S1 scenario text and the Phase 14 registry entry description (item 18).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 20` first: earlier phases may have changed
these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/` matches
what was built. The tool lists every story under EP-04 and FT-03.4 plus US-03.2.3 and US-03.3.1, so the
table also holds stories whose recipe belongs to another phase; for those the cell says what this phase
leaves alone. US-03.1.2 left this phase for 20a, and the Retired US-04.2.5, US-04.2.7, US-04.2.12,
US-04.4.1 and US-04.4.2 left the plan. Shots are Admin unless an app is named. Seeded Bookings are `BK`
ids.

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.1.1](../../../../requirements-board/requirements/stories/US-04.1.1.md) Third-party and first-party Contracts | partial · admin-contract-types | Phase 18 owns the shot. 18 left it `partial` with a reason naming this phase ("The Contract picker grouped by holder with No contract (RVG) first is built in Phase 20; first-party Contracts with their prices in Phase 19a"): drop the Phase 20 half; if 19a's PROGRESS entry shows the first-party prices built, set it `captured` and drop the reason. Let `--dry` catch any selector this phase moved |
| [US-04.1.2](../../../../requirements-board/requirements/stories/US-04.1.2.md) Create, edit, retire Contracts | partial · admin-contracts, admin-edit-contract | Phase 18 owns it. No change here beyond `--dry` |
| [US-04.1.3](../../../../requirements-board/requirements/stories/US-04.1.3.md) Contract audit and versioning | absent | Phases 18 and 25 own it. No change here |
| [US-04.1.4](../../../../requirements-board/requirements/stories/US-04.1.4.md) AA identifier for every Contract | absent · placeholder | Phase 18 owns the recipe. This phase searches the AA code in the picker, which US-04.3.2's `aa-code` state shows; nothing added here |
| [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) Contract holders | none | Phase 18 creates it `partial` with a reason naming this phase (first-party Contracts offered only on their anaesthetist's Bookings, Phase 20). Reword the reason to "The holder decides who is invoiced from Phase 21."; status stays `partial`. The holder headings themselves appear in US-04.3.2's `default` state; no new shot here |
| [US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) Contract holder, who is billed, and where it applies | partial · admin-contract-holder | Phase 18 owns the editor shot and 21 the payer. Add a `narrows-picker` state: a Christchurch Eye Surgery-held Contract offered on its own List's eye Booking and absent from a Southern Cross List's. Highlight the holder heading in the picker. Caption "A Contract is offered only where its holder fits the Booking". 18 left it `partial` with the reason "Who is invoiced follows the holder from Phase 21; the Contract list is narrowed by hospital, surgeon or rooms and anaesthetist in Phase 20.": drop the Phase 20 half, keeping "Who is invoiced follows the holder from Phase 21."; status stays `partial` |
| [US-04.2.10](../../../../requirements-board/requirements/stories/US-04.2.10.md) Contract prices effective from a date | absent · placeholder | Phase 18 owns the recipe. No change here |
| [US-04.2.11](../../../../requirements-board/requirements/stories/US-04.2.11.md) Combination Contracts | absent | Stays `absent` with the reason "Phase 23 builds this". The picker already offers a line under each parent procedure, but none is seeded until 23 |
| [US-04.2.13](../../../../requirements-board/requirements/stories/US-04.2.13.md) Upload a Contract schedule | none | Future Work. If the tool still asks for a recipe, create it `absent` with the reason "Future Work: no schedule upload in the first release (OQ-100); Phase 42 loads Contracts by spreadsheet" |
| [US-04.2.14](../../../../requirements-board/requirements/stories/US-04.2.14.md) Anaesthetist's own fixed-price Contracts | none | Phase 19a creates it. This phase only offers them in the picker (the Booking's anaesthetist's own); nothing added here |
| [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) Contract pricing terms | captured · admin-pricing-basis | Phase 24 re-shoots it (line terms and precedence). No change here beyond `--dry` |
| [US-04.2.4](../../../../requirements-board/requirements/stories/US-04.2.4.md) Contract lines | partial · admin-price-rows | Phase 19a owns it. No change here beyond `--dry` |
| [US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md) Invoice presentation and delivery | absent | Stays `absent` with a reason naming Phase 22; reword any "follows the billing route" to "follows the Contract" |
| [US-04.3.1](../../../../requirements-board/requirements/stories/US-04.3.1.md) Exactly one Contract per Procedure | partial · admin-procedure-contract | `captured`. Re-shoot `admin-procedure-contract` on the office Booking detail: the Contract row (name, AA code, holder) and "Billed to", with no Route, Category or Insurer rows and no "None". Add a `refused` state: Mark complete on a Procedure with no Contract showing "Choose a Contract for this procedure." Caption "Every Procedure carries exactly one Contract". Drop the partial reason |
| [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) Filtered Contract list | partial · admin-contract-picker | `captured`. Re-shoot `contract-picker` on the Contract step (`data-shot="contract-picker"`) with states `default` (No contract (RVG) first, holder headings, AA codes, the office's provisional caption), `aa-code` (that Contract first with its "AA code" match line), `holder-code` (`HNZCAT` on a Christchurch Eye Surgery cataract Booking, finding item 8's CES Health NZ cataract schedule), `holder` (started from Southern Cross) and `rvg-code` (from the RVG codes tab: lines across the group, each naming its procedure). Add `web-contract-picker` and `mobile-contract-picker` for the anaesthetist on an `ACTIVE` List. Caption "No contract (RVG) first, then the Contracts that fit this Booking, by holder". Drop the partial reason |
| [US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) No contract (RVG) always offered first | partial · admin-default-contract, web-default-contract, mobile-default-contract | Stays `partial`, reason replaced with "The payer named on the Booking arrives with Phase 21; until then No contract (RVG) bills the patient or the Booking's existing guardian override." **The current captions describe a default hospital Contract ("Procedure governed by the St George's default contract", "Default hospital contract shown on the Booking") and must be replaced.** Re-point all three at the Contract step on a Procedure with No contract (RVG) as the highlighted first row (Admin, web and mobile), and add a `billed` state on the Booking detail's `[data-shot=procedure-contract]` row of a Procedure priced on No contract (RVG), showing who is billed (the patient; office view). Captions "No contract (RVG) is always first" and "No contract (RVG) bills the patient or whoever pays for them". Rename the shots if their names keep "default" (for example `no-contract-first`). 20a later re-points the web and mobile Booking-detail highlights to its stack and 21 the payer |
| [US-04.3.4](../../../../requirements-board/requirements/stories/US-04.3.4.md) Admin sets Contracts at booking setup | captured · admin-billing-setup[summary,edit] | Stays `captured`. Keep `summary`; re-caption `edit` ("Contract and payer", no route or insurer; today's caption names "route, insurer and governing contract") and re-point its highlights. Add `setup` (the phone-advice form's Contract row before saving) and `needs-contract` (the Admin Day "Needs a Contract" card with its reasons). Captions "The Contract is set when the Booking is created" and "Bookings without a Contract wait on the office's list" |
| [US-04.3.5](../../../../requirements-board/requirements/stories/US-04.3.5.md) Contract locked at AUTHORISED | captured · admin-contract-before, admin-locked-contract | Stays `captured`; Phase 25 re-shoots the lock. Re-check the billing-setup highlights with `--dry` |
| [US-04.3.6](../../../../requirements-board/requirements/stories/US-04.3.6.md) Hospital data sets the Contract | absent | Stays `absent`: Future Work (OQ-22). Feed-created Bookings now arrive with no Contract; reword the reason if it says "takes the hospital default" |
| [US-04.3.7](../../../../requirements-board/requirements/stories/US-04.3.7.md) Procedure not on the Contract's schedule | absent | Stays `absent`: now Future Work. Replace the reason "Phase 21 builds this" with "Future Work" |
| [US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) Anaesthetist can change the procedure or Contract | partial · web-edit-operation, mobile-edit-operation | `captured`. **Replace the captions "Edit operation: billing route, insurer and reference".** Re-shoot `edit-operation` on web and mobile (`ACTIVE` List): the procedure and Contract rows with teal "Change" and the caption about the office seeing changes. Add `changed` (after a Contract change: the "Changed by you" pill and the refreshed units) and an Admin `contract-changed-flag` on the Review queue for Dr Morrison Mon 20. Captions "Change the procedure or Contract until you submit, no reason needed" and "Every change is audited and flagged for the office". Drop the partial reason |
| [US-03.2.3](../../../../requirements-board/requirements/stories/US-03.2.3.md) Add additional Procedures | partial · web-add-procedure[before,copy,added], mobile-add-procedure[before,added] | `captured`. Re-shoot both apps; `added` shows procedure 2 with its own Contract row after its own Contract step. Drop the web `copy` state if 15b left it (no "Copy booking" exists). Drop the partial reason |
| [US-03.3.1](../../../../requirements-board/requirements/stories/US-03.3.1.md) Pick the procedure and Contract, with starting units | captured · rvg-picker[closed,open,search] (web, mobile) | Phase 19 re-shoots the two tabs and replaces the stale caption "Picker grouped by anatomical site (earlier design: now RVG body headings)"; if it is still there, replace it here. Status stays `captured` (19 left the decision to this phase: every criterion is built once the Contract step and the refresh land); keep 19's `ranged-base-units` shot as it is. Add `contract-step` (after a procedure pick: No contract (RVG) first, then holder headings) and `refresh` (after a Contract change: the refreshed starting units) on web and mobile. Caption "Pick the procedure, then its Contract; the starting units follow" |

**Recipes this phase breaks.**
- `US-06.3.5` (re-check on change): its `after` state clicks "Edit billing setup", then
  `[role=dialog] >> role=button[name="Self-funded"]` and "Save billing setup", and its captions say
  "Payment category". The category is gone. Re-point it at "Set prepayment" in `PrepaymentFlagSheet`
  (switch off), keep the shot name `recheck-on-change` and the `booking-prepayment` hook, and caption
  it without "estimate" or "deposit"; Phase 27 re-shoots the re-check on a change of Procedures,
  Contract or payer.
- `US-07.2.2` (office review): the `edit` state is captioned "choosing the route and Contract" and the
  Route column becomes "Billed to". Re-caption and re-point; the button keeps its name.
- `US-11.4.2` (insured reimbursement): the wording is retired until 21 (item 17). Re-point at what now
  shows, or set it `partial` with the reason "The reimbursement wording returns with Phase 21's
  Contract-holder flag".
- `US-04.3.1` to `US-04.3.5` and `US-03.4.1`: they use `[data-shot=office-billing-setup-1]`, "Edit billing
  setup", `label:has-text("Governing contract")` and `[data-testid=procedure-header] >> text="Edit"`.
  Reconcile with the table above.
- `US-02.5.5` (Booking history captioned "including billing route and contract"): re-caption without the
  route.
- Recipes that open or highlight the office billing setup (`US-05.4.2`, `US-05.5.1`, `US-07.2.3`,
  `US-11.2.1`, `US-11.2.2`): its rows change (item 14); check with `--dry` and re-point highlights.
  `US-11.2.2`'s `edit` state scrolls to the first select in the dialog, now the guardian select on the
  Grace Park Booking's No contract (RVG); Phase 21 re-shoots it for the payer on the Booking.
- Absent and partial reasons that name the billing route or a default hospital Contract (`US-04.2.8`,
  `US-04.3.6`, `US-15.0.5`, and those dropped above): reword them ("The invoice recipient follows the
  Contract", "fee, unit, Contract and split logic"); status unchanged.
- Prepayment recipes (`US-06.2.1`, `US-06.2.2`, `US-06.3.1` to `US-06.3.4`, `US-06.4.1`): they click
  `daygrid-block-prepayment` and read the prepayment banner, now driven by the Booking flag. The same
  Bookings are flagged, so they should still match; `--dry` is the check. Their stale estimate and
  balance captions are 27's and 41's to replace.
- `US-04.2.1`, `US-04.2.2`, `US-04.2.4` and 19a's recipes that click Contracts by name or read the
  billing setup: check after the seed remap.

**ATLAS.md.** Seed data and Personas and IDs (each seeded Booking's Contract, who is billed and
prepayment flag; the two "Needs a Contract" Bookings; notes that say "nib insurer route", "billing
route" or "hospital default"), Overlays (the Contract step, "Contract and payer", `PrepaymentFlagSheet`,
the phone-advice Contract row), Existing hooks (`contract-picker`, the "Needs a Contract" card's hook,
any moved `office-billing-setup-*` hooks) and the billing-setup button text. Routes are unchanged.

## Adversarial review (after build)

After the manual test checklist and the commands are green, and before the PROGRESS entry, run the
standard adversarial review-and-fix pass (PROGRESS convention 18): independent Opus review subagents
for quality, bugs/correctness and plan adherence, plus a money-parity lens. This session verifies every
finding against the catalogue, this plan and the code, fixes the confirmed ones, re-greens and records
the pass. Do not re-raise anything settled in the Decisions log except the rulings this phase
supersedes.

**Steer this phase's reviewers at:**

- **Nothing derived from the location:** no creation path, hospital change or reassign stores a
  Contract the user did not pick; feed and PDF creates arrive with none; no "default for <hospital>"
  survives in code or copy; the only "no Contract" outcomes are the "Needs a Contract" list, the
  completion refusal and the `noContract` run exception.
- **The candidate rule matches US-04.3.2:** No contract (RVG) first under every query, filter and miss;
  a line for the procedure (or a plain RVG Contract, D32); valid on the procedure date; holder fit
  (hospital, surgeon or rooms, the Booking's own anaesthetist for first party); search inside the
  candidates only; start from the holder; the RVG codes route sets the procedure or the general
  procedure; the store refuses any non-candidate (the UI cannot bypass `setProcedureContract`); no flat
  select of every Contract; one rule in `domain/billing`, read everywhere.
- **The refresh:** a change of procedure or Contract re-runs 19a's resolver and 19b's locked modifiers
  in the same commit, clears a typed price only on a non-adjustable Contract, and audits the before and
  after; no second base-unit source and no second adjustable rule.
- **The payment category is gone everywhere** (types, seed, capture, billing setup, prepayment actions,
  review, invoice, audit labels, tests), with its prepayment meaning on the Booking flag and
  `prepaymentDetail` only on the Booking; no Phase 27 work done early.
- **Parity:** item 1's fixtures pass unchanged; the interim who-is-billed reproduces every seeded payer,
  the BP0001 and BP0002 overrides and Mr Doyle (not-billed holder, still invoiced until 21) included; `funderOverride` still splits Prentice; the prepayment
  builders give the same amounts and pairs; the Old-model Matches (US-05.2.6, FT-03.2, FT-08.2,
  FT-05.5, US-09.1.3) still hold; `rng()` draw order unchanged.
- **Rights and audit:** the anaesthetist changes only on their own `ACTIVE` Lists; the office on
  `ACTIVE` and SUBMITTED; nobody on AUTHORISED; the change flag derives from audit and survives a
  reload; `setBookingPrepayment` is office only, only where a person pays, locked once invoiced; no
  completion gate returns.
- **Privacy of first-party Contracts:** an anaesthetist never sees a colleague's in any picker,
  search, review or audit view they can reach.
- **One provisional caption** (D32, D33, D37), office picker only; none for OQ-66 or OQ-78.
- **Leftovers:** the item 9 greps; no "estimate" or "deposit" in new prepayment copy; `contractIneffective`
  kept for S4 Beat 3 and Phase 25.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the D32, D33 and D37 defaults built; the readings below; anything logged rather than
  fixed; and the screens worth a look with route and persona (the Contract step on Admin, web and
  mobile; the RVG codes route; the "Needs a Contract" card; the phone-advice Contract row; the Morrison
  review flag).
- **Catalogue screenshots result:** the recipes changed (the covered items re-shot, US-04.2.1's new
  state, the broken ones), the `requirements-board/capture/REPORT.md` counts (captured, partial,
  absent, failed) before and after, and the reasons handed on (US-11.4.2, US-04.3.3, US-04.1.5 and
  US-04.2.1 to 21, with the Phase 20 halves of 18's reasons dropped; US-04.2.8 to 22,
  US-04.2.11 to 23, US-04.2.2 to 24, US-04.1.3 to 25; US-04.3.6, US-04.3.7 and US-04.2.13 Future Work).
- Status row for catch-up Phase 20, and a phase entry: the drift-check result against `60e2d1e`; D16,
  D17 and D2 (as superseded on 2026-10-08), D45, D42, D23 and OQ-78 built as answered; the D32, D33 and
  D37 defaults; what 15a, 15b, 18, 19, 19a and 19b were found to provide; the session split; the
  adversarial pass; the tests added (selection, search, holder fit, RVG codes route, refresh, parity,
  store guard, audit-derived flag, prepayment flag); `PERSIST_VERSION` old to new; the broken capture
  recipes; and the handoffs: 20a (the stack reads `billedPartyFor` and the Contract row), 21 (the payer
  on the Booking replaces the override; `billedPartyFor` and `routeCounterpartyForHolder` give way to
  `billsHolder` and the payer, with the Doyle change; 18's `billedAs` already went here; approval; the insurance indication; the general-procedure flag;
  US-11.4.2), 22 (`funderOverride`), 24 (the adjustable rule and the typed-price clear), 27 (the
  prepayment flag, deposits and `prepaymentDetail`), 33 (matched Bookings join the list).
- Decisions log:
  - **Superseded:** the route model (3rd review #1; the Phase 08 decisions (1) and (2) on resolution by
    route and the contract-less billable-party route; 6th review #2, the insurer-route direct-claims
    check); payment categories (2nd review #5, 7th review A2); "the Card-level pre-payment flag is
    derived, never stored" (7th review B6), now an interim office-set flag; the protected default
    Type 1 per hospital and insurer as the Contract a Booking lands on (with 18); the earlier catch-up
    plan's hospital default stored at creation and its procedure default RVG Contracts in the picker
    (withdrawn by OQ-78's answer before they were built).
  - **Readings this phase picks where the catalogue is silent:** insurer holders fit every Booking
    until 21's insurance indication; a blank procedure's candidates (D33); starting units replace the
    recorded ones on a change; the typed price cleared is today's `priceOverride` until 24; a creation
    form never preselects a Contract and may save without one; an added Procedure pre-ticks the first
    Procedure's Contract and copies its payer override; a hospital or surgeon change re-defaults
    nothing; the change flag derives from audit and an office re-pick clears it until 21; the
    insured-reimbursement wording is retired until 21; the interim who-is-billed reads 18's
  `routeCounterpartyForHolder`, not `billsHolder`, so the Doyle Bookings stay billed to Mr Doyle
  until 21's recorded change.
  - **Open, built as defaults (one caption):** D32 (OQ-98), D33 (OQ-99), D37 (OQ-103).
  - **Interims, with the phases that replace them:** who is billed with the `billablePartyId` override
    (21), `funderOverride` as the split (22), the office-set `prepaymentRequired` flag with
    `prepaymentDetail` and the seeded deposit (27).
