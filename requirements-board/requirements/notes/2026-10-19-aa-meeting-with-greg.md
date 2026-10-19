# AA meeting with Greg, 2026-10-19

- **Who:** Donald Fraser (Stratos) and Greg Smith (RFP author, Peritia), on a remote call that ended
  at about 16:00 NZDT ("It's 4:00 now", L573). Ben (AA principal) and Vanessa (AA office
  administrator) are referred to but were not there.
- **Covered:** a read-through on the Requirements Board of EP-07 (the List approval workflow,
  FT-07.1 to FT-07.4), which Donald confirmed on the board; then a pass through the open questions:
  OQ-49, OQ-60, OQ-77, OQ-79, OQ-80, OQ-81, OQ-83, OQ-84, OQ-85, OQ-87, OQ-89 and OQ-90. During the
  meeting Donald asked Claude to reword the open questions so each states plainly what is still to
  answer (L151), typed answers into OQ-49, OQ-79, OQ-89 and OQ-90 on the board, and asked Claude to
  update and close OQ-77, OQ-80, OQ-81, OQ-84, OQ-85 and OQ-87 from this transcript.
- **Inputs gathered here:**
  - one reconciled transcript,
    [AA Meeting with Greg Oct 19th Reconciled Transcript](<../artifacts/files/AA Meeting with Greg Oct 19th Reconciled Transcript.md>),
    registered as artifact [AR-42](../artifacts/AR-42.md);
  - the board edits Donald made during the session, 14:29 to 14:48 NZDT, from
    `requirements-board/.history` (edits tagged `board`), and his typed answers on the questions
    named above.

Cite a point as `"Notes 2026-10-19 · AA meeting with Greg #n"`. Points are numbered once across the
whole note. Speakers' wording is kept in short quotes (spelling fixed, filler dropped); the
summaries around them are paraphrase, with the transcript as the authority. Positions are transcript
line numbers ("L133-135" is lines 133 to 135). Much of the transcript is Donald reading an item or a
question aloud; a reading is the item's text, not a statement by either speaker. Where Donald says
"Claude, update X", that is an explicit request to change that item or question, and the point says
so.

## Questions answered

1. **NHI is mandatory (OQ-49).** Donald, reading the question: "Booking without an NHI update. NHI
   is mandatory with no block." Greg: "It's mandatory now, so that's that." Donald: "It's
   answered." (L85-91) Donald's board answer: "NHI is mandatory." This repeats 16 October (Notes
   2026-10-16 · AA meeting with Greg #3). What "with no block" means was not said; the question's
   remaining case, an incoming Booking that arrives without an NHI, was not discussed. Bears on
   US-03.1.5, US-11.1.1, US-11.1.4 and US-11.1.5.
2. **A split asked for before the combined invoice is sent is a normal admin edit (OQ-77).** Donald
   read part 3 and did not follow it (L91-95). Greg: "the first process is it's gone out, so you roll
   it back and redo it. But of course, if it hasn't gone out, you just... the admin just edits it."
   Donald: "if it's not authorised and sent to the billing engine yet, you would just edit it." Greg:
   "Just edit it... So that should just say that's handled by a normal admin edit." (L97-105) Donald:
   "Claude, when you read the transcript about question 77, please mark it as completed and just
   change it to represent what we've just said." (L109) Settled. Bears on US-08.6.3, US-08.6.4,
   US-08.6.5 and US-07.2.3.
