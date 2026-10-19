# Pricing model documents v6, 2026-10-16

- **Who:** Greg Smith (RFP author, Peritia), author of version 6 of the pricing model documents,
  which Greg walked through in the 16 October meeting with Donald Fraser (Stratos)
  ([transcript](<../artifacts/files/AA Meeting with Greg Oct 16th Reconciled Transcript.md>),
  [AR-38](../artifacts/AR-38.md)). Filed by Donald with his typed instructions of 2026-10-18
  (points 10 and 11); the artifacts carry the date 2026-10-16.
- **Covered:** how a procedure is priced and who pays, in business language (the executive
  summary) and as a data model with contract selection, resolver, price calculation, prepayment,
  contract versions, uploads and data loading (the technical design and its ERD). Version 6 replaces
  the 5 October guide *How procedures are priced and who pays* and the v4 technical design and ERD
  recorded in [Notes 2026-10-07 · Pricing model documents](2026-10-07-pricing-model-documents.md).
  The in-document version labels lag: the executive summary heading reads "Pricing Model V5
  Executive Summary", dated 12 October 2026, "Companion to Contract pricing model: technical design
  v5"; the technical design page header still reads "Draft v4".
- **Inputs gathered here:**
  - Donald's typed message of 2026-10-18 (points 10 and 11);
  - what Greg and Donald said about the documents in the 14 and 16 October meetings (points 54
    and 55);
  - the executive summary,
    [Pricing Model V6 Executive Summary.pdf](<../artifacts/files/Pricing Model V6 Executive Summary.pdf>)
    (and its [.docx](<../artifacts/files/Pricing Model V6 Executive Summary.docx>)), artifact
    [AR-28](../artifacts/AR-28.md), overwritten in place (it was the 5 October guide);
  - the technical design,
    [Contract pricing model - technical design v6.pdf](<../artifacts/files/Contract pricing model - technical design v6.pdf>)
    (and its [.docx](<../artifacts/files/Contract pricing model - technical design v6.docx>)),
    artifact [AR-29](../artifacts/AR-29.md), overwritten in place (it was v4);
  - the entity diagram, [AR-30.svg](../artifacts/files/AR-30.svg), artifact
    [AR-30](../artifacts/AR-30.md), overwritten in place (it was the v4 ERD).

Cite a point as `"Notes 2026-10-16 · Pricing model documents v6 #n"`. Points are numbered once
across the whole note. The documents' own wording is quoted where it matters (spelling fixed); the
summaries around the quotes are paraphrase, with the documents as the authority. Positions are
"exec v6 p.n" (executive summary page), "tech v6 §n, p.n" (technical design section and page) and
"ERD v6". Where v6 differs from v4 or the 5 October guide, the point says so. The documents are
Greg's proposal: they record his design, and where a catalogue item or a directors' answer says
otherwise, the point says which and leaves it open unless Donald settled it.

## Questions answered

1. **One list, the RVG groups; routine procedures become default-contract lines (OQ-88,
   partly).** v6 drops v4's PROCEDURE master table, its body_section field and the body section,
   group, procedure picker. The only master list is RVG_GROUP (code, anatomy, procedure, base_units,
   modifier_units) (tech v6 §4, p.4). Frequently performed procedures can instead "be loaded as
   Contract Lines in the Default Contract", so an admin or anaesthetist can "choose this
   pre-defined procedure rather than just specifying the RVG Base code" (tech v6 §14, p.13; exec v6
   p.4). So in Greg's design the answer to question 1 is one master list (RVG groups), with
   procedures as contract lines, not children of the RVG. Question 2 is answered for lines: each
   contract line carries a system line_key and an optional reference_code (point 44); RVG groups
   keep a surrogate key. Left open: the catalogue still has a procedure master (US-05.1.6) and body
   sections (US-05.1.3); whether they go is for Donald and Greg.
2. **A contract may hold no lines, and is offered by context, not by line (OQ-98, in effect).**
   The ERD key: "A contract may hold no lines." (ERD v6). Selection lists the default contract
   first, "followed by every contract that is valid on the procedure date, and fits the booking's
   context: the hospital, the surgeon or rooms, and anaesthetist-specific lists etc." (tech v6 §6,
   p.7), with no v4 test that the contract has a line for the procedure or its group. A hospital
   contract using RVG is one of the five typical arrangements (point 30). Left open: the exact
   context rules for offering a contract (US-04.3.2).
3. **Contract rate and discount are live line values; no time band (OQ-89, partly).** Each contract
   line may carry price, rate ("An override unit rate in place of the anaesthetist's default rate")
   and discount_percent ("A contract-level percentage discount") (tech v6 §4, p.5), where v4 had
   rate and discount as "dormant". The line has no time band, add-on or quantity rule. Whether the
   anaesthetist may change a contract's price, rate or discount is set per contract by is_editable
   (point 27), which answers the remaining half of OQ-89 for a fixed discount contract: the
   anaesthetist can add their own only where the contract is editable. Bears on US-05.2.6,
   US-05.4.3, US-04.2.2 and US-04.2.4. Left open: confirming the time band is dropped from
   US-04.2.4.
4. **Prepayment is triggered by choosing a prepay contract, whose line always has a price (OQ-92,
   in effect).** "Trigger. The admin managing the booking process, selects a Contract that specifies
   is_prepay = true." and "Amount: The Contract Line will always specify an (estimated) fixed price."
   (tech v6 §11, p.10; exec v6 p.4). v4 triggered prepayment from the anaesthetist's prepaid set
   (procedures or RVG groups) and left the amount open. With the trigger on the contract, a prepaid
   procedure without a price on the anaesthetist's contract no longer arises. Left open: v6 does
   not mention the prepaid settings on the anaesthetist profile (US-06.1.1, US-12.1.3), which the
   catalogue uses to detect prepayment (US-06.2.1).
