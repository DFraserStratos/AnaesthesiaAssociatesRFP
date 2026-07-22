# Anaesthesia Associates

## Booking and Billing Systems Upgrade

## Request for Proposal

## Final

```
July 2026
```

Table of Contents

##### Introduction ............................................................................................................................... 4	

##### Background ........................................................................................................................... 4	

##### Who should respond .............................................................................................................. 4	

##### Approach ............................................................................................................................... 4	

##### Timeline ................................................................................................................................. 5	

##### Confidentiality ........................................................................................................................ 6	

##### Questions and RFP Contact .................................................................................................... 6	

##### Demonstration participants .................................................................................................... 6	

##### Project Overview ........................................................................................................................ 7	

##### High-level Requirements Summary ......................................................................................... 7	

##### General features / Non-Functional Requirements .................................................................... 8	

##### Data Volumes ........................................................................................................................ 8	

##### Approach to Requirements ..................................................................................................... 8	

##### Request for Proposal Response .................................................................................................. 9	

##### Service Provider Information ................................................................................................... 9	

##### Solution Overview .................................................................................................................. 9	

##### Client References ................................................................................................................... 9	

##### Innovation / Value Add ............................................................................................................ 9	

##### Approach Methodology, Solution Deployment and Timeline ..................................................... 9	

##### Scoping/Design Phase ............................................................................................................ 9	

##### Commercial Approach and Summary of Indicative Costs ....................................................... 10	

##### Requirements Introduction ....................................................................................................... 12	

##### Major System Components ................................................................................................... 12	

##### Schedule Management – Candidate Architecture ...................................................................... 13	

##### Purpose ............................................................................................................................... 13	

##### Overview .............................................................................................................................. 13	

##### Entity Descriptions ................................................................................................................... 14	

##### Schedule ............................................................................................................................. 14	

##### Day ...................................................................................................................................... 14	

##### Anaesthetist ......................................................................................................................... 14	

##### List ...................................................................................................................................... 14	

##### Card .................................................................................................................................... 14	


##### Procedure ............................................................................................................................ 15	

##### Billing Route Resolution ........................................................................................................ 16	

##### Supporting / Master Data ...................................................................................................... 17	

##### Key Design Principles ............................................................................................................ 18	

##### Open Questions ................................................................................................................... 19	

##### Billing Engine – Candidate Architecture ..................................................................................... 21	

##### Generic Process Flow Overview ............................................................................................ 21	

##### The Card as the Billing Anchor ............................................................................................... 22	

##### Card Immutability and the List Approval Process .................................................................... 22	

##### The Big Picture: What Are We Actually Calculating? ................................................................ 23	

##### How Anaesthesia Associates Calculates Invoices .................................................................. 26	

##### Who Receives the Invoice? .................................................................................................... 27	

##### Split Billing ........................................................................................................................... 28	

##### Payments — Where the Money Lands .................................................................................... 28	

##### Summary: What This Means for the Billing Engine ................................................................... 29	

##### Card Copy ........................................................................................................................... 29	

##### Ad-Hoc Card creation ........................................................................................................... 29	

##### Billing Engine Integration Point .............................................................................................. 30	

##### The Agency Perspective ........................................................................................................ 30	

##### Xero Integration – Candidate Design .......................................................................................... 31	

##### Mobile App Consumption Model ........................................................................................... 32	

##### Open Items Carried Forward ................................................................................................. 33	

##### Health Systems Integration ....................................................................................................... 34	

##### Overview .............................................................................................................................. 34	

##### Manual Processing ............................................................................................................... 34	

##### Automated Processing .......................................................................................................... 34	

##### Current State: HL7 v2 Messaging ........................................................................................... 34	

##### Health New Zealand Policy Context: FHIR First .......................................................................... 36	

##### The FHIR Standard ............................................................................................................... 36	

##### Integration Requirements ......................................................................................................... 38	

##### HL7 v2 Inbound Processing ................................................................................................... 38	

##### FHIR R4 Translation .............................................................................................................. 38	

##### FHIR-Native Architecture and Message Pre-Processing .......................................................... 38	

##### NZ Identity Standards ........................................................................................................... 38	

##### Reliability and Monitoring ...................................................................................................... 38	


##### Reference Links .................................................................................................................... 39	

##### Changes to the National Health Index (NHI) .............................................................................. 40	

##### Why the change is happening ................................................................................................ 40	

##### What is changing .................................................................................................................. 40	

##### Impact on patients ............................................................................................................... 40	

##### Impact on digital health systems ........................................................................................... 40	

##### Our approach to compliance ................................................................................................ 40	

##### Design policy: separating clinical and billing identifiers ........................................................... 41	

##### Overview .............................................................................................................................. 42	

##### Identity Layers ...................................................................................................................... 42	

##### Workflow ............................................................................................................................. 42	

##### Anaesthetist Mobile App .......................................................................................................... 44	

##### Admin Schedule View (One Day Dashboard) ............................................................................. 45	

##### Anaesthetist Web App .............................................................................................................. 46	


### Introduction

**Background**

Anaesthesia Associates Ltd (AA) is a Christchurch based, collectively owned, service company that
provides booking and billing services for approximately 85 local anaesthetists.

Anaesthetists, working independently, have arrangements with various surgeons for both recurring and
casual bookings for their services. These bookings, and the subsequent billing, are coordinated by AA
who provide both mobile and web-based applications for the anaesthetists to manage their calendars
and capture information about the various procedures performed.

AA have a legacy system that has been in place for many years, and they are seeking to refresh their
systems to provide greater reliability and ehiciencies. Many of the current processes are handled
manually and are subject to bottlenecks and data quality issues.

**Who should respond**

AA have surveyed the market for package-based solutions and are satisfied that suitable pre-built
systems to address their specific requirements are not available.

AA is anticipating that a custom-built application will be the most likely approach for their requirements.
Vendors may propose a solution either entirely custom built or a mixture of pre-built and customised
components based on a proprietary platform. We are flexible about the approach.

**Approach**

This process is intended to bring out the best solutions available, and Peritia will be available to assist
vendors in understanding any aspects of the requirements.

We are approaching the process in steps:

1. Evaluating the responses received and selecting a short list of providers from the responses
    received to our RFP
2. Providing opportunities for the short-listed providers to interview Peritia and AA stah to discuss
    the requirements and opportunities
3. Requesting a presentation or demonstration workshop from short-listed suppliers
4. Selection of a preferred supplier
5. Facilitating a detailed discovery and scoping process, with the preferred supplier(s), to allow both
    parties to clarify the requirements, and for the preferred Service Provider(s) to develop a formal
    Statement of Work.


**Timeline**

The following table outlines an approximate timeline for the envisaged project.

```
Activity Proposed Dates*
```
```
Publication of the RFP and Workshop documents 16 th July 2026
```
```
Close-oh date for receipt of proposals 31 st July 2026
```
```
Selection of short-listed providers
Notification of next steps / interviews / demonstrations
7 th August 2026
```
```
Demonstration Workshops 10 th - 14 th August 2026
```
```
Selection of preferred partner(s) 14 th August 2026
```
```
Vendor Discovery / Scoping 17 th – 28 th August 2026
```
```
Submission of Proposal and Statement of Work 31 st August 202 6
```
```
Proposal Approval 4 th September 2026
```
```
Project Implementation Sep – Oct 2026
```
```
Go-live October 2026
```
* Indicative Dates - To be confirmed.


**Confidentiality**

This RFP, and all other material related to this process, is provided in confidence to potential Service
Providers.

AA will require respondents (and all related stah) to sign formal Non-Disclosure Agreements as it may be
necessary to permit limited visibility of patient, and other personally identifiable, information in the
compilation of the response:

® All information is confidential and intended only for the recipients.
® The information provided will not be used for any other purpose.
® All information will be held strictly confidential and only available to those directly involved in this project.

**Questions and RFP Contact**

Respondents are encouraged to clarify any aspect of the RFP, or ask any questions, during the response
period. We reserve the right to share any questions and answers with the other respondents.

All questions and/or contact in relation to this RFP should be directed to:

Greg Smith
Director
Peritia Limited
Email: greg.smith@peritia.co.nz

#### Phone: 021 477 163

**Demonstration participants**

We recommend that you include a Solution Architect or Senior Technical Lead in your demonstration
team, to allow AA to discuss aspects of the requirements in detail.


### Project Overview

**High-level Requirements Summary**

This is an outline of the requirements from a high-level business perspective. The requirements are
covered in more detail later in this document.

The system is, at its heart, a scheduling application that then extends into timesheet capture and billing.

**Schedule Management**

The presentation of a calendar that allows anaesthetists to manage their availability for engagements
with surgeons, typically over a rolling 4-month forward window. This calendar supports an ongoing
booking iteration between surgeons’ rooms, hospitals and anaesthetists (via AA). There is an industry
convention that these individual booking details are referred to as Cards. The coordination of the
bookings and the many changes that subsequently occur involves interactions between the three parties,
over several months, right up to the day on which the procedures are scheduled.

The introduction of modern integrations is a key goal to reduce manual workloads.

**Billing Management**

The calculation of invoice billing is the second key functionality. Once anaesthetists have completed their
data capture, and work has been checked by the ohice, the invoices are generated from the Card
information and sent to Xero for collection. Automation is also a key goal for the design of this module.

