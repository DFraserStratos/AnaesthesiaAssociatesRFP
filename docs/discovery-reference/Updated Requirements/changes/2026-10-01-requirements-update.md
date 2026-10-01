# Requirements update, 2026-10-01: AA meeting with Greg

What the 2026-10-01 update did to the catalogue. Built from the actual changes: the board commit
`ad8f3d9` plus the uncommitted catalogue changes made today (`git diff HEAD` and untracked files under
`docs/discovery-reference/Updated Requirements`). `#n` means
`Notes 2026-10-01 · AA meeting with Greg #n`.

**Counts.** 27 questions answered · 8 open questions edited, 1 deleted · 97 items changed (39 with a
status move, 7 of those made on the board) · 19 items added · 0 retired · 0 moved · 18 link-only
edits · 16 new questions (OQ-60 to OQ-75).

## 1. Inputs

- Note: [notes/2026-10-01-aa-meeting-with-greg.md](../catalogue/notes/2026-10-01-aa-meeting-with-greg.md) (points #1 to #69)
- Transcript A: [AA Meeting with Greg Oct 1 A.md](../../Meeting%20Recordings/AA%20Meeting%20with%20Greg%20Oct%201%20A.md)
- Transcript B: [AA Meeting with Greg Oct 1 B.md](../../Meeting%20Recordings/AA%20Meeting%20with%20Greg%20Oct%201%20B.md)
- Board commit `ad8f3d9` ("AA Meeting with Greg Oct 1"): Donald's question answers, owner and status
  changes and seven item status moves on the Requirements Board. In `main` history it is `9ab7563`,
  the same catalogue content with the audio recordings dropped.
- Donald's own notes after the meeting, quoted in the note (#34 to #37).

## 2. Questions answered

All 27 were answered on the board (`ad8f3d9`). "Today" says whether today's pass added what the
transcripts say under the answer ("Transcript adds" or "From the transcript") and a follow-up question.

| Question | Title | Answer in one line | Today | Source |
| --- | --- | --- | --- | --- |
| [OQ-02](../catalogue/questions/OQ-02.md) | AA fee basis | Monthly invoice per anaesthetist: fixed charges plus $ per BCTI (e.g. $500 + $5 x 40). | Transcript detail; follow-up OQ-60 | #1 #54 |
| [OQ-03](../catalogue/questions/OQ-03.md) | Refund when prepaid exceeds final | Excess prepayment is ignored, not refunded; on a move the new anaesthetist keeps the agreed amount. | Transcript detail; follow-up OQ-61 | #2 #16 |
| [OQ-05](../catalogue/questions/OQ-05.md) | Booking-level vs List-level failure | A List never fails; a Booking with any failed billable party fails whole, for a manual fix. | Transcript detail | #3 |
| [OQ-06](../catalogue/questions/OQ-06.md) | Base units on RVG code or on Contract | Board: base units on the RVG code master, Contract may override. Meeting agreed the master procedure list instead. | Conflict noted; follow-up OQ-62 | #4 #55 #59 |
| [OQ-10](../catalogue/questions/OQ-10.md) | Invoicing an archived Xero contact | Unarchive first, to prevent duplicate contacts. | Transcript detail | #5 |
| [OQ-17](../catalogue/questions/OQ-17.md) | List status vocabulary | AM and PM Slots for every active anaesthetist; a Slot has a status or a List. Values not named. | Working model; follow-up OQ-64 | #9 #13 #42 |
| [OQ-18](../catalogue/questions/OQ-18.md) | Contract holder codes vs RVG codes | Master procedure and Contract lists; holder codes kept for reference and searchable. | AA identifier per Contract; follow-up OQ-66 | #10 |
| [OQ-19](../catalogue/questions/OQ-19.md) | Hospital dispute fallback | AA error: credit and reissue; otherwise an outstanding invoice. | EP-04 added to affects | #11 |
| [OQ-23](../catalogue/questions/OQ-23.md) | Gap / partial-cover billing | Contract setting: full payment or split of the line item; board says percentage only. | Basis disputed; follow-up OQ-68 | #12 #37 #58 |
| [OQ-27](../catalogue/questions/OQ-27.md) | List status vs anaesthetist availability calendar | Same answer as OQ-17; working reading: one mechanism on the Slot. Unavailable anaesthetist's Lists become Draft Lists. | Working reading; follow-up OQ-64 | #9 #13 #42 |
| [OQ-30](../catalogue/questions/OQ-30.md) | NHI in Xero: Appendix 1 vs Appendix 2 | No PII in Xero; only a unique ID linking back to the system's invoices. | None | #14 (not cited in the file) |
| [OQ-39](../catalogue/questions/OQ-39.md) | Handing a List to a colleague without office confirmation | Anaesthetist moves a List to the office (Draft List) or pushes it into a colleague's free Slot; no acceptance; high trust. | None | #15 (not cited in the file) |
| [OQ-40](../catalogue/questions/OQ-40.md) | Central prepayment refund and trust account | Prepayment held in trust until the procedure; cancelled is refunded; moved keeps the amount, doer is paid. | Answer filled from transcript; follow-up OQ-70 | #2 #16 #18 #38 #53 #57 |
| [OQ-41](../catalogue/questions/OQ-41.md) | Confirm the 90 day unpaid-patient threshold | Threshold may move from 90; mild alert under, strong over; always wave-through; owing balances only. | Transcript detail; follow-up OQ-74 | #17 #28 |
| [OQ-42](../catalogue/questions/OQ-42.md) | Credit and rebill after the anaesthetist has been paid | Credit note to the billable party plus negative invoice to the anaesthetist, netted in the next run. | Answer filled from transcript; follow-up OQ-71 | #18 #41 #63 |
| [OQ-44](../catalogue/questions/OQ-44.md) | Draft List contents and lifecycle | Created with no anaesthetist; surgeon, hospital, day, session required; may hold Bookings; removed or re-dated if unfilled; only the office assigns. | Answer filled from transcript | #20 #43 |
| [OQ-45](../catalogue/questions/OQ-45.md) | Which pricing rules apply to an additional invoice | None: free-form invoice (description, quantity, $). | Transcript detail; follow-up OQ-72 | #21 #27 #61 |
| [OQ-46](../catalogue/questions/OQ-46.md) | Which changes and recipients the update email covers | Agreed the recommendation (Booking change to rooms, cover change to the hospital). | Transcript detail; follow-up OQ-69 | #22 #60 |
| [OQ-50](../catalogue/questions/OQ-50.md) | RVG time rule after two hours | Time units come only from the RVG rules. | Transcript detail; follow-up OQ-75 | #24 #63 |
| [OQ-52](../catalogue/questions/OQ-52.md) | What CPN stands for | HPI CPN (Common Person Number): one identifier with the HPI practitioner number. | Transcript detail | #26 #63 |
| [OQ-53](../catalogue/questions/OQ-53.md) | How combined procedures are modelled | Pick a procedure (grouped by RVG body headings), then a Contract for it; a combination is a Contract under each parent procedure. | Answer filled from transcript; follow-up OQ-72 | #21 #27 #63 |
| [OQ-54](../catalogue/questions/OQ-54.md) | Child as billable party: block or warn | Mild warning only when a patient under 18 is the billable party. | Transcript detail | #28 #47 |
| [OQ-55](../catalogue/questions/OQ-55.md) | Insurer and funding source: on the Booking or the Patient | Neither: the Contract defines the billable party; many Contracts for any mix. | Transcript detail; follow-up OQ-67 | #29 #46 #55 |
| [OQ-56](../catalogue/questions/OQ-56.md) | Ranged RVG codes: flag out-of-range base units | Anaesthetist may override; AA admin staff get a warning. | Transcript detail | #30 #47 #53 |
| [OQ-57](../catalogue/questions/OQ-57.md) | Keep a hard prepayment gate on completing a List | No block; a clear warning in both apps. | Transcript detail | #31 #47 |
| [OQ-58](../catalogue/questions/OQ-58.md) | Who raises the prepayment invoice at booking setup | System generates it when a procedure matches the prepaid list, patient billable only; admin approves before it is sent. | Transcript detail; follow-up OQ-73 | #32 |
| [OQ-59](../catalogue/questions/OQ-59.md) | Receivables ageing and an Overdue view for anaesthetists | Go with the recommendation for now: a flat list. | Transcript detail | #33 |

**Questions only edited (still Open).**

| Question | Title | What changed | Source |
| --- | --- | --- | --- |
| [OQ-12](../catalogue/questions/OQ-12.md) | ACC pre-op codes | Board: owner "AA accountant", answer written (events cover it, distinct line items), status left Open. Today: FT-03.7 and US-03.7.1 added to affects; what is left is confirming the codes and the fixed-fee Contract. | #6 #34 #46 #54 |
| [OQ-13](../catalogue/questions/OQ-13.md) | Hospital download format | Board: owner "Stratos Tech to ask ?". Today: HL7 shape mapping, PDFs still needed. | #7 #56 |
| [OQ-15](../catalogue/questions/OQ-15.md) | Modifier split when units do not divide evenly | Board: Confirm back to Open, owner "Donald to ask Ben". Today: FT-05.3 added to affects; Ben must validate. | #8 #53 |
| [OQ-29](../catalogue/questions/OQ-29.md) | GST agency treatment | Today: one BCTI per procedure; IRD renamed it, new name to confirm. | #41 #54 |
| [OQ-43](../catalogue/questions/OQ-43.md) | What the blacklist warning shows an anaesthetist | Board: owner "Donald to ask Ben", "one blacklist or two?". Today: Greg's picture of two lists. | #19 #53 |
| [OQ-47](../catalogue/questions/OQ-47.md) | Payment day and cycle | Today: US-10.2.6 added to affects; weekly trust payments, 20th monthly for non-trust. | #48 #53 #66 |
| [OQ-48](../catalogue/questions/OQ-48.md) | Which date decides the price in force | Today: Greg leans to the procedure date. | #49 |
| [OQ-49](../catalogue/questions/OQ-49.md) | Booking without NHI: provisional or blocked | Board: owner "Donald to ask Ben". Today: lean to proceed flagged and block authorising until the NHI is added. | #23 #53 #62 #69 |

**Deleted on the board.** OQ-51 (Meaning of the Solutions Plus three- and six-number identifiers),
no answer (#25). Not recreated; its references in US-08.6.1 and US-08.6.3 were removed.

## 3. Items changed, added, retired or moved

Status is before (at `cf20ebb`, before the board commit) → now. "(board)" means the move was made on
the board in `ad8f3d9`; today's pass then edited the text. No item was retired or moved to another
parent. The Source column gives note points, then the questions behind the change.

### EP-01 · Schedule canvas, Slots and Lists

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-01](../catalogue/requirements/EP-01.md) | Schedule canvas, Slots and Lists | Changed | Confirmed (unchanged) | A new Slot starts free and becomes a List only when something is put in it. Draft List now 'a List created with no anaesthetist' (surgeon, hospital, day, session known). Adds the nesting day > Slot or List > Booking > Procedure > Contract (may be split), marked a working reading (OQ-64). | #9 #20 #27 #42; OQ-17, OQ-44, OQ-53 |
| [US-01.1.1](../catalogue/requirements/US-01.1.1.md) | Two Slots per anaesthetist per day | Changed | Proposed (unchanged) | Each new Slot starts free; Slots exist even when free or unavailable. New Technical discussion: stored or inferred Slots left to implementation (OQ-64). | #9 #42; OQ-17 |
| [US-01.1.2](../catalogue/requirements/US-01.1.2.md) | Horizon rolls forward daily | Changed | Proposed (unchanged) | Wording: 'Permanent Lists' becomes 'recurring bookings'. | #44 |
| [US-01.1.3](../catalogue/requirements/US-01.1.3.md) | New anaesthetist gets a populated canvas | Changed | Proposed (unchanged) | Slots are created from the new anaesthetist's start date (was 'immediately'); then editable freely. | #42 |
| [FT-01.2](../catalogue/requirements/FT-01.2.md) | Slot availability status | Changed | Proposed → Verify (board) | Availability is a status held on the Slot, kept up from the anaesthetist's own calendar: one mechanism, not two to reconcile. A List in the Slot shows in place of the status. OQ-27 pointer replaced by working reading + OQ-64. | #9 #13 #42; OQ-17, OQ-27; board ad8f3d9 |
| [US-01.2.1](../catalogue/requirements/US-01.2.1.md) | Anaesthetist sets half-day availability | Changed | Proposed → Verify | Fixed four-value list removed: a Slot is free by default and the anaesthetist changes it (for example on holiday, unavailable). Final values and colours still not named (OQ-64). | #9; OQ-17 |
| [US-01.2.2](../catalogue/requirements/US-01.2.2.md) | Slot status master data | Changed | Proposed → Verify (board) | Note: OQ-17 settled that values belong to the Slot; a List takes its anaesthetist's status. Values and colours still unnamed (OQ-64). | #9; OQ-17; board ad8f3d9 |
| [US-01.2.3](../catalogue/requirements/US-01.2.3.md) | Status is independent of bookings | Changed | Proposed → Verify | Adds: once a List is put in the Slot, the List shows in place of the status (Donald's tentative reading, OQ-64). | #13 #42; OQ-27 |
| [FT-01.3](../catalogue/requirements/FT-01.3.md) | List assignment | Changed | Verify (unchanged) | Draft List wording: has its surgeon, hospital, day and session, but no anaesthetist yet. | #20 #42; OQ-44 |
| [US-01.3.2](../catalogue/requirements/US-01.3.2.md) | Recurring bookings drive most assignments | Retitled, changed | Proposed (unchanged) | Retitled from 'Permanent Lists drive most assignments'. Recurring booking = standing intersection of hospital, anaesthetist and surgeon on a day and session, painted onto Lists; replaces 'template', 'permanent booking', 'Permanent List'. | #44 |
| [US-01.3.3](../catalogue/requirements/US-01.3.3.md) | Manual List assignment | Changed | Proposed (unchanged) | Wording 'recurring booking'. Note: admins make ad hoc Lists from a free Slot; anaesthetists are not expected to. | #44 #68 |
| [US-01.4.1](../catalogue/requirements/US-01.4.1.md) | Reassign a List with its bookings | Changed | Proposed (unchanged) | 'swap' becomes 'reassignment'. After a cover change the admin is offered the draft update email to the hospital contact. | #15 #22; OQ-46 |
| [US-01.4.3](../catalogue/requirements/US-01.4.3.md) | Anaesthetist moves their own List | Retitled, changed | Proposed → Verify | Retitled from 'Anaesthetist requests a swap'. Anaesthetist moves their own List to the office (becomes a Draft List) or pushes it into a colleague's free Slot; no acceptance, no office confirmation (high trust). Office-confirm rule removed. Who is told: OQ-65. | #15; OQ-39 |
| [US-01.4.5](../catalogue/requirements/US-01.4.5.md) | Blacklist warning when an anaesthetist reassigns their own List | Changed | Proposed (unchanged) | Wording follows the move: warning applies when pushing into a colleague's free Slot. Adds OQ-65 pointer. Rule unchanged; OQ-43 still open. | #15 #19; OQ-39, OQ-43 |
| [US-01.4.6](../catalogue/requirements/US-01.4.6.md) | The List's anaesthetist did its procedures | Added | Verify | New story under FT-01.4. Whoever submits a List did every procedure on it; a Booking done by someone else moves to that anaesthetist's List. Payable and prepayment payee follow the Booking; prepayments re-checked. Say 'completed or submitted Booking', not 'timesheet'. | #16 #38 #39; OQ-40, OQ-70 |
| [US-01.5.2](../catalogue/requirements/US-01.5.2.md) | Conflict flagging | Changed | Confirmed → Verify | AC caveat and note: under the OQ-27 answer an unavailable anaesthetist's Lists become Draft Lists; how that sits with the conflict flag is OQ-64. | #13; OQ-27 |
| [US-01.5.3](../catalogue/requirements/US-01.5.3.md) | Anaesthetist availability calendar | Changed | Open → Verify (board) | Rewritten: anaesthetist keeps their Slots' availability from a calendar (days off ahead, series, edit or delete one instance); same mechanism as the Slot status, not a reconciled second record. Clash handling is OQ-64. (Board had already moved Open to Verify.) | #13 #44; OQ-27; board ad8f3d9 |
| [FT-01.6](../catalogue/requirements/FT-01.6.md) | Draft Lists | Changed | Proposed → Verify | Draft List is created with no anaesthetist; all four of surgeon, hospital, day, session are required. Lists the three ways one arises (room needs cover, anaesthetist moves or withdraws a List, anaesthetist with Lists goes unavailable). Never offered to anaesthetists; only the office assigns. 'Permanent Lists' becomes 'recurring bookings'. | #13 #15 #20 #43 #44; OQ-44, OQ-39, OQ-27 |
| [US-01.6.1](../catalogue/requirements/US-01.6.1.md) | Create a Draft List | Changed | Proposed → Verify | Created when a room needs an anaesthetist and none is assigned; hospital, surgeon, day and session required; Bookings may be added before assignment (two new ACs). Matching-screen creation left for later. | #20; OQ-44 |
| [US-01.6.2](../catalogue/requirements/US-01.6.2.md) | See Draft Lists flagged in the Admin App | Changed | Proposed (unchanged) | Draft Lists show prominently in the core planning view as well as their own page; 'being prepared' becomes 'unassigned'. Rationale added (today 'a pile of paper'). Naming may change (OQ-64). | #20 #43; OQ-44 |
| [US-01.6.3](../catalogue/requirements/US-01.6.3.md) | Assign a Draft List to an anaesthetist | Changed | Proposed → Verify | 'being prepared' becomes 'unassigned'. New AC: a Draft List is never offered to anaesthetists; only the office assigns it. | #20; OQ-44 |
| [US-01.6.4](../catalogue/requirements/US-01.6.4.md) | Remove or re-date an unfilled Draft List | Added | Verify | New story under FT-01.6. Admin removes a cancelled or unfilled Draft List (audited) or edits its date. | #20; OQ-44 |

### EP-02 · Booking intake and change handling

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [FT-02.2](../catalogue/requirements/FT-02.2.md) | Surgeon PDF list ingest | Changed | Verify (unchanged) | Note: PDF ingest still needed after HL7/FHIR feeds (download not comprehensive). Tentative: first release may need hospital-download matching before PDF ingest. Formats remain OQ-13. | #7; OQ-13 |
| [US-02.3.2](../catalogue/requirements/US-02.3.2.md) | Save Booking changes explicitly | Changed | Proposed (unchanged) | Notes: update email also offered after a List reassignment (OQ-46); prompt-after-save or on-demand button is OQ-69. | #22 #60; OQ-46 |
| [US-02.3.3](../catalogue/requirements/US-02.3.3.md) | Draft a booking update email | Changed | Proposed → Verify | Email also offered after a List reassignment. To address: hospital contact for a cover change, surgeon's room for a Booking change; admin can edit it. ACs updated. Prompt vs button is OQ-69. | #22 #60; OQ-46 |
| [US-02.4.1](../catalogue/requirements/US-02.4.1.md) | Add a Booking, manually or from a photo | Changed | Proposed (unchanged) | Note: in theatre the anaesthetist must still create a Booking on the fly, even if rooms one day add Lists themselves. | #45 #68 |

### EP-03 · Booking and Procedure capture (anaesthetist)

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-03.1.6](../catalogue/requirements/US-03.1.6.md) | Find past work from a calendar | Added | Proposed | New story under FT-03.1. Calendar to jump to any day (including before the four-month view) and drill to List, Booking, Procedures. | #35 |
| [US-03.1.7](../catalogue/requirements/US-03.1.7.md) | Search Bookings by NHI or patient name | Added | Proposed | New story under FT-03.1. Search Bookings by NHI or patient name. | #36 |
| [US-03.2.2](../catalogue/requirements/US-03.2.2.md) | Anyone with edit rights can set the primary | Changed | Confirmed (unchanged) | Notes only: staff pick the primary from the rooms' sheet order; primary shown first; an ACC pre-op assessment is never primary. | #46 |
| [US-03.3.1](../catalogue/requirements/US-03.3.1.md) | Select an RVG code (with ranged override) | Changed | Verify (unchanged) | Pick a procedure (grouped by RVG body headings), then a Contract set against it. Any base-unit value accepted; out of range raises an after-procedure warning for the office (new AC, OQ-56). OQ-06 pointer replaced by OQ-62. | #4 #27 #30; OQ-53, OQ-56, OQ-06 |
| [US-03.3.6](../catalogue/requirements/US-03.3.6.md) | Other billing lines (including rate x time) | Changed | Proposed (unchanged) | Note: post-op reviews and pain consults may instead be pre-op/post-op events (FT-03.7); relation is OQ-63. Related US-03.7.1 added. | #34 |
| [FT-03.7](../catalogue/requirements/FT-03.7.md) | Pre-op and post-op events | Added | Verify | New feature under EP-03. Anaesthetist adds pre-op and post-op events to a Procedure (time or fixed fee, billable or not), self-service instead of ringing the office; covers post-op pain care and ACC pre-op assessments. Model, name and invoice shape: OQ-63. | #6 #34; OQ-12 |
| [US-03.7.1](../catalogue/requirements/US-03.7.1.md) | Add a pre-op or post-op event to a Procedure | Added | Verify | New story under FT-03.7. Add an event with its own date and time, a time or a fixed fee, no modifiers, attached to the original Procedure; can be marked not billable. | #6 #34 #63; OQ-12 |
| [US-03.7.2](../catalogue/requirements/US-03.7.2.md) | Bill a pre-op or post-op event | Added | Verify | New story under FT-03.7. A billable event raises a new invoice traceable to the Procedure; Contract may swap time for a fixed fee; provisionally needs admin approval before issue (OQ-63). | #6 #34 #61; OQ-12 |

### EP-04 · Contracts

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-04](../catalogue/requirements/EP-04.md) | Contracts | Changed | Confirmed (unchanged) | Technical note: OQ-19 answered: an AA-side error is fixed by credit and reissue, otherwise it is an outstanding invoice; no patient fallback. | #11; OQ-19 |
| [US-04.1.4](../catalogue/requirements/US-04.1.4.md) | AA identifier for every Contract | Added | Verify | New story under FT-04.1. Every Contract has AA's own unique identifier; holder codes are reference only. Scheme: OQ-66. | #10; OQ-18 |
| [US-04.2.1](../catalogue/requirements/US-04.2.1.md) | Holder, scope and organisational reach | Changed | Verify (unchanged) | Adds 'procedures from the master procedure list' to scope. Notes: default RVG Contract per hospital; RVG variants are Contracts; many insurance jobs are plain RVG. Insurer/funding filters depend on OQ-67. | #27 #29 #64; OQ-55 |
| [US-04.2.2](../catalogue/requirements/US-04.2.2.md) | Contract pricing and adjustment rules | Changed | Proposed (unchanged) | Note: where base units live is disputed (OQ-06 board vs meeting, OQ-62); a consistently overridden base unit means AA changes its default data. | #4 #59; OQ-06 |
| [US-04.2.4](../catalogue/requirements/US-04.2.4.md) | Fixed fee schedule lines | Changed | Proposed (unchanged) | Holder's own code kept as a searchable reference; a Procedure/Contract pair can carry an RVG code and a holder code. | #10; OQ-18 |
| [US-04.2.5](../catalogue/requirements/US-04.2.5.md) | Multi-procedure rule per Contract | Changed | Proposed (unchanged) | Note: combinations priced by a combination Contract (US-04.2.11); Greg's 'operation' level not adopted. | #27; OQ-53 |
| [US-04.2.11](../catalogue/requirements/US-04.2.11.md) | Combination Contracts | Added | Verify | New story under FT-04.2. A combination is a Contract, not a procedure, set against each parent procedure; history shows only the Contract; breaking it up uses additional invoices. | #27; OQ-53 |
| [US-04.2.12](../catalogue/requirements/US-04.2.12.md) | Payment setting: full payment or split | Added | Verify | New story under FT-04.2. Contract payment setting: full payment by one party, or the line item split between parties with an invoice each. Split basis is OQ-68. | #12 #37 #58; OQ-23 |
| [FT-04.3](../catalogue/requirements/FT-04.3.md) | Contract selection on a Procedure | Changed | Confirmed → Verify | Pick the procedure, then a Contract set against it, narrowed by the List's hospital. Insurer or funding source is no longer a filter (held on neither Patient nor Booking, OQ-55). | #27 #29; OQ-53, OQ-55 |
| [US-04.3.2](../catalogue/requirements/US-04.3.2.md) | Filtered Contract list | Changed | Confirmed → Verify | Picker shows Contracts set against the picked procedure (combination Contracts under each parent), narrowed by hospital (surgeon not settled). Insurer filter removed. New AC: typing a holder code (for example 8942) filters to it. Thousands of Contracts: OQ-66. | #10 #27 #29; OQ-18, OQ-53, OQ-55 |

