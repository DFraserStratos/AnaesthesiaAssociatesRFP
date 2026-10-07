# Requirements update, 2026-10-07: Contracts, pricing model and the AA client meeting

What the 2026-10-07 update did to the catalogue. It records the morning's AA meeting with Greg (a
read-through of EP-04 Contracts), the AA client meeting with Ben, Vanessa and Greg the same morning,
the directors' answers of 6 October (points 3 onward) and the two pricing model documents (the guide
*How procedures are priced and who pays* and the draft technical design v4 with its ERD). The
Contract model is rewritten around contract holders, third-party and first-party Contracts and the
one default, No contract (RVG); prepayment becomes the anaesthetist's own fixed price with nothing
calculated afterwards; base units move to the RVG group; modifiers become optional except the locked
age and included ones. Built from the actual changes (`git diff HEAD` and untracked files under
`docs/discovery-reference/Updated Requirements`, checked against the run's change list and the
board history in `requirements-board/.history`). Donald's board edits made during the Greg meeting
(09:05 to 10:56 NZDT) sit in the same diff and are marked "(board, Donald)". The same working tree
also holds two earlier uncommitted runs with no change log of their own (section 9) and the List
lifecycle run, which has its own log ([2026-10-07-list-lifecycle-states.md](2026-10-07-list-lifecycle-states.md));
neither is part of this run.

Source shorthand in this log: **G** `Notes 2026-10-07 · AA meeting with Greg`, **C** `Notes 2026-10-07
· AA client meeting`, **P** `Notes 2026-10-07 · Pricing model documents`, **D** `Notes 2026-10-06 ·
AA directors meeting`; `G #8` means point 8 of that note.

**Counts.** 9 questions answered (2 of them, OQ-91 and OQ-94, by the follow-up decisions of 8 October, section 10) · 17 answers extended (2 of them, OQ-15 and OQ-86, answered on the
board by Donald before the run) · 10 open questions updated (plus 2 affects-only edits) · 94 items
changed (89 by this run, 5 of them follow-up fixes; 1, US-04.1.3, on the board only) · 12 items added
(11 by this run; US-04.2.13 created empty on the board and written by this run) · 8 retired (6 by
this run; FT-04.4 and US-04.4.1 on the board) · 1 moved (US-04.4.2, on the board, then retired) · 12
new questions (OQ-91 to OQ-102) · 9 artifacts registered (AR-26 to AR-34) · domain-model.md changed ·
67 links added by the link pass.

## 1. Inputs