3. **Notices and to-dos are cleared by hand with a tick; nothing expires (OQ-79).** Greg: "they just
   need some sort of tick and flick mechanism... Somebody reads it. If it's just a notice saying [it
   has] been moved to this list, you just tick it and move on." (L111) "What's being asked is how do
   they expire so they don't stay on the list on the screen?" (L119) Donald's answers, typed during
   the meeting (L133): "for now, lists and bookings will have an option to alert the office to
   review / action them, with a note"; notices "never expire; must be marked as resolved manually,
   then hidden"; and a notice has two states, active or resolved: "I don't like the idea of one
   person reading a notification but not actioning it and then having it look like it's been read by
   somebody else." Greg: "that's exactly right. It's a tick box thing... I need a way to make them go
   away, whether they're to-dos or notifications. I think we don't want notifications that all just
   magically disappear." (L135) Donald's board answer to part 4 (where the pool sits on the admin
   dashboard): "a design question for Claude to resolve for now." The flag-a-Booking idea is the one
   raised on 14 October (Notes 2026-10-14 · AA meeting with Greg #7), now extended to Lists. Settled.
   Bears on FT-13.8, US-13.8.1, US-13.8.2, FT-13.7 and US-03.6.3.
4. **Prepayments are held in a prepay holding account, not paid to the anaesthetist (OQ-80).** Greg:
   "now we don't pay the money to the anaesthetist, we hold it. And it makes all the curly problems go
   away." (L149) "We need to set up a prepay account that has the same sort of accounting status as an
   anaesthetist... the balance of the prepay account would be all the deposits we've received for
   procedures that have not happened yet." (L157) "When we issue the pair, one side of the pair is the
   patient... normally the other side of the pair is the anaesthetist. But in this case, the other
   side of the pair would be the prepay holding account. So we could treat it just like an
   anaesthetist." (L161) Part 1, when the pair is created: Greg: "there has to be a pair created when
   it's prepaid" (L153); "The invoice is always generated in order to collect the prepayment" (L165).
   Donald pictured the office choosing the prepayment Contract on one screen and approving it on the
   screen where they approve outgoing invoices, and dismissed "when the money is received" because the
   money cannot arrive before the invoice is sent: "So prepayment invoices [are] generated when an
   admin approves it." Greg: "Is the answer." (L175-177) Part 3, a move to another anaesthetist:
   Greg: "if a booking is moved, the payable doesn't move because the payable is no longer the
   anaesthetist, the payable is the holding account." Later, "when the booking is confirmed and
   submitted... instead of generating another invoice to the patient, it generates another pair to
   move the money from the holding account to the anaesthetist... Whichever anaesthetist did the
   list." (L201) "A prepayment now is a two-step process. One is to collect the money and put it into
   a holding account. And the second step is to move it from a holding account to the anaesthetist."
   (L205) Donald: in a regular procedure the money comes into AA and goes straight back out to the
   anaesthetist; here "it's paused until the procedure is actually finished"; Greg: "Yes." (L207-209)
   On the directors' rule that nothing is recalculated, Donald: "Whatever was the prepaid price for the
   first anaesthetist when the booking was created and the prepaid invoice went out, that's just the
   price." (L211) Part 2, amendments: on a move the patient need not be told anything about the
   payment, since the patient "didn't know who the anaesthetist was going to be in the first place"
   (Greg, L181), but the prepayment request carries an email that could name the anaesthetist, and
   "there's nothing to stop the system... sending out an email saying your anaesthetist has changed"
   (Greg, L185). Donald: such an email would say the anaesthetist has changed but the payment remains
   the same and the patient need do nothing; Greg: "whatever they want to put, no worries."
   (L187-193) Donald: "Claude, please update question 80 with our answers and mark it as complete."
   (L211) Settled, with two doubts: Greg named the second step's trigger as the booking being
   "confirmed and submitted", where the catalogue hands a List to billing when the office authorises
   it; and the combination of a move, the holding account and a price override is still open (point
   15). This replaces OQ-70's answer that the payable half is updated to the new anaesthetist. Bears
   on US-06.5.4, US-06.3.1, US-01.4.6, US-08.2.2 and OQ-70.
5. **An anaesthetist never keeps a List on a Slot they have marked unavailable (OQ-81).** Donald read
   the question and showed the admin screen, where a List stays assigned to an anaesthetist with a
   warning that they cannot do it: "in a world where draft lists now exist, it would make more sense
   for any of these things to just fall back... to the admin office and not still stay on the
   anaesthetist." (L233) Greg recalled Ben: "on the day, the anaesthetist would typically resolve it
   himself because it's one of those ring a friend, can you do the list type things", often asking an
   anaesthetist doing a morning List at the same hospital to take the afternoon; after hours it is
   "absolutely a necessity"; "if it's the next day or later, they give it to the office and ask them
   to sort it out." (L235-239) Donald: "I basically see this as two paths. You either reassign to
   somebody else and mark yourself as unavailable, or you hand it back to the office and mark yourself
   as unavailable. But I don't see that there should ever be a state where you keep it with yourself
   and mark yourself as unavailable, because then it requires proactive searching from the admin
   team." (L241) Greg warned the List could seem to disappear if unavailability is marked first
   (L243). Donald: "we could make it so that the system detects if you have a list on a day when
   you've marked yourself as unavailable and force you to resolve the question, transfer or return to
   office." (L245) Greg: "as soon as they try to... say, I'm unavailable... It forces them to make that
   decision about do you want to transfer this list or do you want to return it to the office? So
   that's conscious." (L259-263) A List returned to the office appears among the office's Draft Lists,
   sorted by the nearest day, so it does not disappear (L249-255). The exact screens are still to be
   worked out ("We should figure out the kind of proper UX flow", L245). Donald: "Claude, can you
   please update question 81 based on our chat and all relevant stories?" (L267) Settled. Bears on
   US-01.5.2, US-01.5.4, US-01.3.2, FT-01.6, US-01.1.1 and OQ-64.
6. **Whoever moves a List is asked what the vacated Slot becomes (OQ-84).** Donald showed the
   prototype's office reassignment, which asks whether the vacated Slot becomes free or unavailable:
   "if you choose to transfer a list to somebody else or transfer it to the office, the app needs to
   ask you what does that slot become? And I think it will be the same pattern there." Greg:
   "Agreed." (L273-275) In the prototype's anaesthetist app: "Return to office and then mark as
   unavailable or free. This is perfect." Greg: "This is very nice. We like that." (L277-279) On part
   3: "Does the same apply when the office reassigns a list? Yes." Donald: "Answer this question.
   84." Greg: "One path is the answer, isn't it?" Donald: "It's always the same regardless."
   (L281-287) Settled. Bears on US-01.4.1, US-01.4.3 and US-01.2.1.
7. **A single Booking moves only to a free anaesthetist, as a new List (OQ-85).** Part 1, finding the
   receiver: the app already shows colleagues with a free Slot, but only a handful, so "some sort of
   search box would be valuable" (Donald, L287). Greg: "If you could just type a letter in for the
   name, that would work well"; both described a type-ahead box that filters the list as letters are
   typed, like the RVG code picker (L289-301). Donald: "They could search via an actual search
   function or they could scroll the list of available lists. That's the answer to this." (L303) Part
   2, where it lands: Greg recalled the use case: "somebody rang Ben and said, I don't want to do
   this child. So he did the last procedure of the list... Ben was free, created a list and put the
   one booking on it." (L305-309)
   Donald: "I don't think there's ever a situation where you transfer a booking into somebody else's
   list. The only option is you transfer it to somebody who is free and it creates a list in that
   slot." (L311) Greg: "let's make the requirement at the moment that the anaesthetist has to be
   free... And we can change it later if it's not working." (L329) Whether others may then add
   Bookings to the new List was not discussed. Part 3, notifying: like a List move, a notice goes to
   the office "but you don't have to do anything about it" (Donald, L335); Greg: "they could offer to
   raise an email or they could just flag it" (L337); Donald: "there's an option to notify the admin
   team if needed." Greg: "Yeah." (L339-341) Part 4, the blacklist: Donald recalled Ben saying no
   anaesthetist is warned of another anaesthetist's blacklist with a surgeon: "they're professionals
   and they can deal with it from time to time." Greg: "it's very sensitive in terms of not everybody
   knows what's going on." (L343-345) Donald: "Claude, we talked about a lot there in question 85.
   Please update." (L365) Settled, with one doubt: whether the notice to the office always posts
   (as for a List move) or is optional. Bears on US-01.4.5, US-01.4.7, US-13.8.2 and OQ-102.
8. **The List stays with its day; Bookings that move arrive again as new Bookings (OQ-87).** Greg,
   giving his view ("I think", L395-399):
   "it's very common for the time of a procedure to be rescheduled within a list. If it's a different
   day, by definition it's a different list." (L391-395) The question "trips over itself because it
   doesn't understand the difference between a list which is immutable because it's defined by what
   day it's on and the bookings which sit on the list... I think that's fundamental to how the system
   works. And I also think that's how the surgery thinks about it." (L399) When the rooms move a List
   to another day, "List A gets emptied" and "goes back to be a slot", though "I'm not sure whether that means it's a draft"; "the doctor would... cancel the
   list and repopulate another day. They wouldn't actually do it as moves because they don't have the
   capability of doing that across an integration. So we just get... new PDFs arrive and those
   bookings would be popping up on a different day." (L403-411) Donald: the patient keeps their NHI
   but the booking's own identifier is not kept: "a new booking is created with me and [the old one
   is] deleted." (L413) Greg: "we get the simple end of it. We just delete the booking and the new
   ones just arrive because they might not move the list in toto. They might reshuffle those bookings
   amongst existing future lists." "We just delete it and wait for new news." (L419-423) Donald took
   all three cases as answered and asked: "Claude, if you can go ahead and update question 87."
   (L425-431) Settled. How a removal is noticed at all is point 18. Bears on US-02.5.2, US-02.5.3,
   FT-02.2 and US-02.2.1.