**Mobile and Web Applications**

Anaesthetists primarily operate via their mobile application, with access to a similar web-based
application. The mobile app displays the calendar, the Cards and procedure details. The application also
provides a time-sheeting function to capture time and charge details for each Procedure and displays the
availability of other anaesthetists where swaps are needed. Provision should be made to allow
attachments to the schedule records.

Admin ohice stah also require a web application that allows them to operate on the schedule and billing
management. This is primarily a set of views and permissions that allow oversight of the key processes:
handling manual changes from hospitals and surgeons’ rooms, and validating Card entries for billing

**Reporting**

There are minor reporting requirements for anaesthetists that include:

® Outstanding Balances lists, and
® Monthly activity summaries


**General features / Non-Functional Requirements**

A fundamental requirement is an intuitive user experience and ease of use. This is particularly important
for the operational modules, where users might not be entirely comfortable with modern information
systems.

Robust, flexible interfaces with other systems are vital to ensure data is entered once only and is up to
date in all systems.

The solution needs to provide controls around view, access, edit rights etc. Access rights should be
managed by role rather than on an individual user basis, to allow for easy management and consistent
permissions for stah in like roles.

Audit trails of manual and automated actions are required.

**Data Volumes**

The number of invoices generated may present some challenges for Xero, however around 50% of
invoices are for a small number of major contract holders (hospitals and insurers). The remainder can be
thought of, in general, as one-time customers and can be archived in Xero.

Anaesthetists ~ 85

Annual Invoices 28,000 p.a.

**Approach to Requirements**

The current systems and processes are not a reliable starting point for defining the future state.

We have taken the approach of constructing a Candidate Architecture to provide a clearer view to the key
functions, processes and outputs. This is presented to save time in understanding the organisational
needs and will provide an easier starting point from which to engage in the design of your solution.


### Request for Proposal Response

Service Providers are requested to provide information about their services and expertise, and the
products and services they would oher in support of this RFP. The aim is to clearly inform AA about the
following areas:

**Service Provider Information**

To provide an overview of Service Provider capability in delivering this specific solution and project, along
with information about the team who would likely be engaged in the delivery.

**Solution Overview**

Provide an overview of the solution components and architectures proposed. The Candidate Design
section outlines the requirements and architectures expected to be provisioned in the solution.

**Client References**

Provide two Client Reference sites, describing the systems implemented.

Please provide a contact name, role, phone number and email address of a contact person at each site.
These reference sites should be selected based on the relationship your organisation has developed with
your client and relevance to this requirement.

_Note: No contact will be made without prior agreement from you as the service provider._

**Innovation / Value Add**

AA is seeking innovative product and design options that will specifically address their requirements, with
particular focus on the user experience and ease of use.

**Approach Methodology, Solution Deployment and Timeline**

Describe the proposed implementation methodology used by your organisation. This may include, but is
not restricted to, your approach to design, development, deployment, project management and
methodologies, change management, and training. Please provide a suhicient level of detail to allow the
Professional Services estimates build-up to be understood.

AA is keen to have a new solution operational as soon as possible. Please provide an indicative timeline
estimate for both the preparation and delivery based on an assumed September project start date.

**Scoping/Design Phase**

We are proposing to undertake a funded scoping/design phase for the preferred supplier. Please provide
estimated costs and duration for this phase.


**Commercial Approach and Summary of Indicative Costs**

Due to the nature of the development, we recognise that there is some potential for further sales of the
product in NZ. We may consider commercial arrangements in this regard, without making any
commitments at this stage.

We understand that early budget estimates are problematic, however providing a range of indicative
implementation costs, licence costs and any associated conditions, can be helpful for budget planning.

In your response, please provide details of the various product licencing conditions and costs, and a rate
table for your standard project implementation resources (PM’s, Functional Specialists etc).

The pricing schedule should include:

Licencing for modules and options. Performance constraints and risks. Tier pricing.

Professional Services: Standard rates

Estimated ongoing support costs.

Initial estimate of Professional Services, subject to review after Discovery

Draft Timeline for a Project implementation

Development methodology and expected team makeup

Pricing should include details describing how adding or removing users ahects licencing, and the overall
approach to managing user levels.

We will treat any Professional Services budgets as indicative, as a further opportunity to undertake a more
detailed discovery will be provided for the preferred supplier.


# Anaesthesia Associates

## Booking and Billing Systems Upgrade

## Outline of Functional Requirements

## Candidate Architecture

```
July 2026
```

### Requirements Introduction

This section introduces the AA business model and a Candidate Architecture.

AA has been using its current system for many years, and it is seeking to refresh this with an updated
application that will embrace the latest technologies available to maximise the automation of their
information processing, reduce stah workloads and improve data quality.

Rather than providing a Detailed Requirement Specification, we have decided to provide a technical
starting point that steps into the analysis and seeks to clarify the key business functions and technical
features that AA is seeking for its new systems. The conceptual system outline below is not a radical
departure from the existing applications, but seeks to improve every aspect of their operation, timeliness
and ease of use, and to move existing AR functions into Xero.

**Major System Components**


### Schedule Management – Candidate Architecture

**Purpose**

This section describes AA’s scheduling data. It is provided as a reference model — a starting point for
design and discussion — not as a fixed specification. We expect this structure to be challenged, refined,
and extended as the data model is developed, particularly where a diherent approach proves to be a
better fit.

**Overview**

AA anaesthetists have both standing and ad-hoc arrangements with various Surgeons. These are half-day
booking clusters known as Lists. Lists can be assigned automatically, based on standing arrangements
(Permanent Lists), or through ad-hoc additional bookings, typically via phone from the surgeons’ rooms.

The core scheduling entity is a nested hierarchy, rolling forward on a 4-month horizon:

Schedule → Day → Anaesthetist → List is structural and fixed, created by the system for every active
Anaesthetist, for every Day in the rolling horizon, with exactly two Lists per Anaesthetist-Day (AM and PM).
This part of the tree is ehectively a canvas — a stable grid that exists independently of activity.

List Status, Hospital, Surgeon, and Cards are the data painted onto that canvas; they vary, but the canvas
itself does not grow or shrink with them.


### Entity Descriptions

**Schedule**

The top-level container for AA’s forward rolling calendar. Conceptually a single ongoing structure rather
than a series of discrete, separately generated calendars.

**Day**

A calendar date within the Schedule. Each active Anaesthetist has a presence on each Day within the
rolling horizon, regardless of whether they are working.

**Anaesthetist**

Anaesthetists are sourced from the master Anaesthetist table and referenced into the Day structure
rather than owned by it.

**List**

A half-day session (AM or PM) belonging to an Anaesthetist on a given Day. Every Anaesthetist has exactly
two Lists on every Day within the rolling horizon — this is fixed structure, not conditional on activity. The
List is a first-class object — it always exists once the schedule horizon reaches that date and carries its
own status independent of whether it currently holds Cards. The start and end times of the list have a
default value, but that may be overridden. All day bookings simply use both lists.

- Status reflects the current state of the List, for this Anaesthetist, — e.g. available, available for
    emergency, unavailable, on leave (etc) — and is sourced from a master ListStatus table.
    Availability is set at the List (half-day) level, not the Anaesthetist or Day level, since an
    Anaesthetist’s availability can vary independently between AM and PM.
- Hospital is the physical location the List takes place at, drawn from a master Hospital table.
    Theatre information is not currently recorded.
- Surgeon is the anaesthetist’s surgeon for that List. The assignment is usually (approximately 80%)
    defined in the anaesthetist’s Permanent List but may otherwise be assigned manually by ohice
    stah. The list instance is then only available for that anaesthetist/surgeon pairing.

**Card**

An appointment slot within a List, filled progressively by the surgeon (via automated process, integrations
or manual advice) in the weeks leading up to the procedure. A List will contain multiple Cards, displayed
in time order.

- patient references the master Patient table (unique identifier: NHI number).
- time is the scheduled time of the Card within the List.
- lastModifiedBy / lastModifiedAt track the most recent change, given that Cards are mutable from
    multiple sources (surgeon integration, hospital integration, anaesthetist mobile app) right up to
    the time of the procedure.
- Card details are primarily filled by the surgeon/hospital, and (ideally) this data is passed through
    via a hospital integration rather than entered manually by AA stah.


- Full audit of changes is required at the Card level — every create, update, and reassignment must
    be logged, not just summarised via lastModifiedBy / lastModifiedAt. This reflects both the
    multiplicity of sources able to change a Card and the clinical/billing significance of an accurate
    change history.

**Procedure**

One or more clinical procedures may be performed within a single Card. This is where the bulk of
dynamic clinical detail lives, including the data needed to support billing. A Card may have more than one
Procedure, and each Procedure resolves its own billing route independently — within a single Card, one
Procedure may be billed to the Hospital while another is billed to the Billable Party.

- billingRoute determines who is invoiced for this Procedure: Hospital, Billable Party, or Insurer. See
    Billing Route Resolution below.
- insurer (→ Insurer, nullable) is populated when billingRoute = Insurer, and may otherwise be
    recorded informationally when noted by the hospital under the Hospital route.
- governingContract (→ Contract) is looked up to determine the rate applied, independently of
    which billingRoute was resolved. See Billing Route Resolution below.
