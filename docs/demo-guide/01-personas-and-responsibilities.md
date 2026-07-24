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
Cards and capture the data AA needs for billing.

### Goals

- Know which AM and PM Lists are assigned to her.
- See the hospital, surgeon, patient Cards and procedure times.
- Respond to late changes without phoning AA for every detail.
- Capture accurate Base, Time and Modifier data with minimal typing.
- Add a missing Card when the hospital and device disagree.
- Complete work and hand the whole List to the AA office.
- See availability for possible cover or swaps.
- Later, see outstanding amounts and GST-period activity.

### Core actions

1. Open Forward Lists and choose an assigned List.
2. Review its time-ordered Cards.
3. Open a Card and confirm patient, procedure, hospital and surgeon context.
4. Record ASA, RVG code, start/handover time, modifiers, notes and any allowed additional billing
   line.
5. Review the calculated units and fee at her personal dollar-per-unit value.
6. Mark each active Card complete.
7. Submit the whole List to the office.
8. Use Availability to offer a Free session or request cover.
9. Create a missing Card manually or through simulated photo extraction.
10. Copy a Card skeleton when recording an additional procedure, with time-only charging rules.

### Permissions

- `DRAFT`: may edit her Cards and submit the List when every active Card is complete.
- `SUBMITTED`: may view the List as completed/unbilled, but may not edit its Cards.
- `AUTHORISED`: Cards are locked for everyone.
- May only see her own Lists and patient Cards.
- May see colleagues' session availability, but not their patient details.
- May not authorise a List, edit master data or use office monitoring.

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
- `Card Copy`
- `Ad-Hoc Card creation`
- `Mobile App Consumption Model`
- Appendices 3 and 5

## Primary persona 2: Dr Souter at a desktop, anaesthetist web user

This is a usage context, not a separate role.

### Context

Away from theatre, Dr Souter wants a wider view of upcoming work, availability and financial
information. The web app provides more space for tables and summaries while preserving the same
underlying List, Card and BTM actions.

### Goals and actions

- Review the dashboard and coming week.
- Browse a date-ranged view of Lists.
- Drill into the same List and Card detail available on mobile.
- Create or copy a Card and capture BTM data when a desktop is more convenient.
- Find Free anaesthetists and request cover.
- Review accounts outstanding and GST-period activity.

### Demo distinction

Use the web app for overview and planning. Use mobile for the procedure-day action. Avoid repeating
the same Card-edit workflow twice unless the audience asks whether the two surfaces have equivalent
functionality.

### Current prototype caveats

- Balances and GST activity are now live: the anaesthetist money views read the Billing Engine's
  mirror (outstanding payables, receivables aging, GST transaction list), over seeded historical rows
  plus anything a demo payment adds. They never query Xero directly.
- The Request Leave control is a deliberately shallow affordance, not a complete workflow.

## Primary persona 3: Kirsty W., AA scheduling coordinator

### Context

Kirsty works in the AA office and needs a complete view across all anaesthetists. She coordinates
standing arrangements, ad-hoc bookings, hospital changes, surgeon-room calls, cancellations and
short-notice cover.

### Goals

- See the entire day across the anaesthetist roster.
- Find a Free AM or PM slot quickly when a surgeon's room calls.
- Keep hospital, surgeon, times and Cards accurate.
- Reconcile conflicts from anaesthetist availability and hospital holidays.
- Move one patient Card when a booking changes.
- Reassign a whole List when an anaesthetist is unavailable.
- Preserve Cards and audit history through every change.

### Core actions

1. Use the one-day dashboard as the operational control tower.
2. Navigate dates and read the status-coloured AM/PM grid.
3. Open a List and review its Cards.
4. Create a phone-advice booking on a suitable List.
5. Edit List context, including hospital, surgeon and actual start/end times.
6. Move a single Card to a different List for a routine reschedule.
7. Find a Free replacement anaesthetist and reassign the entire List for illness cover.
8. Add internal day notes.
9. Maintain schedule-related master data such as anaesthetists, Permanent Lists and hospital
   holidays.
10. Review the audit history when a change needs explanation.

### Permissions

- Sees all Lists and Cards.
- May edit `DRAFT` and `SUBMITTED` Lists/Cards.
- May not edit Cards after `AUTHORISED`.
- May perform office-only billing setup corrections.
- May reassign a List or a Card.

### Pain points

- Phone, email and PDF remain major booking channels.
- Existing integrations are unreliable.
- Several sources may change the same Card.
- Manual checking creates bottlenecks and data-quality risk.
- Illness and late schedule changes must be resolved quickly.

