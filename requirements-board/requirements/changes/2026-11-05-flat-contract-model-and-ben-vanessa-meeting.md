# Requirements update, 2026-11-05: the flat Contract model and the meeting with Ben and Vanessa

Donald met Ben and Vanessa on 5 November over the contract picker mock (`contract-picker-mock/`), then
made eleven decisions (D1 to D11) on how Contracts are modelled from here on, written up as the
contract model proposal. This update applies both: the decisions rebuild EP-04 and every item that
spoke of Contract lines, versions, holder-level billing or Contract types, and the meeting's other
points (procedure text, change history, split and out-of-hours Lists, the price on the phone, help
desk hours) become new or changed items. Donald's decisions are made for the build and are not yet
confirmed by AA or Greg, so every item whose substance changed went to Verify, never Agreed. Readings
the proposal makes where the decisions leave a gap (its assumptions A2 to A49) are marked "our
reading" in the items.

The main changes:

- **One Contract per priced item.** No Contract lines, no versions, no staged changes. A holder's
  schedule becomes many Contracts, each held by a shared **Party** and edited in place with an audit
  trail. Each Contract says whether it bills its holder or the payer on the Booking, and is Active or
  Disabled (US-04.1.2, US-04.1.5, US-04.2.1).
- **Five pricing kinds** (US-04.2.2): RVG at the anaesthetist's rate, RVG at the Contract's rate, RVG
  less a discount, fixed price and open price. Only a fixed price is dated, through backdatable
  **price ranges** (US-04.2.15). A setting changed from a date means a new Contract.
- **Specialties and funding tags.** AA keeps a list of broad specialties; surgeons hold one or more
  (required) and Contracts none or more, which decides what is offered on a List (US-13.4.4,
  US-13.6.6, US-04.2.16). Ben answered "No" to several specialties per surgeon; D3 goes the other way
  and stays at Verify for AA to confirm. Funding tags (SXAP, HNZ, ACC) sit on Contracts (US-13.4.5,
  US-04.2.17); ACC is a tag, not a kind of Contract.
- **The step rail is decided** (US-04.3.8): where the invoice goes, then Payment type (Standard or
  Prepaid) or the hospital's funding tag, then the Contract. "Needs an invoice destination" replaces
  "Needs a contract". Every destination has a system-made **open-price fallback** picked by "Other
  price" (US-04.3.9), which partly reverses OQ-78. The Booking's funder marks a path "Suggested" and
  never narrows (US-04.3.10).
- **A Procedure's price follows its Contract until held** by a typed price, a prepayment invoice or
  AUTHORISED (US-05.2.8). RVG code, times and modifiers are required only on RVG pricing kinds
  (US-03.3.9). The anaesthetist's override exists only on RVG Contracts that allow it. A prepaid price
  is read-only once its invoice is raised (our reading, A16).
- **Questions:** OQ-131 (Contract upkeep), OQ-100 (upload and export are Future Work) and OQ-130 (an
  admin's edit to the invoice description always wins, Donald's ruling) are answered. OQ-73 goes back
  to Confirm. Eighteen answered questions gain a 5 November paragraph. Seven questions are new,
  OQ-132 to OQ-138.
- **From the meeting, outside the contract model:** the hospital's procedure text replaces the rooms'
  (US-02.5.7), a change history screen on each Booking (US-02.5.8), a split session (Proposed) and
  out-of-hours Lists (US-01.1.5, US-01.1.6), the price shown to the anaesthetist (US-03.3.10), a
  Booking total for the office (US-03.1.10), changes without signing out (US-15.0.7), a help desk
  (US-15.0.8) and pre-op consults in AA's room (US-03.7.4, Proposed).
- **Retired:** US-04.1.6 (staged Contract changes), US-04.2.4 (Contract lines) and US-04.2.10 (prices
  effective from a date).
- **Diagrams:** six redrawn to the flat model; the v6 ERD (AR-30) is superseded by AR-61.

In all, 86 items changed, 22 were added and 3 retired; 24 questions changed and 7 were
added.

## 1. Inputs

- Note: [AA meeting with Ben and Vanessa](../notes/2026-11-05-aa-meeting-with-ben-and-vanessa.md),
  artifact [AR-59](../artifacts/AR-59.md), 39 points. Donald with Ben and Vanessa, in person, over the
  contract picker mock. Cited as "Notes 2026-11-05 · AA meeting with Ben and Vanessa #n".
