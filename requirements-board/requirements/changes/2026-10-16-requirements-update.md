# Requirements update, 2026-10-16: Pricing model v6 and the 14 and 16 October Greg meetings

What the 2026-10-16 update did to the catalogue. It records the two AA meetings with Greg (14 October, a read-through of the pricing model documents, and 16 October, the walk-through of version 6 and a clean-up of the booking and anaesthetist features) and Greg's version 6 pricing model documents (the executive summary and the technical design with its ERD). The big changes: the procedure master is dropped (the procedure on a Booking is free text; the RVG groups are the one master list); Contracts are no longer first party or third party but are set by flags (who is billed, whether the anaesthetist can change the price, whether the Contract is prepaid); prepayment is triggered by a Contract flagged as prepaid, not by a setting on the anaesthetist's profile; a Contract is a series of dated versions with a staged review and upload; the anaesthetist can edit a submitted List until it is AUTHORISED; other billing lines merge into events; the NHI is mandatory. Built from the actual changes (`git diff HEAD` and untracked files under `requirements-board/requirements`), checked against the run's change list and answers. Donald's board edits made during the 16 October meeting (14:39 to 16:00 NZDT) sit in the same diff and are marked "(board, Donald)". Two other uncommitted changes in the working tree are not part of this run (section 9).

Source shorthand in this log: **A** `Notes 2026-10-14 · AA meeting with Greg`, **B** `Notes 2026-10-16 · AA meeting with Greg`, **V** `Notes 2026-10-16 · Pricing model documents v6`; `B #8` means point 8 of that note.

