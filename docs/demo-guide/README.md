# AA Prototype Demo Guide

This folder is the hub for learning, presenting and answering questions about the Anaesthesia
Associates (AA) Booking & Billing prototype. It explains the business, the personas, the workflows and
the guided demo, so one presenter can run the demo cold and handle the open questions with authority.

It is written for Donald and assumes the reader has not read the requirements catalogue or the RFP.

## Start here

Open the [interactive master demo guide](master-demo-guide.html): one self-contained page with the
mental model, personas, workflows, the S1 to S5 run sheet, the cheat sheet and the **Open questions**
tab, with tabs and collapsible sections. It needs no server and no internet: open the file in a
browser.

## Read these in order

1. [Personas and responsibilities](01-personas-and-responsibilities.md): who uses each app, what they
   are trying to do and what they are allowed to do.
2. [Workflows and handoffs](02-workflows-and-handoffs.md): the business process from the schedule
   through booking, capture, review, billing and payment, with the readiness of each area.
3. [Demo script](03-demo-script.md): the presenter's run sheet. Setup, then the five scenarios S1 to
   S5, each beat with where to click, what to say and what the screen shows, then what to narrate
   rather than click and how to recover from accidents.
4. [Presenter cheat sheet](04-presenter-cheat-sheet.md): the vocabulary, the rules, permissions, the
   money model, likely evaluator questions and **Open questions to raise**.

## The one-sentence product description

Anaesthesia Associates runs the schedule of its anaesthetists' operating Lists, keeps the patient
Bookings on those Lists current, captures what billing needs, checks and authorises each completed
List, then raises the invoices, keeps the ledger and pays the anaesthetists through Xero.

## The mental model

```text
Schedule (four months ahead)
  -> Day
    -> Anaesthetist
      -> Slot: AM, PM, and an out-of-hours one the office opens (on screen: a session)
        -> List
          -> Booking (one patient)
            -> Procedure (RVG code, Contract, Paid by)
              -> Event (pre-op, post-op, billing event, additional invoice, credit note)
```

- **Slot.** A status container for one anaesthetist, one day, one part of the day. Its status comes
  from the anaesthetist's availability (Free, Unavailable, Public and the rest of the list the office
  keeps), and a List goes into it. Every anaesthetist has an AM and a PM one every day; the office can
  open an out-of-hours one after PM, one a day. On screen it is a session, and in the demo you say
  session, AM or PM.
- **List.** One anaesthetist's work in one session at one hospital with one surgeon. Its state is
  `ACTIVE`, `SUBMITTED` or `AUTHORISED`; a Draft List, with no anaesthetist yet, is `DRAFT` until the
  office assigns it.
- **Booking.** One patient on a List.
- **Procedure.** What is booked inside a Booking. The first is the primary, which carries the base
  units and modifiers; every Procedure bills its own time. Each has its own Contract, RVG code and
  **Paid by** line (the payer on that Procedure).
- **RVG group and code.** The RVG groups are the one master list of procedures and base units. The
  anaesthetist picks the RVG code by typing.
- **Contract and Party.** Every pricing arrangement is a Contract held by a Party: a hospital, an
  insurer, a funder, a surgeon or surgeon group, an anaesthetist, or AA. One Contract per priced item,
  each with its pricing kind and, for a fixed price, price ranges from dates. The Contract decides
  who is invoiced: its holder, or the payer on the Procedure.
- **No contract · RVG.** The backstop for a patient paying at the standard rate: RVG units at the
  anaesthetist's own rate, invoiced to the payer. Its partner, No contract · Fixed price, takes a
  typed amount.
- **Event.** Work or money on a Procedure after the fact: a pre-op or post-op event, a billing event,
  an additional invoice or a credit note. It sits on the Procedure, on no List, goes through one
  review step and bills in the next run.

The flow over that model:

- Availability paints first, then the surgeons' recurring bookings fill sessions with Lists. A
  recurring booking that meets an unavailable session becomes a Draft List.
- The office imports and matches bookings, sets each Procedure's Contract, and assigns Draft Lists.
- The anaesthetist completes each Booking and submits the whole List. She can still change it until
  the office authorises it.
- The office checks and authorises the whole List. Authorise locks the pricing snapshot, and the
  Billing Engine raises and sends one invoice per payer from it.
- Every invoice is a receivable and payable pair in AA's own ledger and in Xero. Anaesthetists are
  paid in a weekly payment run; AA invoices its own fee monthly.

## Terminology to correct early

The field user is an anaesthetist, and the unit of work is a List in a session. There is no "SSA"
user and no marketplace of open shifts. Anaesthetists keep their availability, see their Lists, and
find their own cover by moving a List or a single Booking to a free colleague. Draft Lists are
assigned by the office alone. Never show or describe an anaesthetist signing up for a shift.

## Source priority

When sources differ, use this order:

1. [The requirements catalogue](../../requirements-board/requirements/README.md)
   (`requirements-board/requirements/`): the system's requirements, one file per epic, feature and
   story, with its open questions. It wins wherever it differs from anything below.
2. [DECISIONS.md](../DECISIONS.md): the readings the prototype took and why.
3. The code in `aa-prototype/`: what the prototype does.

The [RFP](../../requirements-board/requirements/reference/RFP.md) is historical input: the prototype
was first built against it, and the catalogue has superseded it. For Contracts and pricing, read
AR-58 (the contract model proposal, `requirements-board/requirements/artifacts/AR-58.md`) and AR-61
(its flat ERD, `requirements-board/requirements/artifacts/AR-61.md`).

## Prototype readiness snapshot

Snapshot date: **24 November 2026**. Every catch-up phase is built, and everything in S1 to S5 runs in
the app. Settled rules show on screen as rules, with no label. The few readings still open with AA
carry the label the run sheet quotes, listed under "How to read the readiness" in the
[demo script](03-demo-script.md). The phase behind each area is in the readiness table of
[workflows and handoffs](02-workflows-and-handoffs.md).

| Area | Where it shows |
|---|---|
| Sign-in on the handset (provisional, OQ-83), Lists, Bookings, capture, submit, search | S1 |
| Intake: hospital file import, Matching, the rooms' PDF lists, stubs, each List's sender | S1 |
| The step rail, No contract · RVG and No contract · Fixed price, the descriptions | S1 |
| Day view, sessions and Public sessions, out-of-hours sessions, help line and product support | S2 |
| Warnings and the to-do list, Draft Lists with tiers and pairings, sickness, Conflicts | S2 |
| An anaesthetist's own move of a List or a single Booking, the notification pool, the update email | S2 |
| Review and authorise, the pricing snapshot, one invoice per payer, the Split, the five pricing kinds | S2, S3 |
| Xero pairs, payment by webhook, the weekly payment run (proposed, OQ-47), remittances, GST report | S3 |
| AA's monthly fee run (the BCTI count provisional, OQ-29, OQ-60) and the ledger in balance | S3 |
| Prepayment: approval, letter, AA Holding account, transfer at authorise (OQ-125), cancel, rebook | S4 |
| Events, additional invoices, billing failure and retry, credit note and credit and rebill | S4 |
| Audit trail and change sets, NHI at entry, no NHI in Xero, the lock, each Contract's history | S5 |
| The unit value read at authorise and kept in the lock, the go-live load | S5 |
| Full-scale data (85 anaesthetists, four months, a year of invoices) | S2 aside |
| Automatic hospital feeds over HL7 and FHIR | Future scope, on its own badged demo surface |

Demo-only surfaces stay labelled. The Control Panel, the **Demo actions** menu in the harness bar, the
**Demo sheet** on a handset, the Xero simulation and the Future scope surface are there to simulate
people and systems outside the apps; none of them is a proposed product screen. **Play the office** on
the handset is off by default. The **Synthetic data only** badge sits in the top bar: every patient,
NHI, List and figure is made up.

## Best demo shape

Follow one recognisable business object instead of touring screens:

> Dr Melanie Souter's operating Lists, at Southern Cross, St George's and Forte Health.

Her Tue 28 Jul AM List at St George's takes S1's imported Booking, Sarah Mitchell, for live capture on
the phone. Her two Mon 20 Jul Lists wait on Review for S3. Her Fri 24 Jul Lists carry the prepaid
Bookings for S4.

```text
Hospital file imported and matched        S1
  -> Office sets the Contract
  -> Anaesthetist captures on the phone and submits
  -> Office reviews and authorises         S2, S3
  -> Invoices raised and sent, one per payer
  -> Xero pair, payment into AA
  -> Weekly payment run, remittance advice
  -> AA's monthly fee, the ledger in balance
```

S4 then takes the hard cases (prepayment, events, a billing failure, credit and rebill) and S5 the
compliance questions. Each scenario starts from a Reset or its own jump on the Control Panel. The
[demo script](03-demo-script.md) has the run orders: the full run is 50 to 59 minutes, the short run 30
to 40.

## Where each topic lives in the catalogue

- The schedule canvas, sessions and Lists: EP-01
- Booking intake and change handling: EP-02
- Booking and Procedure capture by the anaesthetist: EP-03
- Contracts: EP-04, with AR-58 and AR-61
- RVG master data and fee rules: EP-05
- Prepayment: EP-06
- List approval: EP-07
- Billing Engine and internal ledger: EP-08
- Xero: EP-09
- Payments, disbursement and AA fees: EP-10
- Patients and billable parties: EP-11
- Anaesthetist profile and reporting: EP-12
- Admin oversight and master data: EP-13
- Health systems integration: EP-14
- Non-functional requirements: EP-15
