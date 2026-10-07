# RFP source trace, 2026-09-24

One-off audit of the pass that gave every catalogue item and outstanding item precise RFP sources
(`RFP p.<page> · <Section> › <subheading>`). Page = the printed footer page of
`Anaesthesia Associates Request for Proposal[Final].pdf`. Every quote below was string-checked
against the text of the page it cites. Safe to delete once reviewed.

- 305 files traced (271 items, 34 questions): 268 cite the RFP, 37 do not.
- Confidence: 207 high, 70 medium, 28 low. The 123 medium, low and no-match results were re-read by a second agent (✓).
- Item status `RFP` became `Proposed` (117 items); question status `Open (from RFP)` became `Open` (12).
- `Claude` sources were treated as unknown and removed.

## Needs you: no known source

| Outstanding item | Item |
| --- | --- |
| OQ-35 | US-06.3.5 Re-check when the Booking changes |
| OQ-36 | US-08.6.2 Credit note and re-issue |

OQ-14 and OQ-21 (questions, not requirements) also lost their `Claude` source and now cite nothing.

## Worth a look: low-confidence RFP matches

- **US-01.3.4**: RFP implies it via independent AM/PM Lists each with own hospital/surgeon; explicit rule from diagram.
- **US-02.1.4**: Unmatched queue from diagram; RFP requires manual intervention workflows where automated processing cannot proceed.
- **US-03.6.2**: UX derivation of RFP completeness validation before Card complete / List SUBMITTED.
- **US-04.1.2**: Lifecycle/effective dates from Q&A and fee schedules; RFP only requires invoices reproducible after Contract terms change.
- **US-04.2.6**: RFP priceOverride and Contract-permitted structures are partial origins; permission flags from Q&A.
- **US-04.2.7**: Contract-declared inputs from Q&A; RFP only requires minimum billing data validation before completion.
- **US-04.3.2**: Filtered list from Q&A; RFP only hints contracts keyed by holder, surgeon, procedure type.
- **US-04.3.4**: RFP has billing route set explicitly by hospital advice or AA; setup timing from Q&A.
- **US-05.1.2**: RFP notes curated list is not encyclopaedic; AA-added codes from Q&A.
- **US-05.1.3**: RFP only mentions anatomical-site organisation; prepaid groups from Q&A.
- **US-05.2.7**: RFP only mentions anaesthetists' GST periods and GST component; GST-exclusive pricing from data files.
- **US-05.3.3**: Rule from meetings/Q&A superseding RFP, which forbids modifiers on additional procedures.
- **US-05.4.1**: Anaesthetist adjustment from Q&A; RFP only has $ or % adjustments via priceOverride.
- **FT-06.2**: RFP only names pre-payment-required patient category; trigger logic from diagram/Q&A.
- **FT-06.3**: RFP pre-payment category plus ACCREC/ACCPAY pairing; prepayment invoicing flow from diagram.
- **US-06.2.1**: Detection by RVG code from Q&A/diagram; RFP only has pre-payment category.
- **US-06.2.3**: RFP implies balance after procedure; estimate framing from Q&A.
- **US-06.3.1**: Prepayment invoice at setup from diagram; RFP gives pre-procedure collection and ACCREC/ACCPAY pair.
- **US-06.3.2**: Status tracking from diagram/Q&A; RFP only requires collection before procedure.
- **US-06.3.3**: Alerting from Q&A; RFP only requires collection before procedure.
- **US-08.1.2**: Deliberate reversal of RFP step where engine resolves counterparty per Procedure; new rule from diagram/Q&A.
- **US-08.2.2**: RFP mentions pre-payment then balance; netting rule from diagram.
- **FT-13.2**: Ledger tools from Q&A; RFP only frames per-anaesthetist ledger and trust-account model.
- **US-11.2.3**: Required invoice email is Q&A; RFP only says invoices are emailed from billing engine.
- **US-12.1.5**: RFP requires AA-managed disbursement and payables run; bank account storage not explicit.
- **US-13.2.1**: Whole-ledger view Q&A; RFP frames trust-account model and paid/disbursed states.
- **US-13.2.2**: Per-patient balance mainly Q&A; RFP outstanding balance check per patient is nearest origin.
- **OQ-22**: Question from Q&A #4; RFP has billing route set by hospital advice, a partial precedent.

## Not from the RFP (kept their other sources)

- **FT-02.1**: Hospital download and matching screen come from Q&A, not the RFP.
- **US-02.1.1**: From Q&A; RFP does not describe importing hospital download files.
- **US-02.1.2**: Matching screen actions from Q&A only.
- **US-02.1.3**: Field-level diff on match is Q&A/proposed, not RFP.
- **US-03.1.2**: Anaesthetist seeing the Contract per Procedure comes from diagram and Q&A, not RFP.
- **US-03.2.2**: Who may set the primary Procedure comes from meeting notes, not the RFP.
- **US-03.4.1**: Anaesthetist changing the Contract comes from Q&A, not RFP.
- **US-03.5.2**: Keeping full BTM under 100% discount comes from Q&A.
- **US-04.2.3**: Contract-specific base unit override comes from Q&A.
- **FT-06.1**: Anaesthetist prepaid settings come from meetings/Q&A, not RFP.
- **US-06.1.1**: Per-anaesthetist prepaid code/group ticking is from Q&A, not RFP.
- **US-06.1.2**: Admin maintenance of prepaid settings is from Q&A, not RFP.
- **US-06.3.4**: Re-check after receipt comes from billing route diagram, not RFP.
- **US-06.3.5**: Claude-proposed item, not from RFP.
- **US-06.4.2**: Credit/refund on overpaid prepayment is from Q&A, not RFP.
- **US-08.6.2**: Credit note/re-issue not in RFP; Claude-identified gap.
- **FT-10.3**: Separate AA fee invoice comes from Q&A; not in RFP.
- **US-09.1.3**: RFP does not mention prepayment invoices; sourced from diagram.
- **US-10.3.1**: AA fee invoicing from Q&A; not in RFP.
- **US-10.3.2**: AA fee visibility from Q&A; not in RFP.
- **US-11.3.3**: Follow-up recording and invoice re-send not in RFP; from Q&A.
- **US-12.1.3**: Prepaid RVG codes/groups on profile come from meetings, not RFP.
- **US-15.0.5**: Engineering practice from prototype; RFP does not require pure tested billing logic.
- **OQ-01**: Cancellation fees from Q&A #10; RFP never discusses them.
- **OQ-02**: AA fee basis from Q&A #8; not in RFP.
- **OQ-03**: Prepaid refunds from Q&A #5; not in RFP.
- **OQ-04**: Prepaid amount source from Q&A #5; not in RFP.
- **OQ-06**: Base units on RVG master vs Contract is a Q&A design question.
- **OQ-13**: Hospital download format from Q&A #4; not in RFP.
- **OQ-14**: Bank details question raised by Claude; not in RFP.
- **OQ-15**: Modifier split rule from meetings/Q&A; RFP says modifiers not re-claimed.
- **OQ-16**: Office adjustment at review from Q&A #6.
- **OQ-18**: From fee schedule data files, not RFP.
- **OQ-21**: Deposit refund question raised by Claude; not in RFP.
- **OQ-25**: Pre-paid Contract category from Q&A #2/#5.
- **OQ-26**: Contract approval timing from Q&A #4.
- **OQ-28**: Post-invoice correction flow from audit; RFP does not address credit notes.

## Every item

