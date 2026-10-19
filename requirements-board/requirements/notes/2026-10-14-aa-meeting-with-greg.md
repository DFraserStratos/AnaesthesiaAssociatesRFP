# AA meeting with Greg, 2026-10-14

- **Who:** Donald Fraser (Stratos) and Greg Smith (RFP author, Peritia), in person. A visitor drops
  in briefly to say hello part way through (L797-809; who it was is not established). Ben (AA
  principal), Nick (AA director) and Vanessa (AA office administrator) are referred to but were not
  there. "Last Tuesday night" in the transcript is the
  [AA directors meeting](2026-10-06-aa-directors-meeting.md) of 2026-10-06; "yesterday" is a
  conversation with Nick and Ben on 2026-10-13 that has no note of its own (L314, L803).
- **Covered:** reading through Greg's pricing model executive summary (v5) and technical design
  together: modifiers; who pays and what a Contract is for; insurance indicators (SXAP) and
  pre-approval; the procedure master list going away and one default Contract for the whole system;
  RVG selection by type-ahead; hospital Contracts and the two invoice styles; the Contract flags
  and how a Contract's header and lines work; the paths for choosing a Contract at booking setup,
  and surgeons' arrangements; time entry and office review; the last edit standing; maintaining
  Contract schedules; and the next step, that Greg makes a v6 of the documents.
- **Inputs gathered here:**
  - one reconciled transcript,
    [AA Meeting with Greg Oct 14th Reconciled Transcript](<../artifacts/files/AA Meeting with Greg Oct 14th Reconciled Transcript.md>),
    registered as artifact [AR-37](../artifacts/AR-37.md).
  The documents read in the meeting were revised into v6 afterwards; those are recorded in their own
  note.

Cite a point as `"Notes 2026-10-14 · AA meeting with Greg #n"`. Points are numbered once across the
whole note. Speakers' wording is kept in short quotes (spelling fixed, filler dropped); the
summaries around them are paraphrase, with the transcript as the authority. Positions are transcript
line numbers ("L976-1002" is lines 976 to 1002). Much of the transcript is Donald reading Greg's
documents aloud; a reading is the document's text, not a statement by either speaker, and the points
say where a passage is a reading. The transcript's own reconciliation notes keep provisional or
conflicting statements as conversation, not settled specification (L1041); where a point was left
open, it says so.

## Questions answered

1. **No procedure master list: Contracts link to RVG codes (OQ-88, partly).** No board answer; OQ-88
   is Open. Reading the executive summary's "A contract is configured and can then be associated
   with any procedure", Donald: "we're not linking contracts to procedures anymore. We're linking
   them directly to RVG codes." Greg: "that's small p... I've been deliberate about that" (L296-302).
   Donald heard "pretty clearly from Nick and Ben that every anaesthetist will want to figure out
   which RVG code they want to apply" (L316). Later: the intermediate "medium list that you could
   use to filter... That's out the window", so on an active List the office or the anaesthetist sees
   the surgeon's plain text with the RVG code and the Contract both blank, and someone decides them
   (L743). The consequence Donald raised: "Previously, you were sifting from a list of procedures
   into a smaller list of contracts. Now you have a small list of codes and a large list of
   contracts." (L320) Donald put the RVG codes at "roughly 40... Is it 112? Did you count them?" and Greg confirmed he had; asked whether that included modifiers, Greg said no, the modifiers are "itself quite a big list" (L735-741).
   Questions 2 and 3 of OQ-88 (the system code, and hierarchy against flat list) were not discussed
   as such. Bears on US-05.1.6, US-04.3.2 and US-03.3.1.
2. **A hospital's plain RVG Contract names who is billed and carries a reference code (OQ-98,
   partly).** No board answer; OQ-98 is Open. Greg: "a lot of the contracts are RVG contracts", and
   all those arrangements require is that "the contract reference like SXAP gets put onto the
   invoice", so that "when Southern Cross gets the invoice, they know which contract to put it under
   in their accounting system. Otherwise it's an RVG contract" (L325-329). Southern Cross's own list
   of about 2,500 procedure lines is used internally for cost accounting and is "not what's being
   imposed on us" (L333; one transcription reads 25,000, L1040). Donald: the Contract can be
   "flexible enough where you don't have to define the base units. You just have to say it's an RVG
   contract for Southern Cross. And this is who you send the invoice to", and anyone down the chain
   picks the RVG code and records time; "we're actually no longer really pre-filling in any RVG
   codes". Greg: "No." (L339-341) Whether a hospital booking carries the hospital's own procedure
   code: Greg does not believe so, "but we'll need to ask Vanessa" (L335-337). Greg also suggested
   putting the hospital's reference code into the booking and printing it on the invoice: "I suspect
   the hospital would think that was great." (L341) This reads as a Contract with no lines applying
   to every procedure, as OQ-98 recommends, but neither speaker said so in those words. Bears on
   US-04.2.1, US-04.2.4 and US-04.2.8.
