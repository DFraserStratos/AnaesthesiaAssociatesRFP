# Donald's contract model decisions, 2026-11-05

- **Who:** Donald Fraser (Stratos, product owner), in a question-and-answer session with Claude after
  the 5 November meeting with Ben and Vanessa over the contract picker mock. Greg and AA have not seen
  them yet.
- **Covered:** how Contracts are modelled from here on (D1 to D11): one record per priced item, held
  by a shared Party, with its own settings, specialties, an optional funding tag, five pricing kinds,
  dated price ranges for fixed prices, Active or Disabled status, system-made open-price fallbacks and
  a derived invoice destination driving the step rail; how a Procedure on a Booking takes and keeps its
  price; what is left out of the contract model and passed to the requirements update; three
  points added later the same day; and Donald's answers to the requirements update's open points.
- **Standing:** Donald's decisions, made for the build. They are not yet confirmed by AA or Greg, so
  the items they change go to Verify, not Agreed. They replace everything earlier on contracts: the
  Contract header and lines, contract versions, line keys, relinking, staged schedule changes and
  upload, the technical design v4 and v6 tables, and Contract types 1, 2 and 3. The proposal's
  section 11.1 assumptions (A2 to A49) are our reading where the decisions leave a gap, not
  decisions.
- **Inputs gathered here:**
  - the appendix "Donald's decisions of 5 November 2026" of the contract model proposal, filed as
    artifact [AR-58](../artifacts/AR-58.md)
    ([Contract model proposal 5 November 2026](<../artifacts/files/Contract model proposal 5 November 2026.md>)),
    a snapshot of the full design written from these decisions;
  - the meeting they follow, recorded in
    [2026-11-05-aa-meeting-with-ben-and-vanessa.md](2026-11-05-aa-meeting-with-ben-and-vanessa.md)
    from its reconciled transcript, artifact [AR-57](../artifacts/AR-57.md)
    ([AA Meeting with Ben & V 5th Nov Reconciled Transcript](<../artifacts/files/AA Meeting with Ben & V 5th Nov Reconciled Transcript.md>)).

Cite a point as `"Notes 2026-11-05 · Donald contract model decisions #n"`. Points are numbered once
across the whole note: points 1 to 11 are D1 to D11. Donald's wording is kept in quotes (the
decisions are short enough to keep essentially whole); the text around them is paraphrase.
Transcript positions are lines of AR-57, cited as "Transcript 2026-11-05 · AA meeting with Ben and
Vanessa L120-134"; positions in the proposal are its section numbers.

## Donald's decisions

1. **D1 One entity per priced item.** Donald: "Every Contract is a single record with its own
   settings: no parent schedule or price list, no contract lines. A holder's schedule document
   becomes many Contracts. Ben and Vanessa call them 'procedures'; the model and code keep the name
   Contract. UI wording follows Ben: 'Needs an invoice destination' (not 'Needs a contract'); for the
   patient, step 2 is 'Payment type: Standard / Prepaid', Standard first."
   - In the meeting Ben said "we think of them as procedures", while allowing "if you want to call
     them contracts, that's fine as well" (L363-367); Donald concluded "the best solution would be to
     have each of them be an individual thing" (L755).
   - "Needs an invoice destination" is Ben's wording (L263-283; Vanessa offered "destination", L279).
   - "Payment type" with Standard first is Donald's restatement of Ben's dislike of "not prepaid",
     "because 90% or 95% of what we do is just the normal pathway" (L293-311).
   Bears on EP-04, FT-04.1, FT-04.2, US-04.1.1, US-04.1.2, US-04.1.3, US-04.2.4, US-04.2.11,
   US-04.2.13, US-04.3.1, FT-04.3, US-04.3.2, US-04.3.4, US-04.3.7, US-06.2.2, US-07.2.2, OQ-89,
   OQ-98 and OQ-106.
