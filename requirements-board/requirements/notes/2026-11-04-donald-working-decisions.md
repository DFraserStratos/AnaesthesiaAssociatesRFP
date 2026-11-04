# Donald's working decisions, 2026-11-04

- **Who:** Donald Fraser (Stratos, product owner), typed in a Claude Code session.
- **Covered:** working answers to the open questions most likely to change the prototype, so the
  prototype can be updated on the current understanding of the requirements and smaller changes made
  later. They came out of a review of every requirement not yet agreed with Greg: of 120 such items
  and 29 open questions, none would change the product's direction, and 32 would materially change one
  feature, coming down to eight decisions. These are those decisions.
- **Standing:** Donald's decisions, made for the build. Greg and AA have not seen them yet, so the
  items they change go to Verify, not Agreed.
- **Inputs gathered here:** Donald's typed decisions, quoted under "Donald's notes" (short enough to
  sit in the note). The review itself was working analysis and is not filed.

Cite a point as `"Notes 2026-11-04 · Donald working decisions #n"`. Points are numbered once across
the whole note.

## Questions answered

1. **OQ-118, a Booking arriving without an NHI: stubs.** Donald: "Yes, we will have stubs." A
   booking that arrives without an NHI shows as a stub on its List, seen by the anaesthetist and the
   office, until the office resolves it. This settles part 2 and is Greg's proposal of 28 October.
   Part 1 (how often this happens, and from where) is still unknown, but nothing hangs on it now.
2. **OQ-119, a prepaid Contract changed after the prepayment is sent or paid: refunded.** Donald:
   "prepaids are assumed to be refunded." The change is handled like a cancellation of the
   prepayment, and the Procedure is invoiced under its new Contract after the procedure, as Donald
   proposed and Greg preferred on 28 October. The sent-but-unpaid case was not stated separately:
   read as following the [refund on cancellation](../stories/US-06.5.2.md).
3. **OQ-121, how and when an event on a Booking is billed: the next run, no waiting.** Donald: "let's
   assume that all invoices are sent on the next run. If they can be bundled, great. If not, it's on
   its own. No waiting." An event marked for invoicing is billed in the next billing run. Where it can
   go on the same invoice as other lines for the same billable party in that run, it does; otherwise
   it is an invoice of its own. It is never held for the Procedure's own invoice.
4. **OQ-128, a surgeon at more than one room: allowed.** Donald: "Our system doesn't need to assume
   a surgeon at one room, we can be more flexible." A surgeon can belong to more than one surgeons'
   room. Which room's contacts apply to a given Booking was not answered; it joins OQ-127.
5. **OQ-111, paying anaesthetists: through Xero.** Donald: "Xero is assumed to handle all payments.
   Our system tracks them." Payments to anaesthetists are made in Xero, and the system records and
   tracks them. This replaces the line on the question that payments are made from the new system.
6. **OQ-93 part 4, whether the anaesthetist sees the approval number: yes, when there is one.**
   Donald: "If we have the insurance number, we can display it." Where a Booking holds an insurance
   approval number, the anaesthetist sees it, as Greg asked on 28 October.
7. **OQ-108, which source starts a booking: both, in the first release.** Donald: "let's make the
   prototype with the assumption that we have both hospital integrations, as well as PDF scanning /
   ingestion." Both intake sources are built: the hospital booking downloads and the surgeons' rooms'
   PDF lists, read and ingested, each landing in the same matching screen. This replaces the 20
   October working rule that the hospital download is the priority and the PDF pathway later. Part 1,
   whether most bookings start at the rooms, no longer decides anything.
8. **OQ-109 part 2, are the two integrated hospitals synced in the first release: yes, assumed.**
   Same words as point 7: "both hospital integrations". Part 1, which two hospitals are integrated
   today (the catalogue says St George's and Southern Cross, Ben named Forte), is still open.

## Donald's notes

9. **The Contract picker: something like the step rail.** Donald: "If I had to guess, the contract
   model will be following something like the step rail in contract-picker-mock." The step rail is the
   default option in the contract picker workshop mock (`contract-picker-mock/`, its README and
   `src/billing/StepVariants.tsx`), built from Ben's decision tree of 30 October. The office answers
   one question at a time: who the invoice goes to (the patient, the List's hospital, or a special
   contract), then whether it is prepaid or under which Contract, then the price. The office's job ends
   at the Contract; a Contract priced from the RVG sends the card to the anaesthetist to fill in the
   RVG code. A guess, not a decision: the order and shape of the steps are the working direction. Ben's
   decision tree and email of 30 October are not filed in the catalogue.
10. **Contract upkeep stays open, for Vanessa.** How the office keeps a Contract's prices and dates
    current day to day (whole-Contract dated versions, a date on each line, or editing in place with
    an audit trail) is not answered by point 9. It was left open on 23 October: "this is kind of a
    bigger conversation to be had with Vanessa", with US-04.2.10 left open and US-04.2.14 "Just not
    agreed" (Notes 2026-10-23 · AA meeting with Greg #85). Both stories still read Agreed.
11. **The anaesthetist apps: assume all.** Donald: "Prototype should continue to assume all", said of
    the open scope of the anaesthetist apps: both the phone app and the web app are kept. No platform
    choice (PWA or native) was made.
12. **GST agency treatment is for the accountant.** Donald: "29 is a question for the accountant."
    OQ-29 stays open, owned by AA's accountant.
