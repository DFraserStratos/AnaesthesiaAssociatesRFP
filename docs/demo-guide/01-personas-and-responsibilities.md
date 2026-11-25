# Personas and Responsibilities

## How to read the personas

The system has three apps:

- Anaesthetist Mobile App
- Anaesthetist Web App
- Admin Web App

Mobile and web are two places the same anaesthetist works. The prototype shows both with Dr Melanie
Souter.

The Admin Web App serves the AA office. The prototype shows it with one persona, Kirsty W., who wears
several hats in the demo: scheduling coordinator, billing reviewer, intake operator and finance. A
second office user, Sam T., exists only so the audit trail can show two named people (see the end of
this file).

## Persona 1: Dr Melanie Souter, mobile-first anaesthetist

### Context

Dr Souter works independently across several hospitals and surgeons. She moves between theatres
during the day. Her phone is the fastest way to see her Lists, read each Booking and record what AA
needs to bill.

### Goals

- Know which Lists she has in each AM, PM and out-of-hours session.
- See the hospital, surgeon, patients and times on each List.
- Deal with late changes without phoning AA for every detail.
- Record base, time and modifier units with little typing, and see what the price comes to as she
  records.
- Find her own cover: move a List, or a single Booking, to a colleague who is free.
- Keep her calendar: days off, Public sessions, availability weeks ahead.
- See what she is owed, what she has been paid, her remittances and her monthly GST report.

### Core actions

1. **Sign in** on the handset with her demo account (`m.souter@aa-associates.example`, password
   filled in). The screen carries a "Provisional" pill: how anaesthetists sign in is still to be
   decided (OQ-83). The framed prototype opens signed in.
2. Open **Lists**, her main view from today. Lists from earlier that the office has not authorised
   sit above it under "Earlier, not yet authorised". An authorised List leaves the main view; search
   finds it by patient name or NHI, and a picked day shows that day's Lists.
3. Open a List and read its Bookings in time order. A stub stands in for a row still waiting at
   intake with no NHI, so she sees the case coming.
4. Open a Booking. The **Procedure** section shows the procedure text as it arrived, with when and
   where it came from. The **Billing** section below it shows where the invoice goes, the Contract,
   the RVG code and **Paid by**. The invoice description starts as the text received; where a
   Contract has its own invoice description, the invoice prints that.
5. Record what the Procedure's Contract needs. On an RVG price: the RVG code, found by typing under
   its body-area heading; **Start now** and **Finish now**; and the **Modifiers** step. On a fixed
   price: no times or modifiers, and the RVG code is optional. The **Price** section shows the
   units, her rate per unit and the price as she goes, and the Booking total sits above **Mark
   complete**.
6. Answer the **Modifiers** step, even when it is **None apply**. The age modifier and any modifier
   already counted in the base units come in applied, and she can remove them. Anything else she
   claims needs a short explanation, ASA included.
7. Change the procedure or the Contract while the List is hers to edit: before she submits, and
   after it until the office authorises the List. She can change the RVG code, add a procedure with
   **Add another procedure**, use **Make primary** on another one, or open the step rail from the
   Billing section and pick another Contract. A Contract she changes reads "Awaiting office
   approval" and is flagged at review, where the office approves or corrects it.
8. Name the payer on each Procedure: **Paid by → Change** opens a sheet for a parent, guardian,
   benefactor or family trust, offered to the Booking's other Procedures with the same payer. A payer
   needs an email or a postal address. **Add insurer or funder** records who funds the Booking and
   the insurer's approval number on the day; it never changes who is invoiced.
9. Type her own price where the Contract allows it: on No contract · RVG (the **PRICE $** field and
   **Save price**), or the amount on No contract · Fixed price. Her own Contracts, such as her
   prepaid rhinoplasty at $1,200.00, price at her own fixed price, which the office keeps on her
   behalf. Anywhere else the price reads "Set by ..." with "To use a different price, change the
   Contract or alert the office."
10. **Split** a Procedure's fee on her own Booking from its Paid by line: each share in $ or %, one
    party taking the rest, each party invoiced separately, until the office authorises the List.
11. **Mark complete** on each Booking, then **Mark list completed** and **Submit to office**. Mark
    complete asks for a Contract and a price, and on an RVG price also the RVG code, both times and
    the modifiers step. A warning never stops it.
