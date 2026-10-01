# Phase 21 · Billable party, required inputs and completeness

**Requirements covered:**
[FT-11.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.2.md) Billable party and invoice contact (Verify, [OQ-67](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-67.md)) ·
[US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md) Guardian or other override (Open, OQ-67) ·
[US-11.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.2.md) Insured patient who forwards the invoice (Proposed) ·
[US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md) Required booking inputs (Proposed) ·
[US-04.3.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.7.md) Procedure not on the Contract's schedule (Proposed) ·
[FT-03.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.6.md) Booking completeness validation ·
[US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md) Mark a Booking complete ·
[US-11.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.3.md) Invoice email required for patient-direct ·
[US-11.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.4.md) Warn when a child is the billable party (Confirmed, [OQ-54](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-54.md) answered) ·
[US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md) Office review of Contracts and references ·
[DM-11](../analysis/domain-model-delta.md#dm-11) billable party and invoice email stored on the Booking, defaulted from the Contract, independent of pricing ·
[DM-16](../analysis/domain-model-delta.md#dm-16) required booking inputs and the "confirm with hospital" flag.
Touches, without closing: [DM-28](../analysis/domain-model-delta.md#dm-28) (the grouping key stays per Procedure; only where the party comes from changes here, and the payment setting is Phase 22), [DM-37](../analysis/domain-model-delta.md#dm-37) (Phase 20 records the anaesthetist's Contract change; this phase adds the office approval stamp), [DM-31](../analysis/domain-model-delta.md#dm-31) (this phase registers the child-billable-party rule with 15a's warning routine) and [DM-12](../analysis/domain-model-delta.md#dm-12) (with no insurer on the Booking, an insurer that takes no direct claims is read from the Contract holder). [US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md) (group by billable party) now Matches and is no longer covered here: keep its behaviour, one invoice per distinct party per Booking. No RV findings are closed here; the superseded ruling is the silent BTM fallback (Decisions log).
**Depends on:** Phase 15a (the warning routine, Warning records on the Booking, the Admin to-do list with Clear, the triangle in all three apps, the submit confirm and the shared "Raise sample warnings" trigger; the prepayment completion gate is already gone) and Phase 20 (one Contract per Procedure, billing route, payment category and `Procedure.insurerId` removed with nothing on the Booking in their place, the anaesthetist Contract-change flag, and the interim "payer is the Contract holder"). Also relies on 14 (trigger registry, PWA demo-actions sheet, shared actor constants), 15 (Booking vocabulary), 17 (hospital and surgeon contact emails), 18 (Contract categories, holders, fee-schedule lines) and 19 (the procedure-first picker and base-unit resolver).
**Estimated:** 2 full sessions, at the upper limit. Session 1 is items 1 to 8 (billable party, invoice email, grouping, the direct-claims holder flag, the child warning and its sample), re-greened and demoable. Session 2 is items 9 to 17 (required inputs, completeness, the not-on-schedule flag, Review approval, the PWA trigger, demo guide). If session 2 runs long, finish and re-green items 9 to 12 and 14 first; items 13 and 15 (Contract approval and its PWA trigger) are the tail to carry over, never the tests.

## Goal

The Booking gains a stored **billable party**: who receives the invoice. Per OQ-55's answer the
Contract defines who pays, so each Procedure's party defaults from its Contract (the holder, or the
patient for a patient-direct Contract). Per OQ-67's recommendation, a per-Booking **override** is kept
beside it, set by the office or the anaesthetist independently of pricing: a guardian, a hospital,
another organisation, or the patient themself. It is one field, so it can be withdrawn if OQ-67 goes
the other way. The guardian record (`BillableParty`) is kept as it is and not extended. The billing
run groups each Booking's Procedures by that party, replacing Phase 20's interim "payer is the
Contract holder". A patient-direct Booking needs an **invoice email**, defaulted from the patient's
own and capturable on the Booking, which is where a parent's or guardian's email goes (US-11.2.4).

An insurer that **takes no direct claims** becomes a flag read through the Contract holder: a
Procedure on that insurer's Contract defaults to the patient, whose invoice says to claim from the
insurer (US-11.4.2).

Each Contract **declares the per-Booking inputs it requires** (invoice email, billable party, prepaid
amount, insurer member number, claim reference, purchase order), and the Booking holds them. **Mark
complete** now needs a Contract on every Procedure, times on every Procedure, and every declared
input. A Procedure priced under a fixed-schedule Contract that has **no line for it** is flagged "to
confirm with the hospital" instead of silently pricing by BTM, and the office resolves it (default RVG
pricing, optionally invoicing the hospital, or a fixed price added to the schedule).

Office **Review** shows every Procedure's Contract and approves them (explicitly, or all at
authorise), shows the anaesthetist-change flag, shows who is invoiced and at which address, checks
whether a Procedure needs an insurer's Contract, and shows the Booking's warnings. Per owner decision
**D4** (OQ-54, answered), a patient under 18 who is their own billable party raises a **mild,
clearable warning** through 15a's routine. It never blocks saving, submitting or authorising, and
there is no warning when someone else pays.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the diff for FT-11.2, US-11.2.2, US-11.4.2, US-04.2.7, US-04.3.7, FT-03.6, US-03.6.1,
   US-11.2.3, US-11.2.4, US-07.2.2, the context items US-11.2.1, US-04.2.1, US-08.2.1 and US-11.4.1,
   OQ-54, OQ-55 and OQ-67, and the "Booking", "Contract (recommended structure)", "Patient and
   billable party" and "Warnings" sections of `domain-model.md`. If an item changed, re-read it and
   adjust the work items below. If an item is now Retired or Future, drop it and say so in the
   PROGRESS entry.
2. **OQ-67** (who a Contract belongs to; whether a per-Booking billable party stays). If it is still
   Open, build its recommendation: the per-Booking override beside the Contract-defined party, as one
   field (`Booking.billableParty`), with a single "Provisional (OQ-67)" caption on the billable party
   sheet. If it is answered "replace the override with a Contract per arrangement", drop item 1's
   override and item 5's sheet options other than the invoice email, and say so in the Decisions log.
   D4 (OQ-54) is answered: build the warning, not a block.
3. **Verify, Open and Proposed items.** FT-11.2 is Verify and US-11.2.2 is Open (step 2). US-11.4.2,
   US-04.2.7 and US-04.3.7 are Proposed: build them as written. US-04.3.7's notes say the flag and the
   schedule update are "our proposal", so label the resolve sheet as a proposed flow.