9. **Contract lines have no time band (OQ-89).** Donald read the question's settled part; on the rate
   override for the whole Procedure, the fixed discount and the anaesthetist's own price or discount
   only where the Contract allows it, he found it true (L449-461). Neither understood the line about
   the add-on flag and quantity rule; Greg: "I think you can just delete that because they were
   dropped, but it doesn't matter." (L501-503) On the time band, Donald: "I don't think that's a
   thing." Greg: "I don't recall any conversation about that." (L505-507) Donald's board answer: "As
   far as we understand, contracts / contract lines don't have any concept of a time band. Time is
   only an optional recording from the anaesthetist." (L511) Settled. Bears on US-04.2.4, US-04.2.2,
   US-05.2.5, US-05.2.6 and US-05.2.1.
10. **Keep the RVG multi-procedure default (OQ-90).** Donald first said time units are also charged
    only on the primary procedure; Greg disagreed: "I think procedure 2 has its own time recording.
    And the point of this is that the base units may only be applied to the primary procedure... there
    should be no base units on the secondary procedure." (L527-541) Donald then read FT-05.3: base
    units only on the primary procedure; "every procedure carries its own [time units], calculated
    from its own recorded times"; modifiers all on the primary procedure when the units total four or
    fewer, split equally above four. "Okay, you're right... this is right." Greg: "That's good."
    (L543-545) The alternative of pricing each Procedure alone for base and time units, Greg: "that's
    not correct." (L555-557) Donald's board answer: "keep the default as defined in" FT-05.3
    (L567-573). Which Procedure is primary was not discussed. Settled. Bears on FT-05.3, US-05.3.1,
    US-05.3.3 and US-05.3.5.