**Counts.** 4 questions answered (OQ-88, OQ-92, OQ-98, OQ-99) · 20 answers extended · 14 open questions updated (OQ-93 partly answered, still Open) · 125 items changed (10 by the link pass only; 18 touched by Donald's board edits) · 4 items added · 8 retired (US-03.1.3 on the board) · 0 moved · 4 new questions (OQ-104 to OQ-107) · 5 artifacts registered (AR-37 to AR-41) and 3 overwritten in place (AR-28, AR-29, AR-30) · domain-model.md changed · 36 links added by the link pass across 27 files.

## 1. Inputs

- Notes:
  - [notes/2026-10-14-aa-meeting-with-greg.md](../notes/2026-10-14-aa-meeting-with-greg.md) (points #1 to #42), artifact [AR-39](../artifacts/AR-39.md)
  - [notes/2026-10-16-aa-meeting-with-greg.md](../notes/2026-10-16-aa-meeting-with-greg.md) (points #1 to #64), artifact [AR-40](../artifacts/AR-40.md)
  - [notes/2026-10-16-pricing-model-documents-v6.md](../notes/2026-10-16-pricing-model-documents-v6.md) (points #1 to #55), artifact [AR-41](../artifacts/AR-41.md)
- Raw files:
  - [AA Meeting with Greg Oct 14th Reconciled Transcript.md](../artifacts/files/AA%20Meeting%20with%20Greg%20Oct%2014th%20Reconciled%20Transcript.md) ([AR-37](../artifacts/AR-37.md)) and [AA Meeting with Greg Oct 16th Reconciled Transcript.md](../artifacts/files/AA%20Meeting%20with%20Greg%20Oct%2016th%20Reconciled%20Transcript.md) ([AR-38](../artifacts/AR-38.md)), each reconciled from automatic transcriptions
  - The v6 documents, filed 16 October: the executive summary ([Pricing Model V6 Executive Summary.pdf](../artifacts/files/Pricing%20Model%20V6%20Executive%20Summary.pdf) and .docx, [AR-28](../artifacts/AR-28.md)), the technical design ([Contract pricing model - technical design v6.pdf](../artifacts/files/Contract%20pricing%20model%20-%20technical%20design%20v6.pdf) and .docx, [AR-29](../artifacts/AR-29.md)) and the ERD ([AR-30](../artifacts/AR-30.md)). In-document labels lag (the executive summary heading still says "V5, 12 October" and the technical design page header "Draft v4"). The executive summary .docx is the newer copy from Donald's Downloads (same text, resaved) and replaced the repo copy.
- Donald's instruction, 2026-10-18 (V #10): "These new pricing documents overwrite the v4 artifacts. So please bring all of these into the requirements board, and update all of the relevant requirements. There are some changes in the repo uncommitted that need looking into. And you will hear me request you to update requirements a lot in the transcripts." AR-28 (pricing guide, now the v6 executive summary), AR-29 (technical design v4, now v6) and AR-30 (ERD v4, now v6) were therefore overwritten in place. The v4 files and the 5 October guide stay in `artifacts/files` because the 7 October note links to them. Their regions were redrawn for v6 and every item link was moved to the v6 regions (section 5).
- Donald's "Claude, update X" requests in the 16 October transcript were treated as explicit instructions to change that item.
- Donald's board edits during the 16 October meeting (14:39 to 16:00 NZDT, from `requirements-board/.history`): status moves on EP-12, FT-03.4, FT-03.7, US-03.1.1, US-03.1.4, US-03.1.5, US-03.1.6, US-03.1.7, US-03.1.9, US-03.3.3, US-03.3.6, US-03.3.8, US-03.4.1, US-03.6.1, US-03.7.1 and US-03.7.3; US-03.1.3 retired; wording edits on EP-12 (prepaid settings and GST period removed), US-03.3.3 (title), US-03.4.1 (title and text) and US-03.5.2 (BTM not mandatory on a fixed price).
- Link pass: link-requirements over the changed epics, 36 links applied across 27 files (`requirements-board/.links/links-report.md`).

**Precedence used.** Donald's typed statements, then what he and Greg agreed in the meetings, then the v6 documents (Greg's proposal for the development team; field names are for orientation only), then the existing catalogue. FT-05.2 and domain-model section 3 now describe pricing by the Contract on the Procedure; the documents' price step order is not adopted (V #11).

## 2. Questions answered, extended and updated

**Answered** (status Open to Answered in this run).

| Question | Title | Answer in one line | Source |
| --- | --- | --- | --- |
| [OQ-88](../questions/OQ-88.md) | RVG code master and procedure master, one list or two | One list: the RVG groups. The procedure master goes; the procedure on a Booking is free text. | A #1 #17; B #21 #35 #37; V #1 #12 #23 #44 #51 |
| [OQ-92](../questions/OQ-92.md) | Prepaid procedure with no price in the anaesthetist's own Contract | No longer arises: the office picks a Contract flagged as prepaid and its line always carries a price. | B #20 #22; V #4 #28 |
| [OQ-98](../questions/OQ-98.md) | Plain RVG Contracts of a holder, offered for every procedure | A Contract may hold no lines; selection offers every Contract valid on the date that fits the Booking's context, with no test for a line. | A #2; B #5; V #2 #30 |
| [OQ-99](../questions/OQ-99.md) | Booking set up without a matched procedure | There is no procedure to match; at setup the office identifies who pays (holder, Contract, line), and the RVG code is optional and the anaesthetist's. | A #19 #32; B #39 #57; V #7 #31 #37 |

**Partly answered, still Open.** [OQ-93](../questions/OQ-93.md) (Insurance indication on the Booking): the insurer and the approval number are stored on the Booking, from the source data, by the office (US-11.4.3). Still open: whether insurance narrows the Contract list, and whether Greg's "approval number" is the design's insurance acceptance reference. Sources A #3 #14 #16; B #1 #57; V #5 #31 #39 #55.

**Answers extended** (status stays Answered; a "The meeting adds" paragraph added).

| Question | Title | What was added | Source |
| --- | --- | --- | --- |
| [OQ-06](../questions/OQ-06.md) | Base units on RVG code or on Contract | Base units live only on the RVG group, and a Contract line may state its own; the procedure level is gone. | V #23 #26 #29 |
| [OQ-16](../questions/OQ-16.md) | Office adjustment at review | The office can change any price at any time, as the last person to touch it, not a higher authority (Donald, Greg agreed). | A #24 #39; B #10 #54; V #27 #54 |
| [OQ-17](../questions/OQ-17.md) | List status vocabulary | "Draft" in Greg's documents to read "Active"; the anaesthetist can edit a submitted List until AUTHORISED; Donald to go through the status words with Vanessa and the directors. | A #25; B #49 #50 |
| [OQ-25](../questions/OQ-25.md) | Is a Pre-paid Contract category still wanted? | Prepaid is a setting on the Contract, not on the anaesthetist's profile; a person in the office places it. Reverses Donald's earlier board answer; his 16 October words outrank it. | B #20 #22; V #4 #28 |
| [OQ-26](../questions/OQ-26.md) | When does AA approve Contract selections? | Greg confirmed the feature; the anaesthetist can change the Contract until AUTHORISED, not only until submit. | B #48 #49 |
| [OQ-31](../questions/OQ-31.md) | Event that removes a List from the anaesthetist's view | A submitted List stays visible and editable until authorised, then drops off and is found by search. | B #26 |
| [OQ-43](../questions/OQ-43.md) | What the blacklist warning shows an anaesthetist | Donald said the preference lists are also meant to be on the profile; nothing settled; they stay admin-only. | B #23 |
| [OQ-48](../questions/OQ-48.md) | Which date decides the price in force | Every Contract change is a new version from an office-chosen date, never backdated; the procedure date picks the version. | B #16; V #42 |
| [OQ-53](../questions/OQ-53.md) | How combined procedures are modelled | With no procedure master, a combination is a standalone line on its holder's Contract, optionally with a default RVG code. | A #34 #37; B #40; V #51 |
| [OQ-55](../questions/OQ-55.md) | Insurer and funding source: on the Booking or the Patient | The Booking holds the insurer and the insurance approval reference (OQ-93). | B #1; V #5 |
| [OQ-56](../questions/OQ-56.md) | Ranged RVG codes: flag out-of-range base units for review | v6 keeps it: out-of-range values warn the office, never block. | V #36 |
| [OQ-61](../questions/OQ-61.md) | Final fee above the prepayment: always invoice the balance? | v6 differs (editable prepaid price; extra invoice or refund on a change); the directors' answer stands until OQ-96 is answered. | V #6 #13 |
| [OQ-62](../questions/OQ-62.md) | Where base units live, and how a Procedure is picked | No procedure to pick; the RVG code is a type-ahead (code, description, value) and optional; the anaesthetist assigns base units. | A #19 #20; B #35 #39 #46; V #21 #23 |
| [OQ-63](../questions/OQ-63.md) | How pre-op and post-op events are modelled, named and approved | "Event" is the one name; other billing lines merge into events; a billing event is a free-form charge or credit. | B #45 #59 #61 #62 |
| [OQ-66](../questions/OQ-66.md) | Contract identifiers and finding Contracts among thousands | The list shows Contracts, not lines: No contract (RVG) first, then the hospital's, then surgeons' and anaesthetists'; pick one to go down to its lines. | A #33 #34; B #37 #40; V #44 |
| [OQ-67](../questions/OQ-67.md) | Who a Contract belongs to, and who pays | Settled in v6: the Contract decides who is billed, its holder when the holder pays AA itself, otherwise the payer on the Booking; holder kinds are insurer, hospital, surgeon or rooms, anaesthetist. | A #10 #13 #30; B #9 #64; V #24 #30 |
| [OQ-73](../questions/OQ-73.md) | Prepayment invoice when the patient is not the billable party | In the typical prepay Contract (an anaesthetist's price list) the holder is not billed, so the payer on the Booking prepays. | V #30 |
| [OQ-76](../questions/OQ-76.md) | Outstanding questions for prepaid procedures | Prepayment is triggered by the office selecting a prepaid Contract, whose line always has the price (OQ-92). | B #20; V #4 #19 |
| [OQ-78](../questions/OQ-78.md) | Default Contracts, or the hospital holding every Contract | Greg confirmed one default in the whole system; AA holds it and is never billed, so it bills the payer on the Booking. | A #19; V #15 #22 |
| [OQ-91](../questions/OQ-91.md) | Who creates and maintains anaesthetists' own fixed-price Contracts in version one | The anaesthetist tells the office which procedures they want prepaid and at what price; the office sets up the Contract; how they communicate is open. | A #26 #29; B #25 |

**Updated, still open.**

| Question | Title | What changed | Source |
| --- | --- | --- | --- |
| [OQ-12](../questions/OQ-12.md) | ACC pre-op codes | Parked by Donald when confirming US-03.7.1. | B #60 |
| [OQ-13](../questions/OQ-13.md) | Hospital download format | Cadence settled (one theatre list a day, for the next day); format still unknown. | B #2 #14; V #18 |
| [OQ-29](../questions/OQ-29.md) | GST agency treatment | Related: the anaesthetist's GST return needs a monthly list of payments with their GST component; no GST period. | B #22 #24 |
| [OQ-49](../questions/OQ-49.md) | Booking without NHI: provisional or blocked | Donald: the NHI is mandatory, "no support of a blank"; may answer this outright (section 8). | B #3 |
| [OQ-79](../questions/OQ-79.md) | What posts to the shared notification pool, and how long notices last | A possible second source: an anaesthetist's "please check this Procedure" flag (US-03.6.3). | A #7; V #37 |
| [OQ-89](../questions/OQ-89.md) | Contract defined rate and fixed fee after the rewording | Rate and discount are live values on a Contract line; whether the anaesthetist can add a discount follows the editable setting; time band still open. | A #23 #36; V #3 #26 #27 |
| [OQ-90](../questions/OQ-90.md) | Does the RVG default multi-procedure rule still apply | v6 states the rule without its caveat; AA have not confirmed it; Vanessa's practice relayed. | B #43; V #38 |
| [OQ-95](../questions/OQ-95.md) | Age modifier bands and stacking, and confirming no ASA pre-fill | Now also asks whether anything is locked: Ben doubts modifier defaults belong in the build. | A #4 #9 #21; B #7; V #23 #36 |
| [OQ-96](../questions/OQ-96.md) | Can the price be changed on a prepaid procedure | Not settled; the documents (refund or extra invoice) now differ from the directors' nothing-automatic answer. | A #5; V #6 #13 |
| [OQ-97](../questions/OQ-97.md) | Credit note for part of a prepayment | v6 invokes a refund for a lowered prepaid price; how is not said. | V #6 |
| [OQ-100](../questions/OQ-100.md) | Is a Contract schedule upload needed for the first release | Greg's position moved (hand-held headers, staged review, Alter or Replace); still not settled. | A #41; B #15 to #18; V #9 #40 to #46 #55 |
| [OQ-101](../questions/OQ-101.md) | How an RVG base unit range is held | v6 still holds one required base units figure per group; the same code can appear on more than one row. | A #20; V #23 |
| [OQ-103](../questions/OQ-103.md) | Which description goes on the invoice | Retitled (was "Invoice wording for a group's general procedure"): the general procedure falls away with the procedure master; the invoice description is agreed in principle (US-08.4.6). | A #6; B #6 #36 to #38; V #8 #29 |
| [OQ-93](../questions/OQ-93.md) | Insurance indication on the Booking | Partly answered; see above. | A #3 #14 #16; B #1 #57; V #5 #31 #39 #55 |

## 3. Items changed, added, retired or moved

Status is before (at `HEAD`, `35fc681`) to now. "(board, Donald)" means Donald made that change on the Requirements Board during the 16 October meeting; it is not from this run's change list. "Link only" means the link pass added a link and nothing else changed. Titles are current; a former title is given in "What changed". Items are grouped by epic; the twelve epics changed are listed with their features and stories. Sources use the shorthand above.

### EP-01 · Schedule canvas, Slots and Lists

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-01.3.2](../stories/US-01.3.2.md) | Recurring bookings drive most assignments | Link only | Verify | Link added by the link pass. |  |
| [US-01.4.1](../stories/US-01.4.1.md) | Reassign a List with its bookings | Changed | Confirmed | Donald asked for every reference to the retired attachments feature to be removed. | B #30 |
| [US-01.4.7](../stories/US-01.4.7.md) | Anaesthetist moves a single Booking | Link only | Verify | Link added by the link pass. |  |

### EP-02 · Booking intake and change handling

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [FT-02.1](../stories/FT-02.1.md) | Hospital booking download and matching screen | Changed | Verify | One updated theatre list a day from each hospital, for the next day; incoming data goes through a review and merge step; format still OQ-13. | B #2 #14; V #18 |
| [US-02.1.1](../stories/US-02.1.1.md) | Import hospital bookings | Link only | Confirmed | Link added by the link pass. |  |
| [US-02.1.5](../stories/US-02.1.5.md) | Automatic sync from St George's and Southern Cross | Changed | Proposed | Cadence is now known. | B #2 |
| [FT-02.2](../stories/FT-02.2.md) | Surgeon PDF list ingest | Changed | Verify | Rooms re-send the whole PDF on every change; ingest feeds the review and merge step. | B #12 #13 #14; V #18 |
| [US-02.2.1](../stories/US-02.2.1.md) | Read, correct and ingest a surgeon PDF list | Changed | Proposed | Bears on how ingest handles repeated PDFs. | B #12 #14; V #18 |
| [US-02.4.4](../stories/US-02.4.4.md) | Add a Booking from a photo of the booking card | Changed | Proposed | Records the photo use case raised when attachments were retired. | B #31 |
| [US-02.5.2](../stories/US-02.5.2.md) | Apply a reschedule | Link only | Verify | Link added by the link pass. |  |
| [US-02.5.4](../stories/US-02.5.4.md) | Changes accepted until the procedure | Changed | Confirmed | The anaesthetist's edit window now runs to AUTHORISED. | B #26 #49 |
| [US-02.5.7](../stories/US-02.5.7.md) | Keep the procedure text as received | Changed | Confirmed | The procedure is now free text kept as received; three descriptions kept apart. | A #18; B #21 #38 #44; V #29 |

### EP-03 · Booking and Procedure capture (anaesthetist)

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-03](../stories/EP-03.md) | Booking and Procedure capture (anaesthetist) | Changed | Confirmed | Procedure is no longer picked from a list (free text on the Booking); the anaesthetist can edit until the List is AUTHORISED, not only until submit. | B #21 #26 #44 #49 |
| [FT-03.1](../stories/FT-03.1.md) | View schedule, Lists and Bookings | Changed | Proposed | Scope and design steer for the anaesthetist apps. | B #27 #29 |
| [US-03.1.1](../stories/US-03.1.1.md) | Schedule to List to Booking drill-down | Changed | Proposed to Confirmed (board, Donald, 14:52) | Note on the drill-down. Proposed to Confirmed (board, Donald, 14:52). | B #28 |
| [US-03.1.2](../stories/US-03.1.2.md) | See the Contract on each Procedure | Changed | Confirmed | The three-part stack with a 'procedure' layer no longer exists. | B #29 #35 |
| [US-03.1.3](../stories/US-03.1.3.md) | Attachments | Retired (board, Donald) | Proposed to Retired (board, Donald, 14:58) | Retired (board, Donald, 14:58): attachments feature removed; the photo use case moves to US-02.4.4; references removed from other items. | B #30 #31 |
| [US-03.1.4](../stories/US-03.1.4.md) | Each app used for what it does best | Changed | Proposed to Verify (board, Donald, 15:04) | Was "Web app parity". Each app used for what it does best; parity a nice to have, to check with the anaesthetists. Verify (board, Donald, 15:04). | B #32 |
| [US-03.1.5](../stories/US-03.1.5.md) | Anaesthetist sees the patient's NHI | Changed | Proposed to Open (board, Donald, 15:05) | NHI is mandatory, no blank; wording cleaned. Open (board, Donald, 15:05). | B #3 |
| [US-03.1.6](../stories/US-03.1.6.md) | Find past work and old invoices | Changed | Proposed to Confirmed (board, Donald, 15:08) | Updated to what Donald and Greg discussed; Confirmed (board, Donald, 15:08). | B #26 #33 |
| [US-03.1.7](../stories/US-03.1.7.md) | Search Bookings by NHI or patient name | Changed | Proposed to Confirmed (board, Donald, 15:09) | Proposed to Confirmed (board, Donald, 15:09). | B #33 |
| [US-03.1.8](../stories/US-03.1.8.md) | See the prepaid amount on the Booking | Changed | Confirmed | Reconfirmed; the prepaid amount is defined as the price on the prepay Contract's line. | B #34 |
| [US-03.1.9](../stories/US-03.1.9.md) | Booking descriptions and Contract shown together | Changed | Confirmed to Open (board, Donald, 15:26) | Was "Source wording, procedure and Contract shown together". The rooms' and hospital's descriptions and the invoice description kept apart; views may differ per app. Open (board, Donald, 15:26). | B #6 #35 #36 #37 #38 #41 #42; V #8 |
| [US-03.2.2](../stories/US-03.2.2.md) | Anyone with edit rights can set the primary | Changed | Confirmed | Note only: read with US-03.2.3 and agreed, no change to the rule. | B #43 |
| [FT-03.3](../stories/FT-03.3.md) | Record clinical billing data per Procedure | Changed | Proposed | The anaesthetist no longer records a procedure (free text now); other billing lines become events. | B #44 #59 |
| [US-03.3.1](../stories/US-03.3.1.md) | Choose the RVG code, with starting units | Changed | Verify | Was "Pick the procedure and Contract, with starting units". No procedure picker: the RVG code (optional, a type-ahead) and the Contract; layered starting values removed. | A #19 #20 #32; B #35 #39 #44 #46 #57; V #11 #21 #31 #36 |
| [US-03.3.3](../stories/US-03.3.3.md) | Record anaesthetic start and finish times | Changed | Proposed to Confirmed (board, Donald, 15:37) | Was "Record anaesthetic start and handover times". Finish, not handover. Confirmed (board, Donald, 15:37). | B #47 #57 |
| [US-03.3.4](../stories/US-03.3.4.md) | Choose optional modifiers, each with a short explanation | Changed | Verify | Modifier pre-selection and locking are back in question with Ben (OQ-95). | A #4 #9 #21; B #7; V #36 |
| [US-03.3.6](../stories/US-03.3.6.md) | Other billing lines | Retired | Proposed to Retired (board had Confirmed, 15:34) | Retired: other billing lines merge into events (FT-03.7). Board moved it to Confirmed (15:34) before the run retired it. | B #45 #59 |
| [US-03.3.8](../stories/US-03.3.8.md) | Age modifier from the patient's age | Changed | Confirmed to Verify (board, Donald, 15:39) | The lock is challenged (OQ-95). Verify (board, Donald, 15:39). | A #4; B #7 |
| [FT-03.4](../stories/FT-03.4.md) | Contract on the Procedure | Changed | Confirmed to Verify (board, Donald, 15:42) | Anaesthetist can change the Contract until AUTHORISED; last edit stands. Status moved by Donald on the board (15:41 to 15:42, ending at Verify). | A #39; B #26 #48 #49 #50; V #11 |
| [US-03.4.1](../stories/US-03.4.1.md) | Anaesthetist can change the Contract | Changed | Confirmed to Verify (board, Donald, 15:46) | Was "Anaesthetist can change the procedure or Contract". Contract only; edit window to AUTHORISED; reset includes price, rate and discount. Verify (board, Donald, 15:46). | A #15; B #49 #51; V #11 #31 |
| [FT-03.5](../stories/FT-03.5.md) | Anaesthetist adjustment | Changed | Confirmed | Per-Contract editable setting replaces the first party and third party split; no reason required; the office's change is the last edit. | A #22 #23 #24; B #52 #53 #54; V #16 #27 #30 |
| [US-03.5.1](../stories/US-03.5.1.md) | Apply an anaesthetist adjustment | Changed | Verify | Was "... (with required reason)". No reason; changes only where the Contract's editable setting allows. | A #22 #23; B #52 #54; V #27 #29 #30 |
| [US-03.5.2](../stories/US-03.5.2.md) | BTM still recorded in full | Changed | Confirmed | BTM is not mandatory on a fixed price (board, Donald, 15:50). | B #55 |
| [FT-03.6](../stories/FT-03.6.md) | Booking completeness validation | Changed | Confirmed | Reconfirmed. | B #56 |
| [US-03.6.1](../stories/US-03.6.1.md) | Mark a Booking complete | Changed | Confirmed to Verify (board, Donald, 15:52) | RVG code and time optional; references are the office's job. Verify (board, Donald, 15:52). | B #57; V #7 #29 #37 |
| [US-03.6.2](../stories/US-03.6.2.md) | Incomplete Bookings listed | Changed | Confirmed | Records the open point on incomplete Bookings; wording still to finish. | B #58 |
| [US-03.6.3](../stories/US-03.6.3.md) | Ask the office to check a Procedure | Added (FT-03.6) | Proposed | Added: an anaesthetist can ask the office to check a Procedure (idea from Greg and Donald; v6 needs a forwarding method). | A #7; V #37 |
| [FT-03.7](../stories/FT-03.7.md) | Events on a Procedure | Changed | Verify to Confirmed (board, Donald, 15:56) | Other billing lines merged into events (US-03.3.6 retired). Verify to Confirmed (board, Donald, 15:56). | B #45 #59 #61 #62 |
| [US-03.7.1](../stories/US-03.7.1.md) | Add a pre-op or post-op event to a Procedure | Changed | Verify to Confirmed (board, Donald, 15:57) | Verify to Confirmed (board, Donald, 15:57); the billable party pop-up explained. | B #60 |
| [US-03.7.2](../stories/US-03.7.2.md) | Bill an event | Changed | Confirmed | Rewritten at Donald's request (billing events: a charge or credit with free text). | B #61 |
| [US-03.7.3](../stories/US-03.7.3.md) | See a Procedure's events | Changed | Verify to Confirmed (board, Donald, 16:00) | Verify to Confirmed (board, Donald, 16:00). | B #62 |

### EP-04 · Contracts

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-04](../stories/EP-04.md) | Contracts | Changed | Confirmed | First party and third party dropped: a Contract's behaviour is set by flags (billed holder, editable price, prepaid); typical arrangements described instead; AA holds the one default. | A #10 #13 #27; B #9 #64; V #15 #16 #22 #30 |
| [FT-04.1](../stories/FT-04.1.md) | Contract catalogue | Changed | Confirmed | v6 header-and-lines maintenance. | A #29 #41; B #17; V #9 #25 #40 |
| [US-04.1.1](../stories/US-04.1.1.md) | Typical Contract arrangements | Changed | Confirmed | Was "Third-party and first-party Contracts". Typical arrangements: behaviour set by flags, no kinds. | A #10 #13 #22 #29; B #5 #9 #64; V #12 #16 #30 |
| [US-04.1.2](../stories/US-04.1.2.md) | Create, edit, retire Contracts | Changed | Confirmed | v6 maintenance screen; terminology. | B #17; V #25 #40 |
| [US-04.1.3](../stories/US-04.1.3.md) | Contract audit and versioning | Changed | Confirmed | v6 history and audit. | B #18; V #41 #49 |
| [US-04.1.4](../stories/US-04.1.4.md) | AA identifier for every Contract | Changed | Confirmed | v6 line identity. | V #44 |
| [US-04.1.5](../stories/US-04.1.5.md) | Contract holders | Changed | Verify | Holder fields per v6: no party type; one practitioner link covers anaesthetists and surgeons. | A #28 #30 #35; B #9; V #22 #24 |
| [US-04.1.6](../stories/US-04.1.6.md) | Stage Contract changes for review, then submit | Added (FT-04.1) | Proposed | Added: stage Contract changes for review, then submit; applies to screen edits too. | A #41; B #17 #19; V #40 #46 #49 |
| [FT-04.2](../stories/FT-04.2.md) | Contract definition | Changed | Verify | v6 data model: header and lines, no group prices; a line is no longer one per procedure. | A #12 #27 #29; V #25 #26 #52 #53 |
| [US-04.2.1](../stories/US-04.2.1.md) | Contract holder, who is billed, and where it applies | Changed | Confirmed | Context no longer includes procedure lines; practitioner link. | A #13 #30 #31; B #64; V #24 #31 |
| [US-04.2.2](../stories/US-04.2.2.md) | Contract pricing terms | Changed | Verify | Plain pricing terms; editable flag per Contract; no precedence; worked examples source gone. | A #2 #11 #12 #22 #23 #27 #28; V #11 #26 #27 #30 |
| [US-04.2.4](../stories/US-04.2.4.md) | Contract lines | Changed | Verify | Lines no longer tied to procedures; v6 line fields. | A #29 #34 #37; B #5 #36 #40; V #2 #8 #26 #35 #44 #50 |
| [US-04.2.8](../stories/US-04.2.8.md) | Invoice presentation and delivery | Changed | Confirmed | Greg on references and the two invoice styles. | A #2 #6 |
| [US-04.2.10](../stories/US-04.2.10.md) | Contract prices effective from a date | Changed | Confirmed | v6 versioning, effective dates and relinking. | B #4 #16; V #13 #25 #42 #43 #47 #50 |
| [US-04.2.11](../stories/US-04.2.11.md) | Combinations as Contract lines | Changed | Confirmed | Was "Combination Contracts". A combination is a standalone line on its holder's Contract (no parent procedures). Still Confirmed though its model changed. | A #34 #37; B #40; V #51 |
| [US-04.2.13](../stories/US-04.2.13.md) | Upload a Contract schedule | Changed | Proposed | v6 upload design (Alter/Replace, template, matching). | A #41; B #8 #15 #17 #18; V #9 #13 #35 #40 #41 #44 #45 #46 #55 |
| [US-04.2.14](../stories/US-04.2.14.md) | Anaesthetist's own price list Contracts | Changed | Confirmed | Was "Anaesthetist's own fixed-price Contracts". Price list Contracts, flagged prepaid where wanted; no reason needed; how price lists are gathered. | A #26 #29 #31; B #20 #25; V #4 #16 #24 #30 |
| [FT-04.3](../stories/FT-04.3.md) | Contract selection on a Procedure | Changed | Confirmed | Contracts picked by holder and context (hospital, surgeon or rooms, anaesthetist), not by a procedure line; picker tabs and the procedure step gone. | A #1 #32 #33 #34; B #35 #37 #39 #40; V #2 #17 #31 |
| [US-04.3.1](../stories/US-04.3.1.md) | Exactly one Contract per Procedure | Changed | Confirmed | v6 wording. | V #29 |
| [US-04.3.2](../stories/US-04.3.2.md) | Filtered Contract list | Changed | Confirmed | v6 selection: Contracts by context, not by procedure line. | A #31 #33 #34 #37; B #37 #39 #40; V #2 #24 #31 #44 |
| [US-04.3.3](../stories/US-04.3.3.md) | No contract (RVG) always offered first | Changed | Confirmed | No contract (RVG) held by AA, billing the payer on the Booking; RVG code optional. | A #17 #19; V #15 #22 #25 |
| [US-04.3.4](../stories/US-04.3.4.md) | Admin sets Contracts at booking setup | Changed | Confirmed | Office identifies billable party; RVG code is the anaesthetist's. | A #19 #32; B #8 #39; V #7 #17 #31 |
| [US-04.3.5](../stories/US-04.3.5.md) | Contract locked at AUTHORISED | Changed | Confirmed | v6 snapshot without layers. | V #34 |

### EP-05 · RVG master data and fee calculation rules

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-05](../stories/EP-05.md) | RVG master data and fee calculation rules | Changed | Confirmed | No procedure list: the RVG groups are the one master list; pricing described plainly (the Contract on the Procedure sets its values). | A #1; B #21; V #1 #12 |
| [FT-05.1](../stories/FT-05.1.md) | RVG groups and modifiers | Changed | Confirmed | Was "RVG groups, procedures and modifiers". The procedure list is gone. | A #1 #20; V #1 #12 #23 |
| [US-05.1.1](../stories/US-05.1.1.md) | RVG groups | Changed | Confirmed | RVG groups are the only master list; type-ahead. | A #20 #21; B #35; V #1 #21 #23 |
| [US-05.1.3](../stories/US-05.1.3.md) | Body sections and AA groups | Changed | Verify | Prepaid groups and the picker tabs are gone. | B #22; V #12 #23 |
| [US-05.1.4](../stories/US-05.1.4.md) | Modifiers already included in base units | Changed | Confirmed to Verify | Status Confirmed to Verify by this run: the modifier lock it describes is in question (OQ-95). | A #4 #9 |
| [US-05.1.5](../stories/US-05.1.5.md) | Modifier code master | Changed | Verify | Ben's doubt recorded. | A #9 #21; V #36 |
| [US-05.1.6](../stories/US-05.1.6.md) | Procedure master mapped to RVG codes | Retired | Confirmed to Retired | Retired: the procedure master is dropped (Donald, A #1; v6 has no PROCEDURE table). | A #1; B #21 #35 #37; V #1 #12 |
| [FT-05.2](../stories/FT-05.2.md) | Unit and fee calculation | Changed | Confirmed | Replaced the layered resolver and price order with the plain model: the Contract on the Procedure sets its values, whoever is permitted can change them, the last change stands. One neutral technical line: the documents' step order is not adopted (V #11). | A #11; V #11 #14 #32 #33 #37 |
| [US-05.2.1](../stories/US-05.2.1.md) | Per-unit pricing rate | Changed | Confirmed | v6 restates the rule. | V #14 #20 |
| [US-05.2.5](../stories/US-05.2.5.md) | Fixed fee schedule pricing | Changed | Confirmed | BTM optional on a fixed price. | B #55 |
| [US-05.2.6](../stories/US-05.2.6.md) | Fixed rate Contracts | Changed | Confirmed | Rate live in v6; editable flag. | V #3 #26 #27 |
| [FT-05.3](../stories/FT-05.3.md) | Multi-procedure rule (supersedes RFP split-billing rule) | Changed | Verify | v6 restatement. | V #38 |
| [US-05.3.1](../stories/US-05.3.1.md) | Multi-procedure BTM rule | Changed | Verify | Finish not handover; v6 multi-procedure. | B #43 #47; V #38 |
| [FT-05.4](../stories/FT-05.4.md) | Changes to a Procedure's price | Changed | Confirmed | Was "Adjustments and overrides". No sequence, no authority order: last edit stands. | A #39; B #10 #54; V #11 #27 #54 |
| [US-05.4.1](../stories/US-05.4.1.md) | Apply anaesthetist adjustment | Changed | Confirmed | Editable flag replaces first/third party; no reason. | B #54; V #27 |
| [US-05.4.2](../stories/US-05.4.2.md) | Office can change any price | Changed | Confirmed | Was "Office price override". The office's change is the last edit, not an override; no reason. | A #24 #39; B #10 #54; V #16 #27 #43 #54 |
| [US-05.4.3](../stories/US-05.4.3.md) | Fixed discount Contracts | Changed | Confirmed | DHB example; v6 live discount. | A #36; V #3 #26 |

### EP-06 · Prepayment

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-06](../stories/EP-06.md) | Prepayment | Changed | Verify | Prepayment is triggered by a Contract flagged as prepaid, picked by the office, not by a setting on the anaesthetist's profile. | A #26 #40; B #20 #22 #25; V #4 #6 #19 #28 |
| [FT-06.1](../stories/FT-06.1.md) | Prepaid procedure settings on the anaesthetist profile | Retired | Confirmed to Retired | Retired: no prepaid settings on the profile; prepayment comes from the Contract. | B #20 #22 #25; V #4 #28 |
| [US-06.1.1](../stories/US-06.1.1.md) | Tick procedures or groups | Retired | Confirmed to Retired | Retired: no prepaid list on the profile. | B #22 |
| [US-06.1.2](../stories/US-06.1.2.md) | Admin can maintain on behalf | Retired | Confirmed to Retired | Retired: no profile settings to maintain. | B #20 #25 |
| [FT-06.2](../stories/FT-06.2.md) | Prepayment trigger and amount | Changed | Confirmed | Trigger moves to the Contract flagged as prepaid. | B #20; V #4 #19 #28 |
| [US-06.2.1](../stories/US-06.2.1.md) | Detect prepayment requirement | Changed | Confirmed | Trigger moves to the Contract. | B #20; V #4 #28 #30 |
| [US-06.2.2](../stories/US-06.2.2.md) | Set the prepaid amount | Changed | Confirmed | Amount always present; schedule-change question. | A #5; B #4; V #4 #19 |
| [US-06.3.1](../stories/US-06.3.1.md) | Raise the prepayment invoice | Changed | Verify | Trigger wording. | B #20; V #4 #17 #19 |
| [US-06.3.5](../stories/US-06.3.5.md) | Re-check when the Booking changes | Changed | Verify | Follows the trigger moving to the Contract. | V #4 #28 |
| [US-06.3.6](../stories/US-06.3.6.md) | Prepayment letter templates | Changed | Proposed | Supports templates. | A #26; V #17 #19 |
| [FT-06.4](../stories/FT-06.4.md) | Settlement after the procedure | Changed | Confirmed | Records that v6 (refund or extra invoice on a price change) differs from the directors' nothing-automatic rule (OQ-96). | V #6 |
| [US-06.4.1](../stories/US-06.4.1.md) | No automatic invoice or credit after a prepaid procedure | Changed | Confirmed | Records the tension without changing the rule. | A #5; V #6 #13 |
| [US-06.5.3](../stories/US-06.5.3.md) | Prepayment for a replacement anaesthetist | Changed | Verify | Terminology. | A #10 |

