# Phase 21 · Payer, insurer or funder, and who is billed

**Requirements covered** (status and gap verdict at catalogue `efe123c`):
[FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md) Who is billed: holder or the payer on the Booking (Verify; **Contradicts**: who is billed follows a hand-picked route, and a surgeon's fixed price bills the surgeon) ·
[US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md) Patient billed when the Contract does not bill its holder (Verify; **Contradicts**: nothing bills the payer by rule; now also a surgeon's fixed-price Contract, No contract · Fixed price and every prepaid Contract) ·
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) Payer on the Booking (Confirmed; **Contradicts**: a per-Procedure guardian override, no name, email and postal address on the Booking, not prefilled, the anaesthetist cannot change it) ·
[US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md) Payer email or postal address required when the payer is billed (Confirmed; Missing; where it is enforced is not stated) ·
[US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md) Warn when a child is the payer on the Booking (Confirmed; Missing) ·
[US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) Insurance and approval number on the Booking (Verify; **Contradicts**: the insurer is a per-Procedure route that bills the insurer; no funder as a Party, no approval number, no warning, office-only) ·
[US-04.3.10](../../../../requirements-board/requirements/stories/US-04.3.10.md) Suggested path from the Booking's funder (Verify, **joined**; Missing) ·
[DM-11](../analysis/domain-model-delta.md#dm-11) who is billed is a setting of each Contract: its holder Party, or the payer named on the Booking, replacing the per-Procedure override ·
[DM-12](../analysis/domain-model-delta.md#dm-12) the Booking carries the insurer or funder (a Party) and the approval number; the funder only suggests a path; a missing number is a warning for an insurer only ·
[RV-30](../analysis/reverse-check.md#rv-30-the-payer-is-a-per-procedure-billable-party-record-tied-to-a-billable-party-route) the per-Procedure guardian record and its route.

**Joined at `efe123c`:** US-04.3.10 (the funder's "Suggested" path, item 10).
**Left at `efe123c`:** completion, `finish`, office review and Contract approval moved to Phase 21a: [FT-03.6](../../../../requirements-board/requirements/stories/FT-03.6.md), [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md), [US-03.3.3](../../../../requirements-board/requirements/stories/US-03.3.3.md), [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md), DM-59 and RV-21 are 21a's. [DM-16](../analysis/domain-model-delta.md#dm-16) (the references a holder needs) is no longer held: OQ-136's default (D82) is that the Booking keeps only the approval number, so no `holderReferences`, no member number or purchase order field and no "Reference needed" flag are built. The work items that built them (holder references, completion, Review, Contract approval, the PWA "Office approves" trigger, the empty `authoriseBlockersFor` seam) are removed here.
**Earlier:** FT-11.4 and US-11.4.2 Retired (28 October); US-04.2.7 Retired and US-04.3.7 Future Work (no required booking inputs, no hospital or insurer default Contracts); RV-29 became RV-30; US-08.2.1 Matches (grouping kept, pinned by a parity test).

**Carried across without regression:** FT-08.2's and US-08.2.1's grouping (one invoice per distinct party per Booking) and the S3 figures, with parity tests.

**Touches, without closing:**
[US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) and [US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) (18's Party and each Contract's bills-its-holder setting, which this phase acts on; the Party's delivery, which `invoiceDeliveryFor` reads and 22 sends by),
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) (its "Holder references" criterion is not built: D82),
[US-04.3.8](../../../../requirements-board/requirements/stories/US-04.3.8.md), [US-04.2.17](../../../../requirements-board/requirements/stories/US-04.2.17.md) and [US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (20's step rail and 18a's funding tags: this phase adds the one "Suggested" mark and nothing else),
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) and [DM-51](../analysis/domain-model-delta.md#dm-51) (20a's stack, whose "who is invoiced" selector this phase re-points),
[DM-48](../analysis/domain-model-delta.md#dm-48) (18's Party: the Booking's funder references one),
[DM-31](../analysis/domain-model-delta.md#dm-31) (two rules registered with 15a's routine),
[US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) (an event's billable party defaults to its Procedure's: 39b reads `billablePartyForProcedure`),
[FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md) (the matching screen shows the funder and approval number: 33) and
[DM-28](../analysis/domain-model-delta.md#dm-28) (the grouping key changes here; the Split action is 22's).

**Answered, built as answered:**
[OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) (**D17**, extended 5 November: the Contract decides who is billed, the holder a Party; every Booking names a payer),
[OQ-54](../../../../requirements-board/requirements/questions/OQ-54.md) (**D4**: a child as payer is a mild, clearable warning, none when a holder is billed),
[OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (No contract · RVG bills the payer),
[OQ-55](../../../../requirements-board/requirements/questions/OQ-55.md) (**D2**, extended 5 November: the Booking holds its insurer or funder, a Party, and the approval number),
[OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md) (**D28**, answered in full: fields on the Booking; no narrowing; the approval number the one insurance acceptance reference; a missing number the only insurance warning, never a block, shown to the office and the anaesthetist, who sees the number and may change it on the day), and
[OQ-73](../../../../requirements-board/requirements/questions/OQ-73.md) (**D23**, back at Confirm: every prepaid Contract bills the payer; built as the reading, no label, on the owner's review list).
**Still open, built as defaults** (each in one place, logged on the owner's review list):
[OQ-122](../../../../requirements-board/requirements/questions/OQ-122.md) (**D70**: a payer with only a postal address is accepted; 22 marks that invoice "To post"; Greg's "different payer" tick is the payer control),
[OQ-136](../../../../requirements-board/requirements/questions/OQ-136.md) (**D82**: the Booking keeps only the approval number; no holder references are built), and
two readings with no question: US-11.2.3 does not say where the contact rule is enforced, so the payer form asks for one and Review flags a billed payer with neither, never a completion block; the approval warning applies to an insurer only (A42), never to ACC or Health NZ.
[OQ-114](../../../../requirements-board/requirements/questions/OQ-114.md) (how a Party's invoices are delivered) is 18's and 22's; nothing here reads it beyond the Party's setting.

**Depends on:** Phase 15a (the warning routine and registry, the Admin to-do list with Clear, the triangle in all three apps, "Raise sample warnings") and Phase 20a (the three-part Procedure stack with its "who is invoiced" selector). Through them it relies on 20 (one Contract per Procedure; the step rail and its one pure path function; the route, payment category and `Procedure.insurerId` gone; the interim who-is-billed and the `billablePartyId` overrides that this phase replaces), 18 and 18a (the Party master with its kinds `insurer` and `funder`, each Contract's bills-its-holder setting with a prepaid Contract and an AA or anaesthetist holder always billing the payer, the Party's delivery by email or post and its hidden Xero id, funding tags), 17 (hospital and rooms contact emails), 16 (the Xero contact-name helper), 15b (ACTIVE) and 14 (trigger registry). Completion, Review, Contract approval and the 'finish' wording are 21a's, which depends on this phase.
**Estimated:** 2 sessions. Session 1 is work items 1 to 7: the payer on the Booking, who is billed in one function, grouping, the guardian master out, the child-payer warning, seed, re-greened and demoable. Session 2 is items 8 to 13: the funder and approval number, its warning, the suggested path, seed, copy, shots, decisions. If session 2 runs long, finish and re-green items 8, 9 and 10 first; shots and the demo guide are the tail to carry over, never the tests.

## Goal

**Who is billed is the Contract's own setting** (FT-11.2, US-11.2.1, DM-11, OQ-67, D17;
[AR-61 · Who is billed](../../../../requirements-board/requirements/artifacts/AR-61.md#who-is-billed),
[AR-44 · Holder billed](../../../../requirements-board/requirements/artifacts/AR-44.md#bill-holder),
[AR-44 · Payer billed](../../../../requirements-board/requirements/artifacts/AR-44.md#bill-payer)):
a Contract set to bill its holder bills the holder Party; otherwise the invoice goes to the **payer
named on the Booking**. No contract · RVG, No contract · Fixed price, a surgeon's fixed fee, an
anaesthetist's own Contract and every prepaid Contract bill the payer (OQ-73 at Confirm, D23: built as
the reading; 18 already forces it on the Contract). So the Doyle bariatric Booking, billed to the surgeon
today, is billed to the payer at the Contract's price. AA acts as agent; office review catches a wrong
party. 20's interim override goes.

**Every Booking names a payer** (US-11.2.2, DM-11, RV-30;
[AR-44 · Payer](../../../../requirements-board/requirements/artifacts/AR-44.md#payer),
[AR-44 · Patient and payer](../../../../requirements-board/requirements/artifacts/AR-44.md#patient)):
name, email and a postal address in the NZ Post standard. Greg's **"different payer" tick** is the
control: unticked, the payer is the patient and their details are read from the patient record; ticked,
the Booking holds another payer's details: a parent, a guardian, a benefactor or a family trust. The
office or the anaesthetist can change it. The payer is held on the Booking with no guardian master (the
per-Procedure `billablePartyId` and the guardian rows of the `BillableParty` master and
`createBillableParty` go; Hana Park becomes the payer on Grace Park's Booking). A holder billed by its
Contract is unaffected: its details are on its Party, so no Xero contact moves. The catalogue puts the
payer on the Booking and lets the anaesthetist change it; Greg's v6 design had it per booking procedure,
admin only, and wanted one billable-party table. Build the catalogue's reading and log the tension.

**Invoices group by billable party per Booking**, one per party (US-08.2.1 Matches; FT-08.2), with a
parity test. A **billed payer needs an email or a postal address** (US-11.2.3); a postal address alone is
enough (D70's default; 22 marks the invoice to post). Where it is enforced is not stated, so the payer
form asks for one and a Review flag shows a billed payer with neither; never a completion check (a
reading, logged). A **payer under 18** on the List date raises a mild, clearable warning through 15a's
routine (US-11.2.4, D4), never a block, and none when another payer is ticked or the Contract bills its
holder.

**Insurance and funding on the Booking** (US-11.4.3, DM-12, OQ-93, D28 extended;
[AR-44 · SXAP](../../../../requirements-board/requirements/artifacts/AR-44.md#sxap)): the Booking names
its **insurer or funder as a Party** (18: NIB and Southern Cross Health Society are insurers; ACC and
Health NZ are funders) and holds the **approval number**, from the source data where an intake path
carries them, editable by the office and, on the day, by the anaesthetist, who sees the number. A blank
funder is fine when the patient pays. A **missing approval number is the only insurance warning** and
applies **only to an insurer**, never to ACC or Health NZ (our reading, A42); it shows to the office and
to the anaesthetist viewing the Booking and never blocks. The Booking keeps **no other holder
references** (OQ-136's default, D82). The funder never decides who is billed and never narrows the
Contract list.

**The suggested path** (US-04.3.10): inside 20's one pure path function the Booking's funder marks one
path "Suggested" on the step rail, never narrowing, never pre-selecting: no funder, Patient › Standard; a
funder that holds a Contract offered on the List, Special › that holder; otherwise the List's hospital
under the funding tag that names the funder (Southern Cross Health Society suggests SXAP, 18a); else
nothing. The test order and the no-funder case are our reading (the proposal's `suggested(B, L)`), kept
in one place and logged.

**One rule, one place.** The counterparty rule lives in one function in `aa-prototype/src/domain/billing`
(`billablePartyForProcedure`), the payer type and its one writer, the insurance rules and the suggested
path in one place each, behind types the UI reads. 20a's selector, the billing run, Review, the invoice
and Xero read that one function, so a design change (the payer onto each booking procedure, or one
billable-party table) stays a contained edit. Where this plan departs from Greg's v6 field names, say so
in a doc comment. Link AR-61 `#who-is-billed` and AR-44; [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md)
(the proposal) is the field reference. AR-28, AR-29 and AR-30 are Retired: do not cite them.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and questions against the plan's baseline, catalogue
   commit `efe123c` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-11.2,US-11.2.1,US-11.2.2,US-11.2.3,US-11.2.4,US-11.4.3,US-04.3.10,US-08.2.1,FT-08.2,US-04.2.1,US-04.2.2,US-04.1.5,US-04.3.3,US-04.3.8,US-04.3.9,US-04.2.14,US-04.2.17,US-04.3.2,US-03.1.9,US-13.7.1,US-13.7.2,OQ-54,OQ-55,OQ-67,OQ-73,OQ-78,OQ-93,OQ-114,OQ-122,OQ-136
   ```

   Read the hunks (if any) for the covered items, the context items, the questions, and the domain
   model's "Booking", "Contract", "Patient, payer and billable party" and "Warnings" sections and the
   Payer and Party glossary rows.

   At the 2026-11-02 and 2026-11-04 plan updates the changes were: FT-11.4 and US-11.4.2 Retired;
   US-11.4.3 under FT-11.2 (fields on the Booking, the anaesthetist editing on the day and seeing the
   number); US-11.2.2 and US-11.2.3 (name, email and NZ Post postal address; any party who pays; the
   "different payer" tick; OQ-122, D70); OQ-93 answered in full (D28: one insurance warning, no narrowing).

   At the 2026-11-10 plan update (`a68f09b..efe123c`, Donald's 5 November decisions, built as made, not
   yet confirmed by AA): who is billed is each Contract's own setting with the holder a Party (FT-11.2,
   US-11.2.1: surgeon's fixed fee, No contract · Fixed price and every prepaid Contract bill the payer,
   OQ-73 at Confirm, D23); the Booking's insurer or funder is a Party and the approval warning is for
   insurers only (US-11.4.3); US-04.3.10 joined; DM-16 no longer held (OQ-136, D82); wording in
   US-11.2.2 to US-11.2.4 follows the Party; AR-28, AR-29 and AR-30 retired for AR-61 and AR-58.

   Diff anything after `efe123c` the same way. If a covered item is now Retired or Future, drop it and
   say so in the PROGRESS entry.
2. **Questions.** OQ-67, OQ-78, OQ-54, OQ-55 and OQ-93 are answered, and OQ-73 is at Confirm (D23): build
   them with no "provisional" caption. Only OQ-122 (D70) and OQ-136 (D82) are built as defaults, each
   labelled in one place (`invoiceDeliveryFor`; the Booking's one reference field) and logged. If Greg has
   reopened OQ-78, stop and record it: `billablePartyForProcedure` is the one place it changes. If any
   open part has been answered, build the answer and drop its label.
3. **Read what 15a, 18, 18a, 20 and 20a actually left.**
   - 15a's PROGRESS entry: `WARNING_RULES`, the `WarningRuleId` union, `WarningFacts`, the selectors
     (`warningFactsFor`, `warningsForBooking`, `openWarnings`, `clearWarning`), how a cleared warning
     re-opens, and the sample contract (`WARNING_SAMPLES` with `isStaged`/`stage`/`unstage`,
     `SEED_WARNING_SAMPLE_BOOKINGS`, `multiWarning`, `DEMO_TRIGGER_ACTOR`). Use those names.
   - 18's: the Party type (`kind`, the bills-its-holder setting on the Contract, the delivery setting,
     the hidden Xero id), the seeded Parties (NIB, Southern Cross Health Society, AIA Health, ACC,
     Health NZ), any interim counterparty helper left (`routeCounterpartyForHolder`), the Aria clinic and
     Doyle Contracts, and whether `BillableParty` still exists. 18a's: funding tags and whether a tag
     already holds a funder Party (`funderPartyId`); if not, item 10 adds it.
   - 20's PROGRESS entry: the interim `billedPartyFor` and its selector `billedPartyForProcedure(state,
     procedureId)`, the `billablePartyId` overrides, the one pure path function and the rail's candidate
     list, the picker and office "Contract and payer" sheet, the prepayment flag and its person-payer
     refusal, and where the AIA reimbursement Booking (`SEED_MARKERS.aiaClaimBooking`) ended up.
   - 20a's: the stack and its "who is invoiced" selector.
   Reuse what exists instead of adding a second copy, and record what you reused.
4. **Carried across.** Before switching who is billed, pin today's grouping and figures as parity tests:
   S3's Holt $396.18 on one invoice, Prentice $152.38 and $91.43 on two (still through `funderOverride`
   until Phase 22), and every seeded invoice's counterparty except the deliberate Doyle change (step 5).
5. **Deliberate changes, recorded.** The Doyle bariatric Bookings not yet invoiced are billed to the
   payer (US-11.2.1), not Mr Doyle; issued invoices keep their counterparty. Check no S1 to S5 beat shows
   a Doyle invoice; record it in the PROGRESS entry. Confirm from 18's and 20's entries whether Doyle
   still bills the surgeon before the switch; if they moved it, record where it landed rather than
   making it twice.

## Reference

**Design files (convention 17).** `docs/design/Mobile App.dc.html` is the layout for the mobile Booking
detail sections, rows, edit links and bottom sheets; the Payer and Funder rows follow its Section/Row
pattern. `docs/design/Admin Review.dc.html` is the layout for the Review row's flag pill (neutral and
warn tints). `docs/design/Design Language.dc.html` for tokens: warning tint for warnings and missing
fields, a neutral pill for "Suggested", teal for every action (Change, Save), crimson never.

**Catalogue.** The covered items, plus
[US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) (bill its holder),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) (the Party and its delivery),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (No contract · RVG bills the payer),
[US-04.3.9](../../../../requirements-board/requirements/stories/US-04.3.9.md) (the open-price fallbacks),
[US-04.3.8](../../../../requirements-board/requirements/stories/US-04.3.8.md) (the step rail),
[US-04.2.17](../../../../requirements-board/requirements/stories/US-04.2.17.md) (funding tags),
[US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md) (delivery and posted invoices: 22),
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) (the stack),
[US-08.4.2](../../../../requirements-board/requirements/stories/US-08.4.2.md) (send to the email: 22 sends, this phase captures),
[FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md) and [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) (the routine and to-do list).
Evidence: run `npm --prefix requirements-board run source -- --item <ID> --text` for FT-11.2, US-11.2.2,
US-11.2.3, US-11.2.4, US-11.4.3 and US-04.3.10 and read the cited passages (above all
`2026-10-28-aa-meeting-with-greg.md` #4 #29 to #35 #40 to #42 #76 #82, and the 5 November Donald
decisions #2 #7 #8 #16 #23). Change logs `2026-10-28-aa-meetings-with-ben-vanessa-and-greg.md` and
`2026-11-05-flat-contract-model-and-ben-vanessa-meeting.md` (their FT-11.2, US-11.2.x, US-11.4.3 and
US-04.3.10 rows).
**Diagrams (read, never edit):** [AR-61](../../../../requirements-board/requirements/artifacts/AR-61.md)
`#who-is-billed` and `#party`; [AR-44](../../../../requirements-board/requirements/artifacts/AR-44.md)
`#payer`, `#patient`, `#bill-holder`, `#bill-payer`, `#sxap`. The field reference is the Contract model
proposal, [AR-58](../../../../requirements-board/requirements/artifacts/AR-58.md) (§2.6 funding tag, §2.7
Booking fields, the `suggested(B, L)` rule near L687-691, the readings A2, A25, A40, A42).

**Analysis.** `../GAP-ANALYSIS.md` (EP-11 and EP-04 tables, the structural rows DM-11 and DM-12);
`../epics/EP-11.md`; `../analysis/domain-model-delta.md` (DM-11, DM-12, DM-28, DM-31, DM-48);
`../analysis/reverse-check.md` (RV-30); the prototype maps in `../analysis/`.

**Code entry points** (line numbers move as 15a to 20a land, so use the shapes they left):
- `src/domain/types.ts`: `CounterpartyKind` and `CounterpartyRef`, `Patient` (`email`, free-text
  `address`, `dobISO`), `BillableParty` (its guardian rows and `relationshipToPatient` go), 18's Party
  and Contract, `Booking`, `Procedure` (`billablePartyId` goes), `Invoice`; 15a's
  `src/domain/warnings/types.ts`.
- `src/domain/billing/invoiceBuild.ts`: `counterpartyForProcedure` (replaced), `buildInvoicesForBooking`
  (grouping), `buildPrePaymentInvoiceForBooking`.
- Made by earlier phases: `src/domain/billing/whoIsBilled.ts` (20's interim `billedPartyFor`, rewritten
  here), `src/domain/billing/procedureStack.ts` (20a's `whoIsInvoicedFor`), 20's path function (the
  step rail's candidates), `src/domain/billing/modifiers.ts` (19b's `ageInCompletedYears`),
  `src/store/warningSamples.ts`.
- `src/store/billablePartyActions.ts` (removed), `src/store/bookingActions.ts` (`createBooking` and every
  creation path), `src/store/selectors.ts` (`counterpartyName`, `billingContextForBooking`),
  `src/store/xeroHandoff.ts`, `src/store/billingRun.ts`.
- `src/apps/admin/reviewFlags.ts` (the one payer-contact flag), `screens/InvoiceDocument.tsx`.
- `src/shared/booking/BookingDetailBody.tsx` (the context slot), `OfficeBillingSetup.tsx`,
  `src/shared/flows/EditBillingSetupSheet.tsx` (guardian select and "New guardian"),
  `EditPatientSheet.tsx`, `ManualBookingForm.tsx` (payer select), 20's picker sheet and
  `PhoneAdviceBooking`, `src/shared/format.ts` (`ageYears`), `src/shared/audit/actionLabels.ts` and
  `fieldLabels.ts`.
- Seed: `src/domain/seed/patients.ts` (`BP`, `BILLABLE_PARTIES`), `bookings.ts` (the Doyle bariatric
  Booking, the Webb AIA Booking, the Grace Park guardian Booking, `pinnedListIds`, the filler),
  `history.ts` (`pa05`), `billing.ts`, `audit.ts`, 18's Party seed, `index.ts` (`SEED_LIST_IDS`,
  `SEED_MARKERS` incl. `guardianMinorBooking`), `seed.test.ts`.
- Phase 14's `src/shared/demoTriggers/registry.ts`, `demoTriggers.test.ts`.
- Purity tests: `src/pwa/pwaPurity.test.ts`, `src/domain/domainPurity.test.ts`,
  `src/apps/moneyViewPurity.test.ts` (no money on mobile).
- Playwright specs in `aa-prototype/visual/` that shoot Booking detail, Review, invoices, the to-do list
  and the billing setup sheet (`npm run shots`).

## Work items

**Session 1: the payer on the Booking, who is billed, grouping, the child-payer warning**

1. **Model** (`domain/types.ts`, doc comments citing AR-44 `#payer` and AR-61 `#who-is-billed`):
   - `Booking.payer: BookingPayer`, required on every Booking (US-11.2.2, DM-11):
     - `{ kind: 'patient'; email?: string; postalAddress?: PostalAddress }`: the tick is clear; name,
       email and postal address are read from the patient record, and the two optional fields hold ones
       typed for this Booking where the record has none (not written back).
     - `{ kind: 'other'; id: PayerId; name: string; relationship?: string; email?: string;
       postalAddress?: PostalAddress; phone?: string }`: the tick is set; any party who pays, such as a
       parent, a guardian, a benefactor or a family trust. `id` keeps the `BP####` format and
       `counters.billableParty`, so a re-expressed guardian keeps its Xero contact.
     - Contact is optional in the type so a payer can be saved before it is known; the form asks and
       Review flags it (items 5, 7); never a completion check.
     - Doc comment: the catalogue's Booking-level payer, editable by the anaesthetist, against v6's
       per-booking-procedure admin-only payer and Greg's single table; one type, one writer, one reader.
   - `PostalAddress` in the NZ Post standard: `{ line1 (street address, PO Box or Private Bag); line2?
     (unit, building or RD); suburb?; city; postcode (four digits) }`. `Patient.address` becomes
     `postalAddress?: PostalAddress` (re-express the seeded free text; `EditPatientSheet` gets the same
     fields). Pure `formatPostalAddress` and `postalAddressProblem` in `src/domain/billing/payer.ts`.
   - `CounterpartyKind` gains `'payer'`: the other payer named on a Booking, `id` its `BP####` id. A
     holder Party keeps the counterparty kind 18 gave it. Never resolve one id two ways.
   - **The guardian master goes (RV-30):** delete `store/billablePartyActions.ts`
     (`createBillableParty`), `Procedure.billablePartyId` and the guardian row `BP0001` from the master;
     `relationshipToPatient` goes. If 18 left `BillableParty` only for holders' records, fold what
     remains into the Party and keep its hidden Xero id.
   - `Invoice.billedTo?: { name: string; email?: string; postalAddress?: PostalAddress }`, a snapshot
     taken at the run, so the payer's details stay with the debt. Phase 22 sends from it.
2. **Who is billed: one pure module** `src/domain/billing/whoIsBilled.ts`, re-exported from the billing
   index, Vitest-covered, the only place the rule lives. Rewrite 20's file in place, never a second
   module.
   - `billablePartyForProcedure(procedure, contract, booking)` replaces `billedPartyFor` (rename every
     caller; 20's selector becomes a distinctly named wrapper, for example
     `billablePartyForProcedureId(state, procedureId)`): the Contract's holder Party when the Contract is
     set to bill its holder; otherwise the payer on the Booking (`{kind: 'patient', id: patientId}` or
     `{kind: 'payer', id}`). It reads the Contract's setting only, never a price, the funder or a
     holder's kind; 18 already forces the payer on a prepaid Contract and on an AA or anaesthetist
     holder (OQ-73, D23: pin it with a test and a doc comment, no label). Delete any
     `routeCounterpartyForHolder` 18 left.
   - `isPayerBilled(...)`: the Procedure's party is the payer on the Booking. `isPersonParty(party)`:
     true exactly for a `patient` or `payer` party, never a holder Party (a family trust named as payer
     counts); 27 may read it.
   - `payerDetails(booking, patient)` (name, relationship, email, postal address: the typed values, else
     the patient's record) and `payerContactMissing(booking, patient, parties)` (the payer is billed and
     has neither an email nor a valid postal address: US-11.2.3; false when a holder is billed).
   - `invoiceDeliveryFor(party, booking, patient, parties)`: for a holder Party, 18's delivery setting
     (email, or post); for the payer, email where there is one, else post to the postal address (**D70's
     default**, labelled here only); else none. 21a's Review shows it; 22 sends from it, never a second
     rule. `billedToFor(...)` builds the snapshot.
   - Age: reuse 19b's `ageInCompletedYears(dobISO, onISO)`; if `shared/format.ts` `ageYears` does its own
     maths, make it call that. `childPayerOn(booking, patient, procedures, contracts, dateISO)`: the
     payer is `{kind: 'patient'}`, the patient is under 18 on the List date, and at least one Procedure
     is billed to the payer. False when another payer is ticked or every Procedure's Contract bills its
     holder (US-11.2.4).
   - 20a's `whoIsInvoicedFor` now reads `billablePartyForProcedure`; its output shape is unchanged.
3. **Store: one writer.** `setBookingPayer(api, actor, bookingId, payer)`: the only writer of
   `Booking.payer`. It allocates a `BP####` id for a new other payer, checks an email's shape ("Enter a
   valid email.") and a postal address through `postalAddressProblem` ("Enter a four-digit postcode."),
   and runs `editRefusal` as 38a left it (the anaesthetist on their own List and the office until
   AUTHORISED). Through `mutate()`, audited `booking.payer` ("Payer: Grace Park to Hana Park (Mother)").
   Phase 27 hooks its prepayment re-check here; say so in the handoff. Every creation path
   (`createBooking` for the anaesthetist add, phone advice, manual entry and the integration creates)
   sets `payer: {kind: 'patient'}`; a form may pass another payer. A changed patient on a
   `{kind: 'patient'}` payer follows the new patient. `ACTION_LABELS` and `FIELD_LABELS` for it.
4. **Billing run grouping** (`invoiceBuild.ts`), with the parity tests from drift-check step 4 green
   before and after:
   - Each line's counterparty is `billablePartyForProcedure`; `funderOverride` still beats it until 22,
     so Prentice's two invoices hold. One invoice per distinct party per Booking.
   - Snapshot `billedTo` on each invoice. `layoutFor` stays as 18 and 20 left it (22 makes it
     Contract-driven), with `payer` on the patient layout. `buildPrePaymentInvoiceForBooking` addresses
     the payer and covers only Procedures billed to it.
   - `counterpartyName`, `xeroHandoff`, `seed/billing.ts` and `seed/history.ts` resolve a `payer`
     counterparty from the Booking (or the snapshot) through one selector, `payerRecordFor(state,
     bookingId)`. Phase 16's helper gives a `payer` the contact name a guardian had, so Hana Park's Xero
     contact does not move (Xero keys on the hidden id: 13 files read `billablePartyId`, so grep them
     all).
   - `InvoiceDocument` shows `billedTo`: the name, then the email or the postal address in NZ Post layout.
   - Tests: a guardian payer under No contract · RVG gets the invoice at an unchanged fee (US-11.2.2
     AC2); a holder-billed Contract does not invoice the payer; each of a surgeon's fixed price, No
     contract · Fixed price, an anaesthetist's own Contract and a prepaid Contract bills the payer at the
     Contract's price (US-11.2.1); an insured patient on No contract · RVG naming a funder is billed (AC3);
     a family trust with only a postal address is billed with `billedTo` carrying it; two parties give
     two invoices; S3 unchanged.
5. **The payer on screen** (shared, all three apps, through `useSurface()`):
   - A **Payer** row in `BookingDetailBody`'s billing context: the payer's name (with "Patient" or the
     relationship) and email, or postal address, beneath; a warning-tint "Email or postal address
     needed" chip when `payerContactMissing`; a small "Under 18" chip when the child warning applies; a
     teal **Change** where `editRefusal` allows.
   - `shared/flows/PayerSheet.tsx` (bottom sheet on mobile, dialog on web and admin): a **Different
     payer** tick. Clear: the patient's name, email and postal address from the record, with email and
     address fillable for this Booking where the record has none. Set: name (a person, or a party such
     as a family trust), relationship (optional: Mother, Guardian, Benefactor, Family trust), email,
     postal address (address line, suburb, town or city, postcode), optional phone. When the payer is
     billed and both email and address are blank, an inline warning-tint line asks "Add an email or a
     postal address"; the save still goes through (the flag shows; logged). For a patient under 18 the
     clear option carries "Under 18. Check whether a parent or guardian should be the payer."
     Mobile-first: tappable rows, a toggle, no dropdown, no money.
   - The stack's Contract part (20a) shows who is invoiced from `billablePartyForProcedure`. Nothing
     else on anaesthetist screens shows a holder's billing setting (US-15.0.1, 43a).
   - Remove the payer select and "New guardian" from `OfficeBillingSetup`, `EditBillingSetupSheet` and
     `ManualBookingForm`; `ManualBookingForm` and `PhoneAdviceBooking` show the payer prefilled from the
     chosen patient with the tick inline.
   - **Review, one line only:** add a neutral "Email or postal address needed" flag to the existing
     Review row (`reviewFlags.ts`, `payerContactMissing`, with `review-payer-contact`). Review's full
     layout, the payer's Change and its delivery line are 21a's.
6. **The child-payer warning** (US-11.2.4, D4, DM-31), added as 15a's handoff says: `rules/childPayer.ts`,
   its `WARNING_RULES` entry, `'childPayer'` in `WarningRuleId`, its `appSettings.warningRules` default
   (`backfillMerge` fills it), the facts on `WarningFacts` filled by `warningFactsFor`, and its sample.
   Kind `beforeProcedure`, strength `mild`, key `${bookingId}:childPayer`, evaluated by `childPayerOn`.
   Text (dash-free): "{Patient} is under 18 and is the payer. Check the payer's details: a parent's or
   guardian's email or postal address may be needed." It shows wherever 15a shows warnings; no
   `reviewFlags` duplicate; it never blocks saving, completing, submitting or authorising. Ticking
   another payer, or moving every Procedure to a Contract that bills its holder, removes it. Tests: 17
   years 364 days on the List date raises it, 18 does not; another payer raises none; a holder billed on
   a child raises none; Clear holds across an unrelated edit; authorise succeeds with it open.
7. **Seed payers, persist and re-green (end of session 1).**
   - **Patients:** give every pinned and generated patient a deterministic `@example.net` email and a NZ
     Post postal address (re-expressed from any free text), except the cases below left blank on
     purpose. Sarah Mitchell (S1), Morrison (S2), Riley and Nair (S4) have an email, so every scripted
     beat and List stays as it runs today.
   - **Payers:** every seeded Booking gets `payer: {kind: 'patient'}` (handcrafted, filler,
     `history.ts`). Grace Park's Booking (`SEED_MARKERS.guardianMinorBooking`) gets `{kind: 'other', id:
     'BP0001', name: 'Hana Park', relationship: 'Mother', email, phone, postalAddress}` from today's
     record (no warning); `pa05` resolves to it. Remove every `billablePartyId`, including 20's interim
     overrides on the Aria Procedures (the Aria clinic stays a holder billed by its Contract).
   - **Payer review List:** a spare, deterministic, past-dated **SUBMITTED** List at a hospital no S1 to
     S5 beat uses, with dedicated pinned patients (fixed valid NHIs, not `takePatient()`); session 1
     adds three completed Bookings, session 2 adds two (item 11):
     - a 15-year-old on No contract · RVG, payer the patient (`SEED_MARKERS.childPayer`);
     - an adult on No contract · RVG whose record has no email and no postal address
       (`SEED_MARKERS.payerContactMissing`: "Email or postal address needed");
     - an adult whose payer is ticked to "{Surname} Family Trust" with a postal address and no email
       (`SEED_MARKERS.familyTrustPayer`: no flag; 22 posts its invoice).
     Pick a List the filler leaves empty or add it to `pinnedListIds`; re-check no scripted figure
     moved. Record it as `SEED_LIST_IDS.payerReview`. The warnings are derived, not seeded.
   - **Filler:** no filler child left as payer on a payer-billed Procedure, so the to-do list holds no
     strays.
   - **Persist:** bump `PERSIST_VERSION` by one from the value the previous phase left.
   - **Tests:** every Booking has a payer; the pristine seed's only child warning is on `childPayer`;
     the review List is SUBMITTED and off every beat; every counterparty matches the parity fixture
     except Doyle. Grep `src` for `billablePartyId`, `createBillableParty`, `New guardian`,
     `routeCounterpartyForHolder` and `billedPartyFor`: nothing outside a comment recording the removal.
   - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` before session 2.

**Session 2: the funder and approval number, its warning, the suggested path**

8. **The insurer or funder and the approval number on the Booking** (US-11.4.3, DM-12; OQ-93, D28):
   - Model: `Booking.funderPartyId?: PartyId` (a Party of kind `insurer` or `funder`; the proposal's
     name, called `insurerHolderId` in earlier plans; 33's hand-off reads it) and
     `Booking.insuranceApprovalNumber?: string`. Never a counterparty. Doc comment: "OQ-93 answered:
     fields on the Booking; no narrowing; the approval number is the one acceptance reference; the only
     insurance warning is a missing number on an insurer; D82: no other holder reference".
   - `setBookingInsurance(api, actor, bookingId, {funderPartyId, insuranceApprovalNumber})`: the only
     writer; the office and the anaesthetist on their own List, under `editRefusal` (on the day is when
     the anaesthetist usually learns of approval; no date gate); the funder must be an insurer or funder
     Party ("Choose an insurer or funder."); audited `booking.insurance`. Set at creation where an
     intake path carries a funder; 33 shows both on the matching screen and sets them from download rows
     through this action. `ACTION_LABELS` and `FIELD_LABELS` for both.
   - Screen: a **Funder** row in `BookingDetailBody`'s billing context in all three apps: the insurer or
     funder and the approval number itself, editable by the office and the anaesthetist (a small sheet:
     a select over insurer and funder Parties, "None, the patient pays", and a number field); "Add
     insurer or funder" when blank. No money, no holder setting on mobile. 20's picker keeps no tag and
     no filter from the funder (OQ-93).
   - `src/domain/billing/insurance.ts` (one place): `approvalNumberMissing(booking, parties)`: the
     funder is a Party of kind `insurer` and there is no number (US-11.4.3, A42). A funder of kind
     `funder` (ACC, Health NZ) never raises it. There is no insurer-against-Contract check.
9. **The one insurance warning** (US-11.4.3, US-13.7.1), added the way item 6 was:
   `rules/approvalNumberMissing.ts`: kind `beforeProcedure`, `mild`, key
   `${bookingId}:approvalNumberMissing`. Text: "{Insurer} is named but there is no approval number.
   Without approval on the day, the patient is billed." It shows wherever 15a shows warnings: the office's
   to-do list and the triangle on the Booking, so the anaesthetist viewing it sees it and can enter the
   number (the office's Review row shows it through 21a). Entering a number removes it. It never blocks.
   Tests: raised for NIB and Southern Cross Health Society with no number and removed by its fix; none
   for ACC, Health NZ or a blank funder; none when the number is present; shown to the office and the
   anaesthetist; Clear holds; authorise succeeds with it open; an insurer on a Contract that bills the
   payer (the AIA Booking on No contract · RVG with a number) raises nothing.
10. **The suggested path** (US-04.3.10, D7), inside 20's one pure path function (the step rail's
    candidates, the proposal's `suggested(B, L)`):
    - `suggestedPathFor(booking, list, candidates, fundingTags)`: no funder, Patient › Standard; a
      candidate whose holder is the funder, Special › that holder; else a funding tag at the List's
      hospital whose `funderPartyId` is the funder, that hospital › that tag; else none. It only returns
      a mark: the candidate set, the order and every path's Contracts are identical with and without it,
      and nothing is pre-selected (a test compares the two).
    - If 18a left no `funderPartyId` on the funding tag, add it (SXAP to Southern Cross Health Society,
      ACC to ACC, HNZ to Health NZ), an office-edited select in the tag's Admin Master data row, audited;
      note it in PROGRESS as 18a's gap closed here.
    - The rail marks that one path with a neutral "Suggested" pill (`data-shot="rail-suggested"`); on the
      anaesthetist's screens only if 20 shows the rail there (it should not: 43a). Our readings, the test
      order and the no-funder case, in one place and logged.
    - Tests: Southern Cross at Forte marks Forte › SXAP; NIB with a NIB Contract offered marks Special ›
      NIB; no funder marks Patient › Standard; Health NZ with no Contract and no tag marks nothing; the
      rail's offered paths are unchanged in every case.
11. **Seed funder cases, persist and samples, then re-green.**
    - **Funders:** set `funderPartyId` on every Booking with a Procedure on a Contract held by an insurer
      (NIB) with an approval number on each, and on the AIA Booking (`SEED_MARKERS.aiaClaimBooking`: AIA
      Health, an approval number, No contract · RVG, payer the patient, fee identical to the cent). They
      raise no warning, so nothing is seeded as cleared.
    - **Payer review List, the other two Bookings:** an adult funded by NIB on NIB's Contract with no
      approval number (`SEED_MARKERS.approvalMissing`: the approval warning; the rail suggests Special ›
      NIB); an adult funded by Health NZ with no number (`SEED_MARKERS.funderNoWarning`: no warning).
    - **One suggested-tag Booking:** a Booking funded by Southern Cross Health Society (with a number: no
      warning) on an ACTIVE List off every beat at the hospital 18a seeds SXAP under
      (`SEED_MARKERS.suggestedTag`), so the rail suggests that hospital › SXAP.
    - **Filler:** no filler Booking naming an insurer without a number, so the to-do list holds no
      strays.
    - **Samples:** `childPayer` and `approvalNumberMissing` in 15a's `WARNING_SAMPLES` (Demo triggers).
      Remove 15a's stale sample text naming an insurer with no insurer Contract (`registry.ts`,
      `warningSamples.ts`), and any `insurerContractMissing` id or `insurerNamedWithoutContract` left.
    - **Persist:** bump `PERSIST_VERSION` again.
    - **Tests:** the pristine seed's only insurance warning is on `approvalMissing` (the AIA, Health NZ
      and Southern Cross Bookings raise none); every counterparty still matches the parity fixture except
      Doyle. Grep `src` for `insurerId`, `insurerNamedWithoutContract`, `insurerContractMissing` and
      `todo-insurer-warning`: nothing outside a comment recording the removal.
12. **Copy, labels and shots.**
    - `ACTION_LABELS` and `FIELD_LABELS` for every new action and field. Remove stale "Payer (default)",
      "New guardian", guardian-record, "billable party override", "accepts direct claims" and insurer
      route copy. Say "payer" for whoever is on the Booking, "invoiced to" for who is billed.
    - `data-shot` hooks: `booking-payer-row`, `payer-sheet`, `booking-funder-row`, `funder-sheet`,
      `review-payer-contact`, `todo-child-warning`, `todo-approval-warning`, `rail-suggested`.
    - Update the Playwright specs that snapshot Booking detail, Review, the billing setup sheet, the
      to-do list or the invoice document, and re-shoot. No en or em dashes in new copy.
13. **Decisions log** (PROGRESS.md), superseding earlier readings:
    - The guardian override record (2026-07-22 third and seventh reviews) is replaced by the payer on the
      Booking (US-11.2.2, RV-30); `BP####` ids live on as payer ids; 20's interim is retired.
    - The 7th-review A1/B15 route-based payer is replaced: each Contract bills its holder Party or the
      payer; Doyle's Bookings now bill the payer; every prepaid Contract bills the payer (OQ-73, D23).
    - The payer on the Booking (catalogue), not each booking procedure (v6) nor one billable-party table
      (Greg); any party may pay, a family trust included.
    - The payer-contact rule (US-11.2.3): asked on the form, flagged at Review, never at completion; a
      postal address alone accepted (D70's default).
    - Insurance (D28, OQ-93): the Booking names an insurer or funder Party and holds the approval number;
      the warning is for an insurer only (A42); the funder only suggests a path (US-04.3.10, our reading
      of the test order); no other holder reference (OQ-136, D82); the AIA Booking on No contract · RVG
      bills the patient and raises nothing.

## Demo triggers

| Label | Screen (routes) | Surface | Effect |
|---|---|---|---|
| **Raise sample warnings** (15a's, extended) | 15a's routes (Admin · Day, Admin · Booking detail, Mobile · Booking) | As 15a set it | 15a's body, which now also stages a child payer and an insured Booking with no approval number (below); "Clear sample warnings" unstages them |

**Product, no button.** Changing the payer with the "different payer" tick (mobile, web and admin);
editing the insurer or funder and the approval number (the office, and the anaesthetist on the day); the
step rail marking Special › NIB "Suggested" on a NIB-funded Booking while every path stays offered
(Admin Booking); clearing a warning (to-do list, or 15a's PWA "Office clears this warning").

**Seeded, no button.** The payer review List sits in the Review queue on load: the 15-year-old payer
(child warning), the NIB-funded Booking with no approval number (approval warning, on the to-do list
and the triangle), the Health NZ-funded Booking with no number (no warning), the Booking with no email or
postal address ("Email or postal address needed") and the family trust paying by post (no flag). Grace
Park (Hana Park as payer) is the no-warning minor. The Southern Cross Booking shows Forte › SXAP
"Suggested".

**The two samples** (`src/store/warningSamples.ts`, 15a's `isStaged`/`stage`/`unstage` contract, as
`DEMO_TRIGGER_ACTOR`; they create no Booking):
- `childPayer`: the Booking in the URL when its patient is under 18 on the List date, otherwise Grace
  Park's. `stage` sets `{kind: 'patient'}` through `setBookingPayer` and, if every Procedure's Contract
  bills its holder, moves the first onto No contract · RVG; `unstage` restores both from `buildSeed()`.
  Its target is a minor, so it does not land on `multiWarning`; say so in PROGRESS. A system actor's
  Contract change raises no approval flag.
- `approvalNumberMissing`: the Booking in the URL when it names an insurer, otherwise the first seeded
  NIB Booking on an ACTIVE List off every beat. `stage` clears the number through `setBookingInsurance`;
  `unstage` restores it. No insurer-without-Contract sample exists.
- Disabled states follow 15a's. An AUTHORISED target is skipped with "The child sample's Booking is
  authorised. Reset to raise it again." (and likewise per sample); the others still stage.

Tests: route scoping (never for `'bar'`), stage then unstage restoring seed values, a second press doing
nothing new, the AUTHORISED skip, `pwaPurity` green. "Office approves this Contract change" is 21a's.

## Out of scope

- Completion, 'finish', Review's layout and Contract approval (21a); holder references (not built, D82).
- Sending to the email or post, the "To post" marker and print view (D70), Contract-driven layout, and
  the Split action that replaces `funderOverride` (Phase 22). The invoice description is 20a's and 22's.
- The primary Procedure (23); the price precedence and "no price can be worked out" (24).
- Locking the payer and each Procedure's party at AUTHORISED (25).
- Deriving prepayment and its re-check on a payer change (27).
- The matching screen showing the funder and approval number and setting them from download rows (33).
- Additional invoices, credit notes and events' billable parties (38b, 39, 39b): they read
  `billablePartyForProcedure` or the payer sheet, never a new record.
- A patient record screen, missing NHI and the balance warning (40); warning settings (US-13.7.4, Future).
- A payer master, payer search, or archiving a payer when the debt closes: the payer lives on the Booking
  and its invoice snapshots.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to the
owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] **Payer prefilled (US-11.2.2 AC1).** Add a Booking on mobile, web and admin phone advice: the Payer
      row shows the patient's name, email and postal address, the tick clear, no step taken.
- [ ] **Different payer (AC2).** Admin, an ACTIVE child Booking on No contract · RVG: Change, tick
      Different payer, enter a guardian's name, relationship and email. Who is invoiced and the Payer row
      show the guardian, the fee is unchanged to the cent, History records "Payer". Repeat with a family
      trust and a postal address only: accepted, no flag.
- [ ] **Holder pays (US-11.2.1).** Move the Procedure to a Contract set to bill its holder: who is
      invoiced is the holder Party; the Payer row is not invoiced. A surgeon's fixed price (Doyle),
      No contract · Fixed price and a prepaid Contract invoice the payer; the AIA Booking (No contract ·
      RVG) invoices the patient.
- [ ] **Anaesthetist on mobile and web.** As Dr Souter, change the payer: bottom sheet on mobile, dialog
      on web; no holder setting or money. On SUBMITTED he still can; nobody can on AUTHORISED.
- [ ] **Guardian master gone.** Grace Park shows Hana Park (Mother); no "New guardian" or guardian select
      anywhere; the Aria Bookings still invoice "Aria Skin and Laser Clinic".
- [ ] **Grouping (US-08.2.1).** S3 Beat 1 figures unchanged ($396.18; $152.38 and $91.43); one
      payer-billed and one holder-billed Procedure give two invoices, two payer-billed give one.
- [ ] **Payer contact (US-11.2.3).** The contact-missing Booking shows "Email or postal address needed"
      on the Payer row and the Review row, and the sheet asks for one; a postal address alone clears
      both; nothing refuses for it; a holder-billed Procedure asks for none.
- [ ] **Funder and approval (US-11.4.3).** Office: record a funder and a number (Funder row, sheet); a
      blank funder on a patient-paying Booking is fine. The `approvalMissing` NIB Booking shows the
      approval warning on the to-do list and the triangle, and Dr Souter sees it viewing the Booking on
      mobile; enter the number: the warning goes. On a Booking that holds a number the row shows the
      number itself on mobile and web, and he can change it on the day.
- [ ] **Insurer only.** The Health NZ-funded Booking with no number raises nothing; the AIA Booking on No
      contract · RVG raises nothing; the picker carries no funder tag and filters nothing; the List
      authorises with the approval warning open and Clear removes it.
- [ ] **Suggested path (US-04.3.10).** On the NIB-funded Booking the rail marks Special › NIB
      "Suggested"; on the Southern Cross Booking Forte › SXAP; on a no-funder Booking Patient › Standard;
      on the Health NZ Booking nothing; in every case every path and its Contracts are still offered.
- [ ] **Child warning (US-11.2.4).** The 15-year-old's warning shows on the to-do list and the Booking
      (all three apps, on opening); Grace Park shows none. Authorise with it open. Clear it, then Raise
      sample warnings: a fresh one on Grace Park; ticking Hana Park again removes it; Clear sample
      warnings restores the seed.
- [ ] **Scripted beats unblocked.** S1 Beat 3, S2 Beat 4, S3 and S4 Beat 1 run as scripted, with no new
      blocker and no new warning on their Bookings.
- [ ] No en or em dashes in new UI copy; teal on every new action; crimson nowhere new.
- [ ] Catalogue screenshots: the recipes below created or updated, broken recipes re-pointed, a full
      `npm run capture` with no failed recipe and no story without one, new shots checked by eye.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board`
      all green.

## Demo guide updates

In the same session, patch `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`, the matching sections of
`master-demo-guide.html`, and the Control Panel scenario text in `DemoControlPanel.tsx` (21a patches the
completion, Review and 'finish' lines):
- **S3 Beat 1:** "It resolves the explicit payer per Procedure ... groups by counterparty" becomes "each
  Procedure's Contract decides who is billed: its holder when the Contract bills its holder, otherwise the
  payer named on the Booking; the run groups each Booking's Procedures by that party". "Funder allocation"
  and its optional aside stay until Phase 22. Figures unchanged.
- **S2 Beat 4:** one optional aside: the payer review List, with the child and approval warnings and the
  family trust paid by post; clear one, authorise anyway, and "Raise sample warnings" brings a child
  warning back on Grace Park. (The Review wording is 21a's.)
- **Insured patients** (the cheat sheet's "Patient insurance distinction", the personas doc's
  reimbursement insurer row and their master-guide sections): the AIA patient is invoiced under No
  contract · RVG like any patient; the insurer or funder (a Party) and the approval number sit on the
  Booking, editable by the office and the anaesthetist, who sees the number; a missing number is the only
  insurance warning, for an insurer only, shown to the office and the anaesthetist; the funder never
  decides who is billed or narrows the Contract list, it only marks one path "Suggested".
- **S4 Beat 1 and S1 Beat 3:** no change (Riley and Sarah have an email); confirm by running them.
- **Cheat sheet:** the payer section (who is billed by Contract setting, holder or payer; the payer
  prefilled, the different-payer tick, any party; email or postal address) and 15a's warnings section
  (two new mild rules, the approval one for insurers only).
- **Workflows doc:** booking setup (payer prefilled; funder and approval number from the source data).
- **Personas doc:** the office chases a missing approval number from its warning and clears warnings; the
  anaesthetist can name another payer and enter the approval number on the day.
- **Control Panel S2 text:** mention the optional payer review aside and "Raise sample warnings".

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 21` first: 18, 20 and
20a may have changed these recipes. Ids from the built seed (ATLAS "Seed data"). Never edit
`requirements-board/requirements/capture/REPORT.md` by hand: the capture run rewrites it.

| Item | Recipe now | When this phase is done |
|---|---|---|
| [FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md) Who is billed | feature | Shows its stories' shots; no recipe of its own. |
| [US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md) Patient billed when the Contract does not bill its holder | captured · admin-default-payer | Captured. Re-point to `booking-payer-row` and the stack's who-is-invoiced (shot `name` kept), caption "Under No contract · RVG the payer on the Booking is billed"; add `surgeon-fixed-price` (Doyle, invoiced to the payer) and `insured-claims-back` (the AIA Booking, invoiced to the patient). |
| [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) Payer on the Booking | partial · admin-guardian-payer (set, edit) | Captured. Re-shoot on Grace Park: `set` Hana Park in `booking-payer-row` with email and postal address; `edit` the `payer-sheet` with Different payer ticked. Add `web-booking-payer` and `mobile-booking-payer` (anaesthetist: dialog, bottom sheet). Captions on name, email and postal address; drop the partial reason; hand the stale-screenshot note to `/update-requirements`. |
| [US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md) Payer email or postal address required | absent | Captured. Create `admin-payer-contact-required` and `mobile-payer-contact-required` on `payerContactMissing`: `flagged` (chip on `booking-payer-row`, plus `review-payer-contact` in admin), `postal` (a postal address entered, chip gone). Caption: "A billed payer needs an email or a postal address". |
| [US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md) Warn when a child is the payer | absent | Captured. Create `admin-todo-child-warning` on `/admin/day/2026-07-21` (`todo-child-warning`, expanding "Show all" if needed; `raised`, `cleared`), `booking-child-warning` on `childPayer` in admin, web and mobile, and `guardian-payer-no-warning` on Grace Park. Captions: mild, no block; none when a guardian pays or a Contract bills its holder. |
| [US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) Insurance and approval number on the Booking | none (create it) | Captured. Create `admin-insurer-approval` on `approvalMissing`: `missing` (`booking-funder-row` and the warning), `recorded` (`funder-sheet` with insurer and number); `admin-funder-no-warning` on `funderNoWarning` (Health NZ, no warning); and `mobile-approval-on-the-day` (the anaesthetist sees the warning, enters the number, the warning gone, then the number itself in the Funder row). Caption: "Insurer or funder and approval number on the Booking; the anaesthetist sees the number and may change it on the day; a missing number is the only insurance warning, for an insurer only". |
| [US-04.3.10](../../../../requirements-board/requirements/stories/US-04.3.10.md) Suggested path from the Booking's funder | none (create it) | Captured. Create `admin-suggested-path` (Admin): `nib` (the step rail on `approvalMissing`, `rail-suggested` on Special › NIB, every path still offered), `tag` (the Southern Cross Booking: hospital › SXAP), `none` (a no-funder Booking: Patient › Standard). Open the rail through 20's picker trigger. Caption: "The Booking's funder marks one path Suggested and never narrows the choice". |

**Recipes this phase breaks.**
- `US-11.2.1` and `US-11.2.2` highlight the office billing setup on BK0008 and BK0033, and `US-11.2.2`
  selects the guardian `select`; covered in the table.
- `US-08.2.1` (`invoices-by-party`, `grouped-invoice`): confirm both run after the grouping switch
  (Prentice two invoices, Holt one); no change planned.
- `US-07.2.3`, `US-04.3.2`, `US-04.3.4` and `US-06.3.5` click `Edit billing setup` or open the picker:
  confirm they resolve once the payer leaves `OfficeBillingSetup`.
- Recipes that shoot Review or History (`US-07.2.2`, `US-07.3.2`, `US-08.1.2`, `US-02.5.5`) are 21a's or
  unchanged: this phase adds one flag line to the Review row, so only re-check their highlights.
- Any recipe or ATLAS entry naming `BP0001` as a master row. The `--dry` run catches the rest.

**ATLAS.md.** Update Seed data (the payer review List and its patients, Hana Park, the funder Parties and
approval numbers), Personas and IDs (the new `SEED_MARKERS` and `SEED_LIST_IDS.payerReview`), Existing
hooks (item 12) and the Demo control panel section for the two samples.

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard **adversarial
review-and-fix pass (PROGRESS convention 18)**. Fan out independent Opus review subagents for
**quality**, **bugs/correctness** and **plan adherence**, plus a **money-integrity** lens, since this
phase changes who every invoice goes to. This session then independently verifies every finding against
the catalogue and the code, fixes the confirmed ones (adding a test wherever a bug had none), re-greens,
and records the pass in the phase entry. Do not re-raise anything settled in the Decisions log.

**Steer this phase's reviewers at:**
- **One rule, one place.** Who is billed is `billablePartyForProcedure` only (billing run, 20a's selector,
  the invoice, Xero); 20's interim and any `routeCounterpartyForHolder` are gone. The payer is written
  only by `setBookingPayer`, the funder and approval number only by `setBookingInsurance`, and neither
  the funder nor the number reaches who is billed. Delivery is `invoiceDeliveryFor` only.
- **Independent of pricing.** No fee path reads the payer, the party or the funder; `funderOverride` still
  beats the party until 22, so S3's figures hold.
- **Grouping and contacts.** One invoice per distinct party per Booking; Hana Park's and the Aria Party's
  Xero contacts and history unchanged; the only counterparty change is Doyle; a payer's contact never
  reaches a holder-billed invoice; a postal-only payer is accepted and snapshotted; every prepaid Contract
  bills the payer.
- **The two warnings.** Registered once each; no `reviewFlags` duplicate of either; age on the List date
  at the 18th birthday; none when another payer is ticked or a holder is billed; the approval warning
  silent for a blank funder, ACC and Health NZ, and shown to the anaesthetist as well as the office, who
  also sees the number; no warning anywhere for an insurer named with no insurer Contract; nothing blocks
  saving, completing, submitting or authorising.
- **The suggested path.** One pure function inside 20's path function; it only marks; the candidate set
  and order are identical with and without a funder; nothing is pre-selected; the test order matches
  US-04.3.10 (no funder, the funder's own Contract, then the tag).
- **Discipline.** Every write through `mutate()` with labels; samples deterministic and idempotent in
  `src/store`; `pwaPurity` and `domainPurity` green; no money on mobile; `PERSIST_VERSION` bumped per seed
  change; no en or em dashes; teal the only action colour; AR-28, AR-29 and AR-30 cited nowhere.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test themselves"):
  the defaults built (D70: a postal address alone accepted and 22 posting it; the payer-contact rule
  asked on the form and flagged at Review, not at completion; D82: the Booking keeps only the approval
  number, no holder references), the readings built (D23: every prepaid Contract bills the payer; the
  payer on the Booking, changeable by the anaesthetist, against v6 and Greg's single table; the
  different-payer tick reading the patient record; any party as payer; the approval warning for insurers
  only; the suggested path's test order and the no-funder case; the Doyle Bookings billed to the payer;
  the AIA Booking seeded as cleared), anything logged rather than fixed, and the screens worth a look with
  route and persona (the payer sheet on mobile and web, the Payer and Funder rows, the step rail's
  "Suggested", the to-do list's two warnings).
- **Status table:** a catch-up row for Phase 21.
- **Phase entry:** the drift-check result (against `efe123c`; what was built as answered and as
  defaults; what 15a, 18, 18a, 20 and 20a left that was reused); files and actions added and the
  guardian master's removal; the parity result and the Doyle change; the `PERSIST_VERSION` bumps; tests
  added; the review List and each sample's placement; the manual checklist item by item; the adversarial
  pass; anything deferred.
- **Decisions log:** the entries from item 13.
- **Handoff list:** "Phase 21a reads `payerContactMissing`, `invoiceDeliveryFor`, the payer and funder
  rows and `PayerSheet` for Review and builds completion, Review and Contract approval on this phase's
  base; 22 sends by `invoiceDeliveryFor` and `Invoice.billedTo` (post for a postal-only payer) and
  replaces `funderOverride` with the Split; 24 owns 'no price'; 25 locks `Booking.payer` and each
  Procedure's party; 27 reads `isPersonParty`/`isPayerBilled` and hooks its re-check on `setBookingPayer`;
  33 shows the funder and approval number on the matching screen and sets them from download rows through
  `setBookingInsurance` (the field is `funderPartyId`); 38b, 39 and 39b address a party through
  `billablePartyForProcedure` or the payer sheet; 43a keeps the payer, the funder row and the stack on
  anaesthetist screens; if OQ-78 reopens or the payer moves onto the booking procedure, `whoIsBilled.ts`
  and `setBookingPayer` change; if OQ-122 is answered, `invoiceDeliveryFor` is the place; if OQ-136 is
  answered the other way, the Booking gains its reference fields at one place".
- **Catalogue screenshots:** recipes created (US-11.2.3, US-11.2.4, US-11.4.3, US-04.3.10) and changed
  (US-11.2.1, US-11.2.2, plus any the step broke), the `requirements-board/requirements/capture/REPORT.md`
  counts before and after, and US-11.2.2's stale-screenshot note handed to `/update-requirements`.
