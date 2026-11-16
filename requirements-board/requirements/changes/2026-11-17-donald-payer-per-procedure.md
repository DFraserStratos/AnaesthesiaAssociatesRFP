# Requirements update, 2026-11-17: a payer on each Procedure

Donald decided, while reviewing the prototype's Booking screens, that the payer is held on each
Procedure rather than once on the Booking, following Greg's technical design v6. Two Procedures on one
Booking can now bill two different people. The decision is Donald's, for the build, and not yet
confirmed by AA, so the stories whose rules changed go from Agreed to Verify, and a new question asks
AA to confirm.

The main changes:

- **The payer is on each Procedure** ([US-11.2.2](../stories/US-11.2.2.md), retitled "Payer on each
  Procedure, editable to a guardian"). It is filled in from the patient. Changing one Procedure's payer
  offers the same change on the Booking's other Procedures billing that payer, each ticked by default.
  A Procedure added later copies a payer the others share. The payer shows in the Procedure's "Paid by"
  only where its Contract bills the payer, and reads "not billed yet" before a Contract is chosen.
- **Invoices and prepayments group by payer.** Procedures billing the same payer share one invoice. A
  payer typed in separately has their own invoice, never matched on name or email. There is one
  prepayment invoice per payer, and each payer is locked once their own is raised.
- **A split can name another person** ([US-08.2.3](../stories/US-08.2.3.md)), such as a second parent.
  The under-18 warning applies only to a share billed to the patient, the only one whose age is known.
- **The contact rule and the child warning apply per Procedure** billed to the payer. The dashboard
  to-do list holds one child warning per Booking.
- **Unchanged:** the insurer or funder and the approval number stay on the Booking and never decide who
  is invoiced ([US-11.4.3](../stories/US-11.4.3.md)).

In all, 25 items changed, none were added or retired, and 4 moved from Agreed (4) to Verify (3). One
question was added (OQ-140). The domain model was updated, and the note was registered as AR-66.

## 1. Inputs

- Note: [Donald payer per procedure](../notes/2026-11-17-donald-payer-per-procedure.md), artifact
  [AR-66](../artifacts/AR-66.md), 11 points. Cited as "Notes 2026-11-17 · Donald payer per procedure #n".
- Donald's typed answers in a question-and-answer session with Claude; nothing recorded or transcribed.
- Board answers: the repo had uncommitted rewrites of 14 questions (OQ-12, OQ-13, OQ-29, OQ-47,
  OQ-60, OQ-73, OQ-83, OQ-95, OQ-97, OQ-102, OQ-109, OQ-114, OQ-125, OQ-126) from another session.
  They are not part of this update and were left untouched.

## 2. Questions answered

None.

## 3. Items changed, added, retired or moved

Status is shown before and after. Sources are the note's points.

| Item | Title | What changed | Status | Sources |
| --- | --- | --- | --- | --- |
| [US-11.2.2](../stories/US-11.2.2.md) | Payer on each Procedure, editable to a guardian | Rewritten and retitled: the payer on each Procedure, the change offered to the others, a later Procedure copying a shared payer, "Paid by" only where the Contract bills the payer, "not billed yet" before a Contract. Six labelled criteria. Technical discussion: v6 held these fields on the booking procedure, as the catalogue now does. | 4 → 3 | #1 #2 #3 #4 #7 #8; OQ-140 |
| [US-11.2.3](../stories/US-11.2.3.md) | Payer email or postal address required when the payer is billed | The rule applies to each Procedure billed to its payer, shown in that Procedure's "Paid by". New criterion: a Procedure billed to a holder on the same Booking asks for nothing. | 4 → 3 | #7 #9 |
| [US-11.2.4](../stories/US-11.2.4.md) | Warn when a child is the payer on a Procedure | Retitled. The warning shows on each Procedure billed to the patient as payer, as "Under 18" in "Paid by". One to-do per Booking. | 4 → 3 | #7 #9 |
| [US-13.7.1](../stories/US-13.7.1.md) | Warning routine | The child-payer warning is raised per Procedure, with one to-do per Booking. | 4 → 3 | #9 |
| [US-11.2.1](../stories/US-11.2.1.md) | Patient billed when the Contract does not bill its holder | Wording: the Procedure's payer. | 3 | #1 |
| [FT-11.2](../stories/FT-11.2.md) | Who is billed: holder or the Procedure's payer | Retitled; theme reworded. | 3 | #1 #7 |
| [EP-11](../stories/EP-11.md) | Patients and billable parties | Theme: each Procedure names a payer; the insurer or funder stays on the Booking. | 3 | #1 #10 |
| [US-08.2.3](../stories/US-08.2.3.md) | Split one Procedure's fee between two payers | Split from "Paid by"; a split can name the Procedure's payer, the Contract's holder, another Party or another person. New criterion "Another person". | 3 | #6 #7 |
| [US-08.2.1](../stories/US-08.2.1.md) | Group by billable party | One invoice per payer; a separately typed payer is invoiced separately. Three criteria added. | 3 | #1 #4 |
| [US-08.1.1](../stories/US-08.1.1.md) | Process an AUTHORISED List using each Procedure's locked Contract | Who is billed: the holder or the Procedure's payer; one invoice per payer. | 1 | #1 #4 |
| [US-08.4.2](../stories/US-08.4.2.md) | Send to the invoice email | Sent to the Procedure's payer; Procedures with the same payer go on one invoice. | 3 | #1 #4 |
| [US-06.3.1](../stories/US-06.3.1.md) | Raise the prepayment invoice | One prepayment invoice per payer; each payer locked once theirs is raised. Criteria "One per payer" and "Payer locked". | 3 | #1 #5 |
| [US-06.2.1](../stories/US-06.2.1.md) | Detect prepayment requirement | Each prepaid Procedure's prepayment goes to its own payer. | 3 | #1 #5 |
| [FT-06.2](../stories/FT-06.2.md) | Prepayment trigger and amount | Theme reworded. | 3 | #5 |
| [US-06.5.1](../stories/US-06.5.1.md) | AA Holding account | The pair's receivable is from that invoice's payer. | 3 | #5 |
| [US-09.1.3](../stories/US-09.1.3.md) | Prepayment invoices also paired | Wording: the prepayment invoice's payer. | 4 | #5 |
| [US-07.2.2](../stories/US-07.2.2.md) | Office review of Contracts and references | Review shows each Procedure's payer in its "Paid by"; the child warning per Procedure. | 3 | #1 #7 #9 |
| [US-03.4.1](../stories/US-03.4.1.md) | Anaesthetist can change the Contract | Wording in one criterion. | 3 | #1 |
| [EP-04](../stories/EP-04.md) | Contracts | Wording: bills its holder or the Procedure's payer. | 3 | #1 |
| [US-04.1.1](../stories/US-04.1.1.md) | Typical Contract arrangements | Wording in the who-is-billed table. | 3 | #1 |
| [US-04.1.5](../stories/US-04.1.5.md) | Parties | Wording; a Procedure's payer is not a Party. | 3 | #1 |
| [US-04.2.1](../stories/US-04.2.1.md) | Holder, who is billed, and where a Contract is offered | Wording. | 3 | #1 |
| [US-04.2.2](../stories/US-04.2.2.md) | Pricing kinds | Wording in Notes. | 3 | #1 |
| [US-04.2.14](../stories/US-04.2.14.md) | Anaesthetist's own price list Contracts | Wording. | 3 | #1 |
| [US-04.3.3](../stories/US-04.3.3.md) | No contract · RVG | Wording. | 3 | #1 |
| [domain-model.md](../domain-model.md) | Domain model | The payer moves to the Procedure throughout: the §1 table, the diagram (`BOOKING_PROCEDURE }o--|| PAYER`), the Booking and Procedure sections, billing context, patient, payer and billable party, prepayment, and the glossary (Payer, Billable party, Prepayment and others). | | #1 to #11 |

The links pass over EP-04, EP-06, EP-07, EP-08, EP-11 and EP-13 added 13 verified links, with no
change to any rule: text links in EP-11, US-04.2.15, US-04.3.2, US-06.2.2, US-11.2.2, US-13.2.2 and
US-13.4.3, and related pairs on US-06.3.1, US-08.2.3, US-11.3.2 and US-13.2.4.

Screenshot captions that still say "payer on the Booking" (US-11.2.1, US-08.4.2 and others) were left
alone: the capture runner rewrites them when the screens are next captured.

## 4. New questions

- [OQ-140](../questions/OQ-140.md), A payer on each Procedure (Open, Donald to ask AA (Greg)): do two
  Procedures on one Booking ever need different payers, and is offering the change to the other
  Procedures right? Point #11.

## 5. Points with no requirement change

| Point | Why |
| --- | --- |
| #10 | The insurer or funder already sits on the Booking and never decides who is invoiced; EP-11's theme now says so. |
| #11 | Raised as OQ-140. |

## 6. For the next update

- [US-08.2.2](../stories/US-08.2.2.md) speaks of "the final invoice" in the singular. A Booking can now
  have one final invoice per payer; its criteria hold for one payer.
- [US-06.3.5](../stories/US-06.3.5.md) says "a Booking's Procedures, Contract or payer change"; read the
  payer as each Procedure's.
- [US-08.4.2](../stories/US-08.4.2.md) only emails the payer; posted invoices wait on OQ-122.
- [US-03.2.3](../stories/US-03.2.3.md) (add additional Procedures) could link to the copy-the-payer rule
  in US-11.2.2.
- Older questions (OQ-54, OQ-67, OQ-73, OQ-78, OQ-105, OQ-114) and diagrams (AR-01, AR-02, AR-44 and
  others) still say "payer on the Booking". They are history, or are being rewritten by another session.
  Redraw AR-44's payer box when OQ-140 is answered.