### EP-07 · List approval workflow

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-07](../stories/EP-07.md) | List approval workflow | Changed | Confirmed | Anaesthetist edit window runs to AUTHORISED. | B #26 #49 |
| [FT-07.2](../stories/FT-07.2.md) | SUBMITTED | Changed | Proposed | Donald and Greg agreed the anaesthetist can edit until authorised. | B #26 #49 #50 |
| [US-07.2.1](../stories/US-07.2.1.md) | Anaesthetist can still edit a submitted List | Changed | Proposed | Was "Anaesthetist loses edit access". Reversed: the anaesthetist can still edit a submitted List until AUTHORISED. | B #26 #49 |
| [US-07.2.2](../stories/US-07.2.2.md) | Office review of Contracts and references | Changed | Confirmed | Insurance details and the wrong-party risk. | A #3 #14 #16 #38; B #1 #10 #49; V #5 #17 #39 |
| [US-07.2.3](../stories/US-07.2.3.md) | Office corrections | Changed | Proposed | Last edit stands; anaesthetist can still edit. | A #39; B #10 #26; V #54 |
| [FT-07.4](../stories/FT-07.4.md) | List visibility in the anaesthetist app | Changed | Proposed | Wording: finalised to authorised; the anaesthetist finds the List again by search, not an archive. | B #26 |
| [US-07.4.1](../stories/US-07.4.1.md) | List leaves the main view once authorised | Changed | Verify | Was "List leaves the main view once invoiced". Exit point is authorisation. | B #26 |
| [US-07.4.2](../stories/US-07.4.2.md) | Anaesthetist's main view | Changed | Verify | Consistency with US-07.4.1. | B #26 |

