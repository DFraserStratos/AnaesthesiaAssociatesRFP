# AA Prototype · Requirements catch-up roadmap

The prototype was built in July 2026 against the original RFP (phases 00 to 13, see
[../ROADMAP.md](../ROADMAP.md)). The requirements catalogue is now the source of truth and has moved
a long way from the RFP. This catch-up brings the prototype up to the catalogue as at commit
**`fbdd555`**. Future Work lane and retired items are out; retired behaviour the prototype still has is removed
or reworked. The plan was updated on 2026-10-01 for the AA meeting with Greg
([change log](../../../requirements-board/requirements/changes/2026-10-01-requirements-update.md)),
on 2026-10-03 for the three 2026-10-02 meetings with Greg (change logs:
[morning](../../../requirements-board/requirements/changes/2026-10-02-requirements-update.md),
[requirements review](../../../requirements-board/requirements/changes/2026-10-02-aa-requirements-review-with-greg.md),
[booking and pricing review](../../../requirements-board/requirements/changes/2026-10-02-aa-booking-and-pricing-review-with-greg.md)),
on 2026-10-08 for the Contract and pricing model rewrite (change logs:
[2026-10-07 requirements update](../../../requirements-board/requirements/changes/2026-10-07-requirements-update.md),
with the 2026-10-05 typed decision, the 2026-10-06 directors' answers and the 2026-10-08 follow-ups;
[List lifecycle states](../../../requirements-board/requirements/changes/2026-10-07-list-lifecycle-states.md);
[procedure picker and source text](../../../requirements-board/requirements/changes/2026-10-08-procedure-picker-and-source-text.md)),
and again on 2026-10-20 for the 14, 16 and 19 October meetings with Greg and the consistency review
(change logs: [2026-10-16 requirements update](../../../requirements-board/requirements/changes/2026-10-16-requirements-update.md),
with Greg's pricing model v6, which overwrote AR-28, AR-29 and AR-30 in place;
[2026-10-19 meeting with Greg](../../../requirements-board/requirements/changes/2026-10-19-aa-meeting-with-greg.md);
the consistency review committed at `b791b90`, with Donald's typed decisions of 2026-10-20; the
[status recode](../../../requirements-board/requirements/changes/2026-10-20-status-recode.md) is a relabel only).
That update dropped the procedure master (the procedure on a Booking is the text received; the RVG
groups are the one master list, and the RVG code on a Procedure is optional, picked by type-ahead),
kept the rooms', the hospital's and a new invoice description apart, made prepaid a setting on the
Contract (no prepaid settings and no GST period on the profile), replaced first and third party with
settings (who is billed, whether the anaesthetist may change the price, prepaid), made Contract lines
standalone and optional, staged every Contract change for review before it becomes a new dated version
that is never backdated, let the anaesthetist change a submitted List, its Contract included, until it
is AUTHORISED, put the price, rate and discount on the Procedure with the last change standing and no
reason asked, merged other billing lines into events, made the NHI mandatory, held prepayments in a
prepay holding account paid out by a second pair once the List is authorised, answered the 19 October
schedule questions (unavailability is never a conflict, whoever moves a List chooses what the vacated
Slot becomes, a single Booking moves only to a free colleague as a new List, Lists never move day,
notices are ticked resolved, an anaesthetist can alert the office) and confirmed the RVG
multi-procedure rule. The changed items were re-graded (194 of 287 in scope), and the data-model
delta and reverse check redone (new deltas DM-55 to DM-57; DM ids are stable). **The reverse check was
renumbered**: RV ids now name different findings from the 2026-10-08 plan, and every phase's RV covers
were re-placed by meaning (see Sequencing rules).

The plan was updated again on 2026-11-02 (catalogue `7cd7802`) for the AA meetings of 27 October (Ben
and Vanessa) and 28 October (Greg) and Donald's typed decisions of 29 October
([change log](../../../requirements-board/requirements/changes/2026-10-28-aa-meetings-with-ben-vanessa-and-greg.md),
with its "Follow-up, 29 October"). That update answered OQ-96 (a prepaid Contract is never editable
by the anaesthetist; a difference is raised by hand), OQ-117 (a fixed price is never overridden by
the anaesthetist), OQ-116 (prepaid Procedures are left off the final invoice, with no deduction),
OQ-104, OQ-105 (one surgeon Contract linked to many surgeons by practitioner ID), OQ-106, OQ-101 (the
RVG range held and shown), OQ-113 (tiers for admins only) and OQ-115 (a cancelled prepayment is
credited or refunded automatically); renamed the prepay holding account the **AA Holding account**,
an accounts payable creditor released by a journal transfer, with its trigger reopened (OQ-125); made
prepayment approval a step AA can switch off; retired the insurer master (insurers are contract
holders, with an invoice delivery setting on the holder) and FT-06.4; widened the payer (a parent,
guardian, benefactor or family trust, with an email or postal address); reopened how events are
billed (OQ-121); and added FT-02.6, stubs on a List, which waits on OQ-118. 109 changed items were
re-graded and the delta and reverse check redone (new deltas DM-58 and DM-59; new finding RV-39; RV-27
is now a "keep as demo scaffold" finding and RV-17 is no longer listed). No phase was added: 21, 27,
27a and 41 were reworked, 18 widened, and the rest changed in place (see "Placement notes for the
2026-11-02 update" under Sequencing rules).

The plan was updated again on 2026-11-04 (catalogue `d436947`) for the AA meeting with Greg of 23
October, filed late ([change log](../../../requirements-board/requirements/changes/2026-10-23-aa-meeting-with-greg.md);
the 27 and 28 October meetings win where they differ), with Donald's rulings of 4 November, and for
Ben's specialist list email of 3 November
([change log](../../../requirements-board/requirements/changes/2026-11-03-ben-specialist-list-email.md)).
That update answered OQ-103 (the invoice description is a series of defaults: the surgeon's rooms'
description, replaced by the hospital's when one arrives, replaced by the chosen Contract line's
invoice description where it is filled in; AA admins edit it at any time as free text; the RVG code
plays no part) and OQ-110 (the internal booking model is left to the development team; US-14.2.1 is
Future Work); settled more of OQ-93 (insurance never narrows the Contract list, the "insurer named
but no insurer Contract" warning is dropped, the missing approval number is the only insurance
warning, shown to the office and to the anaesthetist viewing the Booking, and the design's insurance
acceptance reference is the approval number); and, from Ben's list (the master list of surgeons and
rooms FT-13.6 was waiting for), noted that a surgeons' room may have no email or phone and added a
story for practice manager and PA contacts (US-13.6.5, Open), with five new questions (OQ-126 to
OQ-130). Greg's Contract model and payment model, discussed on 23 October, are a proposal held
lightly (Donald, 4 November): nothing `7cd7802` put in is reverted and no phase is re-planned for
them. 35 items were re-graded and the delta redone (new delta DM-60; FT-13.6 and US-13.6.2 now
Match). One phase was added, **17a** (rooms without an email, and practice manager and PA
contacts); 20a's invoice description and 21's insurance warnings were reworked, and the rest changed
in place (see "Placement notes for the 2026-11-04 update" under Sequencing rules).

The plan was updated again later on 2026-11-04 (catalogue `a68f09b`) for Donald's working decisions
of 4 November ([change log](../../../requirements-board/requirements/changes/2026-11-04-donald-working-decisions.md);
note AR-56), made for the build so the prototype can follow the current understanding: AA, Greg,
Ben and Vanessa have not seen them, so every item whose substance changed went to Verify. That
update answered OQ-118 (a booking with no NHI still waits at intake, and a **stub**, not a Booking,
stands in its place on its List until the office resolves it), OQ-119 (a prepaid Contract changed
after the prepayment is sent or paid is handled as a cancellation of the prepayment), OQ-121 (an
event is billed in the next run, never held for the Procedure's invoice, bundled with the same
billable party's invoice where it can be), OQ-128 (a surgeon can belong to **more than one room**;
which room's contacts apply joins OQ-127 as part 5), OQ-111 (payments to anaesthetists are **made in
Xero**; the system raises, records and tracks them), OQ-93 part 4 (the anaesthetist sees the approval
number where the Booking holds one) and OQ-108 (**both intake sources** in the first release: the
hospital download and the rooms' PDF lists, into the same matching screen, so US-02.2.1 leaves Future
Work); assumed OQ-109 part 2 (both integrated hospitals synced; which two is still open); set the
**step rail** from `contract-picker-mock/` as the working direction for the Contract picker (a guess,
to design and test with AA: who the invoice goes to, then prepaid or which Contract, then the price;
the office's job ends at the Contract and an RVG-priced Contract goes to the anaesthetist for the RVG
code); and opened OQ-131 (how the office keeps a Contract current: US-04.2.10 and US-04.2.14 back to
Open). The changed items were re-graded (Contradicts 110 to 116, Matches 68 to 65; 291 in scope) and
the delta redone (new deltas DM-61, the rooms' PDF list as a source document, and DM-62, the
anaesthetist's GST number on the invoice; DM-58 no longer held). One phase was added, **33a** (stubs on
a List); 34 now brings in the rooms' PDF lists, 20 builds the step rail and 17a a surgeon at more than
one room; the rest changed in place (see "Placement notes for the 2026-11-04 working-decisions update"
under Sequencing rules).

