# Phase 21 · Billable party, required inputs and completeness

**Requirements covered:**
[US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md) Guardian or other override ·
[US-08.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.1.md) Group by billable party (Verify) ·
[US-11.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.2.md) Insured patient who forwards the invoice (Proposed) ·
[US-04.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.7.md) Required booking inputs (Proposed) ·
[US-04.3.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.7.md) Procedure not on the Contract's schedule (Proposed) ·
[FT-03.6](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-03.6.md) Booking completeness validation ·
[US-03.6.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.6.1.md) Mark a Booking complete ·
[US-11.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.3.md) Invoice email required for patient-direct ·
[US-11.2.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.4.md) A child is never the billable party (Proposed, [OQ-54](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-54.md)) ·
[US-07.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-07.2.2.md) Office review of Contracts and references ·
[DM-10](../analysis/domain-model-delta.md) billable party and invoice email on the Booking, independent of pricing ·
[DM-14](../analysis/domain-model-delta.md) required booking inputs and the "confirm with hospital" flag.
Touches, without closing: [DM-24](../analysis/domain-model-delta.md) (the grouping key changes here; the covered-amount split is Phase 22) and [DM-31](../analysis/domain-model-delta.md) (Phase 20 records the anaesthetist's Contract change; this phase adds the office approval). No RV findings are closed here; the superseded ruling is the silent BTM fallback (Decisions log).
**Depends on:** Phase 20 (one Contract per Procedure, billing route and payment category removed, insurer and funding source on the Booking, the anaesthetist Contract-change flag, and the interim "payer is the Contract holder"). Also relies on 14 (trigger registry, PWA demo-actions sheet, shared actor constants), 15 (Booking vocabulary), 17 (hospital and surgeon contact emails) and 18 (Contract categories, holders, fee-schedule lines).
**Estimated:** 2 full sessions, at the upper limit. Session 1 is items 1 to 8 (billable party, invoice email, grouping, the child rule and its trigger), re-greened and demoable. Session 2 is items 9 to 17 (required inputs, completeness, the not-on-schedule flag, Review approval, the PWA trigger, demo guide). If session 2 runs long, finish and re-green items 9 to 12 and 14 first; items 13 and 15 (Contract approval and its PWA trigger) are the tail to carry over, never the tests.

## Goal

The Booking gains a **billable party**: who receives the invoice. It defaults from each Procedure's
Contract (its holder, or the patient for a patient-direct Contract) and can be overridden on the
Booking, by the office or the anaesthetist, independently of pricing: a guardian, a hospital, another
organisation, or the patient themself. The billing run groups each Booking's Procedures by that party,
replacing Phase 20's interim "payer is the Contract holder". A patient-direct Booking needs an
**invoice email**, defaulted from the patient's (or guardian's) own and capturable on the Booking.

Each Contract **declares the per-Booking inputs it requires** (invoice email, billable party, prepaid
amount, insurer member number, claim reference, purchase order), and the Booking holds them. **Mark
complete** now needs a Contract on every Procedure, times on every Procedure, and every declared
input. A Procedure priced under a fixed-schedule Contract that has **no line for it** is flagged "to
confirm with the hospital" instead of silently pricing by BTM, and the office resolves it (default RVG
pricing, optionally invoicing the hospital, or a fixed price added to the schedule).

Office **Review** shows every Procedure's Contract and approves them (explicitly, or all at
authorise), shows the anaesthetist-change flag, shows who is invoiced and at which address, and flags
a **child billable party** at booking setup and at review. Under owner decision D4's default it
blocks authorising that List until an adult is set, labelled provisional while OQ-54 is open.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the diff for US-11.2.2, US-08.2.1, US-11.4.2, US-04.2.7, US-04.3.7, FT-03.6, US-03.6.1,
   US-11.2.3, US-11.2.4, US-07.2.2, the parent FT-11.2 and US-11.2.1, OQ-54, and the "Booking",
   "Contract (recommended structure)" and "Patient and billable party" sections of
   `domain-model.md`. If an item changed, re-read it and adjust the work items below. If an item is
   now Retired or Future, drop it and say so in the PROGRESS entry.
2. **OQ-54 and owner decision D4** (child as billable party: block or warn). Check OQ-54's status and
   the D4 answer in `../ROADMAP.md`. If still open, build the default: flag at setup and at review,
   and **block authorising the List** until an adult is set, with a visible "provisional rule" caption
   on the block. If the answer is "warn only", keep the flags and drop the authorise block (item 6),
   and say so in the Decisions log. If AA also wants the Booking blocked at setup, add it as a
   completion blocker instead.
3. **Verify and Proposed items.** US-08.2.1 is Verify; US-11.4.2, US-04.2.7, US-04.3.7 and US-11.2.4
   are Proposed. Build them as written. US-04.3.7's notes say the flag and the schedule update are
   "our proposal", so label the resolve sheet as a proposed flow.