### EP-08 · Billing/Invoice Engine and internal ledger

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [FT-08.1](../stories/FT-08.1.md) | Trigger and inputs | Changed | Proposed | Trigger moved to the Contract; removes a link to a retired item. | V #4 |
| [US-08.2.1](../stories/US-08.2.1.md) | Group by billable party | Link only | Verify | Link added by the link pass. |  |
| [US-08.2.3](../stories/US-08.2.3.md) | Split one Procedure's fee between two payers | Link only | Verify | Link added by the link pass. |  |
| [US-08.4.1](../stories/US-08.4.1.md) | Generate invoice documents | Changed | Proposed | Greg on the two styles; invoice description. | A #2 #6; B #36; V #8 #33 |
| [US-08.4.3](../stories/US-08.4.3.md) | Unique invoice numbers | Link only | Proposed | Link added by the link pass. |  |
| [US-08.4.4](../stories/US-08.4.4.md) | Invoice reproducibility | Link only | Proposed | Link added by the link pass. |  |
| [US-08.4.6](../stories/US-08.4.6.md) | Invoice description on each Procedure | Added (FT-08.4) | Proposed | Added: an invoice description on each Procedure, beside the two descriptions received. | A #6; B #36 #37 #38; V #8 #29 |
| [US-08.6.1](../stories/US-08.6.1.md) | Additional invoice for late billing lines | Changed | Verify | Other billing lines merged into events. | B #59 #61 |
| [US-08.6.3](../stories/US-08.6.3.md) | Create an additional invoice on a Procedure | Changed | Verify | Links the two views of the same function. | B #61 |

