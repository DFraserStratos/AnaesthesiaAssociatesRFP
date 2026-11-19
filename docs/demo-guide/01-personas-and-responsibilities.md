# Personas and Responsibilities

## How to interpret the personas

The RFP specifies three user-facing applications:

- Anaesthetist Mobile App
- Anaesthetist Web App
- Admin Web App

Mobile and web are two contexts for the **same anaesthetist role**, not two different jobs. The
prototype demonstrates both with **Dr Melanie Souter**.

The Admin Web App covers several office responsibilities. The prototype demonstrates them with one
persona, **Kirsty W.** For explaining the business, it is clearer to describe Kirsty as wearing two
or three hats: scheduling coordinator, billing reviewer and operational exception handler.

## Primary persona 1: Dr Melanie Souter, mobile-first anaesthetist

### Context

Dr Souter works independently across multiple hospitals and surgeons. She is mobile during the day,
often moving between locations. Her phone is the fastest way to see what is happening, review patient
Bookings and capture the data AA needs for billing.

### Goals

- Know which AM and PM Lists are assigned to her.
- See the hospital, surgeon, patient Bookings and procedure times.
- Respond to late changes without phoning AA for every detail.
- Capture accurate Base, Time and Modifier data with minimal typing.
- Add a missing Booking when the hospital and device disagree, typing the procedure as written on the
  hospital's list.
- Complete work and hand the whole List to the AA office.
- See availability, and move one of her Lists to a free colleague or back to the office.
- Hand one Booking to a colleague who is free that session (it becomes a new List of theirs).
- Later, see outstanding amounts and her monthly GST report.
- See her own profile and set her rate per unit (the dollar value of one RVG unit).

### Core actions

1. Open the Lists tab, her main view from today (earlier Lists not yet authorised a scroll back),
   and choose an assigned List; or search by patient name or NHI, or pick a date, to find past work.
2. Review its time-ordered Bookings.
3. Open a Booking and confirm patient, procedure, hospital and surgeon context.
4. Record only what the Procedure's Contract price needs: on an RVG price, the RVG code (picked by
   typing), start and finish times and the modifiers step (claimed modifiers each with a short reason,
   or **None apply**); on a fixed or open price, no times or modifiers, the RVG code optional "for
   reference", and a typed amount where the price asks for one. Then notes and any allowed additional
   billing line. What only the office can fix goes to the office with **Alert the office**.
5. Review the calculated units and fee at her own rate per unit.
6. Mark each active Booking complete.
7. Submit the whole List to the office.
8. Use Availability to mark days off weeks ahead, including repeating days off, and to move one of
   her Lists to a free colleague or back to the office.
8a. From a Booking, **Move to a colleague**: hand one Booking to a colleague who is free that session,
   found by typing a name or from the free list. If someone else is doing a Booking, she moves it to
   them before she submits: whoever submits a List did every procedure on it.
8b. From a Booking or a List, **Alert the office** with a note when she is unsure about it; the
   office sees it in its notifications until someone there deals with it.
8c. See an **out-of-hours List** the office added for an emergency or late case: it shows on her day
   after her PM List, in an evening session the office opened. She captures and submits its Bookings as
   on any List, and marks that evening session available or not like AM and PM; she does not open one
   herself (she rings the office).
9. Create a missing Booking manually, with its procedure description as told or written (kept exactly
   as typed).
10. Record an additional procedure inside a Booking with **Add another procedure**. The first
    Procedure is the primary, listed first with a **Primary** pill; **Make primary** on another one
    (a bottom sheet on the phone, a dialog on web) changes it on her own List until it is authorised
    (on a completed Booking she amends it first). Base units and the modifiers sit on the primary;
    every Procedure bills its own time.
11. Name another payer on a Procedure (**Paid by → Change**, a bottom sheet: a parent, a guardian, a
    benefactor or a family trust; offered to the Booking's other Procedures with the same payer), and enter the insurer's approval number on the day when she learns
    it (**Insurer or funder**); she sees the number the Booking holds.
12. Split a Procedure's fee on her own Booking (**Split** in its Billing card's Paid by: each party's share in
    $ or %, one party taking the rest, each party invoiced separately), before she submits and until
    the office authorises the List.
13. Open her **Profile** (a Profile card on the More tab): rate per unit, phone, email, registration
    number, HPI CPN and bank account (masked, such as 99-0101-•••••21-00). **Change** beside Rate per
    unit opens a bottom sheet; the new rate applies to Bookings on Lists not yet authorised, while
    authorised Lists keep their locked rate. The other rows show a lock: the office holds them.
