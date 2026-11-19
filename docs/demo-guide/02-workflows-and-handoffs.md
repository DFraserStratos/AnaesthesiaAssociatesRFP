# Workflows and Handoffs

## End-to-end business flow

```mermaid
sequenceDiagram
    participant SR as Surgeon rooms / hospital
    participant O as AA office
    participant S as Scheduling engine
    participant A as Anaesthetist
    participant B as Billing Engine
    participant X as Xero

    S->>S: Maintain rolling AM/PM List canvas
    SR->>O: Standing arrangement, phone, PDF or hospital update
    O->>S: Reserve/update List and Bookings
    S->>A: Show assigned List and patient Bookings
    A->>A: Capture procedure and BTM data
    A->>O: Submit completed List
    O->>O: Sanity-check and correct Bookings
    O->>B: Authorise whole List
    B->>B: Read each Procedure's Contract, fee and invoice grouping
    B->>X: Create ACCREC and draft ACCPAY
    X->>B: Payment webhook or reconciliation result
    B->>X: Authorise payable for disbursement
    B->>A: Update balance and GST views
```

## The two kinds of state

Do not confuse these in the demo.

### Operational List status

Examples:

- Private
- Pre-op assessment
- Holiday
- Unavailable
- Public (a status with an optional note such as CPH, never a kind of List, never billed)
- Free

These describe what the half-day session is being used for.

### Approval lifecycle

```text
ACTIVE -> SUBMITTED -> AUTHORISED
```

| State | Anaesthetist | Office | Integrations | Meaning |
|---|---|---|---|---|
| `ACTIVE` | View and edit | View and edit | May update | Work is still being prepared |
| `SUBMITTED` | View and edit, own, until authorised | View and edit | Do not apply updates | Anaesthetist has handed the whole List to office; the last change stands |
| `AUTHORISED` | Locked | Locked | Do not apply updates | Office has approved it for billing |

A List's state is `DRAFT` (a Draft List, no anaesthetist yet), `ACTIVE`, `SUBMITTED` or `AUTHORISED`; a
session's availability is separate.

There is no `RETURNED` state.

## Workflow 0: create and maintain the schedule canvas

**Primary actor:** Scheduling engine, configured by AA office

**Prototype readiness:** Ready

### Trigger

- The schedule horizon (a setting, four months today) advances or is changed.
- A new anaesthetist is added with a start date, or an anaesthetist is switched active or inactive.
- A recurring booking, hospital holiday or public holiday changes.

### Steps

1. The system ensures every active anaesthetist has an AM and a PM session for every day from their
   start date to the end of the rolling horizon. Every new session starts Free.
2. The anaesthetist's calendar (leave, unavailability and their repeating days off) is painted onto
   the session's status; nothing is reconciled, because the calendar sets the session's status directly.
   The statuses are a list in master data (Free, On holiday, Unavailable and Public to start), next to the fixed
   List types.
   Seeded public sessions are Public sessions with the note CPH, and each anaesthetist with a weekly
   public session has a weekly Public series; Public closes the session like Unavailable.
3. Recurring bookings (the surgeons' standing arrangements) then project their Lists, empty, into
   free sessions, after the anaesthetist's calendar: a session already closed is not painted: a recurring booking that lands on a day the anaesthetist has
   already blocked out becomes a Draft List for the office, since the calendar is painted first. A change to a recurring booking reapplies at once through "Apply to canvas
   now", from tomorrow to the horizon's far end, never touching a List with Bookings or office edits.
4. The displayed status is the List's kind when a List is in the session, the session's status
   otherwise: one derivation, so free, unavailable, holiday and booked show the same in all apps and
   the finders, including after a phone booking.
5. Conflicts (a closed hospital, or a List in a session marked unavailable) are surfaced without
   deleting the List; they clear when the clash goes or the office clears them.

### Handoff

The office receives a stable schedule on which it can paint assignments and patient Bookings.

### Master data the office keeps

In Admin, the office also maintains surgeons (each holding one or more specialties, a practice name and
their contacts; the HPI CPN is filled in by admin staff, unique when held), surgeon groups, hospital contact emails, AA's list of specialties, its
funding tags (SXAP, HNZ, ACC, in the order they are offered), and its private pairing preferences and
anaesthetist priority tiers.
The system keeps no surgeons' rooms: a surgeon holds a practice name, one personal contact and one or
more office contacts (practice manager, PA or shared inbox: name, email, phone, blanks allowed).
The update email to a surgeon goes to the List's sender when the List came from a rooms' PDF, otherwise to the first office contact with an email, with the others
offered; never every contact and never the personal contact.
Anaesthetists never see preferences or tiers, and an anaesthetist handing on their own List gets no
warning.

### Demo point

Open the Admin Day View and show the repeated AM/PM rhythm, including one full-day booking represented
by two adjacent Lists. Explain that the office manages exceptions rather than manually inventing every
session.

### Source

- RFP: `Schedule Management - Candidate Architecture`
- RFP: `Supporting / Master Data`
- Prototype: `D1`, `D2`, `D5`

**Master data and go-live.** A clean cut: nothing comes across because it exists in Solutions Plus
(it gives operation names only, never its unit values). A developer seeds the empty system once from
AA's controlled spreadsheets, every row checked by the same rules as adding it by hand and every
failure listed and left out; the same load runs again into a test system. After that the office keeps
every master by hand, each change audited, and never loads master data itself. There is no Contract
upload or export in the first release (Future Work).

## Workflow 1: reserve a List and populate patient Bookings

**Primary actors:** AA scheduling coordinator, surgeon rooms, hospital/PAS

**Prototype readiness:** Ready. Manual phone booking, mobile and web manual Booking creation, the
hospital file import with its matching screen (catch-up Phase 33) and the rooms' PDF lists through the
same screen (catch-up Phase 34) are all built, under **Admin, Intake**. Automatic hospital sync and
HL7/FHIR messaging are Future scope.

### Triggers

- A recurring booking creates the standing pairing.
- A surgeon's room calls AA for an ad-hoc List.
- Hospital bookings arrive: the office imports the hospital's file (St George's and Southern Cross;
  one theatre list a day).
