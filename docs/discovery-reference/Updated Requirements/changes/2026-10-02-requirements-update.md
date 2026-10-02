# Requirements update, 2026-10-02: AA meeting with Greg

What the 2026-10-02 update did to the catalogue. Built from the actual changes: the board commits
`1b8f118` and `124ca2c` plus the uncommitted catalogue changes made today (`git diff HEAD` and
untracked files under `docs/discovery-reference/Updated Requirements`, assets left out). While the
update ran, Donald also edited the Requirements Board (12:17 to 12:59); those edits are in the same
diff and are marked "(board, Donald)", checked against the board's own edit history
(`requirements-board/.history`) and the EP-13 editor's record. `#n` means
`Notes 2026-10-02 · AA meeting with Greg #n`.

**Counts.** 14 questions answered · 3 open questions edited (one of them, OQ-76, created on the board)
· 84 items changed (26 with a status move, 14 of those made on the board by Donald; 15 items changed
only on the board) · 9 items added (2 of them then set to Confirmed on the board) · 0 retired · 0
moved · 13 link-only edits · 5 new questions (OQ-77 to OQ-81).

## 1. Inputs

- Note: [notes/2026-10-02-aa-meeting-with-greg.md](../catalogue/notes/2026-10-02-aa-meeting-with-greg.md) (points #1 to #47)
- Transcript: [AA Meeting with Greg Oct 2 A.md](../../Meeting%20Recordings/AA%20Meeting%20with%20Greg%20Oct%202%20A.md)
- Board commit `1b8f118` ("Phase 14", the same morning): Donald answered OQ-62 and OQ-63, changed
  OQ-61's owner to "Donald to ask Ben" and created OQ-76.
- Board commit `124ca2c` ("AA Meeting with Greg Oct 2 A Question Updates"): Donald answered OQ-64 to
  OQ-75 and gave OQ-76 its owner.
- Donald's typed new requirement: "AA Admin portal needs a shared notification pool" (also in OQ-65's
  answer; note #18).
- Owner decisions at the checkpoint: OQ-64 part 4 ("you decide for now") and OQ-68 ("You pick") take
  the question's recommendation, with the items held at Verify.
- Donald's board edits during the run (uncommitted): EP-13 statuses and text, FT-13.8 and US-13.8.1,
  and one EP-01 sentence (section 3).
- Link pass: link-requirements over EP-01 to EP-06, EP-08, EP-10, EP-11 and EP-13; 39 links applied
  across 35 items (`requirements-board/.links/links-report.md`).

## 2. Questions answered

All 14 were answered on the board: OQ-62 and OQ-63 in `1b8f118`, OQ-64 to OQ-75 in `124ca2c`. Status
before was Open in every case. "Today" says what today's pass added under the answer ("The meeting
adds", from the transcript) and any follow-up question.

| Question | Title | Answer in one line | Today | Source |
| --- | --- | --- | --- | --- |
| [OQ-62](../catalogue/questions/OQ-62.md) | Where base units live, and how a Procedure is picked | Master RVG procedure list holds RVG codes; each procedure has one or two default RVG Contracts holding base units and all other settings. | Meeting detail (list grouped by body part that "may reference" RVG codes; one base Contract in the room; Greg's master-code parent idea); count still in tension | #3 #22 #40 |
| [OQ-63](../catalogue/questions/OQ-63.md) | How pre-op and post-op events are modelled, named and approved | Own element on the Procedure, its own line item, all called events; bundled with the Procedure's invoice if possible, otherwise the next run, one review step; billable tick box. | Meeting detail (admin can add events; "same as" billable-party tick, our reading; refund as an event; Greg unconvinced by the name) | #4 #24 #25 #26 #44 |
| [OQ-64](../catalogue/questions/OQ-64.md) | Logical model of days, Slots and Lists | Devs decide storage; a Slot is a container with a status that a List goes into; every Slot stored over four months; unavailable with a List gives a choice (office or colleague); statuses "you decide"; no "slot" in the UI. | Meeting detail (both children of the day; generation run; Donald's "And we think yes"; statuses as a user-maintained list); follow-up OQ-81 | #5 #27 #28 #29 #30 #45 #46 |
| [OQ-65](../catalogue/questions/OQ-65.md) | Who is told when an anaesthetist moves their own List | Yes to all recommendations, plus a new shared notification pool in the AA Admin portal. | Meeting detail (separate from the to-do list; shared, not per user; expiry and "actioned" open); follow-up OQ-79 | #6 #18 #43 |
| [OQ-66](../catalogue/questions/OQ-66.md) | Contract identifiers and finding Contracts among thousands | Recommendation for now: short structured AA code; picker filtered by procedure and hospital, with code search. | Meeting detail (format not set; "We need to design a contract") | #7 #37 |
| [OQ-67](../catalogue/questions/OQ-67.md) | Who a Contract belongs to, and who pays | For now the Contract always defines the billable party, with as many Contracts as needed. | Meeting detail (Greg's no-default-Contract model, unsettled); follow-up OQ-78 | #8 #37 #41 |
| [OQ-68](../catalogue/questions/OQ-68.md) | Contract split basis | "You pick what's best. We can edit after." | Meeting detail (split "in any which way"; spoken summary marked wholly unclear, not evidence); owner decision takes the recommendation | #9 |
| [OQ-69](../catalogue/questions/OQ-69.md) | Update email: prompt after saving, or an on-demand button | On-demand button, not "since last email"; the user picks one or more changes from the history. | Meeting detail (ad hoc use on the admin screen; Greg's tentative templates per kind of change) | #10 #31 |
| [OQ-70](../catalogue/questions/OQ-70.md) | Prepayment when a prepaid Booking moves to another anaesthetist | New anaesthetist keeps the agreed amount and wears or benefits from the difference; the draft payable is updated. | Meeting detail (one half of the pair, presumably the payable; Xero trust account must balance); follow-up OQ-80 | #11 #47 |
| [OQ-71](../catalogue/questions/OQ-71.md) | Recovering a negative invoice with no later payment | Handled outside the system. | Meeting detail (extreme edge case, likely written off; a cancelled prepayment is not this case) | #12 |
| [OQ-72](../catalogue/questions/OQ-72.md) | Additional invoice details still open | "Desc" is description; can go to any billable party; a credit note option, credit to any party, then new additional invoices. | Meeting detail (credit is not a refund; recorded as events; copy-the-lines nice to have); follow-up OQ-77 | #13 #32 #33 |
| [OQ-73](../catalogue/questions/OQ-73.md) | Prepayment invoice when the patient is not the billable party | Any person paying for the patient, never an organisation. | Meeting detail (Greg: prepayments are always patient-direct) | #14 |
| [OQ-74](../catalogue/questions/OQ-74.md) | Patient balance warning: what the threshold counts from, and credit balances | Count from the invoice date; a credit balance is a mild warning. | Meeting detail (mild/strong = yellow/red) | #15 |
| [OQ-75](../catalogue/questions/OQ-75.md) | RVG time rule: check against the NZSA RVG 2021 text | Always rounded up, always the RVG tiers (15 minutes for the first two hours, then 10). | Meeting detail; the RVG 2021 text comparison itself was not done | #16 |

**Questions only edited (still Open).**

| Question | Title | What changed | Source |
| --- | --- | --- | --- |
| [OQ-60](../catalogue/questions/OQ-60.md) | What the AA per-invoice fee counts, and how the fee is paid | Not answered on the board. Today: new "## Meeting update" with Greg's view for the accountant to confirm (fee never nets against payables under trust law, a separate invoice into a separate account; count paid invoices only); fixed-charge schedule still unknown. | #1 #36 |
| [OQ-61](../catalogue/questions/OQ-61.md) | Final fee above the prepayment: always invoice the balance? | Board (`1b8f118`): owner "Donald to ask AA" to "Donald to ask Ben". Today: "## Meeting update": read out, not answered, no threshold named; linked to OQ-76. | #2 #35 #42 |
| [OQ-76](../catalogue/questions/OQ-76.md) | Outstanding questions for prepaid procedures | Created on the board in `1b8f118` (body is Donald's notes), owner "Donald to ask Ben" set in `124ca2c`. Today: affects set to US-06.4.1, FT-06.4, US-06.4.2, US-06.2.2, US-06.2.3 (was empty); sources added; "## Meeting update" (estimate, partial prepayment, over- and under-runs; Greg to explain his view to Ben). | #17 #19 #21 #35 #42 |

## 3. Items changed, added, retired or moved

Status is before (at `HEAD`, `b342a7d`) → now. "(board, Donald)" means Donald made that change on the
Requirements Board while the update ran; it is not from this run's change list. No item was retired
or moved to another parent. The Source column gives note points, then the questions behind the
change.

### EP-01 · Schedule canvas, Slots and Lists

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-01](../catalogue/requirements/EP-01.md) | Schedule canvas, Slots and Lists | Changed | Confirmed (unchanged) | Settled logical model (OQ-64): a Slot is a box with a status, a List is put into it, Slots and Lists both belong to the day; replaces the "working readings" paragraph. Technical discussion: storage left to the developers. Notes: "slot" never shown in the UI; Draft Lists a major feature for AA staff. Board, Donald (12:59): an assigned List belongs to "one surgeon, one anaesthetist and one hospital". | #5 #23 #29; OQ-64; board, Donald |
| [FT-01.2](../catalogue/requirements/FT-01.2.md) | Slot availability status | Changed | Verify (unchanged) | Notes: OQ-27 working reading and Greg's "unavailable list" view replaced by the OQ-64 settlement; status values a user-maintained list; final values still to define with AA's users. | #5 #29 #30 #46; OQ-64 |
| [US-01.1.1](../catalogue/requirements/US-01.1.1.md) | Two Slots per anaesthetist per day | Changed | Proposed → Confirmed | Every Slot is created and stored across the four months (was left to implementation). Adds the generation run as Greg described it: free Slots first, then the anaesthetist's calendar and recurring bookings in an order not settled (OQ-81). | #5 #27; OQ-64, OQ-81 |
| [US-01.2.1](../catalogue/requirements/US-01.2.1.md) | Anaesthetist sets half-day availability | Changed | Verify (unchanged) | Owner decision for now (OQ-64 part 4, recommendation taken): start from the values in use (free, on holiday, unavailable) with colours chosen for now, held as a user-maintained list. Final values with AA's users. | #5 #30 #38 #46; OQ-64 |
| [US-01.2.2](../catalogue/requirements/US-01.2.2.md) | Slot status master data | Changed | Verify (unchanged) | Statuses are a user-maintained list, not a fixed set: fixed internal ID, editable label and colour; rules read the ID. Two new ACs (rename or recolour, add without code). Final values with Vanessa and the users. | #5 #30 #38 #46; OQ-64 |
| [US-01.2.3](../catalogue/requirements/US-01.2.3.md) | Status is independent of bookings | Changed | Verify → Confirmed | Note: the tentative reading becomes the OQ-64 settlement; the List shows in place of the status, much as in the prototype. | #5; OQ-64 |
| [US-01.3.2](../catalogue/requirements/US-01.3.2.md) | Recurring bookings drive most assignments | Changed | Proposed (unchanged) | A recurring booking creates its List four months ahead, before any Bookings exist, so a List can have no Bookings. New AC. | #28 |
| [US-01.4.1](../catalogue/requirements/US-01.4.1.md) | Reassign a List with its bookings | Changed | Proposed (unchanged) | After a cover change the admin is no longer prompted; they use the on-demand update email button and pick the change from the history. | #10; OQ-69 |
| [US-01.4.3](../catalogue/requirements/US-01.4.3.md) | Anaesthetist moves their own List | Changed | Verify (unchanged) | OQ-65 answer: the office is notified through the shared notification pool and can send the cover-change email from the on-demand button; the colleague sees the List with a notice. Two new ACs. Ben still to confirm. | #6 #10 #18 #35; OQ-65, OQ-69 |
| [US-01.4.5](../catalogue/requirements/US-01.4.5.md) | Blacklist warning when an anaesthetist reassigns their own List | Changed | Proposed (unchanged) | OQ-65 pointer replaced: the office is notified through the shared notification pool. | #6; OQ-65 |
| [US-01.4.6](../catalogue/requirements/US-01.4.6.md) | The List's anaesthetist did its procedures | Changed | Verify (unchanged) | Agreed prepayment stands; one half of the draft pair, presumably the payable, is updated to the doer (OQ-70). Pair timing is OQ-80. | #11; OQ-70, OQ-80 |
| [US-01.5.2](../catalogue/requirements/US-01.5.2.md) | Conflict flagging | Changed | Verify (unchanged) | Flag now covers hospital closures and Bookings or recurring bookings landing on a Slot already marked unavailable; an anaesthetist marking a booked Slot unavailable gets the return-or-assign choice instead (US-01.5.5). AC 2 narrowed to a hospital closure; new AC (recurring booking on an unavailable Slot accepted and flagged, Greg's tentative view). Short-notice sickness moved to a Note as unsettled. | #5 #27 #45; OQ-64, OQ-81 |
| [US-01.5.3](../catalogue/requirements/US-01.5.3.md) | Anaesthetist availability calendar | Changed | Verify → Confirmed | Marking unavailable a Slot that holds a List asks the anaesthetist to return it to the office or assign it (US-01.5.5). OQ-27 working reading and Greg's contrary view dropped. | #5 #29 #45; OQ-64 |
| [US-01.5.4](../catalogue/requirements/US-01.5.4.md) | Availability conflict dashboard | Changed | Proposed (unchanged) | AC 1 reworded (hospital closure, or a Booking or recurring booking on a Slot marked unavailable). New Note: the return-or-hand-on path, and sickness unsettled (OQ-81). | #5 #45; OQ-64, OQ-81 |
| [US-01.5.5](../catalogue/requirements/US-01.5.5.md) | Mark unavailable while holding a List | Added | Confirmed | New story under FT-01.5. Marking a Slot unavailable while it holds a List offers return to the office (becomes a Draft List with hospital, surgeon and Bookings) or assign to an available colleague. Blacklist warning and notifications on "assign" are an assumed reading (Note). | 2026-10-01 #13; #5 #45; OQ-64 |
| [FT-01.6](../catalogue/requirements/FT-01.6.md) | Draft Lists | Changed | Verify → Confirmed | Third way a Draft List arises is now the anaesthetist returning a List from an unavailable Slot (links US-01.5.5). Name Draft List kept; a major feature for AA staff. | #5 #45; OQ-64 |
| [US-01.6.2](../catalogue/requirements/US-01.6.2.md) | See Draft Lists flagged in the Admin App | Changed | Proposed → Confirmed | Note: the name Draft List is kept; seeing Draft Lists is a major feature for AA. | #5; OQ-64 |

### EP-02 · Booking intake and change handling

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-02.3.2](../catalogue/requirements/US-02.3.2.md) | Save Booking changes explicitly | Changed | Proposed (unchanged) | AC "Changes known": each saved change stays in the change history for the update email to pick. Technical discussion: the update email is an on-demand button, not a prompt after each save. | #10; OQ-69 |
| [US-02.3.3](../catalogue/requirements/US-02.3.3.md) | Draft a booking update email | Changed | Verify (unchanged) | Trigger rewritten: an on-demand button on any Booking in the Admin App, used ad hoc; the admin picks one or more changes from the change history. Office offered the cover-change email from a List-move notification. New AC "Pick changes"; "Compose window" AC reworded. Stays Verify on OQ-65 (Ben). | #6 #10; OQ-65, OQ-69 |
| [US-02.3.4](../catalogue/requirements/US-02.3.4.md) | Update email templates per kind of change | Added | Proposed | New story under FT-02.3. User-configurable email templates per kind of change; the update email starts from the matching one. Greg's tentative suggestion, not part of the OQ-69 answer. | #31 #47 |

### EP-03 · Booking and Procedure capture (anaesthetist)

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-03.3.1](../catalogue/requirements/US-03.3.1.md) | Select an RVG code (with ranged override) | Changed | Verify (unchanged) | Base units are seeded from the Contract picked for the procedure (its default RVG Contract unless another applies), not from the procedure. Notes: OQ-62 answer written in; still to verify what the list holds, one or two default Contracts, and where a unit range lives. | #3 #40; OQ-62 |
| [US-03.3.6](../catalogue/requirements/US-03.3.6.md) | Other billing lines (including rate x time) | Changed | Proposed (unchanged) | Note: OQ-63 settled an event as its own element and invoice line; whether post-op reviews leave this list for events is not stated. | #4; OQ-63 |
| [FT-03.7](../catalogue/requirements/FT-03.7.md) | Events on a Procedure | Retitled, changed | Verify (unchanged) | Retitled from "Pre-op and post-op events". "Event" is the one name for everything recorded against a Procedure after setup (pre-op, post-op, additional invoices, credits), its own element on the Procedure. Admin can add events; invoice tick box; billed as its own line, with the Procedure's invoice if possible, otherwise the next run, through one review step. Admin App added. Ben checks. | #4 #25 #26 #35 #44; OQ-63 |
| [US-03.7.1](../catalogue/requirements/US-03.7.1.md) | Add a pre-op or post-op event to a Procedure | Changed | Verify (unchanged) | Event is its own element; an admin can add one; invoice tick box; "same as" billable-party tick (our reading of Greg's courier comparison, default not stated). Three new ACs; Admin App added. | #4 #24; OQ-63 |
| [US-03.7.2](../catalogue/requirements/US-03.7.2.md) | Bill an event | Retitled, changed | Verify → Confirmed | Retitled from "Bill a pre-op or post-op event". A billable event is its own line item: before the Procedure's invoice is approved it travels with it where possible, after it a separate invoice in the next run; one standard review step (provisional admin approval removed). ACs rewritten. | #4 #26; OQ-63 |
| [US-03.7.3](../catalogue/requirements/US-03.7.3.md) | See a Procedure's events | Added | Verify | New story under FT-03.7. Both apps list a Procedure's events (pre-op, post-op, additional invoices, credits); a refund might show too (tentative). | #4 #13 #25; OQ-63, OQ-72 |

### EP-04 · Contracts

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-04](../catalogue/requirements/EP-04.md) | Contracts | Changed | Confirmed (unchanged) | The Contract answers all three questions, because it always defines the billable party (OQ-67); "an admin can set a different billable party" removed. (Reviewer fix, not on the change list.) | #8; OQ-67 |
| [US-04.1.4](../catalogue/requirements/US-04.1.4.md) | AA identifier for every Contract | Changed | Verify (unchanged) | The identifier is a short structured AA code, searchable (OQ-66 "for now"); format not set, part of designing the Contract. AC: unique short AA code. | #7 #37; OQ-66 |
| [US-04.2.1](../catalogue/requirements/US-04.2.1.md) | Holder, scope and organisational reach | Changed | Verify (unchanged) | The Contract always defines the billable party, as many Contracts as AA needs (replaces the independent-billable-party sentence). Notes: scope filters stay; Greg's no-default-Contract model held as OQ-78. | #8 #41; OQ-67, OQ-78 |
| [US-04.2.2](../catalogue/requirements/US-04.2.2.md) | Contract pricing and adjustment rules | Changed | Proposed → Verify | Base units live in a default RVG Contract of the procedure (was the Procedure master); any other Contract may override. OQ-62 dispute note replaced by the answer; Greg's master-code parent idea noted, not adopted; billable party defined by the Contract. | #3 #8 #22 #40; OQ-62, OQ-67 |
| [US-04.2.11](../catalogue/requirements/US-04.2.11.md) | Combination Contracts | Changed | Verify (unchanged) | Notes: navigable by picker filters and AA code search (OQ-66); a split after invoicing is a credit note then new additional invoices (OQ-72). | #7 #13; OQ-66, OQ-72 |
| [US-04.2.12](../catalogue/requirements/US-04.2.12.md) | Payment setting: full payment or split | Changed | Verify (unchanged) | Split basis per the owner decision (OQ-68, recommendation): each share a typed $ or %, set on the Booking, defaulting from the Contract; splits "in any way". Two new ACs. Total and line-item wording not settled. | #9 #47; OQ-68 |
| [US-04.3.2](../catalogue/requirements/US-04.3.2.md) | Filtered Contract list | Changed | Verify (unchanged) | New ACs "Filters" (procedure, then hospital, default RVG Contract always offered) and "AA code search". Note: navigable by filters plus code search (OQ-66). | #7; OQ-66 |
| [US-04.3.3](../catalogue/requirements/US-04.3.3.md) | Default hospital Contract derived from location | Changed | Confirmed (unchanged) | Notes: the Contract defines the billable party; a default Contract presents a name and email for the payer (Donald); Greg disagreed and floated no default Contract (OQ-78). | #4 #8; OQ-67, OQ-78 |
| [US-04.3.7](../catalogue/requirements/US-04.3.7.md) | Procedure not on the Contract's schedule | Changed | Proposed (unchanged) | A hospital taking the invoice is a Contract with the hospital as billable party (was "only the billable party changes"); AC reworded. (Reviewer fix, not on the change list.) | #8; OQ-67 |
| [FT-04.4](../catalogue/requirements/FT-04.4.md) | Default Contracts for hospitals, insurers and procedures | Retitled, changed | Proposed (unchanged) | Retitled from "Every hospital and direct insurer has a default Contract". Adds: every procedure on the master procedure list has one or two default RVG Contracts holding its base units. | #3; OQ-62 |
| [US-04.4.2](../catalogue/requirements/US-04.4.2.md) | Default RVG Contract for every procedure | Added | Verify | New story under FT-04.4. One or two default RVG Contracts per procedure (the standard RVG recommendation) hold base units and all other settings; imported from spreadsheets, then maintained by hand. Notes: count in tension; relation to the hospital's RVG Default Hospital Contract not settled (OQ-78). | #3 #22 #40; OQ-62, OQ-78 |

### EP-05 · RVG master data and fee calculation rules

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-05.1.1](../catalogue/requirements/US-05.1.1.md) | RVG code master data | Changed | Verify (unchanged) | This master holds reference data; the base units the engine prices from come from the procedure's default RVG Contract. AA-added codes carry "reference" base units. Notes: OQ-62 answered. | #3 #40; OQ-62 |
| [US-05.1.6](../catalogue/requirements/US-05.1.6.md) | Procedure master mapped to RVG codes | Changed | Verify (unchanged) | Rewritten on the OQ-62 answer: list grouped by body part, holds or references RVG codes, no longer holds base units; default-Contract bullet and two ACs removed; AC now "has an RVG code and at least one default RVG Contract". Notes: holds-or-references and one-or-two still in tension. | #3 #40; OQ-62 |
| [US-05.2.2](../catalogue/requirements/US-05.2.2.md) | Tiered time units | Changed | Verify → Confirmed | A part interval is always rounded up under the RVG tiers. Two worked ACs (95 min = 7 units, 125 min = 9 units). Note: OQ-75 answered; the RVG 2021 text comparison was not done. | #16 #47; OQ-75 |
| [US-05.5.2](../catalogue/requirements/US-05.5.2.md) | ACC pre-op flat fee codes | Changed | Open (unchanged) | The ACC pre-op assessment is an event, its own element on the real Procedure and its own invoice line (OQ-63). Stays Open on OQ-12 (codes). | #4; OQ-63 |

### EP-06 · Prepayment

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-06](../catalogue/requirements/EP-06.md) | Prepayment | Changed | Verify (unchanged) | A moved Booking: the doer is paid and wears or benefits from the difference (OQ-70); "to confirm with Ben" removed. | #11; OQ-70 |
| [US-06.2.1](../catalogue/requirements/US-06.2.1.md) | Detect prepayment requirement | Changed | Verify → Confirmed | Prepayment flagged only where the billable party is a person paying for the patient, never an organisation. New AC (insurer or hospital: no flag). OQ-73 answered. | #14; OQ-73 |
| [US-06.2.2](../catalogue/requirements/US-06.2.2.md) | Set the prepaid amount | Changed | Verify (unchanged) | Note: Greg asks whether a prepaid amount is sometimes less than the full estimate (for example 20%); open with Ben (OQ-76). | #17 #19 #21 #42; OQ-76 |
| [US-06.2.3](../catalogue/requirements/US-06.2.3.md) | Prepayment is an estimate | Changed | Confirmed (unchanged) | New Notes: "It's a prepayment, it's our estimate"; over- or under-run open with Ben (OQ-76). | #17 #21 #42; OQ-76 |
| [US-06.2.4](../catalogue/requirements/US-06.2.4.md) | Calculate the prepayment estimate | Changed | Proposed (unchanged) | Base units from one of the procedure's default RVG Contracts unless another applies (OQ-62); time units: part intervals always rounded up (OQ-75). | #3 #16; OQ-62, OQ-75 |
| [US-06.3.1](../catalogue/requirements/US-06.3.1.md) | Raise the prepayment invoice | Changed | Verify (unchanged) | Raised only where the billable party is a person paying for the patient, never an organisation (OQ-73); AC 1 reworded. Kept at Verify (change list said Confirmed) because pair timing is OQ-80. | #11 #14 #20 #47; OQ-73, OQ-80 |
| [US-06.3.5](../catalogue/requirements/US-06.3.5.md) | Re-check when the Booking changes | Changed | Verify (unchanged) | "Ben's rule (OQ-70)" becomes "the OQ-70 answer". | #11; OQ-70 |
| [FT-06.4](../catalogue/requirements/FT-06.4.md) | Settlement after the procedure | Changed | Verify (unchanged) | Note: over- or under-run and partial prepayment are OQ-76; OQ-61 pointer stays. | #2 #42; OQ-61, OQ-76 |
| [US-06.4.1](../catalogue/requirements/US-06.4.1.md) | Invoice the remaining balance | Changed | Verify (unchanged) | Note: whether an overrun raises another invoice is also OQ-76; a fixed fee cannot be billed more. | #2 #21 #42; OQ-61, OQ-76 |
| [US-06.4.2](../catalogue/requirements/US-06.4.2.md) | No refund when prepaid exceeds final | Changed | Verify (unchanged) | Note: what an under-run does is part of OQ-76. | #42; OQ-76 |
| [FT-06.5](../catalogue/requirements/FT-06.5.md) | Trust account and cancellation refunds | Changed | Verify (unchanged) | Payee change settled (OQ-70); only one half of the draft pair moves, our reading the payable. | #11; OQ-70 |
| [US-06.5.3](../catalogue/requirements/US-06.5.3.md) | Prepayment for a replacement anaesthetist | Changed | Verify (unchanged) | Note: OQ-70 settled the moved Booking; credit-and-re-prepay is "out of date"; story kept only for a true cancellation and later new Booking. | #11; OQ-70 |
| [US-06.5.4](../catalogue/requirements/US-06.5.4.md) | Prepaid Booking moved to another anaesthetist | Changed | Verify (unchanged) | Only the payable half of the draft pair is updated, receivable unchanged, because the Xero trust account must balance; AC 2 reworded. Notes: OQ-70 answered (which half is our reading); pair timing OQ-80. | #11 #47; OQ-70, OQ-80 |

### EP-08 · Billing/Invoice Engine and internal ledger

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-08.2.1](../catalogue/requirements/US-08.2.1.md) | Group by billable party | Changed | Verify (unchanged) | Grouped by the billable party its Contract defines (per-Booking override removed). Note: OQ-67 for now; Greg's alternative is OQ-78. | #8; OQ-67, OQ-78 |
| [US-08.2.3](../catalogue/requirements/US-08.2.3.md) | Split one Procedure's fee between two payers | Changed | Verify (unchanged) | Basis written in: typed $ or %, set on the Booking, defaulting from the Contract (OQ-68, our pick, to pressure test with AA). | #9; OQ-68 |
| [FT-08.6](../catalogue/requirements/FT-08.6.md) | Billing after AUTHORISED | Changed | Verify (unchanged) | Additional invoices and post-op events are both events through one review step; before approval they travel with the invoice, after it (every late line) the next run. A split after invoicing uses the credit note option (OQ-72). Old approval note removed. | #4 #13; OQ-63, OQ-72 |
| [US-08.6.1](../catalogue/requirements/US-08.6.1.md) | Additional invoice for late billing lines | Changed | Verify (unchanged) | "No extra approval" becomes: recorded as an event, same review step, invoiced in the next run. | #4 #13; OQ-63 |
| [US-08.6.2](../catalogue/requirements/US-08.6.2.md) | Credit note and re-issue | Changed | Verify (unchanged) | No later payment to net against: handled outside the system (OQ-71); a cancelled prepayment is not this case. | #12; OQ-71 |
| [US-08.6.3](../catalogue/requirements/US-08.6.3.md) | Create an additional invoice on a Procedure | Changed | Verify (unchanged) | Recorded as an event; can go to any billable party; same review step, next run ("no approval" removed). "Desc" is description (OQ-72). AC "No approval step" becomes "Review step"; new AC "Any billable party". | #4 #13; OQ-63, OQ-72 |
| [US-08.6.4](../catalogue/requirements/US-08.6.4.md) | Split a combined Procedure into additional invoices | Changed | Verify (unchanged) | After invoicing: credit note against the original (to any party), then one additional invoice per component (OQ-72). Before-invoicing case and Greg's "same amount" are OQ-77. | #13; OQ-72, OQ-77 |
| [US-08.6.5](../catalogue/requirements/US-08.6.5.md) | Credit note option on additional invoices | Added | Verify | New story under FT-08.6. Credit the original to any party, then new additional invoices; recorded as events; a credit is not a refund. What Greg's "automatic reversal" means is OQ-77. | #13 #33 #38; OQ-72, OQ-77 |
| [US-08.6.6](../catalogue/requirements/US-08.6.6.md) | Start a rebill from a copy of the original lines | Added | Proposed | New story under FT-08.6. After a credit note, the original's lines are copied into a draft additional invoice (Greg's nice to have). | #32 |

