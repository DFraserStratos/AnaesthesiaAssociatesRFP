# Requirements update, 2026-11-10: the meeting with AA's accountant

Greg, Sam, Ben and Donald met Michael, AA's accountant, on 10 November to start on the money half of
the system: how an invoice becomes cash in the trust account and a payment to an anaesthetist, and
the controls around it. Little was decided. Greg and Sam are now drawing a process map and T-accounts
for each use case (standard invoice, prepaid invoice, roll-backs and adjustments) for Michael to
check, in about a week; those maps, not this meeting, will settle the posting design. This update
records what the meeting said against the items it bears on, without changing their rules, adds one
story, and redraws the trust account diagram.

The main changes:

- **The trust account diagram (AR-63) is redrawn.** Its Sales account was credited by every invoice
  and never cleared. In Greg's model each invoice and its bill post through a **clearing account**
  that should always read zero, and the bill comes into Xero with the invoice. The redraw adds the
  bank feed and the daily matching as separate steps, moves the balance check before the payout, and
  pays Dr Nick and Dr Ben in one weekly payment run approved by a director. The AA Holding account's
  bill is drawn posting with the prepayment invoice (Donald's choice, as OQ-80 has it; the whiteboard
  drew it on receipt).
- **New story US-13.2.4, Reconciliation status at a glance** (Proposed): one status on the admin
  dashboard saying whether every account that should balance does, with unresolved items listed and
  their age.