- A surgeon's rooms email a PDF List; the office uploads it with the address it came from.
- The anaesthetist finds a patient missing on the day.

### Main path

1. The office selects a suitable AM or PM List.
2. The List is assigned a hospital and surgeon.
3. Patient appointments are represented as time-ordered Bookings inside the List.
4. Each Booking points to a patient and contains one or more Procedures.
5. Rows from a hospital file or a rooms' PDF list (or a Booking entered by hand) reach the schedule
   through the matching screen on Admin, Intake: the office applies, creates (a Booking, a List,
   or a Draft List holding the Booking) or rejects each one, and sets the invoice destination and
   Contract there or from Needs an invoice destination; nothing reaches a Booking, List or Patient until
   the office decides. Every List records where it came from (a rooms' PDF with its sender, the
   hospital's list, by hand, or a recurring booking) and keeps it after assignment; anaesthetists and the office change Bookings
   directly while the List is `ACTIVE`. Each Booking holds its procedure text as received from each
   channel; the hospital's later text replaces the surgeon's rooms' text once the office applies its
   row, and the original stays in the Booking's history. The matching screen shows only the fields
   needed to match; the rest of what the hospital sent is held under restricted access. The office
   sees it masked with **View raw row**, giving a reason each time, and every view is audited with
   that reason and no values ("Raw row viewed"); anyone else is refused ("Raw row view refused").
6. Every change writes `lastModifiedBy/At` and append-only audit history.

### Manual fallback paths

- **Phone advice:** Kirsty creates the booking in Admin, typing the procedure as she was told it
  (kept exactly as typed, Told by Phone or Email).
- **No anaesthetist yet:** a request with no anaesthetist yet becomes a Draft List, which can take
  Bookings before it is assigned.
- **Mobile/web manual Booking:** Dr Souter enters the missing Booking, with the procedure as written on
  the hospital's list (kept exactly as typed) and, if she knows it, its Contract on the step rail; otherwise it waits on the office's Needs an invoice destination list.
- **Photo of the booking card:** Future Work (US-02.4.4); a badged Future-scope demo on the mobile List.
- **PDF list:** on **Intake, PDF lists** the office opens the rooms' list beside its facsimile,
  corrects a row (an invalid NHI, say), and selects **Send to matching**: its rows land on the matching
  screen with the rooms' wording, like a hospital file's. A re-sent list is matched to the earlier one
  by surgeon, hospital, date and session (our reading): unchanged rows are skipped, a changed field waits
  as a difference for approval, a new patient arrives as a new row; a dropped patient is not yet detected
  (Future Work).

### Handoff

The populated List becomes visible to the assigned anaesthetist on mobile and web.

From the matching screen (office to anaesthetist): a row the office creates or applies shows on her
List as a Booking with the hospital's wording as received, source "Hospital download".

A row with no NHI waits at intake on the matching screen, and no patient or Booking is made; meanwhile
a stub stands on her List in its place (a dashed amber row, "Waiting at intake: no NHI · The office is
resolving this", with the time, name and wording as received). The stub is never counted ("n of n
complete · 1 waiting at intake") and never blocks submit or authorise; in Admin it carries a **Resolve on
Matching** link. When the office adds the NHI, the Booking takes the stub's place; rejecting the row
removes the stub. Seeded: Mere Tipene on Dr Souter's Tue 4 Aug PM List (NHI ZQA1024). What a stub shows
and that the Booking takes its place are our readings, to confirm with AA.

A List created from a rooms' PDF reads "From a rooms' PDF · sent from <address>" with **Replies go to**
that address, on the List and its Bookings: updates and NHI requests go to the List's sender, else the
surgeon's first office contact, the others offered.

### Key distinction

A hospital or surgeon supplies booking information; they are not shown as logged-in users of the
prototype.

### Source

- RFP: `Card`
- RFP: `Manual Processing`
- RFP: `Automated Processing`
- Prototype: `D3`, `M7`, `A2`, `I1` to `I4`

## Workflow 2: plan the day and manage late changes

**Primary actor:** AA scheduling coordinator

**Prototype readiness:** Ready

### Trigger

A hospital, surgeon, patient or anaesthetist reports a change.

### Steps

1. Kirsty opens the Admin Day View.
2. She locates the relevant List by anaesthetist, time, hospital and status colour.
3. She opens the List drawer and its Bookings.
4. For a routine patient reschedule, she moves one Booking to a different List.
5. For an incorrect assignment, she changes hospital, surgeon or actual start/end time.
6. For a cancellation, she records a reason and soft-cancels the Booking.
7. Cancelled Bookings remain visible for history but do not block submission or enter billing.
8. She can add an internal day note for colleagues.
9. She plans the day from the Draft Lists rail card and band, soonest first. The assign picker is
   grouped and tier-ordered, and every List block shows its booking count.
10. Her changes on an Admin Booking are a draft until she selects **Save changes**: each save is one
   change set, one grouped row in the Booking's History naming who saved it, and History can show the
   Booking as it was at any point. With two office users, each save names its own.
11. When a change matters to someone outside, she drafts an update email on demand from any Booking
   (**Draft update email**), picking the changes to report from its saved history and starting from one
   of AA's templates (Master data · Email templates). It goes to the List's sender, else the surgeon's
   first office contact, the others offered. She sends it from her own mail client: every email is
   drafted and sent by hand in the first release (OQ-82).
12. She can add a Booking to any List she may edit, booked or not, with the description she was told
   kept exactly as typed, and edit any field until the List is `AUTHORISED`.

### Handoff

Once saved, the updated List and Bookings are immediately visible in Dr Souter's mobile and web views
while the List is `ACTIVE`; a Booking she has open shows one line saying the office saved changes.

### Demo point

Show a single Booking move and explain that it is different from reassigning an entire List.

### Source

- RFP: `Card`
- RFP: `Key Design Principles`
- Prototype: `A1`, `A2`, `D3`

## Workflow 3: find cover: the anaesthetist's own move, or the office's reassignment

**Primary actors:** Anaesthetist and AA scheduling coordinator

**Prototype readiness:** Ready (US-01.4.3: the anaesthetist's own move; US-01.4.1: the office's
reassignment; US-01.4.7 and US-01.4.6: the single-Booking move and the doer rule, Phase 32a)

### Trigger

An anaesthetist becomes unavailable or needs cover at short notice.

### Steps

1. Dr Souter keeps her availability in her calendar (mobile or web): days off ahead, repeating days
   off, one occurrence changed or deleted, and public hospital sessions (Public, with an optional note
   such as CPH; the office can set one too, from Change status, with a note). Public is not open for
   cover; changing it back to Free reopens the session.
2. She moves one of her Lists to a free colleague or returns it to the office, also when she marks a
   booked session off: the app asks "Return to the office" or "Hand on to a colleague" first, so no
   List is left with her, and then what her session becomes (the status she is setting, or Free).
   It happens at once: nobody accepts and the office does not confirm.
3. The colleagues offered are those free that session, in name order, by availability alone. She
   sees no preference, tier or warning.
4. A List she returns goes back to the office as a Draft List with its hospital, surgeon and Bookings;
   one she hands on moves with every Booking and its history, exactly as the office's reassignment.
   Nothing about billing or prepayment is recalculated.
4a. When it is one case, not the whole List, she moves that Booking from its Booking screen ("Move to
   a colleague"): a colleague free that session, found by typing a name or from the free list, takes
   it as a new List of theirs in that session, never added to an existing List. A colleague on leave
   is offered only once they set that session available themselves. Telling the office is a tick she
   may leave off. This is also the doer rule: whoever submits a List did every procedure on it, so a
   Booking a colleague does moves to a new List of theirs before the procedure, and its payable
   follows. A prepaid Booking's payable stays the AA Holding account: nothing is repointed or
   recalculated, and the transfer when the List is authorised pays whoever did it.
5. When nobody has arranged cover, Kirsty receives the phone call and records the sickness on the
   Day view (Change status). Unavailability is never a conflict: the same "Where does this List go?"
   step asks her to return the List to the office (a Draft List) or hand it to a colleague there and
   then. The Conflicts screen covers hospital closures only.
6. She views the anaesthetists free at the required AM/PM granularity, in priority-tier order and
   preferred pairing first within a tier, with any not-preferred pairing grouped apart and warned
   (never blocked), and assigns or reassigns the List. A colleague marked unavailable shows but cannot
   be picked: the session is made available first, with that anaesthetist's agreement.
7. Whoever moves the List, the anaesthetist or the office, chooses what the vacated session becomes:
   Free or Unavailable (OQ-84, answered).
8. Every move and reassignment is audited.
9. An anaesthetist unsure about a Booking or List uses **Alert the office** with a note. It waits in
   the office's notifications, with the note, until someone there ticks it resolved; submitting is not
   affected.
10. An emergency or late case after the PM session: Kirsty opens an **out-of-hours session** from the
   anaesthetist's row on the Day view (any day from today, the same evening included; one a day; 18:00 to
   21:00 by default) and puts a List in it, a new one or a Draft List waiting for that evening. From then
   on it is a session like AM and PM: the anaesthetist marks it available or not, the finders offer it
   while it is free, and its List moves, returns and bills like any other. An empty one can be closed.

### Handoff

Each anaesthetist's own List move posts to the office's shared notifications (Admin Day's rail and the
Notifications page), the same for the whole office; a single Booking posts there only when she ticks
"Tell the office". The colleague sees the List or the Booking with a "Moved to you" notice either way.
The office then assigns any Draft List returned to it. A notice, or an alert, stays active until an
admin ticks it resolved, which hides it for the whole office; "Show resolved" brings it back with who
resolved it and when. Nothing expires.

Cover changes email the hospital contact: after an office reassignment or a Draft List assignment, the
List drawer offers **Draft update email**; after an anaesthetist's own move to a colleague, the
notification's **Draft cover-change email** on the Notifications page. Each opens a draft with the
change ticked and the Change of anaesthetist template; the office sends it by hand (OQ-82). A List
returned to the office gets its email once the Draft List is assigned.

### Requirement

US-01.4.1 settles the mechanism: change the List's owner, consume the covering anaesthetist's free
session, and return the vacated session to available (or mark it unavailable if more appropriate).
OQ-84 is answered: whoever moves the List chooses Free or Unavailable for the vacated session. OQ-81
part 3 is answered: sickness forces a return or a hand-on, never a conflict. Alerts to the office are
US-03.6.3. Out-of-hours sessions are US-01.1.6 (the office opens a third, evening session; D84 answered 10 November).

### What not to say

There is no claiming of open shifts, no acceptance step, no preference warning for the anaesthetist,
no prepayment recalculation or payee change on a move, no moving a Booking into a colleague's existing
List, no List left on an unavailable session (never "flag the sickness"), and notifications are not
tasks: a notice is ticked resolved, not done.

### Source

- RFP: `List`
- RFP: `Key Design Principles`, item 8
- RFP: `Open Questions`
- Prototype: `D7`, `M8`, `M9`, `A3`

## Workflow 4: capture BTM and complete a Booking

**Primary actor:** Anaesthetist

**Prototype readiness:** Ready

### Trigger

The procedure has occurred and the anaesthetist needs to record the clinical billing inputs.

### Steps

1. Dr Souter opens her List and selects the patient Booking.
2. She confirms patient, operation, hospital and surgeon context.
3. What each Procedure asks for follows its Contract's pricing kind. On an RVG price (No contract ·
   RVG and the RVG rate and discount kinds) the RVG code, start and finish times and the modifiers step
   are required, each with a **Required** caption. On a fixed or open price there are no times, units or
   modifiers, and the RVG code is optional, "for reference". She picks an RVG code by typing; on a
   ranged group she may change the starting figure, and an out-of-range value raises an office warning.
4. On an RVG price she records the start and finish times.
5. The system calculates tiered Time units:
   - 1 unit per 15 minutes for the first two hours;
   - 1 unit per 10 minutes after two hours.
6. The age modifier, and any modifier the procedure's base units include (P1 on Neurosurgery and
   Spine codes), are pre-applied and removable; she claims any other modifier that applies, ASA
   included, each with a short explanation. If none applies she taps **None apply** (then **No
   modifiers claimed · Change**); a pre-applied modifier alone does not answer the step.