5. **Insurance indication stored on the booking procedure (OQ-93, partly).** The booking procedure
   gains insurer ("Txt, name of insurance provider") and insurance_acceptance ("Reference code when
   insurance claim has been accepted"), set by the admin or the anaesthetist (tech v6 §4, p.6). The
   surgeon's booking or the hospital update "may indicate insurance status (for example SXAP)"; a
   patient-billed contract with an "insurer pays" indication "raises a warning at review. It is not
   a block, because pre-approval may fall through on the day", marked "TBC" (tech v6 §10, p.9-10;
   exec v6 p.2). v4 said where the indication is stored was open. Left open: whether it narrows the
   contract list (US-04.3.2), and the warning itself is still TBC. Bears on US-07.2.2, US-11.4.1.
6. **The prepaid price is editable, and a lower price is refunded (OQ-96, OQ-97, not settled).**
   "Settlement. The prepaid amount behaves as an editable fixed price." Unchanged, nothing more is
   billed; raised, "the difference is billed as an additional invoice"; lowered "(by altering the
   price or applying a discount) a refund process is invoked for the difference" (tech v6 §11, p.10).
   The executive summary: "Lowered, by price or discount: the difference is refunded." (exec v6
   p.4). The changes table now reads "A refund may be issued ... AA may refund prepayments." where
   v4 read "No refund (to confirm) ... AA does not refund prepayments." (tech v6 §15, p.14). This is
   in tension with the directors' answer of 6 October, recorded in US-06.4.1: nothing further is
   calculated after a prepaid procedure, and the anaesthetist raises an ad hoc invoice or credit
   note by hand. Left open for Ben (OQ-96); how a refund for part of a prepayment is made is not
   said (OQ-97). The technical design also says "The management of prepay and surgeon fixed price
   contracts is not fully resolved in this scenario" (tech v6 §12, p.11).
7. **A procedure may be left blank at setup for the anaesthetist (OQ-99, partly).** With the default
   contract the admin may pick an RVG entry or a routine procedure line, and with any other contract
   a contract line; in both cases "The admin may also leave this blank, for the anaesthetist to
   assign at a later time." (tech v6 §6, p.7). The contract line "Must be not null for billing"
   (tech v6 §4, p.6), and "a method is required for the anaesthetist to forward an incomplete Booking
   Procedure to the Admin team for resolution" (tech v6 §9, p.9). Left open: what must be filled in
   before the anaesthetist marks the booking complete (US-03.6.1), and whether the contract itself
   may be blank (point 53).
8. **The contract line's description goes on the invoice (OQ-103, partly).** "In situations where a
   Contract Line is selected, the Description from that Contract Line is used as the description on
   the invoice, rather than the description from the Booking Procedure details." (tech v6 §14,
   p.13). A line description is nullable: "If null use Booking Procedure description on invoice"
   (tech v6 §4, p.5). The booking procedure holds two fields, booking_description and
   invoice_description (point 29). v6 has no general procedure per RVG group, so the general
   procedure's wording does not arise in Greg's design. Left open: what the invoice says when only
   an RVG code was picked on the default contract (US-03.1.9, US-05.1.6).
9. **Upload with a review dashboard for ongoing contract maintenance (OQ-100, Greg's position, not
   settled).** "The loading mechanism is open. The suggested MVP baseline is a developer-run import,
   then office screens to create, edit and retire records. Ongoing contract maintenance then uses
   the in-app upload and review dashboard described above." (tech v6 §12, p.12). Exporting the
   current contract to the template "is recommended for the MVP" (tech v6 §12, p.12). v4 called the
   in-app upload and export "later options". Points 40 to 48 record the design. Left open: whether
   the upload is in the first release.

## Donald's notes

10. **The v6 documents overwrite the v4 artifacts and feed every relevant requirement.** Typed
    2026-10-18: "These new pricing documents overwrite the v4 artifacts. So please bring all of
    these into the requirements board, and update all of the relevant requirements. There are some
    changes in the repo uncommitted that need looking into. And you will hear me request you to
    update requirements a lot in the transcripts." The uncommitted changes are the board edits
    Donald made live during the 16 October meeting. AR-28, AR-29 and AR-30 now point at the v6
    files; the v4 technical design files and the 5 October guide stay in the files folder.
11. **How a Procedure is priced: its Contract.** Donald's typed decision of 2026-10-18 on the
    documents' price ordering (point 32): the Contract currently on the Procedure dictates how the
    Procedure is priced. A change is a change to the Procedure's Contract, or to the values on the
    Procedure itself by whoever is permitted, and the last edit stands. The documents' step order is
    not adopted for the build. Settled. Bears on FT-05.4, US-05.4.1, US-05.4.2, FT-03.4, US-03.4.1
    and US-04.2.2.

## Other points: the document set

12. **What v6 removes.** Gone from the technical design: the PROCEDURE master table and
    procedure_id on contract lines; body_section on the RVG group and the body section, group,
    procedure picker; RVG group lines and the line XOR rule; party_type (THIRD_PARTY, FIRST_PARTY),
    bills_holder and anaesthetist_id on the holder, with the derived "adjustable" rule; the
    billable-party truth table; the "Dormant capabilities" section; the "Open points" section; the
    text on the default contract navigation flaw and the empty-line alternative; the "stack of
    transparent sheets" description of the resolver; price_entered, discount_pct_entered and
    payer_name, payer_email on the booking procedure (tech v6 §2 to §15). The terms table adds
    "Booking (the term "Card" has been retired)" (tech v6 §2, p.2). Bears on US-05.1.3, US-05.1.6,
    FT-05.1, US-04.1.1. Settled as the document set.