### EP-05 · RVG master data and fee calculation rules

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-05.1.1](../catalogue/requirements/US-05.1.1.md) | RVG code master data | Changed | Verify (unchanged) | RVG guide is only a guide; AA can set any base units. Where authoritative base units live is disputed (OQ-62). Vanessa filling a standard procedure list. | #4 #55 #59; OQ-06 |
| [US-05.1.6](../catalogue/requirements/US-05.1.6.md) | Procedure master mapped to RVG codes | Changed | Proposed → Verify | Each procedure has defined base units, ideally from its RVG code; default and default-unit hospital Contracts take them from this list (new AC); consistent overrides mean AA fixes its data. Disputed with the OQ-06 answer (OQ-62). Proposed name 'master procedure list'. | #4 #27 #55 #59; OQ-06 |
| [US-05.2.2](../catalogue/requirements/US-05.2.2.md) | Tiered time units | Changed | Proposed → Verify | Time units always from the RVG rule, never office estimates (OQ-50); check against the NZSA RVG 2021 text is OQ-75. | #24 #63; OQ-50 |
| [FT-05.3](../catalogue/requirements/FT-05.3.md) | Multi-procedure rule (supersedes RFP split-billing rule) | Changed | Confirmed → Verify | Note: equal split agreed by Donald and Vanessa, but Ben must validate it; OQ-15 reopened. | #8; OQ-15 |
| [US-05.3.1](../catalogue/requirements/US-05.3.1.md) | Multi-procedure BTM rule | Changed | Confirmed → Open | Equal split applies whichever Contracts the procedures are on; Ben must validate, so OQ-15 is open again. | #8; OQ-15 |
| [US-05.5.2](../catalogue/requirements/US-05.5.2.md) | ACC pre-op flat fee codes | Changed | Open (unchanged) | Rewritten: ACC pre-op assessment is a fixed-fee service recorded as a pre-op event against the real Procedure, priced by a fixed-fee Contract, never primary, own invoice line. Codes still to confirm (OQ-12 Open); modelling OQ-63. | #6 #34 #46; OQ-12 |