14. On her own invoiced Procedure (found through search), **Raise additional invoice** for a late
    charge such as a ward review; she can edit or remove it until the office reviews it.
15. When the work differed, raise an additional invoice or a credit note on her own procedure: **Credit
    note** beside **Raise additional invoice** credits the invoice in full (less work than expected, a
    wrong billable party, or paid twice), with a lower new invoice if one is due. The office reviews it,
    and her payment for that invoice is reversed.

### Permissions

- `ACTIVE`: may edit her Bookings and submit the List when every uncancelled Booking is complete.
- `SUBMITTED`: sees the List less prominent ("Done · unbilled") on her main view and may still change
  its Bookings until the office authorises it; her changes are audited and the last change stands.
- `AUTHORISED`: Bookings are locked for everyone.
- May only see her own Lists and patient Bookings.
- May see colleagues' session availability, but not their patient details.
- May set her own rate per unit. May not edit her contact details, HPI CPN, bank details or other
  master data.
- May not authorise a List or use office monitoring.

`DRAFT` means a Draft List with no anaesthetist yet; the office assigns it.

### Pain points the design should solve

- Patient and booking data changes up to procedure day.
- Hospital data and the actual theatre List may disagree.
- Capturing BTM correctly is complex and financially significant.
- Short-notice illness or cover needs a fast answer.
- Some users may not be comfortable with complex software.

### Prototype persona

- Name: Dr Melanie Souter
- Initials: MS
- Anaesthetist ID: 34821
- Primary surface: Anaesthetist Mobile App
- Secondary surface: Anaesthetist Web App

### RFP anchors

- `Project Overview - Mobile and Web Applications`
- `The Card as the Billing Anchor`
- `The Big Picture: What Are We Actually Calculating?`
- `Card Copy` (retired)
- `Ad-Hoc Card creation`
- `Mobile App Consumption Model`
- Appendices 3 and 5

## Primary persona 2: Dr Souter at a desktop, anaesthetist web user

This is a usage context, not a separate role.

### Context

Away from theatre, Dr Souter wants a wider view of upcoming work, availability and financial
information. The web app provides more space for tables and summaries while preserving the same
underlying List, Booking and BTM actions.

### Goals and actions

- Review the dashboard and coming week.
- Browse her Lists from today, with earlier ones not yet authorised at the top, and find past work by
  patient name, NHI or date.
- Drill into the same List and Booking detail available on mobile.
- Create a Booking, add another procedure, capture BTM data and split a Procedure's fee when a desktop
  is more convenient.
- Find Free colleagues and move one of her Lists to a free colleague or back to the office.
- Hand one Booking to a colleague who is free that session, from the Booking's screen.
- See her financial position on the dashboard, review accounts outstanding and payments, and read
  her monthly GST report (Accounts, GST report).
- Open her Profile from her name and avatar in the top nav (`/web/profile`) and change her rate per
  unit; contact details, HPI CPN and bank details are read-only there, as on the phone.

### Demo distinction

Use the web app for overview and planning. Use mobile for the procedure-day action. Avoid repeating
the same Booking-edit workflow twice unless the audience asks whether the two surfaces have equivalent
functionality.

### Current prototype caveats