- priceOverride (optional) allows a discretionary adjustment to the standard rate — e.g. a friends-
    and-family discount — independent of any Contract. Should carry a reason/note, both for ohice
    reference and for the audit trail. Designs should allow for both agreed, fixed fees and $ or %
    adjustments.
- billableParty (→ Patient by default) identifies who is responsible for payment when billingRoute =
    Billable Party. In the common case this is the patient themself; an explicit override is used where
    the Billable Party dihers from the patient — most commonly a guardian paying for a minor’s
    uninsured procedure.
- Patient and Billable Party data is supplied by the surgeon/hospital as part of the booking. This
    data is captured here as the source feed for invoice generation; see the Xero Integration section
    for how it is consumed.


**Billing Route Resolution**

Each Procedure resolves to exactly one of three billing routes. This is set explicitly (by hospital advice, or
by AA stah where the hospital does not specify) rather than derived from other flags:

```
Billing Route Meaning
```
```
Hospital / Contract
Holder
```
```
The Contract Holder (usually a hospital) accepts billing for this
procedure, commonly noted with Contract and insurance details. The
hospital may itself be acting as an agent or insurer-like party in the
underlying arrangement. To accommodate various arrangements with the
Hospital a number of Contracts are established – these are ehectively
billing rules. A Default Contract, which has no conditions will always be
present. The default contract is empty and is billed at the normal (no
contract rates).
```
```
Billable Party The patient (or their override, e.g. a guardian) is billed directly. No
Contract applies; rate is standard, subject to an optional price Override.
```
```
Insurer The named Insurer is billed directly. Only available where that Insurer
accepts direct claims from AA (currently one only). Rate is governed by
the Contract held for that Insurer.
```
The Hospital entity plays two distinct roles in this model

1. As the physical location of the theatre (List.hospital, is always present) for an active List
2. As a billing counterparty (only when billingRoute = Hospital). Both roles reference the same
    Hospital master record; the model does not require a second Hospital reference to express this
    — it is simply a matter of which relationship is being used

Rate calculation is independent of billing route, and follows a uniform lookup once the route is resolved:
find the governing Contract for the relevant counterparty (Hospital or Insurer), and apply its type.

```
Contract type Behaviour
```
```
1 — Reference
only
```
```
No overrides. Standard rate applies (anaesthetist’s own $/Base unit, RVG-
referenced).
```
```
This is the mandatory default Contract (Contract.Name = “Default”), held for
every Hospital and every direct-billing Insurer.
```
```
This Contract type is also used for Hospitals requiring a Contract reference to
assist with their internal analysis, but which does not impact billing rules/pricing
```
```
2 — Agreed rate
/ discount
```
```
Agreed rate or discount % oh standard rates.
```

```
Contract type Behaviour
```
```
3 — Fixed price Fixed price, independent of standard rates.
```
Every Hospital and every direct-billing Insurer is mandated to hold at least a default Type 1 Contract (a
simple, one-oh admin step). This guarantees governing Contract always resolves to a real Contract when
billing Route is Hospital or Insurer — there is no “no Contract found” branch in the rating logic. Contract is
looked up by counterparty (Hospital or Insurer), not by procedure type or any other dimension.

Multiple Procedures resolving to the same billing route and counterparty are billed together on a single
invoice where appropriate — for example, two uninsured Procedures for the same patient. Invoice
generation is therefore a grouping operation over Procedures by resolved counterparty, not a one-to-one
Procedure-to-invoice mapping. This is covered in the Xero Integration section.

Care will be required in the design of the charging of multiple procedures. Various rules apply depending
on the nature of the contract.

**Supporting / Master Data**

The following are referenced by the structure above but maintained as separate, relatively static master
tables:

```
Master table Description / key fields
```
```
Hospital ID and Name. Minimal additional data at present. (A Hospital is usually,
but not always the Contract Holder. See note re Bariatric Surgery)
```
```
List Status Defined set of statuses (e.g. private, public, pre-op, holiday, unavailable,
free). Fields: description, colour. (to be confirmed)
```
```
Anaesthetist AA’s anaesthetist. Basic contact information plus registration number
(ID).
```
```
Hospital Holiday
Calendar
```
```
Each hospital’s own availability calendar (closures, holidays, etc.),
maintained independently per hospital.
```
```
Anaesthetist
Availability
```
```
Maintained by each Anaesthetist via the mobile app. Reflects their
personal availability, independent of any List assignment. Any change in
these settings is immediately reflected in the Schedule
```
```
Recurring
(“Permanent”) Lists
```
```
Standing arrangements defined by Hospital, Day of Week, Anaesthetist,
and AM/PM. Used to populate the rolling schedule with default Lists
going forward.
```

```
Master table Description / key fields
```
```
Surgeon External party, called on by AA.
```
```
Patient Identified by NHI number, plus demographics. Patient and billable-party
details are supplied by the surgeon/hospital as part of the Card, rather
than originated by AA.
```
```
Insurer Held as a proper reference table even though only one Insurer (NIB)
currently accepts direct claims from AA. Key field: acceptsDirectClaims.
Holds a mandatory default Type 1 Contract.
```
```
Contract Governs rate calculation for a billing counterparty. Scoped to either a
Hospital or an Insurer (an Insurer-scoped Contract applies across all
hospitals). Every Hospital and every direct-billing Insurer is mandated to
hold at least a default Type 1 (reference only) Contract; types 2 (agreed
rate/discount) and 3 (fixed price) are used where a real negotiated
arrangement exists. See Billing Route Resolution.
```
**Key Design Principles**

1. Schedule → Day → Anaesthetist → List is a fixed canvas. It is pre-populated on a rolling 4-month
    horizon: every active Anaesthetist has exactly two Lists (AM, PM) projected forward for every Day
    in the horizon, regardless of whether those Lists are in use. This canvas does not grow or shrink
    with activity — it is what allows AA’s calendar view to render a complete picture, including
    unopened/free slots, without gaps. At current roster size this is a lightweight dataset (~ 85
    anaesthetists × ~120 days × 2 lists ≈ 20,000 List records).
2. If an Anaesthetist is added, then their forward schedule needs to be populated so that the
    “canvas” is ready to accept bookings.
3. Status, Hospital, Surgeon, and Cards are painted onto the canvas, not part of its shape. A List’s
    status is meaningful on its own (e.g. “this anaesthetist is on leave Tuesday PM”) even with no
    Cards attached — status is not derived from Card activity, and the presence or absence of Cards
    never changes the canvas structure itself.
4. The List is the unit of availability, not the Anaesthetist or the Day. This is what supports AA’s
    primary operational use case: when a surgeon’s ohice calls looking for a free slot, stah need to
    see availability at AM/PM granularity across all anaesthetists for a given day.
5. Master/reference data is decoupled from the schedule tree. Hospital, Surgeon, Anaesthetist,
    Patient, and List Status, Master Calendar, Hospital Calendar and Anaesthetist Availability
    (calendar) are maintained independently and referenced by ID, not nested/owned within the
    schedule structure. This keeps the schedule tree itself relatively lightweight.


6. Recurring availability and standing arrangements sit outside this tree, but actively project into it.
    The Permanent List master (Hospital, Day of Week, Anaesthetist, AM/PM) is what populates the
    rolling canvas with default Lists as the 4-month horizon advances. It is the template; the
    Schedule tree is the generated instance.
7. Anaesthetist Availability and Hospital Holiday data are independent inputs, not structural
    members. Both are maintained on their own master calendars — availability by the Anaesthetist
    via mobile app, holidays by each Hospital (admin input) — and are expected to be reconciled
    against the canvas (e.g. flagged conflicts, surfaced as constraints) rather than merged into the
    List record itself.
8. Lists must support reassignment between Anaesthetists, including at short notice. Illness and
    other late changes mean a List — along with its existing Cards — may need to move from one
    Anaesthetist to another close to, or on, the day of the procedure. The data model needs a clean
    way to reassign a List’s owning Anaesthetist without disturbing its Cards, status history, or audit
    trail.
9. Cards remain dynamic until the day of the procedure. Patient Cards within a List are not finalised
    once created — they can be added, amended, or reassigned right up to the procedure date, from
    multiple sources (surgeon integration, hospital integration, anaesthetist mobile app). This
    reinforces the last Modified By / last Modified At requirement at the Card level and has
    implications for concurrency handling (see Open Questions).
10. A full audit trail is a structural requirement, not an incidental field. Card and Procedure data —
    including billing route, governing Contract, and any price override — must support a complete
    history of changes (who, what, when), not just a single last Modified By / last Modified At
    summary. This is driven by both the multiplicity of sources able to change this data and its
    clinical/billing significance: an invoice generated today must be reproducible against what was
    true at the time it was raised, even if the underlying rules (e.g. a Contract’s terms) change later.
    This points toward an append-only change log or event history for these entities, rather than
    simple mutable records with audit columns — a choice that should be made deliberately as part
    of the technical design, rather than left implicit.

**Open Questions**

- How does the data model handle a Card or Procedure being modified concurrently by multiple
    sources (surgeon integration, hospital integration, anaesthetist mobile app)?
- What is the precise mechanism for reassigning a List between Anaesthetists at short notice, and
    how is its Card, status, and audit history preserved through that reassignment?
- How should Anaesthetist Availability and Hospital Holiday data be reconciled against the
    schedule canvas — as hard constraints, soft warnings, or something else?
