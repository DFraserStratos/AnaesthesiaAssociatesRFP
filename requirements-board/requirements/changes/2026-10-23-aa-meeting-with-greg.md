# Requirements update, 2026-10-23: AA meeting with Greg (filed 4 November)

This update files the 23 October session with Greg. It was missed when the catalogue was updated from
the 27 and 28 October meetings (commit 7cd78025), so it is recorded after them. The meetings built on
each other in the order 23, 27, 28 October, and the later meeting wins wherever they differ.

On 23 October Donald and Greg worked through questions 93 to 116, then read epic 4 (Contracts) on the
board. At the whiteboard they reached a shared view of a Contract as the whole price list, with each
row a Contract line. The 27 October meeting overturned nothing from 23 October. The 28 October meeting
went back over several 23 October topics without knowing they had been covered. So its records call
some 23 October rulings open, and credit some 23 October rulings to 28 or 29 October.

Donald's rulings for this update (4 November, note points 87 to 90):

- **Held models.** Greg's Contract model (Contract, Contract line, header settings and dates) and
  payment model (Xero, the two ledgers, the trust and AA Holding accounts) are a proposal held lightly.
  No requirement is changed to describe, extend or remove them, and nothing commit 7cd78025 put in is
  reverted. The removals Donald and Greg agreed on 23 October inside the Contract model are held too
  (point 88).
- **Invoice description (OQ-103).** It starts as the rooms' description. The hospital's description
  replaces it when one arrives, and the chosen Contract line's invoice description replaces that where
  one is filled in. AA admins can edit it at any time, as free text (point 87).
- **AR-44** shows the holder kind as "Surgeon", not "Surgeon or rooms" (point 89).
- **Board answer dates.** Donald's board answers to OQ-101, OQ-113 and OQ-116 are dated 23 October,
  the date they were given in the meeting. 29 October was when the requirements were updated
  (point 90).

## 1. Inputs

- Note: [AA meeting with Greg, 23 October](../notes/2026-10-23-aa-meeting-with-greg.md), artifact
  [AR-55](../artifacts/AR-55.md), 90 points. Points 1 to 86 are the meeting. Points 87 to 90 are
  Donald's decisions of 4 November.
- Transcript:
  [AA Meeting with Greg 23rd Oct Reconciled Transcript](../artifacts/files/AA%20Meeting%20with%20Greg%2023rd%20Oct%20Reconciled%20Transcript.md),
  artifact [AR-54](../artifacts/AR-54.md). Its region `contract-is-the-document` marks where Donald
  and Greg agree what a Contract and a Contract line are.
- Checked against the 27 October and 28 October (A and B) transcripts, their notes, and commit
  7cd78025.

## 2. Questions

| Question | Change | Sources |
|---|---|---|
| [OQ-103](../questions/OQ-103.md) Which description goes on the invoice | **Answered (4).** It uses Donald's order of defaults (point 87), the three layers Greg proposed on 23 October. | #3 #16 #47 #87 |
| [OQ-110](../questions/OQ-110.md) Internal booking model | **Answered (4).** The choice is left to the development team, and Greg backs the canonical model from our RFP response. | #7 |
| [OQ-93](../questions/OQ-93.md) Insurance on the Booking | Update for 23 October: insurance does not narrow the Contract list, and the approval number is the design's acceptance reference. The missing approval number is the only insurance warning, shown to the office and to the anaesthetist viewing the Booking. Owner is now "Donald to ask AA". It stays open for the 28 October matter of whether the anaesthetist sees the number itself. | #1 #14 #15 |
| [OQ-100](../questions/OQ-100.md) | Owner is now "Donald to ask Ben and Vanessa". Update for 23 October added. Stays open. | #31 #37 #81 |
| [OQ-114](../questions/OQ-114.md) | Update for 23 October: nib is the only insurer AA bills directly, through a portal. How invoices get into the portal is not known. Stays open. | #10 |
| [OQ-101](../questions/OQ-101.md), [OQ-113](../questions/OQ-113.md), [OQ-116](../questions/OQ-116.md) | Board answers re-dated to 23 October, with Donald's words from the meeting. OQ-116 also records that the 23 October meeting named the Booking with both prepaid and not-prepaid Procedures. | #2, #9, #12, #90 |
| [OQ-105](../questions/OQ-105.md), [OQ-106](../questions/OQ-106.md), [OQ-117](../questions/OQ-117.md), [OQ-96](../questions/OQ-96.md) | 23 October source added, with one sentence each on what was said then. Answers unchanged. | #5, #6, #13 |

## 3. Items changed

**Requirement changes**