2. **D2 Holder and who is billed.** Donald: "The holder is a shared Party (a hospital, insurer or
   funder, surgeon or surgeon group, anaesthetist, or AA) holding the billing name and details and how
   invoices are delivered. Each Contract says whether it bills its holder or the payer on the
   Booking." With delivery held on the Party, OQ-114 is partly answered (its other outputs stay open,
   proposal 9.3). Bears on US-04.1.5, US-04.2.1, US-04.2.8, US-08.4.1, FT-11.2, US-11.2.1, US-11.4.3,
   OQ-73 and OQ-114.
3. **D3 Specialties.** Donald: "AA keeps a list of broad specialties, with no subspecialties. A
   surgeon holds a list (usually one). A Contract holds none or more; none means every specialty. The
   picker hides Contracts whose specialties do not include the List surgeon's, with no 'show all'."
   - This follows Ben's suggestion in the meeting: "the specialty would be dictated by the surgeon...
     it would then focus or limit the pick list" (L341), broad specialties only, "general surgery
     rather than the sub-specialties" (L411-415), and a procedure such as breast reduction carrying
     two (L371).
   - Sources differ on a surgeon with more than one specialty: Ben, "It would be extraordinarily
     rare", and he would rather not allow it (L417-437); Donald, "It might be easier for our system
     just to support it... I'll leave that open in the air" (L439). D3 settles it as a list, usually
     one, on Donald's authority.
   - AA is building the specialty list in a spreadsheet (L355).
   Bears on US-13.6.2, US-13.4.1, FT-04.2, FT-04.3, US-04.3.2 and OQ-126.
4. **D4 Settings, none dated.** Donald: "holder, bills holder or payer, funding tag (optional, from an
   AA list: SXAP, HNZ, ACC, ...), specialties, linked practitioners (any number of surgeons, at most
   one anaesthetist), prepaid (a prepaid Contract appears only in the Prepaid flow), whether the
   anaesthetist may override the price, pricing kind, rate or discount, holder reference code,
   invoice description, optional default RVG code, AA code, status Active or Disabled. Every change
   is audited. Changing a setting from a date means a new Contract."
   - Active or Disabled replaces end dates and retirement; versions go. The funding tag is new; ACC
     and SXAP become tags (US-05.5.1, US-07.2.2).
   - Vanessa, in the meeting, wants to change prices by finding each one on screen: "That's what I'd
     love to do" (L737-745).
   Bears on FT-04.2, US-04.1.2, US-04.1.3, US-04.1.4, US-04.2.1, US-04.2.2, US-04.2.10, US-05.5.1,
   US-07.2.2, OQ-62, OQ-130 and OQ-131.
5. **D5 Pricing kinds.** Donald: "RVG at the anaesthetist's unit rate; RVG at the Contract's rate; RVG
   less the Contract's discount; fixed price (in price ranges); open price (typed on the Procedure).
   Rate and discount are undated. Prices are ex GST."
   - Open price is new. It answers Ben's prepaid example of a price not on any list, where "Vanessa
     just put in 2 grand" (L313-323).
   - With no per-Contract unit overrides, OQ-62 is re-answered (proposal 9.3, assumption A22).
   Bears on US-04.1.1, US-04.2.2, US-05.2.6, US-05.4.3, US-03.1.9 and OQ-62.