- Notes:
  - [notes/2026-10-07-aa-meeting-with-greg.md](../notes/2026-10-07-aa-meeting-with-greg.md) (points #1 to #62), artifact [AR-31](../artifacts/AR-31.md)
  - [notes/2026-10-07-aa-client-meeting.md](../notes/2026-10-07-aa-client-meeting.md) (points #1 to #41), artifact [AR-32](../artifacts/AR-32.md)
  - [notes/2026-10-06-aa-directors-meeting.md](../notes/2026-10-06-aa-directors-meeting.md), points #3 to #11 only (points #1 and #2 were applied by an earlier run, section 9), artifact [AR-20](../artifacts/AR-20.md)
  - [notes/2026-10-07-pricing-model-documents.md](../notes/2026-10-07-pricing-model-documents.md) (points #1 to #45), artifact [AR-33](../artifacts/AR-33.md)
- Raw files:
  - [AA Meeting with Greg Oct 7th Reconciled Transcript.md](../artifacts/files/AA%20Meeting%20with%20Greg%20Oct%207th%20Reconciled%20Transcript.md) ([AR-26](../artifacts/AR-26.md))
  - [AA Meeting with AA Oct 7th Reconciled Transcript.md](../artifacts/files/AA%20Meeting%20with%20AA%20Oct%207th%20Reconciled%20Transcript.md) ([AR-27](../artifacts/AR-27.md))
  - The guide, [How procedures are priced and who pays.docx](../artifacts/files/How%20procedures%20are%20priced%20and%20who%20pays.docx) (holds the directors' short answers under §10) and [.pdf](../artifacts/files/How%20procedures%20are%20priced%20and%20who%20pays.pdf) of 5 October ([AR-28](../artifacts/AR-28.md))
  - The technical design, [Contract pricing model - technical design v4.docx](../artifacts/files/Contract%20pricing%20model%20-%20technical%20design%20v4.docx) and [.pdf](../artifacts/files/Contract%20pricing%20model%20-%20technical%20design%20v4.pdf) ([AR-29](../artifacts/AR-29.md), status Draft), and its ERD ([AR-30](../artifacts/AR-30.md), status Draft)
  - New RVG modifiers reference: [NZSA RVG 2021 modifiers.md](../artifacts/files/NZSA%20RVG%202021%20modifiers.md) and [NZSA RVG 2021 included modifiers.csv](../artifacts/files/NZSA%20RVG%202021%20included%20modifiers.csv) ([AR-34](../artifacts/AR-34.md)), made at Donald's request (P #42 to #45)
- Board answers already in the repo (uncommitted, made by Donald before the run): [OQ-15](../questions/OQ-15.md) "Agreed.", [OQ-86](../questions/OQ-86.md) "NO", and [OQ-47](../questions/OQ-47.md) moved to Proposed with owner "AA accountant".
- Donald's board edits during the Greg meeting (09:05 to 10:56 NZDT, from `requirements-board/.history`, recorded in the Greg note): status moves on US-04.1.1, US-04.1.3, US-04.1.4, US-04.2.1, US-04.2.8, US-04.2.11, US-04.3.2, US-04.3.3; FT-04.4 and US-04.4.1 retired; US-04.4.2 moved under FT-04.1; US-04.2.13 created empty; US-04.3.7 to the Future Work lane; wording edits on US-04.2.2, US-04.2.4 and FT-04.3.
- Link pass: link-requirements over the changed epics, 67 links applied (`requirements-board/.links/links-report.md`).

**Precedence used.** Donald's typed statements and the directors' answers, then the pricing guide
(taken as true now, P #3), then ideas Greg only floated on 7 October, then the existing catalogue.
The technical design v4 and its ERD are a draft reference shape for Greg's review (P #4): they are
cited in Technical discussion sections and the domain model and may change before the catch-up build;
the requirements themselves stay in plain words.

## 2. Questions answered, extended and updated

Only this run's changes (those citing the 2026-10-07 notes or directors' points #3 onward). Earlier
uncommitted runs also edited OQ-03, OQ-38, OQ-40, OQ-61, OQ-76, OQ-80 and OQ-90 (section 9).

**Answered** (status Open → Answered in this run).

| Question | Title | Answer in one line | Source |
| --- | --- | --- | --- |
| [OQ-31](../questions/OQ-31.md) | Event that removes a List from the anaesthetist's view | Leaves the main view once the office has finalised it and sent it to invoicing; old work stays findable by search or archive; the main view starts at today plus un-invoiced Lists. | C #2 #16 #41 |
| [OQ-38](../questions/OQ-38.md) | Two modifier units in the prepayment estimate | No longer arises: the prepayment is a fixed defined amount, not a BTM estimate, so no contingency modifiers; where amounts are kept is on OQ-04. | D #3 #4; C #3 #14 #17 #18 |
| [OQ-43](../questions/OQ-43.md) | What the blacklist warning shows an anaesthetist | Preferences are private and two-way, admin only; admin get a warning (not a block) when assigning or moving; no warning at all when an anaesthetist hands on their own List; positive preferences wanted; the name is to change. | C #4 #19 #20 #36 |
| [OQ-48](../questions/OQ-48.md) | Which date decides the price in force | The procedure date; whether the Contract or its lines carry the dates left to Greg's model (the draft dates the Contract). | G #1 #39 #40; C #6; P #18 #28 |
| [OQ-76](../questions/OQ-76.md) | Outstanding questions for prepaid procedures | No partial or deposit prepayments for anaesthetics: the prepayment is the defined amount; extra invoices or credits never automatic, raised by hand. | D #1 #2 #10; C #8; P #1 |
| [OQ-78](../questions/OQ-78.md) | Default Contracts, or the hospital holding every Contract | No contract (RVG) is the one default, offered first for every procedure; no hospital, insurer or procedure defaults; it bills the payer on the Booking (from the guide). Greg to come back on who it bills; reopen if he differs. | G #7 #54 #59 #60; P #2 #3 #10 #11 #37 |
| [OQ-82](../questions/OQ-82.md) | Do we want to automate the change emails | Manual in the MVP; automation is a future story (US-02.3.5). Asked about admin changes; read as covering anaesthetist changes too. | C #11 #13 #25 #39 |

**Answers extended** (status stays Answered; a "The meeting adds" or update paragraph added).

| Question | Title | What was added | Source |
| --- | --- | --- | --- |
| [OQ-03](../questions/OQ-03.md) | Refund when prepaid exceeds final | Honour system on reassignment with no system logic; nothing calculated on fixed-cost Contracts; ad hoc invoice or credit by hand as the exception. Affects + US-06.4.1. | D #10 |
| [OQ-04](../questions/OQ-04.md) | Prepaid amount source | Board answer (estimate) superseded: the amount is the fixed price on the anaesthetist's first-party Contract. Open: who maintains it (OQ-91), approval step, amount when no price is set (OQ-92). | D #4 #9; G #34 #36; C #3 #17 #18 #35; P #1 #15 |
| [OQ-15](../questions/OQ-15.md) | Modifier split when units do not divide evenly | Board "Agreed." (Donald, before the run) kept; confirmed in the room with Ben, Vanessa and Greg. | C #1 |
| [OQ-18](../questions/OQ-18.md) | Contract holder codes vs RVG codes | The RVG link is mandatory on every line (optional mapping removed); holder codes stay searchable; Greg wants a composite search. | G #4 #31 |
| [OQ-22](../questions/OQ-22.md) | Who may set the Contract from hospital data | Future work: hospital changes go to an admin queue; Greg wants an unmatched procedure to default to RVG and stop; no Contract-selection smarts in the MVP. | G #57 #58 |
| [OQ-25](../questions/OQ-25.md) | Is a Pre-paid Contract category still wanted? | Which procedures are prepaid stays on the anaesthetist; the amount comes from their first-party Contract; Greg's pre-payable flag on the Contract not adopted. | D #4 #9; G #34 #35; P #15 |
| [OQ-26](../questions/OQ-26.md) | When does AA approve Contract selections? | Contract at setup is mandatory, the Booking sits on the admin list until set; anaesthetist changes before submit seen at review. | G #55; P #12 |
| [OQ-40](../questions/OQ-40.md) | Central prepayment refund and trust account | Honour system with no logic on a move sits against "any move re-checks prepayments"; refund on cancellation kept. | D #10; P #15 |
| [OQ-53](../questions/OQ-53.md) | How combined procedures are modelled | Greg accepted it as written; picker shows singles and combinations; Greg still finds multiple parents "a bit problematic". | G #2 #52 |
| [OQ-54](../questions/OQ-54.md) | Child as billable party: block or warn | Payer named on the Booking, prefilled from the patient, editable to a guardian; Greg wants a billable-party reference table; differs from "guardian details belong to the Contract". | G #25 #29; P #3 #11 #34 |
| [OQ-55](../questions/OQ-55.md) | Insurer and funding source: on the Booking or the Patient | Contradiction flagged: Greg says the Booking holds the funding source and the guide has an insurance indication on the Booking; storage open (OQ-93); per-hospital default Contract overtaken. | G #6 #7 #27; P #2 #11 #34 |
| [OQ-61](../questions/OQ-61.md) | Final fee above the prepayment: always invoice the balance? | Nothing extra calculated on any prepaid or fixed-cost Contract; anaesthetist may raise ad hoc invoices or credits by hand; the guide's automatic extra-invoice proposal not adopted. | D #10; P #15 |
| [OQ-62](../questions/OQ-62.md) | Where base units live, and how a Procedure is picked | Meeting detail (two pick routes, procedure or RVG code; RVG code possibly blank at setup, OQ-99), then a settled update: base units on the RVG group, a procedure may set its own, a Contract line may override both; per-procedure default RVG Contracts retired (US-04.4.2). | G #16 #18 #31 #60 #61; C #27 #28 #31 #38; P #8 #10 #20 #21 #24 #28 |
| [OQ-66](../questions/OQ-66.md) | Contract identifiers and finding Contracts among thousands | Composite search; filters by active/all and by holder; navigation holder-first or procedure-first; anaesthetists see only their own first-party Contracts; the draft has no AA code. | G #4 #24 #27 #52; C #27; P #23 #27 |
| [OQ-67](../questions/OQ-67.md) | Who a Contract belongs to, and who pays | The Contract decides who is billed: the holder's billable party (flag plus reference) or the payer named on the Booking; no invoice email on the Contract. | G #22 #29 #53; P #11 #22 #34 |
| [OQ-70](../questions/OQ-70.md) | Prepayment when a prepaid Booking moves to another anaesthetist | Honour system confirmed; whether the payable update on a move survives "no logic to detect these flows" not said (OQ-80). | D #10 |
| [OQ-86](../questions/OQ-86.md) | Should anaesthetists browse and pull Draft Lists themselves | Board "NO" (Donald, before the run) kept; confirmed in the room. | C #12 |

**Updated, still open.**

| Question | Title | What changed | Source |
| --- | --- | --- | --- |
| [OQ-13](../questions/OQ-13.md) | Hospital download format | Format still unknown; first version has no automated intake: downloads land in a matching screen, updates matched by date, surgeon, location and slot. | G #17 |
| [OQ-29](../questions/OQ-29.md) | GST agency treatment | Still for the accountant; GST treatment set on the Contract, prices held ex GST, GST at the foot of the invoice. | G #32 #38 |
| [OQ-47](../questions/OQ-47.md) | Payment day and cycle | Proposed (board, Donald; owner AA accountant). Update: the room said Greg's weekly ISO-week cycle "makes sense"; build to it (US-10.2.7), still ask the accountant. | C #5 #15 |
| [OQ-49](../questions/OQ-49.md) | Booking without NHI: provisional or blocked | Vanessa: make NHI mandatory, the patient identifier throughout. Open: refuse the Booking or hold it pending; fit with a system patient ID. | C #7 #34 |
| [OQ-77](../questions/OQ-77.md) | Splitting a combined invoice, the rebill total and the before-invoicing case | Part 1: rebill must equal the credited invoice (against the recommendation); part 2: yes, reverse the payable; part 3 open (Greg: override the price before invoicing, or cancel the pending invoice; check with Vanessa). | G #3 #11; C #9 #37 |
| [OQ-79](../questions/OQ-79.md) | What posts to the shared notification pool, and how long notices last | Vanessa agreed the shared, not per-user, pool and a Draft List view sorted by date; the four parts still unanswered. | C #10 #24 |
| [OQ-80](../questions/OQ-80.md) | When a prepayment's receivable and payable pair is created and amended | Not answered; "no logic to detect these flows" leaves unclear whether the payable is still amended on a move. | D #10 |
| [OQ-88](../questions/OQ-88.md) | RVG code master and procedure master, one list or two | A managed procedure level agreed (about 400 rows); guide and draft have two levels, each procedure in one RVG group; hierarchy vs flat and the system code still open. | G #14 #15; C #26 #31; P #8 #20 #21 |
| [OQ-89](../questions/OQ-89.md) | Contract defined rate and fixed fee after the rewording | Q1 and Q2 answered in effect (fixed rate for the whole Procedure; separate locked fixed discount); Q3 partly (add-on and quantity rule dropped). Open: time band; whether the anaesthetist can add a discount on top of a fixed discount. | D #6 #11; G #5 #28 #30 #31; P #24 #38 |
| [OQ-90](../questions/OQ-90.md) | Does the RVG default multi-procedure rule still apply | Not answered; the modifier-split leg confirmed (OQ-15); the RVG says one base unit for multiple procedures; the draft says still being confirmed. | C #1; P #32 #45 |

**Affects only.** [OQ-50](../questions/OQ-50.md) (RVG time rule after two hours) and
[OQ-75](../questions/OQ-75.md) (RVG time rule: check against the NZSA RVG 2021 text): affects
+ US-06.2.2, since their US-06.2.4 is retired. OQ-38 and OQ-43 affects also gained US-06.4.1 and
US-01.3.5.

Scanned with no change: OQ-06, OQ-16, OQ-20, OQ-32, OQ-34, OQ-45, OQ-56, OQ-65, OQ-72, OQ-73 (the new
evidence agrees with the answer or is recorded on another question), and OQ-12, OQ-60, OQ-81, OQ-83,
OQ-84, OQ-85, OQ-87 (nothing bears on them).

## 3. Items changed, added, retired or moved

Status is before (at `HEAD`, `630b8e1`) → now. "(board, Donald)" means Donald made that change on the
Requirements Board during the Greg meeting; it is not from this run's change list. "Fix-up" means a
follow-up correction after the main pass. Titles are current; a former title is given in "What
changed".

### EP-01 · Schedule canvas, Slots and Lists

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-01.3.5](../stories/US-01.3.5.md) | Not-preferred pairing warning when assigning or moving a List | Changed | Confirmed | Was "Blacklist warning when assigning a List". The separation and soft warning also apply when admin move or reassign a List (US-01.4.1); available anaesthetists without a conflict shown apart from those with one; points to preferred pairings and priority tiers; "blacklist" to be renamed. | C #4 #20 #21; OQ-43 |
| [US-01.3.6](../stories/US-01.3.6.md) | Anaesthetist priority tiers for assignment | Added (FT-01.3) | Verify | Admin-only tier per anaesthetist, one of four (provisionally Gold Elite, Gold, Silver, Bronze; Bronze default); suggestions ordered by tier, shuffled within a tier; tiers can filter; anaesthetists never see them. Components Admin App, Scheduling Engine, Master Data. | C #21 #22 #23 |
| [US-01.4.5](../stories/US-01.4.5.md) | No preference warning when an anaesthetist moves their own List | Changed | Verify → Confirmed | Was "Blacklist warning when an anaesthetist reassigns their own List". No warning and nothing revealed to either anaesthetist; it shows who is available; the office can explain if a surgeon complains (6am sick cover); a yellow warning was floated and dropped. ACs and OQ-43 note replaced. | C #4 #19 #36; OQ-43 |
| [FT-01.6](../stories/FT-01.6.md) | Draft Lists | Changed | Confirmed | OQ-86 note replaced: answered NO, confirmed on 7 October; Draft Lists are an office job. | C #12; OQ-86 |
| [US-01.6.2](../stories/US-01.6.2.md) | See Draft Lists flagged in the Admin App | Changed | Confirmed | Note: Vanessa welcomed one place for all Draft Lists, sorted by closeness to the procedure date. | C #24 |

### EP-02 · Booking intake

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [FT-02.1](../stories/FT-02.1.md) | Hospital booking download and matching screen | Changed | Verify | Note: no automated decisions in the first version; downloads from the two hospitals land in the matching screen; staff save a Draft List or assign; automated approvals once matching is trusted. | G #17; OQ-13 |
| [US-02.1.3](../stories/US-02.1.3.md) | Show differences on match | Changed | Confirmed | A later update for a matched Booking arrives in the same screen, matched by date, surgeon, location and slot; the admin approves it. | G #17; OQ-13 |
| [US-02.3.3](../stories/US-02.3.3.md) | Draft a booking update email | Changed | Verify | OQ-82 note replaced with the answer: manual in the MVP, automation later (US-02.3.5); read as covering anaesthetist changes too. | C #11 #13 #25 #39; OQ-82 |
| [US-02.3.5](../stories/US-02.3.5.md) | Send booking change emails automatically | Added (FT-02.3) | Future | Later phase: the system sends the update email itself when a change is saved; manual at go-live to build trust. Swimlane Future Work. | C #11 #13 #25 #39; OQ-82 |

### EP-03 · Booking and Procedure capture (anaesthetist)

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-03](../stories/EP-03.md) | Booking and Procedure capture (anaesthetist) | Changed (fix-up) | Confirmed | The anaesthetist can change the procedure as well as the Contract, until the List is submitted. | P #12 |
| [US-03.1.6](../stories/US-03.1.6.md) | Find past work and old invoices | Changed | Proposed | Was "Find past work from a calendar". Also an archive or deeper search for earlier Bookings and Lists, including invoiced ones, to see what was entered (an invoice query months later). | C #2 #16 |
| [US-03.1.8](../stories/US-03.1.8.md) | See the prepaid amount on the Booking | Added (FT-03.1) | Confirmed | The anaesthetist sees the prepaid amount, and whether paid, on a prepaid Booking and when recording units; settles the guide's open point over Greg's view. | D #5; P #15 #39 |
| [US-03.1.9](../stories/US-03.1.9.md) | Show the source wording beside the procedure | Added (FT-03.1) | Confirmed | The rooms' or hospital's exact procedure text is shown beside the mapped procedure in both apps, keeping fuller hospital wording; the invoice uses the procedure's own wording. | G #13; C #29; P #8 |
| [FT-03.3](../stories/FT-03.3.md) | Record clinical billing data per Procedure | Changed | Proposed | Records procedure and Contract, base, time and modifier units, a short explanation per modifier claimed, other lines; separate "ASA score" item dropped (ASA is an optional modifier). | D #3; P #12 #16 |
| [US-03.3.1](../stories/US-03.3.1.md) | Pick the procedure and Contract, with starting units | Changed | Verify | Was "Select an RVG code (with ranged override)". Find the procedure by body area, subgroup, procedure or straight by RVG code, then the Contract; starting units from the Contract line, else the procedure, else its RVG group; refresh on change; any value allowed, out-of-range warns the office. Default-RVG-Contract seeding removed. Technical: draft resolver (AR-29). | G #16; C #27 #28; P #12 #28 #30; OQ-62 |
| [US-03.3.4](../stories/US-03.3.4.md) | Choose optional modifiers, each with a short explanation | Changed | Proposed → Verify | Was "Capture Procedure modifiers (ASA seed and itemisation)". The system adds only locked modifiers (age, US-03.3.8; included in base units, US-05.1.4); all others optional from the RVG modifier table plus AA's own, each with a short explanation; ASA seed and procedure-default pre-fill dropped (OQ-95). Greg's "leave modifiers out of v1" not adopted. Links AR-28, AR-29, AR-34. | D #3 #8; G #37; P #12 #16 #30 #40 #43 #45 |
| [US-03.3.6](../stories/US-03.3.6.md) | Other billing lines | Changed | Proposed | Was "Other billing lines (including UNIT X RATE)". UNIT X RATE line and criterion removed (a fixed-rate Contract prices the whole procedure, US-05.2.6); Contract add-on fees removed; OQ-89 note resolved. | D #11; G #5; OQ-89 |
| [US-03.3.8](../stories/US-03.3.8.md) | Age modifier from the patient's age | Added (FT-03.3) | Confirmed | A1 or A2 applied from the patient's date of birth on the procedure date, shown locked; bands and stacking with H6b, P2 to confirm (OQ-95); AA's rule, not the RVG's. | D #3 #8; P #16 #43 #45 |
| [FT-03.4](../stories/FT-03.4.md) | Contract on the Procedure | Changed | Confirmed | The anaesthetist can change the procedure as well as the Contract until submit, no reason needed; the office sees it at review. | P #12 #27; OQ-26 |
| [US-03.4.1](../stories/US-03.4.1.md) | Anaesthetist can change the procedure or Contract | Changed | Confirmed | Was "Anaesthetist can change the Contract". No explanation needed; audited and flagged at review; starting units and fixed price refresh; a typed price or discount is cleared if the new Contract is not adjustable; insurance-falls-through case (switch to No contract (RVG)). New ACs. | P #11 #12 #27 |
| [FT-03.5](../stories/FT-03.5.md) | Anaesthetist adjustment | Changed (fix-up) | Confirmed | Description rewritten to the guide's rule: typed price or % discount with a reason on No contract (RVG) and first-party Contracts; third-party price stands (change the Contract to depart); fixed discount shown locked. | D #11; P #13 #14 |
| [US-03.5.1](../stories/US-03.5.1.md) | Apply an anaesthetist adjustment (with required reason) | Changed | Proposed → Verify | "When the Contract allows" replaced by the guide's rule (as FT-03.5); third-party price read-only, no discount field; fixed discount locked; price change on a prepaid procedure is OQ-96. | D #11; P #13 #14 #25 #26 |
| [US-03.6.1](../stories/US-03.6.1.md) | Mark a Booking complete | Changed | Confirmed | "RVG code or fee schedule line" and "inputs its Contract requires" (retired US-04.2.7) replaced by a procedure, a Contract and any reference the holder needs (US-04.2.2); plus a short explanation per modifier; Booking without a matched procedure is OQ-99. | G #10; C #28 #38; P #12 |

### EP-04 · Contracts

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-04](../stories/EP-04.md) | Contracts | Changed | Confirmed | Description in plain words: a Contract is a structure that sets how a procedure is paid for and who pays, not necessarily a legal contract; AA in the centre, everyone else a contract holder (third party: insurer, hospital, surgeon's rooms; first party: an anaesthetist); one Contract per Procedure; the Contract bills its holder or the payer on the Booking; No contract (RVG) offered first. Artifacts AR-28, AR-29. | G #8 #22; P #3 #6 #9 #10 #11; OQ-67 |
| [FT-04.1](../stories/FT-04.1.md) | Contract catalogue | Changed | Confirmed | The office keeps every contract holder and every Contract (a dated set of terms) with its lines; screens needed from the first release; list filters by active/all and holder. Component + Master Data. | G #24 #47; P #18 #22 #23 |
| [US-04.1.1](../stories/US-04.1.1.md) | Third-party and first-party Contracts | Changed | Verify → Confirmed (board, Donald, 09:05) | Was "Contract categories". Six categories replaced by third-party Contracts, the anaesthetist's own first-party Contracts and No contract (RVG); some set a fixed rate or fixed discount; no formal categories: one list grouped by holder, No contract (RVG) first; most insurer and hospital Contracts are plain RVG Contracts billed to their holder; prepaid amount from the first-party Contract (OQ-25, OQ-04). | D #4 #6 #9 #11; G #23 #50 #53; P #9 #13; OQ-25 |
| [US-04.1.2](../stories/US-04.1.2.md) | Create, edit, retire Contracts | Changed | Confirmed | ACs: filter by active/all and by holder; a start date and optional end date (and review date); a price review creates a new dated version (US-04.2.10). | G #24 #40; P #18 #23 |
| [US-04.1.3](../stories/US-04.1.3.md) | Contract audit and versioning | Changed (board, Donald, 09:09) | Proposed → Confirmed | Status only; Greg read it without change. | G #4 |
| [US-04.1.4](../stories/US-04.1.4.md) | AA identifier for every Contract | Changed | Verify → Confirmed (board, Donald, 09:09) | Notes: read without change; Greg asked for a composite search across AA code, holder codes and names; the draft design has no AA code, so it stays a requirement (OQ-66). | G #4; P #23; OQ-66 |
| [US-04.1.5](../stories/US-04.1.5.md) | Contract holders | Added (FT-04.1) | Verify | A record per holder (insurer, hospital, surgeon or rooms; or an anaesthetist, first party); whether it pays AA itself (then its billable party is billed, required) or only sets the price (payer on the Booking billed); a first-party holder's Contracts offered only on that anaesthetist's Bookings. Technical: draft CONTRACT_HOLDER (AR-29, AR-30). | G #22 #27 #29; P #11 #22 #34 #37 |
| [FT-04.2](../stories/FT-04.2.md) | Contract definition | Changed | Proposed → Verify | A Contract is a dated set of terms held by one holder; lines set terms per procedure (no group prices): fixed price, unit rate, discount, or base/modifier units; everything else shows through from the procedure and RVG group. Technical: draft v4 and ERD as the reference shape, may change; Greg to review and update his model. | D #7; G #12 #21 #30 #49; P #4 #19 #22 #23 #24 #39 #40 #41 |
| [US-04.2.1](../stories/US-04.2.1.md) | Contract holder, who is billed, and where it applies | Changed | Verify → Confirmed (board, Donald, 09:19) | Was "Holder, scope and organisational reach". Every Contract has one holder; the Contract bills its holder (when the holder pays AA itself) or the payer named on the Booking (surgeon fixed-fee, own list, No contract (RVG)); scope narrows the picker for every user (hospital, surgeon or rooms, anaesthetist for first-party, procedures with lines); no default Contracts. Technical: billable party as a reference record with a "holder is billed" setting; no invoice email on the Contract (draft AR-29). | G #9 #22 #26 #27 #29 #53; P #11 #22 #27 #34; OQ-67 |
| [US-04.2.2](../stories/US-04.2.2.md) | Contract pricing terms | Changed | Verify | Was "Contract pricing and adjustment rules". A line can set a fixed price (BTM for reference), a fixed rate, a fixed discount, or base/modifier units; else BTM x the anaesthetist's own unit value. Adjustment rule: anaesthetist may change price or discount (with reason) only on No contract (RVG) and own first-party Contracts; third-party price locked; office can override at review. Billable party, pre-applied modifiers, base-units-in-default-Contract removed. Holder references (member number, claim reference) moved in from retired US-04.2.7. Board (09:20): "custom unit rate or discount" split into two bullets. | D #6 #7 #11; G #10 #28 #33; P #9 #13 #14 #17 #24 #26 #38; OQ-62; OQ-89 |
| [US-04.2.4](../stories/US-04.2.4.md) | Contract lines | Changed | Proposed → Verify | Was "Fixed fee schedule lines". One line per procedure (combinations have a line per parent procedure); holder code and description for reference and search; only the terms it sets (fixed price ex GST, rate, discount, units); blank inherits, 0 is zero; agreed-rate Contracts have lines too; no group lines; time band kept but open (OQ-89). Board (09:28 to 09:30): add-on flag, quantity rule and optional RVG mapping removed, GST wording. Technical: draft CONTRACT_LINE. | D #7; G #5 #30 #31 #32; P #24 #29; OQ-18; OQ-89 |
| [US-04.2.7](../stories/US-04.2.7.md) | Required booking inputs | Retired | Proposed → Retired | Rolled up: a Contract declares no per-Booking inputs; payer and email always on the Booking (US-11.2.2); prepaid amount from the first-party Contract; under-18 is the existing warning; the holder reference moves to US-04.2.2. Links removed from US-03.6.1 and US-11.2.3. | G #10 #25 #29 #33; P #25 |
| [US-04.2.8](../stories/US-04.2.8.md) | Invoice presentation and delivery | Changed | Proposed → Confirmed (board, Donald, 09:41) | Note: agreed with Greg as set on the Contract; all prices held ex GST, GST at the foot of the invoice (US-05.2.7). | G #32 #38 |
| [US-04.2.10](../stories/US-04.2.10.md) | Contract prices effective from a date | Changed | Proposed → Confirmed | Was "Pricing effective from a date". Each Contract has a start and optional end date shared by its lines; a price review creates a new dated version linked to the old (lines copied then changed; old ends the day before); the price in force on the procedure date applies (OQ-48); old Bookings keep the old price; versions can be entered ahead. Line-level dates removed. | G #1 #39 #40; C #6; P #18 #23 #28 #36; OQ-48 |
| [US-04.2.11](../stories/US-04.2.11.md) | Combination Contracts | Changed | Verify → Confirmed (board, Donald, 10:31) | Notes: Greg accepted the model as written; picker shows singles and combinations; multi-parent still "a bit problematic". | G #2 #52; OQ-53 |
| [US-04.2.13](../stories/US-04.2.13.md) | Upload a Contract schedule | Added (created empty on the board, 10:09, under FT-04.1; written by this run) | Proposed (Future Work) | Upload a Contract's schedule in one go, for Contracts only; why: holders send their own formats, the office transposes and a second person checks; details to design (Greg: one pre-approved format, control totals, full overwrite; draft: delta and full with preview); whether needed for release one is OQ-100. | G #41 to #48; P #18 #36 |
| [US-04.2.14](../stories/US-04.2.14.md) | Anaesthetist's own fixed-price Contracts | Added (FT-04.2) | Confirmed | First-party price list (line and fixed price per procedure, for example Dr B. Smith, Face lift, $3,200); offered only on that anaesthetist's Bookings; bills the payer on the Booking; price changeable with a reason; source of the prepaid amount (US-06.2.2). Who maintains them in v1 is OQ-91. Links AR-02#first-party, AR-28. | D #4 #9; G #34 #36; C #3 #17 #18; P #9 #13 #15 #22 #35 |
| [FT-04.3](../stories/FT-04.3.md) | Contract selection on a Procedure | Changed | Verify → Confirmed | Every Procedure has exactly one Contract; find the procedure by body area/subgroup/procedure or RVG code, then the Contract; No contract (RVG) first, then Contracts with a line for the procedure, valid on the date, whose holder fits the Booking. "Narrowed by the List's hospital" and the RVG Default Contract sentence removed (board 10:33 to 10:34, then rewritten). Notes: the picker is a centrepiece to design and test with AA. | G #14 #16 #19 #20 #50 #52 #59 #60; C #26 #27; P #10 #12 #27 |
| [US-04.3.1](../stories/US-04.3.1.md) | Exactly one Contract per Procedure | Changed | Confirmed | Source added (Greg agreed); draft booking procedure has one contract (AR-29). | G #51; P #25 |
| [US-04.3.2](../stories/US-04.3.2.md) | Filtered Contract list | Changed | Verify → Confirmed (board, Donald, 10:39) | No contract (RVG) first, then Contracts with a line for the procedure, valid on the date, holder fits (hospital, surgeon or rooms, own anaesthetist for first-party); one list with holder headings; group bullets and "surgeon not decided" removed; composite search added; staff may start from the holder; "insurer is not a filter" sentence removed (board 10:36 to 10:37, then rewritten), insurance indication to OQ-93. Technical: draft offers the default by rule (AR-29). | G #4 #6 #16 #27 #52; C #27; P #12 #27 #34; OQ-55; OQ-66 |
| [US-04.3.3](../stories/US-04.3.3.md) | No contract (RVG) always offered first | Changed | Confirmed (board moved it to Verify at 10:41; this run back to Confirmed) | Was "Default hospital Contract derived from location". Every procedure can be priced on No contract (RVG): BTM x the anaesthetist's own rate, first in the list, bills the payer on the Booking; stored as a Contract (one, no holder, no lines); no hospital, insurer or procedure defaults; nothing derived from the location. Who it bills still for Greg (OQ-78). Components now Master Data, Billing/Invoice Engine. | G #7 #54 #59 #60; P #2 #10 #11 #37; OQ-78 |
| [US-04.3.4](../stories/US-04.3.4.md) | Admin sets Contracts at booking setup | Changed | Confirmed | Setting the Contract at setup is mandatory; a Booking without one stays on the admin list; every booked procedure assigned to a procedure. Note: AA asked that the procedure can be left blank at setup (OQ-99). | G #18 #55; C #28; OQ-26 |
| [US-04.3.5](../stories/US-04.3.5.md) | Contract locked at AUTHORISED | Changed | Confirmed | Technical: what the snapshot holds per the draft (procedure, Contract version, resolved values and layers, BTM, rate and discount, price and source, payer or billable party). | G #56; P #12 #33 |
| [US-04.3.6](../stories/US-04.3.6.md) | Hospital data sets the Contract | Changed | Proposed | Note: a hospital update that changes a Booking goes to an admin queue (Greg); future integration detail. | G #57; OQ-22 |
| [US-04.3.7](../stories/US-04.3.7.md) | Procedure not on the Contract's schedule | Changed | Proposed (moved to Future Work, board, Donald, 10:45) | Note: Greg wants an unmatched procedure to default to RVG and stop as an error; Donald: no selection smarts in the MVP; not agreed. Retired-item wording fixed. | G #58; OQ-22 |
| [FT-04.4](../stories/FT-04.4.md) | Default Contracts for hospitals, insurers and procedures | Retired (board, Donald, 10:56) | Proposed → Retired | No default Contracts for hospitals, insurers or procedures. No further change by this run. | G #59 |
| [US-04.4.1](../stories/US-04.4.1.md) | Mandatory default Contract | Retired (board, Donald, 10:56) | Proposed → Retired | As FT-04.4. | G #59 |
| [US-04.4.2](../stories/US-04.4.2.md) | Default RVG Contract for every procedure | Moved, then retired | Verify → Retired | Moved FT-04.4 → FT-04.1 on the board (10:56); retired by this run: no per-procedure default Contracts; the one default is No contract (RVG) (US-04.3.3); base units on the RVG group with an optional procedure figure (US-05.1.1, US-05.1.6); a named custom RVG variant becomes a procedure with its own base units. Links removed from US-05.1.1, US-05.1.6, US-04.2.2, US-04.3.2. | G #59 #60 #61; P #2 #8 #10 #21 #37 |

### EP-05 · RVG master data and fee calculation rules

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-05](../stories/EP-05.md) | RVG master data and fee calculation rules | Changed | Confirmed | First line: RVG groups (as published plus AA's own), the procedure list beneath them, the modifier list. | P #7 #8 |
| [FT-05.1](../stories/FT-05.1.md) | RVG groups, procedures and modifiers | Changed | Confirmed | Was "RVG code master". RVG 2021 groups under body sections plus AA's own, the procedure list, the modifier list; office maintains, every change recorded. Artifact AR-28. | P #7 #8 #18 #20 #21 |
| [US-05.1.1](../stories/US-05.1.1.md) | RVG groups | Changed | Confirmed | Was "RVG code master data". Groups as published (code, name, body section) with base units (> 0) and modifier units (default 0); AA may add groups; base units live here (settles OQ-62), a procedure may set its own and a Contract line may override both; a printed range is OQ-101; system code still OQ-88; draft uses a hidden key. Technical: draft RVG_GROUP. | D #3; G #31 #60; P #7 #20 #28 #29; OQ-62; OQ-88 |
| [US-05.1.3](../stories/US-05.1.3.md) | Body sections and AA groups | Changed | Confirmed → Verify | Was "Group codes". Groups sit under body sections (first picker level); AA can add groups; an anaesthetist can mark a whole group prepaid. Verify: whether cosmetic/dental groupings remain tags is not said. | P #7 #8 #15 #20 |
| [US-05.1.4](../stories/US-05.1.4.md) | Modifiers already included in base units | Changed | Confirmed | Was "Default modifiers". Where the RVG says base units include a modifier, it shows selected, 0 units, locked: P1 on the six Neurosurgery codes (H7A to H9b) and fourteen Spine codes (per the included-modifiers CSV); no other pre-fill; reverses the 2 October untickable default and "never included in the base"; supine 'a' variants are OQ-94; no modifiers column on the procedure. Links AR-16, AR-34. | D #3 #8; P #16 #44 #45 |
| [US-05.1.5](../stories/US-05.1.5.md) | Modifier code master | Changed (status set by a fix-up) | Confirmed → Verify | The RVG modifier table (30 codes, pp.12 to 13) plus AA's own (Vanessa's list); non-numeric values; codes repeat across tables (not a key); only age applies automatically; "the RVG modifier table", not page-12 body-area guidance; references the modifiers file (spot-check against the PDF). Links AR-28, AR-34. | D #3 #8; P #5 #16 #42 #43 #45 |
| [US-05.1.6](../stories/US-05.1.6.md) | Procedure master mapped to RVG codes | Changed | Confirmed | Curated procedures worded for the invoice, each in exactly one RVG group (always an RVG code, no nesting), using the group's base units unless AA sets its own ("Face-lift complex" at 10); AA decides granularity; found by body area/subgroup/procedure or RVG code; working list about 400 rows from about 2,000 Solutions Plus entries. Default RVG Contracts and default modifiers removed. Technical: draft PROCEDURE. | G #13 #14 #15 #16 #18 #31 #61; C #26 #27 #29 #31; P #8 #21; OQ-62; OQ-88 |
| [FT-05.2](../stories/FT-05.2.md) | Unit and fee calculation | Changed | Confirmed | Price order: office override; else anaesthetist's typed price (adjustable Contracts); else the Contract's fixed price; else BTM x the Contract's fixed rate or the anaesthetist's own, less any discount; 0 gives a no-charge invoice. Technical: draft resolver, validation, precedence (AR-29). | D #6 #11; P #26 #28 #29 #31 #32 |
| [US-05.2.1](../stories/US-05.2.1.md) | Per-unit pricing rate | Changed | Confirmed | A fixed-rate Contract's rate replaces the anaesthetist's own; a fixed discount applies to the anaesthetist's calculated price; OQ-89 note replaced. | D #6 #11; P #38; OQ-89 |
| [US-05.2.5](../stories/US-05.2.5.md) | Fixed fee schedule pricing | Changed | Confirmed | On a fixed price nothing further is calculated; no automatic invoice or credit either way; ad hoc invoice or credit by hand (US-08.6.3, US-08.6.5); add-ons and quantity rules dropped, time band open (OQ-89). | D #10; G #5; P #13 #45; OQ-61; OQ-89 |
| [US-05.2.6](../stories/US-05.2.6.md) | Fixed rate Contracts | Changed | Confirmed | Was "Contract defined rate". BTM x the Contract's rate instead of the anaesthetist's, for the whole procedure; anaesthetist cannot change a third-party rate; example AC. | D #6 #11; G #23 #28; P #24 #38; OQ-89 |
| [US-05.2.7](../stories/US-05.2.7.md) | GST | Changed | Proposed → Confirmed | Every price held ex GST; GST worked out at the foot of the invoice; only the exclusive figure held. | G #32; OQ-29 |
| [FT-05.3](../stories/FT-05.3.md) | Multi-procedure rule (supersedes RFP split-billing rule) | Changed | Verify | "Ben needs to validate" replaced: modifier split agreed on 7 October (OQ-15); whether the default applies at all is OQ-90. | C #1; P #12 #45; OQ-15; OQ-90 |
| [US-05.3.1](../stories/US-05.3.1.md) | Multi-procedure BTM rule | Changed (status set by a fix-up) | Open → Verify | OQ-15 answered (agreed 7 October); OQ-90 still asks whether the rule applies. | C #1; OQ-15; OQ-90 |
| [US-05.4.1](../stories/US-05.4.1.md) | Apply anaesthetist adjustment | Changed | Confirmed | Adjustment only on No contract (RVG) and first-party Contracts, never third-party nor on a fixed discount; 100% or $0 gives a no-charge invoice. | D #11; P #13 #26 #32; OQ-89 |
| [US-05.4.2](../stories/US-05.4.2.md) | Office price override | Changed | Confirmed | Note: the office override is the only way to change a third-party price without changing the Contract. | P #14 #26 |
| [US-05.4.3](../stories/US-05.4.3.md) | Fixed discount Contracts | Added (FT-05.4) | Confirmed | A Contract's fixed discount (for example 10%) applied as a pre-applied, locked price override on BTM x the anaesthetist's own rate; office can still override; stacking open (OQ-89); draft keeps it dormant, now needs logic and screens. | D #6 #11; G #28; P #26 #32 #38; OQ-89 |

### EP-06 · Prepayment

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [EP-06](../stories/EP-06.md) | Prepayment | Changed | Verify | Anaesthetist chooses procedures or whole RVG groups to prepay; the amount is the fixed price on their first-party Contract, in full (no deposit); invoiced at setup, held in trust, refunded in full on cancellation; by default it is the final price, BTM for reference, nothing calculated or raised automatically; ad hoc invoice or credit by hand; honour system on a move. Components + Anaesthetist App, Admin App. | D #4 #9 #10; C #3 #8; P #1 #15; OQ-04; OQ-61; OQ-76 |
| [FT-06.1](../stories/FT-06.1.md) | Prepaid procedure settings on the anaesthetist profile | Changed | Confirmed | "RVG codes or groups" to "procedures or whole RVG groups"; trigger stays on the profile; Greg's pre-payable flag on the Contract not adopted. | P #15; G #35; OQ-25 |
| [US-06.1.1](../stories/US-06.1.1.md) | Tick procedures or groups | Changed | Confirmed | Was "Tick codes or groups". Mark procedures one by one or a whole RVG group. | P #15; OQ-25 |
| [FT-06.2](../stories/FT-06.2.md) | Prepayment trigger and amount | Changed | Confirmed | Prepayment when a Procedure matches the prepaid setting and the payer is a person; amount from the first-party Contract. | D #4 #9; P #15 #35 |
| [US-06.2.1](../stories/US-06.2.1.md) | Detect prepayment requirement | Changed | Confirmed | Procedure or RVG group in the prepaid set; payer is a person, never an organisation; amount from the first-party Contract; no price in that Contract is OQ-92. | G #34 #35; P #15 #35; OQ-25; OQ-04 |
| [US-06.2.2](../stories/US-06.2.2.md) | Set the prepaid amount | Changed | Verify → Confirmed | The amount is the fixed price on the anaesthetist's first-party Contract line, following the Contract the office selects; full amount, no deposit; estimate with two contingency units removed. Maintainer is OQ-91, no price is OQ-92. Components now Admin App, Billing/Invoice Engine. | D #4 #9; C #3 #8 #17 #18 #35; G #34; P #1 #15 #35; OQ-04; OQ-38 |
| [US-06.2.3](../stories/US-06.2.3.md) | Prepayment is an estimate | Retired | Confirmed → Retired | The prepaid amount is the anaesthetist's own fixed price, the final price by default. Links removed from US-06.3.6, US-06.4.2. | D #4 #9 #10; C #3; P #15; OQ-04; OQ-38 |
| [US-06.2.4](../stories/US-06.2.4.md) | Calculate the prepayment estimate | Retired | Proposed → Retired | No estimate, no contingency units (OQ-38 answered, OQ-04 replaced). Links removed from US-06.3.5, US-06.5.3. | D #4; C #3 #14; OQ-38; OQ-04 |
| [US-06.2.5](../stories/US-06.2.5.md) | Estimated duration from the surgeon's rooms | Retired | Proposed → Retired | Existed only to feed the estimate. Link removed from US-13.6.1. | D #4; C #3; OQ-38 |
| [US-06.3.1](../stories/US-06.3.1.md) | Raise the prepayment invoice | Changed | Verify | Amount is the first-party Contract's fixed price; payer is the person on the Booking. Technical: draft links the prepayment from the booking procedure (AR-29). | D #4 #9; P #15 #35 |
| [US-06.3.5](../stories/US-06.3.5.md) | Re-check when the Booking changes | Changed | Verify | Moves removed: no logic detects a move or re-triggers any calculation (honour system); re-check kept for a change of Procedures, Contract or payer before the procedure. | D #10; OQ-70; OQ-40 |
| [US-06.3.6](../stories/US-06.3.6.md) | Prepayment letter templates | Changed | Proposed | Templates state the prepaid amount as the price payable (not an estimate); may say a further invoice or credit is possible; link to retired US-06.2.3 removed. | D #10; P #15 |
| [FT-06.4](../stories/FT-06.4.md) | Settlement after the procedure | Changed | Verify → Confirmed | The prepaid amount is the price; nothing calculated or raised automatically, either way, no threshold, same for every fixed-price Contract; ad hoc by hand. The guide's raise-the-price proposal not adopted. | D #10; C #8; P #15 #35; OQ-61; OQ-76; OQ-03 |
| [US-06.4.1](../stories/US-06.4.1.md) | No automatic invoice or credit after a prepaid procedure | Changed | Verify → Confirmed | Was "Invoice the remaining balance" (an earlier run retitled it). Priced at the prepaid amount; BTM for reference; no invoice or credit either way; by hand through the additional invoice; folds in US-06.4.2's credit criteria. Price change is OQ-96, part credit OQ-97. | D #10; C #8; P #15 #35; OQ-61; OQ-03; OQ-76 |
| [US-06.4.2](../stories/US-06.4.2.md) | No automatic credit when prepaid exceeds final | Retired | Verify → Retired | Merged into US-06.4.1. Link removed from US-08.6.5. | D #10; OQ-61; OQ-03 |
| [FT-06.5](../stories/FT-06.5.md) | Trust account and cancellation refunds | Changed | Verify | A moved Booking keeps its prepayment on an honour system; no logic detects the move; payable update on a move is OQ-80. | D #10; OQ-70; OQ-40; OQ-80 |
| [US-06.5.3](../stories/US-06.5.3.md) | Prepayment for a replacement anaesthetist | Changed | Verify | "Estimated at their own unit value" becomes the new anaesthetist's own fixed price from their first-party Contract. | D #4 #9 |
| [US-06.5.4](../stories/US-06.5.4.md) | Prepaid Booking moved to another anaesthetist | Changed | Verify | Honour system; no logic detects the move; "the move still re-checks the prepayment" removed; payable update kept, OQ-80. | D #10; OQ-70; OQ-80 |

### EP-07 · List approval workflow

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-07.2.2](../stories/US-07.2.2.md) | Office review of Contracts and references | Changed | Confirmed | The Booking may show an insurance status (for example SXAP) guiding the choice (OQ-93); warning (not block) when an insurer is said to pay but no insurer Contract is chosen; office reviews the payer on the Booking. Retired-item wording fixed. | G #6; P #11 #34; OQ-55 |
| [FT-07.4](../stories/FT-07.4.md) | List visibility in the anaesthetist app | Changed | Proposed | A List leaves the main view once finalised and sent to invoicing; invoices show in outstanding balances; still findable by archive or search. | C #2 #16 #41; OQ-31 |
| [US-07.4.1](../stories/US-07.4.1.md) | List leaves the main view once invoiced | Changed | Open → Verify | Was "List disappears on invoice generation". Per OQ-31: leaves on finalise and send to invoicing; findable via US-03.1.6. | C #2 #16 #41; OQ-31 |
| [US-07.4.2](../stories/US-07.4.2.md) | Anaesthetist's main view | Added (FT-07.4) | Verify | Main screen shows Lists from today plus earlier un-invoiced Lists; invoiced Lists via archive or search. | C #2 #16; OQ-31 |

### EP-08 · Billing/Invoice Engine and internal ledger

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-08.2.1](../stories/US-08.2.1.md) | Group by billable party | Changed (fix-up) | Verify | OQ-78 note: now answered, No contract (RVG) is the one default and bills the payer on the Booking. | P #2 |
| [US-08.2.2](../stories/US-08.2.2.md) | Net prepayments | Changed | Confirmed | "(the full estimate)" becomes the prepaid amount, the anaesthetist's own fixed price; nothing left to bill for a prepaid Procedure; further invoice or credit by hand. | D #4 #10; P #15 |
| [US-08.6.3](../stories/US-08.6.3.md) | Create an additional invoice on a Procedure | Changed | Verify | Available to the anaesthetist too (component + Anaesthetist App), same review step; after any prepaid or fixed-price procedure no balance invoice is raised automatically. | D #10; OQ-61; OQ-76 |
| [US-08.6.4](../stories/US-08.6.4.md) | Split a combined Procedure into additional invoices | Changed | Verify | Rebuilt lines must equal the credited combined invoice (Vanessa), amounts split freely; the credit reverses the payable; split before invoicing still OQ-77 part 3. | G #3 #11; C #9 #37; OQ-77 |
| [US-08.6.5](../stories/US-08.6.5.md) | Credit note option on additional invoices | Changed | Verify | Available to the anaesthetist too (component + Anaesthetist App); part credit is OQ-97; link to retired US-06.4.2 replaced by US-06.4.1; the credit reverses the linked payable (OQ-77 part 2). | D #10; C #9; OQ-77; OQ-61 |

