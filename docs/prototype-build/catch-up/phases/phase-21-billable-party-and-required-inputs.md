# Phase 21 · Billable party, required inputs and completeness

**Requirements covered:**
[FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md) Billable party and invoice contact (Verify; [OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) answered, [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) open) ·
[US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md) Patient-direct Contract makes the patient the billable party (Verify) ·
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) Guardian or other payer set through the Contract (Verify, OQ-67 answered) ·
[US-11.4.2](../../../../requirements-board/requirements/stories/US-11.4.2.md) Insured patient who forwards the invoice (Proposed) ·
[US-04.2.7](../../../../requirements-board/requirements/stories/US-04.2.7.md) Required booking inputs (Proposed) ·
[US-04.3.7](../../../../requirements-board/requirements/stories/US-04.3.7.md) Procedure not on the Contract's schedule (Proposed) ·
[FT-03.6](../../../../requirements-board/requirements/stories/FT-03.6.md) Booking completeness validation ·
[US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md) Mark a Booking complete ·
[US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md) Invoice email required for patient-direct ·
[US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md) Warn when a child is the billable party (Confirmed, [OQ-54](../../../../requirements-board/requirements/questions/OQ-54.md) answered) ·
[US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) Office review of Contracts and references ·
[DM-11](../analysis/domain-model-delta.md#dm-11) billable party and invoice email defined by the Contract, no per-Booking override, the guardian record goes ·
[DM-16](../analysis/domain-model-delta.md#dm-16) required booking inputs and the "confirm with hospital" flag ·
[RV-29](../analysis/reverse-check.md#rv-29-a-bookings-billable-party-is-overridden-per-procedure-guardian-record-where-the-contract-now-defines-the-payer) the per-Procedure guardian override record, retired by OQ-67.
Touches, without closing: [DM-28](../analysis/domain-model-delta.md#dm-28) (the grouping key stays per Procedure; only where the party comes from changes here, and the payment setting is Phase 22), [DM-37](../analysis/domain-model-delta.md#dm-37) (Phase 20 derives the anaesthetist's Contract change from audit; this phase adds the office approval stamp), [DM-31](../analysis/domain-model-delta.md#dm-31) (this phase registers the child-billable-party rule with 15a's warning routine) and [DM-12](../analysis/domain-model-delta.md#dm-12) (with no insurer on the Booking, an insurer that takes no direct claims is read from the Contract holder). [US-08.2.1](../../../../requirements-board/requirements/stories/US-08.2.1.md) (group by billable party) Matches and is not covered here: keep its behaviour, one invoice per distinct party per Booking, now keyed on the Contract-defined party. The superseded rulings are the guardian override record (Decisions log, 2026-07-22 third and seventh reviews), the 7th-review route-based payer and the 8th-review silent BTM fallback.
**Depends on:** Phase 15a (the warning routine, Warning records derived by selectors, the Admin to-do list with Clear, the triangle in all three apps, the warning visible on opening a Booking, no confirm step at submit, and the shared "Raise sample warnings" trigger; the prepayment completion gate is already gone) and Phase 20 (one Contract per Procedure, the filtered Contract picker, billing route, payment category and `Procedure.insurerId` removed with nothing on the Booking in their place, the audit-derived anaesthetist Contract-change flag, the interim "payer is the Contract holder" with `billablePartyId` kept as the guardian override, and the interim office-set prepayment flag). Also relies on 14 (trigger registry, PWA demo-actions sheet, shared actor constants), 15 (Booking vocabulary), 16 (the Xero contact-name helper and "Billable party BP…" contact names), 17 (hospital and surgeon rooms contact emails), 18 (Contract categories, `ContractHolder` with its `bookingBillableParty` kind, `holderCounterparty`, fee-schedule lines), 19 (the procedure-first picker) and 19a (default RVG Contracts per procedure and Contract procedure scope).
**Estimated:** 2 full sessions, at the upper limit. Session 1 is items 1 to 8 (the payer captured through the Contract, the guardian master removed, grouping, the direct-claims holder flag, the child warning and its sample, Review's Invoice to), re-greened and demoable. Session 2 is items 9 to 17 (required inputs, completeness, the not-on-schedule flag, Review approval, the PWA trigger, demo guide). If session 2 runs long, finish and re-green items 9 to 12 and 14 first; items 13 and 15 (Contract approval and its PWA trigger) are the tail to carry over, never the tests.

## Goal

Per **OQ-67** (answered; owner decision **D17**) the **Contract always defines the billable party**:
there is no per-Booking or per-Procedure override, and every payer arrangement is a Contract, with
as many Contracts as AA needs. A hospital taking the invoice for work at standard RVG pricing is a
Contract with that hospital as billable party (the hospital's RVG Default Hospital Contract). A
patient-direct Contract makes the patient the billable party (US-11.2.1). Picking a default or
patient-direct Contract (one whose holder is "the payer named on the Booking") **asks for the name
and email of whoever pays**: the patient, with their own email prefilled, or someone else, for
example a guardian (US-11.2.2). The payer is stored with the Procedure's Contract selection and kept
with the debt, and the invoice email defaults from it. The per-Procedure `billablePartyId` override,
the guardian `BillableParty` master, `createBillableParty` and the "New guardian" flow all go
(RV-29). The billing run groups each Booking's Procedures by that Contract-defined party, replacing
Phase 20's interim holder-as-payer.

An insurer that **takes no direct claims** becomes a flag read through the Contract holder: a
Procedure on that insurer's Contract names the payer like a patient-direct Contract (the patient by
default), and its invoice says to claim from the insurer (US-11.4.2).

Each Contract **declares the per-Booking inputs it requires** (invoice email, billable party, prepaid
amount, insurer member number, claim reference, purchase order), and the Booking holds them. **Mark
complete** now needs a Contract on every Procedure, times on every Procedure, a captured payer
wherever the Contract names one, and every declared input; patient-direct billing needs an invoice
email (US-11.2.3). A Procedure priced under a fixed-schedule Contract that has **no line for it** is
flagged "to confirm with the hospital" instead of silently pricing by BTM, and the office resolves it
with one of US-04.3.7's outcomes: standard RVG pricing with the patient paying, a Contract with the
hospital as billable party, or a new schedule line.

Office **Review** shows every Procedure's Contract and approves them (explicitly, or all at
authorise), shows the anaesthetist-change flag, shows who is invoiced and at which address, checks
whether a Procedure needs an insurer's Contract, and shows the Booking's warnings. Per owner decision
**D4** (OQ-54, answered), a patient under 18 who is their own billable party raises a **mild,
clearable warning** through 15a's routine. It never blocks saving, submitting or authorising, and
there is no warning when someone else pays.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the snapshot:

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-11.2,US-11.2.1,US-11.2.2,US-11.4.2,US-04.2.7,US-04.3.7,FT-03.6,US-03.6.1,US-11.2.3,US-11.2.4,US-07.2.2,US-04.2.1,US-04.3.3,US-04.4.2,US-08.2.1,US-11.4.1,US-13.7.2,OQ-54,OQ-55,OQ-67,OQ-73,OQ-78
   ```

   Read the diff for FT-11.2, US-11.2.1, US-11.2.2, US-11.4.2, US-04.2.7, US-04.3.7, FT-03.6,
   US-03.6.1, US-11.2.3, US-11.2.4, US-07.2.2, the context items US-04.2.1, US-04.3.3, US-04.4.2,
   US-08.2.1, US-11.4.1 and US-13.7.2, OQ-54, OQ-55, OQ-67, OQ-73 and OQ-78, and the "Booking",
   "Contract (recommended structure)", "Procedure billing context", "Selection", "Patient and
   billable party" and "Warnings" sections of `domain-model.md`. If an item changed, re-read it and
   adjust the work items below. If an item is now Retired or Future, drop it and say so in the
   PROGRESS entry.
2. **OQ-67 is answered (D17): build it.** The Contract always defines the billable party; there is
   no per-Booking override; a default or patient-direct Contract asks for the payer's name and email.
   Nothing in this phase is captioned "Provisional (OQ-67)". D4 (OQ-54) is answered: build the
   warning, not a block. OQ-73 is answered (D23): a prepayment only where a person pays for the
   patient, never an organisation, which item 2's `isPersonParty` serves.
3. **OQ-78 is open** (Greg's alternative: no default Contracts, the hospital holding every Contract).
   Build its recommendation, the catalogue's model: default RVG Contracts exist and the
   patient-direct ones ask for the payer's name and email. Phase 20 owns the one OQ-78 caption (the
   office picker's Default section); add no second caption. Keep the payer capture as **one store
   action** (`setProcedurePayer`) and **one pure predicate** (`contractNamesPayer`), so that if OQ-78
   is answered the other way the capture can move or go without touching the engine. If OQ-78 has
   been answered by the time this phase starts, stop and record it: it changes items 1, 2, 5 and 8,
   and the plan needs re-cutting before building.
4. **Verify and Proposed items.** FT-11.2, US-11.2.1 and US-11.2.2 are Verify (OQ-78 bears on them):
   build them as written. US-11.4.2, US-04.2.7 and US-04.3.7 are Proposed: build them as written.
   US-04.3.7's notes say the flag and the schedule update are "our proposal", so label the resolve
   sheet as a proposed flow.
5. **Read what 15a, 18, 19a and 20 actually left.**
   - 15a's PROGRESS entry (both sessions): the rule registry (`WARNING_RULES` in
     `src/domain/warnings/rules/`), the `WarningFacts` and `Warning` shapes, the selectors
     (`warningFactsFor`, `warningsForBooking`, `openWarnings` in `src/store/warnings.ts`), how
     clearances are stored and when a cleared warning re-opens, whether the Review row shows the
     triangle, and the sample contract (`WARNING_SAMPLES` with `isStaged`/`stage`/`unstage` in
     `src/store/warningSamples.ts`, `SEED_WARNING_SAMPLE_BOOKINGS`, `multiWarning`,
     `DEMO_TRIGGER_ACTOR`). Use those names below.
   - 18's: the `ContractHolder` union and its `bookingBillableParty` kind ("Payer named on the
     Booking"), `holderCounterparty`, `holderKindFor`, the RVG Default Post-paid Contract
     (`CT-RVG-POSTPAID`), the Aria Contract (`rvgDefaultPostPaid`, holder `bookingBillableParty`,
     paying party today the BP0002 Aria clinic record), and 18's labelled reading that the RVG
     Default Hospital Contract's holder is the hospital ("Phase 21 owns who it bills").
   - 19a's: which holder its per-procedure default RVG Contracts carry. If it is
     `bookingBillableParty`, they name the payer like the RVG Default Post-paid; if it is something
     else, record what and build `contractNamesPayer` from the holder kind, never from a Contract id.
   - Phase 20's PROGRESS entry (and, if thin, `phase-20-one-contract-per-procedure.md`): the interim
     payer (`Procedure.billablePartyId` as the guardian override, `counterpartyForProcedure` as
     holder-as-payer, wrapped by the `payerForProcedure` selector); the audit-derived change flag
     (`anaesthetistContractChange`, `pendingContractChange`); whether Review already shows the change
     flag and the Payer column; whether "Choose a Contract for this procedure." is already a
     completion check; the office-set `Booking.prepayment` flag and the person-payer rule it uses;
     `setProcedureContract` with its `contractOutOfScope` refusal; `ContractPickerSheet` and the
     "Contract and payer" billing-setup sheet; whether a new Procedure inherits the Booking's
     patient-direct Contract and guardian; whether 20 hides an insurer-held Contract whose insurer
     takes no direct claims; and where the AIA reimbursement Booking (Webb, Rutherford Thu 16) ended
     up (the plan put it on RVG Default Post-paid with AIA only in the description). Adjust items 1,
     2, 5, 9, 12 and 13 to reuse what exists instead of adding a second copy.
   - Confirm `Procedure.insurerId` is gone and that nothing on the Booking holds an insurer or funding
     source (D2). This phase adds none: the insurer member number in item 9 is a required-input
     value, not an insurer reference.
6. **Who the RVG Default Hospital Contract bills: settled here.** Keep 18's reading: its holder is
   the hospital, and it **is** "a Contract with the hospital as billable party" at standard RVG
   pricing (US-11.2.2, US-04.3.7), so picking it asks for no payer and S1, S3 and every seeded figure
   stay put. The patient-direct default (RVG Default Post-paid) and any 19a default whose holder is
   the payer named on the Booking ask for the payer. The catalogue's "picking a default Contract asks
   for the payer's name and email" (US-04.3.3 note, domain model "Selection") is therefore read as
   "a default Contract that does not already name its billable party". Record it in the Decisions log
   and on the owner's review list, under OQ-78.

## Reference

**Design files (convention 17).** `docs/design/Admin Review.dc.html` is the layout for the Review
table, flag pills (neutral and warn tints), the flags tile and the action bar with its "flags open"
line. `docs/design/Mobile App.dc.html` is the layout for the mobile Booking detail sections, rows,
edit links and bottom sheets; the new Billing section follows its Section/Row pattern.
`docs/design/Design Language.dc.html` for tokens: warning tint for flags and missing inputs, teal
for every action (Approve, Who pays, Confirm), crimson never.

**Catalogue.** The covered items above, plus
[US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) (the holder; the Contract always defines the billable party),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (the default Contract and its payer name and email field),
[US-04.4.2](../../../../requirements-board/requirements/stories/US-04.4.2.md) (default RVG Contracts per procedure),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) (anaesthetist Contract change, flagged for review),
[US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) and [FT-11.4](../../../../requirements-board/requirements/stories/FT-11.4.md) (the insurer's accepts-direct-claims flag),
[US-08.2.1](../../../../requirements-board/requirements/stories/US-08.2.1.md) (grouping, already Matches),
[US-08.4.2](../../../../requirements-board/requirements/stories/US-08.4.2.md) (send to the invoice email: Phase 22 sends, this phase captures),
[FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md) and [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) (the warning routine and to-do list 15a built; warnings that need action, not notices), and
[OQ-55](../../../../requirements-board/requirements/questions/OQ-55.md), [OQ-73](../../../../requirements-board/requirements/questions/OQ-73.md) and [OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md).
Evidence: `requirements-board/requirements/notes/2026-10-02-aa-meeting-with-greg.md` #4 (L91 to L93: "picking a default
contract presents a name and email field for whoever pays"), #8 and #41, and the change log
`requirements-board/requirements/changes/2026-10-02-requirements-update.md`.
`domain-model.md`: the Contract table's `holder / billableParty` and `requiredBookingInputs` rows, the
"Procedure billing context" `billableParty, invoiceEmail` and `insurerMemberNumber, claimReference,
purchaseOrder` rows, "Selection", the Patient and billable party section's under-18 and guardian
bullets, the Warnings section, and the glossary entries for Billable party, Invoice email and Default
Contract.

**Analysis.** `../GAP-ANALYSIS.md` (EP-03, EP-04, EP-07, EP-11 and EP-13 tables, and the "Structural
changes" rows DM-11, DM-12, DM-16, DM-28, DM-31, DM-37); `../epics/EP-11.md`, `EP-04.md`, `EP-07.md`,
`EP-03.md` for per-gap evidence; `../analysis/domain-model-delta.md` (DM-11, DM-12, DM-16, DM-28,
DM-37); `../analysis/reverse-check.md` (RV-29); `../analysis/prototype-map-domain.md`,
`prototype-map-store-seed.md`, `prototype-map-shared.md`, `prototype-map-admin.md`,
`prototype-map-shell-demo-pwa.md`.

**Code entry points** (named as at 3d3a18c; line numbers move as 16 to 20 land, so use the shapes
15a, 18, 19, 19a and 20 left):
- `src/domain/types.ts`: `CounterpartyKind` and `CounterpartyRef` (~l.73), `Patient` (~l.103,
  `email`, `dobISO`), `BillableParty` (~l.127, the guardian master this phase removes), `Insurer`
  (~l.166, `acceptsDirectClaims`), `Contract` (~l.216, reshaped by 18), `Booking` (~l.373),
  `Procedure` (~l.453: `governingContractId`, `billablePartyId`, `billingReference`), `Invoice`
  (~l.672), and 15a's `Warning` types in `src/domain/warnings/types.ts`.
- `src/domain/billing/validateBookingForBilling.ts`: `validateBookingForBilling`,
  `BookingBillingContext`, `billingReferenceMissing` (~l.49).
- `src/domain/billing/invoiceBuild.ts`: `counterpartyForProcedure` (~l.192), `layoutFor` (~l.216),
  `buildInvoicesForBooking` (~l.264, grouping), `buildPrePaymentInvoiceForBooking` (~l.456).
- `src/domain/billing/fee.ts` (~l.176 to 215): the fixed-schedule match and the silent fall to BTM.
- `src/domain/warnings/` (`routine.ts`, `rules/index.ts`, `rules/prepaymentUnpaid.ts`, `settings.ts`,
  `types.ts`): register the child rule there.
- `src/store/lifecycle.ts`: `completionBlockersFor` (~l.94), `completeBooking` (~l.115),
  `authoriseList` (~l.262, no flag gate today; refusals via `refuse(code, message, details)` from
  `store/mutate.ts`, so `authoriseBlocked` is a new code), `editBooking` (~l.402), `editRefusal`
  (~l.48).
- `src/store/billablePartyActions.ts` (`createBillableParty`: removed), `src/store/selectors.ts`
  (`counterpartyName` ~l.818, `billingContextForBooking` ~l.836, the master counts ~l.865, 20's
  `payerForProcedure`), `src/store/xeroHandoff.ts` (`billableParty` contact ~l.60),
  `src/store/billingRun.ts` (`markInvoiceEmailed` ~l.398), `src/store/mastersActions.ts`
  (`setInsurerDirectClaims` ~l.102), `src/store/index.ts` (the `createBillableParty` export), 20's
  `setProcedureContract`.
- Phase 14's `src/store/demoActors.ts` (`OFFICE_ACTOR`, `SOUTER_ACTOR`, `OFFICE_SIMULATION_ACTOR`,
  15a's `DEMO_TRIGGER_ACTOR`) and `src/store/officeStandIn.ts` (`authoriseAsSimulatedOffice`);
  15a's `src/store/warningSamples.ts`.
- `src/apps/admin/reviewFlags.ts`, `src/apps/admin/screens/ReviewScreen.tsx`,
  `src/apps/admin/screens/InvoiceDocument.tsx` (addressee ~l.133, claim note ~l.519),
  `src/apps/admin/screens/MasterData.tsx` (holder names ~l.208) and
  `src/apps/admin/flows/ContractEditSheet.tsx` (the `billableParty` holder option ~l.30 and ~l.80).
- `src/shared/booking/BookingDetailBody.tsx` (the context slot, the validator context it builds
  itself, the validation latch and `[data-validation-fields]` focus anchors),
  `src/shared/booking/OfficeBillingSetup.tsx` (the payer row ~l.44 and ~l.68),
  `src/shared/flows/EditBillingSetupSheet.tsx` (guardian select and "New guardian" ~l.48 to 95),
  `src/shared/flows/ManualBookingForm.tsx` (payer select ~l.57, ~l.124, ~l.235),
  20's `ContractPickerSheet` and `PhoneAdviceBooking`, `src/shared/capture/BtmCaptureBlock.tsx`,
  `src/shared/format.ts` (`ageYears` ~l.63), `src/shared/audit/actionLabels.ts` and `fieldLabels.ts`.
- `src/domain/seed/patients.ts` (`BP`, `BILLABLE_PARTIES` ~l.19 to 40), `src/domain/seed/bookings.ts`
  (Aria rate x time ~l.720 and ~l.875, the Webb AIA reimbursement Booking ~l.740, the Grace Park
  guardian Booking ~l.809, `wed22Ces` ~l.1025, `pinnedListIds` ~l.1113, filler ~l.1187),
  `src/domain/seed/history.ts` (guardian history row `pa05` ~l.118, the route mapping ~l.175 to 233),
  `src/domain/seed/billing.ts` (~l.94 to 158), `src/domain/seed/audit.ts` (~l.90),
  `src/domain/seed/cast.ts` (insurers: nib takes direct claims, AIA Health does not),
  `src/domain/seed/contracts.ts`, `src/domain/seed/index.ts` (`billableParties`, counters ~l.472,
  `SEED_LIST_IDS`, `SEED_MARKERS` incl. `guardianMinorBooking` ~l.633), `src/domain/seed/seed.test.ts`.
- Phase 14's trigger registry (`src/shared/demoTriggers/registry.ts`, tests in
  `demoTriggers.test.ts`) and PWA demo-actions sheet (`src/pwa/PwaDemoActions.tsx`).
- Purity tests that the new code must keep green: `src/pwa/pwaPurity.test.ts`,
  `src/domain/domainPurity.test.ts` (the new billing modules) and `src/apps/moneyViewPurity.test.ts`
  (no money on mobile).
- Playwright specs in `aa-prototype/visual/` (`admin-phase07.spec.ts` Review, `admin-phase08.spec.ts`
  invoices, `booking-calculation-display.spec.ts`, `mobile-phase04.spec.ts`, `web-phase05.spec.ts`,
  `pwa-device.spec.ts`, 15a's `warnings.spec.ts`), run by `npm run shots`.

## Work items

**Session 1: the payer through the Contract, the guardian master out, grouping, direct claims, child
warning**

1. **Model.** In `domain/types.ts`:
   - `Procedure.payer?: ContractPayer`, the payer captured with the Procedure's Contract selection
     (OQ-67; US-11.2.2), read only when the Contract names its payer (item 2's
     `contractNamesPayer`):
     - `{ kind: 'patient'; email?: string }`: the patient pays; the email defaults from the
       patient's own and is where a parent's or guardian's email goes for a minor (US-11.2.4).
     - `{ kind: 'named'; id: PayerId; name: string; email?: string; relationshipToPatient?: string;
       phone?: string; address?: string; organisation?: boolean }`: someone else pays, for example a
       guardian. `id` keeps the existing `BP####` format and counter (`counters.billableParty`), so
       Xero contact numbers and Phase 16's "Billable party BP…" contact names stay stable;
       `organisation` (office only, default false) marks a clinic or company, so OQ-73's "never an
       organisation" holds.
     - `email` is optional in the type so the payer can be saved before the email is known; completion
       requires it (items 10 and 11).
   - **The guardian master goes (RV-29):** delete `BillableParty`, `masters.billableParties`,
     `store/billablePartyActions.ts` and its export, `Procedure.billablePartyId`, and the
     `billableParty` holder option in `ContractEditSheet` (18's `bookingBillableParty` holder replaces
     it). `CounterpartyKind` keeps `'billableParty'`, now meaning "a named payer captured on a
     Contract selection", with `id` the payer's `BP####` id. No Booking field holds a billable party
     or an invoice email: there is no per-Booking override (D17).
   - `Invoice.invoiceEmail?: string` and `Invoice.billedTo?: { name: string; address?: string }`,
     snapshots taken at the run, so the document shows who it went to and where, and the payer's
     details stay with the debt (US-11.2.2 note, Greg). Phase 22 sends to `invoiceEmail`; this phase
     only records it.
   - Satisfies DM-11, FT-11.2, US-11.2.1 and US-11.2.2.
2. **Pure rules** in a new `src/domain/billing/billableParty.ts`, re-exported from the billing index
   and covered by Vitest:
   - `contractNamesPayer(contract, masters)`: true when the holder is `{kind: 'bookingBillableParty'}`
     (RVG Default Post-paid, Aria, and 19a's defaults if they carry that holder) **or** an insurer
     that does not accept direct claims (`Insurer.acceptsDirectClaims` false; US-11.4.2, the
     Contract-holder flag that replaces the removed insurer route). The one predicate OQ-78 would
     move.
   - `billablePartyForProcedure(procedure, contract, patientId, masters)`: when the Contract names its
     payer, the captured payer (`{kind: 'billableParty', id}` for a named payer, otherwise
     `{kind: 'patient', id: patientId}`, US-11.2.1); otherwise 18's `holderCounterparty` (hospital,
     insurer, surgeon, or a surgeon group's billing organisation). The price is never read here
     (US-11.2.2: independent of pricing).
   - `forwardsToInsurer(contract, masters)`: the insurer the patient claims from when the Contract's
     holder takes no direct claims, else undefined. Feeds the invoice note (item 4) and the Review
     line (item 7).
   - `isPersonParty(party, payer)`: true for the patient and for a named payer not marked
     `organisation`. Phase 20's interim prepayment flag (`setBookingPrepayment`'s `noPersonBilled`
     refusal, and Phase 27 after it) reads this instead of the holder kind (OQ-73, D23).
   - `defaultInvoiceEmailFor(party, masters)`: patient `email`, hospital contact email and surgeon or
     rooms contact email (17), otherwise undefined. Insurers have none (nib is a portal, Phase 22).
   - `invoiceEmailFor(procedure, contract, party, masters)`: the captured payer's `email` when the
     Contract names its payer, else the holder's `defaultInvoiceEmailFor`. A guardian's email never
     reaches a hospital invoice, and a hospital's never a patient's.
   - `ageOnDate(dobISO, onISO)`, a pure age helper (move the maths out of `shared/format.ts`
     `ageYears` and have `ageYears` call it, so the app and the rule agree).
   - `childBillablePartyOn(procedures, contracts, patient, listDateISO, masters)`: true when the
     patient is under 18 **on the List date** and any Procedure's party is `{kind: 'patient'}` for
     that patient. False when the party is anyone else (a hospital, a named guardian). US-11.2.4 AC1
     and AC2.
   - If Phase 20 hides an insurer-held Contract whose insurer takes no direct claims, lift that hide:
     the Contract is offered, and it names its payer. Keep 20's tests honest by changing that
     expectation, not deleting it.
3. **Store action: one writer for the payer.**
   - `setProcedurePayer(api, actor, procedureId, payer | null)` is the **only** action that writes
     `Procedure.payer`. It refuses when the Procedure's Contract does not name its payer
     ("This Contract already says who pays."), allocates a `BP####` id for a new named payer (or
     keeps the id it is given, for "Same payer as {procedure}"), checks the email's shape when one is
     given ("Enter a valid email."), and runs through the standard `editRefusal` matrix: the
     anaesthetist on their own DRAFT List, the office on DRAFT and SUBMITTED, nobody on AUTHORISED.
     It goes through `mutate()`, audited `procedure.payer` with a before/after label.
   - `setProcedureContract` (20's) does not touch `Procedure.payer`: a captured payer on a Procedure
     moved to a fixed-holder Contract is kept but unused, so moving back restores it. When a new
     Procedure inherits a patient-direct Contract (20), it also copies the first Procedure's payer,
     id included, so one guardian gives one invoice.
   - 15a's warnings are derived by selectors over the pure routine (only clearances are stored), so
     nothing re-runs: the child rule sees the payer through `warningFactsFor` (item 6). Add
     `ACTION_LABELS` and `FIELD_LABELS` entries so History reads "Who pays: Patient to Hana Park
     (Mother)".
   - The insurer's direct-claims flag stays edited by `setInsurerDirectClaims`; the Master data
     Contract detail for an insurer-held Contract shows it read-only as "Holder takes direct claims:
     Yes / No", linking to the insurer row.
4. **Billing run grouping** (`invoiceBuild.ts`):
   - Replace the interim `counterpartyForProcedure` with `billablePartyForProcedure`, and
     `payerForProcedure` becomes a thin selector over it. A line's `funderOverride` still beats it
     (the interim split until Phase 22's payment setting), so Alan Prentice's two invoices and
     figures are unchanged.
   - Group by the party: one invoice per distinct party per Booking (US-08.2.1 behaviour, unchanged).
   - `layoutFor` stays kind-based (Phase 22 makes it Contract-driven).
   - Snapshot `invoiceEmail` and `billedTo` on each invoice.
   - `buildPrePaymentInvoiceForBooking` covers the Procedures whose party `isPersonParty`, so a
     guardian pays a prepayment and an organisation payer never gets one (OQ-73, D23).
   - `counterpartyName`, `xeroHandoff`'s contact lookup, `seed/billing.ts` and `seed/history.ts`
     resolve a `billableParty` counterparty from the captured payer through one selector
     (`payerRecordFor(state, payerId)`), or from the invoice snapshot, never from a master table.
     Phase 16's contact-name helper is unchanged.
   - `InvoiceDocument`: show `billedTo` (name and postal address where there is one) and the email
     under the addressee, and bring back the "claim this invoice from {insurer}" note that Phase 20
     retired: extend 20's pure `patientInvoiceNote` to read `forwardsToInsurer` (the Procedure's
     Contract holder), never a payment category.
     The existing "Email invoice" action (`markInvoiceEmailed`) names the snapshot address in its
     confirmation and audit; Phase 22 replaces the send itself.
   - Tests:
     - The same Procedure on the RVG Default Post-paid with a guardian payer, and on the List
       hospital's RVG Default Hospital Contract: the fee is identical to the cent (if 18 and 19a price
       both at RVG units and the anaesthetist's rate; otherwise compare the guardian and patient
       payers on the same Contract); the invoice goes to the guardian on the patient layout, or to the
       hospital on the holder layout (US-11.2.2 AC).
     - A Procedure on an AIA-held Contract (AIA takes no direct claims) bills its payer, the patient
       by default, and its invoice carries the "claim from AIA Health" note (US-11.4.2). Toggling AIA
       to accept direct claims makes the party AIA.
     - Two Procedures with different holders give two invoices; two Procedures with the same named
       payer id give one.
     - Figures unchanged: S3's Holt $396.18, Prentice $152.38 and $91.43.
     - A guardian prepayment invoice is addressed to the guardian; an organisation payer raises none.
5. **Who pays, at the Contract pick, and the Billing block** (shared, all three apps, through
   `useSurface()`):
   - A new `shared/flows/ContractPayerStep.tsx` (bottom sheet on mobile, dialog on web and admin),
     opened as the second step of 20's `ContractPickerSheet` whenever the picked Contract
     `contractNamesPayer`, and on its own from the Billing block's "Who pays" link:
     - **The patient** (preselected): their name, fixed, and an email field prefilled from the
       patient's own. When the patient is under 18 on the List date, its hint reads "For a patient
       under 18, enter a parent's or guardian's email, or choose Someone else."
     - **Someone else**: name, relationship to the patient, email, optional phone and postal address,
       and, for the office only, "An organisation, not a person".
     - **Same payer as {procedure}** when another Procedure on the Booking already has a named payer.
     - Save calls `setProcedurePayer` once. The email may be left blank with the hint "Needed before
       Mark complete". The same step serves the anaesthetist and the office (US-11.2.2 names both);
       the rights come from the store guard.
   - Mobile stays mobile-first: tappable rows, a segmented choice, no dropdown. No money on mobile.
   - The anaesthetist's view stays simple (US-15.0.1, Phase 20): the step shows only who pays and
     where to send the invoice, no holder kind, category or pricing basis.
   - A "Billing" section in `BookingDetailBody`'s context slot with two rows:
     - **Invoice to**: the party per Procedure. One name when all agree; otherwise one line per
       Procedure, each with its Contract's name. A small "Under 18" chip sits by the patient's name
       when the child warning applies. A "Who pays" link opens the payer step on a Procedure whose
       Contract names its payer; on any other Procedure the link reads "Change Contract" and opens 20's
       picker, because changing who pays means choosing another Contract (D17).
     - **Invoice email**: the effective email, or a warning-tint "Needed" chip when a person party has
       none. The postal address, where there is one, sits beneath in small type.
   - Remove the payer select and "New guardian" from `OfficeBillingSetup`, `EditBillingSetupSheet` and
     `ManualBookingForm`. The "Contract and payer" sheet's payer row (20) shows the captured payer and
     opens the payer step. `ManualBookingForm` and `PhoneAdviceBooking` run the same payer step when
     the Contract row's pick names its payer (S2 lands on St George's hospital default, so it asks
     nothing), and `createBooking` takes the payer with the Contract pick.
6. **Child billable party: a mild warning** (D4, OQ-54 answered; US-11.2.4, DM-31):
   - Add the rule the way 15a's handoff says every later rule is added: a rule file
     `src/domain/warnings/rules/childBillableParty.ts`, its entry in `WARNING_RULES`,
     `'childBillableParty'` in the `WarningRuleId` union, its default (active, no params) in
     `appSettings.warningRules` (`backfillMerge` fills it for a persisted store), optional facts on
     `WarningFacts` (the patient, the Procedures' Contracts and the masters `childBillablePartyOn`
     needs; the List, and so its date, is already a fact) filled by `warningFactsFor`, and its sample
     (Demo triggers). Kind `beforeProcedure`, strength `mild`, one finding per Booking (key
     `${bookingId}:childBillableParty`), evaluated by `childBillablePartyOn`. Text (verbatim,
     dash-free): "{Patient} is under 18 and is the billable party. Check the invoice email is a
     parent's or guardian's."
   - It shows wherever 15a shows warnings: the Admin dashboard to-do list (with Clear, AC3), the
     triangle on the Booking in mobile, web and admin, the warning visible on opening the Booking,
     and the Review row (15a puts the triangle there). Do **not** add a `reviewFlags` entry for it.
   - No warning when the party is someone else (AC2): a named guardian, or a hospital-held Contract.
     The warning is derived, so naming another payer or moving to a hospital Contract makes it
     disappear.
   - It never blocks: saving, completing, submitting (straight through, with no confirm step, as 15a
     left it) and authorising all proceed with it open. `authoriseList`, PWA "Play the office" and
     14's "Office authorises this List" are untouched by it.
   - The payer step: when the patient is under 18 on the List date and "The patient" is chosen, an
     inline mild note repeats the warning text. It does not stop the save.
   - Tests:
     - 17 years 364 days on the List date raises it; 18 on the List date does not.
     - A named guardian raises none; a hospital-held Contract on a child raises none.
     - Clear removes it from the to-do list, and an unrelated edit does not bring it back (15a's
       clearance is keyed by warning and holds at the same strength; this rule is always mild).
       Assert the rule 15a actually built.
     - `authoriseList` succeeds on a List whose Booking carries the open warning.
7. **Review: who is invoiced, and the insurer check.** US-07.2.2.
   - In `ReviewScreen.tsx`, Phase 20's "Payer" column becomes **Invoice to**: each distinct party
     name, with its email in small mono beneath (or a "Needed" chip) and its postal address where it
     has one (US-07.2.2 "addresses and invoice email addresses").
   - The Patient cell gains an age chip when under 18 on the List date, and an insurer line read from
     the Procedures' Contracts (no Booking field holds an insurer): "nib · member 12345678" for an
     insurer-held Contract, or "AIA Health · no direct claims, patient forwards" (US-11.4.2).
   - Each row gains an **Open** link to the admin Booking detail that returns to this Review screen
     (US-07.2.2 "approve or correct" without leaving for Day view).
   - `reviewFlags.ts`:
     - Add "Invoice email missing" (neutral, only reachable on a moved-in incomplete Booking).
     - Add "No Contract" (neutral, same reachability).
     - Add "Insurer's Contract?" (neutral): the Booking carries an insurer member number (item 9) but
       no Procedure is on an insurer-held Contract, so the office checks whether a Procedure needs
       one (US-07.2.2 "whether a Procedure needs an insurer's Contract"). It joins in session 2 with
       the member number. There is no Booking funding source to read (D2).
     - All advisory; they never gate authorise.
     - Take the new inputs as parameters so the module stays pure.
   - Keep the table inside the mockup's anatomy: columns, not new panels.
8. **Seed, persist and sample, then re-green (end of session 1).**
   - **Patients:** give every generated and pinned patient a deterministic `@example.net` email (for
     example `firstname.surname@example.net`), except the cases item 14 leaves blank on purpose.
   - **Captured payers:** every seeded Procedure on a Contract that names its payer gets one, handcrafted,
     filler and `history.ts` alike: `{kind: 'patient', email}` from the patient's own (Riley, Nair,
     the self-funded and history rows Phase 20 moved onto RVG Default Post-paid).
   - **Guardian master re-expressed (RV-29):** `BILLABLE_PARTIES` and `masters.billableParties` go.
     Grace Park's Procedure (Chen Fri 24, `SEED_MARKERS.guardianMinorBooking`) gets a named payer
     `{id: 'BP0001', name: 'Hana Park', relationshipToPatient: 'Mother', email, phone, address}` from
     today's record (no warning: someone else pays), and the guardian history row `pa05` resolves to
     the same payer. The two Aria Procedures (Fitzgerald Wed 15, Souter Mon 27) get a named payer
     `{id: 'BP0002', name: 'Aria Skin and Laser Clinic', relationshipToPatient: 'Contracting clinic',
     organisation: true, email, phone, address}`. Keep `counters.billableParty` past BP0002. Check
     every Xero contact, invoice and history figure is unchanged.
   - **Filler:** check no filler patient under 18 lands on a Contract that names its payer with the
     patient paying, or the to-do list fills with stray child warnings.
   - **Child review List:** on a spare, deterministic, past-dated **SUBMITTED** List with a hospital
     no S1 to S5 beat uses (not the S2 or S3 Lists), seed two completed Bookings with dedicated
     pinned patients (fixed valid NHIs, not `takePatient()`):
     - a 15-year-old on the patient-direct RVG Default Post-paid Contract, payer `{kind: 'patient'}`
       with their own email (`SEED_MARKERS.childBilledDirectly`: raises the warning);
     - a 12-year-old on the List hospital's RVG Default Hospital Contract, so the hospital is the
       billable party (`SEED_MARKERS.minorHospitalBilled`: no warning).
     Past Lists are filled by the filler (`bookings.ts` ~l.1187), so either pick a List the filler
     leaves empty or add it to `pinnedListIds` and re-check that no scripted figure moved (pinning
     shifts the filler's draws downstream). Record it as `SEED_LIST_IDS.childPayerReview`. Nothing else
     is seeded for the warning: it is derived from these Bookings, so the to-do list shows it on load,
     and no clearance is seeded.
   - **AIA reimbursement (Webb, Rutherford Thu 16):** if 18 seeded no AIA-held Contract, add "AIA
     Health" (Insurance category, holder AIA, RVG units at the anaesthetist's rate, labelled a demo
     reading in `contracts.ts`) and move the Booking's Procedure onto it from RVG Default Post-paid,
     payer the patient, so the fee is identical to the cent. US-11.4.1 says an insurer that accepts
     direct claims holds Insurance Contracts; it does not say one that takes none holds a Contract,
     so this AIA Contract is our reading of how the system knows the patient's insurer once no
     Booking field holds it (D2). Record it in the Decisions log.
   - **Riley (S4 Beat 1):** has an email, so S4 Beat 1 is unchanged.
   - **Sample:** add the `childBillableParty` entry to 15a's `WARNING_SAMPLES`, staged on the
     `minorHospitalBilled` Booking (see "Demo triggers").
   - **Persist:** bump `PERSIST_VERSION` by one from the value the previous phase left.
   - **Tests:**
     - Update `seed.test.ts` and `demoScenarios.test.ts`: the only child warning in the pristine seed
       is on `childBilledDirectly`; the review List is SUBMITTED and off every scripted beat; every
       Procedure on a Contract that names its payer has one; no master or field named
       `billableParties` or `billablePartyId` remains.
     - Grep `src` for `billablePartyId`, `createBillableParty`, `billableParties` and `New guardian`:
       nothing outside a comment recording the removal.
     - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` before
       starting session 2.

**Session 2: required inputs, completeness, not on schedule, Contract approval**

9. **Required inputs on the Contract.**
   - `Contract.requiredBookingInputs: RequiredBookingInput[]`, where the type is `'invoiceEmail' |
     'billableParty' | 'prepaidAmount' | 'insurerMemberNumber' | 'claimReference' | 'purchaseOrder'`
     (domain-model `requiredBookingInputs`; US-04.2.7 lists the first five, the purchase order comes
     from the domain model). US-04.2.7.
   - Where each value lives (domain model "Procedure billing context"):
     - `Booking.insurerMemberNumber?` (new; an input value, not an insurer reference).
     - `Booking.purchaseOrder?`.
     - `claimReference`: kept as the existing per-Procedure `billingReference`, relabelled "Claim or
       hospital reference" (decision below).
     - `prepaidAmount`: 20's interim `Booking.prepayment`.
     - `billableParty`: met when every Procedure under the Contract has a captured payer. A Contract
       that names its payer requires it implicitly (item 10), declared or not; on a Contract whose
       holder is the billable party the editor disables the tick with "The holder is the billable
       party."
     - `invoiceEmail`: met by `invoiceEmailFor` (the payer's email, or the holder's contact email).
   - Record the `claimReference` placement in the Decisions log. Moving the reference to the Booking
     would ripple through intake and the invoice for no demo gain; every seeded multi-Procedure
     Booking already shares one reference.
   - `editContract` and the Master data Contract sheet (18's) gain a "Required on each Booking"
     checkbox group of the six inputs.
   - `editBooking` gains `insurerMemberNumber` and `purchaseOrder` in its patch, audited
     `booking.update`.
10. **Pure required-input rules** in `src/domain/billing/requiredInputs.ts`:
    - `requiredInputsFor(booking, procedures, contracts, masters)` returns each required input with
      the Contract names that require it. It is the union across the Booking's Procedures, plus,
      **implicitly**: `billableParty` on every Procedure whose Contract names its payer (US-11.2.2:
      picking one asks for the payer), and `invoiceEmail` whenever any party is a person (US-11.2.3:
      no contract holder to send to).
    - `missingRequiredInputs(…)` returns what is absent.
    - `requiredInputValuesFor(booking, procedures, …)` returns the values as one map keyed by
      `RequiredBookingInput`, whatever field each lives in. Phase 25 locks that map at authorise and
      re-checks it with `missingRequiredInputs`, so keep both pure and exported.
    - Tests: each input satisfied and missing; the union across two Contracts; the implicit payer and
      email on a patient-direct Contract and on an AIA Contract; a named guardian with no email
      missing `invoiceEmail`; a hospital-held Contract needing neither.
11. **Completeness** (`validateBookingForBilling`). US-03.6.1 and FT-03.6.
    - **Every Procedure has a Contract** ("Choose a Contract for this procedure."). Keep 20's check if
      it exists.
    - 20's "the guardian override resolves" check goes with `billablePartyId`. In its place, a
      Procedure whose Contract names its payer and has none fails "Choose who pays for this
      procedure." (anchored on the Billing block's Invoice to row).
    - **Every Procedure has an RVG code or a fee-schedule line** (US-03.6.1): keep today's check as
      18, 19 and 19a reshaped it; do not duplicate it.
    - **Every Procedure has start and handover times** (US-03.6.1, linking US-03.3.3), not only those
      with an RVG code. The model has no untimed kind, so the rate x time and fixed-line Procedures
      now need times too. Anchor fields stay `anaestheticStartISO` and `handoverISO`.
    - **Every missing required input** becomes a Booking-level failure (no `procedureId`) with
      verbatim, dash-free copy:
      - "Add an invoice email. This Booking is billed to {name} directly."
      - "{Contract} needs the insurer member number."
      - "{Contract} needs a claim reference."
      - "{Contract} needs a purchase order number."
      - "{Contract} needs the prepaid amount."
    - Warnings are not failures: the child warning (item 6) and 15a's other warnings never appear
      here.
    - The context gains `patient`, `listDateISO`, the Procedures' Contracts and the masters the party
      rules need. It is built in two places, `billingContextForBooking` (store) and
      `BookingDetailBody`; update both, or make the component call the selector so they cannot drift.
    - The Billing block (item 5) grows a row per required input (member number, purchase order,
      reference) carrying `data-validation-fields`, so the existing latch scrolls to and focuses the
      first missing one on mobile and web. Booking-level failures render in the block, not in
      "Also outstanding".
    - The holder-based `billingReferenceMissing` (20's interim) stays a **neutral advisory** only
      where no Contract requires `claimReference`. Where one does, it is a completion failure. The S3
      Forte AM "No billing reference" flag therefore still shows.
    - `SubmitListSheet` blockers pick the new messages up unchanged.
    - Tests cover each new failure and the focus anchors.
12. **Not on the Contract's schedule** (US-04.3.7, replacing the silent BTM fallback):
    - `fee.ts`: when a fixed-schedule Contract has no line for a Procedure that is not additional
      (`isAdditional` false; there is no `isPrimary` until Phase 23), the result carries
      `scheduleMiss: true` and a BTM **estimate**, labelled as such wherever a fee shows (office
      only; `moneyViewPurity` keeps it off mobile): "Not on {Contract}'s schedule. Estimate at RVG
      units."
    - The additional-procedure ordinal fallback (the 2026-07-22 ruling in `fee.ts`) stays as it is,
      and `isScheduleMiss` skips additional Procedures; Phase 23 rebuilds the multi-procedure rule.
    - **Setting an off-schedule Contract** (AC1: "an admin can still set the Contract"). 20's
      filtered picker and `setProcedureContract` refuse `contractOutOfScope` when the procedure is
      outside a Contract's scope. For the **office only**, a fixed-schedule Contract whose hospital
      scope matches but which has no line for the procedure is offered in a separate picker group,
      "Not on this Contract's schedule (to confirm with the hospital)", and `setProcedureContract`
      accepts it for an office actor. Anaesthetists keep 20's filter. Tests: office accepted,
      anaesthetist refused, every other scope miss still refused.
    - A pure `isScheduleMiss(procedure, contract, lines)` drives a warn flag "To confirm with the
      hospital" in three places: on the Booking detail (all apps, banner on the Procedure), in
      `reviewFlags`, and as an **authorise blocker**. The patient is never invoiced before the office
      confirms (AC2).
    - Add a pure `authoriseBlockersFor(state, listId)` in `store/lifecycle.ts`, with the schedule miss
      as its only kind in this phase (Phase 25 adds a Contract not in force, Phase 40 a missing NHI).
      `authoriseList` refuses with `authoriseBlocked` and the per-Booking details; the Review action
      bar shows the sentence "Authorising is blocked until {procedure} is confirmed with the
      hospital." in place of the enabled button. 14's "Office authorises this List" and "Play the
      office" call the same guard: the stand-in shows the sentence as its result line, the timer
      fails quietly, and neither records anything half-done.
    - The flag is derived, not stored: it exists while the miss exists, so it cannot drift.
    - Office resolves it with `confirmScheduleMiss(api, actor, procedureId, outcome)` from a
      "Confirm with hospital" sheet (labelled a proposed flow). The outcomes (US-04.3.7 AC3, as
      reworded for OQ-67):
      - **Standard RVG pricing, the patient pays:** set the Procedure's Contract to the procedure's
        patient-direct default RVG Contract (19a's, or the RVG Default Post-paid), then the payer
        step (item 5) through the same `setProcedurePayer`.
      - **Standard RVG pricing, the hospital takes the invoice:** set the Procedure's Contract to the
        List hospital's RVG Default Hospital Contract (US-04.3.3), whose holder is the billable party.
        No billable party is stored anywhere else (D17).
      - **Fixed price confirmed:** add a fee-schedule line through 18's line action, effective from
        the List date.
    - Each outcome is one `mutate()` with two audit metas (`procedure.scheduleConfirm` plus the
      Contract or line change); the payer step after the first is its own audited save.
    - Anaesthetists see the flag read-only.
    - Tests: the miss detected; no silent fallback; each outcome clears it; authorise refused while it
      is open; the PWA stand-in refused without a half-done write.
13. **Review approves every Contract** (US-07.2.2, DM-37):
    - The Contract column lists **every Procedure's Contract**, one line each, not only the primary.
    - Each line shows "Changed by Dr {surname}: was {old}" (read through 20's
      `pendingContractChange`) with a teal **Approve** and a **Correct** link (opens the Booking's
      billing setup), or "Approved {time}" once done. 20's "Contract changed by anaesthetist" warn
      flag in `reviewFlags` becomes this line's source and drops once approved; do not show both.
    - Store `approveContractSelection(api, actor, {bookingId, procedureId?})`: office only; DRAFT or
      SUBMITTED; stamps a minimal `Procedure.contractApproval = {by, atISO, how: 'explicit' |
      'authorise'}` (20 derives the change from audit and stores none). Audit
      `procedure.contractApprove`. An office re-pick through `setProcedureContract` counts as approved
      (stamp it too), replacing 20's interim "an office pick clears it".
    - An approve-all per Booking and per List.
    - `authoriseList` stamps approval on every Procedure still unapproved, in the same `mutate()`,
      audited "approved at authorise". Every Contract is therefore approved by the time the List
      locks, and Phase 25 locks an approved selection.
    - The authorise confirm dialog says how many changes it will approve. This is not a gate: review
      stays the human sanity check (Phase 07 ruling).
    - Tests: rights, the stamps, approval at authorise, and History labels.
14. **Seed for session 2**, then bump `PERSIST_VERSION` again:
    - **Declarations** (labelled demo readings in `contracts.ts`):
      - Patient-direct RVG Default Post-paid: `invoiceEmail` (also implicit).
      - The ACC Contracts (St George's ACC, COS ACC): `claimReference`.
      - nib Insurance: `insurerMemberNumber`.
      - `billableParty`, `prepaidAmount` and `purchaseOrder` are declarable in the editor but seeded
        nowhere; Phase 27 decides what prepayment requires.
    - **Values:** seed member numbers on every Booking with a nib-held Procedure; a claim reference on
      every Booking under an ACC Contract that lacks one (handcrafted and filler; Losa Tuilagi's
      `ACC45-118844` on Ropata Thu 16 must stay, Phase 25's failure trigger clears it through an
      office `editProcedure` on the SUBMITTED List, so that edit must not un-complete the Booking); and times on
      the seeded completed rate x time and fixed-line Procedures that lack them (Aria, Wed 15).
    - **Schedule miss:** if 18 did not seed a hospital-held fixed-schedule Contract at Christchurch
      Eye, seed "Christchurch Eye cataract package" (two eye procedures from the master). Put one
      **schedule-miss** Booking (strabismus or another eye procedure off the schedule) and one
      patient-direct **invoice-email-missing** Booking (payer the patient, whose record has no email)
      on Dr Souter's Wed 22 Jul AM Christchurch Eye List (`wed22Ces` in `bookings.ts`, already pinned
      out of the filler with six eye Bookings; DRAFT, not Rutherford's S2 List), appended after the
      existing six with dedicated pinned patients (not `takePatient()`, which would shift every later
      filler Booking), with `SEED_MARKERS` `scheduleMissBooking` and `invoiceEmailMissingBooking`.
    - **Tests:**
      - New seed test: every completed, non-cancelled seeded Booking passes the new validator
        (including both Bookings on the child review List).
      - `authoriseBlockersFor` is empty for every seeded SUBMITTED List (S2 Beat 4, both S3 Lists and
        the child review List stay authorisable).
      - The two markers fail as designed.
15. **Demo triggers** (register in `src/shared/demoTriggers/registry.ts`; bodies in `src/store`, see
    "Demo triggers" below):
    - The child sample added to 15a's `WARNING_SAMPLES` (item 8).
    - "Office approves this Contract change" on the PWA mobile Booking.
    - Tests in `demoTriggers.test.ts` and 15a's sample test: the PWA entry's `disabledReason`, route
      scoping (never returned for `'bar'`), stage then unstage returning the target Procedure to its
      seed Contract and payer, a second press doing nothing new, the AUTHORISED skip, and
      `pwaPurity.test.ts` still green.
16. **Copy, labels and shots.**
    - Add `ACTION_LABELS` and `FIELD_LABELS` for every new action and field.
    - Remove stale "payer derived from route", "Payer (default)", "New guardian" and guardian-record
      copy.
    - Add `data-shot` hooks: `booking-billing-block`, `contract-payer-step`, `review-invoice-to`,
      `review-contract-approve`, `schedule-miss-banner`, `authorise-blocked`, and
      `todo-child-warning` on the to-do row.
    - Update the Playwright specs in `aa-prototype/visual/` that snapshot Booking detail, Review, the
      billing setup sheet, the to-do list or the invoice document (see Reference), and re-shoot.
    - No en or em dashes anywhere in the new copy.
17. **Decisions log** (PROGRESS.md), superseding earlier readings:
    - The guardian override record (2026-07-22 third and seventh reviews: the billable party defaults
      to the patient, with a typed override record when someone else pays) is replaced by OQ-67's
      answer: the Contract always defines the billable party, and a Contract that names its payer
      captures the payer's name and email on the Procedure (RV-29). `BillableParty` and
      `createBillableParty` are gone; the `BP####` ids live on as payer ids.
    - The 7th-review A1/B15 payer reading is replaced: the payer is each Procedure's Contract-defined
      party, not the route.
    - The silent BTM fallback on a fixed-schedule miss (the 2026-07-22 "Type 3 second-procedure
      fallback" reading, and the 8th-review comment in `fee.ts`, for primary Procedures) is now a
      flagged miss.
    - Phase 07 said "authorise is never gated by flags". One named blocker now exists, an unconfirmed
      schedule miss, from one pure function. The child billable party is a mild warning, never a
      block (D4, OQ-54); every other flag stays advisory.
    - The RVG Default Hospital Contract bills the hospital and asks for no payer; the patient-direct
      defaults ask (drift-check step 6, under OQ-78). The payer capture is one action and one
      predicate so OQ-78 can move it.
    - An insurer that takes no direct claims is read through an insurer-held Contract that names its
      payer (US-11.4.2; the AIA Health Contract is a demo reading).
    - The Aria clinic is a named payer marked as an organisation, so it never gets a prepayment
      (OQ-73), on a Contract 18 left as `rvgDefaultPostPaid`.
    - The `claimReference` placement.
    - The office-only exception to 20's scope filter: an off-schedule fixed-schedule Contract can be
      set by the office, and the schedule miss it creates is derived, never stored.

## Demo triggers

| Label | Screen (routes) | Surface | Effect |
|---|---|---|---|
| **Raise sample warnings** (15a's, extended) | 15a's routes (Admin · Day, Admin · Booking detail, Mobile · Booking) | As 15a set it | 15a's body, which now also stages a child billed directly (below); "Clear sample warnings" unstages it |
| **Office approves this Contract change** | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | PWA sheet only (`surfaces: ['pwa']`, `badge: 'office-stand-in'`) | `approveContractSelection` on the Booking in the URL, as 14's `OFFICE_SIMULATION_ACTOR` ("AA office (simulated)", office role and source) |

**Product, no button.** In the Contract picker on mobile, web and admin, picking a default or
patient-direct Contract opens the payer step (the patient, or someone else, with name and email).
This is the US-11.2.2 beat and needs no trigger.

**Seeded, no button.** The child review List (item 8) sits in the Review queue on load: the
15-year-old billed directly carries the mild warning on the to-do list, the Review row and the
Booking's triangle, and the hospital-billed 12-year-old beside it shows none. Grace Park's
guardian-paid Booking is a second no-warning case. The schedule-miss and invoice-email-missing
Bookings sit on Wed 22 AM Christchurch Eye.

**Raise sample warnings: the child sample.**
- **What it adds.** A `childBillableParty` entry in 15a's `WARNING_SAMPLES`
  (`src/store/warningSamples.ts`), following 15a's `isStaged`/`stage`/`unstage` contract; it creates
  no Booking. `stage`, as 15a's `DEMO_TRIGGER_ACTOR`, moves the target's Procedure onto the
  patient-direct RVG Default Post-paid through `setProcedureContract` and then sets
  `{kind: 'patient'}` through `setProcedurePayer`, so the derived child warning appears; `unstage`
  restores the Procedure's seed Contract and payer from `buildSeed()`. The target is the Booking in
  the URL when its patient is under 18 on the List date, otherwise (and from the Day view) the
  `SEED_MARKERS.minorHospitalBilled` Booking, the hospital-billed 12-year-old. That target is a
  minor, which `multiWarning` is not, so this sample does not land on `multiWarning`; say so in the
  PROGRESS entry. A system actor's Contract change is not an anaesthetist change, so it raises no
  approval flag.
- **Why.** After the seeded child warning has been cleared in an earlier demo, the presenter can
  raise a fresh one (a different warning key) without a reset.
- **Disabled state.** Follows 15a's ("Samples already raised"). When the target's List is AUTHORISED
  (the child review List was authorised in the S2 aside), this sample is skipped and the result line
  says "The child sample's List is authorised. Reset to raise it again."; the other samples still
  stage. The body lives in `src/store` beside 15a's, so the PWA purity test holds.

**Office approves this Contract change.**
- **When it shows.** Only when the Booking has an unapproved anaesthetist Contract change; otherwise
  it is disabled with "No Contract change to approve", or "This Booking's List is authorised" once
  locked.
- **Why it exists.** The handset beat: the anaesthetist changes the Contract on the phone, sees it
  "awaiting office approval", and the office stand-in approves it, so the phone shows "Approved by
  the office {time}". In the framed build the presenter approves on Admin Review instead, so no bar
  entry.

**No other triggers.** Choosing who pays, an invoice email, a member number, clearing a warning
(Admin to-do list, or 15a's PWA "Office clears this warning"), or confirming a schedule miss are
product actions in the product UI. No "Stage child billed directly" button and no
`src/store/demoStaging.ts`: the case is seeded.

## Out of scope

- Sending the invoice to the email or the portal, Contract-driven layout and delivery, agent
  wording, and the Contract payment setting (full or split, typed $ or % shares) that replaces
  `funderOverride` (Phase 22).
- The primary Procedure and the multi-procedure rule, including the additional-procedure ordinal
  fallback (Phase 23).
- Contract versions, and locking the selection, payer and inputs at AUTHORISED (Phase 25).
- Deriving prepayment and what `prepaidAmount` means once derived (Phase 27).
- Additional invoices to any party (Phase 38b) and credit notes (Phase 39); they reuse this phase's
  party and payer, not a second record.
- A patient record screen, missing NHI and the outstanding-balance warning (Phase 40).
- Warning settings (thresholds, switching rules off): US-13.7.4 is Future.
- Hospital data setting the Contract (Future Work lane, OQ-22).
- A payer master screen, payer search across Bookings, or archiving a payer when the debt closes: the
  payer lives on the Procedure and its invoice snapshot. Build none.
- Greg's no-default-Contract model (OQ-78, open): not built; the capture is kept movable instead.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed
to the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] **Guardian through the Contract (US-11.2.2 AC).** Admin, a DRAFT Booking: change a Procedure's
      Contract to the RVG Default Post-paid. The payer step opens; choose Someone else and enter a
      guardian's name and email. Invoice to shows the guardian with that email, the fee is unchanged
      to the cent, and History records "Who pays".
- [ ] **Hospital takes the invoice.** On the same Booking, change the Contract to the List hospital's
      RVG Default Hospital: Invoice to shows the hospital and its contact email, no payer step
      opened, and the fee is unchanged. Nowhere on the Booking is there a separate billable-party
      field.
- [ ] **Anaesthetist on mobile and web.** As Dr Souter on a DRAFT Booking, pick the RVG Default
      Post-paid: the payer step is a bottom sheet on mobile and a dialog on web, prefilled with the
      patient and their email; choose Someone else and save a guardian. No holder kind, category or
      money shows.
- [ ] **Office rights.** On a SUBMITTED List the anaesthetist cannot change who pays; the office can.
      Nobody can on AUTHORISED.
- [ ] **Guardian master gone.** Grace Park's Booking shows Hana Park (Mother) as Invoice to; the
      billing setup sheet has no guardian select or "New guardian"; Master data shows no
      billable-party list; the Aria Bookings invoice "Aria Skin and Laser Clinic" exactly as before.
- [ ] **Grouping.** Authorise a List where one Booking has two Procedures with different holders: two
      invoices. Two Procedures with the same guardian ("Same payer as"): one. S3 Beat 1 figures are
      unchanged ($396.18; $152.38 and $91.43).
- [ ] **Insurer that takes no direct claims.** The AIA reimbursement Booking bills the patient, the
      invoice note names AIA Health, and Review shows "no direct claims, patient forwards". The AIA
      Contract's detail shows "Holder takes direct claims: No".
- [ ] **Child warning, seeded.** On load, the Admin to-do list shows the 15-year-old's mild warning;
      the Review row and the Booking (admin, and the triangle on web and mobile, visible on opening)
      show it too. The hospital-billed 12-year-old on the same List and Grace Park show none.
- [ ] **Child warning never blocks.** Authorise the child review List with the warning open: it
      authorises, and invoices go to the patient's captured email. Submitting a List with a child
      warning goes straight through, with no confirm step.
- [ ] **Clear and re-raise.** Reset, then Clear the warning from the to-do list: it leaves. Admin
      Day, Demo actions, **Raise sample warnings**: the 12-year-old is now on the patient-direct
      Contract paying directly and a fresh child warning appears. Naming a guardian through the payer
      step removes it; **Clear sample warnings** restores the hospital Contract.
- [ ] **Child note at the payer step.** On an under-18 patient, choose The patient in the payer step:
      the mild note and the parent's email hint show and the save goes through.
- [ ] **Invoice email required.** Wed 22 AM Christchurch Eye, the invoice-email-missing Booking: Mark
      complete on mobile refuses, scrolls to and focuses the invoice email row, and passes once one is
      entered through the payer step.
- [ ] **Required inputs.** A nib Booking missing its member number refuses completion with "{Contract}
      needs the insurer member number." Tick "Purchase order" on a Contract in Master data, and a
      DRAFT Booking under it now refuses until one is entered. The "Billable party" tick is disabled
      on a hospital-held Contract.
- [ ] **Insurer's Contract check.** A Booking with a member number but no insurer-held Contract shows
      the neutral "Insurer's Contract?" flag on Review.
- [ ] **Times on every Procedure.** A fixed-line or rate x time Procedure without times refuses
      completion.
- [ ] **Schedule miss.** The schedule-miss Booking shows "To confirm with the hospital" (Booking
      detail and, once submitted, Review) with an estimate, and its List cannot be authorised, in Admin
      or by the PWA "Office authorises this List". "Confirm with hospital", hospital takes the
      invoice: priced by RVG units on the hospital's default Contract, billed to the hospital, flag
      gone. Reset and repeat with "Standard RVG pricing, the patient pays" (the payer step opens) and
      with "Fixed price confirmed" (a schedule line is added and the Booking prices at it).
- [ ] **Off-schedule Contract.** As the office, on a DRAFT Christchurch Eye Booking with an eye
      procedure off the cataract package, the picker offers the package under "Not on this Contract's
      schedule"; choosing it raises the flag. As the anaesthetist it is not offered.
- [ ] **Contract approval.** Change a Contract as Dr Souter, submit, then on Review: "Changed by Dr
      Souter" with Approve, which stamps "Approved". Authorising another List stamps every remaining
      approval, and History shows it.
- [ ] **PWA approval.** On the PWA, after a Contract change on a Booking, the demo-actions sheet
      shows **Office approves this Contract change**. The phone then shows "Approved by the office".
      It is disabled on a Booking with no change.
- [ ] **Scripted beats unblocked.** S1 Beat 3 (Sarah Mitchell), S2 Beat 4 (Morrison) and S4 Beat 1
      (Riley) run exactly as scripted, with no new blocker and no new warning.
- [ ] No en or em dashes in any new UI copy; teal on every new action; crimson nowhere new.
- [ ] Catalogue screenshots: the recipes for US-11.2.1, US-11.2.2, US-11.2.3, US-11.2.4, US-11.4.2, US-04.2.7, US-04.3.7, US-03.6.1, US-03.6.2 and US-07.2.2 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` all green.

## Demo guide updates

In the same session, patch `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`, the matching sections of
`master-demo-guide.html`, and the Control Panel scenario text in `DemoControlPanel.tsx`:
- **S1 Beat 3:** "Worth pointing at" gains one line. Mark complete also checks the Contract, times on
  every Procedure, who pays where the Contract asks, and any inputs the Contract requires. Sarah is
  on St George's default Contract, which bills the hospital, so nothing extra is asked. Expected
  results are unchanged.
- **S2 Beat 4:**
  - "Say" and "Expected": Review now shows every Procedure's Contract, who is invoiced and where (the
    party each Contract defines), and authorising approves the Contract selections. The beat stays
    non-blocking.
  - Add an **optional aside** after it: the child review List in the Review queue. The 15-year-old
    paying directly carries a mild warning (to-do list, Review row, triangle); the hospital-billed
    12-year-old beside it carries none. Authorise anyway to show it never blocks, or Clear it from the
    to-do list. Before authorising, "Raise sample warnings" brings a fresh one back (on the
    12-year-old).
- **S3 Beat 1:** "It resolves the explicit payer per Procedure … groups by counterparty" becomes
  "groups each Booking's Procedures by billable party, which each Procedure's Contract defines".
  Figures are unchanged.
- **S4 Beat 1:** no change (Riley has an invoice email). Confirm by running it.
- **Cheat sheet:** in the payer section Phase 20 rewrote, the billable party (always the Contract's,
  no per-Booking override; a patient-direct or default RVG Contract asks for the payer's name and
  email, the patient or a guardian; a hospital taking the invoice is the hospital's Contract;
  independent of pricing), the invoice-email rule for patient-direct, the insurer that takes no direct
  claims, the not-on-schedule flag as the one authorise blocker, and, in 15a's warnings section, the
  child rule as a mild warning.
- **Workflows doc:** the booking setup step (who pays, at the Contract pick), the office-review steps
  (Contract approval, invoice to, insurer check, warnings) and the anaesthetist Mark complete step
  (what is checked).
- **Personas doc:** the office inspects who is invoiced and clears the child warning from the to-do
  list; the anaesthetist names a guardian when picking a patient-direct Contract.
- **Control Panel S2 text:** mention the optional child aside and that "Raise sample warnings" lives
  on its screen.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 21` first: earlier phases (20 above all)
may have changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md) Patient-direct Contract makes the patient the billable party | captured · admin-default-payer | Stays captured. Re-point `admin-default-payer` from the office billing setup to the `booking-billing-block` "Invoice to" row on the same admin Booking (`/admin/day/2026-07-21/bookings/BK0008`), keeping the shot `name`; check after 20's migration that BK0008 is on a patient-direct Contract with the patient as payer, otherwise use a seeded one that is. Caption: a patient-direct Contract makes the patient the billable party. |
| [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) Guardian or other payer set through the Contract | partial · admin-guardian-payer (set, edit) | Captured. Re-shoot `admin-guardian-payer` on Grace Park's Booking (`/admin/day/2026-07-24/bookings/BK0033`): `set` shows Hana Park as Invoice to in `booking-billing-block`; `edit` opens `contract-payer-step` with Someone else, name and email (the old step selects the guardian `select` in the billing setup dialog, which is gone). Add `web-contract-payer` and `mobile-contract-payer` (the anaesthetist picks the RVG Default Post-paid and enters a guardian's name and email; a dialog on web, a bottom sheet on mobile) and a `hospital-contract` state on admin: the same Procedure on the hospital's RVG Default Hospital Contract, Invoice to the hospital, fee unchanged. Highlight the payer step. Drop the partial reason. The item's note that its screenshots show the retired override is the catalogue's to remove: hand it to `/update-requirements` in the PROGRESS entry, do not edit the catalogue. |
| [US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md) Invoice email required for patient-direct | absent | Captured. Create a recipe with `web-invoice-email-required` and `mobile-invoice-email-required` on the `SEED_MARKERS.invoiceEmailMissingBooking` Booking (Dr Souter, Wed 22 Jul AM Christchurch Eye; take its id from the built seed, see ATLAS "Seed data"): state `blocked` is Mark complete refused with the invoice email row focused and flagged; state `entered` is the email entered through the payer step and the Booking completing. Highlight the "Invoice email" row. Caption in the catalogue's words: the system requires an invoice email where the Contract bills the patient or their billable party directly. |
| [US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md) Warn when a child is the billable party | absent (create it) | Create, captured. Shots: `admin-todo-child-warning` on `/admin/day/2026-07-21` (the child review List's 15-year-old, highlight `todo-child-warning`, states `raised` and `cleared` after Clear); `booking-child-warning` on the 15-year-old's Booking in admin, web and mobile (the triangle, the warning on opening and the "Under 18" chip); `hospital-billed-no-warning` on the 12-year-old's Booking (`SEED_MARKERS.minorHospitalBilled`) with no triangle. Captions: a mild warning, no block, none when a hospital is the party. Find the ids from the built seed (`SEED_LIST_IDS.childPayerReview`). |
| [US-11.4.2](../../../../requirements-board/requirements/stories/US-11.4.2.md) Insured patient who forwards the invoice | captured · admin-insured-reimbursement | Stays captured. Re-point `admin-insured-reimbursement` (`/admin/day/2026-07-16/bookings/BK0030`) from the office billing setup to `booking-billing-block` showing the AIA Health Contract and the patient as party. Add an `invoice-note` state on the invoice document with "claim this invoice from AIA Health", and a `review-insurer-line` shot on Review ("AIA Health · no direct claims, patient forwards"). Check BK0030 still holds the AIA reimbursement Booking after item 8. |
| [US-04.2.7](../../../../requirements-board/requirements/stories/US-04.2.7.md) Required booking inputs | absent | Captured. Create a recipe: `admin-required-inputs` on Master data, Contracts, the nib Insurance Contract detail with the "Required on each Booking" checkboxes (member number ticked); `mobile-required-input` and `web-required-input` where Mark complete refuses a nib Booking with "{Contract} needs the insurer member number." and focuses the row. Highlight the checkbox group and the refused row. |
| [US-04.3.7](../../../../requirements-board/requirements/stories/US-04.3.7.md) Procedure not on the Contract's schedule | absent (create it) | Create, captured. Admin shots on the `SEED_MARKERS.scheduleMissBooking` Booking (Wed 22 Jul AM Christchurch Eye): `picker` (the "Not on this Contract's schedule (to confirm with the hospital)" group), `flagged` (the `schedule-miss-banner` "To confirm with the hospital" with the estimate), `blocked` (`authorise-blocked` on the Review action bar), `confirmed` (after "Confirm with hospital" with the hospital taking the invoice: the hospital's default Contract, Invoice to the hospital, flag gone). Add a read-only mobile shot for the anaesthetist if the flag shows there. Highlight the banner. |
| [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md) Mark a Booking complete | captured · web-mark-complete, mobile-mark-complete (blocked, complete) | Stays captured. Mark complete now also checks the Contract, times on every Procedure, who pays and the Contract's required inputs. Keep the two shot `name`s and the `blocked` and `complete` states on BK0009 (re-check the highlight `capture-times` still lands). Add a `blocked-inputs` state on web and mobile showing the Booking-level failure copy in the Billing block. |
| [US-03.6.2](../../../../requirements-board/requirements/stories/US-03.6.2.md) Incomplete Bookings listed | captured · web-incomplete, mobile-incomplete (list, blocked) | Stays captured. The `blocked` state lists what is missing, which now includes Booking-level inputs. Re-shoot both and check the new wording reads in the "what is missing" line. |
| [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) Office review of Contracts and references | captured · admin-review-contracts, admin-correct-contract (setup, edit) | Stays captured. Re-shoot `admin-review-contracts` on `/admin/review/L-25490-2026-07-20-AM`: add states for the Invoice to column (`review-invoice-to`), a changed Contract with Approve (`review-contract-approve`), the neutral flags ("Invoice email missing", "Insurer's Contract?") and the Open link; use the child review List for the age chip. Re-point `admin-correct-contract` (BK0010) off the office billing setup block if item 5 moved what it highlights (its `Edit billing setup` click and the `office-billing-setup` ancestor selector, as 20 left them). |

**Recipes this phase breaks.**
- `US-11.2.1`, `US-11.2.2`, `US-11.4.2` highlight the office billing setup on BK0008, BK0033 and BK0030; the payer moves into `booking-billing-block` (item 5). Covered in the table.
- `US-11.2.2` selects the guardian `select` in the billing setup dialog; that select and "New guardian" are gone. Covered in the table.
- `US-07.2.3` highlights the office billing setup ancestor and clicks `Edit billing setup`; confirm both still resolve once the guardian select leaves `OfficeBillingSetup` and `EditBillingSetupSheet`, otherwise re-point to the Contract row. Same check for `US-04.3.2`, `US-04.3.4` and `US-06.3.5` (they click `Edit billing setup` or open the Contract picker, which now has a payer step).
- `US-04.3.1`, `US-04.3.3`, `US-04.3.5`, `US-05.4.2` and `US-05.5.1` highlight `[data-shot=office-billing-setup-1]`: confirm the hook survives the payer row leaving `OfficeBillingSetup`, and re-shoot.
- `US-07.3.2` and `US-08.1.2` shoot the Review table: re-check their highlights after the Invoice to column and Open link change the column order.
- `US-02.5.5` shoots History: the new `procedure.payer` label does not change it, but re-check its highlight.
- Any recipe or ATLAS entry that names `BP0001`/`BP0002` as master rows, or a Master data billable-party list: re-point to the payer on the Procedure.
- The `--dry` run is the check for anything this list missed.

**ATLAS.md.** Update Seed data (the child review List and its two pinned patients, the captured
payers that replace BP0001 Hana Park and BP0002 Aria, the schedule-miss and invoice-email-missing
Bookings, the AIA Contract), Personas and IDs (the new `SEED_MARKERS` and
`SEED_LIST_IDS.childPayerReview`), Existing hooks (`booking-billing-block`, `contract-payer-step`,
`review-invoice-to`, `review-contract-approve`, `schedule-miss-banner`, `authorise-blocked`,
`todo-child-warning`) and the Demo control panel section for the child sample under "Raise sample
warnings".

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard
**adversarial review-and-fix pass (PROGRESS convention 18)**. Fan out independent Opus review
subagents for **quality**, **bugs/correctness** and **plan adherence**, plus a **money-integrity**
lens, since this phase changes who every invoice goes to. This session then independently verifies
every finding against the catalogue and the code, fixes the confirmed ones (adding a test wherever a
bug had none), re-greens, and records the pass in the phase entry. Do not re-raise anything settled
in the Decisions log.

**Steer this phase's reviewers at:**
- **The Contract defines the billable party (D17).** There is no Booking or Procedure override field,
  and no guardian master: `billablePartyId`, `BillableParty`, `masters.billableParties` and
  `createBillableParty` are gone. The only party not read from a Contract holder is the payer
  captured on a Contract that names its payer, written only by `setProcedurePayer` and read only
  through `contractNamesPayer`. Nothing reintroduces an insurer or funding source on the Booking (D2).
- **The billable party is independent of pricing.** No fee path reads `Procedure.payer` or the
  party; a guardian named on the RVG Default Post-paid changes the invoice recipient but not one cent
  of the fee. `funderOverride` lines still beat the party (interim until 22), so the S3 figures hold.
- **Grouping and contacts.** One invoice per distinct party per Booking; one guardian named on two
  Procedures is one invoice. Seeded Xero contacts, invoices and history rows for Hana Park and Aria
  are unchanged. A guardian's email never reaches a hospital invoice. A guardian prepayment goes to
  the guardian; an organisation payer gets none (OQ-73).
- **The child warning (D4).** It is registered once in 15a's routine (no parallel `reviewFlags`
  entry, no blocker anywhere). Age uses the List date, not the demo clock, at the 18th-birthday
  boundary. No warning when anyone other than the patient pays. Clear behaves as 15a's rule says.
  Saving, completing, submitting (no confirm step) and authorising all go through with it open.
- **Completeness.**
  - Every seeded completed Booking passes the new validator.
  - No seeded SUBMITTED List has an authorise blocker, and S1 Beat 3, S2 Beat 4, S3 and S4 Beat 1
    run unchanged.
  - Booking-level failures anchor and focus correctly on mobile and web.
  - The implicit payer and invoice-email rules fire for every Contract that names its payer and every
    person party, declared or not.
- **Authorise blockers.**
  - Exactly one kind exists (an unconfirmed schedule miss). The UI and `authoriseList` share one
    pure function.
  - Authorising stamps every remaining Contract approval atomically.
  - The PWA office simulation cannot half-authorise a blocked List.
- **Schedule miss.** No silent BTM fallback remains for a primary Procedure. The additional-procedure
  ordinal fallback is untouched (Phase 23). Each resolve outcome is a single audited mutation, and the
  "hospital takes the invoice" outcome sets a Contract, never a stored party.
- **Discipline.**
  - Every new write goes through `mutate()` with labels.
  - The child sample is deterministic, idempotent, lives in `src/store`, and passes
    `pwaPurity.test.ts`; the new billing modules pass `domainPurity.test.ts`, and no fee or estimate
    reaches mobile (`moneyViewPurity.test.ts`).
  - The PWA-only trigger never shows in the harness bar.
  - `PERSIST_VERSION` is bumped for each seed change.
  - No en or em dashes in app copy; teal is the only action colour.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the readings built (the RVG Default Hospital Contract bills the hospital and asks for
  no payer, under OQ-78; the AIA Health Contract; the Aria clinic as an organisation payer; the
  `claimReference` placement; the office-only off-schedule Contract), anything logged rather than
  fixed, and the screens worth a look, each with its route and persona (the payer step on mobile and
  web, the Billing block, Review's Invoice to and Approve, the to-do list's child warning).
- **Status table:** add a catch-up row for Phase 21.
- **Phase entry.** A catch-up Phase 21 entry covering:
  - the drift-check result (catalogue diff against 3d3a18c, OQ-67 built as answered, OQ-78's status,
    what 15a, 18, 19a and 20 left that this phase reused, and the RVG Default Hospital reading from
    step 6);
  - the files and actions added, and the guardian master's removal (RV-29);
  - the `PERSIST_VERSION` bumps;
  - the tests added;
  - the List chosen for the child review case and how the child sample was placed;
  - the manual checklist, item by item;
  - the adversarial review pass;
  - anything deferred to 22, 23, 25 or 27.
- **Decisions log:** the entries from item 17 (the guardian override record superseded; route-based
  payer superseded; silent BTM fallback superseded; one named authorise blocker, with the child case
  a warning under D4; the RVG Default Hospital reading under OQ-78; the AIA Contract; the Aria
  organisation payer; the `claimReference` placement; the office-only off-schedule Contract).
- **Handoff list:** add "Phase 22 sends to `Invoice.invoiceEmail` (from `invoiceEmailFor`) and
  replaces `funderOverride` with the payment setting; Phase 23 keeps `isScheduleMiss` off additional
  Procedures; Phase 25 locks the Contract selection with `Procedure.payer` and
  `requiredInputValuesFor`, and adds its blocker to `authoriseBlockersFor` (there is no
  `demoStaging.ts`; create it if 25 still needs one); Phase 27 reads `isPersonParty` for prepayment
  and decides `prepaidAmount`; Phases 38b and 39 address additional invoices and credit notes to a
  party through `billablePartyForProcedure` or the payer step, not a new record; Phase 40 adds the
  missing-NHI blocker; if OQ-78 is answered against default Contracts, `contractNamesPayer` and
  `setProcedurePayer` are the two places to change".
- **Catalogue screenshots.** The step's result: recipes created (US-11.2.3, US-11.2.4, US-04.2.7,
  US-04.3.7) and changed (US-11.2.1, US-11.2.2, US-11.4.2, US-03.6.1, US-03.6.2, US-07.2.2, plus any
  recipe the step broke), the `capture/REPORT.md` counts (captured, partial, absent, failed) before and
  after, any partial reason handed to a later phase, and the US-11.2.2 stale-screenshot note handed to
  `/update-requirements`.