13. **The "Changes from v3" table.** Now section 15 (v4's section 14), still headed "v3 | v4 | Why"
    (tech v6 §15, p.14). Rows that differ from v4: the default contract row keeps "Offered for every
    procedure by rule" but drops "Resolver has four layers"; holder always billed becomes "Payer
    captured on the booking. See Section 5"; the timesheet price "True, but may not be editable",
    because "Fixed pricing contracts cannot be changed by the anaesthetist"; the prepaid difference
    "An increase is invoiced. A refund may be issued" (point 6); the full upload row becomes "Alter
    (merge by Operation) or Replace. Every change creates a new dated version", because "Hospitals
    send regular adds and updates. Nothing is backdated or deleted."; override units "with an
    explanation" becomes "Note required for modifiers. None for a contract change" (v4 also
    required a note for price adjustments). Unchanged rows: "Practice-wide self-pay price via
    default contract lines: Removed. AA cannot set a common price for its members."; RVG history by
    audit records; modifiers_excluded and the per-modifier table removed; receipt-not-invoice
    removed. Bears on US-04.2.10, US-06.4.1, US-04.2.13.

## Other points: the executive summary (AR-28)

14. **The pricing formula and its inputs.** "Price = (Base + Time + Modifiers) × Rate × (1 −
    Discount %)". Base units from "The RVG entry for the procedure's anatomical group, chosen by the
    office or the anaesthetist"; time units "Entered by the anaesthetist after the procedure";
    modifier units "Claimed by the anaesthetist, with a note explaining them; zero by default"; rate
    "The anaesthetist's own unit value, unless a contract sets a rate"; discount "Optional
    percentage, shown as a separate line on the invoice". "A fixed price, rate or discount set by a
    contract or entered by the anaesthetist, overrides the default RVG calculation. Contracts only
    state what differs from an RVG style calculation." (exec v6 p.1). Same substance as the 5
    October guide, with the contract rate and discount now live inputs. Bears on FT-05.2, US-05.2.1,
    US-05.2.5, US-05.2.6, US-05.4.3. Settled as written.
15. **Who pays, and "no contract" as a contract held by AA.** "Under the covers everything is
    represented as a contract, even "no contract" is a Contract. The selected contract configuration
    decides who receives the invoice." Default contract (RVG): the patient, or a guardian or other
    payer named on the booking; a contract where the holder pays: "typically an insurer, or a
    hospital acting an agent for one"; a contract where the patient pays ("a surgeon's fixed fee, an
    anaesthetist's price list"): the patient or the named payer. ""No contract" is itself a standing
    contract held by AA, so every procedure follows the same pricing and billing path. Insured
    patients who claim the money back themselves are billed as no contract." (exec v6 p.1-2).
    Bears on FT-11.2, US-11.2.1, US-11.2.2, US-11.4.2, US-04.3.3. Settled as written.
16. **Five typical arrangements, and the office override.** "Five arrangements cover most work; a
    Contract is configured and then can be associated with any procedure." The table (who pays,
    price based on, anaesthetist can change price, prepaid): No contract (RVG): patient, RVG units ×
    anaesthetist's rate, yes, no; hospital contract using RVG: hospital, RVG units, yes, no; hospital
    fixed-price contract: hospital, contract price or rate, no, no; anaesthetist's prepay price list:
    patient, anaesthetist's own price, yes, yes; surgeon's fixed-fee arrangement: patient, surgeon's
    fixed fee, no, no. "Other combinations can be set up for specific billing needs." "The office
    admin can override any price at any time, and that is the only way to change a fixed price
    without changing the contract. In this context, "price" may be any of Price, Rate or Discount
    %ge." (exec v6 p.2). Bears on US-04.1.1, US-04.2.1, US-04.2.14, US-05.4.2. The arrangements are
    settled as written; how the office's change is read is point 54.
17. **The four-step process.** "The office sets up each procedure, the anaesthetist completes it, the
    office reviews it, and the system prices and invoices it." Figure 1, headed "The billable party
    is identified first; pricing and invoicing follow": (1) office booking setup, "Identify the
    billable party: choose the contract holder, then the contract", which "decides who is invoiced:
    the Patient or the Contract Holder", and "A prepay contract will initiate the prepay letter and
    invoice process"; (2) anaesthetist time entry, "Record BTM units, and notes, if required",
    "Change the procedure, contract or RVG entry if needed; changes are audited", "Override a Price,
    Rate or Discount, when required"; (3) office review, "Check flagged changes and warnings, such as
    insurance on a patient-billed contract", "Override pricing if needed"; (4) billing system
    authorisation and invoice, "Record the price and its source; invoice the billable party". "The
    booking list is a starting point: the anaesthetist can change the details, and the office see the
    changes at review." (exec v6 p.3). Bears on US-04.3.4, US-03.4.1, US-07.2.2, US-07.3.1, FT-08.1.
    Settled as written.
18. **Booking updates: rooms PDFs, a daily hospital list, review and merge.** New in v6. "Bookings
    can undergo numerous changes between the first entry and the procedure day. The system will
    receive booking updates as PDFs from the surgeon's rooms as List updates, whenever changes have
    been made to a List. Each day, the hospital will provide an updated theatre list of the
    following days bookings, as a PDF and as a direct data integration. Changes might include any
    data field held in the booking. The system will provide a review and merge capability for office
    staff to review changes as they are received." (exec v6 p.3). Bears on FT-02.1, FT-02.2,
    US-02.1.1, US-02.1.3, US-02.1.5, US-02.2.1, FT-02.5, US-02.5.1, and OQ-13 (hospital download
    format). Open as to format and integration.
19. **Prepayment, as the executive summary puts it.** "Prepaid procedures, common for cosmetic
    surgery, are collected up front at an estimated price and settled after the procedure." At
    booking the office selects the anaesthetist's prepay contract, which "starts the automated
    prepay process (letter and invoice)"; "The amount is always the fixed price on that contract's
    line"; after the procedure the anaesthetist confirms or changes the price, and the difference is
    invoiced or refunded (exec v6 p.4). See points 4 and 6. Bears on FT-06.2, US-06.2.2, US-06.3.6,
    FT-06.4.