The plan was updated again on 2026-11-10 (catalogue `efe123c`) for Donald's contract model decisions
of 5 November (D1 to D11, and points 12 to 27 the same day, made for the build and not yet confirmed
by AA or Greg, so every item whose substance changed went to Verify) and his meeting with Ben and
Vanessa that day ([change log](../../../requirements-board/requirements/changes/2026-11-05-flat-contract-model-and-ben-vanessa-meeting.md);
notes AR-59 and AR-60; the proposal snapshot
[AR-58](../../../requirements-board/requirements/artifacts/AR-58.md), whose working copy is
[contract-model-proposal.md](../contract-model-proposal.md)). That update rebuilt EP-04 as the **flat
Contract model**: one Contract per priced item, with no Contract lines, no versions and no staged
changes (US-04.2.4, US-04.1.6 and US-04.2.10 Retired), edited in place with an audit trail, Active
or Disabled, held by a shared **Party** and billing either its holder or the payer on the Booking;
five pricing kinds, of which only a fixed price is dated, through backdatable **price ranges**; AA's
**specialties** (a surgeon holds one or more, a Contract none or more) and **funding tags** (SXAP,
HNZ, ACC; ACC is a tag, not a kind of Contract); the **step rail decided** (where the invoice goes,
then Payment type or the hospital's funding tag, then the Contract by typing, with No contract · RVG
pinned first and, for every destination, an open-price fallback through "Other price"; the Booking's
funder only marks a path "Suggested"); a Procedure's price following its Contract until a typed
price, a prepayment invoice or AUTHORISED holds it; the RVG code, times and modifiers asked only on
RVG kinds; the anaesthetist's override only on RVG Contracts that allow it; and a prepaid Contract
always billing the payer (OQ-73 back at Confirm). It answered OQ-131 (D77: in-place edits and price
ranges), OQ-100 (D34: schedule upload and export are Future Work) and OQ-130 (D73: an admin's edit to
the invoice description always wins), and opened OQ-132 to OQ-138. From the meeting: the hospital's
procedure text replaces the rooms' (the original kept in the change history), a change history
screen on each Booking (US-02.5.8), out-of-hours Lists (US-01.1.6, Confirmed, design still to do), a
proposed A and B split of a session (US-01.1.5), the price shown to the anaesthetist (US-03.3.10), a
Booking total for the office (US-03.1.10), a help desk (US-15.0.8) and pre-op consults in AA's room
(US-03.7.4). Greg's v6 documents (AR-28, AR-29 and AR-30) are Retired: AR-61 is the flat ERD, and no
phase cites them as current. The changed items were re-graded (Contradicts 116 to 115, Matches 65 to
66; 310 in scope) and the delta and reverse check redone (new deltas DM-63 to DM-66; DM-16 and DM-57
no longer held; new findings RV-40 and RV-41; RV-12 no longer listed). Three phases were added:
**18a** (specialties, funding tags and the open-price fallbacks), **21a** (RVG detail by pricing kind,
completion and office review, split from 21) and **32c** (out-of-hours Lists). 18, 19a, 20, 20a, 21,
24, 25, 27 and 42 were reworked, and the rest changed in place (see "Placement notes for the
2026-11-10 update" under Sequencing rules). Three units are parked: the A and B split of a session
(US-01.1.5 and DM-65, Proposed: one List per Slot stands until it is agreed) and the pre-op consult
in AA's room (US-03.7.4, on OQ-138, which gives nothing to build a default from).

The plan closes every verified gap in the [gap analysis](GAP-ANALYSIS.md) but the three parked
units: 229 gap items, 45 data-model deltas (DM) and 37 reverse findings (RV). Per-gap detail is in
[epics/](epics/), the machine-readable set in [gaps.json](gaps.json), and the code index in
[analysis/](analysis/) (prototype maps, [data-model delta](analysis/domain-model-delta.md),
[reverse check](analysis/reverse-check.md)).

There are fifty phases, numbered from 14 (about 91 sessions in all). Phases added in updates
carry a letter suffix (15a, 15b, 17a, 18a, 19a, 19b, 20a, 21a, 27a, 32a, 32b, 32c, 33a, 38a, 38b, 39a, 39b, 40a, 43a) so they sit where
they run. Each one is sized for **one focused Claude Code session (two at most) with one coherent
deliverable**, like the originals, and has a plan in `phases/phase-NN-<slug>.md`. Every phase leaves
the app green, demoable and fully migrated, because the prototype is shown in live workshops between
phases. **Built:** 14, 15, 15a, 15b, 16, 17 and 28 to 32 (the Schedule track ran ahead of the
Contracts track while the pricing requirements settled). **Next:** 32a, then 32b and 38a, then 32c,
then the Contracts track from 18. The 2026-11-02 update touches built 17 (US-01.3.6's tier wording) and 32
(US-01.4.5's availability-only criterion now names tiers); both still Match, and the follow-up is
32a's and 32b's. The 2026-11-04 update touches built 17 (US-13.6.1 is now Contradicts: a room may
be held with no email; 17a follows it up; FT-13.6 and US-13.6.2 now Match) and built 15a
(US-13.7.1's list drops the insurer warning; 21 removes 15a's stale sample text naming it). The
2026-11-04 working-decisions update touches built 17 again (FT-13.6, US-13.6.1 and US-13.6.2 are
Contradicts: a surgeon can be at more than one room; they stay on 17's covers and 17a follows them
up), the original build's in-app "Run payables" payout (FT-10.2 is Contradicts: Xero makes the
payment; 37 follows it up) and built 14's direct Surgeon PDF ingest (34 sends the rooms' PDF rows
through the matching screen instead). The 2026-11-10 update touches built 17 once more (FT-13.6 and
US-13.6.2 now give each surgeon one or more specialties, required; they stay Contradicts on 17's
covers and 18a follows them up beside the new US-13.6.6) and built 28 (US-01.1.1 gains a notes
paragraph only: one List per Slot stands; the out-of-hours List is 32c's and the A and B split is
parked); built 16's EP-10 and FT-10.1 changed in wording only.

The plan was updated again on 2026-11-10 for the meeting with AA's accountant
([change log](../../../requirements-board/requirements/changes/2026-11-10-aa-meeting-with-accountant.md),
catalogue `fbdd555f`). Little was decided: the posting design, the weekly cycle and the controls wait
on Greg and Sam's process maps, so the plan builds nothing from the meeting's proposals and leaves
those parts as open gaps for a later update. 13 items were re-graded with no verdict moving; the new
US-13.2.4 (reconciliation status at a glance) joins 37, and 27a and its neighbours drop "journal
transfer" (see "Placement notes for the 2026-11-10 accountant update" under Sequencing rules). Built
16's US-09.1.1 and US-10.2.1 gained notes and technical discussion only and still Match or Contradict
as before.

## Owner decisions

These readings shape what a phase delivers, not just its labels. Each is a question on the
Requirements Board (the OQ named in its row). **Nine were answered at the 2026-10-01 meeting with
Greg (D1 to D8, D10) and fourteen more at the 2026-10-02 meetings (D12 to D25)**; D42 to D46 record
questions answered on 2026-10-07 and 2026-10-08. The 2026-10-20 update re-read every row against the
14, 16 and 19 October answers and the consistency review: **D11, D26, D27, D32, D33, D38, D39, D40 and
D41 are now answered**; D2, D3, D6, D9, D12, D13, D16, D17, D20, D37, D42, D43 and D45 are superseded
or extended in whole or in part (each row says how, with the old reading struck through); D50 and D58
to D64 record the other answers the phases now build; and **D47 to D49 and D51 to D57** are new open
questions that gate an unbuilt phase, each with the default its phase builds. The phases they gate
build the answer, not a default. The 2026-11-02 update (catalogue `7cd7802`) re-read every row
against the 27 and 28 October meetings and the 29 October typed decisions: **D30, D35, D47, D48, D49,
D54, D56 and D57 are now answered** (D57 the opposite way to its default: prepaid Procedures are left
off the final invoice, not netted), **D55 is answered in part**; D2, D6, D11, D13, D20, D23, D28,
D29, D31, D38, D39, D42, D50 to D53 are extended, narrowed or reopened in part (each row says how);
D65 records OQ-117's answer; and **D66 to D72** are new open questions that gate an unbuilt phase
(OQ-118 to OQ-122, OQ-124, OQ-125), each with the default its phase builds. OQ-123 (reporting on
billing practice) gates no phase: nothing is built for it. The 2026-11-04 update (catalogue
`d436947`) re-read every row against the 23 October meeting with Greg (filed late; 27 and 28
October win where they differ) and Ben's 3 November email: **D37 is now answered** (OQ-103); D28 is
answered further (OQ-93: no narrowing, the insurer-without-Contract warning dropped, the approval
number the one insurance warning and the acceptance reference); D34 and D55 gain the 23 October
notes; D35, D54 and D57 are re-dated (Donald's answers were given on 23 October and recorded on 29
October); and **D73 to D76** are new open questions that gate an unbuilt phase (OQ-130, OQ-127,
OQ-128, OQ-129), each with the default its phase builds. OQ-110 is answered with nothing to build
(US-14.2.1 is Future Work), and OQ-126 (an address book of surgeons) gates no phase: the surgeon and
rooms master data 17 built serves, and nothing more is built for it. The 2026-11-04 working-decisions
update (catalogue `a68f09b`) re-read every row against Donald's working decisions of 4 November (for
the build; not yet seen by AA, Greg, Ben or Vanessa): **D51, D53, D66, D67, D69 and D75 are now
answered**, D28 is answered in full (OQ-93 part 4) and D52's part 2 is assumed (part 1, which two
hospitals, stays open); D11, D13, D16, D38, D45, D56 and D74 are extended (each row says how; D16 by
the step rail, a working direction with no question of its own, and D74 by OQ-127's new part 5); and
**D77** is a new open question (OQ-131) that gates an unbuilt phase, with the default its phases build.
The 2026-11-10 update (catalogue `efe123c`) re-read every row against Donald's contract model
decisions of 5 November (for the build; not yet confirmed by AA or Greg) and that day's meeting with
Ben and Vanessa: **D34, D73 and D77 are now answered** (OQ-100, OQ-130, OQ-131); **D16 is decided**
(the step rail, US-04.3.8: no longer a working direction); D45 is superseded (no versions: price ranges
on a fixed price, backdatable); **D23 is back at Confirm** (OQ-73: a prepaid Contract always bills the
payer, our reading, built); D55's default changes (delivery on the Party, email or post); D2, D3, D6,
D12, D17, D26, D28, D30, D32, D33, D37, D40, D42, D47 to D50, D64, D65 and D67 are extended, narrowed
or made moot by the flat model (each row says how); **D78 to D83** are new open questions that gate an
unbuilt phase (OQ-132 to OQ-137), each with the default its phase builds; and **D84** (how an
out-of-hours List is held) was answered on 2026-11-10: a third, out-of-hours Slot the office opens. OQ-138 (pre-op consults in AA's room) gates no phase: US-03.7.4 is parked on it.
**Still open: D29, D31, D36, D52 (part 1), D55 (in part), D68, D70 to D72, D74, D76 and D78 to D83;
D23 is at Confirm, built as its reading.** Agents test themselves (see "Owner review" below): an open row's phase builds its
default, labels it provisional in the UI where the row says so, keeps it in one place so a different
answer is a small change, and logs it on the phase's "For the owner's review" list; the phase's drift
check confirms the gating answer first.

| # | Decision | Gates | Answer (or default while open) |
|---|---|---|---|
| D1 | AA fee basis and netting (OQ-02) | 16 | **Answered.** A monthly AA fee invoice per anaesthetist: fixed charges plus a charge per BCTI (for example $500 + $5 x 40), from a settings page (US-10.3.3), raised by a monthly run. The payable equals the receivable, and the fee is always a separate invoice, never netted. What the per-invoice charge counts is OQ-60, still open: build its recommendation (each BCTI once, against the anaesthetist who did it) with Greg's 2026-10-02 view (only paid invoices count), both provisional inside one pure function. The count reads one BCTI per receivable invoice, which is provisional: the catalogue's "one per procedure" is unresolved (see Sequencing rules), and on 2026-10-28 Greg floated one BCTI per payment or per weekly run (OQ-29, OQ-47, open). The weekly payment cycle (US-10.2.7, OQ-47 Proposed) is 39a's. When the monthly run happens (month end or the 20th) is OQ-112, open since 2026-10-20; 16 is built and no unbuilt phase depends on it |
| D2 | Insurer and funding source: on the Booking or the Patient (OQ-55) | 18a, 20, 21 | **Superseded 2026-10-08** by OQ-55's update and OQ-93: ~~Neither. `Procedure.insurerId` goes and nothing replaces it; no per-Booking override either (D17)~~. **Extended 2026-10-16** (OQ-55; OQ-93 answered in part): the Booking holds the insurer and the insurance approval number, taken from the source data and recorded by the office (US-11.4.3, built in 21); `Procedure.insurerId` still goes as a route (20). The Contract, not the insurance, decides who is billed. The parts still open are D28. **Extended 2026-10-28** (US-11.4.3 moved to FT-11.2; FT-11.4, US-11.4.1 and US-11.4.2 Retired): there is no insurer master, so the Booking's insurer references an insurer contract holder (18); the anaesthetist may also change the approval number on the day (21). **Extended 2026-11-05** (OQ-55; Donald's D2 and D7): the Booking's insurer or funder is a Party (18) and only marks a path "Suggested" on the step rail, never narrowing (US-04.3.10, built in 21); SXAP, HNZ and ACC are funding tags on Contracts (18a), not on the Booking |
| D3 | Ranged base codes: drop the published-range bound (RV-10, OQ-56) | 19, 19a, 20 | **Answered.** The anaesthetist may enter any base units. An out-of-range entry is accepted and raises an after-procedure warning for the office (15a's routine). No hard bound (the v6 design keeps it). **Superseded 2026-10-16** (the base-unit source) by OQ-88 and OQ-62's updates: ~~the starting base units resolve from the Contract line, then the procedure's own figure, then its RVG group~~ the starting base units come from the Contract line where the line states them, else the RVG group, and from then on are the Procedure's own value (19a; there is no procedure layer). How a range is held is OQ-101 (D35). **Superseded in part 2026-11-05** (OQ-62 overtaken; there are no Contract lines): ~~from the Contract line where the line states them, else~~ the starting base units come from the RVG group alone; a Contract states no units of its own, only a default RVG code that fills the Procedure's RVG code when it is empty (19a, US-04.2.18) |
| D4 | Child as billable party: block or warn (OQ-54) | 21 | **Answered.** A mild, clearable warning on the to-do list only. No block. **Superseded 2026-10-08** (wording) by US-11.2.4 and OQ-54's update: ~~a child who is the billable party~~ the child is the **payer on the Booking** (prefilled from the patient, editable by the office or the anaesthetist to a guardian); the warning prompts a check of the guardian's details, and there is none when a guardian or an organisation pays. 2026-10-28 (US-11.2.4): ~~a hospital~~ a contract holder paying raises none, and the check is of the guardian's email or postal address |
| D5 | Hard prepayment completion gate (OQ-57) | 15a, 27 | **Answered.** No block; a clear warning in both apps. 15a removed the gate and its audited override (session 1, built); 27 strengthens the warning as the procedure date nears |
| D6 | Who raises the prepayment invoice, and when (OQ-58) | 27, 27a | **Answered**, then **superseded 2026-10-08** (the amount) and **2026-10-16 and 2026-10-19** (the trigger and the timing) by OQ-25, OQ-76, OQ-80 and US-06.3.1: ~~the system generates it at setup when a Procedure matches the anaesthetist's prepaid list, creating the ledger pair and the draft Xero pair, and holds it until an admin approves and sends it~~. New reading: the office picking a Contract flagged prepaid starts the prepayment (D64); the amount is that Contract line's price, in full (D27); the invoice is generated when an admin approves it on the screen where outgoing invoices are approved, creating its pair (a receivable from the payer on the Booking and a payable to the prepay holding account) and the draft Xero pair, and is then sent with a standard letter (41); a later submit does not invoice it again; after the procedure nothing is invoiced or credited automatically (41). **Extended 2026-10-28** (US-06.3.1): the approval is an optional step AA can switch off, and prepayment invoices then go out without anyone approving each one (27 builds the setting, on by default); its payable is the AA Holding account (D38) and its payer whoever the Contract bills (D23). **Extended 2026-11-05** (Donald's D9; US-06.2.2, US-06.2.6, US-06.3.1; AR-58 A16): ~~the amount is that Contract line's price~~ the amount is the Procedure's price when the invoice is raised (the fixed price's range in force, or the amount typed on Prepaid · Fixed price), above zero, then read-only for everyone; the payer is always the person on the Booking (D23) |
| D7 | Can an anaesthetist hand a List on without office confirmation (OQ-39)? | 32, 32a | **Answered.** Yes. The anaesthetist returns their own List to the office (it becomes a Draft List) or moves it into a colleague's free session, with no acceptance and no office confirmation. Who is told is answered too (D15). A single Booking can be moved as well (US-01.4.7, 32a). Since 2026-10-07 the anaesthetist sees no preference prompt on their own move (D44). Since 2026-10-19 a single Booking moves only to a colleague free in that Slot, as a new List (OQ-85, D61). Since 2026-10-29 the colleagues offered are listed by availability alone (OQ-113, D54) |
| D8 | Receivables ageing and an "Overdue" view (RV-35, OQ-59) | 38 | **Answered.** A flat outstanding list, oldest first, with no buckets, no age chips and no Overdue view |
| D9 | When a List leaves the anaesthetist's main view (OQ-31) | 38a | **Answered 2026-10-07** (OQ-31): ~~Open. Default: they stay, shown as "completed, unbilled" and then "billed"~~; **changed 2026-10-16** (OQ-31, OQ-26): ~~a List leaves the main view once the office has finalised it and sent it to invoicing; invoiced work is found by archive or search~~. A List leaves the anaesthetist's main view once it is AUTHORISED (not at submit, not when billed, not on payment), and its invoices show in outstanding balances straight away (19 October); until then a submitted List stays visible, less prominent, and editable (D63). Earlier work is found by search on patient name, NHI or date, with no calendar archive (US-07.4.1, US-07.4.2, US-03.1.6, US-03.1.7). 38a builds it, now before the Contracts track |
| D10 | How an additional invoice is priced (OQ-45) | 38b | **Answered.** Free-form lines (description, quantity, amount), with no Contract pricing or unit rules. Its other details are answered too (D22). Since 2026-10-07 the anaesthetist can raise one on their own Procedure too, through the same review step (US-08.6.3). Since 2026-10-16 other billing lines merge into events too (D13) |
| D11 | Can a Booking without an NHI be created (OQ-49)? | 33, 33a, 40, 40a | **Answered 2026-10-16 and 2026-10-19** (OQ-49, with Donald's typed answer): ~~Open, leaning to a mandatory NHI. Default kept: yes, flagged as provisional and on the problem list; its List cannot be authorised until the NHI is added~~. The NHI is mandatory, with no blank and no pending state: a Booking cannot be saved without one, and an incoming booking without one waits on the matching screen's unmatched queue, creating no Booking or patient, until the office adds the NHI. 33 parks such rows; 40 makes the NHI required on every form, removes the provisional patient and "NHI pending", and builds the office's view of rows waiting for an NHI; there is no authorise guard. 2026-10-28: Greg proposed an error queue and a stub on the List instead (FT-02.6); the rule stands until OQ-118 (D66) is answered. **Extended 2026-11-04** (OQ-118 answered, D66): the rule stands for every Booking, and a stub, which is not a Booking, shows in the waiting row's place on its List until the office resolves it (33a; 40's waiting view resolves through it) |
| D12 | Where base units live, and how a procedure is picked (OQ-62) | 19, 19a, 20 | **Superseded 2026-10-08** (~~one or two default RVG Contracts per procedure; one procedure master~~) and **superseded again 2026-10-16** by OQ-88 (answered, D39) and OQ-62's update: ~~two levels, RVG groups and a curated procedure list with a general procedure per group; a two-tab picker (Procedures, RVG codes)~~. New reading: the RVG groups are the one master list (a hidden key, so the same code can sit on several rows with different base units); there is no procedure list, no general procedure and no picker tabs; the procedure on a Booking is the text received; the RVG code on a Procedure is optional, picked by type-ahead showing code, description and base units, and is the anaesthetist's to set (19, 20). **Extended 2026-11-05** (Donald's D4 and D9): base units live on the RVG group alone; a Contract may name a default RVG code (19a); the RVG code is required on RVG pricing kinds and optional, for reference, on a fixed or open price (US-03.3.1, US-03.3.9; 20, 21a) |
| D13 | How pre-op and post-op events are modelled (OQ-63) | 38b, 39b | **Answered.** "Event" is the one name for everything recorded against a Procedure after setup: pre-op, post-op, additional invoices and credits. Its own element and its own invoice line; an admin can add one; an invoice tick and a "same as" billable-party tick. Recorded before the Procedure's invoice is approved it travels with that invoice, after it it is invoiced in the next run; one standard review step, no separate approval. **Extended 2026-10-16**: other billing lines merge into events (US-03.3.6 Retired); a billing event is a free-form charge or a credit on the Procedure (US-03.7.2); events can be added at any time, before invoicing too. 39b adds them and removes the BillingLine entity. **Reopened in part 2026-10-28** (OQ-121, D69): how and when an event is billed (a line on the Procedure's invoice or its own invoice; the next run or held for the Procedure's invoice) is open again, so US-03.7.2 is back at Verify; events appear on no List or schedule, and an event's billable party defaults to its Procedure's (US-03.7.1). **Settled 2026-11-04** (OQ-121 answered, D69): ~~recorded before the Procedure's invoice is approved it travels with that invoice~~; every event marked for invoicing is billed in the next run, never held for the Procedure's invoice, bundled with the same billable party's invoice where it can be, otherwise its own (38b, 39b) |
| D14 | Logical model of days, Slots and Lists (OQ-64) | 15b, 28 to 32 | **Answered.** A Slot is a status container a List goes into; every Slot is stored across the horizon (four months in current practice, configurable); statuses are a user-maintained list (fixed ID, editable label and colour), starting from free, on holiday and unavailable; "slot" is never said in the UI; marking unavailable a Slot that holds a List offers return to the office (a Draft List) or assign to a colleague. The room also settled OQ-81 parts 1 and 2 (the calendar is painted before recurring bookings; a recurring booking on an unavailable Slot becomes a Draft List); part 3, short-notice sickness, is open. Since 2026-10-07 a List's states are DRAFT (a Draft List), ACTIVE, SUBMITTED and AUTHORISED (EP-07): 15b renames today's DRAFT to ACTIVE and 31 adds DRAFT. OQ-81 part 3 was answered 2026-10-19 (D59): unavailability never leaves a List in place, and the conflict flag covers hospital closures only (32b) |
| D15 | Who is told when an anaesthetist moves their own List (OQ-65) | 32, 35 | **Answered.** A new shared notification pool in the Admin App, one for the whole team and separate from the to-do list; the move posts to it, the office sends the cover-change email from the on-demand button, and the colleague sees the List with a notice. Vanessa agreed the shared pool on 2026-10-07. What else posts, and expiry, are OQ-79. What posts to the pool and how notices end was answered 2026-10-19 (OQ-79, D58; 32b) |
| D16 | Contract identifiers and finding Contracts (OQ-66) | 18, 18a, 20 | **Superseded 2026-10-08** (~~the picker filters by procedure then hospital and always offers the default RVG Contract~~) and **superseded again 2026-10-16** by OQ-66's update and OQ-98 (answered, D32): ~~the Contracts with a line for the procedure, in one list under holder headings; from the RVG codes tab, the lines across the group~~. New reading: the picker lists Contracts, not lines: No contract (RVG) first, then the hospital's Contracts, then surgeons' or rooms' and anaesthetists' arrangements, valid on the procedure date and whose holder fits the Booking (the List's hospital, the surgeon or rooms, the Booking's own anaesthetist), with no test for a line; picking a Contract leads to its lines; an RVG code finds the lines whose default RVG code matches; one composite search on AA code, holder codes and names. The short AA code stays (US-04.1.4). The Contract catalogue filters by active or all and by holder. Anaesthetists see only their own price-list Contracts. **Extended 2026-11-04** (Donald, a working direction and a guess, no question; FT-04.3, US-04.3.4, US-03.1.9, US-04.3.3): the office picks through the **step rail** from `contract-picker-mock/`: who the invoice goes to (the patient, the List's hospital or a special contract), then prepaid or which Contract, then the price; ~~No contract (RVG) first in one list~~ No contract (RVG) is the rail's answer for an unprepaid patient invoice (whether it also shows first in a list is left to the design); the office's job ends at the Contract and an RVG-priced Contract goes to the anaesthetist for the RVG code. The filter rules above stand. 20 builds it, labelled a working direction, in one path function. **Decided 2026-11-05** (Donald's D7 and D8; US-04.3.8, US-04.3.9, US-04.3.2, US-04.1.4; OQ-66 overtaken): ~~a working direction and a guess; who the invoice goes to, then prepaid or which Contract, then the price; Contracts valid on the procedure date leading to their lines; an RVG code finding lines~~ the step rail is decided: (1) where the invoice goes, Patient, the List's hospital or Special, worked out from each candidate Contract's own settings and never stored; (2) for Patient, Payment type (Standard first, then Prepaid), for the hospital its funding tags, for Special the Contract; (3) the Contract by typing (one search over name, holder reference code, invoice description, AA code and default RVG code), No contract · RVG pinned first under Patient › Standard, never an RVG-priced Contract under Prepaid, and one "Other price" toggle that picks the destination's open-price fallback with the amount typed (partly reversing OQ-78); a step with one answer fills itself in; "Needs an invoice destination" until it is set. Candidates: Active; the List's hospital's, linked to its surgeon or anaesthetist, or unlinked AA, insurer and funder Contracts; specialties that include the surgeon's (18a); a price range in force on the date; no "show all"; the Booking's funder only marks a path "Suggested" (21). The AA code is unique, the holder reference code searchable and not unique. 20 builds it with no working-direction label, still in one path function |
| D17 | Who a Contract belongs to, and who pays (OQ-67) | 18, 21 | **Superseded 2026-10-08** (~~no per-Booking override; picking a default Contract asks for the payer's name and email~~) and **settled 2026-10-16** (OQ-67, the v6 design; OQ-78 confirmed): the Contract decides who is billed: its holder's billable party when the holder is billed (it pays AA itself), otherwise the payer named on the Booking. Holders are insurers, hospitals, surgeons or surgeons' rooms, and anaesthetists; AA holds No contract (RVG), the one default in the whole system, and is never billed. ~~First party and third party~~ are dropped: a Contract's behaviour comes from its settings (D50, D64). Every Booking names a payer, prefilled from the patient and editable to a guardian. **Extended 2026-11-05** (Donald's D2 and D8; US-04.1.5, US-04.2.1, FT-11.2): the holder is a shared **Party** (a hospital, insurer, funder, surgeon or surgeon group, anaesthetist, or AA), and each Contract says whether it bills its holder or the payer on the Booking; ~~the holder's "is billed" setting and its billable-party link~~ go, the Party being itself the billing record (18, 21). AA and anaesthetist Contracts and every prepaid Contract bill the payer (our reading; D23). No contract · RVG stays the one built-in Contract; every invoice destination also has one system-made open-price fallback (partly reversing OQ-78; 18a) |
| D18 | Contract split basis (OQ-68) | 22 | **Superseded 2026-10-05** by US-04.2.12 (Retired) and US-08.2.3: ~~each share a typed $ or %, set on the Booking, defaulting from the Contract~~. New reading: splitting is a user action on the Booking, a Split button on the Procedure's Contract line, each share typed in $ or %, with no setting on the Contract and no default from it |
| D19 | Update email: a prompt or a button (OQ-69) | 35 | **Answered.** An on-demand button on any Booking; the admin picks one or more changes from the change history; no prompt after saving or after a cover change. Templates per kind of change (US-02.3.4). **OQ-82 answered 2026-10-07:** emails stay manual in the first release, for admin and anaesthetist changes alike; sending them automatically is Future (US-02.3.5) |
| D20 | A prepaid Booking moved to another anaesthetist (OQ-70) | 32a, 41 | **Superseded 2026-10-08** (~~the move re-checks the prepayment and only the payable half of the draft pair is updated~~) and **superseded again 2026-10-19** by OQ-80 (D38), which marks OQ-70's answer superseded: ~~the anaesthetist who does it keeps the agreed amount; whether the payable is updated on a move is OQ-80 (repoint only the payee)~~. A prepaid Booking's payable is the prepay holding account, so moving its List or the Booking changes nothing in the ledger, nothing is repointed or recalculated, and the second pair pays whoever did the List (27a); a payable that is not prepaid follows the Booking to whoever does it (US-01.4.6, 32a). The office may send the patient an informational email (US-06.5.4, 41). 2026-10-27 and 28: Ben confirmed a moved prepaid Booking keeps its price (OQ-03); the new anaesthetist claims the prepaid amount; the account is now the AA Holding account and the second pair a journal transfer (D38) |
| D21 | A negative invoice with no later payment (OQ-71) | 39a | **Answered.** Handled outside the system: nothing is built (39a's carry-forward and recovery invoice go) |
| D22 | Additional invoice details (OQ-72) | 38b, 39 | **Answered.** "Desc" is description; an additional invoice can go to any billable party; a credit note option credits the original to any party, then new additional invoices are raised; a rebill can start from a copy of the original's lines (US-08.6.6). **OQ-77 parts 1 and 2 answered 2026-10-07:** the rebuilt invoices must equal the credited invoice (against the old recommendation), with the amounts split freely; the credit reverses the linked payable. Part 3 is open (D41). Part 3 was answered 2026-10-19 (D41) |
| D23 | Prepayment when the patient is not the billable party (OQ-73) | 18, 27 | **Answered.** Only where the payer on the Booking is a person paying for the patient (the patient or, for example, a guardian)~~, never an organisation~~. **Extended 2026-10-16**: in the typical prepay Contract (an anaesthetist's price list) the holder is not billed, so the payer on the Booking prepays. **Revised 2026-10-28** (OQ-73; Greg: "Just take that sentence out"): "never an organisation" is dropped: the prepayment invoice goes to whoever the Contract bills, normally the payer on the Booking and a person in practice, and the system does not forbid a prepaid Contract that bills its holder (27). **Back at Confirm 2026-11-05** (OQ-73; AR-58 A2, our reading, not one of Donald's decisions): ~~the system does not forbid a prepaid Contract that bills its holder~~ a prepaid Contract always bills the payer on the Booking, so an organisation never prepays. Default: build it (18 fixes "bills the payer" on every prepaid Contract, 27 invoices the payer), labelled once as awaiting confirmation; reopen if a holder-billed prepaid Contract is needed |
| D24 | Patient balance warning threshold (OQ-74) | 40 | **Answered.** The days count from the invoice date; a credit balance is a mild warning. The consistency review (2026-10-20) restated it: a mild alert under the threshold, a strong one over it, a mild one for a credit balance |
| D25 | RVG time rule (OQ-75) | 19a | **Answered.** A part interval is always rounded up under the RVG tiers (15 minutes for the first two hours, then 10). **Superseded in part 2026-10-08:** ~~it feeds the prepayment estimate (27)~~; there is no estimate (US-06.2.4 Retired), so the rule applies to recorded time units only, held as data in 19a |
| D26 | Does the RVG default multi-procedure rule apply (OQ-90) | 23 | **Answered 2026-10-19** (OQ-90): ~~Open. Default (its recommendation), one switchable pure function~~. Keep the RVG default as the one system-wide rule for calculated Procedures: base units on the primary only, time units on every Procedure from its own start and finish times, modifier units on the primary while the Booking total is four or fewer, else split as evenly as possible with the remainder to the primary (7 over 3 is 3, 2, 2). 23 builds it with no provisional label and no switch: `MULTI_PROCEDURE_RULE_APPLIES` and its "price each Procedure alone" branch are not built (Greg: "not correct"). No per-Contract rules. Which Procedure is primary is not settled (Vanessa's practice takes the most expensive): the primary is whichever is set, the first by default. 2026-10-29: a prepaid primary left off the final invoice still anchors the rule, so a not-prepaid additional Procedure keeps its reduction (US-05.3.1, D57). **Extended 2026-11-05** (Donald's D11; A19; US-05.3.1): the rule adjusts only RVG-priced Procedures, which share the modifier split; a fixed or open price stays its price. Where the base units go when the marked primary is on a fixed or open price is OQ-132 (D78) |
| D27 | Prepaid procedure with no price on the anaesthetist's own Contract (OQ-92) | 27 | **Answered 2026-10-16** (OQ-92): no longer arises: the office picks a Contract flagged prepaid, and its line always carries the price. ~~Default: an office warning through 15a's routine, and the prepayment invoice is held until the office adds a price~~. No warning rule is built |
| D28 | Insurance on the Booking (OQ-93) | 20, 21, 33 | **Answered in part 2026-10-16** (OQ-93, US-11.4.3): the insurer and the insurance approval number are stored on the Booking, from the source data, recorded by the office; a blank insurer is fine when the patient pays; an insured Booking with no approval number sends the office to ring the rooms; the anaesthetist can complete without it; insurance never decides who is billed. ~~Default: a simple insurance indication that suggests the insurer's Contracts in the picker~~. **Updated 2026-10-28** (OQ-93; US-11.4.3 back at Verify): the approval number stays, and its absence on an insured Booking is a warning, never a block (~~a ring-the-rooms cue~~); the anaesthetist as well as the office may change it on the day (~~not the anaesthetist's job~~); the insurer references an insurer contract holder (no insurer master, D55). **Answered further 2026-10-23** (filed 2026-11-04; Donald and Greg, which the 28 October record had called open): insurance does not narrow the Contract list (20: an insurer holder's Contracts fit every Booking and the Booking's insurer filters nothing); ~~a soft, clearable review warning when an insurer is named but no insurer Contract is chosen~~ is dropped ("We've said that doesn't matter at all"; US-07.2.2, US-13.7.1), so nothing matches the insurer against the Contracts (21, and no hint on 33's rows); the missing approval number is the only insurance warning, shown to the office (to-do list and review) and to the anaesthetist viewing the Booking (21, built as answered); the design's insurance acceptance reference is the approval number (one field). ~~**Still open:** whether the anaesthetist sees the number itself or only that it is approved. Default: the anaesthetist sees and edits the number, in one place, labelled provisional~~. **Answered 2026-11-04** (OQ-93 part 4, Donald for the build): the anaesthetist sees the approval number where the Booking holds one and may change it on the day; it is not needed to complete (US-11.4.3, US-03.6.1). 21 builds it with no provisional label. **Extended 2026-11-05** (Donald's D7; A42; US-11.4.3, US-04.3.10): the Booking names its insurer or funder as a Party; insurance never removes a candidate but marks one path "Suggested" (21); the missing-approval-number warning applies only to an insurer (NIB, Southern Cross Health Society), not to ACC or Health NZ (our reading) |
| D29 | Modifiers: the age bands, and no ASA pre-fill (OQ-95) | 19b | **Open, narrowed 2026-10-20** (OQ-95; Donald's typed decision): no modifier is locked. The age modifier (A1, A2) and any modifier a code's base units include are pre-applied and shown selected (an included one at 0 units), and the anaesthetist can remove them; nothing pre-fills from ASA or a procedure default. ~~Whether anything is pre-applied at all is Ben's open doubt.~~ **Part 2 answered 2026-10-27 and 28** (Ben: the age modifier is easy and showing the included positioning modifiers pre-selected at 0 is "a neat solution"; Greg: "overkill", but leave it in; US-05.1.4 and US-05.1.5 Agreed): the age and included modifiers are pre-applied and nothing else is pre-filled, so there is no switch. **Still open** (part 1): the age bands and stacking. Default (its recommendation): the patient's age on the procedure date, inclusive lower bounds as printed, no age modifier on the age-split base codes H6b and P2, the bands in one rule; no stacking limit (a policy matter) |
| D30 | Can the price be changed on a prepaid procedure (OQ-96) | 18, 24, 27, 41 | **Answered 2026-10-28** (OQ-96, Ben by phone): ~~Open, wider since 2026-10-19 (the v6 editable prepaid price, the directors' by-hand rule, the holding account, a move and an override on one procedure). Default: the price stays the prepaid amount and is locked; any difference raised by hand~~. No: a prepaid Contract is never editable by the anaesthetist and cannot also carry the editable setting (18 refuses it; US-06.4.1's criterion); any difference is a second invoice or a credit raised by hand (38b, 39, 41); the office can still change any price, which raises no difference by itself (24). Built as answered, no provisional label. **Narrowed 2026-11-05** (Donald's D9; A16 and A17, our readings; US-05.4.2, US-06.2.2, US-06.4.1): a prepaid Contract cannot carry the override; ~~the office can still change any price~~ the office can change a prepaid price only until its prepayment invoice is raised, after which it is read-only for everyone ("Use a credit or additional invoice"); only the office moves a Procedure onto or off a prepaid Contract (20, 24, 27) |
| D31 | Credit note for part of a prepayment (OQ-97) | 41 | **Open.** Default: a credit note for a stated part of a prepayment invoice is allowed, reversing the same amount of the linked payable (the AA Holding account's, or the anaesthetist's after the transfer); credit in full and rebill (39) stays the route for corrections. ~~v6 invokes a refund for a lowered prepaid price without saying how; the directors' rule stands until OQ-96~~: OQ-96 is answered (D30), so a by-hand credit is the route for a lesser job, and v6's refund for a lowered prepaid price is not adopted |
| D32 | Plain RVG Contracts of a holder (OQ-98) | 18, 19a, 20 | **Answered 2026-10-16** (OQ-98): a Contract may hold no lines, and selection offers every Contract valid on the date that fits the Booking's context, with no test for a line. ~~Default: a holder's plain RVG Contract has no lines and applies to every procedure at RVG pricing~~. A Contract with no lines prices at RVG (the anaesthetist's unit value, or the rate or discount set on the Procedure). 18 allows it, 19a seeds them, 20 offers them. **Moot 2026-11-05** (no lines): a plain RVG arrangement is one Contract of an RVG pricing kind, offered where it fits the List and its specialties match (18, 20) |
| D33 | Booking set up without a matched procedure (OQ-99) | 20, 21a, 33 | **Answered 2026-10-16** (OQ-99): there is no procedure to match; at setup the office identifies who pays (holder, then Contract, then line), and the RVG code is optional and the anaesthetist's. ~~Default: the office may leave the procedure blank at setup or set a group's general procedure; a procedure is required before the anaesthetist can mark the Booking complete~~. Completion needs a Contract, not a procedure or an RVG code (US-03.6.1, 21). **Extended 2026-11-05** (Donald's D9; A48; US-03.6.1, US-03.3.9): completion needs a Contract; on RVG pricing kinds the RVG code, times and a completed modifiers step; and a price, not "Needs a price". Built in 21a, split from 21 |
| D34 | Is a Contract schedule upload needed for the first release (OQ-100) | 42 | ~~**Open**~~ (Greg's position moved: header and lines, a staged review, Alter or Replace). Default (its recommendation): the first release is a developer-run seed load plus office screens, every Contract edit staged and reviewed on 25's dashboard as the second-person check on screen; no in-app Contract schedule upload (US-04.2.13 is Future Work). 2026-10-23 (filed 2026-11-04): an update for 23 October is added and the owner is now "Donald to ask Ben and Vanessa"; the default stands. **Answered 2026-11-05** (OQ-100, Donald's D10): no. Schedule upload and Contract export and re-import are Future Work (US-04.2.13), and staging goes with them (US-04.1.6 Retired, ~~every Contract edit staged and reviewed on 25's dashboard~~); the first release keeps the developer-run cutover load and office screens (42), Contracts edited in place and audited (18). Ben and Vanessa's wish for a safe copy outside the system is recorded with Donald's view that the export covers it. Built as answered |
| D35 | How an RVG base unit range is held (OQ-101) | 19, 20 | **Answered 2026-10-23, recorded 2026-10-29** (OQ-101, Donald's typed decision): ~~Open (v6 holds one required base-units figure per group). Default (its recommendation)~~: each RVG group row holds a starting figure and, where the guide prints one, the published range, and the anaesthetist is shown the range when choosing the exact value (US-05.1.1, US-03.3.1); they may pick any value, with an out-of-range warning for the office (D3). 19 holds it, 20 shows it; no provisional label. Modifier ranges are not covered (US-05.1.5) |
| D36 | Names for preference lists and priority tiers (OQ-102) | 17, 32b | **Open.** Default: "Not preferred" and "Preferred" for the pairings, and plain tier labels, Tier 1 to Tier 4 with Tier 4 the default, until AA picks names; one label set. 2026-10-19: Ben's ranking (directors, shareholders, non-shareholders) is the order available colleagues are listed in, ordering only; 32b adds the preferred pairing to the office's order. 2026-10-29: tiers and pairings order the list for the admin team only (OQ-113, D54) |
| D37 | Which description goes on the invoice (OQ-103) | 19a, 20a, 22, 27, 33, 35 | **Retitled 2026-10-16** (was "Invoice wording for a group's general procedure"): the general procedure falls away with the procedure master (D12), so ~~each general procedure is named by section, tier and code, and office review flags a Procedure left on one~~ is withdrawn. **Answered 2026-10-23** (filed 2026-11-04; Greg's "series of overriding defaults", confirmed by Donald on 4 November, not yet put to Ben and Vanessa): ~~Open. Default: copied from the Contract line's description where there is one, else from the Booking's description, editable by the office at review; for an RVG-only pick the Booking's description~~. Each Procedure's invoice description (US-08.4.6, now Agreed) starts as the surgeon's rooms' description; the hospital's description replaces it whenever one arrives (until then, or if none arrives, the rooms' text stays); the chosen Contract line's invoice description, where it is filled in, replaces both (US-04.2.4; a blank one falls through). The RVG code and its group play no part. AA admins can edit it at any time as free text; the received texts never change. 19a's line description is the top layer, 20a builds the chain in one helper with no provisional label, 33 applies the hospital's layer when a row brings it, 35 edits it through the same helper, 22 and 27 print it. Whether a later default replaces an admin's edit is OQ-130 (D73). **Extended 2026-11-05** (Donald's D1 and D13; US-02.5.7, US-08.4.6, US-04.2.18): ~~the chosen Contract line's invoice description~~ the chosen Contract's invoice description, where filled in, is the top default (there are no lines; 19a); the hospital's procedure text now replaces the rooms' on the Procedure (one procedure text, the replaced one kept in the change history; 20a, 33), and the invoice description follows the same order; an admin's edit always wins (OQ-130 answered, D73) |
| D38 | When a prepayment's pair is created and amended (OQ-80) | 27, 27a, 32a, 36, 41 | **Answered 2026-10-19** (OQ-80, superseding OQ-70): the pair is created when an admin approves the prepayment invoice; its other side is a prepay holding account, kept like an anaesthetist's account; a move changes nothing in the ledger; a second pair pays whoever did the List. ~~Default: created when the prepayment invoice is generated; on a move only the payable's payee is repointed (41)~~. 27 creates the pair at approval with the holding account as payee; 27a builds the account and the ~~second pair~~ release at authorisation; no phase builds a payee repoint. **Extended 2026-10-28** (US-06.5.1, FT-06.5): renamed the **AA Holding account**: an accounts payable creditor in the payables sub-ledger beside each anaesthetist (a "fake anaesthetist"), not a bank account and not a Xero ledger account (the trust account is the bank account); the second step is a journal transfer, not a new invoice or a payment, made automatically; only the system pays out of the account (the transfer or a cancellation refund). Its trigger is reopened as OQ-125 (D72), so 27a's authorisation trigger is a labelled default. **Extended 2026-11-04** (OQ-111 answered, D53): money leaves the account only by a transfer or a refund the system raises; ~~only the system pays out of it~~ the payment itself is made in Xero (US-06.5.1) |
| D39 | RVG code master and procedure master, one list or two (OQ-88) | 19 | **Answered 2026-10-16** (OQ-88): one list, the RVG groups; the procedure master goes (US-05.1.6 Retired). ~~Overtaken in part: two levels, a general procedure per group, two tabs. Open: where the system code sits~~. Each row has a hidden key; ~~whether a human-readable system code is added (US-05.1.1 note) is not settled: default none beyond the hidden id~~ **settled 2026-10-28** (US-05.1.1): the key is a unique identifier only, which the user never sees, with the RVG code and description searchable |
| D40 | Contract fixed rate, fixed price and line extras (OQ-89) | 19a, 24 | **Answered 2026-10-19** (OQ-89): no time band, add-on flag or quantity rule on Contract lines; the fixed rate is a unit rate in place of the anaesthetist's for the whole Procedure; whether the anaesthetist may change a Contract's price, rate or discount, a discount added on top included, is a flag on each Contract (OQ-107, D50). ~~Open: the time band, and a discount on top of a fixed discount. Default: no time band, no adjustment on a fixed-discount line~~. **Moot 2026-11-05** (no lines): a time-banded schedule is one fixed-price Contract per band; the rate and the discount are undated settings of the RVG pricing kinds, never edited per Procedure (A12; 19a, 24) |
| D41 | Splitting a combined invoice before it is sent (OQ-77 part 3) | 39 | **Answered 2026-10-19** (OQ-77): before the combined invoice is sent, a split is a normal admin edit; after it is sent, it is the credit and rebill (D22). ~~Default: a split asked for before sending uses the same credit and rebill once the invoice is raised~~ |
| D42 | Who maintains the anaesthetists' own price-list Contracts (OQ-91) | 19a, 27 | **Answered 2026-10-08, extended 2026-10-16.** The anaesthetist tells the office which procedures they want prepaid and at what price; the office creates and maintains their price-list Contract (flagged prepaid where wanted; ~~whether they may change its prices is the Contract's setting, D50~~); anaesthetists never create or edit Contracts in the app (US-04.2.14). How the lists reach the office is open. **Extended 2026-10-28 and 29**: a prepaid list is never editable by the anaesthetist (D30) and its lines must carry a price above zero; a fixed price on their own list is never overridden by them (OQ-117, D65, overtaking Greg's "fixed prices, but they're editable"); a surgeon's price list is the same kind of Contract, linked by practitioner ID (D48). **Extended 2026-11-05** (Donald's D1 and D6; US-04.2.14): one Contract per item, held by the anaesthetist's Party and linked to them, Payment type Prepaid, a fixed price with every price range above zero; a new item is a new Contract and a price change a new range (19a) |
| D43 | Do the supine ('a') Neurosurgery and Spine codes include P1 (OQ-94) | 19b | **Answered 2026-10-08; superseded in part 2026-10-20** (Donald): P1 is included in the base units of every Neurosurgery code H7A to H9b and every Spine code S1 to S10 and shows selected at 0 units (from the included-modifiers CSV, AR-34), but ~~it cannot be unselected~~ it is not locked: the anaesthetist can turn it off and cannot add it a second time (US-05.1.4) |
| D44 | What the blacklist warning shows an anaesthetist (OQ-43) | 17, 31, 32, 32a | **Answered 2026-10-07.** Pairing preferences are private and two-way, admin only (not preferred and preferred, US-13.6.3, US-13.6.4); admin get a soft warning when assigning or moving a List, never a block; there is no warning at all when an anaesthetist hands on their own List (US-01.4.5); the name "blacklist" goes (OQ-102, D36). 2026-10-16: Donald said the preference lists may also belong on the profile; nothing settled, they stay admin-only. A single-Booking move shows no pairing warning (OQ-85, D61) |
| D45 | Which date decides the price in force (OQ-48) | 19a, 24 | **Answered 2026-10-07, extended 2026-10-16.** The procedure date picks the Contract version. Every change, a correction or a renewal, creates a new version from a date the office chooses, never past and never backdated; only one future-dated version at a time, correctable or withdrawable until it starts; nothing deleted (US-04.2.10). 18 builds the version records, 25 the staged submit, its checks and the relink. **Extended 2026-11-04**: how the office keeps a Contract current day to day is open again (OQ-131, D77; US-04.2.10 and US-04.2.14 back to Open); the procedure date still picks the version, and the whole-Contract dated versions stay as D77's default. **Superseded 2026-11-05** (OQ-48 overtaken; OQ-131 answered, D77; US-04.2.10 Retired): ~~every change creates a new version from a date the office chooses, never past and never backdated; only one future-dated version at a time~~ there are no versions. The procedure date still decides, through a fixed price's price ranges, whose start may be in the past (US-04.2.15; the sources differ: Greg said on 23 October a Contract cannot be backdated); authorised or invoiced Procedures are never touched; any other setting changed from a date is a new Contract (19a, 24) |
| D46 | Should anaesthetists browse and pull Draft Lists (OQ-86) | 31 | **Answered 2026-10-07: no.** Assigning Draft Lists is an office job; anaesthetists never browse or claim them |
| D47 | Prepaid price when the Contract changes before the procedure (OQ-104) | 24, 27 | **Answered 2026-10-27 and 29** (OQ-104, Ben: "You would honour the money that's been prepaid"): ~~Open. Default (its recommendation)~~: a prepaid Procedure keeps the price on its issued prepayment invoice; a new Contract version does not relink it, and the version's review dashboard shows it to the office (25, 27); a non-prepaid fixed price follows the version on the procedure date (US-04.2.10). No provisional label. A Contract changed off prepaid after the prepayment is sent or paid is a separate case (US-06.3.7, OQ-119, D67). **Extended 2026-11-05** (the mechanics; Donald's D9): ~~a new Contract version does not relink it~~ nothing is relinked; a new price range does not move a prepaid Procedure once its prepayment invoice is raised, and before that its price follows the range in force (24, 27) |
| D48 | How a surgeon's fixed-price arrangement is found for a Booking (OQ-105) | 18, 19a, 20 | **Answered 2026-10-28 and 29** (OQ-105, Donald's decisions; Greg still prefers rooms as the generic model): ~~Default: a Contract held by the surgeon's rooms, linked to the surgeons it covers, offered after the hospital's Contracts~~. A surgeon's fixed-price arrangement is one Contract linked to one or more surgeons by practitioner ID, recorded with the surgeons on the contract holder (a holder may be named for the rooms, but there is no rooms filter); the office picks it from the Contract list filtered by the surgeon's and the anaesthetist's practitioner IDs, and it is offered on that surgeon's Bookings whichever anaesthetist (US-04.3.2). 18 holds the link, 19a seeds Merivale that way, 20 filters on it. **Extended 2026-11-05** (Donald's D1 and D2): each priced item is its own Contract, held by a surgeon or surgeon-group Party, linked to its surgeons and billing the payer, so it sits under Patient on the rail |
| D49 | Routine procedures as lines on No contract (RVG) (OQ-106) | 19a, 20 | **Answered 2026-10-29** (OQ-106, from the 14 and 16 October record), as the default: not in the first release; No contract (RVG) has no lines. **Moot 2026-11-05** (no lines): a routine procedure with its own price is its own Contract, found by typing; an unpriced one is recorded by RVG code on No contract · RVG |
| D50 | Can the anaesthetist depart from a fixed price (OQ-107, with OQ-16) | 18, 24 | **Answered 2026-10-19: no.** A flag on each Contract, set by AA, decides whether the anaesthetist may change its price, rate or discount (typically yes on Contracts priced from RVG units, no on a hospital's fixed price or a surgeon's fixed fee, where no discount may be added either); no reason is asked. The office can change any price at any time, as the last person to touch it, and the last change stands, neither side outranking the other (OQ-16). Supersedes the 2026-10-08 reading that only No contract (RVG) and the anaesthetist's own Contracts are adjustable. **Narrowed 2026-10-28 and 29**: two limits override the flag: a fixed price never allows the anaesthetist's override (OQ-117, D65), and a prepaid Contract is never editable (OQ-96, D30; 18 refuses the flag on it). The office's change of a fixed or prepaid price is simply the price invoiced and raises no difference by itself (24). **Extended 2026-11-05** (Donald's D9; OQ-107, OQ-117; A12, A37, A49; US-03.5.1, US-05.4.1, US-05.4.2): the override setting exists only on RVG pricing kinds and covers the price only, ~~price, rate or discount~~ never the rate or discount; on No contract · Fixed price the anaesthetist types the amount; the office changes any price until AUTHORISED, a prepaid one only until its invoice is raised (D30); every typed price on a Contract that is not open price is flagged at review beside the computed price (21a, 24) |
| D51 | Which source starts a booking, and which integration comes first (OQ-108) | 33, 34 | **Answered 2026-11-04** (OQ-108, Donald for the build, not yet seen by Ben or Vanessa): ~~Open. Default (Donald, 2026-10-20): the hospital download stays the priority intake pathway; surgeon PDF ingest stays Future Work~~. Both intake sources are in the first release, each landing in the same matching screen: the hospital download and the rooms' PDF lists, read, corrected and ingested (US-02.2.1 leaves Future Work; FT-02.2; DM-61). 33's rows carry their source; 34 builds the PDF pathway through the screen and drops the Future-scope badge on the PDF tab. Detecting Bookings removed from a re-sent List (US-02.2.3) stays Future Work |
| D52 | Are St George's and Southern Cross synced in the first release (OQ-109) | 34 | **Part 2 assumed 2026-11-04** (Donald for the build, not yet seen by AA: "both hospital integrations"): ~~Open. Default~~: the first release syncs both integrated hospitals into the matching screen with nothing applied until the office decides, delivered in the demo by an action (no schedule, sync button or last-synced time), as built. **Part 1 still open:** which two hospitals (the catalogue names St George's and Southern Cross; Ben named Forte on 27 October). Default: keep the catalogue's names, in one place, until AA says which |
| D53 | Paying anaesthetists through Xero or from the new system (OQ-111) | 26, 27a, 37, 39a, 41 | **Answered 2026-11-04** (OQ-111, Donald for the build, not yet seen by Greg): ~~Open. Already settled: trust payments are made from the new system. Default: build US-09.2.4 as written~~. Payments to anaesthetists are made in Xero's payables run; the system raises, records and tracks them and never makes the payment (US-09.2.4, FT-10.2, US-06.5.1). 37 builds the detection with no provisional label and moves the original build's in-app "Run payables" payout to the Xero simulator (FT-10.2, now Contradicts); 39a's weekly cycle approves and records; 26's bank details are master data, not a field the app pays from; 27a's transfer and 41's refund are raised by the system. That a cancelled prepayment's cash refund is also paid in Xero follows from "all payments" but was not said separately (US-06.5.2): a reading, logged for Greg, who on 28 October wanted holding-account payments made from the system |
| D54 | Anaesthetist moving their own List or a Booking: are colleagues ordered by tier (OQ-113) | 32a, 32b | **Answered 2026-10-23, recorded 2026-10-29** (OQ-113, Donald), as the default: ~~Open~~. An anaesthetist moving their own List or a single Booking sees colleagues by availability alone, never ordered by tier or preferred pairing (US-01.4.2, US-01.4.5, US-01.4.7, US-01.3.6); tiers and preference lists order the office's finders only (tier, then preferred pairing). Built 17 and 32 already match; 32a and 32b build it with no provisional label |
| D55 | How each contract holder's invoices are delivered (OQ-114, retitled; was the insurer's "accepts direct claims" flag) | 18, 21, 22, 42 | **Answered in part 2026-10-28** (OQ-114): ~~Default: the flag pre-fills the "is billed" setting when the office creates the insurer's contract holder~~. Insurers are contract holders like any other (FT-11.4, US-11.4.1 and US-11.4.2 Retired): there is no insurer master and no direct-claims flag; each contract holder carries how its invoices are delivered, an emailed invoice or another output (a portal or an API for an insurer); delivery is no longer a Contract setting. **Open:** what the other outputs are. Default: two values, email (the default) and portal, held on the holder (18) and read by the billing run (22); the insurer master, its flag and its default-Contract "Turn on" go (18, RV-39); the Booking's insurer references a holder (21); insurers are edited as holders (42). 2026-10-23 (filed 2026-11-04): nib is the only insurer AA bills directly, through a portal; how invoices reach the portal is not known. 18 already seeds nib billed with delivery "portal"; the default stands. **Extended 2026-11-05** (Donald's D2; OQ-114 partly answered): delivery is held on the **Party** (18); question 1 is settled in effect (the "accepts direct claims" flag goes, and billed or not is each Contract's setting). **Still open:** the other outputs (the nib portal, an API). ~~Default: two values, email (the default) and portal~~ New default (our reading, A32): two values, email (the default) and post, on the Party, read by 22's run; no portal value until OQ-114 names one, so nib's Party delivers by email for now and the portal-upload queue goes (22) |
| D56 | Cancelled prepayment refund: from the system or through Xero (OQ-115) | 41 | **Answered 2026-10-28 and 29** (OQ-115): ~~Default: the refund is paid out from the system and recorded, the holding-account pair reversed by a credit~~. Cancelling a prepaid Booking settles the prepayment automatically as part of the cancellation: an unpaid prepayment invoice is credited, a paid one refunded in full, paid from the system out of the AA Holding account (only the system pays out of it), the pair reversed by a credit linked to the prepayment invoice; a payment after the credit note is refunded too; how it posts to Xero is a build matter (41). **Extended 2026-11-04** (OQ-111, D53; OQ-119, D67): the system raises the refund automatically, ~~paid from the system~~ and the payment is made in Xero (a reading of "all payments", to confirm with Greg); a prepaid Contract changed after the prepayment is sent or paid is settled the same way (41) |
| D57 | Mixed Bookings: does the final invoice deduct a prepayment (OQ-116) | 23, 27, 39, 41 | **Answered 2026-10-23, recorded 2026-10-29** (OQ-116, Donald's answer; the mixed Booking was named on 23 October), the other way to the default: ~~keep US-08.2.2's netting, a visible deduction line on a Booking that mixes prepaid and other Procedures~~. Prepaid Procedures are left off the final invoice and nothing is deducted (US-08.2.2 rewritten, "Prepaid Procedures left off the final invoice"): a mixed Booking is invoiced for its not-prepaid Procedures only, an all-prepaid Booking has no final invoice, and a not-prepaid additional Procedure still takes the multi-procedure reduction (US-05.3.1). 27 builds it and removes the deduction line and its exceptions; 23's rule ranks across every Procedure; 39 has no deduction line to credit |
| D58 | What posts to the notification pool, and how notices end (OQ-79) | 32b, 21a | **Answered 2026-10-19.** Notices are active or resolved: any admin ticks one to resolve it, which hides it for everyone (who and when are kept; a "show resolved" filter brings it back); nothing expires; the same tick clears a to-do. Sources: an anaesthetist's List move, an "alert the office" with a note on a List or Booking (US-03.6.3), and, optionally, a single-Booking move. Supersedes 32's provisional keep-every-notice pool; 32b builds it, 21a shows the alerts at review (office review moved from 21 to 21a on 2026-11-10) |
| D59 | Short-notice sickness: Draft List or conflict (OQ-81) | 32b | **Answered 2026-10-19.** Unavailability, short-notice sickness included, never leaves a List in place: marking unavailable a Slot that holds a List forces a transfer or a return to the office there and then, for the office as for the anaesthetist; the conflict flag covers hospital closures only (US-01.5.2, US-01.5.4, US-01.5.5). Supersedes 30's office-recorded sickness keeping its conflict; 32b builds it. The office does not assign a Draft List onto an unavailable session until it is made available with the anaesthetist's agreement (US-01.6.3) |
| D60 | What a Slot shows after its List is moved away (OQ-84) | 32b | **Answered 2026-10-19.** Whoever moves a List, the anaesthetist or the office, is asked whether the vacated Slot becomes free or unavailable (US-01.4.1, US-01.4.3, US-01.5.5). 28 and 32 built it as a provisional default; 32b drops the provisional label and asks on every path |
| D61 | How an anaesthetist moves a single Booking (OQ-85) | 32a | **Answered 2026-10-19.** The receiver is found by type-ahead or the list of free colleagues; a Booking goes only to a colleague free in that Slot, creating a List there (never into an existing List; two Lists in a Slot are not supported); notifying the office or drafting the update email is optional; no pairing warning. Supersedes 32a's find-or-create placement and its automatic pool notice |
| D62 | Automated reschedule from an integration (OQ-87) | 33 | **Answered 2026-10-19.** Lists never move day: a Booking moved to another day is a cancellation plus a new Booking; detecting removals from re-sent snapshots is Future Work (US-02.2.3). Supersedes the matching screen's "Reschedule" change type and the S13 cross-List move |
| D63 | When the anaesthetist's edit window ends (OQ-26, OQ-17) | 20, 38a | **Answered 2026-10-16.** The anaesthetist can see and change a submitted List, its Contract included, until the office authorises it; changes are audited and seen at review; the last change stands, neither side outranking the other; AUTHORISED stays immutable. Supersedes binding convention 6's "only the office after submit" (RV-19); 38a builds it, and 20's Contract change uses it |
| D64 | Where prepaid is set (OQ-25) | 18, 20, 26, 27 | **Answered 2026-10-16** (reversing Donald's earlier board answer): prepaid is a setting on the Contract, placed by the office; nothing about prepayment sits on the anaesthetist's profile (FT-06.1, US-06.1.1, US-06.1.2 and US-12.1.3 Retired), and the GST period goes too (US-12.1.2 Retired). 18 adds the setting, 27 starts prepayment from it, 26 is the profile without them. **Extended 2026-11-05** (Donald's D4, D7 and D8; OQ-25): prepaid is fixed for the Contract's life; the rail asks "Payment type: Standard or Prepaid" under Patient; no RVG-priced Contract sits under Prepaid; an amount from outside any price list goes on Prepaid · Fixed price through "Other price" (US-06.2.6; 18a, 20, 27) |
| D65 | Price override on a fixed fee (OQ-117) | 18, 19a, 24 | **Answered 2026-10-29** (OQ-117, Donald's typed decision: "If something is a fixed fee, it doesn't allow a price override"): a fixed price never allows the anaesthetist's price override, whatever the Contract's editable flag says, their own price list included (US-05.2.5, US-05.4.2, US-04.2.14, US-04.2.2, US-03.5.1); only the office's price change can change a fixed price, and the changed price is simply the price invoiced. 24 builds it in the anaesthetist's gate; 18's editable setting and 19a's price lists say so. **Extended 2026-11-05** (Donald's D9; A12, A37): the override exists only on RVG Contracts where the Contract allows it, so a fixed price never carries it; the rate and discount are never edited per Procedure; the anaesthetist types an amount only on No contract · Fixed price |
| D66 | Bookings arriving without an NHI: wait at intake, or a stub on the List (OQ-118) | 33, 33a, 40 | **Answered 2026-11-04** (OQ-118, Donald for the build, not yet seen by Vanessa or Ben: "Yes, we will have stubs"): ~~Open. Default: the 19 October rule stands, with no stub on the List; FT-02.6 and DM-58 parked~~. Both: the incoming booking with no NHI still waits in 33's unmatched queue and creates no Booking (D11), and a stub, not a Booking and held on an identifier other than the NHI, stands in its place on its List, seen by the anaesthetist and the office, until the office resolves it from intake (FT-02.6, now "Stubs on a List"; US-02.6.1 to US-02.6.3; DM-58; US-02.1.4, US-11.1.4 and US-11.1.5 gain a stub criterion). The new phase 33a builds it on 33's queue; that the Booking then takes the stub's place, and what a stub shows, are our reading, labelled |
| D67 | Prepaid Contract changed after the prepayment is sent or paid (OQ-119) | 27, 41 | **Answered 2026-11-04** (OQ-119, Donald for the build), as the default: ~~Open. Default ... labelled provisional~~. Before the prepayment invoice is generated, the re-check clears the requirement (US-06.3.5, 27); after it is sent or paid, the change is handled as a cancellation of the prepayment (US-06.3.7): a credit note if sent and unpaid, any later payment refunded, or a full refund if paid, the receivable and the AA Holding account payable reversed as in US-06.5.2 (D56), then the Procedure is invoiced after the procedure under its new Contract. 41 builds it in the cancellation's one function with no provisional label; 27's office warning is the interim until 41. **Extended 2026-11-05** (AR-58 A17 and A47, our readings): moving a Procedure off a prepaid Contract after its invoice is raised is handled like a cancellation of the prepayment (refunded if paid, credited if sent), and only the office moves a Procedure onto or off a prepaid Contract (20 offers the anaesthetist none) |
| D68 | Does a prepayment invoice name the anaesthetist (OQ-120) | 27, 41 | **Open** (new 2026-10-28; Greg and Donald lean to not naming them, since a prepaid Booking may move). Default: as the catalogue keeps it until answered (US-06.3.6): the prepayment invoice and its letter name the anaesthetist as other AA invoices do, as one field, so dropping it is a small change; the moved-Booking patient email (US-06.5.4) stays optional and says only that the anaesthetist changed |
| D69 | How and when an event on a Booking is billed (OQ-121) | 38b, 39b | **Answered 2026-11-04** (OQ-121, Donald for the build, not yet seen by Vanessa): ~~Open. Default: an event approved before the Procedure's invoice is a line on that invoice; after it, or for another party, it is invoiced in the next run; labelled provisional~~. An event marked for invoicing is billed in the next billing run, through the same review step, and never held for the Procedure's invoice; it goes on the same billable party's invoice where it can be, otherwise on an invoice of its own, traceable to the Procedure (FT-03.7, US-03.7.2, FT-08.6, US-08.6.1); an additional invoice is always its own invoice (US-08.6.3). 38b builds the one rule with no provisional label; 39b's kinds use it |
| D70 | Posted invoices for payers without email (OQ-122) | 21, 22 | **Open** (new 2026-10-28). Default: a billed payer needs an email or an NZ Post postal address (US-11.2.3), and a postal address alone is accepted (21); the billing run marks such an invoice "To post" with a print view, with no posting integration (22); labelled provisional. Greg's "different payer" tick (the payer uses the patient's details unless ticked) is built as the payer control (21) |
| D71 | The app as the anaesthetist's source of truth instead of emailed Lists (OQ-124) | 35 | **Open** (new 2026-10-28; Ben would stop emailing Lists, Vanessa did not respond). Default: build as written: emailed Lists and the on-demand update email stay (US-02.3.3, manual), and the change history is as FT-02.5 and 35 have it; nothing is removed until AA answers |
| D72 | What triggers the release of a prepayment from the AA Holding account (OQ-125) | 27a, 41 | **Open** (new 2026-10-28; FT-06.4, which held it at Verify, is Retired). Already settled: the money is released once the procedure is done, automatically. Default: the catalogue's trigger, the office authorising the List (US-06.4.1, US-06.5.1), labelled provisional and kept in one place in 27a, so Greg's "confirmed and submitted" is a small change. Supersedes D38's "labelled to confirm" note |
| D73 | Does a later default replace an admin's edited invoice description (OQ-130) | 20a, 33, 35 | ~~**Open**~~ (new 2026-11-04; the order of defaults, D37, does not say). Default (its recommendation): an admin's edit is kept and a later default never replaces it, whether the hospital's description arrives late (33) or a Contract line is chosen or changed (20, 35); the office sees that a newer received description has arrived, and can choose to use it. Built in 20a's one helper, the invoice description recording where its value came from (the rooms', the hospital's, the line's or an admin's edit), labelled provisional. **Answered 2026-11-05** (OQ-130, Donald's ruling for the build): an admin's edit to the invoice description always wins: neither a late hospital description nor a Contract chosen or changed replaces it (US-08.4.6's new criteria). 20a builds it in the one helper with no provisional label (~~the line's~~ the Contract's invoice description is the top default); the origin marker stays, and the cue that a newer received text has arrived is kept as a convenience that never replaces the edit (33, 35) |
| D74 | Practice manager and PA contacts: by room or by surgeon (OQ-127) | 17a, 35, 40 | **Open** (new 2026-11-04; US-13.6.5 is Open, from Ben's wish, nothing agreed). Default: a contact (name, email, practice manager or PA) is held on the surgeons' room and may be named for one surgeon of that room, which covers both the shared inbox and the ENT practice where each surgeon has their own PA; the surgeon's profile shows the room's contacts and those named for that surgeon; contacts are entered by the office (Ben does not hold them), a few seeded; no surgeon's own email field. The office's emails keep the catalogue's address: 35's update email goes to the room's contact email and 40's NHI request to it else the hospital's, empty when none is held, read through 17a's one helper. Labelled provisional, the owner in one field so moving contacts to the surgeon is a small change. **Extended 2026-11-04** (OQ-127 part 5, new with OQ-128's answer, D75): which room's contacts apply to a Booking when a surgeon belongs to more than one room. Default: a surgeon's rooms are ordered, the first their main room; the profile shows the contacts of every room (and those named for the surgeon); 17a's helper returns the main room's email for 35's and 40's To and also the surgeon's other rooms, which the drafts offer for the office to switch to; labelled provisional in that one helper |
| D75 | A surgeon at more than one room (OQ-128) | 17a, 42 | **Answered 2026-11-04** (OQ-128, Donald for the build, not yet seen by Vanessa: "Our system doesn't need to assume a surgeon at one room"): ~~Open. Default: one room per surgeon; 42's load result notes the other room~~. A surgeon belongs to one or more rooms (FT-13.6, US-13.6.1's new "More than one room" criterion, US-13.6.2). Built 17 gave each surgeon one room: its FT-13.6, US-13.6.1 and US-13.6.2 are Contradicts and stay on its covers; 17a makes the room a list (the four two-practice surgeons of the seeded directory at both rooms), and 42's surgeons sheet loads a surgeon at each room listed. Which room's contacts apply is OQ-127 part 5 (D74) |
| D76 | HPI CPNs for the starting surgeon list (OQ-129) | 42 | **Open** (new 2026-11-04; Ben's list carries no HPI CPNs or registration numbers, and some rows have no title or surname). Default: the catalogue as written: a surgeon's HPI CPN stays required (US-13.6.2), so 42's seed load rejects a surgeon row with no HPI CPN, or with a first name only, and lists it with its reason; the demo's fictional sheet carries invented CPNs on most rows and a few bad rows to show the rejection. One validator, labelled provisional, so "load now, require it before the first Booking" is a small change |
| D77 | How the office keeps a Contract's prices and dates current (OQ-131) | 18, 19a, 25 | ~~**Open**~~ (new 2026-11-04, for Vanessa; US-04.2.10 and US-04.2.14 back to Open; FT-04.2 notes it): whole-Contract dated versions, a date on each line, or editing in place with an audit trail. It does not change how a Contract is picked (20). Default: keep what is planned: whole-Contract dated versions (18's records, 25's staged change, submit and relink, D45), labelled provisional once and kept in the one version module in `aa-prototype/src/domain/billing`, so a date per line or an audited edit in place is a contained change; no line dates are built (D40). **Answered 2026-11-05** (OQ-131, Donald's D1, D4, D5, D6 and D9; Vanessa: "That's what I'd love to do"): ~~whole-Contract dated versions, labelled provisional~~ no versions and no lines: each priced item is its own Contract, edited in place and audited (18); a fixed price changes by adding a price range, whose start may be in the past (19a); any other setting changed from a date means a new Contract, the old one disabled. Whether the office sees a list of the Procedures affected is OQ-133 (D79). Built as answered: 18's version records, 25's staged change, submit and relink, and the version module are not built |
| D78 | Base units on a mixed Booking whose primary has a fixed or open price (OQ-132) | 23 | **Open** (new 2026-11-05, Donald, from the contract model proposal). Default (the question's interim, option 1): base units stay on the marked primary only, so on such a Booking none are billed; the RVG-priced Procedures carry their time units and share the modifier split (A19); labelled provisional inside 23's one pure function, so "the first RVG-priced Procedure takes them" or "mark another primary" is a small change. That modifiers of four or fewer on a fixed-price primary may be billed nowhere (FT-05.3 still splits across every Procedure) is logged with it |
| D79 | A list of the Procedures a backdated price range or a dated change affects (OQ-133) | 18, 19a, 24 | **Open** (new 2026-11-05, for Vanessa; no recommendation). Default (the question's interim): no list; the office's review catches them. A new range re-prices every un-authorised, unedited, un-prepaid Procedure on the Contract (19a, 24), and Procedures dated after a dated change stay on the old Contract until someone moves them (18). Nothing provisional to label; logged |
| D80 | Do overdue alerts include the outstanding prepayment alert (OQ-134) | 27, 40 | **Open** (new 2026-11-05, Donald). Default (its recommendation, option 1): two rules, shown together: 27's escalating prepayment warning stays as written (US-06.3.2) and 40's patient balance alert shows beside it on the Booking; each rule in one place, so one combined set of overdue alerts is a small change |
| D81 | A review flag for a Disabled Contract on an open Procedure (OQ-135) | 18, 20, 21a | **Open** (new 2026-11-05, for Vanessa; no recommendation). Default (AR-58 A14): no flag: a Procedure already on a Disabled Contract keeps it and bills as normal; disabling hides the Contract from the step rail and the default Contract list only (18, 20); the flag would be one more entry in 21a's review-flag list |
| D82 | Holder references the Booking must collect (OQ-136) | 21, 24 | **Open** (new 2026-11-05, for Vanessa; no recommendation). Default (AR-58 A21): the Booking keeps only the insurer approval number; no Contract setting names holder references, so the earlier "the Contract names the holder references it needs" (DM-16, no longer held) is not built (21) and the pricing kinds carry none (24) |
| D83 | Support hours: an 8:00am or 8:30am start (OQ-137) | 43a | **Open** (new 2026-11-05, Donald). Default (pending its recommendation's internal check): the help desk panel shows the hours as one configurable string, Monday to Friday 8:30am to 5:30pm NZT as the RFP response offers, labelled provisional, so an 8:00am start is a one-line change; outage handling is narrated, not built |
| D84 | How an out-of-hours List is held (US-01.1.6; no question of its own) | 32c | **Answered** (Donald, 2026-11-10, a working session). An out-of-hours List sits in a third kind of Slot, an out-of-hours Slot after the PM session that the office opens for an anaesthetist on a day (any day from today, today included, within the horizon; never generated, never opened by the anaesthetist), at most one a day holding at most one List, 18:00 start by default and overridable; once open it is a full session (starts Free, marked available or unavailable, offered by the availability finders, a booked one marked unavailable goes to the office or a colleague), the office assigns a new List or a Draft List into it (a Draft List can be for the out-of-hours session) and can close one holding no List, and its Bookings are captured, submitted, authorised and billed as on any List (no after-hours pricing, our reading). **Supersedes** the working design Phase 32c first built: ~~a List with its own start time held outside the AM and PM Slots, ignored by the availability finders and the conflict rules~~ |

## Tracks

```
Foundations   14 demo-trigger registry · 15 Card becomes Booking · 15a warnings & to-do list
              ─▶ 15b Copy and photo capture out, DRAFT becomes ACTIVE                     (all built)
Money fix     16 AA fee as a monthly invoice                                               (built)
Schedule      28 Slot/List split ─▶ 29 availability ─▶ 30 conflicts ─▶ 31 Draft Lists
              ─▶ 32 own List moves & notification pool                                     (built)
              ─▶ 32a single-Booking moves ─▶ 32b unavailability, notices that resolve, alert the office
              ─▶ 32c out-of-hours Lists                                       (after 32b and 38a)
List approval 38a edit until AUTHORISED, main view & search                      (after 31; before 20)
Contracts     17 surgeons, rooms, preferences & tiers (built) ─▶ 18 Parties & flat Contracts
              ─▶ 18a specialties, funding tags & open-price fallbacks ─▶ 19 RVG groups & type-ahead
              ─▶ 19a price ranges, the Contract's own fields & starting values ─▶ 19b modifiers
              ─▶ 20 one Contract per Procedure, the step rail ─▶ 20a procedure text & invoice description
              ─▶ 21 payer, insurer or funder & who is billed ─▶ 21a RVG detail by pricing kind,
              completion & review ─▶ 22 invoice presentation & split ─▶ 23 primary & multi-procedure rule
              ─▶ 24 pricing kinds & the price until held ─▶ 25 Contract history & AUTHORISED lock
                                                            (19 and 21 after 15a; 20 after 38a; 21a after 32b)
Profile       26 anaesthetist profile & bank details                     (needs nothing unbuilt)
Rooms         17a rooms without an email, surgeons at more than one room, practice manager & PA contacts
                                          (after 17, built, and 18a; before 35, 40 and 42)
Prepayment    27 prepayment lifecycle ─▶ 27a AA Holding account & transfer      (after 25)
Intake        33 matching screen ─▶ 33a stubs on a List ─▶ 34 sync, rooms' PDF lists & S1 rebuild
              ─▶ 35 explicit save & update email                  (33 after 20a; 35 after 32)
Money         36 internal ledger ─▶ 37 Xero resilience & monitor │ 38 web accounts & monthly GST report
              │ 38b events & additional invoices ─▶ 39 credit notes & rebill
              ─▶ 39a weekly payment runs                                        (after 37, 39)
Capture       38b ─▶ 39b pre-op, post-op & billing events
Patients      40 mandatory NHI, balance warning, patient view ─▶ 40a NHI lookup & identity
Late          41 prepayment letter, cancellation & differences by hand ─ 42 reference data & loads
              ─ 43 scale & privacy ─ 43a sign-in & ease of use
Demo          44 demo guide rewrite & final sweep
```

Run order from here: 32a, 32b, 38a, 32c, then 18 to 25 (18, 18a, 19, 19a, 19b, 20, 20a, 21, 21a, 22,
23, 24, 25), 26, 17a, 27, 27a, then Intake (33, 33a, 34, 35) and Money (36 on), with the remaining
phases as their dependencies allow. Parked: the A and B split of a session (US-01.1.5, DM-65) and the
pre-op consult in AA's room (US-03.7.4); see Parked.

## Phases

| # | Phase | Delivers | Depends on | Covers (gaps / DM / RV) |
|---|-------|----------|------------|---:|
| 14 | [Screen-contextual demo triggers](phases/phase-14-demo-trigger-registry.md) | **Built.** A shared, route-scoped trigger registry and a context hook in `src/shared`. A "Demo actions" menu in the harness bar and a PWA demo-actions sheet. Every existing Control Panel trigger re-homed to its screen; the Control Panel becomes the index. "Office authorises this List" on the PWA. Interim Future-scope badges on the HL7/FHIR tooling. First new trigger: "Simulate sign-in attempts". FT-13.5's remaining gaps close with 39 (the audit carve-out) and 43a (sign-in) | none | 1 / 0 / 0 |
| 15 | [Card becomes Booking](phases/phase-15-booking-rename.md) | **Built.** Card renamed to Booking across the model, ids, audit, seed, routes, registry and copy. Adds List-level attachments (now Retired: 20a removes them, RV-01), an optional Booking source, and Copy as a skeleton-only new Booking (Retired: 15b removed it) | none | 1 / 2 / 0 |
| 15a | [Warnings and the to-do list](phases/phase-15a-warnings-and-to-do-list.md) | **Built.** One pure warning routine with Warning records on the Booking, the prepayment gate replaced by a warning (D5). A to-do list on the Admin dashboard with Clear, a warning triangle on Bookings in all three apps, the warning visible on opening a Booking, the Day view outline down to the Booking, and no confirm step at submit. Later phases plug in their rules (19, 21, 27, 40) | 14, 15 | 4 / 1 / 0 |
| 15b | [Copy and photo capture out, and DRAFT becomes ACTIVE](phases/phase-15b-copy-and-photo-removal.md) | **Built.** Copy a Booking removed from all three apps, the store, the seed and the guide. Photo capture out of the Add a booking chooser, kept only as a badged Future-scope demo action. The List state the prototype called DRAFT renamed ACTIVE. (Its RV ids were renumbered away: see Sequencing rules) | 15a | 0 / 0 / 0 |
| 16 | [AA fee as its own monthly invoice](phases/phase-16-aa-fee-invoice.md) | **Built.** The payable equals the receivable, and a part payment releases exactly what was received. AA fee settings and a monthly run raising one AA-FEE invoice per anaesthetist (fixed items plus a per-BCTI charge, D1, counted by one pure function), shown in Admin and web Accounts. Xero pairs carry the invoice number and reference, and Xero holds no patient names. US-09.1.1's prepayment payee (the holding account) closes with 27 and 27a | 15a, 15b | 8 / 1 / 0 |
| 17 | [Surgeons, rooms, pairing preferences and priority tiers](phases/phase-17-surgeons-rooms-blacklist.md) | **Built.** Surgeon profile with one HPI CPN field, surgeons' rooms with contacts, surgeon groups and a hospital contact email. Private two-way pairing preferences, admin only (D44), and an admin-only priority tier per anaesthetist (D36), on one shared helper every office pairing path uses. Follow-ups: bank details (DM-32) in 26, preferred pairing in the office's order (US-13.6.4) in 32b, a room with no email (US-13.6.1) in 17a | 14, 15 | 7 / 2 / 0 |
| 17a | [Rooms without an email, surgeons at more than one room, and practice manager and PA contacts](phases/phase-17a-rooms-and-practice-contacts.md) | A surgeons' room held with no email or phone (built 17's US-13.6.1 follow-up), shown as such, and the specialist directory seed without its placeholder emails. A surgeon at one or more rooms, the first their main room (D75 answered; built 17's FT-13.6, US-13.6.1 and US-13.6.2 follow-up), the four two-practice surgeons at both. Practice manager and PA contacts (name, email, role) on the room, each optionally named for one surgeon (D74, provisional), kept by the office and shown on the surgeon's profile. One helper for the address the office's emails use (the main room's, the others offered; OQ-127 part 5, provisional) that 35 and 40 read. 18a's required specialties kept on the same surgeon form, profile and seed | 17, 18a | 1 / 1 / 0 |
| 18 | [Parties and flat Contracts](phases/phase-18-contract-model.md) | A Party master (hospital, insurer, funder, surgeon or surgeon group, anaesthetist, AA; billing details once a Contract bills it; delivery by email or post, D55) replacing contract holders and the Insurer master with its direct-claims flag (RV-39). Contracts as one flat priced item each (D77 answered): a unique AA code and a holder reference code, a holder Party, bills its holder or the payer (a prepaid Contract always the payer, D23 at Confirm), linked surgeons and at most one anaesthetist, prepaid fixed for life, one of five pricing kinds (rate and discount undated settings), the override setting on RVG kinds only, Active or Disabled (a Procedure already on a Disabled one bills as normal, D81), edited in place with audit and never deleted (RV-32), with save guards. No contract · RVG held by AA replacing the default Type 1s (RV-06); the ACC review flag gone; every fee unchanged | 17 | 5 / 2 / 4 |
| 18a | [Specialties, funding tags and the open-price fallbacks](phases/phase-18a-specialties-funding-tags-and-fallbacks.md) | AA's specialties list and its funding tags (SXAP, HNZ, ACC, each optionally naming its funder) in Admin Master data, audited. Every surgeon holding one or more specialties, required (built 17's FT-13.6 and US-13.6.2 follow-up; D3's list at Verify). Each Contract carrying none or more specialties and at most one funding tag; ACC a tag, not a kind of Contract. One system-made open-price fallback per invoice destination (No contract · Fixed price, Prepaid · Fixed price, one per hospital and tag, one per Special holder), kept in step automatically, never disabled or deleted | 18 | 7 / 3 / 0 |
| 19 | [RVG groups and the RVG code type-ahead](phases/phase-19-rvg-and-procedure-masters.md) | RVG groups as the one master list, reseeded from the NZSA RVG 2021 in place of the invented demo codes (RV-41) (a hidden key never shown, the same code on several rows, anatomy heading, base and modifier units, starting figure and published range, shown to the anaesthetist) plus AA's own, office-maintained and audited, with no procedure list. An optional RVG code picked by type-ahead (code, description, base units) on mobile, web and Admin. Any base-unit value accepted, with an after-procedure office warning when out of range | 15a, 18 | 3 / 1 / 2 |
| 19a | [Price ranges, the Contract's own fields and starting values](phases/phase-19a-default-rvg-contracts.md) | ContractPrice gone: every schedule item a fixed-price Contract of its own with dated price ranges, backdatable, the range in force on the procedure date giving the price (no list of the Procedures it re-prices, D79). Each Contract's holder reference code, invoice description and default RVG code. Combinations as Contracts, fee extras left to events. The anaesthetists' price lists as prepaid Contracts, every range above zero; a surgeon's arrangement one Contract per item linked to its surgeons. Starting values from the RVG group and the Contract's default RVG code. RVG time tiers held as data | 18, 18a, 19 | 6 / 2 / 1 |
| 19b | [Modifiers: the RVG table, pre-applied age and included modifiers, explanations](phases/phase-19b-modifiers.md) | The modifier master seeded from the NZSA RVG 2021 table plus AA's own. Modifiers as itemised records on the Procedure, each claimed one with a short explanation. Age (A1, A2) and the included P1 on every Neurosurgery and Spine code pre-applied and removable, never locked. The ASA card and its seeding and the absorbed-modifier refusals gone | 19a | 5 / 1 / 3 |
| 20 | [One Contract per Procedure and the step rail](phases/phase-20-one-contract-per-procedure.md) | Billing route, payment category (everywhere) and the Procedure's insurer as a route removed. Exactly one Contract per Procedure, set by the office through the **decided step rail** (D16): where the invoice goes (Patient, the List's hospital or Special, worked out from each Contract), then Payment type (Standard or Prepaid) or the hospital's funding tag, then the Contract by typing, No contract · RVG pinned first, or "Other price" picking the destination's open-price fallback with the amount typed. Candidates by status, hospital, links, specialties and the range in force, no "show all"; "Needs an invoice destination" until set. The RVG code required on RVG kinds, filled from the Contract's default, the range shown. The anaesthetist changes the Contract and RVG code through the same rail until AUTHORISED, never onto or off a prepaid Contract | 18a, 19a, 19b, 38a | 10 / 1 / 1 |
| 20a | [Procedure text, the invoice description and the Contract on each Procedure](phases/phase-20a-source-wording-and-procedure-stack.md) | One procedure text per Procedure exactly as received, never hand-edited: the rooms' text, replaced by the hospital's when it arrives, the replaced text kept in the Booking's change history (US-02.5.7). An invoice description per Procedure by a series of defaults (the rooms', the hospital's, the Contract's invoice description; never the RVG code), editable by the office at any time, an admin's edit always winning (D73 answered). Every booking screen shows the procedure text, the invoice description, the Contract (name, holder, who is invoiced, pricing basis such as "RVG less 10%" or "Other price $2,000") and the RVG code on RVG kinds. Booking and List attachments removed. Demo wording seeded from AR-35 | 20 | 5 / 1 / 1 |
| 21 | [Payer, insurer or funder, and who is billed](phases/phase-21-billable-party-and-required-inputs.md) | Who is billed decided by each Contract: its holder Party, or the payer on the Booking. A payer on every Booking (name, email, NZ Post postal address), taken from the patient unless "different payer" is ticked, editable to a parent, guardian, benefactor or family trust, with an email or postal address required when billed; the guardian override gone; a child-payer warning. The insurer or funder (a Party) and approval number on the Booking, editable by the office and on the day by the anaesthetist, who sees the number; the missing number the only insurance warning, for insurers only, not ACC or Health NZ; no other holder references (D82). The funder marking one path "Suggested" on the step rail, never narrowing | 15a, 20a | 7 / 2 / 1 |
| 21a | [RVG detail by pricing kind, completion and office review](phases/phase-21a-rvg-detail-completion-and-review.md) | What a Procedure asks for follows its pricing kind: the RVG code, start and finish times and a completed modifiers step asked and required on RVG kinds only, the form collapsing to an optional RVG code on a fixed or open price, on mobile, web and Admin. Completion as three conditions (a Contract, the RVG detail on RVG kinds, a price, not "Needs a price"; "finish", not "handover"), split from the billing validator (DM-59). Office review shows each Procedure's text, Contract and RVG code, the payer, insurer and approval number, alerts and late edits, flagging an anaesthetist's Contract change, a typed price, a Contract that no longer fits after a move (a moved Booking keeps its Contracts) and anything still needing a destination or a price; no flag for a Disabled Contract (D81) | 21, 32b | 6 / 1 / 1 |
| 22 | [Invoice presentation, delivery and the split](phases/phase-22-invoice-presentation-and-delivery.md) | Invoices issued in the anaesthetist's name with their GST number and AA as agent (DM-62; an optional GST number on the Admin anaesthetist record, wording provisional on OQ-29). Layout from the Contract (the holder's, with the BTM breakdown and the Contract's holder reference code, when it bills its holder; the patient's when it bills the payer) and GST, prices held ex GST, each line printing the Procedure's invoice description. Delivery from the Party's setting (email or post, D55) or the payer's contact: the run sends to email or marks the invoice to post, the portal queue gone. A Split button on a Procedure with typed $ or % shares replaces funderOverride. Provisional BCTI wording on the ACCPAY, one per receivable invoice | 21 | 7 / 2 / 1 |
| 23 | [Primary Procedure and the multi-procedure rule](phases/phase-23-primary-procedure-and-multi-procedure-rule.md) | Exactly one primary Procedure, with "Make primary" on every surface and the feed. The RVG default multi-procedure rule as the one system-wide rule (D26 answered) for RVG-priced Procedures only, a fixed or open price staying its price: base on the primary only (none billed when the primary is on a fixed or open price, D78, provisional), time on every Procedure, the 3/2/2 modifier split shared among the RVG-priced ones, ranked across every Procedure, prepaid included, with no switch | 19b, 22 | 3 / 1 / 1 |
| 24 | [Pricing kinds, the price following its Contract until held, and who may change it](phases/phase-24-anaesthetist-adjustment.md) | Five pricing kinds priced by one function: RVG at the anaesthetist's or the Contract's rate, RVG less the Contract's discount (its own invoice line), a fixed price from the range in force, an open price typed. A Procedure's price follows its Contract (a new range, an edited rate or discount) until a typed price, a prepayment invoice or AUTHORISED holds it, else "Needs a price"; $0 a no-charge invoice. The anaesthetist overrides the price only on RVG Contracts that allow it (never a fixed or prepaid price; the amount on No contract · Fixed price), the office changes any price until AUTHORISED or until a prepayment invoice is raised; no reason, audited, flagged at review beside the computed price. The anaesthetist sees what the price comes to as they record. The rate x time line, the Method 3 gate and the override reason gone | 21a, 23 | 13 / 2 / 3 |
| 25 | [Contract history and the AUTHORISED lock](phases/phase-25-contract-lock-at-authorised.md) | No versions, staged changes or relink (D77 and D34 answered; US-04.1.6 and US-04.2.10 Retired). A pricing snapshot per Procedure at authorise (the Contract's settings as then, the price range in force, the Procedure's values, BTM, unit rate, price, billable party and payee) that the engine prices from, "Needs a price" blocking AUTHORISED. "Regenerate from locked data" reproducing an invoice exactly after a Contract edit, a backdated range or a unit-value edit. Each Contract's history of audited edits (settings, ranges, specialties, tag) with the Procedures locked against it | 19a, 22, 23, 24 | 6 / 1 / 1 |
| 26 | [Anaesthetist profile and bank details](phases/phase-26-prepaid-settings-and-profile.md) | The anaesthetist profile as the catalogue holds it: contact details, registration, the HPI CPN and bank details (both mandatory) held in the system (master data; the payment is made in Xero, D53) and the unit value, visible to the anaesthetist on mobile and web and kept by the office. The GST period removed everywhere, the GST report left monthly. No prepaid settings (prepaid is a Contract setting) | 17 | 1 / 0 / 1 |
| 27 | [Prepayment lifecycle](phases/phase-27-prepayment-lifecycle.md) | Prepayment started per Procedure by a Contract under Payment type: Prepaid on the step rail (an anaesthetist's price-list Contract, or Prepaid · Fixed price with a typed amount above zero), invoiced to the payer (D23 at Confirm). The amount is the Procedure's price when the invoice is raised, above zero, shown to the anaesthetist and read-only from then for everyone (D30); a new price range never moves it. The invoice generated when an admin approves it (a step AA can switch off), with its pair to the AA Holding account and the draft Xero pair, then sent. Prepaid Procedures left off the final invoice with nothing deducted (an all-prepaid Booking has no final invoice). Part-paid tracking, an escalating warning shown beside the balance alert (D80), and re-checks on a change of Procedures, Contract or payer, never on a move (moving off prepaid after sending: an office warning until 41 settles it as a cancellation, D67) | 15a, 21, 25 | 12 / 1 / 1 |
| 27a | [AA Holding account and the transfer to the anaesthetist](phases/phase-27a-prepay-holding-account.md) | The AA Holding account, a payables creditor kept like an anaesthetist's account, with its balance and entries in Admin, never paid itself, money leaving it only by a transfer or refund the system raises (Xero makes the payment, D53). When the List is authorised (the trigger provisional, D72) a transfer, not a new invoice or payment, moves each prepaid amount to the anaesthetist who did the List, so a moved prepaid Booking needs no change | 27 | 4 / 1 / 1 |
| 28 | [Slot and List split](phases/phase-28-slot-list-split.md) | **Built.** A Slot record for every active anaesthetist's session across a configurable horizon, free by default, holding availability and default times (D14). A List with its own id, created on assignment and shown in place of the status. Status independent of bookings in all three apps and the finders, the admin finder ordered by tier with not-preferred pairings apart. Reassign moves a List between Slots. Follow-ups: the finder's type-ahead search (32a) and preferred-pairing order (32b) | 15b, 17 | 8 / 2 / 0 |
| 29 | [Availability calendar and status master](phases/phase-29-availability-calendar.md) | **Built.** Availability kept from a calendar on mobile and web as the Slot's own status, with days off ahead, series and single-instance edits. Slot statuses a user-maintained master list with fixed IDs, editable labels and colours, separate from the List's state | 28 | 5 / 0 / 0 |
| 30 | [Conflicts, holidays and the conflict dashboard](phases/phase-30-conflicts-and-holidays.md) | **Built.** Conflicts with a List colour change and clearing, holidays edited and deleted, a cross-date conflict dashboard, recurring bookings (DM-53). Its availability conflict and office-recorded sickness conflict are superseded (D59): 32b removes them | 29 | 5 / 1 / 0 |
| 31 | [Draft Lists and the day dashboard](phases/phase-31-draft-lists.md) | **Built.** The DRAFT state: Draft Lists with hospital, surgeon, day and session required, holding Bookings, flagged with waiting time, assigned by the office only (D46) with the preference and tier helper. A recurring booking on an unavailable session becomes a Draft List. The Day dashboard shows Draft Lists and booking counts. Follow-up: no assignment onto an unavailable session (32b) | 17, 30 | 11 / 2 / 0 |
| 32 | [Anaesthetist moves their own List, and the notification pool](phases/phase-32-swap-requests.md) | **Built.** An anaesthetist returns their own List to the office or moves it into a colleague's free session, at once, with no preference warning, also when marking a booked session unavailable. Every move posts to a shared notification pool in the Admin App. Follow-ups (D58, D60): notices ticked resolved, alerts from a List or Booking and the vacated-session choice without its provisional label (32b) | 29, 31 | 6 / 2 / 0 |
| 32a | [Anaesthetist moves a single Booking](phases/phase-32a-single-booking-moves.md) | An anaesthetist moves a single Booking to a colleague free in that session, found by type-ahead or the free list (by availability alone, D54), creating a List there (never into an existing List), with an optional office notice; the payable follows whoever does it, a prepaid one stays with the AA Holding account. The type-ahead also lands in the office's finders. The office's own single-Booking move left as it is (RV-27 is now a scaffold finding) | 32 | 3 / 1 / 0 |
| 32b | [Unavailability without conflicts, notices that resolve, and alerting the office](phases/phase-32b-unavailability-and-notices.md) | Unavailability never a conflict: marking a booked session unavailable, sickness included, forces a return or a hand-on for the office as for the anaesthetist, with the vacated-session choice everywhere; conflicts cover hospital closures only; no Draft List assigned onto an unavailable session. Notices active or resolved with a tick, a count and "show resolved". An "alert the office" with a note on a List or Booking. The office's finders ordered by tier, then preferred pairing | 32a | 2 / 1 / 2 |
| 32c | [Out-of-hours Lists](phases/phase-32c-out-of-hours-lists.md) | An out-of-hours session after PM (US-01.1.6; D84 answered 2026-11-10): a third kind of Slot the office opens for an anaesthetist on a day, one a day, 18:00 to 21:00 by default; any List goes in it, a new one or a Draft List for the evening; a full session for availability and the finders; it shows after PM on the anaesthetist's day (mobile, web, PWA) and as an evening block on Admin Day; its Bookings captured, submitted, authorised and billed as usual; an empty one closes. The A and B split of a session stays parked | 32b, 38a | 1 / 1 / 0 |
| 33 | [Hospital download and the matching screen](phases/phase-33-hospital-matching-screen.md) | One theatre list a day per hospital lands on a review-and-merge screen, the one screen both intake sources use (D51: each row carries its source, hospital or rooms), each row showing its text as received, insurer and approval number included: match, create a Booking, a List or a Draft List, or reject, with field differences approved and nothing applied automatically. A day move arrives as a cancellation plus a new Booking. Rows with no NHI wait in the unmatched queue, the List each would land on exposed for 33a's stub (D66). A row's hospital procedure text replaces the rooms' (the original kept in the change history) and, through 20a's helper, the invoice description unless the Contract's applies or an admin edited it (D37; D73 answered). Approved changes apply until the List is AUTHORISED. Created Bookings wait on "Needs an invoice destination" for the office's step rail, the row's insurer or funder suggesting a path (21) | 20a, 31 | 7 / 1 / 1 |
| 33a | [Stubs on a List](phases/phase-33a-stubs-on-a-list.md) | A Stub record on the List for an incoming booking that could not be posted (no NHI; D66 answered), held outside the Bookings table on its own identifier and linked to its waiting intake row, drawn clearly marked in mobile, web and Admin List views and never counted as a Booking. A List holding one never reads all-complete, with no prompt or block at submit or authorise (no confirm step, US-13.7.3; our reading). Adding the NHI at intake turns the row into the Booking that takes the stub's place (our reading); rejecting it removes the stub; one audited resolve path that 40 reuses | 33 | 4 / 1 / 0 |
| 34 | [Hospital sync, the rooms' PDF lists and the S1 rebuild](phases/phase-34-hospital-sync-and-s1.md) | Both first-release intake sources on the one matching screen (D51 answered): sync from the two integrated hospitals (St George's and Southern Cross until OQ-109 names them; D52 part 2 assumed), and the rooms' PDF lists as stored source documents, uploaded, corrected and sent to matching as rows, a re-sent List showing its differences (no more direct ingest). The third live feed stopped and the HL7/FHIR simulator and monitor demoted to a Future-scope surface. S1 rebuilt around sync, match, the wording as received, a waiting no-NHI stub and the office's Contract choice through the decided step rail | 33, 33a | 4 / 1 / 2 |
| 35 | [Explicit save and the update email](phases/phase-35-explicit-save-and-update-email.md) | Admin draft-then-save with change sets and as-at history, and a change history screen opened from the Booking, each entry naming who changed it (an office user by name, or the hospital's list) and showing the procedure text a hospital list replaced (US-02.5.8). An on-demand mailto update email picked from the change history (D19), started from a per-kind template, to the rooms or the hospital, including from a List-move notification; manual only. Add a Booking to a booked List keeping the hand-entered text as source text; correct the RVG code, Contract or invoice description until AUTHORISED (an admin's edit always wins, D73 answered). The To empty where a room holds no email, the main room's for a surgeon at more than one room with the others offered (D74) | 17, 17a, 25, 32, 33 | 6 / 1 / 1 |
| 36 | [Internal ledger and balance views](phases/phase-36-internal-ledger.md) | BillingCase promoted to linked receivable and payable legs as the system of record, created with the invoice, one payable leg per receivable, the AA Holding account's legs and transfers included. Phase 16's BCTI count re-reads from the ledger with a parity test. An Admin Ledger screen (whole ledger and per anaesthetist) with an imbalance indicator | 16, 22, 25, 27a | 7 / 2 / 0 |
| 37 | [Xero mirror resilience and the processing monitor](phases/phase-37-xero-mirror-resilience.md) | Payments to anaesthetists made in Xero and detected by the engine (D53 answered): the in-app "Run payables" payout replaced by a list of payables awaiting Xero's payables run (FT-10.2, RV-40). Bulk hospital remittance left in Xero. An outage queue with backoff. A void made in Xero is flagged. The processing monitor grouped by anaesthetist, with sorting, filtering, a problems-only view and "Open in Review" on Lists awaiting approval. A reconciliation status on the Admin Day dashboard, "Books square" or "Out of balance", with unresolved items by amount and age (US-13.2.4, over the checks the prototype has) | 36 | 6 / 0 / 1 |
| 38 | [Web accounts, outstanding list and monthly GST report](phases/phase-38-web-accounts-truth.md) | A ledger-backed financial position (owed by payers and the Parties AA bills, collected, paid out) with the Productivity and Leave panels removed. A flat outstanding list with no ageing (D8), each line opening its Booking. A monthly GST report of the payments AA made to the anaesthetist, with each GST component, to download, email or print on web | 36 | 4 / 1 / 3 |
| 38a | [Edit until AUTHORISED, the main view and search](phases/phase-38a-find-past-work.md) | The anaesthetist can still see and change a submitted List until it is authorised, the last change standing and the office seeing late edits at review. A List leaves the main view at AUTHORISED and its invoices show in balances straight away. The main view starts at today, with earlier Lists not yet authorised reached by scrolling back and submitted ones less prominent. Search by patient name, NHI or date reaches authorised and invoiced work | 31 | 8 / 1 / 1 |
| 38b | [Events on a Procedure and the additional invoice](phases/phase-38b-events-and-additional-invoices.md) | The event element on a Procedure with one standard review step and next-run invoicing, never held for the Procedure's invoice and bundled with the same party's invoice where the run has one (D13; D69 answered), on no List or schedule, and the events list on every Procedure in all three apps. A free-form additional invoice to any party (D10, D22), raised by the office or by the anaesthetist on their own Procedure (reached through 38a's search), recorded as an event, replaces the addendum Booking. The office's Booking page shows the Booking total, each Procedure's price and its events, with any price changeable from there (US-03.1.10) | 36, 38a | 4 / 2 / 1 |
| 39 | [Credit notes, credit-and-rebill and the combined split](phases/phase-39-additional-invoices-and-credit.md) | A credit note option to any party, for the office and for the anaesthetist on their own Procedure, credit in full and rebill from a copy of the original's lines, and a combination Contract's invoice split after it is sent by a credit then per-component invoices equal to the credit (before sending, a normal admin edit, D41), each reversing the ledger, the payable and Xero, with a negative invoice to an anaesthetist already paid. Credits recorded as events; credit notes audited; payments, receipts and disbursements kept out of the audit viewer | 38b | 6 / 2 / 0 |
| 39a | [Payment runs: the weekly cycle, BCTI approval, netting and remittance](phases/phase-39a-payment-runs-and-remittance.md) | A weekly ISO-week payment cycle (Friday close, Monday checks, Tuesday schedule, anomalies rolled forward) with an approve-for-payment step for the period's BCTIs, the payment made in Xero and recorded (D53), the AA Holding account kept out of the run (its transferred payables paid like any other), negative invoices netted per anaesthetist, and a remittance advice in Admin and web Accounts | 37, 39 | 3 / 1 / 0 |
| 39b | [Pre-op, post-op and billing events](phases/phase-39b-pre-and-post-op-events.md) | Pre-op and post-op events on a Procedure from mobile, web and Admin (date, time or fixed fee, invoice tick, billable party defaulting to the Procedure's), and billing events (a free-text charge or a credit), as new kinds on 38b's element, at any time and on no List, billed in the next run, bundled with the same party's invoice where it can be (D69 answered), through one review step. The ACC pre-op assessment as a preconfigured pre-op event under the generic rules. The BillingLine entity removed | 24, 38a, 38b | 4 / 1 / 0 |
| 40 | [Patients: mandatory NHI, balance warning, patient view](phases/phase-40-patients-and-alerts.md) | A patient record (demographics and ethnicity only where supplied) with invoices, follow-up actions, re-send and a shared note on a List or Booking. The NHI mandatory on every form, with the provisional patient and "NHI pending" gone, and the office's view of intake rows waiting for an NHI (urgent as the date nears; "Add NHI" matches the row through 33a's resolve path, the Booking taking the stub's place). A mild or strong warning at booking when the patient paying owes money, also shown on the anaesthetist's List, a mild one for a credit balance (D24), shown beside 27's prepayment warning (D80), with one admin-editable threshold field | 15a, 17a, 33a, 34, 36, 39 | 10 / 1 / 2 |
| 40a | [NHI lookup and identity standards](phases/phase-40a-nhi-lookup-and-identity.md) | NHI lookup with validation at entry, Hub states with a manual fallback, a purpose statement and refresh from the register, on the current add-booking forms (an ACTIVE List, the NHI required, the RVG type-ahead, the payer on the Booking). The same as-typed check, from the one validator and with no Hub lookup, on the NHI fields of 34's PDF row correction and the waiting row's "Add NHI" (33a, 40). HPI CPN shown consistently | 26, 40 | 2 / 0 / 0 |
| 41 | [Prepayment letter, cancellation and differences by hand](phases/phase-41-prepayment-followup-credits-refunds.md) | The prepayment letter on 27's approval stating the prepaid amount as the price, and reminders. Nothing further after a prepaid procedure but 27a's transfer: differences raised by hand as additional invoices and credit notes, a part credit allowed (D31). Cancelling a prepaid Booking credits an unpaid prepayment invoice or refunds a paid one from the AA Holding account, automatically (D56); a fresh prepayment at the new anaesthetist's price on rebooking; a moved prepaid Booking changing nothing, with an optional patient email; a Contract changed off prepaid after sending settled the same way (D67 answered); the refund raised by the system, the payment made in Xero (D53) | 27a, 32a, 39 | 6 / 0 / 0 |
| 42 | [Reference data and controlled loads](phases/phase-42-reference-data-and-loads.md) | Every master editable, including hospitals, recurring bookings and public holidays, with insurers and funders among the Parties. A spreadsheet loader with row validation for RVG groups, Parties, specialties, funding tags, Contracts one per priced item with their settings and price ranges, modifiers, calendars and the surgeons (each with one or more specialties) and rooms of AA's specialist list (a room with no email accepted; a surgeon with no HPI CPN or a first name only rejected, D76; a surgeon listed at two practices at both rooms, D75 answered); no Contract upload or export (D34 answered: Future Work). A clean-cut go-live demo | 17, 17a, 18, 18a, 19, 19a, 19b, 29, 30 | 3 / 1 / 0 |
| 43 | [Scale and privacy](phases/phase-43-scale-and-privacy.md) | A full-scale in-memory dataset with timings (the processing monitor included), generated in the flat model's shapes (RVG groups, Parties, Contracts one per priced item with pricing kinds, price ranges, specialties, funding tags and fallbacks, each Procedure's Contract by 20's rail, a payer and an NHI on every Booking, surgeons at one or more rooms, a few stubs on Lists, prepaid Contracts with the AA Holding account and its transfers), at about 28,000 invoices a year (EP-15), a restricted raw-row view, an NHI leak scan and a synthetic-data badge | 34, 36, 37, 42 | 3 / 0 / 0 |
| 43a | [Sign-in and ease of use: simple anaesthetist screens and point-of-need help](phases/phase-43a-ease-of-use.md) | A simulated PWA sign-in with sign-out. Anaesthetist screens free of office-only complexity while keeping the descriptions, Contract and RVG code (the RVG code on RVG kinds, the form collapsing on a fixed or open price), the approval number and what the price comes to, point-of-need help on mobile capture, Admin Day and Admin Review, with a first-run hint per app, and a Help panel for the office with the help desk's phone, email and support hours (D83, provisional) and requests logged as mock tickets (US-15.0.8) | 20a, 21, 21a, 24, 31, 39b | 3 / 0 / 0 |
| 44 | [Demo guide rewrite and final sweep](phases/phase-44-demo-guide-rewrite.md) | S1 to S5 rewritten, Control Panel jumps rebuilt, stale copy swept, master guide regenerated in full, trigger and PWA-parity audit, PROGRESS entry | all | 0 / 0 / 0 |
| | **Total** | 228 gaps, 45 DM and 37 RV closed; parked US-01.1.5 and DM-65 (the A and B split of a session) and US-03.7.4 (the pre-op consult in AA's room). Built phases also keep items they delivered that now Match, were retired or were merged (for example FT-13.7, US-03.1.3, DM-01, DM-53), and built 17 keeps FT-13.6, US-13.6.1 and US-13.6.2, Contradicts and followed up by 17a (rooms) and 18a (specialties) | | **252 / 55 / 37** |

## Sequencing rules

- **Built: 14 to 17 and 28 to 32.** 15 renamed Card to Booking; 15a built the warning routine that
  19, 21, 27 and 40 each register a rule into (19 out-of-range base units; 21 a child payer and an
  insured Booking with no approval number, the only insurance warning since the insurer-without-
  Contract warning was dropped on 23 October; 27 prepayment escalation; 40 a paying patient with a
  balance); 15b took out Copy and photo capture and renamed the assigned List's state ACTIVE; 16 made
  the AA fee a monthly invoice; 17 built the preference and tier helper every office pairing path
  reuses; 28 to 32 built Slots and Lists, the availability calendar and status master, conflicts and
  recurring bookings, Draft Lists and the anaesthetist's own List moves with the notification pool.
  Built phases' docs and records are frozen. Follow-up work the 16 to 20 October answers create on
  their surfaces goes to later phases: 32b (unavailability, notices, alerts, the office's order), 32a
  (the finder's type-ahead), 38a (the edit window), 26 (bank details, DM-32), 27 and 27a (US-09.1.1's
  prepayment payee), 39 and 43a (FT-13.5's audit carve-out and sign-in). Their covers keep what they
  delivered. The 2026-11-02 update changed US-01.3.6 (17) and US-01.4.5 (32) only to name tiers in
  the availability-only rule (OQ-113, D54); both still Match, and 32a and 32b carry the rule. The
  2026-11-04 update grades built 17's US-13.6.1 Contradicts (a room may be held, and loaded, with no
  email; the form refuses a blank one and the specialist directory seed invents placeholders), so
  17a follows it up while US-13.6.1 stays on 17's covers; FT-13.6 and US-13.6.2 now Match. It also
  drops the insurer-without-Contract warning from built 15a's US-13.7.1 list: 21 removes the stale
  sample text 15a left naming it (`registry.ts`, `warningSamples.ts`). The 2026-11-04
  working-decisions update (`a68f09b`) grades built 17's FT-13.6, US-13.6.1 and US-13.6.2 Contradicts
  (a surgeon can belong to more than one room, OQ-128; 17 built one `roomId`): they stay on 17's
  covers and 17a follows them up. FT-10.2 (releasing payables) is Contradicts again (OQ-111: Xero
  makes the payment, the original build's in-app "Run payables" makes it today): 37 takes it. Built
  14's direct Surgeon PDF ingest is superseded by OQ-108's answer: 34 sends the rooms' PDF rows
  through the matching screen. US-03.1.4 (both anaesthetist apps kept) still Matches on built 29.
  The 2026-11-10 update (`efe123c`) gives built 17's FT-13.6 and US-13.6.2 a surgeon's specialties
  (one or more, required; Donald's D3, at Verify since Ben said no to several): they stay
  Contradicts on 17's covers, and 18a follows them up with the new US-13.6.6. Built 28's US-01.1.1
  gains a notes paragraph only (one List per Slot stands; the out-of-hours List is 32c's, the A and
  B split parked), and built 16's EP-10 and FT-10.1 changed in wording only.
- **RV ids were renumbered by the 2026-10-20 reverse check** (DM ids are stable). The old RV ids on
  built 15 (RV-03, RV-12), 15b (RV-25, RV-36), 16 (RV-07), 28 (RV-14) and 32 (RV-15, RV-30) named
  findings those phases closed; the same numbers now name other findings, so those ids left the built
  phases' covers (their docs are unchanged) and every RV unit was placed by meaning. RV-15 and RV-17
  are now "keep as demo scaffold" findings, not units (see Parked). The 2026-11-10 check added RV-40
  (the in-app "Run payables" makes the payment: 37) and RV-41 (the RVG code master is invented demo
  codes: 19), and no longer lists RV-12 (34 keeps the work through FT-02.2 and US-02.2.1). DM-16 (the
  holder references and delivery) and DM-57 (staged Contract changes) are no longer held: delivery is
  DM-48's (18), holder references wait on OQ-136 (D82) and staging is gone with the versions.
- **The Schedule track finishes with 32a and 32b, then 38a, then 32c, before the Contracts track
  resumes.**
  - 32a is the anaesthetist's single-Booking move as OQ-85 answered it (D61): only to a colleague
    free in that session, as a new List; no payee repoint (D38).
  - 32b follows up built 28 to 32 for the 19 October answers (D58, D59, D60): it removes the
    availability conflict, forces return or hand-on on every unavailability path, asks what the
    vacated session becomes everywhere, adds the resolve tick to notices and the "alert the office"
    source that 21a's review shows, and orders the office's finders by tier then preferred pairing.
  - 38a now runs here, not in the money track: a List leaves the anaesthetist's main view when it is
    AUTHORISED, not when it is invoiced, so it no longer waits on billing; and it opens the
    anaesthetist's edit window to AUTHORISED (D63), which 20's Contract change relies on. Its search is
    the entry point 38b, 39 and 39b use for authorised and invoiced work.
  - 32c (new 2026-11-10) builds the out-of-hours List (US-01.1.6, Confirmed, its design still to do)
    as D84's working design: a List with its own start time held outside the AM and PM Slots, added
    by the office, shown after the PM List and on Admin Day, ignored by the finders and conflicts.
    It runs after 32b (the unavailability and move paths it must leave alone) and after 38a (its List
    joins the anaesthetist's main view, which 38a rebuilds), and before the Contracts track, so 20's
    rail and 21a's capture see a List that sits in no Slot. Session is read in about 36 files: 32c
    keeps "which Lists are on this anaesthetist's day, in order" in one helper with tests. The A and
    B split of a session (US-01.1.5, DM-65) is parked: the catalogue keeps one List per Slot until it
    is agreed.
- **BCTI granularity is built one way and labelled provisional.** The catalogue says both "one BCTI
  per procedure" (US-09.1.4 note, OQ-29, the 2026-10-01 note #41) and "the same value as its
  receivable" (OQ-42), and a receivable can hold several Procedures, so both cannot hold (DM-22 says
  as much). The plan builds one BCTI, the ACCPAY, per receivable invoice, the same value. 16 counts
  BCTIs for the fee run through one pure, tested function; 22 (a split gives two invoices, so two
  BCTIs), 36 (the ledger's payable legs), 38b (additional invoices), 39 (re-issued invoices; whether a
  credit note or negative invoice counts is OQ-60) and 39b (event invoices) feed it and keep it the
  only count, and 36 adds a parity test. "One per procedure" stays an open point beside OQ-29 and
  OQ-60; if it flips, the count function, the $700 seed and the S3 and S4 figures are re-baselined in
  one place. On 2026-10-28 Greg called the prepayment's release the BCTI and floated one BCTI per
  payment or per weekly run (OQ-29, OQ-47, open; US-09.1.4 now says the granularity is not settled):
  a third candidate for the same one function, nothing more. A prepayment's pair goes to the AA Holding
  account (27) and its release is a transfer (27a): keep them out of the count unless the
  function's switch says otherwise.
- **The pricing model lives in one place.** Since 2026-11-10 the model is Donald's flat Contract
  model of 5 November: the proposal snapshot
  [AR-58](../../../requirements-board/requirements/artifacts/AR-58.md) (cited by section, for example
  "AR-58 5.7"; its assumptions as "AR-58 An"; the working copy, with the why, is
  [contract-model-proposal.md](../contract-model-proposal.md)) and its ERD
  [AR-61](../../../requirements-board/requirements/artifacts/AR-61.md) (regions `party`, `contract`,
  `pricing-kind`, `price-range`, `specialty`, `funding-tag`, `invoice-destination`,
  `linked-practitioners`, `rvg-group`, `procedure`, `who-is-billed`). Greg's v6 documents
  ([AR-28](../../../requirements-board/requirements/artifacts/AR-28.md),
  [AR-29](../../../requirements-board/requirements/artifacts/AR-29.md) and
  [AR-30](../../../requirements-board/requirements/artifacts/AR-30.md)) are **Retired**: no phase
  doc cites them as current, and the v6 notions they carried (the contract holder's "is billed" and
  billable-party link, Contract lines and line keys, versions, future-dated versions, the review
  dashboard, relinking, the resolver) are not built. Where AR-58 makes a reading the catalogue marks
  "our reading" (A2, A12, A16, A17, A41, A42, A48 and the rest), the phase builds it and logs it for the
  owner; the catalogue wins where they differ. Every phase that builds these structures (18, 18a, 19,
  19a, 19b, 20, 20a, 21, 21a, 23, 24, 25, 27, 27a) keeps the structures and the pricing rule in **one
  place in `aa-prototype/src/domain/billing`** (plus the seed), behind types the UI reads
  (`candidates`, `destinationOf`, `openPriceFallback`, `rangeInForce`, `suggestedPath`, the one
  `price(p)` function), so a later design change stays a contained edit. Modifiers are seeded from
  `NZSA RVG 2021 modifiers.md` and `NZSA RVG 2021 included modifiers.csv` (artifact AR-34), never
  re-transcribed from the RVG. The catalogue diagrams redrawn to the flat model sit beside them:
  [AR-44](../../../requirements-board/requirements/artifacts/AR-44.md) (Party, billable party and
  payer; its regions kept and re-anchored; 18, 21), [AR-52](../../../requirements-board/requirements/artifacts/AR-52.md)
  (where the money goes, prepaid or not: `pp-approved`, `pp-pair`, `holding-account`, `pp-transfer`,
  `release-trigger`, `cancellation`, `trust-bank`, `creditors`; 27, 27a, 36, 41), AR-01 (how a
  Procedure is priced; 19a, 24), AR-02 (Contract selection and who pays; 20, 20a) and AR-24 (the
  billing and invoice flow: `prepaid-left-off`, `prepaid-difference`, `prepayment-cancellation`).
- **Old-model matches are carried across.** Several items grade Matches only through the old model:
  FT-03.2's and US-03.2.1's primary Procedure, US-05.2.1 (the anaesthetist's own unit value),
  US-05.2.7 (ex-GST prices), US-05.3.5 (units and dollars per Procedure) and FT-08.2's and
  US-08.2.1's grouping by billable party. 18 maps today's Type 1, 2 and 3 Contracts onto pricing
  kinds and keeps the ContractPrice rows as an interim until 19a re-seeds them as fixed-price
  Contracts with price ranges; 20, 21, 23 and 24 keep the rest working. Each says so, with a parity
  test. (FT-05.5, ACC as an ordinary holder, is no longer carried across: ACC becomes a funding tag in
  18a.)
- **The Contracts track runs strictly in order: 18, 18a, 19, 19a, 19b, then 20 to 25 with 21a.**
  - 18 rebuilds the holder as the shared **Party** (DM-48: kinds, billing details once billed, delivery
    by email or post) and the Contract as **one flat priced item** (DM-07: AA code and holder reference
    code, bills its holder or the payer, links, prepaid, pricing kind, the override setting on RVG
    kinds, Active or Disabled, edited in place with audit, never deleted, save guards), folds the
    Insurer master into Parties (RV-39) and replaces the default Type 1s with No contract · RVG held by
    AA (RV-06); it keeps today's ContractPrice rows, resolver and route so the app stays green until
    19a and 20. Nothing about versions is built (D77 answered). It is 2 sessions with a cut line:
    session 1 the Party master and its editor, with the holders and the seeded insurers and funders
    migrated into Parties (the Insurer master folded in) and today's Contracts re-pointed at their
    holder Party, ending green with parity on every S3 to S5 figure; session 2 the flat Contract, its
    save guards and audit, the Admin Contracts screen and No contract · RVG.
  - 18a adds what the rail reads beyond the Contract record: AA's specialties and funding tags, a
    surgeon's specialties (required), a Contract's specialties and tag (ACC a tag), and the
    system-made open-price fallbacks per invoice destination (completing DM-49, which 18 starts with
    No contract · RVG), kept in step by one idempotent `ensureFallbacks()`. A letter suffix, not a
    number at the end of the track, because the fallbacks' keys depend on the tags and 20's candidates
    on the specialties.
  - 19 (RVG groups, reseeded from the NZSA RVG, and the type-ahead), 19a (every priced item a Contract,
    price ranges, the holder reference code, invoice description and default RVG code, combinations,
    the anaesthetists' price lists, starting values, time tiers) and 19b (modifiers) come before 20, so
    the code, the priced Contracts and the modifiers are final before 20's rail, 23's Booking-level
    pass and 25's lock.
  - 20 also needs 38a (the edit window to AUTHORISED). It leaves interims: who is billed is the
    holder Party when the Contract bills its holder, else the Procedure's existing `billablePartyId`
    override (the seeded guardians), else the patient, until 21 re-expresses the override as the payer
    on the Booking; the seeded `funderOverride` split stays until 22's Split button; once the payment
    category goes, prepayment is read from the Contract's prepaid setting (18) with today's
    `prepaymentDetail` kept until 27; and the amount typed through "Other price" is held in one
    `enteredPrice` field on the Procedure, which 24 generalises.
  - **20 owns removing `PatientPaymentCategory`** (about 15 non-test files read it) everywhere. 27
    then removes only the deposit and split paths and `prepaymentDetail` (about 9 non-test files).
  - **20 builds the decided step rail** (D16, US-04.3.8): where the invoice goes (worked out from each
    candidate Contract, never stored), then Payment type or the hospital's funding tag, then the
    Contract by typing, with No contract · RVG pinned first and "Other price" for the destination's
    open-price fallback; a step with one answer fills itself in. One pure path function and one
    component, mirrored for the anaesthetist on mobile, web and the PWA; US-04.3.2's candidate rule
    lives inside it. 21 adds the "Suggested" mark from the Booking's funder inside the same function;
    33's row panel, 34's S1 and 35's add-a-Booking use the same rail.
  - 20a runs straight after 20, so the procedure text and the invoice description have a Contract to
    sit beside, and before 21a's review and 33's matching screen, which both show them. Its "who is
    invoiced" and "pricing basis" read one selector each, which 21 and 24 re-point; 22 and 27 print its
    invoice description. The procedure text (the hospital's replacing the rooms', the replaced text
    to the change history) and the invoice description's order of defaults (the rooms', then the
    hospital's, then the Contract's invoice description; an admin's edit always wins, D73 answered)
    live in one 20a helper: 19a's Contract field feeds it, 33 calls it when a hospital row arrives, and
    35's office edit goes through it.
  - 21 then 21a, split on 2026-11-10 so neither passes two sessions: 21 builds who is billed from the
    Contract, the payer on the Booking, the insurer or funder as a Party with the approval number, and
    the "Suggested" path; 21a builds the capture by pricing kind (US-03.3.9), the three-condition
    completion gate (its price condition read through one selector that 24 re-points to the full
    price function) and the office's review with its flags, among them a moved Booking whose Contract
    no longer fits (US-04.3.11; 21a runs after 32a's single-Booking move, through 32b).
  - 24 builds the five pricing kinds as one price function (the snapshot, else the prepaid amount
    once invoiced, else a typed price, else computed from the kind, else "Needs a price"), the
    override gates and the anaesthetist's view of the price. It is 2 sessions with a cut line: session
    1 the five kinds, the price function with a test per rung, the one typed-price field (`priceOverride`
    and its reason folded into it) and the override gates, with 21a's price selector re-pointed, ending
    green; session 2 the anaesthetist's price line on mobile and web, the office's change shown beside
    the computed price, the rate x time line and Method 3 gate removed with the Aria Contract
    re-expressed, the discount line and the $0 invoice. 25 locks what 18 to 24 built in a pricing
    snapshot per Procedure and shows each Contract's audited history. There are no versions, staged
    changes or relinking to build (D77, D34 answered).
- **26 needs nothing unbuilt.** It keeps its place after 25, but can run any time if AA wants bank
  details sooner; it removes the GST period (RV-02), so it runs before 38, whose monthly GST report it
  leaves in calendar months.
- **17a needs 18a** (and built 17). It runs after 26 in run order, and before 35, 40
  and 42: 35's update email and 40's NHI request read a room's email through its one helper (empty
  when the room holds none; the main room's for a surgeon at more than one room, the others offered,
  D74 with OQ-127 part 5), and 42's rooms sheet loads a room with no email and a surgeon at each room
  listed (D75 answered; contacts are entered by hand, D74: Ben does not hold them). It is 2 sessions
  now that a surgeon's room becomes a list (about 10 non-test files read `roomId`). Its grep and
  migration include any room reader 18 to 25 add before it runs (18's Party migration may read the
  room-to-surgeons lookup, which 17a re-points; 20's surgeon filter is by practitioner ID and adds
  none), so it keeps its place in the run order. Neither ever reads the real
  `Christchurch_Specialists.xlsx` beside the fictional copy: the seed is fictional only. Since
  2026-11-10 18a has already given each surgeon one or more specialties, required, on the same
  surgeon form (`SurgeonEditSheet`), profile and specialist directory seed (its header included) by
  the time 17a runs, and re-shot US-13.6.2's profile with them: 17a keeps them when `roomId` becomes
  `roomIds`, its rooms list sits beside them, its US-13.6.2 and FT-13.6 shots start from 18a's and
  keep them in their captions, and 42 loads both. 18a is therefore one of 17a's dependencies.
- **27 then 27a, after 25, back to back.** 27 needs 18's prepaid setting, 19a's price lists, 20's
  "Payment type: Prepaid" and "Other price" (Prepaid · Fixed price), 21's payer and 25's lock. The
  prepaid amount is the Procedure's price when the prepayment invoice is raised (a price range in
  force, or the typed amount), read-only from then for everyone (D30 narrowed). It generates the prepayment invoice when an admin approves it (or at once when
  AA switches approval off), with a pair whose payable is the AA Holding account (US-06.3.1,
  US-09.1.3, FT-06.3; D38), never paid out by the payables run. 27a then builds the account itself
  and the transfer at authorisation (the trigger provisional, D72), so prepaid money reaches
  the anaesthetist who did the List again. There is no estimate and no excess path: a prepaid
  Procedure is priced at the prepaid amount and left off the final invoice with nothing deducted
  (D57); the `negativeTotal` guard stays for every other negative.
- **Intake (33, 33a, 34, 35) runs after 31 and 20a** (33 also after 32b in run order), because a row
  can create a Draft List and every row and Booking shows the procedure text as received (the
  hospital's replacing the rooms', the replaced text in the change history; a created Booking waits on
  "Needs an invoice destination" for the office's step rail). 33 builds the
  one matching screen both intake sources use (D51 answered): each row carries its source, hospital or
  rooms. A row with no NHI waits in 33's unmatched queue (D11) and 33a, straight after 33, draws its
  stub on the List and owns the one resolve path (D66 answered), which 40's waiting view reuses; a stub
  is not a Booking, so a List holding one never reads all-complete but puts no prompt or block on
  submit or authorise (15a removed the confirm step, US-13.7.3); a day move is a cancellation plus a
  new Booking (D62). 34 needs 33 and 33a: it adds the two hospitals' sync (D52) and the rooms' PDF
  lists as a stored source whose rows land on 33's screen (FT-02.2, US-02.2.1, DM-61), so the PDF
  tab's direct ingest (`ingestPdfRow`) goes and a no-NHI PDF row gets its stub; after 34 every intake
  source creates Bookings only through 33's decision and 33a's resolve path, which 40's NHI guard
  covers. 34 is 2 sessions with a cut line: session 1 the product pathway (the PDF list record,
  upload, correction and send to matching, re-sent differences, and sync with the third feed
  stopped), ending green; session 2 the Future-scope demotion, the Intake home and the S1 rebuild. If
  session 1 runs long, the re-sent-differences trigger opens session 2; the S1 rebuild and its demo
  guide patch are never squeezed (if session 2 is tight, the Intake home lands as a plain grouping of
  the existing intake tabs). 35 also needs 25's snapshot (AUTHORISED read-only; there are no Contract
  versions, so its as-at view shows a Contract's settings from its audit) and 32's moves, and builds
  the Booking's change history screen (US-02.5.8): named office users, the hospital's list as a
  source, and the procedure text it replaced.
- **Money:** 36 runs after 16, 22, 25 and 27a (it promotes the AA Holding account's legs and the
  transfers into the ledger). Then 37 and 38 can run in any order (both need only 36; 37
  moves the payout to Xero's payables run, FT-10.2 and D53, so 38 uses whichever payout control
  exists when it runs); 38b after 36 and 38a;
  39 after 38b; 39a after 37 and 39 (it keeps the AA Holding account out of every run, its
  prepayments reaching a run only as 27a's transferred payables, and nets 39's negative invoices).
- **Capture:** 39b runs after 24, 38a and 38b, because 38b builds the event element 39b adds pre-op,
  post-op and billing-event kinds to, and soon after 38b, because 38b withdraws the anaesthetist's
  post-op Card flow that 39b brings back as events. 39b removes the BillingLine entity (DM-46) once
  billing events exist; 24 removes only the rate x time line and its gate.
- **The remaining phases:**
  - 40 runs after 15a, 17a, 33a, 34, 36 and 39 (a patient credit balance needs 39's credit notes; the
    waiting rows need 33's queue and 33a's stub and resolve path); 40a after 26 and 40.
  - 41 runs after 27a, 32a and 39 (the letter on 27's approval, the by-hand routes of 38b and 39,
    39's credit note for an unpaid cancelled prepayment, the AA Holding account for refunds).
  - 42 runs after every master-data phase (17, 17a, 18, 18a, 19, 19a, 19b, 29, 30); it no longer
    needs 25, since no Contract edit is staged (D34 answered).
  - 43 runs after 34, 36, 37 and 42, late because its generator follows the final model: Slots and
    Lists, recurring bookings, RVG groups, Parties, Contracts one per priced item with pricing kinds,
    price ranges, specialties, funding tags and fallbacks, each Procedure's Contract by 20's rail, a
    payer and an NHI on every Booking, surgeons at one or more rooms with their specialties, a few
    stubs that are never Bookings, prepaid Contracts with the AA Holding account, typed prices where
    set and the snapshot, at about 28,000 invoices a year (EP-15). 43a runs after the capture and
    review screens settle (20a, 21, 21a, 24, 31, 39b) and adds the help desk panel (US-15.0.8, D83).
  - 44 runs last.
- **Contracts and Schedule are independent until 33.** The Schedule track went first while the
  pricing requirements settled; it finishes with 32a and 32b, then 38a and 32c, and the Contracts
  track resumes at 18. 21a's moved-Booking flag reads 20's candidates against the move paths 32a and
  the office's moves already built.
- **Vocabulary.** Booking, not Card; move or reassign, never swap; never "timesheet". Per OQ-64,
  "slot" never reaches app copy (say session, AM or PM); Slot stays a code and planning word. A
  List's states are DRAFT (a Draft List, no anaesthetist), ACTIVE, SUBMITTED and AUTHORISED; never
  "DRAFT" for an assigned List. "Not preferred" and "Preferred", never "blacklist" or "whitelist" in
  app copy (D36). There is **no procedure list**: the procedure on a Booking is the **procedure text**
  received (the hospital's replaces the rooms'; the replaced text lives in the change history), "RVG
  code" names what is picked from the RVG groups, and the procedure text and the invoice description
  are two things kept apart. "First party" and "third party" are not used: say what the Contract's
  settings do (who is billed, whether the anaesthetist may change the price, prepaid). Since
  2026-11-10: a **Party** holds Contracts (never "contract holder" in app copy, and no "is billed" on
  it); a Contract is one priced item, with **no Contract lines and no versions** ("item" only for a
  row of a source schedule); it is **Active or Disabled** (never "retired" or "ended"); its pricing
  kinds are "RVG at the anaesthetist's rate", "RVG at the Contract's rate", "RVG less a discount",
  "Fixed price" and "Open price"; a fixed price has **price ranges**; the built-in is **No contract ·
  RVG** (with a middot; never "No contract (RVG)"), and the fallbacks are "No contract · Fixed price",
  "Prepaid · Fixed price", "<Hospital> · <TAG> · Fixed price" and "<Holder> · Fixed price", picked
  by **"Other price"**; the rail's second step under Patient is **"Payment type: Standard or
  Prepaid"**; a Procedure without a Contract "Needs an invoice destination" (never "Needs a
  Contract"), and one without a price "Needs a price"; specialties are broad (no subspecialties) and
  funding tags are SXAP, HNZ and ACC (ACC is never a kind of Contract); the funder's path is
  "Suggested". Times are start and finish, never "handover". "Event" is the one name for
  everything recorded against a Procedure after setup; keep its user-facing label in one place (38b
  builds it). The prepaid amount is never called an estimate or a deposit; the money is held in the
  **AA Holding account** (never "prepay holding account"; the trust account is the bank account), and
  its release is a transfer, not a payment or a second invoice. Insurers and funders are Parties: no
  "insurer master" or "direct claims" in app copy. Notices are active or resolved; an anaesthetist
  "alerts the office". The insurance approval number is one field (the design's "insurance
  acceptance" reference is the same thing). Practice managers and PAs are a room's "contacts"; there
  is no "address book" (OQ-126); a surgeon has "rooms" and a main room. A **stub** stands on a List
  for a booking waiting at intake; it is never called a Booking ("stub Booking" is retired with
  FT-02.6's old title). The rooms' PDF list is a source of intake rows, never "ingested" straight onto
  a List. The office's Contract picker is the "step rail" in plan words only; app copy says what each
  step asks ("Where does the invoice go?", "Payment type" or the hospital's funding tag, the
  Contract). Payments to anaesthetists are "made in Xero"; the app records and tracks them and never
  says it pays them. An out-of-hours List is said that way (never "evening slot" or "third
  session").
- **Open questions with a recommendation are built as that recommendation** (the open D rows'
  defaults) and labelled provisional, each kept in one place so a different answer is a small change.
- **Every phase opens with a drift check** against `fbdd555` for its items and linked OQs (built
  phases keep their own baselines), and confirms any owner decision it depends on.
- **Every phase closes the same way:**
  - `npm run build`, `npm run build:pwa` and `npx vitest run` are green.
  - `npm run shots` (Playwright) is green for any phase that touches UI; `data-shot` hooks and specs
    move with the code they follow.
  - The adversarial review pass has run (PROGRESS convention 18).
  - The catalogue screenshots match the app: the phase's capture recipes are created or updated, a
    full `npm run capture` has run with no failed recipe, and `npm run verify:board` is green (see
    "Catalogue screenshots" below, and PROGRESS convention 19).
  - `PERSIST_VERSION` is bumped whenever the seed's shape or content changes.
  - Billing maths stays pure with Vitest tests.
  - The Decisions log is updated wherever a settled ruling is superseded. Known cases: the route
    model, the protected default Type 1 per hospital and insurer, the Method 3 hourly rate line, the
    price override with a mandatory reason, the 2026-10-08 readings this update withdrew (the
    procedure-first and two-tab picker, adjustable meaning No contract (RVG) and first-party Contracts,
    the price precedence with a recorded price source), the guardian override record, the 2026-09-28
    "no calculation" decision (where the catalogue shows a price), absorbed P1 modifiers and locked
    modifiers, the 2026-07-22 ASA seeding values, the addendum Card, the prepayment completion gate,
    the prepayment estimate and deposit, the overpaid prepayment's `negativeTotal` failure, the
    prepayment deduction line on the final invoice (D57), the Insurer master with its direct-claims
    flag and default-Contract flip (RV-39), the holding account's second pair as an invoice pair (now
    a transfer), the prepayment refund as an office step (D56), the
    prepayment payable to the anaesthetist on receipt, binding convention 6's office-only edits after
    submit, the provisional patient without an NHI, Phase 15's List attachments, Phase 30's
    availability conflict and office-recorded sickness, Phase 28's and 32's provisional vacated-session
    default and keep-every-notice pool, office write-through per tap, hospital auto-apply, Phase 14's
    direct Surgeon PDF ingest (the rooms' PDF lists are in scope again through the matching screen,
    34), and (2026-11-04) the review warning for an insurer named with no insurer Contract, the
    invoice description starting from the Booking's description, and Phase 17's mandatory room
    contact email; and (2026-11-04, `a68f09b`) Phase 17's one room per surgeon, the hospital
    download as the only first-release intake with the PDF tab badged Future scope, the in-app
    "Run payables" payout (Xero makes the payment), the event that travels with the Procedure's
    invoice, and the Contract picker as one list with No contract (RVG) first (the step rail); and
    (2026-11-10, `efe123c`) the RFP's Contract types 1, 2 and 3, Contract effective dates and
    deletion (Active or Disabled instead), the contract holder with its "is billed" setting, the
    insurer's direct-claims flag as a delivery setting (email or post on the Party), the per-Procedure
    rate and discount, the received descriptions kept side by side (the hospital's replaces the
    rooms'), the step rail as a working direction (now decided), the anaesthetist never seeing the
    price, and a prepaid Contract that may bill its holder.
  - A PROGRESS.md entry is recorded, ending with its "For the owner's review" list.

**Where the critic's review was not followed.** The escalating unpaid-prepayment warning (US-06.3.2,
Confirmed) and the re-check (US-06.3.5) stay in 27 rather than moving to 41: the warning is the
control that replaced the completion gate, and moving it would leave S4 Beat 1 with no control for
fourteen phases. Contract pricing terms (US-04.2.2) close in 24, not 19a, because their last missing
parts are pricing rules (the adjustable rule, the price precedence, the fixed rate and discount). In
the second review, Phase 32's file name (`phase-32-swap-requests.md`) is kept although "swap" is no
longer catalogue vocabulary: the plan tools pin an existing phase's doc path in `plan.json`, so
renaming only the slug would put the slug, the doc and the links out of step. The phase title and
every app-facing word already say "move". Renaming the file is a separate mechanical step (move both
files, then update `plan.json` and the links) if wanted. Phases 17
(`phase-17-surgeons-rooms-blacklist.md`), 19a (`phase-19a-default-rvg-contracts.md`), 38a
(`phase-38a-find-past-work.md`) and 39 (`phase-39-additional-invoices-and-credit.md`) keep their file
names for the same reason, although their titles have moved on.

In the review of the 2026-11-04 working-decisions update, three points were followed in part. 34 is
not split into a lettered 34a: both intake sources on one matching screen, told in S1, are one
deliverable, so it stays 2 sessions with an explicit cut line (see the Intake rule above). 17a keeps
its place in the run order (after 26) rather than moving ahead of 18: 20's surgeon filter is by
practitioner ID and adds no room reader, and any room reader 18 adds is in 17a's grep. 33a's stub is
not registered as a 15a warning or a to-do entry: warnings are records on a Booking and a stub is not
one; the stub carries the warning treatment on the List, the office's chase is 33's queue and 40's
waiting view, and nothing prompts at submit or authorise. The rest of that review was followed: 23
and 40a joined the affected phases, 40's PDF passages are re-pointed, and the link-only changes are
recorded below.

The review of the 2026-11-10 update was followed, with one point adjusted. 17a and 32b joined the
affected phases as light (17a's form, profile, seed and US-13.6.2 shot now carry 18a's specialties;
32b's alert is shown at review by 21a, not 21), and 18 and 24 gained session cut lines (see the
Contracts track rule). 24's cut puts the one typed-price field, `priceOverride` folded into it, in
session 1 rather than session 2, because the price function's typed-price rung reads that field. 26
stays unchanged: its doc's mention of a Phase 20 interim flag is harmless (see "Unchanged" below).

**Placement notes for the 2026-11-10 accountant update** (catalogue `fbdd555f`).

- **No new phase; nothing re-planned from the meeting's proposals.** Greg's clearing account, the bill
  posted with the invoice, the weekly cycle's new days (OQ-47) and the payment-run balance check are
  proposals for Greg and Sam's process maps, not catalogue rules. They stay open gaps until a later
  update records them.
- **37** takes the new US-13.2.4 (Proposed): a Reconciliation card on the Admin Day dashboard over the
  checks the prototype can compute (36's ledger equation and unmatched receipts, the ledger against
  the Xero mirror, 37's unmatched Xero bank lines), the checks in one pure list a later update extends.
  It sits in 37, not 36, because 37 builds the bank lines, so the story is built whole in one phase.
- **27a** is renamed "AA Holding account and the transfer to the anaesthetist": US-06.5.1 no longer
  calls the move "a journal transfer" and leaves open how Xero posts it. The Xero sim keeps its
  journal mirror as a captioned default and the code names stay; app copy, demo guide and the plan
  say "transfer" (27a, 36, 37, 39a, 43 and 44 swept).
- **39a** keeps US-10.2.7's Friday close and Tuesday payment: OQ-47 moved but is not settled.
- Every other unbuilt phase moves its drift baseline only, except 32b, which is being built in the
  working tree and keeps `efe123c` (none of its items changed).

**Placement notes for the 2026-11-10 update** (catalogue `efe123c`; historical, the accountant update's notes above win where they differ).

- **Three new phases.**
  - **18a** (Specialties, funding tags and the open-price fallbacks; Contracts, 2 sessions, straight
    after 18) takes DM-63, DM-64, US-13.4.4, US-13.4.5, US-13.6.6, US-04.2.16, US-04.2.17, FT-05.5
    and US-05.5.1 (ACC a funding tag), and DM-49, moved from 18 because the fallbacks' keys need the
    tags (18 still builds No contract · RVG). It follows up built 17's FT-13.6 and US-13.6.2 (a
    surgeon's specialties), which stay on 17's covers. A letter suffix, because 19a's seed and 20's
    rail read it. The proposal (AR-58 9.5) put all of this in 18; it is split so 18 stays within two
    sessions.
  - **21a** (RVG detail by pricing kind, completion and office review; Contracts, 2 sessions, after 21
    and 32b) takes DM-59, RV-21, FT-03.6, US-03.6.1, US-03.3.3 and US-07.2.2 from 21, with the new
    US-03.3.9 (what a Procedure asks for follows its pricing kind) and US-04.3.11 (a moved Booking
    keeps its Contracts, and a Contract that no longer fits is flagged at review). Split so neither 21
    nor 21a passes two sessions.
  - **32c** (Out-of-hours Lists; Schedule, 2 sessions, after 32b and 38a) takes US-01.1.6 (Confirmed)
    and DM-66, built as D84's working design.
- **Reworked:**
  - **18** rebuilds holders as Parties and Contracts as flat priced items (D77 answered: no versions,
    so its "New version" flow, version records and version module go from its plan), audits every
    edit in place, drops FT-04.1 (now a grouping) and DM-49 (to 18a), and keeps US-04.1.3 with 25,
    which shows the history; 2 sessions with a cut line (Parties first, then the flat Contract);
    retitled "Parties and flat Contracts".
  - **19a** is repurposed from Contract lines to price ranges and the Contract's own fields: US-04.2.4
    leaves (Retired), US-04.2.15 and US-04.2.18 join; retitled "Price ranges, the Contract's own fields
    and starting values".
  - **20** builds the decided step rail (D16) and takes US-04.3.8 and US-04.3.9; EP-04 and FT-04.3
    leave its covers (now groupings); retitled "One Contract per Procedure and the step rail".
  - **20a** builds one procedure text that the hospital's replaces (US-02.5.7 retitled), the
    Contract's invoice description as the top default and OQ-130's answer (D73); retitled "Procedure
    text, the invoice description and the Contract on each Procedure".
  - **21** keeps who is billed, the payer and the insurer or funder (a Party), takes US-04.3.10 (the
    "Suggested" path), drops DM-16 (no longer held) and gives its completion and review to 21a;
    retitled "Payer, insurer or funder, and who is billed".
  - **24** becomes the five pricing kinds and the one price function, with US-05.2.8 and US-03.3.10;
    2 sessions with a cut line (the kinds, the price function, the typed-price field and the gates,
    then the anaesthetist's price line, the office's change and the removals); retitled "Pricing kinds, the price following its Contract until held, and who may change it".
  - **25** loses DM-57, US-04.1.6 and US-04.2.10 (staged changes and versions are gone) and becomes the
    snapshot and each Contract's history, 1 session; retitled "Contract history and the AUTHORISED
    lock".
  - **27** takes US-06.2.6 (Prepaid · Fixed price) and builds the amount as the price when the
    invoice is raised, read-only after, with a prepaid Contract always billing the payer (D23 at
    Confirm).
  - **42** loads Parties, specialties, funding tags and Contracts one per priced item with price
    ranges; the staged review and the dependency on 25 go (D34 answered).
- **New covers elsewhere:** 19 takes RV-41 (reseed the NZSA RVG groups); 35 takes US-02.5.8 (the
  change history screen); 37 takes RV-40 (the "Run payables" payment, the same work as FT-10.2); 38b
  takes US-03.1.10 (the Booking total on the office's Booking page); 43 takes EP-15 (the volume at
  scale); 43a takes US-15.0.8 (the help desk) and becomes 2 sessions.
- **Answers and readings built in place (light):** 19b (US-03.3.4's "RVG kinds only" step closes in
  21a; FT-03.3: choosing no modifier is a valid answer); 22 (delivery on the Party, email or post,
  D55's new default, the portal queue gone; layout from whether the Contract bills its holder; the
  holder reference code from the Contract); 23 (the rule on RVG-priced Procedures only; OQ-132's
  default, D78; US-03.2.1 now Matches and leaves its covers, carried across); 27a (AR-29 re-pointed;
  the prepaid Contract picked under Payment type: Prepaid); 33 and 33a ("Needs an invoice
  destination"; the hospital's procedure text replacing the rooms'; D73 answered); 34 (RV-12 no
  longer listed and off its covers; S1 narrates the decided rail); 35 (D73 answered; no Contract
  versions in its as-at view); 36 and 38 (Parties, not contract holders); 39 (a combination is a
  fixed-price Contract of its own; fee extras are events); 39b (event pricing re-pointed from
  Contract versions and lines to the flat Contract's settings); 40 (EP-11's Parties; OQ-134's
  default, D80); 41 (the price read-only once the prepayment invoice is raised; a fresh prepayment
  from the new anaesthetist's price-list Contract; D67 extended); 43 (the generator's flat shapes);
  44 (every reworked beat, the open-defaults lists, the vocabulary sweep).
- **Neighbour readings re-pointed (light; covers unchanged):** 17a (FT-13.6 and US-13.6.2, the stories
  it follows up, now give each surgeon one or more specialties, required (US-13.6.6, D3); 18a adds
  them first to the same `SurgeonEditSheet`, profile and `specialistDirectory.ts` seed and re-shoots
  US-13.6.2: 17a now depends on 18a, keeps the specialties when `roomId` becomes `roomIds`, starts
  its US-13.6.2 and FT-13.6 shots from 18a's with the specialties in their captions, and reads "18's
  holder migration" as 18's Party migration); 32b (its "alert the office" is shown at review by 21a,
  not 21, since the office's review moved to 21a: its three mentions and its handoff re-pointed).
- **Parked:** US-01.1.5 and DM-65 (the A and B split of a session, Proposed: the catalogue keeps one
  List per Slot until it is agreed, and DM-65 says not to build it before then) and US-03.7.4 (pre-op
  consults in AA's room, Proposed, on OQ-138, which has no recommendation and leaves who is billed,
  how it is priced and whether it ties to a Procedure open). See Parked.
- **Left the plan:** Retired US-04.2.4, US-04.1.6 and US-04.2.10; EP-04, FT-04.1 and FT-04.3 now
  groupings; US-03.2.1 now Matches (carried across on 23); DM-16 and DM-57 no longer held; RV-12 no
  longer listed. US-04.2.13 (export and re-import Contracts) and US-04.3.7 (confirm a price with the
  hospital) stay Future Work. US-15.0.7 (changes show without signing out) Matches: the in-browser
  store updates every open screen.
- **Unchanged:** 26, 32a, 38a, 39a and 40a (only their drift baselines move). 26's doc says Phase
  20's interim Booking `prepaymentRequired` flag is untouched; 20 now reads prepayment from the
  Contract's prepaid setting and keeps only `prepaymentDetail` until 27, so the flag may not exist.
  The sentence only tells 26 to leave it alone, so it is harmless either way, and 26's drift check
  covers it. 38a's US-07.2.1 gained a "why" sentence and labelled criteria only. 32a and 38a are
  safe to start while this update lands: none of their covered items changed in substance, and
  US-04.3.11 (a moved Booking keeps its Contracts) belongs to the Contracts track (21a), not to 32a.
- **Files:** 18a's doc is `phase-18a-specialties-funding-tags-and-fallbacks.md`, 21a's
  `phase-21a-rvg-detail-completion-and-review.md` and 32c's `phase-32c-out-of-hours-lists.md`. 18,
  19a, 20, 20a, 21, 24 and 25 keep their file names, pinned by the plan tools, although their titles
  moved on.

**Placement notes for the 2026-11-04 working-decisions update** (catalogue `a68f09b`; historical, the 2026-11-10 notes above win where they differ).

- **One new phase, 33a** (Stubs on a List; Intake, 1 session, straight after 33). OQ-118 is answered
  (D66): FT-02.6, US-02.6.1 to US-02.6.3 and DM-58 leave the parked list. A letter suffix, not a new
  number at the end of the track, because 34's PDF rows and 40's waiting view build on its stub and
  resolve path. It closes US-02.1.4's new stub criterion, which stays on 33's covers.
- **Reworked:**
  - **34** takes FT-02.2, US-02.2.1 and the new DM-61 (OQ-108 answered, D51: the rooms' PDF lists are
    in the first release, through 33's screen) and EP-14 (the first-release sync of both integrated
    hospitals, D52 part 2 assumed), and becomes 2 sessions with a cut line, retitled "Hospital sync, the rooms' PDF
    lists and the S1 rebuild". RV-12 stays on its covers, its "hide from demo" overtaken: the PDF
    pathway becomes product, so its Future badge, the direct ingest and the canned fixtures go.
  - **20** builds the office's picker as the step rail (D16 extended): who the invoice goes to,
    prepaid or which Contract, the price; No contract (RVG) the answer for an unprepaid patient
    invoice; the RVG code handed to the anaesthetist. This overtakes the d436947 note below that
    `contract-picker-mock/` was not a design decision for 20.
  - **17a** builds OQ-128's answer (D75): a surgeon at one or more rooms, the first their main room,
    for built 17's FT-13.6, US-13.6.1 and US-13.6.2 (Contradicts, kept on 17's covers), with OQ-127
    part 5's default in its one helper (D74 extended); 2 sessions; retitled.
- **New covers:** 37 takes FT-10.2 (OQ-111 answered, D53: the in-app "Run payables" payout moves to
  Xero's payables run, detected by the engine); 22 takes the new DM-62 (the anaesthetist's GST number
  on the invoice, AA as agent, held on OQ-29).
- **Answers built in place (light):** 21 (OQ-93 part 4: the anaesthetist sees the approval number; no
  provisional label); 27 (OQ-119 answered: after sending, an office warning until 41; no provisional
  caption) and 41 (US-06.3.7 shares the cancellation function, no provisional label; the refund raised
  by the system, paid in Xero); 27a, 36, 39 and 39a (payments made in Xero, D53); 26 (bank details
  are master data the payables views can show, not a field the app pays from); 38 (the payout made
  in Xero, using 37's control when it exists); 38b and 39b (OQ-121: events billed in the next run,
  bundled by billable party, never held; the "travels with the Procedure" branch goes); 18, 19a and
  25 (OQ-131, D77: whole-Contract dated versions kept as the default, provisional; US-04.2.10 and
  US-04.2.14 back to Open); 20a (US-03.1.9's step rail paragraph: an RVG code left for the
  anaesthetist marked to fill in); 33 (rows carry their source for 34; no-NHI rows expose their List
  for 33a; the row panel uses the step rail); 35 and 40 (the main room's email for a surgeon at
  several rooms; 40 resolves through 33a's path and now depends on 33a, and its PDF-ingest create
  path goes: after 34 the NHI guard and its tests cover `createBooking`, 33's `decideImportRow` and
  33a's resolve path, never `ingestPdfRow`); 42 (a surgeon loads at each room listed); 43 (the
  generator's surgeons at one or more rooms and its stubs); 43a (help for the step rail and the
  approval number); 44 (the open-defaults lists, the stub and PDF beats, payments in Xero; surgeon PDF
  upload leaves its Future-scope lists and the "Ingest PDF row" audit row goes; depends on 33a).
- **Neighbour readings re-pointed (light; covers unchanged):** 23 (its handoff read 20's picker as a
  candidate list with No contract (RVG) first under holder headings: it now reads 20's step rail, the
  one path function with US-04.3.2's rules inside it, and how `addProcedure` and
  `setProcedureContract` choose an additional Procedure's Contract, US-03.2.3); 40a (after 34 the
  rooms' PDF list is a product intake source on 33's screen, not Future scope, and 34 never built
  `autoMatchDemo`; the as-typed NHI check, from the one validator with no Hub lookup, also marks the
  NHI field of 34's PDF row correction and the waiting row's "Add NHI"). 21's, 42's and 20a's light
  edits also re-point their readings of 20's picker ("No contract (RVG) first") to the step rail, and
  20a's "Surgeon PDF ingest (Future scope)" passages keep the code they edit without the Future-scope
  claim.
- **Left the parked list:** FT-02.6, US-02.6.1 to US-02.6.3 and DM-58 (to 33a). Nothing is parked.
- **Out of the plan:** US-02.2.3 (detecting Bookings removed from a re-sent List) stays Future Work;
  US-03.1.4 (both anaesthetist apps kept) still Matches on built 29.
- **Unchanged:** 19, 19b, 24, 32a, 32b and 38a (only their drift baselines move). 32b's US-03.6.3
  and 38a's US-07.2.1, US-07.2.3 and US-07.4.1 changed by links only (to US-13.8.3 and US-07.3.1) and
  gate nothing new; 40a's US-14.4.1 likewise, though 40a is light for the PDF passages above.
- **Files:** 33a's doc is `phase-33a-stubs-on-a-list.md`. 17a and 34 keep their file names, pinned by
  the plan tools, although their titles moved on.

**Placement notes for the 2026-11-04 update** (catalogue `d436947`; historical, the working-decisions notes above win where they differ).

- **One new phase, 17a** (Rooms without an email, and practice manager and PA contacts; Master
  data, 1 session, needs only built 17). It takes the new DM-60 and the new US-13.6.5 (Open, built
  as D74's default) and follows up built 17's US-13.6.1 (now Contradicts), which stays on 17's
  covers as the items 32b re-opened stayed on theirs: the room's email and phone optional, the
  specialist directory seed without its invented reception@ addresses, contacts on the room shown on
  the surgeon's profile, one room per surgeon (D75), and one helper for a room's email. A letter
  suffix rather than a new number at the end of the track, because 35, 40 and 42 build on it.
- **20a** builds OQ-103's answer (D37) in place of its default: the invoice description's order of
  defaults (the rooms' text, replaced by the hospital's whenever one arrives, then by a filled-in
  line description; the RVG code plays no part), the admin's free-text edit at any time on Admin
  Booking detail, and OQ-130's default (D73: an edit is kept and the office sees a newer received
  description); a "Hospital description arrives" demo action on Admin Booking detail shows the
  layering before 33 exists. Its OQ-103 provisional labels go; OQ-130 is its open question.
- **21** drops the "insurer named but no insurer Contract" review warning (its rule, sample, seed
  marker, to-do hook and copy, with 15a's stale sample text) and builds the rest of OQ-93 as
  answered (D28): the missing approval number is the only insurance warning, shown to the office and
  to the anaesthetist viewing the Booking; one approval-number field; no narrowing. Only whether the
  anaesthetist sees the number itself stays provisional. Covers unchanged.
- **In place:** 19a (US-04.2.4: the line's description, where filled in, becomes the Procedure's
  invoice description; a blank one falls through); 20 (no narrowing by insurance is answered, so
  its "if OQ-93 is answered" contingency goes; US-04.3.2's notes record a tentative "show the whole
  list" override and a suggestion from booking history, neither a requirement nor built); 22 and 27
  (print the Procedure's invoice description as answered, never the line's description directly);
  33 (a row's hospital description goes through 20a's helper; no insurer-to-Contract hint on a row);
  35 (needs 17a; an empty To where a room holds no email; the office's invoice-description edit
  through 20a's helper); 40 (needs 17a; the NHI request's To through 17a's helper, D74); 42 (needs
  17a; the surgeons and rooms sheets take the specialist list's shape, a room with no email loads,
  rows with no HPI CPN or a first name only are rejected (D76), one room per surgeon (D75), the
  holder kind "Surgeon" as AR-44 now labels it); 43 (the generator uses 20a's chain and raises no
  insurer warning); 43a (help states the answered invoice-description and insurance rules); 44 (the
  open-defaults lists: D37 answered, D28's open part narrowed, D73 to D76 new).
- **Held, not planned** (Donald, 4 November): the 23 October note's Contract model and payment
  model points (Contract and line, where the surgeon link sits, how many anaesthetists a Contract
  serves, dated versions, the held removals, Xero paying, the two ledgers). Nothing `7cd7802` put in
  is reverted, and no phase changes for them. `contract-picker-mock/` is a throwaway workshop mock,
  not a design decision for 20.
- **Left the plan:** now Matching FT-13.6 and US-13.6.2 (kept on built 17's covers). US-14.2.1 is
  Future Work (OQ-110 answered).
- **Unchanged:** 18, 19, 19b, 23 to 26, 27a, 32a, 32b, 34, 36 to 39b, 40a and 41 (only their drift
  baselines move).
- **Files:** 17a's doc is `phase-17a-rooms-and-practice-contacts.md`.

**Placement notes for the 2026-11-02 update** (catalogue `7cd7802`; historical, the 2026-11-04 notes above win where they differ).

- **No new phase.** Four phases are reworked and one widened; the rest change in place.
  - **27** takes FT-06.3 (now a gap: the prepayment's payable is the AA Holding account) and builds
    the answers: prepayment detected per Procedure, invoiced to whoever the Contract bills (D23
    revised), a line price above zero, the approval step switchable, the prepaid price never the
    anaesthetist's to change (D30), and prepaid Procedures left off the final invoice with no
    deduction line (D57, the opposite of its old default).
  - **27a** is renamed "AA Holding account and the journal transfer": the account is a payables
    creditor, only the system pays out of it, and the release is a journal transfer, not a new
    invoice pair; its trigger is a labelled default (OQ-125, D72).
  - **41** loses FT-06.4 (Retired; US-06.4.1 moves to FT-06.5 and stays here as "nothing further
    after a prepaid procedure") and takes US-06.3.7 (Open, OQ-119, D67). Cancelling a prepaid
    Booking credits or refunds automatically (D56). Retitled "Prepayment letter, cancellation and
    differences by hand".
  - **21** loses FT-11.4 and US-11.4.2 (Retired) and takes DM-59 (completion as three conditions,
    split from the billing validator). It widens the payer (a postal address, a "different payer"
    tick, a parent, guardian, benefactor or family trust) and lets the anaesthetist change the
    approval number on the day, its absence a warning.
  - **18** takes RV-39 (the Insurer master, its direct-claims flag and its default-Contract flip go:
    insurers are holders) and builds the answered holder model: invoice delivery on the holder (D55
    in part), a practitioner link to one or more surgeons (D48), and a prepaid Contract never
    editable (D30).
- **Answers built in place.** 19 holds and shows the RVG range (D35) and has no system code (D39).
  19a seeds surgeon arrangements as one Contract linked to many surgeons (D48), refuses a zero price
  on a prepaid line and keeps No contract (RVG) line-free (D49). 19b drops the pre-application
  switch (D29 part 2). 20 filters the surgeon's Contracts by practitioner ID and shows the range. 24
  adds the fixed-price and prepaid limits to the anaesthetist's gate (D65, D30). 25 drops D47's
  provisional note and US-12.1.1 (now Matches). 26 drops FT-12.1 (now a grouping) and makes the HPI
  CPN and bank details mandatory. 32a and 32b drop D54's provisional label, and 32a drops RV-27 (now
  a scaffold finding: the office's own single-Booking move is left as it is).
- **Renames and readings.** 22 reads delivery from the holder and marks invoices to post (D70). 23
  ranks prepaid Procedures with the rest. 33 keys a row's insurer on the holder and parks stubs
  (D66). 35 builds D71's default. 36, 37, 39a and 43 rename the AA Holding account and its transfer.
  38 lists payments made in the month and links each outstanding line to its Booking. 38b and 39b
  build OQ-121's default (D69); 39b's ACC pre-op follows the generic event rules (OQ-12 part 2). 39
  has no deduction line to credit. 40 shows the balance alert on the anaesthetist's List, adds the
  shared note on a List or Booking and holds demographics only where supplied. 42 loses US-11.4.1
  (Retired). 43a and 44 update their copy.
- **Parked:** FT-02.6, US-02.6.1 to US-02.6.3 and DM-58 (stubs on a List, Open, OQ-118). The 19
  October rule (D11) stands, so 33 and 40 build no stub.
- **Left the plan:** Retired FT-06.4, FT-11.4, US-11.4.1 and US-11.4.2; now Matching US-12.1.1;
  FT-12.1 now a grouping; RV-27 now a "keep as demo scaffold" finding; RV-17 no longer in the
  reverse check.
- **Unchanged:** 20a, 34, 38a and 40a (only their drift baselines move).
- **Files keep their names**, pinned by the plan tools, although the titles moved on: 27a
  (`phase-27a-prepay-holding-account.md`) and 41 (`phase-41-prepayment-followup-credits-refunds.md`).

**Placement notes for the 2026-10-20 update** (catalogue `d4db277`; historical, the 2026-11-02 notes above win where they differ).

- **Two new phases.** **32b** follows up the built Schedule track for the 19 October answers (DM-56,
  RV-25, RV-26, US-13.8.3, US-03.6.3; it re-opens built 30's US-01.5.2 and US-01.5.4, 31's US-01.6.3,
  32's US-01.5.5, FT-13.8, US-13.8.1, US-13.8.2 and DM-41, and 17's US-13.6.4 and 28's US-01.4.2,
  which stay on their built phases' covers, as built 15's Copy finding and DM-39 did when 15b removed Copy). **27a** takes
  the prepay holding account and the second pair (DM-21, FT-06.5, US-06.5.1 from 41; US-09.1.3 and
  FT-09.1, now gaps again; RV-24), so prepaid money reaches the anaesthetist again straight after 27.
- **38a moves forward and widens**: the edit window to AUTHORISED (DM-55, RV-19, FT-07.2, US-07.2.3)
  joins its main view and search, the archive becomes search, and it runs after 32b and before 20.
- **18** drops first and third party for holder kinds and settings (editable, prepaid), allows
  Contracts with no lines, keeps versions never backdated and never deleted (RV-32), and gives
  US-04.2.10's staged submit and relink to 25. **19** loses the procedure list, the general procedures
  and the two tabs (US-05.1.6 Retired): RVG groups with a hidden key and a type-ahead. **19a** makes
  lines standalone with a default RVG code and a line key, collapses the resolver to starting values
  on the Procedure, and takes the combinations as lines (US-04.2.11 from 23). **19b**'s age and P1
  are pre-applied and removable, never locked (Donald, 2026-10-20).
- **20** builds a picker of Contracts then lines, an optional RVG code by type-ahead with a reverse
  lookup, and the anaesthetist's change until AUTHORISED. **20a** keeps the rooms' and the hospital's
  descriptions apart, adds the invoice description (US-08.4.6) and removes attachments (RV-01;
  US-03.1.3 Retired). **21** takes the insurer and approval number on the Booking (US-11.4.3,
  FT-11.4), "finish" for "handover" and times only where timed (US-03.3.3), the new completion rules
  (references are the office's job) and RV-21; US-08.2.1 now Matches. **22** takes the invoice
  documents (US-08.4.1). **23** loses the switch (D26 answered) and the combination Contracts.
- **24** is rebuilt around values on the Procedure, the editable flag (D50), the office changing any
  price, no reason, the discount line and the no-charge invoice (US-03.5.2, US-05.2.6, US-05.4.2
  join); there is no precedence and no price source; BillingLine's removal (DM-46) moves to 39b, and
  24 keeps the rate x time removal (RV-03). **25** takes the staged Contract changes and review
  dashboard (DM-57, US-04.1.6), US-04.2.10's submit and relink, and US-12.1.1's unit value in the
  snapshot, and becomes 2 sessions.
- **26** is repurposed: the profile prepaid settings are Retired (DM-19, FT-06.1, US-06.1.1,
  US-06.1.2, US-12.1.3 leave), so it is the profile with bank details (FT-12.1, US-12.1.4) and the
  GST period's removal (RV-02); it needs nothing unbuilt. **27** starts prepayment from the Contract's
  prepaid setting and generates the invoice at admin approval (D6, D27, D38), and no longer needs 26.
  **41** loses the trust account to 27a and the payee repoint altogether.
- **32a** builds the single-Booking move as answered (D61): only into a free colleague's session as
  a new List, notification optional, no repoint; it takes RV-27 (the office's single-Booking move).
- **33** turns the reschedule into a cancellation plus a new Booking (D62), parks rows with no NHI
  (D11) and needs no procedure match (D33). **34** loses FT-14.6 (its stories are all Future Work:
  no auto-match toggle and no manual-provider sheets; a manual sheet imports through 33) and takes
  RV-12, RV-14 and RV-16. **36** takes US-08.3.1 (the pair created with the invoice, the
  holding-account legs). **38** loses US-12.1.2 (Retired) and builds a monthly report of payments
  passed. **39** builds the combined split after sending only (D41) on combination lines. **39a**
  loses FT-10.2 (now Matches). **39b** replaces other billing lines with billing events and removes
  BillingLine (DM-46); US-03.3.6 is Retired. **40** builds the mandatory NHI (D11 answered) and takes
  EP-11, FT-11.3, US-11.1.1, RV-20 and RV-36.
- **Files keep their names**, pinned by the plan tools, although several titles have moved on:
  19 (`phase-19-rvg-and-procedure-masters.md`), 19a (`phase-19a-default-rvg-contracts.md`), 20a
  (`phase-20a-source-wording-and-procedure-stack.md`), 21, 24 (`phase-24-anaesthetist-adjustment.md`),
  25 (`phase-25-contract-lock-at-authorised.md`), 26 (`phase-26-prepaid-settings-and-profile.md`), 34,
  38a (`phase-38a-find-past-work.md`) and 41.
- **Left the plan:** Retired US-03.1.3, US-03.3.6, US-05.1.6, FT-06.1, US-06.1.1, US-06.1.2,
  US-12.1.2 and US-12.1.3; FT-14.6 out of scope (its stories are all Future Work, as are FT-02.2's);
  now Matching US-08.2.1 and FT-10.2; DM-19 dropped; RV-15 and RV-17 now "keep as demo scaffold"
  findings, not units.

**Placement notes for the 2026-10-08 update** (catalogue `60e2d1e`; historical, the 2026-10-20 notes above win where they differ, and RV ids below use the 2026-10-08 numbering).

- **15b also renames DRAFT to ACTIVE** (RV-36), early, so every later phase works in the new
  lifecycle's words; the DRAFT state for Draft Lists (DM-52, EP-07, FT-07.1) is 31's.
- **17 widens** from a blacklist to private two-way preferences, not preferred and preferred
  (US-13.6.3, US-13.6.4, OQ-43 answered), and admin-only priority tiers (US-01.3.6, DM-54), and
  becomes 2 sessions. The anaesthetist-side prompt the old plan gave 32 and 32a goes (US-01.4.5).
- **18 is rebuilt** around contract holders (DM-48, US-04.1.5), dated versions (US-04.2.10, OQ-48)
  and one No contract (RVG) (DM-49, RV-33, OQ-78): categories, multi-dimension scope, the payment
  setting, required inputs and the line extras go. It keeps the Type 2 and Type 3 pricing terms in
  place for 19a, so fees do not move.
- **19 narrows** to RVG groups, the procedure list with a general procedure per group, and the
  two-tab picker (DM-13, FT-05.1). **Modifiers move to the new 19b** (DM-44, FT-03.3, US-03.3.4,
  US-03.3.8, US-05.1.4, US-05.1.5, RV-23, RV-35, RV-38): they became itemised records with locked age
  and included P1, an explanation each, and the real RVG table, which together would pass two
  sessions inside 19.
- **19a is repurposed.** The default RVG Contracts it was to build are retired (FT-04.4, US-04.4.1,
  US-04.4.2), so it builds the Contract lines (DM-09, FT-04.2, US-04.2.4), the line, procedure, group
  resolver (DM-43), the anaesthetists' own price lists (US-04.2.14, OQ-91 answered) and the time tiers
  as data (US-05.2.2), and drops the ordinal key (RV-34). Its file name stays.
- **20a is new**: source wording and the three-part stack (DM-51, US-02.5.7, US-03.1.9, US-03.1.2,
  US-02.4.1), seeded from AR-35, after 20 and before 21 and 33.
- **20** loses DM-12 (to 21), DM-37 (merged into DM-10), RV-27 (dropped) and US-03.1.2 (to 20a), and
  takes US-03.3.1 (the two-tab pick then the Contract, with starting units).
- **21** loses US-04.2.7 (Retired) and US-04.3.7 (Future), and takes the payer on the Booking, the
  insurance indication (DM-12, OQ-93) and grouping by billable party (US-08.2.1).
- **22** loses US-04.2.12 (Retired) and DM-27 (merged into DM-22, 36); the split becomes a Booking
  action (RV-37).
- **23** loses FT-03.2 (now Matches, carried across), US-04.2.5 and US-05.3.4 (Retired); OQ-15 is
  answered and OQ-90's default builds the rule.
- **24** becomes the price precedence phase (DM-50, US-05.2.5, US-05.4.3); US-05.2.6 now Matches and
  is carried across by 18, 19a and 24.
- **26** loses DM-33 (merged into DM-32, on 17). **27** loses the estimator, the contingency units,
  the estimated duration and the excess path (US-06.2.3 to US-06.2.5 Retired, DM-40 dropped, OQ-38
  answered) and takes US-03.1.8 and US-08.2.2.
- **30** takes DM-53 (recurring bookings); **31** takes DM-52, EP-07 and FT-07.1 (OQ-86 answered).
  **32** no longer needs 27 or a preference prompt; **32a** drops DM-06 (merged into DM-42).
- **33** now depends on 20a and shows the source wording on every row (US-02.1.2); created Bookings
  wait for the office's Contract. **35**'s OQ-82 is answered (manual only).
- **38** loses US-07.2.1 and D9's default to **38a**, which becomes the anaesthetist's main view,
  archive and search (US-07.4.1, US-07.4.2, FT-07.4, OQ-31 answered) and is 2 sessions.
- **38b** and **39** add the anaesthetist's own additional invoice and credit note (US-08.6.3,
  US-08.6.5); 38b now depends on 38a. **39a** takes the weekly payment cycle (US-10.2.7, FT-10.2) and
  is 2 sessions. **39b** loses the UNIT x RATE and Contract add-on fee lines (US-03.3.6).
- **40** loses DM-47 (merged into DM-23, on 36; 40 still builds the follow-up tools). **41** is rebuilt
  around "nothing automatic, by hand" (US-06.4.2 Retired). **42** takes OQ-100's default and 19b's
  modifiers. **43a** keeps the stack on anaesthetist screens.
- **40a and 43 change only in what they build on.** 40a's add-booking forms are the new ones (an
  ACTIVE List with no "Open" label, 19's two-tab picker, 20a's "as given" field, 21's payer on the
  Booking in place of the billable-party fields). 43's generator builds the new shapes (recurring
  bookings, holder-fit Contracts or No contract (RVG), a payer on every Booking, first-party Contracts
  for any prepaid set) and is now 2 sessions, as its doc already expected.
- **Left the plan:** Retired US-04.2.5, US-04.2.7, US-04.2.12, US-04.4.1, US-04.4.2, FT-04.4,
  US-05.3.4, US-06.2.3, US-06.2.4, US-06.2.5 and US-06.4.2; Future Work US-04.3.7 (and the new
  US-02.3.5 and US-04.2.13); now Matching FT-03.2 and US-05.2.6; DM-06, DM-27, DM-33, DM-37 and DM-47
  merged into other deltas, DM-40 dropped; RV-27 dropped (absorbed into RV-13).

**The critic's review of the 2026-10-08 update** was followed in full: 40a and 43 were added to the
re-planned phases; 20 owns removing the payment category everywhere and 27 removes only the interim
flag, the deposit and split paths and `prepaymentDetail`; 27 creates the prepayment's ledger pair and
draft Xero pair at generation, with approval only sending it (US-06.3.1, US-09.1.3); 19b asks for a
claimed modifier's explanation when it is saved, with 21's completion block as the backstop
(US-03.3.4, US-03.6.1); 20's interim keeps the seeded guardian `billablePartyId` overrides until 21;
21, 24, 25, 19b and 20a link the AR-28, AR-29 and AR-30 regions they build (AR-35 has no regions, so
20a cites its note's "Illustrative source wording" heading by name); 38 depends on 36 only, and 38a
on 28 and 38.

**Earlier placement notes** (historical; the later notes above win where they differ, and RV ids use the numbering of their day).

**The critic's review of the 2026-10-03 update** was followed in full. Where it offered a choice,
or the plan went further:

- 39 was too big for two sessions, so it is split. The new 38b takes the event element, its review
  step and the events list, as suggested, **and also the additional invoice**, so 38b has a
  deliverable that can be demoed on its own instead of an empty list; 39 keeps the credit work.
- Also followed: one admin-editable balance threshold in 40 (a single field, not US-13.7.4's
  settings page); "Open in Review" in 37's monitor, with authorising kept on Review and logged for
  the owner; 39 added to 40's dependencies and 32a to 41's; 39b alone builds billing lines.

**Placement notes for the 2026-10-01 update.**

- 15a is new and early: the catalogue's warning routine is cheap to build over today's data, and
  four later phases plug a rule into it. Removing the gate there (D5) gives an early, correct S4 Beat 1.
- US-05.5.2 (ACC pre-op codes) moves from 19 and US-03.3.6 (other billing lines) from 39 to 39b,
  because the ACC pre-op assessment and late lines are now pre-op and post-op events.
- US-08.6.4 is unparked into 39 now that OQ-53 is answered; its combination Contract is 23's.
- 39a is split from 39 so neither passes two sessions: 39 raises the negative invoice, 39a nets it.
- US-09.3.1 goes to 16, which already edits the Xero simulator.
- US-15.0.1 gets its own late phase (43a) once the capture screens settle.
- 32 becomes the anaesthetist's own move; the payee repoint of a moved prepaid Booking (US-06.5.4)
  is 41's, beside the trust account. (Since 2026-10-03 the doer rule, US-01.4.6, is 32a's.)

**Placement notes for the 2026-10-03 update** (the three 2026-10-02 meetings with Greg).

- **15b is new.** The owner asked for Copy a Booking (US-02.4.3, Retired) to be removed. Phase 15
  built it, and RV-03 and DM-39 stay on 15's covers, so the removal is 15b's work, beside hiding
  photo capture (US-02.4.4 is Future Work; RV-25).
- **28 takes the horizon setting, free-by-default generation and the finders** (FT-01.1, US-01.1.1,
  US-01.4.2); US-01.1.1's recurring-clash criterion is completed in 31.
- **31 no longer turns an anaesthetist's unavailability into Draft Lists**: the anaesthetist chooses
  (US-01.5.5, in 32), and office-marked sickness stays a conflict (OQ-81 part 3). 31 turns a
  recurring clash into a Draft List instead (OQ-81 part 2).
- **32 takes the shared notification pool** (FT-13.8, US-13.8.1, US-13.8.2, DM-41) and
  return-or-assign (US-01.5.5, RV-30). The single-Booking move (US-01.4.7, DM-42), the doer rule and
  FT-01.4 are 32a's.
- **33** loses US-02.5.1 and US-02.5.2 (Future Work) and keeps the automated S13 to S15 out of the
  demo (RV-28). **34** loses surgeon PDF upload (US-02.2.1, Future Work) and the sync-state criteria
  US-02.1.5 dropped, badges the Surgeon PDFs tab (RV-26), and is 1 session. **35** loses concurrent
  edits (US-02.5.6, Future Work) and US-02.5.5 (Matches), and takes FT-02.3, the US-02.3.4 templates
  and RV-31.
- **37 takes the processing monitor restyle** (US-13.3.1), with "Open in Review" on Lists awaiting
  approval, and is 2 sessions.
- **38b is new, split from 39** so neither passes two sessions. Because additional invoices and
  credits are events (OQ-63), 38b builds the event element and its review step (DM-17), the events
  list (US-03.7.3) and the additional invoice (DM-18, RV-10, US-08.6.1, US-08.6.3). 39 keeps the
  credit work: the credit note option (US-08.6.5), the rebill from copied lines (US-08.6.6),
  credit-note audit (US-13.5.2, DM-45), credit in full and rebill, and the combined split. 39b adds
  the pre-op and post-op kinds.
- **40** drops US-11.1.1 (Matches), gets one admin-editable balance threshold and depends on 39.
  **41** depends on 32a. **43a** takes anaesthetist sign-in (US-13.5.3, PWA first).
- FT-13.5, RV-12 and US-03.1.3 now Match and stay on built 14 and 15.

### Demo triggers

Phase 14 built the mechanism and re-homed every existing trigger. Later phases register new entries
or re-point existing ones; none adds a trigger to the Control Panel page. Each entry declares:

- the route patterns it belongs to;
- the surfaces it shows on: harness bar, PWA sheet, or both;
- a `run(api, ctx)` that acts on the entity in the URL (`listId`, `bookingId`, `invoiceId`,
  `dateISO`) or on screen state published through `useDemoTriggerContext` (an edit draft, a selected
  import row, a local tab), not a hardcoded seed id wherever possible;
- a disabled state.

The harness bar shows a trigger only on its screen. The Control Panel keeps the scenario jumps, the
clock and reset, and lists every trigger under its screen with a link that opens it. Trigger bodies,
the context hook and the shared actor constants live in `src/shared` or `src/store`, so the PWA
purity test holds.

Product actions stay in the product UI, not the bar. Examples are "Create additional invoice",
"Credit note", "Credit in full and rebill", "Split", "Approve and send", "Run monthly fee invoices",
"Draft update email" and "Import hospital bookings" (with a badged sample-file picker). 15a's "Raise
sample warnings" is one shared trigger: each phase that adds a warning rule adds its sample to it.

### PWA parity

The PWA has no harness bar and no Admin app, so a handset demo cannot switch to the office. Every
phase whose beat has a mobile side that waits on the office, a colleague or a backend event
registers a PWA-surface entry for the mobile screen concerned, for example "Office authorises this
List" (14), "Office clears this warning" (15a), "Office approves this Contract change" (21), "Office
approves and sends the prepayment invoice" (27), "Office assigns a Draft List to me" (31),
"Colleague moves a List into my free session" (32), "Colleague moves a Booking to me" (32a: a new List
in my free session), "Office resolves this alert" (32b), "Office adds an out-of-hours List for me
tonight" (32c), "Hospital row arrives and the office matches
it" (33), "Office adds the NHI to this stub" (33a), "Office reviews this additional invoice" (38b), "Office reviews this event" (39b), "Office
adds the NHI" (40) and "Sign out" (43a). These stand-ins show on the PWA only: in the framed build the
presenter plays the office in Admin. "Play the office" stays as a signposted scaffold, defaults to OFF
and shows a badge when on, and loses nothing because 14 added the per-List trigger. Phase 44 checks
PWA parity beat by beat.

### Demo guide

- **Each phase patches the beats it breaks,** in the same session: `docs/demo-guide` (run sheet,
  cheat sheet, workflows, personas), the matching sections of `master-demo-guide.html`, and the
  Control Panel scenario text. The self-contained guide presenters use is never more than one phase
  stale. Each phase doc names the beats in its "Demo guide updates" section.
- **Each milestone phase (38a, 25, 27a, 35, 39a; 16 is built) ends with a consistency read** of
  `master-demo-guide.html` against the run sheet.
- **Phase 44 rewrites the S1 to S5 run sheet** around the new model and regenerates
  `master-demo-guide.html` in full.
- **Known beats the 2026-10-20 changes break, and who patches them:** 32a S2's single-Booking move (a
  new List in a free session); 32b S2 Beat 3 and 3a (sickness forces a return or a hand-on, with no
  conflict; the conflict dashboard shows hospital closures only; notices ticked resolved); 38a the
  cheat sheet's "office-only edits after submit" lines and any beat narrating billed Lists vanishing;
  18 the cheat sheet's Contracts section (holders and settings, no Type 1/2/3, no first or third
  party, no default hospital Contract) and S5 Beat 4; 19 and 20 S1 Beat 3's capture (the RVG code by
  type-ahead, no procedure pick, no tabs) and S1 Beat 1 and S2 Beat 2 (the office sets the Contract,
  No contract (RVG) first); 19b the workflows and personas lines on ASA (optional, nothing locked);
  20a S1 Beat 2 (the descriptions); 21 S3 Beat 1 (who is billed) and S2 Beat 4 (the child-payer
  warning); 22 S3 Beat 1's "Funder allocation" aside; 24 S5 Beat 1 (price changes with no reason);
  25 S4 Beat 3 (the billing failure re-based, no un-end-dating) and S5 Beat 4 (a staged price review);
  27 and 27a S4 Beat 1 (a prepaid Contract, the invoice generated on approval, the holding account,
  the second pair at authorise) and the cheat sheet's prepayment lines; 33 and 34 S1; 38b S4 Beat 2's
  post-op addendum; 39 a credit-and-rebill beat; 39a S4 Beat 5; 39b any billing-line narration; 40 the
  "Provisional patient (NHI pending)" scenario link; 41 any refund, trust account or payee-repoint
  narration.
- **Known beats the 2026-11-02 changes break:** 27 S4 Beat 1's deduction line (prepaid Procedures
  are now left off the final invoice) and the cheat sheet's "approval required" line (the step can be
  switched off); 27a and 36 every "prepay holding account" and "second pair" line (the AA Holding
  account and its journal transfer); 41 any narration of the office refunding a cancelled prepayment
  (now automatic); 18 and 42 the cheat sheet's Insurers master lines (insurers are contract holders);
  21 S2 Beat 4's payer (an email or postal address) and any "the office records the approval number"
  line; 39b any ACC fixed-fee Contract narration.
- **Known beats the 2026-11-04 changes break:** 20a S1 Beat 2 (the invoice description starts as the
  rooms' text, the hospital's replaces it, a filled-in line description wins, the office edits it
  at any time); 33 S1 (a hospital row's description replacing the invoice description); 21 the
  payer review aside and the cheat sheet's warnings list (no insurer-without-Contract warning; the
  missing-approval warning on the anaesthetist's Booking too); 17a any rooms or contacts line in the
  personas or cheat sheet (a room may have no email; practice managers and PAs on the surgeon's
  profile).
- **Known beats the 2026-11-04 working-decisions changes break:** 20 S1 Beat 1 and S2 Beat 2 (the
  office sets the Contract through the step rail; an RVG-priced Contract handed to the anaesthetist;
  "No contract (RVG) first" narration goes); 33a and 34 S1 (a waiting no-NHI row with its stub on the
  List; a rooms' PDF beat beside sync; the PDF tab no longer called Future scope); 37 S3 Beat 3 and S4
  Beat 5 ("Run payables" becomes the payment made in Xero and detected); 38b and 39b any "travels
  with the Procedure's invoice" event narration (the next run, bundled where it can be); 41 any
  "provisional" narration of a Contract changed after a prepayment is sent; 17a the cheat sheet's
  surgeon lines (a surgeon at more than one room); 21 the approval number on the anaesthetist's
  Booking (no longer open).
- **Known beats the 2026-11-10 changes break:** 18 the cheat sheet's Contracts section (Parties, one
  Contract per priced item, Active or Disabled, no Type 1/2/3, no versions) and S5 Beat 4 (the
  Unisports rate becomes an in-place edit, or a new Contract from a date; no "New version"); 18a the
  personas' and cheat sheet's surgeon lines (specialties) and any ACC narration (a funding tag); 19a
  S5 Beat 4's priced items and any "line" narration (a backdated price range instead); 20 S1 Beat 1,
  S2 Beat 2 and S3 Beat 1 (the decided rail: where the invoice goes, Payment type or the tag, the
  Contract by typing, "Other price"; "Needs an invoice destination"; no "working direction"); 20a S1
  Beat 2 (one procedure text, the hospital's replacing the rooms', the original in the history); 21
  S3 Beat 1 (who is billed is the Contract's setting) and the cheat sheet's insurance lines (the
  funder suggests a path; no approval warning for ACC or Health NZ); 21a S1 Beat 3's capture (no
  times or modifiers on a fixed price); 24 S1 Beat 3 and S5 Beat 1 (the anaesthetist now sees what
  the price comes to, reversing the old "no calculation" narration; a backdated range re-prices only
  unheld Procedures); 25 S4 Beat 3 (re-based on the snapshot) and S5 Beat 4 (no staged price review:
  the Contract's history); 27 S4 Beat 1 (Payment type: Prepaid, the amount read-only once invoiced,
  a typed Prepaid · Fixed price); 32c any S2 line on the AM and PM sessions (an out-of-hours List
  after PM); 35 the history narration (named office users); 43a the help desk.

### Front-end design

Every phase from 15 on touches UI, so every kick-off prompt from 15 on tells the agent to invoke the
`/frontend-design:frontend-design` skill before building or reshaping any screen, sheet, dialog,
panel, row, banner or state. The skill works inside the design system, not over it: the
`docs/design` files and `src/theme` tokens stay authoritative (PROGRESS convention 17, CLAUDE.md
"Design"), so it shapes layout, hierarchy, spacing, states and finish, never a new palette, typeface
or visual language, and the two hard rules (crimson identity only, teal the only action colour)
hold. Store, seed and pure-domain steps do not need it. A new or re-planned phase that touches UI
carries the same "While working:" bullet.

### Owner review: agents test themselves

The owner (2026-10-02) is running the phases back to back and will not review the app after each
one. One proper review comes **after all catch-up phases are finished**. So, from Phase 15 on:

- **No plan-approval stop.** After the drift check, the agent writes its step plan (in the session,
  and in the PROGRESS entry) and starts building straight away. It does not enter plan mode or wait
  for approval.
- **The agent is the tester.** It runs the phase's manual test checklist itself, in the running app
  (start root `npm run dev` in the background if 5173 or 5174 is down), driving it with Playwright
  or the `/run` skill and checking screenshots by eye. "Handset" checks use the emulated mobile
  viewport unless a real phone is already attached. Each item is reported pass or fail with its
  evidence. It never hands the checklist, a click-through or a screenshot check to the owner.
- **Defaults over questions.** Where a phase doc says "ask the owner" about a product choice, the
  agent builds the stated default, labels it provisional where the doc says so, and logs the question
  for the end-of-catch-up review instead of asking.
- **Stop and ask only when it is very needed:** a drift-check stop condition the phase doc names (a
  vocabulary rename, a reopened decision that changes the model, a covered item that has left its
  lane so the phase no longer makes sense), a blocker no documented default resolves, or an action
  that is destructive or hard to undo. Everything else is decided, recorded and carried forward.
- **Owner review queue.** Each phase's PROGRESS entry ends with a short "For the owner's review"
  list: the defaults built for open questions, provisional readings, anything logged rather than
  fixed, and the screens worth a look. Phase 44 gathers these lists into one review list for the
  owner's end-of-catch-up review.

### Catalogue screenshots

The catalogue's stories carry screenshots of the prototype, taken by the Requirements Board's capture
runner from one recipe per item (`requirements-board/requirements/capture/recipes/<ID>.json`; format, routes, hooks
and selector tips in `requirements-board/requirements/capture/ATLAS.md`). When a phase is done, the screenshots on
its stories must show what it built, and no other story's screenshots may be left showing a screen the
phase changed. Every phase therefore ends with this step, after the review pass and before the
PROGRESS.md entry:

1. **Recipes for the covered items.** For every story the phase covers (and every feature it covers
   that has no stories), create the recipe if it is missing and update it if it exists, so it matches
   what was built:
   - `status`: `captured` when the story is fully in the prototype, `partial` with an `absentReason`
     saying exactly what is still missing (and which later phase builds it), `absent` only if the
     phase built nothing visible for it (say why);
   - shots for each screen and app the story lives on (web and mobile both, where both have it), with
     states for the change the story describes (before and after, closed and open, warning and
     cleared), and the highlight on this story's area;
   - captions in the catalogue's current words (Booking, not Card), with no en or em dashes.
   `node requirements-board/agent/skills/update-build-plan/tools/recipe-status.mjs <phase>` lists the covered items and
   their current recipes.
2. **Recipes the phase broke.** Any other recipe whose route, id, text or selector the phase changed
   is updated to the new screen, keeping its shot `name`s (rename a shot only when the old name
   describes retired behaviour; the runner deletes the old generated image). A retired or Future Work item whose screen the
   phase removes gets `status: absent` with the reason "Retired: removed in Phase NN" (or "Future Work lane").
   Add `data-shot` hooks rather than brittle selectors, and move hooks with the code they follow.
   Stage a per-screen demo trigger with the runner's `trigger` step (added in Phase 14, because shots
   hide the harness bar that holds the "Demo actions" menu); on the PWA, open its Demo sheet instead.
3. **Capture.** With the prototype on 5173 and the PWA on 5174 (if they are not running, start root
   `npm run dev` in the background and stop it afterwards), run `node scripts/capture.ts --dry` in
   `requirements-board/`, fix what fails, then a full `npm run capture`. The full run rewrites only
   images that changed, links them into the items' `images`, and rewrites `requirements-board/requirements/capture/REPORT.md`. It
   must end with no failed recipe and no story without a recipe.
4. **Look at the shots.** Open the new and changed images for the covered items and check that each
   shows the built feature, the highlight lands on it, and the caption is true.
5. **Keep ATLAS current.** Where the phase changes routes, seed ids, personas, overlays or hooks that
   recipes rely on, update the matching `ATLAS.md` sections.
6. `npm run verify:board` from the repo root is green.

The runner, not the agent, writes the catalogue items' `images` and the files under
`requirements-board/requirements/assets/`; the phase still never edits a requirement's text or status. This step replaces
any older advice in a phase doc to leave screenshots stale or for the owner to re-shoot them.

**Stale captions after the 2026-10-20 update.** Many current captions describe the old behaviour.
The phase that rebuilds the screen replaces them when it updates the recipe, and its "Catalogue
screenshots" rows say what the new shot must show. The change logs name: a required reason on
US-03.5.1, US-05.4.1 and US-05.4.2 (24, no reason); "handover" on US-03.3.3 and US-03.6.1 (21,
"finish"); the GST period on US-12.2.2 (38, a monthly report) and US-13.4.1 (42); "NHI pending" on
US-11.1.4 (40); the availability conflict on US-01.5.2 and US-01.5.4 and the notices on US-13.8.1
(32b); the day move on US-02.5.2, now Future Work's automatic path (33 marks its recipe absent if its
screen goes); the prepayment invoice on US-06.3.1 (27, generated on approval). Still standing from
2026-10-08 where not yet rebuilt: US-04.3.3 (20, No contract (RVG) first), US-03.3.4 (19b, optional
itemised modifiers, nothing locked), US-06.2.2 (27, the line's price), US-08.2.2 (27, nothing left to
bill), US-06.4.1 (41, the by-hand routes), US-04.2.2 (24, the line terms and the editable flag), the
US-05.1.x captions (19, 19b), US-03.1.2 and US-03.1.9 (20a, the descriptions with the Contract), the
US-11.2.x captions (21, the payer on the Booking) and US-07.4.1 (38a, gone at AUTHORISED and found by
search). Since 2026-11-02: US-08.2.2 (27, left off, no deduction line), US-06.4.1's balance-invoice
shot (41), US-06.3.1's Xero pair to the AA Holding account (27), US-06.5.1 (27a, AA Holding account),
US-11.4.3 and US-11.2.x (21, editable on the day, a postal address), US-05.5.2 (39b, a pre-op event,
not a fixed-fee line), US-12.1.4 (26, mandatory) and the retired FT-06.4, FT-11.4, US-11.4.1 and
US-11.4.2 (absent, by 41 and 18). Since 2026-11-04: US-08.4.6, US-03.1.9 and US-02.5.7 (20a, the
order of defaults and the office's edit), US-07.2.2 and US-13.7.1 (21, no insurer-without-Contract
warning; US-13.7.1's recipe is built 15a's, updated by 21), US-11.4.3 (21, the warning on the
anaesthetist's Booking), US-13.6.1 (17a, a room with no email) and the new US-13.6.5 (17a). Since
the working decisions (`a68f09b`): FT-13.6, US-13.6.1 and US-13.6.2 (17a, a surgeon at more than one
room); FT-02.6 and US-02.6.1 to US-02.6.3 (33a, new recipes) and US-02.1.4's stub state (33a);
US-02.2.1 and FT-02.2 (34, the PDF list through the matching screen, no longer Future scope); US-04.3.4,
US-04.3.3 and FT-04.3 (20, the step rail); US-11.4.3 and US-03.6.1 (21, the anaesthetist sees the
approval number); US-09.2.4 and FT-10.2 (37, paid in Xero); US-03.7.2 and US-05.5.2 (39b, the next
run); US-06.3.7 (41, no provisional caption); US-11.1.4's old "NHI pending" caption (40). Since the
flat Contract model (`efe123c`; the change log lists the old-prototype screenshots to recapture):
US-04.1.1, US-04.1.2, US-04.1.4, US-04.1.5 and US-04.2.1 (18, Parties and flat Contracts, Disabled
not deleted); US-13.4.4, US-13.4.5, US-13.6.6, US-04.2.16, US-04.2.17, FT-05.5 and US-05.5.1 (18a, new
or ACC as a tag) and US-13.6.2's profile (18a, specialties, kept by 17a's later US-13.6.2 and
FT-13.6 re-shoots); US-05.1.1 (19, NZSA groups); FT-04.2,
US-04.2.15, US-04.2.18, US-04.2.11 and US-04.2.14 (19a, price ranges and the Contract's fields), with
the retired US-04.2.4 and US-04.2.10 absent; US-04.3.1 to US-04.3.4, US-04.3.8, US-04.3.9, US-03.3.1
and US-03.4.1 (20, the decided rail); US-02.5.7, US-03.1.9 and US-08.4.6 (20a, one procedure text, the
admin's edit wins); FT-11.2, US-11.2.x, US-11.4.3 and US-04.3.10 (21, Parties and "Suggested");
US-03.3.9, US-03.3.3, US-03.6.1, US-07.2.2 and US-04.3.11 (21a); US-04.2.8, US-08.4.1 and US-08.4.2
(22, no portal shot); US-05.3.1 (23); US-04.2.2, US-05.2.5, US-05.2.6, US-05.2.8, US-05.4.1 to
US-05.4.3, US-03.5.1, US-03.5.2 and US-03.3.10 (24); US-04.1.3 and US-04.3.5 (25), with the retired
US-04.1.6 absent; FT-06.2, US-06.2.2, US-06.2.6 and US-06.3.1 (27); US-01.1.6 (32c, new); US-02.5.8
(35, new); US-03.1.10 (38b, new); US-15.0.8 (43a, new). Recipes and images are never touched while
updating the plan.

### Confirm before building

These phases carry unresolved open questions (OQ) or Verify, Open or Proposed items. Each checks them
at its drift check, and if they are still open builds the owner-decision default (the open D rows) or
the recommended reading and labels it provisional in the UI.

| Phase | Items | Open questions |
|---|---|---|
| 17a | US-13.6.5 (Open): where practice manager and PA contacts belong and where they come from, a surgeon's own email, and which room's contacts apply for a surgeon at more than one room (part 5, new; D75 answered: a surgeon at one or more rooms); an address book (OQ-126, nothing built) | OQ-127 |
| 18 | US-04.1.1, US-04.1.2, US-04.1.4, US-04.1.5 and US-04.2.1 (Verify: Donald's 5 November decisions, not yet confirmed by AA or Greg): the Party kinds (a funder apart from an insurer, our reading), a prepaid Contract always billing the payer (at Confirm), a Disabled Contract left to bill as normal, a dated setting change as a new Contract with no list of affected Procedures; the Party's other delivery outputs | OQ-73, OQ-114, OQ-133, OQ-135 |
| 18a | US-13.6.6 (Verify): several specialties per surgeon (Donald's D3; Ben said no); the starting specialties list (our reading); US-13.4.5, US-04.2.16, US-04.2.17, FT-05.5 and US-05.5.1 (Verify): any overlap of specialties matching, a tag naming its funder (our readings) | none |
| 19a | FT-04.2, US-04.2.15, US-04.2.18, US-04.2.11 and US-04.2.14 (Verify): backdated price ranges (Greg said on 23 October a Contract cannot be backdated; Donald's D6 allows it); a list of the Procedures a new range re-prices | OQ-133 |
| 19b | US-03.3.4 and US-03.3.8 (Verify): the age bands and stacking (pre-application settled by Ben) | OQ-95 |
| 20 | US-04.3.8, US-04.3.9, US-04.3.2, US-04.3.3, US-04.3.4, US-03.4.1 and US-03.3.1 (Verify: Donald's D7 and D8): the rail's readings (the List's hospital offered with no candidates, auto-fill, who may type an amount on a fallback, the anaesthetist never moving onto or off prepaid); a Disabled Contract on an open Procedure | OQ-135 |
| 20a | US-02.5.7, US-03.1.9 and US-08.4.6 (Verify): the hospital's procedure text replacing the rooms' with no check against them (agreed by Ben and Vanessa on 5 November, not yet by Greg); views per app (OQ-130 answered: an admin's edit always wins) | none |
| 21 | FT-11.2, US-11.2.1 and US-11.4.3 (Verify): a prepaid Contract billing the payer (at Confirm); the approval-number warning for insurers only (our reading); the "Suggested" path's test order (our reading); where the payer-contact rule is enforced; posted invoices; holder references on the Booking | OQ-73, OQ-122, OQ-136 |
| 21a | US-03.3.9, US-03.3.3, US-03.6.1, US-07.2.2 and US-04.3.11 (Verify): the review flags (our reading), "Needs a price" blocking completion (our reading), a moved Booking's flag (our reading); a review flag for a Disabled Contract | OQ-135 |
| 22 | US-08.2.3, US-04.2.8 and US-08.4.2 (Verify), US-08.4.1, US-08.4.5 and US-09.1.4 (Proposed), DM-62: whether % shares must total 100; GST agency, the anaesthetist's GST number, the BCTI's new name and its granularity; the layout from whether the Contract bills its holder (our reading); the Party's delivery by email or post for now (our reading) and its other outputs; posted invoices | OQ-29, OQ-114, OQ-122 |
| 23 | Which Procedure is primary (Vanessa takes the most expensive; not settled, no question yet); US-05.3.1 (Verify): base units on a mixed Booking whose primary is on a fixed or open price (FT-05.3, not edited, still splits modifiers across every Procedure) | OQ-132 |
| 24 | US-04.2.2, US-05.2.5, US-05.2.6, US-05.2.8, US-05.4.1 to US-05.4.3, US-03.5.1, US-03.5.2 and US-03.3.10 (Verify): the office's prepaid price read-only once invoiced (our reading, narrowing OQ-96's 28 October wording); the price shown to the anaesthetist (not yet put to Greg); a list of re-priced Procedures; holder references | OQ-133, OQ-136 |
| 25 | US-04.3.5 (Agreed; "Needs a price" blocking AUTHORISED is our reading), US-04.1.3 (Verify), US-08.1.1 and US-08.4.4 (Proposed) (OQ-100 and OQ-131 answered) | none |
| 27 | FT-06.2, US-06.2.1, US-06.2.2, US-06.2.6 and US-06.3.1 (Verify): a prepaid Contract always billing the payer (at Confirm); the amount read-only once the invoice is raised (our reading); US-06.3.5 (Verify): the re-check before the invoice is generated (after sending, a cancellation, OQ-119 answered: 41's, an interim warning here); whether the prepayment invoice names the anaesthetist; the prepayment alert beside the balance alert | OQ-73, OQ-120, OQ-134 |
| 27a | FT-09.1 (Proposed): the release trigger (authorisation in the catalogue; Greg said "confirmed and submitted"); OQ-111 answered: the payment is made in Xero | OQ-125 |
| 32a | US-01.4.6 (Verify): the doer rule's trigger (colleagues by availability alone is answered, D54) | none |
| 32b | US-13.8.1 (Verify): the panel placement is our design; the tier labels (Ben's ranking) | OQ-102 |
| 32c | US-01.1.6 (Confirmed; D84 answered 2026-11-10): an out-of-hours Slot the office opens, one a day, any List in it, a full session for availability; who opens one when the office is closed is still open | none |
| 33, 33a, 34 | FT-02.1, FT-02.2, FT-02.6 and US-02.6.1 to US-02.6.3 (Verify), US-02.1.5 (Proposed): the delivery format per hospital; which two hospitals sync (Ben named Forte; part 2 assumed); what a stub shows, how a List holding one reads and that the Booking takes its place (our reading, 33a); how a re-sent PDF list is matched to its List (our reading, 34) | OQ-13, OQ-109 |
| 35 | US-02.3.3 (Verify): whether emailed Lists and update emails stay; whether the email goes to a surgeon's own PA, and which room's address for a surgeon at more than one room; US-02.5.8 (Verify): named office users (our reading) and whether the anaesthetist sees the history (OQ-130 answered) | OQ-124, OQ-127 |
| 37 | US-09.2.4 and FT-10.2 (Verify), US-10.2.4 (Proposed): payment made in Xero (OQ-111 answered); a cancelled prepayment's refund paid in Xero too (a reading, for Greg); the grouping and filters are Greg's suggestions; approval kept on Review behind "Open in Review" (our reading); US-13.2.4 (Proposed): which accounts the reconciliation status checks waits on Greg and Sam's process maps (the clearing account not modelled) | none |
| 38 | US-12.2.2 (Verify), FT-12.2 (Proposed): payments made in the month, the GST agency treatment, the BCTI per weekly run floated | OQ-29, OQ-47 |
| 38b | US-08.6.1 and US-08.6.3 (Verify); the user-facing name "event" (how and when an event is billed answered, OQ-121); US-03.1.10 (Proposed): whether events billed on an invoice of their own count in the Booking's total, and whether the total includes GST | none |
| 39 | FT-08.6, US-08.6.2 and US-08.6.5 (Verify), US-08.6.6 (Proposed) | none |
| 39a | US-10.2.6 (Verify), US-10.2.7 (Proposed): who approves, the 20th-of-the-month fit, a balance check and a BCTI per weekly run (where payments are made answered: in Xero); on 10 November Greg's proposal moved to a Monday to Sunday week paid Thursday with nothing carried forward, not agreed, so US-10.2.7's days stand | OQ-47, OQ-29 |
| 39b | US-03.7.2 (Verify): the next-run rule as answered (OQ-121); US-05.5.2: the ACC codes (part 1) | OQ-12 |
| 40 | US-11.3.2: the editable threshold beside US-13.7.4's "fixed until AA asks" (Future); US-11.1.4 and US-11.1.5 (Verify): the stub beside a waiting row (33a's); which contact the NHI request goes to, and which room's for a surgeon at more than one room; EP-11 (Verify): insurers and funders as Parties; the balance alert beside the prepayment warning | OQ-127, OQ-134 |
| 41 | US-06.3.7 (Verify): a Contract changed off prepaid after sending, as answered (OQ-119); a part credit; whether the letter names the anaesthetist; the release trigger; the refund paid in Xero (a reading) | OQ-97, OQ-120, OQ-125 |
| 42 | US-13.4.1 (Verify) and US-13.4.3 (Proposed): the cutover load's Parties, specialties, funding tags and one Contract per priced item with its ranges (OQ-100 answered: no upload or export); the Party's delivery outputs; surgeon rows with no HPI CPN or full name; each surgeon's specialties (D3 at Verify; a surgeon at two practices answered: both rooms) | OQ-114, OQ-129 |
| 43a | US-13.5.3 (Verify): the sign-in experience (deferred to the end of discovery); US-15.0.8 (Open): the support hours and how requests are raised | OQ-83, OQ-137 |

## Milestone demos

These are what you can show at each point.

- **After 16** (built; 15a and 15b ran before it): Booking vocabulary everywhere, with Copy a Booking
  gone, photo capture out of the Add a booking chooser, and an assigned List called ACTIVE. Every
  demo action on its own screen, in the harness bar and on a handset, with the HL7/FHIR tooling badged
  Future scope. Warnings, never blocks: one routine, the to-do list, a triangle on Bookings and a
  warning clear on opening, the prepayment gate turned into a warning, and no confirm step at submit.
  The corrected payables story: the payable equals the receivable, AA's fee is a monthly invoice
  built from its settings, and Xero holds no patient names.
- **After 38a** (28 to 32 built; 32a, 32b and 38a finish the schedule and the anaesthetist's side of
  List approval): every session stored and free by default over a configurable horizon, Slots and
  Lists, statuses as a user-maintained list, the availability calendar with series, recurring
  bookings, Draft Lists in the DRAFT state with a waiting flag that become ACTIVE when the office
  assigns them with preferences and tiers, never onto an unavailable session; unavailability
  (sickness included) that forces a return or a hand-on and is never a conflict, the conflict
  dashboard showing hospital closures; whoever moves a List choosing what the vacated session
  becomes; anaesthetists handing on Lists and moving single Bookings into a free colleague's session
  as a new List, colleagues listed by availability alone; the shared notification pool with notices ticked resolved and alerts raised from a
  List or Booking; and the anaesthetist changing a submitted List until it is authorised, a main view
  from today and a search for past work. S2 is re-scripted.
- **After 25:** an out-of-hours List after the PM session (32c, a working design), then the
  catalogue's flat Contract model, end to end:
  - Parties (hospitals, insurers, funders, surgeons and surgeon groups, anaesthetists, AA; no insurer
    master) with their billing details and delivery by email or post, and Contracts as one priced
    item each: a unique AA code and a holder reference code, bills its holder or the payer (a prepaid
    Contract always the payer), linked surgeons or one anaesthetist, prepaid, one of five pricing
    kinds, the override on RVG kinds only, Active or Disabled, edited in place with an audit trail
    and never deleted, and one No contract · RVG held by AA;
  - AA's specialties and funding tags (SXAP, HNZ, ACC), every surgeon with one or more specialties,
    Contracts carrying specialties and a tag, and an open-price fallback for every invoice
    destination;
  - RVG groups from the NZSA guide as the one master list, with the published range shown, and an
    RVG code picked by type-ahead;
  - every schedule item a fixed-price Contract with backdatable price ranges, combinations as
    Contracts, the anaesthetists' prepaid price lists (ranges above zero), each Contract's invoice
    description and default RVG code, and starting values from the RVG group, any base value
    accepted with an office warning when out of range;
  - optional itemised modifiers with explanations, the age and included P1 pre-applied and removable;
  - one Contract per Procedure, set by the office through the decided step rail (where the invoice
    goes, then Payment type or the hospital's funding tag, then the Contract by typing, No contract
    · RVG pinned first or "Other price" with the amount typed; "Needs an invoice destination" until
    set; the funder marking a path "Suggested", never narrowing), changeable by the anaesthetist
    through the same rail until AUTHORISED, never onto or off prepaid;
  - one procedure text per Procedure, the hospital's replacing the rooms' with the original in the
    change history, and an invoice description by its defaults (the rooms', the hospital's, the
    Contract's), an admin's edit always winning, shown with the Contract and its pricing basis on
    every booking screen;
  - the payer on the Booking (an email or postal address; a parent, guardian, benefactor or family
    trust), who is billed decided by each Contract, the insurer or funder and approval number on the
    Booking, editable on the day and seen by the anaesthetist, with a missing-number warning for
    insurers only, and the child-payer warning;
  - the form following the pricing kind (RVG code, times and modifiers only on RVG kinds), completion
    as three conditions (a Contract, the RVG detail on RVG kinds, a price), and office review flags
    (an anaesthetist's Contract change, a typed price, a moved Booking whose Contract no longer fits);
  - invoices sent by the billing run with each Procedure's invoice description and the Contract's
    holder reference code, by the Party's delivery or to post, and a Split button with typed $ or %
    shares;
  - the RVG multi-procedure rule on RVG-priced Procedures (base on the primary, time on every
    Procedure, the 3/2/2 split);
  - five pricing kinds, a price following its Contract (a backdated range reaching only unheld
    Procedures) until a typed price, a prepayment invoice or AUTHORISED holds it, the discount as its
    own line, a no-charge invoice at $0, the anaesthetist overriding only on RVG Contracts that allow
    it and seeing what the price comes to, the office changing any price with no reason;
  - a lock at AUTHORISED that reproduces invoices exactly after any Contract edit, and each
    Contract's audited history.

  S1 Beat 3, S2 Beat 2, S3, S4 Beat 3 and S5 are re-scripted.
- **After 27a:** prepayment started per Procedure by picking a Contract under Payment type: Prepaid
  (an anaesthetist's price-list Contract, or Prepaid · Fixed price with a typed amount), invoiced to
  the payer: the amount is the Procedure's price when the invoice is raised, in full and shown to the
  anaesthetist, who can never change it, and read-only for the office too once raised; the invoice is
  generated when an admin approves it (a step AA can switch
  off), its payable held in the AA Holding account; part-paid tracking and a warning in both apps
  that strengthens as the date nears; at authorisation the prepaid Procedure is priced at its amount
  and left off the final invoice with nothing raised automatically, and a transfer moves the
  money to whoever did the List. S4 Beat 1 is re-scripted.
- **After 35:** S1 rebuilt: both first-release intake sources on one review-and-merge screen, one
  theatre list a day from the two integrated hospitals and the rooms' PDF lists uploaded, corrected
  and sent to matching (a re-sent List showing its differences), each row's procedure text as
  received, a hospital's text replacing the rooms' (the original in the Booking's change history) and
  the invoice description unless an admin edited it, rows without an NHI waiting with a stub in their
  place on the List until the office adds the NHI, a day move as a cancellation plus a new Booking,
  then a Booking waiting on "Needs an invoice destination" whose Contract the office sets through the
  decided step rail (Patient › Standard: No contract · RVG, the RVG code handed to the anaesthetist).
  Explicit save with change sets, a change history screen on each Booking naming who changed what
  (office users by name, or the hospital's list), and the on-demand update email picked from the change history, started from a
  template, to the rooms (an empty To where a room holds no email; the main room's for a surgeon at
  more than one) or the hospital, including from a List-move notification. Surgeons' rooms held with
  no email, surgeons at more than one room, and practice manager and PA contacts on the surgeon's
  profile (17a).
- **After 39a:** the money story on the internal ledger: balances shown in or out of balance, the
  AA Holding account's legs and transfers, payments to anaesthetists made in Xero's payables
  run and detected by the engine, Xero mirror resilience and a processing monitor grouped by
  anaesthetist with sorting and filters, ledger-backed web accounts with a flat outstanding list and a
  monthly GST report of payments passed, events on a Procedure with the events list, billed in the
  next run and bundled with the same party's invoice where possible, the Booking total on the
  office's Booking page with each Procedure's price and events, and free-form
  additional invoices to any party (office and anaesthetist), the credit note option,
  credit-and-rebill from copied lines and a combination split after sending that equals the credit,
  and weekly ISO-week payment runs with BCTI approval, netting and a remittance advice. S4 Beats 2 to
  5 are re-scripted.
- **After 44:** every verified gap closed: pre-op, post-op and billing events on
  every Procedure (no billing lines, on no List), patients with a mandatory NHI, intake rows waiting
  for one with their stubs resolved from the waiting view, balance warnings for the office and on the anaesthetist's List, follow-up tools and shared
  notes, NHI lookup, the prepayment letter, by-hand differences on prepaid work with part credits,
  a cancelled prepayment credited or refunded from the AA Holding account automatically, a moved
  prepaid Booking changing nothing, reference-data loads (Parties, specialties, funding tags and
  priced Contracts with their ranges), full-scale and privacy demos at about 28,000 invoices a year,
  anaesthetist sign-in, point-of-need help, the office's help desk panel, and the rewritten S1 to S5
  run sheet. Still parked: the A and B split of a session and the pre-op consult in AA's room.

## Parked

Since the 2026-11-10 update (catalogue `efe123c`) three units are parked:

- **US-01.1.5 and DM-65, the A and B split of a session** (new 5 November, Proposed: Donald's working
  idea from Vanessa's request, not designed or agreed; Greg argued against splitting on 19
  October). The catalogue keeps one List per Slot (US-01.1.1, Agreed) until the split is agreed, and
  the delta says not to build it before then: Slot to List would become one to one-or-two across the
  grid, generation, recurring painting, availability, moves, conflicts and the finders (about 36 files
  read the session). Unparks into a phase after 32c (which already teaches the day view a List that
  is not one per Slot) once AA agrees it and says how the halves' times, a half handed to another
  anaesthetist and a List already holding Bookings work.
- **US-03.7.4, a pre-op consult held in AA's room** (new 5 November, Proposed, on OQ-138). Vanessa
  said AA bills these through its system; Ben deferred it. OQ-138 has no recommendation, and who is
  billed (the patient, or the anaesthetist for the room), how it is priced and whether it ties to a
  Procedure (an event) or stands alone are all open, so there is no default to build. Unparks into
  39b (as an event kind) or 38b (as an additional invoice) once AA describes the case. It is not the
  ACC pre-op assessment, which 39b builds.

Nothing else is parked. From the 2026-11-04 working-decisions update (catalogue `a68f09b`), FT-02.6
(now "Stubs on a List"), US-02.6.1 to US-02.6.3 and DM-58, parked from the 2026-11-02 update on
OQ-118, are built by the new phase **33a**: OQ-118 is answered (D66, Donald for the build): the
booking with no NHI still waits at intake and creates no Booking (the 19 October rule, D11, which 33
and 40 build), and a stub, held outside the Bookings table, stands in its place on its List, seen by
the anaesthetist and the office, until the office resolves it from 33's unmatched queue. 33a sits
straight after 33 rather than after 40, because 34's PDF rows and 40's waiting view reuse its stub and
resolve path.

US-08.6.4 (split a combined Procedure into additional invoices), parked in the first plan while
OQ-53 was open, is in Phase 39: a combination is now a fixed-price Contract of its own (OQ-53 and
US-04.2.11, updated 5 November; built in 19a), and a split after the invoice is sent is a credit then one additional invoice
per component equal to the credit (OQ-72, OQ-77).

Kept but not planned as work: the PWA's "Play the office" auto-authorise, a signposted demo scaffold
(Phase 14 badged it, defaulted it to OFF and added the per-List "Office authorises this List"
trigger; the renumbered reverse check no longer lists it). Two reverse findings are "keep as demo
scaffold", not units: RV-15 (the Integrations nav attention badge and patient names in the message
log, which fall away when 34 demotes the Messages tab) and, since 2026-11-02, RV-27 (the office's
single-Booking move to any List on any day: the catalogue states the move rule for the anaesthetist
only, so 32a leaves the office's flow as it is and logs it for the owner). RV-17 (the badged
photo-capture demo action) is no longer in the reverse check; 44 still checks the badge if the action
is shown.

Out of the plan (not parked: excluded or already met). Since the 2026-11-10 update: Retired US-04.2.4
(Contract lines), US-04.1.6 (staged Contract changes) and US-04.2.10 (prices effective from a date;
replaced by price ranges, US-04.2.15): the prototype's ContractPrice rows are re-seeded as fixed-price
Contracts in 19a and its Contract effective dates and delete removed in 18 (RV-32), and no line,
version or staging code was ever built; EP-04, FT-04.1 and FT-04.3 are now groupings; US-03.2.1 now
Matches (the primary carried across in 23); US-15.0.7 (changes show without signing out) Matches;
US-04.2.13 (export and re-import Contracts, OQ-100 answered) and US-04.3.7 (confirm a price with the
hospital) stay Future Work; DM-16 and DM-57 are no longer held and RV-12 is no longer listed; OQ-138
gates no phase (US-03.7.4 is parked on it). Since the 2026-11-04 working-decisions update:
US-02.2.3 (detecting Bookings removed from a re-sent List) stays Future Work, although its sibling
US-02.2.1 and FT-02.2 came back into scope (34); US-03.1.4 still Matches (both anaesthetist apps
kept, on built 29); FT-13.6 and US-13.6.2 no longer Match (Contradicts again on built 17, followed up
by 17a). Since the 2026-11-04 update: now Matching
FT-13.6 and US-13.6.2 (kept on built 17's covers; US-13.6.1 re-opened and followed up in 17a);
US-14.2.1 stays Future Work (OQ-110 answered: the internal booking model is left to the development
team); OQ-126 (an address book of surgeons) gates no phase. Since the 2026-11-02 update: Retired FT-06.4
(settlement after the procedure: US-06.4.1 moved to FT-06.5 and stays in 41), FT-11.4, US-11.4.1 and
US-11.4.2 (insurers are contract holders: 18 removes the Insurer master, RV-39; US-11.4.2 merged into
US-11.2.1, in 21); now Matching US-12.1.1 (25 still snapshots the unit value); FT-12.1 now a grouping
(its rules are graded on US-12.1.1 and US-12.1.4). Since the 2026-10-20 update: Retired US-03.1.3
(attachments: 20a removes them, RV-01), US-03.3.6 (other billing lines: merged into events, 39b),
US-05.1.6 (the procedure master, never built), FT-06.1, US-06.1.1, US-06.1.2 and US-12.1.3 (the
profile's prepaid settings, never built) and US-12.1.2 (the GST period: 26 removes it, RV-02); out of
scope FT-14.6 and FT-02.2 (every live story in the Future Work lane; 34 drops the auto-match toggle and
badges the PDF tab); now Matching US-08.2.1 and FT-10.2 (carried across without regression in 21 and
39a); DM-19 dropped. Built phases also keep delivered items that now Match (for example FT-13.7,
US-13.7.2, FT-10.3, US-10.2.1, US-01.4.3, US-01.4.5). Since the 2026-10-08 update: Retired US-04.2.5,
US-04.2.7, US-04.2.12, US-04.4.1, US-04.4.2, FT-04.4, US-05.3.4, US-06.2.3, US-06.2.4, US-06.2.5 and
US-06.4.2 (their prototype code, such as the protected default Type 1s, the ordinal price rows, the
deposit and the estimate, is removed in 18, 19a and 27); Future Work US-04.3.7, US-02.3.5 and
US-04.2.13; now Matching FT-03.2 (carried across in 23); DM-06, DM-27, DM-33, DM-37 and DM-47 merged
into other deltas; DM-40 dropped. Since the 2026-10-03 update: Future Work US-02.2.1, US-02.4.4,
US-02.5.1 to US-02.5.4, US-02.5.6 and US-13.7.4; Retired US-02.4.3 and US-05.2.3; now Matching
US-02.5.5; DM-36 dropped.

## When the catalogue changes

The catalogue keeps changing, and this plan is pinned to commit `fbdd555` (built phases keep the
baselines their docs name).

1. **Every phase starts with a drift check.** Diff the catalogue files for the phase's covered IDs
   and their linked OQs against the snapshot, and check whether any owner decision it depends on has
   been answered:

   ```
   node requirements-board/agent/skills/update-build-plan/tools/plan-state.mjs --diff <covered IDs and OQs, comma separated>
   ```

   It diffs each of those IDs that changed since the snapshot (`plan.json` "commit"), and
   `domain-model.md`, with rename detection: the catalogue moved to `requirements-board/requirements/`
   after the 2026-10-03 snapshot, so a plain `git diff` would show every file as deleted and added.

   Record the result in the phase's PROGRESS entry.
2. **For each changed item, re-run the gap analysis for that item only**, following
   [README.md](README.md). Then update `gaps.json`, the epic file and the phase doc before building:
   - An item that was retired or moved to Future leaves the phase's covers.
   - A new item goes into the phase that touches its surface, or into a new phase if none fits.
   - An answered OQ removes the "confirm before building" flag; an answered owner decision replaces
     its default.
3. **Move the snapshot commit only when the whole gap analysis is re-run.** Partial re-runs record
   their own commit against the items they refreshed.
