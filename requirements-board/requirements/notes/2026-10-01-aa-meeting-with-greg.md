# AA meeting with Greg, 2026-10-01

- **Who:** Donald Fraser (Stratos) and Greg (RFP author, Peritia). Ben (AA principal), Vanessa (AA
  administrator) and Michael (AA's accountant) are referred to but were not there.
- **Covered:** prepayment on cancellation and reassignment, when prepaid money leaves the trust
  account, refunds after the anaesthetist has been paid, AA's monthly fee invoice, BCTIs and a GST
  schedule for anaesthetists, additional invoices and pre-op/post-op events, booking failure, archived
  Xero contacts, ACC pre-op assessments, hospital download formats, slots, Lists and Draft Lists,
  recurring bookings and calendars, the blacklist and a surgeon-room portal, update emails, the
  payment cycle, the date that sets the price, bookings without an NHI, RVG time and base units,
  HPI CPN, combined procedures and the procedure/contract model, a child as billable party, who pays,
  ranged RVG codes, unpaid prepayment warnings, who raises the prepayment invoice, the outstanding
  list for anaesthetists, holder codes and handing a List to a colleague. Most of it was a walk
  through the open questions on the Requirements Board.
- **Inputs gathered here:**
  - two reconciled transcripts from two recordings the same day:
    `../artifacts/files/AA Meeting with Greg Oct 1 A.md` and
    `../artifacts/files/AA Meeting with Greg Oct 1 B.md`;
  - the answers and edits Donald made to open questions in the Requirements Board during and after
    the meeting (commit `9ab7563`);
  - Donald's own notes written outside the board after the meeting.

Cite a point as `"Notes 2026-10-01 · AA meeting with Greg #n"`. Points are numbered once across the
whole note. Quoted answers and Donald's notes keep his wording (spelling fixed, filler words
dropped); the transcript summaries are paraphrase, with the transcripts as the authority. The
transcripts carry no timestamps, so positions are line numbers: "A L27-33" is lines 27 to 33 of
transcript A.

## Questions answered

One entry per question answered or changed on the board on 2026-10-01. The board answer is quoted
first, then what the transcripts add. Where they disagree, both are kept and the point says so.

1. **OQ-02 AA fee basis.** Answered; owner now "AA accountant". Answer: "At the end of the month, AA
   creates an invoice per anaesthetist. It's made up of a fixed fees, and then a $ per BCTI/ACCPAY
   invoice sent to the anaesthetist. EG $500 + $5 * 40".
   - A L225-281: at month end the accountant raises a service-fee invoice to each anaesthetist,
     which the anaesthetist pays: an AA invoice, unlike every other transaction, where AA pays the
     anaesthetist. The fee is "some standing amounts, some various charges, and also there's a
     metered charge per invoice"; per invoice or per procedure is "same thing".
   - A L235-257: neither knows the schedule of fixed charges ("a series of small charges"); get it
     from Vanessa or the accountant.
   - A L283-307: Greg believes the fee invoices are made by hand today ("I believe those invoices
     are generated manually"). Greg proposes a monthly invoice run (press a button, generate all fee
     invoices for the period) driven by a parameter page, and asks to note that several items may
     make up the fixed fee. The prototype's percentage cut on the payable is wrong. Donald (A
     L305-307): "we need to still verify this, it's not confirmed."
   - Not settled (A L259-263): Donald says the per-invoice fee should apply only to paid invoices or
     procedures (an invoice raised for anaesthetist A and then moved to B should not count twice);
     Greg: "Can I come back to that?", and the point is not returned to.
   - The second half of the question (does the fee net against payables) is not answered.