### EP-10 · Payments, disbursement and AA fees

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-10.2.1](../stories/US-10.2.1.md) | Payable released to match the amount received | Changed | Confirmed | "Payment day and cycle not settled" replaced by the weekly cycle as the proposed solution (US-10.2.7), still for the accountant (OQ-47). | C #5 #15; OQ-47 |
| [US-10.2.6](../stories/US-10.2.6.md) | Approve the period's BCTIs for payment | Changed (fix-up) | Verify | Points to the weekly payment cycle (US-10.2.7, Proposed); how approval sits with release is still OQ-47. | C #5 #15 |
| [US-10.2.7](../stories/US-10.2.7.md) | Weekly payment cycle | Added (FT-10.2) | Proposed | ISO-week cycle: Friday close, snapshot and bank reconciliation; Monday for the office; payment schedule to the accountant for Tuesday; anomalies roll forward; 20th-of-the-month fit open (OQ-47). | C #5 #15; OQ-47 |

### EP-11 · Patients and billable parties

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-11.1.1](../stories/US-11.1.1.md) | Patient record keyed on NHI | Changed | Proposed | Note: Vanessa wants the NHI mandatory and the identifier throughout, leaning against a system patient ID; OQ-49. | C #7 #34; OQ-49 |
| [US-11.1.4](../stories/US-11.1.4.md) | Patient without NHI | Changed | Open | Note: "make NHI mandatory" (temporary NHI where none); refuse or hold pending still OQ-49. | C #7 #34; OQ-49 |
| [FT-11.2](../stories/FT-11.2.md) | Who is billed: holder or the payer on the Booking | Changed | Verify → Confirmed | Was "Billable party and invoice contact". The Contract decides: its holder's billable party when the holder pays AA, otherwise the payer on the Booking (prefilled from the patient, changeable to a guardian). Component + Billing/Invoice Engine. | G #29; P #11 #22 #34; OQ-67; OQ-54 |
| [US-11.2.1](../stories/US-11.2.1.md) | Patient billed when the Contract does not bill its holder | Changed | Verify → Confirmed | Was "Patient-direct Contract makes the patient the billable party". Under No contract (RVG), an own Contract or a surgeon's fixed price, the payer on the Booking is billed; includes insured patients who claim back. Component + Billing/Invoice Engine. | P #11 #34; OQ-67 |
| [US-11.2.2](../stories/US-11.2.2.md) | Payer on the Booking, editable to a guardian | Changed | Verify → Confirmed | Was "Guardian or other payer set through the Contract". Every Booking names a payer, prefilled from the patient, editable by office or anaesthetist; a hospital or insurer taking the invoice is a Contract whose holder pays AA. Technical: draft payer on the booking procedure; Greg's billable-party table. Component + Scheduling Engine. | G #29; P #11 #25 #34; OQ-54; OQ-67 |
| [US-11.2.3](../stories/US-11.2.3.md) | Payer email required when the payer is billed | Changed | Confirmed | Was "Invoice email required for patient-direct". Payer email required where the payer is billed; link to retired US-04.2.7 dropped (its blocking rule kept as the working rule, retired-item wording fixed). | G #29; P #11 #25 |
| [US-11.2.4](../stories/US-11.2.4.md) | Warn when a child is the payer on the Booking | Changed | Confirmed | Was "Warn when a child is the billable party". "Billable party" becomes "payer on the Booking"; the warning prompts a check of the guardian's details on the Booking; note on Greg's "we'll let it go". | G #25; P #11; OQ-54 |
| [US-11.4.1](../stories/US-11.4.1.md) | Insurer master data | Changed | Confirmed | Notes: most insurer Contracts are plain RVG Contracts billed to the insurer; offering them for every procedure without a line each is OQ-98; the insurance indication guides choice, storage OQ-93. Retired-item wording fixed. | G #53; P #11 #34; OQ-55 |