6. **D6 Price ranges, fixed price only.** Donald: "At least one per fixed-price Contract. Each has a
   start date, which may be in the past, and a price; it ends the day before the next one starts, so
   ranges never overlap or leave a gap. The range in force on the procedure date gives the price."
   This replaces Contract versions and effective dates and gives the backdating the office needs. It
   answers OQ-131 (how the office keeps prices and dates current), left open for Vanessa on 4 November
   (Notes 2026-11-04 · Donald working decisions #10), on Donald's authority only. Bears on US-04.2.10,
   US-04.1.3, FT-05.2, US-05.2.5 and OQ-131.
7. **D7 Step rail.** Donald: "Candidates are Active Contracts that fit the List (its hospital, or
   linked to its surgeon or anaesthetist, or an unlinked insurer or funder) and whose specialties
   match. Step 1 is derived: Patient = bills the payer (built-ins, prepay lists, surgeons' fixed fees
   such as Merivale); Hospital = bills the List's hospital and has a funding tag; Special = everything
   else. Step 2: Patient, the payment type; Hospital, the tags that hospital has; Special, pick the
   Contract. Step 3: pick the Contract, or the 'Other price' toggle, which picks the destination's
   open-price fallback. RVG-priced Contracts never appear under Prepaid. The booking's funder only
   suggests a path."
   - This turns the 4 November guess that the picker would follow the step rail (Notes 2026-11-04 ·
     Donald working decisions #9) into a decision.
   - "Other price" is Ben's wording for the toggle (L325-331).
   - A suggested path never narrows the choice. OQ-93 stands, gaining the suggestion and the insurer
     kind (proposal 9.3).
   Bears on FT-04.3, US-04.3.2, US-04.3.3, US-04.3.4, US-04.3.7, US-04.2.1, OQ-73, OQ-78 and OQ-93.
8. **D8 Built-ins and fallbacks.** Donald: "AA holds 'No contract · RVG'. Every destination has
   exactly one open-price fallback, made by the system: 'No contract · Fixed price' and 'Prepaid ·
   Fixed price' (AA, for the patient), one per hospital and funding tag, one per Special holder."
   - In the meeting Donald recalled the rule he and Greg had held throughout, "by default there should
     always be at least an RVG contract for every configuration" (L151).
   - FT-04.4 and US-04.4.1 stay Retired; their idea of default Contracts returns as system
     fallbacks, which partly reverses OQ-78's answer (proposal 9.1, 9.3).
   Bears on US-04.3.3, US-04.3.7, US-04.4.1, US-04.4.2, US-05.4.1 and OQ-78.
9. **D9 Procedure on a Booking.** Donald: "Exactly one Contract. On an RVG price, the RVG code, time
   and modifiers are required; on a fixed or open price the form collapses to an optional RVG code for
   reference. Where the Contract allows it, the anaesthetist can override an RVG price with the RVG
   detail kept. The price follows the price in force on the procedure date, except that a prepaid
   Procedure keeps its prepayment invoice's price, an edited value keeps the edit, and AUTHORISED
   freezes everything."
   - This settles the meeting's two cases (L583-613): an anaesthetist who records RVG codes, time and
     modifiers for reference but charges his own fixed price, where Donald said the RVG "would be
     mandatory... But you'd still override it" (L607); and Ben, "if I'm just doing a price, I don't
     want to fill out any of this rubbish" (L609), where Donald's "gut" was an optional RVG code with no
     time or modifiers (L613).
   - A prepaid Procedure keeping its prepaid price matches Ben's 27 October answer (Notes 2026-10-27 ·
     AA meeting with Ben and Vanessa #1).
   Bears on US-04.3.1, US-04.3.5, US-03.3.1, US-03.3.3, US-03.3.4, US-03.6.1, FT-03.5, US-03.5.1,
   US-03.5.2, US-05.4.1, FT-05.2, US-05.2.5, US-06.3.5, OQ-96 and OQ-119.
10. **D10 Out of scope for the contract model.** Donald: "add-ons (a combination is its own Contract;
    extras are ad-hoc invoices or events), bulk upload and export, split and out-of-hours lists, the
    hospital's text replacing the rooms' text, the live price widget, the booking edit history
    screen, overdue alerts, support hours. These are for the requirements update, not this model."
    - A scope instruction, not detailed rules: the detail of each topic is in the meeting. Add-ons
      (L475), split and out-of-hours lists (L477-545), the hospital's text (L547-581), the price
      shown to the anaesthetist (L611-683), the edit history and overdue alerts (L157-243), the
      export and a safe copy of the contracts (L739-779), support hours (L781-835).
    - The proposal (section 10) adds that bulk upload is out because Vanessa maintains prices by
      editing each Contract on screen; a developer seed loader remains, which is not a user feature.
      Upload of a schedule (US-04.2.13) becomes Future Work, and OQ-100 is answered no (proposal 9.1,
      9.3).
    - Sources differ: in the meeting Donald said of Greg's export, edit and re-import idea, "some
      version of that is currently in scope" (L739). D10 takes it out of the contract model; the
      proposal (9.1, 9.3, section 10) reads it as Future Work. Ben's wish for a
      "safe, secure source of truth" outside the system (L757-777) is a separate wish, recorded in the
      meeting note.
    - Also not modelled (proposal section 10): CES vitrectomy time bands beyond one Contract per
      band, and the affected-Procedures list (point 19).
    Bears on US-04.2.11, US-04.2.13, US-08.6.4, US-02.1.2, US-02.5.4, US-02.5.7, US-03.1.2,
    US-06.3.2, FT-12.2, US-12.2.1, US-13.4.3, EP-15, OQ-89 and OQ-100.