### EP-06 · Prepayment

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-06](../catalogue/requirements/EP-06.md) | Prepayment | Changed | Verify (unchanged) | Prepayment held in the trust account until the procedure; cancelled = full refund; moved to another anaesthetist = agreed amount stays, doer is paid (OQ-70). | #16; OQ-40 |
| [US-06.2.1](../catalogue/requirements/US-06.2.1.md) | Detect prepayment requirement | Changed | Confirmed → Verify | Prepayment flagged only where the patient (the person paying for them) is the billable party. OQ-73 for other parties. | #32; OQ-58 |
| [US-06.2.2](../catalogue/requirements/US-06.2.2.md) | Set the prepaid amount | Changed | Verify (unchanged) | Prepaid amount is always the full estimate; deposit option removed (all or nothing). | #50 |
| [US-06.2.4](../catalogue/requirements/US-06.2.4.md) | Calculate the prepayment estimate | Changed | Proposed (unchanged) | Pointer for the time rule moves from OQ-50 to the RVG text check, OQ-75. | #24; OQ-50 |
| [US-06.3.1](../catalogue/requirements/US-06.3.1.md) | Raise the prepayment invoice | Changed | Confirmed → Verify | Invoice generated automatically at booking setup when a Procedure matches the prepaid list; not sent until an admin approves, then goes with the letter; not invoiced again at List submit. Three new ACs. Patient billable party only (OQ-73). | #32; OQ-58 |
| [US-06.3.2](../catalogue/requirements/US-06.3.2.md) | Track prepayment status and alert when outstanding | Changed | Confirmed (unchanged) | Two new ACs: no block on completing a Booking or List; outstanding prepayment shown as a warning in both apps before surgery. Anaesthetist App added to components. | #31 #47; OQ-57 |
| [US-06.3.4](../catalogue/requirements/US-06.3.4.md) | Re-check after each receipt | Changed | Confirmed (unchanged) | Wording only: 'deposit' and 'gate' in captions become 'pre-payment' and 'warning'; related US-06.3.2. | - |
| [US-06.3.5](../catalogue/requirements/US-06.3.5.md) | Re-check when the Booking changes | Changed | Verify (unchanged) | Re-check also when a List or Booking is moved; a move to another anaesthetist keeps the agreed amount (US-06.5.4, OQ-70). | #16; OQ-40 |
| [US-06.3.6](../catalogue/requirements/US-06.3.6.md) | Prepayment letter templates | Changed | Proposed (unchanged) | Template picked when an admin approves a generated prepayment invoice (was 'raises a request'). | #32; OQ-58 |
| [FT-06.4](../catalogue/requirements/FT-06.4.md) | Settlement after the procedure | Changed | Confirmed → Verify | A prepaid amount above the final is no longer credited or refunded. Small shortfall let go or invoiced is OQ-61. | #2; OQ-03 |
| [US-06.4.1](../catalogue/requirements/US-06.4.1.md) | Invoice the remaining balance | Changed | Confirmed → Verify | Note: Greg says a balance above the prepayment is often let go; whether every positive balance is invoiced is OQ-61. | #2; OQ-03 |
| [US-06.4.2](../catalogue/requirements/US-06.4.2.md) | No refund when prepaid exceeds final | Retitled, changed | Open → Verify (board) | Retitled from 'Credit or refund when prepaid exceeds final'. Rule reversed: the excess is not refunded or credited (new AC). (Board had already moved Open to Verify.) | #2; OQ-03; board ad8f3d9 |
| [FT-06.5](../catalogue/requirements/FT-06.5.md) | Trust account and cancellation refunds | Changed | Proposed → Verify | Prepayment held in trust as a pending payment until the procedure is done. Cancelled: refunded in full. Moved: keeps its prepayment, doer becomes payee (OQ-70). | #16; OQ-40 |
| [US-06.5.1](../catalogue/requirements/US-06.5.1.md) | Trust account | Changed | Proposed → Verify | Prepayment held in trust as pending and paid to the anaesthetist only after the procedure (new AC). OQ-40 caveat removed. | #16; OQ-40 |
| [US-06.5.2](../catalogue/requirements/US-06.5.2.md) | Refund a prepayment on cancellation | Changed | Proposed → Verify | Refund comes from the trust account, money never having reached the anaesthetist; 'proposal to confirm' (OQ-40) and OQ-42 recovery note removed. | #16 #18; OQ-40, OQ-42 |
| [US-06.5.3](../catalogue/requirements/US-06.5.3.md) | Prepayment for a replacement anaesthetist | Changed | Proposed → Verify | Narrowed to a true cancellation and later rebooking as a new Booking; a moved Booking keeps its prepayment (US-06.5.4). Ben's objection noted (OQ-70). | #16 #57; OQ-70 |
| [US-06.5.4](../catalogue/requirements/US-06.5.4.md) | Prepaid Booking moved to another anaesthetist | Added | Verify | New story under FT-06.5. A prepaid Booking moved to another anaesthetist is not billed again; the agreed prepayment stands and the doer becomes payee, wearing or benefiting from the difference. To confirm with Ben (OQ-70). | #2 #16 #57; OQ-03, OQ-40 |