### EP-12 · Anaesthetist profile and reporting

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-12.1.3](../stories/US-12.1.3.md) | Prepaid procedures | Changed | Confirmed | "Prepaid RVG codes and groups" becomes "prepaid procedures and RVG groups"; prices from the anaesthetist's own fixed-price Contract. | D #4 #9; P #15 |

### EP-13 · Admin oversight and master data

| ID | Title | Action | Status | What changed | Source |
| --- | --- | --- | --- | --- | --- |
| [US-13.4.3](../stories/US-13.4.3.md) | Reference data loaded from controlled spreadsheets | Changed | Proposed | "RVG groups and procedures, with base units" (no default Contracts); one-off developer-run seed, then edited on screen; separate from the Contract schedule upload (US-04.2.13); repeatable for test systems; holders will not fill AA's template. | G #42 #62; P #18 #36 |
| [FT-13.6](../stories/FT-13.6.md) | Surgeons and surgeons' rooms | Changed | Confirmed | "Blacklist" becomes private preferences: who someone will not work with and who they prefer. | C #4 #20; OQ-43 |
| [US-13.6.1](../stories/US-13.6.1.md) | Surgeons' rooms master record | Changed | Confirmed | Clause "who sends estimated durations for prepayment" and link to retired US-06.2.5 removed. | C #3; OQ-38 |
| [US-13.6.2](../stories/US-13.6.2.md) | Surgeon profile | Changed (fix-up) | Confirmed | "Blacklist" bullet becomes private not-preferred and preferred pairings, either direction, admin only. | C #4 #20; OQ-43 |
| [US-13.6.3](../stories/US-13.6.3.md) | Not-preferred pairings of surgeons and anaesthetists | Changed | Proposed → Confirmed | Was "Blacklist of anaesthetist and surgeon pairings". Admin keep a private two-way record on both profiles; never shown to anaesthetists; soft warning on assign or move, never a block; no warning when an anaesthetist hands on their own List; name to change (OQ-102). | C #4 #19 #20 #36; OQ-43 |
| [US-13.6.4](../stories/US-13.6.4.md) | Preferred pairings | Added (FT-13.6) | Verify | Admin also record positive preferences, shown alongside not-preferred ones and able to order suggestions; admin only; name open ("whitelist" for now). | C #20 #21 |
| [US-13.8.1](../stories/US-13.8.1.md) | See the team's notifications | Changed | Confirmed | Note: Vanessa agreed the shared, not per-user, pool; expiry and contents still OQ-79. | C #10; OQ-79 |