12. See warnings: a triangle on the List, and the warning at the top of the Booking when she opens
    it. A patient who owes AA reads "This patient owes AA money. The office is following up", with
    no amounts.
13. Move her own List from **List options → Move this List**: **Return to the office** or **Hand on to
    a colleague** who is free that session. It happens at once, with no acceptance and no approval,
    and she chooses what her session becomes (Free or Unavailable). The office sees it in its
    notifications.
14. Move a single Booking with **Move to a colleague**: a colleague free that session, found by name
    or from the free list. The Booking becomes a new List in their session and takes its Contracts
    with it; whoever does the case is paid for it. **Tell the office** is her choice. Whoever submits a
    List did every procedure on it, so she moves a Booking before she submits.
15. **Alert the office** from a List or a Booking with a note. It lands in the office's
    notifications until someone there resolves it.
16. Keep her calendar on **Availability → My calendar**: days off weeks ahead, repeating ones
    included. Marking a booked session Unavailable asks where its List goes: back to the office or on
    to a colleague.
17. See an out-of-hours List the office added for an emergency or late case, in an evening session
    after PM. She captures and submits it like any List, and marks that session available or not
    like AM and PM. She rings the office to have one opened.
18. Add a missing Booking with **Add a booking**, typing the procedure as she was told it (kept
    exactly as typed). The NHI is checked as she types, and **Look up** fills the patient from the
    NHI register, looked up on her behalf under her HPI CPN, only to identify the patient.
19. Record her own pre-op and post-op care on any of her Procedures, before or days after, from the
    Booking (main view, search or a past day): **Add pre-op or post-op event** (a ward review, HDU
    review, pain consult, the ACC pre-op assessment with its CS250, CS260 or CS70 code, codes still to
    confirm (OQ-12), or other work, with its own date and a time or a fixed fee) and **Add billing
    event** (a free-text charge, or a credit before the Procedure is invoiced). The office reviews
    each one and it bills in the next run.
20. On her own invoiced Procedure, **Create additional invoice** for a late charge such as a ward
    review; she can edit or remove it until the office reviews it. **Credit note** beside it credits
    the whole invoice (less work than expected, the wrong payer, paid twice), with a new lower invoice
    if one is due. The office reviews it, and her payment for that invoice is reversed by a negative
    invoice that nets in a weekly payment run.
21. On her own prepaid procedure, once the List is authorised, use the **Prepaid settlement** block:
    nothing further is raised automatically, so any difference is an additional invoice or a credit
    note she raises by hand. She can cancel a prepaid Booking on her List; the system credits the
    prepayment invoice, and refunds it if paid, at once.
22. Open her **Profile** on **More**: rate per unit, phone, email, registration number, HPI CPN and
    bank account (masked, such as 99-0101-•••••21-00). **Change** beside **Rate per unit** sets the
    dollar value of one RVG unit. The new rate applies to Lists not yet authorised; an authorised List
    keeps the rate locked at authorise. The other rows show a lock: the office holds them.
23. Get help from **More → Get help**: the help line, open 8:30am to 5:00pm on weekdays.

### Permissions

- `ACTIVE`: edits her Bookings and submits the List once every uncancelled Booking is complete.
- `SUBMITTED`: the List shows as "Done · unbilled" and she can still change its Bookings until the
  office authorises it. Every change is audited and shows at review as **Changed**.
- `AUTHORISED`: the Bookings are locked for everyone.
- `DRAFT` belongs to a Draft List, which has no anaesthetist yet. She never sees Draft Lists.
- Sees only her own Lists and patients. Sees colleagues' availability and phone numbers when she
  looks for cover, never their patients.
- Never sees the office's tiers, preferred pairings or who she is Not preferred with.
- Sets her own rate per unit. Cannot change her contact details, HPI CPN, bank details or any other
  master data.
- Cannot authorise a List, assign a Draft List or see the office's notifications.

### Pain points the design answers

- Bookings change right up to the day of the procedure.
- The hospital's list and the List in theatre can disagree.
- Base, time and modifier units are fiddly and decide what she is paid.
- Short-notice illness needs a fast answer, often at six in the morning.
- Some users are not comfortable with complex software.

### Prototype persona

- Name: Dr Melanie Souter (MS), registration 34821
- Main app: Anaesthetist Mobile App; also the Anaesthetist Web App
- Demo sign-in: `m.souter@aa-associates.example`, on the handset's sign-in screen