### Important model correction

Kirsty does not create every "shift" from scratch. The system creates the fixed AM/PM List canvas.
Permanent Lists paint recurring arrangements onto it. Kirsty manages assignments, bookings and
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

An anaesthetist has submitted a completed List. Kirsty reviews all of its Cards as a set before
allowing billing to proceed.

### Goals

- Confirm that the billing route, Contract, Insurer and reference information make sense.
- Spot manually adjusted BTM values and other advisory flags.
- Correct office-owned data without returning the List to the anaesthetist.
- Authorise a clean List and know that it is now immutable.
- Monitor later billing, integration and Xero exceptions.

### Core actions

1. Open the Review queue of `SUBMITTED` Lists.
2. Review every active Card and its calculated fee.
3. Inspect flags such as missing references, ACC route warnings or manual BTM overrides.
4. Correct billing setup in the office when required.
5. Log a phone note if clarification was needed.
6. Authorise the List.
7. Confirm that the Cards lock and the List hands to billing.
8. Later, monitor invoice and integration failures and retry after correction.

### Critical rule

There is no `RETURNED` state. If the office finds an issue after submission, office staff initiate a
phone conversation and make the correction themselves. The anaesthetist does not reopen the Card.

### RFP anchors

- `Card Immutability and the List Approval Process`
- `Billing Engine Integration Point`
- `Office-facing monitoring`

## Secondary admin responsibility: integration and exception operator

### Status

The capability is explicit in the RFP. A dedicated job title and exact screen location are inferred.
The prototype plans to place the monitoring in or alongside the Admin Web App.

### Goals and actions

- Monitor hospital HL7 and FHIR messages.
- Review failed, duplicate, retried and manual-intervention items.
- Correct partner-specific field mappings.
- Reprocess failed messages without creating duplicate Cards.
- Review PDF extraction before ingesting a surgeon's List.
- Handle an inbound change that targets a `SUBMITTED` or `AUTHORISED` List.

### Pain points

- HL7 implementations differ by hospital.
- Existing feeds frequently fail.
- Batch/SFTP processing introduces latency.
- Late bookings may arrive right up to the operating session.

### Prototype status

Built in Phase 11. The Admin Integrations monitor (Messages, Feed config, Surgeon PDFs, Data quality,
Validators) and the badged Integrations simulator are clickable: fire a canned HL7/FHIR message, watch
the HL7-to-FHIR transform, dedupe a replay, fix a feed mapping and reprocess a dead-letter.

## Secondary admin responsibility: finance and reconciliation

### Status

The financial workflow is explicit. Whether it belongs to a separate staff member is an
organisational assumption.

### Goals and actions

- Monitor invoices generated by the Billing Engine.
- Reconcile payments into AA.
- Handle partial payments and unmatched remittances.
- Confirm the related anaesthetist payable becomes available for a payables run.
- Run disbursements and distinguish paid-in from paid-out.
- Manage individual Xero contact archiving at scale.

### Prototype status

Built. Invoice calculation and documents (Phase 08), then the Xero collection/payable pairs, payment
webhook and reconciliation poll, payables run with separate paid-in and disbursed states, contact
archiving and live anaesthetist balances (Phase 10) are all clickable.

## External actors, not prototype login personas

| Actor | What it contributes |
|---|---|
| Surgeon or surgeon-room coordinator | Requests a Free List, phones changes and emails PDF Lists/Cards |
| Hospital/PAS | Sends new, changed, rescheduled and cancelled appointments |
| Patient or guardian | Supplies billing details and may receive the invoice |
| Hospital/contract holder | May receive and pay the invoice |
| Direct-claim insurer | May receive an invoice through its upload workflow |
| Patient's reimbursement insurer | Reimburses the patient; AA does not invoice it directly |
| Billing Engine | Calculates, groups and issues invoices |
| Xero | Provides accounts receivable and banking functions |

There is no patient, hospital or surgeon portal in the RFP.

## Persona-to-app summary

| App | Demonstrated person | Business responsibility |
|---|---|---|
| Anaesthetist Mobile App | Dr Melanie Souter | Procedure-day Lists, Cards, BTM, completion, submit, availability |
| Anaesthetist Web App | Dr Melanie Souter | Wider schedule, List/Card detail, availability, accounts |
| Admin Web App | Kirsty W. | Day operations, changes, review, authorisation, masters, audit and monitoring |
| Demo surfaces | Kirsty/presenter | Simulate external systems; these are not proposed end-user apps unless explicitly labelled |