11. **D11 Carried forward.** Donald: "the multi-procedure units rule, the payer on the Booking, the AA
    code, the snapshot at AUTHORISED, the prepayment mechanics and the AA Holding account, events and
    additional invoices, one invoice per billable party per Booking, a split between payers as a
    Booking action." These stand unchanged under the flat model. Bears on US-05.3.1, US-04.1.4,
    US-04.3.5, US-08.1.1, FT-08.6, US-08.6.4 and US-08.6.5.

## Later the same day

12. **OQ-132 raised: base units on a mixed Booking.** Donald: "the mixed-Booking base units question
    was raised as OQ-132". On a mixed Booking whose marked primary is on a fixed or open price, does
    another Procedure take the base units? Until it is answered, base units go only on the marked
    primary, so none are billed (proposal 11.2, point 5). The question stays Open. Bears on OQ-132,
    US-05.3.1, US-05.3.3, OQ-53 and OQ-95.
13. **The Procedure's invoice description always wins over the hospital's.** Donald: "the
    Procedure's invoice description always wins over the hospital's description on the invoice." The
    default chain already says so (the rooms' text, replaced by the hospital's, replaced by the
    Contract's invoice description, and an admin edit always wins), so nothing in the model changes
    (proposal 11.2). It sits beside Ben's wish in the meeting that the hospital's procedure text
    replace the rooms' (L547-581), which governs the text on the Booking, not the invoice. Bears on
    US-08.4.6, US-03.1.9, US-02.5.7, US-02.1.2, US-03.1.2, OQ-103 and OQ-130.
14. **The fee-file readings are seed data, not questions for AA.** Donald: "the fee-file readings in
    11.2a are seed data, not questions for AA"; "there is no real data to question until the system
    exists, so these readings stand for the seed and are not put to AA". The readings (proposal
    11.2a): SXAP schedules are held by and billed to CES; Pryce's and Tanaka's approximate fees are
    seeded as fixed prices; only the CES HNZ commitment set is seeded; CES vitrectomy is seeded as 9
    bands, each its own Contract; Pryce's fee card figures stand as printed; the special Contracts
    carry no specialty; fee extras are billed as events, not seeded as Contracts; Canterbury
    Orthopaedics, Urology Associates and Canterbury Breastcare are left out of the seed. Not
    requirements, and no questions are raised from them.

## Other points

15. **The contract model proposal is the design written from these decisions.** AR-58 is a
    snapshot of the flat Contract model taken on 5 November: entities (Party, Contract, pricing
    kinds, price ranges, specialties, funding tags), rules for candidates, the step rail, fallbacks,
    how a Procedure gets and keeps its values and who may change what, worked examples and a seed
    mapping. Its own status: "proposal for review", revised the same day after a critique. "The
    decisions win over everything else"; where they leave a gap, it picks the simplest thing and
    lists it as an assumption in section 11.1, which is our reading, not a decision. The domain model
    has been rewritten to it. Bears on EP-04 and the domain model.