## Persona 2: Dr Souter at a desktop

The same anaesthetist, at a desk instead of in theatre.

### Context

Away from theatre, Dr Souter wants a wider view of the weeks ahead, her availability and her money.
The web app has room for tables and summaries over the same Lists and Bookings.

### Goals and actions

- Read the **Dashboard**: the coming week and her financial position (owed to you, collected, paid
  out to you).
- Browse **Lists** from today, with earlier unauthorised ones at the top, and find past work by
  patient name, NHI or day.
- Open the same List and Booking screens as on the phone, and do the same work there: capture, add a
  Booking or a procedure, change the Contract or the payer, split a fee, add events.
- Find free colleagues on **Availability**. Move a List to one of them or back to the office, or move
  a single Booking from its own screen.
- Keep **My availability**.
- Read **Accounts**: **Outstanding** (one row per unpaid invoice, oldest first), **Payments**,
  **Remittances** (one remittance advice per weekly payment run: the BCTIs it paid, any negative
  invoice netted, what reached her), the **GST report** (cash basis: what AA passed to her each
  month, with its GST) and **AA fees** (AA's own monthly invoices to her).
- Open her **Profile** from her name in the top nav and change her rate per unit; the rest is
  read-only, as on the phone.
- **Help** in the top nav opens the help line.

### Demo distinction

Use the web app for overview, planning and money. Use the phone for the day of the procedure. Show the
Booking edit once, on one of them, unless someone asks whether both do the same.

### What the money views read

Every figure comes from the Billing Engine's own ledger, AA's system of record: seeded history plus
anything a demo payment adds. Nothing on these screens reads Xero directly.

## Persona 3: Kirsty W., AA scheduling coordinator

### Context

Kirsty works in the AA office and sees every anaesthetist. She looks after standing arrangements,
bookings by phone, email and PDF, hospital changes, cancellations and short-notice cover.

### Goals

- See the whole day across every anaesthetist.
- Find a free session fast when a surgeon's office calls (**Find available** on **Day view**).
- Keep hospital, surgeon, times and Bookings right.
- Get every Draft List to an anaesthetist.
- Keep a record of every change and who made it.

### Core actions

1. Read **Day view**: one row per anaesthetist, AM and PM (and an out-of-hours session where one is
   open), each showing its List or its availability. Draft Lists wait in their own band at the top.
   The grid shows its rows in pages, or as one scrolling list. The right rail holds the **Books
   square** and **Pre-payments** tiles, then one work card with two tabs: **To-do** (warnings,
   Conflicts and the Bookings that need an invoice destination) and **Notifications**.
2. Work **Intake**: **Import hospital file**, then on **Matching** create, apply or reject each row.
   Nothing reaches the schedule until the office decides, and the procedure text keeps the hospital's
   wording. On **PDF lists**, open each rooms' PDF with the address it came from, correct a row beside
   the original and **Send to matching**. Every List keeps where it came from.
3. Set each new Booking's Contract on the step rail: where the invoice goes (**Patient**, the List's
   hospital, or **Special** for an insurer, a funder or a surgeon who is billed), then **Standard** or
   **Prepaid** (or the hospital's funding tag), then the Contract, chosen by typing. No contract · RVG
   and No contract · Fixed price are always offered. The Contract decides who is invoiced: its holder,
   or the payer on the Procedure.
4. Keep each anaesthetist's own price list: the Contracts they hold, such as Dr Souter's prepaid
   rhinoplasty, blepharoplasty and breast augmentation at her own fixed prices.
5. Book by phone: **Book (phone advice)** on a Free session, NHI **Look up**, the procedure typed as
   it was told, then the step rail.
6. Assign Draft Lists. They come from a recurring booking that meets an unavailable session, a List
   an anaesthetist returns, a sickness, or a request by phone, email or PDF. Only the office assigns
   one. The picker lists who is free, in the office's priority tiers, then preferred pairings; a
   Not preferred pairing sits apart with a warning, and she can still go ahead. Tiers and pairings
   are the office's alone.
7. Record a sickness with **Change status** on Day view. A booked session asks where its List goes,
   back to the Draft Lists or on to a colleague, there and then. **Conflicts** lists hospital closures.
8. Open an out-of-hours session for an emergency or late case: **Open out-of-hours session** on an
   anaesthetist's row, any day from today, one a day, 18:00 to 21:00 unless changed. Put a List in it,
   a new one or a Draft List for that evening, and close an empty one from its drawer.
9. Move a Booking to another List, or reassign a whole List. A move never resets a Contract or a
   typed price; a Contract that does not fit the new List is flagged at review.
10. Work the **To-do** list: each warning with **Open**; a strong one needs **Clear**, a mild one has
    **Clear (optional)**. Warnings cover a missing approval number, a child as the payer, base units
    outside the RVG guide, a patient who owes AA and an unpaid prepayment. None of them blocks
    anything.
11. Work **Notifications**, the one pool the whole office shares: every List or Booking an
    anaesthetist moves, and every alert to the office. Nothing in it needs approving. **Resolve**
    takes a notice away for everyone, **Show resolved** brings it back with who and when, and nothing
    expires.
12. Save each Booking on purpose with **Save changes**: each save is one change set with her name on
    it, shown in **History**, where **View as at** shows the Booking at any save.
13. Draft the update email when a change matters: **Draft update email** from the Booking, the List
    drawer after a cover change, or the notice of an anaesthetist's move. She ticks the saved changes
    to report, the template from **Master data → Email templates** fills the wording, and the email
    opens in her own mail client. The system does not send it.
14. Keep master data by hand after the one-off go-live load. In **People**: anaesthetists (identity,
    contact, bank and GST, rate per unit and priority tier, each a card on her page; the HPI CPN and
    bank details are required), with **Make inactive** from a last day and **Make active**;
    surgeons, each with a page edited one card at a time; specialties; and patients. In
    **Contracts**: Contracts and their price ranges, **Replace from a date**, Parties and funding
    tags. In **Master data**: hospitals and holidays, recurring bookings, availability statuses,
    public holidays, schedule settings, RVG groups and modifiers, email templates, prepayment
    letters and the patient balance warning. Every change is audited.

Surgeon contacts: contacts sit on the surgeon, one personal contact and one or more office contacts
(name, email, phone), with the practice name as plain text. The office enters them and the surgeon's
HPI CPN, and can save a surgeon without one. Each List keeps its sender, and the update email and the
missing-NHI request go to that sender, else to the surgeon's first office contact.

Public sessions: an anaesthetist marks a session Public from her calendar, with a note such as CPH;
it shows no List detail, nobody can book into it or cover it, and setting it back to Free reopens it.

Help: **Help** in the side nav has two tabs, the **Help line** (Stratos' line for anything in the
apps, 8:30am to 5:00pm on weekdays, out of hours only a security breach or the platform being down)
and **Product support** (AA's line to Stratos for incidents, fixes, changes and new features; a
public-holiday call-out waits for AA's approval). Whether AA needs cover from 8:00am is open
(OQ-141).

### Permissions

- Sees every List and Booking.
- Edits `ACTIVE` and `SUBMITTED` Lists and Bookings, and changes any price until the List is
  `AUTHORISED` (or a prepayment invoice is raised).
- Nobody edits a Booking after `AUTHORISED`.
- Assigns Draft Lists, reassigns a List or a Booking, and keeps tiers and preferred pairings.
- Holds each anaesthetist's profile, bank details and HPI CPN, makes an anaesthetist inactive from a
  last day, and can change any anaesthetist's unit
  value.

### Pain points

- Phone, email and PDF are still the main ways bookings arrive.
- Each hospital provides its bookings differently. Sample files stand in for each hospital's file
  while the integration team confirms how each one provides them (OQ-13).
- Several sources can change the same Booking. Each office save is one named change set.
- Manual checking is slow and error-prone.
- Illness and late changes need resolving the same morning.

### How the schedule is built

Kirsty does not build each day by hand. The system gives every active anaesthetist an AM and a PM
session for every day of the scheduling horizon. Their own availability paints first, then the
surgeons' recurring bookings fill the sessions with Lists. Where a recurring booking meets an
unavailable session, it becomes a Draft List. Kirsty manages the assignments, the Bookings and the
exceptions.

## Persona 4: Kirsty W., billing reviewer

The same office, seen at the point where billing starts. It is a separate persona because the demo
hands over to it.

### Context

An anaesthetist has submitted a List. Kirsty checks every Booking on it as a set, then authorises it
for billing.

### Goals

- Confirm each Procedure's Contract and who is invoiced make sense.
- Approve or correct each Contract the anaesthetist changed, and check any typed price against the
  computed one.
- Correct what the office owns without sending the List back.
- Authorise a clean List, knowing it is then locked.
- Keep the money moving after authorise: invoices, prepayments, events, credits, the weekly payment
  run and AA's fee.

### Core actions

1. Open **Review queue** and a submitted List with **Review →**. Each row shows the procedure text as
   received, its Contract and RVG code, **Paid by**, the fee and any flag.
2. Read the flags: a Contract change (**Approve** or **Correct**), a typed price ("Price typed" with
   the computed price), a $0.00 price (**No charge**), a Contract this List does not offer, a Contract
   disabled before the procedure date, a Procedure that needs a price, a Booking not marked
   completed. The **Changed** marker shows edits made after submit. Only a Procedure with no price, or a
   Booking not completed, holds up authorise.
3. Correct billing setup herself: the Contract, the payer, the price. Authorising approves any
   Contract change still waiting.
4. **Split** a Procedure's fee from its Paid by line when more than one party pays, until authorise.
5. **Authorise for billing**. Authorise takes the pricing snapshot: each Procedure's Contract and the
   price range in force, the units and rate, the price, who is billed and who is paid. The Billing
   Engine raises one invoice per payer from that record and sends it in the same step, emailed or
   marked **To post**. A $0.00 Booking gets a "No charge" invoice with nothing to pay out.
6. Keep invoices moving: **Resend** on an invoice, or type an address on one that reads **No invoice
   address** and **Send**.
7. Approve prepayment invoices on **Invoices** (**Approve and send**, with the letter; AA can switch the
   approval step off), send a reminder with **Send prepayment reminder** while one is unpaid or part
   paid, and keep the three letters on **Master data → Prepayment letters**. On a cancelled prepaid
   Booking, **Rebook with another anaesthetist** at that anaesthetist's own price.
8. Review every event, the anaesthetists' and the office's, on **Review → Events**. She adds pre-op,
   post-op and billing events herself, prices an event's time at review, and keeps each Contract's
   **Event fees**. An approved event bills in the next billing run.
9. Create an additional invoice to any party with **Create additional invoice**, free-form lines,
   reviewed and billed in the next run with its own number and its own Xero pair.
10. Correct an issued invoice without editing it, from **Correct this invoice**: **Credit note**,
    **Credit in full and rebill** (the new invoice starts from a copy of the original's lines), or
    **Split into additional invoices** when the payer wants a combined procedure in pieces. A credit
    note always covers the whole invoice. Each credit is reviewed on **Review → Events** and issued in
    the next run.
11. Watch the **Billing monitor**: every List grouped by anaesthetist (invoiced, sent, in Xero, paid
    in, paid out), **Problems only**, and the **Xero sync queue**, where a failed hand-off waits and
    retries by itself or with **Retry now**. One Booking's failure holds back only that Booking.

### Critical rule

There is no `RETURNED` state. If the office finds a problem after submit, Kirsty phones the
anaesthetist and fixes it herself. The anaesthetist can still edit the List until it is authorised.

## Persona 5: the intake operator

### Context

Bookings arrive as hospital files and the rooms' PDF lists. Someone in the office decides each row.
In a small office this is Kirsty again.

### Goals and actions

- Work **Intake** (side nav, under **Day view**): **Matching** for imported hospital files and sent
  PDF rows (create, apply or reject each, with unmatched rows and rows with no NHI waiting in the
  unmatched queue); **PDF lists** for each rooms' list with its sender (a re-sent list's differences
  wait for approval); **Data quality** and **Validators** to check what arrived and test an NHI.
- Approve an update to a matched Booking field by field. A Booking moved to another day arrives as a
  cancellation and a new row.
- Chase rows on **Intake → Waiting for NHI**: email the List's sender (else the surgeon's first
  office contact) and add the NHI when it comes. A stub holds the place on the List meanwhile.
- Refresh a patient from the NHI register (**Refresh from NHI register** on the patient's page, Keep
  or Use register for each field that differs, audited).
- Follow up patients who owe AA from **People → Patients → Needs follow-up**, then the patient's
  page: its follow-up log, **Resend** and **Log call**.

### Future scope

Automatic hospital feeds over HL7 and FHIR, with monitoring of failed, duplicate and retried
messages, are Future scope. The **Demo: Future scope, HL7 and FHIR** surface (`/demo/integrations`)
replays sample messages for discussion; a fired message lands on Intake as a row like any other.
Christchurch Public is not integrated.

## Persona 6: finance and reconciliation

### Context

The money side of the office. Whether this is a separate person is up to AA.

### Goals and actions

- Watch invoices the Billing Engine raised and sent (the Billing monitor's **Sent or to post**
  stage), resend one, and fix a missing invoice address.
- See payments arrive: Xero tells the Billing Engine by webhook, and the anaesthetist's payable is
  released for exactly what came in. A part payment releases only that part. A bulk remittance line
  Xero could not match is matched in Xero.
- Watch the **AA Holding account** panel: prepaid amounts held until the List is authorised, then
  moved to whoever did the List by a transfer (when it moves is to confirm with AA, OQ-125).
- Run the weekly payment run on the Billing monitor: **Close the week** (Friday, reconciled to the bank
  download), the Monday checks (**Mark fixed**, or **Hold out of this run** so a payment rolls into
  next week), approve the week's BCTIs, and **Send payment schedule** to the accountant on Tuesday,
  who pays it in Xero. Negative invoices net in the run, and every run keeps its remittance advice per
  anaesthetist. The weekly cycle is proposed and with AA's accountant (OQ-47).
- Run AA's monthly fee invoices from **AA fee invoices**: fixed charges plus a charge per BCTI paid
  that month, always its own invoice, paid into AA's own account and never taken out of a payment to
  the anaesthetist. What the per-BCTI charge counts is provisional (OQ-29, OQ-60).
- Check the **Ledger**: the whole ledger or one anaesthetist, in balance when receipts held equal
  payables due, with an out-of-balance list. A receipt that matches no invoice is allocated to one
  or refunded.
- Watch the **Reconciliation** panel on Day view, and on the Billing monitor any invoice voided or
  changed directly in Xero.
- Archive Xero contacts in bulk (**Master data → Xero & archiving**).

## Sam T., the demo-only second office user

**Demo actions → Switch office user** makes the Admin app act as Sam T., then back as Kirsty W. It
stands in for each office user signing in as themselves, so two people's saves show by name in one
Booking's **History** and in the update email's signature. The top bar keeps showing Kirsty W.; the
save strip, History and the email name whoever saved.

## People outside the apps

| Actor | What they do |
|---|---|
| Surgeon and the surgeon's practice office | Ask for a List, phone changes and email PDF lists; receive the update email and the missing-NHI request |
| Hospital | Provides its theatre list as a file the office imports; may be invoiced where a Contract bills it |
| Patient or another payer | The payer on each Procedure (the patient, or a parent, guardian, benefactor or family trust); invoiced when the Contract bills the payer |
| Insurer or funder | A Party like any other; invoiced only where a Contract bills it. An insurer named on the Booking with its approval number may reimburse a patient who is invoiced under No contract · RVG |
| Billing Engine | Prices, raises and sends invoices (emailed, or marked to post), keeps AA's ledger |
| Xero | Accounts receivable and payable, the bank, and the payments the accountant makes |
| Stratos | Answers the help line and product support |

There is no patient, hospital or surgeon portal.

## Which persona uses which app

| App | Demonstrated by | Responsibility |
|---|---|---|
| Anaesthetist Mobile App | Dr Melanie Souter | The day itself: Lists, Bookings, capture, submit, moves, calendar, balances |
| Anaesthetist Web App | Dr Melanie Souter | The weeks ahead, the same List and Booking work, availability, accounts |
| Admin Web App | Kirsty W. (and Sam T. for the audit beat) | Day view, intake, Draft Lists, review and authorise, billing, ledger, People, Contracts, master data, audit |
| Demo surfaces | The presenter | Control Panel, Demo actions, Demo sheet, Xero simulation, Future scope surface. Never proposed as product screens |

## Where the requirements live

The requirements catalogue (`requirements-board/requirements/`) holds each persona's stories:
EP-03 (capture by the anaesthetist), EP-12 (the anaesthetist's profile and reporting), EP-02 (intake
and changes), EP-01 (the schedule canvas and Lists), EP-04 (Contracts), EP-07 (List approval), EP-08 to
EP-10 (billing, Xero, payments and AA fees) and EP-13 (admin oversight and master data).