- Balances, payment history and the GST report are live: the anaesthetist money views read the
  Billing Engine's own ledger, AA's system of record (her financial position of owed to you, collected
  and paid out to you on the web dashboard and web Accounts, "Collected" and "Paid out to you" on
  mobile Balances; the outstanding list, one row per unpaid payable, oldest first; received and
  paid-out invoices; and the monthly GST report of the payments AA passed to her, on a cash basis,
  with each one's GST), over seeded historical rows plus anything a demo payment adds. They never
  query Xero directly.
- Days off are kept in the availability calendar (My calendar on mobile, My availability on the web),
  which sets each session's status directly.

## Primary persona 3: Kirsty W., AA scheduling coordinator

### Context

Kirsty works in the AA office and needs a complete view across all anaesthetists. She coordinates
standing arrangements, ad-hoc bookings, hospital changes, surgeon-room calls, cancellations and
short-notice cover.

### Goals

- See the entire day across the anaesthetist roster.
- Find a free AM or PM session quickly when a surgeon's room calls (Find available on the Day view).
- Keep hospital, surgeon, times and Bookings accurate.
- Reconcile conflicts from anaesthetist availability and hospital holidays on the Conflicts screen.
- Move one patient Booking when a booking changes.
- Reassign a whole List when an anaesthetist is unavailable.
- Preserve Bookings and audit history through every change.

### Core actions

1. Use the one-day dashboard as the operational control tower.
2. Navigate dates and read the status-coloured AM/PM grid.
3. Open a List and review its Bookings.
4. Create a phone-advice booking on a suitable List, typing the procedure as it was told (kept exactly as typed, Told by Phone or Email).
5. Edit List context, including hospital, surgeon and actual start/end times.
6. Move a single Booking to a different List for a routine reschedule.
7. Find a Free replacement anaesthetist and reassign the entire List for illness cover.
8. Add internal day notes.
9. Maintain all master data (hospitals, surgeons with their practice names and contacts, recurring
   bookings, public holidays and hospital calendars, RVG groups and modifiers, specialties and funding
   tags, Parties (insurers and funders among them), Contracts and their price ranges), by hand after
   the one-off go-live load; and the anaesthetists, surgeon groups, the office's private pairing
   preferences and the anaesthetists' priority tiers.
9a. Keep each anaesthetist's profile on their record (Master data, Anaesthetists, open a row: the
   Profile card's **Edit details**): rate per unit, phone, email, registration number, HPI CPN, bank
   account and GST number. The HPI CPN and bank details are mandatory on every anaesthetist record: an
   add or edit without either is refused. Every change is audited, the bank number masked there too.
   Bank details are master data only; payments to anaesthetists are made in Xero.
10. Review the audit history when a change needs explanation.
11. Work the to-do list on the dashboard: open each warning's Booking and clear it once dealt with,
    chasing a missing approval number with the surgeon's rooms and checking a child payer's parent
    or guardian details.
12. Assign Draft Lists: Lists with no anaesthetist yet, picked from a grouped, tier-ordered list.
13. See the team's notifications of Lists anaesthetists have moved and their alerts to the office,
    tick each one resolved once dealt with (it leaves for the whole office; Show resolved brings it
    back), and assign the Draft Lists they return.
14. Record a sickness phoned in (Change status on the Day view): the List goes back to the office or on
    to a colleague there and then, never left on the unavailable session.
15. Open an **out-of-hours session** for an emergency or late case (Open out-of-hours session on an
    anaesthetist's Day row, any day from today, one a day, 18:00 to 21:00 by default) and put a List in
    it, a new one or a Draft List for that evening; close an empty one from its drawer.
16. Set the primary Procedure from the rooms' sheet (**Make primary** on the Admin Booking), and
    correct it at review; the office can do this on `ACTIVE` and `SUBMITTED` Lists.
17. **Import hospital file**, match each row on the matching screen (Admin, Intake, Matching), and set
    each new Booking's invoice destination and Contract.
18. Open the rooms' PDF lists (Admin, Intake, PDF lists) with the address each came from, correct a row
    beside the facsimile and **Send to matching**; the List made from it keeps its sender, so replies go
    back there.
19. Save each Booking's changes explicitly (**Save changes**, one change set named for her), and draft
    the update email on demand when a change matters: from the Booking, the List drawer after a cover
    change, or the notification of an anaesthetist's move, picking the changes and starting from the
    email templates the office maintains (Master data · Email templates). This is Vanessa's main need,
    the hospital hearing about a cover change without her typing it; the email opens in her own mail
    client and nothing is sent automatically (OQ-82).

### Permissions

- Sees all Lists and Bookings.
- May edit `ACTIVE` and `SUBMITTED` Lists/Bookings.
- May not edit Bookings after `AUTHORISED`.
- May perform office-only billing setup corrections.
- May reassign a List or a Booking.
- Holds each anaesthetist's profile, bank details and HPI CPN, and may change any anaesthetist's
  rate per unit.

### Pain points

- Phone, email and PDF remain major booking channels.
- Existing integrations are unreliable.
- Several sources may change the same Booking (each office save is one named change set; handling
  simultaneous edits from automated sources is Future Work, US-02.5.6).
- Manual checking creates bottlenecks and data-quality risk.
- Illness and late schedule changes must be resolved quickly.

### Important model correction

Kirsty does not create every "shift" from scratch. The system creates the fixed AM/PM List canvas.
Recurring bookings paint standing arrangements onto it. Kirsty manages assignments, bookings and
exceptions.

### RFP anchors

- `Schedule Management - Candidate Architecture`
- `Supporting / Master Data`
- `Key Design Principles`
- `Manual Processing`
- `Automated Processing`
- Appendix 4

## Primary persona 4: Kirsty W., billing review and authorisation officer

This may be the same staff member as the scheduling coordinator. It is separated here because it
creates a clear handoff in the demo.

### Context

An anaesthetist has submitted a completed List. Kirsty reviews all of its Bookings as a set before
allowing billing to proceed.

### Goals

- Set each Procedure's Contract at booking setup on the step rail (where the invoice goes, then the
  Contract), and confirm the Contract and who is billed make sense at review.
- Approve or correct each Contract the anaesthetist changed, and check any typed price against the
  computed one.
- Spot manually adjusted BTM values and other advisory flags, none of which blocks authorise; only a
  Procedure that still needs a price does, until she types one.
- Correct office-owned data without returning the List to the anaesthetist.
- Authorise a clean List and know that it is now immutable.
- Monitor later billing, integration and Xero exceptions.
- Check the ledger is in balance on the Ledger screen, and follow up any anaesthetist on its
  out-of-balance list (allocate or refund a receipt that matches no invoice).
- Keep invoices moving after the run sends them: resend one, or give a payer with no invoice address
  an email or postal address.

### Core actions

1. Open the Review queue of `SUBMITTED` Lists.
2. Review every active Booking and its calculated fee.
3. Inspect flags under each Procedure's stack (procedure text, Contract with who is invoiced, RVG
   code): a Contract change (**Approve** or **Correct**), a typed price (the **Price typed** flag, and
   **Computed $x** under the price in the Fee cell), a $0.00 price (a **No charge** pill), a
   Contract not offered on this List, anything needing a price or an invoice destination, a Booking
   not marked completed, and manual BTM overrides. Resolve the anaesthetist's alerts and check the
   **Changed** marker for edits since submit.