3. **SXAP on the booking shows the hospital is the billable party, not whether cover is approved
   (OQ-93, partly).** No board answer; OQ-93 is Open. The executive summary, as read: "If a booking
   indicates insurance but the patient-billed contract is chosen... the office sees a warning at
   review. It's not a block, because preapproval can fall through on the day." (L181) Asked whether
   insurance information arrives in a standard way, Greg: "It usually does." (L237-239) The generic
   code SXAP means the hospital will arrange Southern Cross insurance; it tells the reader the
   patient is not paying for themselves and is not ACC ("there's another thing they use for ACC"),
   "But it doesn't actually tell you the status of the request" (L219). "If SXAP comes along... then
   you know that the hospital's billable party... So you can set up the contract that way."
   (L243-247) Whether and where the indication is stored, and whether it narrows the Contract list,
   were not discussed; the approval gap is point 14. Bears on US-04.3.6, US-04.3.4, US-07.2.2 and
   OQ-22.
4. **No modifiers pre-selected or locked (OQ-95, partly).** No board answer; OQ-95 is Open. Donald
   recalled the 6 October idea that already-included modifiers (the "plus two" ones) would show selected at zero, so an anaesthetist could not add them again; he thought only two would ever be pre-selected, "age and this, I think", after talk of prone positioning (L413-421). Greg: "I think
   the lockdown was a problem... ultimately they can't constrain them", and the anaesthetist in that
   story "already knew he shouldn't be doing that, but he was just trying it on" (L423-435). Greg
   also said Donald was misreading the directors: "those two are already in" (L419). Donald: "maybe
   we assume that it would be fine for the system not to presuppose any modifiers and they just deal
   with it. But yeah, certainly worth the conversation." (L437) Left open: Greg would not finalise
   modifier decisions and said Ben must confirm (point 9). The age bands and the ASA grade were not
   discussed. Bears on US-03.3.4, US-03.3.8 and US-05.1.4.
5. **Changing the price on an anaesthetist's prepaid procedure (OQ-96, partly, both readings
   kept).** No board answer; OQ-96 is Open. Reading the arrangements table, Donald took the
   anaesthetist's own prepaid price as a fixed price; Greg: "technically it's an estimate, but it's
   the anaesthetist's price." Donald: "The anaesthetist can change it in the room." Greg: "Yes...
   It's covered in the next paragraph." (L456-470) Later, on a prepaid facelift where only half the
   work is done or extra is done, Donald: "I wouldn't think you would handle that via the price
   override. It would be through the additional invoices." Greg: "That's what happens", pointing to
   section 6 of the technical design for the equal, under and over cases (L507-517). Whether the
   price field itself stays editable on a prepaid procedure is not settled. Bears on US-04.2.14,
   US-06.4.1, US-08.6.3 and OQ-61.
6. **Both invoice styles carry the booking description unfiltered (OQ-103, bears on).** No board
   answer; OQ-103 is Open. Donald said the raw procedure text from other systems is shown as is,
   and asked what the patient needs to see (L343). Greg: there are two styles of invoice, "very
   similar. Things like the BTM breakdown are on a hospital invoice, and they're not on the patient
   invoice. They both contain the booking description unfiltered." The hospital invoice has "a
   couple more data fields... So they can cross-match." (L345-357) Greg relayed Ben: "they look up
   the NHI and they find the details from the patient there and they put it in there" (L361; who
   "they" are is not clear). This differs from US-03.1.9 as OQ-103 describes it (the invoice prints
   the procedure's own wording, never the source text): flag for the update. Bears on US-04.2.8 and
   US-08.4.1.
7. **An anaesthetist's "please check this" flag, posted to the shared pool (OQ-79, part 1,
   partly).** No board answer; OQ-79 is Open. Greg wondered, "and it doesn't need to be included
   here", whether an anaesthetist who is new or unsure could tick a box on the entry form asking for
   a review: "I'm not sure about this one, can you check it?", useful "because one day these reviews
   might stop" (L955-967). Donald: the system currently assumes an administrator always looks before
   any invoice is created (L957); he linked it to the notification pool and to-dos: "you could have
   an anaesthetist mark it for like a notification to say, Hey, can this be looked at for a
   second?" Greg: "Some sort of attention notification?" Donald: "into the regular pool."
   (L969-976) An idea, not decided. Bears on FT-13.8, US-13.8.1, FT-13.7 and US-03.6.1.