| Item | What changed | Sources |
|---|---|---|
| [US-08.4.6](../stories/US-08.4.6.md) Invoice description on each Procedure | Rewritten to the order of defaults and the admin's free-text edit. The RVG code plays no part. New criteria cover each layer and the fallback to the rooms' text. Proposed (1) to **Agreed (4)**. | OQ-103, #3 #16 #47 #87 |
| [US-03.1.9](../stories/US-03.1.9.md) | What the invoice prints now follows the same order. The "open (16 October)" note is now the answer. Status unchanged (2). | #3 #87 |
| [US-04.2.4](../stories/US-04.2.4.md) | Only the line description bullet changed: a Contract line's invoice description, where filled in, becomes the Procedure's invoice description. Nothing else in the held Contract line model changed. | #47 #87 |
| [domain-model.md](../domain-model.md) | Invoice description in the Procedure section, the glossary and the Contract line table row now follows the same order. Insurance does not narrow the Contract list; the "insurer will pay, no insurer Contract" warning is removed; the acceptance reference is the approval number. | #1 #87 |
| [US-11.4.3](../stories/US-11.4.3.md) Insurer and approval number | The missing approval number warning shows to the office and to the anaesthetist viewing the Booking, and is the only insurance warning. Insurance does not narrow the list, and the acceptance reference is the approval number. Two new criteria. Status unchanged (3). | #1 #14 #15 |
| [US-07.2.2](../stories/US-07.2.2.md) Office review | Removed the warning and criterion for a Booking that names an insurer but has no insurer's Contract (draft design, 7 October, "TBC" in v6). Donald and Greg dropped it on 23 October: "We've said that doesn't matter at all". Status unchanged (4). | #1 |
| [US-13.7.1](../stories/US-13.7.1.md) Warnings | The same warning is replaced in the list by the missing approval number warning. | #1 |
| [US-04.3.2](../stories/US-04.3.2.md), [US-04.2.1](../stories/US-04.2.1.md), [FT-11.2](../stories/FT-11.2.md) | Narrowing by insurance is no longer "open". US-04.3.2's notes also record Donald's tentative "show the whole list" override (notes only). | #1 #18 |
| [US-14.2.1](../stories/US-14.2.1.md) Internal booking model | No longer "not yet decided": left to the development team (OQ-110). | #7 |
| [US-01.4.5](../stories/US-01.4.5.md), [US-05.1.1](../stories/US-05.1.1.md), [US-05.1.5](../stories/US-05.1.5.md), [US-03.3.1](../stories/US-03.3.1.md), [US-08.2.2](../stories/US-08.2.2.md) | Board answers to OQ-113, OQ-101 and OQ-116 re-dated to 23 October. US-08.2.2 also records the 23 October exchange on the mixed Booking. Its 29 October typed decision on the multi-procedure reduction keeps its date. | #2 #9 #12 |
| [US-05.4.2](../stories/US-05.4.2.md) | Notes: on 23 October Donald and Greg agreed the office can change any price, a fixed price included ("Lock that down if it gets too loose later"). | #44 |
| [AR-02](../artifacts/AR-02.md) | Diagram, region note and description: the invoice description's order of defaults, and insurance does not narrow the list. The diagram's "Changing a prepaid price is open (OQ-96)" (from 28 October) is not changed. | #1 #87 |
| [OQ-93](../questions/OQ-93.md), [OQ-55](../questions/OQ-55.md) | Stale "still open" lines in the answers now say what 23 October answered. | #1 |
| [US-02.5.7](../stories/US-02.5.7.md), [US-08.4.6](../stories/US-08.4.6.md) | US-02.5.7 gives the order of defaults instead of "is OQ-103". US-08.4.6's notes point to OQ-130. | #87 |
| [US-04.3.2](../stories/US-04.3.2.md) | Notes: suggesting the Contract from booking history, recorded as an idea for later, as Donald asked. | #36 |
| [US-07.2.2](../stories/US-07.2.2.md) | Notes: Greg was unsure whether every hospital acts as the insurer's agent ("I don't think Christchurch acts as an insurance agent. They might, not sure"). | #15 |
| [US-05.3.1](../stories/US-05.3.1.md) | 23 October source added for the Booking with both prepaid and not-prepaid Procedures. The 29 October typed decision keeps its date. | #12 |
| [AR-44](../artifacts/AR-44.md) | Diagram and region note: holder kind "Surgeon or rooms" became "Surgeon". 23 and 28 October sources added. | #33 #42 #89 |