- Should the Insurer billing route eventually support its own rate table structure distinct from the
    Hospital Contract model, if direct-billing arrangements with insurers grow more complex than the
    current single-Insurer, Type 1 default case?


- What happens if a hospital accepts billing for a Procedure (billing Route = Hospital) but
    subsequently disputes or fails to pay — is there a defined fallback to the Billable Party, or is the
    Hospital route final once resolved?
- How will Patient and Billable Party records be deduplicated and archived at scale, given the high
    proportion of single-use clients? (Addressed separately in the Patient Identity Management and
    Archiving section.)


### Billing Engine – Candidate Architecture

**Generic Process Flow Overview**

Before getting into the detail, the flow below illustrates where billing sits in the wider flow of a booking
procedure — initiated from either a hospital update or from a surgeons’ rooms, through to an anaesthetist
being paid. The diagram below is intentionally simplified; each stage is expanded on in the sections that
follow.

In understanding how things in this candidate design relate, it is probably more useful to think of the
Billing Engine as the centre of the universe, and Xero as a Billing “add-on” – an inverse model to the one
we normally think about. A separate instance of Xero will be established and its function is to provide an
A/c Receivables and Banking Service to the billing engine. This instance of Xero will not be used for the
general accounting work. One practical outcome of this is that invoices will be “printed” and emailed
from the billing engine, rather than from Xero. This makes it easier to support the “agency” nature of the
relationship between AA and the Anaesthetists. “Agent” has a very specific legal interpretation under GST
legislation.

The major system components map onto the sections of this document as follows:


- Mobile / web app — where the anaesthetist captures procedure and BTM time data on the Card; referenced
    throughout The Big Picture section and in the _Billing Line_ model described in the Candidate Data Structure
    section.
- Scheduling engine — the central scheduling data store (Cards, Procedures, Lists); out of scope for this
    section, covered in the Candidate Data Structure section.
- Admin App – where the oOice team check details before invoice generation
- Billing engine — the subject of this section.
- Xero — receives finalised invoice values (as ACCREC txns) and manages accounts receivable, invoicing,
    and collections; referenced under Payments — Where the Money Lands and Xero Integration Design,
    below.

**The Card as the Billing Anchor**

The Card is the entity from which all billing activity stems. A Card sits within the Schedule → Day →
Anaesthetist → List hierarchy defined in the Candidate Data Structure section and may contain one or
more Procedures and related Billable Party information. Each Procedure may in turn carry one or more
Billing Lines — the RVG, fixed-fee, or individually-arranged charges described below.

**Design principle: reference, don't absorb**

Consistent with the design principle that master/reference data (Hospital, Surgeon, Anaesthetist, Patient)
is decoupled from the schedule tree, the Billing Engine references the Card by CardID (and each
Procedure by ProcedureID) rather than owning or duplicating Card data. The Card remains a Schedule
system entity; the Billing Engine's own billing records point to it.

**One Card, potentially multiple invoices**

Billing destination (Hospital, Insurer, or Patient/Billable Party) is resolved per Procedure, not per Card.
Invoice generation is therefore a grouping operation over the Procedures within a Card, by resolved
counterparty:

- Where all Procedures on a Card resolve to the same counterparty (the common case), they are billed
    together on a single invoice.
- Where Procedures on a Card resolve to diOerent counterparties (uncommon, but must be supported), the
    Card generates multiple invoices — one per distinct counterparty. The most common example of this is
    where a patient has requested an additional (elective, non-insured) procedure — see Split Billing, above.

This means the relationship between Card and Invoice is properly one-to-many, even though it is 1:1 in
most cases. The data model and invoice-generation logic must not assume a single invoice per Card.

**Card Immutability and the List Approval Process**

Cards become immutable once locked — this removes any need to reconcile late clinical corrections
against already-calculated billing data, and gives the Billing Engine a stable, non-drifting reference to
work from. The trigger for that lock is a business process at List level, described below.

**Business process**

1. The anaesthetist completes all Cards within a List, then flags the List as SUBMITTED (the button label may
    read ‘Completed’). This sends the List to the oOice for checking. A List cannot be marked SUBMITTED
    unless all its Cards are correctly completed.


2. The oOice performs a sanity check on the List — typically Contract, Insurer, and reference completeness —
    across all Cards within it.
3. This check is managed as a review of the set of Cards within the List (an oOice/admin function, not a
    system gate).
4. When the oOice marks the List AUTHORISED, it is passed to the Billing Engine for processing.

**Resulting state model**

The List, not the Card, is the unit that carries approval state and triggers the handoh to the Billing Engine:

```
List state Trigger Card behaviour
```
###### DRAFT

```
Anaesthetist actively
entering/editing Cards
```
```
Fully editable by the anaesthetist. Can
be updated by office and integrations.
```
###### SUBMITTED

```
Anaesthetist flags the List as
SUBMITTED (Button Label =
“Completed”)
```
```
Editable only by office (OfficeAdmin
role).
```
```
AUTHORISED Office signs off after sanity check Locked —^ immutable; passed to Billing
Engine as a unit.
```
_Note: To align easily with Xero, we have used Xero statuses wherever possible. The one notable exception is the SUBMITTED
item, above. This is to preserve continuity for users._

**The Big Picture: What Are We Actually Calculating?**

An anaesthetist doesn't charge a flat fee for a procedure the way, say, a plumber quotes a job. Instead,
every anaesthetic generates a fee built from three separate ingredients, each calculated diherently, then
added together. This three-part structure — base, time and modifiers — is often shorthand-referred to as
“BTM.”

```
Key concept: Relative Value Units (RVUs), not dollars
The RVG does not produce a dollar figure. It produces a number of Relative Value Units (RVUs) — a
unit of “value” or “work,” independent of price.
Each individual anaesthetist sets their own dollar value per unit (this is a regulatory requirement under
the Commerce Act — anaesthetists can't collectively agree on pricing). The system therefore needs to
store a unit-value setting per anaesthetist, not a single global price list.
Fee = (Base units + Time units + Modifier units) × anaesthetist's $ unit value
```
**The three components**

```
Component What it represents How it's determined
```
```
Base units
```
```
The procedure itself — a fixed
value reflecting the
complexity/risk of the surgical
site and procedure type.
```
```
Looked up from an NZSA RVG code table,
organised by anatomical site (head, spine,
abdomen, vascular, etc). Values range roughly
from 4 units (minor/superficial) to 20–22 units
```

```
Component What it represents How it's determined
```
```
(major vascular, neurosurgery). Only one base
code is charged per anaesthetic.
```
```
Time units
```
```
The duration the anaesthetist had
exclusive clinical responsibility
for the patient.
```
```
Tiered rate: 1 unit per 15 minutes for the first
two hours, then 1 unit per 10 minutes from the
third hour onward. Time runs from when the
anaesthetist takes over care to handover at
recovery (PACU).
```
```
Modifying units
```
```
Adjustments for patient
complexity, urgency, or special
circumstances.
```
```
A set of separate codes added on top — e.g.
pre-assessment, extremes of age, ASA
physical status score, emergency status, BMI,
non-standard patient positioning, awake
intubation, and post-operative care events.
```
**Base units in detail — why this can't be a fixed lookup table**

The base unit table is large and irregular by nature — it reflects decades of clinical convention rather than
a clean engineering taxonomy. Two details matter for system design:

- Some codes are ranges, not fixed values — for example a code might specify “6–8 units” rather than a
    single number, with the exact figure left to the anaesthetist's professional judgement at the time of billing.
- A loading for patient position is sometimes already built into the base code (e.g. neurosurgery and spine
    codes already account for prone positioning) and sometimes added separately as a modifier — the
    modifier rules explicitly say “if not already accounted for”, meaning the system needs to know which base
    codes already absorb which modifiers to avoid double-charging.

The AA business rules reflect this directly: because there is such wide variability in actual procedures
performed, a fully pre-populated, rules-driven base-code selector is not considered practical. Instead,
the expectation is a curated dropdown of RVG codes that the anaesthetist selects from manually — the
system supports selection and recording, not automatic code derivation.

**Time units in detail**

Time is tiered, not linear — this is a common source of calculation errors if not modelled correctly:

```
Tier Rate Applies to
```
```
T1 1 unit per 15 minutes First 2 hours of anaesthetic time
```
```
T2 1 unit per 10 minutes From the start of the third hour onward
```
Several billable events outside the main procedure also carry their own separate time-based charges —
for example pain consultations, medical transport, and HDU or ward review visits that may occur days
after the original procedure. This means a single patient episode can generate more than one billable
“line item” over time, not just one invoice per Card.


**Modifying units in detail**

Modifiers layer additional units on top of base + time, depending on the clinical circumstances. They are
not interchangeable — some are simple flags (a flat addition), others depend on a score or category.

**ASA score entry and the Modifiers field**

On the mobile app, ASA is captured in its own field, separate from the modifier total (the M column, for
Base/Time/Modifiers). Rather than being treated as a modifier code directly, the ASA score seeds the M
field with its corresponding unit value, which the anaesthetist can then adjust to add in any other
applicable modifiers. As with all fields on the Card, the seeded value is overridable.