- Note: [Donald's contract model decisions](../notes/2026-11-05-donald-contract-model-decisions.md),
  artifact [AR-60](../artifacts/AR-60.md), 23 points: D1 to D11 are points 1 to 11, then three
  points added later the same day (12 to 14) and the proposal's change brief, question dispositions,
  new requirements and open points (15 to 23). Donald's decisions for the build, not yet confirmed by
  AA or Greg, so their items went to Verify. Cited as "Notes 2026-11-05 · Donald contract model
  decisions #n".
- Transcript: [AA Meeting with Ben & V 5th Nov Reconciled Transcript](<../artifacts/files/AA Meeting with Ben & V 5th Nov Reconciled Transcript.md>),
  artifact [AR-57](../artifacts/AR-57.md), reconciled from three automatic transcriptions. Also
  citable as "Meeting 2026-11-05 · Ben and Vanessa".
- Proposal snapshot: [Contract model proposal 5 November 2026](<../artifacts/files/Contract model proposal 5 November 2026.md>),
  artifact [AR-58](../artifacts/AR-58.md), the full flat-model design written from the decisions;
  "Donald's decisions 2026-11-05" opens its appendix. Cited as "Contract model proposal 2026-11-05
  Lnn-nn"; its section 11.1 assumptions are cited as "AR-58 An".
- `domain-model.md`: Donald rewrote its Contract parts before this run (uncommitted, part of this
  change set). This run added only the non-contract matters from the meeting (see section 3).

## 2. Questions answered

| Question | Title | Status | Answer | Points |
| --- | --- | --- | --- | --- |
| [OQ-131](../questions/OQ-131.md) | How the office keeps a Contract's prices and dates current | Open to Answered | Donald, for the build: no versions and no lines. Each priced item is its own Contract, edited in place and audited. A fixed price changes by adding a price range, whose start may be in the past; any other setting changed from a date means a new Contract. Vanessa: "That's what I'd love to do." The list of affected Procedures is OQ-133. | Meeting #1 #24 #25; Decisions #1 #4 #5 #6 #9 #19 |
| [OQ-100](../questions/OQ-100.md) | Is a Contract schedule upload needed for the first release | Open to Answered | No: schedule upload and Contract export are Future Work (D10); the first release keeps the developer-run cutover load and office screens, and staging goes with the upload. Sources differ: in the meeting Donald said of Greg's export idea "some version of that is currently in scope". Ben and Vanessa's wish for a safe copy outside the system is recorded with Donald's view that the export requirement covers it. | Meeting #1 #2 #23 #26 #27; Decisions #4 #10 |
| [OQ-130](../questions/OQ-130.md) | Does a later default replace an admin's edited invoice description | Open to Answered | Donald's ruling, for the build: an admin's edit to the invoice description always wins. Neither a late hospital description nor choosing or changing the Contract replaces it. Also records that the hospital's text replaces the rooms' on the Booking. "Contract line" reworded to "Contract". | Meeting #4 #30; Decisions #13 |
| [OQ-73](../questions/OQ-73.md) | Prepayment invoice when the patient is not the billable party | Answered to Confirm | A prepaid Contract always bills the payer, so an organisation never prepays. This is our reading (AR-58 A2), not one of Donald's decisions, so it waits for Ben, Vanessa or Greg to confirm; reopen if a holder-billed prepaid Contract is needed. The 28 October revision no longer holds. | Decisions #2 #4 #7 #17 #20 |
| [OQ-114](../questions/OQ-114.md) | How each Party's invoices are delivered (was "How each contract holder's invoices are delivered") | Open (unchanged) | Partly answered: delivery is held on the Party (D2). Question 1 is settled in effect: the "accepts direct claims" flag goes and billed-or-not is a Contract setting. Email or post only (A32) and billing details once billed (A43) are our reading. Other outputs (the nib portal, an API) stay open. | Decisions #2 #17 |
| [OQ-126](../questions/OQ-126.md) | An address book of surgeons in the system | Open (unchanged) | Not answered. An update records that a surgeon's specialty is now part of pricing (D3). Searching surgeons by specialty was not asked. | Meeting #7 #16; Decisions #3 |
| [OQ-62](../questions/OQ-62.md) | Where base units live, and how a Procedure is picked | Answered (unchanged) | Overtaken: a Contract has no base or modifier units of its own (A22); base units live on the RVG group alone; a Contract may carry a default RVG code; RVG detail is required only on RVG kinds. | Decisions #1 #4 #5 #9 #17 |
| [OQ-78](../questions/OQ-78.md) | Default Contracts, or the hospital holding every Contract | Answered (unchanged) | Overtaken in part: No contract · RVG stays the one built-in, but every invoice destination now has one system-made open-price fallback, picked by "Other price" (D8). | Meeting #3 #14; Decisions #7 #8 #17 |
| [OQ-89](../questions/OQ-89.md) | Is the time band dropped from Contract lines? | Answered (unchanged) | Moot (no lines): a time-banded schedule is one fixed-price Contract per band (A27); rate and discount map to the RVG pricing kinds. | Decisions #1 #4 #5 #10 #14 |
| [OQ-98](../questions/OQ-98.md) | Plain RVG Contracts of a holder, offered for every procedure | Answered (unchanged) | Moot (no lines): a plain RVG arrangement is one Contract of an RVG pricing kind, offered where it fits the List and its specialties match. | Decisions #1 #3 #4 #5 #7 |
| [OQ-106](../questions/OQ-106.md) | Routine procedures as lines on No contract (RVG) | Answered (unchanged) | Moot (no lines): a routine procedure with its own price is its own Contract, found by typing; unpriced ones are recorded by RVG code on No contract · RVG. | Meeting #10 #23; Decisions #1 #4 #8 |
| [OQ-66](../questions/OQ-66.md) | Contract identifiers and finding Contracts among thousands | Answered (unchanged) | Overtaken: no line key; the AA code is the unique key beside a holder reference code that is searchable, not unique; Contracts are filtered by hospital, links and specialty, then found by typing (Ben's "CAT"). | Meeting #10 #16; Decisions #1 #3 #7 #11 |
| [OQ-67](../questions/OQ-67.md) | Who a Contract belongs to, and who pays | Answered (unchanged) | Adds: the holder is a shared Party; billing the holder or the payer is a setting of each Contract; the invoice destination is worked out, with "Needs an invoice destination". | Meeting #12; Decisions #1 #2 #7 #11 #20 |
| [OQ-18](../questions/OQ-18.md) | Contract holder codes vs RVG codes | Answered (unchanged) | Adds: the item code is the Contract's holder reference code; the default RVG code is a Contract setting; whether an RVG code is needed turns on the pricing kind (D9). | Meeting #20 #21; Decisions #1 #4 #9 |
| [OQ-48](../questions/OQ-48.md) | Which date decides the price in force | Answered (unchanged) | Overtaken: the procedure date still decides, but through price ranges whose start may be in the past, replacing the 16 October "never in the past" rule; authorised or invoiced Procedures are never touched. | Meeting #1; Decisions #4 #6 #9 #19 |
| [OQ-104](../questions/OQ-104.md) | Prepaid price when the Contract changes before the procedure | Answered (unchanged) | Overtaken in mechanics: nothing is relinked; a new range does not move a prepaid Procedure once its prepayment invoice is raised (our reading). | Decisions #6 #9 #19 |
| [OQ-55](../questions/OQ-55.md) | Insurer and funding source: on the Booking or the Patient | Answered (unchanged) | Adds: the Booking's insurer or funder is a Party and only suggests a path; SXAP, HNZ and ACC are funding tags on Contracts. | Decisions #2 #4 #7 #8 |
| [OQ-93](../questions/OQ-93.md) | Insurance on the Booking: Contract filtering, the warning and the approval reference | Answered (unchanged) | Adds: insurance never removes a candidate but marks a path "Suggested" (D7); the missing-approval-number warning applies only to an insurer (A42). | Decisions #2 #7 #17 |
| [OQ-105](../questions/OQ-105.md) | How a surgeon's fixed-price arrangement is found for a Booking | Answered (unchanged) | Adds: each priced item is its own Contract, held by a surgeon or surgeon-group Party and linked to surgeons, billing the payer. | Decisions #1 #2 #3 #4 #7 |
| [OQ-53](../questions/OQ-53.md) | How combined procedures are modelled | Answered (unchanged) | Adds: a combination is a fixed-price Contract of its own (D10); fee extras are events or additional invoices; base units on a mixed Booking go to OQ-132. | Meeting #22; Decisions #1 #10 #11 #12 |
| [OQ-25](../questions/OQ-25.md) | Is a Pre-paid Contract category still wanted? | Answered (unchanged) | Adds: prepaid is a setting fixed for the Contract's life; "Payment type: Standard / Prepaid" is a step on the rail; no RVG Contract under Prepaid; an unlisted amount goes on Prepaid · Fixed price. | Meeting #13 #14; Decisions #1 #4 #7 #8 #20 |
| [OQ-96](../questions/OQ-96.md) | Can the price be changed on a prepaid procedure? | Answered (unchanged) | Adds: a prepaid Contract cannot carry the override; the office can edit only until the prepayment invoice is raised (our reading, A16), narrowing the 28 October answer. | Meeting #14; Decisions #8 #9 #17 |
| [OQ-117](../questions/OQ-117.md) | Price override on fixed fee | Answered (unchanged) | Adds: the override exists only on RVG Contracts where allowed (D9); rate and discount are not edited per Procedure (A12); the anaesthetist types an amount only on No contract · Fixed price (A37). | Meeting #20; Decisions #9 #17 |
| [OQ-119](../questions/OQ-119.md) | Prepaid Contract changed after the prepayment is sent or paid | Answered (unchanged) | Adds: moving off a prepaid Contract is handled like a cancellation; a paid prepayment is refunded, a sent one credited, and only the office moves Procedures onto or off prepaid Contracts (A47, A17). | Decisions #9 #17 #18 |

"Meeting" is "Notes 2026-11-05 · AA meeting with Ben and Vanessa" and "Decisions" is "Notes 2026-11-05
· Donald contract model decisions"; the questions cite them in full.

## 3. Items changed, added, retired or moved

Statuses are read from the files. "Sources" lists the sources each item gained.

| Item | Title | What changed | Status | Sources |
| --- | --- | --- | --- | --- |
| [US-01.1.1](../stories/US-01.1.1.md) | Two Slots per anaesthetist per day | Notes only: a 5 November paragraph pointing to the proposed A and B split (US-01.1.5) and the out-of-hours List (US-01.1.6). The rule itself is unchanged. | Agreed (unchanged) | Notes 2026-11-05 · AA meeting with Ben and Vanessa #28 #29 |
| [US-01.1.5](../stories/US-01.1.5.md) | Split a session between two surgeons | New story under FT-01.1: an admin can split one session into an A and a B List, one surgeon each. A List is not split by default, and never into more than two. Donald's working idea from Vanessa's request, not designed or agreed; the one List per Slot rule in US-01.1.1 stands until it is. Technical discussion quotes Greg's 19 October view against splitting. | new, Proposed | Notes 2026-10-19 · AA meeting with Greg #17; Notes 2026-11-05 · AA meeting with Ben and Vanessa #28 |
| [US-01.1.6](../stories/US-01.1.6.md) | Out-of-hours Lists | New story under FT-01.1: an out-of-hours List after the PM session, with its own start time, for emergency or late cases in any specialty, sometimes created the same day. Its start time, who may create one, how the availability finder treats it and how its session is recorded are still to settle. | new, Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #29 |
| [US-02.5.5](../stories/US-02.5.5.md) | Append-only change history | Notes only: a 5 November paragraph linking the history screen (US-02.5.8) and the procedure text (US-02.5.7). The first image caption no longer says "billing route". The engine rule is unchanged. | Proposed (unchanged) | Notes 2026-11-05 · AA meeting with Ben and Vanessa #30 #33 |
| [US-02.5.7](../stories/US-02.5.7.md) | The hospital's procedure text replaces the rooms' | Retitled (was "Keep the procedure text as received"). The hospital's procedure text now replaces the rooms', with no check against the rooms' wording, and each replaced text is kept in the change history. New ACs: Verbatim, Hospital's replaces the rooms', Original in the history, Entered by hand. New Technical discussion (matching screen, OQ-130) and a 5 November note quoting Ben, Vanessa and Donald. The retired "Contract line's invoice description" wording is gone. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #1; Notes 2026-11-05 · AA meeting with Ben and Vanessa #30 |
| [US-02.5.8](../stories/US-02.5.8.md) | See a Booking's change history | New story under FT-02.5: an admin opens a Booking's change history from the Booking itself; each entry shows when, who (a named user, or the hospital's list or integration) and what changed, including procedure text a hospital's list replaced. Whether the anaesthetist sees it is not settled. | new, Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #33 |
| [FT-03.3](../stories/FT-03.3.md) | Record clinical billing data per Procedure | The three RVG-detail bullets become one, linking US-03.3.9 (RVG detail required on RVG pricing kinds only). The received-text sentence now says the hospital's text replaces the rooms' and the history keeps the original. The modifiers bullet no longer says modifiers are optional; choosing none is a valid answer. | Proposed (unchanged) | Notes 2026-11-05 · AA meeting with Ben and Vanessa #30; Notes 2026-11-05 · Donald contract model decisions #9 #16 |
| [FT-03.4](../stories/FT-03.4.md) | Contract on the Procedure | Now "where the invoice goes and the Contract, on the step rail"; "line or RVG code" becomes "RVG code". The anaesthetist may change the price where the Contract allows. Changing the Contract clears a typed price; otherwise a typed price sticks (links US-04.3.8, US-05.2.8). | Verify (unchanged) | Notes 2026-11-05 · Donald contract model decisions #7 #9 #16 |
| [FT-03.5](../stories/FT-03.5.md) | Anaesthetist adjustment | Summary rewritten: the override is a setting on each Contract and exists only on RVG pricing kinds, never on a fixed price or a prepaid Contract. On No contract · Fixed price the anaesthetist types the amount. The office can change a price until AUTHORISED, or until a prepayment invoice is raised (our reading, AR-58 A16). Rate, discount and BTM wording dropped; a why added. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #20; Notes 2026-11-05 · Donald contract model decisions #9 #16; Contract model proposal 2026-11-05 L569-589; Contract model proposal 2026-11-05 L1122 |
| [US-03.1.8](../stories/US-03.1.8.md) | See the prepaid amount on the Booking | The amount shown is the price when the prepayment invoice was raised, read-only from then on, linked to setting the prepaid amount (US-06.2.2). Wording to D9; the story's rule is unchanged. | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 #16 |
| [US-03.1.9](../stories/US-03.1.9.md) | Booking descriptions and Contract shown together | Procedure text follows meeting #30: the AC "Hospital's wording replaces" replaces "Fuller wording kept". The step rail is now decided (D7): the Contract comes first, and typing an RVG code finds Contracts by their default RVG code; on a fixed or open price the RVG code shows only where one was picked for reference. Pricing-basis examples now include "RVG less 10%" and "Other price $2,000". Contract line wording removed. | Verify (unchanged) | Notes 2026-11-05 · AA meeting with Ben and Vanessa #12 #30; Notes 2026-11-05 · Donald contract model decisions #7 #9 #16 |
| [US-03.1.10](../stories/US-03.1.10.md) | Booking total on the office's Booking page | New story under FT-03.1: the office's Booking page shows the total of all its Procedures, each Procedure's price and its events, with the means to change any price from there. From meeting #32. | new, Proposed | Notes 2026-11-05 · AA meeting with Ben and Vanessa #32 |
| [US-03.3.1](../stories/US-03.3.1.md) | Choose the RVG code, with starting units | The RVG code is required on RVG pricing kinds and optional on a fixed or open price; the Contract's default RVG code fills it only when empty. Line references dropped from bullets, ACs, Technical discussion and Notes. A Contract change now clears a typed price and keeps units. Notes on OQ-62 and OQ-106 updated (the default RVG code was on a Contract line, now on the Contract). | Verify (unchanged) | OQ-106; Notes 2026-11-05 · AA meeting with Ben and Vanessa #21; Notes 2026-11-05 · Donald contract model decisions #4 #9 #16 |
| [US-03.3.3](../stories/US-03.3.3.md) | Record anaesthetic start and finish times | New description paragraph: times are required on RVG pricing kinds and not asked for on a fixed or open price (D9). Notes keep the history: optional until 5 November. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #9 #16 |
| [US-03.3.4](../stories/US-03.3.4.md) | Choose optional modifiers, each with a short explanation | Added a paragraph and an "RVG kinds only" AC: the modifiers step is asked for only on a Contract priced from RVG units (our reading, AR-58 A20). | Verify (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 #16; Contract model proposal 2026-11-05 L1135 |
| [US-03.3.9](../stories/US-03.3.9.md) | RVG detail follows the pricing kind | New story under FT-03.3: what a Procedure asks for follows its pricing kind. On RVG kinds the RVG code, times and modifiers step are required; on a fixed or open price only an optional RVG code for reference. Sets out the two routes to the same invoice for an anaesthetist who records RVG detail but charges their own price (Ben's case). | new, Verify | OQ-18; OQ-117; Notes 2026-11-05 · AA meeting with Ben and Vanessa #20 #21; Notes 2026-11-05 · Donald contract model decisions #9 #18; Contract model proposal 2026-11-05 L515-567; Contract model proposal 2026-11-05 L796-807; Contract model proposal 2026-11-05 L1135 |
| [US-03.3.10](../stories/US-03.3.10.md) | See what the price comes to | New story under FT-03.3: the anaesthetist's app shows what the Procedure's price comes to as they record it, for every Contract, read-only unless the Contract lets them change the price; visible but not prominent. From meeting #34. | new, Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #34 |
| [US-03.4.1](../stories/US-03.4.1.md) | Anaesthetist can change the Contract | Reset paragraph reworded: changing the Contract clears a typed price (our reading, AR-58 A15). The "Contract and its line" sentence is gone. New paragraph and Prepaid AC: only the office moves a Procedure onto or off a prepaid Contract, and none is offered when the anaesthetist changes a Contract (our reading, AR-58 A17). Renamed to No contract · RVG. | Verify (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 #16; Contract model proposal 2026-11-05 L1126-1127; Contract model proposal 2026-11-05 L1131 |
| [US-03.5.1](../stories/US-03.5.1.md) | Apply an anaesthetist adjustment | Rewritten as a price override on RVG Contracts that allow it, the RVG detail staying recorded; never on a fixed or prepaid price; no reason needed, flagged at review (our reading, A49). ACs reworded (Own pricing, Not allowed, Fixed price); "Fixed discount" replaced by the Contract's discount (A12). Notes add Ben (5 November) and D9. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #20; Notes 2026-11-05 · Donald contract model decisions #9 #16; Contract model proposal 2026-11-05 L569-589; Contract model proposal 2026-11-05 L1122; Contract model proposal 2026-11-05 L1158-1160 |
| [US-03.5.2](../stories/US-03.5.2.md) | BTM still recorded in full | Reworded: BTM is recorded in full on a Contract priced from RVG units, even when the price is overridden to zero; the fixed or open price case links US-03.3.9. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #9 #16 |
| [US-03.6.1](../stories/US-03.6.1.md) | Mark a Booking complete | Completion list reworded: on RVG kinds the RVG code, times and a completed modifiers step, and on every Procedure a price, not "Needs a price" (our reading, AR-58 A48; links US-05.2.8). The time and fixed-price clause and "RVG code is optional" dropped. | Verify (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 #16; Contract model proposal 2026-11-05 L1182-1183 |
| [US-03.7.4](../stories/US-03.7.4.md) | Bill a pre-op consult held in AA's room | New story under FT-03.7: AA bills through the system a pre-op consult held in AA's own room. What is billed, to whom and at what price is open (OQ-138). Not the ACC pre-op assessment. | new, Proposed | Notes 2026-11-05 · AA meeting with Ben and Vanessa #35 |
| [EP-04](../stories/EP-04.md) | Contracts | Description rewritten as a short summary plus why on the flat model: one priced item per Contract, held by a Party, billing its holder or the payer, with specialties, a funding tag, five pricing kinds (fixed price through dated price ranges), Active or Disabled, picked on the step rail, with No contract · RVG and open-price fallbacks. Holder list, who-is-billed bullets, versions, staging and the OQ-100 paragraph dropped. Artifacts: AR-58 added; AR-28 and AR-29 regions dropped. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #8 #11 #12 #15 #25; Notes 2026-11-05 · Donald contract model decisions #1 #2 #3 #4 #5 #6 #7 #8 #15 #16; OQ-131; OQ-100 |
| [FT-04.1](../stories/FT-04.1.md) | Contract catalogue | Reworded to Parties plus Contracts: one record per priced item, edited in place and audited, Active or Disabled. "Dated set of terms", header and lines, versions and retiring removed. Notes reduced to one line: bulk upload and export are Future Work (US-04.2.13, OQ-100). Links to its own children removed. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #1 #25; Notes 2026-11-05 · Donald contract model decisions #1 #4 #10 #16; OQ-100; OQ-131 |
| [US-04.1.1](../stories/US-04.1.1.md) | Typical Contract arrangements | Settings bullets and the 5-row table replaced by a 7-row table (destination, who is billed, pricing kind, override, prepaid). Any pricing kind can sit under any destination, except that Prepaid holds no RVG-priced Contract. The override exists only on RVG kinds. ACC is a funding tag; Southern Cross work sits under a hospital's SXAP Contract. Notes add Ben (5 November) and a recapture note for the screenshot. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #11 #14 #15; Notes 2026-11-05 · Donald contract model decisions #1 #2 #4 #5 #7 #8 #16; Contract model proposal 2026-11-05 L433-453 |
| [US-04.1.2](../stories/US-04.1.2.md) | Create, edit and disable Contracts | Retitled (was "Create, edit, retire Contracts"). Create, edit in place with audit, Active or Disabled (Disabled hidden from the step rail, our reading A14), nothing deleted. A fixed price changes by a price range; a rate, discount or other setting is edited in place; a setting change that must apply only from a date means a new Contract. Prepaid (our reading) and pricing kind (A36) fixed after creation. Six labelled ACs. Notes: AA's clean-up is Disabled; OQ-135; recapture screenshots. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #1 #23 #24 #25; Notes 2026-11-05 · Donald contract model decisions #1 #4 #6 #16 #22; OQ-131; Contract model proposal 2026-11-05 L105; Contract model proposal 2026-11-05 L1125; Contract model proposal 2026-11-05 L1156-1157 |
| [US-04.1.3](../stories/US-04.1.3.md) | Contract audit | Retitled (was "Contract audit and versioning"). Audits every create, edit and disable of a Party, Contract, price range, specialty, funding tag or RVG group, with values before and after; nothing deleted. Versions and lines removed; the why now rests on the pricing snapshot at AUTHORISED. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #4 #6 #11 #16 |
| [US-04.1.4](../stories/US-04.1.4.md) | AA identifier for every Contract | AA's unique code plus a separate holder reference code, searchable but not unique (our reading, A23); found by typing on the step rail (OQ-66). Line key and the v6 sentence removed. Notes add Ben's "CAT" search. ACs unchanged. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #10; Notes 2026-11-05 · Donald contract model decisions #1 #4 #16; Contract model proposal 2026-11-05 L1139 |
| [US-04.1.5](../stories/US-04.1.5.md) | Parties | Retitled (was "Contract holders"). Rewritten as the Party record: its kinds (insurer and funder separate, our reading A42), fields, billing details required only when billed (A43); who is billed and practitioner links are set on each Contract; AA's rooms are never a Party. Four new labelled ACs. Technical discussion replaced; D2 quote added. | Verify (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 #16 #17 #18; Contract model proposal 2026-11-05 L70-89; Contract model proposal 2026-11-05 L1140-1142; Contract model proposal 2026-11-05 L1168-1171 |
| [US-04.1.6](../stories/US-04.1.6.md) | Stage Contract changes for review, then submit | Retired: staged schedule changes go with the upload and versions (D10, OQ-100). Body kept; a retirement line added in Notes. | Proposed to Retired | Notes 2026-11-05 · Donald contract model decisions #1 #4 #6 #10 #16; OQ-100 |
| [FT-04.2](../stories/FT-04.2.md) | Contract definition | Rewritten as a short summary of the flat record (undated settings; only a fixed price is dated, through price ranges) plus why. Header-and-lines text, line-term bullets and the old Technical discussion removed; the OQ-131 note dropped. Artifacts: AR-29 and AR-30 regions replaced by AR-58. | Verify (unchanged) | Notes 2026-11-05 · AA meeting with Ben and Vanessa #1 #16 #24 #25; Notes 2026-11-05 · Donald contract model decisions #1 #2 #3 #4 #5 #6 #15 #16 #18; OQ-62 |
| [US-04.2.1](../stories/US-04.2.1.md) | Holder, who is billed, and where a Contract is offered | Retitled (was "Contract holder, who is billed, and where it applies"). A Party holds the Contract; the Contract bills its holder or the payer (AA and anaesthetist Contracts bill the payer, our reading A40; prepaid bills the payer, OQ-73). Link rules (A38, A39) and specialties must match. ACs: Bills its holder and Bills the payer reworded; Unlinked insurer and Link required added. Notes add Donald's one-Contract-for-several-surgeons remark and a recapture note. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #16; Notes 2026-11-05 · Donald contract model decisions #2 #4 #7 #16 #18; OQ-73; Contract model proposal 2026-11-05 L1161-1165 |
| [US-04.2.2](../stories/US-04.2.2.md) | Pricing kinds | Retitled (was "Contract pricing terms"). The five pricing kinds (A3, A36); no per-Contract units (OQ-62); the override only on RVG kinds, price only (A12). ACs: Fixed price uses the range in force; Open price added; Units and Holder references dropped. Links open-price fallbacks (US-04.3.9) and "Needs a price" (US-05.2.8). Notes: OQ-136, A21, recapture the type 1/2/3 screenshots. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #14 #20 #24; Notes 2026-11-05 · Donald contract model decisions #4 #5 #9 #16 #18 #23; Contract model proposal 2026-11-05 L114-122; Contract model proposal 2026-11-05 L1136-1138; Contract model proposal 2026-11-05 L1156-1157 |
| [US-04.2.4](../stories/US-04.2.4.md) | Contract lines | Retired: there are no Contract lines. Retirement paragraph first in Notes, pointing to US-04.2.18, US-04.2.2 and US-04.2.15. | Agreed to Retired | Notes 2026-11-05 · AA meeting with Ben and Vanessa #24 #25; Notes 2026-11-05 · Donald contract model decisions #1 #16 |
| [US-04.2.8](../stories/US-04.2.8.md) | Invoice presentation and delivery | Layout and delivery follow from the Contract and its Party: layout from whether it bills its holder or the payer (A31), delivery held on the Party (email or post, A32; other outputs OQ-114), ex GST, holder reference code printed. Portal-upload bullet dropped. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #2 #16 #17; Contract model proposal 2026-11-05 L1149-1150 |
| [US-04.2.10](../stories/US-04.2.10.md) | Contract prices effective from a date | Retired: replaced by price ranges on a fixed price (US-04.2.15). Retirement paragraph first in Notes, linking US-04.2.15 and US-05.2.8. | Open to Retired | Notes 2026-11-05 · AA meeting with Ben and Vanessa #1; Notes 2026-11-05 · Donald contract model decisions #6 #9 #16 |
| [US-04.2.11](../stories/US-04.2.11.md) | Combinations as Contracts | Retitled (was "Combinations as Contract lines"). Each combination is its own fixed-price Contract. New paragraph: fee extras on a schedule are events or additional invoices, never Contracts (A46, D10). ACs reworded, Fee extra added. Notes add Donald's add-ons remark and D10. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #22; Notes 2026-11-05 · Donald contract model decisions #1 #10 #16; Contract model proposal 2026-11-05 L1175-1178 |
| [US-04.2.13](../stories/US-04.2.13.md) | Bulk upload and export of Contracts | Retitled (was "Upload a Contract schedule"). Now: export Contracts to a spreadsheet, edit, and reload in bulk, matched by AA code (our reading, A23), audited. Alter/Replace, line keys, template and staged review removed. Answered: not in the first release (OQ-100, D10). Still under FT-04.1, still in the Future Work lane. | Proposed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #2 #26; Notes 2026-11-05 · Donald contract model decisions #10 #16; OQ-100; Contract model proposal 2026-11-05 L1139 |
| [US-04.2.14](../stories/US-04.2.14.md) | Anaesthetist's own price list Contracts | One Contract per item, held by the anaesthetist's Party, Payment type Prepaid, every range above zero; a new item is a new Contract, a price change a new range. ACs relabelled; the last AC is about price ranges. Notes: Ben's 5 November note and the D1/D6 answer to OQ-131 added; Donald's 23 October paragraph dropped. | Open to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #24; Notes 2026-11-05 · Donald contract model decisions #1 #4 #6 #9 #16 |
| [US-04.2.15](../stories/US-04.2.15.md) | Price ranges on a fixed price | New story under FT-04.2: a fixed-price Contract is priced through one or more price ranges (start date, price ex GST), no gaps or overlaps, the start may be in the past; the range in force on the procedure date gives the price, and a Procedure's price follows it until held. Backdated AC limited to un-authorised, unedited Procedures. Notes that Greg said on 23 October a Contract cannot be backdated, so the sources differ. | new, Verify | Notes 2026-09-29 · AA client meeting #25; Notes 2026-10-23 · AA meeting with Greg #53 #55 #59; Notes 2026-11-05 · AA meeting with Ben and Vanessa #1 #24; Notes 2026-11-05 · Donald contract model decisions #6 #18 #19; OQ-48; OQ-131; Contract model proposal 2026-11-05 L124-133; Contract model proposal 2026-11-05 L504-513; Contract model proposal 2026-11-05 L1117-1118 |
| [US-04.2.16](../stories/US-04.2.16.md) | Specialties on a Contract | New story under FT-04.2: a Contract carries none or more specialties from AA's list (none means every specialty); the step rail offers it only where they include the List surgeon's; no "show all". Any overlap matches (our reading, A10). | new, Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #9 #16 #18; Notes 2026-11-05 · Donald contract model decisions #3 #18; OQ-126; Contract model proposal 2026-11-05 L1119 |
| [US-04.2.17](../stories/US-04.2.17.md) | Funding tag on a Contract | New story under FT-04.2: a Contract may carry one funding tag (SXAP, HNZ, ACC). On a hospital-held Contract that bills the hospital, the tag places it under that hospital at step 2; anything else that bills a holder sits under Special, and a Contract billing the payer sits under Patient, whatever its tag (D7). | new, Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #11; Notes 2026-11-05 · Donald contract model decisions #4 #7 #18; OQ-55; Contract model proposal 2026-11-05 L433-453 |
| [US-04.2.18](../stories/US-04.2.18.md) | Holder reference code, invoice description and default RVG code | New story under FT-04.2: a Contract's holder reference code (not unique, A23), invoice description and default RVG code as undated settings; a holder's schedule becomes one Contract per item. | new, Verify | Notes 2026-10-16 · AA meeting with Greg #40; Notes 2026-11-05 · AA meeting with Ben and Vanessa #10 #24; Notes 2026-11-05 · Donald contract model decisions #1 #4 #18; OQ-18; OQ-66; OQ-103; Contract model proposal 2026-11-05 L90-112; Contract model proposal 2026-11-05 L1139 |
| [FT-04.3](../stories/FT-04.3.md) | Contract selection on a Procedure | Now summarises the decided step rail (US-04.3.8), the open-price fallback (US-04.3.9), what is offered on a List (US-04.3.2) and the anaesthetist's change (US-03.4.1). Lines, "No contract (RVG) first", default-RVG narrowing and the 4 November guess dropped. Notes moved to US-04.3.2. | Verify (unchanged) | OQ-93; Notes 2026-11-05 · AA meeting with Ben and Vanessa #9 #10 #12 #13 #14 #16 #18; Notes 2026-11-05 · Donald contract model decisions #3 #7 #8 #16 |
| [US-04.3.1](../stories/US-04.3.1.md) | Exactly one Contract per Procedure | Technical discussion only, to the flat model (no line; "Needs an invoice destination" linked to the step rail). Artifacts: AR-29 and AR-30 regions dropped, AR-58 added. The rule is unchanged. | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #1 #9 #16 |
| [US-04.3.2](../stories/US-04.3.2.md) | Contracts offered on a List | Retitled (was "Filtered Contract list"). Rewritten to the candidate rule: Active, the List's hospital, a linked practitioner or an unlinked AA, insurer or funder Contract, matching specialties, a price range in force (A9); no "show all"; insurance never narrows and the funder only suggests. Search on name, holder reference code, invoice description, AA code and default RVG code. ACs: Specialty, Disabled, No show all added. A38, A39 and A10 marked our reading. Notes moved in from FT-04.3. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #9 #10 #16 #18; Notes 2026-11-05 · Donald contract model decisions #3 #7 #16 #18; Contract model proposal 2026-11-05 L415-431; Contract model proposal 2026-11-05 L1117-1119; Contract model proposal 2026-11-05 L1153-1154; Contract model proposal 2026-11-05 L1161-1164 |
| [US-04.3.3](../stories/US-04.3.3.md) | No contract · RVG | Retitled (was "No contract (RVG) always offered first"). Held by AA, bills the payer, offered on every List, pinned first under Patient › Standard. "No default Contracts" replaced by the open-price fallbacks (D8, partly reversing OQ-78). ACs relabelled; the 4 November guess note replaced by the 5 November decision. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #3; Notes 2026-11-05 · Donald contract model decisions #7 #8 #16 |
| [US-04.3.4](../stories/US-04.3.4.md) | Admin sets Contracts at booking setup | First paragraph reworded to the step rail, "Needs an invoice destination" and prepaid Contracts; the "guess" sentence dropped. "Billing route" becomes "who pays". First AC now "Needs an invoice destination". Ben's 5 November note added. Carries Payment type through the step rail. | Verify (unchanged) | Notes 2026-11-05 · AA meeting with Ben and Vanessa #10 #12 #13; Notes 2026-11-05 · Donald contract model decisions #1 #7 #16 |
| [US-04.3.5](../stories/US-04.3.5.md) | Contract locked at AUTHORISED | The snapshot now copies the Contract's settings, the price range in force, units, unit rate, price and billable party. The price following its Contract until held (D9) and "Needs a price" blocking AUTHORISED (our reading, A48) are in Technical discussion, so the agreed description holds. Link to US-04.2.10 dropped. | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 #11 #16; Contract model proposal 2026-11-05 L181-196; Contract model proposal 2026-11-05 L1182-1183 |
| [US-04.3.7](../stories/US-04.3.7.md) | Procedure not on the hospital's schedule | Retitled (was "Procedure not on the Contract's schedule"). Rewritten to the hospital and funding tag fallback through "Other price", reachable when the specialty filter empties the hospital (A6). Outcomes: No contract · RVG, the hospital's RVG Contract, or a new hospital-held tagged fixed-price Contract. Says the fallback is the first-release route and only the confirm-with-hospital flag is Future Work; stays in the Future Work lane. | Proposed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #11; Notes 2026-11-05 · Donald contract model decisions #7 #8 #16; Contract model proposal 2026-11-05 L1110-1112 |
| [US-04.3.8](../stories/US-04.3.8.md) | Step rail: where the invoice goes, then the Contract | New story under FT-04.3: the step rail. Where does the invoice go (Patient, the List's hospital or Special, worked out from each Contract's settings, never stored), then Payment type (Standard first, then Prepaid) or the hospital's funding tags, then the Contract by typing, with No contract · RVG pinned first or "Other price". No RVG under Prepaid; "Needs an invoice destination" until picked. | new, Verify | Notes 2026-11-04 · Donald working decisions #9; Notes 2026-11-05 · AA meeting with Ben and Vanessa #8 #12 #13 #15; Notes 2026-11-05 · Donald contract model decisions #1 #7 #18; OQ-25; Contract model proposal 2026-11-05 L433-479; Contract model proposal 2026-11-05 L1110-1116 |
| [US-04.3.9](../stories/US-04.3.9.md) | Open-price fallbacks and the Other price toggle | New story under FT-04.3: every invoice destination has exactly one system-made open-price fallback (No contract · Fixed price, Prepaid · Fixed price, one per hospital and tag, one per Special holder), picked by the "Other price" toggle with the amount typed. Office-only edits; the anaesthetist types amounts only on No contract · Fixed price (A37). Partly reverses OQ-78. | new, Verify | OQ-78; Notes 2026-11-05 · AA meeting with Ben and Vanessa #3 #14; Notes 2026-11-05 · Donald contract model decisions #7 #8 #18; Contract model proposal 2026-11-05 L481-502; Contract model proposal 2026-11-05 L1102-1109; Contract model proposal 2026-11-05 L1151-1152; Contract model proposal 2026-11-05 L1158-1160 |
| [US-04.3.10](../stories/US-04.3.10.md) | Suggested path from the Booking's funder | New story under FT-04.3: the step rail marks one path "Suggested" from the Booking's funder (no funder: Patient › Standard; a funder that holds a Contract: Special › that holder; otherwise the hospital's tag that names the funder), never narrowing. Test order and the no-funder case are our reading. | new, Verify | OQ-55; OQ-93; Notes 2026-11-05 · Donald contract model decisions #7 #18; Contract model proposal 2026-11-05 L144-152; Contract model proposal 2026-11-05 L1143; Contract model proposal 2026-11-05 L687-691 |
| [US-04.3.11](../stories/US-04.3.11.md) | A moved Booking keeps its Contracts | New story under FT-04.3: a moved Booking keeps every Procedure's Contract; prices not held work out again on the new date; a Contract that would not be offered on the new List is flagged at office review (A41). | new, Verify | Notes 2026-11-05 · Donald contract model decisions #9 #18; Contract model proposal 2026-11-05 L515-567; Contract model proposal 2026-11-05 L1166-1167 |
| [US-05.1.1](../stories/US-05.1.1.md) | RVG groups | Contract line references removed; base units live on the RVG group alone and a Contract states none of its own (OQ-62; our reading, A22). No contract · RVG is the built-in default, pinned first under Patient › Standard. Artifact link moved from AR-30#rvg-group to AR-61#rvg-group; the text keeps the v6 ERD link beside AR-61. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #4 #5 #16; Contract model proposal 2026-11-05 L1138 |
| [FT-05.2](../stories/FT-05.2.md) | Unit and fee calculation | A one-paragraph summary plus why: pricing kinds, the rate, the discount, and what holds the price (links US-05.2.8, US-04.2.15, US-04.3.9). Contract line, version and "discount held on the Procedure" wording removed. Technical discussion points at AR-58 section 5.7; the v6 resolver is historical. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #5 #6 #9 #16; Contract model proposal 2026-11-05 L515-567 |
| [US-05.2.1](../stories/US-05.2.1.md) | Per-unit pricing rate | Renamed to No contract · RVG; "does not set a fixed fee or its own rate" becomes "is priced from RVG units and its Contract does not set its own rate". Rule unchanged. | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #5 #8 |
| [US-05.2.5](../stories/US-05.2.5.md) | Fixed fee schedule pricing | The price is the price range in force, or the typed amount on an open-price fallback; an RVG code can be kept for reference; "Needs a price" paragraph (US-05.2.8). The Contract's override flag removed from the description and AC; Open price AC added. Time-band note: one Contract per band (OQ-89). | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #5 #6 #8 #9 #16 |
| [US-05.2.6](../stories/US-05.2.6.md) | RVG at the Contract's rate | Retitled (was "Fixed rate Contracts"). The rate is undated and an edit reaches every Procedure not yet held (A13); a dated change means a new Contract; nobody changes the rate on a Procedure (A12). | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #4 #5 #16; Contract model proposal 2026-11-05 L1122-1124 |
| [US-05.2.7](../stories/US-05.2.7.md) | GST | Wording only: "Contract holders" becomes "holders". | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #5 |
| [US-05.2.8](../stories/US-05.2.8.md) | A Procedure's price follows its Contract until held | New story under FT-05.2: an unedited Procedure's price follows its Contract (the range in force, the rate or discount as they stand, A13); a typed price, a prepaid amount and AUTHORISED hold it; changing the Contract clears a typed price (A15); "Needs a price" blocks completion and AUTHORISED (A48); no automatic difference invoice. | new, Verify | OQ-48; OQ-104; Notes 2026-11-05 · Donald contract model decisions #9 #18; Contract model proposal 2026-11-05 L515-567; Contract model proposal 2026-11-05 L1123-1124; Contract model proposal 2026-11-05 L1126-1127; Contract model proposal 2026-11-05 L1182-1183 |
| [US-05.3.1](../stories/US-05.3.1.md) | Multi-procedure BTM rule | New paragraph: the multi-procedure rule adjusts only RVG-priced Procedures, which share the modifier split (our reading, A19); on a mixed Booking whose primary has a fixed or open price, no base units until OQ-132 is answered. Modifier split AC reworded to match. D11 note added. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #5; Notes 2026-11-05 · Donald contract model decisions #11 #12 #16; OQ-132; Contract model proposal 2026-11-05 L1133-1134 |
| [FT-05.4](../stories/FT-05.4.md) | Changes to a Procedure's price | "Price, rate or discount" becomes "price"; the anaesthetist only on RVG Contracts whose setting allows it; a prepaid price is read-only once its invoice is raised (A16). | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #5 #9; Contract model proposal 2026-11-05 L1122; Contract model proposal 2026-11-05 L1128-1130 |
| [US-05.4.1](../stories/US-05.4.1.md) | Apply anaesthetist adjustment | Now a typed price only, on a Contract priced from RVG units whose setting allows it; never on a fixed or prepaid price; RVG detail and computed price kept; on No contract · Fixed price the anaesthetist types the amount; flagged at review (A49). Rate and discount wording dropped; Ben (5 November) and D9 noted. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #20; Notes 2026-11-05 · Donald contract model decisions #8 #9 #16; Contract model proposal 2026-11-05 L1184-1186 |
| [US-05.4.2](../stories/US-05.4.2.md) | Office can change any price | Price only; new exception: a prepaid price is read-only once the prepayment invoice is raised (our reading, A16), narrowing Greg's 28 October wording. New AC Prepaid after invoice. The override setting exists only on RVG Contracts; review flag note (A49). Greg's 28 October words no longer in quote marks (a paraphrase). | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #9 #16 #17; Contract model proposal 2026-11-05 L1122; Contract model proposal 2026-11-05 L1128-1130; Contract model proposal 2026-11-05 L1184-1186 |
| [US-05.4.3](../stories/US-05.4.3.md) | RVG less the Contract's discount | Retitled (was "Fixed discount Contracts"). The discount is undated (D5); the anaesthetist cannot edit it and has no discount of their own (A12); the AC no longer depends on the Contract's override setting. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #5 #16; Contract model proposal 2026-11-05 L114-122; Contract model proposal 2026-11-05 L1122 |
| [FT-05.5](../stories/FT-05.5.md) | ACC | Wording: ACC is a holder's Contract carrying the ACC funding tag, priced from RVG units. Moved to Verify by the reviewer because D4 changes its substance, as on US-05.5.1. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #4 |
| [US-05.5.1](../stories/US-05.5.1.md) | ACC through the holder's Contract | ACC is a funding tag on a holder's Contract, not a kind of Contract (D4); "contract holder" becomes "holder" in text and caption. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #4 #16 |
| [EP-06](../stories/EP-06.md) | Prepayment | The prepaid amount is the Procedure's price when the prepayment invoice is raised, above zero, then read-only for the office too (our reading, A16); a typed amount route added (US-06.2.6); a new price range does not move it. Link to the office price change dropped. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #14; Notes 2026-11-05 · Donald contract model decisions #9 #16; Contract model proposal 2026-11-05 L1128-1130 |
| [FT-06.2](../stories/FT-06.2.md) | Prepayment trigger and amount | Rewritten: picked on the step rail; a prepaid Contract bills the payer (our reading, A2; OQ-73); a fixed price above zero or a typed amount (Prepaid · Fixed price), never priced from RVG units. A why added. Notes moved to US-06.2.2. | Agreed to Verify | OQ-73; Notes 2026-11-05 · AA meeting with Ben and Vanessa #13 #14; Notes 2026-11-05 · Donald contract model decisions #4 #7 #8 #16 #20 |
| [US-06.2.1](../stories/US-06.2.1.md) | Detect prepayment requirement | The prepayment is invoiced to the payer on the Booking; a prepaid Contract always bills the payer (our reading, A2; OQ-73 awaits confirmation). The holder-billed clause dropped. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #2 #4 #7 #20; Contract model proposal 2026-11-05 L1100-1101 |
| [US-06.2.2](../stories/US-06.2.2.md) | Set the prepaid amount | The amount is the price range in force on the procedure date, or the typed amount (US-06.2.6), read-only once the invoice is raised (A16). ACs relabelled and rewritten; Read-only AC added. Line and practitioner-ID wording dropped; a new range does not move it once invoiced. Quotes moved in from FT-06.2; Ben's 5 November note added. | Agreed to Verify | Notes 2026-10-16 · AA meeting with Greg #4 #20; Notes 2026-11-05 · AA meeting with Ben and Vanessa #14; Notes 2026-11-05 · Donald contract model decisions #4 #6 #9 #16; Contract model proposal 2026-11-05 L1128-1130 |
| [US-06.2.6](../stories/US-06.2.6.md) | A prepaid amount from outside any price list | New story under FT-06.2: the office picks Patient › Payment type: Prepaid, flips "Other price" (Prepaid · Fixed price) and types the amount, above zero, which becomes the prepaid amount when the invoice is raised and is then read-only (A16, A17). From Ben's "two grand" case. | new, Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #8 #14; Notes 2026-11-05 · Donald contract model decisions #7 #8 #18; OQ-25; OQ-96; Contract model proposal 2026-11-05 L787-794; Contract model proposal 2026-11-05 L1128-1131 |
| [US-06.3.1](../stories/US-06.3.1.md) | Raise the prepayment invoice | The amount is the Procedure's price when raised and becomes the prepaid amount; the payer is the person on the Booking; a prepaid Contract always bills the payer (A2; OQ-73). Holder-billed clause dropped; AC 2 reworded; Technical discussion drops is_prepay. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #2 #7 #16 #20; Contract model proposal 2026-11-05 L1100-1101; Contract model proposal 2026-11-05 L1128-1130 |
| [US-06.3.5](../stories/US-06.3.5.md) | Re-check when the Booking changes | Notes: "relink" becomes "a new price range does not move it once its prepayment invoice is raised"; a moved Booking keeps every Procedure's Contract (links US-04.3.11). | Verify (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 #16 |
| [US-06.3.6](../stories/US-06.3.6.md) | Prepayment letter template | Wording only: the template states the prepaid amount (a price from a prepaid Contract, or one the office typed). | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 #16 |
| [US-06.4.1](../stories/US-06.4.1.md) | Nothing further after a prepaid procedure | Trimmed to the price on the issued prepayment invoice; read-only for the office too once the invoice is raised, any difference raised by hand (A16). Price-override AC kept. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #9 #16; Contract model proposal 2026-11-05 L1128-1130 |
| [US-06.5.4](../stories/US-06.5.4.md) | Prepaid Booking moved to another anaesthetist | Notes only: "relink" becomes "a new price range does not move it". | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 |
| [US-07.2.2](../stories/US-07.2.2.md) | Office review of Contracts and references | The Booking's insurer or funder only suggests a path on the step rail; SXAP is a funding tag on the hospital's Contracts. New bullets: review flags (our reading, A49: a Contract the anaesthetist changed, a price typed on a Contract that is not an open price shown beside the computed price, a Contract that no longer fits after a move) and Procedures still needing an invoice destination or a price. The existing AC is labelled Payer shown; a Review flags AC is added. Notes: OQ-135. Captions drop "route". | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #12; Notes 2026-11-05 · Donald contract model decisions #4 #7 #9 #16; Contract model proposal 2026-11-05 L1184-1186 |
| [US-07.3.1](../stories/US-07.3.1.md) | Authorise the List | Wording only: "the Contract versions selected" becomes "the Contracts selected for them, copied into each Procedure's pricing snapshot". | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 #11 |
| [US-08.1.1](../stories/US-08.1.1.md) | Process an AUTHORISED List using each Procedure's locked Contract | The engine does not itself work out who pays: the holder Party when the Contract bills its holder, otherwise the payer. AC and Technical discussion reworded to match. | Proposed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 #11 #16 |
| [US-08.2.1](../stories/US-08.2.1.md) | Group by billable party | Notes: No contract · RVG is the one built-in default Contract, and since 5 November each invoice destination also has one system-made open-price fallback (D8, partly reversing OQ-78). | Verify (unchanged) | Notes 2026-11-05 · Donald contract model decisions #8 |
| [US-08.2.2](../stories/US-08.2.2.md) | Prepaid Procedures left off the final invoice | Notes only: "prepaid Contract's line" becomes "prepaid Contract" (reviewer fix; no source added). | Agreed (unchanged) | none added |
| [US-08.4.1](../stories/US-08.4.1.md) | Generate invoice documents | Two layouts: the holder's when the Contract bills its holder, the patient's when it bills the payer (our reading, A31, in a new Notes section). Lines print the holder reference code (US-04.2.18). | Proposed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 #16; Contract model proposal 2026-11-05 L1149 |
| [US-08.4.2](../stories/US-08.4.2.md) | Send to the invoice email | Where the Contract bills the payer the invoice goes to the Booking's invoice email; an invoice to a holder goes by the delivery method on its Party (email or post for now, our reading A32; other outputs OQ-114). Portal-upload sentence replaced; Notes added. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #2 #17; OQ-114; Contract model proposal 2026-11-05 L1150 |
| [US-08.4.4](../stories/US-08.4.4.md) | Invoice reproducibility | Reproducible from the Procedure data and the copy of its Contract's settings locked in at the time, even after the Contract is edited. | Proposed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #9 #11 #16 |
| [US-08.4.6](../stories/US-08.4.6.md) | Invoice description on each Procedure | "Contract line" becomes "Contract" throughout; kept apart from the procedure text, which the hospital's text replaces. An admin's edit always wins (OQ-130): new ACs Edit wins over a late description and Edit wins over a Contract change; "Received texts unchanged" becomes "Procedure text unchanged". Related: US-04.2.4 replaced by US-04.2.18. Notes record Ben agreeing the hospital's text goes on the invoice (#30) and Donald's ruling. | Agreed to Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #4 #30; Notes 2026-11-05 · Donald contract model decisions #13 #16; OQ-130 |
| [US-08.6.4](../stories/US-08.6.4.md) | Split a combined Procedure into additional invoices | A combined procedure is billed on a fixed-price Contract of its own (US-04.2.11; OQ-53 updated). Extras on a schedule are ad-hoc invoices or events, never Contracts (D10). | Agreed (unchanged) | OQ-53; Notes 2026-11-05 · Donald contract model decisions #1 #10 #16 |
| [EP-10](../stories/EP-10.md) | Payments, disbursement and AA fees | Wording only: "some hospital contract holders paid anaesthetists directly" becomes "some hospitals paid anaesthetists directly". | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 |
| [FT-10.1](../stories/FT-10.1.md) | Single payment destination | Wording only: "Hospital contract holders" becomes "Some hospitals". | Proposed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 |
| [EP-11](../stories/EP-11.md) | Patients and billable parties | Insurers and funders are Parties like any other holder; the Contract bills its holder or the payer named on the Booking; a Booking names its insurer or funder. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #2 |
| [FT-11.2](../stories/FT-11.2.md) | Who is billed: holder or the payer on the Booking | Bullets rewritten: a Contract set to bill its holder bills the holder Party; otherwise the payer (No contract · RVG, a surgeon's fixed fee, an anaesthetist's own Contract, every prepaid Contract, our reading A2; OQ-73). Acceptance criteria removed (features carry none; covered by US-04.2.1, US-11.2.1, US-11.2.2). ERD link moved from AR-30#contract-holder to AR-61#who-is-billed. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #2 #8 #16; OQ-73; Contract model proposal 2026-11-05 L1100-1101 |
| [US-11.2.1](../stories/US-11.2.1.md) | Patient billed when the Contract does not bill its holder | Renamed to No contract · RVG; a surgeon's fixed-price Contract bills the payer; new bullet: No contract · Fixed price and every prepaid Contract (our reading, A2; OQ-73). Moved to Verify by the reviewer for that bullet. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #2 #8; OQ-73; Contract model proposal 2026-11-05 L1100-1101 |
| [US-11.2.2](../stories/US-11.2.2.md) | Payer on the Booking, editable to a guardian | Wording: No contract · RVG; "any Contract set to bill the payer"; AC 3 "a Contract that bills its holder". | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 |
| [US-11.2.3](../stories/US-11.2.3.md) | Payer email or postal address required when the payer is billed | Wording: a holder billed by its Contract is not affected, its delivery details being on its Party; AC 3 reworded. | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 |
| [US-11.2.4](../stories/US-11.2.4.md) | Warn when a child is the payer on the Booking | Wording: "a holder whose Contract bills it"; AC 2 reworded. | Agreed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 |
| [FT-11.3](../stories/FT-11.3.md) | Patient outstanding balances and alerts | Source added only, no wording change. | Agreed (unchanged) | Notes 2026-11-05 · AA meeting with Ben and Vanessa #36 |
| [US-11.3.2](../stories/US-11.3.2.md) | Alert on booking a patient with unpaid bills | "Still to check with Ben" replaced: Ben and Vanessa restated the rules on 5 November and changed neither. Rules, thresholds and ACs unchanged. | Agreed (unchanged) | Notes 2026-11-05 · AA meeting with Ben and Vanessa #6 #36 |
| [US-11.4.3](../stories/US-11.4.3.md) | Insurance and approval number on the Booking | The Booking names its insurer or funder as a Party; it only suggests a path (US-04.3.10) and never narrows the Contracts offered. The missing-approval-number warning applies only to an insurer (NIB, Southern Cross Health Society), not ACC or Health NZ (our reading, A42). SXAP is a funding tag. New Funder AC; Notes cite OQ-136. | Verify (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 #7 #16 #23; Contract model proposal 2026-11-05 L1168-1169 |
| [FT-12.2](../stories/FT-12.2.md) | Reporting for anaesthetists | Wording only: the ledger records "what is owed by payers and the Parties AA bills". | Proposed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 |
| [US-13.4.1](../stories/US-13.4.1.md) | Maintain reference tables | "Contract holders" become Parties (insurers and funders among them); specialties and funding tags added; Contracts kept with their price ranges; "a new dated version" becomes an audited edit. | Agreed to Verify | Notes 2026-11-05 · Donald contract model decisions #2 #3 #4 #6 #16 |
| [US-13.4.3](../stories/US-13.4.3.md) | Reference data loaded at cutover | The cutover load lists Parties, Contracts one per priced item with their price ranges, specialties, funding tags and each surgeon's specialties. Bulk upload and export are Future Work (US-04.2.13; OQ-100 answered). | Proposed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #3 #4 #10 #16; OQ-100 |
| [US-13.4.4](../stories/US-13.4.4.md) | Specialties | New story under FT-13.4: AA's list of broad specialties, no subspecialties, used by surgeons and Contracts, every change audited; anaesthetists have no specialty. Starting list is our reading (A11). | new, Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #16 #19; Notes 2026-11-05 · Donald contract model decisions #3 #18; Contract model proposal 2026-11-05 L135-142; Contract model proposal 2026-11-05 L1120-1121 |
| [US-13.4.5](../stories/US-13.4.5.md) | Funding tags | New story under FT-13.4: the funding tag list (SXAP, HNZ, ACC) in step-rail order; a tag may name its funder, which lets the Booking's funder suggest a path (our reading, A25). | new, Verify | Notes 2026-11-05 · Donald contract model decisions #4 #18; Contract model proposal 2026-11-05 L144-152; Contract model proposal 2026-11-05 L1143 |
| [FT-13.6](../stories/FT-13.6.md) | Surgeons and surgeons' rooms | First sentence: each surgeon belongs to one or more rooms, holds one or more specialties and has a profile page. | Verify (unchanged) | Notes 2026-11-05 · Donald contract model decisions #3 |
| [US-13.6.2](../stories/US-13.6.2.md) | Surgeon profile | Profile gains the surgeon's specialties (usually one, at least one). The specialty recommendation note now says it is required (D3); the address book search stays OQ-126. | Verify (unchanged) | Notes 2026-11-05 · AA meeting with Ben and Vanessa #7; Notes 2026-11-05 · Donald contract model decisions #3 #16 |
| [US-13.6.6](../stories/US-13.6.6.md) | Surgeon specialties | New story under FT-13.6: a surgeon holds a list of specialties, usually one and at least one, which decides the Contracts offered on their Lists. D3, on Donald's authority; Ben answered "No" to several specialties, so AA must confirm. Any overlap matches (our reading, A10). | new, Verify | Notes 2026-11-03 · Ben specialist list email #5; Notes 2026-11-05 · AA meeting with Ben and Vanessa #7 #16 #17 #18; Notes 2026-11-05 · Donald contract model decisions #3 #18; OQ-126; Contract model proposal 2026-11-05 L1119 |
| [EP-15](../stories/EP-15.md) | Non-functional requirements | Technical discussion: the support hours and SLA bullet is replaced by a pointer to US-15.0.8 (reviewer fix; no source added). | Proposed (unchanged) | none added |
| [US-15.0.5](../stories/US-15.0.5.md) | Testable billing rules | Wording only: "a billing route that can fall back" becomes "who is billed falling back to another party when a hospital disputes or fails to pay". | Proposed (unchanged) | Notes 2026-11-05 · Donald contract model decisions #2 |
| [US-15.0.7](../stories/US-15.0.7.md) | Changes show without signing out | New story under EP-15: the anaesthetist sees an office or hospital change to a Booking or List without signing out, at the latest on going back to the List and reopening the Booking or refreshing. Donald committed to no sign-out, not to how the refresh works. | new, Verify | Notes 2026-11-05 · AA meeting with Ben and Vanessa #31 |
| [US-15.0.8](../stories/US-15.0.8.md) | Help desk by phone and email | New story under EP-15: AA's office staff reach the Stratos help desk by phone or email, each request logged as a ticket; a request for something the system does not yet do is planned as a new feature. Support hours wait on OQ-137; the RFP response's hours, channels and response targets are in Technical discussion. Stays Open on OQ-137. | new, Open | RFP response p.32 · Support and Ongoing Partnership › Support Hours; RFP response p.32 · Support and Ongoing Partnership › User Support; RFP response p.32 · Support and Ongoing Partnership › Support Channels; RFP response p.33 · Support and Ongoing Partnership › Service Levels; Notes 2026-11-05 · AA meeting with Ben and Vanessa #39 |

Nothing was moved to another parent, epic or lane. Content moved inside features: FT-04.3's Notes
went to US-04.3.2, FT-06.2's quotes to US-06.2.2, and EP-15's support hours to US-15.0.8; FT-11.2's
acceptance criteria were removed because features carry none.

**Not part of this update:** [US-03.1.4](../stories/US-03.1.4.md) "Each app used for what it does
best" shows Verify to Agreed in the working tree. That is the user's own board edit, made before this
run, with no content change.

**Link pass:** `links:apply` added 35 text links and related entries across 29 items (see
`requirements-board/.links/links-report.md`). Seven items changed only through it and are left out of
the table: FT-10.2, US-02.6.1, US-07.1.1, US-07.2.1, US-10.3.2, US-11.1.1 and US-14.6.2.

**`domain-model.md`:** Donald rewrote its Contract parts before this run (Party, flat Contracts,
specialties, funding tags, pricing kinds, price ranges, fallbacks, the step rail). This run added only
the meeting's other matters:

- Slot, List and Draft List: a "Proposed" bullet for a session split between two surgeons (the one
  List per Slot rule and the ERD stand until it is agreed), and an out-of-hours List bullet.
- Booking: the procedure-text bullet now says the hospital's text replaces the rooms'; the change
  history bullet covers the history screen (who, when, what, including replaced procedure text);
  a new bullet on pre-op consults in AA's room (OQ-138).
- Procedure: "Received descriptions" becomes "Procedure text" (replaced, not kept side by side; the
  replaced text stays in the change history). The invoice description now says an admin's edit always
  stands (OQ-130, Donald's ruling).
- Field table and glossary: "procedure text, invoice description" row; new "Out-of-hours List" row;
  "Source wording" and "Invoice description" rows updated.

## 4. New questions

- **[OQ-132](../questions/OQ-132.md), Base units on a mixed Booking whose primary has a fixed price**
  (Donald). Raised by Donald on 5 November with the proposal (section 11.2 point 5), before this run;
  this run added the note sources. Keep base units on the primary only, give them to the first
  RVG-priced Procedure, or mark a different primary. Until answered, base units go only on the
  primary. Affects US-05.3.1 and US-03.2.1.
- **[OQ-133](../questions/OQ-133.md), Procedures affected by a backdated price or a dated change**
  (Donald to ask Vanessa). Does the office want a list of the Procedures a new price range re-prices,
  or that stay on the old Contract after a dated change? Until answered, no list. Affects US-04.2.15,
  US-05.2.5, US-04.1.2 and FT-05.2. (A draft OQ-133 about a safe copy of the contracts was deleted in
  this run; the number was reused.)
- **[OQ-134](../questions/OQ-134.md), Do overdue alerts include the outstanding prepayment alert**
  (Donald). D10 puts "overdue alerts" outside the contract model; recommendation: two rules, shown
  together. Affects US-06.3.2, US-11.3.2, FT-12.2 and US-12.2.1.
- **[OQ-135](../questions/OQ-135.md), Review flag for a Disabled Contract on an open Procedure**
  (Donald to ask Vanessa). No flag, or a review flag that never blocks. Affects US-04.1.2, US-04.3.2
  and US-07.2.2.
- **[OQ-136](../questions/OQ-136.md), Holder references the Booking must collect** (Donald to ask
  Vanessa). Drop holder-required booking inputs for good, or add a Contract setting later. For now the
  Booking keeps only the insurer approval number (A21). Affects US-04.2.2 and US-11.4.3.
- **[OQ-137](../questions/OQ-137.md), Support hours: an 8:00am or 8:30am start** (Donald). Donald told
  Ben and Vanessa "eight o'clock to five thirty"; the RFP response offers 8:30am. Also how outages
  outside hours are handled. Affects US-15.0.8 and US-02.5.4.
- **[OQ-138](../questions/OQ-138.md), Pre-op consults in AA's room** (Donald to ask AA). Who is
  billed, how it is priced, whether it is tied to a Procedure, how often. Affects FT-03.7, US-08.6.3
  and US-03.7.4.

## 5. Diagrams

| Artifact | Title | What changed |
| --- | --- | --- |
| [AR-01](../artifacts/AR-01.md) | How the System Works Out a Price Infographic | Redrawn in place to the flat model: the running example is "Contract · St George's · HNZ, RVG less 10%"; RVG detail is required on an RVG price only; the procedure date picks the price range in force, not a version; Stage 2 separates what the Procedure holds from what the pricing kind supplies; "Needs a price" replaces the old checks; the price follows the Contract until held. Generator: `agent/skills/svg-diagram/examples/how-a-procedure-is-priced.py`. All 20 regions kept. |
| [AR-02](../artifacts/AR-02.md) | Contract selection and who pays infographic | Redrawn in place (and, after the review, its procedure text note now reads "Replaces the rooms' text when it arrives; the Booking's change history keeps the original", meeting #30): the Contracts panel is now Party, Contract settings and pricing kind (no header, lines or versions); example cards per Party coloured by invoice destination, with the open-price fallbacks and Merivale's backdated range; the procedure panel loses the line slot and shows "Needs an invoice destination"; the invoice description chain follows OQ-130. Generator: `agent/skills/svg-diagram/examples/procedure-and-contract-selection.py`. No linked region removed. |
| [AR-19](../artifacts/AR-19.md) | Mid Level AA Process | Six step-card captions reworded (who is billed, charges by pricing kind, invoice to the billable party, "Needs an invoice destination", the schedule, completion with RVG detail only on an RVG price). Shapes and regions unchanged. |
| [AR-24](../artifacts/AR-24.md) | Billing / Invoice Flow | Revised in place: the Contract key now describes one priced item and its settings; the office picks on the step rail; the override check is an RVG-only Contract setting; a Contract change clears a typed price; completion and review cards follow D9. No region removed. |
| [AR-44](../artifacts/AR-44.md) | Party, billable party and payer | Redrawn in place: "Contract holder" becomes Party; "bills its holder or the payer" is the Contract's setting; the old pick-the-holder steps become the step rail; "another payer, such as a family trust" added. All linked regions kept, re-anchored. |
| [AR-52](../artifacts/AR-52.md) | Where the money goes, prepaid or not | One caption: the prepaid flow now starts "The office picks a Contract under Payment type: Prepaid". Money flow and all 22 regions unchanged. |
| [AR-61](../artifacts/AR-61.md) | Contract model ERD (flat Contracts) | New. The flat model's ERD (16 entities: Party, Contract, pricing kind, price range, specialty, funding tag, invoice destination, linked practitioners, RVG group, Procedure and more). Drawn first as a mermaid erDiagram, then rebuilt during review as a hand-drawn SVG in the house style (`artifacts/files/AR-61.svg`). Supersedes AR-30. |
| [AR-30](../artifacts/AR-30.md) | Contract pricing model ERD | Superseded by AR-61 (`superseded_by: AR-61`, with a historical note). FT-11.2 and US-05.1.1 now point at AR-61 regions; the retired US-04.2.4 and US-04.2.10 keep their AR-30 links. AR-29 and AR-33 sidecars now name AR-30 as superseded by AR-61. |

Checked and still current: AR-17, AR-18, AR-21, AR-22 and AR-25.

## 6. Points with no requirement change

- **Meeting #6 and #36 (the 90-day and credit-balance alerts):** restated, not re-decided. OQ-33 and
  OQ-74 stand; US-11.3.2 notes it.
- **Meeting #19 (anaesthetists' pain work):** it does not go through AA ("it kind of doesn't"), so no
  anaesthetist specialty is needed.
- **Meeting #22 (add-ons, pain work by ad-hoc invoice):** Donald's proposal with no answer from AA.
  Extras are already events or additional invoices (FT-03.7, US-08.6.3); US-04.2.11 and OQ-53 carry
  D10.
- **Meeting #23 (AA removes procedures it does not use):** that is setting Contracts to Disabled, in
  US-04.1.2. No separate item.
- **Meeting #27 (a safe copy of the contracts outside the system):** Donald: covered by the
  requirement to export to a spreadsheet, so no question. Recorded in OQ-100. See section 7.
- **Meeting #32 (an amended invoice reaching the anaesthetist and the hospital):** covered by credit
  in full then rebill (US-08.6.2) and data entered once (US-15.0.3). The Booking total half is
  US-03.1.10.
- **Meeting #33 (Vanessa's "overdue stages"):** OQ-59's flat outstanding list stands; she was saying
  why the history matters. Whether the anaesthetist sees the history is left open in US-02.5.8.
- **Meeting #34 against US-03.5.1, US-05.4.1 and US-03.3.4:** showing the price is the new US-03.3.10;
  their override changes come from D9.
- **Meeting #37 (next steps: new prototype, workshops, sizing):** a project matter.
- **Meeting #38 (Xero, and meeting Michael):** an action for Donald. The accountant's open questions
  (OQ-47, OQ-60, OQ-12, US-10.2.7's note) already carry Xero. See section 7.
- **Meeting #39, outage response:** left for later in the room; it is part 3 of OQ-137.
- **Decisions #14 (fee-file readings):** seed data, not requirements or questions for AA.
- **FT-04.4 and US-04.4.1 (retired default Contracts):** stay Retired; the idea returns as the
  open-price fallbacks in US-04.3.9.
- **US-04.2.3, US-04.2.5, US-04.2.6, US-04.2.7, US-04.2.9, US-04.2.12 and US-04.4.2:** already Retired.
  US-04.2.7's holder references are taken up by OQ-136.
- **US-04.3.6 (hospital data sets the Contract):** unaffected; stays Future Work.
- **US-06.3.7 and US-06.5.2:** already handle moving off a prepaid Contract (OQ-119); clearing the
  prepaid fields is build detail.
- **US-06.3.2 (outstanding prepayment alert):** stands until OQ-134 is answered.
- **EP-01, FT-01.3 and US-01.3.1:** the split session is only Proposed, so the one surgeon per List
  rule stands.
- **US-01.2.1, US-02.2.1, US-03.7.2, US-08.2.3, US-08.6.1, US-08.6.3, US-08.6.6, US-09.1.4,
  US-09.2.4, US-12.2.1, FT-03.7, FT-07.4, US-07.4.1, FT-08.6, US-15.0.2 and FT-02.1:** "version",
  "upload" or "line" in their generic senses (invoice lines, PDF upload), not a retired Contract term.
- **"Diagram: Billing route" and "RFP · Billing Route Resolution":** source citations, never reworded
  (AR-24 lists the first under `cited_as`).
- **`domain-model.md`:** US-03.3.10, US-03.1.10, US-15.0.7, US-15.0.8 and the alerts do not change the
  model.

## 7. Left for Donald

- **A safe copy of the contracts (meeting #27).** Donald said it is covered by the requirement to
  export to a spreadsheet, and OQ-100 says so, but no first-release story carries an export. The
  closest is [US-04.2.13](../stories/US-04.2.13.md) "Bulk upload and export of Contracts", which is in
  the Future Work lane. Either bring the export (or a backup and continuity requirement under EP-15)
  into the first release, or accept that the wish is not yet met.
- **Requirements carried by edited stories, not stories of their own.** Active or Disabled is carried
  by [US-04.1.2](../stories/US-04.1.2.md); Payment type by [US-04.3.8](../stories/US-04.3.8.md) and
  [US-04.3.4](../stories/US-04.3.4.md). The proposal (9.7) lists both as separate requirements.
- **[US-04.3.7](../stories/US-04.3.7.md) is in the Future Work lane** but says the fallback through
  "Other price" is the first-release route; only the flag to confirm with the hospital is Future
  Work. It may want splitting so the fallback sits in the first release.
- **[US-01.1.6](../stories/US-01.1.6.md) Out-of-hours Lists is at Verify,** though the meeting note
  calls it a new need, not designed, and the similar split session (US-01.1.5) is Proposed. Proposed
  may fit better. Both sit under FT-01.1 "Rolling canvas generation", an awkward home.
- **Screenshots show the old prototype** on EP-04, EP-03, EP-05 and EP-08 stories, among them
  US-04.1.1, US-04.1.2, US-04.2.1, US-04.2.2, US-04.3.1 to US-04.3.4, US-03.4.1, US-03.5.1, US-03.5.2,
  US-05.4.1, US-08.4.1 and US-08.4.2. The capture runner writes them from the prototype, so recapture
  once the catch-up build is in.
- **Meeting Michael about Xero** is an action for Donald; no item carries it.
- **Help desk hours conflict:** Donald's "eight o'clock to five thirty" against the RFP response's
  8:30am start is [OQ-137](../questions/OQ-137.md). US-15.0.8 stays Open on it.
- **[OQ-73](../questions/OQ-73.md) is at Confirm** on assumption A2 (a prepaid Contract always bills
  the payer). Many prepaid items (FT-06.2, US-06.2.1, US-06.3.1, FT-11.2, US-11.2.1) rest on it.
- **Surgeon specialties (D3):** a list, required, at Verify in US-13.6.6; Ben answered "No" to
  several specialties per surgeon, so AA needs to confirm.
- **US-05.3.1 and FT-05.3:** under A19 a fixed or open-price primary carries no units, so on such a
  Booking modifiers totalling 4 or fewer, which sit on the primary, are billed nowhere; this may
  belong in OQ-132. FT-05.3 (Agreed, not edited) still splits modifiers above 4 across every
  Procedure, out of step with US-05.3.1's RVG-priced-only reading.
- **US-07.2.2's "Needs an invoice destination" bullet** may never be reached at review, since a
  missing Contract blocks submission (AR-58 validation 15). Kept as the change list asked.
- **Smaller loose ends:** US-03.1.4's Notes still say "Donald left it at Verify" against its new
  Agreed status; FT-02.5 (Agreed) does not mention the new history screen (US-02.5.8); US-02.1.2 still
  links US-02.5.7 as "kept as received"; US-04.2.2 and US-04.2.13 still list v6 AR-29 regions, and
  FT-04.3, US-04.3.3 and US-04.3.4 still link AR-28 regions; EP-11 and FT-11.3 have no "This is so"
  line.

## 8. Follow-up the same day: Donald's answers

Donald answered section 7 the same evening. His words are recorded as points 24 to 27 of
[the decisions note](../notes/2026-11-05-donald-contract-model-decisions.md).

- **Safe copy of the contracts (point 25).** [US-04.2.13](../stories/US-04.2.13.md) is retitled
  "Export and re-import Contracts". It now covers:
  - exporting all of AA's Contracts, or one holder's;
  - matching rows on re-import by AA code: a matched row updates, a new code creates a Contract, and
    a Disabled row disables its Contract;
  - an import never deletes and never changes the prepaid setting or pricing kind;
  - showing what an import will change before it is applied.

  It stays Future Work, and its link to AR-29 is gone.
- **Active or Disabled (point 26).** This stays in [US-04.1.2](../stories/US-04.1.2.md), reworded:
  - a Contract that has ended is disabled, hidden from the step rail and from the default Contract
    list, and never deleted;
  - the Active filter is now the list's default.
- **[US-04.3.7](../stories/US-04.3.7.md) rewritten** as "Confirm a price with the hospital", the Future
  Work flag only. The fallback through "Other price" is [US-04.3.9](../stories/US-04.3.9.md)'s, so
  the lane question in section 7 goes away.
- **[US-01.1.6](../stories/US-01.1.6.md) Out-of-hours Lists is Confirmed (5) (point 24).** AA
  accepted it in a direct conversation with Donald; the design is still to do.
- **Greg's v6 documents retired (point 27).**
  - The board has a new artifact status, Retired (board 1.3.0): hidden from the Artifacts tab unless
    "Show retired" is on, and links to a Retired artifact warn.
  - AR-28 (executive summary v6), AR-29 (technical design v6) and AR-30 (v6 ERD, which was
    Superseded) are Retired.
  - Every live item's links to them are removed. The three retired stories US-04.1.6, US-04.2.4 and
    US-04.2.10 still mention them, since retired items are not edited.
  - The domain model still links AR-28, AR-29 and AR-30 as history; it is Donald's file and was left
    alone.
- **The proposal stays artifact AR-58.** Donald chose to keep the snapshot, which about 200 sources
  cite. CLAUDE.md now points agents at the working copy, `docs/prototype-build/contract-model-proposal.md`.
- **Voice pass.** Donald found US-04.3.7 verbose and asked for every story this update touched to
  state plainly what the system does, for whom, with a short why. All 115 items edited today were
  reviewed and 94 reworded:
  - history, meeting narrative and inline "(our reading, AR-58 An)" markers moved out of
    descriptions;
  - each reading is now a single "Our readings (contract model proposal)" line in Notes;
  - features and epics cut to short summaries;
  - missing why lines and acceptance-criterion labels added.

  No requirement, acceptance criterion, status or source changed. Each batch had an independent
  reviewer, who restored the few details an editor had dropped.