### EP-10 · Payments, disbursement and AA fees

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-10.2.5](../catalogue/requirements/US-10.2.5.md) | Negative invoices netted in the payment run | Changed | Verify → Confirmed | No later positive payment: settled with the anaesthetist outside the system, nothing built (OQ-71). | #12; OQ-71 |
| [FT-10.3](../catalogue/requirements/FT-10.3.md) | AA fee invoicing | Changed | Verify (unchanged) | Notes: Greg's view for the accountant (never netted, separate invoice and bank account; paid invoices only); fixed-charge schedule unknown. OQ-60 still Open. | #1 #36; OQ-60 |
| [US-10.3.1](../catalogue/requirements/US-10.3.1.md) | Generate AA fee invoices | Changed | Verify (unchanged) | Note: same Greg view, to confirm with the accountant. | #1 #36; OQ-60 |
| [US-10.3.3](../catalogue/requirements/US-10.3.3.md) | AA fee settings | Changed | Verify (unchanged) | Note: fixed-charge schedule is for AA's accountant; Greg does not know it. | #1 #36; OQ-60 |

### EP-11 · Patients and billable parties

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [FT-11.2](../catalogue/requirements/FT-11.2.md) | Billable party and invoice contact | Changed | Verify (unchanged) | Each Procedure's Contract defines who pays; picking a default Contract asks for the payer's name and email; no per-Booking billable party. Greg's alternative held as OQ-78. | #4 #8; OQ-67, OQ-78 |
| [US-11.2.1](../catalogue/requirements/US-11.2.1.md) | Patient-direct Contract makes the patient the billable party | Retitled, changed | Proposed → Verify | Retitled from "Default billable party is the patient". Body: a patient-direct Contract makes the patient the billable party (no Booking-level default). (Reviewer fix, not on the change list.) | #8; OQ-67 |
| [US-11.2.2](../catalogue/requirements/US-11.2.2.md) | Guardian or other payer set through the Contract | Retitled, changed | Open → Verify | Retitled from "Guardian or other override". Per-Booking override replaced: the Contract defines the payer; picking a default Contract takes the payer's name and email; a hospital taking the invoice is a Contract with that hospital. AC rewritten. Note: screenshots predate OQ-67. | #4 #8 #41; OQ-67 |
| [US-11.3.2](../catalogue/requirements/US-11.3.2.md) | Alert on booking a patient with unpaid bills | Changed | Verify (unchanged) | Days count from the invoice date; a credit balance raises a mild alert; mild/strong are yellow/red. Two new ACs. Still to check with Ben. | #15 #35; OQ-74 |
| [US-11.4.1](../catalogue/requirements/US-11.4.1.md) | Insurer master data | Changed | Confirmed (unchanged) | Split basis pointer: "split basis per OQ-68" (the basis itself lives in US-04.2.12). | #9; OQ-68 |