```
Modifier group Example range Nature
```
```
Pre-assessment (PA1–
PA5) 1 – 4 units^
```
```
Phone or face-to-face assessment prior to the
procedure
```
```
Age extremes (A1–A2) 1 – 2 units Very young or very old patients
```
```
ASA physical status (AS1–
AS4)
```
```
0 – 4 units Standard anaesthetic risk classification score
```
```
Emergency (ASE) +2 units Flat addition for emergency/unplanned procedures
```
```
BMI (OB1–OB4) 0 – 3 units Patient body mass index banding
```
```
Non-standard positioning
(P1)
```
```
+2 units Conditional —^ only if not already included in the base
code
```
```
Awake intubation (AI1) +2 units Specific technique flag
```
```
Post-operative care Varies
```
```
PACU, HDU, ICU, ward reviews, nerve catheters —
separately itemised, sometimes days later
```
**ACC billing**

ACC (Accident Compensation Corporation) patients are never billed directly — ACC is always billed
through a hospital or another contract holder. Confirmed information from AA clarifies that ACC
arrangements are themselves standard BTT (base/time/modifier) structures, identical in shape to any
other RVG-calculated billing line. ACC does not require a distinct billing path or calculation model; it is
simply who the contract holder is ultimately claiming from, which is invisible to the billing engine.

One narrower exception is worth confirming with AA billing: ACC pre-operative assessment has
previously been described as using its own flat-fee code set (CS250, CS260, CS70), separate from the
general BTM structure. This appears to be a special case limited to pre-assessment specifically, rather
than a description of ACC billing generally — worth a brief confirmation, but it does not change the
model. ACC pre-operative consults are usually billed separately (TBC).

ACC Contracts are set up with the Hospital or Contract Holder to cover the billing rules for ACC-related
procedures. The billing rules in these ACC Contracts are independent of the Hospital but define the billing
rules for the calculation of these invoices.


**How Anaesthesia Associates Calculates Invoices**

The RVG above is the industry reference — but AA's own rules describe three distinct ways an invoice can
be produced in practice. The system needs to support all three as parallel billing methods, not just the
RVG path.

**Method 1 — NZSA Relative Value Guide (RVG)**

This is the standard path described above: base units + time units + modifying units, with the anaesthetist
selecting the closest applicable RVG code from a dropdown. As noted above, full pre-population isn't
practical given procedural variability, so the system's role here is structured data capture and calculation,
not automated code suggestion.

**Method 2 — Pre-determined or agreed fees**

Some work is billed at a fixed fee, agreed in advance, completely independent of the RVU calculation.
Examples include:

- Contract pricing — negotiated rates with a hospital, insurer, or other contract holder.
- Procedure-specific agreements — for example, an agreed fixed-fee list negotiated directly with a particular
    plastic surgeon for their standard procedure set.

For the system, this implies a need for an “agreed fee” or “contract price list” entity that can override or
bypass the RVU calculation entirely for matching Cards, keyed by some combination of contract holder,
surgeon, and/or procedure type. 2 nd procedure pricing usually requires additional rules.

For future proofing, and design flexibility, the hierarchy of selection for the required billing calculation
algorithm, should allow for both individual contracts and organisational contracts. Currently all contracts
are at the organisational level.

**Method 3 — Individual billing approaches**

Individual anaesthetists may use an alternative billing method entirely — for example, a simple hourly
rate — rather than the RVG formula. This is permitted, but only where the arrangement has been agreed
with the relevant contract holder.

```
Resolved design: no separate billing-method concept needed
This is gated by the Contract held for the relevant counterparty (see the Candidate Data Structure
section) — a Billable Party, Hospital, or Insurer must hold a Contract* that explicitly permits an
individually-arranged structure such as an hourly rate before one can be used.
Once permitted, the resulting charge is captured the same way as any other non-RVG charge: as a
BillingLine with chargeBasis = rate×time, attached to the relevant Procedure. It is not a structurally
distinct billing method — it reuses the same BillingLine shape already defined for ancillary, non-BTM
charges (see ACC billing, above, and the Candidate Data Structure section).
Because it is the same BillingLine shape, it flows into the mobile app through the same capture path
as any other BillingLine entry, rather than requiring its own UI or workflow.
```
_* Contract, in this sense, always refers to a construct in the Billing system that defines a set of billing rules for a particular
circumstance; this is not a legal contract._


**Who Receives the Invoice?**

Unlike a simple patient-pays model, AA's invoices are addressed to one of two fundamentally diherent
categories of recipient, and the category determines the entire downstream workflow: contract holders,
or patients directly. As a note: these two billing types have slightly dihering invoice layouts.

In this documentation, this invoice recipient is always referred to as the Billable Party.

**Contract holders**

These are organisations with a standing funding or contractual arrangement covering some or all of the
anaesthetist's fee.

a. Hospital-based contracts

- Southern Cross AOiliated Provider (SXAP)
- Health NZ (Te Whatu Ora)

These are typically administered through specific hospitals, including:

- St George's Hospital (STG)
- Southern Cross Hospital (SX)
- Forte Health
- Christchurch Eye Surgery (CES)

b. ACC-related contracts

- Usually managed through hospitals, billed as a standard BTM structure via that Hospital's Contract — see
    ACC billing, above.
- Some are held externally instead — for example by orthopaedic groups such as Canterbury Orthopaedic
    Surgeons (COS).

c. Other specialised contracts

- Private bariatric contracts — held by the surgeon, not the hospital.
- TMJ (jaw joint) replacement contracts — held by maxillofacial surgeons.

d. Insurance Direct

- One insurer accepts claims directly. Billing is managed as for a hospital, but the account presentation
    workflow is currently via an upload portal.

**Patients**

Where there is no contract holder, the patient is billed directly. Patients fall into one of three categories,
each with a diherent payment workflow:

```
Category Description
```
```
Self-funded (post-procedure) Patient is invoiced and pays after the procedure has taken place.
```
```
Self-funded (full or split pre-
payment required)
```
```
Payment must be collected before the procedure proceeds. Any
balance is then collected as normal, after the procedure.
```
```
Insured
```
```
Patient holds private health insurance and forwards the invoice to
their insurer for reimbursement (the insurer is not invoiced directly
by AA in this flow).
```

This distinction matters for the system because the contract-holder vs. patient split determines the
invoice recipient and the expected payment timeline.

**Split Billing**

Split billing is a specific scenario the system must detect and handle correctly, since it changes how units
can be claimed.

It occurs in two situations:

1. A patient undergoes multiple procedures in the same episode of care.
2. A single procedure is only partially covered by a contract or funding arrangement (i.e. part of the fee falls to
    a contract holder and part to the patient, or two diOerent funders each cover a portion).

In either case, two separate invoices must be generated rather than one combined invoice.

```
Critical business rule — do not double-charge base or modifier units
When a second (additional) procedure is billed as part of split billing:
```
- Only additional time units may be claimed for that second procedure.
- Base units and modifying units cannot be claimed again — they were already charged against the
primary procedure.
This is a hard constraint the billing engine must enforce structurally, not just as a UI hint — for
example, by preventing a base-unit field from being editable on any procedure flagged as “additional”
within a split-billing episode.

**Payments — Where the Money Lands**

Under the new system, all payments will be processed by AA. Regardless of Billable Party, all funds are
received into the AA account, and AA is responsible for reconciling and disbursing to anaesthetists.

```
Change from the previous arrangement
Previously, certain hospital contract holders (St George's, Forte Health, Christchurch Eye) paid
anaesthetists directly into their personal bank accounts, with a remittance advice emailed to AA for
manual reconciliation. That direct-payment pathway is retired under the new system — the billing
engine does not need to model two separate payment destinations going forward, only the single AA
account flow.
```
This simplifies payment-destination logic considerably (one path, not two), but it shifts new responsibility
onto the system: AA is now always the intermediary, so the system needs to track and manage
anaesthetist disbursement (AA → anaesthetist) as its own first-class process, rather than something that
happened invisibly outside AA's books for some contract holders.

The system treats “invoice paid (into AA account)” and “disbursed to anaesthetist” as two distinct,
separately trackable states for every payment. This maps directly onto the ACCREC/ACCPAY pairing
described under Xero Integration Design, below: the ACCREC represents money landing in the AA
account, and the ACCPAY payables run represents the subsequent disbursement to the anaesthetist.


The system operates in the same way as a Trust account would.

**Summary: What This Means for the Billing Engine**

Pulling the above together, here is the set of core entities and rules a technical reader should take away
from this section:

**Core data the system will capture per Card**

- Billing method: RVG-calculated / pre-agreed fixed fee / pre-agreed rate / individually arranged.
- If RVG: selected base code (with override for range-based codes), anaesthetic start/handover time, and
    applicable modifier codes.
- Invoice recipient type: contract holder (which Hospital and which Contract), or Insurer Direct (NIB), or
    Patient Direct.
- Split-billing flag, with structural prevention of duplicate base/modifier claims on additional procedures.
- Note that for split billing, only the T element of BTM is used for the secondary procedure(s) billing.
- Other data items determined during detailed design.

**Key business logic the engine must enforce**

1. RVU calculation: tiered time-unit logic (T1/T2 breakpoint at 2 hours), with base units capped at one per
    anaesthetic.
2. Conditional modifiers: positioning loading must check whether the selected base code already includes it
    before adding the P1 modifier.
3. ACC: billed referencing the Hospital (or other contract holder)'s Contract — not a distinct calculation path.
4. Split billing: second/subsequent procedures in an episode can only add time units, never base or modifier
    units.