7. An included modifier shows at 0 units and cannot be added twice.
8. Modifiers stack with no limit, each with its own reason; the same modifier is never added twice.
9. Her Booking shows what the price comes to: a quiet **Price** card in the capture ("4 units x $26.50
   = $106.00") and the Booking total above Mark complete (the phone's dock strip, the web rail panel),
   rising as she claims a modifier or adds time, with no prompt. The office sees the full billing total
   on the Admin Booking.
10. She may add a fixed billing line, and type a price where the Contract allows it, no reason needed
    (an RVG Contract that allows it, or the amount on No contract · Fixed price). Elsewhere the figures
    are read-only: "Set by {Contract}. To use a different price, change the Contract or alert the
    office." The office can change any price until AUTHORISED, shown at review beside the computed
    price.
11. She selects Mark complete. It checks exactly three things: every Procedure has a Contract; on an
    RVG price, the RVG detail (code, start and finish, the modifiers step answered); and a price, not
    **Needs a price**. It does not check the RVG code on a fixed price, the payer's contact, the approval
    number or out-of-range base units. If anything required is missing, the Booking scrolls to and
    focuses the first incomplete control while showing its inline validation message. She resolves each
    item and marks the Booking complete.
12. Something only the office can fix shows a pointer to **Alert the office**; she sends it there. Submit
    still needs every Booking complete.

### Multiple Procedures

- One Booking can have several Procedures, and exactly one of them is the primary: listed first
  everywhere, with a neutral **Primary** pill when there are two or more. The first Procedure entered is
  the primary until someone changes it.
- **Make primary** on any additional Procedure (a bottom sheet on the phone, a dialog on desktop: "Make
  this the primary procedure?") moves the primary. Anyone with edit rights can use it: the anaesthetist
  on her own List until it is authorised (she amends a completed Booking first), the office on `ACTIVE`
  and `SUBMITTED` Lists, a hospital feed on `ACTIVE` Lists only. Removing the primary is refused, and
  nothing is ever promoted silently.
- The multi-procedure rule, one rule system-wide: base units on the primary only (from its RVG group or
  the value recorded); time units on every Procedure from its own times; modifiers recorded once for the
  Booking, on the primary. At 4 modifier units or fewer they all stay on the primary; above 4 they split
  equally across the RVG-priced Procedures, the remainder to the primary (7 over 3 = 3 / 2 / 2), whichever
  Contracts they are on.
- A fixed or open price keeps its price and takes no share. On a mixed Booking whose primary is a fixed
  price, no base units are billed (provisional, OQ-132).
- AA confirmed the rule on 19 October (OQ-90; the 3 / 2 / 2 split was agreed on 7 October). Which
  Procedure should be primary is not settled (Vanessa: the most expensive; Greg: the first in the list),
  so the first stays primary until someone changes it.
- Brian Holt's Booking on Dr Souter's Mon 20 AM List is the seeded two-procedure example; Graeme
  Tullett's on her Mon 13 Jul AM List (Forte Health, in the Review queue) is the three-procedure
  one, split 3 / 2 / 2.

### Handoff

When every active Booking in the List is complete, the List becomes eligible for submission.

### Demo point

Use Margaret Ellison. She is the one incomplete Booking on Dr Souter's Southern Cross PM List; on her
RVG price she taps **None apply** before Mark complete. On Dr Souter's Mon 10 Aug PM List, Miriam
Holloway (Merivale "Facelift plus 1 add on", a fixed price) completes with no times, and Graham Pulley
(No contract · Fixed price) shows **Needs a price** and refuses Mark complete until an amount is typed.

### Source

- RFP: `The Big Picture: What Are We Actually Calculating?`
- RFP: `How Anaesthesia Associates Calculates Invoices`
- RFP: `Split Billing`
- Prototype: `M3` to `M6`, `B3` to `B5`

## Workflow 5: submit the whole List and perform office review

**Primary actors:** Anaesthetist, then billing review officer

**Prototype readiness:** Ready

### Trigger

Every active Booking in the List has been marked complete.

### Steps

1. Dr Souter chooses **Mark list completed**.
2. The app confirms that every Booking is complete and valid.
3. She selects **Submit to office**.
4. A brief **List submitted** success moment confirms that it was sent to the office for review.
5. The List becomes `SUBMITTED`.
6. Dr Souter still sees it on her main view, less prominent ("Done · unbilled"), and can still change
   it until the office authorises it, when it leaves her main view and is found by search. Any change
   she makes is audited and Review shows "Changed since submitted"; a Booking she reopens must be
   completed again before the office can authorise.
7. Kirsty opens the Review queue.
8. She checks the full set of Bookings, including:
   - each Procedure's stack: procedure text, Contract with who is invoiced, and RVG code, with that
     Procedure's flags under it;
   - the payer, and the insurer or funder with its approval number (**Change** opens the Admin Booking);
   - an open alert from the anaesthetist (a Resolve tick) and open warnings (Clear);
   - the **Changed** marker for edits since submit;
   - flags, which never block authorise: **Changed by Dr X: was** the old Contract, **Price typed: $X
     (computed $Y)**, **Contract not offered on this List** (for example after a move to another
     surgeon's List), **Needs an invoice destination**, **Not marked completed**, **Email or postal
     address needed** and manual B/T/M notes. A Procedure not yet authorised and dated on or after the day its Contract was disabled reads **Contract disabled on <day>** (a flag, never a block; Make active clears it).
   - the one blocker: a Procedure that still **Needs a price**. **Authorise for billing** stays
     disabled, naming the Procedure with an **Open** link, until a price is typed (Dr Chen's Tue 14 Jul
     AM review List shows it on Hemi Walker's No contract · Fixed price Booking).
9. She approves (**Approve**) or corrects (**Correct**, which opens the Booking's rail) each Contract
   change the anaesthetist made, or uses **Approve all N Contract changes**; she checks any typed price
   against the computed one. If something is wrong, Kirsty phones for clarification and corrects it in
   the office.
10. She may log a phone note.
11. She selects **Authorise for billing**. Authorising approves any Contract change still waiting; the
    confirm says how many. The anaesthetist sees **Awaiting office approval** under the Billing card
    until then, and **Approved by the office** with the time after. Authorise is refused while any
    Procedure needs a price.
12. The List becomes `AUTHORISED`; every Booking is immutable. In the same step each Booking's lock is
    written: each Procedure's Contract and its settings, the price range in force, the units, rate and
    discount, the price, who is billed (with the patient and payer details as they stood), the split,
    and who is paid, fixed as the List's anaesthetist at that moment. The Booking shows **Contract
    locked at authorise**.

### Handoff

One List-authorised event hands the whole List, with each Booking's lock, to the Billing Engine.

### Key rule

Review is a human sanity check, not a system gate that automatically rejects every advisory. There is
no send-back workflow.

### Source

- RFP: `Card Immutability and the List Approval Process`
- RFP: `Proposed Design decisions`
- Prototype: `D6`, `M5`, `M10`, `A4`

## Workflow 5a: looking back

The anaesthetist's main view starts at today: upcoming work, with any earlier Lists not yet
authorised a scroll back. Once the office authorises a List it leaves the main view and its invoices
show in her balances at once. To find older work she searches by patient name (any part of it) or NHI,
or picks a date and drills into that day's Lists, Bookings and Procedures; an authorised List opens
read only with its invoices. Search covers her own Bookings only. Catch-up Phase 38a seeds January to
March 2026 for Dr Souter so there is history to find (Fri 13 Mar 2026 is the pinned day).

## Workflow 6: calculate and issue invoices

**Primary actor:** Billing Engine automation, monitored by office

**Prototype readiness:** Ready; Phase 08 is recorded complete

### Trigger

The List reaches `AUTHORISED`.

### Steps

1. The Billing Engine iterates each active Booking and reads only its lock, written at authorise. It
   never looks up a Contract, a payer, a rate per unit or an RVG group afresh, and never swaps in a default
   or another Contract; a Booking with no lock fails on its own.
2. Each Procedure's locked Contract is the one it was authorised with; a Contract edit, Disable or new
   price range after authorise changes nothing here.
3. Each Procedure's Contract (as locked) says who is billed: its holder Party when the Contract bills its holder
   (a hospital, an insurer, a surgeon group), otherwise the Procedure's payer: the patient,
   or whoever the Paid by sheet names (a parent, a guardian, a benefactor, a family trust). Procedures
   sharing a payer share one invoice; payers are never matched on name or email.
   A surgeon's fixed price, No contract · RVG, No contract · Fixed price, an anaesthetist's own price
   list and every prepaid Contract bill the payer. The Booking's insurer or funder never decides it.
4. It takes each Procedure's price from the lock (units, rate and discount, or the range in force on
   the procedure date, as locked).
5. It applies the multi-procedure rule to RVG-priced Procedures. A Procedure's fee split on the Booking (the **Split**
   button in its Billing card's Paid by, typed by the office or the anaesthetist before authorise: each party's
   share in $ or %, one party taking the rest) bills each party its share.
6. It makes one invoice per billable party per Booking, and one per share where a fee is split.
7. It creates one or more invoice documents, each in the name of the payee locked at authorise as
   supplier with their GST number, and AA as agent (the agent wording is provisional, OQ-29). The
   invoice document prints from the lock (its **Locked record** card on the invoice rail), so it can be
   regenerated exactly (**Regenerate from locked data**: identical), whatever has changed since.
8. The layout comes from the Contract: the holder's when it bills its holder (invoice descriptions, the
   BTM breakdown, a cross-match strip of the procedure date and surgeon (no hospital reference) and the
   Contract's holder reference code as "Your reference"),
   otherwise the patient's. Prices are held GST exclusive, with GST at the foot.
9. The run sends or queues each invoice by the Party's delivery: emailed, or **To post** for a payer
   with only a postal address (provisional, OQ-122); a payer with neither raises **No invoice
   address** until the office types one and sends. The office resends only (**Resend** on the
   invoice rail); there is no separate email step.
10. Completion of the billing run stamps `billedAt` and removes the List from the anaesthetist's List
    views.

### Handoff

The Billing Engine sends the invoice values to Xero and expects a matched collection/payable pair. Each
ACCPAY carries one buyer-created tax invoice per invoice, the same value, naming the anaesthetist as
supplier and AA as agent (provisional wording, OQ-29).

### RFP ambiguity

Multi-procedure invoice count: the RFP contains tension between same-counterparty grouping and its
`Split Billing` section's statement that multiple procedures in one episode (and a partly covered
procedure) need two separate invoices. The prototype
groups invoices by billable party, one invoice per billable party per Booking, so a multi-procedure
Booking with one payer is one invoice and one BCTI. Two invoices arise only where a Procedure's fee is
split on the Booking.

### Source

- RFP: `Billing Engine Integration Point`
- RFP: `The Card as the Billing Anchor`
- RFP: `Xero Integration - Candidate Design`
- Prototype: `B1` to `B6`

## Workflow 7: collect money and disburse it to the anaesthetist

**Primary actors:** Xero, Billing Engine, finance/reconciliation officer

**Prototype readiness:** Ready (Phase 10)

### Trigger

An invoice has been generated.

### Steps

1. The Billing Engine creates a matched Xero pair:
   - `ACCREC`: what the hospital, insurer or patient owes AA;
   - `ACCPAY`: the full amount AA owes the anaesthetist, equal to the `ACCREC`. AA's own fee is
     invoiced to the anaesthetist separately and never deducted here.
   Both records carry the InvoiceNumber (the `ACCPAY`'s ends `-P`) and the case Reference.
2. `ACCPAY` begins in `DRAFT`.
3. Payment lands in the AA account.
4. A Xero webhook notifies the Billing Engine; a daily poll is the safety net.
5. The matching payable becomes `AUTHORISED` for exactly the amount received, including a partial
   payment; the rest stays outstanding on the invoice.
6. AA runs payables in Xero; a bill-paid webhook, or the daily poll, tells the Billing Engine, which
   records the disbursement. The payment itself is made in Xero, never by the app; the Billing
   monitor's payables panel (**Authorised, awaiting Xero's payables run**) only shows what is waiting.
   A prepayment is the exception: its payable credits the AA Holding account and is never paid itself;
   the anaesthetist is paid only after the transfer at authorisation (Workflow 8, Pre-payment).
7. The system tracks **paid into AA** and **disbursed to anaesthetist** separately.
8. The anaesthetist's financial position (owed to you, collected, paid out to you), the flat list of
   unpaid payables (one row per payable, oldest first, kept as "Paid in, due to you" until AA pays
   her), the persistent payment history and the monthly GST report of the payments AA passed on to her
   (cash basis, with each payment's GST) update from the Billing Engine's own ledger, AA's system of record, not from direct Xero queries. Every invoice is a
   ledger pair (a receivable from the payer and a payable to the anaesthetist) created with the invoice;
   payments are recorded in the ledger first, the payables run pays from the payable legs, and Xero
   mirrors both. The office checks on **Admin → Ledger** that receipts held equal payables due plus the
   AA Holding account, and follows up any anaesthetist on its out-of-balance list (catch-up Phase 36).
9. Eligible individual Xero contacts may later be archived to manage active-contact volume. These
   patient and payer contacts carry only the hidden internal ID: no name, NHI or other personal
   information.

### Handoff

The financial episode closes when the receipt and disbursement states are both complete.

### Demo point

For S3, use the selected invoice's combined **Simulate payment and payout** shortcut, then follow its
direct link to the highlighted Web Payments row. Explain that the shortcut combines the two demo
events while the underlying receipt and disbursement states remain separate. For a technical
audience, use a partial payment followed by two payables runs to prove no double payment.
S3 Beat 5 closes on the Ledger: in balance, then a $120.00 receipt that matches no invoice puts it
out of balance (and Dr Souter on the out-of-balance list) until the office allocates it. S3 then ends
on Admin Day's **Reconciliation** card: **Books square**.

### Xero resilience (catch-up Phase 37)

1. Every call to Xero (a hand-off, a payment or disbursement sync, the poll) is written to the **Xero
   sync queue** first. If Xero does not answer, the call waits and retries with growing gaps; the
   Billing monitor shows each waiting call, and **Retry now** retries one at once.
2. Authorising and invoicing carry on during an outage: the invoice and its ledger pair stand, and the
   List reads **Waiting for Xero** until its hand-off lands.
3. When Xero is back, the queue drains in order, with no duplicate pair, contact, receipt or
   disbursement.
4. An invoice voided or edited directly in Xero is found at the daily reconciliation poll and flagged
   on the Billing monitor (**Changed directly in Xero**). The ledger keeps what the engine issued; the
   office records a resolution, which moves no money (provisional: the policy for each mismatch is to be
   agreed with AA).
5. Admin Day's **Reconciliation** card says whether the ledger, its Xero mirror and Xero's bank lines
   agree (**Books square**) or not (**Out of balance**), listing each item to resolve and how long it
   has waited.

Bulk remittances: a hospital that pays several invoices in one deposit is matched in Xero, not by the
engine. Xero's remittance add-on matches each line by the InvoiceNumber it quotes, and the engine learns
each payment through the normal payment webhook. A line Xero cannot match waits in Xero's bank
reconciliation for the office to match there (the demo: **Simulate bulk hospital remittance**, then
**Match in Xero** on the Bank reconciliation tab).

### Source

- RFP: `Payments - Where the Money Lands`
- RFP: `Xero Integration - Candidate Design`
- RFP: `Mobile App Consumption Model`
- Appendix 2
- Prototype: `X1` to `X5`

## Workflow 7a: monthly AA fee invoicing

**Primary actors:** office finance, Billing Engine, Xero, the anaesthetist

### Trigger

Month end: the office runs the month's fee invoices (in the prototype, **Run monthly fee invoices** on
Admin → Billing → AA fee invoices, or the "Run scheduled month-end fee run" demo action).

### Steps

1. The office maintains **AA fee settings**: several fixed items and a charge per BCTI, every amount held
   excluding GST. A change applies from the next run; raised fee invoices keep their settings.
2. For the chosen month the Billing Engine counts each anaesthetist's BCTIs: one per receivable invoice,
   once, against the anaesthetist who did the procedure, in the month its invoice is paid in full. A
   prepayment's payable is not counted (provisional, OQ-29).
3. It raises one **AA-FEE** invoice to each active anaesthetist: the fixed items plus the charge per BCTI
   times the count, with GST worked out at the foot. Each is its own case with a Xero ACCREC against the
   anaesthetist's existing contact and no ACCPAY.
4. The anaesthetist pays it by bank transfer into AA's own account. It is never deducted from a payment
   to them (trust law), and it is not their income, so it never reaches their GST report.
5. Admin and the web **Accounts → AA fees** tab show each fee invoice paid or unpaid.

### Demo point

S3 Beat 4: Seed a month of BCTIs, then Run monthly fee invoices, gives Dr Rutherford $500 + $5 x 40 =
$700.00 before GST ($805.00 with GST). The fixed schedule, the paid-only count and BCTI granularity are
with AA's accountant.

## Workflow 8: handle failures, late additions and compliance

**Primary actors:** Office exception operator, Billing Engine and integration automation

**Prototype readiness:** Ready. Audit, NHI validation, master controls and the full
exception/payment/integration workflows (Phases 09 to 11) are built.

### Cases

#### Pre-payment

- A Procedure on a prepaid Contract (Patient › Payment type: Prepaid, picked by the office) needs the
  price paid before the procedure, in full. The invoice goes to the Procedure's payer: one prepayment
  invoice per payer, each payer locked once theirs is raised.
- The amount is the Procedure's price when the invoice is raised, read-only after; or an amount the
  office types on No contract · Fixed price.
- The office approves and sends it from Admin Invoices (a switchable step, on by default). The invoice's
  pair credits the AA Holding account, not the anaesthetist.
- The AA Holding account is a payables creditor, kept like an anaesthetist's account. It is not a bank
  account (the money itself sits in the trust bank account) and not a Xero ledger account, and it is
  never paid itself. Money leaves it only by a transfer or a refund the system raises (the refund is
  Phase 41).
- Two steps, and the anaesthetist is paid only after the second:
  1. **Collected into the AA Holding account.** The payer's money lands; the payable to the AA Holding
     account is authorised for what was received, and nothing is paid to the anaesthetist. The Billing
     monitor's **AA Holding account** card shows the balance and a Received entry. The payables run
     pays nothing.
  2. **Transferred at authorisation.** When the office authorises the List, the system writes a
     transfer from the AA Holding account to the anaesthetist who did the List, with no office step: a
     Transferred entry on the card, the balance falls, and the Xero simulator shows a manual journal on
     the prepayment pair. No new invoice or payment appears and GST does not move. The next payables
     run pays the anaesthetist. The trigger is provisional (OQ-125: authorisation, or "confirmed and
     submitted"); the payment itself is made in Xero (OQ-111).
- Money paid after the transfer goes straight to the anaesthetist's payable, released exactly as it
  arrives. A part-paid prepayment moves in full at authorisation and is released as money arrives.
- Two payers on one Booking: two prepayment invoices, each with its own payable to the AA Holding
  account and its own transfer.
- An unpaid prepayment never blocks (AA's decision, OQ-57): a warning that turns strong as the date
  nears, so the anaesthetist sees it before surgery starts. There is no override.
- After the procedure it is left off the final invoice with nothing deducted. A move to a colleague
  changes nothing in the books: nothing is repointed, the transfer pays whoever did the List, and the
  old anaesthetist never sees it.
- A prepayment's payable is not counted as a BCTI for AA's monthly fee (provisional, OQ-29).

#### Warnings and the to-do list

- One warning routine checks each Booking and raises warnings, each with its own text, a kind
  (before or after the procedure) and a strength (mild or strong). A Booking can carry several.
- A warning never blocks: saving, completing, submitting and authorising all go through, and there
  is no confirm step at submit.
- The anaesthetist sees a small triangle on the Booking's row and the warning at the top of the
  Booking when they open it. The office sees the same triangle, the Day view outline down to the
  Booking, and the **To-do** card on the Admin dashboard.
- The office clears a warning from the To-do card once it is dealt with (a mild one optionally); the
  clearance is recorded and audited, and the Booking shows who cleared it and when.
- The to-do list holds warnings that need action only. Notices that need none go to the shared
  notification pool when it is built.
- The rules today: the unpaid prepayment (strong), base units outside the range, a child as the payer
  on the Booking (catch-up Phase 21) and an insurer named with no approval number (catch-up Phase 21,
  NIB or Southern Cross Health Society only, never ACC or Health NZ), all mild but the first. Later
  rules add a prepaid procedure with no price and a paying patient with a balance. There is no warning
  for an insurer named without an insurer Contract.

#### Booking setup: the payer and the insurer or funder (catch-up Phases 21 and 22a)

- Every Procedure names a payer: the patient, prefilled from the patient record, with no step
  taken. The office and the anaesthetist change it in **Paid by** (a bottom sheet on the phone, a
  dialog on web) until the List is AUTHORISED; the change is offered to the Booking's other
  Procedures with the same payer, and a Procedure added later copies the payer the others share.
  One invoice and one prepayment invoice per payer.
- A billed payer needs an email or an NZ Post postal address. The Paid by sheet asks; Review flags
  **Email or postal address needed**; nothing blocks.
- The Booking's **Insurer or funder** row (empty state "None") holds the insurer or funder (a Party) and the approval number,
  from the source data where an intake path carries them (the hospital matching screen, Phase 33) or
  recorded by the office; the anaesthetist sees the number and can enter it on the day. The funder
  marks one path **Suggested** on the step rail and never narrows it.

#### Profile and bank details (catch-up Phase 26)

- Each anaesthetist's profile holds their rate per unit (the dollar value of one RVG unit), phone,
  email, registration number, HPI CPN and bank account.
- The anaesthetist sees it on the mobile More tab (the Profile card) and on the web Profile page,
  opened from their name and avatar in the top nav. They edit only their own rate per unit
  (**Change**, a bottom sheet on the phone): the new rate applies to Bookings on Lists not yet
  authorised, and authorised Lists keep their locked rate.
- Contact details, the HPI CPN and the bank details are held by the office and show read-only with a
  lock; the bank number is always masked (Dr Souter's 99-0101-•••••21-00).
- The office keeps every profile on the Admin anaesthetist record (Master data, Anaesthetists, open a
  row: **Edit details**) and in the Anaesthetists table, the GST number with it. The HPI CPN and bank
  details are mandatory: an add or edit without either is refused. Every change is audited, the bank
  number masked in the audit too.
- Bank details are display-only master data. The payment to the anaesthetist is made in Xero; the app
  never pays from them.

#### Post-operative addition

- A later pain consult or ward review can create another charge.
- The original authorised Booking stays immutable and locked.
- The office, or the anaesthetist on their own invoiced Procedure (found through search), records a
  free-form additional invoice as an event on the Procedure, to whoever should pay.
- One office review step approves it; it is then invoiced in the next billing run, with its own number,
  pair and Xero pair, linked both ways to the original.
- After a prepaid or fixed-price procedure nothing is billed automatically; the anaesthetist or office
  raises an additional invoice by hand.
- The anaesthetist's own pre-op and post-op events come with catch-up Phase 39b.

#### Billing failure

- The run prices only from the lock, so a Contract edit cannot fail it; what can still fail is outside
  the lock, such as the Xero hand-off.
- Failure is per Booking and a List never fails as a whole (OQ-05, answered): the failed Booking is held
  back (a split Booking's invoices with it) while the rest of the List bills.
- A failed hand-off waits in the Xero sync queue, which retries it by itself; the office can use
  **Retry now** on its queue row. A failed billing run keeps the booking row's **Retry**, which rebuilds
  from the lock. On the Billing monitor, **Problems only** narrows the list to just these. The fix never edits a Contract or any other master; a wrong price after
  invoicing is corrected by a credit note and rebill (a later build).

#### Row the office cannot match

- An unmatched row, or one with no NHI, waits in the unmatched queue; nothing is dropped.
- A row with no NHI that names a List places a stub on that List: the case as received, marked waiting
  at intake, never a Booking, never counted and never blocking submit or authorise. Adding the NHI on
  Matching creates the Booking in the stub's place; rejecting the row removes the stub (our reading, to
  confirm with AA).
- A duplicate row is skipped.
- A later update waits for approval, matched by date, surgeon, hospital and session.
- A Booking moved to another day arrives as a cancellation plus a new Booking.
- A row for a submitted List can still be applied by the office; a row for an authorised List cannot
  be applied.

> **Future scope:** automatic hospital sync and automated hospital changes are Future Work. HL7 v2
> messaging, where a malformed message retries and then dead-letters to manual intervention without
> being lost, is Future scope, shown only on **Demo: Future scope, HL7 and FHIR** (`/demo/integrations`).

#### Compliance

- All changes, including automated ones, are audited.
- Both old and new NHI formats are validated.
- No NHI or other personal information enters Xero, patient names included (confirmed with AA).

## Workflow-to-prototype readiness

| Workflow | Ready now | Built in |
|---|---:|---|
| Fixed canvas and recurring bookings | Yes | Phase 02 |
| Manual phone booking and office changes | Yes | Phase 06 |
| Mobile/web manual Booking creation | Yes | Phases 03 to 05 |
| Anaesthetist's own List move, the notification pool, and office List reassignment | Yes | Phases 28, 32 |
| Single-Booking moves and the doer rule | Yes | Phase 32a |
| BTM capture, completion and submit | Yes | Phase 04 |
| Office review and authorisation | Yes | Phase 07 |
| Invoice calculation and documents | Yes | Phase 08 |
| Pre-payment from a prepaid Contract: one invoice per payer, approve and send (switchable), escalating warning, left off the final invoice | Yes | Catch-up Phase 27 |
| Prepayment held in the AA Holding account, transferred to the anaesthetist when the List is authorised, then paid by the payables run | Yes | Catch-up Phase 27a |
| Prepayment warning, events and additional invoices, billing monitor/retry | Yes | Phase 09; events and additional invoices from catch-up Phase 38b |
| Contract locked at authorise, invoices from the lock, Contract history | Yes | Catch-up Phase 25 |
| Xero pairs, payment, balances and disbursement | Yes | Phase 10 |
| Xero resilience: payables run in Xero, sync queue and outage, voids and edits flagged, bulk remittance matched in Xero, Reconciliation card; Billing monitor grouped by anaesthetist with filters | Yes | Catch-up Phase 37 |
| Internal ledger with in-balance view (whole ledger, one anaesthetist, the out-of-balance list) | Yes | Catch-up Phase 36 |
| Anaesthetist profile, rate per unit and bank details | Yes | Catch-up Phase 26 |
| AA's monthly fee invoices (settings, run, AA fees tab) | Yes | Catch-up Phase 16 |
| Hospital import and matching screen | Yes | Catch-up Phase 33 |
| The rooms' PDF lists through matching, and where a List came from | Yes | Catch-up Phase 34 |
| HL7/FHIR ingestion and monitoring | Future scope | Phase 11 (simulator only; its own demo surface from catch-up Phase 34) |
| Scenario jump controls and guided script | Yes | Phase 12 |
| Mobile atmospheric gradient (visual only) | Yes | Phase 13 |