**Sources only (provenance, no wording change):** [EP-04](../stories/EP-04.md),
[FT-04.3](../stories/FT-04.3.md), [US-04.1.5](../stories/US-04.1.5.md),
[US-04.2.8](../stories/US-04.2.8.md), [US-04.2.11](../stories/US-04.2.11.md),
[US-04.2.14](../stories/US-04.2.14.md), [US-04.3.3](../stories/US-04.3.3.md),
[US-06.5.4](../stories/US-06.5.4.md), [EP-11](../stories/EP-11.md), [FT-11.4](../stories/FT-11.4.md),
[US-11.4.1](../stories/US-11.4.1.md) (retired), [US-13.4.1](../stories/US-13.4.1.md),
[US-01.3.6](../stories/US-01.3.6.md), [US-01.4.2](../stories/US-01.4.2.md),
[US-01.4.7](../stories/US-01.4.7.md), and the domain model's Contract holder table. Several of these
first said on 23 October what 7cd78025 credited to 28 October.

No item was added, retired or moved. The link pass added 16 links across 14 files in the touched epics.

## 4. New questions

| Question | Why |
|---|---|
| [OQ-130](../questions/OQ-130.md) Does a later default replace an admin's edited invoice description | The order of defaults doesn't say what happens when the hospital's description, or a Contract line, arrives after an admin has edited the text. |

## 5. Points with no requirement change

- **Held Contract model** (points 5, 24 to 30, 38 to 69, 70 to 77, 80, 85): recorded in the note only.
  This covers Contract versus Contract line, where the surgeon link sits, how many anaesthetists a
  Contract serves, dated versions, add-ons, combinations and prepaid settings.
- **Held removals** (points 27, 43, 45, 48, 49; point 88): the review date, base or modifier units on a
  line, the insurer member number, the line key sentence, and no uniqueness check on holder codes.
  These are Donald's 23 October rulings, waiting for the Contract model to settle. OQ-66 is unchanged.
- **Held payment model** (points 8, 11, 19 to 21): Xero paying, the two ledgers and the AA prepayments
  account. 28 October corrected the last: the AA Holding account is a creditor, not a Xero account.
- **Superseded by 27 or 28 October:** OQ-104, the prepaid price (Ben, 27 October, point 4). The
  automatic invoice for a prepaid difference (point 13): Ben, 28 October, decided exceptions are
  raised by hand. Point 75, the anaesthetist's own list: OQ-117, 29 October.
- **Recorded only:** points 2 (OQ-101, deferred to Ben), 78 (questions passed over), 82 (OQ-108, still
  open after 27 October), 83, 84 and 86.

## 6. Left for Donald

Flags on the later records. The 27 and 28 October notes and their change log are append-only, so the
23 October note carries each correction.

- The 28 October note (#4 #41 #42), OQ-93's 28 October update and that change log call some insurance
  points open that 23 October had settled, including where the warning shows.
- The 28 October note #7 and OQ-116's update say the mixed Booking was not named. It was named on
  23 October (L440-446).
- The 28 October note #8 says the refund route through Xero was not discussed. It was discussed on
  23 October (L367-386).
- The 28 October note #2 and #99 do not name the "previous conversation" behind OQ-117. It was
  23 October, L398-436.
- The 28 October note #29 does not say Donald asked for the AR-44 visual on 23 October (L623).
- EP-04's change from "a surgeon or surgeon's rooms" to "a surgeon" went in with 7cd78025 but is in no
  change record.
- One Contract for many surgeons is credited to Donald's typed decision of 29 October in OQ-105, the
  28 October change log and six items. Greg agreed to it on 23 October (L194-200). OQ-105 now carries
  the 23 October source; the item wording is held.
- The 27 October note #2 and #4 leave out Greg's 23 October agreement to the honoured price
  (L469-471), and Donald's "do both" on OQ-108 (L240).

Still to settle, with the Contract model:

- Where the surgeon link sits (on the Contract, as on 23 October, or on the holder, as in 7cd78025),
  and whether a Contract may serve more than one anaesthetist.
- US-04.2.14 and US-04.2.10 are still Agreed (4), though on 23 October Donald said "just not agreed"
  and "let's leave that open".
- A Contract line covers one procedure, not a group of procedures (point 38). The wording is ready to
  apply if Donald releases it.

Other points for sign-off:

- US-07.2.2 was Agreed (4) when its insurer warning was removed. The removal follows 23 October and
  nothing later brings the warning back. AA has not been asked.
- US-07.2.2's checklist line "whether a Procedure needs an insurer's Contract" was kept, because it
  is the office's own judgement and not a system check.
- OQ-109: on 27 October Ben named Forte as one of the two integrated hospitals, which does not match
  St George's and Southern Cross. Still to resolve with AA.
