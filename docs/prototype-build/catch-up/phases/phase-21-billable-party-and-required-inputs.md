# Phase 21 · Payer, insurer and completeness

**Requirements covered** (status and grade at catalogue `d4db277`):
[FT-11.2](../../../../requirements-board/requirements/stories/FT-11.2.md) Who is billed: holder or the payer on the Booking (Confirmed; **Contradicts**: who is billed follows a hand-picked route, and a surgeon's fixed-price Contract bills the surgeon) ·
[US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md) Patient billed when the Contract does not bill its holder (Confirmed; **Contradicts**: the Doyle bariatric Contract bills the surgeon, and nothing bills the payer by rule) ·
[US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) Payer on the Booking, editable to a guardian (Confirmed; **Contradicts**: the payer is a per-Procedure guardian override, not a name and email on the Booking, not prefilled, and the anaesthetist cannot change it) ·
[US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md) Payer email required when the payer is billed (Confirmed; Missing; where it is enforced is not stated) ·
[US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md) Warn when a child is the payer on the Booking (Confirmed; Missing) ·
[FT-11.4](../../../../requirements-board/requirements/stories/FT-11.4.md) Insurers (Proposed; **Contradicts**; **joined**: billing the insurer is a hand-picked route and the flag flip auto-creates a Contract) ·
[US-11.4.2](../../../../requirements-board/requirements/stories/US-11.4.2.md) Insured patient who forwards the invoice (Proposed; Partial) ·
[US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) Insurer and approval number on the Booking (Proposed; Partial; **joined**) ·
[FT-03.6](../../../../requirements-board/requirements/stories/FT-03.6.md) Booking completeness validation (Confirmed; Partial) ·
[US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md) Mark a Booking complete (Verify; **Contradicts**: route, an RVG code or billing line and times are demanded, with no Contract check and no modifier explanation) ·
[US-03.3.3](../../../../requirements-board/requirements/stories/US-03.3.3.md) Record anaesthetic start and finish times (Confirmed; **Contradicts**; **joined**: messages and labels say "handover" and times are mandatory even on a fixed price) ·
[US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) Office review of Contracts and references (Confirmed; **Contradicts**: built on the old route model, with no stack, payer, insurer, approval number or warnings) ·
[DM-11](../analysis/domain-model-delta.md#dm-11) who is billed is the Contract's holder or the payer named on the Booking, replacing the per-Procedure override ·
[DM-12](../analysis/domain-model-delta.md#dm-12) the Booking carries the insurer and the insurance approval number, recorded by the office; insurance guides the Contract but never decides who is billed ·
[DM-16](../analysis/domain-model-delta.md#dm-16) the references a Contract's holder needs, which the office supplies at review ·
[RV-21](../analysis/reverse-check.md#rv-21-completion-rules-follow-the-rfps-route-and-times-not-the-contract-with-no-modifier-explanation) completion rules follow the Contract, not the route (**joined**) ·
[RV-30](../analysis/reverse-check.md#rv-30-the-payer-is-a-per-procedure-billable-party-record-tied-to-a-billable-party-route) the per-Procedure guardian record and its route (**joined**; replaces RV-29).

**Joined at `d4db277`:** FT-11.4, US-11.4.3, US-03.3.3, RV-21 and RV-30 (RV ids were renumbered by the 2026-10-20 reverse check, so RV-30 is the old RV-29's guardian record).
**Left at `d4db277`:** RV-29 (its guardian-override work is RV-30's, unchanged below). [US-08.2.1](../../../../requirements-board/requirements/stories/US-08.2.1.md) Group by billable party is now **Matches**: grouping by billable party is kept, pinned by a parity test, with no new work (item 4).

**Left this phase on 2026-10-08:**
[US-04.2.7](../../../../requirements-board/requirements/stories/US-04.2.7.md) Required booking inputs is **Retired** (a Contract declares no per-Booking inputs; the payer and email are always on the Booking; the prepaid amount comes from the Contract; the holder's references moved into [US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md)), so `requiredBookingInputs`, its six-box editor and the invoice-email, billable-party and prepaid-amount inputs are not built.
[US-04.3.7](../../../../requirements-board/requirements/stories/US-04.3.7.md) Procedure not on the Contract's schedule is in the **Future Work** lane, so the "to confirm with the hospital" flag, the office-only off-schedule Contract, `confirmScheduleMiss`, the authorise blocker it fed and the Christchurch Eye cataract package seed are not built.
The per-hospital default Contract readings (OQ-78 answered: no hospital, insurer or procedure defaults), the AIA-held "names its payer" Contract and the guardian-as-Contract-selection model are gone with them.
Also gone at `d4db277`: the general-procedure review flag (D37 withdrawn: there is no general procedure), the "choose the procedure" completion check (OQ-99 answered: there is no procedure to match), and every completion check on the route, the insurer's direct-claims flag and the deposit.

**Carried across without regression:** FT-08.2's and US-08.2.1's grouping (one invoice per distinct party per Booking, Matches today) and the S3 figures, with parity tests.

**Touches, without closing:**
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) (its "Holder references" acceptance criterion is built here as office review items; its pricing terms are 19a's and 24's),
[US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) (19b asks for a claimed modifier's explanation when it is saved; this phase's completion check is the backstop),
[US-03.6.2](../../../../requirements-board/requirements/stories/US-03.6.2.md) and [US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md) (the incomplete list reads the new messages; 32b's "alert the office" and its notices, which Review shows here),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) and [DM-10](../analysis/domain-model-delta.md#dm-10) (20 flags an anaesthetist's procedure or Contract change; this phase adds the office's approval),
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) and [DM-51](../analysis/domain-model-delta.md#dm-51) (20a's stack, whose "who is invoiced" selector this phase re-points),
[DM-48](../analysis/domain-model-delta.md#dm-48) (18's contract holder, whose "holder is billed" setting this phase finally acts on),
[DM-31](../analysis/domain-model-delta.md#dm-31) (two rules registered with 15a's routine),
[US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) and [US-07.2.3](../../../../requirements-board/requirements/stories/US-07.2.3.md) (related review items; no change),
[US-03.7.1](../../../../requirements-board/requirements/stories/US-03.7.1.md) (an event's own billable party, defaulting to the Procedure's: 38b reads `billablePartyForProcedure`),
[US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) (the insurer's accepts-direct-claims flag: this phase does not read it, D55) and
[DM-28](../analysis/domain-model-delta.md#dm-28) (the grouping key changes here; the Split action is 22's).

**Answered, built as answered:**
[OQ-67](../../../../requirements-board/requirements/questions/OQ-67.md) (**D17**: the Contract decides who is billed through its holder; every Booking names a payer; no default Contract asks for payer details),
[OQ-54](../../../../requirements-board/requirements/questions/OQ-54.md) (**D4**: a child who is the payer on the Booking raises a mild, clearable warning, never a block),
[OQ-78](../../../../requirements-board/requirements/questions/OQ-78.md) (No contract (RVG) is the one default and bills the payer on the Booking),
[OQ-55](../../../../requirements-board/requirements/questions/OQ-55.md) (**D2**, extended: the Booking holds the insurer and the approval number; the Contract, not the insurance, decides who is billed),
[OQ-99](../../../../requirements-board/requirements/questions/OQ-99.md) (**D33**: there is no procedure to match; completion needs a Contract, and the RVG code is optional),
[OQ-26](../../../../requirements-board/requirements/questions/OQ-26.md) (the office approves Contract selections at the submitted review; the anaesthetist may change one until the List is authorised, not only until submit: item 12),
[OQ-93](../../../../requirements-board/requirements/questions/OQ-93.md) (**D28, answered in part 2026-10-16**: the insurer and approval number sit on the Booking, from the source data, recorded by the office; a blank insurer is fine when the patient pays; an insured Booking with no number sends the office to ring the rooms; the anaesthetist completes without it).
**Still open, built as defaults** (keep each in one place and log it on the owner's review list):
OQ-93's remaining parts (**D28**: the insurer does not narrow the Contract list, a soft clearable review warning when an insurer is named but no insurer Contract is chosen, one approval-number field whether or not it is the design's "insurance acceptance reference"),
[OQ-114](../../../../requirements-board/requirements/questions/OQ-114.md) (**D55**: the insurer's "accepts direct claims" flag only pre-fills the holder's "is billed" setting, which is 18's; nothing in this phase reads it).

**Depends on:** Phase 15a (the warning routine and its rule registry, the Admin to-do list with Clear, the triangle in all three apps, the warning visible on opening a Booking, no confirm step at submit, the shared "Raise sample warnings" trigger), Phase 20a (the three-part Procedure stack on every booking screen, with its "who is invoiced" and "pricing basis" selectors) and Phase 32b (the notices, active or resolved, and "alert the office" with a note on a List or Booking, which Review shows). Through 20a it relies on 20 (one Contract per Procedure, the route, the payment category and `Procedure.insurerId` gone, the fitting Contract picker with No contract (RVG) first, the anaesthetist's audited and flagged procedure or Contract change, the "Needs a Contract" list, and three interims: who is billed through the holder or the `billablePartyId` override, `funderOverride`, and the office-set prepayment flag), 38a (the anaesthetist edits until AUTHORISED, and the office sees late edits at review), 19b (modifier claims with explanations), 19a (Contract lines and the resolver), 19 (RVG groups), 18 (the contract-holder master with `billsHolder` and `billablePartyRef`, the interim `routeCounterpartyForHolder` and `billedAs`, `CH-ARIA` billed through `BP0002`, `CH-DOYLE` not billed), 17 (hospital and rooms contact emails), 16 (the Xero contact-name helper), 15b (the ACTIVE List state) and 14 (trigger registry, PWA sheet, actors).
**Estimated:** 2 sessions. Session 1 is work items 1 to 8: the payer on the Booking, who is billed in one function, grouping, the guardian master out, the insurer and approval number, the two warnings and their samples, seed, re-greened and demoable. Session 2 is work items 9 to 16: holder references, completeness and 'finish', Review, Contract approval, the PWA trigger, copy, shots, demo guide. If session 2 runs long, finish and re-green items 9, 10 and 11 first; items 12 and 13 (approval and its PWA trigger) are the tail to carry over, never the tests.

## Goal

**Who is billed comes from the Contract** (FT-11.2, US-04.2.1, OQ-67, D17;
[AR-28 · Who gets the invoice](../../../../requirements-board/requirements/artifacts/AR-28.md#who-gets-the-invoice),
[AR-29 · Billable party](../../../../requirements-board/requirements/artifacts/AR-29.md#billable-party),
[AR-29 · Contract behaviour](../../../../requirements-board/requirements/artifacts/AR-29.md#contract-behaviour),
[AR-30 · Contract holder](../../../../requirements-board/requirements/artifacts/AR-30.md#contract-holder)):
each Procedure is billed to its Contract holder's billable party when the holder pays AA itself
(18's `billsHolder`, with its `billablePartyRef`), otherwise to the **payer named on the Booking**:
No contract (RVG), an anaesthetist's own Contract, a surgeon's fixed price, and insured
patients who pay and claim it back (US-11.2.1, US-11.4.2). So the Doyle bariatric Booking, billed to
the surgeon today, is billed to the patient at the Contract's price. AA acts as agent and takes the
anaesthetist's choice of Contract as given; the office review catches a wrong party.

**Every Booking names a payer** (US-11.2.2, DM-11, RV-30;
[AR-29 · Booking procedure pricing fields](../../../../requirements-board/requirements/artifacts/AR-29.md#booking-procedure-fields),
[AR-30 · Booking procedure](../../../../requirements-board/requirements/artifacts/AR-30.md#booking-procedure)):
name and email, filled in from the patient on every creation path, and changeable by the office or
the anaesthetist to a parent, guardian or other person who pays. The per-Procedure `billablePartyId`
override Phase 20 kept, the guardian rows of the `BillableParty` master, `createBillableParty` and
"New guardian" go; Hana Park is re-expressed as the payer on Grace Park's Booking, and the Aria clinic
stays what 18 made it, a holder billed through `BP0002`, so no counterparty moves. Billable-party
records stay as the holders'. The technical design v6 holds the payer's contact details on the booking
procedure (set by the admin team only) and Greg wants every billable party in one reference table; the
catalogue says the Booking names the payer and the anaesthetist may change it. Build the catalogue's
reading and log both tensions.

**Invoices group by billable party per Booking**, one per party (US-08.2.1 Matches; FT-08.2),
replacing Phase 20's interim, with a parity test. Where the payer is billed, **the payer's email is
required** (US-11.2.3), but the sources do not say where it is enforced and US-03.6.1 does not list it,
so it is enforced at office review (a flag, a chip on the Payer row), not at completion (a built
default, logged). A **payer under 18** on the procedure date raises a mild, clearable warning through
15a's routine (US-11.2.4, D4); never a block, and none when a guardian pays or the Contract bills its
holder.

**The insurer and the approval number** (DM-12, US-11.4.3, FT-11.4, OQ-93 in part, D28): two optional
fields on the Booking, the insurer and the insurance approval number, taken from the source data where
an intake path carries them and recorded by the office; a blank insurer is fine when the patient pays.
An insured Booking with no approval number shows a ring-the-surgeon's-rooms cue at review; the
anaesthetist completes without it. When an insurer is named but no Procedure is on an insurer's
Contract, a soft review warning fires through 15a's routine ("pre-approval often falls through on the
day"), and where the invoice goes to the payer the document says to claim it from the insurer
(US-11.4.2). The insurer never decides who is billed and does not narrow the Contract list (D28's
default); the insurer's direct-claims flag is not read here (D55's default).

**Holder references** (DM-16, US-04.2.2): a Contract names the references its holder needs (insurance
approval number, insurer member number, claim reference, purchase order). The office supplies them at
review, where a missing one is a neutral flag; it is never a completion block (US-03.6.1).

**Mark complete** (FT-03.6, US-03.6.1, RV-21) needs, on every Procedure: a Contract, its times only
where the Contract prices from time (optional on a fixed price), and an explanation for every claimed
modifier (the backstop to 19b's prompt). The RVG code is optional; the route, insurer, deposit and
reference rules go. Times are start and finish, never "handover", in labels, messages and audit
(US-03.3.3). Where the anaesthetist cannot complete a Procedure they alert the office (32b).

**Office Review** (US-07.2.2) shows each Procedure's descriptions as 20a's stack (text as received,
Contract, RVG code), the payer (changeable), the insurer and approval number, the holder references,
addresses and invoice emails, the anaesthetist's alerts (32b) and late edits (38a), the Contract-change
flag (20), and the open warnings; the office approves or corrects each Contract selection and clears
warnings there. The general-procedure flag is gone (D37).

**The pricing model lives in one place.** The technical design v6
([AR-29](../../../../requirements-board/requirements/artifacts/AR-29.md)) and its ERD
([AR-30](../../../../requirements-board/requirements/artifacts/AR-30.md)) are Greg's proposal and
the reference shape, with field names for orientation; the catalogue wins. Keep **who is billed in one
function** (`billablePartyForProcedure`), the payer type and its one writer, the insurer rules and the
holder-reference rules in **one place in `aa-prototype/src/domain/billing`** (plus the seed), behind
types the UI reads. 20a's "who is invoiced" selector, the billing run, Review, the invoice and Xero
all read that one function, so a later design change (the payer moving onto each booking procedure,
or Greg's single billable-party table) stays a contained edit. Where this plan departs from v6 (the
payer on the Booking, not the booking procedure and changeable by the anaesthetist; the approval
number as a Booking field), say so in a doc comment beside v6's field names.
[AR-28](../../../../requirements-board/requirements/artifacts/AR-28.md) is the plain-language guide,
true as written.

## Before you start: drift check

1. Run the catalogue diff for this phase's items and questions against the plan's baseline,
   catalogue commit `d4db277` (rename-aware; never a plain `git diff` of the catalogue folder):

   ```
   node docs/prototype-build/catch-up/tools/plan-state.mjs --diff FT-11.2,US-11.2.1,US-11.2.2,US-11.2.3,US-11.2.4,FT-11.4,US-11.4.1,US-11.4.2,US-11.4.3,US-08.2.1,FT-08.2,FT-03.6,US-03.6.1,US-03.6.3,US-07.2.2,US-04.2.1,US-04.2.2,US-04.1.5,US-04.3.3,US-03.4.1,US-03.3.3,US-03.3.4,US-03.1.9,US-13.7.2,US-04.3.2,OQ-26,OQ-54,OQ-55,OQ-67,OQ-78,OQ-93,OQ-99,OQ-114
   ```

   Read the hunks (if any) for the covered items, the context items US-04.2.1 (who is billed by
   holder), US-04.2.2 (holder references), US-04.1.5 (the holder's "pays AA" setting), US-04.3.3
   (No contract (RVG) bills the payer), US-03.6.3 (alert the office), US-03.4.1, US-03.3.4,
   US-03.1.9 (the stack), US-11.4.1 and US-13.7.2, the questions, and the domain model's "Booking",
   "Contract (draft structure)" (the holder table's `bills holder` row and the `payer` row), "Patient,
   payer and billable party" and "Warnings" sections and the Payer and Contract holder glossary rows.

   At the 2026-10-20 plan update (`60e2d1e..d4db277`) the changes that touch this phase were:
   - US-03.6.1: completion needs a Contract, times only where the Contract prices from time, and a
     modifier explanation; the RVG code is optional; the holder's references are the office's job
     (US-11.4.3), not a block. OQ-99 answered (no procedure to match). FT-03.6 adds "a List cannot be
     submitted while any Booking is incomplete" and the ask-the-office link (US-03.6.3).
   - US-03.3.3: "finish", not "handover"; times optional where the Contract fixes the price.
   - US-11.4.3 (new) and FT-11.4: the insurer and approval number on the Booking, recorded by the
     office, a ring-the-rooms cue, never required of the anaesthetist; OQ-93 answered in part, OQ-114
     (the direct-claims flag) new and open. US-11.4.2 now keys on a Contract that does not bill its
     holder. FT-11.2 and US-11.2.2 follow the v6 design; US-11.2.3 no longer says where the payer
     email blocks.
   - US-07.2.2: descriptions, Contract and RVG code per Procedure, the insurer and approval number,
     the alerts the anaesthetist raised (US-03.6.3), the insurer-named-no-insurer-Contract warning
     worded on "names an insurer", and the office seeing the anaesthetist's late edits (they may
     edit until AUTHORISED). OQ-26 reconfirmed with the same edit window.
   - US-08.2.1 now Matches; D37 (the general procedure) withdrawn; D55 (OQ-114) open.

   Diff anything after `d4db277` the same way. If a covered item is now Retired or Future, drop it
   and say so in the PROGRESS entry.
2. **Questions.** OQ-67, OQ-78, OQ-54, OQ-99 and OQ-26 are answered: build them, with no "provisional"
   caption. OQ-93 is answered in part: build the answered parts (the insurer and approval number on
   the Booking, the cue, the insurer-named warning) as answered; its open parts (the
   insurer does not narrow the list; whether a warning is the right response; one approval-number
   field) and OQ-114 (D55) are built as D28's and D55's defaults, each labelled in one place (the
   insurer module, the warning rule) and logged on the owner's review list. If Greg has come back on
   who No contract (RVG) bills (OQ-78 reopened), stop and record it: `billablePartyForProcedure` is
   the one place it changes. If any open part has been answered, build the answer and drop its label.
3. **Read what 15a, 18, 19b, 20, 20a, 32b and 38a actually left.**
   - 15a's PROGRESS entry (both sessions): `WARNING_RULES` in `src/domain/warnings/rules/`, the
     `WarningRuleId` union, `WarningFacts`, the selectors (`warningFactsFor`, `warningsForBooking`,
     `openWarnings`, `clearWarning`), how a cleared warning re-opens, whether the Review row shows
     the triangle, and the sample contract (`WARNING_SAMPLES` with `isStaged`/`stage`/`unstage`,
     `SEED_WARNING_SAMPLE_BOOKINGS`, `multiWarning`, `DEMO_TRIGGER_ACTOR`). Use those names.
   - 18's: the holder type (`partyType`, `kind` and context link, `billsHolder`, `billablePartyRef`),
     `routeCounterpartyForHolder` (20's interim still reads it; it goes here) and the interim
     `billedAs` (20 deleted it; confirm it is gone), `CH-ARIA` (billed,
     `billablePartyRef` `{kind: 'billableParty', id: BP0002}`), `CH-DOYLE` (not billed), the plain
     RVG Contracts it re-expressed from the default Type 1s (holder billed), whether the
     `BillableParty` type now carries only holders' billable-party records, and what it did with the
     insurer's direct-claims flag (D55: it must not create a Contract).
   - 19b's `ModifierClaim` with its explanation and the completion check it added to
     `validateBookingForBilling` ("Add a short explanation for {code}, or remove it."): reuse it, do
     not add a second.
   - 20's PROGRESS entry (and, if thin, `phase-20-one-contract-per-procedure.md`): the interim
     who-is-billed function `billedPartyFor` (the holder's party as 18's `routeCounterpartyForHolder`
     gives it, deliberately not keyed on `billsHolder`, so Mr Doyle is still billed; else the
     Procedure's `billablePartyId`; else the patient) and its store selector
     `billedPartyForProcedure(state, procedureId)`; the audit-derived procedure or Contract
     change flag and its review pill; the "Needs a Contract" list; whether "Choose a Contract" and any
     blank-procedure check are already completion failures (the blank-procedure check goes here); the
     office-set `Booking.prepayment` flag and the person-payer rule its refusal uses; the Contract
     picker sheet and the office "Contract and payer" sheet; and where the AIA reimbursement Booking
     (Webb, Rutherford Thu 16; 20 renamed its marker to `SEED_MARKERS.aiaClaimBooking`) ended up.
   - 20a's: the stack component, the "who is invoiced" selector it reads (re-pointed here) and the
     intake fields that carry the source data (the place an insurer would come from).
   - 32b's: the notice record (active or resolved, the tick, `Show resolved`), "alert the office" on a
     List or Booking with its note (US-03.6.3), the selector Review reads for a Booking's open alerts,
     and its resolve action.
   - 38a's: how an edit after submit is recorded and marked (the late-edit marker Review reads) and
     what `editRefusal` now allows (the anaesthetist until AUTHORISED).
   Adjust the work items to reuse what exists instead of adding a second copy, and record what you
   reused.
4. **Carried across.** Before switching who is billed, pin today's grouping and figures as parity
   tests: S3's Holt $396.18 on one invoice, Prentice $152.38 and $91.43 on two (still through
   `funderOverride` until Phase 22), and every seeded invoice's counterparty except the deliberate
   Doyle change (step 5).
5. **Deliberate changes, recorded.** The Doyle bariatric Bookings not yet invoiced are billed to the
   patient (US-11.2.1 AC2), not Mr Doyle; issued invoices keep their counterparty. Check no S1 to S5
   beat shows a Doyle invoice; record the change in the PROGRESS entry. The change lands here:
   Phase 20's interim deliberately took the holder's party from `routeCounterpartyForHolder`, not
   `billsHolder`, so Doyle's counterparty did not move in 20 (its parity exception). Confirm from
   20's PROGRESS entry that it still bills Mr Doyle before the switch; if 20 moved it after all,
   record where it landed rather than making it twice.

## Reference

**Design files (convention 17).** `docs/design/Admin Review.dc.html` is the layout for the Review
table, flag pills (neutral and warn tints), the flags tile and the action bar.
`docs/design/Mobile App.dc.html` is the layout for the mobile Booking detail sections, rows, edit
links and bottom sheets; the Payer and Insurance rows follow its Section/Row pattern.
`docs/design/Design Language.dc.html` for tokens: warning tint for warnings and missing fields, teal
for every action (Change payer, Approve, Clear), crimson never.

**Catalogue.** The covered items, plus
[US-04.2.1](../../../../requirements-board/requirements/stories/US-04.2.1.md) (who is billed by holder),
[US-04.1.5](../../../../requirements-board/requirements/stories/US-04.1.5.md) (the holder's "pays AA itself" setting),
[US-04.2.2](../../../../requirements-board/requirements/stories/US-04.2.2.md) (holder references),
[US-04.3.3](../../../../requirements-board/requirements/stories/US-04.3.3.md) (No contract (RVG) bills the payer),
[US-04.3.2](../../../../requirements-board/requirements/stories/US-04.3.2.md) (the filtered list the insurer's tag sits in),
[US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) (insurers; OQ-114 on the flag),
[US-03.6.2](../../../../requirements-board/requirements/stories/US-03.6.2.md) and [US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md) (incomplete Bookings listed; alert the office),
[US-07.2.1](../../../../requirements-board/requirements/stories/US-07.2.1.md) and [US-07.2.3](../../../../requirements-board/requirements/stories/US-07.2.3.md) (related review items),
[US-03.4.1](../../../../requirements-board/requirements/stories/US-03.4.1.md) (change and flag),
[US-03.3.4](../../../../requirements-board/requirements/stories/US-03.3.4.md) (modifier explanations),
[US-03.1.9](../../../../requirements-board/requirements/stories/US-03.1.9.md) (the stack),
[US-08.4.2](../../../../requirements-board/requirements/stories/US-08.4.2.md) (send to the email: Phase 22 sends, this phase captures),
[FT-13.7](../../../../requirements-board/requirements/stories/FT-13.7.md) and [US-13.7.2](../../../../requirements-board/requirements/stories/US-13.7.2.md) (the routine and to-do list).
Evidence: run `npm --prefix requirements-board run source -- --item <ID> --text` for FT-11.2,
US-11.2.2, US-11.2.4, US-11.4.3, US-03.6.1 and US-07.2.2 and read the cited passages (notes
`2026-10-07-aa-meeting-with-greg.md` #6 #25 #29, `2026-10-07-pricing-model-documents.md` #11 #25
#34, `2026-10-01-aa-meeting-with-greg.md` #28 #47, `2026-10-14-aa-meeting-with-greg.md` #3 #14,
`2026-10-16-aa-meeting-with-greg.md` #1 #47 #56 #57, `2026-10-19-aa-meeting-with-greg.md` #12). Change log
`requirements-board/requirements/changes/2026-10-07-requirements-update.md` (sections 3 and 8) and
`2026-10-08-procedure-picker-and-source-text.md`, then `2026-10-16-requirements-update.md` (its
US-03.3.3, US-03.6.1, US-07.2.2, FT-11.2, US-11.2.2 and US-11.4.3 rows) and the 2026-10-19 update.
**Pricing model v6 (Greg's proposal, read, never edit):** AR-28 `#who-gets-the-invoice`, `#booking-to-invoice`;
AR-29 `#billable-party` (who receives the invoice by contract kind, and the insurer warning),
`#contract-behaviour`, `#contract-holder-fields`, `#booking-procedure-fields`; AR-30
`#contract-holder` (the holder's billed flag and billable party), `#booking-procedure` (the payer and
references the booking carries).

**Analysis.** `../GAP-ANALYSIS.md` (EP-03, EP-07, EP-08 and EP-11 tables, and the structural rows
DM-11, DM-12, DM-16); `../epics/EP-11.md`, `EP-03.md`, `EP-07.md`, `EP-08.md`;
`../analysis/domain-model-delta.md` (DM-11, DM-12, DM-16, DM-28, DM-31, DM-48);
`../analysis/reverse-check.md` (RV-21, RV-30); the prototype maps in `../analysis/`.

**Code entry points** (named as at `60e2d1e`; line numbers move as 15a to 20a land, so use the shapes
they left):
- `src/domain/types.ts`: `CounterpartyKind` and `CounterpartyRef` (~l.73), `Patient` (~l.103,
  `email`, `dobISO`), `BillableParty` (~l.127: its guardian rows and `relationshipToPatient` go),
  `Insurer` (~l.166, `acceptsDirectClaims`), `Booking` (~l.373), `Procedure` (~l.453:
  `billablePartyId` ~l.475 goes, `billingReference` ~l.488 stays as the claim reference),
  `Invoice` (~l.672); 15a's `src/domain/warnings/types.ts`.
- `src/domain/billing/invoiceBuild.ts`: `counterpartyForProcedure` (~l.192, replaced),
  `buildInvoicesForBooking` (grouping ~l.397 to 435), `buildPrePaymentInvoiceForBooking`.
- Made by earlier phases, not at `60e2d1e`: `src/domain/billing/whoIsBilled.ts` (20's interim
  `billedPartyFor`, rewritten here), `src/domain/billing/procedureStack.ts` (20a's
  `whoIsInvoicedFor`, re-pointed here), `src/domain/billing/modifiers.ts` (19b's
  `ageInCompletedYears`, reused here), 15a session 2's `src/store/warningSamples.ts` and
  `DEMO_TRIGGER_ACTOR`.
- `src/domain/billing/validateBookingForBilling.ts` (the RVG-or-line exemption ~l.121 to 170, the
  billable-party check ~l.187, `billingReferenceMissing`).
- `src/domain/warnings/` (`routine.ts`, `rules/index.ts`, `settings.ts`, `types.ts`).
- `src/store/lifecycle.ts` (`completionBlockersFor`, `completeBooking`, `authoriseList`, `editRefusal`),
  `src/store/billablePartyActions.ts` (removed), `src/store/bookingActions.ts` (`createBooking` and
  every creation path), `src/store/selectors.ts` (`counterpartyName`, `billingContextForBooking`),
  `src/store/xeroHandoff.ts` (billable-party contact ~l.60), `src/store/billingRun.ts`
  (`markInvoiceEmailed`), `src/store/mastersActions.ts` (`setInsurerDirectClaims`), 15a's
  `src/store/warnings.ts` and `src/store/warningSamples.ts`, 14's `src/store/demoActors.ts` and
  `src/store/officeStandIn.ts`.
- `src/apps/admin/reviewFlags.ts`, `src/apps/admin/screens/ReviewScreen.tsx`,
  `src/apps/admin/screens/InvoiceDocument.tsx` (addressee, claim note),
  `src/apps/admin/screens/MasterData.tsx`.
- `src/shared/booking/BookingDetailBody.tsx` (the context slot, the validator context, the
  validation latch and `[data-validation-fields]` anchors), `src/shared/booking/OfficeBillingSetup.tsx`,
  `src/shared/flows/EditBillingSetupSheet.tsx` (guardian select and "New guardian" ~l.48 to 95),
  `src/shared/flows/ManualBookingForm.tsx` (payer select ~l.57, ~l.124, ~l.235), 20's picker sheet
  and `PhoneAdviceBooking`, `src/shared/capture/BtmCaptureBlock.tsx`, `src/shared/format.ts`
  (`ageYears`), `src/shared/audit/actionLabels.ts` and `fieldLabels.ts`.
- Seed: `src/domain/seed/patients.ts` (`BP`, `BILLABLE_PARTIES` ~l.19 to 40), `bookings.ts` (the
  Doyle bariatric Booking ~l.694, the Webb AIA reimbursement Booking ~l.742, the Grace Park guardian
  Booking ~l.807, `pinnedListIds`, the filler), `history.ts` (the guardian row `pa05`), `billing.ts`,
  `audit.ts`, `cast.ts` (insurers: nib takes direct claims, AIA Health does not), `contracts.ts`,
  `index.ts` (`SEED_LIST_IDS`, `SEED_MARKERS` incl. `guardianMinorBooking`), `seed.test.ts`.
- Phase 14's trigger registry (`src/shared/demoTriggers/registry.ts`, `demoTriggers.test.ts`) and
  `src/pwa/PwaDemoActions.tsx`.
- Purity tests to keep green: `src/pwa/pwaPurity.test.ts`, `src/domain/domainPurity.test.ts`,
  `src/apps/moneyViewPurity.test.ts` (no money on mobile).
- Playwright specs in `aa-prototype/visual/` that shoot Booking detail, Review, invoices, the to-do
  list and the billing setup sheet, run by `npm run shots`.

## Work items

**Session 1: the payer on the Booking, who is billed, grouping, the insurer and approval number, two
warnings**

1. **Model** (`domain/types.ts`, doc comments citing AR-29 `#booking-procedure-fields` and AR-30
   `#booking-procedure`):
   - `Booking.payer: BookingPayer`, required on every Booking (US-11.2.2, DM-11):
     - `{ kind: 'patient'; email?: string }`: the patient pays; the name is the patient's, the email
       defaults from the patient's record, and `email` holds one typed for this Booking when the
       record has none or the payer wants another.
     - `{ kind: 'person'; id: PayerId; name: string; email?: string; relationshipToPatient?: string;
       phone?: string; address?: string }`: someone else pays, for example a guardian. `id` keeps the
       `BP####` format and `counters.billableParty`, so a re-expressed guardian keeps its Xero contact.
     - `email` is optional in the type so a payer can be saved before it is known; Review flags it
       where the payer is billed (item 11), and it is not a completion check (item 10).
     - Doc comment: the catalogue says the Booking names the payer and the anaesthetist can change it;
       v6 holds it on each booking procedure, admin only, and Greg wants one billable-party table
       including guardians. One type, one writer and one reader keep a move a contained edit.
   - `Booking.insurerId?: InsurerId` and `Booking.insuranceApprovalNumber?: string` (DM-12, US-11.4.3):
     recorded by the office, or set from intake where a path carries them. Hints, never a
     counterparty. Doc comment: "OQ-93 answered in part: stored on the Booking; D28's default: no
     narrowing; one field, whether or not it is v6's insurance acceptance reference".
   - `CounterpartyKind` gains `'payer'`: a person named on a Booking, `id` the `BP####` payer id.
     `'billableParty'` now means only a holder's billable-party record (18's `billablePartyRef`, for
     example `BP0002` Aria). Never resolve one id two ways.
   - **The guardian master goes (RV-30):** delete `store/billablePartyActions.ts`
     (`createBillableParty`) and its export, `Procedure.billablePartyId`, and the guardian row
     `BP0001` from `BILLABLE_PARTIES`; `BillableParty` keeps only holders' records (drop
     `relationshipToPatient`).
   - `Invoice.invoiceEmail?: string` and `Invoice.billedTo?: { name: string; address?: string }`,
     snapshots taken at the run, so the document shows who it went to and where, and the payer's
     details stay with the debt (Greg: kept for the life of the debt). Phase 22 sends to
     `invoiceEmail`; this phase records it.
2. **Who is billed: one pure module** `src/domain/billing/whoIsBilled.ts`, re-exported from the
   billing index, Vitest-covered, and the only place the rule lives. Phase 20 created this file for
   its interim `billedPartyFor(procedure, contract, holders, booking)` (the holder's party as 18's
   `routeCounterpartyForHolder` gives it, Mr Doyle included; else the `billablePartyId` override;
   else the patient), with `counterpartyForProcedure` delegating to it and the store selector
   `billedPartyForProcedure(state, procedureId)` wrapping it: rewrite that module in place, never add
   a second one.
   - `billablePartyForProcedure(procedure, contract, holder, booking)` replaces `billedPartyFor`
     (rename every caller; 20's store selector becomes a thin wrapper with a distinct name, for
     example `billablePartyForProcedureId(state, procedureId)`, so the two never collide): the holder's
     `billablePartyRef` when `holder.billsHolder`; otherwise the payer on the Booking
     (`{kind: 'patient', id: patientId}` or `{kind: 'payer', id}`). No contract (RVG) has no holder,
     so it bills the payer; a first-party holder is never billed, so it bills the payer. It never
     reads a price or the insurer (US-11.2.2: independent of pricing; insurance never decides). It
     replaces 20's interim; delete 18's `routeCounterpartyForHolder` with it (and `billedAs`, if
     anything of it survived 20).
   - `isPayerBilled(...)`: true when the Procedure's party is the payer on the Booking.
     `isPersonParty(party)`: true exactly for a `patient` or `payer` party. Phase 20's interim
     prepayment flag (its refusal when no person is billed) reads it now, and Phase 27 after it
     (OQ-73, D23: a person paying, never an organisation; an organisation is a holder).
   - `payerName(booking, patient)`, `payerEmail(booking, patient)` (the typed email, else the
     patient's record), `invoiceEmailFor(party, booking, patient, masters)` (the payer's email for a
     payer party; else the holder's billable party's contact email from 17's hospital and rooms
     contacts; insurers have none, since nib is a portal for 22), `billedToFor(...)`.
   - Age: reuse 19b's pure `ageInCompletedYears(dobISO, onISO)` in `src/domain/billing/modifiers.ts`
     (the age modifier's rule), so one age rule serves both; if `shared/format.ts` `ageYears` still
     does its own maths, make it call that function. `childPayerOn(booking, patient, procedures,
     parties, dateISO)`: true when the payer is
     `{kind: 'patient'}`, the patient is under 18 on the procedure date (the List date), and at least
     one Procedure is billed to the payer. False when a guardian is the payer, or every Procedure's
     Contract bills its holder (US-11.2.4 AC1, AC2).
   - `src/domain/billing/insurance.ts` (D28, one place): `insurerNamedWithoutContract(booking,
     procedures, contracts, holders)` (the Booking names an insurer and no Procedure on it is on an
     insurer-held Contract, any insurer: US-07.2.2 AC1; it does not read the direct-claims flag, D55),
     `approvalNumberMissing(booking)` (an insurer is named and there is no number: the ring-the-rooms
     cue), `claimNoteFor(booking, party, insurers)` (a payer-billed invoice on a Booking that names an
     insurer: "claim this invoice from {insurer}", US-11.4.2) and `suggestedHolderIds(booking,
     holders)` for the picker tag (never a filter).
   - 20a's "who is invoiced" selector, `whoIsInvoicedFor` in `src/domain/billing/procedureStack.ts`,
     now reads `billablePartyForProcedure`; its output (party name, and "Payer on the Booking" or the
     holder) is unchanged in shape.
3. **Store: one writer each.**
   - `setBookingPayer(api, actor, bookingId, payer)`: the only writer of `Booking.payer`. It
     allocates a `BP####` id for a new named person, checks an email's shape when given ("Enter a
     valid email."), and runs the standard `editRefusal` matrix as 38a left it: the anaesthetist on
     their own List and the office until AUTHORISED, nobody on AUTHORISED. Through `mutate()`,
     audited `booking.payer` with a before/after label ("Payer: Grace Park to Hana Park (Mother)").
     Phase 27 hooks its prepayment re-check on a payer change here (US-06.3.5); say so in the handoff.
   - Every creation path (`createBooking` for the anaesthetist add, phone advice and manual entry,
     and the integration creates) sets `payer: {kind: 'patient'}`; a new payer can be passed in from
     the form. A Booking whose patient changes keeps `{kind: 'patient'}`, which follows the new patient.
   - `setBookingInsurance(api, actor, bookingId, {insurerId, insuranceApprovalNumber})`: the only
     writer of the two fields; office only, ACTIVE and SUBMITTED (the anaesthetist apps show them
     read-only), audited `booking.insurance`. Where an intake path already carries an insurer (20a's
     intake fields, or a seeded hospital message), it is set at creation; Phase 33 sets it from
     download rows.
   - Add `ACTION_LABELS` and `FIELD_LABELS` for both.
4. **Billing run grouping** (`invoiceBuild.ts`), with the parity tests from drift-check step 4 green
   before and after:
   - The counterparty of each line is `billablePartyForProcedure`; a line's `funderOverride` still
     beats it (the interim split until Phase 22), so Prentice's two invoices and figures hold.
   - Group by party: one invoice per distinct party per Booking (US-08.2.1 Matches, FT-08.2).
   - Snapshot `invoiceEmail` and `billedTo` on each invoice. `layoutFor` stays kind-based (22 makes
     it Contract-driven), with `payer` on the patient layout.
   - `buildPrePaymentInvoiceForBooking` addresses the payer (a guardian pays a prepayment) and only
     covers Procedures billed to the payer.
   - `counterpartyName`, `xeroHandoff`'s contact lookup, `seed/billing.ts` and `seed/history.ts`
     resolve a `payer` counterparty from the Booking (or the invoice snapshot) through one selector,
     `payerRecordFor(state, bookingId)`, never from a master table. Phase 16's contact-name helper
     gives a `payer` the same contact name a guardian `billableParty` had, so Hana Park's contact
     does not move.
   - `InvoiceDocument`: show `billedTo` (name, postal address where there is one) and the email
     under the addressee, and the `claimNoteFor` note (replacing the reimbursement wording Phase 20
     retired).
   - Tests: a guardian payer under No contract (RVG) gets the invoice at an unchanged fee to the cent
     (US-11.2.2 AC2); a hospital-billed Contract does not invoice the payer (AC3); Doyle's fixed
     price bills the payer at the Contract's price (US-11.2.1 AC2); an insured patient on No contract
     (RVG) with an AIA insurer is billed with the claim note (US-11.4.2); two Procedures with
     different parties give two invoices, two billed to the payer give one; S3 figures unchanged.
5. **The payer, insurer and approval number on screen** (shared, all three apps, through
   `useSurface()`):
   - A **Payer** row in `BookingDetailBody`'s billing context, on mobile, web and admin: the payer's
     name (with "Patient" or the relationship) and email beneath, or a warning-tint "Email needed"
     chip when the payer is billed and has none. A small "Under 18" chip when the child warning
     applies. A teal **Change** opens the payer sheet where `editRefusal` allows.
   - A new `shared/flows/PayerSheet.tsx` (bottom sheet on mobile, dialog on web and admin): **The
     patient** (preselected; name fixed, email field prefilled from the record) or **Someone else**
     (name, relationship, email, optional phone and postal address). For a patient under 18 on the
     List date, the patient option carries the mild note "Under 18. Check whether a parent or
     guardian should be the payer." It never stops the save. Save calls `setBookingPayer` once.
     Mobile is mobile-first: tappable rows, a segmented choice, no dropdown, no money.
   - The stack's Contract part (20a) shows who is invoiced from `billablePartyForProcedure`: the
     holder's name, or the payer's name. Nothing else on anaesthetist screens shows the holder's
     billed setting (US-15.0.1, 43a).
   - An **Insurance** row: the insurer and the approval number, office-editable (a small sheet with an
     insurer select and a number field), read-only in the anaesthetist apps, where it helps the change
     to No contract (RVG) when pre-approval falls through. Absent when there is no insurer. With an
     insurer and no number the office sees a "Ring the surgeon's rooms for the approval number" cue
     (a neutral chip); the anaesthetist apps show no cue and Mark complete does not need it.
   - 20's Contract picker: when the Booking names an insurer, that insurer's Contracts carry a neutral
     "Matches the Booking's insurance" tag. No Contract (RVG) stays first (US-04.3.3); it never
     filters or reorders (D28's default).
   - Remove the payer select and "New guardian" from `OfficeBillingSetup`, `EditBillingSetupSheet`
     (20 titled it "Contract and payer" with an interim guardian select; with the payer now on the
     Booking's own row it becomes "Contract") and `ManualBookingForm`. `ManualBookingForm` and
     `PhoneAdviceBooking` show the payer prefilled from the chosen patient with "Someone else"
     inline, passed to `createBooking`.
6. **The child-payer warning** (US-11.2.4, D4, DM-31), added as 15a's handoff says every rule is
   added: `src/domain/warnings/rules/childPayer.ts`, its `WARNING_RULES` entry, `'childPayer'` in
   `WarningRuleId`, its default in `appSettings.warningRules` (`backfillMerge` fills it for a
   persisted store), the facts it needs on `WarningFacts` (the patient and each Procedure's party),
   filled by `warningFactsFor`, and its sample (Demo triggers). Kind `beforeProcedure`, strength
   `mild`, key `${bookingId}:childPayer`, evaluated by `childPayerOn`. Text (verbatim, dash-free):
   "{Patient} is under 18 and is the payer. Check the payer's details: a parent or guardian may
   need to be named." It shows wherever 15a shows warnings (to-do list with Clear, triangle in all
   three apps, on opening the Booking, the Review row); no `reviewFlags` duplicate. It never blocks:
   saving, completing, submitting (no confirm step) and authorising all go through with it open.
   Naming a guardian or moving every Procedure to a holder-billed Contract makes it disappear.
   Tests: 17 years 364 days on the List date raises it, 18 does not; a guardian payer raises none; a
   hospital-billed Contract on a child raises none; Clear holds across an unrelated edit;
   `authoriseList` succeeds with it open.
7. **The insurer warning** (US-07.2.2 AC1, D28): `rules/insurerContractMissing.ts`, the same way.
   Kind `afterProcedure` (it is judged on the Contract finally chosen, which the anaesthetist may
   change until AUTHORISED), strength `mild`, key `${bookingId}:insurerContractMissing`, evaluated by
   `insurerNamedWithoutContract`. Text: "The Booking names {insurer}, but no Procedure is on an
   insurer's Contract. Check whether pre-approval fell through." For any named insurer: it no longer
   depends on the direct-claims flag (D55), so a reimbursement Booking naming AIA Health on No
   contract (RVG) raises it too, clearable; the claim note and the warning can show together. Never a
   block. Tests: raised, cleared by choosing the insurer's Contract, Clear holds, authorise succeeds,
   none when no insurer is named (a patient paying with a blank insurer is fine).
8. **Seed, persist and samples, then re-green (end of session 1).**
   - **Patients:** give every pinned and generated patient a deterministic `@example.net` email
     (`firstname.surname@example.net`), except the case item 8 leaves blank on purpose. Sarah
     Mitchell (S1), Morrison (S2), Riley and Nair (S4) must have one.
   - **Payers:** every seeded Booking gets `payer: {kind: 'patient'}` (handcrafted, filler and
     `history.ts`). Grace Park's Booking (Chen Fri 24, `SEED_MARKERS.guardianMinorBooking`) gets
     `{kind: 'person', id: 'BP0001', name: 'Hana Park', relationshipToPatient: 'Mother', email, phone,
     address}` from today's record (no warning), and the history row `pa05` resolves to it. Remove
     every `billablePartyId`, including Phase 20's interim overrides on the Aria Procedures (their
     holder `CH-ARIA` already bills `BP0002`).
   - **Insurer and approval number:** seed the insurer on every Booking whose Procedure is on an
     insurer-held Contract (nib), and an approval number on each of those and on the AIA
     reimbursement Booking (`SEED_MARKERS.aiaClaimBooking`, Webb, Rutherford Thu 16: AIA Health on No
     contract (RVG), payer the patient; move it there if Phase 20 left it elsewhere, fee identical to
     the cent). If its List is open it now raises the insurer warning (item 7): seed it as already
     cleared through 15a's clear record, so the pristine to-do list stays as 15a left it; on an
     AUTHORISED List the question does not arise.
   - **Payer review List:** on a spare, deterministic, past-dated **SUBMITTED** List at a hospital no
     S1 to S5 beat uses (not the S2 or S3 Lists), seed four completed Bookings with dedicated pinned
     patients (fixed valid NHIs, not `takePatient()`):
     - a 15-year-old on No contract (RVG), payer the patient with their own email
       (`SEED_MARKERS.childPayer`: raises the child warning);
     - an adult naming nib, whose Procedure is on No contract (RVG), as when pre-approval falls
       through on the day, with an approval number (`SEED_MARKERS.insurerFellThrough`: raises the
       insurer warning only; seed the Contract directly, with no audit row, so it carries no
       anaesthetist-change flag);
     - an adult naming nib on nib's Contract with no approval number (`SEED_MARKERS.approvalMissing`:
       the ring-the-rooms cue at review, no warning);
     - an adult on No contract (RVG) whose patient record has no email and no insurer
       (`SEED_MARKERS.payerEmailMissing`: "Email needed" on the Payer row and at review).
     The filler fills past Lists (`bookings.ts`), so pick a List it leaves empty or add it to
     `pinnedListIds` and re-check no scripted figure moved. Record it as
     `SEED_LIST_IDS.payerReview`. Nothing else is seeded for the warnings: they are derived.
   - **Filler:** check no filler patient under 18 lands on a payer-billed Procedure with the patient
     as payer, and that no filler Booking names an insurer without an insurer Contract, so the to-do
     list holds no stray warnings.
   - **Samples:** add `childPayer` and `insurerContractMissing` to 15a's `WARNING_SAMPLES` (see Demo
     triggers).
   - **Persist:** bump `PERSIST_VERSION` by one from the value the previous phase left.
   - **Tests:** `seed.test.ts` and `demoScenarios.test.ts`: every Booking has a payer; the only child
     warning in the pristine seed is on `childPayer`, the only open insurer warning on
     `insurerFellThrough`; the review List is SUBMITTED and off every scripted beat; every seeded
     counterparty matches the parity fixture except the recorded Doyle change. Grep `src` for
     `billablePartyId`, `createBillableParty`, `New guardian`, `routeCounterpartyForHolder`,
     `billedAs` and `billedPartyFor`: nothing outside a comment recording the removal.
   - Run `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` before session 2.

**Session 2: holder references, completeness and 'finish', Review, Contract approval**

9. **Holder references** (DM-16, US-04.2.2 "Holder references" AC; AR-29 `#booking-procedure-fields`):
   - `Contract.holderReferences: HolderReferenceKind[]`, where the kind is `'approvalNumber' |
     'memberNumber' | 'claimReference' | 'purchaseOrder'`. Doc comment: v6 has no field for it;
     US-04.2.2 says a Contract names the references its holder needs. Office-only, edited in 18's
     Contract detail as a "References the holder needs" checkbox group, copied to a new version with
     the other terms.
   - Where each value lives: the approval number is `Booking.insuranceApprovalNumber` (item 1);
     `Booking.insurerMemberNumber?` and `Booking.purchaseOrder?` are new; the claim reference is the
     existing per-Procedure `billingReference`, relabelled "Claim or hospital reference". Record the
     placement in the Decisions log (moving it would ripple through intake and the invoice for no
     demo gain).
   - Pure `src/domain/billing/holderReferences.ts`: `referencesRequiredFor(booking, procedures,
     contracts)` (each kind with the Contracts that need it), `missingReferences(...)`, and
     `referenceValuesFor(...)` (one map keyed by kind, whatever field each lives in). Phase 25 locks
     that map at authorise, so keep them pure and exported.
   - `editBooking` gains `insurerMemberNumber` and `purchaseOrder`, audited `booking.update`. The
     Billing context grows a row per required reference, editable by the office (the anaesthetist
     apps show the value read-only where there is one).
   - These are review items, never completion failures (item 10). Tests: each kind satisfied and
     missing; the union across two Contracts; none required on No contract (RVG).
10. **Completeness and 'finish'** (`validateBookingForBilling`; US-03.6.1, US-03.3.3, FT-03.6, RV-21),
    every rule in the one validator that `completeBooking`, `SubmitListSheet` and the latch already
    read. A Procedure completes when it has:
    - **A Contract** ("Choose a Contract for this procedure."): keep 20's.
    - **Its times, only where the Contract prices from time** (US-03.3.3): add a pure
      `pricesFromTime(contract, line)` beside 19a's resolver (false when the Contract's line holds a
      fixed price; true for RVG and rate-by-time Contracts); 24 re-points it at the Procedure's held
      price. On a fixed price, times may stay blank and Mark complete passes.
    - **An explanation for every claimed modifier**: 19b's check, kept as it is; confirm it fires on
      submit too and locked modifiers never need one.
    Remove from the validator: the RVG-code-or-billing-line exemption and any RVG-code requirement
    (the code is optional; a Procedure with no RVG code and no base must not throw in the fee
    engine, so add a test), any "choose the procedure" check (OQ-99 answered), the route, insurer
    direct-claims and deposit rules, the holder-references check (item 9) and any payer-email check.
    Warnings are not failures: the child and insurer warnings never appear in the validator. An
    out-of-range base never blocks (US-03.3.1): confirm 19 left no range check here. Leave the
    negative-override refusal for 39 to settle (it conflicts with credit events).
    - **'Finish', never 'handover'** in every user-visible string: the validation messages ("Add the
      finish time."), `TimesCard`, audit and field labels (`ACTION_LABELS`, `FIELD_LABELS`) and the
      comment in `timeUnits.ts`. The stored field keeps its name unless a rename is free; if it is
      renamed, bump `PERSIST_VERSION` and migrate. Grep `src` for "handover" in strings.
    - The validator context gains the patient, the List date, the Procedures' Contracts and holders.
      It is built in `billingContextForBooking` and in `BookingDetailBody`; make the component call
      the selector so they cannot drift.
    - Where the anaesthetist cannot complete a Procedure, they use 32b's "alert the office"; this
      phase adds nothing there.
    - Tests: each failure and its focus anchor on mobile and web; a Contract-less Procedure; a fixed
      price with no times passes; an RVG Contract with no times refuses with the finish wording; a
      Booking with no RVG code and no reference passes; every seeded completed Booking passes.
11. **Review** (`ReviewScreen.tsx`, `reviewFlags.ts`; US-07.2.2), inside the mockup's anatomy
    (columns, not new panels):
    - Each Booking row lists **every Procedure** as 20a's stack in compact form (text as received,
      Contract with who is invoiced, RVG code), not only the primary.
    - **Payer** column: the payer's name, relationship and email (or an "Email needed" chip, a neutral
      flag, US-11.2.3) and postal address where there is one, with a teal **Change** opening the payer
      sheet (AC2). Holder-billed parties show their name and contact email beneath the Contract line
      ("addresses and invoice email addresses").
    - **Insurance** line under the patient: "nib · approval 12345678", or "AIA Health · no approval
      number" with the cue "Ring the surgeon's rooms" when there is none. A blank insurer shows
      nothing.
    - **References:** each missing holder reference as a neutral "Reference needed: {kind}" flag
      (`missingReferences`), editable from the row; this folds in 20's `billingReferenceMissing`
      advisory. The two seeded "No billing reference" flags (Morrison's S2 cystoscopy and the S3 Forte
      AM cholecystectomy) still show, so those two Procedures' Contracts name `claimReference`
      (item 14).
    - **Alerts and late edits:** each open alert the anaesthetist raised on the List, Booking or
      Procedure (32b, with its note and 32b's resolve tick, which also clears its to-do), and a
      "Changed since submit" line from 38a's late-edit marker for each Procedure or Booking edited by
      the anaesthetist after submitting. Neither gates authorise.
    - **Warnings:** the row's open warnings (child payer, insurer named with no Contract, and 15a's
      others) with **Clear** on each, through `clearWarning`, so the office clears them on review as
      well as on the to-do list. They never gate authorise.
    - All flags stay advisory and pure (inputs as parameters); no General-procedure pill.
    - Each row gains an **Open** link to the admin Booking detail that returns to this Review screen.
    - Add the pure `authoriseBlockersFor(state, listId)` seam in `store/lifecycle.ts`, shared by
      `authoriseList`, the Review action bar and 14's PWA office stand-ins. It returns **no blockers
      in this phase** (no warning, flag or reference blocks, and US-04.3.7's to-confirm flag is Future
      Work); Phase 25 and Phase 40 each add their kind to it.
12. **Office approval of Contract selections** (US-07.2.2 "approves the Contract selections made
    earlier, or corrects them"; OQ-26; US-03.4.1, DM-10):
    - Each Procedure's line in Review shows 20's change flag as "Changed by Dr {surname}: was {old}"
      with a teal **Approve** and a **Correct** link (opens the Booking's Contract picker), or
      "Approved {time}". 20's warn pill becomes this line's source and drops once approved; never both.
      A change the anaesthetist makes after the office has approved it re-opens the flag (they may
      edit until AUTHORISED).
    - `approveContractSelection(api, actor, {bookingId, procedureId?})`: office only, ACTIVE or
      SUBMITTED; stamps `Procedure.contractApproval = {by, atISO, how: 'explicit' | 'authorise'}`;
      audited `procedure.contractApprove`. An office re-pick counts as approved (stamp it too). An
      approve-all per Booking and per List.
    - `authoriseList` stamps every Procedure still unapproved in the same `mutate()`, audited
      "approved at authorise", so every Contract is approved by the time the List locks (Phase 25
      locks it). The authorise confirm says how many changes it will approve. Not a gate.
    - Tests: rights, the stamps, re-opening after a later anaesthetist change, approval at authorise,
      History labels.
13. **Demo triggers** (register in `src/shared/demoTriggers/registry.ts`; bodies in `src/store`):
    the two samples (item 8) and "Office approves this Contract change" on the PWA mobile Booking.
    Tests in `demoTriggers.test.ts` and 15a's sample test: the PWA entry's `disabledReason`, route
    scoping (never returned for `'bar'`), stage then unstage restoring seed values, a second press
    doing nothing new, the AUTHORISED skip, and `pwaPurity.test.ts` green.
14. **Seed for session 2**, then bump `PERSIST_VERSION` again:
    - **Holder references** (labelled demo readings in `contracts.ts`): the ACC Contracts (St
      George's ACC, COS ACC) name `claimReference`; nib's Contract names `approvalNumber` and
      `memberNumber`; purchase order is declarable but seeded nowhere. The two Procedures behind the
      seeded "No billing reference" flags are on Contracts that name `claimReference` and carry none.
    - **Values:** a member number on every Booking with a nib Procedure; a claim reference on every
      other Booking under an ACC Contract (handcrafted and filler), so the pristine Review shows only
      the intended flags. Losa Tuilagi's `ACC45-118844` on Ropata Thu 16 stays: Phase 25's failure
      trigger clears it through an office edit on the SUBMITTED List, which must not un-complete the
      Booking.
    - **Times** on any seeded completed Procedure that lacks them where its Contract prices from time
      (the Aria Bookings, Wed 15), and **one fixed-price Booking with no times** on an ACTIVE List off
      every S1 to S5 beat with a dedicated pinned patient (`SEED_MARKERS.fixedPriceNoTimes`), for the
      "times optional on a fixed price" shot.
    - **Tests:** every completed, non-cancelled seeded Booking passes the new validator (including the
      four Bookings on the review List); `authoriseBlockersFor` is empty for every seeded SUBMITTED
      List; the `fixedPriceNoTimes` marker completes without times.
15. **Copy, labels and shots.**
    - `ACTION_LABELS` and `FIELD_LABELS` for every new action and field.
    - Remove stale "Payer (default)", "New guardian", guardian-record, "billable party override" and
      "handover" copy. In app copy say "payer" for the person on the Booking and "invoiced to" for who
      is billed; "finish" for the time.
    - `data-shot` hooks: `booking-payer-row`, `payer-sheet`, `booking-insurance-row`,
      `review-payer`, `review-insurance`, `review-procedure-stack`, `review-contract-approve`,
      `review-warning-clear`, `review-alert`, `review-late-edit`, `todo-child-warning`,
      `todo-insurer-warning`.
    - Update the Playwright specs that snapshot Booking detail, Review, the billing setup sheet, the
      to-do list or the invoice document, and re-shoot. No en or em dashes in new copy.
16. **Decisions log** (PROGRESS.md), superseding earlier readings:
    - The guardian override record (2026-07-22 third and seventh reviews) is replaced by the payer on
      the Booking (US-11.2.2, RV-30); `createBillableParty` is gone and `BP####` ids live on as payer
      ids. Phase 20's interim (holder-as-payer and the `billablePartyId` override) is retired.
    - The 7th-review A1/B15 route-based payer is replaced: each Procedure's Contract bills its holder
      when the holder pays AA, otherwise the payer on the Booking. The Doyle bariatric Bookings now
      bill the patient (US-11.2.1).
    - The 8th-review silent BTM fallback for a fixed-schedule miss is superseded: a Contract is
      offered only with a line for the procedure (or as a plain RVG Contract, D32), a line field left
      blank inherits (AR-29 `#null-handling`), and US-04.3.7's to-confirm flag is Future Work and not
      built. Remove any comment in `fee.ts` that still describes the fallback.
    - The Phase 04 completion-validation ruling is superseded (RV-21): Contract, times only where
      timed, modifier explanations; the RVG code is optional; references and the payer's email are
      office review items, not completion checks.
    - The payer sits on the Booking (catalogue), not on each booking procedure (v6), and not in a
      single billable-party table (Greg): both tensions logged, with v6's admin-only reading against
      the anaesthetist changing the payer (OQ-54).
    - The Aria clinic is a holder billed through `BP0002` (18), not a payer on the Booking; a payer is
      always a person.
    - The insurer and approval number (D28, OQ-93 in part): on the Booking, recorded by the office; the
      cue and the warning; no narrowing; the direct-claims flag unread (D55); the AIA reimbursement
      Booking on No contract (RVG) with the claim note.
    - The claim reference placement (`billingReference`), and holder references on the Contract.
    - Phase 07's "authorise is never gated by flags" still holds: this phase adds only the empty
      `authoriseBlockersFor` seam.

## Demo triggers

| Label | Screen (routes) | Surface | Effect |
|---|---|---|---|
| **Raise sample warnings** (15a's, extended) | 15a's routes (Admin · Day, Admin · Booking detail, Mobile · Booking) | As 15a set it | 15a's body, which now also stages a child payer and an insurer-named Booking with no insurer Contract (below); "Clear sample warnings" unstages them |
| **Office approves this Contract change** | Mobile · Booking (`/mobile/lists/:listId/bookings/:bookingId`) | PWA sheet only (`surfaces: ['pwa']`, `badge: 'office-stand-in'`) | `approveContractSelection` on the Booking in the URL, as 14's `OFFICE_SIMULATION_ACTOR` |

**Product, no button.** Changing the payer (mobile, web, admin and Review), editing the insurer and
approval number (office), entering a member number, purchase order or claim reference, approving a
Contract change on Review and clearing a warning (to-do list, Review, or 15a's PWA "Office clears
this warning") are product actions. Raising an alert (32b) and editing after submit (38a) are theirs.

**Seeded, no button.** The payer review List sits in the Review queue on load: the 15-year-old payer
carries the child warning; the nib-naming Booking on No contract (RVG) carries the insurer warning
(both on the to-do list, the Review row and the Booking's triangle); the nib Booking on nib's Contract
with no approval number shows the ring-the-rooms cue; the no-email Booking shows "Email needed". Grace
Park (Hana Park as payer) is the no-warning child case. The fixed-price Booking with no times shows
Mark complete passing without them.

**The two samples** (`src/store/warningSamples.ts`, 15a's `isStaged`/`stage`/`unstage` contract,
as `DEMO_TRIGGER_ACTOR`; they create no Booking):
- `childPayer`: the target is the Booking in the URL when its patient is under 18 on the List date,
  otherwise (and from the Day view) Grace Park's Booking. `stage` sets the payer to
  `{kind: 'patient'}` through `setBookingPayer` and, if every Procedure's Contract bills its holder,
  moves the first onto No contract (RVG); `unstage` restores the seed payer and Contract from
  `buildSeed()`. Its target is a minor, which `multiWarning` is not, so this sample does not land on
  `multiWarning`; say so in the PROGRESS entry. A system actor's Contract change raises no approval
  flag.
- `insurerContractMissing`: stages on 15a's pinned sample Bookings and `multiWarning` (any Booking
  with no insurer-held Procedure): `stage` sets the insurer to nib with no approval number through
  `setBookingInsurance`; `unstage` restores the seed insurer and number.
- Disabled states follow 15a's. When a target's List is AUTHORISED, that sample is skipped and the
  result line says "The child sample's Booking is authorised. Reset to raise it again."; the others
  still stage.

**Office approves this Contract change** (PWA parity). Disabled with "No Contract change to approve"
when the Booking has none, or "This Booking's List is authorised" once locked. The handset beat: the
anaesthetist changes the Contract, sees "Awaiting office approval", the stand-in approves, and the
phone shows "Approved by the office {time}". In the framed build the presenter approves on Review, so
no bar entry.

No "Stage child billed directly" button, no `src/store/demoStaging.ts` and nothing new on the
Control Panel page.

## Out of scope

- Sending the invoice to the email or the portal, Contract-driven layout and delivery, and the Split
  action that replaces `funderOverride` (Phase 22). The invoice description (D37, retitled) is 20a's
  and 22's.
- The primary Procedure and the multi-procedure rule (Phase 23); the price precedence (Phase 24); the
  fixed price's optional BTM and "no price" refusal (24, which re-points `pricesFromTime`).
- Locking the selection, the payer and the references at AUTHORISED (Phase 25).
- Deriving prepayment and its re-check on a payer change (Phase 27).
- Additional invoices, credit notes and an event's own billable party to any party (Phases 38b, 39,
  39b); they address a party through `billablePartyForProcedure` or the payer sheet, never a new
  record.
- A patient record screen, missing NHI and the balance warning (Phase 40).
- The alert, notice and late-edit mechanisms themselves (32b, 38a): this phase only shows them.
- Warning settings (US-13.7.4, Future). Hospital data setting the Contract (OQ-22, Future), and
  US-04.3.7's to-confirm flag (Future Work).
- A payer master, payer search across Bookings, or archiving a payer when the debt closes: the payer
  lives on the Booking and its invoice snapshots. Build none.

## Manual test checklist

The agent runs every item itself in the running app and reports it with evidence; none is handed to
the owner (ROADMAP.md "Owner review: agents test themselves").

- [ ] **Payer prefilled (US-11.2.2 AC1).** Add a Booking on mobile, on web and through admin phone
      advice: the Payer row shows the patient's name and email with no step taken.
- [ ] **Guardian (AC2).** Admin, an ACTIVE Booking for a child on No contract (RVG): Change payer,
      Someone else, enter a guardian's name, relationship and email. The stack's "who is invoiced"
      and the Payer row show the guardian, the fee is unchanged to the cent, History records "Payer".
- [ ] **Holder pays (AC3, US-11.2.1).** Move the same Procedure to a hospital-held Contract that
      pays AA: who is invoiced shows the hospital and its contact email; the Payer row is unchanged
      and not invoiced. On the Doyle bariatric Booking, who is invoiced is the patient at the
      Contract's price.
- [ ] **Anaesthetist on mobile and web.** As Dr Souter on an ACTIVE Booking, change the payer: a
      bottom sheet on mobile, a dialog on web; no holder setting or money shows. On a SUBMITTED List
      the anaesthetist still can (38a's edit window) and the office sees it as a late edit; both can
      from Booking detail and the office from Review. Nobody can on AUTHORISED.
- [ ] **Guardian master gone.** Grace Park shows Hana Park (Mother) as payer; no "New guardian" or
      guardian select anywhere; the Aria Bookings still invoice "Aria Skin and Laser Clinic".
- [ ] **Grouping (US-08.2.1).** S3 Beat 1 figures unchanged ($396.18; $152.38 and $91.43); a Booking
      with one payer-billed and one holder-billed Procedure gives two invoices, two payer-billed give one.
- [ ] **Insured patient who forwards (US-11.4.2).** The AIA Booking bills the patient under No
      contract (RVG); the invoice says to claim from AIA Health; the Insurance row shows AIA Health
      and its approval number.
- [ ] **Insurer and approval number (US-11.4.3).** Office, Booking detail: record an insurer and an
      approval number on a Booking (Insurance row, sheet); a blank insurer on a patient-paying Booking
      is fine. Naming an insurer with no number shows "Ring the surgeon's rooms" at Review; Dr Souter
      sees the insurer read-only and completes the Booking without a number.
- [ ] **Insurer warning (US-07.2.2).** On load the to-do list and Review show the nib-naming
      Booking's warning; Clear removes it; the List authorises with it open. Choosing nib's Contract
      on another such Booking removes the warning. The picker tags nib's Contracts "Matches the
      Booking's insurance" with No contract (RVG) still first and nothing filtered.
- [ ] **Child warning (US-11.2.4).** On load the to-do list, the Review row and the Booking (admin,
      and the triangle on web and mobile, visible on opening) show the 15-year-old's warning; Grace
      Park shows none. Authorise the review List with it open: it authorises. Clear it, then Raise
      sample warnings: a fresh one appears on Grace Park; naming Hana Park again removes it; Clear
      sample warnings restores the seed.
- [ ] **Payer email (US-11.2.3).** The no-email Booking shows "Email needed" on the Payer row and a
      flag at Review; entering an email clears both; Mark complete never refuses for it; a
      holder-billed Procedure asks for none.
- [ ] **Completeness (US-03.6.1).** A missing Contract, missing times on an RVG Procedure and a
      claimed modifier with no explanation each refuse Mark complete with their message, which says
      "finish", never "handover"; a Procedure with no RVG code and no reference completes; the
      fixed-price Booking completes with no times; an out-of-range base does not block.
- [ ] **'Finish' (US-03.3.3).** The Times card, messages, History and audit say start and finish on
      mobile, web and admin; grep the built app for "handover" in copy.
- [ ] **Holder references.** Tick "Purchase order" on a Contract in Master data: an ACTIVE Booking
      under it still completes, and Review shows "Reference needed: purchase order" until the office
      enters one.
- [ ] **Review (US-07.2.2).** Each row shows every Procedure as the stack, the payer with Change, the
      Insurance line, the references, the warnings with Clear and an Open link that returns to
      Review; there is no General-procedure pill. An alert Dr Souter raised (32b) shows with its
      resolve tick, and a change he made after submitting (38a) shows as "Changed since submit".
- [ ] **Contract approval.** Change a Contract as Dr Souter, submit, then on Review: "Changed by Dr
      Souter" with Approve, which stamps "Approved". A further change by Dr Souter re-opens it.
      Authorising another List stamps the rest, and History shows it. On the PWA, **Office approves
      this Contract change** does the same and is disabled on a Booking with no change.
- [ ] **Scripted beats unblocked.** S1 Beat 3 (Sarah Mitchell), S2 Beat 4 (Morrison), S3 and S4 Beat
      1 (Riley) run as scripted, with no new blocker and no new warning on their Bookings.
- [ ] No en or em dashes in new UI copy; teal on every new action; crimson nowhere new.
- [ ] Catalogue screenshots: the recipes in the table below are created or updated, any recipe this
      phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story
      without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board`
      is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and
      `npm run verify:board` all green.

## Demo guide updates

In the same session, patch `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`, the matching sections of
`master-demo-guide.html`, and the Control Panel scenario text in `DemoControlPanel.tsx`:
- **S1 Beat 3:** "Worth pointing at" gains one line: Mark complete checks a Contract, the times (only
  where the Contract prices from time) and an explanation for each claimed modifier, and says "finish",
  never "handover"; the RVG code, the payer's email and the holder's references are the office's to
  pick up at review. Sarah has an email, so expected results are unchanged.
- **S2 Beat 4:** "Say" and "Expected": Review shows each Procedure as the text as received, Contract
  and RVG code, who is invoiced, the payer (changeable here), the insurer and approval number, the
  references, any alert or late edit from the anaesthetist and any warnings, and authorising approves
  the Contract selections. Add an **optional aside**: the payer review List, with the child-payer and
  insurer warnings (to-do list, Review row, triangle) and the ring-the-rooms cue; clear one, authorise
  anyway to show they never block, and "Raise sample warnings" brings a fresh child warning back on
  Grace Park.
- **S3 Beat 1:** "It resolves the explicit payer per Procedure ... groups by counterparty" becomes
  "each Procedure's Contract decides who is billed: its holder when the holder pays AA, otherwise the
  payer named on the Booking; the run groups each Booking's Procedures by that party". "Funder
  allocation" stays until Phase 22, and so does the Beat's "Optional aside" (reallocating part of
  the two-funder Booking to the patient through **Funder allocation**). Figures unchanged.
- **Insured reimbursement** (the cheat sheet's "Patient insurance distinction", the personas doc's
  "Patient's reimbursement insurer" row and their master-guide sections): the AIA patient is
  invoiced under No contract (RVG) with a "claim this invoice from AIA Health" note, and the insurer
  and approval number sit on the Booking, recorded by the office; there is no Direct Insurer route,
  only an insurer's Contract that bills the insurer, and insurance never decides who is billed.
- **S4 Beat 1:** no change (Riley has an email); confirm by running it.
- **Cheat sheet:** the payer section Phase 20 rewrote (who is billed by holder or payer; the payer
  on every Booking, prefilled, changeable to a guardian; the payer-email flag at review; the insurer
  and approval number and the ring-the-rooms cue), 15a's warnings section (the two new mild rules)
  and the completion checks ("finish").
- **Workflows doc:** booking setup (the payer prefilled, the insurer and approval number recorded by
  the office), the anaesthetist's Mark complete step (what is checked) and office review (stack, payer,
  insurer, references, alerts, late edits, warnings, approval).
- **Personas doc:** the office reviews who is invoiced, rings the rooms for a missing approval number
  and clears warnings; the anaesthetist can name a guardian as payer and completes without insurance
  details.
- **Control Panel S2 text:** mention the optional payer review aside and that "Raise sample
  warnings" lives on its screen.

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19), run
after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 21` first: earlier phases (20 and 20a
above all) may have changed these recipes. Several captions describe the retired override; replace
each when the recipe is updated. FT-11.2, FT-11.4 and FT-03.6 are features and show their
stories' shots.

**Covered items.** When the phase is done, each recipe in `requirements-board/requirements/capture/recipes/`
matches what was built:

| Item | Recipe now | When this phase is done |
|---|---|---|
| [US-11.2.1](../../../../requirements-board/requirements/stories/US-11.2.1.md) Patient billed when the Contract does not bill its holder | captured · admin-default-payer | Stays captured. Re-point `admin-default-payer` (BK0008, check it is on No contract (RVG) after 20) to the Payer row and the stack's who-is-invoiced, keeping the shot `name`; caption "Under No contract (RVG) the payer on the Booking, the patient, is billed". Add `admin-surgeon-fixed-price-payer` on the Doyle bariatric Booking: the surgeon's Contract and price, invoiced to the patient. |
| [US-11.2.2](../../../../requirements-board/requirements/stories/US-11.2.2.md) Payer on the Booking, editable to a guardian | partial · admin-guardian-payer (set, edit) | Captured. Re-shoot `admin-guardian-payer` on Grace Park (BK0033): `set` shows Hana Park in `booking-payer-row` and the stack; `edit` opens `payer-sheet` with Someone else. Captions "Guardian named as the payer on the Booking" and "Changing the payer: the patient or someone else". Add `web-booking-payer` and `mobile-booking-payer` (the anaesthetist changes the payer: dialog on web, bottom sheet on mobile) and a `holder-billed` state (a hospital-billed Contract invoices the hospital, the payer untouched). Drop the partial reason; hand the item's stale-screenshot note to `/update-requirements`. |
| [US-11.2.3](../../../../requirements-board/requirements/stories/US-11.2.3.md) Payer email required when the payer is billed | absent | Captured. Create `admin-payer-email-required` and `mobile-payer-email-required` on `SEED_MARKERS.payerEmailMissing` (id from the built seed, see ATLAS "Seed data"): state `flagged` is the "Email needed" chip on the Payer row (highlight `booking-payer-row`, plus the Review flag in admin); state `entered` is the email entered and the chip gone. Caption: "A missing payer email is flagged for the office when the payer is billed". |
| [US-11.2.4](../../../../requirements-board/requirements/stories/US-11.2.4.md) Warn when a child is the payer on the Booking | absent | Captured. Create `admin-todo-child-warning` on `/admin/day/2026-07-21` (highlight `todo-child-warning`, expanding the card's "Show all" if the row is past the first six; states `raised` and `cleared`); `booking-child-warning` on the 15-year-old's Booking in admin, web and mobile (triangle, warning on opening, "Under 18" chip); `guardian-payer-no-warning` on Grace Park. Captions: a mild warning, no block; none when a guardian pays or the Contract bills a hospital. Ids from `SEED_LIST_IDS.payerReview`. |
| [US-11.4.1](../../../../requirements-board/requirements/stories/US-11.4.1.md) Insurers and direct claims | captured · admin-insurers | No change here (the flag is not read in this phase, D55; Phase 18 or 42 owns it). Re-run `--dry` to confirm it still resolves. |
| [US-11.4.2](../../../../requirements-board/requirements/stories/US-11.4.2.md) Insured patient who forwards the invoice | captured · admin-insured-reimbursement | Stays captured. Re-point `admin-insured-reimbursement` (BK0030, check it still holds the AIA Booking) to the stack (No contract (RVG), invoiced to the patient) and `booking-insurance-row` (AIA Health and approval number); add an `invoice-note` state on the invoice document with "claim this invoice from AIA Health". Caption stays. |
| [US-11.4.3](../../../../requirements-board/requirements/stories/US-11.4.3.md) Insurer and approval number on the Booking | none (create it) | Create `admin-insurer-approval` on the `approvalMissing` Booking: state `recorded` (the Insurance row, `booking-insurance-row`, with insurer and number, and the edit sheet), state `missing` (the Review line `review-insurance` with "Ring the surgeon's rooms"); and `mobile-insurer-read-only` on the same Booking (read-only row, Mark complete passing without a number). Caption: "The office records the insurer and approval number; the anaesthetist completes without it". |
| [US-03.6.1](../../../../requirements-board/requirements/stories/US-03.6.1.md) Mark a Booking complete | captured · web-mark-complete, mobile-mark-complete (blocked, complete) | Stays captured. Keep the two shot `name`s and `blocked` and `complete` on BK0009 (check the `capture-times` highlight still lands); the blocked shot's missing-time line now reads "finish" (the catalogue's captions already say so). Add a `fixed-price` state on web and mobile on `SEED_MARKERS.fixedPriceNoTimes`: Mark complete passing with no times. |
| [US-03.6.2](../../../../requirements-board/requirements/stories/US-03.6.2.md) Incomplete Bookings listed | captured · web-incomplete, mobile-incomplete (list, blocked) | Stays captured. Re-shoot both; check the "what is missing" line reads the new messages. |
| [US-03.6.3](../../../../requirements-board/requirements/stories/US-03.6.3.md) Ask the office to check | none (create it) | No change here (Phase 32b owns it). |
| [US-03.3.3](../../../../requirements-board/requirements/stories/US-03.3.3.md) Record anaesthetic start and finish times | captured · web-times, mobile-times (started, handover) | Stays captured; re-shoot with every label, button and message saying "finish" (the Times card and the Start/Finish now buttons); the catalogue captions already say "finish". Keep the state ids (`started`, `handover`) while the story cites those shot files; renaming them is a catalogue edit for `/update-requirements`. |
| [US-07.2.2](../../../../requirements-board/requirements/stories/US-07.2.2.md) Office review of Contracts and references | captured · admin-review-contracts, admin-correct-contract (setup, edit) | Stays captured. Re-shoot `admin-review-contracts` on `/admin/review/L-25490-2026-07-20-AM` with the stack per Procedure, the Payer column (`review-payer`), the Insurance and references lines (`review-insurance`), a changed Contract with Approve (`review-contract-approve`), an alert and a late edit (`review-alert`, `review-late-edit`) and the Open link; add states on the payer review List for the warnings with Clear (`review-warning-clear`) and the ring-the-rooms cue. No General-procedure pill. Captions "Office review: each Procedure as the text received, Contract and RVG code, with the payer, insurer and warnings" and "Correcting a Contract from review"; re-point `admin-correct-contract` (BK0010) if its `Edit billing setup` click and `office-billing-setup` ancestor moved. |

**Recipes this phase breaks.**
- `US-11.2.1`, `US-11.2.2` and `US-11.4.2` highlight the office billing setup on BK0008, BK0033 and
  BK0030; the payer moves to `booking-payer-row`. Covered in the table.
- `US-11.2.2` selects the guardian `select` in the billing setup dialog, which is gone. Covered.
- `US-08.2.1` (`invoices-by-party`, `grouped-invoice`) is no longer a covered item (it Matches): after
  the grouping switch confirm both still run and their highlights land (Prentice still two invoices,
  Holt one); no recipe change is planned.
- `US-07.2.3`, `US-04.3.2`, `US-04.3.4` and `US-06.3.5` click `Edit billing setup` or open the
  Contract picker: confirm both still resolve once the payer leaves `OfficeBillingSetup`.
- `US-07.3.2` and `US-08.1.2` shoot the Review table: re-check their highlights after the stack,
  Payer column and Open link change the columns.
- `US-02.5.5` shoots History: re-check its highlight with the new `booking.payer` label.
- Any recipe or ATLAS entry naming `BP0001` as a master row: re-point to the payer on the Booking.
- The `--dry` run is the check for anything this list missed.

**ATLAS.md.** Update Seed data (the payer review List and its pinned patients, Hana Park as Grace
Park's payer, the insurers and approval numbers, the fixed-price Booking), Personas and IDs (the new
`SEED_MARKERS` and `SEED_LIST_IDS.payerReview`), Existing hooks (the `data-shot` hooks in item 15)
and the Demo control panel section for the two samples under "Raise sample warnings".

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
- **One rule, one place.** Who is billed is `billablePartyForProcedure` only: the billing run, 20a's
  who-is-invoiced selector, Review, the invoice and Xero all read it; `routeCounterpartyForHolder`,
  `billedAs` and 20's interim are gone. The payer is written only by `setBookingPayer`; the insurer
  and approval number only by `setBookingInsurance`, and they never reach who is billed (D28).
- **Independent of pricing.** No fee path reads the payer, the party or the insurer; a guardian
  payer changes the recipient, not one cent. `funderOverride` still beats the party until 22, so
  S3's figures hold.
- **Grouping and contacts.** One invoice per distinct party per Booking; Hana Park's and Aria's Xero
  contacts, invoices and history rows unchanged; the only counterparty change is the recorded Doyle
  one; a guardian's email never reaches a holder-billed invoice.
- **The two warnings and the cue.** Registered once each in 15a's routine; no `reviewFlags` duplicate;
  age on the List date at the 18th-birthday boundary; none when a guardian pays or the holder is
  billed; the insurer warning does not read the direct-claims flag (D55) and is silent for a blank
  insurer; the ring-the-rooms cue is advisory and never reaches the anaesthetist's completion;
  nothing blocks saving, completing, submitting or authorising.
- **Completeness.** A Contract, times only where the Contract prices from time, modifier explanations
  (19b's check, not a copy); the RVG code, references and payer email are never completion checks; no
  billing-line exemption; no range block; failures anchor and focus on mobile and web; every seeded
  completed Booking passes; no "handover" left in copy, messages or audit; S1 Beat 3, S2 Beat 4, S3
  and S4 Beat 1 unchanged.
- **Review.** Every Procedure's stack, payer, insurer and approval number, references, 32b's alerts and
  38a's late edits, the Contract-change flag and warnings with Clear; no General-procedure flag.
- **Authorise.** `authoriseBlockersFor` is one pure seam with no blockers yet; authorising stamps
  every remaining Contract approval atomically; the PWA stand-in cannot half-authorise.
- **Discipline.** Every write through `mutate()` with labels; samples deterministic, idempotent, in
  `src/store`, `pwaPurity` green; new billing modules pass `domainPurity`; no money on mobile; the
  PWA-only trigger never in the bar; `PERSIST_VERSION` bumped for each seed change; no en or em
  dashes; teal the only action colour.

## PROGRESS.md updates

- **For the owner's review** (end of the phase entry; ROADMAP.md "Owner review: agents test
  themselves"): the defaults built (D28's open parts: the insurer does not narrow the list, the warning
  fires for any named insurer with no insurer Contract, one approval-number field; D55: the
  direct-claims flag read nowhere in this phase; the payer-email rule enforced at review, not at
  completion, because US-11.2.3 does not say where), the readings built (the payer on the Booking
  rather than each booking procedure, changeable by the anaesthetist against v6's admin-only, and no
  single billable-party table, against the draft and Greg; the Aria clinic as a billed holder; the
  claim reference placement; holder references on the Contract, review items not blocks; the Doyle
  Bookings now billed to the patient; the insurer warning as an after-procedure kind; the AIA
  reimbursement Booking seeded as already cleared; `pricesFromTime` until 24), anything logged rather
  than fixed, and the screens worth a look, each with its route and persona (the payer sheet on mobile
  and web, the Payer and Insurance rows, Review's stack, Payer, insurer, alerts, late edits, warnings
  and Approve, the to-do list's two warnings).
- **Status table:** a catch-up row for Phase 21.
- **Phase entry:** the drift-check result (against `d4db277`; OQ-67, OQ-78, OQ-54, OQ-99 and OQ-26
  built as answered; OQ-93 in part and OQ-114 as defaults; what 15a, 18, 19b, 20, 20a, 32b and 38a left
  that this phase reused); the files and actions added and the guardian master's removal (RV-30); the
  parity result and the Doyle change; the `PERSIST_VERSION` bumps; the tests added; the review List
  chosen and how each sample was placed; the manual checklist item by item; the adversarial review
  pass; anything deferred.
- **Decisions log:** the entries from item 16.
- **Handoff list:** "Phase 22 sends to `Invoice.invoiceEmail` and replaces `funderOverride` with the
  Split action; Phase 24 re-points `pricesFromTime` at the Procedure's held price; Phase 25 locks
  `Booking.payer`, each Procedure's party and `referenceValuesFor`, and adds its blocker to
  `authoriseBlockersFor`; Phase 27 reads `isPersonParty`/`isPayerBilled` and hooks its re-check on
  `setBookingPayer`; Phase 33 sets the insurer from download rows; Phases 38b, 39 and 39b address a
  party (and an event's own billable party) through `billablePartyForProcedure` or the payer sheet;
  Phase 40 adds the missing-NHI blocker to `authoriseBlockersFor`; Phase 43a keeps the payer and the
  stack on anaesthetist screens; if Greg reopens OQ-78 or the design moves the payer onto the booking
  procedure, `whoIsBilled.ts` and `setBookingPayer` are the places to change; if OQ-114 or OQ-93 are
  answered, `insurance.ts` is the place".
- **Catalogue screenshots:** recipes created (US-11.2.3, US-11.2.4, US-11.4.3) and changed (US-11.2.1,
  US-11.2.2, US-11.4.2, US-03.6.1, US-03.6.2, US-03.3.3, US-07.2.2, plus any recipe the step broke),
  the `requirements-board/requirements/capture/REPORT.md` counts (captured, partial, absent, failed)
  before and after, any partial reason handed on, and US-11.2.2's stale-screenshot note handed to
  `/update-requirements`.