20. **Price reviews and controls.** Introduced with "This area is still under active design
    discussion": a holder's revised schedule "(e.g. Christchurch Eye) is loaded as a new version;
    the old version closes the day before the start date, and nothing is deleted"; "Lines are
    matched to the previous version by their reference code, and a preview shows new, changed and
    removed lines before anything is applied. Removed lines still used by live bookings are
    highlighted."; "Each contract states whether anaesthetists may change its prices. Hospital
    fixed-price contracts are normally non-editable; RVG-based contracts are not."; "Changes to a
    booking's contract or procedure at time entry need no reason, but are recorded and flagged at
    office review. Changes to RVG groups, contract holders and contracts are audited."; routine
    procedures as lines on the no-contract arrangement, whose "descriptions appear on the invoice";
    "AA does not set prices for its members. The no-contract arrangement carries no practice-wide
    prices, which competition law does not allow."; "The first release uses a developer-run import,
    with office screens to create, edit and retire records." (exec v6 p.4). Bears on US-04.2.10,
    US-04.2.13, US-04.1.3, US-04.3.3, US-13.4.3, OQ-100. Open as the document says.

## Other points: the technical design v6 (AR-29) and ERD (AR-30)

21. **Purpose: the RVG as a lookup, base units a light task.** "The system should support the
    ability to associate a Procedure (in a Booking) with an RVG Base value, using a lookup
    capability. The design recognises that the RVG Base Unit allocation is a light-weight task that
    Anaesthetists may prefer to manage at the point in time of the procedure." The three ideas:
    "Defaults live once. The RVG Groups table holds the published Base unit values. Booking
    Procedures start from them and override where needed."; "Contracts are sparse overrides"; "One
    path for every booking procedure", with "No contract" modelled as a default contract (tech v6 §1,
    p.1). Bears on US-05.1.1, US-03.3.1, OQ-62. Settled as written, except that
    point 11 governs how a price is arrived at.