4. **Read what 15a and 20 actually left.**
   - 15a's PROGRESS entry: the rule registry (`WARNING_RULES` in `src/domain/warnings/rules/`), the
     `WarningFacts` and `Warning` shapes, the selectors that derive warnings (`warningFactsFor`,
     `warningsForBooking`, `openWarnings` in `src/store/warnings.ts`), how clearances are stored and
     when a cleared warning re-opens, whether the Review row shows the triangle, and the sample
     contract (`WARNING_SAMPLES` with `stage`/`unstage` in `src/store/warningSamples.ts`,
     `SEED_WARNING_SAMPLE_BOOKINGS`, the sample actor). Use those names below.
   - Phase 20's PROGRESS entry (and, if thin, `phase-20-one-contract-per-procedure.md`): the interim
     payer (`Procedure.billablePartyId` kept as the guardian override, and `counterpartyForProcedure`
     as holder-as-payer, wrapped by the `payerForProcedure` selector); how the anaesthetist Contract
     change is recorded (a stored `Procedure.contractSelection`, or a flag derived from audit as
     DM-37 suggests); whether Review already shows the change flag; whether "Choose a Contract for
     this procedure." is already a completion check; the office-set `Booking.prepayment` flag and
     amount (the interim until 27); `setProcedureContract` with its `contractOutOfScope` refusal;
     whether 20 hides an insurer-held Contract whose insurer takes no direct claims; and where the
     AIA reimbursement Booking (Rutherford Thu 16) ended up once `insuredReimbursement` was removed.
     Adjust items 1, 2, 9, 12 and 13 to reuse what exists instead of adding a second copy.
   - Confirm `Procedure.insurerId` is gone and that nothing on the Booking holds an insurer or funding
     source (D2). This phase adds none: the insurer member number in item 9 is a required input
     value, not an insurer reference.
5. **Who the RVG Default Hospital Contract bills.** Read what Phase 18 and 20 left: the old plan made
   its holder the hospital (`holderKindFor('rvgDefaultHospital')`), which keeps S1 and S3 billing the
   hospital. The catalogue leans the other way: US-04.3.3 says choosing the default Contract "does
   not decide who is invoiced", US-11.2.1 that most patients pay for themselves, and OQ-55's answer
   that "a default Contract bills the patient". Do not change 18's reading here (S1, S3 and every
   seeded figure depend on it), but record the tension in the PROGRESS entry as part of OQ-67 for the
   owner. Every "default party is the patient" example in this plan therefore uses the patient-direct
   RVG Default Post-paid Contract, not the hospital default.

## Reference

**Design files (convention 17).** `docs/design/Admin Review.dc.html` is the layout for the Review
table, flag pills (neutral and warn tints), the flags tile and the action bar with its "flags open"
line. `docs/design/Mobile App.dc.html` is the layout for the mobile Booking detail sections, rows,
edit links and bottom sheets; the new Billing section follows its Section/Row pattern.
`docs/design/Design Language.dc.html` for tokens: warning tint for flags and missing inputs, teal
for every action (Approve, Set billable party, Confirm), crimson never.

