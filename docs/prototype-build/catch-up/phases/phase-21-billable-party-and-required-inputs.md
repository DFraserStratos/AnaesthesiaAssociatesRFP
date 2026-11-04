# Phase 21 · Payer, insurer and completeness

**Requirements covered** (status and grade at catalogue `7cd7802`):
[FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md) Who is billed: holder or the payer on the Booking (Confirmed; **Contradicts**: who is billed follows a hand-picked route, and a surgeon's fixed-price Contract bills the surgeon) ·
[US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md) Patient billed when the Contract does not bill its holder (Confirmed; **Contradicts**: the Doyle bariatric Contract bills the surgeon, and nothing bills the payer by rule; now also holds the insured patient who is billed and claims it back) ·
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) Payer on the Booking (Confirmed; **Contradicts**: the payer is a per-Procedure guardian override, with no name, email and postal address on the Booking, not prefilled, and the anaesthetist cannot change it) ·
[US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md) Payer email or postal address required when the payer is billed (Confirmed; Missing; where it is enforced is not stated) ·
[US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md) Warn when a child is the payer on the Booking (Confirmed; Missing) ·
[US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) Insurance and approval number on the Booking (Verify, now under FT-11.2; Partial: no approval number, no warning, the insurer is office-only on the Procedure; the missing approval number is the only insurance warning; the anaesthetist sees the number where held) ·
[FT-03.6](../../../../requirements-board/requirements/stories/FT-03.6.md) Booking completeness validation (Confirmed; Partial) ·
[US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md) Mark a Booking complete (Verify; **Contradicts**: route, an RVG code or billing line and times are demanded, with no Contract check and no modifier explanation) ·
[US-03.3.3](../../../../requirements-board/requirements/stories/US-03.3.3.md) Record anaesthetic start and finish times (Confirmed; **Contradicts**: messages and labels say "handover" and times are mandatory even on a fixed price) ·
[US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) Office review of Contracts and references (Confirmed; Partial: no stack, payer, insurer, approval number or warnings on the review rows) ·
[DM-11](../analysis/domain-model-delta.md#dm-11) who is billed is the Contract's holder or the payer named on the Booking (any party, with an email or postal address), replacing the per-Procedure override ·
[DM-12](../analysis/domain-model-delta.md#dm-12) the Booking carries the insurer (a contract holder) and the approval number, editable by the office and the anaesthetist, who sees the number where one is held; a missing number is the only insurance warning, and the number is never needed to complete ·
[DM-16](../analysis/domain-model-delta.md#dm-16) the references a Contract's holder needs, which the office supplies at review ·
[DM-59](../analysis/domain-model-delta.md#dm-59) completion is three conditions, split from the billing validator (**joined**) ·
[RV-21](../analysis/reverse-check.md#rv-21-completion-rules-follow-the-rfps-route-and-times-not-the-contract-with-no-modifier-explanation) completion rules follow the Contract, not the route ·
[RV-30](../analysis/reverse-check.md#rv-30-the-payer-is-a-per-procedure-billable-party-record-tied-to-a-billable-party-route) the per-Procedure guardian record and its route.

**Joined at `7cd7802`:** DM-59 (the completion gate stops being the billing validator).
**Left at `7cd7802`:** [FT-11.4](../../../../requirements-board/requirements/stories/FT-11.4.md) Insurers and [US-11.4.2](../../../../requirements-board/requirements/stories/US-11.4.2.md) Insured patient who forwards the invoice are **Retired** (28 October: no insurer master; insurers are contract holders). US-11.4.2 merged into US-11.2.1, whose insured-patient criterion is tested here; FT-11.4's content moved to FT-11.2 (US-11.4.3 with it) and to US-04.1.5 (the holder's delivery, 18 and 22); the Insurer master goes in 18. The "claim this invoice from {insurer}" note and the picker's insurance tag are not built.
**Earlier:** US-04.2.7 Retired and US-04.3.7 Future Work (2026-10-08: no required booking inputs, no "to confirm with the hospital" flag, no hospital or insurer default Contracts); RV-29 became RV-30; US-08.2.1 Matches (grouping kept, pinned by a parity test, item 4); the general-procedure flag (D37) and the "choose the procedure" check (OQ-99) gone.

**Carried across without regression:** FT-08.2's and US-08.2.1's grouping (one invoice per distinct party per Booking) and the S3 figures, with parity tests.

**Touches, without closing:**
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) (its "Holder references" criterion is built here as office review items; its pricing terms are 19a's and 24's),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) (18's holder "is billed" setting, which this phase acts on, and its delivery setting, which Review shows and 22 sends by),
[US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) (19b asks for a claimed modifier's explanation when it is saved; this phase's completion rule is the backstop),
[US-03.6.2](../../../../requirements-board/requirements/stories/US-03.6.2.md) and [US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md) (the incomplete list reads the new messages; 32b's "alert the office", which Review shows),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) and [DM-10](../analysis/domain-model-delta.md#dm-10) (20 flags an anaesthetist's Contract change; this phase adds the office's approval),
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) and [DM-51](../analysis/domain-model-delta.md#dm-51) (20a's stack, whose "who is invoiced" selector this phase re-points),
[DM-48](../analysis/domain-model-delta.md#dm-48) (18's contract holder; the Booking's insurer references an insurer holder),
[DM-31](../analysis/domain-model-delta.md#dm-31) (three rules registered with 15a's routine),
[US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) and [US-07.2.3](../../../../requirements-board/requirements/stories/US-07.2.3.md) (related review items; no change),
[US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) (an event's billable party defaults to its Procedure's: 39b reads `billablePartyForProcedure`),
[FT-02.1](../../../../requirements-board/requirements/stories/FT-02.1.md) (the matching screen shows the insurer and approval number: 33) and
[DM-28](../analysis/domain-model-delta.md#dm-28) (the grouping key changes here; the Split action is 22's).

**Answered, built as answered:**
[OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) (**D17**: the Contract decides who is billed through its holder; every Booking names a payer),
[OQ-54](../../../../requirements-board/requirements/questions/OQ-54.md) (**D4**: a child as payer raises a mild, clearable warning, none when a contract holder is billed),
[OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (No contract (RVG) is the one default and bills the payer),
[OQ-55](../../../../requirements-board/requirements/questions/OQ-55.md) (**D2**: the Booking holds the insurer, a contract holder, and the approval number; the Contract decides who is billed),
[OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md) (**D33**: completion needs a Contract; the RVG code is optional),
[OQ-26](../../../../requirements-board/requirements/questions/OQ-26.md) (the office approves Contract selections at the submitted review; the anaesthetist may change one until AUTHORISED: item 12),
[OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md) (**D28**, answered in full, 23 October and 4 November: fields on the Booking; the insurer does not narrow the Contract list; the warning for an insurer named with no insurer Contract is dropped, so nothing matches the insurer against the Contracts; a missing approval number is the only insurance warning, never a block, shown to the office (to-do list and review) and to the anaesthetist viewing the Booking; the approval number is the design's one insurance acceptance reference; the anaesthetist as well as the office may change it on the day and completes without it; **4 November** (part 4, Donald, for the build): the anaesthetist sees the number itself where the Booking holds one; built as answered, no provisional label).
**Still open, built as defaults** (each in one place, logged on the owner's review list):
[OQ-122](../../../../requirements-board/requirements/questions/OQ-122.md) (**D70**: a payer with only a postal address is accepted; 22's run marks that invoice "To post"; Greg's "different payer" tick is the payer control),
and a reading with no question: US-11.2.3 does not say where the contact rule is enforced, so the payer form asks for one and Review flags a billed payer with neither; never a completion block.
OQ-114 (D55, holder delivery) is 18's and 22's; nothing here reads it beyond showing the holder's setting.

**Depends on:** Phase 15a (the warning routine and registry, the Admin to-do list with Clear, the triangle in all three apps, the warning on opening a Booking, no confirm step at submit, "Raise sample warnings"), Phase 20a (the three-part Procedure stack with its "who is invoiced" selector) and Phase 32b (notices, active or resolved, and "alert the office" on a List or Booking). Through 20a it relies on 20 (one Contract per Procedure; the route, payment category and `Procedure.insurerId` gone; the step rail's Contract picker, a working direction; the flagged anaesthetist Contract change; the "Needs a Contract" list; three interims: who is billed through the holder or the `billablePartyId` override, `funderOverride`, and the office-set prepayment flag), 38a (the anaesthetist edits until AUTHORISED; late edits marked), 19b (modifier claims with explanations), 19a (Contract lines and the resolver), 19 (RVG groups and the out-of-range warning rule), 18 (the contract-holder master: kind including insurer, `billsHolder`, `billablePartyRef`, the delivery setting, the Insurer master gone so insurers are holders such as `CH-NIB`, the interim `routeCounterpartyForHolder`, `CH-ARIA` billed through `BP0002`, `CH-DOYLE` not billed), 17 (hospital and rooms contact emails), 16 (the Xero contact-name helper), 15b (ACTIVE) and 14 (trigger registry, PWA sheet, actors).
**Estimated:** 2 sessions. Session 1 is work items 1 to 8: the payer on the Booking, who is billed in one function, grouping, the guardian master out, the insurer and approval number, two warnings and their samples, seed, re-greened and demoable. Session 2 is items 9 to 16: holder references, completion and 'finish', Review, Contract approval, the PWA trigger, copy, shots, demo guide. If session 2 runs long, finish and re-green items 9, 10 and 11 first; items 12 and 13 are the tail to carry over, never the tests.

## Goal

**Who is billed comes from the Contract** (FT-11.2, US-04.2.1, OQ-67, D17;
[AR-44 · Holder billed](../../../../requirements-board/requirements/artifacts/AR-44.md#bill-holder),
[AR-44 · Payer billed](../../../../requirements-board/requirements/artifacts/AR-44.md#bill-payer),
[AR-28 · Who gets the invoice](../../../../requirements-board/requirements/artifacts/AR-28.md#who-gets-the-invoice),
[AR-29 · Billable party](../../../../requirements-board/requirements/artifacts/AR-29.md#billable-party),
[AR-29 · Contract behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-behaviour),
[AR-30 · Contract holder](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-holder)):
each Procedure is billed to its Contract holder's billable party when the holder pays AA itself
(18's `billsHolder` with its `billablePartyRef`), otherwise to the **payer named on the Booking**:
No contract (RVG), an anaesthetist's own Contract, a surgeon's fixed price, and an insured patient
whose insurer does not pay ("We bill the patient, end of story": US-11.2.1, which absorbs the retired
US-11.4.2). So the Doyle bariatric Booking, billed to the surgeon today, is billed to the patient at
the Contract's price. AA acts as agent; office review catches a wrong party.

**Every Booking names a payer** (US-11.2.2, DM-11, RV-30;
[AR-44 · Payer](../../../../requirements-board/requirements/artifacts/AR-44.md#payer),
[AR-44 · Patient and payer](../../../../requirements-board/requirements/artifacts/AR-44.md#patient),
[AR-29 · Booking procedure fields](../../../../requirements-board/requirements/artifacts/AR-29.md#booking-procedure-fields),
[AR-30 · Booking procedure](../../../../requirements-board/requirements/artifacts/AR-30.md#booking-procedure)):
name, email and a postal address in the NZ Post standard. Greg's **"different payer" tick** (v6's
alternate payer flag) is the control: unticked, the payer is the patient and their details are read
from the patient record; ticked, the Booking holds another payer's details: a parent, a guardian, a
benefactor or a family trust. The office or the anaesthetist can change it. The per-Procedure
`billablePartyId` override, the guardian rows of the `BillableParty` master, `createBillableParty`
and "New guardian" go; Hana Park becomes the payer on Grace Park's Booking; the Aria clinic stays a
holder billed through `BP0002`, so no counterparty moves. v6 holds the payer on each booking procedure
(admin only) and Greg wants one billable-party table; the catalogue says the Booking names the payer
and the anaesthetist may change it. Build the catalogue's reading and log both tensions.

**Invoices group by billable party per Booking**, one per party (US-08.2.1 Matches; FT-08.2),
replacing Phase 20's interim, with a parity test. A **billed payer needs an email or a postal
address**, at least one (US-11.2.3); a postal address alone is enough (D70's default; 22 marks the
invoice to post). Where it is enforced is not stated, so the payer form asks for one and Review flags
a billed payer with neither; never a completion check (a reading, logged). A **payer under 18** on the
procedure date raises a mild, clearable warning through 15a's routine (US-11.2.4, D4), asking to check
a parent's or guardian's email or postal address; never a block, and none when another payer is
ticked or a contract holder's Contract bills it.

**Insurance on the Booking** (US-11.4.3, DM-12, OQ-93, D28;
[AR-44 · SXAP](../../../../requirements-board/requirements/artifacts/AR-44.md#sxap)): two optional
Booking fields, the insurer (a reference to an insurer contract holder; there is no insurer master)
and the approval number, from the source data where an intake path carries them, editable by the
office and, on the day, by the anaesthetist, who sees the number itself where the Booking holds one (D28, 4 November). A blank insurer is fine when the patient pays. An insured
Booking with no approval number raises a **warning** through 15a's routine, never a block; the
anaesthetist completes without it. It is the **only insurance warning**, shown to the office (to-do
list and Review) and to the anaesthetist viewing the Booking (OQ-93, D28), and the approval number
is the one insurance acceptance reference. Nothing matches the insurer against the Contracts: an
insurer named with no insurer Contract raises nothing (the earlier review warning is dropped). The
insurer never decides who is billed and never narrows the Contract list.

**Holder references** (DM-16, US-04.2.2): a Contract names the references its holder needs (insurer
member number, claim reference, purchase order). The office supplies them at review, where a missing
one is a neutral flag; never a completion block. Delivery is the holder's setting (18, 22), not the
Contract's.

**Mark complete** (FT-03.6, US-03.6.1, RV-21, DM-59) needs exactly three things on every Procedure: a
Contract, its times only where the Contract prices from time, and an explanation for every claimed
modifier. The RVG code, references, payer contact and approval number are not conditions. The
completion rule is its own pure function; `completionBlockersFor` stops delegating to
`validateBookingForBilling`, which stays the billing run's pre-flight ("no price can be worked out" is
24's). Out-of-range units (19's rule) and a missing approval number are warnings. Times are start and
finish, never "handover", in labels, messages and audit (US-03.3.3). Where the anaesthetist cannot
complete a Procedure they alert the office (32b).

**Office Review** (US-07.2.2) shows each Procedure as 20a's stack (text as received, Contract, RVG
code), the payer (changeable) with email or postal address, the insurer and approval number, the
holder references, how each invoice will be delivered, the anaesthetist's alerts (32b) and late edits
(38a), the Contract-change flag (20) and the open warnings; the office approves or corrects each
Contract selection and clears warnings there.

**The pricing model lives in one place.** v6 ([AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md),
[AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md)) is Greg's proposal, field
names for orientation; the catalogue wins. Keep **who is billed in one function**
(`billablePartyForProcedure`), the **completion rule in one function** (`completionFailuresFor`), the
payer type and its one writer, the insurance rules and the holder-reference rules in **one place in
`aa-prototype/src/domain/billing`** (plus the seed), behind types the UI reads. 20a's selector, the
billing run, Review, the invoice and Xero read that one function, so a design change (the payer onto
each booking procedure, or one billable-party table) stays a contained edit. Where this plan departs
from v6, say so in a doc comment beside v6's field names.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and questions against the plan's baseline,
   catalogue commit `a68f09b` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff FT-11.2,US-11.2.1,US-11.2.2,US-11.2.3,US-11.2.4,US-11.4.3,US-08.2.1,FT-08.2,FT-03.6,US-03.6.1,US-03.6.3,US-07.2.2,US-04.2.1,US-04.2.2,US-04.1.5,US-04.3.3,US-04.2.8,US-03.4.1,US-03.3.3,US-03.3.4,US-03.1.9,US-13.7.2,US-04.3.2,OQ-26,OQ-54,OQ-55,OQ-67,OQ-78,OQ-93,OQ-99,OQ-122
   ```

   Read the hunks (if any) for the covered items, the context items, the questions, and the domain
   model's "Booking", "Contract (draft structure)", "Patient, payer and billable party" and
   "Warnings" sections and the Payer and Contract holder glossary rows.

   At the 2026-11-02 plan update (`d4db277..7cd7802`) the changes that touch this phase were:
   - FT-11.4 and US-11.4.2 Retired (US-11.4.2 merged into US-11.2.1); US-11.4.3 moved to FT-11.2,
     back at Verify: fields on the Booking, editable by the office and on the day by the anaesthetist,
     a missing approval number a warning (no ring-the-rooms cue); the insurer is a contract holder.
   - US-11.2.2 and US-11.2.3: name, email and NZ Post postal address; any party who pays (parent,
     guardian, benefactor, family trust); an email or a postal address required when billed; the
     "different payer" tick and posted invoices (OQ-122, new, D70). US-11.2.4 says "contract holder".
   - DM-59 added: completion as three conditions, split from the billing validator.
   - FT-11.2 links AR-44; an event uses its Procedure's billable party by default.

   At the 2026-11-04 plan updates (`7cd7802..a68f09b`): OQ-93 answered in full (D28). The review warning
   for an insurer named with no insurer Contract is dropped (US-07.2.2, US-13.7.1); the missing approval
   number is the only insurance warning, shown to the office and the anaesthetist (US-11.4.3); no
   narrowing; the approval number is the acceptance reference (FT-11.2); and the anaesthetist sees the
   number itself where the Booking holds one, never needing it to complete (US-11.4.3's new criterion,
   US-03.6.1).

   Diff anything after `a68f09b` the same way. If a covered item is now Retired or Future, drop it
   and say so in the PROGRESS entry.
2. **Questions.** OQ-67, OQ-78, OQ-54, OQ-99 and OQ-26 are answered: build them, with no
   "provisional" caption. OQ-93 (fields on the Booking, the one warning shown to office and anaesthetist,
   no narrowing, the approval number as the acceptance reference, the anaesthetist seeing and editing
   it on the day) is built as answered, with no label; only OQ-122 is built as D70's default, labelled
   in one place (`invoiceDeliveryFor`) and logged. If Greg has
   reopened OQ-78, stop and record it: `billablePartyForProcedure` is the one place it changes. If any
   open part has been answered, build the answer and drop its label.
3. **Read what 15a, 18, 19, 19b, 20, 20a, 32b and 38a actually left.**
   - 15a's PROGRESS entry (both sessions): `WARNING_RULES`, the `WarningRuleId` union, `WarningFacts`,
     the selectors (`warningFactsFor`, `warningsForBooking`, `openWarnings`, `clearWarning`), how a
     cleared warning re-opens, whether the Review row shows the triangle, and the sample contract
     (`WARNING_SAMPLES` with `isStaged`/`stage`/`unstage`, `SEED_WARNING_SAMPLE_BOOKINGS`,
     `multiWarning`, `DEMO_TRIGGER_ACTOR`). Use those names.
   - 18's: the holder type (`kind` with `insurer`, `billsHolder`, `billablePartyRef`, the delivery
     setting), the seeded insurer holders that replaced the Insurer master (`CH-NIB`, AIA Health),
     `routeCounterpartyForHolder` (20's interim still reads it; it goes here), `CH-ARIA` and
     `CH-DOYLE`, and whether `BillableParty` now carries only holders' records.
   - 19's out-of-range warning rule (the validator must hold no range check) and 19b's
     `ModifierClaim` with its explanation check in `validateBookingForBilling` ("Add a short
     explanation for {code}, or remove it."): it moves into the completion rule, never copied.
   - 20's PROGRESS entry: the interim `billedPartyFor` (the holder's party as
     `routeCounterpartyForHolder` gives it, so Mr Doyle is still billed; else `billablePartyId`; else
     the patient) and its selector `billedPartyForProcedure(state, procedureId)`; the change flag and
     its review pill; the "Needs a Contract" list; "Choose a Contract" as a failure; the prepayment
     flag and its person-payer refusal; the picker and the office "Contract and payer" sheet; where
     the AIA reimbursement Booking (`SEED_MARKERS.aiaClaimBooking`, Webb, Rutherford Thu 16) ended up.
   - 20a's: the stack, its "who is invoiced" selector and the intake fields that carry source data.
   - 32b's: the notice record, "alert the office" (US-03.6.3), the selector Review reads, the resolve
     action. 38a's: the late-edit marker and what `editRefusal` allows.
   Reuse what exists instead of adding a second copy, and record what you reused.
4. **Carried across.** Before switching who is billed, pin today's grouping and figures as parity
   tests: S3's Holt $396.18 on one invoice, Prentice $152.38 and $91.43 on two (still through
   `funderOverride` until Phase 22), and every seeded invoice's counterparty except the deliberate
   Doyle change (step 5).
5. **Deliberate changes, recorded.** The Doyle bariatric Bookings not yet invoiced are billed to the
   patient (US-11.2.1), not Mr Doyle; issued invoices keep their counterparty. Check no S1 to S5 beat
   shows a Doyle invoice; record it in the PROGRESS entry. Confirm from 20's entry that Doyle still
   bills the surgeon before the switch; if 20 moved it, record where it landed rather than making it
   twice.

## Reference

**Design files (convention 17).** `docs/design/Admin Review.dc.html` is the layout for the Review
table, flag pills (neutral and warn tints), the flags tile and the action bar.
`docs/design/Mobile App.dc.html` is the layout for the mobile Booking detail sections, rows, edit
links and bottom sheets; the Payer and Insurance rows follow its Section/Row pattern.
`docs/design/Design Language.dc.html` for tokens: warning tint for warnings and missing fields, teal
for every action (Change payer, Approve, Clear), crimson never.

**Catalogue.** The covered items, plus
[US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) (who is billed by holder),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) (the holder's "is billed" and delivery settings),
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) (holder references),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (No contract (RVG) bills the payer),
[US-04.2.8](../../../../requirements-board/requirements/stories/US-04.2.8.md) (delivery and posted invoices: 22),
[US-03.6.2](../../../../requirements-board/requirements/stories/US-03.6.2.md) and [US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md) (incomplete Bookings listed; alert the office),
[US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) and [US-07.2.3](../../../../requirements-board/requirements/stories/US-07.2.3.md) (related review items),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) (change and flag),
[US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) (modifier explanations),
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) (the stack),
[US-08.4.2](../../../../requirements-board/requirements/stories/US-08.4.2.md) (send to the email: Phase 22 sends, this phase captures),
[FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md) and [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) (the routine and to-do list).
Evidence: run `npm --prefix requirements-board run source -- --item <ID> --text` for FT-11.2,
US-11.2.2, US-11.2.3, US-11.2.4, US-11.4.3, US-03.6.1 and US-07.2.2 and read the cited passages
(above all `2026-10-28-aa-meeting-with-greg.md` #4 #29 to #35 #40 to #42 #76 #82, and the
2026-10-16 and 2026-10-19 meetings). Change logs `2026-10-16-requirements-update.md` and
`2026-10-28-aa-meetings-with-ben-vanessa-and-greg.md` (their FT-11.2, US-11.2.x, US-11.4.x and
US-03.6.1 rows).
**Diagrams (read, never edit):** [AR-44](../../../../requirements-board/requirements/artifacts/AR-44.md)
`#payer`, `#patient`, `#bill-holder`, `#bill-payer`, `#sxap` (the contract holder, billable party and
payer, walked with Greg on 28 October); AR-28 `#who-gets-the-invoice`; AR-29 `#billable-party`,
`#contract-behaviour`, `#booking-procedure-fields`; AR-30 `#contract-holder`, `#booking-procedure`.

**Analysis.** `../GAP-ANALYSIS.md` (EP-03, EP-07, EP-08 and EP-11 tables, and the structural rows
DM-11, DM-12, DM-16, DM-59); `../epics/EP-11.md`, `EP-03.md`, `EP-07.md`, `EP-08.md`;
`../analysis/domain-model-delta.md` (DM-11, DM-12, DM-16, DM-28, DM-31, DM-48, DM-59);
`../analysis/reverse-check.md` (RV-21, RV-30); the prototype maps in `../analysis/`.

**Code entry points** (line numbers move as 15a to 20a land, so use the shapes they left):
- `src/domain/types.ts`: `CounterpartyKind` and `CounterpartyRef`, `Patient` (`email`, free-text
  `address`, `dobISO`), `BillableParty` (its guardian rows and `relationshipToPatient` go), 18's
  `ContractHolder`, `Booking`, `Procedure` (`billablePartyId` goes, `billingReference` stays as the
  claim reference), `Invoice`; 15a's `src/domain/warnings/types.ts`.
- `src/domain/billing/invoiceBuild.ts`: `counterpartyForProcedure` (replaced),
  `buildInvoicesForBooking` (grouping), `buildPrePaymentInvoiceForBooking`.
- Made by earlier phases: `src/domain/billing/whoIsBilled.ts` (20's interim `billedPartyFor`,
  rewritten here), `src/domain/billing/procedureStack.ts` (20a's `whoIsInvoicedFor`),
  `src/domain/billing/modifiers.ts` (19b's `ageInCompletedYears`), `src/store/warningSamples.ts`.
- `src/domain/billing/validateBookingForBilling.ts` (the billing pre-flight; its completion use
  ends), `src/store/lifecycle.ts` (`completionBlockersFor`, `completeBooking`, `authoriseList`,
  `editRefusal`), `src/shared/flows/SubmitListSheet.tsx`, `src/domain/warnings/`.
- `src/store/billablePartyActions.ts` (removed), `src/store/bookingActions.ts` (`createBooking` and
  every creation path), `src/store/selectors.ts` (`counterpartyName`, `billingContextForBooking`),
  `src/store/xeroHandoff.ts`, `src/store/billingRun.ts`, 14's `src/store/demoActors.ts` and
  `officeStandIn.ts`.
- `src/apps/admin/reviewFlags.ts`, `screens/ReviewScreen.tsx`, `screens/InvoiceDocument.tsx`.
- `src/shared/booking/BookingDetailBody.tsx` (the context slot, the validation latch and
  `[data-validation-fields]` anchors), `OfficeBillingSetup.tsx`, `src/shared/flows/EditBillingSetupSheet.tsx`
  (guardian select and "New guardian"), `EditPatientSheet.tsx`, `ManualBookingForm.tsx` (payer
  select), 20's picker sheet and `PhoneAdviceBooking`, `src/shared/capture/TimesCard.tsx`,
  `src/shared/format.ts` (`ageYears`), `src/shared/audit/actionLabels.ts` and `fieldLabels.ts`.
- Seed: `src/domain/seed/patients.ts` (`BP`, `BILLABLE_PARTIES`), `bookings.ts` (the Doyle bariatric
  Booking, the Webb AIA Booking, the Grace Park guardian Booking, `pinnedListIds`, the filler),
  `history.ts` (`pa05`), `billing.ts`, `audit.ts`, 18's holder seed, `index.ts` (`SEED_LIST_IDS`,
  `SEED_MARKERS` incl. `guardianMinorBooking`), `seed.test.ts`.
- Phase 14's `src/shared/demoTriggers/registry.ts`, `demoTriggers.test.ts`, `src/pwa/PwaDemoActions.tsx`.
- Purity tests: `src/pwa/pwaPurity.test.ts`, `src/domain/domainPurity.test.ts`,
  `src/apps/moneyViewPurity.test.ts` (no money on mobile).
- Playwright specs in `aa-prototype/visual/` that shoot Booking detail, Review, invoices, the to-do
  list and the billing setup sheet (`npm run shots`).

## Work items

**Session 1: the payer on the Booking, who is billed, grouping, insurance, two warnings**

1. **Model** (`domain/types.ts`, doc comments citing AR-44 `#payer` and AR-30 `#booking-procedure`):
   - `Booking.payer: BookingPayer`, required on every Booking (US-11.2.2, DM-11):
     - `{ kind: 'patient'; email?: string; postalAddress?: PostalAddress }`: the "different payer"
       tick is clear; name, email and postal address are read from the patient record, and the two
       optional fields hold ones typed for this Booking where the record has none (not written back).
     - `{ kind: 'other'; id: PayerId; name: string; relationship?: string; email?: string;
       postalAddress?: PostalAddress; phone?: string }`: the tick is set; any party who pays, such as
       a parent, a guardian, a benefactor or a family trust. `id` keeps the `BP####` format and
       `counters.billableParty`, so a re-expressed guardian keeps its Xero contact.
     - Contact is optional in the type so a payer can be saved before it is known; the form asks and
       Review flags it (items 5, 11); never a completion check (item 10).
     - Doc comment: the catalogue's Booking-level payer, editable by the anaesthetist, against v6's
       per-booking-procedure admin-only payer and Greg's single table; one type, one writer, one reader.
   - `PostalAddress` in the NZ Post standard: `{ line1 (street address, PO Box or Private Bag);
     line2? (unit, building or RD); suburb?; city; postcode (four digits) }`. `Patient.address`
     becomes `postalAddress?: PostalAddress` (re-express the seeded free text; `EditPatientSheet`
     gets the same fields). Pure `formatPostalAddress` and `postalAddressProblem` in
     `src/domain/billing/payer.ts`.
   - `Booking.insurerHolderId?: ContractHolderId` (a holder of kind insurer; no insurer master, D2,
     18) and `Booking.insuranceApprovalNumber?: string` (DM-12, US-11.4.3). Never a counterparty. Doc
     comment: "OQ-93, answered: fields on the Booking; no narrowing; the approval number is the one
     insurance acceptance reference; the only insurance warning is a missing number".
   - `CounterpartyKind` gains `'payer'`: the other payer named on a Booking, `id` its `BP####` id.
     `'billableParty'` now means only a holder's billable-party record (for example `BP0002` Aria).
     Never resolve one id two ways.
   - **The guardian master goes (RV-30):** delete `store/billablePartyActions.ts`
     (`createBillableParty`), `Procedure.billablePartyId` and the guardian row `BP0001` from
     `BILLABLE_PARTIES`; `BillableParty` keeps only holders' records (drop `relationshipToPatient`).
   - `Invoice.billedTo?: { name: string; email?: string; postalAddress?: PostalAddress }`, a snapshot
     taken at the run, so the payer's details stay with the debt. Phase 22 sends from it.
2. **Who is billed: one pure module** `src/domain/billing/whoIsBilled.ts`, re-exported from the
   billing index, Vitest-covered, the only place the rule lives. Rewrite 20's file in place, never a
   second module.
   - `billablePartyForProcedure(procedure, contract, holder, booking)` replaces `billedPartyFor`
     (rename every caller; 20's selector becomes a distinctly named wrapper, for example
     `billablePartyForProcedureId(state, procedureId)`): the holder's `billablePartyRef` when
     `holder.billsHolder`; otherwise the payer on the Booking (`{kind: 'patient', id: patientId}` or
     `{kind: 'payer', id}`). No contract (RVG) and an unbilled holder bill the payer. It never reads a
     price or the insurer. Delete 18's `routeCounterpartyForHolder` with 20's interim.
   - `isPayerBilled(...)`: the Procedure's party is the payer on the Booking. `isPersonParty(party)`:
     true exactly for a `patient` or `payer` party, never a holder (a family trust named as payer
     counts); 20's prepayment refusal and Phase 27 read it.
   - `payerDetails(booking, patient)` (name, relationship, email, postal address: the typed values,
     else the patient's record) and `payerContactMissing(booking, patient, parties)` (the payer is
     billed and has neither an email nor a valid postal address: US-11.2.3).
   - `invoiceDeliveryFor(party, booking, patient, holders)`: for a holder's party, 18's delivery
     setting (email to the billable party's contact email from 17, or portal); for the payer, email
     where there is one, else post to the postal address (**D70's default**, labelled here only);
     else none. Review shows it; 22 sends from it, never a second rule. `billedToFor(...)` builds the
     snapshot.
   - Age: reuse 19b's `ageInCompletedYears(dobISO, onISO)`; if `shared/format.ts` `ageYears` does its
     own maths, make it call that. `childPayerOn(booking, patient, procedures, parties, dateISO)`:
     the payer is `{kind: 'patient'}`, the patient is under 18 on the List date, and at least one
     Procedure is billed to the payer. False when another payer is ticked or every Procedure's
     Contract bills its contract holder (US-11.2.4).
   - `src/domain/billing/insurance.ts` (D28, one place): `approvalNumberMissing(booking)` (an insurer is
     named and there is no number: US-11.4.3), the only insurance rule. There is no insurer-against-Contract
     check (dropped 23 October). The number itself shows to the anaesthetist wherever the Booking holds one (D28, answered).
   - 20a's `whoIsInvoicedFor` now reads `billablePartyForProcedure`; its output shape is unchanged.
3. **Store: one writer each.**
   - `setBookingPayer(api, actor, bookingId, payer)`: the only writer of `Booking.payer`. It
     allocates a `BP####` id for a new other payer, checks an email's shape ("Enter a valid email.")
     and a postal address through `postalAddressProblem` ("Enter a four-digit postcode."), and runs
     `editRefusal` as 38a left it (the anaesthetist on their own List and the office until
     AUTHORISED). Through `mutate()`, audited `booking.payer` ("Payer: Grace Park to Hana Park
     (Mother)"). Phase 27 hooks its prepayment re-check here; say so in the handoff.
   - Every creation path (`createBooking` for the anaesthetist add, phone advice, manual entry and
     the integration creates) sets `payer: {kind: 'patient'}`; a form may pass another payer. A
     changed patient on a `{kind: 'patient'}` payer follows the new patient.
   - `setBookingInsurance(api, actor, bookingId, {insurerHolderId, insuranceApprovalNumber})`: the
     only writer of the two fields; the office and the anaesthetist on their own List, under
     `editRefusal` (on the day is when the anaesthetist usually learns of approval; no date gate);
     the insurer must be an insurer holder ("Choose an insurer."); audited `booking.insurance`. Set at
     creation where an intake path carries an insurer; 33 shows both on the matching screen.
   - `ACTION_LABELS` and `FIELD_LABELS` for both.
4. **Billing run grouping** (`invoiceBuild.ts`), with the parity tests from drift-check step 4 green
   before and after:
   - Each line's counterparty is `billablePartyForProcedure`; `funderOverride` still beats it until
     22, so Prentice's two invoices hold. One invoice per distinct party per Booking.
   - Snapshot `billedTo` on each invoice. `layoutFor` stays kind-based (22 makes it Contract-driven),
     with `payer` on the patient layout. `buildPrePaymentInvoiceForBooking` addresses the payer and
     covers only Procedures billed to it.
   - `counterpartyName`, `xeroHandoff`, `seed/billing.ts` and `seed/history.ts` resolve a `payer`
     counterparty from the Booking (or the snapshot) through one selector, `payerRecordFor(state,
     bookingId)`. Phase 16's helper gives a `payer` the contact name a guardian `billableParty` had,
     so Hana Park's Xero contact does not move.
   - `InvoiceDocument` shows `billedTo`: the name, then the email or the postal address in NZ Post
     layout.
   - Tests: a guardian payer under No contract (RVG) gets the invoice at an unchanged fee
     (US-11.2.2 AC2); a holder-billed Contract does not invoice the payer; Doyle's fixed price bills
     the payer at the Contract's price (US-11.2.1 AC2); an insured patient on No contract (RVG)
     naming AIA Health is billed (US-11.2.1 AC3); a family trust with only a postal address is
     billed with `billedTo` carrying it; two parties give two invoices; S3 unchanged.
5. **The payer and insurance on screen** (shared, all three apps, through `useSurface()`):
   - A **Payer** row in `BookingDetailBody`'s billing context: the payer's name (with "Patient" or
     the relationship) and email, or postal address, beneath; a warning-tint "Email or postal
     address needed" chip when `payerContactMissing`; a small "Under 18" chip when the child warning
     applies; a teal **Change** where `editRefusal` allows.
   - `shared/flows/PayerSheet.tsx` (bottom sheet on mobile, dialog on web and admin): a **Different
     payer** tick. Clear: the patient's name, email and postal address from the record, with email
     and address fillable for this Booking where the record has none. Set: name (a person, or a party
     such as a family trust), relationship (optional: Mother, Guardian, Benefactor, Family trust),
     email, postal address (address line, suburb, town or city, postcode), optional phone. When the
     payer is billed and both email and address are blank, an inline warning-tint line asks "Add an
     email or a postal address"; the save still goes through (Review flags it; logged). For a patient
     under 18 the clear option carries "Under 18. Check whether a parent or guardian should be the
     payer." Mobile-first: tappable rows, a toggle, no dropdown, no money.
   - The stack's Contract part (20a) shows who is invoiced from `billablePartyForProcedure`. Nothing
     else on anaesthetist screens shows the holder's billed setting (US-15.0.1, 43a).
   - An **Insurance** row: the insurer and the approval number itself (not only that it is approved), editable by the office and the
     anaesthetist (a small sheet: an insurer select over insurer holders and a number field), in all
     three apps; "Add insurance" when blank. With an insurer and no number, item 7's warning shows in
     15a's places; there is no ring-the-rooms cue.
   - Remove the payer select and "New guardian" from `OfficeBillingSetup`, `EditBillingSetupSheet`
     (it becomes "Contract") and `ManualBookingForm`; `ManualBookingForm` and `PhoneAdviceBooking`
     show the payer prefilled from the chosen patient with the tick inline. 20's picker gets no
     insurance tag (OQ-93: no narrowing, no suggestion).
6. **The child-payer warning** (US-11.2.4, D4, DM-31), added as 15a's handoff says: `rules/childPayer.ts`,
   its `WARNING_RULES` entry, `'childPayer'` in `WarningRuleId`, its `appSettings.warningRules`
   default (`backfillMerge` fills it), the facts on `WarningFacts` filled by `warningFactsFor`, and its
   sample. Kind `beforeProcedure`, strength `mild`, key `${bookingId}:childPayer`, evaluated by
   `childPayerOn`. Text (dash-free): "{Patient} is under 18 and is the payer. Check the payer's
   details: a parent's or guardian's email or postal address may be needed." It shows wherever 15a
   shows warnings; no `reviewFlags` duplicate; it never blocks saving, completing, submitting or
   authorising. Ticking another payer, or moving every Procedure to a holder-billed Contract, removes
   it. Tests: 17 years 364 days on the List date raises it, 18 does not; another payer raises none; a
   contract holder billed on a child raises none; Clear holds across an unrelated edit; authorise
   succeeds with it open.
7. **The one insurance warning** (US-11.4.3, US-13.7.1, D28), the same way:
   - `rules/approvalNumberMissing.ts`: kind `beforeProcedure`, `mild`, key
     `${bookingId}:approvalNumberMissing`, evaluated by `approvalNumberMissing`. Text: "{Insurer} is
     named but there is no approval number. Without approval on the day, the patient is billed." It
     shows wherever 15a shows warnings: the office's to-do list and Review, and the triangle on the
     anaesthetist's Booking, where they can enter the number (answered 23 October: it shows to the
     anaesthetist viewing the Booking). Entering a number removes it.
   - There is no second insurance warning: an insurer named under a Contract that bills the payer (the
     AIA Booking on No contract (RVG)), or on no insurer Contract at all, raises nothing.
   - It never blocks. Tests: raised and removed by its fix, shown to both office and anaesthetist,
     Clear holds, authorise succeeds, none when no insurer is named or when the number is present
     whatever the Contract.
8. **Seed, persist and samples, then re-green (end of session 1).**
   - **Patients:** give every pinned and generated patient a deterministic `@example.net` email and a
     NZ Post postal address (re-expressed from any free text), except the cases below left blank on
     purpose. Sarah Mitchell (S1), Morrison (S2), Riley and Nair (S4) have an email.
   - **Payers:** every seeded Booking gets `payer: {kind: 'patient'}` (handcrafted, filler,
     `history.ts`). Grace Park's Booking (`SEED_MARKERS.guardianMinorBooking`) gets `{kind: 'other',
     id: 'BP0001', name: 'Hana Park', relationship: 'Mother', email, phone, postalAddress}` from
     today's record (no warning); `pa05` resolves to it. Remove every `billablePartyId`, including
     20's interim overrides on the Aria Procedures (`CH-ARIA` already bills `BP0002`).
   - **Insurance:** the insurer holder on every Booking with a Procedure on an insurer-held Contract
     (`CH-NIB`) and an approval number on each, and on the AIA Booking (`SEED_MARKERS.aiaClaimBooking`:
     the AIA Health holder, an approval number, No contract (RVG), payer the patient, fee identical to
     the cent). It raises no warning, so nothing is seeded as cleared.
   - **Payer review List:** a spare, deterministic, past-dated **SUBMITTED** List at a hospital no S1
     to S5 beat uses, with five completed Bookings and dedicated pinned patients (fixed valid NHIs,
     not `takePatient()`):
     - a 15-year-old on No contract (RVG), payer the patient (`SEED_MARKERS.childPayer`);
     - an adult naming nib on No contract (RVG), with an approval number, as when pre-approval falls
       through (`SEED_MARKERS.insurerFellThrough`, kept as a plain patient-billed insured Booking: it
       carries no warning; the Contract seeded with no audit row, so no change flag);
     - an adult naming nib on nib's Contract with no approval number
       (`SEED_MARKERS.approvalMissing`: the approval warning);
     - an adult on No contract (RVG) whose record has no email and no postal address
       (`SEED_MARKERS.payerContactMissing`: "Email or postal address needed");
     - an adult whose payer is ticked to "{Surname} Family Trust" with a postal address and no email
       (`SEED_MARKERS.familyTrustPayer`: no flag; 22 posts its invoice).
     Pick a List the filler leaves empty or add it to `pinnedListIds`; re-check no scripted figure
     moved. Record it as `SEED_LIST_IDS.payerReview`. The warnings are derived, not seeded.
   - **Filler:** no filler child left as payer on a payer-billed Procedure, and no filler Booking
     naming an insurer without a number or an insurer Contract, so the to-do list holds no strays.
   - **Samples:** `childPayer` and `approvalNumberMissing` in 15a's `WARNING_SAMPLES` (Demo triggers).
     Remove 15a's stale sample text naming an insurer with no insurer Contract (`registry.ts`,
     `warningSamples.ts`), and any `insurerContractMissing` id or `insurerNamedWithoutContract` left there.
   - **Persist:** bump `PERSIST_VERSION` by one from the value the previous phase left.
   - **Tests:** every Booking has a payer; the pristine seed's only child warning is on `childPayer` and
     its only insurance warning on `approvalMissing` (the AIA and `insurerFellThrough` Bookings raise none); the review List is SUBMITTED and off every beat; every counterparty matches
     the parity fixture except Doyle. Grep `src` for `billablePartyId`, `createBillableParty`, `New
     guardian`, `routeCounterpartyForHolder`, `billedPartyFor`, `insurerId`, `insurerNamedWithoutContract`,
     `insurerContractMissing` and `todo-insurer-warning`: nothing outside a comment recording the removal.
   - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` before session 2.

**Session 2: holder references, completion and 'finish', Review, Contract approval**

9. **Holder references** (DM-16, US-04.2.2 "Holder references"):
   - `Contract.holderReferences: HolderReferenceKind[]`, kind `'memberNumber' | 'claimReference' |
     'purchaseOrder'`. The approval number is not a kind: it has its own field and warning (item 7),
     so it never shows twice. Office-only, edited in 18's Contract detail as "References the holder
     needs", copied to a new version with the other terms.
   - `Booking.insurerMemberNumber?` and `Booking.purchaseOrder?` are new; the claim reference is the
     per-Procedure `billingReference`, relabelled "Claim or hospital reference". Record the placement
     in the Decisions log.
   - Pure `src/domain/billing/holderReferences.ts`: `referencesRequiredFor(booking, procedures,
     contracts)`, `missingReferences(...)` and `referenceValuesFor(...)` (one map keyed by kind).
     Phase 25 locks that map at authorise.
   - `editBooking` gains the two fields, audited `booking.update`; the billing context grows a row per
     required reference, editable by the office (read-only for the anaesthetist).
   - Review items, never completion failures. Tests: each kind satisfied and missing; the union
     across two Contracts; none on No contract (RVG).
10. **Completion and 'finish'** (DM-59, US-03.6.1, US-03.3.3, FT-03.6, RV-21):
    - New pure `src/domain/billing/completion.ts`: `completionFailuresFor(booking, procedures,
      context)`, the only completion rule. `completionBlockersFor`, `SubmitListSheet` and
      `BookingDetailBody`'s latch read it; `completionBlockersFor` no longer calls
      `validateBookingForBilling`. A Procedure completes when it has:
      - **A Contract** ("Choose a Contract for this procedure."), moved from 20's check.
      - **Its times, only where the Contract prices from time**: a pure `pricesFromTime(contract,
        line)` beside 19a's resolver (false on a line with a fixed price); 24 re-points it at the
        Procedure's held price. On a fixed price, times may stay blank.
      - **An explanation for every claimed modifier**: 19b's check, moved here, not copied; it fires
        on submit too and locked modifiers never need one.
    - Nothing else is a condition: not the RVG code (a Procedure with neither code nor base must not
      throw in the fee engine; test it), references, payer contact, insurer or approval number, or
      the base range (19's warning). Warnings never appear in it.
    - `validateBookingForBilling` stays the billing run's pre-flight only. Remove from it any route,
      insurer, payment-category or prepayment-detail branch 20 left, the holder-reference check and
      any range check; Method 3 and "no price can be worked out" (24), the override reason (39),
      conservation (22) and the BillingLine branch (39b) stay for their owners.
    - The context (patient, List date, Contracts, lines, holders) is built by one selector,
      `completionContextFor(state, bookingId)`, which `BookingDetailBody` calls so they cannot drift.
    - **'Finish', never 'handover'** in every user-visible string: messages ("Add the finish time."),
      `TimesCard`, `ACTION_LABELS`, `FIELD_LABELS` and the `timeUnits.ts` comment. The stored field
      keeps its name unless a rename is free; if renamed, bump `PERSIST_VERSION` and migrate. Grep
      `src` for "handover" in strings.
    - Where the anaesthetist cannot complete, 32b's "alert the office"; nothing added here.
    - Tests: each failure and its focus anchor on mobile and web; a fixed price with no times passes;
      an RVG Contract with no times refuses with the finish wording; no RVG code and no reference
      passes; a missing approval number and an out-of-range base pass; every seeded completed
      Booking passes; the validator's suite rewritten for its pre-flight role.
11. **Review** (`ReviewScreen.tsx`, `reviewFlags.ts`; US-07.2.2), inside the mockup's anatomy:
    - Each row lists **every Procedure** as 20a's compact stack (text as received, Contract with who
      is invoiced, RVG code).
    - **Payer** column: name, relationship, email or postal address, or a neutral "Email or postal
      address needed" flag (`payerContactMissing`), with a teal **Change** opening the payer sheet
      (AC2). Under each invoiced party, its delivery from `invoiceDeliveryFor` ("Email to …",
      "Portal", "By post").
    - **Insurance** line under the patient: "nib · approval 12345678", or "AIA Health · no approval
      number" with item 7's warning (no warning for an insurer with a number, whatever the Contract). A blank insurer shows nothing.
    - **References:** each missing holder reference as a neutral "Reference needed: {kind}" flag,
      editable from the row; this folds in 20's `billingReferenceMissing` advisory. The two seeded
      "No billing reference" flags (Morrison's S2 cystoscopy, the S3 Forte AM cholecystectomy) still
      show (item 14).
    - **Alerts and late edits:** each open alert (32b, with its resolve tick) and a "Changed since
      submit" line from 38a's marker. Neither gates authorise.
    - **Warnings:** the row's open warnings (child payer, the missing approval number, 15a's others)
      with **Clear** through `clearWarning`. They never gate authorise.
    - All flags advisory and pure; an **Open** link to the admin Booking detail returning here.
    - The pure `authoriseBlockersFor(state, listId)` seam in `store/lifecycle.ts`, shared by
      `authoriseList`, the action bar and 14's PWA stand-ins, returns **no blockers in this phase**;
      25 and 40 each add their kind.
12. **Office approval of Contract selections** (US-07.2.2; OQ-26; US-03.4.1, DM-10):
    - Each Procedure's line shows 20's change flag as "Changed by Dr {surname}: was {old}" with a teal
      **Approve** and a **Correct** link (the Booking's Contract picker), or "Approved {time}". 20's
      warn pill becomes this line's source and drops once approved. A later anaesthetist change
      re-opens it.
    - `approveContractSelection(api, actor, {bookingId, procedureId?})`: office only, ACTIVE or
      SUBMITTED; stamps `Procedure.contractApproval = {by, atISO, how: 'explicit' | 'authorise'}`;
      audited `procedure.contractApprove`. An office re-pick counts as approved. Approve-all per
      Booking and per List.
    - `authoriseList` stamps every Procedure still unapproved in the same `mutate()`, audited
      "approved at authorise"; the confirm says how many. Not a gate.
    - Tests: rights, the stamps, re-opening, approval at authorise, History labels.
13. **Demo triggers** (register in `src/shared/demoTriggers/registry.ts`; bodies in `src/store`):
    the two samples (item 8) and "Office approves this Contract change" on the PWA mobile Booking.
    Tests: the PWA entry's `disabledReason`, route scoping (never for `'bar'`), stage then unstage
    restoring seed values, a second press doing nothing new, the AUTHORISED skip, `pwaPurity` green.
14. **Seed for session 2**, then bump `PERSIST_VERSION` again:
    - **Holder references** (labelled demo readings in `contracts.ts`): the ACC Contracts (St
      George's ACC, COS ACC) name `claimReference`; nib's Contract names `memberNumber`; purchase
      order declarable, seeded nowhere. The two Procedures behind the "No billing reference" flags are
      on Contracts that name `claimReference` and carry none.
    - **Values:** a member number on every nib Booking; a claim reference on every other ACC Booking
      (handcrafted and filler). Losa Tuilagi's `ACC45-118844` on Ropata Thu 16 stays (Phase 25's
      failure trigger clears it through an office edit, which must not un-complete the Booking).
    - **Times** on any seeded completed Procedure that lacks them where its Contract prices from time,
      and **one fixed-price Booking with no times** on an ACTIVE List off every beat with a dedicated
      pinned patient (`SEED_MARKERS.fixedPriceNoTimes`).
    - **Tests:** every completed, non-cancelled seeded Booking passes `completionFailuresFor`;
      `authoriseBlockersFor` is empty for every seeded SUBMITTED List.
15. **Copy, labels and shots.**
    - `ACTION_LABELS` and `FIELD_LABELS` for every new action and field.
    - Remove stale "Payer (default)", "New guardian", guardian-record, "billable party override",
      "accepts direct claims" and "handover" copy. Say "payer" for whoever is on the Booking,
      "invoiced to" for who is billed, "finish" for the time.
    - `data-shot` hooks: `booking-payer-row`, `payer-sheet`, `booking-insurance-row`,
      `insurance-sheet`, `review-payer`, `review-insurance`, `review-procedure-stack`,
      `review-contract-approve`, `review-warning-clear`, `review-alert`, `review-late-edit`,
      `todo-child-warning`, `todo-approval-warning`.
    - Update the Playwright specs that snapshot Booking detail, Review, the billing setup sheet, the
      to-do list or the invoice document, and re-shoot. No en or em dashes in new copy.
16. **Decisions log** (PROGRESS.md), superseding earlier readings:
    - The guardian override record (2026-07-22 third and seventh reviews) is replaced by the payer on
      the Booking (US-11.2.2, RV-30); `BP####` ids live on as payer ids; 20's interim is retired.
    - The 7th-review A1/B15 route-based payer is replaced: the Contract bills its holder when the
      holder pays AA, otherwise the payer on the Booking. Doyle's Bookings now bill the patient.
    - The 8th-review silent BTM fallback for a fixed-schedule miss is superseded (a Contract is
      offered only with a line for the procedure or as a plain RVG Contract, D32; US-04.3.7 is Future
      Work). Remove any `fee.ts` comment describing it.
    - The Phase 04 completion ruling is superseded (RV-21, DM-59): three conditions in
      `completionFailuresFor`, split from the billing pre-flight; references, payer contact and the
      approval number are review items or warnings.
    - The payer on the Booking (catalogue), not each booking procedure (v6) nor one billable-party
      table (Greg); any party may pay, a family trust included; the Aria clinic stays a billed holder.
    - The payer-contact rule (US-11.2.3): asked on the form, flagged at Review, never at completion; a
      postal address alone accepted (D70's default).
    - Insurance (D28, OQ-93, answered in full): fields on the Booking, the insurer an insurer holder, editable
      by the office and the anaesthetist, who sees the number itself where held and needs none to complete; a missing number is the only insurance warning, shown to the
      office and the anaesthetist (the ring-the-rooms cue and the insurer-with-no-insurer-Contract
      warning are gone); no narrowing and no picker tag; the AIA Booking on No contract (RVG), billed to
      the patient, raising nothing.
    - The claim reference placement, and holder references on the Contract.
    - Phase 07's "authorise is never gated by flags" holds: only the empty `authoriseBlockersFor` seam.

## Demo triggers

| Label | Screen (routes) | Surface | Effect |
|---|---|---|---|
| **Raise sample warnings** (15a's, extended) | 15a's routes (Admin · Day, Admin · Booking detail, Mobile · Booking) | As 15a set it | 15a's body, which now also stages a child payer and an insured Booking with no approval number (below); "Clear sample warnings" unstages them |
| **Office approves this Contract change** | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | PWA sheet only (`surfaces: ['pwa']`, `badge: 'office-stand-in'`) | `approveContractSelection` on the Booking in the URL, as 14's `OFFICE_SIMULATION_ACTOR` |

**Product, no button.** Changing the payer with the "different payer" tick (mobile, web, admin and
Review), editing the insurer and approval number (the office, and the anaesthetist on the day),
entering a member number, purchase order or claim reference, approving a Contract change on Review
and clearing a warning (to-do list, Review, or 15a's PWA "Office clears this warning"). Raising an
alert (32b) and editing after submit (38a) are theirs.

**Seeded, no button.** The payer review List sits in the Review queue on load: the 15-year-old payer
(child warning), the nib Booking with no approval number (approval warning; both on the to-do list,
the Review row and the triangle), the nib-naming Booking on No contract (RVG) with its number (no
warning), the Booking with no email or postal address ("Email or postal address needed") and the family trust
paying by post (no flag). Grace Park (Hana Park as payer) is the no-warning minor. The fixed-price
Booking with no times shows Mark complete passing without them.

**The two samples** (`src/store/warningSamples.ts`, 15a's `isStaged`/`stage`/`unstage` contract,
as `DEMO_TRIGGER_ACTOR`; they create no Booking):
- `childPayer`: the Booking in the URL when its patient is under 18 on the List date, otherwise Grace
  Park's. `stage` sets `{kind: 'patient'}` through `setBookingPayer` and, if every Procedure's
  Contract bills its holder, moves the first onto No contract (RVG); `unstage` restores both from
  `buildSeed()`. Its target is a minor, so it does not land on `multiWarning`; say so in PROGRESS. A
  system actor's Contract change raises no approval flag.
- `approvalNumberMissing`: the Booking in the URL when it names an insurer, otherwise the first
  seeded nib Booking on an ACTIVE List off every beat. `stage` clears the number through
  `setBookingInsurance`; `unstage` restores it.
- Disabled states follow 15a's. An AUTHORISED target is skipped with "The child sample's Booking is
  authorised. Reset to raise it again." (and likewise per sample); the others still stage.

**Office approves this Contract change** (PWA parity). Disabled with "No Contract change to approve"
or "This Booking's List is authorised". The handset beat: the anaesthetist changes the Contract, sees
"Awaiting office approval", the stand-in approves, the phone shows "Approved by the office {time}".
In the framed build the presenter approves on Review, so no bar entry. Nothing new on the Control
Panel page.

## Out of scope

- Sending to the email or portal, the "To post" marker and print view (D70), Contract-driven layout,
  and the Split action that replaces `funderOverride` (Phase 22). The invoice description is 20a's
  and 22's.
- The primary Procedure (23); the price precedence, "no price can be worked out" and `pricesFromTime`
  re-pointed (24).
- Locking the selection, the payer and the references at AUTHORISED (25).
- Deriving prepayment and its re-check on a payer change (27).
- The matching screen showing the insurer and approval number, and setting them from download rows
  (33).
- Additional invoices, credit notes and events' billable parties (38b, 39, 39b): they read
  `billablePartyForProcedure` or the payer sheet, never a new record.
- A patient record screen, missing NHI and the balance warning (40). The alert, notice and late-edit
  mechanisms (32b, 38a). Warning settings (US-13.7.4, Future); US-04.3.7's flag (Future Work).
- A payer master, payer search, or archiving a payer when the debt closes: the payer lives on the
  Booking and its invoice snapshots.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] **Payer prefilled (US-11.2.2 AC1).** Add a Booking on mobile, web and admin phone advice: the
      Payer row shows the patient's name, email and postal address, the tick clear, no step taken.
- [ ] **Different payer (AC2).** Admin, an ACTIVE child Booking on No contract (RVG): Change, tick
      Different payer, enter a guardian's name, relationship and email. Who is invoiced and the Payer
      row show the guardian, the fee is unchanged to the cent, History records "Payer". Repeat with a
      family trust and a postal address only: accepted, no flag.
- [ ] **Holder pays (US-11.2.1).** Move the Procedure to a holder-billed Contract: who is invoiced is
      the holder with its delivery; the Payer row is not invoiced. Doyle's Booking invoices the
      patient at the Contract's price; the AIA Booking (No contract (RVG)) invoices the patient.
- [ ] **Anaesthetist on mobile and web.** As Dr Souter, change the payer: bottom sheet on mobile,
      dialog on web; no holder setting or money. On SUBMITTED he still can and the office sees a late
      edit; nobody can on AUTHORISED.
- [ ] **Guardian master gone.** Grace Park shows Hana Park (Mother); no "New guardian" or guardian
      select anywhere; the Aria Bookings still invoice "Aria Skin and Laser Clinic".
- [ ] **Grouping (US-08.2.1).** S3 Beat 1 figures unchanged ($396.18; $152.38 and $91.43); one
      payer-billed and one holder-billed Procedure give two invoices, two payer-billed give one.
- [ ] **Payer contact (US-11.2.3).** The contact-missing Booking shows "Email or postal address
      needed" on the Payer row and at Review, and the sheet asks for one; a postal address alone clears
      both; Mark complete never refuses for it; a holder-billed Procedure asks for none.
- [ ] **Insurance (US-11.4.3).** Office: record an insurer holder and a number (Insurance row,
      sheet); a blank insurer on a patient-paying Booking is fine. The `approvalMissing` Booking
      shows the approval warning on the to-do list, Review and the triangle, and Dr Souter sees it
      viewing the Booking on mobile; enter the number: the warning goes. He completes a Booking with
      no number. On a Booking that holds a number (the nib Booking with one) the Insurance row shows
      the number itself on mobile and web, and he can change it on the day.
- [ ] **No other insurance warning (US-07.2.2, US-13.7.1).** The nib-naming Booking on No contract
      (RVG) and the AIA Booking raise nothing, on the to-do list, Review and the Booking; the picker
      carries no insurance tag and filters nothing; the List authorises with the approval warning open
      and Clear removes it.
- [ ] **Child warning (US-11.2.4).** The 15-year-old's warning shows on the to-do list, Review and
      the Booking (all three apps, on opening); Grace Park shows none. Authorise with it open. Clear
      it, then Raise sample warnings: a fresh one on Grace Park; ticking Hana Park again removes it;
      Clear sample warnings restores the seed.
- [ ] **Completion (US-03.6.1, DM-59).** A missing Contract, missing times on an RVG Procedure and an
      unexplained modifier each refuse Mark complete with their message ("finish", never "handover");
      no RVG code, no reference, no approval number and an out-of-range base all complete; the
      fixed-price Booking completes with no times.
- [ ] **'Finish' (US-03.3.3).** Times card, messages, History and audit say start and finish on
      mobile, web and admin; grep the built app for "handover" in copy.
- [ ] **Holder references.** Tick "Purchase order" on a Contract: a Booking under it still completes,
      and Review shows "Reference needed: purchase order" until the office enters one.
- [ ] **Review (US-07.2.2).** Each row: every Procedure as the stack, the payer with Change and
      delivery, the Insurance line, references, warnings with Clear, an Open link back; Dr Souter's
      alert (32b) with its resolve tick and his post-submit change (38a) as "Changed since submit".
- [ ] **Contract approval.** Dr Souter changes a Contract and submits; Review shows "Changed by Dr
      Souter" with Approve, which stamps "Approved"; a further change re-opens it; authorising
      another List stamps the rest. The PWA **Office approves this Contract change** does the same and
      is disabled with no change.
- [ ] **Scripted beats unblocked.** S1 Beat 3, S2 Beat 4, S3 and S4 Beat 1 run as scripted, with no
      new blocker and no new warning on their Bookings.
- [ ] No en or em dashes in new UI copy; teal on every new action; crimson nowhere new.
- [ ] Catalogue screenshots: the recipes below created or updated, broken recipes re-pointed, a full
      `npm run capture` with no failed recipe and no story without one, new shots checked by eye.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and
      `npm run verify:board` all green.

## Demo guide updates

In the same session, patch `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`, the matching sections of
`master-demo-guide.html`, and the Control Panel scenario text in `DemoControlPanel.tsx`:
- **S1 Beat 3:** "Worth pointing at" gains one line: Mark complete checks a Contract, the times (only
  where the Contract prices from time) and an explanation for each claimed modifier, and says
  "finish"; the RVG code, the payer's contact, the references and the approval number are not
  checked. Sarah has an email, so results are unchanged.
- **S2 Beat 4:** "Say" and "Expected": Review shows each Procedure as text as received, Contract and
  RVG code, who is invoiced and how it is delivered, the payer (changeable here), the insurer and
  approval number, references, alerts, late edits and warnings, and authorising approves the Contract
  selections. **Optional aside:** the payer review List, with the child and approval
  warnings and the family trust paid by post; clear one, authorise anyway, and "Raise sample
  warnings" brings a child warning back on Grace Park.
- **S3 Beat 1:** "It resolves the explicit payer per Procedure ... groups by counterparty" becomes
  "each Procedure's Contract decides who is billed: its holder when the holder pays AA, otherwise the
  payer named on the Booking; the run groups each Booking's Procedures by that party". "Funder
  allocation" and its optional aside stay until Phase 22. Figures unchanged.
- **Insured patients** (the cheat sheet's "Patient insurance distinction", the personas doc's
  reimbursement insurer row and their master-guide sections): the AIA patient is invoiced under No
  contract (RVG) like any patient; the insurer (a contract holder) and approval number sit on the
  Booking, editable by the office and the anaesthetist; the anaesthetist sees the number itself where held; a missing number is the only insurance warning, shown to the
  office and the anaesthetist; insurance never decides who is billed or narrows the Contract list.
- **S4 Beat 1:** no change (Riley has an email); confirm by running it.
- **Cheat sheet:** the payer section (who is billed by holder or payer; the payer prefilled, the
  different-payer tick, any party; email or postal address), 15a's warnings section (two new mild
  rules) and the completion checks ("finish").
- **Workflows doc:** booking setup (payer prefilled; insurance from the source data), Mark complete
  (what is checked) and office review (stack, payer, delivery, insurance, references, alerts, late
  edits, warnings, approval).
- **Personas doc:** the office reviews who is invoiced, chases a missing approval number from its
  warning and clears warnings; the anaesthetist can name another payer and enter the approval number
  on the day.
- **Control Panel S2 text:** mention the optional payer review aside and "Raise sample warnings".

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs 21` first: 18, 20 and
20a may have changed these recipes. Ids from the built seed (ATLAS "Seed data").

| Item | Recipe now | When this phase is done |
|---|---|---|
| [FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md) Who is billed | feature | Shows its stories' shots; no recipe of its own. |
| [US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md) Patient billed when the Contract does not bill its holder | captured · admin-default-payer | Captured. Re-point to `booking-payer-row` and the stack's who-is-invoiced (shot `name` kept), caption "Under No contract (RVG) the payer on the Booking is billed"; add `surgeon-fixed-price` (Doyle, invoiced to the patient) and `insured-claims-back` (the AIA Booking, invoiced to the patient). |
| [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) Payer on the Booking | partial · admin-guardian-payer (set, edit) | Captured. Re-shoot on Grace Park: `set` Hana Park in `booking-payer-row` with email and postal address; `edit` the `payer-sheet` with Different payer ticked. Add `web-booking-payer` and `mobile-booking-payer` (anaesthetist: dialog, bottom sheet). Captions on name, email and postal address; drop the partial reason; hand the stale-screenshot note to `/update-requirements`. |
| [US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md) Payer email or postal address required | absent | Captured. Create `admin-payer-contact-required` and `mobile-payer-contact-required` on `payerContactMissing`: `flagged` (chip on `booking-payer-row`, plus `review-payer` in admin), `postal` (a postal address entered, chip gone). Caption: "A billed payer needs an email or a postal address". |
| [US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md) Warn when a child is the payer | absent | Captured. Create `admin-todo-child-warning` on `/admin/day/2026-07-21` (`todo-child-warning`, expanding "Show all" if needed; `raised`, `cleared`), `booking-child-warning` on `childPayer` in admin, web and mobile, and `guardian-payer-no-warning` on Grace Park. Captions: mild, no block; none when a guardian pays or a contract holder is billed. |
| [US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) Insurance and approval number on the Booking | none (create it) | Captured. Create `admin-insurer-approval` on `approvalMissing`: `missing` (`booking-insurance-row` and the warning), `recorded` (`insurance-sheet` with insurer and number); and `mobile-approval-on-the-day` (the anaesthetist sees the warning, enters the number, the warning gone, then the number itself in the Insurance row). Caption: "Insurer and approval number on the Booking; the anaesthetist sees the number and may change it on the day; a missing number is the only insurance warning". No insurer-without-Contract state. |
| [FT-03.6](../../../../requirements-board/requirements/stories/FT-03.6.md) Booking completeness validation | feature | Shows its stories' shots; no recipe of its own. |
| [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md) Mark a Booking complete | captured · web-mark-complete, mobile-mark-complete (blocked, complete) | Captured. Keep both `name`s and states on BK0009 (check `capture-times` still lands); the blocked line reads "finish". Add `fixed-price` on web and mobile on `fixedPriceNoTimes`: Mark complete passing with no times. |
| [US-03.6.2](../../../../requirements-board/requirements/stories/US-03.6.2.md) Incomplete Bookings listed | captured · web-incomplete, mobile-incomplete (list, blocked) | Captured. Re-shoot; the "what is missing" line reads the new messages. |
| [US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md) Ask the office to check | none (create it) | No change here (Phase 32b owns it). |
| [US-03.3.3](../../../../requirements-board/requirements/stories/US-03.3.3.md) Record start and finish times | captured · web-times, mobile-times (started, handover) | Captured; re-shoot with every label and message saying "finish". Keep the state ids while the story cites those files; a rename is for `/update-requirements`. |
| [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) Office review of Contracts and references | captured · admin-review-contracts, admin-correct-contract (setup, edit) | Captured. Re-shoot `admin-review-contracts` on `/admin/review/L-25490-2026-07-20-AM` (stack per Procedure, `review-payer` with delivery, `review-insurance`, `review-contract-approve`, `review-alert`, `review-late-edit`, Open link); add a payer review List state with `review-warning-clear` (child and approval warnings only). Re-point `admin-correct-contract` (BK0010) if its click target moved. |

**Recipes this phase breaks.**
- `US-11.2.1` and `US-11.2.2` highlight the office billing setup on BK0008 and BK0033, and
  `US-11.2.2` selects the guardian `select`; covered in the table.
- `US-08.2.1` (`invoices-by-party`, `grouped-invoice`): confirm both run after the grouping switch
  (Prentice two invoices, Holt one); no change planned.
- `US-07.2.3`, `US-04.3.2`, `US-04.3.4` and `US-06.3.5` click `Edit billing setup` or open the
  picker: confirm they resolve once the payer leaves `OfficeBillingSetup`.
- `US-07.3.2` and `US-08.1.2` shoot the Review table; `US-02.5.5` shoots History: re-check highlights.
- Any recipe or ATLAS entry naming `BP0001` as a master row. The `--dry` run catches the rest.

**ATLAS.md.** Update Seed data (the payer review List and its patients, Hana Park, the insurer
holders and approval numbers, the fixed-price Booking), Personas and IDs (the new `SEED_MARKERS` and
`SEED_LIST_IDS.payerReview`), Existing hooks (item 15) and the Demo control panel section for the
two samples.

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
- **One rule, one place.** Who is billed is `billablePartyForProcedure` only (billing run, 20a's
  selector, Review, the invoice, Xero); `routeCounterpartyForHolder` and 20's interim are gone. The
  payer is written only by `setBookingPayer`, the insurance only by `setBookingInsurance`, and
  neither the insurer nor the approval number reaches who is billed. Delivery is
  `invoiceDeliveryFor` only.
- **Independent of pricing.** No fee path reads the payer, the party or the insurer; `funderOverride`
  still beats the party until 22, so S3's figures hold.
- **Grouping and contacts.** One invoice per distinct party per Booking; Hana Park's and Aria's Xero
  contacts and history unchanged; the only counterparty change is Doyle; a payer's contact never
  reaches a holder-billed invoice; a postal-only payer is accepted and snapshotted.
- **The two warnings.** Registered once each; no `reviewFlags` duplicate; age on the List date at
  the 18th birthday; none when another payer is ticked or a holder is billed; the approval warning
  silent for a blank insurer and shown to the anaesthetist as well as the office, who also sees the number itself; no warning anywhere
  for an insurer named with no insurer Contract (`insurerNamedWithoutContract` and its sample gone);
  nothing blocks saving, completing, submitting or authorising.
- **Completion.** `completionFailuresFor` is the only rule and holds exactly three conditions;
  `completionBlockersFor` never calls the billing validator; 19b's check moved, not copied; no RVG,
  reference, contact, approval or range condition; failures anchor on mobile and web; every seeded
  completed Booking passes; no "handover" left; S1 Beat 3, S2 Beat 4, S3 and S4 Beat 1 unchanged.
- **Review.** Every Procedure's stack, payer and delivery, insurance, references, alerts, late edits,
  the change flag with Approve, warnings with Clear.
- **Authorise.** `authoriseBlockersFor` is one pure seam with no blockers yet; authorising stamps
  every remaining approval atomically; the PWA stand-in cannot half-authorise.
- **Discipline.** Every write through `mutate()` with labels; samples deterministic and idempotent in
  `src/store`; `pwaPurity` and `domainPurity` green; no money on mobile; `PERSIST_VERSION` bumped per
  seed change; no en or em dashes; teal the only action colour.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built (D70: a postal address alone accepted and 22
  posting it; the payer-contact rule asked on the form and flagged at Review, not at completion), the
  readings built (the payer on the Booking, changeable by the anaesthetist, against v6 and Greg's
  single table; the different-payer tick reading the patient record; any party as payer; the Aria
  clinic as a billed holder; the claim reference placement; holder references as review items; the
  Doyle Bookings billed to the patient; the AIA Booking seeded as cleared; `pricesFromTime` until
  24), anything logged rather than fixed, and the screens worth a look with route and persona (the
  payer sheet on mobile and web, the Payer and Insurance rows, Review, the to-do list's two
  warnings).
- **Status table:** a catch-up row for Phase 21.
- **Phase entry:** the drift-check result (against `a68f09b`; what was built as answered and as
  defaults; what 15a, 18, 19, 19b, 20, 20a, 32b and 38a left that was reused); files and actions added
  and the guardian master's removal; the parity result and the Doyle change; the `PERSIST_VERSION`
  bumps; tests added; the review List and each sample's placement; the manual checklist item by item;
  the adversarial pass; anything deferred.
- **Decisions log:** the entries from item 16.
- **Handoff list:** "Phase 22 sends by `invoiceDeliveryFor` and `Invoice.billedTo` (post for a
  postal-only payer) and replaces `funderOverride` with the Split; 24 re-points `pricesFromTime` and
  owns the 'no price' pre-flight; 25 locks `Booking.payer`, each Procedure's party and
  `referenceValuesFor`, and adds its blocker to `authoriseBlockersFor`; 27 reads
  `isPersonParty`/`isPayerBilled` and hooks its re-check on `setBookingPayer`; 33 shows the insurer
  and approval number on the matching screen and sets them from download rows; 38b, 39 and 39b
  address a party through `billablePartyForProcedure` or the payer sheet, and 39b removes the
  validator's BillingLine branch; 40 adds the missing-NHI blocker; 43a keeps the payer and the stack
  on anaesthetist screens; if OQ-78 reopens or the payer moves onto the booking procedure,
  `whoIsBilled.ts` and `setBookingPayer` change; if OQ-122 is answered, `invoiceDeliveryFor` is the place".
- **Catalogue screenshots:** recipes created (US-11.2.3, US-11.2.4, US-11.4.3) and changed
  (US-11.2.1, US-11.2.2, US-03.6.1, US-03.6.2, US-03.3.3, US-07.2.2, plus any the step broke), the
  `requirements-board/requirements/capture/REPORT.md` counts before and after, and US-11.2.2's
  stale-screenshot note handed to `/update-requirements`.