| ID | Title | Confidence | RFP evidence |
| --- | --- | --- | --- |
| EP-01 | Schedule canvas and Lists | high | p.13 “The core scheduling entity is a nested hierarchy, rolling forward on a 4-month horizon”<br>p.14 “Every Anaesthetist has exactly two Lists on every Day within the rolling horizon”<br>p.18 “every active Anaesthetist has exactly two Lists (AM, PM) projected forward for every Day in the horizon”<br>p.7 “typically over a rolling 4-month forward window” |
| EP-02 | Booking intake and change handling | medium ✓ | p.34 “new patient bookings, reschedules”<br>p.34 “Surgeons will email pdf documents of their lists, detailing the Cards.”<br>p.19 “they can be added, amended, or reassigned right up to the procedure date”<br>p.38 “S12 New, S13 Reschedule, S14”<br>p.29 “the anaesthetist needs to be able to enter a new Card from scratch”<br>p.7 “right up to the day on which the procedures are scheduled” |
| EP-03 | Booking and Procedure capture (anaesthetist) | high | p.22 “where the anaesthetist captures procedure and BTM time data on the Card”<br>p.7 “The mobile app displays the calendar, the Cards and procedure details.”<br>p.29 “selected base code (with override for range-based codes), anaesthetic start/handover time”<br>p.30 “The mobile app itself performs validation to ensure minimum data required for billing is present before a Card can be marked complete” |
| EP-04 | Contracts | medium ✓ | p.16 “a number of Contracts are established”<br>p.26 “always refers to a construct in the Billing system that defines a set of billing rules”<br>p.18 “Governs rate calculation for a billing counterparty.”<br>p.15 “is looked up to determine the rate applied, independently of which billingRoute was resolved” |
| EP-05 | RVG master data and fee calculation rules | high | p.23 “Fee = (Base units + Time units + Modifier units)”<br>p.24 “the expectation is a curated dropdown of RVG codes that the anaesthetist selects from manually”<br>p.26 “The system needs to support all three as parallel billing methods”<br>p.29 “RVU calculation: tiered time-unit logic (T1/T2 breakpoint at 2 hours)” |
| EP-06 | Prepayment | medium ✓ | p.27 “Self-funded (full or split pre-payment required)”<br>p.27 “Payment must be collected before the procedure proceeds.” |
| EP-07 | List approval workflow | high | p.22 “The trigger for that lock is a business process at List level, described below.”<br>p.23 “The List, not the Card, is the unit that carries approval state and triggers the handoh to the Billing Engine”<br>p.30 “Once a List reaches SUBMITTED, the anaesthetist has no edit access to its Cards at all” |
| EP-08 | Billing/Invoice Engine and internal ledger | high | p.30 “On receipt of an AUTHORISED List, the Billing Engine: 1. Iterates the Cards within the List, and their Procedures.”<br>p.21 “it is probably more useful to think of the Billing Engine as the centre of the universe”<br>p.32 “the Billing Engine's own database is the sole source the mobile app reads from”<br>p.30 “each anaesthetist’s “ledger” position: what is owing and what is owed” |
| EP-09 | Xero integration | high | p.31 “Both records are created at the same time, from the same Billing Engine transaction”<br>p.32 “a scheduled reconciliation poll (daily), since webhook delivery is not guaranteed”<br>p.21 “A separate instance of Xero will be established”<br>p.42 “PMS only — never sent to Xero”<br>p.43 “archives Xero contacts once their invoices are fully paid” |
| EP-10 | Payments, disbursement and AA fees | high | p.28 “all funds are received into the AA account, and AA is responsible for reconciling and disbursing to anaesthetists”<br>p.31 “the corresponding ACCPAY is set to AUTHORISED so that it is included in the next payables run” |
| EP-11 | Patients and billable parties | high | p.18 “Patient and billable-party details are supplied by the surgeon/hospital as part of the Card”<br>p.15 “In the common case this is the patient themself”<br>p.14 “patient references the master Patient table”<br>p.42 “checks for outstanding credit issues”<br>p.43 “surface any unpaid or overdue invoices” |
| EP-12 | Anaesthetist profile and reporting | high | p.32 “The two known reporting requirements for anaesthetists are”<br>p.23 “The system therefore needs to store a unit-value setting per anaesthetist”<br>p.7 “There are minor reporting requirements for anaesthetists that include” |
| EP-13 | Admin oversight and master data | high | p.7 “require a web application that allows them to operate on the schedule and billing management”<br>p.45 “This screenshot shows the day view of the schedule.”<br>p.33 “this is a genuine requirement, not a by-product of the other two designs”<br>p.18 “Master/reference data is decoupled from the schedule tree”<br>p.30 “what is owing and what is owed” |
| EP-14 | Health systems integration (future) | high | p.38 “Respondents to this RFP are required to address the following integration capabilities”<br>p.34 “reliable, automated exchange of appointment and patient data with hospital partner systems”<br>p.36 “FHIR R4 (Release 4) is the version mandated by Health NZ” |
| EP-15 | Non-functional requirements | high | p.8 “A fundamental requirement is an intuitive user experience and ease of use.”<br>p.8 “Annual Invoices 28,000 p.a.”<br>p.7 “Anaesthetists primarily operate via their mobile application, with access to a similar web-based application.” |
| FT-01.1 | Rolling canvas generation | high | p.13 “created by the system for every active Anaesthetist, for every Day in the rolling horizon”<br>p.18 “It is pre-populated on a rolling 4-month horizon” |
| FT-01.2 | List availability status | high | p.14 “Availability is set at the List (half-day) level, not the Anaesthetist or Day level”<br>p.18 “The List is the unit of availability, not the Anaesthetist or the Day.” |
| FT-01.3 | List assignment | medium ✓ | p.14 “The list instance is then only available for that anaesthetist/surgeon pairing.”<br>p.14 “Hospital is the physical location the List takes place at”<br>p.14 “A half-day session (AM or PM) belonging to an Anaesthetist on a given Day.” |
| FT-01.4 | List reassignment and locum search | high | p.19 “Lists must support reassignment between Anaesthetists, including at short notice.”<br>p.48 “replacement (locum) anaesthetist at short notice” |
| FT-01.5 | Hospital holiday calendar and conflicts | high | p.17 “availability calendar (closures, holidays, etc.), maintained independently per hospital”<br>p.19 “are expected to be reconciled against the canvas” |
| FT-02.1 | Hospital booking download and matching screen | high ✓ | — |
| FT-02.2 | Surgeon PDF list ingest | high | p.34 “A PDF reader capability is required to read, edit and ingest this data into the schedule.”<br>p.34 “Surgeons will email pdf documents of their lists, detailing the Cards.” |
| FT-02.3 | Manual booking entry by admin | medium ✓ | p.7 “handling manual changes from hospitals and”<br>p.13 “through ad-hoc additional bookings, typically via phone” |
| FT-02.4 | Anaesthetist ad hoc booking | high | p.29 “the anaesthetist needs to be able to enter a new Card from scratch”<br>p.29 “capture the data with a photo of the hospital” |
| FT-02.5 | Change types and audit | medium ✓ | p.34 “new patient bookings, reschedules”<br>p.38 “S12 New, S13 Reschedule, S14”<br>p.15 “every create, update, and reassignment must be logged”<br>p.19 “A full audit trail is a structural requirement, not an incidental” |
| FT-03.1 | View schedule, Lists and Bookings | high | p.44 “Four screenshots showing the progression from schedule, to list details, to card details.”<br>p.7 “The mobile app displays the calendar, the Cards and procedure details.”<br>p.47 “This page shows a simple view of upcoming lists” |
| FT-03.2 | Booking structure: primary and additional procedures | medium ✓ | p.15 “One or more clinical procedures may be performed within a single Card.”<br>p.28 “they were already charged against the primary procedure” |
| FT-03.3 | Record clinical billing data per Procedure | high | p.29 “selected base code (with override for range-based codes), anaesthetic start/handover time”<br>p.7 “time-sheeting function to capture time and charge details for each Procedure”<br>p.22 “Each Procedure may in turn carry one or more Billing Lines” |
| FT-03.4 | Contract on the Procedure | medium ✓ | p.15 “is looked up to determine the rate applied, independently of which billingRoute was resolved”<br>p.29 “Invoice recipient type: contract holder (which Hospital and which Contract)” |
| FT-03.5 | Anaesthetist adjustment | medium ✓ | p.15 “allows a discretionary adjustment to the standard rate”<br>p.15 “Designs should allow for both agreed” |
| FT-03.6 | Booking completeness validation | high | p.30 “The mobile app itself performs validation to ensure minimum data required for billing is present before a Card can be marked complete”<br>p.22 “A List cannot be marked SUBMITTED unless all its Cards are correctly completed.” |
| FT-04.1 | Contract catalogue | medium ✓ | p.18 “Governs rate calculation for a billing counterparty.”<br>p.27 “Private bariatric contracts”<br>p.17 “Every Hospital and every direct-billing Insurer is mandated to hold at least a default Type 1 Contract” |
| FT-04.2 | Contract definition | medium ✓ | p.16 “Agreed rate / discount”<br>p.17 “Fixed price, independent of standard rates.”<br>p.26 “entity that can override or bypass the RVU calculation entirely for matching Cards” |
| FT-04.3 | Contract selection on a Procedure | medium ✓ | p.15 “is looked up to determine the rate applied, independently of which billingRoute was resolved”<br>p.17 “This guarantees governing Contract always resolves to a real Contract” |
| FT-04.4 | Every hospital and direct insurer has a default Contract | high | p.17 “Every Hospital and every direct-billing Insurer is mandated to hold at least a default Type 1 Contract”<br>p.16 “This is the mandatory default Contract”<br>p.18 “Holds a mandatory default Type 1 Contract.” |
| FT-05.1 | RVG code master | medium ✓ | p.24 “the expectation is a curated dropdown of RVG codes that the anaesthetist selects from manually”<br>p.33 “The dropdown of RVG codes and values is curated centrally (by AA)”<br>p.23 “Looked up from an NZSA RVG code table, organised by anatomical site” |
| FT-05.2 | Unit and fee calculation | high | p.23 “Fee = (Base units + Time units + Modifier units)”<br>p.16 “Rate calculation is independent of billing route”<br>p.29 “RVU calculation: tiered time-unit logic (T1/T2 breakpoint at 2 hours)” |
| FT-05.3 | Multi-procedure rule (supersedes RFP split-billing rule) | medium ✓ | p.28 “Only additional time units may be claimed for that second procedure.”<br>p.29 “can only add time units”<br>p.17 “Care will be required in the design of the charging of multiple procedures.” |
| FT-05.4 | Adjustments and overrides | medium ✓ | p.15 “allows a discretionary adjustment to the standard rate”<br>p.19 “including billing route, governing Contract, and any price override” |
| FT-05.5 | ACC | high | p.25 “ACC does not require a distinct billing path or calculation model”<br>p.29 “billed referencing the Hospital (or other contract holder)'s Contract”<br>p.27 “billed as a standard BTM structure via that Hospital's Contract” |
| FT-06.1 | Prepaid procedure settings on the anaesthetist profile | high ✓ | — |
| FT-06.2 | Prepayment trigger and amount | low ✓ | p.27 “Self-funded (full or split pre-payment required)” |
| FT-06.3 | Prepayment invoicing and tracking | low ✓ | p.27 “Payment must be collected before the procedure proceeds.”<br>p.31 “An ACCREC, raised to the paying party (Hospital, Insurer, or Patient/Billable Party)” |
| FT-06.4 | Settlement after the procedure | medium ✓ | p.27 “Any balance is then collected as normal, after the procedure.” |
| FT-07.1 | DRAFT | high | p.22 “The anaesthetist completes all Cards within a List, then”<br>p.23 “Anaesthetist actively entering/editing Cards Fully editable by the anaesthetist.” |
| FT-07.2 | SUBMITTED | high | p.23 “The oOice performs a sanity check on the List”<br>p.23 “Editable only by office (OfficeAdmin role).”<br>p.33 “Remains visible with a visual indicator” |
| FT-07.3 | AUTHORISED | high | p.23 “Locked — immutable; passed to Billing Engine as a unit.”<br>p.22 “Cards become immutable once locked”<br>p.30 “receives the whole List as a unit” |
| FT-07.4 | List visibility in the anaesthetist app | high | p.32 “The mobile app's List view and outstanding-balance view are two distinct surfaces”<br>p.33 “The precise trigger for a List disappearing from view should be invoice generation” |
| FT-08.1 | Trigger and inputs | high | p.30 “it acts on a single event — a List reaching AUTHORISED — and receives the whole List as a unit” |
| FT-08.2 | Invoice grouping | high | p.22 “the Card generates multiple invoices — one per distinct counterparty”<br>p.30 “Groups Procedures by resolved counterparty, per Card, to determine invoice boundaries” |
| FT-08.3 | Internal ledger | medium ✓ | p.28 “the system needs to track and manage anaesthetist disbursement (AA → anaesthetist) as its own”<br>p.31 “linked via the Billing Engine's own case record using the returned Xero GUIDs”<br>p.30 “each anaesthetist’s “ledger” position: what is owing and what is owed”<br>p.42 “while preserving full patient and billing history”<br>p.32 “the Billing Engine's own database is the sole source the mobile app reads from” |
| FT-08.4 | Invoice generation and despatch | high | p.21 “invoices will be “printed” and emailed from the billing engine, rather than from Xero”<br>p.30 “Generates and despatches/queues the invoices for despatch to the Billable party.” |
| FT-08.5 | Processing status and failures | high | p.33 “need to monitor the List → Billing Engine → Xero ﬂow for completion and errors”<br>p.30 “Reports status back for oOice monitoring” |
| FT-08.6 | Billing after AUTHORISED | medium ✓ | p.24 “HDU or ward review visits that may occur days after the original procedure”<br>p.25 “separately itemised, sometimes days later”<br>p.22 “this removes any need to reconcile late clinical corrections against already-calculated billing data” |
| FT-09.1 | Invoice pair creation | high | p.31 “Both records are created at the same time, from the same Billing Engine transaction”<br>p.30 “Generates the matching ACCREC/ACCPAY pair(s) in Xero” |
| FT-09.2 | Payment detection | high | p.31 “Primary: Xero webhook subscription on INVOICE events”<br>p.32 “both paths write through the same handler, keyed by InvoiceID” |
| FT-09.3 | Contact management and archiving | high | p.42 “PMS only — never sent to Xero”<br>p.43 “One Xero contact per real patient, for life”<br>p.43 “archives Xero contacts once their invoices are fully paid”<br>p.8 “one-time customers and can be archived in Xero” |
| FT-09.4 | Xero organisation configuration | high | p.21 “This instance of Xero will not be used for the general accounting work” |
| FT-10.1 | Single payment destination | high | p.28 “That direct-payment pathway is retired under the new system” |
| FT-10.2 | Releasing payables | high | p.31 “the corresponding ACCPAY is set to AUTHORISED so that it is included in the next payables run” |
| FT-10.3 | AA fee invoicing | high ✓ | — |
| FT-11.1 | Patient record | high | p.18 “NHI number, plus demographics”<br>p.14 “patient references the master Patient table”<br>p.38 “All patient records must be linked to the National Health Index (NHI) number where available.”<br>p.42 “True clinical identity. Used at intake to validate and deduplicate patients” |
| FT-11.2 | Billable party and invoice contact | high | p.15 “In the common case this is the patient themself”<br>p.16 “The patient (or their override, e.g. a guardian) is billed directly.”<br>p.27 “In this documentation, this invoice recipient is always referred to as the Billable Party.” |
| FT-11.3 | Patient outstanding balances and alerts | medium ✓ | p.43 “surface any unpaid or overdue invoices”<br>p.42 “checks for outstanding credit issues” |
| FT-11.4 | Insurers | high | p.18 “Held as a proper reference table even though only one Insurer (NIB) currently accepts direct claims from AA”<br>p.16 “Only available where that Insurer accepts direct claims from AA (currently one only)”<br>p.27 “Patient holds private health insurance and forwards the invoice to their insurer for reimbursement”<br>p.27 “One insurer accepts claims directly.” |
| FT-12.1 | Profile settings | high | p.23 “The system therefore needs to store a unit-value setting per anaesthetist”<br>p.32 “aligned to each anaesthetist's individually-set GST period (monthly, bi-monthly, or six-monthly)”<br>p.17 “Basic contact information plus registration number (ID).” |
| FT-12.2 | Reporting for anaesthetists | high | p.32 “The two known reporting requirements for anaesthetists are”<br>p.32 “with no Card-level or other aggregation/rollup”<br>p.7 “Monthly activity summaries”<br>p.49 “This screen shows a classic accounts outstanding view, ordered by date.” |
| FT-13.1 | Schedule dashboard | high | p.45 “From this, users can navigate via a series of drill-downs”<br>p.18 “need to see availability at AM/PM granularity across all anaesthetists for a given day” |
| FT-13.2 | Ledger balance tools | low ✓ | p.30 “The agency (AA) is concerned with the billing in terms of each anaesthetist”<br>p.29 “The system operates in the same way as a Trust account would.” |
| FT-13.3 | Billing flow monitoring | high | p.33 “this is a genuine requirement, not a by-product of the other two designs”<br>p.33 “Is this monitoring surface part of the existing Admin Web App”<br>p.30 “Reports status back for” |
| FT-13.4 | Master data management | medium ✓ | p.17 “maintained as separate, relatively static master tables”<br>p.18 “are maintained independently and referenced by ID” |
| FT-13.5 | Roles, permissions and audit | high | p.8 “Access rights should be managed by role rather than on an individual user basis”<br>p.8 “Audit trails of manual and automated actions are required.”<br>p.19 “A full audit trail is a structural requirement” |
| FT-14.1 | HL7 v2 inbound | high | p.38 “receiving and parsing HL7 v2.3.1 SIU messages (S12 New, S13 Reschedule”<br>p.35 “This message type is used to notify our system of changes to booked surgical appointments” |
| FT-14.2 | FHIR R4 | high | p.38 “consuming FHIR Appointment, Patient, and Anaesthetist resources directly via RESTful API”<br>p.38 “the integration engine should operate natively using FHIR R4”<br>p.36 “FHIR R4 (Release 4) is the version mandated by Health NZ” |
| FT-14.3 | Near real time | high | p.38 “Real-time or near-real-time message processing” |
| FT-14.4 | NZ identity standards | high | p.38 “Ethnicity coding must use the NZHIS Level 4 code set”<br>p.36 “must use the FHIR API via the HNZ Digital Services Hub” |
| FT-14.5 | Reliability and monitoring | high | p.38 “message delivery guarantees, error handling, alerting, and retry logic”<br>p.34 “The HL7 integrations in place are unreliable and frequently fail” |
| US-01.1.1 | Two Lists per anaesthetist per day | high | p.18 “every active Anaesthetist has exactly two Lists (AM, PM) projected forward for every Day in the horizon”<br>p.13 “with exactly two Lists per Anaesthetist-Day (AM and PM)”<br>p.14 “Every Anaesthetist has exactly two Lists on every Day within the rolling horizon” |
| US-01.1.2 | Horizon rolls forward daily | high | p.19 “populates the rolling canvas with default Lists as the 4-month horizon advances”<br>p.17 “Used to populate the rolling schedule with default Lists going forward.” |
| US-01.1.3 | New anaesthetist gets a populated canvas | high | p.18 “If an Anaesthetist is added, then their forward schedule needs to be populated” |
| US-01.1.4 | List default times | high | p.14 “The start and end times of the list have a default value, but that may be overridden.”<br>p.14 “All day bookings simply use both lists.” |
| US-01.2.1 | Anaesthetist sets half-day availability | high | p.14 “e.g. available, available for emergency, unavailable, on leave (etc)”<br>p.17 “Maintained by each Anaesthetist via the mobile app.” |
| US-01.2.2 | List status master data | high | p.17 “Fields: description, colour.”<br>p.14 “sourced from a master ListStatus table” |
| US-01.2.3 | Status is independent of bookings | high | p.18 “status is not derived from Card activity”<br>p.14 “carries its own status independent of whether it currently holds Cards” |
| US-01.3.1 | Assigned List pairing rule | medium ✓ | p.14 “The list instance is then only available for that anaesthetist/surgeon pairing.”<br>p.14 “Theatre information is not currently recorded.” |
| US-01.3.2 | Permanent Lists drive most assignments | high | p.14 “The assignment is usually (approximately 80%)”<br>p.17 “Used to populate the rolling schedule with default Lists going forward.” |
| US-01.3.3 | Manual List assignment | high | p.14 “may otherwise be assigned manually by”<br>p.13 “through ad-hoc additional bookings, typically via phone” |
| US-01.3.4 | AM and PM can differ | low ✓ | p.14 “an Anaesthetist’s availability can vary independently between AM and PM”<br>p.14 “Hospital is the physical location the List takes place at” |
| US-01.4.1 | Reassign a List with its bookings | high | p.19 “without disturbing its Cards, status history, or audit trail”<br>p.19 “What is the precise mechanism for reassigning a List between Anaesthetists at short notice” |
| US-01.4.2 | Availability finder | high | p.18 “need to see availability at AM/PM granularity across all anaesthetists for a given day”<br>p.48 “(e.g. cover for illness)”<br>p.46 “locum availability data”<br>p.7 “displays the availability of other anaesthetists where swaps are needed” |
| US-01.4.3 | Anaesthetist requests a swap | medium ✓ | p.7 “displays the availability of other anaesthetists where swaps are needed”<br>p.19 “Lists must support reassignment between Anaesthetists, including at short notice.” |
| US-01.5.1 | Hospital holiday calendar | high | p.17 “availability calendar (closures, holidays, etc.), maintained independently per hospital”<br>p.19 “holidays by each Hospital (admin input)” |
| US-01.5.2 | Conflict flagging | high | p.19 “rather than merged into the List record itself”<br>p.19 “as hard constraints, soft warnings, or something else?” |
| US-01.5.3 | Anaesthetist availability calendar | high | p.17 “independent of any List assignment”<br>p.19 “are expected to be reconciled against the canvas” |
| US-02.1.1 | Import a hospital booking download | high ✓ | — |
| US-02.1.2 | Match rows to Lists and Bookings | high ✓ | — |
| US-02.1.3 | Show differences on match | high ✓ | — |
| US-02.1.4 | Unmatched queue | low ✓ | p.38 “support manual intervention work” |
| US-02.2.1 | Read a PDF list | high | p.34 “Surgeons will email pdf documents of their lists, detailing the Cards.” |
| US-02.2.2 | Edit then ingest | high | p.34 “A PDF reader capability is required to read, edit and ingest this data into the schedule.” |
| US-02.3.1 | Create or amend a Booking | medium ✓ | p.7 “handling manual changes from hospitals and”<br>p.15 “every create, update, and reassignment must be logged” |
| US-02.4.1 | Add a Booking from scratch | high | p.29 “the anaesthetist needs to be able to enter a new Card from scratch”<br>p.29 “back to the scheduling engine” |
| US-02.4.2 | Photo capture of the physical card | high | p.29 “capture the data with a photo of the hospital” |
| US-02.4.3 | Copy a Booking | high | p.29 “this copy would be of the skeleton information on the selected Card” |
| US-02.5.1 | Apply a modification | high | p.15 “Full audit of changes is required at the Card level”<br>p.19 “a complete history of changes (who, what, when)”<br>p.14 “Cards are mutable from multiple sources” |
| US-02.5.2 | Apply a reschedule | medium ✓ | p.34 “new patient bookings, reschedules”<br>p.38 “S13 Reschedule”<br>p.15 “every create, update, and reassignment must be logged” |
| US-02.5.3 | Record a cancellation | medium ✓ | p.34 “and cancellations originating from both the surgeon”<br>p.38 “S15 Cancellation” |
| US-02.5.4 | Changes accepted until the procedure | high | p.19 “right up to the procedure date, from multiple sources”<br>p.14 “Cards are mutable from multiple sources”<br>p.7 “right up to the day on which the procedures are scheduled” |
| US-02.5.5 | Append-only change history | high | p.19 “This points toward an append-only change log or event history for these entities”<br>p.19 “an invoice generated today must be reproducible against what was true at the time it was raised” |
| US-02.5.6 | Concurrent edits | high | p.19 “concurrently by multiple sources (surgeon integration, hospital integration, anaesthetist mobile app)?”<br>p.19 “has implications for concurrency handling” |
| US-03.1.1 | Schedule to List to Booking drill-down | high | p.44 “Four screenshots showing the progression from schedule, to list details, to card details.”<br>p.47 “Drill down is available.” |
| US-03.1.2 | See the Contract on each Procedure | medium ✓ | — |
| US-03.1.3 | Attachments | high | p.7 “Provision should be made to allow attachments to the schedule records.” |
| US-03.1.4 | Web app parity | high | p.30 “throughout this section apply equally to the anaesthetists' web app view”<br>p.7 “Anaesthetists primarily operate via their mobile application, with access to a similar web-based application.” |
| US-03.2.1 | One primary Procedure | medium ✓ | p.28 “they were already charged against the primary procedure”<br>p.24 “Only one base code is charged per anaesthetic.”<br>p.29 “base units capped at one per anaesthetic” |
| US-03.2.2 | Anyone with edit rights can set the primary | medium ✓ | — |
| US-03.2.3 | Add additional Procedures | medium ✓ | p.15 “A Card may have more than one Procedure, and each Procedure resolves its own billing route independently”<br>p.29 “as a way of adding an additional procedure” |
| US-03.3.1 | Select an RVG code | high | p.24 “the expectation is a curated dropdown of RVG codes that the anaesthetist selects from manually”<br>p.23 “Looked up from an NZSA RVG code table, organised by anatomical site”<br>p.26 “with the anaesthetist selecting the closest applicable RVG code from a dropdown”<br>p.33 “The dropdown of RVG codes and values is curated centrally (by AA)” |
| US-03.3.2 | Override a ranged base code | high | p.24 “rather than a single number”<br>p.29 “selected base code (with override for range-based codes), anaesthetic start/handover time” |
| US-03.3.3 | Record anaesthetic start and handover times | high | p.24 “Time runs from when the anaesthetist takes over care to handover at recovery (PACU).”<br>p.29 “selected base code (with override for range-based codes), anaesthetic start/handover time” |
| US-03.3.4 | ASA seeds the modifier field | high | p.25 “the ASA score seeds the M” |
| US-03.3.5 | Itemise modifiers | medium ✓ | p.25 “Awake intubation (AI1) +2 units Specific technique flag”<br>p.24 “A set of separate codes added on top” |
| US-03.3.6 | Other billing lines | high | p.24 “pain consultations, medical transport, and HDU or ward review visits that may occur days after the original procedure”<br>p.25 “PACU, HDU, ICU, ward reviews, nerve catheters”<br>p.29 “Additional services/fees, added to the procedure record and billed accordingly.” |
| US-03.3.7 | Rate x time capture | high | p.26 “it flows into the mobile app through the same capture path as any other BillingLine entry”<br>p.29 “Fixed-fee and individually-arranged methods: captured as a BillingLine” |
| US-03.4.1 | Anaesthetist can change the Contract | medium ✓ | — |
| US-03.5.1 | Adjustment field appears when permitted | medium ✓ | p.15 “and $ or % adjustments” |
| US-03.5.2 | BTM still recorded in full | medium ✓ | — |
| US-03.5.3 | Adjustment reason | high | p.15 “Should carry a reason/note”<br>p.19 “including billing route, governing Contract, and any price override” |
| US-03.6.1 | Mark a Booking complete | high | p.30 “The mobile app itself performs validation to ensure minimum data required for billing is present before a Card can be marked complete”<br>p.22 “A List cannot be marked SUBMITTED unless all its Cards are correctly completed.” |
| US-03.6.2 | Incomplete Bookings listed | low ✓ | p.30 “The mobile app itself performs validation to ensure minimum data required for billing is present”<br>p.22 “A List cannot be marked SUBMITTED unless all its Cards are correctly completed.” |
| US-04.1.1 | Contract categories | medium ✓ | p.27 “Private bariatric contracts”<br>p.25 “ACC Contracts are set up with the Hospital or Contract Holder to cover the billing rules” |
| US-04.1.2 | Create, edit, retire Contracts | low ✓ | p.19 “an invoice generated today must be reproducible against what was true at the time it was raised” |
| US-04.1.3 | Contract audit and versioning | high | p.19 “an invoice generated today must be reproducible against what was true at the time it was raised” |
| US-04.2.1 | Holder and applicability scope | medium ✓ | p.18 “Scoped to either a Hospital or an Insurer (an Insurer-scoped Contract applies across all hospitals).”<br>p.26 “keyed by some combination of contract holder, surgeon, and/or procedure type”<br>p.27 “held by the surgeon, not the hospital” |
| US-04.2.2 | Pricing basis | high | p.16 “Agreed rate or discount %”<br>p.17 “Fixed price, independent of standard rates.”<br>p.26 “a simple hourly rate”<br>p.23 “The system therefore needs to store a unit-value setting per anaesthetist” |
| US-04.2.3 | Base unit override | medium ✓ | — |
| US-04.2.4 | Fixed fee schedule lines | medium ✓ | p.26 “entity that can override or bypass the RVU calculation entirely for matching Cards”<br>p.29 “Fixed-fee and individually-arranged methods: captured as a BillingLine” |
| US-04.2.5 | Multi-procedure rule per Contract | high | p.17 “Care will be required in the design of the charging of multiple procedures.”<br>p.26 “2nd procedure pricing usually requires additional rules.”<br>p.28 “Only additional time units may be claimed for that second procedure.” |
| US-04.2.6 | Adjustment and override permissions | low ✓ | p.26 “must hold a Contract* that explicitly permits an individually-arranged structure”<br>p.15 “allows a discretionary adjustment to the standard rate” |
| US-04.2.7 | Required booking inputs | low ✓ | p.30 “The mobile app itself performs validation to ensure minimum data required for billing is present” |
| US-04.2.8 | Invoice presentation and delivery | medium ✓ | p.27 “these two billing types have slightly”<br>p.27 “is currently via an upload portal”<br>p.21 “and emailed from the billing engine, rather than from Xero” |
| US-04.2.9 | Organisational and individual Contracts | high | p.26 “should allow for both individual contracts and organisational contracts. Currently all contracts are at the organisational level.” |
| US-04.3.1 | Exactly one Contract per Procedure | medium ✓ | p.15 “is looked up to determine the rate applied, independently of which billingRoute was resolved”<br>p.17 “This guarantees governing Contract always resolves to a real Contract” |
| US-04.3.2 | Filtered Contract list | low ✓ | p.26 “keyed by some combination of contract holder, surgeon, and/or procedure type” |
| US-04.3.3 | Default hospital Contract derived from location | medium ✓ | p.16 “A Default Contract, which has no conditions will always be present.”<br>p.17 “This guarantees governing Contract always resolves to a real Contract”<br>p.16 “This is the mandatory default Contract” |
| US-04.3.4 | Admin sets Contracts at booking setup | low ✓ | p.16 “This is set explicitly (by hospital advice, or by AA”<br>p.23 “typically Contract, Insurer, and reference completeness” |
| US-04.3.5 | Contract locked at AUTHORISED | high | p.19 “an invoice generated today must be reproducible against what was true at the time it was raised”<br>p.23 “Locked — immutable; passed to Billing Engine as a unit.” |
| US-04.4.1 | Mandatory default Contract | high | p.17 “Every Hospital and every direct-billing Insurer is mandated to hold at least a default Type 1 Contract”<br>p.16 “This is the mandatory default Contract”<br>p.18 “Holds a mandatory default Type 1 Contract.” |
| US-05.1.1 | Load NZSA RVG codes | medium ✓ | p.23 “Looked up from an NZSA RVG code table, organised by anatomical site”<br>p.24 “Some codes are ranges”<br>p.33 “The dropdown of RVG codes and values is curated centrally (by AA)” |
| US-05.1.2 | Add AA codes | low ✓ | p.33 “is not encyclopaedic, and may be overridden by the anaesthetist” |
| US-05.1.3 | Group codes | low ✓ | p.23 “Looked up from an NZSA RVG code table, organised by anatomical site” |
| US-05.1.4 | Absorbed modifiers | high | p.24 “already account for prone positioning”<br>p.29 “positioning loading must check whether the selected base code already includes it” |
| US-05.1.5 | Modifier code master | high | p.25 “Awake intubation (AI1) +2 units”<br>p.24 “A set of separate codes added on top” |
| US-05.2.1 | Per-anaesthetist unit value | high | p.23 “The system therefore needs to store a unit-value setting per anaesthetist, not a single global price list.” |
| US-05.2.2 | Tiered time units | high | p.24 “Tiered rate: 1 unit per 15 minutes for the first two hours, then 1 unit per 10 minutes from the third hour onward.”<br>p.24 “Time is tiered, not linear”<br>p.29 “RVU calculation: tiered time-unit logic (T1/T2 breakpoint at 2 hours)” |
| US-05.2.3 | Conditional positioning modifier | high | p.25 “Conditional — only if not already included in the base code”<br>p.29 “positioning loading must check whether the selected base code already includes it”<br>p.24 “already account for prone positioning” |
| US-05.2.4 | Contract rate or discount | high | p.16 “2 — Agreed rate / discount”<br>p.18 “types 2 (agreed rate/discount)”<br>p.26 “negotiated rates with a hospital, insurer, or other contract holder” |
| US-05.2.5 | Fixed fee schedule pricing | high | p.26 “completely independent of the RVU calculation”<br>p.17 “Fixed price, independent of standard rates.” |
| US-05.2.6 | Rate x time pricing | high | p.26 “explicitly permits an individually-arranged structure such as an hourly rate” |
| US-05.2.7 | GST | low ✓ | p.32 “aligned to each anaesthetist's individually-set GST period” |
| US-05.3.1 | Base units on primary only | high | p.28 “preventing a base-unit field from being editable on any procedure”<br>p.24 “Only one base code is charged per anaesthetic.”<br>p.29 “can only add time units” |
| US-05.3.2 | Time units on every Procedure | medium ✓ | p.29 “only the T element of BTM is used for the secondary procedure(s) billing”<br>p.28 “Only additional time units may be claimed for that second procedure.” |
| US-05.3.3 | Modifier split above four units | low ✓ | p.28 “Base units and modifying units cannot be claimed again” |
| US-05.3.4 | Contract-specific second-procedure rules | medium ✓ | p.26 “2nd procedure pricing usually requires additional rules.”<br>p.17 “Various rules apply depending on the nature of the contract.” |
| US-05.3.5 | Ledger tracks each Procedure's share | medium ✓ | p.22 “is resolved per Procedure, not per Card.”<br>p.15 “each Procedure resolves its own billing route independently” |
| US-05.4.1 | Apply anaesthetist adjustment | low ✓ | p.15 “and $ or % adjustments” |
| US-05.4.2 | Office price override | high | p.15 “allows a discretionary adjustment to the standard rate”<br>p.16 “subject to an optional price Override”<br>p.19 “including billing route, governing Contract, and any price override” |
| US-05.5.1 | ACC through the holder's Contract | high | p.25 “ACC does not require a distinct billing path or calculation model”<br>p.27 “billed as a standard BTM structure via that Hospital's Contract”<br>p.29 “billed referencing the Hospital (or other contract holder)'s Contract” |
| US-05.5.2 | ACC pre-op flat fee codes | high | p.25 “ACC pre-operative assessment has previously been described as using its own” |
| US-06.1.1 | Tick codes or groups | high ✓ | — |
| US-06.1.2 | Admin can maintain on behalf | high ✓ | — |
| US-06.2.1 | Detect prepayment requirement | low ✓ | p.27 “Self-funded (full or split pre-payment required)” |
| US-06.2.2 | Set the prepaid amount | medium ✓ | p.27 “Self-funded (full or split pre-payment required)” |
| US-06.2.3 | Prepayment is an estimate | low ✓ | p.27 “Any balance is then collected as normal, after the procedure.” |
| US-06.3.1 | Raise the prepayment invoice | low ✓ | p.27 “Payment must be collected before the procedure proceeds.”<br>p.31 “An ACCREC, raised to the paying party (Hospital, Insurer, or Patient/Billable Party)” |
| US-06.3.2 | Track prepayment status | low ✓ | p.27 “Payment must be collected before the procedure proceeds.” |
| US-06.3.3 | Alert on unpaid prepayment | low ✓ | p.27 “Payment must be collected before the procedure proceeds.” |
| US-06.3.4 | Re-check after each receipt | high ✓ | — |
| US-06.3.5 | Re-check when the Booking changes | high ✓ | — |
| US-06.4.1 | Invoice the remaining balance | medium ✓ | p.27 “Any balance is then collected as normal, after the procedure.” |
| US-06.4.2 | Credit or refund when prepaid exceeds final | high ✓ | — |
| US-07.1.1 | Submit a completed List | high | p.22 “then ﬂags the List as SUBMITTED (the button label may read ‘Completed’)”<br>p.23 “Anaesthetist flags the List as SUBMITTED (Button Label = “Completed”)” |
| US-07.1.2 | Cannot submit an incomplete List | high | p.22 “A List cannot be marked SUBMITTED unless all its Cards are correctly completed.”<br>p.30 “The mobile app itself performs validation to ensure minimum data required for billing is present” |
| US-07.2.1 | Anaesthetist loses edit access | high | p.30 “Once a List reaches SUBMITTED, the anaesthetist has no edit access to its Cards at all”<br>p.33 “No longer editable by the anaesthetist (admin function only).”<br>p.23 “Editable only by office (OfficeAdmin role).” |
| US-07.2.2 | Office review of Contracts and references | medium ✓ | p.23 “typically Contract, Insurer, and reference completeness” |
| US-07.2.3 | Office corrections | high | p.30 “There is no “Returned” state. Any issue found by the office is resolved by phone, always initiated by office staff”<br>p.30 “Corrections from that point are an admin/office function.” |
| US-07.3.1 | Authorise the List | high | p.23 “When the oOice marks the List AUTHORISED, it is passed to the Billing Engine for processing.”<br>p.23 “Locked — immutable; passed to Billing Engine as a unit.” |
| US-07.3.2 | Immutable after AUTHORISED | high | p.22 “Cards become immutable once locked”<br>p.23 “Locked — immutable; passed to Billing Engine as a unit.” |
| US-07.4.1 | List disappears on invoice generation | high | p.33 “The precise trigger for a List disappearing from view should be invoice generation (i.e. submission to Xero), not the List reaching AUTHORISED and not payment”<br>p.33 “the invoices would reappear the next day as line item(s) in the outstanding-balance view” |
| US-08.1.1 | Process an AUTHORISED List | high | p.30 “Iterates the Cards within the List, and their Procedures.” |
| US-08.1.2 | Contract already resolved | low ✓ | p.30 “Resolves the billing counterparty for each Procedure” |
| US-08.2.1 | Group by billable party | high | p.22 “Invoice generation is therefore a grouping operation over the Procedures within a Card, by resolved counterparty”<br>p.30 “Groups Procedures by resolved counterparty, per Card, to determine invoice boundaries” |
| US-08.2.2 | Net prepayments | low ✓ | p.27 “Any balance is then collected as normal, after the procedure.” |
| US-08.2.3 | Split one Procedure's fee between two payers | high | p.28 “A single procedure is only partially covered by a contract or funding arrangement”<br>p.28 “two separate invoices must be generated rather than one combined invoice” |
| US-08.3.1 | Linked receivable and payable pair | high | p.31 “the Billing Engine creates a matching pair of Xero invoices for each resolved counterparty”<br>p.31 “Both records are created at the same time, from the same Billing Engine transaction”<br>p.28 “This maps directly onto the ACCREC/ACCPAY pairing” |
| US-08.3.2 | Ledger is the system of record | high | p.32 “The mobile app never queries Xero directly for balance information.”<br>p.32 “the Billing Engine's own database is the sole source the mobile app reads from” |
| US-08.3.3 | Patient-linked history survives Xero archiving | medium ✓ | p.42 “while preserving full patient and billing history”<br>p.43 “archives Xero contacts once their invoices are fully paid” |
| US-08.3.4 | Money in and money out | medium ✓ | p.28 “as two distinct, separately trackable states for every payment”<br>p.29 “The system operates in the same way as a Trust account would.”<br>p.30 “what is owing and what is owed” |
| US-08.3.5 | Per-anaesthetist ledger position | high | p.30 “each anaesthetist’s “ledger” position: what is owing and what is owed”<br>p.32 “The billing engine translates this into views by anaesthetist.” |
| US-08.4.1 | Generate invoice documents | high | p.27 “these two billing types have slightly dihering invoice layouts”<br>p.21 “invoices will be “printed” and emailed from the billing engine” |
| US-08.4.2 | Send to the invoice email | medium ✓ | p.21 “emailed from the billing engine, rather than from Xero”<br>p.27 “is currently via an upload portal”<br>p.30 “Generates and despatches/queues the invoices for despatch to the Billable party”<br>p.15 “most commonly a guardian paying for a minor’s uninsured procedure” |
| US-08.4.3 | Unique invoice numbers | high | p.31 “Billing Engine-generated, unique invoice number”<br>p.32 “AA would prefer that there was a number similarity between the ACCREC and the ACCPAY records” |
| US-08.4.4 | Invoice reproducibility | high | p.19 “an invoice generated today must be reproducible against what was true at the time it was raised” |
| US-08.4.5 | Anaesthetist as supplier, AA as agent | medium ✓ | p.21 “support the “agency” nature of the relationship between AA and the Anaesthetists”<br>p.31 “a form of a Buyer Generated Tax Invoice” |
| US-08.5.1 | Report processing status | high | p.30 “Reports status back for oOice monitoring”<br>p.33 “need to monitor the List → Billing Engine → Xero ﬂow for completion and errors” |
| US-08.5.2 | Booking-level vs List-level failure | high | p.33 “block the whole List's processing, or only that Card?”<br>p.33 “Card-level vs List-level processing failure handling” |
| US-08.6.1 | Supplementary invoice for late billing lines | medium ✓ | p.24 “a single patient episode can generate more than one billable “line item” over time”<br>p.25 “separately itemised, sometimes days later” |
| US-08.6.2 | Credit note and re-issue | medium ✓ | — |
| US-09.1.1 | Create ACCREC and draft ACCPAY | high | p.31 “Both records are created at the same time, from the same Billing Engine transaction”<br>p.31 “created in DRAFT status and not yet part of any payables run” |
| US-09.1.2 | InvoiceNumber and Reference | high | p.31 “Internal CaseReference (links back to Card/Procedure)”<br>p.32 “The Billing Engine's only obligation is to have populated InvoiceNumber” |
| US-09.1.3 | Prepayment invoices also paired | medium ✓ | — |
| US-09.1.4 | ACCPAY as buyer-created tax invoice | high | p.31 “a form of a Buyer Generated Tax Invoice” |
| US-09.2.1 | Webhook on INVOICE events | high | p.31 “Primary: Xero webhook subscription on INVOICE events” |
| US-09.2.2 | Daily reconciliation poll | high | p.32 “a scheduled reconciliation poll (daily), since webhook delivery is not guaranteed” |
| US-09.2.3 | Idempotent by InvoiceID | high | p.32 “both paths write through the same handler, keyed by InvoiceID” |
| US-09.2.4 | Detect disbursement | medium ✓ | p.28 “the ACCPAY payables run represents the subsequent disbursement to the anaesthetist”<br>p.28 “as two distinct, separately trackable states for every payment” |
| US-09.3.1 | Hidden ID in ContactNumber | high | p.42 “stored in Xero’s ContactNumber”<br>p.42 “Cached against the hidden ID for fast future lookups” |
| US-09.3.2 | NHI never sent to Xero | high | p.42 “PMS only — never sent to Xero”<br>p.43 “NHI never resides in Xero, satisfying data minimisation expectations” |
| US-09.3.3 | Scheduled archiving | high | p.43 “archives Xero contacts once their invoices are fully paid”<br>p.8 “one-time customers and can be archived in Xero” |
| US-09.3.4 | Invoice against an archived contact | high | p.43 “attempt to invoice directly against it via the API”<br>p.43 “whether this requires an unarchive step” |
| US-09.4.1 | Dedicated Xero organisation | high | p.21 “A separate instance of Xero will be established”<br>p.21 “This instance of Xero will not be used for the general accounting work” |
| US-09.4.2 | Duplicate invoice number prevention | high | p.31 “Uniqueness should be enforced via the Xero organisation setting that prevents duplicate invoice numbers”<br>p.33 “Whether the Xero organisation setting preventing duplicate invoice numbers should be a mandated” |
| US-10.1.1 | All payments into AA | high | p.28 “all funds are received into the AA account, and AA is responsible for reconciling and disbursing to anaesthetists”<br>p.28 “That direct-payment pathway is retired under the new system” |
| US-10.1.2 | Two payment states | high | p.28 “as two distinct, separately trackable states for every payment” |
| US-10.2.1 | Full payment releases the payable | high | p.31 “the corresponding ACCPAY is set to AUTHORISED so that it is included in the next payables run” |
| US-10.2.2 | Partial payment releases exactly that amount | high | p.31 “Partial payments by the Billable Party are passed through for payment to the anaesthetist proportionally” |
| US-10.2.3 | Reconcile back to the ledger | medium ✓ | p.31 “looks up the matching case by Xero GUID”<br>p.28 “AA is responsible for reconciling and disbursing to anaesthetists”<br>p.32 “a scheduled reconciliation poll (daily)” |
| US-10.2.4 | Bulk remittance stays in Xero | high | p.32 “Any items the Remittance add-on cannot automatically match are simply left as unmatched items in Xero's bank reconciliation” |
| US-10.3.1 | Generate AA fee invoices | high ✓ | — |
| US-10.3.2 | AA fee visible to the anaesthetist | high ✓ | — |
| US-11.1.1 | Patient keyed on NHI | high | p.18 “NHI number, plus demographics”<br>p.38 “Ethnicity coding must use the NZHIS Level 4 code set.”<br>p.38 “All patient records must be linked to the National Health Index (NHI) number where available.”<br>p.18 “Patient and billable-party details are supplied by the surgeon/hospital as part of the Card”<br>p.42 “True clinical identity. Used at intake to validate and deduplicate patients” |
| US-11.1.2 | Dual-format NHI validation | high | p.40 “support both the current and new NHI formats by 1 July 2027”<br>p.40 “ensuring no part of the system assumes a purely numeric or sequential NHI”<br>p.41 “tested against both formats well in advance of the deadline” |
| US-11.1.3 | Deduplicate on NHI | high | p.42 “deduplicates against prior episodes regardless of name or address changes”<br>p.43 “true deduplication via NHI-driven matching, without name-matching fragility”<br>p.20 “How will Patient and Billable Party records be deduplicated and archived at scale” |
| US-11.1.4 | Patient without NHI | medium ✓ | p.38 “All patient records must be linked to the National Health Index (NHI) number where available.” |
| US-11.2.1 | Default billable party is the patient | high | p.15 “In the common case this is the patient themself”<br>p.16 “The patient (or their override, e.g. a guardian) is billed directly.” |
| US-11.2.2 | Guardian or other override | high | p.15 “most commonly a guardian paying for a minor”<br>p.16 “The patient (or their override, e.g. a guardian) is billed directly.” |
| US-11.2.3 | Invoice email required for patient-direct | low ✓ | p.21 “emailed from the billing engine, rather than from Xero” |
| US-11.3.1 | Patient outstanding bills view | medium ✓ | p.43 “surface any unpaid or overdue invoices”<br>p.31 “Any Accounts Outstanding reports show the remaining balance due.” |
| US-11.3.2 | Alert on booking a patient with unpaid bills | high | p.43 “surface any unpaid or overdue invoices”<br>p.42 “checks for outstanding credit issues” |
| US-11.3.3 | Follow-up tools | medium ✓ | — |
| US-11.4.1 | Insurer master data | high | p.18 “Held as a proper reference table even though only one Insurer (NIB) currently accepts direct claims from AA”<br>p.18 “Holds a mandatory default Type 1 Contract.”<br>p.17 “Every Hospital and every direct-billing Insurer is mandated to hold at least a default Type 1 Contract” |
| US-11.4.2 | Insured patient who forwards the invoice | high | p.27 “Patient holds private health insurance and forwards the invoice to their insurer for reimbursement”<br>p.16 “Only available where that Insurer accepts direct claims from AA (currently one only)” |
| US-12.1.1 | Dollar value per unit | high | p.23 “Each individual anaesthetist sets their own dollar value per unit” |
| US-12.1.2 | GST period | high | p.32 “aligned to each anaesthetist's individually-set GST period (monthly, bi-monthly, or six-monthly)” |
| US-12.1.3 | Prepaid procedures | high ✓ | — |
| US-12.1.4 | Identity and contact | high | p.17 “Basic contact information plus registration number (ID).”<br>p.38 “Anaesthetist identity should reference the Health Provider Index (HPI) where possible.” |
| US-12.1.5 | Bank details for disbursement | low ✓ | p.28 “track and manage anaesthetist disbursement”<br>p.31 “not yet part of any payables run” |
| US-12.2.1 | Outstanding balances list | high | p.32 “An on-demand list of account balances outstanding. For a given query, a typical result set might contain around 100 records.”<br>p.32 “with no Card-level or other aggregation/rollup”<br>p.32 “the app is not designed to answer accounting-level questions”<br>p.7 “Outstanding Balances lists”<br>p.49 “This screen shows a classic accounts outstanding view, ordered by date.” |
| US-12.2.2 | Activity summary for GST | high | p.32 “a date-ranged list showing amounts received and the GST component”<br>p.7 “Monthly activity summaries” |
| US-12.2.3 | Dashboard | high | p.46 “This is the Home page for anaesthetists, showing a summary of calendar” |
| US-13.1.1 | One-day dashboard | high | p.45 “From this, users can navigate via a series of drill-downs”<br>p.18 “need to see availability at AM/PM granularity across all anaesthetists for a given day” |
| US-13.1.2 | Pre-op review of tomorrow | high | p.30 “No system gate is required on pre-op review” |
| US-13.2.1 | Whole-ledger balance | low ✓ | p.29 “The system operates in the same way as a Trust account would.”<br>p.28 “as two distinct, separately trackable states for every payment” |
| US-13.2.2 | Per-patient balance | low ✓ | p.43 “surface any unpaid or overdue invoices” |
| US-13.2.3 | Per-anaesthetist balance | medium ✓ | p.30 “The agency (AA) is concerned with the billing in terms of each anaesthetist”<br>p.30 “what is owing and what is owed” |
| US-13.3.1 | Processing monitor | high | p.33 “this is a genuine requirement, not a by-product of the other two designs”<br>p.30 “Reports status back for” |
| US-13.3.2 | Manual intervention | medium ✓ | p.38 “support manual intervention work”<br>p.33 “for completion and errors”<br>p.33 “Card-level vs List-level processing failure handling” |
| US-13.4.1 | Maintain reference tables | high | p.17 “maintained as separate, relatively static master tables”<br>p.18 “are maintained independently and referenced by ID”<br>p.33 “The dropdown of RVG codes and values is curated centrally (by AA)”<br>p.24 “the expectation is a curated dropdown of RVG codes” |
| US-13.5.1 | Role-based access | high | p.8 “Access rights should be managed by role rather than on an individual user basis”<br>p.23 “Editable only by office (OfficeAdmin role).” |
| US-13.5.2 | Audit trail of all actions | high | p.8 “Audit trails of manual and automated actions are required.”<br>p.15 “Full audit of changes is required at the Card level”<br>p.19 “A full audit trail is a structural requirement” |
| US-14.1.1 | Parse SIU messages | high | p.38 “receiving and parsing HL7 v2.3.1 SIU messages (S12 New, S13 Reschedule”<br>p.35 “This message type is used to notify our system of changes to booked surgical appointments” |
| US-14.2.1 | FHIR-native internal model | high | p.38 “translation layer that converts inbound v2 messages to FHIR-equivalent internal representations”<br>p.38 “the integration engine should operate natively using FHIR R4” |
| US-14.3.1 | Real-time processing | high | p.38 “each message is acted upon as it is received” |
| US-14.4.1 | NHI lookup via Digital Services Hub | high | p.38 “Patient identity lookups must use the NHI FHIR API via the Health NZ Digital Services Hub”<br>p.38 “Anaesthetist identity should reference the Health Provider Index (HPI) where possible”<br>p.36 “must use the FHIR API via the HNZ Digital Services Hub” |
| US-14.5.1 | Integration failure visibility | high | p.38 “The solution must provide operational visibility into integration failures and support manual intervention” |
| US-15.0.1 | Ease of use | high | p.8 “users might not be entirely comfortable with modern information systems” |
| US-15.0.2 | Mobile-first for anaesthetists | medium ✓ | p.7 “Anaesthetists primarily operate via their mobile application, with access to a similar web-based application.”<br>p.30 “apply equally to the anaesthetists' web app view” |
| US-15.0.3 | Enter once | high | p.8 “to ensure data is entered once only and is up to date in all systems” |
| US-15.0.4 | Volumes | high | p.8 “Annual Invoices 28,000 p.a.”<br>p.18 “~85 anaesthetists × ~120 days × 2 lists ≈ 20,000 List records”<br>p.42 “≈ 28,000 invoices per year” |
| US-15.0.5 | Testable billing rules | high ✓ | — |
| US-15.0.6 | Privacy and data minimisation | high | p.41 “good privacy and data minimisation practice”<br>p.42 “PMS only — never sent to Xero”<br>p.43 “NHI never resides in Xero, satisfying data minimisation expectations for health information” |

## Outstanding items (questions)

| ID | Title | Confidence | RFP evidence |
| --- | --- | --- | --- |
| OQ-01 | Cancellation fees | high ✓ | — |
| OQ-02 | AA fee basis | high ✓ | — |
| OQ-03 | Refund when prepaid exceeds final | high ✓ | — |
| OQ-04 | Prepaid amount source | high ✓ | — |
| OQ-05 | Booking-level vs List-level failure | high | p.33 “block the whole List's processing, or only that Card?”<br>p.33 “Card-level vs List-level processing failure handling” |
| OQ-06 | Base units on RVG code or on Contract | medium ✓ | — |
| OQ-07 | Concurrency | high | p.19 “concurrently by multiple sources (surgeon integration, hospital integration, anaesthetist mobile app)?”<br>p.19 “has implications for concurrency handling (see Open Questions)” |
| OQ-08 | List reassignment mechanism | high | p.19 “What is the precise mechanism for reassigning a List between Anaesthetists at short notice”<br>p.19 “Lists must support reassignment between Anaesthetists, including at short notice” |
| OQ-09 | Holiday and availability conflicts | high | p.19 “as hard constraints, soft warnings, or something else?”<br>p.19 “expected to be reconciled against the canvas” |
| OQ-10 | Invoicing an archived Xero contact | high | p.43 “sandbox testing whether this requires an unarchive step” |
| OQ-11 | Xero duplicate invoice number setting | high | p.33 “Xero organisation setting preventing duplicate invoice numbers should be a mandated”<br>p.31 “Uniqueness should be enforced via the Xero organisation setting that prevents duplicate invoice numbers” |
| OQ-12 | ACC pre-op codes | high | p.25 “(CS250, CS260, CS70), separate from the general BTM structure”<br>p.25 “ACC pre-operative consults are usually billed separately (TBC).” |
| OQ-13 | Hospital download format | high ✓ | — |
| OQ-14 | Anaesthetist bank details | high ✓ | — |
| OQ-15 | Modifier split when units do not divide evenly | high ✓ | — |
| OQ-16 | Office adjustment at review | medium ✓ | — |
| OQ-17 | List status vocabulary | high | p.17 “(e.g. private, public, pre-op, holiday, unavailable, free). Fields: description, colour.”<br>p.14 “available, available for emergency, unavailable, on leave (etc)” |
| OQ-18 | Contract holder codes vs RVG codes | high ✓ | — |
| OQ-19 | Hospital dispute fallback | high | p.20 “subsequently disputes or fails to pay” |
| OQ-20 | Insurer rate structures | high | p.19 “Should the Insurer billing route eventually support its own rate table structure distinct from the Hospital” |
| OQ-21 | Deposit refund on cancellation | high ✓ | — |
| OQ-22 | Who may set the Contract from hospital data | low ✓ | p.16 “This is set explicitly (by hospital advice, or by AA” |
| OQ-23 | Gap / partial-cover billing | high | p.28 “A single procedure is only partially covered by a contract or funding arrangement” |
| OQ-24 | Billing lines after AUTHORISED | medium ✓ | p.25 “HDU, ICU, ward reviews, nerve catheters”<br>p.24 “HDU or ward review visits that may occur days after the original procedure”<br>p.23 “Locked — immutable; passed to Billing Engine as a unit.” |
| OQ-25 | Is a Pre-paid Contract category still wanted? | high ✓ | — |
| OQ-26 | When does AA approve Contract selections? | medium ✓ | — |
| OQ-27 | List status vs anaesthetist availability calendar | medium ✓ | p.19 “Anaesthetist Availability and Hospital Holiday data are independent inputs, not structural members”<br>p.14 “Availability is set at the List (half-day) level”<br>p.17 “Anaesthetist Availability Maintained by each Anaesthetist via the mobile app.” |
| OQ-28 | Correction after invoicing | medium ✓ | — |
| OQ-29 | GST agency treatment | medium ✓ | p.21 “legal interpretation under GST legislation”<br>p.31 “a form of a Buyer Generated Tax Invoice”<br>p.30 “the internal accounting revolves around the Anaesthetist” |
| OQ-30 | NHI in Xero: Appendix 1 vs Appendix 2 | high | p.41 “is stored alongside the Xero Contact ID as a custom”<br>p.42 “never sent to Xero” |
| OQ-31 | Event that removes a List from the anaesthetist's view | high | p.33 “The precise trigger for a List disappearing from view should be invoice generation”<br>p.33 “precise system event that removes a List from the anaesthetist's mobile view” |
| OQ-32 | Base unit override beyond the RVG range | high | p.33 “may be overridden by the anaesthetist for a given procedure”<br>p.24 “Some codes are ranges, not”<br>p.29 “selected base code (with override for range-based codes)” |
| OQ-33 | Unpaid-patient alert threshold | high | p.43 “Decide whether to separately distinguish”<br>p.43 “to surface any unpaid or overdue invoices for” |
| OQ-34 | Which intake pathway carries most bookings today? | medium ✓ | p.34 “Currently, this is the main pathway for data.” |