### EP-07 · List approval workflow

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-07.2.2](../catalogue/requirements/US-07.2.2.md) | Office review of Contracts and references | Changed | Confirmed (unchanged) | Review checks whether a Procedure needs an insurer's Contract; under-18 billable party is a mild warning, not a block. Insurer not held on Patient or Booking (OQ-55). | #28 #29 #47; OQ-54, OQ-55 |

### EP-08 · Billing/Invoice Engine and internal ledger

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [FT-08.1](../catalogue/requirements/FT-08.1.md) | Trigger and inputs | Changed | Proposed (unchanged) | Names one exception to 'nothing before AUTHORISED': the prepayment invoice generated at booking setup and held for admin approval. | #32; OQ-58 |
| [US-08.2.1](../catalogue/requirements/US-08.2.1.md) | Group by billable party | Changed | Verify (unchanged) | Note: who a Contract belongs to and whether a per-Booking billable party stays is OQ-67. | OQ-67 |
| [US-08.2.2](../catalogue/requirements/US-08.2.2.md) | Net prepayments | Changed | Confirmed (unchanged) | Wording: 'estimate or deposit' becomes 'a prepayment (the full estimate)'. | #50 |
| [US-08.2.3](../catalogue/requirements/US-08.2.3.md) | Split one Procedure's fee between two payers | Changed | Proposed → Verify (board) | Split now driven by the Contract's payment setting (US-04.2.12), an invoice per party. Mechanism settled by OQ-23; basis is OQ-68. (Board had already moved Proposed to Verify.) | #12 #37 #58; OQ-23; board ad8f3d9 |
| [US-08.5.2](../catalogue/requirements/US-08.5.2.md) | Booking-level vs List-level failure | Changed | Open → Verify (board) | Failure is per Booking: a List never fails as a whole; a Booking with any failed billable party is held back whole for a manual fix (new AC). (Board had already moved Open to Verify.) | #3; OQ-05; board ad8f3d9 |
| [FT-08.6](../catalogue/requirements/FT-08.6.md) | Billing after AUTHORISED | Changed | Verify (unchanged) | Late lines billed by an admin's additional invoice or an anaesthetist's post-op event (expected admin approval, to check, #61). | #21 #34 #61; OQ-45 |
| [US-08.6.1](../catalogue/requirements/US-08.6.1.md) | Additional invoice for late billing lines | Changed | Verify (unchanged) | Admin's charge is free-form lines (OQ-45); the anaesthetist may add the line as a post-op event instead. OQ-51 reference removed. | #21 #25 #34; OQ-24, OQ-45 |
| [US-08.6.2](../catalogue/requirements/US-08.6.2.md) | Credit note and re-issue | Changed | Verify (unchanged) | Payable reversed by a negative invoice to the anaesthetist, netted in their next payment run (OQ-42). No-later-payment case is OQ-71. | #18 #63; OQ-42 |
| [US-08.6.3](../catalogue/requirements/US-08.6.3.md) | Create an additional invoice on a Procedure | Changed | Proposed → Verify | Free-form invoice (description, quantity, amount); no Contract pricing or unit rules; not a Contract split. OQ-51 reference removed; open details OQ-72. | #21 #25; OQ-45 |
| [US-08.6.4](../catalogue/requirements/US-08.6.4.md) | Split a combined Procedure into additional invoices | Changed | Proposed → Verify | Combined work is a combination Contract (OQ-53); each split invoice is a free-form additional invoice. Crediting the original is OQ-72. | #21 #27; OQ-53 |

### EP-09 · Xero integration

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-09.1.4](../catalogue/requirements/US-09.1.4.md) | ACCPAY as buyer-created tax invoice | Changed | Proposed (unchanged) | Notes: what a BCTI is (one per procedure, money in, money out), same value as its receivable; IRD renamed it (name unknown, OQ-29); rough monthly volumes. | #18 #41; OQ-29, OQ-42 |
| [US-09.3.1](../catalogue/requirements/US-09.3.1.md) | Contact identification without NHI | Changed | Proposed → Confirmed | Confirmed by the OQ-30 answer (no PII in Xero; only a unique ID). | #14; OQ-30 |
| [US-09.3.4](../catalogue/requirements/US-09.3.4.md) | Invoice against an archived contact | Changed | Open → Confirmed | Engine always unarchives the contact before invoicing (OQ-10 answer), to avoid duplicates; sandbox check of the API step remains. | #5; OQ-10 |
| [US-09.4.2](../catalogue/requirements/US-09.4.2.md) | Duplicate invoice number prevention | Changed | Open (unchanged) | Note: its question (OQ-11) was deleted unanswered on 2026-09-29, so still to confirm with AA. Related US-08.4.3 added. | - |