### EP-11 · Patients and billable parties

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-11.1.1](../stories/US-11.1.1.md) | Patient record keyed on NHI | Changed | Proposed | NHI is mandatory, no blank; noted. | B #3 |
| [US-11.1.4](../stories/US-11.1.4.md) | Patient without NHI | Changed | Open | Donald asked for blank-NHI wording to be cleaned up; the pending case stays open. | B #3 |
| [US-11.1.5](../stories/US-11.1.5.md) | Missing NHI problem list | Changed | Proposed | Same clean-up. | B #3 |
| [FT-11.2](../stories/FT-11.2.md) | "Who is billed: holder or the payer on the Booking" | Changed | Confirmed | v6 billable party. | V #15 #24 #39 |
| [US-11.2.1](../stories/US-11.2.1.md) | Patient billed when the Contract does not bill its holder | Changed | Confirmed | Confirms the existing rule. | V #15 |
| [US-11.2.2](../stories/US-11.2.2.md) | Payer on the Booking, editable to a guardian | Changed | Confirmed | v6 payer fields. | V #22 #29 |
| [FT-11.4](../stories/FT-11.4.md) | Insurers | Changed | Proposed | Parent of the new story. | B #1; V #5 |
| [US-11.4.1](../stories/US-11.4.1.md) | Insurer master data | Changed | Confirmed | Terminology; questions answered. | A #2; V #2 |
| [US-11.4.3](../stories/US-11.4.3.md) | Insurer and approval number on the Booking | Added (FT-11.4) | Proposed | Added: insurer and approval number on the Booking (OQ-93, stored; narrowing still open). | A #3 #14; B #1 #57; V #5 #29 #55 |