16. **Section 9 is a change brief for this update.** Proposal section 9 lists what the model
    replaces: in EP-04 (9.1), FT-04.1, FT-04.2, FT-04.3 and most of their stories are reworded,
    US-04.1.6 (staged changes), US-04.2.4 (contract lines), US-04.2.10 (prices effective from a date)
    and US-04.2.13 (upload) become obsolete, US-04.1.5 is rewritten as the Party record, and FT-04.4
    and US-04.4.1 stay Retired; in other epics (9.2), the Contract, line, version and route wording
    of FT-03.4, US-03.1.8, US-03.1.9, US-03.3.1, US-03.3.3, US-03.3.4, US-03.5.2, US-03.6.1, FT-03.5,
    US-03.5.1, FT-05.2, US-05.2.5, US-05.2.6, US-05.3.1, US-05.4.1, US-05.4.3, US-05.5.1, FT-06.2,
    US-06.2.2, US-06.3.1, US-06.3.5, US-06.3.6, US-06.4.1, US-06.5.2, US-07.2.2, US-08.1.1, US-08.4.1,
    US-08.4.4, US-08.4.6, US-08.6.4, FT-11.2, US-11.2.1, US-11.4.3, US-13.4.1, US-13.4.3 and US-13.6.2
    is brought to the flat model. The brief is Donald's, built from his decisions and the
    assumptions, not AA's confirmation.
17. **The brief's question dispositions.** Proposal 9.3: OQ-131 answered and closed (D4, D6); OQ-100
    answered no (Future Work); OQ-73 retired or re-answered, a prepaid Contract must bill the payer
    (assumption A2, our reading, so put to confirmation, point 20); OQ-62 re-answered, no
    per-Contract unit overrides; OQ-114 partly answered (delivery on the Party); OQ-78 partly
    reversed (system fallbacks); OQ-66, OQ-67, OQ-18, OQ-48, OQ-104, OQ-55 and OQ-130 reworded to the
    flat model; OQ-89, OQ-98 and OQ-106 moot (no lines); OQ-93, OQ-105, OQ-53 and OQ-25 stand (OQ-93
    gains "Suggested" and the insurer kind); OQ-96, OQ-117 and OQ-119 stand, their mechanics in
    proposal 5.7 and 5.8.
18. **The new requirements the model implies.** Proposal 9.7 lists 21: a Party record shared by all
    holder kinds (insurer and funder separate), with billing name, contact and delivery required once
    billed; "bills its holder or the payer" per Contract (AA and anaesthetist holders bill the payer);
    a specialty master list; surgeon specialties, one or more, required; Contract specialties (none
    means all, no "show all"); a funding tag list and an optional tag per Contract; linked
    practitioners (unlinked AA, insurer and funder Contracts on every List, hospital-held Contracts
    only on their own hospital's Lists, practitioner-held ones needing a link); Active or Disabled;
    five pricing kinds; backdatable price ranges on fixed price only; system open-price fallbacks
    through "Other price"; the derived invoice destination and step rail with "Needs an invoice
    destination"; a "Suggested" path from the funder, never narrowing; undated settings, a dated
    change meaning a new Contract, prepaid and pricing kind fixed; default RVG code, invoice
    description and holder reference code as settings; price following the range in force, held by
    an edit, a prepayment invoice and AUTHORISED, with "Needs a price" blocking AUTHORISED; RVG detail
    required on RVG kinds only; an override on RVG Contracts where allowed, with review flags on price
    edits; RVG never prepaid, prepaid billing the payer, read-only once the prepayment invoice is
    raised, and a refund or credit on moving off; fee extras as events; a moved Booking keeping its
    Contracts and flagging any that no longer fit. Several items rest partly on assumptions, not
    decisions: 1 (A43), 2 (A40), 7 (A38, A39), 13 (A25), 14 (A36), 16 (A48), 18 (A49), 19 (A2,
    A47), 20 (A46) and 21 (A41). Bears on EP-04, FT-04.1, FT-04.2, FT-04.3, US-04.1.5, US-04.2.1, US-04.2.2,
    US-04.3.2, US-04.3.3, US-04.3.4, US-04.3.7, US-13.4.1, US-13.4.3, US-13.6.2, FT-05.2, US-05.2.5,
    US-05.4.1, US-06.3.5, US-06.5.2, US-08.6.4 and OQ-119.
19. **Open: a list of the Procedures affected by a backdated range or a dated change.** Proposal 11.2,
    point 1: "When a backdated range is added, or a dated settings change makes a new Contract (the
    Unisports example), does the office want a list of the Procedures affected (for a new Contract:
    those dated after the change still on the old one)?" For Ben, Vanessa, Greg or Donald.
    Unanswered. Bears on US-04.2.10, FT-05.2 and US-05.2.5.