## Other points

### Modifiers, wording and the fee formula

8. **Greg's documents read together, superseding the earlier guide.** Donald opened "Contract
   Pricing Model V4" with his own notes on modifiers; Greg: "this document is meant to supersede
   that" (L47-57). Greg cross-validates his documents with Claude; the questions at the end came from something Donald had sent with questions at the bottom, "might have been the who pays document"; Greg: "I know some of that area is wrong, undecided,
   whatever... We'll sort it out later." (L61, L67-77)
9. **Ben doubts modifiers belong in the build.** Greg, on what Ben disagreed with: "the modifiers. I
   didn't expunge them... He just doesn't think they should be in at all." Ben's view as Greg put
   it: "the anaesthetist is so much across and in charge of what the modifiers are going to be that
   anything we do to default or prompt a modifier is just a waste of time", and "you're not focusing
   on the right thing. This isn't the problem we're trying to solve." (L10-30) Donald thought there
   was agreement on age (known from the patient) and on some positioning modifiers (L47). Greg: "I
   wouldn't like to get into a discussion and finalize that... there's not really a cost benefit for
   this particular feature... but it would need Ben to confirm that with you." Donald: "that's
   fair." (L49-55) Open, for Ben. Bears on US-03.3.4, US-05.1.5, US-03.3.8 and OQ-95.
10. **"First party" and "third party" dropped from Greg's documents.** Greg: "they're not truly third
    and first party circumstances in all cases. So why are we using that term?... That's why
    they're gone." (L61-65) Donald did not object. Bears on US-04.1.1 (titled "Third-party and
    first-party Contracts") and US-04.2.14.