22. **Terms.** Booking ("Card" retired); Booking Procedure, "A Procedure contained in a booking,
    with its associated contract, BTM units and price", replacing v3's episode; Time Entry, which
    includes "any specific price or discount overrides"; Contract Holder ("an insurer, hospital,
    surgeon's rooms, or an anaesthetist"); Contract, "A dated set of pricing terms belonging to one
    Contract Holder. An arrangement not intended to imply a legal contract."; Default Contract, "The
    single contract flagged is_default=true. AA is the Contract Holder, with
    is_billable_party=false."; Payer, "The name and details of the Billable Party captured on the
    booking. Defaults to the patient and editable (for example to a nominated guardian)."; Resolver,
    "The function that uses the information in a Booking Procedure to calculate and return the
    Booking Procedure price. Calculated as at the procedure date."; Price source, business wording
    "Not used (?)" (tech v6 §2, p.2). Bears on US-04.1.1, US-04.1.5, US-11.2.2, US-03.2.3. Settled
    as written.
23. **RVG_GROUP.** "The published RVG group, as listed in the NZSA guide. AA may add its own
    groups." Fields: rvg_group_id (surrogate key, "RVG codes are not unique enough to be keys"),
    code, anatomy, procedure (all required, as published), base_units (required, greater than 0,
    "The bottom layer of the resolver, so base units always resolve") and modifier_units (required,
    default 0, "This is how the system populates the default modifier value") (tech v6 §4, p.4). One
    base units figure per group, so OQ-101 (how a range is held) stays open. Bears on US-05.1.1,
    US-05.1.4.
24. **CONTRACT_HOLDER: is_billable_party, billable_party_id, practitioner_id.** is_billable_party:
    "True when AA invoices the holder (insurer, hospital, etc). In all other cases (false) AA
    invoices the patient/guardian (eg surgeon fixed-fee arrangements, anaesthetist lists, default
    contract)." billable_party_id links to the existing billable party record; "A billable party
    may be referenced by multiple contract holders. (This would be unusual)." practitioner_id is
    "Set where Contracts are used to specify anaesthetist specific "contract", typically used to
    setting prepay price lists. Can also be used to indicate when the contract is with a surgeon
    ... but is usually not prepay. Used to ensure that these contracts are only selectable when
    managing bookings for this anaesthetist and/or surgeon" (tech v6 §4, p.4). is_billable_party
    is v4's bills_holder renamed; practitioner_id replaces anaesthetist_id and now also covers
    surgeons. Bears on US-04.1.5, US-04.2.1, US-04.2.14, US-04.3.2, US-11.2.1, OQ-67, OQ-91.
    Settled as written.
25. **CONTRACT: versions, flags and the forward link.** A Contract "is kept as a series of dated
    versions: every change, whether an alteration or a replacement schedule, creates a new
    version". Fields: contract_holder_id (required; the default contract is held by AA),
    version_number ("A system generated sequential number"), name ("The default contract shows as
    "No contract (RVG)""), is_default ("The default contract is found by this flag, never by its
    name"), valid_from (required) and valid_to (nullable, "Validity sits here, not on lines"),
    is_editable, is_prepay, revised_contract_id ("Forward link from a version to the version that
    replaced it", replacing v4's previous_contract_id) and import_ref ("Points to the upload or edit
    session, and its audit records") (tech v6 §4, p.5). Bears on US-04.1.2, US-04.1.3, US-04.1.4,
    US-04.2.10. Settled as written.
26. **CONTRACT_LINE.** "A contract's terms for an (undefined) group of procedures (e.g Cataracts),
    which references one RVG group for unpriced work, or has a fixed price/rate/discount specified."
    Fields: line_key, reference_code (point 44), description (nullable), rvg_group_id (nullable),
    base_units and modifier_units (nullable, "0 is a value that masks the default values"), price
    ("Either a fixed price, or prepay amount, for the procedure. BTM data is ignored."), rate and
    discount_percent (tech v6 §4, p.5). v4's fixed_price is now price; rate and discount are no
    longer dormant (point 3). Bears on US-04.2.4, US-04.2.2, US-05.2.5, US-05.2.6, US-05.4.3.
    Settled as written.
27. **is_editable and the office override.** "A flag to indicate if this contract's lines pricing
    is overridable (by the anaesthetist). Admins can always override." (tech v6 §4, p.5). "For
    Hospital fixed price contracts this is typically set to False to prevent the anaesthetist
    overriding the price and discount fields for Fixed Price contracts. Conversely, for procedures
    using RVG values, it is set to True." "The office can override any pricing at any time. That
    admin override is the only way to change a non-editable price without changing the contract."
    (tech v6 §5, p.7). v4 derived "adjustable" from the holder and had the office override "with a
    reason"; v6 puts the flag on the contract and states no reason. Bears on US-05.4.1, US-05.4.2,
    US-03.5.1, US-04.2.2, OQ-16. Settled as written.
28. **is_prepay.** "If True, triggers an automated prepay process (letter, invoices etc)" (tech v6
    §5, p.7); "A flag to indicate if prepayment is required for these contract lines" (tech v6 §4,
    p.5). See point 4. Bears on FT-06.2, US-06.2.1, US-06.3.6, OQ-76.
29. **BOOKING_PROCEDURE fields.** "Note that the Price and Discount %ge data may be made
    not-editable by the Contract." contract_id and contract_line_id are "FK, nullable", "Office can
    setup; anaesthetist may change", "One contract line per booking procedure. Initially set by
    Admins. Must be not null for billing"; base_units "Default from RVG, editable by anaesthetist";
    time_units "Not required if Price is specified"; modifier_note "Required when modifier units are
    claimed. Insurers ask for it."; price "A multi-use field to hold either a fixed price, a
    prepayment amount or a price override. Null otherwise, may be zero."; discount_percent "Details
    shown on invoice"; rate "Not editable", set by the Contract, "Allows for rate contracts";
    adjustment_reason "Optional" (v4: "Required with a price or discount"); total_price, "Somewhere
    to keep the billed amount"; patient_contact_details, required, "Also the default billable
    party"; payer_contact_details, optional, admin team; alternate_payer, boolean, default false,
    admin team; price_source (point 34); insurer and insurance_acceptance (point 5) (tech v6 §4,
    p.6). A "Design Revision" note: "The Booking Procedure contains the default invoice description
    (not shown). So Booking Procedure will require 2 fields: booking_description and
    invoice_description, to accommodate the case where a default description is replaced by a
    contract line description." (tech v6 §4, p.4). Bears on US-03.4.1, US-03.5.1, US-03.5.3,
    US-11.2.2, US-11.2.3, FT-11.4, US-02.5.7, US-03.1.9. Open where the ERD differs (point 53).
30. **The four flags and how the cases map.** "Four flags drive who is billed, and how, and what the
    anaesthetist can change": Contract_Holder.is_billable_party, Contract.is_editable,
    Contract.is_prepay and Contract_Holder.practitioner_id. The typical prepay case: "The Billable
    Party is the patient, the anaesthetist is nominated, the arrangement is pre-pay, and the amount
    is editable by the anaesthetist." The mapping (is_billable_party, practitioner_id, is_editable,
    is_prepay): default hospital contract using RVG true, null, true, false; hospital contract,
    fixed price or rate true, null, false, false; default contract, patient pays false, null, true,
    false; anaesthetist fixed price (prepay) list false, set, true, true; surgeon's fixed-fee
    arrangement false, set, false, false. "Various other combinations can be used to achieve
    specific billing outcomes." (tech v6 §5, p.6-7). Bears on FT-04.2, US-04.1.1, US-04.2.1,
    US-04.2.14, FT-11.2, US-11.2.1, OQ-67, OQ-91. Settled as written.
31. **Contract selection.** (1) At booking setup the admin reviews the booking "to ascertain the
    hospital, surgeon, and procedure description", then "identifies the relevant Billable Party by
    selecting a Contract Holder and then Contract (may be Default RVG contract)". "The default
    contract should always appear first in any list", then every contract valid on the procedure
    date that fits the booking's context. (2) With the default contract the admin picks an RVG entry
    "to set the default Base Units" or a routine procedure line; with any other contract, "the most
    relevant Contract Line, which may specify any of the pre-defined values for: RVG Base Units,
    Price, Rate, or Discount"; either may be left blank (point 7). (3) "At any time before the list
    is submitted, the anaesthetist may: change the procedure, the contract, the RVG code, Price, Rate
    or Discount (where permitted). No reason is needed. The change is audited and flagged at office
    review." (4) "On any change The resolver re-runs, and the pricing variables (Base, Price, Rate,
    %ge) refresh." (tech v6 §6, p.7-8). v4 picked the procedure first (body section, group,
    procedure) and listed "the insurer" in the context. Bears on FT-03.4, US-03.4.1, US-03.3.1,
    US-04.3.1, US-04.3.2, US-04.3.3, US-04.3.4, OQ-66. Settled as written.
32. **How the documents order the price (not adopted for the build, point 11).** Recorded as
    written. The executive summary's "Which price wins": once authorised, the price is calculated in
    four steps, "Each step, where the condition is valid, overrides the previous step": RVG
    calculation; contract price; the anaesthetist's entry, "Only allowed on contracts the anaesthetist
    can change"; admin override at post time-entry review. "The system records which rule (above)
    set the price" (exec v6 p.3-4). The technical design's resolver "Pricing Sequence, highest
    precedence first": price if entered; rate if entered; BTM × rate; discount (tech v6 §7, p.8); and
    its "Precedence/Sequence" table: step 0 office override (OFFICE_OVERRIDE), step 1 anaesthetist
    alters price, rate or discount (ANAESTHETIST_PRICE), step 2 contract price (CONTRACT_PRICE, v4's
    CONTRACT_FIXED_PRICE), step 3 RVG pricing (CALCULATED) (tech v6 §9, p.9). The data model caption
    still reads "Precedence rises from the master data (green) to the contract overrides (purple)"
    (tech v6 §3, p.3). Bears on FT-05.4, US-05.4.1, US-05.4.2. Donald's decision in point 11 governs
    the build.
33. **The resolver.** "The Resolver calculates the pricing for the procedure. It checks for Contract
    validity and uses the values in the Booking Procedure." The validity check is needed because
    "Contract arrangements (fixed prices) may have changed in the time between when the Booking was
    first made, and when the Procedure was carried out", so it "checks that the Contract date is valid
    and, if necessary, refreshes any data from the revised Contract Line". Inputs: "The Procedure data
    within a Booking. (Base, Time, Modifiers, Price, Rate, %ge)". "Any discounts calculated are shown
    on a separate invoice line." (tech v6 §7, p.8). v4's resolver returned starting units and
    contract terms through four layers; v6's calculates the price from the booking procedure's own
    values. "Prices are calculated using the contract version in force on the procedure date." (exec
    v6 p.4). Bears on FT-05.2, US-04.2.10, OQ-48. Settled as written.
34. **The snapshot and price_source.** At authorisation each booking procedure stores "the
    procedure, the contract (each version is its own row, so the id is enough), the resolved values
    and their layers, the recorded BTM, the rate and discount used, the price, the price_source, and
    the billable party or payer details. Later changes to the RVG, procedures or contracts never alter
    historical billing" (tech v6 §9, p.9), unchanged from v4. price_source is "Required", set by the
    "Billing engine at authorisation", with "(?Price Source TBC)" (tech v6 §4, p.6); the terms table
    marks Price source "Not used (?)" (tech v6 §2, p.2). "A price of 0 produces a no-charge invoice.
    BTM is still recorded, if entered." (tech v6 §9, p.9). Bears on US-07.3.2, US-08.4.4, FT-08.1.
    Whether price_source is kept is open.
35. **Treatment of nulls.** Unchanged from v4 in substance: "Null means "not specified here", and
    resolution looks through to the next layer. A value, including 0, stops it."; an explicit 0
    above the RVG "is only needed to switch off a non-zero value beneath. That is rare, but some
    contracts could zero modifiers" (v4: "do"); editing screens show "the inherited value as a
    greyed placeholder, with an explicit choice between inherit (stored as null) and override";
    "In import spreadsheets, a blank cell means inherit and an explicit 0 means zero." (tech v6 §7,
    p.8). Bears on US-04.2.4, US-04.2.13. How blank cells are read in an upload is open (see
    also point 11).
36. **Time entry and modifiers.** "The resolved base and modifier units are shown as starting values.
    The anaesthetist enters time units and may change base and modifier units. Out-of-range values
    warn the office. They are never blocked." "Modifiers are itemised, with a required modifier_note
    when any are claimed. Whether modifiers are ever pre-filled is open (section 15)." "The record
    keeps the values the anaesthetist recorded." (tech v6 §8, p.8). "base_units and modifier_units
    are optional for the user at time entry" (tech v6 §13, p.13). The executive summary has modifier
    units "zero by default" (exec v6 p.1) and the RVG group modifier_units default 0. Bears on
    US-03.3.1, US-03.3.4, US-03.3.8, US-05.1.5, OQ-56, and OQ-95 (no ASA pre-fill), which v6 does
    not settle.
37. **Validation, and forwarding an incomplete procedure to the office.** "The Time Entry process
    prohibits entry of price or discount when a contract is not editable". It "rejects
    Submission/Update where: No Price resolves; The selected contract is not valid on the procedure
    date - if not resolved, use original data, and flag a warning". "However, a method is required
    for the anaesthetist to forward an incomplete Booking Procedure to the Admin team for resolution,
    where any issues arise." (tech v6 §9, p.9). New in v6: the forwarding method; v4 had the
    billing engine reject the booking. Bears on FT-03.6, US-03.6.1, US-03.6.2, US-07.2.3, US-13.7.1.
    Open as to how the forwarding works.
38. **Multi-procedure rules.** "The multi-procedure rules (for example base units on the primary
    procedure only, allocation of Modifiers) are applied to adjust the units of CALCULATED
    procedures" (tech v6 §9, p.9). v4 said whether the rule still applies "is being confirmed with
    AA"; v6 states it without that caveat. AA have not confirmed it in these documents, so OQ-90
    stays open. Bears on FT-05.3, US-05.3.1.