### EP-10 · Payments, disbursement and AA fees

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-10.2.1](../catalogue/requirements/US-10.2.1.md) | Payable released to match the amount received | Changed | Confirmed (unchanged) | Note: whether BCTIs also need approving for payment (US-10.2.6), or that is this authorisation, is OQ-47. | OQ-47 |
| [US-10.2.5](../catalogue/requirements/US-10.2.5.md) | Negative invoices netted in the payment run | Added | Verify | New story under FT-10.2. Negative invoices netted against positive payables in the next payment run and shown on the remittance advice. No-later-payment case: OQ-71. | #18; OQ-42 |
| [US-10.2.6](../catalogue/requirements/US-10.2.6.md) | Approve the period's BCTIs for payment | Added | Verify | New story under FT-10.2. A period's BCTIs are approved for payment before they are paid. Who approves, and overlap with US-10.2.1: OQ-47. | #48 #66; OQ-47 |
| [FT-10.3](../catalogue/requirements/FT-10.3.md) | AA fee invoicing | Changed | Confirmed → Verify (board) | Monthly fee invoice per anaesthetist: fixed charges plus a charge per BCTI (for example $500 + $5 x 40). Open points OQ-60. (Board had already moved Confirmed to Verify.) | #1; OQ-02; board ad8f3d9 |
| [US-10.3.1](../catalogue/requirements/US-10.3.1.md) | Generate AA fee invoices | Changed | Confirmed → Verify | Monthly run generates every fee invoice from the fee settings; new worked AC ($700). Basis answered (OQ-02); open points OQ-60. | #1; OQ-02 |
| [US-10.3.3](../catalogue/requirements/US-10.3.3.md) | AA fee settings | Added | Verify | New story under FT-10.3. Settings page for the fixed fee items and the per-invoice charge, used by the monthly run. | #1 #54; OQ-02, OQ-60 |