**Follow-up fixes after the main pass.** US-05.3.1 and US-05.1.5 set to Verify; FT-03.5, EP-03,
US-03.1.8, US-04.3.7, US-10.2.6, US-11.2.3, US-08.2.1, US-11.4.1, US-07.2.2, US-04.2.4 and US-04.4.2
had wording about retired items corrected (all reflected in the rows above).

**Link pass.** 67 text links and related links added across 47 files by link-requirements
(`requirements-board/.links/links-report.md`), mostly to the new stories (US-04.2.14, US-05.4.3,
US-11.2.2, US-05.1.1) and to US-08.6.3 and US-08.6.5.

## 4. domain-model.md changes

[domain-model.md](../domain-model.md), this run's changes only (compared with the copy taken before
the run):

- **Header:** updated 2026-10-07 from the Greg and client meetings, the directors' answers and the
  pricing guide (AR-28, taken as true); the Contract structure follows the draft technical design v4
  and ERD (AR-29, AR-30), a draft that may change before the catch-up build.
- **"What changed since the RFP" rows rewritten:** anaesthetist adjustment only on adjustable
  Contracts; prepayment triggered by the prepaid setting with the amount from the first-party
  Contract; payer named on the Booking; honour system on a moved prepaid Booking; the Contract decides
  who is billed through its holder; insurance indication on the Booking; No contract (RVG) as the one
  default; Contracts as dated versions; base units on the RVG group; payer warning for a child. New
  rows: List leaves the main view once invoiced; prices held GST exclusive; weekly payment cycle
  (proposed); one-off reference data seed.