4. **Read what Phase 20 actually left.** Its PROGRESS entry (and, if thin, `phase-20-one-contract-per-procedure.md`
   items 2, 5 and 6) names: the interim payer (Phase 20's plan keeps `Procedure.billablePartyId` and
   makes `counterpartyForProcedure` holder-as-payer, wrapped by the `payerForProcedure` selector);
   the anaesthetist Contract-change record (planned as `Procedure.contractSelection` with
   `setBy`, `who`, `atISO` and `anaesthetistChange`); whether Review already shows the change flag;
   whether an insurer member number came with the Booking's `insurerId` / `fundingSource`; whether
   "Choose a Contract for this procedure." is already a completion check; the office-set
   `Booking.prepayment` flag and amount (the interim until 27); and `setProcedureContract` with its
   `contractOutOfScope` refusal. Adjust items 1, 9, 12 and 13 to reuse what exists instead of adding a
   second copy.
5. **Who the RVG Default Hospital Contract bills.** Phase 18 made its holder the hospital
   (`holderKindFor('rvgDefaultHospital')`), which keeps S1 and S3 billing the hospital. The catalogue
   (US-04.3.3 note, US-11.2.1) says choosing the default Contract "does not decide who is invoiced"
   and that most patients pay for themselves. Do not change 18's reading here (S1, S3 and every
   seeded figure depend on it), but record the tension in the PROGRESS entry as a question for the
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
[FT-11.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.2.md),
[US-11.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.1.md) (patient-direct default),
[US-04.2.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.1.md) (holder is who is invoiced by default),
[US-04.3.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.3.3.md) (default hospital Contract),
[US-03.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-03.4.1.md) (anaesthetist Contract change, flagged for review),
[US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md) and [FT-11.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-11.4.md) (the direct-claims flag decides the flow), and
[US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md) (send to the invoice email: Phase 22 sends, this phase captures).
`domain-model.md`: the Contract table's `holder` and `requiredBookingInputs` rows, and the glossary
entries for Contract holder, Billable party and Invoice email.