20. **Open: confirm no holder-billed prepaid Contract is needed (OQ-73).** Proposal 11.2, point 2:
    "OQ-73: confirm no holder-billed prepaid Contract is needed." Assumption A2 reads that a prepaid
    Contract must bill the payer, which "retires OQ-73's holder-billed prepaid Contract, which D7
    could never offer". That is our reading, not a decision, so OQ-73 wants confirmation, not a final
    answer. Bears on OQ-73, US-06.2.2 and US-06.3.1.
21. **Open: do "overdue alerts" include the outstanding prepayment alert?** Proposal 11.2, point 3:
    "Does D10's 'overdue alerts' include US-06.3.2's outstanding prepayment alert?" In the meeting
    Vanessa asked for overdue stages to be visible (L193-201). Unanswered. Bears on US-06.3.2,
    US-08.3.5, FT-12.2, US-12.2.1, OQ-33 and OQ-59.
22. **Open: should a Disabled Contract raise a review flag?** Proposal 11.2, point 4: "Should a
    Disabled Contract on an un-authorised Procedure raise a review flag?" Unanswered. Bears on
    US-04.1.2 and US-04.3.2.
23. **Open: holder-required booking inputs.** Proposal 11.2, point 6: "Holder-required booking inputs
    (gap 2): drop for good, or add a Contract setting later?" Assumption A21 reads that inputs such as
    a member number, claim reference or purchase order have no Contract setting, and the Booking keeps
    the insurer approval number only. Today the surviving holder reference (an insurer member number,
    printed on the invoice) sits in Contract pricing terms (US-04.2.2), Required booking inputs
    (US-04.2.7) having been retired on 7 October. Unanswered. Bears on US-04.2.2, US-04.2.7 and
    US-11.4.3.

## Donald's answers to the update's open points

24. **Out-of-hours Lists are accepted by AA.** Donald: "out of hours list is an accepted requirement,
    from a direct conversation with AA, and so for now I want you to mark it as accepted by AA. Now
    obviously there will still need to be design work done on this, but for our purposes let's assume
    it's accepted." The need is the meeting's (Notes 2026-11-05 · AA meeting with Ben and Vanessa #29);
    how it works is still to design. Bears on US-01.1.6.
25. **The safe copy of the contracts is the export and re-import.** Donald: the Future Work story on
    "the ability to do an export of contracts and do an import of them again and have them be
    updated" covers Ben and Vanessa's wish for a safe copy (Notes 2026-11-05 · AA meeting with Ben and
    Vanessa #26 #27), and it can carry a few more details. It stays Future Work (point 10). Bears on
    US-04.2.13.
26. **Active or Disabled, in plain terms.** Donald: "there might be ... a contract in the system, in
    the terms that we understand what a contract is, that gets retired, and we may not want to
    completely delete it, so we mark it as disabled and it gets hidden." It needs no story of its
    own; it sits in the story for creating and editing Contracts. Bears on US-04.1.2.
27. **Greg's v6 design documents no longer describe the design.** Donald: the old diagrams and models
    of how Greg thought the system needed to work, "his domain model and his V6 diagrams", should no
    longer be linked from any story, and the artifacts retired and hidden. These are the pricing model
    executive summary v6 (AR-28), the technical design v6 (AR-29) and its ERD (AR-30). The notes of the
    meetings and documents stay as the record of what was said at the time. Bears on EP-04, EP-05,
    EP-06 and EP-11.
28. **Surgeon specialties are set in the app.** Donald, 6 November: specialties are not expected to
    come from a spreadsheet. "If they want to edit that in the future via spreadsheet, that's fine.
    But at the very least, there will need to be a CRUD screen in the app in the same place that all
    the other settings for an anaesthetist or a surgeon exist in their profile to apply these." Bears
    on US-13.6.6 and US-13.6.2.