- **ERD relationships per the draft design:** MASTER_PROCEDURE, per-procedure default RVG Contracts,
  FEE_SCHEDULE_LINE, RVG_CODE tagging and the Contract "held by" links replaced by BODY_SECTION >
  RVG_GROUP > PROCEDURE; CONTRACT_HOLDER holds CONTRACTs (none for No contract (RVG)), bills a
  BILLABLE_PARTY when it pays AA, links an ANAESTHETIST when first party; CONTRACT replaces a previous
  dated version and contains CONTRACT_LINEs (one per procedure); BOOKING names a PAYER and holds
  BOOKING_PROCEDUREs, each performed as one PROCEDURE and priced by exactly one CONTRACT;
  BOOKING_MODIFIER, MODIFIER and RVG_GROUP-includes-MODIFIER added as our addition (not in AR-30);
  PREPAID_SETTING now procedures / RVG groups; blacklist becomes "private preferences (not wanted,
  preferred)"; PRIORITY_TIER added (admin only, Bronze default).
- **Booking procedure and terms:** the catalogue's Procedure is the design's *booking procedure*;
  "procedure" alone means a procedure-list entry; *time entry* is filling in the Booking; naming
  still to settle. Hierarchy now Day → Slot → List → Booking → Procedure → exactly one Contract.