### EP-13 · Admin oversight and master data

Donald's board edits during the run (12:17 to 12:59) are most of this epic; the board history shows
each one as a `board` edit, and the EP-13 editor's record confirms the US-13.7.1 status was his.

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-13](../catalogue/requirements/EP-13.md) | Admin oversight and master data | Changed | Confirmed (unchanged) | Admin App scope adds "a shared pool of notifications for the whole team". | #18; OQ-65 |
| [FT-13.1](../catalogue/requirements/FT-13.1.md) | Schedule dashboard | Changed | Proposed → Confirmed (board, Donald) | Status only. | board, Donald |
| [US-13.1.1](../catalogue/requirements/US-13.1.1.md) | One-day dashboard | Changed | Proposed → Confirmed (board, Donald) | Status (board). Link pass: "availability status" links US-01.2.2. | board, Donald |
| [US-13.2.2](../catalogue/requirements/US-13.2.2.md) | Per-patient balance | Changed | Confirmed (unchanged) | Board, Donald: adds "This is attached to the patient, even if it's a guardian who is going to pay." | board, Donald |
| [FT-13.3](../catalogue/requirements/FT-13.3.md) | Billing flow monitoring | Changed | Proposed → Confirmed (board, Donald) | Status only. | board, Donald |
| [US-13.3.1](../catalogue/requirements/US-13.3.1.md) | Processing monitor | Changed | Proposed → Confirmed (board, Donald) | Board, Donald: adds that the list will get large and the prototype's styling needs updating, with standard sorting and filtering. Link pass: "mirrored to Xero" links US-09.1.1. | board, Donald |
| [US-13.3.2](../catalogue/requirements/US-13.3.2.md) | Manual intervention | Changed | Proposed → Confirmed (board, Donald) | Status (board). Link pass: related US-13.3.1. | board, Donald |
| [US-13.4.2](../catalogue/requirements/US-13.4.2.md) | Clean-cut start, not a full migration | Changed | Proposed → Confirmed (board, Donald) | Status only. | board, Donald |
| [US-13.4.3](../catalogue/requirements/US-13.4.3.md) | Reference data loaded from controlled spreadsheets | Changed | Proposed (unchanged) | Board, Donald: "any Contract-specific overrides" becomes "any Contracts (Could be RVG, fixed or other style)". | board, Donald |
| [US-13.5.1](../catalogue/requirements/US-13.5.1.md) | Role-based access | Changed | Proposed → Confirmed (board, Donald) | Status only. | board, Donald |
| [US-13.5.2](../catalogue/requirements/US-13.5.2.md) | Audit trail of all actions | Changed | Proposed → Confirmed (board, Donald) | Board, Donald: "disbursements" removed from the audited list. | board, Donald |
| [FT-13.6](../catalogue/requirements/FT-13.6.md) | Surgeons and surgeons' rooms | Changed | Proposed → Confirmed (board, Donald) | Status only. | board, Donald |
| [US-13.6.1](../catalogue/requirements/US-13.6.1.md) | Surgeons' rooms master record | Changed | Proposed → Confirmed (board, Donald) | Status only. | board, Donald |
| [US-13.6.2](../catalogue/requirements/US-13.6.2.md) | Surgeon profile | Changed | Proposed → Confirmed (board, Donald) | Status only. | board, Donald |
| [FT-13.7](../catalogue/requirements/FT-13.7.md) | Warnings and the to-do list | Changed | Verify (unchanged) | New Notes: the to-do list is for warnings that need action; notices needing none go to the shared notification pool. | #18 |
| [US-13.7.1](../catalogue/requirements/US-13.7.1.md) | Warning routine | Changed | Verify → Confirmed (board, Donald) | Run: billable-patient bullet adds days from the invoice date and a credit balance as mild (OQ-74); link text "with a balance". Status moved by Donald on the board (change list said Verify). | #15; OQ-74; board, Donald |
| [US-13.7.2](../catalogue/requirements/US-13.7.2.md) | Warnings on the dashboard to-do list | Changed | Verify → Confirmed (board, Donald) | Status only. | board, Donald |
| [US-13.7.3](../catalogue/requirements/US-13.7.3.md) | Warning flag on a Booking | Changed | Verify → Confirmed (board, Donald) | Board, Donald: description now "much like the prototype does today" (example given) and "when the anaesthetist opens a Booking that carries a warning, it is visually clear"; "in both apps", "tap to read" and the submit confirm step removed from the description (ACs and Notes unchanged). | board, Donald |
| [FT-13.8](../catalogue/requirements/FT-13.8.md) | Shared notification pool | Added | Confirmed (board, Donald) | New feature under EP-13 (Donald's typed requirement). One pool for the whole admin team, separate from the to-do list, for things that need no action; first source is an anaesthetist moving a List. Open points OQ-79. Created at Verify; Donald set it to Confirmed on the board. | #6 #18 #43; OQ-65, OQ-79; board, Donald |
| [US-13.8.1](../catalogue/requirements/US-13.8.1.md) | See the team's notifications | Added | Confirmed (board, Donald) | New story under FT-13.8. Shared pool, newest first, scroll back; every admin sees the same pool; not on the to-do list. Created at Verify; Donald set it to Confirmed and added a line "Paginate" on the board. | #18 #43; OQ-65, OQ-79; board, Donald |
| [US-13.8.2](../catalogue/requirements/US-13.8.2.md) | Notify the team when an anaesthetist moves a List | Added | Verify | New story under FT-13.8. A List move (to the office or a colleague's free Slot, including a hand-on from an unavailable Slot) posts a notification saying which List moved and to whom; the office can then send the cover-change email. Two ACs. | #6 #18; OQ-65 |

### Link-only edits (link pass)

Text unchanged; a term in the description or criteria became a link to the item that defines it, or
a `related` entry was added. 13 items:

FT-08.2, US-02.3.1, US-02.4.3, US-05.3.5, US-05.4.2, US-06.3.4, US-08.1.1, US-11.1.1, US-11.1.4,
US-11.2.4, US-11.4.2, US-13.2.1, US-13.7.4.

The other 22 items the link pass wrote are changed items above (for example US-04.2.2, US-06.5.4,
US-13.1.1, US-13.3.1); those links are not listed separately.

## 4. New questions

All Open. OQ-77 was created by the EP-08 editor during its review fixes; OQ-78 to OQ-81 by the
questions agent from the change list. (OQ-76 was created on the board; see section 2.)

| Question | Title | Owner | Affects |
| --- | --- | --- | --- |
| [OQ-77](../catalogue/questions/OQ-77.md) | Splitting a combined invoice, the rebill total and the before-invoicing case | Donald to ask AA | US-08.6.4, US-08.6.3, US-08.6.5 |
| [OQ-78](../catalogue/questions/OQ-78.md) | Default Contracts, or the hospital holding every Contract | Donald to ask Greg | US-04.2.1, FT-04.4, US-04.3.3, US-04.4.2, FT-11.2, US-11.2.2 |
| [OQ-79](../catalogue/questions/OQ-79.md) | What posts to the shared notification pool, and how long notices last | Donald to ask Vanessa | FT-13.8, US-13.8.1, US-13.8.2, FT-13.7 |
| [OQ-80](../catalogue/questions/OQ-80.md) | When a prepayment's receivable and payable pair is created and amended | Donald to ask Greg | US-06.5.4, US-06.3.1, US-01.4.6 |
| [OQ-81](../catalogue/questions/OQ-81.md) | Which calendar wins when Lists are generated | Donald to ask Greg | US-01.1.1, US-01.5.2, US-01.3.2, US-01.5.4 |

## 5. domain-model.md changes

[domain-model.md](../domain-model.md), header now "updated 2026-10-02" with the meeting and its
question answers (OQ-62 to OQ-75) as inputs.

- **Section 1 table.** Rows rewritten for Slots and Lists, moving your own List, availability
  conflicts, a moved prepaid Booking, the balance alert, additional invoices, events, credit and
  rebill, the update email, billable party, Contract identifiers, the default Contract, base units,
  the AA fee, prepayment and the patient; one row added for the shared notification pool.
- **Slots and Lists.** A Slot is a box with a status, created and stored across the four months;
  Slots and Lists both belong to the day; logical model only, storage for the developers; "slot"
  never in the UI. Status values are master data (fixed ID, editable label and colour), starting
  values for now. Marking a booked Slot unavailable gives return-or-assign; a booking landing on an
  unavailable Slot is flagged (tentative). A List can have no Bookings; Draft List name kept. Open:
  painting order and short-notice sickness.
- **Entity diagram.** Added DAY to LIST, SLOT_STATUS, CONTRACT defines BILLABLE_PARTY (payer entered
  when a default Contract is picked), MASTER_PROCEDURE with its default RVG Contracts, CREDIT_NOTE,
  NOTIFICATION_POOL; Booking to billable party link removed; EVENT and ADDITIONAL_INVOICE labels
  updated. Hierarchy: Day → Slot → List → Booking → Procedure → Contract, events on the Procedure.
- **Contracts.** Always define the billable party, no per-Booking override; a default Contract asks
  for the payer's name and email; Greg's no-default-Contract idea shown as open. AA code short,
  format to design; picker filters by procedure and hospital with code search. Base units in each
  procedure's default RVG Contracts (one or two, in tension); relation to the hospital's RVG Default
  Hospital Contract open. Split basis typed $ or % on the Booking (OQ-68, Verify).
- **Master procedure list** replaces "Procedure master": grouped by body part, holds or references
  RVG codes, no base units; Greg's master-code parent idea not adopted.
- **Events.** Pre-op, post-op, additional invoices and credits are all events on the Procedure,
  visible in both apps, with an invoice tick and a "same as" billable-party tick (our reading);
  billed with the Procedure's invoice if not yet approved, otherwise the next run; one review step.
- **Ledger.** Moving a prepaid Booking updates one half of the pair (payable, our reading); pair
  timing open. Negative invoice with no later payment handled outside the system. Credit note
  option, not a refund; reversal, rebill total and before-invoicing split open (OQ-77). Greg's AA-fee
  view added (OQ-60 still open).
- **Update email** from the Booking's change history, on demand; templates noted as Proposed.
- **Patient and billable party.** Contract defines the payer; balance days from the invoice date;
  credit balance mild.
- **Warnings.** Shared notification pool added: one pool, separate from the to-do list, List moves
  first; expiry and "actioned" open.
- **Calculation rules.** Part intervals always round up (OQ-75); prepayment only for a person paying
  for the patient (OQ-73); partial prepayment and over- or under-runs open (OQ-76).
- **Glossary.** Updated Contract, Contract holder, Billable party, Slot, Draft List, Additional
  invoice, Default Contract; added Slot status, Credit note option, Event (replaces Pre-op / post-op
  event), Shared notification pool, Update email, Default RVG Contract, Master procedure list
  (replaces Procedure master).
- **Review fixes.** The model reviewer removed invented detail (automatic reversal, event display
  fields, "day, session" in notifications), marked "payable half" and the "same as" default as our
  reading, and added the default-Contract count and hospital-default tensions and the sickness point.

## 6. Points with no requirement change

| Point | Why no item changed |
| --- | --- |
| #9 (part) unclear split summary | The transcript marks the spoken summary wholly unclear, so it is not evidence; the split basis comes from the owner decision taking OQ-68's recommendation (US-04.2.12). |
| #34 working rules | Rules for the prototype and developers (Claude decides where nothing is said; names can change later), not requirements. |
| #35 (part) / #36 (part) owners | OQ-65, OQ-70 and OQ-74 keep "Donald to ask Ben", OQ-60 stays with the accountant: question-file matters. The item edits that follow from them are above. |
| #37 (part) Greg's weekend notes | What a contract is and its coding are carried as OQ-78 and in US-04.1.4; his notes on Slots and Lists are not yet given. |
| #39 Donald's diagram | Follow-up for Donald to update his day, Slot and List diagram. |
| OQ-60 | Still Open (AA accountant). Only Verify-level notes on FT-10.3, US-10.3.1, US-10.3.3; no status change. |
| OQ-61 | Still Open, now with Ben; no threshold named. Pointers on FT-06.4 and US-06.4.1 kept, OQ-76 pointers added alongside. |
| #17 #19 OQ-76 | New and Open. Its five EP-06 items get pointer notes only; no status change. |

## 7. Left for Donald to decide

1. **US-13.7.1 and US-13.7.3 (your board edits).** US-13.7.1 is now Confirmed while US-11.3.2, which
   carries the same OQ-74 rule, stays Verify (OQ-74's owner is still "Donald to ask Ben"). Align them?
   US-13.7.3: your new description has a typo ("on on July 21st") and no blank line before "This is
   so...", and its ACs ("tapping the triangle shows the warning text", "Confirm step" on submit) and
   Notes still describe the confirm step you removed from the description. Keep or drop the confirm
   step and the tap criterion?
2. **FT-13.8 and US-13.8.1 Confirmed (your board edits)** while the pool's lifecycle (what posts,
   expiry, actioned, place on the dashboard) is open in OQ-79; the change list had them at Verify.
   Keep Confirmed? US-13.8.1 also has a stray line "Paginate": turn it into an AC (for example "the
   pool pages back through older notifications") or remove it?
3. **US-06.3.1** was kept at Verify (the change list said Confirmed) because when the prepayment's
   pair is created and amended is open (OQ-80), and the story's body says it is created at
   generation. Accept Verify?
4. **Confirmed items carrying unsettled detail.** US-04.3.3 states your rule that a default Contract
   presents a payer name and email, which Greg disputed in the room (OQ-78). US-11.4.1 now points at
   the OQ-68 split basis, which is our pick at Verify. Keep them Confirmed?
5. **"## Meeting update" heading.** OQ-60, OQ-61 and OQ-76 use a new "## Meeting update" section for
   questions discussed but not answered; SCHEMA defines no such heading (the answered ones use "The
   meeting adds" under the answer). Adopt it in SCHEMA, or fold the text into the body?
6. **Default RVG Contracts: one or two, and what the list holds.** The OQ-62 board answer says one or
   two per procedure and a list that "holds RVG codes"; in the room you described one base Contract
   and a list that "may reference RVG codes". US-05.1.6, US-04.4.2 and US-03.3.1 keep "one or two" and
   "holds or references" and note the tension. Which is it?
7. **OQ-75 Answered and US-05.2.2 Confirmed** although the check against the NZSA RVG 2021 text was
   never done (the item says so). The EP-05 reviewer suggested Verify until the text is checked; the
   fixer kept Confirmed because the rule itself is answered. Keep Confirmed, or Verify until checked?
8. **`sources` convention.** This run's editors split: EP-06, EP-11 and EP-13 items and the new
   stories added bare question IDs (for example "OQ-70", "OQ-67", "OQ-65") to `sources`, some quoted
   and some not; EP-04 and EP-08 did not. SCHEMA lists notes, Q&A, diagrams and data files, not
   questions, and no item at HEAD cited one. Strip the OQ entries (the text already cites them), or
   allow them and update SCHEMA?
9. **Answered questions still owned "Donald to ask Ben".** OQ-65, OQ-70 and OQ-74 are Answered but keep
   Ben as owner (#35), so US-01.4.3, US-02.3.3, US-06.5.4 and US-11.3.2 say Ben is still to confirm and
   stay Verify. Keep that, or treat Ben's confirmation as given?
10. **Notifications when a List is handed on from an unavailable Slot.** US-13.8.2 states that this
    path posts a notification, while US-01.5.5 calls applying notifications (and the blacklist
    warning) there an assumed reading. Which wording stands? US-13.8.2 also has no AC for offering
    the cover-change email from the notification (US-02.3.3 says it is offered).
11. **Reviewer changes beyond the change list.** US-11.2.1 was retitled ("Patient-direct Contract
    makes the patient the billable party") and moved Proposed to Verify; US-04.3.7 and EP-04 were
    reworded to drop the per-Booking billable party. All follow OQ-67. Accept?
12. **OQ-77** was created by the EP-08 editor with its own recommendation (no forced total; the
    credit reverses the linked payable; one credit-and-rebill flow) and owner "Donald to ask AA" (the
    change list proposed "Donald to ask Vanessa"). OQ-78, OQ-80 and OQ-81 went to "Donald to ask
    Greg" (proposed "Donald / Greg"). Accept the recommendation and owners?
13. **domain-model.md** (fixed after the log was drafted): now names OQ-78 to OQ-81 where it
    states those open points, and the calendar painting order is shown as open (OQ-81), matching
    US-01.1.1. Nothing left to decide.
14. **EP-01 board edit outside the window.** At 12:59 the board recorded your edit "exactly one
    surgeon, one anaesthetist and one hospital" on EP-01 (after the 12:17 to 12:55 window you gave).
    Confirm it is yours and intended.