39. **Billable party, the insurance warning and AA as agent.** Default RVG contract: "The patient by
    default, editable to be another person or a guardian"; is_billable_party true: "The Contract
    Holder itself, or nominated billable party"; false: "The patient, or other nominated payer".
    "AA acts as agent for independent anaesthetists, so the system permissively accepts the
    anaesthetist's choice of contract and used on office review to catch mistakes." (tech v6 §10,
    p.9-10). The warning is in point 5. Bears on FT-11.2, US-11.2.1, US-11.2.2, US-07.2.2,
    US-13.7.1, OQ-55, OQ-93.
40. **Maintaining a contract on one screen, staged and submitted.** New in v6. "Contracts change in
    two ways: a correction or mid-year update to some of their lines, and a periodic renewal of the
    whole schedule. Both are handled on one screen for a single contract and follow one rule: every
    change creates a new contract version from a date the office chooses. Nothing is backdated and
    nothing is deleted." The header holds "the name, dates and flags"; lines can be edited on screen
    or loaded from an upload in the AA template; "Edits and uploads are not applied straight away.
    They are staged and shown on a review dashboard for that contract. The office reviews them, then
    submits."; "Screen edits and uploads follow the same rules and can be combined in one review."
    (tech v6 §12, p.10). Bears on US-04.1.2, US-04.1.3, US-04.2.13, OQ-100. Open with OQ-100.