### EP-12 · Anaesthetist profile and reporting

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-12](../stories/EP-12.md) | Anaesthetist profile and reporting | Changed | Confirmed to Proposed (board, Donald, 14:39) | Profile keeps the dollar value per unit; prepaid procedure settings and the GST period removed from the description (board, Donald, 14:39 to 14:42). Status Confirmed to Proposed. | B #22 #23 #24 #25 |
| [FT-12.1](../stories/FT-12.1.md) | Profile settings | Changed | Confirmed | Greg: only the unit rate matters; the rest is contact information. | B #22 #25 |
| [US-12.1.1](../stories/US-12.1.1.md) | Dollar value per unit | Changed | Proposed | Greg's wording. | B #22 |
| [US-12.1.2](../stories/US-12.1.2.md) | GST period | Retired | Proposed to Retired | Retired: no GST period on the profile. | B #22 #24 |
| [US-12.1.3](../stories/US-12.1.3.md) | Prepaid procedures | Retired | Confirmed to Retired | Retired: no prepaid procedures on the profile. | B #20 #22 #25 |
| [FT-12.2](../stories/FT-12.2.md) | Reporting for anaesthetists | Changed | Proposed | Monthly, no GST period. | B #24 |
| [US-12.2.2](../stories/US-12.2.2.md) | GST report | Changed | Verify | Was "GST schedule". A monthly report of payments with their GST component. | B #24 #32 |

### EP-13 · Admin oversight and master data

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-13.4.3](../stories/US-13.4.3.md) | Reference data loaded from controlled spreadsheets | Changed | Proposed | Procedures gone; v6 data loading. | V #9 #48 |
| [US-13.7.1](../stories/US-13.7.1.md) | Warning routine | Changed | Confirmed | Completes the list; already in US-07.2.2. | V #5 #39 |
| [FT-13.8](../stories/FT-13.8.md) | Shared notification pool | Changed | Confirmed | Idea raised for the pool. | A #7 |
| [US-13.8.2](../stories/US-13.8.2.md) | Notify the team when an anaesthetist moves a List | Link only | Verify | Link added by the link pass. |  |

### EP-15 · Non-functional requirements

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-15.0.1](../stories/US-15.0.1.md) | Ease of use | Changed | Proposed | Ease-of-use steer. | B #29 |
| [US-15.0.2](../stories/US-15.0.2.md) | Mobile-first for anaesthetists | Changed | Proposed | Both apps in scope; parity not required. | B #27 #32 |
| [US-15.0.3](../stories/US-15.0.3.md) | Enter once | Link only | Proposed | Link added by the link pass. |  |
| [US-15.0.6](../stories/US-15.0.6.md) | Privacy and data minimisation | Changed | Proposed | Greg: 'It could be more explicit than that.' | B #3 |

## 4. domain-model.md changes

[domain-model.md](../domain-model.md), this run's changes only (header dated 2026-10-18):

- **Header:** inputs now include the 14 and 16 October meetings and the v6 documents; the Contract structure follows the technical design v6 and ERD (AR-29, AR-30), Greg's proposal, field names for orientation only (V #10 #12), replacing the draft v4.
- **"What changed since the RFP" rows rewritten:** holder kinds (insurer, hospital, surgeon or rooms, anaesthetist), no first or third party; the Contract on the Procedure sets its values, changed by permitted users, last change stands, BTM optional on a fixed price; prepayment triggered by a Contract flagged as prepaid, not a profile setting; NHI mandatory; a List leaves the main view when authorised and stays editable until then; base units on the RVG group with no procedure list; insurer and approval number on the Booking; No contract (RVG) held by AA; Contracts as series of dated versions (new version from an office-chosen date, never backdated); Contract upload by Alter or Replace through a staged review (OQ-100); monthly GST report of payments, no GST period; events absorb other billing lines; profile holds the unit rate, contact and bank details only; the notification pool idea of a "please check" flag.
- **ERD (mermaid):** BODY_SECTION, PROCEDURE, BILLING_LINE and PREPAID_SETTING removed; PROFILE holds the unit rate only; CONTRACT_HOLDER links to BILLABLE_PARTY and a PRACTITIONER (anaesthetist or surgeon); CONTRACT may hold no lines and is revised by a forward link; RVG_GROUP gives a default RVG code to CONTRACT_LINE and base units to BOOKING_PROCEDURE; CONTRACT_LINE prices a BOOKING_PROCEDURE (optional); modifier entities labelled as our addition, not in ERD v6, with whether any modifier is locked open (OQ-95).
- **Prose:** "Procedures and Contracts" and "Terms" rewritten (no lower-case procedure list; the procedure on a Booking is the text received; start and finish times, not handover).
- **Booking and Procedure:** insurer and approval number on the Booking; the rooms' and hospital's descriptions kept apart plus an invoice description; prepayment state from a prepaid Contract; inbound changes until SUBMITTED, then the anaesthetist and the office can change it until AUTHORISED, last change standing; the Procedure holds the Contract and line, an optional RVG code, units, price, rate and discount.
- **Contract section:** holder, Contract, line and billing-context tables rewritten from the v6 field lists; selection per FT-04.3; editable, prepaid and billed-holder settings and the typical arrangements replace first and third party.
- **RVG groups and modifier master:** retitled; no procedure list; the RVG picker is a type-ahead showing code, description and value.
- **Reference data and ledger:** the seed no longer lists procedures; v6 data loading; the GST bullet is the monthly report.
- **Calculation rules (section 3):** the layered resolver and numbered steps replaced by the plain model (starting values filled in when the Contract and RVG code are chosen, then values on the Procedure; price, or units times rate times one minus discount; priced on the version in force on the procedure date; 0 gives a no-charge invoice); one neutral line that the documents' step order is not adopted for the build (V #11). Prepayment paragraph: trigger is a prepaid Contract, amount the line's price; schedule-change question and the v6 refund tension (OQ-96).
- **Glossary:** procedure list, first party, third party, adjustable and body section removed; contract line key, reference code, editable setting, prepaid Contract, invoice description and approval number added.