## Other points

### EP-07: the List approval workflow

11. **EP-07 read through and confirmed.** Donald read FT-07.1 to FT-07.4 and their stories aloud
    (L15-85), with Greg agreeing ("Yep") or adding the points below. On the board at 14:48 NZDT
    every live EP-07 feature and story except US-07.2.2 went to Confirmed (FT-07.1 to FT-07.4,
    US-07.1.1, US-07.2.1, US-07.2.3, US-07.3.1, US-07.3.2 from Proposed; US-07.4.1 and US-07.4.2 from
    Verify); US-07.2.2 was already Confirmed. At 14:29 Donald edited EP-07's description: while a
    List is ACTIVE the anaesthetist "is expected to complete its Bookings", and after submission "the
    anaesthetist can still see it and anyone can change it until the office authorises it". On
    US-07.1.1: "We don't have images of this yet, but we will in the future." (L17) On US-07.4.2,
    Greg: "two and three are almost repeat"; Donald: "it is repeating itself... this is fine."
    (L83-85) Bears on EP-07 and its features and stories.
12. **Office review: the insurer and the approval number sit on the Booking.** Reading US-07.2.2,
    Donald asked where insurance landed. Greg: "It's meant to have the insurer and the insurance
    approval number. Those two things have to sit somewhere on the booking." "If the insurance is
    blank, that's probably okay if the patient's paying. Otherwise, you need to specify the insurer,
    and the office at this point would be checking that the approval was there, but the hospital will
    have already done the work for them. So they just need to make sure their version has got it as
    well." (L21-27) The under-18 warning was read but the reading is garbled in both sources (L33).
    Bears on US-07.2.2, US-11.4.3 and OQ-93.