**Catalogue.** The covered items above, plus
[US-11.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.1.md) (patient-direct default),
[US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md) (holder is who is invoiced by default),
[US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md) (default hospital Contract),
[US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md) (anaesthetist Contract change, flagged for review),
[US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md) and [FT-11.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.4.md) (the insurer's accepts-direct-claims flag),
[US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md) (grouping, already Matches),
[US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md) (send to the invoice email: Phase 22 sends, this phase captures),
[FT-13.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-13.7.md) and [US-13.7.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-13.7.2.md) (the warning routine and to-do list 15a built), and
[OQ-55](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-55.md) (the Contract defines the billable party).
`domain-model.md`: the Contract table's `holder` and `requiredBookingInputs` rows, the billing-context
`billableParty, invoiceEmail` row, the Patient section's under-18 bullet, the Warnings section, and the
glossary entries for Contract holder, Billable party and Invoice email.

**Analysis.** `../GAP-ANALYSIS.md` (EP-03, EP-04, EP-07, EP-11 and EP-13 tables, and the "Structural
changes" rows DM-11, DM-12, DM-16, DM-28, DM-31, DM-37); `../epics/EP-11.md`, `EP-04.md`, `EP-07.md`,
`EP-03.md` for per-gap evidence; `../analysis/domain-model-delta.md` (DM-11, DM-12, DM-16, DM-28,
DM-37); `../analysis/prototype-map-domain.md`, `prototype-map-store-seed.md`,
`prototype-map-shared.md`, `prototype-map-admin.md`, `prototype-map-shell-demo-pwa.md`.

**Code entry points** (named as at the snapshot; use the Booking names Phase 15 gave them, and the
shapes 18, 19, 15a and 20 left):
- `src/domain/types.ts`: `Card` (now `Booking`, ~l.370), `Procedure` (~l.444: `billablePartyId`,
  `billingReference`, `governingContractId`), `Patient` (~l.103, `email`, `dobISO`), `BillableParty`
  (~l.127, guardian record, not extended), `Insurer` (~l.166, `acceptsDirectClaims`),
  `CounterpartyRef` (~l.73), `Contract` (reshaped by 18), `Invoice` (~l.662), and 15a's `Warning`.
- `src/domain/billing/validateCardForBilling.ts`: `validateCardForBilling`, `CardBillingContext`,
  `billingReferenceMissing`.
- `src/domain/billing/invoiceBuild.ts`: `counterpartyForProcedure` (~l.192), `layoutFor` (~l.216),
  `buildInvoicesForCard` (~l.264, grouping), `buildPrePaymentInvoiceForCard` (~l.456).
- `src/domain/billing/fee.ts` (~l.198 to 230): the fixed-schedule match and the silent fall to BTM.
- 15a's pure warning routine in `src/domain` and its rule list (register the child rule there).
- `src/store/lifecycle.ts`: `completionBlockersFor` (~l.93), `completeCard`, `authoriseList`
  (~l.277, no flag gate today; refusals via `refuse(code, message, details)` from `store/mutate.ts`,
  so `authoriseBlocked` is a new code), `editCard`/`editProcedure`, `editRefusal` (~l.48).
- `src/store/billablePartyActions.ts` (`createBillableParty`, unchanged), `src/store/selectors.ts`
  (`billingContextForCard` ~l.837, `counterpartyName`, 20's `payerForProcedure`),
  `src/store/billingRun.ts` (`markInvoiceEmailed`), `src/store/mastersActions.ts`
  (`setInsurerDirectClaims` ~l.101), 20's `setProcedureContract`.
- Phase 14's `src/store/demoActors.ts` (`OFFICE_ACTOR`, `SOUTER_ACTOR`, `OFFICE_SIMULATION_ACTOR`) and
  `src/store/officeStandIn.ts` (`authoriseAsSimulatedOffice`); 15a's "Raise sample warnings" body.
- `src/apps/admin/reviewFlags.ts`, `src/apps/admin/screens/ReviewScreen.tsx`,
  `src/apps/admin/screens/InvoiceDocument.tsx` (addressee, claim note ~l.516),
  `src/apps/admin/screens/MasterData.tsx` (Contract editor sheet).
- `src/shared/card/CardDetailBody.tsx` (context slot ~l.565, the validator context it builds itself
  ~l.179, validation latch and `[data-validation-fields]` focus anchors ~l.388),
  `src/shared/card/OfficeBillingSetup.tsx`, `src/shared/flows/EditBillingSetupSheet.tsx`,
  `src/shared/flows/ManualCardForm.tsx`, `src/shared/capture/BtmCaptureBlock.tsx` (context line),
  `src/shared/format.ts` (`ageYears` ~l.63), `src/shared/audit/actionLabels.ts` and `fieldLabels.ts`.
- `src/domain/seed/cards.ts` (guardian Booking for Grace Park ~l.787, reimbursement Booking ~l.722,
  Aria rate x time ~l.700, `wed22Ces` ~l.1006, `pinnedListIds` ~l.1094, filler ~l.1150),
  `src/domain/seed/patients.ts`, `src/domain/seed/cast.ts` (insurers: nib takes direct claims, AIA
  Health does not), `src/domain/seed/contracts.ts`, `src/domain/seed/index.ts` (`SEED_LIST_IDS`,
  `SEED_MARKERS`), `src/domain/seed/seed.test.ts`.
- Phase 14's trigger registry (`src/shared/demoTriggers/registry.ts`, tests in
  `demoTriggers.test.ts`) and PWA demo-actions sheet (`src/pwa/PwaDemoActions.tsx`).
- Purity tests that the new code must keep green: `src/pwa/pwaPurity.test.ts`,
  `src/domain/domainPurity.test.ts` (the new billing modules) and `src/apps/moneyViewPurity.test.ts`
  (no money on mobile).
- Playwright specs in `aa-prototype/visual/` (`admin-phase07.spec.ts` Review, `admin-phase08.spec.ts`
  invoices, `card-calculation-display.spec.ts`, `mobile-phase04.spec.ts`, `web-phase05.spec.ts`,
  `pwa-device.spec.ts`, and 15a's warning specs), run by `npm run shots`.

## Work items

**Session 1: billable party, invoice email, grouping, direct claims, child warning**

1. **Model.** In `domain/types.ts`:
   - `Booking.billableParty?: CounterpartyRef`, the override (OQ-67's recommendation; one field, so
     it can be withdrawn). Absent means "use each Procedure's Contract default". The kinds are the
     existing `CounterpartyKind` set (hospital, insurer, surgeon, organisation, patient,
     billableParty).
   - `BillableParty` stays exactly as it is: the guardian or other-person record, now one party kind
     among several. Do not add fields to it or to `createBillableParty` (US-11.2.4: no separate
     guardian record; OQ-67 asks whether guardian details sit with the Contract). A guardian's email
     is captured as the Booking's invoice email.
   - `Booking.invoiceEmail?: string`, the override. Absent means "use the party's own email".
   - Remove the per-Procedure payer Phase 20 left (`Procedure.billablePartyId`, and the interim
     holder-as-payer in `counterpartyForProcedure` / `payerForProcedure`) and migrate its seeded uses
     onto `Booking.billableParty`. `payerForProcedure` becomes a thin selector over item 2's
     `billablePartyForProcedure`. Each Procedure still has its own party through its own Contract, so
     one Booking can bill different parties (OQ-55; DM-11's per-Procedure reading).
   - `Invoice.invoiceEmail?: string`, a snapshot taken at the run, so the document shows where it
     goes. Phase 22 sends to it; this phase only records it.
   - Satisfies DM-11, FT-11.2 and US-11.2.2 ("override billable party and invoice email on a
     Booking").
2. **Pure rules** in a new `src/domain/billing/billableParty.ts`, re-exported from the billing index
   and covered by Vitest:
   - `defaultBillablePartyFor(contract, patientId, masters)`: the Contract's holder through 18's
     `holderCounterparty`, or the patient where the holder is `{kind: 'bookingBillableParty'}` (the
     RVG Default Post-paid category), **or the patient where the holder is an insurer that does not
     accept direct claims** (`Insurer.acceptsDirectClaims` false; US-11.4.2, the Contract-holder flag
     that replaces the removed insurer route). US-04.2.1, US-11.2.1.
   - `billablePartyForProcedure(booking, procedure, contract, patientId, masters)`: the Booking
     override if set, else the default. The price is never read here (US-11.2.2: independent of
     pricing).
   - `forwardsToInsurer(contract, masters)`: the insurer the patient claims from when the Contract's
     holder takes no direct claims, else undefined. Feeds the invoice note (item 4) and the Review
     line (item 7).
   - `isPersonParty(ref)`: true for `patient` and `billableParty`.
   - `defaultInvoiceEmailFor(ref, masters)`: patient `email`, BillableParty `email` where the record
     already has one, hospital contact email and surgeon or rooms contact email (17), otherwise
     undefined. Insurers have none (nib is a portal, Phase 22).
   - `invoiceEmailFor(booking, ref, masters)`: the override, else the default.
   - `ageOnDate(dobISO, onISO)`, a pure age helper (move the maths out of `shared/format.ts`
     `ageYears` and have `ageYears` call it, so the app and the rule agree).
   - `childBillablePartyOn(booking, procedures, patient, listDateISO, …)`: true when the patient is
     under 18 **on the List date** and any Procedure's effective party is `{kind: 'patient'}` for that
     patient. False when the party is anyone else (a hospital, a guardian). US-11.2.4 AC1 and AC2.
   - If Phase 20 hides an insurer-held Contract whose insurer takes no direct claims, lift that hide:
     the Contract is offered, and its Procedures default to the patient. Keep 20's tests honest by
     changing that expectation, not deleting it.
3. **Store actions.**
   - `setBillableParty(api, actor, bookingId, ref | null)`, where null returns to the default. It
     refuses a ref that does not resolve, and runs through the standard `editRefusal` matrix: the
     anaesthetist on their own DRAFT List, the office on DRAFT and SUBMITTED, nobody on AUTHORISED.
     Audit `booking.billableParty` with a before/after party label.
   - `setInvoiceEmail(api, actor, bookingId, email | null)`, with a light shape check ("Enter a
     valid invoice email."). Audit `booking.invoiceEmail`.
   - Both actions go through `mutate()`. 15a's warnings are derived by selectors over the pure
     routine (only clearances are stored), so nothing re-runs: the child rule sees the new fields
     through `warningFactsFor` (item 6). Add `ACTION_LABELS` and `FIELD_LABELS` entries so History
     reads "Billable party: Patient to Hana Park (mother)".
   - The insurer's direct-claims flag stays edited by `setInsurerDirectClaims`; the Master data
     Contract detail for an insurer-held Contract shows it read-only as "Holder takes direct claims:
     Yes / No", linking to the insurer row.
4. **Billing run grouping** (`invoiceBuild.ts`):
   - Replace `counterpartyForProcedure` with `billablePartyForProcedure`. A line's
     `funderOverride` still beats it (the interim split until Phase 22's payment setting), so Alan
     Prentice's two invoices and figures are unchanged.
   - Group by the effective party: one invoice per distinct party per Booking (US-08.2.1 behaviour,
     unchanged).
   - `layoutFor` stays kind-based (Phase 22 makes it Contract-driven).
   - Snapshot `invoiceEmail` on each invoice.
   - `buildPrePaymentInvoiceForCard` uses the Booking's party too, so a guardian pays a prepayment
     (OQ-73's recommendation, "any person paying for the patient"; Phase 27 settles which parties
     get one).
   - `InvoiceDocument`: show the addressee's postal address (where the party has one) and email
     under the addressee, and read the "claim this invoice from {insurer}" note from
     `forwardsToInsurer` (the Procedure's Contract holder) instead of the removed payment category.
     The existing "Email invoice" action (`markInvoiceEmailed`) names the snapshot address in its
     confirmation and audit; Phase 22 replaces the send itself.
   - Tests:
     - A Procedure on the patient-direct RVG Default Post-paid Contract with a hospital override:
       fee identical to the cent, one invoice to the hospital, hospital layout (US-11.2.2 AC; see
       drift-check step 5 for why not the hospital default).
     - A Procedure on an AIA-held Contract (AIA takes no direct claims) defaults to the patient, and
       its invoice carries the "claim from AIA Health" note (US-11.4.2). Toggling AIA to accept
       direct claims makes the default AIA.
     - Two Procedures with different holders give two invoices.
     - A Booking override collapses them to one invoice.
     - Figures unchanged: S3's Holt $396.18, Prentice $152.38 and $91.43.
     - A guardian prepayment invoice is addressed to the guardian.
5. **Booking detail: the Billing block** (shared, all three apps, through `useSurface()`):
   - A "Billing" section in `CardDetailBody`'s context slot with two rows:
     - **Invoice to**: the effective party per Procedure. One name when all agree; otherwise one
       line per Procedure, with "Default: Contract holder" or "Set by {who}". A small "Under 18" chip
       sits by the patient's name when the child warning applies.
     - **Invoice email**: the effective email, or a warning-tint "Needed" chip when a person party
       has none. The party's postal address, where it has one, sits beneath in small type.
   - The row's edit link opens a new `shared/flows/BillablePartySheet.tsx` (bottom sheet on mobile,
     dialog on web and admin) with these options:
     - Use the default (names it).
     - The patient.
     - A parent or guardian: pick an existing one, or "New guardian" through the existing
       `createBillableParty` (name, relationship, phone; unchanged) then `setBillableParty`.
     - The List's hospital, or another hospital.
     - A surgeon entity or other organisation.
   - The sheet also holds an **invoice email** field, prefilled from the chosen party's own email.
     When the patient is under 18 and is the party, its hint reads "For a patient under 18, enter a
     parent's or guardian's email." The sheet carries the one "Provisional (OQ-67)" caption for the
     override. The same sheet serves the anaesthetist and the office (US-11.2.2 names both); the
     rights come from the store guard.
   - Mobile stays mobile-first: tappable rows, a segmented choice, no dropdown where a list of five
     fits. No money is shown on mobile.
   - Move the office's payer row and "New guardian" out of `OfficeBillingSetup` and
     `EditBillingSetupSheet`; those keep the per-Procedure Contract setup from 20.
6. **Child billable party: a mild warning** (D4, OQ-54 answered; US-11.2.4, DM-31):
   - Add the rule the way 15a's handoff says every later rule is added: a rule file
     `src/domain/warnings/rules/childBillableParty.ts`, its entry in `WARNING_RULES`, `'childBillableParty'`
     in the `WarningRuleId` union, its default (active, no params) in `appSettings.warningRules`
     (`backfillMerge` fills it for a persisted store), optional facts on `WarningFacts` (the patient
     and the masters `childBillablePartyOn` needs; the List, and so its date, is already a fact) filled
     by `warningFactsFor`, and its sample (Demo triggers). Kind `beforeProcedure`, strength `mild`, one
     finding per Booking (key `${bookingId}:childBillableParty`), evaluated by `childBillablePartyOn`.
     Text (verbatim, dash-free): "{Patient} is under 18 and is the billable party. Check the invoice
     email is a parent's or guardian's."
   - It shows wherever 15a shows warnings: the Admin dashboard to-do list (with Clear, AC3), the
     triangle on the Booking in mobile, web and admin, and the Review row (15a puts the triangle
     there). Do **not** add a `reviewFlags` entry for it.
   - No warning when the party is someone else (AC2): a hospital or guardian override, or a
     hospital-held Contract. The warning is derived, so setting such a party makes it disappear.
   - It never blocks: saving, completing, submitting (only 15a's standard submit confirm) and
     authorising all proceed with it open. `authoriseList`, PWA "Play the office" and 14's "Office
     authorises this List" are untouched by it.
   - `ManualCardForm`: when the entered DOB is under 18 on the List date and the default party is
     the patient, an inline mild note repeats the warning text. It does not stop the save.
   - Tests:
     - 17 years 364 days on the List date raises it; 18 on the List date does not.
     - A guardian or hospital party raises none; a hospital-held Contract on a child raises none.
     - Clear removes it from the to-do list, and an unrelated edit does not bring it back (15a's
       clearance is keyed by warning and holds at the same strength; this rule is always mild).
       Assert the rule 15a actually built.
     - `authoriseList` succeeds on a List whose Booking carries the open warning.
7. **Review: who is invoiced, and the insurer check.** US-07.2.2.
   - In `ReviewScreen.tsx` add an **Invoice to** column: each distinct party name, with its email in
     small mono beneath (or a "Needed" chip) and its postal address where it has one (US-07.2.2
     "addresses and invoice email addresses").
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
       the member number. The old "Insurer to add" reading (a Booking funding source) is gone with D2.
     - All advisory; they never gate authorise.
     - Take the new inputs as parameters so the module stays pure.
   - Keep the table inside the mockup's anatomy: columns, not new panels.
8. **Seed, persist and sample, then re-green (end of session 1).**
   - **Patients:** give every generated and pinned patient a deterministic `@example.net` email
     (for example `firstname.surname@example.net`), except the cases item 14 leaves blank on
     purpose. Check no filler patient is under 18 on a patient-direct Contract, or the to-do list
     fills with stray child warnings.
   - **Guardian:** Hana Park keeps her record; Grace Park's Booking gets
     `billableParty: {kind: 'billableParty', id: BP.guardian}` (no warning: someone else pays).
   - **Child review List:** on a spare, deterministic, past-dated **SUBMITTED** List with a hospital
     no S1 to S5 beat uses (not the S2 or S3 Lists), seed two completed Bookings with dedicated
     pinned patients (fixed valid NHIs, not `takePatient()`):
     - a 15-year-old on the patient-direct RVG Default Post-paid Contract billed to themself, with
       their own email as invoice email (`SEED_MARKERS.childBilledDirectly`: raises the warning);
     - a 12-year-old on the same Contract with the List's hospital as `Booking.billableParty`
       (`SEED_MARKERS.minorHospitalBilled`: no warning, and the US-11.2.2 override in the seed).
     Past Lists are filled by the filler (`cards.ts` ~l.1150), so either pick a List the filler leaves
     empty or add it to `pinnedListIds` and re-check that no scripted figure moved (pinning shifts the
     filler's draws downstream). Record it as `SEED_LIST_IDS.childPayerReview`. Nothing else is
     seeded for the warning: it is derived from these Bookings, so the to-do list shows it on load
     (as Riley's prepayment warning does in 15a), and no clearance is seeded.
   - **Other payers:**
     - Aria clinic: the Booking override, or the Contract holder, whichever 18 made it.
     - AIA reimbursement (Rutherford Thu 16): on an AIA-held Contract. If 18 seeded none, add "AIA
       Health" (Insurance category, holder AIA, RVG units at the anaesthetist's rate, labelled a demo
       reading in `contracts.ts`) so the fee is identical to the cent. Its default party is the
       patient. US-11.4.1 says an insurer that accepts direct claims holds Insurance Contracts; it
       does not say one that takes none holds a Contract, so this AIA Contract is our reading of how
       the system knows the patient's insurer once no Booking field holds it (D2). Record it in the
       Decisions log beside the override entry, for the owner under OQ-67.
     - Riley (S4 Beat 1): has an email, so S4 Beat 1 is unchanged.
   - **Sample:** add the `childBillableParty` entry to 15a's `WARNING_SAMPLES`, staged on the
     `minorHospitalBilled` Booking (see "Demo triggers").
   - **Persist:** bump `PERSIST_VERSION` by one from the value the previous phase left.
   - **Tests:**
     - Update `seed.test.ts` and `demoScenarios.test.ts`: the only child warning in the pristine seed
       is on `childBilledDirectly`; the review List is SUBMITTED and off every scripted beat.
     - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` before
       starting session 2.

**Session 2: required inputs, completeness, not on schedule, Contract approval**

9. **Required inputs on the Contract.**
   - `Contract.requiredBookingInputs: RequiredBookingInput[]`, where the type is `'invoiceEmail' |
     'billableParty' | 'prepaidAmount' | 'insurerMemberNumber' | 'claimReference' | 'purchaseOrder'`
     (domain-model `requiredBookingInputs`; US-04.2.7 lists the first five, the purchase order comes
     from the domain model). US-04.2.7.
   - Booking holds the values:
     - `insurerMemberNumber?` (new; an input value, not an insurer reference).
     - `purchaseOrder?`.
     - `claimReference`: kept as the existing per-Procedure `billingReference`, relabelled "Claim or
       hospital reference" (decision below).
     - `prepaidAmount`: 20's interim prepayment amount.
     - `billableParty`: satisfied only by an explicitly stored `Booking.billableParty` (someone
       confirmed who pays).
     - `invoiceEmail`: satisfied by the effective email.
   - Record the `claimReference` placement in the Decisions log. Moving the reference to the Booking
     would ripple through intake, PDF ingest and the invoice for no demo gain; every seeded
     multi-Procedure Booking already shares one reference.
   - `editContract` and the Master data Contract sheet (18's) gain a "Required on each Booking"
     checkbox group of the six inputs.
   - `editBooking` (`editCard` renamed) gains `insurerMemberNumber` and `purchaseOrder` in its
     patch, audited `booking.update`.
10. **Pure required-input rules** in `src/domain/billing/requiredInputs.ts`:
    - `requiredInputsFor(booking, procedures, contracts, parties)` returns each required input with
      the Contract names that require it. It is the union across the Booking's Procedures, plus
      `invoiceEmail` **implicitly** whenever any effective party is a person (US-11.2.3: no contract
      holder to send to), declared or not.
    - `missingRequiredInputs(…)` returns what is absent.
    - `requiredInputValuesFor(booking, procedures, …)` returns the values as one map keyed by
      `RequiredBookingInput`, whatever field each lives in. Phase 25 locks that map at authorise and
      re-checks it with `missingRequiredInputs`, so keep both pure and exported.
    - Tests: each input satisfied and missing; the union across two Contracts; the implicit email for
      a guardian on a hospital-holder Contract and for a patient on an AIA Contract; `billableParty`
      unmet by a default party and met by an explicit one.
11. **Completeness** (`validateBookingForBilling`, `validateCardForBilling` renamed). US-03.6.1 and
    FT-03.6.
    - **Every Procedure has a Contract** ("Choose a Contract for this procedure."). Keep 20's check if
      it exists.
    - 20's "the guardian override resolves" check moves from `Procedure.billablePartyId` to
      `Booking.billableParty` (a Booking-level failure when the stored ref no longer resolves).
    - **Every Procedure has an RVG code or a fee-schedule line** (US-03.6.1): keep today's check as
      18 and 19 reshaped it; do not duplicate it.
    - **Every Procedure has start and handover times** (US-03.6.1, linking US-03.3.3), not only those
      with an RVG code. The model has no untimed kind, so the rate x time and fixed-line Procedures
      now need times too. Anchor fields stay `anaestheticStartISO` and `handoverISO`.
    - **Every missing required input** becomes a Booking-level failure (no `procedureId`) with
      verbatim, dash-free copy:
      - "Add an invoice email. This Booking is billed to {name} directly."
      - "{Contract} needs the insurer member number."
      - "{Contract} needs a claim reference."
      - "{Contract} needs a purchase order number."
      - "{Contract} needs the billable party confirmed."
      - "{Contract} needs the prepaid amount."
    - Warnings are not failures: the child warning (item 6) and 15a's other warnings never appear
      here.
    - The context gains `patient`, `listDateISO` and the masters the party rules need. It is built in
      two places, `billingContextForCard` (store) and `CardDetailBody` (~l.179); update both, or make
      the component call the selector so they cannot drift.
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
    - The additional-procedure ordinal fallback (the 2026-07-22 ruling, `fee.ts` ~l.206) stays as it
      is, and `isScheduleMiss` skips additional Procedures; Phase 23 rebuilds the multi-procedure
      rule.
    - **Setting an off-schedule Contract** (AC1: "an admin can still set the Contract"). 20's
      filtered picker and `setProcedureContract` refuse `contractOutOfScope` when the procedure is
      outside a Contract's scope. For the **office only**, a fixed-schedule Contract whose hospital
      (and surgeon, where 20 filters on it) scope matches but which has no line for the procedure is
      offered in a separate picker group, "Not on this Contract's schedule (to confirm with the
      hospital)", and `setProcedureContract` accepts it for an office actor. Anaesthetists keep 20's
      filter. Tests: office accepted, anaesthetist refused, every other scope miss still refused.
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
      "Confirm with hospital" sheet (labelled a proposed flow). The outcomes:
      - **Default pricing:** set the Procedure's Contract to the hospital's default RVG Contract
        (US-04.3.3), with an explicit "Who is invoiced" choice (the hospital, preselected, or the
        patient) stored as `Booking.billableParty`, so the outcome does not depend on the default
        Contract's holder reading (drift-check step 5; AC3).
      - **Fixed price confirmed:** add a fee-schedule line through 18's line action, effective from
        the List date.
    - Both outcomes are one `mutate()` with two audit metas (`procedure.scheduleConfirm` plus the
      Contract or line change).
    - Anaesthetists see the flag read-only.
    - Tests: the miss detected; no silent fallback; both outcomes clear it; authorise refused while
      it is open; the PWA stand-in refused without a half-done write.
13. **Review approves every Contract** (US-07.2.2, DM-37):
    - The Contract column lists **every Procedure's Contract**, one line each, not only the first.
    - Each line shows "Changed by Dr {surname}: was {old}" (the change 20 recorded, read through
      20's `pendingContractChange`) with a teal **Approve** and a **Correct** link (opens the
      Booking's billing setup), or "Approved {time}" once done. 20's "Contract changed by
      anaesthetist" warn flag in `reviewFlags` becomes this line's source and drops once approved;
      do not show both.
    - Store `approveContractSelection(api, actor, {bookingId, procedureId?})`: office only; DRAFT or
      SUBMITTED; stamps `approval = {by, atISO, how: 'explicit' | 'authorise'}`. If 20 stored
      `Procedure.contractSelection`, stamp it there (no second record), keeping `anaesthetistChange`
      as history; if 20 derives the change flag from audit (DM-37), add only a minimal
      `Procedure.contractApproval` stamp. Audit `procedure.contractApprove`. An office re-pick through
      `setProcedureContract` counts as approved (stamp `approval` too).
    - An approve-all per Booking and per List.
    - `authoriseList` stamps approval on every Procedure still unapproved, in the same `mutate()`,
      audited "approved at authorise". Every Contract is therefore approved by the time the List
      locks, and Phase 25 locks an approved selection.
    - The authorise confirm dialog says how many changes it will approve. This is not a gate:
      review stays the human sanity check (Phase 07 ruling).
    - Tests: rights, the stamps, approval at authorise, and History labels.
14. **Seed for session 2**, then bump `PERSIST_VERSION` again:
    - **Declarations** (labelled demo readings in `contracts.ts`):
      - Patient-direct RVG Default Post-paid: `invoiceEmail`.
      - The ACC Contracts (St George's ACC, COS ACC): `claimReference`.
      - nib Insurance: `insurerMemberNumber`.
      - `billableParty`, `prepaidAmount` and `purchaseOrder` are declarable in the editor but seeded
        nowhere; Phase 27 decides what prepayment requires.
    - **Values:** seed member numbers on every Booking with a nib-held Procedure; a claim reference on
      every Booking under an ACC Contract that lacks one (handcrafted and filler; Losa Tuilagi's
      `ACC45-118844` on Ropata Thu 16 must stay, Phase 25's failure trigger clears it); and times on
      the seeded completed rate x time and fixed-line Procedures that lack them (Aria, Wed 15).
    - **Schedule miss:** if 18 did not seed a hospital-held fixed-schedule Contract at Christchurch
      Eye, seed "Christchurch Eye cataract package" (two eye procedures from the master). Put one
      **schedule-miss** Booking (strabismus or another eye procedure off the schedule) and one
      patient-direct **invoice-email-missing** Booking on Dr Souter's Wed 22 Jul AM Christchurch Eye
      List (`wed22Ces` in `cards.ts`, already pinned out of the filler with six eye Bookings; DRAFT,
      not Rutherford's S2 List), appended after the existing six with dedicated pinned patients (not
      `takePatient()`, which would shift every later filler Booking), with `SEED_MARKERS`
      `scheduleMissBooking` and `invoiceEmailMissingBooking`.
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
      scoping (never returned for `'bar'`), stage then unstage returning the target to its seed
      `billableParty` and `invoiceEmail`, a second press doing nothing new, the AUTHORISED skip, and
      `pwaPurity.test.ts` still green.
16. **Copy, labels and shots.**
    - Add `ACTION_LABELS` and `FIELD_LABELS` for every new action and field.
    - Remove stale "payer derived from route" or "Payer (default)" copy.
    - Add `data-shot` hooks: `booking-billing-block`, `billable-party-sheet`, `review-invoice-to`,
      `review-contract-approve`, `schedule-miss-banner`, `authorise-blocked`, and
      `todo-child-warning` on the to-do row.
    - Update the Playwright specs in `aa-prototype/visual/` that snapshot Booking detail, Review,
      the to-do list or the invoice document (see Reference), and re-shoot.
    - No en or em dashes anywhere in the new copy.
17. **Decisions log** (PROGRESS.md), superseding earlier readings:
    - The silent BTM fallback on a fixed-schedule miss (the 2026-07-22 "Type 3 second-procedure
      fallback" reading, and the 8th-review comment in `fee.ts`, for primary Procedures) is now a
      flagged miss.
    - The 7th-review A1/B15 payer reading is replaced: the payer is each Procedure's Contract default
      (OQ-55) or the Booking's override, not the route.
    - Phase 07 said "authorise is never gated by flags". One named blocker now exists, an unconfirmed
      schedule miss, from one pure function. The child billable party is a mild warning, never a
      block (D4, OQ-54); every other flag stays advisory.
    - The per-Booking override is kept beside the Contract-defined party as one field (OQ-67's
      recommendation), and the `BillableParty` guardian record is kept unextended, the guardian's
      email living in the Booking's invoice email (US-11.2.4). An insurer that takes no direct
      claims is read through an insurer-held Contract whose Procedures default to the patient
      (US-11.4.2; the AIA Health Contract is a demo reading).
    - The `claimReference` placement.
    - The office-only exception to 20's scope filter: an off-schedule fixed-schedule Contract can be
      set by the office, and the schedule miss it creates is derived, never stored.

## Demo triggers

| Label | Screen (routes) | Surface | Effect |
|---|---|---|---|
| **Raise sample warnings** (15a's, extended) | 15a's routes (Admin · Day and Admin · Booking detail) | As 15a set it | 15a's body, which now also stages a child billed directly (below); "Clear sample warnings" unstages it |
| **Office approves this Contract change** | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`, the pattern 15 left) | PWA sheet only (`surfaces: ['pwa']`, `badge: 'office-stand-in'`) | `approveContractSelection` on the Booking in the URL, as 14's `OFFICE_SIMULATION_ACTOR` ("AA office (simulated)", office role and source) |

**Seeded, no button.** The child review List (item 8) sits in the Review queue on load: the 15-year-old
billed to themself carries the mild warning on the to-do list, the Review row and the Booking's
triangle, and the hospital-billed 12-year-old beside it shows none. Grace Park's guardian Booking is a
second no-warning case. The schedule-miss and invoice-email-missing Bookings sit on Wed 22 AM
Christchurch Eye.

**Raise sample warnings: the child sample.**
- **What it adds.** A `childBillableParty` entry in 15a's `WARNING_SAMPLES`
  (`src/store/warningSamples.ts`), following 15a's stage and unstage contract; it creates no
  Booking. `stage` calls `setBillableParty(…, {kind: 'patient', id})` as 15a's sample actor on the
  target, so the derived child warning appears; `unstage` restores the target's seed `billableParty`
  and `invoiceEmail`. The target is the Booking in the URL when its patient is under 18 on the List
  date, otherwise (and from the Day view) the `SEED_MARKERS.minorHospitalBilled` Booking, the
  hospital-billed 12-year-old. That target is a minor, which `multiWarning` is not, so this sample
  does not land on `multiWarning`; say so in the PROGRESS entry. If 15a's sample actor cannot edit a
  SUBMITTED List under `editRefusal`, use whatever 15a's samples use for a SUBMITTED target and record
  it.
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
  the office {time}". In the framed build the presenter approves on Admin Review instead, so no
  bar entry.

**No other triggers.** Setting a billable party, an invoice email, a member number, clearing a warning
(Admin to-do list, or 15a's PWA "Office clears this warning"), or confirming a schedule miss are
product actions in the product UI. The old plan's "Stage child billed directly" button and the
`src/store/demoStaging.ts` it created are not built: the case is seeded.

## Out of scope

- Sending the invoice to the email or the portal, Contract-driven layout and delivery, agent
  wording, and the Contract payment setting (full or split) that replaces `funderOverride`
  (Phase 22).
- The primary Procedure and the multi-procedure rule, including the additional-procedure ordinal
  fallback (Phase 23).
- Contract versions, and locking the selection, party and inputs at AUTHORISED (Phase 25).
- Deriving prepayment and what `prepaidAmount` means once derived (Phase 27).
- A patient record screen, missing NHI and the outstanding-balance warning (Phase 40).
- Warning settings (thresholds, switching rules off): US-13.7.4 is Future.
- Hospital data setting the Contract (Future Work lane, OQ-22).
- Guardian details held on the Contract (Greg's remark under OQ-67), a per-Procedure billable party
  override beyond the Booking's own, and a billable-party or guardian master screen. Build none.
- Changing who the RVG Default Hospital Contract bills (drift-check step 5; OQ-67).

## Manual test checklist

- [ ] **Hospital override (US-11.2.2 AC).** Admin, a DRAFT Booking on the patient-direct RVG Default
      Post-paid Contract, billed to the patient by default: set the billable party to Christchurch Eye.
      The fee is unchanged to the cent, Invoice to shows the hospital with its contact email, and
      History records the change.
- [ ] **Guardian on mobile.** As Dr Souter, set a new guardian via the bottom sheet and type their
      email as the invoice email. The guardian record has no new fields; the same sheet opens as a
      dialog on the web app, with the "Provisional (OQ-67)" caption.
- [ ] **Office rights.** On a SUBMITTED List the anaesthetist cannot edit the billable party; the
      office can. Nobody can on AUTHORISED.
- [ ] **Grouping.** Authorise a List where one Booking has two Procedures with different holders: two
      invoices. With a Booking override: one. S3 Beat 1 figures are unchanged ($396.18; $152.38 and
      $91.43).
- [ ] **Insurer that takes no direct claims.** The AIA reimbursement Booking bills the patient, the
      invoice note names AIA Health, and Review shows "no direct claims, patient forwards". The AIA
      Contract's detail shows "Holder takes direct claims: No".
- [ ] **Child warning, seeded.** On load, the Admin to-do list shows the 15-year-old's mild warning;
      the Review row and the Booking (admin, and the triangle on web and mobile) show it too. The
      hospital-billed 12-year-old on the same List and Grace Park show none.
- [ ] **Child warning never blocks.** Authorise the child review List with the warning open: it
      authorises, and invoices go to the patient's invoice email.
- [ ] **Clear and re-raise.** Reset, then Clear the warning from the to-do list: it leaves. Admin
      Day, Demo actions, **Raise sample warnings**: the hospital-billed 12-year-old is now billed to
      themself and a fresh child warning appears. Setting a guardian on it removes its warning;
      **Clear sample warnings** restores the hospital.
- [ ] **Child note at setup.** Enter an under-18 DOB in the manual Booking form on a patient-direct
      Contract: the mild note shows and the save goes through.
- [ ] **Invoice email required.** Wed 22 AM Christchurch Eye, the invoice-email-missing Booking: Mark
      complete on mobile refuses, scrolls to and focuses the invoice email row, and passes once one is
      entered.
- [ ] **Required inputs.** A nib Booking missing its member number refuses completion with "{Contract}
      needs the insurer member number." Tick "Purchase order" on a Contract in Master data, and a
      DRAFT Booking under it now refuses until one is entered.
- [ ] **Insurer's Contract check.** A Booking with a member number but no insurer-held Contract shows
      the neutral "Insurer's Contract?" flag on Review.
- [ ] **Times on every Procedure.** A fixed-line or rate x time Procedure without times refuses
      completion.
- [ ] **Schedule miss.** The schedule-miss Booking shows "To confirm with the hospital" (Booking
      detail and, once submitted, Review) with an estimate, and its List cannot be authorised, in Admin
      or by the PWA "Office authorises this List". "Confirm with hospital", default pricing with the
      hospital invoiced: priced by RVG units, billed to the hospital, flag gone. Reset and repeat with
      "Fixed price confirmed": a schedule line is added and the Booking prices at it.
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
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all green.

## Demo guide updates

In the same session, patch `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`, the matching sections of
`master-demo-guide.html`, and the Control Panel scenario text in `DemoControlPanel.tsx`:
- **S1 Beat 3:** "Worth pointing at" gains one line. Mark complete also checks the Contract, times on
  every Procedure and any inputs the Contract requires. Sarah is on St George's default Contract,
  so nothing extra is asked. Expected results are unchanged.
- **S2 Beat 4:**
  - "Say" and "Expected": Review now shows every Procedure's Contract, who is invoiced and where,
    and authorising approves the Contract selections. The beat stays non-blocking.
  - Add an **optional aside** after it: the child review List in the Review queue. The 15-year-old
    billed to themself carries a mild warning (to-do list, Review row, triangle); the hospital-billed
    12-year-old beside it carries none. Authorise anyway to show it never blocks, or Clear it from the
    to-do list. Before authorising, "Raise sample warnings" brings a fresh one back (on the
    12-year-old).
- **S3 Beat 1:** "It resolves the explicit payer per Procedure … groups by counterparty" becomes
  "groups each Booking's Procedures by billable party, which each Procedure's Contract defines unless
  someone set another party on the Booking". Figures are unchanged.
- **S4 Beat 1:** no change (Riley has an invoice email). Confirm by running it.
- **Cheat sheet:** in the payer section Phase 20 rewrote, add the billable party (from the Contract,
  with a Booking override, independent of pricing), the invoice-email rule for patient-direct, the
  insurer that takes no direct claims, the not-on-schedule flag as the one authorise blocker, and, in
  15a's warnings section, the child rule as a mild warning.
- **Workflows doc:** the office-review steps (Contract approval, invoice-to, insurer check, warnings)
  and the anaesthetist Mark complete step (what is checked).
- **Personas doc:** the office inspects who is invoiced and clears the child warning from the to-do
  list.
- **Control Panel S2 text:** mention the optional child aside and that "Raise sample warnings" lives
  on its screen.

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
- **The billable party is independent of pricing.** No fee path reads `Booking.billableParty`, and a
  hospital override on the default RVG Contract changes the invoice recipient but not one cent of
  the fee. `funderOverride` lines still beat the party (interim until 22), so the S3 figures hold.
- **Where the party comes from.** Each Procedure's default comes from its Contract (OQ-55), an
  insurer holder that takes no direct claims defaults to the patient, and the override is one
  Booking field. Nothing reintroduces an insurer or funding source on the Booking (D2), and the
  `BillableParty` record gained no fields.
- **Grouping.** One invoice per distinct effective party per Booking. A guardian prepayment invoice
  goes to the guardian.
- **The child warning (D4).** It is registered once in 15a's routine (no parallel `reviewFlags`
  entry, no blocker anywhere). Age uses the List date, not the demo clock, at the 18th-birthday
  boundary. No warning when anyone other than the patient pays. Clear behaves as 15a's rule says.
  Saving, completing, submitting and authorising all go through with it open.
- **Completeness.**
  - Every seeded completed Booking passes the new validator.
  - No seeded SUBMITTED List has an authorise blocker, and S1 Beat 3, S2 Beat 4, S3 and S4 Beat 1
    run unchanged.
  - Booking-level failures anchor and focus correctly on mobile and web.
  - The implicit invoice-email rule fires for every person party, declared or not.
- **Authorise blockers.**
  - Exactly one kind exists (an unconfirmed schedule miss). The UI and `authoriseList` share one
    pure function.
  - Authorising stamps every remaining Contract approval atomically.
  - The PWA office simulation cannot half-authorise a blocked List.
- **Schedule miss.** No silent BTM fallback remains for a primary Procedure. The additional-procedure
  ordinal fallback is untouched (Phase 23). Both resolve outcomes are single audited mutations.
- **Discipline.**
  - Every new write goes through `mutate()` with labels.
  - The child sample is deterministic, idempotent, lives in `src/store`, and passes
    `pwaPurity.test.ts`; the new billing modules pass `domainPurity.test.ts`, and no fee or estimate
    reaches mobile (`moneyViewPurity.test.ts`).
  - The PWA-only trigger never shows in the harness bar.
  - `PERSIST_VERSION` is bumped for each seed change.
  - No en or em dashes in app copy; teal is the only action colour.

## PROGRESS.md updates

- **Status table:** add a catch-up row for Phase 21.
- **Phase entry.** A catch-up Phase 21 entry covering:
  - the drift-check result (catalogue diff against 501b0b8, OQ-67's status, what 15a and 20 left that
    this phase reused, and the RVG Default Hospital holder tension from step 5, as part of OQ-67 for
    the owner);
  - the files and actions added;
  - the `PERSIST_VERSION` bumps;
  - the tests added;
  - the List chosen for the child review case and how the child sample was placed;
  - the manual checklist, item by item;
  - the adversarial review pass;
  - anything deferred to 22, 23, 25 or 27.
- **Decisions log:** the six entries from item 17 (silent BTM fallback superseded; route-based payer
  superseded; one named authorise blocker, with the child case a warning under D4; the override kept
  as one field and the guardian record unextended under OQ-67; the `claimReference` placement; the
  office-only off-schedule Contract).
- **Handoff list:** add "Phase 22 sends to `Invoice.invoiceEmail` and replaces `funderOverride` with
  the payment setting; Phase 23 keeps `isScheduleMiss` off additional Procedures; Phase 25 locks the
  party, email and `requiredInputValuesFor` with the Contract and adds its blocker to
  `authoriseBlockersFor` (there is no `demoStaging.ts`; create it if 25 still needs one); Phase 27
  decides `prepaidAmount`; Phase 40 adds the missing-NHI blocker".