## 5. Artifacts

Registered (sidecars in `requirements-board/requirements/artifacts/`):

| Artifact | Name | Kind | Status | File |
| --- | --- | --- | --- | --- |
| [AR-37](../artifacts/AR-37.md) | Pricing model and requirements with Greg, 14 October | transcript | Current | 14 October reconciled transcript |
| [AR-38](../artifacts/AR-38.md) | Pricing model and booking requirements with Greg, 16 October | transcript | Current | 16 October reconciled transcript |
| [AR-39](../artifacts/AR-39.md) | Notes on the pricing model meeting with Greg, 14 October | note | Current | the 14 October note |
| [AR-40](../artifacts/AR-40.md) | Notes on the pricing and booking requirements meeting with Greg, 16 October | note | Current | the 16 October note |
| [AR-41](../artifacts/AR-41.md) | Notes on the pricing model documents v6 | note | Current | the v6 documents note |

Overwritten in place at Donald's request (same AR numbers, dated 2026-10-16, author Greg Smith):

| Artifact | Now | Regions |
| --- | --- | --- |
| [AR-28](../artifacts/AR-28.md) | Pricing model executive summary (v6; was the 5 October guide) | how-a-procedure-is-priced, who-gets-the-invoice, no-contract-rvg, typical-arrangements, booking-to-invoice, booking-updates, prepayment, price-reviews-and-controls |
| [AR-29](../artifacts/AR-29.md) | Contract pricing model, technical design (v6; was v4, Draft) | 28: data-model, rvg-group-fields, contract-holder-fields, contract-fields, contract-line-fields, booking-procedure-fields, contract-behaviour, contract-selection, resolver, null-handling, time-entry, price-validation, pricing-snapshot, billable-party, prepayment, contract-versions, alter-and-replace, effective-dates, future-dated-versions, line-identity, upload-template, review-dashboard, effect-on-bookings, data-loading, history, integrity-rules, routine-procedures, changes-from-v3 |
| [AR-30](../artifacts/AR-30.md) | Contract pricing model ERD (v6; was v4, Draft) | rvg-group, contract-line, contract, contract-holder, booking-procedure |

The v4 and 5 October files stay in `artifacts/files` (the 7 October note links to them). Every item link to AR-28, AR-29 and AR-30 was moved to the v6 regions (old region ids that no longer exist were replaced or dropped; no item links the old price-precedence region), and v4 page links were brought to v6 pages. The twelve items that failed the check on a dead region (EP-06, FT-05.1, US-03.3.1, US-03.3.4, US-03.5.1, US-04.1.1, US-04.2.14, US-04.2.2, US-05.1.5, US-05.1.6, US-06.2.2, US-06.4.1) were among those relinked or edited.

## 6. New questions

| Question | Title | Owner | Affects |
| --- | --- | --- | --- |
| [OQ-104](../questions/OQ-104.md) | Prepaid price when the Contract changes before the procedure | Donald | US-06.2.2, US-04.2.10, FT-06.2, US-06.5.4, US-04.2.14 |
| [OQ-105](../questions/OQ-105.md) | How a surgeon's fixed-price arrangement is found for a Booking | Donald | US-04.1.5, US-04.3.2, US-04.2.1, FT-04.3 |
| [OQ-106](../questions/OQ-106.md) | Routine procedures as lines on No contract (RVG) | Donald | US-04.3.3, US-04.2.4, FT-04.3, US-03.3.1 |
| [OQ-107](../questions/OQ-107.md) | Can the anaesthetist depart from a fixed price at their own discretion | Donald | FT-03.5, US-03.5.1, US-04.2.2, US-05.4.1 |

## 7. Points with no requirement change

- A #8: how the documents were read together (they supersede the earlier guide); carried by the overwrite of AR-28, AR-29 and AR-30 and the relinks.
- A #25: "Draft" to "Active" is a wording fix for Greg's documents; the catalogue already uses ACTIVE (FT-07.1) and DRAFT for Draft Lists; recorded on OQ-17.
- A #42: next step (Greg to produce v6); done.
- B #11: Greg reordered the executive summary's price-step list; that order is not adopted (V #11). No requirement states it.
- B #19: a later read-through of the Contract screens; cited only as context on US-04.1.6.
- B #63: next steps and the meeting schedule.
- V #10: Donald's instruction for this run; carried out by the overwrite, the relinks and the domain-model changes.
- 10 items changed only by the link pass (section 3, "Link only"): US-01.3.2, US-01.4.7, US-02.1.1, US-02.5.2, US-08.2.1, US-08.2.3, US-08.4.3, US-08.4.4, US-13.8.2, US-15.0.3.

## 8. Left for Donald to decide, and flags

