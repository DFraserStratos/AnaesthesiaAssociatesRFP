# Pricing model documents, 2026-10-07

- **Who:** Donald Fraser (Stratos), filing two Word documents and a diagram. Both documents were
  written by Donald from Greg Smith's (RFP author, Peritia) *Contract pricing model: design summary
  (v3)* and *Identification of the Billable Party* notes, revised after the 5 October 2026 review
  between Donald and Greg.
- **Covered:** how procedures are priced and who pays: RVG groups, procedures, contracts (third party
  and the anaesthetist's own), *No contract (RVG)*, who is billed, what the anaesthetist can change,
  prepaid procedures, modifiers and keeping prices up to date (the guide); the draft data model,
  contract selection, resolver and price calculation behind it (the technical design and its ERD);
  and a reference file of every modifier in the NZSA RVG 2021, made at Donald's request.
- **Inputs gathered here:**
  - Donald's typed message of 2026-10-07 asking for both documents to be read, with his instructions
    on how far to rely on each (points 3 to 5);
  - the plain-language guide,
    [How procedures are priced and who pays.docx](<../../../Pricing model/How procedures are priced and who pays.docx>)
    (status "Draft for discussion at the directors' meeting, 6 October 2026"); the 5 October PDF of
    it is [AR-28](../artifacts/AR-28.md). The .docx is the newer version: it holds the directors'
    short answers under section 10, recorded in Notes 2026-10-06 · AA directors meeting #3 to #11;
  - the technical design,
    [Contract pricing model - technical design v4.docx](<../../../Pricing model/Contract pricing model - technical design v4.docx>)
    (status "Draft v4 proposal for Greg Smith's review"); its PDF is [AR-29](../artifacts/AR-29.md),
    and its entity diagram is the ERD [AR-30](../artifacts/AR-30.md);
  - the modifiers file,
    [NZSA RVG 2021 modifiers.md](<../../../Data files/NZSA RVG 2021 modifiers.md>), with
    [NZSA RVG 2021 included modifiers.csv](<../../../Data files/NZSA RVG 2021 included modifiers.csv>),
    transcribed from the RVG ([AR-16](../artifacts/AR-16.md)).

Cite a point as `"Notes 2026-10-07 · Pricing model documents #n"`. Points are numbered once across
the whole note. Donald's typed wording is kept (spelling fixed, filler dropped). The documents'
own wording is quoted where it matters; their section numbers are given as "guide §n" and "design
§n". The technical design and ERD are a draft (point 4): every point drawn from them says so.
Where a directors' answer of 6 October replaces the guide's or the design's proposal, the point
says which.

## Questions answered

1. **Prepayment is all or nothing (answers the open half of OQ-76).** OQ-76 still asks: "is a
   prepayment all or nothing, or can it be a part of the estimated cost (for example 20%), and does
   that happen?" The guide lists as "Already agreed": "The full expected fee is prepaid. There is no
   part payment or deposit." (guide §6). Donald asks for the guide to be taken as true (point 3), so
   this answers it. Greg doubted "all or nothing" on 2 October ("I still think all or nothing is
   unhelpful", recorded on OQ-76); the guide, written after the 5 October review, does not carry
   that doubt. The "another invoice?" half of OQ-76 is answered by Notes 2026-10-06 · AA directors
   meeting #1, #2 and #10.
2. **There is a default contract, "No contract (RVG)", and it bills the payer named on the booking
   (bears on OQ-78 and OQ-67).** OQ-78 asks: "Is there a default Contract, and who is the billable
   party when no specific Contract applies?" The guide: "Behind the scenes the system stores this as
   a contract like any other, so that every booking is priced the same way" (guide §2), and with No
   contract (RVG) the patient, or their parent or guardian, is billed (guide §3). The draft design
   models it as exactly one default contract with no holder and no lines, billing "Payer on the
   booking (patient by default, editable to a guardian)" (design §9, §12). So there is a default,
   which keeps the catalogue's model over Greg's floated "no default contract" model. **In
   tension:** the design has one system-wide default, not one per procedure (OQ-62's answer: "each
   procedure has one or two default RVG contracts which holds the base units") or one per hospital
   (OQ-55's answer: "Every hospital gets a default RVG Contract"). See points 8, 20 to 23 and 37.

## Donald's notes

3. **The guide is true as written now; a technical document will follow.** "Please read *How
   procedures are priced and who pays.docx*. This contains a plain language explanation for how
   procedures and contracts are set up, and how people are paid and whatnot. Assume that what this
   document describes right now is true. But in the future, a more technical document that describes
   the particular relationships will be provided." The guide's own status line still reads "Draft
   for discussion at the directors' meeting, 6 October 2026": where the directors answered its
   section 10 questions, their answers replace its proposals (points 15 and 16).
4. **The technical design v4 and ERD are a draft reference shape.** "Although it's not finalised,
   I'm thinking it would be good for you to also read *Contract pricing model - technical design
   v4.docx* and *pricing-model-erd-v4.svg*. This is a proposed technical shape of how the RVG
   procedure list and contract lists all marry up together. So please use it as a point of reference
   for how these relationships should be defined in the prototype. But make provisions that some of
   them may be updated before we actually execute on the catch-up phases of work." The design calls
   itself "Draft v4 proposal for Greg Smith's review. Supersedes v3 where they differ". Points 19 to
   41 record it as a draft; where a directors' answer of 6 October already changes it, the point
   says so. Point 3's "more technical document" to come and this v4 are read together: v4 is the
   current draft of it, and a later version is expected.
5. **Build a file of every RVG modifier.** Donald, after his expansion of the modifiers answer: "Now
   might be a good time to read the RVG guide and build a file with all of the modifications.
   /docs/discovery-reference/Data files/NZSA RVG 2021.pdf". The file is points 42 to 45.

## Other points: the guide, How procedures are priced and who pays (AR-28)

6. **What the guide is for.** Every procedure on a booking has to answer two questions before it can
   be billed: "What was done? That is the procedure" and "How is it paid for? That is the contract:
   who has agreed to pay, and on what terms." The system keeps them separate: "The same face-lift
   can be paid for in different ways depending on the surgeon, the hospital, the insurer and the
   anaesthetist, but it is still the same procedure." It does not describe screens or databases; the
   technical design does (guide §1).
7. **Building blocks: RVG groups.** "The NZSA Relative Value Guide (RVG) lists procedures in groups
   by body area, each with recommended base units. The system holds the RVG as published and uses it
   as the starting point for every procedure. AA can add its own groups if it ever needs to." (guide
   §2)
8. **Building blocks: procedures.** "A procedure is the specific operation, worded as it should appear
   on the invoice. Each procedure belongs to one RVG group and uses that group's base units unless AA
   sets a different figure for that procedure. The office finds a procedure by body area, then
   subgroup, then procedure, so the list stays short at each step." (guide §2) **Sources disagree:**
   OQ-62's answer puts the base units in each procedure's default RVG contract; the guide (and the
   draft design, point 21) puts them on the RVG group, with the procedure overriding only where AA
   sets a figure. Each procedure belonging to one group bears on OQ-88 question 3 (children of a
   group, rather than a flat list).
9. **Building blocks: two kinds of contract.** "A contract is AA's record of how a procedure is paid
   for. It is not necessarily a legal contract." (guide §2) Its table:
   - *Third-party contracts:* "An agreement with someone else: an insurer (for example Southern
     Cross), a hospital, or a surgeon's rooms." Price: "Usually a fixed price per procedure, agreed
     for a period (often a year)." Can the anaesthetist change the price? "No. The agreed price
     stands."
   - *The anaesthetist's own pricing:* "No contract (RVG): standard RVG pricing at the anaesthetist's
     own unit rate. Also any price list an anaesthetist keeps for their own work, for example for
     prepaid cosmetic procedures." Price: "RVG units × the anaesthetist's own rate, or the
     anaesthetist's own price." Can the anaesthetist change the price? "Yes. The anaesthetist has full
     discretion."
   - The directors' fixed rate and fixed discount contracts (Notes 2026-10-06 · AA directors meeting
     #6, #11) fit neither column as written: a contract whose price is BTM × the contract's rate, and
     one whose price is BTM × the anaesthetist's rate less a locked discount. The guide has no place
     for them yet.
10. **No contract (RVG).** "When nobody has a special arrangement, the business says there is 'no
    contract' and the procedure is priced on the RVG. The system shows this as No contract (RVG). It
    is available for every procedure and appears first in the list of choices. Behind the scenes the
    system stores this as a contract like any other, so that every booking is priced the same way.
    Users never need to know that." The key idea: "The procedure says what was done. The contract
    says how it is paid for. One procedure can be paid for under many different contracts, and
    changing the contract never changes the procedure." (guide §2) See point 2.
11. **Who gets the invoice.** "The contract decides who is billed. Some contract holders pay AA
    themselves, such as an insurer that accepts direct claims. Others only set the price and the
    patient pays, as with a surgeon's fixed-fee arrangement for cosmetic work." (guide §3) Its table:

    | Situation | Contract chosen | Who is billed |
    | --- | --- | --- |
    | An insurer or hospital has agreed to pay AA directly for this procedure | That insurer's or hospital's contract | The insurer or hospital |
    | A surgeon has agreed a fixed price with AA, and the patient pays | The surgeon's fixed-price contract | The patient, or their parent or guardian |
    | No arrangement, and the patient pays (including insured patients who claim the money back themselves) | No contract (RVG) | The patient, or their parent or guardian |
    | The booking says an insurer will pay, but no insurer contract has been chosen | Not yet settled | Flagged for the office to check before billing |

    - "When the patient pays, the invoice goes to the payer named on the booking. The patient's
      details are filled in automatically, and the office or anaesthetist can change them to a parent
      or guardian."
    - "The surgeon's booking often shows the patient's insurance status (for example SXAP), and the
      hospital often confirms it. That information guides which contract is chosen, but the contract
      is what decides who is billed."
    - "If the hospital cannot get insurance pre-approval on the day, the patient either goes home or
      pays. If they pay, the anaesthetist changes the contract to No contract (RVG) and the patient is
      billed. This happens regularly and the system supports it."
    - **In tension:** OQ-55's answer says "neither the Patient nor the Booking holds" the insurer or
      funding source; the guide has the booking showing an insurance status, and a flag when it says
      an insurer will pay but no insurer contract is chosen. Where that status is held is open in the
      draft design too (point 34).
12. **From booking to invoice.** (guide §4)
    - "The office sets up the booking. It selects the procedure, then selects or confirms the
      contract. The list of contracts only shows those that apply to this hospital, surgeon and
      anaesthetist, with No contract (RVG) first." (The catalogue leaves open whether surgeon
      contracts are filtered by surgeon; the guide says the list is narrowed by surgeon and by
      anaesthetist too.)
    - "The anaesthetist reviews the booking (the card) in the mobile app. They can change the
      procedure or the contract at any time until they submit the list. No explanation is needed, but
      the office sees the change at review. Changing either one refreshes the starting base units,
      modifiers or fixed price."
    - "After the procedure, the anaesthetist records base, time and modifier units (BTM). Base and
      modifier units start from the procedure and contract, and the anaesthetist can change them. Any
      modifiers claimed need a short explanation, because insurers ask for one."
    - "The price follows from the contract." Then "The anaesthetist completes the booking and submits
      the list. The office reviews it, corrects anything that needs correcting, and authorises it for
      billing."
    - "The system keeps a record of exactly what was used to price each procedure. Later changes to
      the RVG or to a contract never change an invoice that has already been issued."
    - "If a booking has more than one procedure, each one is priced on its own contract."
13. **What the anaesthetist can change.** (guide §5)

    | | Third-party fixed price | Anaesthetist's own fixed price (for example a prepaid list) | No contract (RVG) |
    | --- | --- | --- | --- |
    | Where the price comes from | The contract's agreed price | The anaesthetist's own price for that procedure | BTM units × the anaesthetist's own unit rate |
    | Role of BTM units | Recorded for reference only | Recorded for reference only | Used to calculate the price |
    | Change the price | No. The price is shown but cannot be edited. | Yes, with a reason | Yes. The anaesthetist can type their own price, with a reason. |
    | Percentage discount | No | Yes | Yes. A 100% discount or a price of $0 gives a no-charge invoice. |
    | Change the contract | Yes | Yes | Yes |
    | Who is billed | Whoever the contract says: the insurer or hospital, or the patient for a surgeon's arrangement | The patient or guardian | The patient or guardian |

    The table predates the directors' answers: a fixed rate contract uses BTM to calculate the price,
    and a fixed discount contract shows a discount the anaesthetist cannot edit (Notes 2026-10-06 ·
    AA directors meeting #6, #11). The guide does not say whether a percentage discount needs a
    reason; the draft design requires one ("Required with a price or discount", point 25).
14. **The anaesthetist has the final say.** "AA acts as agent for independent anaesthetists. It is
    not their employer. The system lets the anaesthetist make the call, even when the office might
    disagree, and the office review is where mistakes are caught. The only limit is a price agreed
    with a third party. To depart from that price, the anaesthetist has to change the contract, which
    also changes who is billed." And: "The office can still correct any price at review, for example
    to fix a data-entry error." (guide §5)
15. **Prepaid procedures, as now settled by the directors.** (guide §6)
    - *Already agreed* in the guide, and unchanged: "Each anaesthetist chooses which procedures, or
      whole RVG groups, they want prepaid." "Prepayment applies only when a person (the patient or a
      guardian) is paying, never an organisation." "The full expected fee is prepaid. There is no part
      payment or deposit." (point 1) "The prepayment invoice is created when the booking is set up and
      sent once the office approves it. The money is held in trust until the procedure is done, and
      refunded if the procedure is cancelled."
    - *Already agreed*, now overtaken: "If the work turns out to be less than expected, nothing is
      refunded." A credit note can now be raised by hand (Notes 2026-10-06 · AA directors meeting #2,
      #10).
    - *Proposed, please confirm:* "The prepaid amount works like the anaesthetist's own fixed price. By
      default it is the final price, and the BTM units recorded on the day are for reference only."
      This fits the directors' answers (the amount is the anaesthetist's own fixed-price contract, and
      nothing more is calculated: #4, #9, #10). Not adopted: "If the procedure took more than
      expected... the anaesthetist can raise the price. The difference is invoiced to the patient as
      an extra invoice." Instead nothing is invoiced automatically; the anaesthetist may raise an ad
      hoc invoice or credit note by hand (#1, #2, #10).
    - *Not yet decided,* now decided: where the prepaid amount comes from ("(a) each anaesthetist keeps
      their own price list for prepaid procedures, or (b) the system estimates the fee"): (a), as
      first-party contracts the anaesthetist creates and manages (#4, #9). The guide's reason stands:
      "Each anaesthetist must set their own prices, because AA cannot set a common price for its
      members." Whether the anaesthetist sees the prepaid amount on the card: yes (#5), over Greg's
      view "that clinical work should be kept apart from billing work".
16. **Modifiers, as now settled by the directors.** (guide §7) The guide: "Page 12 of the RVG gives
    guidance on when modifier units may be added to the base units, with typical and maximum values
    for each body area. They are optional and depend on the patient and the procedure. Vanessa also
    keeps a list of modifiers that AA uses which are not in the RVG." Ben's proposal: "The system
    never adds modifiers on its own"; "It can show the anaesthetist the RVG guidance that applies to
    the procedure, plus AA's own modifiers, so they can pick from a short, relevant list"; "Each
    modifier claimed needs a short explanation." "Earlier discussions proposed pre-filling modifiers
    from the patient's ASA grade and from defaults on each procedure. If the directors agree with Ben,
    that pre-filling would be dropped."
    - The directors' answer (Notes 2026-10-06 · AA directors meeting #3, #8) keeps Ben's proposal
      with two exceptions the system applies and the anaesthetist cannot remove: age, from the
      patient, and a modifier the RVG code's base units already include (shown selected at 0 and
      locked). All else is optional.
    - **Sources disagree:** the modifiers file finds no "typical and maximum values for each body
      area" on page 12 of the 2021 RVG (point 45). The guide's sentence needs correcting or its source
      finding.
17. **Worked examples.** (guide §8) Insured patient on an insurer's fixed-price contract: agreed price,
    the anaesthetist cannot change it, insurer billed. Face-lift with a surgeon who has a fixed-fee
    arrangement: surgeon's contract (third party), agreed price, patient billed. The same face-lift
    with no arrangement: No contract (RVG), "BTM × the anaesthetist's own rate", patient billed.
    Pre-approval falls through on the day: the anaesthetist changes to No contract (RVG), patient
    billed. An anaesthetist who charges a flat price: No contract (RVG), "The anaesthetist types their
    own price". A colleague's family member at a reduced rate: No contract (RVG), "50% discount, or $0
    for a no-charge invoice". Prepaid cosmetic procedure where a complication added time: "The prepaid
    amount, unless the anaesthetist raises it. Any increase is invoiced separately." That last row is
    replaced by the directors' answer (point 15).
18. **Keeping prices up to date.** (guide §9)
    - "The office maintains the RVG groups and the procedure list, and every change is recorded."
    - "Each contract has a start date and, if needed, an end date. A price review creates a new dated
      version of the contract. Bookings priced under the old version keep the old price." Which date
      decides the version in force is not said (OQ-48 stays open; the draft design uses the procedure
      date, point 28).
    - "Contract holders send price reviews in different forms today, mostly PDFs and a few
      spreadsheets. We propose that all price lists and other master data come to AA in a standard
      spreadsheet. How those spreadsheets are loaded into the system (a one-off load followed by
      office editing, or an upload screen with a preview) is still to be agreed." Not answered by the
      directors.

## Other points: the technical design v4 and ERD (AR-29, AR-30), draft

All points in this section are the draft design (point 4).

19. **Purpose, ideas and terms (draft).** The model rests on one separation: "the procedure records
    what the anaesthetist did, and the contract records how it is paid for". Three ideas: "Defaults
    live once. RVG groups hold the published units. Procedures inherit them and override only where
    needed." "Contracts are sparse overrides. A contract line carries only the fields it sets."
    "One path for every booking procedure. 'No contract' is modelled as a default contract, so the
    resolver and the billing engine never branch on whether a contract exists." It is "a logical
    model" (design §1). Terms (design §2): a *booking procedure* is "One procedure performed on one
    booking, with its selected contract, recorded units and price" (replaces v3's "episode"); *time
    entry* is the anaesthetist recording BTM, modifier notes and any price or discount (replaces
    "timesheet"; business wording "Filling in the card"); *contract holder*, *contract*, *contract
    line*, *default contract*, *third party / first party*, *billable party*, *payer*, *resolver* and
    *price source* are defined. The catalogue calls a booking procedure a "Procedure" and the master
    list the procedure master; the naming is a choice still to make.
20. **RVG_GROUP (draft).** "The published RVG group, as listed in the NZSA guide. AA may add its own
    groups." Fields: a surrogate key ("RVG codes are not unique enough to be keys"), code and name as
    published, body_section ("Top level of the picker (for example Head)"), base_units ("Required,
    > 0", "The bottom layer of the resolver, so base units always resolve") and modifier_units
    ("Required, default 0", "Under review"). (design §3; ERD AR-30)
21. **PROCEDURE (draft).** "The specific procedure, worded as it should appear on the invoice. A
    procedure need only be defined when AA needs it." rvg_group_id is required: "Exactly one parent
    group. No nesting of procedures." name "is the invoice wording". base_units and modifier_units
    are nullable: "Null inherits from the group. Typically null." (design §3) Bears on OQ-88 (a
    procedure is a child of one group) and sits against OQ-62's answer (base units in each
    procedure's default RVG contract).
22. **CONTRACT_HOLDER (draft).** "The party a contract belongs to. Two new behaviour fields replace
    v3's assumption that the holder is always billed." Fields: name ("For example 'Southern Cross',
    'Merivale Plastics', 'Dr B. Smith prepaid list'"); party_type THIRD_PARTY or FIRST_PARTY ("Third
    party: an insurer, hospital or surgeon's rooms; prices locked. First party: an anaesthetist's own
    pricing; adjustable"); bills_holder ("True when the holder pays AA (insurer, hospital). False when
    the holder only sets the price and the payer on the booking is billed (surgeon fixed-fee
    arrangements, anaesthetist lists)"); billable_party_id, required when bills_holder; anaesthetist_id,
    "Set for first-party lists. Their contracts are offered only on that anaesthetist's bookings."
    (design §3) Bears on OQ-67: the contract still decides who pays, through its holder's
    bills_holder, or else the payer on the booking.
23. **CONTRACT (draft).** "A dated set of terms. A holder can have many contracts. Each price review
    creates a new contract row." contract_holder_id is "null only for the default contract"; name
    ("The default contract shows as 'No contract (RVG)'"); is_default, "Exactly one true", "found by
    this flag, never by its name"; valid_from and valid_to ("Validity sits here, not on lines (changed
    from v3). Null valid_to means open-ended"); previous_contract_id ("Links a price-review version to
    the contract it replaces"); import_ref (the import log entry). (design §3) Validity on the contract
    only follows Greg, 5 October: "All lines in a contract share its dates" (design §15). It has no
    AA identifier code beyond the name.
24. **CONTRACT_LINE (draft).** "A contract's terms for exactly one procedure or exactly one RVG group.
    Every pricing field is nullable, so a line carries only what it sets." procedure_id or
    rvg_group_id, exactly one ("A group line covers every procedure in the group that has no procedure
    line of its own. None are known today"); base_units and modifier_units ("Override the units
    beneath. 0 is a value, not 'nothing'"); fixed_price ("The whole price for the procedure. BTM
    becomes informational"); rate ("A contract unit rate in place of the anaesthetist's", dormant);
    discount_pct ("A contract-level percentage discount", dormant). (design §3) There is no pricing
    basis field: the price follows from which fields resolve (point 32). No time band, add-on or
    quantity rule columns.
25. **BOOKING_PROCEDURE, pricing fields (draft).** procedure_id and contract_id ("Office at setup;
    anaesthetist may change"; "One contract per booking procedure"); base, time and modifier units
    (base and modifier start from the resolver, time is entered); modifier_note ("Required when
    modifier units are claimed. Insurers ask for it"); price_entered ("Anaesthetist, adjustable
    contracts only", "Stored only when the anaesthetist types a price"); discount_pct_entered
    ("Percentage only. A flat change is made through price_entered"); adjustment_reason ("Required
    with a price or discount"); payer_name and payer_email ("Office or anaesthetist", "Prefilled from
    the patient"); price, price_source and pricing_snapshot, set by the billing engine at
    authorisation. (design §3)
26. **Contract behaviour: the adjustable rule (draft).** "adjustable = contract.is_default OR
    holder.party_type = FIRST_PARTY". (design §4)

    | Contract | Billed | Price field at time entry | Discount % |
    | --- | --- | --- | --- |
    | Default ("No contract (RVG)") | Payer on booking | Empty and editable (a nominated price) | Allowed |
    | First party, for example an anaesthetist's prepaid list | Payer on booking | Shows the resolved fixed price, editable | Allowed |
    | Third party, bills_holder true (insurer, hospital) | Holder's billable party | Shows the resolved fixed price, read-only | Hidden |
    | Third party, bills_holder false (surgeon fixed-fee arrangement) | Payer on booking | Shows the resolved fixed price, read-only | Hidden |

    "The office can override any price at review, with a reason. That override is the only way to
    change a third-party price without changing the contract." Where adjustable lives is an open point:
    "Derived here from the holder. Move it to CONTRACT or CONTRACT_LINE only if one holder needs mixed
    behaviour" (design §14). The directors' fixed discount contract, shown but locked (Notes 2026-10-06
    · AA directors meeting #11), is a further case the table does not have.
27. **Contract selection (draft).** (design §5)
    - "The office picks the procedure (body section, then group, then procedure), then selects or
      confirms the contract."
    - "The default contract always appears, first. It is followed by every contract that is valid on
      the procedure date, has a line for the procedure or its group, and whose holder fits the
      booking's context: the List's hospital, the surgeon or rooms, the insurer, and for first-party
      lists the booking's anaesthetist. The exact context rules are open."
    - "The anaesthetist may change the procedure or the contract until the list is submitted. No reason
      is needed. The change is audited and flagged at office review."
    - "On any change, the resolver re-runs and the starting units and fixed price refresh. If the new
      contract is not adjustable, any price_entered and discount_pct_entered are cleared."
    - The default contract has no lines, so "the default contract is offered for every procedure by
      rule, not by line lookup. The alternative is to auto-create an empty default line for every
      procedure... Developers may choose either."
28. **The resolver (draft).** "For each field, look down through the stack, and the first sheet with
    a value wins." Inputs: "A procedure, the selected contract (which may be the default) and the
    procedure date. Only a contract valid on that date is used". Layers, highest first: the selected
    contract's line for the procedure; its line for the procedure's RVG group; the procedure; the RVG
    group. base_units and modifier_units resolve through all four and always resolve; "fixed_price,
    rate and discount_pct exist only on contract lines, so they resolve from layers 1 and 2 or stay
    null." Output: "The resolved values, plus the layer each one came from. Both go into the pricing
    snapshot." v3's layers for the default contract's lines are dropped: "A practice-wide price on the
    default contract would amount to AA setting a common price for its members, which competition law
    does not allow." (design §6) The procedure date as the date that picks the contract bears on
    OQ-48, which stays open.
29. **Nulls and zeros (draft).** "Null means 'not specified here', and resolution looks through to the
    next layer. A value, including 0, stops it." "An explicit 0 above the RVG level is only needed to
    switch off a non-zero value beneath. That is rare, but some contracts do zero modifiers". Editing
    screens show "the inherited value as a greyed placeholder, with an explicit choice between inherit
    (stored as null) and override"; "In import spreadsheets, a blank cell means inherit and an
    explicit 0 means zero." (design §6)
30. **Time entry, the card (draft).** "The resolved base and modifier units are shown as starting
    values. The anaesthetist enters time units and may change base and modifier units. Out-of-range
    values warn the office. They are never blocked." "Modifiers are itemised, with a required
    modifier_note when any are claimed. Whether modifiers are ever pre-filled is open." "The record
    keeps the values the anaesthetist recorded." (design §7) The directors have since settled the
    pre-fill question (point 16).
31. **Price calculation: validation (draft).** "The engine rejects the booking, rather than ignoring
    one input, when: price_entered or discount_pct_entered is present on a contract that is not
    adjustable; BTM units are missing and no fixed price resolves; the selected contract is not valid
    on the procedure date." Each booking procedure is priced on its own when the list is authorised.
    (design §8)
32. **Price calculation: precedence (draft).** (design §8)

    | Step | Condition | Price | price_source |
    | --- | --- | --- | --- |
    | 0 | The office overrode the price at review | The office price | OFFICE_OVERRIDE |
    | 1 | price_entered is present (adjustable contracts only) | price_entered | ANAESTHETIST_PRICE |
    | 2 | fixed_price resolves | fixed_price. Recorded BTM is informational only. | CONTRACT_FIXED_PRICE |
    | 3 | Otherwise | (B + T + M) × rate × (1 − discount_pct_entered / 100), where rate is the resolved contract rate if any (dormant), else the anaesthetist's own unit value | CALCULATED |

    "A price of 0 produces a no-charge invoice. BTM is still recorded." "Whether the RVG
    multi-procedure rule (for example base units on the primary procedure only) still applies is being
    confirmed with AA. If it does, it adjusts the units of CALCULATED procedures before step 3." (OQ-90
    stays open.) **Gap after the directors' answer:** step 3 has a term for the anaesthetist's entered
    discount but none for a contract's own discount (discount_pct); the fixed discount contract (Notes
    2026-10-06 · AA directors meeting #11) needs one.
33. **Pricing snapshot (draft).** "At authorisation, each booking procedure stores the procedure, the
    contract (each version is its own row, so the id is enough), the resolved values and their layers,
    the recorded BTM, the rate and discount used, the price, the price_source, and the billable party
    or payer details. Later changes to the RVG, procedures or contracts never alter historical
    billing, and anaesthetist-nominated prices are easy to report on." (design §8)
34. **Billable party (draft).** The invoice goes to: the payer on the booking for the default contract
    ("patient by default, editable to a guardian"); "The holder's billable party record" for a holder
    with bills_holder true; the payer on the booking for bills_holder false. Truth table: insured and
    contract applies, holder billed; not insured and contract applies, "Patient billed at the contract
    price" (for example a surgeon's fixed-fee arrangement); neither, "Patient billed at RVG", default
    contract; insured with no contract, "Inconsistent", "Warning at office review, not a block".
    "'Insured' here means an insurer pays AA directly." The insurance indication (for example SXAP)
    raises a warning, "not a block, because pre-approval regularly falls through on the day";
    "Where this indication is stored is open." "AA acts as agent for independent anaesthetists, so
    the system accepts the anaesthetist's choice of contract and relies on office review to catch
    mistakes." (design §9) Bears on OQ-55 and OQ-67 (point 11).
35. **Prepayment (draft, partly settled).** (design §10)
    - Trigger: "The booking procedure's procedure, or its RVG group, is in the anaesthetist's prepaid
      set, and the payer is a person, never an organisation."
    - Amount: option (a) "models it as a first-party contract per anaesthetist (party_type
      FIRST_PARTY, anaesthetist_id set, bills_holder false, lines with fixed_price), so the prepaid
      amount is simply the resolved fixed price and needs no new structures"; option (b) "estimates it
      from expected units at the anaesthetist's own unit value. The current requirements specify (b)."
      The directors chose (a) (Notes 2026-10-06 · AA directors meeting #4, #9).
    - Settlement, proposed: "The prepaid amount behaves as an adjustable fixed price... If the
      anaesthetist raises the price, the difference is billed as an additional invoice. If the final
      price is lower, nothing is refunded. A cancellation refunds in full from trust." (It notes "The
      current requirements instead invoice any positive BTM balance automatically".) Not adopted
      beyond the cancellation refund: nothing further is calculated or invoiced automatically, and
      invoices or credit notes are raised by hand (#1, #2, #10).
    - "The link from a booking procedure to its prepayment belongs on the booking procedure." (The
      catalogue holds the prepayment on the Booking.)
36. **Contract versions, data loading and history (draft).** (design §11)
    - "A price review creates a new contract row with previous_contract_id set and a new valid_from.
      Its lines are copied from the previous version and then changed, and the previous version's
      valid_to is set to the day before."
    - "A delta upload (the usual case) copies all lines and applies only the rows supplied. A full
      upload creates the version from the supplied rows alone, so any line not present is closed with
      the old version rather than deleted." "A row marked REMOVE is not carried into the new version".
      "A row is the complete line, not a patch: a blank cell inherits and 0 means zero." "A preview
      lists new, changed and removed lines for approval before anything is applied."
    - "All master data reaches AA as spreadsheets in AA-defined templates: RVG groups, procedures,
      contract holders, contracts and lines, plus hospitals, surgeons and rooms, and anaesthetists."
      "Loading must be repeatable, so test environments can be wiped and reloaded." "The loading
      mechanism is open. The suggested MVP baseline is a developer-run import, then office screens to
      create, edit and retire records."
    - "Creates, updates and retirements of RVG groups, procedures, contract holders and contracts are
      audited (who, what, when). That replaces v3's suggestion of modelling the RVG as the lowest
      contract to keep its history."
    - A dated version per price review differs from the catalogue's dated price lines inside one
      contract; it matches the guide (point 18).
37. **Integrity rules (draft).** (design §12) "CONTRACT_LINE: exactly one of procedure_id and
    rvg_group_id is set." "At most one line per contract per target." "No overlapping validity between
    a contract and its previous or next version." "Exactly one contract has is_default true. Its
    contract_holder_id is null, it has no lines, and it never expires." "RVG_GROUP: base_units is
    required and greater than 0, and modifier_units is required with a default of 0." "bills_holder
    true requires billable_party_id." "A holder with anaesthetist_id set is FIRST_PARTY." "The billing
    engine rejects a price or discount on a contract that is not adjustable." The single default
    contract sits against the per-procedure and per-hospital defaults in OQ-62's and OQ-55's answers
    (point 2).
38. **Dormant capabilities, now partly live.** The design (§13): "These are in the data model but have
    no logic or screens yet. AA uses only RVG pricing and fixed prices today": CONTRACT_LINE.rate,
    CONTRACT_LINE.discount_pct, and RVG group lines ("None are known today"). The directors' answers
    change this: some contracts have a fixed rate and some a fixed discount, so rate and discount_pct
    need logic and screens (Notes 2026-10-06 · AA directors meeting #6, #11); no contract sets a group
    price, so group lines stay dormant (#7).
39. **Open points in the design, and where they now stand.** (design §14)
    - Modifiers: "Ben's view is that there are no modifier units in the schedule and nothing should be
      auto-applied... If Ben's view holds, modifier_units stays at 0 throughout and the RVG page 12
      guidance may be offered as a filtered pick-list." Settled with exceptions: age and included
      modifiers are applied and locked (#3, #8).
    - Prepayment amount and settlement, and whether the anaesthetist sees the prepaid amount: settled
      (#4, #5, #9, #10).
    - Still open: where adjustable lives; the insurance indication on the booking; the candidate list
      context rules ("hospital, surgeon or rooms, insurer, anaesthetist"); the RVG multi-procedure rule
      (OQ-90); the data loading mechanism for the MVP; default contract offering ("by rule, or empty
      lines per procedure").
    - Out of scope of the design: "The anaesthetist's unit value (held on the anaesthetist profile),
      the booking and list lifecycle, invoice generation, the import log, and the billable party
      record". "No nesting or versioning of individual lines or procedures is provided."
40. **Changes from v3 (draft).** (design §15) Validity on the contract only; the default contract
    offered by rule; bills_holder and party_type, with the payer captured on the booking ("Surgeon
    fixed-fee arrangements set the price but the patient pays"); a typed price only on adjustable
    contracts ("Third-party agreed prices cannot be changed by the anaesthetist") but also valid on
    first-party contracts ("Anaesthetists keep discretion over their own pricing, including prepaid
    amounts"); "Fixed base units" becomes a "Base units" override ("They are starting values, not
    fixed"); the practice-wide self-pay price removed ("AA cannot set a common price for its
    members"); the receipt-not-invoice when prepaid removed ("Not confirmed. Handled by the prepayment
    specification"); "modifiers_excluded flag; per-modifier child table" removed ("The anaesthetist
    itemises modifiers in the note"); RVG history by audit records; a full upload closes missing lines
    rather than removing them; notes required "for modifiers and for price adjustments. None for a
    contract change". **Likely to change:** the "Prepaid difference... An increase is invoiced" row is
    not adopted (point 35), and the directors' locked modifiers (shown selected, at 0, per booking)
    imply a modifier record per booking procedure, which a free-text note alone does not give.
41. **The ERD, v4 (AR-30, draft).** It shows the six entities of design §3 with their keys and the
    fields above: RVG_GROUP and PROCEDURE as master data ("RVG and procedure defaults"), CONTRACT_LINE,
    CONTRACT and CONTRACT_HOLDER as contract data ("how a procedure is paid"), and BOOKING_PROCEDURE
    as booking data ("one procedure on one booking"). Relationships as labelled: a group "contains"
    procedures; a contract "contains" lines; a line is a "group line" or a "procedure line" ("XOR:
    exactly one of rvg_group_id / procedure_id"); a holder "holds" contracts; a procedure is
    "performed as" booking procedures; a booking procedure is "priced under" a contract. rate and
    discount_pct are marked "dormant: stored, no logic or UI yet" (now live, point 38). There is no
    entity for modifiers, the billable party, the anaesthetist, the booking itself or the import log.

## Other points: the RVG modifiers file

42. **What the file is, and why.** Donald asked for it (point 5; Notes 2026-10-06 · AA directors
    meeting #8). [NZSA RVG 2021 modifiers.md](<../../../Data files/NZSA RVG 2021 modifiers.md>) is "A
    transcription of every modifier, and every modifier-related rule, in the NZSA Relative Value Guide
    2021" (AR-16), made by an agent on 2026-10-07 from the PDF ("pages rendered and read visually,
    cross-checked against a pypdf text extraction, then re-checked in a second full pass"). Its own
    advice: "Spot-check against the PDF before relying on it." It serves the directors' rule: age
    cannot be removed; a modifier already in an RVG code's base units is shown pre-selected at 0 and
    locked; all others are optional. Its companion,
    [NZSA RVG 2021 included modifiers.csv](<../../../Data files/NZSA RVG 2021 included modifiers.csv>),
    has one row per code with an included modifier.
43. **The modifiers.** 30 modifier codes from the modifying factors table (RVG pages 12 to 13):
    PA1 to PA5 (pre-assessment), A1 and A2 (age), AS1, AS3, AS4 and ASE (ASA, and emergency), OB1 to
    OB4 (BMI), AI1 (awake intubation), P1 (non-supine positioning, 2 units), VM1 (vascular
    monitoring), TTE1 and TTE2 (echo), PACU1 (recovery), EAA1 (additional anaesthetist), POC 1,
    POC2a to POC2c, POC3a and POC3b (post-operative cover and reviews), NC1 and NC2 (nerve catheters),
    each with its units as printed and a page reference. Only age (A1, A2) is marked automatic from
    patient data; the rest are chosen by the anaesthetist. The time codes T1 and T2 are listed
    separately. Several values are not a plain number ("2 + Time", "4-6", "1 [Per Call]", "As Per
    T1/T2", caps), so a modifier's value needs more than one number. The guide reuses codes across
    tables (A1, A2 and P1 are also base codes; T1 is also a Thorax code), so a code alone is not a key.
44. **Codes whose base units include a modifier.** 20 codes, all including P1 (2 units): 6
    Neurosurgery (H7A 10, H7b 12, H8a 12, H8b 14, H9a 20, H9b 22; RVG page 7, "These Base Units
    include Loading for Prone Positioning if needed" (+2)) and 14 Spine (S1 to S10 with their
    sub-codes; page 9, the same note with no units printed, 2 taken from P1, whose own note says "It
    is included in Spine and Neuro Base units"). On these the system shows P1 at 0 and locked. Donald's
    example "H7A or H7B, the base units are 10" holds for H7A only: H7b is 12 (Notes 2026-10-06 · AA
    directors meeting #8). Other "includes" wording in the RVG (T3, A12, E1) is about the procedure's
    scope, not a modifier.
45. **Findings to confirm.**
    - No page 12 table of "typical and maximum" modifier values by body area exists in this edition:
      pages 12 to 13 give one flat value per modifier. The guide's §7 sentence (point 16) needs
      correcting or its source finding. What the RVG does give by body area is three notes:
      Neurosurgery (+2 included), Spine (included) and Upper Limb ("Add 2 units if sitting position",
      an addition, not an inclusion, scope within the group unclear).
    - Rules the RVG states that bear on pricing: "When multiple procedures are performed during one
      anaesthetic only ONE Base Unit should be charged" (page 6, and page 11); on a fixed-fee contract
      it is "reasonable to request a 'top up' which may utilise the RVG modifiers as a guide", agreed
      with the contract holder before the service (page 4); "It is strongly recommended that all
      modifying factors are itemised" (page 12); and "The pre-operative, modifying and post-operative
      units are at the discretion of the individual anaesthetist" (page 14), so the age lock is AA's
      rule, not the RVG's.
    - Open in the file: the exact age band boundaries (exactly 1, 2, 70, 80); whether A1 or A2 stack on
      the age-split base codes H6b and P2; frailty is named with no code or units; worked example 2
      gives BMI 37 two units where the table gives one; whether ASE stacks with an ASA code; no
      after-hours, weekend or public-holiday loading anywhere in the RVG (any AA uses is outside it,
      for example on Vanessa's list).