11. **The fee formula assumes the discount is a decimal fraction.** Reading "BTM multiplied by rate,
    brackets 1 minus discount percentage", Greg: "I'm not sure that's right, is it?" Neither was
    certain, then Greg: in the Excel model "all discounts are stored as decimal fractions", so 20%
    is 0.2 and the rate is multiplied by 0.8: "it's right, if you assume that discount is a decimal
    fraction, which it doesn't specify." (L79-105) Settled as a reading; the document does not say
    it. The inputs listed after it (base units, time units, modifiers claimed by the anaesthetist,
    zero by default, the anaesthetist's own rate) Greg called "just a glossary" (L107-113). Bears on
    US-04.2.2, US-05.2.1 and US-05.4.3.
12. **Contracts state only what differs from an RVG calculation: wording, left to the developers.**
    Reading "A fixed rate, fixed price, rate or discount set by contract or entered by the
    anaesthetist overrides the default RVG calculation. Contracts only state what differs from the
    RVG-style calculation", Donald: "I'm not saying it's wrong, but it always comes with this
    assumption that there's always an RVG calculation that could exist, but it's overwritten" by a
    fixed cost or similar (L115). Greg: the wording is meant to express "that it's a sparse thing
    that lays itself over the top", then "Does it matter?... I'm quite happy to kick this over to
    you and the developers... here's the outline of what we think we need... Take it away." (L117-137)
    Bears on US-04.2.2 and US-05.2.1.

### Who pays and insurance

13. **The selected Contract decides who is billed.** The executive summary, as read: "everything is
    represented by a contract; even 'no contract' is a contract. The selected contract decides who
    receives the invoice, with 'no contract' as the patient pays." (L142) Donald: a Contract other
    than the standard no-contract carries a pre-assumed billable party, so two Contracts with the
    same style of payment but different recipients are separate Contracts (L146-150). Greg: "I think
    that's right. I can't think of an exception to that... To identify the billable party."
    (L156-160) On "a contract whose holder pays", Greg would word it "its holder pays": "Technically
    that doesn't have to be the case, but that's the general... That's the case we're working with."
    (L162-172) Donald said his picture of hospital, insurer and surgeon Contracts was still "a little
    blurry" after Vanessa and Ben "poked holes" in it (L174). Settled. Bears on US-04.2.1, US-04.3.3,
    US-11.2.1, US-04.1.5 and OQ-67.
14. **Whether the insurer has approved the charges is a gap in the information.** Greg: "I think
    there's a real gap here in the information chain"; the funding arrives "on the theatre lists that
    come from the hospital later", and an insurance indication on the booking "doesn't mean it's been approved... the
    question is, do you have an insurer? The question we're interested in is, has the insurer
    accepted the charges... I don't think the system really supports that very well... this will
    continue to be a bit of loose thread." (L187-195) The hospital, not the surgeon's rooms, applies
    on the patient's behalf "Because they are the agent for the insurance company" (L197-215). It
    "often arrives quite a bit later than the original bookings"; with insurance, "it doesn't usually
    get past admission", and the patient "has to make alternate arrangements before the hospital will
    proceed"; "it's all happening outside the fence" (L223-235). Vanessa follows it up with the
    hospital (L251). Left open, for a session with Vanessa. Bears on US-11.4.2, FT-11.4, US-07.2.2 and
    OQ-93.
15. **On the day, the anaesthetist switches the Contract from SXAP to patient billing.** Greg relayed
    Ben: when cover has not been approved, Ben may offer the patient 25% off "Otherwise it's a dead slot", and at the start of the day "He just changes the contract
    from SXAP to patient billing." Donald: "No contract, yeah, exactly." Greg: "No contract, and
    you're done." (L255-267) Donald suggested the office might fill in the patient's name and email;
    Greg: "Already on the booking... They just need to change the contract." (L277-283) Settled.
    Bears on US-04.3.1, US-03.4.1, US-11.2.2 and US-05.4.1.
16. **The more common failure: the wrong party is billed.** Greg: "the thing that happens more often
    than not is that something like that slips through and then the wrong party gets billed. I think
    that's going to be slightly more difficult to close that gate because of the lack of
    information", and "Both of us are going to need some time with Vanessa just on this one
    question... Going through all the use cases." He added, "I don't really understand why it's
    happening" and "I don't think I understand enough about the ones that do slip through."
    (L267-291) Left open. Bears on US-07.2.2 and OQ-93.

### RVG codes, the default Contract and invoices

17. **Anaesthetists' favourite procedures: provided for, then dismissed.** Greg: the document
    provides for an anaesthetist to put in standard fixed prices, and "if you were inclined, you
    could set up a list in the default contract of what Ben was calling favorite procedures"; but
    after the debate on coverage, "we're spending a lot of time and effort doing something that we
    don't really think is necessary, which is sort of what Nick was saying yesterday. So they've
    dismissed it." Greg still expects "a really strong pattern" between surgeons' booking text and
    RVG codes, and "once you've got some history, you could run some smarts across that and almost
    pre-allocate them" (L306-314). An idea for later, not a requirement now. Bears on US-04.2.14,
    US-05.1.6 and OQ-88.
18. **The procedure text is shown as received.** Donald: "we will take the raw text from whatever the
    procedure is called from other systems and just display that as is", so nobody interprets the
    surgeon's codes (L343, also L237). Settled. Bears on US-02.5.7 and US-03.1.9.
19. **One default RVG Contract for the whole system; an RVG code on a booking is optional.** Donald:
    "there wouldn't actually be a no contract RVG per RVG code of per procedure. It's just one in the
    entire system." Greg: "That's right. That's dead right." (L366-368) Greg relayed Ben: Vanessa "wouldn't have a clue what RVG code that belonged to. And we don't expect her to. Just leave it unfilled, pass it through, we'll do it... it takes us two seconds." Greg then: "So the idea of putting an
    RVG code onto a booking is: if you can find it, fine; if you don't know, don't worry." (L372-376)
    Donald: "a good important change". Settled. Bears on US-04.3.3, US-03.3.1, FT-04.4, US-04.4.2,
    OQ-78 and OQ-62.
20. **The RVG picker works by type-ahead, showing code, description and value.** Greg: Ben's
    timesheet has the RVG list with type-ahead; "If I want H1, I just press H, and there they all
    are... he just types H1, and that's all he needs... it's super efficient." (L384-392) Donald:
    each row has "three parts. You'd have the code... whatever the short description is... And then
    you'd have to have the value because there'd be two T2s represented." Greg: "That's what that
    table's there for." (L394-396) Settled. Bears on US-03.3.1, US-05.1.1 and OQ-101.
21. **Modifier defaults kept quietly in the data model.** Donald asked whether base units and
    modifiers in the technical design's diagram should now be stripped out (L378). Greg left them
    "because they might be needed in the future"; an RVG group has a default base unit, and "I left
    the modifiers at zero because it's just a good place to populate a value as a default"
    (L380, L400). Donald: "the modifiers are still a worthy conversation we're having with Ben";
    Greg: "You're brave... I'm warning you now." (L402-404) Donald had liked the earlier design in
    which a child with zero looked to its parent's value, but "what we're describing now, that's not
    needed" (L406). Greg: that can still be built by defaulting modifiers to zero on the base table;
    "we don't have to rub their noses on it... It's just there quietly. And if they ever decide they
    want a prompt for modifiers, it's easy to backfill. You don't change database." (L408) "The user
    never interacts with it." (L439) Left open with point 9. Bears on US-05.1.5, US-03.3.4 and
    US-05.1.4.

### Arrangements and who can change the price

22. **Hospital RVG Contract: the hospital is billed, and the anaesthetist may change the price.**
    Reading the typical arrangements table, Donald: with a Contract named against Southern Cross as the
    billable party "you would not have to remember or fill in who that person is"; Greg: "Yep."
    (L444-446) Still reading the table, Donald: "Anaesthetists can change the price in this scenario, apparently; yes, great. So we just have an option: can the anaesthetist do a price override? Is it prepaid, yes or no?" (L448) Settled as read; Greg did not dispute it. Bears on
    US-04.2.1, US-04.2.2 and US-03.4.1.
23. **No discounts on a hospital's fixed-price Contract.** Asked whether the anaesthetist can apply a
    discount on a hospital fixed price, Greg: "No, I've checked that with Ben and he said no", because
    it is "sailing very close to the wind in terms of the Commerce Commission"; Ben: "if you don't
    want the rate, don't do the procedure. An anaesthetist can always turn down a procedure." Donald:
    "it's the hospital saying, 'You're doing it for this. Take it or leave it.'" (L448-454) Settled.
    Bears on US-03.4.1, US-04.2.2, US-05.2.5 and US-05.2.6.
24. **Only the office changes a fixed price without changing the Contract.** Reading "The office can
    override any price at any time, and that is the only way to change a locked price after changing
    the contract", Donald: "changing a locked price will carry some ramifications". Greg: "I'm not
    sure that language is too flash... if you've got a fixed-price contract, only the admin can
    change it." (L472-478) "Locked" should say "fixed": the office can "change the fixed price without
    changing the contract. Correct." In this context price "can be any price, rate, discount"; Greg:
    "price with a small 'p', and it's any of the pricing things" (L487-493). Settled. Bears on
    US-05.4.2, US-03.4.1 and US-04.3.5.
25. **"Draft" in Greg's documents should read "Active".** Donald: Draft now names a specific thing, a
    Draft List; an Active List is one assigned to an anaesthetist, then Submitted, then Authorised.
    Greg: "So once it's an active list, it's just part of this mainstream." Donald: "It's basically
    just replace the word draft with active." (L483-487) Settled. Bears on FT-01.6, FT-07.1 and OQ-17.
26. **An anaesthetist's prepaid Contract is set up in advance; perhaps a templated letter.** Donald,
    on a cosmetic facelift the anaesthetist wants prepaid: "somebody would have set up a prepaid
    contract for that anaesthetist in the system. What we were previously calling a first party
    contract." Greg: "I think it could be a generic process. There'll be a templated letter somewhere
    and it just goes out. But we'll have to test that." (L503-505) To be tested. Bears on US-04.2.14
    and US-06.3.6.

### Contract flags, header and lines (technical design sections 5 and 6)

27. **The Contract settings form a switches table.** Greg liked that the table "ended up being this
    neat little... switches table, and you can just set these switches and get any contract to
    technically do anything", but "I think that might in the long term not be a really flexible
    mechanism." Donald: "that's the kind of the way I always envisioned it... whole whack of different
    settings you can apply and you name the contract and there you go"; "the flexible tool that
    allows them to make whatever they need to so that there's a repeatable process for invoicing."
    Greg: "It's just firmed up." (L521-527) Bears on US-04.2.2.
28. **Four flags decide who is billed, how, and what the anaesthetist can change.** As read: "holder
    is billable party" (if true the holder is billed, otherwise "always the patient or guardian");
    "contract is editable" (an anaesthetist may change the values on the Contract's lines; typically
    false for a hospital's fixed-price Contracts, true for Contracts using RVG values); "contract is
    prepaid", which "triggers that process"; and the holder's anaesthetist (L538-542, L601-603). The
    billable party is "a pointer to a billable party. It's a list of billable parties." (L540)
    Donald checked that "is editable" means "can the price be overridden?... Discount, fixed, whatever
    it may be"; Greg: "Yeah, that's it", with "no other conditions that determine it's just a can or
    can't be" (L586-596). Walking the cases table: billable party hospital, hospital, patient,
    patient, patient; the overridable column was read as can, can't, can, can (L613). Greg: "those are unconstrained conditions.
    There's no interdependency, but you get that combination and they drive the behavior." Donald:
    "this is exactly how I was expecting it." (L615-617) Greg noted an inconsistency, "in the model it
    says contract holder", then "No, that's correct" (L603). Settled. Bears on US-04.2.2, US-03.4.1,
    US-04.2.1, US-04.1.5 and FT-06.2.
29. **A Contract is a header with lines.** Greg: a contract holder "is an organisation that you bill
    on a regular basis" and has many Contracts; Greg thought Forté and St George's both have Southern Cross, DHB and ACC Contracts, and "even for one procedure they've got multiple contracts, because ACC
    procedures' contracts may be fixed price, but Southern Cross contracts at the same hospital for
    the same procedure are RVG contracts. That's why it's important to get the billable party and the
    contract lined up." "A contract is like a header and lines. The header tells you it's a Southern
    Cross contract for this hospital for this year." Editable and prepaid are set on the header, and
    "All the lines in that contract have to be of a similar type". "The default contract is empty."
    An anaesthetist's prepay list is a Contract whose lines are the prepaid procedures and amounts;
    the office picks one, and the anaesthetist "would probably need to be involved in specifying what
    prepayments he wanted" (L544-548). Greg's analogy: an anaesthetist tells Vanessa "I've got these
    25 procedures that I want to prepay" with prices, from a spreadsheet; "they're 25 lines and they
    just sit there. And because they're fixed-price, they don't actually need a reference to the RVG
    group." (L552-564) Settled, except the RVG reference on fixed-price lines (point 37). Bears on
    US-04.2.4, US-04.2.1, US-04.1.5 and US-04.2.14.
30. **Who can hold a Contract.** Greg: "the contract holder could be the hospital, they're always the
    billable party. The contract holder could be the anaesthetist, because it's a generic model, or a
    surgeon's rooms, and they're never the billable party." (L580) Settled as stated; how a surgeon's
    Contract is found is point 35. Bears on US-04.1.5, US-04.2.1 and OQ-67.
31. **An anaesthetist's Contracts are offered only on that anaesthetist's bookings.** Greg: "If there
    is an anaesthetist specified associated with the contract, then those contract arrangements only
    belong to that anaesthetist... If the booking is associated on a list with an anaesthetist...
    You can show those contracts for the office to choose one... That's the only use it has."
    (L605-611) Settled. Bears on US-04.2.14, US-04.3.2 and OQ-91.

### Choosing the RVG code and the Contract

32. **Booking setup: the surgeon's text, then the RVG code and the Contract, in either order.**
    Donald pictured a text field holding the surgeon's wording "always just there for reference",
    then the RVG code, then the Contract, "I'm not saying it has to be that way" (L636). Greg: "the
    contract determines whether you even need to select an RVG code." It might be the default, then
    pick the RVG code; "Or it might be SXAP... that will tell you the Southern Cross arrangement at
    Forté, whether that's fixed price or RVG. You're more or less done at that point, and you've got
    the option to identify an RVG code if you want to." (L642-650) On the reading "choose the contract
    holder and the contract", Greg: "it should say contract" (L859-861). Donald: either the office or
    the anaesthetist may do it; "if a fixed contract is chosen first, the RVG dropdown box... becomes
    disabled", and the other way round the RVG code filters the Contract list (L704). Greg: "half the
    time the office staff might not even know what RVG might necessarily apply." (L698) The order and
    navigation are not settled ("I don't know how that navigation's going to work", L646). Bears on
    US-04.3.2, US-04.3.4, US-03.3.1, US-04.3.1, US-03.4.1 and OQ-66.
33. **How long the Contract list is: Greg expects it short, to be tested.** Donald worried that with
    no RVG code chosen the Contract list would show "every single contract in the system because an
    RVG code has not filtered it down yet" (L652-660). Greg: "it might only
    have a dozen... it knows the hospital"; the list shows Contracts, not Contract lines: "you've got a
    filter of contracts, not contract lines... The contracts are Southern Cross, ACC", and the
    anaesthetist's list: "That's all you see." (L658-678) Donald: until a Contract is picked, the
    hospital's, the surgeons', the anaesthetist's and the default Contracts are all candidates; Greg:
    "Actually you're right... You need to make that choice to navigate down to more detail."
    (L688-694) Greg: "we need to ask Vanessa, but I don't think you'll see more than a dozen contracts
    on a hospital. You'll probably only see one on an anaesthetist", since "those fixed price ones at
    the moment are only used by about 6 cosmetic surgeons. So the other 80 would never have a hit",
    and "probably there are a couple of surgeons rooms that have surgeons arrangements" (L706-710).
    The order: "you've got default. It's always at the top... And then you've got hospital contracts.
    And then you've got any special surgeons and anaesthetists." (L865) Donald suggested a body-area
    filter; Greg: "You've got no data to work off... that's not how the contracts are structured."
    (L867-877) Both had agreed earlier to test whether the list gets unwieldy (L704-706). Bears on US-04.3.2, US-04.3.3 and OQ-66.
34. **Vanessa's price lists, and scrolling the last level.** Donald showed the files Vanessa has
    given: a Solutions Plus export ("basically garbage"), Merivale Plastics and several Southern
    Cross lists (L715). Greg: "Merivale Plastics is a really good example. That could be a surgeon's
    rooms, so those are the agreed prices." (L717) Donald: every line in them, 15 on one and 10 on
    another, all fixed prices, "will exist as a contract in the system that you have to search
    through" (L727). Asked how people decide, Greg: "I think there is a structured approach before
    you just give them a big data dump" (L745-749); but "once you get down to that bottom level, you
    don't have a choice but to scroll through that list" (L753). Donald: "maybe that's just a problem
    that exists." Greg: "That's just the problem, definition." (L755-760) Left open. Bears on
    US-04.2.4, US-04.2.13, US-04.3.2 and OQ-66.
35. **Surgeons' fixed-price arrangements: a gap in how a Contract is found.** Greg: "this discussion
    has shown a flaw in my document already... if we get a contract in that's from Merivale Plastics,
    how does the system know that contract is relevant to this booking in terms of prompting Vanessa
    for prepayment? Well, it might not be prepayment." (L760-764) Some anaesthetists want prepayment
    for some procedures (L772-776). Donald: with the intermediate list and the anaesthetists' profiles
    gone, "the only method to serve automated prepayments is the contract being selected?" (L778)
    Greg: the same mechanism as the anaesthetist's column may be needed for "surgeons having pre-made
    arrangements"; the choices in front of Vanessa are the default Contract, the hospital's Contracts,
    the anaesthetist's (shown as the Contract header, grouped) and the surgeon's (L780-822). Greg: such a surgeon's arrangement "wouldn't be prepaid" (L822). Some surgeons' rooms have arrangements with AA at a fixed price for regular procedures "to give their
    patients price certainty" (L826-828). Greg: "I haven't accommodated that... in the data model";
    Donald: "Isn't that just a fixed price contract of the surgeon?"; Greg: "it doesn't support the way
    it's set up... It's just a lookup hole. It's all right." (L830-850) Left open. Bears on US-04.2.1,
    US-04.2.14, US-04.3.2, US-06.2.1, US-12.1.3, OQ-67 and OQ-92.
36. **A Contract for a standard RVG price less a fixed discount.** Donald: beside RVG-style,
    fixed-price and fixed-rate Contracts, "there could also be a standard RVG contract with a fixed
    discount on it. Ben said that", for example a hospital where "it's standard RVG pricing minus
    20%" (L911-915). Greg: "you'd want to put that up, at least on the booking... as a pre-filled
    value?" Donald: "it would just be another contract line" attached to that hospital (L917-919).
    Greg relayed Nick: "we've got a DHB contract that specifies the price at a discount." (L921)
    Donald plans, once the documents are agreed, to have Claude pre-fill Contracts from Vanessa's
    documents (L919). Settled. Bears on US-05.4.3, US-04.2.2 and US-04.2.4.
37. **Fixed-price Contract lines and RVG codes: left unsure.** Donald asked whether fixed-price lines
    would still link to an RVG code so they show when filtering by RVG; Greg: "I can't remember if we
    said it or not, but... It's not compatible with the design." (L719-725) Later, for "Merivale
    Plastics Facelift" with an RVG code, Greg: "Contract line... just H3 facelift"; Donald: someone
    could search H3 and see only H3 Contracts; Greg: "that's like a reverse lookup... You should be
    able to do that." (L883-897) Donald: "not all contracts will have necessarily an RVG attached";
    Greg: "All of the fixed ones should have, really, because there's an opportunity to set up your
    master data." (L899-901) On the reading "Contract lines already contain it when relevant", Greg:
    "Fixed price contract lines would contain it", then "Fixed price contract lines aren't there or
    are there? I don't know." (L903-909) Left open. Bears on US-04.2.4, US-04.2.14, US-04.3.2, OQ-88
    and OQ-89.

### Time entry, office review and the last edit

38. **Time entry and office review, as read.** The executive summary, as read: at time entry "record
    BTM and notes if required... Change the procedure contract or RVG if needed; changes are audited.
    Then set the price or discount only if the contract allows it." Donald: "Seems good to me." Office
    review: "check flagged changes and warnings, such as insurance on a patient-billed contract",
    which Donald called "a big question mark" (L934). Donald recalled that a List does not disappear
    for the anaesthetist until it is confirmed or submitted (L934). Read later: "Until the list is
    submitted, the office changes are starting points, and it can change, and the office sees every
    change at review." (L976) Bears on US-03.4.1, US-03.5.1, US-07.2.1, US-07.2.2 and US-07.2.3.
39. **Neither side outranks the other: the last person to edit it stands.** Donald: "as I've heard
    Ben and others say, the anaesthetists are actually the authority"; Greg: "Yeah, but vice versa."
    Donald: "If each side can do whatever they want, the system doesn't allow or disallow it. It's
    just a case of who saw it last, and they'll update it and then communicate with the anaesthetist."
    Greg: commonly the anaesthetist "may not be familiar with how this procedure is priced, so he
    throws it at the office to sort all of that... So yeah, it's permissive, right?" (L934-944) On
    the document's price list, Greg described a sequence of priority with the office's entry last (L976-994). Donald: "I don't see it
    as an override. I just see it as the last person who touched it, because there's not actually one
    group of users having more authority over the other. As far as the system is concerned, it's who
    updated it, and what does that look like at the point you say 'send it'?" Greg: "Yeah, good. I
    agree." Donald: "Okay, we're aligned." Greg: "It's just the contributors to the end document."
    (L996-1002) Donald mentioned event sourcing and said it is not what he thinks this needs (L1007-1011). Settled. Bears on US-05.4.1, US-05.4.2, US-03.5.1,
    US-07.2.3, FT-05.4 and OQ-16.
40. **Prepayment, as read, with its open question.** As read: prepaid procedures, common for cosmetic
    surgery, are "collected up front at an estimated price and settled after the procedure"; the
    booking office selects it, the amount is fixed, and more or less can be billed after if needed.
    Donald: "We obviously have an open question about exactly how that should work at this stage."
    (L1011) Not discussed further. Bears on FT-06.2, FT-06.4, OQ-76 and OQ-96.
41. **Maintaining Contract schedules: a hand-kept header, and merging new lines against old.** Greg
    called the document's section "just today's punt about how to maintain contract details" (L1013).
    His new thought: "you could hold a contract header, which is manually maintained... because there
    aren't many of them and it's a little complicated", with a list underneath, and "you need to be
    able to merge new data with old data", the system helping the user see "what's changed, what
    hasn't changed, what's been removed, and provide some sort of screen that lets the user manage
    those statuses and say, 'Yep, that's it.'... I don't care how it happens. It's just the idea of
    how you manage data through a time-based lifecycle." (L1017-1021) Whether this is in the first
    release was not discussed. Bears on US-04.2.13, US-04.2.10, US-04.1.3 and OQ-100.
42. **Greg to make a v6 of the pricing documents.** Donald offered to send Greg the transcript and
    asked whether he wanted to make a v6 before the requirements are updated; Greg: "I'm happy to do
    that. It's only minor... I'll send that to you tomorrow." (L1026-1032) Done: the v6 documents
    were filed on 16 October.