a. **Retiring Confirmed items.** US-05.1.6 (procedure master), FT-06.1, US-06.1.1, US-06.1.2 and US-12.1.3 (the profile prepaid settings) and US-03.3.6 (merged into FT-03.7) were Confirmed (US-03.3.6 on the board, 15:34); this run retired them on the strength of your 14 and 16 October statements and the v6 design. Reinstate any you did not mean to retire.
b. **OQ-49.** Your "no support of a blank" NHI may answer it outright (a Booking cannot exist without an NHI). Left Open because the pending-Booking case from an incoming source was not addressed. US-11.1.4 still says NHI pending.
c. **US-05.1.4 moved to Verify** by this run (status Confirmed to Verify): the modifier lock it describes is in question (OQ-95), as for US-03.3.4 and US-03.3.8.
d. **US-04.2.11 still Confirmed** though its model changed (a combination is now a standalone line on its holder's Contract, with no parent procedures).
e. **Prepaid refund and extra invoice.** v6 invokes a refund or extra invoice when a prepaid price changes; the directors said nothing automatic (OQ-96, OQ-61, OQ-97). The catalogue keeps the directors' rule until Ben answers.
f. **Web parity is now a nice to have** (US-03.1.4, US-15.0.2, OQ-89): to check with the anaesthetists. The anaesthetist web app stays in scope.
g. **Routine procedures** as lines on No contract (RVG) is a question (OQ-106), not a decision.
h. **OQ-93 still open** on whether insurance narrows the Contract list, and on whether the approval number is the design's insurance acceptance reference.
i. **Diagrams AR-01 and AR-02 still show the old model** (layered starting values, procedure master, first and third party) and several items still link them; redraw them or mark them Superseded.
j. **Stale prototype screenshot captions** that contradict the new rules need the next capture run: reason required on US-03.5.1, US-05.4.1 and US-05.4.2; "handover" on US-03.3.3 and US-03.6.1; "GST period" on US-12.2.2 and US-13.4.1; NHI pending on US-11.1.4.
k. **Contract at setup:** the v6 ERD marks the Contract required while its table says nullable; the catalogue keeps it mandatory at setup (US-04.3.4, OQ-26).

## 9. Uncommitted changes not part of this run

- `requirements-board/src/components/Screenshots.tsx`: a board code fix (a Set so an app key that shares a viewport's name gives one tab, not two).
- `requirements-board/requirements/board-layout.json`: a card position for US-13.1.1 (Donald, 15 October).

Neither was made by the requirements update.

## 10. Review pass, 2026-10-18

A review pass read the update epic by epic against the notes; these are the fixes it applied. Statuses were left alone except where noted in section 8.

**EP-01.** [US-01.4.6](US-01.4.6): a moved Booking re-triggers no prepayment or invoice calculation; the claim cap is the honour system.

**EP-02.** [US-02.5.7](US-02.5.7): hand-entered text kept as source text. [US-02.5.4](US-02.5.4): scoped to inbound changes, with PDF review and merge. [FT-02.1](FT-02.1), [US-02.2.1](US-02.2.1), [US-02.4.4](US-02.4.4), [EP-02](EP-02), [US-02.5.1](US-02.5.1), [US-02.3.1](US-02.3.1): attributions and edit window brought into line with the notes.

**EP-03.** [US-03.1.8](US-03.1.8), [US-03.1.4](US-03.1.4), [US-03.1.3](US-03.1.3), [US-03.2.2](US-03.2.2), [US-03.1.6](US-03.1.6), [US-03.6.2](US-03.6.2), [US-03.6.3](US-03.6.3): invented or inferred wording removed, sources added. [FT-03.5](FT-03.5), [US-03.5.1](US-03.5.1): discount link fixed, OQ-96 and OQ-107 pointers, diagram staleness noted. [US-03.4.1](US-03.4.1), [FT-03.4](FT-03.4): reset limited to price, rate and discount; AUTHORISED window noted. [US-03.3.1](US-03.3.1), [FT-03.3](FT-03.3), [US-03.3.4](US-03.3.4), [US-03.3.8](US-03.3.8): RVG list, optional modifiers, lock hedged with OQ-95. [FT-03.6](FT-03.6), [EP-03](EP-03), [FT-03.7](FT-03.7), [US-03.7.1](US-03.7.1), [US-03.7.2](US-03.7.2), [US-03.7.3](US-03.7.3): events wording and links. [US-03.3.6](US-03.3.6): contradictory notes removed.

**EP-04.** [US-04.3.2](US-04.3.2), [US-04.1.2](US-04.1.2), [US-04.2.4](US-04.2.4), [US-04.2.11](US-04.2.11), [US-04.1.1](US-04.1.1), [US-04.2.14](US-04.2.14), [FT-04.2](FT-04.2), [US-04.1.4](US-04.1.4), [US-04.2.2](US-04.2.2), [US-04.2.13](US-04.2.13), [US-04.2.10](US-04.2.10), [FT-04.1](FT-04.1), [FT-04.3](FT-04.3), [US-04.1.3](US-04.1.3), [US-04.3.3](US-04.3.3), [US-04.3.5](US-04.3.5), [EP-04](EP-04): stale diagram links dropped, thousands as lines, "unit value" wording, own-child links removed, default RVG code caveat, OQ-104 pointers. [US-04.2.1](US-04.2.1): US-11.4.3 made a link.

**EP-05.** [FT-05.2](FT-05.2), [FT-05.4](FT-05.4), [US-05.4.1](US-05.4.1), [US-05.4.2](US-05.4.2), [US-05.2.1](US-05.2.1), [US-05.2.5](US-05.2.5), [US-05.1.1](US-05.1.1), [FT-05.1](FT-05.1), [EP-05](EP-05): AR-01 and AR-02 layered-model links removed; US-05.4.1 defers to the Contract setting. [US-05.1.3](US-05.1.3), [US-05.4.3](US-05.4.3), [US-05.3.1](US-05.3.1), [US-05.1.5](US-05.1.5), [US-05.1.4](US-05.1.4): OQ-95 and OQ-89 qualifiers, unsupported claim moved to a note.

**EP-06.** [FT-06.2](FT-06.2), [US-06.2.1](US-06.2.1), [EP-06](EP-06), [US-06.3.1](US-06.3.1), [US-06.3.6](US-06.3.6), [US-06.3.5](US-06.3.5), [US-06.5.4](US-06.5.4), [US-06.4.1](US-06.4.1): prepaid wording follows the Contract's line; inferences removed; OQ-104 pointers. [US-06.2.2](US-06.2.2): AR-02 first-party link dropped. [US-08.2.2](US-08.2.2): same prepaid-line wording, "not an estimate" dropped.

**EP-07.** [US-07.2.2](US-07.2.2), [US-07.2.3](US-07.2.3), [FT-07.4](FT-07.4), [US-07.4.1](US-07.4.1), [US-07.4.2](US-07.4.2), [US-07.2.1](US-07.2.1), [EP-07](EP-07), [US-07.1.1](US-07.1.1): archive wording replaced by search, unfaithful clause dropped, sources and related links added.

**EP-08.** [US-08.4.6](US-08.4.6), [US-08.6.3](US-08.6.3), [US-08.2.3](US-08.2.3), [US-08.6.1](US-08.6.1), [US-08.6.4](US-08.6.4), [FT-08.6](FT-08.6), [EP-08](EP-08): buttons sit on the Procedure, late charges wording, OQ-103 and OQ-96 flags.

**EP-11.** [US-11.4.1](US-11.4.1), [FT-11.2](FT-11.2), [US-11.4.3](US-11.4.3), [FT-11.4](FT-11.4), [US-11.1.1](US-11.1.1), [US-11.2.2](US-11.2.2), [US-11.2.3](US-11.2.3), [US-11.3.2](US-11.3.2), [EP-11](EP-11): OQ-93 shown as partly answered, approval number on the Booking, insurer name as Greg's proposal, NHI mandatory.

**EP-12, EP-13, EP-15.** [EP-12](EP-12): blacklist question shown as unsettled. [US-13.7.1](US-13.7.1), [US-13.4.1](US-13.4.1): insurance warning aligned, contract holders listed. [US-15.0.2](US-15.0.2), [US-15.0.1](US-15.0.1): wording attributed and softened.

**Questions.** [OQ-99](OQ-99), [OQ-103](OQ-103), [OQ-55](OQ-55), [OQ-53](OQ-53), [OQ-43](OQ-43), [OQ-25](OQ-25), [OQ-62](OQ-62), [OQ-100](OQ-100), [OQ-17](OQ-17), [OQ-29](OQ-29), [OQ-91](OQ-91), [OQ-88](OQ-88), [OQ-89](OQ-89), [OQ-96](OQ-96), [OQ-106](OQ-106), [OQ-104](OQ-104), [OQ-107](OQ-107), [OQ-79](OQ-79), [OQ-18](OQ-18), [OQ-93](OQ-93), [OQ-49](OQ-49), [OQ-68](OQ-68), [OQ-78](OQ-78): invented examples removed, superseded markers placed, retired IDs removed, affects lists corrected.

**Log and model.** This log: counts, link-only count (10), source and wording fixes. domain-model.md: List lifecycle, calculation block, prepayment, profile and glossary wording; the extra invoice line now notes the office can also change the price.

Findings rejected: 30 (taste, status changes left to Donald, or rules the notes do not state). Raised for Donald, not fixed: OQ-98 is Answered though how a no-line Contract is offered is still open; FT-12.1 stays Confirmed; US-04.3.5 price_source has no question; AR-24 needs a redraw; section 8 items stand.