41. **Alter and Replace.** Alter is "Correcting an error. Mid-term adds and updates to a subset of
    lines (some hospitals send these regularly)": the new version starts with "A copy of every line
    in the current version", rows are applied by their Operation, and lines not in the upload are
    "Carried forward unchanged". Replace is "Periodic renewal, or any complete new schedule": the
    new version starts with "No lines", the rows "Form the complete new schedule", the Operation
    column is ignored, and lines not in the upload are "Not carried forward. They remain on the
    previous version only." (tech v6 §12, p.10). Replaces v4's delta and full uploads. Bears on
    US-04.2.13, US-04.1.3, US-04.2.10.
42. **Effective dates and the version chain.** "Effective From starts blank and must be entered
    before submit. There is deliberately no default: a default of today or tomorrow would nearly
    always be wrong." "Changes are never backdated. Effective From cannot be in the past." On submit
    the previous version's valid_to is set to the day before and the new version is open-ended;
    "Consecutive versions never overlap and never leave a gap." "The procedure date decides which
    version prices a booking procedure. A procedure performed before the Effective From is priced
    from the earlier version, even if it is invoiced later." "A contract ends without a successor
    only when the office enters a valid_to on its current version." The worked example: Hospital X's
    version 3 from 1 April; on 20 October six line updates effective 1 November, uploaded in Alter
    mode; version 4 from 1 November, version 3 ends 31 October; a 25 October procedure is priced
    from version 3, a procedure booked for 3 November "is relinked to the matching version 4 line"
    (tech v6 §12, p.10-11). Bears on US-04.2.10, US-04.1.3, OQ-48 (procedure date, as answered).
    Settled as written.
43. **One future-dated version, and correcting operator error.** New in v6. "A contract may have
    only one future-dated version at a time." Until its Effective From, "nothing has been priced from
    it, so it can be corrected freely": amend its lines or header, change its Effective From ("the
    current version's end date moves with it"), or withdraw it ("The current version becomes
    open-ended again, and any booking procedures already relinked return to the matching current
    lines"). "Once a version is in effect, an error is corrected with a new version from a chosen
    date. Any affected procedures in between can be adjusted with the office price override." (tech
    v6 §12, p.11). Bears on US-04.1.3, US-04.2.10, US-05.4.2.
44. **Line identity: line_key and reference_code.** "line_key is generated by the system, unique and
    never reused. When Alter copies a line into a new version, the line keeps its line_key. It is how
    booking procedures are relinked across versions, and it is included in an exported template."
    "reference_code is the contract holder's own code for the line. Hospitals supply their own codes.
    It is optional, and unique within a contract when present. It lets a hospital's file be matched
    without anyone looking up system codes." "Upload rows are matched on line_key when it is present,
    otherwise on reference_code." (tech v6 §12, p.11). v4 had no line code field. Bears on US-04.2.4,
    US-04.1.4, US-04.2.13, OQ-18. Settled as written.
45. **The upload template and the Operation column.** "One row per contract line, in the AA
    template. The mode (Alter or Replace) is chosen on the upload screen, not in the file." "A row is
    the complete line, not a patch. A blank cell is null, so the value shows through from the data
    below it (the RVG group). A filled value, including 0, overrides everything below it." In Alter
    mode: Add (must not exist; the system assigns its line_key), Alter (must exist; replaced by the
    row), Remove (must exist; not carried forward, and "Booking procedures on or after the Effective
    From that used it are flagged"), blank (row ignored, with a warning if it differs). "The
    Operation is checked, not guessed." In Replace mode the Operation column is ignored, a Remove row
    raises a warning, and new rows are matched to the previous version by reference_code to keep
    their line_key. "Exporting the current contract to the template, with its line_key values, is
    the easiest way to prepare an Alter upload. It is recommended for the MVP." (tech v6 §12,
    p.11-12). Bears on US-04.2.13, US-04.2.4, OQ-100.
46. **The review dashboard.** Before submit it shows header changes before and after with the
    Effective From; line counts added, altered, removed and unchanged; each altered line's changed
    fields, "with any value that becomes blank highlighted"; errors that block submit ("duplicate
    codes in the file, Operation mismatches, an unknown RVG group, invalid values, a missing or past
    Effective From, or a second future-dated version"); warnings that do not ("booking procedures
    affected by altered or removed lines and, for Replace, previous lines with no match in the new
    schedule"). "Submit applies everything or nothing." (tech v6 §12, p.12). Extends v4's preview.
    Bears on US-04.2.13, US-04.1.3.
47. **Effect of a new version on bookings.** New in v6. "On submit, un-invoiced booking procedures
    dated on or after the Effective From are relinked from the previous version to the new version's
    line with the same line_key." "Where there is no matching line ... the booking procedure is
    listed on the dashboard for the office to resolve." "Procedures dated before the Effective From
    are untouched. Invoiced procedures are also protected by the snapshot." (tech v6 §12, p.12).
    Bears on US-04.2.10, US-04.3.5, US-04.3.7, US-04.1.3.
48. **Data loading.** "All master data is prepared by AA as spreadsheets in AA-defined templates:
    RVG groups, procedures, contract holders, contracts and lines, plus hospitals, surgeons and
    rooms, and anaesthetists." "Loading must be repeatable, so test environments can be wiped and
    reloaded." The mechanism is open, with a developer-run import as the suggested baseline (point
    9) (tech v6 §12, p.12). Bears on US-13.4.1, US-13.4.2, US-13.4.3, OQ-100.
49. **History and audit.** "Creates, updates and retirements of RVG groups, procedures, contract
    holders and contracts are audited (who, what, when)." "Each contract submit also records the
    lines added, altered and removed, with before and after values, linked through import_ref.
    Billing history is covered by the snapshot." (tech v6 §12, p.12). Time-entry changes to the
    contract or procedure are audited and flagged at review (point 31). Bears on US-04.1.3,
    US-13.5.2, US-02.5.5. Settled as written.