### EP-11 · Patients and billable parties

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-11.1.1](../catalogue/requirements/US-11.1.1.md) | Patient record keyed on NHI | Changed | Proposed (unchanged) | NHI never in Xero is settled (OQ-30). Proposal noted: system's own patient ID with NHI as a second unique index (OQ-49). | #14 #23 #62; OQ-30, OQ-49 |
| [US-11.1.4](../catalogue/requirements/US-11.1.4.md) | Patient without NHI | Changed | Open (unchanged) | Working assumption until OQ-49: Booking proceeds with NHI pending, flagged; authorising the List blocked until it is added. Duplicates part of OQ-49. | #23 #69; OQ-49 |
| [US-11.1.5](../catalogue/requirements/US-11.1.5.md) | Missing NHI problem list | Changed | Proposed (unchanged) | Note: working assumption is in US-11.1.4; duplicate handling part of OQ-49. | #23 #69; OQ-49 |
| [FT-11.2](../catalogue/requirements/FT-11.2.md) | Billable party and invoice contact | Changed | Confirmed → Verify | Note: the Contract defines the billable party (OQ-55); whether a per-Booking billable party stays is OQ-67. | #29; OQ-55 |
| [US-11.2.2](../catalogue/requirements/US-11.2.2.md) | Guardian or other override | Changed | Confirmed → Open | Note: Contract defines the billable party (OQ-55); whether this per-Booking override stays is OQ-67. Guardian details are a Contract matter, archived after the debt. | #28 #29; OQ-55 |
| [US-11.2.4](../catalogue/requirements/US-11.2.4.md) | Warn when a child is the billable party | Retitled, changed | Proposed → Confirmed | Retitled from 'A child is never the billable party'. Rule softened: a mild, clearable warning on the to-do list, no block, no warning when someone else pays, no guardian record. ACs rewritten. | #28 #47; OQ-54 |
| [US-11.3.1](../catalogue/requirements/US-11.3.1.md) | Patient outstanding bills view | Changed | Confirmed (unchanged) | Note: NHI out of Xero is settled (OQ-30). | #14; OQ-30 |
| [US-11.3.2](../catalogue/requirements/US-11.3.2.md) | Alert on booking a patient with unpaid bills | Changed | Verify (unchanged) | Alert when a billable patient has a balance: mild under the threshold, strong over it (90 days to start); threshold only for amounts owing; never blocks. ACs rewritten. Refinements OQ-74. | #17 #28; OQ-41 |
| [US-11.4.1](../catalogue/requirements/US-11.4.1.md) | Insurer master data | Changed | Confirmed (unchanged) | Cover split handled on the Contract (payment setting, US-04.2.12); basis OQ-68. Note: many insurance jobs are plain RVG. | #12 #64; OQ-23 |

### EP-12 · Anaesthetist profile and reporting

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-12](../catalogue/requirements/EP-12.md) | Anaesthetist profile and reporting | Changed | Confirmed (unchanged) | 'periodic activity summary' becomes 'GST schedule of what AA paid them'. | #40 |
| [US-12.1.2](../catalogue/requirements/US-12.1.2.md) | GST period | Changed | Proposed (unchanged) | Link text: 'periodic activity summary' becomes 'GST schedule'. | - |
| [US-12.1.4](../catalogue/requirements/US-12.1.4.md) | Anaesthetist identity, contact and bank details | Changed | Verify (unchanged) | 'HPI number' becomes the one identifier 'HPI CPN (Common Person Number)'. | #26; OQ-52 |
| [FT-12.2](../catalogue/requirements/FT-12.2.md) | Reporting for anaesthetists | Changed | Proposed (unchanged) | Same: second report is a GST schedule of what AA paid them in their GST period. | #40 |
| [US-12.2.1](../catalogue/requirements/US-12.2.1.md) | Outstanding balances list | Changed | Proposed → Confirmed | Oldest first; no ageing buckets, no age chips, no Overdue view (OQ-59 recommendation accepted 'for now'). | #33; OQ-59 |
| [US-12.2.2](../catalogue/requirements/US-12.2.2.md) | GST schedule | Retitled, changed | Proposed → Verify | Retitled from 'Activity summary for GST'. GST schedule on a cash basis: sales AA made for them, GST component, a balance check; only payables actually paid in the period. Ben wants it very early. | #40 |