- **Booking:** names a payer (prefilled, editable to a guardian); may carry an insurance indication
  (storage OQ-93; warning at review); keeps the source wording; prepayment state includes the prepaid
  amount shown to the anaesthetist. **Procedure:** starting units from the resolver; every booked
  procedure mapped (blank at setup is OQ-99); modifiers: only age (OQ-95) and included modifiers
  (P1 on Neurosurgery and Spine, OQ-94) locked, all else optional with an explanation; no ASA or
  procedure pre-fill.
- **Contract (draft structure):** plain-words definition, AA in the centre and contract holders;
  contract holder table (third or first party, bills holder, billable party); Contract fields (AA
  code, holder, dated version, the one default No contract (RVG) billing the payer on the Booking,
  holders not categories, context, pricing terms, adjustable, required inputs retired, prepayment,
  GST exclusive); contract line table (procedure, holder code, fixed price, rate, discount, units,
  time band open; RVG mapping, add-on flag, quantity rule, price tier and line dates removed);
  **fixed-rate and fixed-discount Contracts** added beside fixed price and RVG pricing.
- **Selection:** procedure first (two routes), Contract mandatory at setup, No contract (RVG) first,
  then Contracts valid on the date with a line and a fitting holder; anaesthetists see only their own
  first-party Contracts; procedure or Contract changeable until submit.
- **RVG groups, procedure list and modifier master:** base units on the group (range OQ-101),
  procedure override, line override; curated procedure list (about 400 rows); one-off seed then
  hand maintenance; modifier master is the flat RVG table (pp.12 to 13) plus AA's own, with the
  included-modifier CSV; no body-area typical/max values.
- **Patient, payer and billable party:** billable party records; payer on every Booking; child as
  payer a mild warning; guardian held as the Booking's payer.