**Analysis.** `../GAP-ANALYSIS.md` (EP-03, EP-04, EP-07, EP-08 and EP-11 tables, and the "Structural
changes" rows DM-10, DM-14, DM-24, DM-31, DM-35); `../epics/EP-11.md`, `EP-04.md`, `EP-07.md`,
`EP-03.md`, `EP-08.md` for per-gap evidence; `../analysis/domain-model-delta.md` (DM-10, DM-14,
DM-24); `../analysis/prototype-map-domain.md`, `prototype-map-store-seed.md`,
`prototype-map-shared.md`, `prototype-map-admin.md`, `prototype-map-shell-demo-pwa.md`.

**Code entry points** (named as at the snapshot; use the Booking names Phase 15 gave them, and the
shapes 18 and 20 left):
- `src/domain/types.ts`: `Card` (now `Booking`, ~l.370), `Procedure` (~l.444: `billablePartyId`,
  `billingReference`, `governingContractId`), `BillableParty` (~l.127), `CounterpartyRef` (~l.73),
  `Contract` (reshaped by 18), `Invoice` (~l.662).
- `src/domain/billing/validateCardForBilling.ts`: `validateCardForBilling`, `CardBillingContext`,
  `billingReferenceMissing`.
- `src/domain/billing/invoiceBuild.ts`: `counterpartyForProcedure` (~l.192), `layoutFor` (~l.216),
  `buildInvoicesForCard` (~l.264, grouping), `buildPrePaymentInvoiceForCard` (~l.456).
- `src/domain/billing/fee.ts` (~l.198 to 230): the fixed-schedule match and the silent fall to BTM.
- `src/store/lifecycle.ts`: `completionBlockersFor` (~l.93), `completeCard`, `authoriseList`
  (~l.277, no flag gate today; refusals via `refuse(code, message, details)` from `store/mutate.ts`,
  so `authoriseBlocked` is a new code), `editCard`/`editProcedure`, `editRefusal` (~l.48).
- `src/store/billablePartyActions.ts` (`createBillableParty`), `src/store/selectors.ts`
  (`billingContextForCard` ~l.837, `counterpartyName`, 20's `payerForProcedure`),
  `src/store/billingRun.ts` (`markInvoiceEmailed`), `src/store/intake.ts` (`upsertPatient`, for the
  staging trigger), 20's `setProcedureContract`.
- Phase 14's `src/store/demoActors.ts` (`OFFICE_ACTOR`, `SOUTER_ACTOR`, `OFFICE_SIMULATION_ACTOR`) and
  `src/store/officeStandIn.ts` (`authoriseAsSimulatedOffice`); `src/store/demoStaging.ts` is **new**
  in this phase (Phase 25 adds to it).
- `src/apps/admin/reviewFlags.ts`, `src/apps/admin/screens/ReviewScreen.tsx`,
  `src/apps/admin/screens/InvoiceDocument.tsx` (addressee, claim note ~l.516),
  `src/apps/admin/screens/MasterData.tsx` (Contract editor sheet).
- `src/shared/card/CardDetailBody.tsx` (context slot ~l.565, the validator context it builds itself
  ~l.179, validation latch and `[data-validation-fields]` focus anchors ~l.388),
  `src/shared/card/OfficeBillingSetup.tsx`, `src/shared/flows/EditBillingSetupSheet.tsx`,
  `src/shared/flows/ManualCardForm.tsx`, `src/shared/capture/BtmCaptureBlock.tsx` (context line),
  `src/shared/format.ts` (`ageYears`), `src/shared/audit/actionLabels.ts` and `fieldLabels.ts`.
- `src/domain/seed/cards.ts` (guardian card ~l.787, reimbursement card ~l.722, Aria rate x time
  ~l.700, filler generator ~l.1150), `src/domain/seed/patients.ts`, `src/domain/seed/contracts.ts`,
  `src/domain/seed/index.ts` (`SEED_LIST_IDS`, `SEED_MARKERS`), `src/domain/seed/seed.test.ts`.
- Phase 14's trigger registry (`src/shared/demoTriggers/registry.ts`, tests in
  `demoTriggers.test.ts`) and PWA demo-actions sheet (`src/pwa/PwaDemoActions.tsx`).
- Purity tests that the new code must keep green: `src/pwa/pwaPurity.test.ts`,
  `src/domain/domainPurity.test.ts` (the new billing modules) and `src/apps/moneyViewPurity.test.ts`
  (no money on mobile).
- Playwright specs in `aa-prototype/visual/` (`admin-phase07.spec.ts` Review, `admin-phase08.spec.ts`
  invoices, `card-calculation-display.spec.ts`, `mobile-phase04.spec.ts`, `web-phase05.spec.ts`,
  `pwa-device.spec.ts`), run by `npm run shots`.

## Work items

**Session 1: billable party, invoice email, grouping, child rule**

1. **Model.** In `domain/types.ts`:
   - `Booking.billableParty?: CounterpartyRef`, the override. Absent means "use the default". The
     kinds are the existing `CounterpartyKind` set (hospital, insurer, surgeon, organisation,
     patient, billableParty). `BillableParty` stays the record for a guardian or other person, now
     one party kind among several.
   - `Booking.invoiceEmail?: string`, the override. Absent means "use the party's own email".
   - `BillableParty.email` stays optional, but the guardian sheet now captures it (item 5).
   - Remove the per-Procedure payer Phase 20 left (`Procedure.billablePartyId`, and the interim
     holder-as-payer in `counterpartyForProcedure` / `payerForProcedure`) and migrate its seeded uses
     onto `Booking.billableParty`. `payerForProcedure` becomes a thin selector over item 2's
     `billablePartyForProcedure`.
   - `Invoice.invoiceEmail?: string`, a snapshot taken at the run, so the document shows where it
     goes. Phase 22 sends to it; this phase only records it.
   - Satisfies DM-10 and US-11.2.2 ("override billable party and invoice email on a Booking").
2. **Pure rules** in a new `src/domain/billing/billableParty.ts`, re-exported from the billing index
   and covered by Vitest:
   - `defaultBillablePartyFor(contract, patientId, surgeonGroups)`: the Contract's holder through
     18's `holderCounterparty`, or the patient where the holder is `{kind: 'bookingBillableParty'}`
     (the RVG Default Post-paid category). US-04.2.1, US-11.2.1.
   - `billablePartyForProcedure(booking, procedure, contract, patientId)`: the Booking override if
     set, else the default. The price is never read here (US-11.2.2: independent of pricing).
   - `isPersonParty(ref)`: true for `patient` and `billableParty`.
   - `defaultInvoiceEmailFor(ref, masters)`: patient `email`, BillableParty `email`, hospital
     contact email and surgeon or rooms contact email (17), otherwise undefined. Insurers have none
     (nib is a portal, Phase 22).
   - `invoiceEmailFor(booking, ref, masters)`: the override, else the default.
   - `ageOnDate(dobISO, onISO)`, a pure age helper (move the maths out of `shared/format.ts`
     `ageYears` and have `ageYears` call it, so the app and the rule agree).
   - `childBillablePartyOn(booking, procedures, patient, listDateISO, …)`: true when the patient is
     under 18 **on the List date** and any Procedure's party is `{kind: 'patient'}` for that
     patient. US-11.2.4 AC1 and AC2.
   - `US-11.4.2`: where the Booking's insurer (from 20) does not accept direct claims, the Booking is
     on a patient-direct Contract, so the default party is the patient. Add
     `forwardsToInsurer(booking, masters)`, returning the insurer the patient claims from, for the
     invoice note (item 4) and the Review line (item 7).
3. **Store actions.**
   - `setBillableParty(api, actor, bookingId, ref | null)`, where null returns to the default. It
     refuses a ref that does not resolve, and runs through the standard `editRefusal` matrix: the
     anaesthetist on their own DRAFT List, the office on DRAFT and SUBMITTED, nobody on AUTHORISED.
     Audit `booking.billableParty` with a before/after party label.
   - `setInvoiceEmail(api, actor, bookingId, email | null)`, with a light shape check ("Enter a
     valid invoice email."). Audit `booking.invoiceEmail`.
   - `createBillableParty` gains `email`.
   - Both actions go through `mutate()`. Add `ACTION_LABELS` and `FIELD_LABELS` entries so History
     reads "Billable party: Patient to Hana Park (mother)".
4. **Billing run grouping** (`invoiceBuild.ts`):
   - Replace `counterpartyForProcedure` with `billablePartyForProcedure`. A line's
     `funderOverride` still beats it (the interim split until Phase 22), so Alan Prentice's two
     invoices and figures are unchanged.
   - Group by the effective party: one invoice per distinct party per Booking. US-08.2.1.
   - `layoutFor` stays kind-based (Phase 22 makes it Contract-driven).
   - Snapshot `invoiceEmail` on each invoice.
   - `buildPrePaymentInvoiceForCard` uses the Booking's party too, so a guardian pays a prepayment.
   - `InvoiceDocument`: show the addressee's postal address (where the party has one) and email
     under the addressee, and read the "claim this invoice from {insurer}" note from
     `forwardsToInsurer` (the Booking's insurer) instead of the removed payment category. The
     existing "Email invoice" action (`markInvoiceEmailed`) names the snapshot address in its
     confirmation and audit; Phase 22 replaces the send itself.
   - Tests:
     - A Procedure on the patient-direct RVG Default Post-paid Contract with a hospital override:
       fee identical to the cent, one invoice to the hospital, hospital layout (US-11.2.2 AC; see
       drift-check step 5 for why not the hospital default).
     - A Booking whose insurer does not accept direct claims defaults to the patient, and its
       invoice carries the "claim from {insurer}" note (US-11.4.2).
     - Two Procedures with different holders give two invoices.
     - A Booking override collapses them to one invoice.
     - Figures unchanged: S3's Holt $396.18, Prentice $152.38 and $91.43.
     - A guardian prepayment invoice is addressed to the guardian.
5. **Booking detail: the Billing block** (shared, all three apps, through `useSurface()`):
   - A "Billing" section in `CardDetailBody`'s context slot with two rows:
     - **Invoice to**: the effective party per Procedure. One name when all agree; otherwise one
       line per Procedure, with "Default: Contract holder" or "Set by {who}".
     - **Invoice email**: the effective email, or a warning-tint "Needed" chip when a person party
       has none. The party's postal address, where it has one, sits beneath in small type.
   - The row's edit link opens a new `shared/flows/BillablePartySheet.tsx` (bottom sheet on mobile,
     dialog on web and admin) with these options:
     - Use the default (names it).
     - The patient.
     - A parent or guardian: pick an existing one, or "New guardian" with name, relationship, email
       and phone, which calls `createBillableParty` then `setBillableParty`.
     - The List's hospital, or another hospital.
     - A surgeon entity or other organisation.
   - The sheet also holds an **invoice email** field, prefilled from the chosen party's own email.
     The same sheet serves the anaesthetist and the office (US-11.2.2 names both); the rights come
     from the store guard.
   - Mobile stays mobile-first: tappable rows, a segmented choice, no dropdown where a list of five
     fits. No money is shown on mobile.
   - Move the office's payer row and "New guardian" out of `OfficeBillingSetup` and
     `EditBillingSetupSheet`; those keep the per-Procedure Contract setup from 20.
6. **Child billable party: flag and block.**
   - **Setup:**
     - A warning banner on the Booking detail in all three apps: "{Patient} is under 18 and is set
       to pay. Set a parent or guardian as the billable party." Its teal "Set billable party" button
       opens the sheet on the guardian option.
     - The same warning appears inline in `ManualCardForm` when the entered DOB is under 18 on the
       List date and the default party is the patient.
   - **Review:** a warn flag "Under 18 and billed directly" (item 7).
   - **Authorise** (D4 default):
     - A new pure `authoriseBlockersFor(state, listId)` in `store/lifecycle.ts`. Child payer is its
       first kind; the schedule miss joins it in item 12.
     - `authoriseList` refuses with `authoriseBlocked` and the per-Booking details.
     - The Review action bar replaces the button's enabled state with the sentence "Authorising is
       blocked until an adult is set as billable party for {patient}." and the caption "Provisional
       rule. AA to confirm whether this blocks or only warns."
     - PWA "Play the office" auto-authorise and 14's "Office authorises this List" stand-in
       (`authoriseAsSimulatedOffice`) inherit the refusal (they call the same guard). Check the timer
       fails quietly, the stand-in shows the blocker sentence as its result line, and neither records
       anything half-done.
   - The flag clears when an adult party is saved (US-11.2.4 AC2).
   - Tests:
     - 17 years 364 days on the List date is flagged; 18 on the List date is not.
     - A guardian party clears it.
     - A hospital-holder Contract on a child is not flagged (the child is not the billable party).
     - `authoriseList` refuses, then succeeds after `setBillableParty`.
7. **Review: who is invoiced, and the child flag.**
   - In `ReviewScreen.tsx` add an **Invoice to** column: each distinct party name, with its email in
     small mono beneath (or a "Needed" chip) and its postal address where it has one (US-07.2.2
     "addresses and invoice email addresses").
   - The Patient cell gains an age chip when under 18 on the List date, and an insurer line when the
     Booking has one: "nib · member 12345678", or "AIA Health · no direct claims, patient forwards"
     (US-07.2.2: insurer details, addresses and invoice emails; US-11.4.2).
   - Each row gains an **Open** link to the admin Booking detail that returns to this Review screen
     (US-07.2.2 "approve or correct" without leaving for Day view).
   - `reviewFlags.ts`:
     - Add `childBillableParty` (warn).
     - Add "Invoice email missing" (neutral, only reachable on a moved-in incomplete Booking).
     - Add "No Contract" (neutral, same reachability) and "Insurer to add" (neutral: the Booking's
       funding source or its Contract's category is insurance but no insurer is set; US-07.2.2
       "whether insurance needs adding"). All advisory; they never gate authorise.
     - Take the new inputs as parameters so the module stays pure.
   - Keep the table inside the mockup's anatomy: columns, not new panels.
8. **Seed, persist and trigger, then re-green (end of session 1).**
   - **Patients:** give every generated and pinned patient a deterministic `@example.net` email
     (for example `firstname.surname@example.net`), except the cases item 16 leaves blank on
     purpose.
   - **Guardian:** Hana Park keeps hers; Grace Park's Booking gets
     `billableParty: {kind: 'billableParty', id: BP.guardian}`.
   - **Other payers:**
     - Aria clinic: the Booking override, or the Contract holder, whichever 18 made it.
     - AIA reimbursement (Rutherford Thu 16): the Booking's insurer is AIA (if 20 did not already
       set it).
     - Riley (S4 Beat 1): has an email, so S4 Beat 1 is unchanged.
   - **Staging action:** add `stageChildBilledDirectly(api)` in a new `src/store/demoStaging.ts`,
     exported from `src/store/index.ts` (the "Demo triggers" section describes it). Register its
     harness-bar entry now, so session 1 ends demoable; item 15 adds the PWA entry.
   - **Persist:** bump `PERSIST_VERSION` by one from the value Phase 20 left (13 at the snapshot).
   - **Tests:**
     - Update `seed.test.ts` and `demoScenarios.test.ts`.
     - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` before
       starting session 2.

**Session 2: required inputs, completeness, not on schedule, Contract approval**

9. **Required inputs on the Contract.**
   - `Contract.requiredBookingInputs: RequiredBookingInput[]`, where the type is `'invoiceEmail' |
     'billableParty' | 'prepaidAmount' | 'insurerMemberNumber' | 'claimReference' | 'purchaseOrder'`
     (domain-model `requiredBookingInputs`). US-04.2.7.
   - Booking holds the values:
     - `insurerMemberNumber?` (reuse 20's field if it added one).
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
      a guardian on a hospital-holder Contract; `billableParty` unmet by a default party and met by
      an explicit one.
11. **Completeness** (`validateBookingForBilling`, `validateCardForBilling` renamed). US-03.6.1 and
    FT-03.6.
    - **Every Procedure has a Contract** ("Choose a Contract for this procedure."). Keep 20's check if
      it exists.
    - **Every Procedure has an RVG code or a fee-schedule line** (US-03.6.1): keep today's check as
      18 and 19 reshaped it; do not duplicate it.
    - **Every Procedure has start and handover times**, not only those with an RVG code. The
      catalogue says every Procedure, and the model has no untimed kind, so the rate x time and
      fixed-line Procedures now need times too. Anchor fields stay `anaestheticStartISO` and
      `handoverISO`.
    - **Every missing required input** becomes a Booking-level failure (no `procedureId`) with
      verbatim, dash-free copy:
      - "Add an invoice email. This Booking is billed to {name} directly."
      - "{Contract} needs the insurer member number."
      - "{Contract} needs a claim reference."
      - "{Contract} needs a purchase order number."
      - "{Contract} needs the billable party confirmed."
      - "{Contract} needs the prepaid amount."
    - The context gains `patient`, `listDateISO` and the masters the party rules need. It is built in
      two places, `billingContextForCard` (store) and `CardDetailBody` (~l.179); update both, or make
      the component call the selector so they cannot drift.
    - The Billing block (item 5) grows a row per required input (member number, purchase order,
      reference) carrying `data-validation-fields`, so the existing latch scrolls to and focuses the
      first missing one on mobile and web. Booking-level failures render in the block, not in
      "Also outstanding".
    - The route- and holder-based `billingReferenceMissing` stays a **neutral advisory** only where
      no Contract requires `claimReference`. Where one does, it is a completion failure. The S3 Forte
      AM "No billing reference" flag therefore still shows.
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
      filtered picker and `setProcedureContract` refuse `contractOutOfScope` when the code is outside
      a Contract's scope. For the **office only**, a fixed-schedule Contract whose hospital, surgeon
      and funding scope match but which has no line for the code is offered in a separate picker
      group, "Not on this Contract's schedule (to confirm with the hospital)", and
      `setProcedureContract` accepts it for an office actor. Anaesthetists keep 20's filter. Tests:
      office accepted, anaesthetist refused, every other scope miss still refused.
    - A pure `isScheduleMiss(procedure, contract, lines)` drives a warn flag "To confirm with the
      hospital" in three places: on the Booking detail (all apps, banner on the Procedure), in
      `reviewFlags`, and as an **authorise blocker** in `authoriseBlockersFor`. The patient is never
      invoiced before the office confirms (AC2).
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
      it is open.
13. **Review approves every Contract** (US-07.2.2, DM-31):
    - The Contract column lists **every Procedure's Contract**, one line each, not only the first.
    - Each line shows "Changed by Dr {surname}: was {old}" (the change record from 20) with a teal
      **Approve** and a **Correct** link (opens the Booking's billing setup), or "Approved {time}"
      once done.
    - Store `approveContractSelection(api, actor, {bookingId, procedureId?})`: office only; DRAFT or
      SUBMITTED; stamps `approval = {by, atISO, how: 'explicit' | 'authorise'}` on 20's
      `Procedure.contractSelection` (no second record), keeping `anaesthetistChange` as history;
      audit `procedure.contractApprove`. An office re-pick through `setProcedureContract` counts as
      approved (20 already clears the pending change there; stamp `approval` too).
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
    - **Values:** seed member numbers on every nib Booking; a claim reference on every Booking under
      an ACC Contract that lacks one (handcrafted and filler; Losa Tuilagi's `ACC45-118844` on Ropata
      Thu 16 must stay, Phase 25's failure trigger clears it); and times on the seeded completed rate
      x time and fixed-line Procedures that lack them (Aria, Wed 15).
    - **Schedule miss:** if 18 did not seed a hospital-held fixed-schedule Contract at Christchurch
      Eye, seed "Christchurch Eye cataract package" (two eye codes from the RVG master). Put one
      **schedule-miss** Booking (strabismus or another eye code off the schedule) and one
      patient-direct **invoice-email-missing** Booking on Dr Souter's Wed 22 Jul AM Christchurch Eye
      List (`wed22Ces` in `cards.ts`, already pinned out of the filler with six eye Bookings; DRAFT,
      not Rutherford's S2 List), appended after the existing six with dedicated pinned patients (not
      `takePatient()`, which would shift every later filler Booking), with `SEED_MARKERS` `scheduleMissBooking` and `invoiceEmailMissingBooking`.
    - **Tests:**
      - New seed test: every completed, non-cancelled seeded Booking passes the new validator.
      - `authoriseBlockersFor` is empty for every seeded SUBMITTED List (S2 Beat 4 and both S3 Lists
        stay non-blocking).
      - The two markers fail as designed.
15. **Demo triggers** (register in `src/shared/demoTriggers/registry.ts`; bodies in `src/store`, see
    "Demo triggers" below):
    - "Stage child billed directly" on Admin Review (registered in item 8).
    - "Office approves this Contract change" on the PWA mobile Booking.
    - Tests in `demoTriggers.test.ts` and a `demoStaging.test.ts`: each trigger's `disabledReason`,
      route scoping (the PWA entry never returned for `'bar'`), the deterministic staged ids, a second
      press doing nothing, and `pwaPurity.test.ts` still green.
16. **Copy, labels and shots.**
    - Add `ACTION_LABELS` and `FIELD_LABELS` for every new action and field.
    - Remove stale "payer derived from route" or "Payer (default)" copy.
    - Add `data-shot` hooks: `booking-billing-block`, `billable-party-sheet`, `review-invoice-to`,
      `review-child-flag`, `review-contract-approve`, `schedule-miss-banner`,
      `authorise-blocked`.
    - Update the Playwright specs in `aa-prototype/visual/` that snapshot Booking detail, Review or
      the invoice document (see Reference), and re-shoot.
    - No en or em dashes anywhere in the new copy.
17. **Decisions log** (PROGRESS.md), superseding earlier readings:
    - The silent BTM fallback on a fixed-schedule miss (the 2026-07-22 "Type 3 second-procedure
      fallback" reading, and the 8th-review comment in `fee.ts`, for primary Procedures) is now a
      flagged miss.
    - The 7th-review A1/B15 payer reading is replaced: the payer is now the Booking's billable party,
      not the route.
    - Phase 07 said "authorise is never gated by flags". Two named blockers now exist, the child payer
      (D4, provisional) and an unconfirmed schedule miss. Every other flag stays advisory.
    - The `claimReference` placement.
    - The office-only exception to 20's scope filter: an off-schedule fixed-schedule Contract can be
      set by the office, and the schedule miss it creates is derived, never stored.

## Demo triggers

| Label | Screen (routes) | Surface | Effect |
|---|---|---|---|
| **Stage child billed directly** | Admin Review queue and Review screen (`/admin/review`, `/admin/review/:listId`) | Harness bar | `stageChildBilledDirectly(api)` (see below), then links to that List's Review screen |
| **Office approves this Contract change** | Mobile Booking detail (`/mobile/lists/:listId/cards/:cardId` at the snapshot, or the Booking pattern 15 left) | PWA sheet only (`surfaces: ['pwa']`, `badge: 'office-stand-in'`) | `approveContractSelection` on the Booking in the URL, as 14's `OFFICE_SIMULATION_ACTOR` ("AA office (simulated)", office role and source) |

**Stage child billed directly.**
- **What it stages.** It uses a spare, deterministic, past-dated List with a hospital that no S1 to
  S5 beat uses. Past Lists are filled by the seed's filler (`cards.ts` ~l.1150), so either pick an
  assigned List the filler already leaves empty (its per-List `slotRng` skips some), or add one to
  the filler's `pinnedListIds` and re-check that no scripted figure moved (pinning shifts the
  filler's patient and budget draws downstream). Dr Hughes has no Friday Christchurch Eye List; a
  permanent Christchurch Eye List such as Dr Beaumont's Friday AM is the kind of slot to look for.
  Record it as `SEED_LIST_IDS.childPayerStage` and assert it is empty and DRAFT in the pristine seed.
  The staging runs through the real guarded actions:
  - It upserts a 15-year-old patient (age taken on the List date) with a fixed valid NHI, through
    `upsertPatient` (`store/intake.ts`).
  - As that List's anaesthetist (an `Actor` built like `SOUTER_ACTOR`), it creates a Booking on the
    patient-direct RVG Default Post-paid Contract with the teenager's own email as invoice email and
    times captured.
  - It completes the Booking, then submits the List.
- **What it leaves.** The List is SUBMITTED, off the S2 and S3 Lists, with a child billed directly.
  Review shows the flag, and authorise is blocked until the office sets a guardian, whose email
  becomes the invoice email.
- **Disabled state.** "Already staged" once the List is non-empty. The body lives in `src/store`, not
  in `src/apps/demo`, so the PWA purity test holds.

**Office approves this Contract change.**
- **When it shows.** Only when the Booking has an unapproved anaesthetist Contract change; otherwise
  it is disabled with "No Contract change to approve".
- **Why it exists.** The handset beat: the anaesthetist changes the Contract on the phone, sees it
  "awaiting office approval", and the office stand-in approves it, so the phone shows "Approved by
  the office {time}". In the framed build the presenter approves on Admin Review instead, so no
  bar entry.

**No other triggers.** Setting a billable party, an invoice email, a member number, or confirming a
schedule miss are product actions in the product UI.

## Out of scope

- Sending the invoice to the email or the portal, Contract-driven layout and delivery, agent
  wording, and the covered-amount split that replaces `funderOverride` (Phase 22).
- The primary Procedure and the multi-procedure rule, including the additional-procedure ordinal
  fallback (Phase 23).
- Contract versions, and locking the selection, party and inputs at AUTHORISED (Phase 25).
- Deriving prepayment and what `prepaidAmount` means once derived (Phase 27).
- A patient record screen, missing NHI and the unpaid alert (Phase 40).
- Hospital data setting the Contract (Future Work lane, OQ-22).
- A per-Procedure billable party override beyond the Booking's own, and a billable-party or
  guardian master screen. Build neither.

## Manual test checklist

- [ ] **Hospital override (US-11.2.2 AC).** Admin, a DRAFT Booking on the patient-direct RVG Default
      Post-paid Contract, billed to the patient by default: set the billable party to Christchurch Eye.
      The fee is unchanged to the cent, Invoice to shows the hospital with its contact email, and
      History records the change.
- [ ] **Guardian on mobile.** As Dr Souter, set a new guardian with an email via the bottom sheet.
      The invoice email defaults to the guardian's. The same sheet opens as a dialog on the web app.
- [ ] **Office rights.** On a SUBMITTED List the anaesthetist cannot edit the billable party; the
      office can. Nobody can on AUTHORISED.
- [ ] **Grouping.** Authorise a List where one Booking has two Procedures with different holders: two
      invoices. With a Booking override: one. S3 Beat 1 figures are unchanged ($396.18; $152.38 and
      $91.43).
- [ ] **Insurer that does not claim directly.** The AIA reimbursement Booking bills the patient, the
      invoice note names AIA Health, and Review shows "no direct claims, patient forwards".
- [ ] **Stage the child case.** On Admin Review, Demo actions: **Stage child billed directly**. The
      List appears in the queue, the Booking carries "Under 18 and billed directly", and authorise is
      blocked with the provisional caption.
- [ ] **Clear the child case.** Set a guardian from the Open link. The flag clears, and authorise
      succeeds with invoices to the guardian. A second trigger press says "Already staged".
- [ ] **Child warning at setup.** Enter an under-18 DOB in the manual Booking form on a patient-direct
      Contract: the warning shows.
- [ ] **Invoice email block.** Wed 22 AM Christchurch Eye, the invoice-email-missing Booking: Mark
      complete on mobile refuses, scrolls to and focuses the invoice email row, and passes once one is
      entered.
- [ ] **Required inputs.** A nib Booking missing its member number refuses completion with "{Contract}
      needs the insurer member number." Tick "Purchase order" on a Contract in Master data, and a
      DRAFT Booking under it now refuses until one is entered.
- [ ] **Times on every Procedure.** A fixed-line or rate x time Procedure without times refuses
      completion.
- [ ] **Schedule miss.** The schedule-miss Booking shows "To confirm with the hospital" (Booking
      detail and, once submitted, Review) with an estimate, and its List cannot be authorised.
      "Confirm with hospital", default pricing with the hospital invoiced: priced by RVG units,
      billed to the hospital, flag gone. Reset and repeat with "Fixed price confirmed": a schedule
      line is added and the Booking prices at it.
- [ ] **Off-schedule Contract.** As the office, on a DRAFT Christchurch Eye Booking with an eye code
      off the cataract package, the picker offers the package under "Not on this Contract's
      schedule"; choosing it raises the flag. As the anaesthetist it is not offered.
- [ ] **Contract approval.** Change a Contract as Dr Souter, submit, then on Review: "Changed by Dr
      Souter" with Approve, which stamps "Approved". Authorising another List stamps every remaining
      approval, and History shows it.
- [ ] **PWA approval.** On the PWA, after a Contract change on a Booking, the demo-actions sheet
      shows **Office approves this Contract change**. The phone then shows "Approved by the office".
      It is disabled on a Booking with no change.
- [ ] **Scripted beats unblocked.** S1 Beat 3 (Sarah Mitchell), S2 Beat 4 (Morrison) and S4 Beat 1
      (Riley) run exactly as scripted, with no new blocker.
- [ ] No en or em dashes in any new UI copy; teal on every new action; crimson nowhere new.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all green.

## Demo guide updates

In the same session, patch `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`, the matching sections of
`master-demo-guide.html`, and the Control Panel scenario text in `DemoControlPanel.tsx`:
- **S1 Beat 3:** "Worth pointing at" gains one line. Mark complete also checks the Contract, times on
  every Procedure and any inputs the Contract requires. Sarah is on St George's default Contract,
  billed to the hospital, so nothing extra is asked. Expected results are unchanged.
- **S2 Beat 4:**
  - "Say" and "Expected": Review now shows every Procedure's Contract, who is invoiced and where,
    and authorising approves the Contract selections. The beat stays non-blocking.
  - Add an **optional aside** after it: Demo actions, **Stage child billed directly**. Authorise is
    blocked, set a guardian, then authorise. Name the rule as provisional (OQ-54).
- **S3 Beat 1:** "It resolves the explicit payer per Procedure … groups by counterparty" becomes
  "groups each Booking's Procedures by billable party, the Contract holder unless the office set
  someone else". Figures are unchanged.
- **S4 Beat 1:** no change (Riley has an invoice email). Confirm by running it.
- **Cheat sheet:** in the payer section Phase 20 rewrote, add the billable party (independent of
  pricing), the invoice-email rule for patient-direct, the child rule (provisional block), the
  not-on-schedule flag, and the two named authorise blockers.
- **Workflows doc:** the office-review steps (flags, approvals) and the anaesthetist Mark complete
  step (what is checked).
- **Personas doc:** the office inspects invoice-to and child flags.
- **Control Panel S2 text:** mention the optional child aside and where its trigger lives.

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
- **Grouping.** It is one invoice per distinct effective party per Booking. A guardian prepayment
  invoice goes to the guardian. No invoice ever goes to a patient under 18 on the List date: check
  the age maths at the 18th-birthday boundary uses the List date, not the demo clock.
- **Completeness.**
  - Every seeded completed Booking passes the new validator.
  - No seeded SUBMITTED List has an authorise blocker, and S1 Beat 3, S2 Beat 4, S3 and S4 Beat 1
    run unchanged.
  - Booking-level failures anchor and focus correctly on mobile and web.
  - The implicit invoice-email rule fires for every person party, declared or not.
- **Authorise blockers.**
  - Exactly two exist (child payer, schedule miss). The UI and `authoriseList` share one pure
    function. The provisional caption is present.
  - Authorising stamps every remaining Contract approval atomically.
  - The PWA office simulation cannot half-authorise a blocked List.
- **Schedule miss.** No silent BTM fallback remains for a primary Procedure. The additional-procedure
  ordinal fallback is untouched (Phase 23). Both resolve outcomes are single audited mutations.
- **Discipline.**
  - Every new write goes through `mutate()` with labels.
  - The staging trigger is deterministic, idempotent, lives in `src/store`, and passes
    `pwaPurity.test.ts`; the new billing modules pass `domainPurity.test.ts`, and no fee or estimate
    reaches mobile (`moneyViewPurity.test.ts`).
  - The PWA-only trigger never shows in the harness bar.
  - `PERSIST_VERSION` is bumped for each seed change.
  - No en or em dashes in app copy; teal is the only action colour.

## PROGRESS.md updates

- **Status table:** add a catch-up row for Phase 21.
- **Phase entry.** A catch-up Phase 21 entry covering:
  - the drift-check result (catalogue diff, OQ-54 and D4 status, what Phase 20 left that this
    phase reused, and the RVG Default Hospital holder tension from step 5, as a question for the
    owner);
  - the files and actions added;
  - the `PERSIST_VERSION` bumps;
  - the tests added;
  - the staged slot chosen for the child trigger;
  - the manual checklist, item by item;
  - the adversarial review pass;
  - anything deferred to 22, 23, 25 or 27.
- **Decisions log:** the five entries from item 17 (silent BTM fallback superseded; route-based payer
  superseded; the two named authorise blockers, with the child block provisional under D4; the
  `claimReference` placement; the office-only off-schedule Contract).
- **Handoff list:** add "Phase 22 sends to `Invoice.invoiceEmail` and replaces `funderOverride`;
  Phase 23 keeps `isScheduleMiss` off additional Procedures; Phase 25 locks the party, email and
  `requiredInputValuesFor` with the Contract; Phase 27 decides `prepaidAmount`".