5. Fixed-fee and individually-arranged methods: captured as a BillingLine with the appropriate chargeBasis
    (governed by Contract), rather than a separate billing-method flag — see Method 3, above.
6. Additional services/fees, added to the procedure record and billed accordingly.

**Card Copy**

On rare occasions the anaesthetist may want to copy a Card as a way of adding an additional procedure

- this copy would be of the skeleton information on the selected Card, less any specific procedure
details.

**Ad-Hoc Card creation**

In circumstances where there are diherences between the hospital’s list and the mobile device (for
whatever reason, and there are many), the anaesthetist needs to be able to enter a new Card from
scratch.

An “add” functionality will be required to support this operation, and the data would need to flow from the
Mobile back to the scheduling engine. One mechanism requested is for the anaesthetist to capture the
data with a photo of the hospital’s or surgeon’s Card details and have these processed by the system.


```
Proposed Design decisions
```
- No system gate is required on pre-op review (staff reviewing “tomorrow” on the Admin Web App
calendar is an operational practice, not a tracked state transition).
- Cards are never sent back to the anaesthetist. There is no “Returned” state. Any issue found by the
office is resolved by phone, always initiated by office staff — not by the anaesthetist re-editing a
completed Card.
- Once a List reaches SUBMITTED, the anaesthetist has no edit access to its Cards at all — this is an
access-control rule in the mobile app, not just a data-integrity lock. Corrections from that point are an
admin/office function.
- The mobile app itself performs validation to ensure minimum data required for billing is present
before a Card can be marked complete, reducing (but not eliminating) the office's sanity-check
burden.
- References to “mobile app” throughout this section apply equally to the anaesthetists' web app
view.

**Billing Engine Integration Point**

The Billing Engine's integration surface with the scheduling system is deliberately narrow: it acts on a
single event — a List reaching AUTHORISED — and receives the whole List as a unit. It does not need to
observe individual Card-level events.

On receipt of an AUTHORISED List, the Billing Engine:

1. Iterates the Cards within the List, and their Procedures.
2. Resolves the billing counterparty for each Procedure (Hospital / Insurer / Patient-Billable Party), per the
    Billing Route Resolution logic defined in the Candidate Data Structure section.
3. Groups Procedures by resolved counterparty, per Card, to determine invoice boundaries (see The Card as
    the Billing Anchor, above).
4. Generates and despatches/queues the invoices for despatch to the Billable party.
5. Generates the matching ACCREC/ACCPAY pair(s) in Xero (see Xero Integration Design, below).
6. Reports status back for oOice monitoring (see OOice-facing monitoring, below).

**The Agency Perspective**

While the invoice is addressed to the ”patient”, the internal accounting revolves around the Anaesthetist.
The agency (AA) is concerned with the billing in terms of each anaesthetist’s “ledger” position: what is
owing and what is owed.


### Xero Integration – Candidate Design

**Invoice creation pattern**

On processing of a Card (as part of an AUTHORISED List), the Billing Engine creates a matching pair of
Xero invoices for each resolved counterparty, consistent with the two-state payment model — collection
into the AA account, then disbursement — described under Payments, above:

- An ACCREC, raised to the paying party (Hospital, Insurer, or Patient/Billable Party) — the collection invoice;
    payment lands in the AA account.
- An ACCPAY, owed to the surgeon/anaesthetist — the undiscounted payable, created in DRAFT status and
    not yet part of any payables run. This is eOectively a form of a Buyer Generated Tax Invoice.

Both records are created at the same time, from the same Billing Engine transaction, and are linked via
the Billing Engine's own case record using the returned Xero GUIDs (not natively linked within Xero itself).

**Reference fields — local-to-Xero matching key**

Two distinct reference needs were identified, and are kept deliberately separate:

```
Xero field Populated with Used for
```
```
InvoiceNumber Billing Engine-generated, unique
invoice number
```
```
The matching key for the automated
remittance/reconciliation module — this
is the field hospitals’ and insurers’ quote
back on remittance advices, and the one
an automated parser should key its
lookups on. Uniqueness should be
enforced via the Xero organisation setting
that prevents duplicate invoice numbers.
```
```
Reference Internal CaseReference (links
back to Card/Procedure)
```
```
Internal tracing and staff-facing display
only. Not relied upon for automated
matching, as Xero does not enforce
uniqueness on this field.
```
This distinction matters because the remittance module handles bulk hospital payments covering
multiple invoices/surgeons — it needs a reliable, uniquely-matchable field to allocate a lump payment
across the correct individual invoices. InvoiceNumber is that field; Reference is not.

**Payment detection and ACCPAY approval**

When the ACCREC (collection invoice) is confirmed paid, the corresponding ACCPAY is set to
AUTHORISED so that it is included in the next payables run:

Detection mechanism:

- Primary: Xero webhook subscription on INVOICE events. On receipt, the Billing Engine fetches the invoice,
    checks Status/Payments for payment, looks up the matching case by Xero GUID, and sets the linked
    ACCPAY to AUTHORISED.
- Partial payments by the Billable Party are passed through for payment to the anaesthetist proportionally.
    Any Accounts Outstanding reports show the remaining balance due. The Accounts Payable record is
    adjusted in a similar fashion.


- Safety net: a scheduled reconciliation poll (daily), since webhook delivery is not guaranteed. This catches
    any missed or failed webhook event, and aligns with the “reappears next day” behaviour described under
    List visibility rules, below.
- Idempotency: both paths write through the same handler, keyed by InvoiceID, so a duplicate webhook or a
    poll re-detecting an already-processed payment is a no-op.

**Bulk remittance and bank reconciliation — out of scope here**

The handling of bulk hospital payments covering multiple invoices is local to Xero's own bank
reconciliation process and the Remittance add-on, and is not a Billing Engine design concern for this
section. Any items the Remittance add-on cannot automatically match are simply left as unmatched
items in Xero's bank reconciliation, for manual handling there. The Billing Engine's only obligation is to
have populated InvoiceNumber (see Reference fields, above) reliably enough to support that downstream
matching.

AA would prefer that there was a number similarity between the ACCREC and the ACCPAY records, for
simplicity of human review and matching.

**Mobile App Consumption Model**

**Billing Engine as system of record for the app**

The mobile app never queries Xero directly for balance information. Xero is concerned with the Billable
Parties and what they have and have not paid. The billing engine translates this into views by anaesthetist.
Instead, the Billing Engine's own database is the sole source the mobile app reads from, kept in sync with
Xero via the webhook/poll mechanism described under Payment detection and ACCPAY approval, above,
plus its own writes at the point of invoice creation.

The two known reporting requirements for anaesthetists are:

1. An on-demand list of account balances outstanding. For a given query, a typical result set might contain
    around 100 records.
2. A periodic activity summary — aligned to each anaesthetist's individually-set GST period (monthly, bi-
    monthly, or six-monthly) — to assist in the preparation of their GST returns: a date-ranged list showing
    amounts received and the GST component.

**Outstanding balance view — flat list, no rollup**

Anaesthetists view their outstanding balance as a flat list of individual ACCPAY invoices, with no Card-
level or other aggregation/rollup. If a surgeon has a query about a specific line, they contact ohice stah for
detail — the app is not designed to answer accounting-level questions. This significantly simplifies both
the mirror data structure (no rollup logic to maintain) and the UI (a list, not a summary-with-drill-down).

**List visibility rules**

The mobile app's List view and outstanding-balance view are two distinct surfaces, populated from
diherent underlying states, with a defined handover between them:

```
List state (anaesthetist's view) Mobile app behaviour
```
```
DRAFT — in progress Visible and editable.^
```

```
SUBMITTED — awaiting/undergoing
office check
```
```
No longer editable by the anaesthetist (admin function only).
Remains visible with a visual indicator (“completed, unbilled”).
```
```
AUTHORISED — sent for billing
```
```
Disappears from the anaesthetist’s List view. The internal “Sent
for Billing” status detail is not surfaced to the anaesthetist —
the List simply drops off, and the invoices would reappear the
next day as line item(s) in the outstanding-balance view once
the Billing Engine has generated the invoice(s). This supports
the metaphor of the List as an anaesthetist's “to-do” list: items
drop out of view once they are completed.
```
The precise trigger for a List disappearing from view should be invoice generation (i.e. submission to
Xero), not the List reaching AUTHORISED and not payment — this needs to be an unambiguous system
event the mobile app can key oh and is called out here as a build detail to confirm rather than leave
implicit.

**OZice-facing monitoring (distinct from the anaesthetist view)**

Unlike anaesthetists, ohice stah need to monitor the List → Billing Engine → Xero flow for completion and
errors — this is a genuine requirement, not a by-product of the other two designs, and needs its own
scoped surface. Open questions to resolve during detailed design:

- Does a Card-level failure within a List (e.g. a Contract lookup that failed despite passing the oOice's own
    sanity check) block the whole List's processing, or only that Card?
- Is this monitoring surface part of the existing Admin Web App (alongside the calendar/List review function),
    or a separate Billing Engine administration screen?

**Open Items Carried Forward**

Consolidated across this section, for confirmation with AA / resolution during detailed design:

- The dropdown of RVG codes and values is curated centrally (by AA) but is not encyclopaedic, and may be
    overridden by the anaesthetist for a given procedure — confirm this is the intended default.