- **Surgeon, preferences and priority tiers:** **private two-way preferences** (not wanted and
  preferred, admin only, soft warning on assign or move, nothing on an anaesthetist's own hand-on);
  **priority tiers** (four, Bronze default, shuffled within a tier).
- **Billing:** resolver and price precedence per the draft with fixed rate and fixed discount added
  (stacking open, OQ-89); engine rejections; pricing snapshot contents; no automatic invoice or credit
  after a prepaid or fixed-price procedure; combined-invoice split rules (OQ-77 parts 1, 2);
  weekly payment cycle (proposed); Contract schedule upload (OQ-100) separate from the seed.
- **Prepayment:** the amount is the first-party Contract's fixed price, full, not estimated; shown
  to the anaesthetist; open OQ-91, OQ-92, OQ-96, OQ-97; honour system on a move; payable update
  OQ-80.
- Lists: Draft Lists never offered to anaesthetists to browse or claim (OQ-86); a List leaves the
  main view once finalised and sent to invoicing (OQ-31).

## 5. Artifacts

Registered (sidecars in `catalogue/artifacts/`):

| Artifact | Name | Kind | Status | File |
| --- | --- | --- | --- | --- |
| [AR-26](../artifacts/AR-26.md) | Contracts and procedures with Greg, 7 October | transcript | Current | Greg meeting reconciled transcript |
| [AR-27](../artifacts/AR-27.md) | Open questions with Ben, Vanessa and Greg, 7 October | transcript | Current | AA client meeting reconciled transcript |
| [AR-28](../artifacts/AR-28.md) | How procedures are priced and who pays | document | Current | The guide (PDF, 5 October) |
| [AR-29](../artifacts/AR-29.md) | Contract pricing model, technical design v4 | document | Draft | The technical design (PDF) |
| [AR-30](../artifacts/AR-30.md) | Contract pricing model ERD, v4 | diagram | Draft | `artifacts/AR-30.svg` |
| [AR-31](../artifacts/AR-31.md) | Notes on contracts and procedures with Greg, 7 October | note | Current | the Greg note |
| [AR-32](../artifacts/AR-32.md) | Notes on the AA client meeting, 7 October | note | Current | the client meeting note |
| [AR-33](../artifacts/AR-33.md) | Notes on the pricing model documents, 7 October | note | Current | the pricing model note |
| [AR-34](../artifacts/AR-34.md) | NZSA RVG 2021 modifiers | document | Current | `Data files/NZSA RVG 2021 modifiers.md` |

Regions: AR-28 has 11 (rvg-groups-and-procedures, contracts-two-kinds, no-contract-rvg,
who-gets-the-invoice, booking-to-invoice, what-the-anaesthetist-can-change, prepaid-already-agreed,
prepaid-proposed, modifiers, worked-examples, keeping-prices-up-to-date); AR-29 has 19 (data-model,
contract-holder-fields, contract-fields, contract-line-fields, booking-procedure-fields,
contract-behaviour, contract-selection, resolver-layers, null-handling, price-validation,
price-precedence, pricing-snapshot, billable-party, prepayment, contract-versions, data-loading,
integrity-rules, dormant-capabilities, open-points); AR-30 has 6 (rvg-group, procedure,
contract-line, contract, contract-holder, booking-procedure).

Items linked: 34 items link to them. AR-28: EP-04, EP-06, FT-04.3, FT-05.1, US-03.3.4, US-03.5.1,
US-04.1.1, US-04.2.1, US-04.2.14, US-04.2.2, US-04.3.3, US-05.1.5, US-06.2.2, US-06.4.1. AR-29: EP-04,
EP-06, FT-04.2, FT-04.3, FT-05.2, FT-11.2, US-03.3.1, US-03.3.4, US-03.4.1, US-03.5.1, US-04.1.5,
US-04.2.1, US-04.2.2, US-04.2.4, US-04.2.10, US-04.2.13, US-04.3.1, US-04.3.2, US-04.3.5, US-05.1.1,
US-05.1.3, US-05.1.6, US-05.4.3, US-06.2.2, US-06.3.1, US-06.4.1, US-11.2.2, US-13.4.3. AR-30: FT-04.2,
FT-11.2, US-04.1.5, US-04.2.4, US-04.3.1, US-05.1.1, US-05.1.6. AR-34: US-03.3.4, US-05.1.4, US-05.1.5.
domain-model.md links AR-29 and AR-30. AR-26, AR-27 and AR-31 to AR-33 are linked from the notes only.

## 6. New questions

| Question | Title | Owner | Affects |
| --- | --- | --- | --- |
| [OQ-91](../questions/OQ-91.md) | Who creates and maintains anaesthetists' own fixed-price Contracts in version one | Donald to ask Ben | US-06.2.2, US-06.1.2, US-04.1.2, US-04.2.1, US-12.1.3 |
| [OQ-92](../questions/OQ-92.md) | Prepaid procedure with no price in the anaesthetist's own Contract | Donald to ask Ben | US-06.2.1, US-06.2.2, US-06.3.1 |
| [OQ-93](../questions/OQ-93.md) | Insurance indication on the Booking: whether and where to store it | Donald and Greg | US-04.3.2, US-07.2.2, US-11.4.1, FT-11.2, US-04.2.1 |
| [OQ-94](../questions/OQ-94.md) | Do the supine ('a') Neurosurgery and Spine codes also include P1 | Donald to ask Vanessa | US-05.1.4, US-03.3.4 |
| [OQ-95](../questions/OQ-95.md) | Age modifier bands and stacking, and confirming no ASA pre-fill | Donald to ask Vanessa | US-05.1.5, US-03.3.4, US-03.3.8 |
| [OQ-96](../questions/OQ-96.md) | Can the price be changed on a prepaid procedure | Donald to ask Ben | US-03.5.1, US-06.4.1, US-08.2.2 |
| [OQ-97](../questions/OQ-97.md) | Credit note for part of a prepayment | Donald to ask Vanessa | US-08.6.5, US-08.6.2, US-06.4.1 |
| [OQ-98](../questions/OQ-98.md) | Plain RVG Contracts of a holder, offered for every procedure | Donald and Greg | US-04.3.2, US-04.2.4, US-11.4.1, US-04.1.1 |
| [OQ-99](../questions/OQ-99.md) | Booking set up without a matched procedure | Donald to ask Vanessa | US-04.3.4, US-03.3.1, US-03.6.1, US-04.3.2 |
| [OQ-100](../questions/OQ-100.md) | Is a Contract schedule upload needed for the first release | Donald and Greg | US-04.2.13, US-13.4.3 |
| [OQ-101](../questions/OQ-101.md) | How an RVG base unit range is held | Donald and Greg | US-05.1.1, US-03.3.1 |
| [OQ-102](../questions/OQ-102.md) | Names for preference lists and priority tiers | Donald to ask Vanessa | US-13.6.3, US-01.3.5, US-01.3.6, US-13.6.4 |

## 7. Points with no requirement change

- G #11: Donald's instruction to pick up the split scenario; carried by the US-08.6.4 change.
- G #12: Contract wording to wait for Greg's documents; the documents are now in and drive the EP-04 rewrites.
- G #21: Greg to review the technical document and update his database model; process only, recorded as the draft caveat in FT-04.2.
- G #37: Greg floated leaving modifiers (and assistant work) out of version one; garbled, not decided; noted in US-03.3.4.
- G #45: the heated exchange on schedule upload; its outcome (#48) is applied to US-04.2.13.
- G #49: Greg's concern that the model was not yet understood; answered by ingesting the documents.
- C #14: Donald's instruction to update OQ-38; done (OQ-38 answered, US-06.2.4 retired).
- C #30: AI-assisted matching floated for the future; no decision.
- C #32: "Booking" in place of "Card"; already in the catalogue and domain model.
- C #33: next meeting logistics. C #40: names and attribution notes about the transcript.
- P #3, P #4: Donald's instructions on how far to rely on the guide and the draft; applied as the precedence (section 1) and the domain model header.
- P #5: the request for the modifiers file; the file exists (P #42 to #45) and is referenced from US-05.1.4 and US-05.1.5.
- P #6: the guide's purpose; reflected in the EP-04 rewrite. P #17: the worked examples, folded into US-04.2.2's notes. P #39: the design's open points, each now a change or a question.
- FT-04.4 and US-04.4.1: retired on the board during the Greg meeting; no further change.
- Questions OQ-13, OQ-29, OQ-47, OQ-49, OQ-77, OQ-78, OQ-79, OQ-80, OQ-88, OQ-89, OQ-90: updated (section 2) and applied to the items listed there; no further item change.

## 8. Left for Donald to decide, and flags

a. **US-04.4.2 retired.** The 6 October guide (one default, No contract (RVG); base units on the RVG
   group) supersedes Donald's 5 October typed decision of one default RVG Contract per procedure
   plus named RVG-style variants. Custom RVG-style pricing is still possible as a Contract whose
   line overrides base units, or as a procedure with its own base units.
b. **No page-12 body-area modifier table.** The guide (§7) refers to page-12 guidance on typical and
   maximum modifiers by body area; the NZSA RVG 2021 has no such table. Its modifier table is flat,
   one value per modifier, pp.12 to 13. Items now say "the RVG modifier table". The correction is
   needed in the plain-language guide *How procedures are priced and who pays* ([AR-28](../artifacts/AR-28.md)) §7.
c. ~~Whether the supine 'a' Neurosurgery and Spine codes also include P1 (OQ-94).~~ **Resolved
   2026-10-08**: all 20 codes include it (section 10).
d. Dropping ASA pre-fill is implied by the directors' answer, not stated; to confirm (OQ-95).
e. ~~Who maintains first-party Contracts in version one (OQ-91).~~ **Resolved 2026-10-08**: the
   office, from the price list each anaesthetist supplies (section 10).
f. Who No contract (RVG) bills: OQ-78 is answered from the guide (the payer on the Booking); Greg
   said he would come back on it. Reopen OQ-78 if he differs.
g. **Stale prototype screenshot captions** still describe the old behaviour: US-04.3.3 (default
   hospital contract), US-03.3.4 (ASA seeding), US-06.4.1 and US-08.2.2 (balance invoice), US-06.2.2
   and US-06.3.1 (estimated fee), US-04.2.2 (contract types 1 to 3), the US-05.x captions, US-07.4.1
   (List gone on invoice generation). They come from `requirements-board/capture/recipes`. Donald will
   recapture after the catch-up phases.

## 9. Earlier uncommitted runs in this working tree

No change log covers these two runs (none in `changes/` cites "2026-10-05" or "AA directors meeting
#1 #2"). Their changes sit in the same uncommitted diff; many of the items were rewritten again by
this run (noted). From the items' sources and `requirements-board/.history`.

**Typed decision 2026-10-05 · Donald (product owner)** (applied 5 October, 11:44 to 11:45 NZDT):

- [FT-04.4](../stories/FT-04.4.md): one default RVG Contract per procedure plus named RVG-style Contracts (feature since retired on the board, 7 October).
- [US-04.1.1](../stories/US-04.1.1.md): categories reworked into picker groups (RVG-style always offered, RVG Default Hospital with named hospitals, unique groups); pre-paid RVG default flagged as possibly out of date (since rewritten).
- [US-04.2.2](../stories/US-04.2.2.md): a Contract sits under a procedure and lists its settings (since rewritten).
- [US-04.2.5](../stories/US-04.2.5.md) Multi-procedure rule per Contract: Proposed → Retired; Contracts do not define how further procedures are priced.
- [US-04.2.11](../stories/US-04.2.11.md): a combination is a fixed-fee Contract under the procedure; Merivale face-lift example and AC.
- [US-04.2.12](../stories/US-04.2.12.md) Payment setting: full payment or split: Verify → Retired; splitting is a button on the Booking (US-08.2.3).
- [US-04.3.2](../stories/US-04.3.2.md): picker groups and filters by group (since rewritten).
- [US-04.4.2](../stories/US-04.4.2.md): exactly one default RVG Contract per procedure plus any named RVG-style variants (since retired by this run).
- [US-05.1.6](../stories/US-05.1.6.md): flat procedure master grouped by body section and subgroup; base units in the default RVG Contract (since rewritten).
- [US-05.3.4](../stories/US-05.3.4.md) Contract-specific second-procedure rules: Proposed → Retired.
- [US-08.2.3](../stories/US-08.2.3.md): splitting a fee is a user action on the Booking (button on the Procedure's Contract line), shares typed in $ or %; no Contract setting.
- [US-08.6.3](../stories/US-08.6.3.md): additional invoice is a button against a Procedure's Contract line, a user action, distinct from a split.
- [US-11.2.2](../stories/US-11.2.2.md): a hospital taking the invoice under the default RVG Contract is a Contract of its own (since rewritten).
- [US-11.4.1](../stories/US-11.4.1.md): technical note that cover split is not a Contract setting but a split on the Booking.
- New question [OQ-90](../questions/OQ-90.md): does the RVG default multi-procedure rule still apply (updated by this run).

**Notes 2026-10-06 · AA directors meeting #1 #2** (Ben's answer to OQ-61 and Donald's clarification;
applied 7 October, 11:33 to 11:34 NZDT):

- [FT-06.4](../stories/FT-06.4.md): nothing raised automatically in either direction, no threshold; adjustments by hand (since rewritten).
- [US-06.2.3](../stories/US-06.2.3.md): an estimate that proves high or low is not adjusted automatically (since retired by this run).
- [US-06.4.1](../stories/US-06.4.1.md): retitled "No automatic invoice for the balance after a prepaid procedure"; ACs for no invoice and no credit (since rewritten and retitled).
- [US-06.4.2](../stories/US-06.4.2.md): retitled "No automatic credit when prepaid exceeds final"; a credit note can be raised by hand (since retired by this run).
- [US-08.2.2](../stories/US-08.2.2.md): the difference is shown but not invoiced or credited automatically.
- [US-08.6.3](../stories/US-08.6.3.md): covers the post-prepayment balance by hand; noted the anaesthetist route was not covered (since added by this run).
- [US-08.6.5](../stories/US-08.6.5.md): AC for a credit note by hand after a prepayment.
- Questions: [OQ-61](../questions/OQ-61.md) answered; [OQ-03](../questions/OQ-03.md), [OQ-40](../questions/OQ-40.md) and [OQ-76](../questions/OQ-76.md) given "Update 2026-10-06" notes.

## 10. Follow-up decisions, 2026-10-08

Source for both: `Typed decision 2026-10-08 · Donald (product owner)`.

**Answered.**

| Question | Answer in one line |
| --- | --- |
| [OQ-91](../questions/OQ-91.md) | The office (admin team) always creates and maintains first-party Contracts; each anaesthetist decides their prices and supplies the price list. Anaesthetists do not create or edit Contracts in the app. US-04.2.14 added to affects. |
| [OQ-94](../questions/OQ-94.md) | P1 is included in the base units of every Neurosurgery code H7A to H9b ('a' and 'b' alike; H7, H8, H9 are headings) and every Spine code S1 to S10, per the RVG's P1 row (p12): a pill pre-selected at 0 units that cannot be unselected. The header's (+2) is P1's value. |

**Items and other files changed.**

| ID | What changed |
| --- | --- |
| [US-04.2.14](../stories/US-04.2.14.md) | Office creates and keeps the Contract from the anaesthetist's price list; anaesthetist cannot create or edit Contracts in the app (new AC); OQ-91 note replaced by the answer. |
| [US-04.1.2](../stories/US-04.1.2.md) | Admins create and edit first-party Contracts too, from the supplied price list; note now the answer. |
| [US-04.2.1](../stories/US-04.2.1.md) | Note: the office creates and maintains first-party Contracts. |
| [US-06.2.2](../stories/US-06.2.2.md) | Note: the office maintains the Contracts the prepaid amount comes from. |
| [US-06.1.2](../stories/US-06.1.2.md) | Proposed → Confirmed; prepaid amounts sit on the first-party Contract the office maintains. |
| [US-12.1.3](../stories/US-12.1.3.md) | "Still open (OQ-91)" replaced by the rule. |
| [OQ-04](../questions/OQ-04.md) | Update line: who maintains the amounts is answered by OQ-91. |
| [US-05.1.4](../stories/US-05.1.4.md) | 'a' and 'b' Neurosurgery codes both include P1, quoting the P1 row; AC for both variants; artifact AR-16#p12; OQ-94 note now the answer. |
| [US-03.3.4](../stories/US-03.3.4.md) | P1 named on every neurosurgery (H7A to H9b) and spine (S1 to S10) code as a locked 0-unit pill; OQ-94 note now the answer. Status stays Verify (ASA, OQ-95). |
| `domain-model.md` | Prepayment row, contract holder table and prepayment section: the office maintains first-party Contracts; Procedure modifiers and glossary: P1 on all Neuro and Spine codes. |
| [NZSA RVG 2021 modifiers.md](../artifacts/files/NZSA%20RVG%202021%20modifiers.md) | (+2) explained as P1's value, not the a/b gap; P1 included in all Neuro (H7A to H9b) and Spine (S1 to S10) base units per the P1 row; Spine value uncertainty settled. The CSV needed no change. |