50. **Integrity rules.** "Multiple Contract Lines (in a Contract) may reference the same RVG line";
    no overlap and no gap between versions, at most one future-dated version, Effective From never
    in the past; line_key unique and never reused, reference_code unique within a contract version
    when present; "Contract has valid date, otherwise substitute values current at date of
    procedure"; "Exactly one contract has is_default = true. Contract.valid_to_date = null";
    "base_units and modifier_units are optional for the user at time entry"; "is_billable_party=
    true requires billable_party_id"; "The time entry function rejects a price or discount change on
    a contract that is not editable. The underlying fixed price contract may have any combination of
    the pricing variables." (tech v6 §13, p.12-13). v4's XOR rule on lines and "a holder with
    anaesthetist_id set is FIRST_PARTY" are gone. Bears on US-04.2.4, US-04.1.3, US-03.3.1.
51. **Routine procedures on the default contract.** "Some procedures are performed on a regular
    basis. The intent ... is to include the ability to load a list of these as Contract Lines in the
    Default Contract. This allows an admin or anaesthetist to choose this pre-defined procedure
    rather than just specifying the RVG Base code. This is the same mechanism as choosing a Contract
    Line (for example) from a Fixed Price contract." (tech v6 §14, p.13). The documents do not say
    these lines carry prices; the executive summary says the no-contract arrangement "carries no
    practice-wide prices" (point 20). "No nesting of individual contract lines is provided. Each
    stands alone." (tech v6, p.13). Bears on US-05.1.6, US-04.3.3, US-04.2.4, US-03.1.9, OQ-88,
    OQ-98, OQ-103.
52. **The ERD v6.** Four entities in the model (RVG_GROUP, CONTRACT_LINE, CONTRACT,
    CONTRACT_HOLDER) and BOOKING_PROCEDURE, marked "out of scope", "shown for completeness, defined
    outside this document". Relationships: "base units from", "contains", "holds", "revised by",
    "selected for", "priced under". Key notes: "Default contract: is_default = true, held by AA.", "A
    contract may hold no lines.", "A booking procedure's line must belong to its contract." The
    fields match the tables in points 23 to 29, except as in point 53 (ERD v6). Bears on FT-04.2,
    US-04.2.2, US-04.2.4, US-04.1.5. Settled as written.
53. **Points to check with Greg.** Differences inside the documents, recorded as written: (1) the
    ERD and the data model figure show BOOKING_PROCEDURE.contract_id as "FK, required", while the
    table says "FK, nullable", set by the office and changeable by the anaesthetist (ERD v6; tech v6
    §3, p.3; §4, p.6); (2) the ERD has no insurer, insurance_acceptance, booking_description or
    invoice_description; (3) the Precedence/Sequence table writes the calculated step as "(B + T + M)
    × rate × (1-discount_percent)/100", where the executive summary has "× (1 − Discount %)" (tech v6
    §9, p.9; exec v6 p.1); (4) time entry still says modifiers pre-fill "is open (section 15)",
    though section 15 is now the changes table (tech v6 §8, p.8); (5) the booking procedure table
    has rate "Not editable", set by the contract, while contract selection and the executive summary
    let the anaesthetist change the rate where permitted (tech v6 §4, p.6; §6, p.7; exec v6 p.3); (6)
    the executive summary matches schedule lines "by their reference code", the technical design on
    line_key first, then reference_code (exec v6 p.4; tech v6 §12, p.11); (7) data loading and
    history still name "procedures", which v6 no longer models as a table (tech v6 §12, p.12); (8)
    the version labels (heading block); (9) the PDF shows tracked-change "Deleted:" balloons in its
    margins (tech v6 p.5, p.10, p.12, p.13, p.14). Bears on US-03.4.1, US-04.3.1, FT-05.2, OQ-99.
    Open.

## Other points: what was said about the documents in the meetings

54. **The office's change is the last edit, not a higher authority (14 and 16 October).** In the
    14 October meeting Donald read Greg's step list as a stack of things when he saw a single entry
    being updated, and said "I don't see it as an override. I just see it as the last person who
    touched it, because there's not actually one group of users having more authority over the
    other. As far as the system is concerned, it's who updated it, and what does that look like at
    the point you say 'send it'?" Greg: "Yeah, good. I agree." Donald: "Okay, we're aligned."
    (Transcript 2026-10-14 · AA meeting with Greg L974-1000). On 16 October Donald said the changes
    in the executive summary were "mostly documenting that, sequence-wise, probably the office was
    the last person to touch it, but they don't have any special authority" (Transcript 2026-10-16 ·
    AA meeting with Greg L61). The v6 text keeps the office override in points 16, 27 and 43;
    that wording is read as the last edit standing (point 11). Settled in the meetings; the v6
    wording was not changed to match.
55. **What Greg said he changed for v6, and how firm he called it (16 October).** Greg said: the
    word "locked" became "fixed" throughout (L47); the unresolved-issues section was taken out
    because "we can regard them as resolved" (L51); a line about the office entering the RVG code
    was taken out, which "doesn't change the fact that you can put one in" (L55); rate was added
    to "overriding a price rate or discount" (L55); and a booking updates section was added (L59).
    He added the approval number to the booking data (L94), after Vanessa and Ben described the
    booking list coming from the surgeon's rooms and the hospital sending one list, the next day's
    theatre list (L66-L130). The documents add insurer and insurance_acceptance fields (point 5) but
    do not use the words "approval number"; whether the two are the same field is not stated.
    On prepayment he agreed to note that managing prepay and fixed-price arrangements "is not
    fully resolved", for a schedule update must not change a prepay price (L344-L368; tech v6 §12, p.11;
    OQ-96). He called section 12 on uploads "a strategy, it's a proposal for how an upload might
    work", said the developers "might go, oh, this is ridiculously difficult or expensive", and
    called the schedule upload "to be confirmed" (Transcript 2026-10-16 · AA meeting with Greg
    L189, L233). Open as to the upload (point 9, OQ-100); the rest as Greg described.