13. **Authorise the whole List; no partial release.** Greg asked whether they had discussed letting
    the good Bookings go and holding back one (L49). Donald searched the board: "There's no partial
    payment, there's no partial invoice pair creation." Greg: "Let's leave it like this because it's
    cleaner to start with and it will work." (L55-57) Settled for now. Bears on US-07.3.1.
14. **After authorisation, corrections are new records, not edits.** On US-07.3.2, Greg: "That's sort
    of a long way of saying it's locked." Donald: where AA needs to fix something, "they have the tools
    of generating credits or invoices, ad hoc attached to a procedure... But they wouldn't go back and
    edit something itself." Greg: "it becomes like a list of changes really, rather than changing the
    original." (L61-67) Settled. Bears on US-07.3.2, US-08.6.1 and US-08.6.3.

### Prepayment still to work through

15. **A prepaid price override with a move and the holding account is still open.** After OQ-80,
    Greg: "there's a thing there about what do we do with prepays where... the anaesthetist overrides
    the price... we might need to go and revisit the prepay process again in a bit more detail. But
    let's leave it for now." (L213) Donald thought prepaid Contracts "practically speaking... should
    just be a fixed cost" (L215). Greg: "Technically, they are always an estimate. And Ben said
    there's a strong [unclear] that they don't change prepaid values" (L217), yet "they are allowed to
    [go] both up and down, which was in the document that I updated recently and that was checked by
    Ben" (L221); this concerns "only... a few guys", not the whole fleet. "In this situation you could
    have a change of anaesthetist, a holding account and an override amount and they could all happen
    on the same procedure. So we may need to redraft that a bit so there's some clarity." Greg: "I
    might draw that out because it is a bit subtle" (L221-229). Not settled. Bears on OQ-96, OQ-104, US-06.4.1, US-08.2.2 and US-03.5.1.

### Moving work and choosing a colleague

16. **Reassignment orders available colleagues by seniority and pairing.** Greg recalled Ben's "rank
    for matching... directors, shareholders, non-shareholders" for how the system might allocate
    Lists (L349). Donald: it sequences, not assigns: the prototype's reassignment shows the available
    anaesthetists with their tiers, weighting some higher, and a preferred pairing with the surgeon.
    Greg: "It was sequencing the list of availability... using that seniority"; "Excellent." (L351-357)
    Settled as already built. Bears on US-01.4.1, US-01.4.5 and OQ-102.
17. **One List per Slot stays; two Lists in a half day are handled outside the system.** Donald
    raised an anaesthetist with only a few Bookings early in the AM Slot taking more later in it.
    Greg: "Ben could do a couple of procedures at Christchurch Eye and then go... down the road to the
    charity hospital and do a couple more all in one afternoon." (L315-321) Today "they do it outside
    the system. But... charity hospital is not so bad because it's not billed. So the system doesn't
    need to know about it." (L325) Supporting it means "you can have multiple lists a day and it gets
    really complicated... for the small benefit, it's probably not worth it" (Greg, L333). Settled for
    now, no change ("we can change it later if it's not working", Greg, L329). Bears on US-01.1.1 and US-01.4.7.