4. Correct billing setup in the office when required; authorising approves any Contract change still
   waiting.
5. Log a phone note if clarification was needed.
6. Authorise the List. A $0.00 Booking raises a $0.00 "No charge" invoice: no payable, no BCTI.
7. Confirm that the Bookings lock, each Procedure's Contract and price locked onto it ("Contract locked
   at authorise"), and the List hands to billing.
8. Later, monitor invoice failures and rows still waiting on Intake: a failed Booking is held back while the rest of
   the List bills, and she retries it from the Billing monitor without editing any Contract.
9. Split a Procedure's fee on a Booking when more than one party pays (**Split** in its Billing card's Paid by), before authorising.
   Change a Procedure's payer there too (a dialog on web) until the List is authorised; each payer gets one invoice.
10. After the run: the Billing Engine emails each invoice or marks it **To post**; the office does not
    email invoices itself. It uses **Resend** on the invoice rail, and on **No invoice address** types
    an address and selects **Send**.
11. Record an additional invoice for a late charge (**Create additional invoice** on the Procedure's
    Contract row), and review every event, the anaesthetists' included, on **Review → Events**; an
    approved event is invoiced in the next billing run.
12. Correct an issued invoice without editing it, from its **Correct this invoice** card: a **Credit
    note**, **Credit in full and rebill** (the new invoice starts from a copy of the original's lines),
    or, when the billable party asks for a combined procedure in pieces, **Split into additional
    invoices** that add up to what was credited. Each credit is reviewed on **Review → Events** and
    issued in the next billing run.

### Critical rule

There is no `RETURNED` state. If the office finds an issue after submission, office staff initiate a
phone conversation and make the correction themselves. The anaesthetist does not reopen the Booking.

### RFP anchors

- `Card Immutability and the List Approval Process`
- `Billing Engine Integration Point`
- `Office-facing monitoring`

## Secondary admin responsibility: integration and exception operator

### Status

The capability is explicit in the RFP. A dedicated job title and exact screen location are inferred.
The prototype plans to place the monitoring in or alongside the Admin Web App.

### Goals and actions

- Work **Admin, Intake** (one side-nav item under Day view): on **Matching**, import hospital files and
  match, create or reject each row, with unmatched rows and rows with no NHI waiting in the unmatched
  queue; on **PDF lists**, open each rooms' list with its sender, correct its rows and send it to
  matching (a re-sent list's differences wait for approval); on **Data quality** and **Validators**,
  check what was received and test NHIs.
- Handle an inbound change that targets a `SUBMITTED` or `AUTHORISED` List.
- Future scope: automatic hospital sync and HL7 and FHIR monitoring (failed, duplicate, retried and
  dead-lettered messages, partner field mappings, reprocessing without duplicates).

### Pain points

- HL7 implementations differ by hospital.
- Existing feeds frequently fail.
- Batch/SFTP processing introduces latency.
- Late bookings may arrive right up to the operating session.

### Prototype status

**Admin, Intake** (catch-up Phases 33 and 34) is the in-scope surface, with tabs Matching, PDF lists,
Data quality and Validators: hospital files from St George's and Southern Cross and the rooms' PDF lists
land there with their wording as received, and nothing applies until the office decides. Every List
records where it came from. Hospital files are imported by the office; nothing syncs. The HL7/FHIR
tooling is Future scope on its own demo surface, **Demo: Future scope, HL7 and FHIR**
(`/demo/integrations`, its message log at `/demo/integrations/log` and feed mapping at
`/demo/integrations/mapping`): a fired message only lands on Admin Intake as a row; the HL7-to-FHIR
transform, a deduped replay and a feed-mapping dead-letter can be shown there as a labelled aside.
Christchurch Public is not integrated today.

## Secondary admin responsibility: finance and reconciliation

### Status

The financial workflow is explicit. Whether it belongs to a separate staff member is an
organisational assumption.

### Goals and actions

- Monitor invoices generated and sent by the Billing Engine (the Billing monitor's **Sent or to post**
  stage), resend one, and fix a missing invoice address.
- Reconcile payments into AA.
- Handle partial payments, and match any bulk remittance line Xero could not match (in Xero's bank
  reconciliation, not in the Billing Engine).
- Confirm the related anaesthetist payable becomes available for a payables run.
- Run the payables in Xero (the Billing Engine records each disbursement when Xero reports the bill
  paid) and distinguish paid-in from paid-out.
- Watch the **Reconciliation** card on Admin Day, and on the Billing monitor the Xero sync queue and
  any invoice changed directly in Xero.
- Manage individual Xero contact archiving at scale.
- Maintain AA fee settings and run the monthly fee invoices (AA's own fee to each anaesthetist, never
  deducted from a payment to them).
- Check the ledger is in balance on the Ledger screen (the whole ledger or one anaesthetist), and
  follow up any anaesthetist on its out-of-balance list.

### Prototype status

Built. Invoice calculation and documents (Phase 08), then the Xero collection/payable pairs, payment
webhook and reconciliation poll, payables run with separate paid-in and disbursed states, contact
archiving and live anaesthetist balances (Phase 10) are all clickable. AA's monthly fee settings,
the monthly fee invoice run and the anaesthetist's AA fees tab followed in catch-up Phase 16. Since
catch-up Phase 22 the run sends each invoice itself (emailed, or marked To post), in the
anaesthetist's name with AA as agent, and a fee can be split on the Booking. Since catch-up Phase 36
the Billing Engine's own ledger is AA's system of record (every invoice a receivable and payable pair,
Xero mirroring it), with the Admin Ledger screen's in-balance view and out-of-balance list. Since
catch-up Phase 37 the payables run is made in Xero and the engine records each disbursement by webhook
or poll; every call to Xero waits in a sync queue that retries through an outage; voids and edits made
in Xero are flagged at the poll; and Admin Day's Reconciliation card says whether everything squares.

## External actors, not prototype login personas

| Actor | What it contributes |
|---|---|
| Surgeon or surgeon-room coordinator | Requests a Free List, phones changes and emails PDF Lists/Bookings |
| Hospital/PAS | Sends new, changed, rescheduled and cancelled appointments |
| Patient or another payer | The payer named on each Procedure (the patient, or a parent, guardian, benefactor or family trust); receives the invoice when the Contract does not bill its holder |
| Hospital or other Party | May receive and pay the invoice where a Contract bills it |
| Insurer | A Party; invoiced only where a Contract bills it |
| Patient's reimbursement insurer | Named on the Booking with its approval number; reimburses the patient, who is invoiced under No contract · RVG like any patient (the AIA Booking) |
| Billing Engine | Calculates, groups, issues and sends invoices (by email, or marked to post) |
| Xero | Provides accounts receivable and banking functions |

There is no patient, hospital or surgeon portal in the RFP.

## Persona-to-app summary

| App | Demonstrated person | Business responsibility |
|---|---|---|
| Anaesthetist Mobile App | Dr Melanie Souter | Procedure-day Lists, Bookings, BTM, completion, submit, availability |
| Anaesthetist Web App | Dr Melanie Souter | Wider schedule, List/Booking detail, availability, accounts |
| Admin Web App | Kirsty W. | Day operations, changes, review, authorisation, masters, audit and monitoring |
| Demo surfaces | Kirsty/presenter | Simulate external systems; these are not proposed end-user apps unless explicitly labelled |