### EP-13 · Admin oversight and master data

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-13](../catalogue/requirements/EP-13.md) | Admin oversight and master data | Changed | Confirmed (unchanged) | Adds 'the warnings that make up the office's to-do list' to the Admin App's scope. | #47 |
| [US-13.1.1](../catalogue/requirements/US-13.1.1.md) | One-day dashboard | Changed | Proposed (unchanged) | Draft Lists shown as 'unassigned (no anaesthetist yet)' instead of 'being prepared'. | #43 |
| [US-13.4.1](../catalogue/requirements/US-13.4.1.md) | Maintain reference tables | Changed | Confirmed (unchanged) | Reference-table link 'Permanent Lists' becomes 'recurring bookings'. | #44 |
| [US-13.6.2](../catalogue/requirements/US-13.6.2.md) | Surgeon profile | Changed | Proposed (unchanged) | HPI number and CPN number merged into one 'HPI CPN' field (OQ-52); the surgeon's unique index. | #26; OQ-52 |
| [US-13.6.3](../catalogue/requirements/US-13.6.3.md) | Blacklist of anaesthetist and surgeon pairings | Changed | Proposed (unchanged) | Note: anaesthetists may keep their own blacklist too; one list or two is part of OQ-43; name may become 'block list'. | #19; OQ-43 |
| [FT-13.7](../catalogue/requirements/FT-13.7.md) | Warnings and the to-do list | Added | Verify | New feature under EP-13. One warning routine raises warnings, never blocks; the admin dashboard is the to-do list and anaesthetists see warnings on their Bookings. | #31 #47; OQ-54, OQ-56, OQ-57 |
| [US-13.7.1](../catalogue/requirements/US-13.7.1.md) | Warning routine | Added | Verify | New story. Warning routine: before- or after-procedure, mild or strong, several per Booking, never blocks; lists the four current warnings. | #17 #28 #30 #31 #47; OQ-41, OQ-54, OQ-56, OQ-57 |
| [US-13.7.2](../catalogue/requirements/US-13.7.2.md) | Warnings on the dashboard to-do list | Added | Verify | New story. Open warnings listed on the dashboard to-do list; admin clears them. | #28 #47; OQ-54 |
| [US-13.7.3](../catalogue/requirements/US-13.7.3.md) | Warning flag on a Booking | Added | Verify | New story. Warning triangle on a Booking in both apps, tap to read; short confirm step when submitting a Booking with a warning (Donald's suggestion). | #31 #47; OQ-57 |
| [US-13.7.4](../catalogue/requirements/US-13.7.4.md) | Warning and check-step settings | Added | Future | New story, Future. Settings page for thresholds, active warnings and switching off check steps; build only when AA asks. | #32 #65 |

### EP-14 · Health systems integration

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [FT-14.4](../catalogue/requirements/FT-14.4.md) | NZ identity standards | Changed | Proposed (unchanged) | Link wording 'HPI number' becomes 'HPI CPN'. | #26; OQ-52 |
| [US-14.4.1](../catalogue/requirements/US-14.4.1.md) | NHI lookup via Digital Services Hub | Changed | Proposed (unchanged) | 'HPI number' becomes 'HPI CPN'. Note: NHI could be refreshed from the central register (hospitals get updates twice a day). | #23 #26; OQ-52 |

### EP-15 · Non-functional requirements

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-15.0.1](../catalogue/requirements/US-15.0.1.md) | Ease of use | Changed | Proposed (unchanged) | Note: keep the anaesthetist's world simple; no Contract complexity on their side. | #51 |
### Link-only edits (link pass)

Text unchanged; a term in the description or criteria became a link to the item that defines it
(and, for US-07.2.3, a `related` entry). 18 items:

FT-03.4, FT-08.3, FT-12.1, FT-13.1, US-03.1.5, US-03.6.1, US-04.3.5, US-04.3.7, US-05.2.3,
US-07.1.1, US-07.2.3, US-07.3.2, US-08.3.1, US-08.3.2, US-08.4.4, US-09.2.1, US-09.2.4, US-13.5.2.

Several changed items above also gained links in the same pass (for example US-05.3.1, US-06.4.1,
US-06.4.2); those are not listed separately.

## 4. New questions

All Open.

| Question | Title | Owner | Affects |
| --- | --- | --- | --- |
| [OQ-60](../catalogue/questions/OQ-60.md) | What the AA per-invoice fee counts, and how the fee is paid | AA accountant | FT-10.3, US-10.3.1, US-10.3.3 |
| [OQ-61](../catalogue/questions/OQ-61.md) | Final fee above the prepayment: always invoice the balance? | Donald to ask AA | US-06.4.1, FT-06.4, US-06.4.2 |
| [OQ-62](../catalogue/questions/OQ-62.md) | Where base units live, and how a Procedure is picked | Donald to ask AA | US-05.1.6, US-05.1.1, US-04.2.2, US-03.3.1 |
| [OQ-63](../catalogue/questions/OQ-63.md) | How pre-op and post-op events are modelled, named and approved | Donald / Greg | FT-03.7, US-03.7.1, US-03.7.2, US-05.5.2, US-03.3.6 |
| [OQ-64](../catalogue/questions/OQ-64.md) | Logical model of days, Slots and Lists | Donald / Greg | EP-01, FT-01.2, US-01.1.1, US-01.2.1, US-01.2.2, US-01.2.3, US-01.5.3, US-01.5.2, FT-01.6, US-01.6.2 |
| [OQ-65](../catalogue/questions/OQ-65.md) | Who is told when an anaesthetist moves their own List | Donald to ask Ben | US-01.4.3, US-02.3.3, US-01.4.5 |
| [OQ-66](../catalogue/questions/OQ-66.md) | Contract identifiers and finding Contracts among thousands | Donald / Greg | US-04.1.4, US-04.3.2, US-04.2.11 |
| [OQ-67](../catalogue/questions/OQ-67.md) | Who a Contract belongs to, and who pays | Donald to ask Vanessa | US-04.2.1, US-11.2.2, FT-11.2, US-08.2.1 |
| [OQ-68](../catalogue/questions/OQ-68.md) | Contract split basis | Donald to ask AA | US-04.2.12, US-08.2.3, US-11.4.1 |
| [OQ-69](../catalogue/questions/OQ-69.md) | Update email: prompt after saving, or an on-demand button | Donald to ask AA | US-02.3.3, US-02.3.2 |
| [OQ-70](../catalogue/questions/OQ-70.md) | Prepayment when a prepaid Booking moves to another anaesthetist | Donald to ask Ben | US-06.5.4, US-06.5.3, FT-06.5, US-06.3.5, EP-06, US-01.4.6 |
| [OQ-71](../catalogue/questions/OQ-71.md) | Recovering a negative invoice with no later payment | AA accountant | US-10.2.5, US-08.6.2 |
| [OQ-72](../catalogue/questions/OQ-72.md) | Additional invoice details still open | Donald to ask AA | US-08.6.3, US-08.6.4 |
| [OQ-73](../catalogue/questions/OQ-73.md) | Prepayment invoice when the patient is not the billable party | Donald | US-06.3.1, US-06.2.1 |
| [OQ-74](../catalogue/questions/OQ-74.md) | Patient balance warning: what the threshold counts from, and credit balances | Donald to ask Ben | US-11.3.2 |
| [OQ-75](../catalogue/questions/OQ-75.md) | RVG time rule: check against the NZSA RVG 2021 text | Donald | US-05.2.2, US-06.2.4 |

## 5. domain-model.md changes