### Booking intake

18. **Removals must be detected from the rooms' snapshots.** Greg: "how does the surgeons' rooms
    notify deletion? Because we just get PDFs. So we're going to have to detect where a booking is no
    longer on the list where it was before because a patient may have insurance declined... the rooms
    will delete the booking and they'll send us a snapshot of the list again and it just won't be
    there. So we're going to have to do some sort of match and merge to detect removals." (L427)
    Bears on FT-02.2, US-02.2.1, US-02.5.3 and FT-02.1.
19. **Which source starts a booking: surgeons' rooms or the hospital, to confirm.** Looking at the
    booking-sources diagram, Greg: "the surgeon's room is probably the dominant provider of information
    and... the initiator... the hospitals are only seen once, on the day before the list is performed.
    ... we may need to invert that and make the hospital's future work and the surgeons the initial
    work." (L375) Donald recalled Vanessa saying most bookings come from the hospital, and wants it
    clarified with Ben and Vanessa together (L377-385). Greg: "they start at the surgeon's room and the
    hospital only updates the day before. This is the latest version I've had from Ben and Vanessa
    together." (L383) "It doesn't matter. It just determines which integration gets done first."
    (L387) Greg: it is normal for a List to start with one booking and fill over time (L371). Not
    settled. Bears on EP-02, FT-02.1, FT-02.2 and OQ-13.

### Contracts and pricing

20. **Whether the anaesthetist may change a Contract's price, rate or discount is a flag on each
    Contract.** Greg: "if a contract specifies a price, a rate, or a discount... is the anaesthetist
    allowed to change it? We haven't answered that question to my satisfaction" (L467-487); "the word
    'fixed' isn't part of the definition" (L483). Donald: "as far as the system is concerned, it
    doesn't really matter. It can just be a setting that is applied by AA. So you in theory could have
    a price on a contract, and mark it as not being able to have a price override and therefore it
    sort of becomes fixed. Or... we will have a price on this contract, but we trust you, anaesthetist,
    to do what you need to do." (L489) Greg: "The flag on the contract might be the best way because
    then it's not global. The rule is not global... I'm happy now." (L491-495) Earlier: "I think the
    definition of what's fixed or not might be a little rigid, but we can worry about that another
    day." (L463) Settled. Bears on US-04.2.2, US-03.5.1, US-05.4.1 and OQ-107.
21. **The prototype's multi-procedure entry does not match FT-05.3.** Donald showed adding a second
    Procedure in the prototype; Greg and Donald agreed "the prototype's wrong", perhaps "just not been
    updated" (L535-555). A prototype finding, not a requirement change.

### Not answered

22. **OQ-60 and OQ-83 left for later.** OQ-60 (the AA per-invoice fee) is "a question to the
    accountant" (L91). OQ-83 (the anaesthetist's sign-in): "these are all questions to kind of ask
    towards the end of the discovery." Greg: "You need to know what your platform's going to be before
    you can answer them." (L267-269) No change.
23. **Next sessions.** Donald stopped at about 16:00 to process the meeting. The next session is 9:00
    the next morning, remote; Greg can do Friday in person, though he may have to change it at short
    notice (L573-593).

### Added on verification

24. **Invoices reach the anaesthetist's outstanding balance quickly.** Reading US-07.4.1, Greg first
    expected "a time delay... We'll just train the anaesthetists that it's like an overnight refresh",
    as Xero may not work in real time (L73). Donald expects a version of it to be visible "pretty
    quickly", since the system creates its own pair and syncs with Xero for status updates (L75).
    Greg: "when they insert the record... there's a return value which has got like a unique ID on it.
    So actually... it's synchronous effectively." (L77) No change. Bears on US-07.4.1 and FT-09.1.
