# Requirements update, 2026-10-28: Meetings with Ben and Vanessa (27 October) and Greg (28 October)

What the 2026-10-28 update did to the catalogue. It records two meetings:

- **27 October, with Ben and Vanessa.** A short pass through their questions: a prepaid price when
  prices change, which integration comes first, the hospitals integrated today, and modifiers.
- **28 October, a full day with Greg.** A read-through on the board of EP-05, EP-11, EP-06 and EP-12,
  with Donald editing items live. Greg explained the trust account and the holding account on a
  whiteboard. Ben was phoned to settle whether a prepaid price can change.

The main changes:

- **Prepaid price (OQ-96 answered):** prepaid Contracts are not editable. A prepaid Contract cannot
  also carry the price override setting, so the price stays the prepaid amount. Any difference is a
  second invoice or credit raised by hand. The office can still change any price.
- **Prepaid price when prices change (OQ-104, for a prepaid Procedure):** Ben confirmed the prepaid
  quote is honoured.
- **AA Holding account:** the prepay holding account is renamed the AA Holding account. It is an
  accounts payable creditor in the payables sub-ledger beside each anaesthetist. It is not a bank
  account and not a Xero ledger account. The trust account is the bank account. The second step is a
  journal transfer, not a new invoice or a payment. Payments out of the holding account are made only
  by the system.
- **Prepayment approval is optional:** admin approval of a prepayment invoice is a step AA can
  switch off.
- **Prepaid lines:** a prepay line must carry a price above zero. Prepayment is detected per
  Procedure. "Never an organisation" is dropped from prepayment (OQ-73 revised).
- **Cancelling a prepaid Booking:** the system automatically credits an unpaid prepayment invoice or
  refunds a paid one.
- **FT-06.4 retired:** Settlement after the procedure is dissolved. US-06.4.1 moves to FT-06.5. The
  release trigger becomes OQ-125.
- **Insurers:** insurers are contract holders like any other. FT-11.4 (Insurers), US-11.4.1 (Insurer
  master data) and US-11.4.2 are retired, and US-11.4.3 moves to FT-11.2.
  - The "accepts direct claims" flag gives way to an invoice delivery setting on the contract holder
    (OQ-114).
  - An insured Booking with no approval number gets a warning. The anaesthetist can change the
    number on the day.
- **Payer:**
  - The payer can be a parent, a guardian, a benefactor or a family trust.
  - The payer needs an email or a postal address.
  - Demographics and ethnicity are held only where supplied.
  - Anaesthetists see the unpaid-balance alert on their List.
  - Anyone can leave a free-text note on a List or Booking.
- **Events:** events appear on no List or schedule. How and when an event is billed is reopened
  (OQ-121), so US-03.7.2 goes back to Verify.
- **Bookings without an NHI:** Greg's stub on the List becomes a new feature, FT-02.6, and a new
  question, OQ-118. The 19 October rule stands until OQ-118 is answered.
- **RVG and ACC:**
  - The RVG group key is a unique identifier only.
  - The Commerce Act claim is removed.
  - ACC uses the standard calculation only on an RVG-style Contract.
  - An ACC pre-op assessment follows the generic event rules (OQ-12 part 2).

The log was built from the actual changes (`git diff HEAD` and untracked files under
`requirements-board/requirements`) and checked against the run's change list. Donald's board edits
are taken from the board diff captured before the run and marked **Board** below. Everything else
is this run.

Source shorthand in this log:

- **N27** is `Notes 2026-10-27 · AA meeting with Ben and Vanessa`. `N27 #1` is point 1 of that note.
- **N28** is `Notes 2026-10-28 · AA meeting with Greg`.
- "A L845" is line 845 of the Part A transcript (AR-48), and "B L…" is a line of the Part B
  transcript (AR-49).
- Status codes: 1 Proposed, 2 Open, 3 Verify, 4 Agreed, 6 Retired.

**Counts:**

- Questions:
  - 1 answered (OQ-96).
  - 21 updated: 5 already-answered questions extended or revised (OQ-03, OQ-49, OQ-63, OQ-70,
    OQ-73), 14 open questions updated, and 2 affects-list cleanups only (OQ-61, OQ-76).
  - 9 new: OQ-117, which Donald created on the board and this run filled in, and OQ-118 to OQ-125.
- Items:
  - 91 changed: 15 by the link pass only, 40 also carry Donald's board edits, and 2 of the 91 were
    also moved.
  - 5 added (FT-02.6 and its stories US-02.6.1 to US-02.6.3, US-06.3.7), 4 retired (FT-06.4,
    FT-11.4, US-11.4.1, US-11.4.2) and 2 moved (US-06.4.1, US-11.4.3).