[domain-model.md](../domain-model.md), header now "updated 2026-10-01" with the meeting and board
answers as inputs.

- **Slots, Lists, Draft Lists.** A Slot defaults to free and holds an availability status (owned by
  the Slot) until a List is put in it. Draft List = a List created with no anaesthetist, surgeon,
  hospital, day and session required, may hold Bookings, assigned only by an admin, removed or
  re-dated if unfilled. Hierarchy line: Day → Slot or List → Booking → Procedure → Contract (may be
  split). ER: Draft List to Surgeon and Hospital now required, may hold Bookings. Open model points
  listed under OQ-64.
- **Recurring bookings** replace Permanent Lists (Section 1 row, Lists text, glossary).
- **Moving Lists.** Anaesthetist moves their own List without office confirmation; whoever submits
  a List did its procedures, a Booking done by someone else moves to their List; "timesheet" not used.
- **Contracts.** Pick procedure then Contract, narrowed by hospital; insurer and funding source on
  neither Patient nor Booking (OQ-55); combinations are Contracts under each parent procedure; holder
  codes searchable; every Contract gets an AA code (`aaCode`); `paymentSetting` FULL or SPLIT
  (basis OQ-68); many insurance jobs are plain RVG.
- **Base units.** Procedure master ("master procedure list") holds base units, disputed with the
  OQ-06 board answer (OQ-62); out-of-range entry raises an after-procedure warning.
- **Prepayment.** Full estimate only, no deposit; generated at setup, admin approves before sending;
  held in trust until the procedure; cancelled refunded in full; moved keeps the amount (OQ-70);
  excess over the final not refunded; small shortfall OQ-61.
- **Ledger and payments.** Negative invoice netted in the next payment run, shown on the remittance
  advice (OQ-42, OQ-71); BCTI one per procedure, approved for payment per period; monthly AA fee run
  of fixed charges plus a per-BCTI charge (OQ-60); GST schedule on a cash basis.
- **Additional invoices and events.** Additional invoice is free-form; new pre-op and post-op events
  on a Procedure (ER: PROCEDURE to EVENT), model and approval OQ-63.
- **Billing failure** per Booking (OQ-05).
- **Patients.** Proposed own patient ID with NHI as a second unique index; NHI never in Xero
  (OQ-30); Booking without NHI proceeds flagged (OQ-49 lean); child billable party is a mild warning;
  outstanding-balance alert mild/strong (OQ-41, OQ-74).
- **Surgeons.** HPI CPN as the one identifier (OQ-52); blacklist one or two lists (OQ-43).
- **Warnings.** New section: one routine, before/after procedure, mild/strong, never blocks,
  dashboard to-do list, flag on the Booking, settings page only when AA asks.
- **Glossary.** Added or updated Recurring booking, Slot, Draft List, HPI, HPI CPN, Trust account, Additional
  invoice, Pre-op / post-op event, Negative invoice, Remittance advice, Warning, Procedure master,
  Timesheet (not used); Prepayment and AA fee updated.

## 6. Points with no requirement change

| Point | Why no item changed |
| --- | --- |
| #25 OQ-51 deleted | Deleted on the board unanswered; only dangling references removed (US-08.6.1, US-08.6.3). |
| #44 (part) surgeon calendar, no surgeon slots | Surgeons cannot double-book, so no surgeon slots are tracked; the catalogue already tracks none. The surgeon calendar of recurring appointments was tentative and not added. |
| #45 (part) surgeon-room portal | A wish for rooms to add Lists themselves; only noted in US-02.4.1, no item. |
| #49 date that sets the price | OQ-48 stays Open; Greg's "go with the procedure" matches its recommendation. Question edit only. |
| #52 working rules | Rules for the prototype and verification, not requirements. |
| #53 follow-ups for Ben | Carried into questions (OQ-15, OQ-43, OQ-47, OQ-49 edits; OQ-65, OQ-70). |
| #56 follow-up for Stratos Tech | OQ-13 stays Open; question edit only. |
| #67 surgeons have no view | Matches the catalogue, which gives surgeons no access anywhere. |

## 7. Left for Donald to decide

1. **OQ-06** is still Answered with the board answer "base units live on the RVG code master", but the
   meeting (#4, #59) agreed the master procedure list. Correct the answer or reopen it? For now the
   conflict is only carried in OQ-62.
2. **OQ-12** has an answer but is still Open (owner AA accountant), so US-05.5.2 stays Open. Mark it
   Answered, or keep it Open until the codes are confirmed?
3. **OQ-39** is Answered, but the owner is "Donald to ask Ben" and Greg said "let's just go with the
   basics first". Keep it Answered, so US-01.4.3 stays at Verify, or reopen it?
4. **OQ-23 / OQ-68 split basis.** The board says percentage only, your notes say percentage or a free
   field, and Greg said a typed $ or %. Which one goes into US-04.2.12?
5. **Status policy.** Under the README, Open means "depends on an open question". Several new or
   edited items sit at Verify while a core part is in a new open question: US-06.5.4 (OQ-70, the
   whole rule waits on Ben), US-05.3.1 (OQ-15), US-03.7.1 and US-03.7.2 (OQ-63, model and approval),
   US-04.2.12 (OQ-68), US-10.2.5 (OQ-71). Verify or Open for these? (US-05.3.1 is already Open; see 9.)
6. **EP-01** stays Confirmed although its own text calls the Slot/List nesting "working readings" still
   to be made clear (OQ-64). Keep it Confirmed, or move it to Verify?
7. **US-08.5.2.** changes.json planned Confirmed, but the catalogue has Verify. Transcript A L425
   supports Verify ("I'll leave that as verified, or verify"). Confirm Verify is what you meant.
8. **US-11.2.2** went Confirmed to Open (changes.json said Verify) because of OQ-67. Accept Open?
9. **US-05.3.1** went Confirmed to Open (changes.json said Verify) because OQ-15 was reopened on the
   board; its feature FT-05.3 is at Verify. Accept Open?
10. **US-01.5.2** went Confirmed to Verify (changes.json kept it Confirmed): only a note and an AC
    caveat pointing at OQ-64 were added. Accept Verify?
11. **Scope of the new features.** Calendar navigation (US-03.1.6) and NHI/name search (US-03.1.7) are
    anaesthetist app only. Your note names no app. Should the Admin App get them too?
12. **GST schedule (US-12.2.2).** Ben wants it "very early in the piece". Which release or swimlane?
13. **Surgeon-room portal (#45)** and a surgeon calendar of recurring appointments (#44, #67): only
    noted, no item. Add a Future item, or leave them out?
14. **Pre-op/post-op approval (#61, OQ-63 part 4).** US-03.7.2 states admin approval as a rule
    (marked provisional). Accept that now, or hold it until OQ-63 is answered?
15. **US-09.4.2** stays Open, but its question (OQ-11) was deleted on 2026-09-29 unanswered, so no open
    question sits behind it. Raise a new question, or change its status?
16. **US-09.3.4** went Open to Confirmed on the OQ-10 answer, but the item still says the sandbox check
    of the unarchive API step is to be done. Confirmed, or Verify until the sandbox test?
17. **Missing note citations.** OQ-19, OQ-30 and OQ-39 were answered on the board but their `sources`
    do not cite the note (#11, #14, #15). Add them?