2. **OQ-03 Refund when prepaid exceeds final.** Answer: "When a booking, with a fixed fee moves from
   one anaesthetist to another, anaesthetist B still receives the fixed fee that anaesthetist A set.
   To make it stable for the patient. Sometimes this will result in more money for anaesthetist B,
   other times less. It's just accepted."
   - The answer is about reassignment, not the question asked. Greg says so (A L307-309: "That's not
     the question"). Donald then answers the question: if the prepaid amount exceeds what the final
     would have been, "we're ignoring it." Greg (A L313): often true the other way round as well (a
     final higher than the prepayment is also often let go); "I'd only go back if it was really
     significant" (no threshold given). Donald marks it verified for now.
   - B L13-17: a prepayment that exceeds the final amount is not a refund: "There may be a
     subsequent bill, but it's not a refund." What the subsequent bill would be for is not said; it
     sits in tension with Greg's A L313 remark that a shortfall is also often ignored.
   - The reassignment rule in the answer comes from A L27-33 (see point 16).
3. **OQ-05 Booking-level vs List-level failure.** Answer: "There's no reason a list needs to fail
   when a booking can pass. But a booking could fail if one of the billable parties on one or many of
   the procedures fails. In this case, the full booking would fail, and fall back to a manual fix by
   AA admin staff."
   - A L401-413: failure is per Booking; the other Bookings still invoice. A failed invoice needs a
     manual process, to be supported later.
   - A L415-425: if one procedure on a multi-procedure Booking fails, Greg: "I think you should hold
     the card back", so the admin can inspect it. Donald hesitated, then accepted it as a decision.
4. **OQ-06 Base units on RVG code or on Contract.** Answer: "base units live on the RVG code master;
   a Contract may override them."
   - **Disagreement.** The board answer repeats the original recommendation. The transcript agrees
     the revised one (B L1417-1433): base units live on a master list of procedures, each with
     defined base units "hopefully derived from an RVG code", and default contracts and hospital
     contracts that use default base units derive from that list; a contract may override. Greg:
     "what we call in the RVG, it's actually going to be our list." Donald: "stop using the word RVG
     at all and just start using the master base unit list or something, or master procedure list."
     Donald marked it answered while typing ("Base units live on the...").
   - B L577-589: the RVG guide is "like 30 entries", and the same code appears with different base
     units (a T2 with four or five), so "we can't actually trust these RVG codes at all"; it is "just
     a guide". Donald has sent Vanessa a standard procedure list to fill in with RVG codes and base
     units; he asks Greg to press her to prioritise it.
   - B L1299-1321: if a base unit is consistently overridden, AA should change its own data on the
     default contract; AA can set any base units regardless of the guide.
   - Whether the anaesthetist picks by operation name or by RVG code (the question's second part) is
     not answered.
5. **OQ-10 Invoicing an archived Xero contact.** Answer: "Yes. Unarchive to prevent dupe contacts."
   A L429-441: Greg has little experience of archiving; asked why it exists: "Theoretically. It
   doesn't want more than 10,000" active contacts.
6. **OQ-12 ACC pre-op codes.** Answer written but the question left Open; owner now "AA
   accountant". Answer: "Our new feature for pre op / post op events will cover this requirement.
   But yes, these events are recorded and displayed as distinct line items".
   - A L475-497: an ACC pre-operative assessment is a fixed-price service ACC pays for when the
     anaesthetist sees the patient beforehand. "It's a contract, fixed fee contract. It's not, never
     the primary." AA does little of it, practices in other regions do; it must be supported.
   - A L497-523: so the new events (point 34) are pre-op as well as post-op, recorded against the
     real procedure so they stay traceable. "They're time or fixed price events. They don't attract
     any other modifiers." Donald widens "time only" to "time recordings or fixed fees".
   - A L523-525: a contract can override a recorded time with a fixed fee (the anaesthetist may see
     the patient for a time but only the fixed fee is charged).
   - A L525-531: whether these are called "line items" or "procedures" on an invoice is not
     settled.
7. **OQ-13 Hospital download format.** Still Open; owner changed from "Donald / AA" to "Stratos Tech
   to ask ?".
   - A L535-543: left as an outstanding question for someone who understands the data. Two
     hospitals on HL7 may not send the same shape; Greg: HL7 provides for that mapping. Donald:
     integrations will be time and materials.
   - A L541-549: from the "Friday interview", the hospital download is not comprehensive; the
     theatre list is needed for the insurer or contract. Even once HL7 v2 or FHIR is ingested, PDFs
     must still be ingested.
   - A L551-555 (tentative): Donald says the first release may need matching capacity like the
     current system rather than PDF first ("we've now changed our tune"); Greg's reply is garbled.
8. **OQ-15 Modifier split when units do not divide evenly.** Status moved from Confirm back to Open;
   owner now "Donald to ask Ben". B L1433-1447: Donald reads the rule (equal integer division,
   remainder to the primary, so 7 units over 3 procedures is 3, 2, 2, whichever contracts the
   procedures are on) and agrees; Vanessa said this at the 2026-09-29 meeting. Greg did not challenge
   it but "that is something that Ben needs to validate because that would be news to him."
9. **OQ-17 List status vocabulary.** Answer: "As you would have heard in the transcript. The system
   will create AM & PM slots for every active anaesthetist. These slots can have a status, or a
   list."
   - A L559-575: the status of a List is the status of its anaesthetist; with no anaesthetist it is
     "unassigned". On the four-month rolling horizon each new day gets an AM and a PM slot per
     anaesthetist, "and it only becomes a list when something's in it." Three things: an empty slot,
     a List with content, a Draft List (no anaesthetist).
   - A L793-815: anaesthetists see a slot, which is free by default ("it could be free or it could
     be on holiday", or unavailable for an undefined reason). Slots are created even when free or
     unavailable, so the view can show every anaesthetist.
   - A L861-879: slots generated four months ahead default to free; statuses then change (holiday
     to free, cards added and removed). A day crossed with an anaesthetist gives two slots.
   - The status values themselves and their colours (the rest of the question) are not named.
10. **OQ-18 Contract holder codes vs RVG codes.** Answer: "We will have a master procedure list and
    a master contract list. If we need to use a contract from one of these parties, we will store
    their codes for reference. But the pair of Procedure & contract means that there could be both
    an RVG code, and a party's code".
    - B L1451-1463: our procedure list maps to an RVG code; contracts may keep the holder's own
      codes and "we'll just honour those", searchable (type "8942" to filter to that contract). Greg:
      they are reference codes, but "somewhere in this labyrinth called contracts, we're going to
      have to come up with our own AA coding scheme"; "We're gonna figure out how we do this."
      Donald: "I feel like that's wrong, but it's fine"; marked answered for now, built into the
      prototype, validated later.
    - B L583-591: Ben says contracts will all need codes; Greg: "we will need to dream up a coding
      system"; Donald: "we'll have to have our own unique identifier for every contract."
11. **OQ-19 Hospital dispute fallback.** Answer: "If there is an error on the AA side, then yes, it
    gets fixed. Credit, reissue. Else, it's treated as an outstanding invoice." The transcripts do not
    discuss it. The answer does not say outright whether the debt falls back to the patient.
12. **OQ-23 Gap / partial-cover billing.** Answer: "Contracts have a new "setting" for full payment
    to the assigned billable party. Or splitting the [contract's] line item to divide the payment
    between parties. ONLY percentage split".
    - **Disagreement.** Donald's notes (point 37) give "Percentage split" or "free field"; the board
      says only percentage.
    - The board answer and Donald's notes both write "contact's line item"; "[contract's]" is the
      likely meaning, marked as an edit.
    - B L333-359: Greg now says he "would have personally gone for the value", a typed value in $ or
      %: they have a
      calculator, it is not a common situation, and building the logic is not worth it ("you could
      type in a dollar sign in 48, or you could type in 48%"). Donald reads back his note "Only
      percentage split"; Greg: "Put a question mark after that." Donald (B L375): "we could make it
      a percentage slash free-form. Now, all of this obviously needs to be confirmed and pressure
      tested by AA."
    - So the split basis is unsettled: percentage only (board), percentage or free field (notes),
      or a typed value, $ or % (Greg in the transcript).
13. **OQ-27 List status vs anaesthetist availability calendar.** Answer, the same as OQ-17: "As you
    would have heard in the transcript. The system will create AM & PM slots for every active
    anaesthetist. These slots can have a status, or a list." See point 9, and:
    - A L841-859: the anaesthetist has a calendar to pre-mark days off, can create a series and
      edit or delete one instance; "for them, their booking is not a list, it is a status."
    - A L951-965 (Donald, tentative on implementation): a slot has a status, "and then once a list
      is applied, the list overrides that status."
    - A L987-997: if an anaesthetist marks themselves unavailable (example: bereavement), their
      Lists stay real Lists (hospital, surgeon, Bookings) with no anaesthetist, which are Draft Lists
      for the admin to resolve. Presentation not designed yet.
14. **OQ-30 NHI in Xero.** Answer: "No PII in Xero. So Xero doesn't have NHI details. Xero will have
    a unique ID which allows transactions to link back to invoices in our system." The transcripts
    do not discuss it.
15. **OQ-39 Handing a List to a colleague without office confirmation.** Answered; owner now "Donald
    to ask Ben". Answer: "An anaesthetist can in their app, select a list, and start a move action.
    Then, they can pick to move to AA office (becomes a draft list) or they can see the availability
    of other anaesthetists and PUSH the booking into one of their free slots. The second anaesthetist
    does NOT need to accept. This is a high trust system."
    - B L1463-1465: Donald says he answered it earlier and had marked it Proposed rather than
      Answered. Greg: "We were humming and harring about. But let's just go with the basics first."
    - A L779-781: if an anaesthetist withdraws, the List reverts to a Draft List and can then be
      assigned to someone else (the prototype only moves a List from A to B).
    - The transcripts do not discuss the push without acceptance, or whether the office is notified
      (the question's recommendation).
16. **OQ-40 Central prepayment refund and trust account.** Answer: "Answered in Oct 1st Transcript".
    From the transcripts:
    - **Reassignment, three readings (disagreement; the weight is with (b)).** (a) A L7-9: at the
      2026-09-29 meeting the room agreed to credit the whole prepayment and raise a new prepayment for the new anaesthetist
      (OQ-21's answer). (b) A L11-33: Ben disagreed; the patient should not be re-billed ("Too
      confusing") and the rate may differ. "The understanding between the anaesthetists is if they
      pick up a booking like that, they wear it or they benefit, depending on whether it's more or
      less", which gives the patient stability (Donald: "that changes things... that's fine"). This
      is the rule in OQ-03's answer (point 2). (c) A L87-93: Donald describes the prepaid flow; any
      time before the procedure, if the assigned anaesthetist changes, "that matching draft pair would
      be updated to point to the new anaesthetist." Greg: "As long as you catch that, you're fine."
      B L9-13 backs (b): Donald reads out reading (a) from the question, then "So we've already
      established that. If a different anaesthetist picks up a procedure that was prepaid, then the
      prepayment is based on the first anaesthetist", and says reassignment does not follow the same
      refund path ("No, we just established that"). Reading (a) is the one Ben disagreed with.
    - **Money held until the procedure is done.** A L35-43: Ben's view, which Greg and Donald accept:
      the prepaid money is held in the trust account as a pending payment and is not paid to the
      anaesthetist until the procedure is complete. Donald: "Part B does not leave the system until
      the procedure is done", which covers a cancellation (credit) and a move (the second
      anaesthetist becomes the payee). B L21 restates it: "The anaesthetist only gets paid after the
      procedure is done."
    - A L47-69: the payable is tied to the Booking ID; if another anaesthetist does the procedure the
      Booking is moved to their List (point 38).
    - A L99: any time a List or a procedure is moved, re-check prepayments.
    - Prepaid exceeds final (OQ-03): not a refund (B L13-17, point 2).
    - Refund after the anaesthetist has been paid: see point 18.
17. **OQ-41 Confirm the 90 day unpaid-patient threshold.** Answer: "This is a threshold which may
    move from 90 to X0 days. In question 40 we talked in the transcript about the system always
    alerting AA staff about patients who have + or - balances. In this case, there is a mild alert
    when under the threshold, and a strong alert when above. And in all cases, AA staff can still
    wave it through. The threshold is only for - balances."
    - The transcripts do not contain the OQ-40 discussion of always alerting on + or - balances that
      the answer refers to. The only mention is in passing at B L1141, while answering OQ-54 ("warn
      AA admin staff of Billable Parties with a negative balance strong slash mild warning").
    - What the 90 days count from is not answered.
18. **OQ-42 Credit and rebill after the anaesthetist has been paid.** Answer: "Answered in Oct 1st
    Transcript". From transcript B:
    - B L35-47: prepayments arrive many times a week and are held by AA; the weekly payment to the
      anaesthetist always covers many transactions.
    - B L71-81, L157-169: billable parties are invoiced; AA raises a buyer-created tax invoice per
      transaction for the anaesthetist, which becomes a payable; invoices and payables are always
      the same value. "There's always an invoice for everything": insurers and hospitals each need
      their own. Donald withdraws his single-invoice-with-lines idea.
    - B L91-125: a refund is a credit note to the billable party, offset by a negative invoice to
      the anaesthetist. Greg (B L107-111): "I don't want to call it that anymore" (a BCTI credit); "an
      invoice can be negative." Donald (B L175-177): "I like that, it keeps it simple."
    - B L127-177: the negative invoice is netted in the next payment run (for example 19 positive
      invoices and one negative); the anaesthetist sees it washed up in the remittance advice (the
      inverse of a statement).
    - B L141-149: Donald raises the case with no later positive payment to net against; Greg: "the
      only person who can fund the refund is the anaesthetist." So the anaesthetist funds it; the
      recovery mechanism is not described.
    - B L173-177: Donald: "okay, I'm with you now. I've just clicked", then, about typing the board
      answer: "I'm not going to answer this question, but Claude, I would like you to answer it. But
      I'm satisfied now."
    - B L181-183: credit and rebill after the anaesthetist has been paid is a duplicate; "That's all
      moot now."
19. **OQ-43 What the blacklist warning shows an anaesthetist.** Still Open; owner now "Donald to ask
    Ben". Donald added to the question: "Do we need two black lists or 1?"
    - B L187-191: deferred to Ben. The name may change ("block list or something").
    - B L193-203: Greg imagines anaesthetists managing their own blacklist on their own screen,
      alongside holidays; Donald: it could be applied from both sides (anaesthetist and admin).
    - B L205-211: Greg: also allow a blacklist in the surgeon's profile for administrators to
      manage. Donald: one blacklist or two, and does each side learn of the other's? "This sounds
      like it's a whole topic we need to unpack."
20. **OQ-44 Draft List contents and lifecycle.** Answer: "Answered in Oct 1st Transcript". Donald
    also reworded the question ("a List being prepared with no anaesthetist yet" became "a List with
    no anaesthetist yet") and added: "Can you add extra bookings to a list which isn't "defined"".
    - B L249-283: "A draft list is a list created with no anaesthetist" ("created", not
      "prepared"). Surgeon, hospital, day and session are always known when it is created and all are
      required to convert it to a List. Donald: "We're aligned with that." A L705-755 says the same:
      the hospital booking always comes first, so only the anaesthetist can be missing.
    - A L777 (Donald): a draft may need to hold "a lot of different permutations of state";
      superseded by the agreement above.
    - B L295-319 (the added question): Bookings can be added to a Draft List before an anaesthetist
      is assigned ("I see no reason why not"; Greg: "I think I agree with you"). A List is a container
      of work "principally" managed and owned by the surgeon's office; "AA doesn't add to the list,
      except in the case when the anaesthetist rocks up and there's an instant addition."
    - B L289-293: a request cancelled by the surgeon's office, or never filled, "is just poofed"
      (Greg: "Exactly"). A L923-941: if none of "my 80" anaesthetists is free, the Draft List "dies"
      or has its date edited. The recommendation's "closed by an admin with a reason" is not
      discussed.
    - B L321-327: never offered to an anaesthetist; "the role of the office is to assign the list."
      "If the anaesthetist is saying that he's free, that means that he would like work."
    - Who creates them and what is known when a request arrives: B L285, Greg: "We talked about how
      we're going to create those, but that's another story." A L923-941: AA staff create one when a
      surgeon calls needing an anaesthetist. B L221-237: admin would generate a List from a slot to
      make an ad hoc List.
    - Naming and display: points 41 and 43.
21. **OQ-45 Which pricing rules apply to an additional invoice.** Answer: "This is simply a free form
    function to create an invoice. Desc, Qnt, $. Not to be confused with previous chats about
    splitting a contract's invoice."
    - B L359-365: Greg: "this has to be a free-form invoice and I think it's a great feature to have
      because it solves all those curly problems."
    - A L317: Donald's earlier framing: free-typed lines and numbers, traceable to the procedure,
      "probably not programmed"; also used when a combined procedure's billable party changes to an
      insurer who wants it broken out (point 27). A L319, Greg: "It's an admin function at this
      point, isn't it?"
    - B L369 (unclear): Greg: "Change description to DESC. I think you're talking about discount."
      Whether "Desc" in the answer means description or discount is not clear from the transcript.
    - Whether it can go to a different billable party is not stated.
22. **OQ-46 Which changes and recipients the update email covers.** Answer: "I agree." (to the
    recommendation: offer the button after any saved change to a Booking and after a List
    reassignment; To is the hospital contact for cover changes and the surgeon's room for Booking
    changes, editable by the admin).
    - B L381: Donald will add an explicit save step; the email is an OS-level mail draft with a
      subject and the list of changes, editable.
    - **Difference in detail.** B L383-391: Greg finds a prompt after every save annoying and asks
      whether the email need be that broad; "do they just want to advise the surgeon's rooms? The
      hospitals don't care, I don't think." Donald does not want a save, question, return sequence:
      "the system remembers the last set of changes and then when you hit a draft e-mail button,
      maybe it creates it with those changes. That's to be defined."
    - B L391-395: Donald then reads out the recommendation (hospital contact for cover changes) and
      says he is happy with it; Greg: "Yeah, it's all right... Good question." So the recipients are
      accepted as recommended, with Greg's hedged "The hospitals don't care, I don't think" as a
      note. Only the prompt-versus-button mechanism is left "to be defined".
23. **OQ-49 Booking without NHI: provisional or blocked.** Still Open; owner now "Donald to ask Ben".
    Transcript B L441-565 adds:
    - Lean (both): let the Booking, procedures and contracts proceed with the NHI pending, flagged
      as an anomaly to fix, and block authorising the List until the NHI is added (L467). Greg:
      "you don't want things rejected out of feeds if you can help it." Donald: assume this in the
      prototype until answered (L565). "We'll ask them."
    - Context: theatre-list PDFs sometimes omit the NHI, but "a procedure would never go forward
      without an NHI in the room" (L451).
    - Patients need our own unique ID, with the NHI attached later under a second unique index
      (L453-457, L509-517). This sits against "Patient record keyed on NHI".
    - Duplicates (L459-565): a second record for the same person (a married name, NHI unknown on a
      second visit) collides when the NHI is found. Greg wants "bulletproof" resolution; Donald: fix
      outside the system by a developer, or accept some duplicates; a merge screen is a big lift. Greg
      cites a "do not change" flag on genuinely identical records (National Student Index precedent).
    - NHI can be refreshed from the central register; hospital NHI updates come "twice a day,
      currently" (L513, L521-531).
    - The question for AA (L549-565): is it more painful to block all work on a Booking without an
      NHI, or to allow it and handle duplicates later?
24. **OQ-50 RVG time rule after two hours.** Answer: "All time units are based on the RVG rules. Not
    office vibes."
    - B L569: Donald reads the current rule as "one unit 15 minutes thereafter. one unit for 10
      minutes or part thereof", in one breath, then: "no more estimates based on vibes. It's all
      based on the rules." Greg: "Good."
    - The check the question asked for (US-05.2.2 against the NZSA RVG 2021 text, and part-interval
      rounding) is not done.
25. **OQ-51 Meaning of the Solutions Plus three- and six-number identifiers.** Deleted on the board,
    no answer recorded. B L595-599: "anything that this was referring to has been... affected by
    these"; "delete this question." Greg: "Good." (Inference, not said: the additional invoice, point
    21, may be what replaces the need.)
26. **OQ-52 What CPN stands for.** Answer: "for an individual health practitioner, the CPN and their
    HPI practitioner number are the same identifier. Health NZ itself writes it as "HPI CPN (Common
    Person Number)". So let's call it HPI CPN".
    - B L599-693: Greg first guessed "certified practitioner number". The HPI is the Health Provider
      Index. Greg's guess that a nurse would only have a CPN ("I imagine", L601) is speculation, and
      the lookup that followed treats CPN and HPI number as the same identifier.
    - B L619-625: Greg: the HPI is the surgeon's unique index ("the equivalent of the NHI"); the
      other numbers are informational.
    - Settled (B L687-691): CPN and HPI are one identifier. Greg: "there's only one instance. Maybe
      we should refer to it as the HPI CPN"; Donald: "Okay, let's do that." Donald's earlier "I'm
      just going to say the two for now" (L619) came before the lookup. Greg's L693 remark that the
      help text says it identifies a person within an organisation ("It's bizarre. Anyway, doesn't
      matter") is a passing aside, not taken further.
27. **OQ-53 How combined procedures are modelled.** Answer: "Answered in Oct 1st Transcript. In
    short, we will filter / group the procedure list by body headings. Then you can pick a contract
    based on the procedure. A combo procedure exists as a contract against each of the relevant
    parent procedures".
    - B L697-905, L1037-1053: a clean master list of standard single procedures; combinations are
      contracts. Final agreement: a combination contract sits against each of its parent procedures
      (one contract, more than one parent). Greg: "I'd use each."
    - B L1015-1037, L1203-1215: pick a procedure (grouped and filtered by RVG body headings), then a
      contract from those for that procedure, filtered by hospital ("You always know the hospital").
    - B L833-1053: Greg's "operation" container (a level holding several procedures tied to one
      contract, with time and modifiers on the operation) was not adopted: build the simpler model in
      the next prototype and "see how it feels".
    - B L933, Donald: "There's a day. And inside that is slots slash lists. Inside that is a booking.
      Inside a booking is a procedure. Inside a procedure is a contract. And that contract may be
      split."
    - A L317: when a billable party wants a combined price split into parts, use additional invoices
      against the procedure (point 21).
    - Open worry (B L1003-1013, L1233-1243): the contract count will be "thousands" (Peter's figure,
      as Greg reports it, B L1007) and Greg has not
      worked out how the bucket is managed; Donald: "Give me a shot to make it navigable." Once a
      combination is chosen, history shows only the contract (B L869).
    - Whether the original combined invoice is credited when split is not discussed.
28. **OQ-54 Child as billable party: block or warn.** Answer: "Much like the system will warn AA admin
    staff of billable parties with a - balance (strong / mild warning), the system should also give AA
    staff a mild warning when a patient on a booking is under 18 and is the billable party (EG, if the
    billable party is a hospital, then no warning needed)".
    - B L1105-1151: no block and no guardian entity. Where a patient-default contract applies to an
      under-18 patient, someone types the guardian's invoice email: "just double check the invoice
      e-mail." The warning shows on the dashboard (the to-do list) and can be cleared.
    - B L1119-1125: Greg finds "never the child" in the question too strong and asks where it came
      from (the 2026-09-29 transcript).
    - B L1111, Greg: a guardian's details are "more of a contract than a master detail. It only
      exists for the life of the debt, and after that it just gets archived."
29. **OQ-55 Insurer and funding source: on the Booking or the Patient.** Answer: "The contract defines
    the billable party. And there can be many contracts for any mix and match needed." (The board
    also unquoted this question's source line.)
    - B L1155-1273: neither the Patient nor the Booking holds it; each procedure's contract says who
      pays, and one Booking can have procedures with different contracts and billable parties. Greg:
      "the question's wrong"; Donald: "may be nonsensical... We can close."
    - B L1191-1215: a default contract bills the patient; a hospital can have RVG contracts with the
      hospital as billable party; every hospital gets a default RVG contract plus fixed and other
      contracts; RVG variants with different base units are contracts. B L775-801, L1259-1263: a
      price-book model (procedure is the product, the hospital the customer). Greg's tentative view
      (B L779): "I think contracts are always owned by the hospital". In tension with that, B L1233,
      Greg: "the contract is always by the funding source. So there are contracts for each funding
      source." Not flagged in the meeting.
    - Not settled (B L1169-1185, L1217): Greg thinks there is a "fall-through" order for who pays
      (the hospital applies to the insurer as agent; theatre lists name the insurer) and wants to
      draw it out with Vanessa.
30. **OQ-56 Ranged RVG codes: flag out-of-range base units.** Answer: "An anaesthetist can override
    as they see fit. But a warning should be presented to the AA admin staff."
    - B L1277-1327, Greg: "They can do what they like. It should flag it though somehow." Vanessa may
      query it, especially on insurance jobs. It is an "after the procedure" warning.
    - Warning noise (B L1293-1321): Donald raises it, since anaesthetists routinely exceed the RVG
      (not updated since 2021). Greg (L1295, garbled: "you should check them all, Ben") brings Ben in
      and answers it (L1299, L1319): if a value is consistently overridden, AA should change its own
      data. Donald accepts the warning (L1321): "let's go with that then. I'll trust you on this...
      a warning should be presented." No threshold or mute was discussed.
31. **OQ-57 Keep a hard prepayment gate on completing a List.** Answer: "At this stage, the system
    will not block this. But we do need a warning that is clear for both admin and anaesthetist in
    their respective apps."
    - B L1331-1351: Greg: "it should all be soft", but the anaesthetist's screen needs a flag on the
      Booking; "the surgeon should know about it before the surgery starts. Because he might bring
      the patient and say, sorry, we're not doing this." Donald: when submitting a card with a
      warning, show "a little middle step".
    - B L1353-1365: like Excel's small yellow triangle, tap to read the text; Donald extends the day
      view's outline treatment (Donald) down to the Booking (Greg, L1357: "you could take that down
      to the next level, to the bookings"; Donald agrees). Greg: a generic engine producing text, with
      possibly more than one warning on a Booking (point 47).
32. **OQ-58 Who raises the prepayment invoice at booking setup.** Answer: "Answered in Oct 1st
    Transcript. When a patient procedure matches an anaesthetist's pre-paid list (in their profile)
    then the system auto gens an invoice for the patient (so only if the patient is the billable
    party) right away. But it is gated by an approve step for the AA admin staff."
    - B L1369-1385: Greg proposes the admin check ("automatically generated but not sent"); it is sent
      as a templated letter. Greg (L1383): "Could still be a lineup" (garbled, possibly "guardian");
      Donald (L1385): "That's still a billable party. That's a patient... we say patient as a generic
      term", most likely meaning the person paying for the patient, not any billable party such as an
      insurer. **Tension:** the board answer says "(So only if the patient is the billable party)";
      not resolved.
    - B L1379-1389: Greg wants every check step switchable on a parameter page as trust builds;
      Donald defers it: build that config only when AA asks.
    - A L87-93: the engine creates the ledger pair and the Xero draft receivable/payable pair when a
      prepayment is required; a later submit does not re-invoice.
33. **OQ-59 Receivables ageing and an Overdue view.** Answer: "Yea, let's go with your
    recommendation for now." (a flat outstanding list, oldest first, no buckets or age chips).
    - B L1393-1411, Greg: "We just want an age list." That the legacy overdue screen is just a list
      is Donald's observation (L1399-1403); Greg distances himself from copying it ("That doesn't
      mean it's good though. It just means that's how it's done", L1397).
    - B L1413, Greg: "it says first notice that should be saying invoice date." Which screen he means
      is unclear (the legacy label read out was "first ACCT", account).
    - B L1395-1405: Greg recalls specifying the flat list himself ("I said that somewhere in the...");
      Donald: "so it didn't come from nowhere."

## Donald's notes after the meeting

34. **Pre-op and post-op events (new feature).** "Allow anaesthetist to add Pre op and Post Op events
    to procedures to capture time recordings or fixed fees for future invoices (may or not be
    billable)."
    - A L323-343: anaesthetists need to look back at past procedures and add post-care or modifiers
      themselves; today they ring or email Vanessa. "I know how much people value self-service."
      Donald: these generate new invoices which "probably need to go through the same approval flows
      for the admin staff". This differs from the admin's additional invoice (point 21), which Greg
      calls an admin function.
    - A L345-361: the event is a child of the Booking attached to the original procedure, with its
      own date and time, shown as its own element. If significant, they would create another card
      instead.
    - A L365-381: pain management is the common case. A new card would only go on a current List
      and would need its base units zeroed, so Greg: "adding a procedure to the card is probably the
      cleanest way to do it."
    - **Modelling not settled.** Greg leans to adding a procedure to the Booking (A L345, L381),
      though he also floats another child entity with its own date and time (A L353); Donald frames
      a separate event element attached to the original procedure (A L355). The naming question is
      in point 6.
    - A L497-525: time or fixed fee only, no other modifiers; covers ACC pre-op (point 6).
    - A L383-395: it needs a short name.
    - "May or not be billable" is not discussed in the transcripts.
35. **Calendar navigation (new feature).** "Calendar view to find day > List > Booking > Procedure".
    A L337-343, L383-395: a way back beyond the four-month rolling view without infinite scroll: jump
    to a day, then the List, then the Booking. Discussed for the anaesthetist app (its four-month
    rolling view; "Anaesthetists need to be able to historically look back", A L343); the admin app
    is not mentioned.
36. **Search (new feature).** "Search via NHI / patient name to find bookings > procedures". A
    L383-395, Greg: "Search for NHI could be useful." A L397: Greg mentions the health "three-way
    match" (name, date of birth, NHI) for identity; not taken further.
37. **Contract payment setting and split.** "Contracts have a new "setting" for full payment to the
    assigned billable party. Or splitting the [contract's] line item to divide the payment between
    parties. Percentage split. Or free field." (Donald wrote "contact's".)
    - **Disagreement** with the OQ-23 board answer ("ONLY percentage split") and with Greg's
      preference for value in the transcript: see point 12.
    - Not said: whether percentages must total 100, who sets them (on the Contract or the Booking),
      and whether full payment versus split is a per-Contract default.

## Other points from the transcripts

38. **Who did the procedure.** A L47-69: whoever submits the List is the one who did the procedure.
    If someone else does it, the Booking is moved to their List, even a one-procedure List. There is
    no anaesthetist B doing a procedure on A's List.
39. **No "timesheet".** A L73-79: the word "timesheet" is not used; say Booking (a completed or
    submitted Booking).
40. **GST schedule for anaesthetists (new requirement).** A L113-137: Ben wants, early, a schedule to
    help each anaesthetist prepare their bi-monthly GST return: a sales report of AA sales, the GST
    component, and a check that it balances with payments. GST is on a cash basis, so it lists the
    payables AA actually paid the anaesthetist in the period; anything outstanding falls into a later
    period. Donald: "So that's a new requirement." Ben called it "one of the deliverables needed
    very early in the piece" (A L113); the release slot is unconfirmed.
41. **BCTIs.** A L113, L141-217: the buyer-created tax invoice is AA raising the anaesthetist's
    invoice to AA on their behalf, so AA can pay out money held for them ("money in, money out"),
    one per procedure; the system generating them saves "a hell of a lot of work". Donald equates it
    with what the catalogue calls the payable invoice (A L207); Greg's reply opens "No, it's very
    simple because it's money in, money out" (A L209), so whether he agrees is ambiguous. IRD renamed it about 18 months ago; the new name is not
    given. Volumes (A L217, loosely): Ben 50 to 70 a month; some do 3 to 10; many work one day a week
    at about 20. OQ-29 (GST agency treatment) stays Open with the accountant.
42. **Slots, Lists and Draft Lists: the model.** A L575-829.
    - A slot is the empty AM or PM half-day; it becomes a List when something is in it. Agreed
      definition (A L705-755): surgeon, hospital, anaesthetist, day and session make a List; a List
      missing only the anaesthetist is a Draft List.
    - Greg accepts the concept "in principle, not in detail" (A L577-601): the underlying entity is
      the day, and a List is a child of the day; views paint it from an anaesthetist's side. A
      L657-697: Donald pictures slots filled by recurring bookings; Greg sees the day as a pure parent
      into which Lists are added, and an unavailable half-day as "ironically" a List; Donald: that
      could just be a status. Greg: "I think we need to be clear about what the logical model is, and
      I don't think we are."
    - A L881-891: whether every slot is stored or holes are inferred is left to implementation; the
      view must show every known anaesthetist's slot status and also Lists with no anaesthetist.
    - A L971-985: slots can be edited freely; a new anaesthetist gets slots from their start date.
43. **Naming and showing Draft Lists.** A L757-791: "slot" agreed for now; "draft list" (or
    "unassigned list") kept for now. Greg: "we need to find something that is intuitive for the
    users. And I don't think we've found the language for that yet."
    - A L605-629: the current display and the prototype show no unassigned Lists. Greg: an error in
      Solutions Plus's UI design carried into the RFP, "quite a big flaw". A L893-915: unassigned
      requests have no home today (Vanessa has "a pile of paper").
    - A L951-965, L997, L1027-1039: Draft Lists must show prominently in the core planning view.
      Donald: "I might reserve some of this right-hand space to show draft lists", plus a separate
      page; layout not designed.
44. **Recurring bookings and calendars.** A L631-655: "recurring bookings" replaces "template" or
    "permanent bookings"; a recurring booking is the intersection of a hospital, an anaesthetist and
    a surgeon, painted onto Lists. A L817-831 (tentative): recurring days off are a rule on the
    anaesthetist's calendar; a surgeon could have a calendar holding recurring appointments, perhaps
    on the surgeon profile. A L893-915: surgeons cannot double-book themselves, so the system need not
    track surgeon slots; it tracks unassigned ones.
45. **Surgeon-room portal (future).** B L213-245: a wish for surgeons' rooms to add ad hoc Lists and
    last-minute edits, or request ad hoc Lists, themselves. Ben is a big supporter, Vanessa is not
    ("She wants control"). Greg: "this topic will come up again." Not a decision. In the theatre the
    anaesthetist must still be able to create a card on the fly (B L221-237).
46. **Primary procedure.** A L459-469: a Booking has no contract; each procedure has one. One
    procedure is marked primary, chosen by AA staff when creating or importing (Vanessa: the rooms'
    sheet order shows it). Donald wants the primary shown first; Greg: the first procedure done may
    not be the primary (an ACC pre-op assessment never is).
47. **Warnings.** B L1323-1327, L1353-1365: a standard routine checks conditions and raises warnings,
    more than one per Booking; warnings split into before-procedure and after-procedure kinds. B
    L1127-1147, Greg: the dashboard is the to-do list of things needing attention, and warnings on it
    can be cleared ("this concept of the to-do list is really important").
48. **Payment cycle (OQ-47 stays Open, ask Ben).** B L403-425: the weekly accounting cycle is left to
    confirm with Ben. Greg: trust-account payments go out weekly; the 20th is a separate monthly
    cycle for non-trust payments such as service-fee and rent invoices. Donald (B L419), of rent only:
    "our system's not going to cover rent." The service-fee invoices are the system's monthly
    fee-invoice run (point 1). Greg does not know why the 20th is in the question.
49. **Date that sets the price (OQ-48 stays Open).** B L427-439, Greg: "I'd go with the procedure";
    a price change between booking and procedure only affects prepayments. To propose to AA.
50. **Prepaid amount on a contract.** B L1195: Vanessa pushed back on a fixed partial prepaid amount:
    prepayment is always all or nothing; the notes were "not updated".
51. **Keep the anaesthetist's world simple.** B L995-1007: anaesthetists see none of the contract
    complexity today (the office does it); "we don't want to create hell here."
52. **Working rules.** B L441-443, L1099-1101: where a question is unanswered, the prototype assumes
    the recommendation. A L317, B L375: all requirements still need to be verified with AA.

## Follow-ups

53. **For Ben:** OQ-15, OQ-43, OQ-49, OQ-39 (owner) and OQ-47; how the prepayment behaves on
    reassignment (point 16). (OQ-56's warning noise was settled in the room, point 30.)
54. **For AA's accountant:** OQ-02's fixed fee schedule and whether the fee applies only to paid
    invoices; OQ-12; OQ-29.
55. **From Vanessa:** the standard procedure list with RVG codes and base units (Greg to press her);
    the who-pays fall-through logic (point 29).
56. **For Stratos Tech:** OQ-13, the hospital download format.

## Unresolved or in tension

57. **Prepayment on reassignment.** The weight is with the replacement keeping the agreed amount
    and wearing the difference (Ben, OQ-03's answer, restated in B L9-13). Still heard: credit and
    re-prepay (OQ-21, which Ben disagreed with), and the draft payable pair repointed to the new
    anaesthetist (point 16).
58. **Contract split basis.** Percentage only (OQ-23 board), percentage or free field (Donald's
    notes), or value (Greg) (points 12 and 37).
59. **Where base units live.** RVG code master (OQ-06 board) or the master procedure list
    (transcript), point 4.
60. **Update email mechanism.** Whether it is a prompt after saving or an on-demand button (point
    22). The recipients were accepted as recommended (hospital for cover changes), with Greg's
    hedged remark that mainly the surgeon's rooms care.
61. **Approval of anaesthetist-added events.** The anaesthetist's pre-op and post-op events go through
    admin approval (point 34); the admin's additional invoice needs none (point 21).
62. **Patient key.** An internal patient ID with NHI as a second unique index (point 23) against
    "Patient record keyed on NHI".
63. **Also open from these transcripts:** the per-invoice fee only on paid invoices (point 1); a
    recovery mechanism for a refund with no later payment to net against (point 18); the post-two-hour
    time rule (point 24); managing thousands of contracts (point 27); "line items" or "procedures"
    for events (point 6), and whether an event is a procedure added to the Booking or a separate
    event element (point 34); the logical day, slot and List model and the user-facing
    names (points 42 and 43); one blacklist or two (point 19).

## Added on review

Points missed in the first pass, added after checking against the transcripts.

64. **Insurer pricing is often plain RVG.** B L1285-1287: Donald assumes an insurance job is normally
    a fixed fee; Greg: "Not always... A lot of insurance jobs are just RVG. They're just paid by the
    insurer." Bears on contract and holder modelling (points 29 and 30).
65. **A config page for thresholds and active warnings.** B L1389, Donald: "needs to be a config page
    to define thresholds and which warnings are active", then: "we would only ever build the config
    when they ask for it." Bears on OQ-41 (a threshold that may move) and OQ-56 (warning noise);
    extends the check-step toggles in point 32 and the warning routine in point 47.
66. **BCTIs are approved for payment.** B L85-87, Greg: once AA generates the BCTIs for a period, "it's
    going to approve those for payment" before they are paid (point 18).
67. **Surgeons have no view into the system.** A L823-827: Donald: "surgeons don't have any view into
    the system"; Greg: the surgeon is still an entity that could have a calendar of recurring
    appointments (point 44). In tension with the surgeon-room portal wish (point 45), not flagged in
    the meeting.
68. **Anaesthetists creating ad hoc Lists.** B L223-237: Donald suggests an anaesthetist could turn a
    slot into a List; Greg: admin would want to, "I can't see an anaesthetist needing to do that",
    though in the theatre the anaesthetist must still create a card on the fly (points 20 and 45).
69. **Do duplicates matter after the operation?** B L549, Greg: "there's even a do we care question
    because once that patient has had their operation, it's sort of like gone." Weighs against
    bulletproof duplicate resolution (point 23).