- Artifacts:
  - 5 registered this run (AR-47 to AR-51). AR-44 was new on the board before the run.
  - New diagram [AR-52](../artifacts/AR-52.md), "Where the money goes, prepaid or not" (N28 #48):
    not-prepaid and prepaid money flow side by side, with the trust account, the control accounts
    and sub-ledgers, the AA Holding account and the journal transfer; open matters marked (OQ-125,
    OQ-47, OQ-29). Linked from EP-06, FT-06.3, US-06.3.1, US-06.4.1, FT-06.5, US-06.5.1, US-06.5.2,
    US-08.3.1, US-08.3.4, US-10.1.1, US-10.2.1 and US-10.2.7.
  - AR-24 was edited, both on the board and in this run.
  - domain-model.md changed.
- Links: the link pass added 22 text links and `related` entries across 22 files
  (`requirements-board/.links/links-report.md`).

## 1. Inputs

- **Notes:**
  - [notes/2026-10-27-aa-meeting-with-ben-and-vanessa.md](../notes/2026-10-27-aa-meeting-with-ben-and-vanessa.md)
    (points #1 to #15), artifact [AR-50](../artifacts/AR-50.md).
  - [notes/2026-10-28-aa-meeting-with-greg.md](../notes/2026-10-28-aa-meeting-with-greg.md)
    (points #1 to #102), artifact [AR-51](../artifacts/AR-51.md). Points #74 to #95 of this note
    record Donald's board edits.
- **Transcripts.** Each was reconciled from several automatic transcriptions. The audio was not
  filed.
  - [AA Meeting with Ben & V 27th Oct Reconciled Transcript.md](../artifacts/files/AA%20Meeting%20with%20Ben%20%26%20V%2027th%20Oct%20Reconciled%20Transcript.md)
    ([AR-47](../artifacts/AR-47.md)).
  - [AA Meeting with Greg 28th Oct A Reconciled Transcript.md](../artifacts/files/AA%20Meeting%20with%20Greg%2028th%20Oct%20A%20Reconciled%20Transcript.md)
    ([AR-48](../artifacts/AR-48.md), the morning).
  - [AA Meeting with Greg 28th Oct B Reconciled Transcript.md](../artifacts/files/AA%20Meeting%20with%20Greg%2028th%20Oct%20B%20Reconciled%20Transcript.md)
    ([AR-49](../artifacts/AR-49.md), the afternoon, with Ben by phone).
- **Whiteboard:** Greg's trust account and holding account explanation in Part B was photographed
  for reference only and not filed; the Part B transcript is the evidence.
- **Donald's live board edits during the 28 October session** (N28 #74 to #95):
  - **Edited stories:** 41 files. They are listed per item in section 3, marked **Board**.
  - **New question:** OQ-117 ("Price override on fixed fee"). This run filled it in, as Donald asked
    at A L135.
  - **New diagram:** [AR-44](../artifacts/AR-44.md) (Contract holder, billable party and payer),
    drawn with the svg-diagram skill and uncommitted before this run. Donald linked it from EP-04,
    EP-11, FT-11.2, US-04.1.1, US-04.1.5, US-04.2.1, US-04.3.3, US-04.3.4, US-11.2.1, US-11.2.2,
    US-11.2.4 and US-11.4.3 (N28 #76). This run added the missing sources to those items.
  - **AR-24 sidecar** ([AR-24](../artifacts/AR-24.md), billing and invoice flow):
    - Region `prepayment-settlement` renamed "Release the prepayment from the holding account".
    - New region `invoice-sender`, "Sender to decide at build: our system or Xero".
    - The description says the invoice sender is for the Stratos dev team to decide.
  - **AR-24 drawing** (N28 #74): the renamed node, a "Sender to decide at build" note, and the
    prepayment approval, pair and Xero nodes moved.
- **This run's edits to AR-24:**
  - Sources added (N28 #43 #50 #51 #64 #74 #100).
  - "prepay holding account" became "AA Holding account" in region names and drawing text.
  - The `prepayment-settlement` note and the drawing's trigger note point to US-06.4.1, not FT-06.4.
  - `prepayment-invoicing` gets the note "The approval is an optional step AA can switch off".
  - The drawing: the release node's subtitle loses "in place of another invoice" (Greg: noise,
    B L835), the approval node gets a small "Prepayment stream" label (A L1107), and its subtitle
    reads "Optional step".
  - "its trigger still to confirm" is left in, because the trigger is not settled (OQ-125).
- **Donald's "Claude, …" requests** in both Greg transcripts were treated as explicit instructions
  (N28 #96).
- **Not part of this run, also uncommitted:** `.gitignore`,
  `requirements-board/agent/workflows/link-requirements.js` and
  `requirements-board/package-lock.json`.

## 2. Questions

**Answered in this run** (Open to Answered).

| Question | Answer in one line | Source |
| --- | --- | --- |
| [OQ-96](../questions/OQ-96.md) | No. Prepaid Contracts are not editable and cannot carry the price override setting. A difference is a second invoice or credit raised by hand (Ben). The office can still change any price. | N28 #1 #59 #60 #61 |

**Already answered, extended or revised** (status stays Answered):

- [OQ-03](../questions/OQ-03.md): Ben confirmed that a moved prepaid Booking keeps its price
  ("Correct."). Source: N27 #2.
- [OQ-49](../questions/OQ-49.md): Greg agrees the NHI rule but proposes an error queue and a stub on
  the List. The answer is not changed until OQ-118 is answered. Source: N28 #26.
- [OQ-63](../questions/OQ-63.md): events live with the Booking and appear on no List. How and when
  an event is billed reopens part 4 of the answer (OQ-121). Source: N28 #23 #24.
- [OQ-70](../questions/OQ-70.md): the 19 October supersession stands. The new anaesthetist "claims
  the prepaid amount". Source: N28 #51 #57 #62.
- [OQ-73](../questions/OQ-73.md): revised. "Never an organisation" is dropped. In practice the
  payer on the Booking prepays, but the system does not forbid a prepaid Contract that bills its
  holder. Source: N28 #6.

**Updated with partial answers, still Open** (an "Update 2026-10-2x" paragraph added):

- [OQ-12](../questions/OQ-12.md): part 2 answered. A pre-op assessment follows the generic event and
  pricing rules, so no fixed-fee Contract is required. Part 1 (whether CS250, CS260 and CS70 are the
  right codes) is still open. Source: N28 #9 #81.
- [OQ-13](../questions/OQ-13.md): hospitals also send updated schedules by free-text email, two
  weeks to a month ahead. The "Already settled" line is qualified. Formats and fields were not
  discussed. Source: N27 #6.
- [OQ-29](../questions/OQ-29.md): Greg called the second pair the BCTI and floated one BCTI per
  payment or per weekly run. "One per procedure" in "Already settled" is qualified as no longer
  clearly settled. Source: N28 #73.
- [OQ-47](../questions/OQ-47.md): three points for the accountant. A part payment releases a
  payable for the amount received; a balance check runs before each payment run; and a BCTI per
  weekly run. Source: N28 #52 #64 #73.
- [OQ-93](../questions/OQ-93.md):
  - The approval number stays, and its absence is a warning. It is a field on the Booking that the
    anaesthetist may change on the day.
  - Greg drops the line that recording it is not the anaesthetist's job.
  - New point: does the anaesthetist see the number itself, or only that it is approved?
  - The recommendation's link is repointed from US-11.4.1 to US-04.1.5, and US-11.4.1 is dropped
    from affects.
  - Source: N28 #4 #41 #42.
- [OQ-95](../questions/OQ-95.md): part 2 partly answered.
  - Ben says age is easy, and showing positioning modifiers pre-selected at zero is "a neat
    solution". He did not name the ASA grade.
  - Greg calls that "overkill" but leaves it in.
  - Part 1 (age bands, stacking) is still open.
  - Source: N27 #7, N28 #12.
- [OQ-104](../questions/OQ-104.md): settled for a prepaid Procedure (Ben: "You would honour the
  money that's been prepaid"). Conditions 2 and 4 were not discussed. The Contract changed after a
  prepayment is a separate case (US-06.3.7, OQ-119). Left Open. Source: N27 #1, N28 #56.
- [OQ-105](../questions/OQ-105.md): today's arrangements are held against individual surgeons.
  Contracts are filtered by the practitioner ID of the surgeon and the anaesthetist. Greg still sees
  rooms as the better generic model. Not settled. Source: N28 #5 #46.
- [OQ-108](../questions/OQ-108.md): no final choice. Ben leans to the surgeons' room PDFs. Vanessa
  leans to the hospital, but would take the surgeons' sheets if they are easier. Donald leans to
  supporting both. The 20 October working rule is neither confirmed nor overturned. Source: N27 #3
  #4 #11.
- [OQ-109](../questions/OQ-109.md): part 1 partly answered, with a conflict. Ben says two hospitals
  are integrated, "Forte and [unclear]". The catalogue names St George's and Southern Cross. Part 2
  was not discussed. Source: N27 #3 #5.
- [OQ-111](../questions/OQ-111.md): not answered, but the evidence leans to Xero's payables run,
  after a journal transfer for a prepayment. Source: N28 #8 #47 #62 #64.
- [OQ-114](../questions/OQ-114.md): retitled "How each contract holder's invoices are delivered"
  (was "Insurer's 'accepts direct claims' flag: what is it for?").
  - The flag gives way to an output setting on the contract holder or billable party.
  - Still open: what the other outputs are.
  - FT-11.4 and US-11.4.1 are dropped from affects.
  - Source: N28 #3 #40.
- [OQ-115](../questions/OQ-115.md): payments out of the holding account are made by the system, and
  cancelling raises the credit or refund automatically. Still open: whether the cash refund goes
  through Xero's refund process. Source: N28 #8 #64 #65.
- [OQ-116](../questions/OQ-116.md): points to leaving prepaid Procedures off the final invoice. A
  mixed Booking was not named. Source: N28 #7.

**Affects-list cleanups only:** [OQ-61](../questions/OQ-61.md) and
[OQ-76](../questions/OQ-76.md) drop the retired FT-06.4 from affects.

## 3. Items changed, added, retired and moved

**Board** marks Donald's own edit during the session. Unmarked text is this run's edit. Where an
item has a Board edit with no source, this run added the source.

**EP-01, EP-02 Scheduling and Booking intake**

- **New** [FT-02.6](../stories/FT-02.6.md) Stub Bookings on a List (Open, under EP-02):
  - An incoming booking that cannot become a Booking (for example, no NHI) shows as a stub on its
    List.
  - Both the anaesthetist and the office see it, clearly marked. The office resolves it from intake.
  - It is held on an identifier other than the NHI.
  - The acceptance criterion that the Booking replaces the stub is our reading.
  - Sources: OQ-49, N28 #26 #27, OQ-118.
  - Its behaviour and acceptance criteria moved down into three new stories, all Open:
    [US-02.6.1](../stories/US-02.6.1.md) Stub in place of a booking that could not be posted,
    [US-02.6.2](../stories/US-02.6.2.md) Stub clearly marked for anaesthetists and the office, and
    [US-02.6.3](../stories/US-02.6.3.md) Office resolves a stub from intake. All three are added to
    OQ-118.
- [US-02.5.3](../stories/US-02.5.3.md) Record a cancellation: a prepaid Booking's cancellation
  settles the prepayment automatically: a credit note if unpaid, or a refund if paid. The link is
  renamed to "cancellation of prepayment procedures". Source: N28 #65.
- [US-01.4.6](../stories/US-01.4.6.md) The List's anaesthetist did its procedures: "prepay holding
  account" becomes "AA Holding account". "Claims no more than was prepaid" becomes "claims the
  prepaid amount". Source: N28 #57.
- [US-01.4.7](../stories/US-01.4.7.md) Anaesthetist moves a single Booking: rename to the AA
  Holding account only.

**EP-03 Booking and Procedure capture**

- [FT-03.5](../stories/FT-03.5.md) Anaesthetist adjustment and
  [US-03.5.1](../stories/US-03.5.1.md) Apply an anaesthetist adjustment: the anaesthetist can never
  change the price on a prepaid Contract, which is not editable. The "OQ-96 open" wording is removed.
  Sources: N28 #1, OQ-96.
- [FT-03.7](../stories/FT-03.7.md) Events on a Procedure: new bullet that events live with the
  Booking and appear on no List or schedule. A note records that Greg floated a separate linked
  Booking but did not press it. Sources: N28 #23 #24, OQ-63, OQ-121.
- [US-03.7.1](../stories/US-03.7.1.md) Add a pre-op or post-op event:
  - New acceptance criterion: an event dated on another day is not on that day's List.
  - Notes: Greg on the default billable party ("it should use the procedure's details", with some
    doubt), and that it is mainly anaesthetists who start events.
  - Sources: N28 #23 #31, OQ-63, OQ-121.
- [US-03.7.2](../stories/US-03.7.2.md) Bill an event: **Agreed to Verify.** Reopened until Vanessa
  answers how and when an event is billed. Sources: N28 #24, OQ-63, OQ-121.
- [US-03.3.4](../stories/US-03.3.4.md) Choose optional modifiers and
  [US-03.3.8](../stories/US-03.3.8.md) Age modifier: notes add Ben's 27 October answer. Both stay
  Verify, because the age bands and stacking are still OQ-95. Source: N27 #7.

**EP-04 Contracts**

- [EP-04](../stories/EP-04.md) Contracts:
  - **Board:** AR-44 linked.
  - "an insurer [accepting direct claims](US-11.4.1)" becomes "an insurer or a hospital
    ([contract holders](US-04.1.5))".
  - Sources: N28 #3 #29 #76.
- [US-04.1.1](../stories/US-04.1.1.md) Typical Contract arrangements:
  - **Board:** AR-44#arrangements.
  - The anaesthetist can never change a prepaid Contract's price; the office still can.
  - In the table, "An anaesthetist's prepay price list" changes from "yes (OQ-96)" to "no".
  - Sources: N28 #1 #29 #76, OQ-96.
- [US-04.1.5](../stories/US-04.1.5.md) Contract holders:
  - **Board:** AR-44#contract-holder and #holder-setting.
  - New setting: how the holder's invoices are delivered, by email or another output (OQ-114).
  - Note: insurers are contract holders, with no insurer master list.
  - Stays Verify.
  - Sources: N28 #3 #29 #33 #40 #76, OQ-114.
- [US-04.2.1](../stories/US-04.2.1.md) Contract holder, who is billed:
  - **Board:** AR-44#billable-party and #holder-question.
  - "an insurer accepting direct claims, or a hospital" becomes "such as an insurer or a hospital".
  - Sources: N28 #3 #29 #33 #76, OQ-114.
- [US-04.2.8](../stories/US-04.2.8.md) Invoice presentation and delivery:
  - The delivery method is email or another output, for a [holder](../stories/US-04.1.5.md) that
    takes its invoices that way. The link to US-11.4.1 is gone.
  - Note: Greg would hold it on the contract holder or billable party (OQ-114).
  - Sources: N28 #3, OQ-114.
- [US-04.2.14](../stories/US-04.2.14.md) Anaesthetist's own price list Contracts:
  - A prepay list is never editable by the anaesthetist.
  - Its lines must carry a price above zero, with a new acceptance criterion that a zero or missing
    price is refused.
  - OQ-104 is confirmed by Ben.
  - Note: a surgeon's price list is the same kind of Contract, identified by practitioner ID.
  - Sources: N27 #1, N28 #1 #5 #44 #46, OQ-96, OQ-104.
- [US-04.2.2](../stories/US-04.2.2.md) Contract pricing terms: a prepaid Contract is never editable
  (OQ-96). The link pass added US-05.2.5 to related. Sources: N28 #1, OQ-96.
- [US-04.2.10](../stories/US-04.2.10.md) Contract prices effective from a date: OQ-104 is confirmed
  by Ben for a prepaid Procedure. A non-prepaid fixed price follows the procedure date, as Donald
  restated it. Sources: N27 #1, OQ-104.
- [US-04.3.3](../stories/US-04.3.3.md) and [US-04.3.4](../stories/US-04.3.4.md): **Board** AR-44
  links only. This run added sources: N28 #29 #76.

**EP-05 Pricing**

- [US-05.1.1](../stories/US-05.1.1.md) RVG groups:
  - **Board:** "A unique system (human readable) code: still open" becomes "A unique system code".
    The board edit also dropped "its code and description, as published" (see section 6).
  - The note now says the key is a unique identifier only, which the user never sees.
  - New note: Greg asked why the modifier list is separate from the RVG groups. Not resolved.
  - Sources: N28 #10 #79 #102.
- [US-05.1.3](../stories/US-05.1.3.md) Anatomy headings and AA groups: **Board Verify to Agreed.**
  Source: N28 #11 #79.
- [US-05.1.4](../stories/US-05.1.4.md) Modifiers already included in base units: **Board Verify to
  Agreed.** Notes add Ben ("a neat solution") and Greg ("overkill, but you can leave it in").
  Sources: N27 #7, N28 #12 #79, OQ-95.
- [US-05.1.5](../stories/US-05.1.5.md) Modifier code master:
  - **Board:** Verify to Agreed.
  - The Verify note is replaced by Ben's answer: nothing but age and the zero-value positioning
    modifiers is pre-filled.
  - Stacking is a policy matter.
  - Greg doubts the master's value, and modifier ranges are not yet covered by OQ-101.
  - Sources: N27 #7 #8, N28 #13 #79, OQ-95, OQ-101.
- [US-05.2.1](../stories/US-05.2.1.md) Per-unit pricing rate:
  - **Board:** the competition law and Commerce Act wording is deleted.
  - Note: AA accepts vendors' price offers, such as ACC rates, as Contracts.
  - Sources: N28 #15 #77.
- [US-05.2.2](../stories/US-05.2.2.md) Tiered time units: **Board** added a sentence; this run
  reworded it to "The anaesthetist enters only the start and stop times; the system works out the
  units." Sources: N28 #16 #78.
- [US-05.2.5](../stories/US-05.2.5.md) Fixed fee schedule pricing: new note. A prepaid fixed price
  is never editable by the anaesthetist. Whether non-prepaid fixed-price Contracts allow an override
  is OQ-117. Sources: N28 #1 #2, OQ-96, OQ-117.
- [US-05.4.2](../stories/US-05.4.2.md) Office can change any price: new note. Greg agreed the office
  can change any price, prepaid included, but the change does not invoice or credit a difference by
  itself. "The only way to change a fixed price" is questioned (OQ-117). The body is unchanged.
  Sources: N28 #1 #21 #59, OQ-96, OQ-117.
- [FT-05.5](../stories/FT-05.5.md) ACC:
  - **Board:** Proposed to Agreed, and "if it's an RVG style contract" added.
  - This run tidied the wording ("where it is an RVG-style Contract; not every ACC Contract is").
  - New note: Greg questions why ACC is a separate feature.
  - Sources: N28 #22 #80.
- [US-05.5.1](../stories/US-05.5.1.md) ACC through the holder's Contract: **Board Proposed to
  Agreed.** "where it is an RVG-style Contract" added. Sources: N28 #22 #80.
- [US-05.5.2](../stories/US-05.5.2.md) ACC pre-op flat fee codes:
  - **Board:** Open to Agreed, and the "fixed-fee Contract", "never the primary procedure" and "own
    line" bullets deleted.
  - Added: it follows the generic event and pricing rules, and some events may be preconfigured.
  - Note: OQ-12 part 2 is answered.
  - Sources: N28 #9 #24 #81, OQ-12, OQ-121.

**EP-06 Prepayment**

- [EP-06](../stories/EP-06.md) Prepayment: **Board Verify to Agreed.**
  - The line must carry a price above zero.
  - Admin approval is an optional step.
  - The money is credited to the AA Holding account and transferred to the anaesthetist.
  - On cancellation, the invoice is credited if unpaid or refunded if paid.
  - The "build position until Ben answers OQ-96" wording is removed.
  - New paragraph: a prepaid Contract is not editable by the anaesthetist.
  - OQ-104 is confirmed by Ben.
  - Sources: N27 #1 #2, N28 #1 #43 #44 #47 #59 #60 #61 #62 #63 #65 #86 #99, OQ-96, OQ-104.
- [FT-06.2](../stories/FT-06.2.md) Prepayment trigger and amount:
  - The price must be above zero.
  - OQ-104 is confirmed by Ben.
  - Note: a prepaid list can be an anaesthetist's or a surgeon's, identified by practitioner ID.
  - Sources: N27 #1, N28 #44 #46, OQ-104.
- [US-06.2.1](../stories/US-06.2.1.md) Detect prepayment requirement:
  - **Board:** "checked across the whole Booking" deleted.
  - The prepayment is invoiced to whoever the Contract bills. "Never an organisation" is dropped.
  - New acceptance criterion: only the Procedure on a prepaid Contract needs prepayment.
  - Sources: N28 #6 #45 #87, OQ-73.
- [US-06.2.2](../stories/US-06.2.2.md) Set the prepaid amount:
  - The amount comes from the anaesthetist's or a surgeon's price list, identified by practitioner
    ID, and is picked from the [filtered Contracts](../stories/US-04.3.2.md).
  - The price is mandatory and above zero, with a new acceptance criterion.
  - OQ-104 is confirmed by Ben.
  - Sources: N27 #1, N28 #5 #44 #46, OQ-104, OQ-105.
- [FT-06.3](../stories/FT-06.3.md) Prepayment invoicing and tracking: the one difference from other
  invoices is that the payable credits the AA Holding account. The anaesthetist is paid later by a
  transfer. Sources: N28 #47 #49 #63.
- [US-06.3.1](../stories/US-06.3.1.md) Raise the prepayment invoice:
  - Approval is an optional step, with a new acceptance criterion for it switched off.
  - The second leg is a journal transfer.
  - The payer is whoever the Contract bills ("never an organisation" dropped).
  - The screenshot caption is renamed.
  - Note on OQ-120.
  - Sources: N28 #6 #43 #47 #54 #63, OQ-73, OQ-120.
- [US-06.3.5](../stories/US-06.3.5.md) Re-check when the Booking changes:
  - **Board:** Verify to Open. The example sentence and the "This is so" paragraph are deleted, and
    the text says "claims the prepaid amount".
  - This run fixed the stray full stop.
  - The acceptance criterion now applies only before the prepayment invoice is generated.
  - The Contract changed after the invoice is sent or paid points to US-06.3.7 and OQ-119.
  - Sources: N27 #1, N28 #56 #57 #92, OQ-104, OQ-119.
- **New** [US-06.3.7](../stories/US-06.3.7.md) Contract changed after a prepayment is sent or paid
  (Open, under FT-06.3):
  - It records what was said: if paid, a full refund then an invoice under the new Contract
    (Donald), with Greg preferring a refund to a credit.
  - If sent but unpaid, nothing was settled.
  - Sources: OQ-104, N28 #56, OQ-119.
- [US-06.3.6](../stories/US-06.3.6.md):
  - Retitled "Prepayment letter template" (was "Prepayment letter templates").
  - **Board:** Proposed to Agreed.
  - One standard template, at least one and need not be many.
  - The anaesthetist stays among the filled-in fields until OQ-120 is answered.
  - Sources: N28 #43 #53 #58 #92, OQ-120.
- **Retired** [FT-06.4](../stories/FT-06.4.md) Settlement after the procedure: **Verify to
  Retired.** Dissolved at Donald's request; its live story moves to FT-06.5. US-06.4.2 was already
  retired and stays under it. Sources: N28 #61 #88.
- **Moved** [US-06.4.1](../stories/US-06.4.1.md) from FT-06.4 to FT-06.5 (order 5):
  - Retitled "Nothing further after a prepaid procedure" (was "No automatic invoice or credit after
    a prepaid procedure").
  - **Board:** Verify to Agreed.
  - Rewritten: after the procedure nothing occurs but the transfer from the AA Holding account.
  - A prepaid Contract is not editable.
  - A difference is raised by hand (Ben).
  - The "build position until OQ-96 and OQ-97" wording is removed from the text and the acceptance
    criteria.
  - New acceptance criterion: AA cannot set a prepaid Contract to allow a price override.
  - FT-06.4's trigger note is carried over and points to OQ-125.
  - Sources: N27 #1, N28 #1 #51 #59 #60 #61 #88 #99 #100, OQ-125.
- [FT-06.5](../stories/FT-06.5.md) Trust account and cancellation refunds:
  - **Board:** Verify to Agreed. The money is credited to a payables account called the AA Holding
    account, a move "keeps its prepayment price", and the "Today, if the anaesthetist…" paragraph is
    deleted.
  - The transfer to whoever did the procedure is automatic, not handled by the office.
  - Cancellation means a credit if unpaid or a refund if paid.
  - New bullet: nothing further after a prepaid procedure.
  - Sources: N27 #2, N28 #47 #62 #63 #65 #89.
- [US-06.5.1](../stories/US-06.5.1.md):
  - Retitled "AA Holding account" (was "Prepay holding account").
  - **Board:** reworded, with "in place of another invoice" removed. The board typo "a ACCPAY" is
    fixed to "an accounts payable prepay account".
  - New paragraph: it is a creditor in the payables sub-ledger, not a bank or Xero ledger account,
    and the trust account is the bank account.
  - The second pair is a journal transfer.
  - New acceptance criterion: no payment out of it except by the system.
  - Note: Greg's "fake anaesthetist" and the whiteboards.
  - Sources: N28 #8 #47 #51 #63 #64 #90, OQ-115.
- [US-06.5.2](../stories/US-06.5.2.md):
  - Retitled "Cancellation of prepayment procedures" (was "Refund a prepayment on cancellation").
  - **Board:** Verify to Agreed. Adds Scenario 1 (unpaid: a credit note) and deletes "The office
    handles the refund…".
  - Scenario 1 is rewritten out of the second person.
  - Both scenarios are automatic on cancel, and a payment after the credit note is refunded.
  - Two new acceptance criteria.
  - Sources: N28 #8 #65 #91, OQ-115.
- [US-06.5.3](../stories/US-06.5.3.md) Prepayment for a replacement anaesthetist:
  - **Board:** Verify to Agreed, with a paragraph split.
  - The cancelled prepayment is credited if unpaid or refunded if paid, and the acceptance criterion
    follows.
  - The link is renamed.
  - Sources: N28 #65 #66 #92.
- [US-06.5.4](../stories/US-06.5.4.md) Prepaid Booking moved to another anaesthetist:
  - "Claims no more than was prepaid" becomes "claims the prepaid amount: the deal is the deal".
  - The second step points to US-06.4.1.
  - OQ-96 is answered, OQ-104 is confirmed, and OQ-03 is confirmed by Ben.
  - The patient-email paragraph waits on OQ-120.
  - Sources: N27 #1 #2, N28 #53 #57 #67, OQ-03, OQ-96, OQ-104, OQ-120.

**EP-08, EP-09 Billing engine and Xero**

- [US-08.2.2](../stories/US-08.2.2.md) Net prepayments: OQ-96 is answered. Whether a prepaid
  Procedure is left off rather than deducted is OQ-116. The link is renamed. Sources: N28 #1 #7,
  OQ-96, OQ-116.
- [US-08.6.3](../stories/US-08.6.3.md) Create an additional invoice: "(still open with Ben, OQ-96)"
  becomes Ben's second invoice raised by hand. Sources: N28 #1, OQ-96.
- [US-09.1.4](../stories/US-09.1.4.md) ACCPAY as buyer-created tax invoice: one BCTI per procedure,
  per payment or per payment run is no longer settled. Sources: N28 #73, OQ-29.
- Rename to the AA Holding account only:
  - [FT-08.3](../stories/FT-08.3.md), [FT-09.1](../stories/FT-09.1.md),
    [US-08.3.1](../stories/US-08.3.1.md) and [US-09.1.1](../stories/US-09.1.1.md).
  - FT-08.3 and [US-09.1.3](../stories/US-09.1.3.md) also repoint their `[settlement]` link from
    FT-06.4 to US-06.4.1.

**EP-11 Patients and billable parties**

- [EP-11](../stories/EP-11.md):
  - **Board:** AR-44 linked.
  - The payer can be a guardian, a benefactor or a family trust.
  - Insurers are [contract holders](../stories/US-04.1.5.md). An insured Booking with no approval
    number is a warning. Anaesthetists see the unpaid-balance alert.
  - Sources: N28 #3 #4 #29 #37 #40 #76.
- [US-11.1.1](../stories/US-11.1.1.md) Patient record keyed on NHI:
  - **Board:** Proposed to Agreed.
  - Demographics and ethnicity are held where supplied and never required.
  - The NHI is checked against the NHI service.
  - Note on OQ-118.
  - Sources: N28 #25 #26 #28 #83, OQ-118.
- [US-11.1.2](../stories/US-11.1.2.md) Dual-format NHI validation: **Board Proposed to Agreed.**
  Source: N28 #28 #83.
- [US-11.1.4](../stories/US-11.1.4.md) Patient without NHI: note on Greg's error queue and stub
  model, FT-02.6 and OQ-118. Stays Agreed, as Donald left it. Sources: N28 #26 #83, OQ-118.
- [US-11.1.5](../stories/US-11.1.5.md) Intake rows waiting for an NHI: **Board Proposed to
  Agreed.** Note: the hospital list comes only 24 hours before, so the system chases the office;
  stubs (US-02.6.1). Sources: N28 #27 #83, OQ-118.
- [FT-11.2](../stories/FT-11.2.md) Who is billed:
  - **Board:** AR-44#bill-holder.
  - "An insurer that accepts direct claims" becomes "an insurer".
  - The payer can be changed to someone else who pays, such as a parent, guardian, benefactor or
    family trust. "Name and email" becomes "name and contact details".
  - Note: Greg confirms the Contract alone decides who is billed, and that an event uses its
    Procedure's billable party.
  - Sources: N28 #29 #31 #33 #76.
- [US-11.2.1](../stories/US-11.2.1.md) Patient billed when the Contract does not bill its holder:
  - **Board:** "since most patients pay for their own procedure" deleted, and AR-44#bill-payer added.
  - Notes: it merges the retired US-11.4.2 ("We bill the patient, end of story").
  - Sources: N28 #29 #32 #40 #76 #82.
- [US-11.2.2](../stories/US-11.2.2.md) Payer on the Booking:
  - **Board:** the hospital-or-insurer and guardian-for-a-child paragraphs deleted, and AR-44#payer
    added.
  - The payer gets a postal address. It can be a benefactor or a family trust. It needs an email or
    a postal address.
  - The acceptance criterion follows.
  - Note: Greg's "different payer" tick, and posted invoices (OQ-122).
  - Sources: N28 #29 #30 #33 #34 #76 #82, OQ-122.
- [US-11.2.3](../stories/US-11.2.3.md):
  - Retitled "Payer email or postal address required when the payer is billed" (was "Payer email
    required when the payer is billed").
  - At least one is required, with the postal address in the NZ Post standard.
  - The acceptance criteria are rewritten, and one is added.
  - Sources: N28 #30 #34.
- [US-11.2.4](../stories/US-11.2.4.md) Warn when a child is the payer:
  - **Board:** AR-44#patient.
  - "A hospital" becomes "a contract holder", in the text and the acceptance criterion. "Email"
    becomes "email or postal address".
  - Note: only the age is known.
  - Sources: N28 #35 #76.
- [FT-11.3](../stories/FT-11.3.md) Patient outstanding balances and alerts: anaesthetists also see
  the alert, on the Booking in their List. Sources: N28 #36 #37.
- [US-11.3.2](../stories/US-11.3.2.md) Alert on booking a patient with unpaid bills:
  - **Board:** Verify to Agreed.
  - The anaesthetist sees the alert on their List, with the mild alert as a colour code.
  - New acceptance criterion.
  - Clearing alerts is parked.
  - Sources: N28 #36 #37 #38 #84.
- [US-11.3.3](../stories/US-11.3.3.md) Follow-up tools:
  - **Board:** Proposed to Agreed.
  - New: anyone can write a free-text note on a List or Booking that everyone sees.
  - New acceptance criterion.
  - Note: the original source is unknown.
  - Sources: N28 #39 #84.
- **Retired** [FT-11.4](../stories/FT-11.4.md) Insurers: **Proposed to Retired.** "We don't have a
  master insurance list." Its content is now in FT-11.2 and US-04.1.5. Sources: N28 #3 #40, OQ-114.
- **Retired** [US-11.4.1](../stories/US-11.4.1.md) Insurer master data:
  - **Board:** Agreed to Proposed (A L781).
  - This run: Proposed to Retired, following Donald's later request to fold FT-11.4 away (A L845).
  - Its Technical discussion is kept as history.
  - Links from EP-04, US-04.2.8 and US-13.4.1 are repointed to US-04.1.5.
  - Sources: N28 #3 #40 #85, OQ-114.
- **Retired** [US-11.4.2](../stories/US-11.4.2.md) Insured patient who forwards the invoice:
  **Proposed to Retired**, merged into US-11.2.1. Source: N28 #40.
- **Moved** [US-11.4.3](../stories/US-11.4.3.md) from FT-11.4 to FT-11.2 (order 5):
  - Retitled "Insurance and approval number on the Booking" (was "Insurer and approval number on the
    Booking").
  - **Proposed to Verify.**
  - **Board:** AR-44#sxap.
  - Rewritten: they are fields on the Booking, shown on the matching screen, and editable by the
    office and, on the day, by the anaesthetist.
  - A missing approval number is a warning, never a block.
  - The "office's job, not the anaesthetist's" line is dropped.
  - The acceptance criteria are rewritten, with two new ones (missing approval number, changed on the
    day).
  - Where the warning shows is open (OQ-93).
  - Sources: N28 #4 #40 #41 #42 #76, OQ-93.

**EP-12 Anaesthetist profile and reporting**

- [EP-12](../stories/EP-12.md):
  - Paragraph 1 is rewritten ("a very messy sentence"). The profile is held by the office and holds
    identity (registration number, HPI CPN), contact and bank details, and the dollar value per
    unit, plus preferred and not-preferred pairings, seen only by admin staff.
  - The GST report is sent to their accountant.
  - Stays Proposed.
  - Source: N28 #68.
- [FT-12.1](../stories/FT-12.1.md) Profile settings: identity and the pairings added. The note
  reads "practitioner number" as the registration number or HPI CPN. Stays Proposed. Source: N28
  #68.
- [US-12.1.1](../stories/US-12.1.1.md) Dollar value per unit:
  - **Board:** Proposed to Agreed.
  - "Their unit rate" added.
  - The Commerce Act sentence is deleted.
  - The Technical discussion becomes one sentence: a later change never alters an issued invoice.
  - Sources: N28 #15 #69 #93.
- [US-12.1.4](../stories/US-12.1.4.md) Anaesthetist identity, contact and bank details:
  - **Board:** Verify to Agreed, and "where available" removed from the HPI CPN.
  - New acceptance criterion: bank details are mandatory.
  - Sources: N28 #70 #93.
- [FT-12.2](../stories/FT-12.2.md) Reporting for anaesthetists: **Board** "owed by patients and
  contract holders". Sources: N28 #71 #94.
- [US-12.2.1](../stories/US-12.2.1.md) Outstanding balances list: **Board** traceability sentence;
  this run reworded it. Each line links back to its Booking, with a new acceptance criterion.
  Sources: N28 #72 #94.
- [US-12.2.2](../stories/US-12.2.2.md) GST report: it lists the payments AA made in the month. The
  part-payment and repayment-plan wording is deleted. Note on the BCTI (OQ-29, OQ-47). Stays Verify.
  Sources: N28 #73, OQ-29, OQ-47.
- [US-12.2.3](../stories/US-12.2.3.md) Dashboard: **Board Proposed to Agreed.** No text change.
  Source: N28 #95.

**EP-13 Admin**

- [US-13.4.1](../stories/US-13.4.1.md) Maintain reference tables: "insurers" (US-11.4.1) merges into
  "contract holders, insurers among them". Sources: N28 #3 #40.

**Link pass only (15 items)** (no other change):

- EP-03, FT-03.4, FT-04.2, FT-05.4, US-02.1.2, US-02.1.5, US-02.2.1, US-02.2.3, US-02.5.2,
  US-03.1.6, US-03.4.1, US-04.3.5, US-04.3.7, US-05.4.1 and US-13.8.1.
- The pass also added links in FT-02.6, EP-11, FT-11.2, US-04.2.2, US-06.2.2, US-11.2.2 and
  US-11.4.3, which are listed above.

**domain-model.md:**

- **AA Holding account:** the prepay holding account becomes the AA Holding account. It is an
  accounts payable creditor in the payables sub-ledger (a "fake anaesthetist"), not a bank or Xero
  ledger account. It is paid out by a journal transfer, and payments out of it are made only by the
  system.
- **Trust and control accounts:** a new paragraph and glossary rows for the trust account (the bank
  account) and for control accounts and sub-ledgers.
- **Prepaid Contracts:**
  - Never editable by the anaesthetist (OQ-96). The typical-arrangements row changes from "pending"
    to "no".
  - A line price above zero.
  - The price list can be an anaesthetist's or a surgeon's, by practitioner ID.
  - "Never an organisation" is dropped (OQ-73).
  - OQ-104 is confirmed by Ben.
  - "Claims the prepaid amount".
- **Prepayment invoices:** approval is an optional step. Cancelling credits an unpaid prepayment
  invoice or refunds a paid one, automatically.
- **Insurers and delivery:** insurers are contract holders, with no master list or direct-claims
  flag. A new holder setting says how invoices are delivered (OQ-114), and `deliveryMethod` is no
  longer a Contract setting.
- **Booking insurance:** the insurer and approval number are Booking fields, editable on the day. A
  missing number is a warning (OQ-93).
- **Payer:** the payer can be a guardian, a benefactor or a family trust, and needs an email or a
  postal address in the NZ Post standard.
- **Patient:** demographics and ethnicity are held where supplied, never required. The anaesthetist
  sees balance alerts. A free-text note can sit on a List or Booking.
- **Events:** events appear on no List. An event's billable party defaults to its Procedure's. How
  events are billed is reopened (OQ-121).
- **Other:**
  - Prepayment is detected per Procedure.
  - Vendors' price offers are accepted as Contracts.
  - A new glossary row: unit rate.
  - The invoice sender is left to the build team (N28 #50).
  - The BCTI count is no longer settled (OQ-29).

## 4. New questions

| Question | Title | Owner | Affects | Sources |
| --- | --- | --- | --- | --- |
| [OQ-117](../questions/OQ-117.md) | Price override on fixed fee | Donald to ask AA | US-05.2.5, US-05.4.2, US-04.2.14 | N28 #1 #2 #21 #75 |
| [OQ-118](../questions/OQ-118.md) | Bookings arriving without an NHI: wait at intake, or a stub on the List? | Donald to ask Vanessa and Ben | US-11.1.4, US-11.1.5, US-11.1.1, US-02.1.4, FT-02.6 | N28 #26 #27, OQ-49 |
| [OQ-119](../questions/OQ-119.md) | Prepaid Contract changed after the prepayment is sent or paid | Donald to ask Vanessa and Ben | US-06.3.5, US-06.3.7, US-06.5.2, FT-06.3 | N28 #56, OQ-104 |
| [OQ-120](../questions/OQ-120.md) | Does a prepayment invoice name the anaesthetist? | Donald to ask Vanessa or Ben | US-06.3.1, US-06.3.6, US-06.5.4, FT-06.3 | N28 #53 #67 |
| [OQ-121](../questions/OQ-121.md) | How and when is an event on a Booking billed? | Donald to ask Vanessa | US-03.7.2, FT-03.7, US-03.7.1, US-05.5.2 | N28 #24, OQ-63 |
| [OQ-122](../questions/OQ-122.md) | Posted invoices for payers without email | Donald to ask Vanessa | US-11.2.2, US-11.2.3, US-04.2.8 | N28 #30 #34 |
| [OQ-123](../questions/OQ-123.md) | Reporting on billing practice for contract negotiation | Donald to ask Ben | EP-12, FT-12.2, FT-05.1 | N27 #9 |
| [OQ-124](../questions/OQ-124.md) | The app as the anaesthetist's source of truth instead of emailed Lists | Donald to ask Ben and Vanessa | FT-02.5, US-02.3.3, US-02.3.5, FT-02.2 | N27 #12, N28 #101 |
| [OQ-125](../questions/OQ-125.md) | What triggers the release of a prepayment from the holding account? | Donald and Greg | US-06.4.1, US-06.5.1, FT-06.5 | N28 #51 #100 |

Donald created OQ-117 on the board with only a stub body. This run added the owner, the sources,
the question and a partial answer:

- It is never allowed on a prepaid Contract.
- Outside prepayment, an overridden price is simply the price invoiced.
- Still open: whether such Contracts exist at AA.

All nine are Open.

## 5. Points with no requirement change

- **N27:**
  - #3, #4 and #11 (which integration comes first): not settled. Recorded on OQ-108.
  - #5 (hospitals integrated today): conflicts with the catalogue. Recorded on OQ-109.
  - #6 (free-text email schedules): not settled. Recorded on OQ-13.
  - #8 (stacked modifiers): a policy matter. No limit is proposed. Noted on US-05.1.5.
  - #10 (Elixir integration): a wish, not a requirement.
  - #13 (introduction to the accountant) and #14 (Vanessa to send sample PDFs): follow-ups only.
  - #15: questions left for later.
- **N28, settled by a question or a note only:**
  - #2 and #21: recorded on OQ-117, with notes on US-05.2.5 and US-05.4.2. The wording of US-05.4.2
    is unchanged.
  - #42 (does the anaesthetist see the approval number): not settled. Recorded on OQ-93.
  - #52 (a part payment releases the payable for what was received): for the accountant. Recorded
    on OQ-47.
  - The balance check before each payment run in #64: raised for the accountant, recorded on OQ-47.
    The rest of #64 is in US-06.5.1.
  - #75: OQ-117 created and filled in.
  - #97: questions touched but not answered, recorded on the questions concerned.
- **N28, read with nothing to change:**
  - #14: FT-05.2 reads right. No change asked.
  - #17: read and agreed. The items are already Agreed.
  - #20: no objection. US-05.4.1 is already Agreed.
  - #28: dual-format validation is fine. Only the source was added, with US-11.1.2.
  - #55: read and fine. Greg's nightly reconciliation was a suggestion, not adopted.
- **N28, not taken further:**
  - #18: the English clean-up experiment, not a requirement.
  - #19 ("price override" or "pricing"): not settled. Both terms stand.
  - #38 (clearing an alert): parked. Noted on US-11.3.2.
  - #48 (a new money-flow diagram): an artifact request, drawn as AR-52 (see Artifacts above).
  - #79 (the dropped US-05.1.1 bullet): board edits stay as Donald made them. See section 6.
  - #102 (modifier list separate from the RVG groups): not resolved. Noted on US-05.1.1.
- **N28, context or covered elsewhere:**
  - #96: covered by the item changes and new questions above.
  - #98: context only.

## 6. Left for Donald

- **Check the money-flow diagram (AR-52).** It names Dr Nick and Dr Ben from Greg's whiteboard as
  examples only, and leaves out the Sales account he drew.
- **US-05.1.1 lost a bullet.** Donald's board edit dropped "its code and description, as
  published", which looks unintended (N28 #79). The type-ahead acceptance criterion still relies on
  the code and description. Restore it if it was not meant.
- **Agreed with no agreement recorded:**
  - [US-12.2.3](../stories/US-12.2.3.md) Dashboard was set to Agreed on the board, but no
    agreement is in the transcript. Donald read it and stopped (N28 #95, B L971).
  - The same applies to [US-06.3.6](../stories/US-06.3.6.md) (N28 #92: no one said "agreed").
- **US-11.4.1 retired.** Donald set it to Proposed on the board (A L781). This run then retired it,
  following his later request to fold most of FT-11.4 away (A L845). Confirm the retirement.
- **Hospital integration conflict (OQ-109).** Ben named Forte as one of the two integrated hospitals.
  The catalogue names St George's and Southern Cross: see the title of
  [US-02.1.5](../stories/US-02.1.5.md), FT-02.1 and FT-14.6. Left as is until AA says
  which hospitals they are.
- **FT-02.6 title.** "Stub Bookings on a List" calls the stub a Booking. Its own Technical
  discussion says a stub may be a separate record, not a Booking, so that every Booking still has an
  NHI. A title such as "Stubs on a List" may read better. Its status also waits on OQ-118.
- **Delivery method set in two places.** [US-04.2.8](../stories/US-04.2.8.md) (Contract definition)
  still lists a delivery method. [US-04.1.5](../stories/US-04.1.5.md) and domain-model.md put it on
  the contract holder, and domain-model.md says it is not a Contract setting. This stays until OQ-114
  is answered.
- **US-11.1.4 stays Agreed while OQ-118 is open.** Donald said "move this back to open" and later
  "agreed" (N28 #83). If OQ-118 lands on stubs, US-11.1.4 and US-11.1.5 change.
- **Release trigger not settled.** EP-06, FT-06.5 and US-06.4.1 are Agreed, but the event that
  releases the prepayment from the holding account (List authorised, or "confirmed and submitted")
  is OQ-125. AR-24 still says "its trigger still to confirm".
- **Titles now narrower than their text:**
  - [US-11.2.2](../stories/US-11.2.2.md) "Payer on the Booking, editable to a guardian": the payer
    can now also be a benefactor or a family trust.
  - [US-05.5.2](../stories/US-05.5.2.md) "ACC pre-op flat fee codes": no fixed-fee Contract is
    needed now.
- **Where the missing approval number warning shows** (office review, the anaesthetist's view, or
  both) was not said. US-11.4.3 stays Verify, and the warning is not yet among
  [US-07.2.2](../stories/US-07.2.2.md)'s office review warnings (OQ-93).
- **FT-05.5 (ACC) may be redundant.** Greg questioned why ACC is a separate feature, given the
  generic Contract model (N28 #22). Not reviewed.
- **EP-12 and FT-12.1 stay Proposed.** The reading of the "practitioner number" as the registration
  number or HPI CPN is ours (N28 #68).

## Follow-up, 29 October

Three questions the record already answered were closed, and four questions Donald answered on the
board today (29 October) were carried into the requirements. OQ-104 was also closed today, and
US-12.1.4 now has the HPI CPN and bank details mandatory, so both leave the list above.

**Questions closed from the record:**

- [OQ-105](../questions/OQ-105.md): a surgeon's fixed-price arrangement is held against the
  individual surgeon, not the rooms; a Contract may be named for a rooms but is applied to individual
  surgeons; the office picks it from the Contract list filtered by the surgeon's and the
  anaesthetist's practitioner IDs (Donald and Greg, 28 October; N28 #5 #46).
- [OQ-106](../questions/OQ-106.md): no routine procedures as lines on No contract (RVG) in the first
  release (Nick and Ben via Greg, 14 October; Donald, 16 October, "without that intermediate list").
- [OQ-115](../questions/OQ-115.md): a cancelled prepayment's refund is paid from the system,
  automatically on cancel; payments out of the AA Holding account are only made from the system
  (Greg and Donald, 28 October; N28 #8 #64 #65). How it is posted to Xero is a build matter.

**Donald's board answers carried through:** [OQ-101](../questions/OQ-101.md) (an RVG group holds
its published range, shown to the anaesthetist), [OQ-113](../questions/OQ-113.md) (tiers are for
the admin team only), [OQ-116](../questions/OQ-116.md) (prepaid Procedures are left off the final
invoice) and [OQ-117](../questions/OQ-117.md) (a fixed price never allows the anaesthetist's price
override). Each now cites "Typed decision 2026-10-29 · Donald (product owner)" and has an update line
saying what it settles.

**One Contract for several surgeons (typed decision, Donald, 29 October):** a surgeon's
fixed-price arrangement is one Contract that can be linked to many surgeons; there is not one
Contract per surgeon. The office picks it from the Contract list filtered by practitioner ID, and a
Contract linked to several surgeons shows for any of them. OQ-105 has an update line and cites the
decision; US-04.3.2, US-04.1.5, US-04.2.1, FT-04.3, US-04.2.14, US-06.2.2 and domain-model.md
(the holder's practitioner link, now one or more surgeons, in the ERD, holder table, context row,
Selection and glossary) say so and cite it, with new criteria on US-04.3.2, US-04.1.5 and US-04.2.1.

**Items changed:**

| Item | What changed |
| --- | --- |
| [US-04.1.5](../stories/US-04.1.5.md) | A surgeon holder may be named for the rooms, but its Contracts are applied to individual surgeons, by practitioner ID; note records OQ-105. |
| [US-04.2.1](../stories/US-04.2.1.md) | Holder list and "where a Contract applies" drop the surgeon's rooms; Contracts are found by practitioner ID (OQ-105). |
| [US-04.3.2](../stories/US-04.3.2.md) | Filters drop "surgeon or rooms"; a surgeon's Contract is offered on that surgeon's Bookings whichever anaesthetist; new criterion; note records OQ-105. |
| [FT-04.3](../stories/FT-04.3.md) | Filter wording as above; note records OQ-105 and OQ-106 as answered. |
| [US-04.2.14](../stories/US-04.2.14.md) | The anaesthetist can no longer change their own price list's fixed prices (OQ-117), criterion rewritten; Greg's "fixed prices, but they're editable" noted as overtaken; OQ-105 note. |
| [US-06.2.2](../stories/US-06.2.2.md) | Note records OQ-105's answer. |
| [US-04.3.3](../stories/US-04.3.3.md), [US-04.2.4](../stories/US-04.2.4.md) | Notes: no routine procedure lines on No contract (RVG) in the first release (OQ-106). |
| [US-06.5.1](../stories/US-06.5.1.md), [US-06.5.2](../stories/US-06.5.2.md) | Notes: the refund is paid from the system (OQ-115); the 2 and 16 October line is overtaken for a cancelled prepayment. |
| [US-03.7.3](../stories/US-03.7.3.md) | A cancelled prepayment's refund is the exception to "a refund made outside the system" (OQ-115). |
| [US-05.1.1](../stories/US-05.1.1.md) | An RVG group holds its published base unit range where the guide prints one, shown to the anaesthetist; new criterion (OQ-101). |
| [US-03.3.1](../stories/US-03.3.1.md) | The ranged base code criterion shows the range; notes record OQ-101 and OQ-106. |
| [US-05.1.5](../stories/US-05.1.5.md) | Note: OQ-101's answer does not cover modifier ranges. |
| [US-01.4.2](../stories/US-01.4.2.md) | Tier and pairing order is for admins; an anaesthetist sees free colleagues by availability alone (OQ-113). |
| [US-01.4.7](../stories/US-01.4.7.md) | Colleagues shown by availability alone, never by tier or pairing; new criterion (OQ-113). |
| [US-01.4.5](../stories/US-01.4.5.md) | "Availability only" criterion names tiers too; note records OQ-113. |
| [US-01.3.6](../stories/US-01.3.6.md) | Says anaesthetists moving their own List or Booking are not shown a tier order (OQ-113). |
| [US-08.2.2](../stories/US-08.2.2.md) | Rewritten: was "Net prepayments" (the engine deducted any prepayment), now "Prepaid Procedures left off the final invoice", with criteria for a mixed Booking and an all-prepaid Booking (OQ-116). |
| [US-06.4.1](../stories/US-06.4.1.md) | The prepaid Procedure is left off the final invoice, mixed Bookings included (OQ-116). |
| [EP-08](../stories/EP-08.md), [FT-08.2](../stories/FT-08.2.md) | Summaries no longer say the engine deducts a prepayment. |
| [US-05.2.5](../stories/US-05.2.5.md) | A fixed price never allows the anaesthetist's price override, whatever the flag; only the office's price change can change it; criteria added (OQ-117). |
| [US-05.4.2](../stories/US-05.4.2.md) | "The only way to change a fixed price" now holds; the office's price change is set apart from the anaesthetist's override; criteria added (OQ-117). |
| [US-04.2.2](../stories/US-04.2.2.md) | The per-Contract flag never allows overriding a fixed price; new criterion (OQ-117). |
| [US-03.5.1](../stories/US-03.5.1.md) | Their own price list moves to "a fixed price, never overridden"; criteria split (OQ-117). |
| [FT-03.5](../stories/FT-03.5.md), [US-05.4.1](../stories/US-05.4.1.md), [US-04.1.1](../stories/US-04.1.1.md) | Never on a fixed price added to where the anaesthetist can change pricing (OQ-117). |
| [AR-24](../artifacts/AR-24.md) | Redrawn: "less any prepayment" replaced by "Leave prepaid Procedures off the final invoice" (OQ-116); release from the AA Holding account by journal transfer, trigger open (OQ-125); notes for a prepaid difference handled by hand (OQ-96) and cancellation (OQ-115); the anaesthetist's adjustment never on a fixed price (OQ-117). Regions: `remaining-amount` dropped (US-08.2.2 repointed to `prepaid-left-off`); `prepaid-left-off`, `prepaid-difference`, `prepayment-cancellation` added. |
| [OQ-117](../questions/OQ-117.md), [US-04.2.14](../stories/US-04.2.14.md) | Update line and note: Donald confirmed (typed decision, 29 October) that "a fixed fee doesn't allow a price override" covers the anaesthetist's own price list, overtaking Greg's 28 October "fixed prices, but they're editable". |
| [US-08.2.2](../stories/US-08.2.2.md), [US-05.3.1](../stories/US-05.3.1.md) | A prepaid primary left off the final invoice does not change the not-prepaid additional Procedure's price: it still takes the multi-procedure reduction (typed decision, 29 October); new criterion on each. US-08.2.2's "all prepaid, no final invoice" now cites Greg, Part B L387. |
| [US-06.5.2](../stories/US-06.5.2.md), [OQ-115](../questions/OQ-115.md) | Drops "not through a separate process in Xero": the record says the refund is paid from the system, automatically on cancel; whether through Xero's refund process was not discussed. A payment after the credit note is sent back, by whom not yet stated. |
| [OQ-105](../questions/OQ-105.md), [US-04.2.11](../stories/US-04.2.11.md) | Answer reworded: holding by individual surgeons and one Contract linked to many are Donald's decisions; Greg agreed only that rooms are not a current requirement and still prefers them as the generic model. Merivale is now "a Contract named for a surgeons' rooms and linked to its surgeons". |
| [FT-03.5](../stories/FT-03.5.md), [FT-04.3](../stories/FT-04.3.md), [FT-08.2](../stories/FT-08.2.md), [US-03.5.1](../stories/US-03.5.1.md) | Features cut back to summaries: FT-03.5's fixed-price list and 28 October prepaid quotes (quotes moved to US-03.5.1), FT-04.3's OQ-105 and OQ-106 note (already in US-04.3.2 and US-04.3.3), FT-08.2's prepaid sentence (already in US-08.2.2). |
| [US-05.1.1](../stories/US-05.1.1.md) | "Where the group has a range, the anaesthetist is shown it" moved out of the "This is so" paragraph into the description. |
| [AR-02](../artifacts/AR-02.md) | The surgeon-arrangement note in the drawing, its region note and the description no longer mark OQ-105 open: one Contract, linked to its surgeons by practitioner ID. |
| domain-model.md | Contract holder, practitioner and context rows (OQ-105); No contract (RVG): no routine procedure lines in the first release (OQ-106); RVG range (OQ-101); tiers (OQ-113); final invoice (OQ-116); editable flag and price rows (OQ-117). |

**Still for Donald:**

- **Where the surgeon link sits.** One Contract linked to many surgeons is recorded with the surgeons on the contract holder (US-04.1.5, domain model), as the catalogue already models holders. Move the link to each Contract if one holder can have Contracts covering different surgeons.