- **Notes, sources and technical discussion** on seven stories and two questions; one wording change
  to a description (US-06.5.1 no longer calls the move from the holding account "a journal
  transfer").

In all, 7 items changed and 1 was added; 2 questions changed and none were added. AR-63 was redrawn,
and the transcript and note were registered as AR-64 and AR-65.

## 1. Inputs

- Note: [AA meeting with accountant](../notes/2026-11-10-aa-meeting-with-accountant.md), artifact
  [AR-65](../artifacts/AR-65.md), 29 points. Cited as "Notes 2026-11-10 · AA meeting with accountant #n".
- Transcript:
  [AA Meeting with Accountant 10th Nov Reconciled Transcript](<../artifacts/files/AA Meeting with Accountant 10th Nov Reconciled Transcript.md>),
  artifact [AR-64](../artifacts/AR-64.md), reconciled from three automatic transcriptions (the audio is
  not in the catalogue). Cited as "Transcript 2026-11-10 · AA meeting with accountant L<n>-<m>".
- No board answers: the repo had no question changes before this run.

## 2. Questions answered

None. Two questions gained a 10 November paragraph:

- [OQ-47](../questions/OQ-47.md), weekly payment cycle (stays Proposed): Michael wants more time
  before payment and suggested Thursday; Greg's proposal moves to a Monday to Sunday week, reconciled
  from Monday, paid Thursday, with nothing carried forward. Not agreed. Points #1 #17.
- [OQ-29](../questions/OQ-29.md), GST agency treatment (stays Open): Greg again has the bill as the
  buyer-created tax invoice, loaded as a matching pair; Michael: "a bill in Xero really equals
  accounts payable". The agency questions were not put to him. Points #5 #9.

## 3. Items changed, added, retired or moved

The last row is the redrawn diagram, an artifact rather than an item, so it is not in the counts.

| Item | Title | What changed | Sources |
| --- | --- | --- | --- |
| [US-13.2.4](../stories/US-13.2.4.md) | Reconciliation status at a glance | **New**, Proposed (1). A reconciliation status on the admin dashboard; unresolved items listed with amount and age. | 2026-10-28 #64; 2026-11-10 #7 #8 #13 #17 #19 #20 |
| [US-06.5.1](../stories/US-06.5.1.md) | AA Holding account | Description drops "a journal transfer" (the move is "an accounting move, not a payment"). New Technical discussion: how Xero posts the move is open (journals can't easily be raised through the API); the other ways weighed; a posted holding bill shows in bills to pay; if it posts with the invoice, Xero's creditor balance counts prepayments invoiced, not only received. Notes: 10 November quotes. Status stays Verify (3). | #10 #11 #12 |
| [US-08.3.1](../stories/US-08.3.1.md) | Linked receivable and payable pair | Technical discussion: the clearing account posting design. Notes: the bill as the buyer-created tax invoice. | #8 #9 |
| [US-09.1.1](../stories/US-09.1.1.md) | Invoice pair creation and identification | Technical discussion: in Xero a posted bill is an approved bill; a draft does not clear the clearing account; an approved bill could be paid early; a bill paid by hand needs repair. Notes. | #8 #10 #26 |
| [US-10.1.1](../stories/US-10.1.1.md) | All payments into AA | Notes: every receipt goes through the one trust account; AA has done this before. | #4 |
| [US-10.2.4](../stories/US-10.2.4.md) | Bulk remittance stays in Xero | Technical discussion: the remittance add-on and where unplaced receipts are parked (not settled). Notes. | #6 #14 #19 |
| [US-08.6.2](../stories/US-08.6.2.md) | Credit note and re-issue | Notes: the accountant agrees credit in full and re-invoice is the way; Greg to test in a demo Xero; other adjustments wanted but no case given. | #21 #22 #25 |
| [US-09.4.1](../stories/US-09.4.1.md) | Dedicated Xero organisation | Notes: the trust Xero joins AA's own accounts only at 31 March; Xero as "a cash and banking servant". | #3 #27 |
| [AR-63](../artifacts/AR-63.md) | How money moves through the trust account, step by step | Redrawn: clearing account in place of Sales; bill posted with the invoice; bank feed and matching as separate steps; balance check before the payment run; one batch payment run. Sources add the note and transcript. | #8 #9 #10 #11 #14 #15 #17 #28 |

The links pass over EP-06, EP-08, EP-09, EP-10 and EP-13 added 7 verified links, with no change to
any rule: text links in US-06.3.1, US-08.4.1, US-08.4.6, US-09.1.1, US-09.2.1 and US-13.6.3, and
US-10.1.1 related to US-08.3.4.

## 4. New questions

None, by Donald's choice at the checkpoint. These matters stay open and are left to Greg and Sam's
process maps, recorded in the note and in the items' technical discussion:

- keeping a posted bill from being paid before the payer pays, and repairing a bill paid by hand in
  Xero (#10; US-09.1.1);
- how prepayments are held in Xero and how the move to the anaesthetist posts (#11 #12; US-06.5.1);
- who sends invoices, our system or Xero with its Pay Now link (#5);
- where receipts nobody can place are parked, and the office's steps (#19; US-10.2.4);
- small overs and unders: a rounding account and a threshold (#23);
- adjustments other than credit and re-invoice (#22).

Also left as proposed at the checkpoint, not made: a story for "no payment run without a balanced
reconciliation" (#17; already Greg's ask on 28 October, and drawn in AR-63's balance check), and a
rewrite of the weekly cycle's days in US-10.2.7 (#1).

## 5. Points with no requirement change

| Point | Why |
| --- | --- |
| #1 | Recorded on OQ-47; not settled, so US-10.2.7 keeps its days. |
| #2 | Process: Greg and Sam's process maps, Michael's check, then work items with Donald. |
| #3 | Consistent with US-08.3.2 and US-09.4.1 (AA's system the master); quoted on US-09.4.1. |
| #5 | Not decided; recorded in this log (section 4). |
| #6, #7 | Consistent with US-09.2.1, US-09.2.2, US-10.2.3, US-08.3.5 and US-13.2.1. |
| #15 | Consistent with OQ-111's answer (payments made in Xero); the bulk payment add-on is drawn in AR-63. |
| #16 | Today's controls; context for US-13.2.4 and the payment run. |
| #17 | No story made (section 4); AR-63's balance check and US-13.2.4 carry it. |
| #18 | A clean start at changeover; how old trust balances are closed was not discussed. |
| #23 | Not decided; section 4. |
| #24, #25 | Consistent with US-10.2.1, US-08.2.3, US-08.6.4; #25 quoted on US-08.6.2. |
| #26 | Consistent with US-09.3.1 and US-09.3.2; quoted on US-09.1.1. |
| #28 | Applied to AR-63 (not an item). Greg's request to slow the step-through animation is a board change, outside the catalogue. |
| #29 | A workshop with AA, tentatively 11 December; no requirement. |

## 6. For the next update

US-10.2.7 still has a Friday close and Tuesday payment, and rolls a Monday anomaly into the next
cycle. AR-63's balance check stops the run instead, and Greg now wants no items carried forward
(#1, #17). Rework the days and that criterion when OQ-47 is settled.