- Card-level vs List-level processing failure handling (see OOice-facing monitoring, above).
- Where oOice monitoring of the billing flow should live — Admin Web App vs a dedicated Billing Engine
    admin surface (see OOice-facing monitoring, above).
- Confirming the precise system event that removes a List from the anaesthetist's mobile view (invoice
    generation vs. a later point) (see List visibility rules, above).
- Whether the Xero organisation setting preventing duplicate invoice numbers should be a mandated
    configuration item for the AA Xero organisation (see Reference fields, above).


### Health Systems Integration

**Overview**

A core requirement for the Anaesthesia Associates system upgrade is the reliable, automated exchange
of appointment and patient data with hospital partner systems. Currently, this integration relies on a
mixture of manual processes and HL7 v2 messaging links. The HL7 integrations in place are unreliable
and frequently fail, creating administrative overhead, data quality risks, and delays in downstream
workflows.

The clinical workflow this integration should support is as follows:

**Manual Processing**

A manual integration pathway from surgeons’ rooms is required where integrations are not available.
Surgeons will email pdf documents of their lists, detailing the Cards. A PDF reader capability is required
to read, edit and ingest this data into the schedule. Currently, this is the main pathway for data.

**Automated Processing**

Once a List has been reserved for a specific surgeon at a specific hospital, any updates and additions to
the Card information are forwarded to Anaesthesia Associates (AA) via a hospital integration interface
(above) or manually from the surgeons’ rooms. This includes new patient bookings, reschedules,
modifications, and cancellations originating from both the surgeon’s and the hospital’s patient
administration system. The hospital becomes the conduit of these changes.

The system will receive, interpret, and act on those updates automatically. Achieving reliable integration,
particularly via the modern FHIR standard, would materially reduce workloads, minimise manual data
checking, and improve the quality and timeliness of information available to Anaesthetists.

The following sections describe the current integration landscape, the relevant message formats and
standards, the regulatory context in Aotearoa New Zealand, and the technical requirements for proposals
responding to this RFP.

**Current State: HL7 v2 Messaging**

Most hospital patient administration systems (PAS) in New Zealand currently communicate via HL7
version 2.x — a standard that has been in clinical use since the late 1980s. While widely deployed, HL7
v2 is notoriously fragile in practice. Its pipe-delimited, flat-text message format lacks the schema
enforcement of modern standards, and vendor-specific customisations (Z-segments, field reuse, non-
standard code sets) mean that messages from diherent hospital systems often require bespoke parsing
logic.

**Message Structure**

HL7 v2 messages use a fixed set of delimiter characters — | to separate fields, ^ to separate components,
& for subcomponents, and ~ for repeating fields. The result is compact but dihicult to read, debug, or
validate without dedicated tooling.

**Example: SIU^S14 Appointment Modification Message**


The following is a representative HL7 v2.3.1 SIU^S14 (Scheduling Information Unsolicited —
Appointment Modification) message as received from a hospital PAS system. This message type is used
to notify our system of changes to booked surgical appointments, including the procedure, timing, patient
details, and allocated anaesthetists.

```
MSH|^~\&|webPAS^HL7CISINV11.05.07^L|schlhosp|iPM|tns5qyhe|20260619153109||SIU^S14|593
40703|P|2.3.1|||||AUS||en^^ISO 639- 1
```
```
SCH||1661243^OAM|||||4827^TRANSFORAMINAL LUMBAR INTERBODY FUSION- TWO OR MORE
LEVELS|||MIN^Minute(TI)^ISO+||||||||||
```
```
PID|1||XXX5593^^^^MR^7777||PATIENT^NAME^XXXX^^MRS^^L||19520105|F|""||9
XXXXXXX^""^""^XXXXXX 7608^2800^NEW ZEALAND^C|2800|...
```
```
AIS|1|U||20260629133000|0||240|MIN^Minute(TI)^ISO+||BOOKED
```
```
AIP|1|U|12952^SURGEON^NAME|NS^Neuro
Surgery^SPECT|PROC|20260629133000|||240|MIN^Minute(TI)^ISO+||BOOKED
```
```
AIP|2|U|49641^ANAES^NAME|A^Anaesthetics^SPECT|ANAES|20260629133000|||240|MIN^Minute(
TI)^ISO+||BOOKED
```
The key segments in this message are:

- MSH — Message header: source system (webPAS), destination (iPM), message type (SIU^S14),
    version (2.3.1), country (AUS).
- SCH — Scheduling activity: appointment ID (1661243), procedure code and description
    (Transforaminal Lumbar Interbody Fusion, two or more levels).
- PID — Patient identification: MRN (XXX5593), demographics, NHI-related identifiers, ethnicity (NZ
    European / NZHIS), address.
- AIS — Appointment slot: start time (2026- 06 - 29 13:30), duration (240 minutes), status
    (BOOKED).
- AIP — Appointment personnel: surgeon (ID 12952, Neuro Surgery) and anaesthetist (ID 49641),
    both BOOKED.

Field-level definitions for these segments can be found in the HL7 v2.3.1 specification, freely browsable
at:

https://hl7-definition.caristix.com/v2/HL7v2.3.1

A rendered HTML version of the v2.3.1 standard is also available at:

[http://www.hl7.eu/HL7v2x/v231/index231.htm](http://www.hl7.eu/HL7v2x/v231/index231.htm)


### Health New Zealand Policy Context: FHIR First

Health New Zealand | Te Whatu Ora, through its Health Information Standards Organisation (HISO), has
established a formal FHIR-first policy that mandates the use of the HL7 FHIR (Fast Healthcare
Interoperability Resources) standard in all new health data exchange solutions. The policy applies to all
new builds and may also be enforced to modernise existing solutions. Implementers across the sector
are required to use FHIR as the principal standard in the design of APIs and messaging services.

FHIR is identified as a key standard for interoperability alongside SNOMED CT and the International
Patient Summary (IPS). From August 2025, all new integrations to national services — including the
National Health Index (NHI) and Health Provider Index (HPI) — must use the FHIR API via the HNZ Digital
Services Hub and enterprise Keycloak OAuth authentication.

The New Zealand FHIR Registry, co-governed by Te Whatu Ora and HL7 New Zealand, is the authoritative
source of NZ FHIR profiles, implementation guides, and terminology artefacts:

https://simplifier.net/organization/nz-fhir-registry

The NZ Base FHIR Implementation Guide (currently v3.0.1, with v4 in development) defines the common
extensions, profiles, identifiers, and terminologies that all NZ FHIR implementations must use as a
foundation:

https://fhir.org.nz/ig/base/index.html

**The FHIR Standard**

**What is FHIR?**

FHIR (Fast Healthcare Interoperability Resources, pronounced 'fire') is HL7's current-generation
interoperability standard. Unlike HL7 v2, FHIR is built on modern web architecture: resources are
represented as JSON (or XML) documents and exchanged over RESTful HTTP APIs. Each clinical concept
— Patient, Appointment, Anaesthetist, Observation — is defined as a discrete, schema-validated
Resource with a stable URL-based identity.

FHIR R4 (Release 4) is the version mandated by Health NZ and is the basis of all current NZ
implementation guides. FHIR R5 has been published but NZ has not yet migrated to it.

**FHIR Schemas and Reference Documentation**

The authoritative FHIR R4 specification, including all resource definitions, data types, search parameters,
and operation definitions, is published at:

https://hl7.org/fhir/R4/

Key resources relevant to this integration:

- Appointment — https://hl7.org/fhir/R4/appointment.html
- Patient — https://hl7.org/fhir/R4/patient.html
- Anaesthetist — https://hl7.org/fhir/R4/practioner.html
- Bundle (transaction) — https://hl7.org/fhir/R4/bundle.html


NZ-specific profiles extending these base resources — including NHI-linked Patient identifiers and NZ
ethnicity extensions — are defined in:

NZ Base Implementation Guide v3.0.1

**Standards Comparison**

```
Standard Format Readability NZ Adoption Status
```
```
HL7 v2.x Pipe-delimited Poor Widespread
(legacy)
```
```
Incumbent
```
```
HL7 v3 XML Moderate Minimal Deprecated
```
```
CDA XML Moderate Niche Stable
```
```
FHIR R4 JSON / REST Good Mandated (new) Strategic
```

### Integration Requirements

Respondents to this RFP are required to address the following integration capabilities:

**HL7 v2 Inbound Processing**

The solution must be capable of receiving and parsing HL7 v2.3.1 SIU messages (S12 New, S13
Reschedule, S14 Modification, S15 Cancellation) from hospital PAS systems. Given the variability of v2
implementations across hospital systems, the solution should support configurable field mapping per
hospital partner.

**FHIR R4 Translation**

Where hospital systems support FHIR R4, the solution must be capable of consuming FHIR
Appointment, Patient, and Anaesthetist resources directly via RESTful API. For hospitals still using HL7
v2, the solution should include a translation layer that converts inbound v2 messages to FHIR-equivalent
internal representations, enabling consistent downstream processing regardless of the source protocol.

**FHIR-Native Architecture and Message Pre-Processing**

Ideally, the integration engine should operate natively using FHIR R4, with a pre-processing layer
responsible for translating inbound HL7 v2 messages into FHIR format before passing them to the core
system. The intent is for the system to be FHIR-native over the long term, with the HL7 v2 pre-processor
serving as a transitional bridge as hospital systems progressively adopt FHIR.

Currently, HL7 v2 messages from hospital systems are forwarded to an SFTP drive and processed in
batches. This introduces latency and limits the system’s ability to respond to changes in a timely manner.
Real-time or near-real-time message processing — where each message is acted upon as it is received —
should be the target design. This is particularly important given the user requirement to support late
bookings for a List right up to the commencement of the operating session.

**NZ Identity Standards**

All patient records must be linked to the National Health Index (NHI) number where available. Patient
identity lookups must use the NHI FHIR API via the Health NZ Digital Services Hub. Ethnicity coding must
use the NZHIS Level 4 code set. Anaesthetist identity should reference the Health Provider Index (HPI)
where possible.

**Reliability and Monitoring**

Given that current HL7 v2 integrations are unreliable and frequently fail, respondents must describe their
approach to message delivery guarantees, error handling, alerting, and retry logic. The solution must
provide operational visibility into integration failures and support manual intervention workflows where
automated processing cannot proceed.


**Reference Links**

The following references are provided for respondent due diligence:

- HL7 v2.3.1 Field Definitions (Caristix): https://hl7-definition.caristix.com/v2/HL7v2.3.1
- FHIR R4 Specification: https://hl7.org/fhir/R4/
- NZ Base FHIR Implementation Guide: https://fhir.org.nz/ig/base/index.html
- NZ FHIR Registry (Simplifier): https://simplifier.net/organization/nz-fhir-registry
- Health NZ Interoperability Standards (HISO FHIR-first policy): Te Whatu Ora – Interoperability
    Standards
- Health NZ API Standards: https://apistandards.digital.health.nz/
- NHI FHIR Implementation Guide: https://nhi-ig.hip.digital.health.nz/


## Appendix 1

### Changes to the National Health Index (NHI)

Health New Zealand | Te Whatu Ora is introducing a new National Health Index (NHI) number format
because the existing combination range is approaching exhaustion. Respondents must confirm that their
systems and implementation roadmap account for this change as part of their proposal.

**Why the change is happening**

The NHI is the unique identifier assigned to every person who interacts with the New Zealand health
system. The current format — three letters, three numbers, and a single numeric check digit (e.g.
ZAA0067) — provides a finite pool of identifiers, and that pool is running out.

**What is changing**

```
Current format New format
```
```
Structure AAANNNC (3 letters, 3
numbers, 1 numeric check
digit)
```
```
AAANNAX (3 letters, 2
numbers, 1 letter, 1 alphabetic
check digit)
```
```
Example ZAA0067 ACA31FM
```
```
Check digit algorithm Modulus 24 Modulus 23
```
```
Issuance order Sequential Randomised (non-sequential)
```
The new format extends the available range by introducing a randomised seven-character sequence and
an alphabetic final character, creating over 33 million additional unique identifiers. Numbers will be
issued in random, rather than sequential, order — a deliberate change to improve security and privacy,
including reducing the risk of identifying multiple births from sequential NHI allocation.

**Impact on patients**

There is no impact on the public. Existing NHI numbers are unahected, and patients will continue to
access care exactly as they do today. The new format will only be issued to new NHI registrations — for
example, newborns and people interacting with the New Zealand health system for the first time.

**Impact on digital health systems**

All digital health software suppliers and healthcare providers are required to have their systems and
devices updated and tested to support both the current and new NHI formats by 1 July 2027. This
includes validating both check-digit algorithms (modulus 24 and modulus 23), correctly parsing and
storing the new alphanumeric structure, and ensuring no part of the system assumes a purely numeric or
sequential NHI.

**Our approach to compliance**


Respondents must describe their specific approach to NHI dual-format compliance — including field
validation logic, dual-format regression testing, engagement with Health NZ’s published technical
specifications, and completion of compliance testing ahead of the 1 July 2027 deadline. Respondents
must ensure all NHI-handling components of their solution — including patient registration, record
matching, interfaces to external systems, and reporting — are tested against both formats well in
advance of the deadline, minimising risk to continuity of care.

**Design policy: separating clinical and billing identifiers**

To avoid using the NHI outside its intended medical context, the proposed solution must not use the NHI
as the primary identifier within the client billing application. Instead, billing records should be keyed on
Xero’s native Contact ID, with the NHI attached only as a cross-reference field on the Xero contact record.

**In practice, this means:**

- A client’s record originates in the clinical system, where they are identified by their NHI as
    required for care delivery.
- When a billing record is created for that client in Xero, Xero assigns its own Contact ID — this
    becomes the primary identifier for all billing, invoicing, and financial reporting.
- The client’s NHI is stored alongside the Xero Contact ID as a custom field on the Xero contact,
    rather than being used as the record’s key.

This gives the best of both worlds: financial workflows in Xero operate entirely on Xero’s own identifier, so
the NHI never functions as a billing key or appears in financial reporting structures — but stah can still
look up a client in Xero directly by NHI when needed, since it is retained as a searchable reference on the
contact. This keeps clinical identity and financial identity cleanly separated while preserving a fast,
reliable lookup path between the two systems.

This separation reflects good privacy and data minimisation practice: it confines the NHI to systems with
a genuine clinical purpose, preventing it from propagating into finance, accounting, or other non-clinical
platforms where it serves no functional need and would otherwise increase the surface area for misuse or
accidental disclosure.

Source: Health New Zealand | Te Whatu Ora — Upcoming changes to the NHI


## Appendix 2

### Patient Identity Management and Archiving

Design note — Xero billing integration with bespoke Practice Management System (PMS)

**Overview**

The practice handles a high volume of predominantly single-use surgical clients (≈ 28,000 invoices per
year, ~99% one-time). Xero has a documented soft limit of approximately 10,000 contacts per
organisation before performance degrades, so a flat “one new contact per invoice, never archived”
approach is not viable. The architecture below keeps Xero performant indefinitely while preserving full
patient and billing history.

**Identity Layers**

Three separate identifiers are used, each scoped to a single system:

```
Identifier Lives In Purpose
```
```
NHI (National Health
Index)
```
```
PMS only — never sent to Xero True clinical identity. Used at intake
to validate and deduplicate
patients, and to check for
outstanding credit/balance issues
from prior episodes.
```
```
Hidden internal unique
ID
```
```
Generated and maintained by
PMS; linked internally to NHI
```
```
The only patient identifier exposed
to Xero — stored in Xero’s
ContactNumber field.
```
```
Xero ContactID Xero-generated; cached in PMS Xero’s own system key, returned on
contact creation. Cached against
the hidden ID for fast future
lookups.
```
This separation means NHI — subject to Health Information Privacy Code / HISO obligations — never
leaves the PMS, while Xero still receives reliable, deduplicated billing contacts.

**Workflow**

**Intake**

PMS validates the patient against NHI — confirms identity (deduplicates against prior episodes
regardless of name or address changes) and checks for outstanding credit issues.

**Contact Resolution**

PMS checks whether it already holds a ContactID for this patient’s hidden ID.

- If yes → use the cached ContactID directly (no Xero query needed).


- If no → query Xero (GET /Contacts?where=ContactNumber==“{hidden_id}”) to check whether a
    contact exists; if found, cache the ContactID; if not, create a new Xero contact with
    ContactNumber = {hidden_id} and cache the returned ContactID.

**Archived Contact Handling**

If the matched contact is archived, attempt to invoice directly against it via the API. To be confirmed in
sandbox testing whether this requires an unarchive step first.

**Outstanding Balance Check**

Before billing a new episode, call GET /Invoices?ContactIDs={id}&Statuses=AUTHORISED to surface any
unpaid or overdue invoices for stah attention at check-in. Decide whether to separately distinguish
“open” vs “genuinely overdue” in this filter.

**Invoicing**

Create and raise the invoice in Xero against the resolved ContactID.

**Archiving**

A scheduled job (e.g. nightly or weekly) archives Xero contacts once their invoices are fully paid and a
defined inactivity window has passed (e.g. 90 days with no further activity), using the API archive flag. This
is done via the cached ContactID — no search required.

**Outcome**

- One Xero contact per real patient, for life — true deduplication via NHI-driven matching, without
    name-matching fragility.
- Xero’s active contact count stays low and performant indefinitely, regardless of cumulative
    lifetime patient count.
- Archived contacts retain full transaction history in Xero (reports, past invoices) and can still be
    transacted against or restored individually if needed.
- NHI never resides in Xero, satisfying data minimisation expectations for health information.


## Appendix 3

### Anaesthetist Mobile App

**Typical Navigation Example**

Four screenshots showing the progression from schedule, to list details, to card details.


## Appendix 4

### Admin Schedule View (One Day Dashboard)

This screenshot shows the day view of the schedule. From this, users can navigate via a series of drill-downs, to detailed screens/forms.


## Appendix 5

### Anaesthetist Web App

**Main Page – Dashboard**

This is the Home page for anaesthetists, showing a summary of calendar, financial and locum availability data.


**Lists**

This page shows a simple view of upcoming lists, note the 2 lists per day repeating structure. Drill down is available.


**Availability**

This screen is typically used to find a replacement (locum) anaesthetist at short notice (e.g. cover for illness)


**Overdue**

A view of unpaid accounts

This screen shows a classic accounts outstanding view, ordered by date.