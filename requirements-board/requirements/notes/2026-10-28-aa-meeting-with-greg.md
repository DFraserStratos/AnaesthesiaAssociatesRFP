# AA meeting with Greg, 2026-10-28

- **Who:** Donald Fraser (Stratos) and Greg Smith (RFP author, Peritia), in person, over a day in two
  parts: Part A in the morning, ending at the lunch break (12 to 1, Part A L393-401; "58, my goodness",
  L1141); Part B in the afternoon. Ben (AA principal) joined Part B by phone for one question (Part B
  L659-729). Vanessa (AA office administrator) and AA's accountant are referred to but were not there.
- **Covered:** a read-through on the Requirements Board, item by item. Part A: EP-05 (RVG master data
  and modifiers, unit and fee calculation, changes to a price, ACC and pre-op events), EP-11 (patient
  record and NHI, who is billed, outstanding balances and alerts, insurers), and EP-06 up to FT-06.3,
  with a walk through the billing and invoice flow diagram (AR-24). Part B: the rest of EP-06
  (tracking, letter templates, settlement after the procedure, the trust and holding account,
  cancellation), Greg's whiteboard explanation of the trust account and the holding account, the call
  with Ben on changing a prepaid price, and EP-12 (anaesthetist profile and reporting). Donald edited
  items live on the board and, many times, asked Claude to make a change ("Claude, ...").
- **Inputs gathered here:**
  - two reconciled transcripts,
    [AA Meeting with Greg 28th Oct A Reconciled Transcript](<../artifacts/files/AA Meeting with Greg 28th Oct A Reconciled Transcript.md>)
    (morning, artifact [AR-48](../artifacts/AR-48.md)) and
    [AA Meeting with Greg 28th Oct B Reconciled Transcript](<../artifacts/files/AA Meeting with Greg 28th Oct B Reconciled Transcript.md>)
    (afternoon, artifact [AR-49](../artifacts/AR-49.md));
  - Greg's whiteboard explanation of the trust account and the holding account in Part B, which was
    photographed for reference only and not filed; the transcript is the evidence for it;
  - the board edits Donald made during the session (uncommitted changes to items, the AR-24 diagram and
    its sidecar, and a new question OQ-117), listed under "Board edits made during the session".

Cite a point as `"Notes 2026-10-28 · AA meeting with Greg #n"`. Points are numbered once across the
whole note. Positions are line numbers in the transcript of that part: "A L135" is Part A
([AR-48](../artifacts/AR-48.md)) line 135, "B L695" is Part B ([AR-49](../artifacts/AR-49.md)) line
695; a range such as "A L123-135" is lines 123 to 135. Speakers' wording is kept in short quotes
(spelling fixed, filler dropped); the summaries around them are paraphrase, with the transcript as
the authority. Much of the transcript is Donald reading an item aloud; a reading is the item's text,
not a statement by either speaker. Where Donald says "Claude, ...", that is an explicit request to
change something, and the point says so.

## Questions answered

1. **A prepaid price is locked: prepaid Contracts are not editable, and any difference is a second
   invoice or credit raised by hand (OQ-96).** OQ-96 had no board answer before the session; its answer
   now rests on this point and points 59 to 61. Part A, on the AR-24 flow, Greg:
   "we're going to say we can't change the price on those... normally they'd be locked as not
   editable. Those prepaid contracts will be not editable", though "those contracts are configurable.
   So if there's a mistake in the configuration, it could get interesting" (A L1037). When only half
   the work is done, Donald: "they would create their own separate invoicing event to balance the
   scales"; Greg: "So we'll lock it down at the time sheet point... So there shouldn't be any
   remaining amount." (A L1019-1025) Part B reopened it at length (points 59 and 60): Greg argued for
   a permissive system that automatically invoices or credits the difference when a prepaid price is
   changed; Donald for a rule that prepaid Contracts cannot take a price override, with exceptions
   raised by hand. They put it to Ben by phone. Donald recapped Ben's earlier answers: a prepaid price
   is honoured when prices change before the procedure, and a new anaesthetist honours it after a move
   (B L677; Ben's own words on 27 October: "You would honour the money that's been prepaid, because
   that's the quote that the patient's been given", Transcript 2026-10-27 · AA meeting with Ben and
   Vanessa L25). Ben, on a facelift that becomes a facelift plus liposuction on the day: "in my mind,
   in that scenario, you'd raise a second invoice" (B L683); "Can I just ask, is it a simple solution,
   not just to raise another invoice?" (B L691); "Automation is important, but there will always be
   the exceptional cases... not everything needs to be automated because we're talking about a rare
   event here. So a rare event can have some manual input." (B L695) On informed financial consent:
   "my personal philosophy is that you just have to wear that", otherwise "discuss with the patient
   and say, look, I'm going to give you an extra invoice for X" (B L699-707); "we do have admin staff
   to do that" (B L715). Donald: "at the get-go, let's handle those exceptions by exception" (B L713).
   Greg: "if it's really rare like that, then it's not worth it." (B L723) After the call, Greg:
   "prepaid contracts must be set up as not editable. That locks all this down" (B L773); "in order
   for this to operate correctly the contract must be non-editable otherwise you're going to break the
   system." Donald: "Yes, prepaid contracts can't also have the setting of being allowed to have a
   price override. Cool, I like that." (B L793-799) The office can still change any price (point 59).
   Greg would rewrite US-06.4.1 to say that once the procedure is done "nothing further occurs... apart
   from the transfer to the anaesthetist" (B L785). Settled. Bears on US-06.4.1, FT-06.4, US-04.2.14,
   US-05.2.5, US-05.4.2, US-03.5.1, US-08.2.2, US-04.1.1 and OQ-117.
2. **Fixed fee with a price override: possible on an anaesthetist's own price list, never on a prepaid
   Contract (OQ-117, partly).** Raised in the session (point 75); the board question has only "Do fixed
   fee contracts ever have the option to override the price? Details to follow." Reading the fixed fee
   story, Greg: "We talked about flagging a contract or a contract line to say whether it was fixed
   price but editable, didn't we... Do you want to reference that here?" Donald: "all contracts have
   the ability to flag whether or not there can be a price override... Do you know if a contracts like
   that exist?" Greg: "I don't know for sure." (A L123-133) Donald: "Claude, I just made question 117.
   Can you take the context of our conversation now, but also previous conversation where we described
   the fact that there could be a combination where a fixed fee contract is allowed to have a price
   override. And in that unique scenario, if the price override causes there to be extra costs or less
   costs, then the system should automatically create an invoice. We want to investigate whether or
   not this is a use case that impacts AA." (A L135) The day added: Greg, a "lecitus" (as heard; perhaps a locum,
   an uncertain reading) "might have a fixed price list" but "can change" it, and a surgeon's fixed price list may carry "a proviso that says... if
   we end up spending hours more on this, then you can charge more" (A L203-211); an anaesthetist's
   own price list: "They're fixed prices, but they're editable. So when he does his timesheet, he can
   change it" (Greg, B L201-205). Outside prepayment the case is simple, Donald: "it's not a prepayment
   and somebody decides to override the price... the thing that's on the invoice is just the new price
   that was set" (B L347). For a prepaid Contract the answer is no override at all (point 1), and Ben
   wants rare exceptions handled by hand (B L695). Not settled: whether such non-prepaid Contracts
   exist at AA was not confirmed. Bears on US-05.2.5, US-05.4.2, US-04.2.14 and US-06.4.1.
3. **Insurers are just Contract holders; the flag needed is what output a holder's invoice takes
   (OQ-114, partly).** Reading US-11.4.1, Greg: "Actually, they're just an instance of contract
   holders" (A L747); a holder could have "different email addresses for different contracts" but
   "that is just a contract holder. I don't see that being an insurer" (A L755-759); "it's more concise
   to talk about contract holders because they have a different status from a patient... I would rather
   see all of this headed as contract holder" (A L763-767). "We will need a flag on billable, on
   contract holder or billable party... which says whether it generates an email invoice or whether it
   generates some other output" (A L775-779). Donald: how a direct claim reaches an insurer (an email
   into a portal, or an API to NIB) is not known (A L761). Donald marked US-11.4.1 Proposed (A L781;
   point 85). This drops the insurer's "accepts direct claims" flag in favour of an output flag on the
   holder or billable party. Not settled: what the other outputs are. Bears on US-11.4.1, FT-11.4,
   EP-11, US-04.1.5 and US-04.2.1.
4. **The insurance approval number stays on the Booking, and its absence is a warning (OQ-93,
   partly).** Donald: "I don't think we need insurance approval numbers, do we?" (A L785) Greg: having
   insurance "doesn't mean that Southern Cross have accepted your claim"; "the insurer field tells us
   to start with whether you have any insurance at all. The approval number says whether the claim's
   been accepted"; without one at the hospital "that has to be changed to bill [the] patient direct"
   (A L787-799). "I've heard Vanessa say that sometimes the hospital asks for the approval number on
   the invoice so they can match them up." (A L807) "The problem with the tick is it's lazy" (A L811).
   Ben said the approval number should come with the surgeons' list the first time, "but it doesn't
   happen as much as it should" (Greg, A L827-831). "It'll be a warning. It should be a warning."
   (Greg, A L835) Where it is recorded, Greg: "It records it on the booking" (A L839); drop the
   sentence that recording it is the office's job and not the anaesthetist's, because "the anaesthetist
   may well change that on the day of the procedure... This might be blank and they might find out on
   the day." (A L843) Greg: "it's just fields on the booking." (A L847) Not settled: whether the
   anaesthetist sees the number itself or only whether it is approved (point 42); whether insurance
   narrows the Contract list was not discussed. Bears on US-11.4.3, US-07.2.2, FT-11.4 and US-03.1.5.
5. **A surgeon's agreed price is held against the individual surgeon, by practitioner ID (OQ-105,
   partly).** Greg: "An anaesthetist's price list for prepays is always his own... But a surgeon may
   have an arrangement with AA for the same arrangement. So anytime that surgeon does that procedure,
   whichever anaesthetist is working on it will... be doing that price." (A L905-909) The patient
   always pays AA: if the surgeon paid AA "he'd be a contract holder, billable party" (A L917-921).
   Donald's recap, a prepayment setting can sit on any Contract; a surgeon's Contract sets the price
   for all anaesthetists; Greg: "Yes, agreed." (A L927-929) On rooms, Greg: "there's not a requirement
   to be able to hold these contracts by surgeon's rooms because it's not currently done, but it
   probably is a better generic model." Donald: "There's no rooms... it's all against individual
   surgeons." (A L929-931) On finding it, Greg: the v6 design filters the Contracts at booking setup by
   "the practitioner ID of the surgeon and... the practitioner ID of the anaesthetist"; one-to-many
   rooms make "the select... a lot more complicated" (A L937-945). Donald: "But we don't have surgeons'
   rooms." Greg: "we might build it into the theoretical model" (A L947-949). Leaning to individual
   surgeons, with the office picking from a filtered list; the two still differ on modelling rooms. Not
   settled. Bears on US-06.2.2, US-04.3.2, US-04.1.5, US-04.2.14 and FT-04.3.
6. **Drop "never an organisation" from prepayments (revisits OQ-73).** OQ-73's answer is "any person
   paying for the patient, never an organisation". Reading US-06.2.1, Greg on the payer on the Booking
   prepaying: "That's true. In fact, I can't think of a case where the converse is true, but the
   configuration engine lets you do it." (A L873) Reading US-06.3.1 ("raised only when the payer is
   the person paying for the patient, never an organisation"), Greg: it "introduced yet another term
   into the glossary" (A L1117); "we built an engine that you can configure all these switches in...
   it's flexible and permissive... if the DHB had a contract, part of that contract may be that the
   procedures are prepaid. Can't imagine this." "Just take that sentence out." (A L1129-1137) Donald:
   "Claude, if you can... as you're rewriting 6.3.1, make this a little bit more clear." (A L1139)
   Settled: in practice the payer is a person, but the system does not forbid a Contract holder.
   Bears on US-06.3.1, US-06.2.1 and OQ-73.
7. **A prepaid Procedure leaves no remaining amount on the final invoice (OQ-116, partly).** Donald:
   on the final invoice the patient "wouldn't see a line that shows your prepayment... it doesn't exist
   anymore 'cause it's already been paid. Or it's already accounted for on another invoice" (A L985).
   On AR-24's "remaining amount" step, Donald: "prepayments are all or nothing. So there wouldn't be a
   situation where a line item was partially prepaid"; Greg: "there shouldn't be any remaining amount."
   (A L1019-1025) Greg, Part B: in the normal case "there's no invoice issued to the customer patient
   because they've already paid and it goes through that holding account transfer process" (B L387).
   This points to prepaid Procedures being left off the final invoice rather than deducted. Not
   settled: a Booking mixing prepaid and not-prepaid Procedures was not named. Bears on US-08.2.2,
   AR-24, US-06.4.1 and US-06.5.1.
8. **Payments out of the holding account are made by the system, and cancelling raises the credit or
   refund (OQ-115, partly).** Reading US-06.5.1 ("payments out of it are made from the system, not by
   hand outside it"), Greg: "That's important. Otherwise, the balance breaks... You end up with a
   reconciliation imbalance" (B L837-843). On cancellation, Greg: "if you press cancel, it should
   automatically do this": a credit note if unpaid, a refund if paid (B L881; point 65). Whether the
   cash refund itself is paid through Xero's refund process was not discussed. Not settled. Bears on
   US-06.5.1, US-06.5.2 and FT-06.5.
9. **ACC pre-op assessments follow the generic event and pricing rules (OQ-12, partly).** Donald could
   not find a source for the pre-op event being "priced by a fixed fee contract" and never the primary
   procedure (A L363, L375). The RVG guide's page 14 lists the codes, "simple pre-operative, complex
   consultation", and "doesn't even provide prices"; Greg: "So that's just the codes" (A L371-373).
   Donald: "5.5.2, I'm going to delete these pre-op event lines." Greg: "we want to make it follow the
   rules that we've got... we've got an engine that will allow the admins to configure that that way
   if they want to." Donald: "there might be some pre-configured ones like these ACC ones, otherwise
   it's just a free text field." (A L375-383) Donald: "Okay, agreed." (A L387) This answers part 2
   (not necessarily a fixed-fee Contract); part 1, whether CS250, CS260 and CS70 are the right codes,
   stays open. Bears on US-05.5.2, US-03.7.1, US-03.7.2 and FT-05.5.

## RVG master data and modifiers

10. **An RVG group needs only a unique system identifier.** Donald read US-05.1.1's "unique system,
    human readable code. Still open" and thought it belonged to Contracts (A L23). Greg: "I don't think
    there should be anything open there... they just need a unique identifier... the user will never
    see it because they're just interested in the codes that are published." (A L25) Settled. Bears on
    US-05.1.1.
11. **The rest of RVG groups and AA's own groups read fine.** Greg on AA adding its own groups: "it's
    not encyclopaedic, the RVG" (A L21). On "unless the Contract line states its own" base units:
    Donald read it as a fixed-price Contract not needing an RVG code; Greg: a Contract line "doesn't
    state a baseline value, but it can identify the RVG code"; Donald: "A recommended one"; Greg: "It
    reads okay." (A L29-37) Donald read the anatomy headings story: "We've got our agreed." (A L39)
    Settled. Bears on US-05.1.1, US-05.1.3 and FT-05.1.
12. **Modifiers already in the base units (P1): Greg thinks it overkill but it stays.** Donald read
    US-05.1.4 (P1 shown at zero units on the neurosurgery and spine codes, can be turned off, not added
    twice; only age modifiers otherwise pre-applied): "Seems in line with what we talked about
    yesterday." Greg: "personally, I think this is overkill, but you can leave it in. I can take it
    out, but I don't like it." (A L39-41) Settled, as written. Bears on US-05.1.4 and OQ-95.
13. **The modifier code master is complex for its benefit.** Donald: AA, like its own RVG codes, may
    have its own standard modifiers (A L43-47). Greg: "What happened to the ranges for these values?"
    (A L49) Donald: base units show ranges; some modifiers do too, for example POC2A, cover per day,
    2 to 6, and ICU cover per day, 25 units; "I should talk to Ben more about these at some point"
    (A L51). Greg: a day's cover "is not a procedure... I don't know how they build it" (A L53-61).
    Greg: "I can see it being quite expensive to provide a detailed requirement and then code it. And
    there's a very small benefit comes out of it." (A L65) "As written, it's okay as written. I can
    just see it driving a lot of complexity. I'm questioning whether it's of value." (A L69) Not
    settled: a doubt about value, no change asked for. Bears on US-05.1.5, FT-05.1 and OQ-101.

## Unit and fee calculation, and changes to a price

14. **FT-05.2 reads right but is hard for a cold reader.** Donald: "We don't really have values on a
    procedure anymore": the Procedure is text as received, and the Contract, its line and the RVG code
    fill in the starting units (A L73-77). Greg: "This looks all right to me... But we know what we're
    talking about... It'll be a bit of a challenge for a cold read." (A L79-83) No change. Bears on
    FT-05.2.
15. **No Commerce Act claim: AA does accept vendors' price offers.** Reading US-05.2.1 ("No contract
    (RVG) carries no practice-wide prices, which competition law does not allow... This default is a
    Commerce Act requirement"), Greg: "I'm not sure we can make a statement as bold as that" (A L87);
    "there are some contracts that have been offered by ACC and they have negotiated an agreed rate"
    (A L95); "while the anaesthetists may not collude with each other, they may accept a price offer
    from a vendor. And one of the things about AA is that it does accept price offers from vendors. And
    then the anaesthetist has the option to do it or not do it." (A L99) Donald edited it live (point
    77): "No contract RVG is a particular type of contract... it does not exclude the fact that other
    contracts might have a fixed price, like the ACC ones." Greg: "double no is a bit confusing, but
    it's all right." (A L105-111) US-12.1.1 still carries the Commerce Act wording (point 69). Settled.
    Bears on US-05.2.1, US-12.1.1 and US-04.3.3.
16. **The anaesthetist enters start and stop times; the system works out the units.** On tiered time
    units, Greg: "it enters a start time and a stop time, and the system has to calculate the number of
    units" (A L117); "Does it specify that the anaesthetist enters?" Donald: "It doesn't say that, but
    the prototype shows that, but let's make it more clear." (A L121-123) Edited (point 78). Settled.
    Bears on US-05.2.2.
17. **Fixed rate, GST, the multi-procedure rule and the per-Procedure ledger read and agreed.** Fixed
    rate Contracts and GST held exclusive: "Seems good to me." (Donald, A L135) The multi-procedure
    rule: "Seems true to me." (Donald, A L143) The ledger of each Procedure's share, Greg: "It's a bit
    cumbersome, but that's right." (A L145) Fixed discount Contracts: "Seems right to me." (Donald,
    A L215) No change. Bears on US-05.2.6, US-05.2.7, FT-05.3, US-05.3.1, US-05.3.5 and US-05.4.3.
18. **The stories' English is poor; Greg suggests an AI clean-up trial.** Greg: "This English is like
    it's written by a 10 year old" (A L151); "I'm wondering if it would be an interesting experiment to
    go through this and ask it to clean up the English... can you mirror the repository and get it to
    have a go at that?" (A L155) Donald: "then you'd have to read another 200 stories to review it";
    Greg: "maybe you're going to start with one" (A L161-163). Donald's reading: stories trip over
    themselves because they were asked to reference other rules (A L169). Not a requirement; not
    settled.
19. **"Price override" or "pricing"?** Donald: "I keep referring to this as a price override, and I
    think that's kind of a bit more of a simpler language. And so Claude, maybe take that on board"
    (A L169); a price override comes after every other calculation (A L173). Greg: "I think the word
    pricing might be better because price refers to one of the fields and pricing could be seen to
    refer to any of the editable fields" (A L171): on a timesheet "you could change the time, you could
    change the BTM. You could change the price, you could change the rate, you could change the
    discount" (A L179); "I just have a hesitation about using the word price because it's already
    used." Donald: "that's fair." (A L187-189) Greg also: "We need to ask the client if they want the
    price displayed, but theoretically you could display the price and if they didn't like it, they
    could change more until they were happy" (A L179). Not settled: the two terms both stand, and the
    display question was not taken further. Bears on FT-05.4, US-05.4.1, US-05.4.2 and US-03.5.1.
20. **The anaesthetist's adjustment keeps the fee as it stood before.** Donald read US-05.4.1: a changed
    rate, a percentage discount or a fixed final price where the Contract allows; "it records the fee as
    it stood before the adjustment so the calculation is never lost"; a 100% discount or $0 price gives
    a no-charge invoice; no reason needed; audited and flagged at review (A L165-169). No objection.
    Bears on US-05.4.1.
21. **"The only way to change a fixed price" is too broad.** Reading US-05.4.2 (the office can change
    any price, "the only way to change a fixed price without changing the contract"), Greg: "That's not
    technically true anymore because it's the only way you can change a non-editable fixed price"
    (A L191); "it's not universally true" (A L199); with the editable flag "we can't make a statement
    quite that broad" (A L211). Donald: it "is really saying that only the admin staff can choose to
    override a price regardless of any of those previously established conventions." (A L215) Not
    settled: the wording was not changed. Bears on US-05.4.2, US-05.2.5 and OQ-117.

## ACC, and pre-op and post-op events

22. **ACC uses the standard calculation only on an RVG-style Contract; why separate it at all?**
    Donald, reading FT-05.5: "There's no separate ACC calculation paths." Greg: "Not all ACC contracts
    are RVG contracts." Donald: "let's edit that in." (A L215-223; point 80) Greg: "I'm not sure why
    we're separating it out... we've got a really strong generic case now." Donald: "This may be some
    redundancy in a couple of these stories." (A L225-229) ACC "is never billed directly", only who
    the holder claims from (reading, A L229). Settled, with a doubt about the feature's purpose. Bears
    on FT-05.5 and US-05.5.1.
23. **Pre-op and post-op events live with the Booking, carry their own date, and appear on no List.**
    Greg, first seeing "an event not an added procedure" (A L231-235), asked about the user experience
    and whether an event could be "another form of procedure, non-primary procedure" (A L239-243); a
    pre-op is usually on an earlier day, so "you could see this one patient turning up on three
    different days" (A L247-255); "it might be simpler for everyone in the end to actually put a
    separate booking in for the pre and post-op procedures" with a link (A L287). Donald: attach the
    event to one Procedure, "which ultimately infers who is going to be paying for it" (A L245); the
    office or anaesthetist finds the Booking and Procedure, presses a button to "create new pre-op
    event", fills in the details, and a tick box says whether it is invoiced (A L301); "you could also
    record the time that event happened" with its own date (A L317). Greg: "it's mainly the
    anaesthetists that initiate these" and it "won't be on the surgeon's list... it's effectively
    another event in the list of events in a booking... And it may have a different date on it."
    (A L319) "The pre-op events don't appear on the schedule. They're just an addendum to the...
    booking." (A L343) Greg asked that developers be told "these events don't appear, even if they're
    dated differently, they don't appear on any other list, they just... live with the booking";
    Donald: "That is always been my understanding. That's an assumption." (A L389-391) Greg wants the
    link between events and the Booking kept: "technically it's easy, you put a link in" (A L295-299).
    Settled. Bears on FT-03.7, US-03.7.1, US-03.7.3 and OQ-63.
24. **How and when an event is billed is a question for Vanessa.** Greg: "there will be situations
    where that will just be another line of the invoice... there may be instances where it requires a
    separate invoice. So we'll need to talk to Vanessa to find out if there are any business rules"
    (A L335-339); "It's worth a question for Vanessa though, about events on a booking" (A L347).
    Donald assumed an event marked for invoicing is billed at once, "in the next round of invoices...
    Maybe they actually just get held until the actual procedure. So we need to figure that out." (A
    L341, L353) Greg: "They're pretty rare", more common elsewhere in the country, "And Ron knows more
    about that." (A L355) No question was written in the session. Not settled. Bears on US-03.7.2,
    FT-03.7 and OQ-63.

## Patient record and NHI

25. **Demographics and ethnicity coding are held if supplied, never required.** Reading US-11.1.1
    ("demographics, ethnicity coded to NZHIS level 4"), Greg: "where did that come from?" (A L403); "I
    don't think we need it... It may be part of the FHIR document standard... but it's not necessary"
    (A L405-407); "It doesn't mean we shouldn't allow for it... but that's different from requiring
    it." (A L411) Donald traced it to the RFP, pages 8 and 38 (A L481). Greg: "it might want to hold
    it, but there's nothing mandatory about it... I'm happy to have a place for it" (A L489); Donald:
    "if no part of our system does anything against it, we just display it as information" (A L491).
    Greg: "we ping the NHI when we get a number to validate it", and the details probably "all just come
    back in the return message" (A L497-501). Settled. Bears on US-11.1.1, FT-11.1 and FT-14.4.
26. **A Booking without an NHI: Greg's error queue and a stub on the List; a new question and a new
    feature asked for.** Donald found US-11.1.4 "contradicting itself a couple of places" (A L413).
    Greg: the NHI rule is right ("It absolutely is and I agree with it"), but "what does that mean in
    terms of operational system... you've got a broken list now" (A L423). Donald recalled Ben and
    Vanessa saying upstream systems would not send a patient without one (A L417, L425). Greg: "We add
    the list... the bookings in the list, but we can't add the booking that hasn't got the NHI, so we
    stick it in an error queue... maybe we should put a placeholder in the list" (A L435-439), "There
    is a booking here, but there's a problem with it", which the office sees too (A L443-447); "Ben
    will ring Vanessa and go, what's going on with this?" (A L463) The record "will have an underlying
    identifier other than the NHI" (A L471). Donald asked whether the system could simply refuse such
    a Booking (A L449, L473); Greg: "That's not helpful" (A L451); "you can't just not accept
    something, you've got to do something with it, especially if it's a hospital feed" (A L475).
    Donald: "Claude 11.1.4 is a bit of a muddled thing right now. And so I'd like you to raise a new
    open question for Vanessa and/or Ben" (A L481); later, on stubs: "anaesthetists and administrators
    should be made really clear about what this stub is and the admin team need to resolve them...
    please make a new feature for that and figure out how it fits in with everything else" (A
    L523-527). Greg: "the reason we need a stub is because you can't post the record because it doesn't
    have an NHI." (A L525) Donald first said to move US-11.1.4 back to Open (A L507), then "I think we're
    agreed on that too" (A L527); see point 83. Not settled. Bears on US-11.1.4, US-11.1.5, US-11.1.1,
    FT-11.1 and OQ-49.
27. **Intake rows may wait for the hospital list, so the system chases them.** Reading US-11.1.5, the
    NHI may only arrive with the hospital theatre list the day before; Donald: "it's crazy to me that
    this could sit unresolved until the day before" (A L507). Greg: this reinforces Vanessa, "the
    hospital only sends the theatre list 24 hours before" (A L509); he is still to look at the hospitals'
    messages (A L511-513); "the system's now going to chase you to resolve it" (A L517); today it slips
    through because "the NHI is an information field, not a unique mandatory field" (A L521). Donald:
    unresolved rows leave "a whole bunch of partial lists... this is where the stubs become even more
    important" (A L523). Settled. Bears on US-11.1.5, US-11.1.4 and OQ-13.
28. **Dual-format NHI validation is fine.** Donald: "Seems fine to me." (A L507) Greg's remark just
    before, "That's the issue we're trying to solve is a lot of duplicates in the system" (A L505),
    answered Donald's reading of US-11.1.1 (the same patient is never duplicated, A L503), not the
    validation story. Settled. Bears on US-11.1.2 (and, for the duplicates remark, US-11.1.1).

## Who is billed

29. **Contract holder, payer on the Booking and billable party, as in AR-44.** Donald walked the new
    diagram [AR-44](../artifacts/AR-44.md), made during the session: the holder "who the agreement is
    with"; the payer on the Booking "who pays if the holder doesn't", pre-filled from the patient; the
    billable party "who receives the invoice, decided by each procedure's contract" (A L537); "Is the
    holder the billable party? Yes, then bill the holder, if not, bill the payer." (A L541) Greg: a payer
    is not only a guardian, "A benefactor. A family trust is involved... So it's just another party."
    (A L539) On FT-11.2, Greg: "The invoice goes to the holder's billable party. Yes, that's correct...
    Otherwise the invoice goes to the payer named in the booking. That's correct. Because the patient
    is the default... payer" (A L543-547); "So the contract alone decides who is billed... That's
    correct." (A L555-559) Donald: "Claude, as you just described, or other, right? It could be a trust
    or whatever else it might be." (A L553) Settled. Bears on FT-11.2, US-11.2.2, US-04.2.1, US-04.1.5
    and EP-11.
30. **A "different payer" tick box, and patients who want posted invoices.** Greg: copying every
    patient's details onto the Booking duplicates them; "It probably just needs a tick box that says
    different payer", using the patient's details otherwise (A L563-567); "Ben said, look, we only need
    an email address and a phone number" (A L567), but some patients have no email "and they want hard
    mail... We haven't talked about what we're going to do about that." (A L571-575) Donald: invoices
    could be printed from a dialogue; Greg: "the invoice is generated outside of Xero, just the invoice
    detail is sent... we're not issuing the invoices out of Xero. Okay, we'll get back to it." (A
    L577-579) Not settled. Bears on US-11.2.2, US-11.2.3 and point 50.
31. **An event's billable party defaults to its Procedure's.** Donald read that an event on a Procedure
    can have its own billable party, by default the Procedure's. Greg: "Really? That's an interesting
    question." Donald: "there may be situations where it's different people that pay for those." Greg:
    "the event is attached to the procedure, not to the booking... So therefore it should use the
    procedure's details." (A L581-597) Settled. Bears on FT-11.2 and US-03.7.1.
32. **Drop "most patients pay for their own procedure".** Reading US-11.2.1, Greg: "I'm not sure if
    that's [true]." Donald: "we can remove that line, but it is common though, right?" Greg: "It's
    common, but I'm not sure of that." (A L597-603) Removed (point 82). Greg was happy with the rest
    (A L605-607). Settled. Bears on US-11.2.1.
33. **A holder with a billable party uses its details; drop the hospital paragraph.** Reading US-11.2.2
    ("A hospital or insurer taking the invoice is not a payer on the Booking"), Greg: "It's a very ugly
    wording... A contract holder that nominates a billable party uses the billable party detail for the
    billing, for the invoice." (A L619-623) "Normally it's a one-to-one relationship between the
    contract holder and the billable party. It's just an externally held address... there's a flag on
    the contract holder somewhere that says has billable party or not... Holder is billed, yes, use the
    billable party. Holder is billed, no, use the payer." (A L631) On the word payer, Greg: "Accounting
    uses payer... It is the payer... It's an awkward word" (A L639-643). Donald deleted the paragraph
    and the guardian sentence: "Maybe I just delete it... we've corrected the record." "Every booking
    names a payer... I think that's right, it's pretty simple." (A L645) Settled. Bears on US-11.2.2,
    US-04.1.5 and US-04.2.1.
34. **The payer needs an email or a postal address.** Greg: "There will be some patients who need an
    address because they don't have an email" (A L647); "it should be part of the record that they
    should be placed for an email and an address" (A L651). Donald: not needed for a Contract's billable
    party, which has nominated emails (A L649). Greg: "one of them has to be filled" (A L655), "using
    the NZ Post standard... address format" (A L659). Donald: "Claude, figure out the right requirement
    to add this to that... payer on the booking" (A L657); on US-11.2.3 (payer email required), Greg:
    "That should take email or [address]"; Donald: "this is Claude update 11.2.3." (A L661-665)
    Settled; not yet edited. Bears on US-11.2.2 and US-11.2.3.
35. **The child-payer warning should say "contract holder".** Greg: "we only have the patient's age, so
    we can only flag on that anyway" (A L667). The no-warning sentence is hard to read because "they've
    gone away from the term contract holder" (A L671-675). Donald: "Claude, update 11.2.4 to use the
    term contract holder... Cool, that's agreed." (A L679) Settled; not yet edited. Bears on US-11.2.4.

## Outstanding balances, alerts and notes

36. **Outstanding balances and the alert thresholds read and agreed.** Greg: "That's the problem with
    the current system. They're siloed that they can't spot unpaid bills and repeat bookings, which you
    get with naughty cosmetic procedures" (A L681). Donald: "We agree." (A L683) The 90-day threshold,
    mild and strong alerts (yellow and red) and the credit balance alert were read without objection
    (A L683). Settled. Bears on FT-11.3, US-11.3.1 and US-11.3.2.
37. **Anaesthetists see the unpaid-bills alert too, on their List.** Donald: anaesthetists also want to
    know when "they see this patient has unpaid bills". Greg: "I assumed that it should come up on the
    list... the mild alert is some sort of color code on the list and I guess we could have some sort of
    generic mechanism" that shows "all the warnings relating to that" (A L683-693). Donald: "Claude, can
    you update this to also mention that it's not just the admins that can see it?... anaesthetists also
    want to see it in their apps." (A L695) Settled; not yet edited. Bears on US-11.3.2 and FT-11.3.
38. **Clearing or dismissing an alert is parked.** Greg: "can an admin clear an alert?" (A L697); a
    permanent yellow or red "might be a distraction" (A L701); "a status where you can say, well, I've
    read that so it doesn't sit on the list forever", or close a nuisance alert (A L709), or "attach a
    note to an alert" (A L717). Donald: it is an alert on the record, not a notification, and "would
    never be cleared until the payment is made" (A L699); per-alert read or dismissal is costly and can
    go wrong (A L711, L719); if "80% of the bookings are true to this condition, we would have to change
    it" (A L715); "we need to cross these bridges when we get there." (A L719) Not settled. Bears on
    US-11.3.2 and FT-11.3.
39. **Follow-up tools: source unknown; a free-text note on a List or Booking.** Neither knew where
    US-11.3.3 came from (A L719-721). Greg: "all of those actions around management should allow a note
    somewhere so that a follow-up reader can see anything that's been left behind or done before."
    (A L729) Donald: rather than notes on alerts that can be dismissed and recalled, "a free text field
    that can exist attached to a list or a booking that allows like anybody to type in there and they can
    see it" (A L739). Greg: "I'm not precious about that" (A L741). Settled. Bears on US-11.3.3, FT-11.3
    and US-13.8.1.

## Insurers

40. **Most of FT-11.4 can go; an insured patient without approval is billed.** On US-11.4.2, Donald:
    "Our system doesn't need to care about any of this. It just needs to select who's going to get the
    invoice"; for a patient insured but not pre-approved, Greg: "We bill the patient, end of story."
    (A L781-783) Insurance is information the office uses to pick the Contract (Donald, A L785). Donald:
    "Claude, I think after reading everything underneath feature 11.4 I think most of this could probably
    go away. We don't have a master insurance list... this last one about insurer approval numbers on the
    booking probably needs to just be moved into one of the other features and rewritten" (A L845). Greg:
    "Yeah, it's just fields on the booking." (A L847) Settled. Bears on FT-11.4, US-11.4.1, US-11.4.2,
    US-11.4.3 and EP-11.
41. **Rooms send the approval number with the list, but not always.** See point 4. Donald's model: the
    insurance and approval appear on the matching screen when a Booking comes in, and on the Booking
    (A L813); the office can edit them there (A L833). Bears on US-11.4.3 and FT-02.1.
42. **Does the anaesthetist see the approval number, or only that it is approved? Ask AA.** Donald: "I
    probably wouldn't want to display the approval number for the anaesthetist, but the admin team would
    want to see it." (A L817) Greg: "the anaesthetist will want to see it... when he gets to the
    hospital", since holders often decline and the bill comes back to the patient (A L819); "he's
    standing in the hospital and he's talking to someone in the hospital... if he's just got a tick, he
    hasn't got that information" (A L823). Donald: "Ask them. Okay, we can ask" (A L821); perhaps shown on
    a drill-down, like the NHI, "but it's not directly visible" (A L825). No question was written in the
    session. Not settled. Bears on US-11.4.3 and US-03.1.5.

## Prepayment trigger and amount

43. **EP-06 read; the approval gate is optional.** Donald, on the office approving each prepayment
    invoice: once trust is built "you wouldn't want all of these to be manually triggered or approved";
    "It's an optional gate." Greg: "Skip the step in the workflow." (A L851-857) Donald noted the epic's
    "until Ben answers can the price be changed" is stale: "we actually answered that the other day, it's
    just not reflected here"; "This all seems true to me. He says apprehensively." (A L859) In Part B,
    Greg: "Ben doesn't want them stopped and checked. He wants them just sent out... He's looking for
    automation." (B L275-279) Settled. Bears on EP-06, US-06.3.1 and FT-06.3.
44. **A prepayment Contract line must carry a non-zero price.** Donald did not follow "which always
    carries one". Greg: "it means that the price is mandatory on the contract line... a point worth
    making, that a non-zero price is mandatory on a prepayment contract line." (A L859-865) Settled; not
    yet edited. Bears on US-06.2.2, FT-06.2 and US-04.2.14.
45. **Prepayment is detected per Procedure, not across the Booking.** Reading US-06.2.1, Greg: "This is
    checked across the whole booking... No, I don't think that's correct at all... It's per procedure."
    (A L873-877) Donald: six Procedures, five approved by an insurer and a sixth cosmetic add-on that is
    prepaid; "I'm going to delete that." (A L879-883; point 87) Settled. Bears on US-06.2.1.
46. **The prepaid price list can be the anaesthetist's or a surgeon's, by practitioner ID.** Greg:
    "Could we change that to the anaesthetist or surgeon's own price list? Because remember we changed
    anaesthetist ID to practitioner ID because we can use this exact same mechanism for surgeon's...
    arrangements", which are "not prepaid, but otherwise they're identical" (A L885-889); "And maybe we
    should put a note in there to say it's identified as practitioner ID in the contract." (A L953)
    Donald: "Claude... We're talking about story 6.2.2, so please update this to also reflect the
    surgeon, practitioner ID, sort of surgeon filtering sort of stuff we talked about." (A L957) The
    surgeon arrangement itself is point 5. Settled; not yet edited. Bears on US-06.2.2, US-04.2.14 and
    OQ-105.

## The holding account and the billing flow

47. **Greg on the holding account: a payable, not a bank or ledger account.** Greg: the holding account
    "is not a bank account or a Xero ledger account... it's the equivalent of an anaesthetist" (A L967).
    Normally the invoice to the patient has a bill (a payable) to the anaesthetist, so in Xero "the total
    amount that is owed by patients should be the exact same number that's owed to anaesthetists" (A
    L971). For a prepayment the payable is "another payable account called holding account", which is
    "transparent to Xero"; the payment "goes to the holding account and it sits there and doesn't...
    disperse"; when the timesheet comes in the engine moves it to the anaesthetist; "the data model
    needs some way of understanding that this was a prepaid transaction and therefore the handling route
    is different." (A L975-979) "The second part is more like a transfer than a payment", "by a journal
    transfer", after which it sits on the approved-for-payment list Ben, Michael or Vanessa tick through
    (A L987-991). Donald: "nothing you said sounded new to me." (A L981) Settled. Bears on US-06.5.1,
    US-06.3.1, FT-06.3 and FT-06.5.
48. **A new diagram of where prepaid and not-prepaid money goes.** Donald: "Claude, we already have
    artifact 24 that describes the billing slash invoice flow. But it might be nice if you made something
    a little bit more visual that is just talking about the prepaid slash non-prepaid conditions and
    where that money goes to, you know, those related pairs. So if you could make a new artifact for
    that" (A L995), showing the second leg as a transfer (A L1115); in Part B: "We already asked Claude to
    make a new artifact... separate to the flowchart, and we'll get you to put your eyes over that too"
    (B L821). Not yet made. Bears on AR-24, US-06.5.1 and US-06.3.1.
49. **Prepayment invoices differ: their payable credits the holding account.** FT-06.3 says prepayment
    invoices go through "the same internal ledger and Xero... pair as any other invoice". Greg: "that's
    not quite right... It's not the same as any other invoice because it doesn't credit the anaesthetist,
    it credits the holding account." (A L997-1001) After the AR-24 walk, Donald: there are still linked
    pairs, "slightly different in the prepayment condition"; Greg: "Yes, as it stands, that's correct."
    (A L1107-1109) Donald: "It could have a little bit more nuance" (A L1111). Settled. Bears on FT-06.3.
50. **Who sends invoices, our system or Xero, is for the build to decide.** On AR-24's "engine sends the
    invoice", Greg: Xero "can't generate the data on the invoice that we want... the engine needs to raise
    the invoice PDF and we just send the accounting entry to Xero as a payable and... receivable" (A
    L1047-1051); "if your design team can figure out how to get Xero to produce the required invoices,
    then I'm quite happy for it to do so... I don't think they will be able to." (A L1063-1067) Donald:
    "for now let's assume it's going to be our system unless the developers with more Xero expertise
    believe that Xero is the best place... not something that is a hard requirement" (A L1069). Edited
    (point 74). Settled. Bears on AR-24, US-08.1.1 and point 30.
51. **The AR-24 walk: one rule iterated per Procedure, and the prepayment release node.** At the
    multi-procedure decision, Greg: "Those are really the same rule... it just iterates through the
    procedures, billing each one." (A L1009) On "Second pair pays the anaesthetist who did the List",
    Greg: "That's exactly true... the second part of the prepaid process is you now transfer it from the
    holding account to the anaesthetist who performed the procedure." (A L1029-1033) Donald: "Maybe this
    node is actually meant to be talking about releasing the prepayment from the holding account" (A
    L1045). The admin approving the prepayment invoice belongs with the office's review and List
    authorisation, Greg: "the engine hasn't got any manual steps in it. It's just an engine" (A
    L1069-1071); Donald: the node "needs to sit outside of the Xero box... aligned with the list
    authorised"; the pair is "payable to the prepayment holding account"; Greg repeated "Payable to the prepaid
    holding account" and Donald: "you happy with that? Yep." (A L1073-1077) Greg
    asked why the prepaid branch does not rejoin the main line; Donald: the procedure has not happened
    yet, and once done the money "is released to whatever anaesthetist did the work." Greg: "Yes." (A
    L1079-1093) Donald asked for small text marking the prepayment node as the prepayment stream (A
    L1107). Greg's remark on the price-change step is lost ("Pricing, but [unclear]", A L1005). Edited
    (point 74). Settled. Bears on AR-24, US-06.5.1 and US-06.3.1.
52. **A part payment releases a payable for what was received: for the accountant.** Donald, reading
    AR-24: on a part payment (Vanessa mentioned payment plans) "Engine authorizes the payable for exactly
    the amount received. That's a question I guess for the accountant." (A L1069) Greg did not comment.
    Not settled. Bears on AR-24, US-10.2.1 and OQ-47.
53. **Should a prepayment invoice name the anaesthetist? Ask AA.** Donald: a regular AA invoice names
    the anaesthetist; "On a prepaid procedure, do we need to name the anaesthetist?" Greg: "Should ask
    that, but I wouldn't think so"; "If we name the anaesthetist, we create a problem. So I would be
    leaning towards not doing that." Donald: "Claude, let's ask AA. We'd all like to avoid this, but it's
    worth asking." (A L1095-1107) Part B: "we need to ask AA, Vanessa or Ben or both... does it name an
    anaesthetist or not? And based on the answer of that, this story will update." (B L899) No question
    was written in the session. Not settled. Bears on US-06.3.1, US-06.3.6, US-06.5.4 and FT-06.3.
54. **US-06.3.1: say the second leg is a transfer.** Reading "the anaesthetist is paid by the second
    pair", Greg: "that's correct, but it doesn't provide any insight into how it's paid. If you said it
    was a transfer, because that's what's happening." Donald: "Claude, can you update this to make that
    nature a little bit more clear? And... in the diagram artifact" (A L1111-1115). Donald also read that
    the invoice is "not generated at the booking setup itself, nor when the money is received. None can
    arrive before the invoice is sent. That's a bit of a thing you don't need to say." (A L1111) The
    "never an organisation" sentence is point 6. Settled; not yet edited. Bears on US-06.3.1.

## Tracking prepayments (Part B)

55. **Tracking and re-checking read and fine; Greg suggests a nightly reconciliation.** US-06.3.2,
    Greg: "That's all fine." (B L19-21) On US-06.3.4 (re-check after each receipt), Donald: "This is
    probably a bit technical... the system should probably do this." Greg: "I can see an overnight run
    being set up here, something on a cron job... Do a daily rec and make sure it's right." (B L23-25)
    No change. Bears on US-06.3.2 and US-06.3.4.
56. **A Contract changed after a prepayment is sent or paid: a new requirement and a new question.**
    Reading US-06.3.5 ("if the Procedure's Contract changes to one not flagged as prepaid, the requirement
    is cleared"), Greg: "That's not that simple... I'd rather see that deleted and rebooked, really."
    (B L31-35) Donald: "we've not really talked at all... about the idea of a prepayment being received
    and then the contract changing" (B L33); the two sentences "are raising questions that we've not
    engaged with, and make assumptions on what the answers are" (B L65); "what the hell are you going to
    do for money that's already been collected" (B L69). If paid: refund in full, then invoice after the
    procedure (Donald, B L69, L81). Greg: "Theoretically you could issue them a credit, but it just
    creates more work... than just doing a refund and just starting again. You can raise it with Ben"
    (B L71); a prepaid Booking may be cancelled, "So we'll need to have a cancel refund process. But...
    I've never come across a discussion where a prepayment was converted to an insurance job" (B L75).
    Donald: "Even if it doesn't exist in real life, the system has to decide what it does in that
    condition." (B L77) If sent but not paid: void or credit note? Greg: "If you've sent them an invoice,
    you can't actually stop them sending you money"; "we have cancelled your booking and repayment will
    be made." (B L85-91) Greg also floated "you can't change a prepaid booking... The booking really
    belongs to the surgeon. You can't just delete it." (B L79) Donald: "Claude, we know we need you to
    make a new requirement for this odd condition... but then also create a new question for Vanessa and
    Ben about how they expect these to be handled", deleted the two sentences, and asked Claude to be
    "more explicit about... the draft payable to the anaesthetist gets updated" (B L93), though the
    draft payable is the holding account (Greg, B L457), so what changes is unclear. Greg: "we haven't
    talked about credits" (B L95). Left Open (B L99). Not settled. Bears on US-06.3.5, US-06.5.2, FT-06.3
    and OQ-104.
57. **"Claims the prepaid amount", not "no more than".** On US-06.3.5's move sentence, Greg: "That
    should say the prepaid amount... That goes back to what Ben was saying the other day, the deals are
    deals" (B L47); "a prepayment's a prepayment" (B L55); "why say 'no more'? Why not just say 'claims
    the prepaid amount'?... Simpler logic for them too." (B L59-63) Donald: on a move "there's no
    automatic trigger or resolution to adjust the amount" (B L57). Edited (point 92). Settled. Bears on
    US-06.3.5, US-06.5.4 and OQ-70.
58. **One standard prepayment letter template.** Reading US-06.3.6 (a small set of templates), Donald:
    "I actually probably imagine it should be one standard template for this action"; the office writes
    every prepayment letter by hand today, Greg: "Yes, I believe so." (B L99-101) Donald: "Claude maybe
    just tweak this... to say that there's at least some sort of template that is related to the
    prepayment letter. It doesn't need to be many of them." (B L105) Settled; not yet edited. Bears on
    US-06.3.6.

## Changing a prepaid price (Part B)

59. **Policy versus enforcement: the system permissive, the office able to change any price.** Greg:
    the question to Ben (can a new anaesthetist change a transferred prepaid price: "a deal's a deal")
    is not the same as a letter caveat that the amount may change, "a bit of a conflict to resolve"
    (B L107); "perhaps we should generalize it and say in what circumstances could a prepaid amount be
    altered" (B L131). Donald: the prepaid amount stays, and "a credit is raised additionally or an
    invoice is raised additionally" (B L133); customer confusion is for AA's template wording (B L129,
    L169). Greg: "it is editable even if policy says it isn't... And you could lock it down on the app...
    The admin can do it" (B L175-179); "we should separate policy from enforcement... the system should
    be permissive" (B L227-231); "We could end up tying ourselves in some really expensive knots... That's
    what the admins are for" (B L255-259). On US-05.4.2, Donald: "only AA admin staff can do some sort of
    free text price change on any contract, regardless of the rules of the contract"; Greg: "Yeah, they
    can. Agreed." (B L183-197) Donald's predictable rule: a changed price "before or after" the
    prepayment goes out is corrected by "additional events, invoice events... as opposed to some sort of
    rules that try to catch it mid-flow"; Greg: "Yes." (B L285-289) Donald's summary: "If fixed price
    contracts allow price overrides, or if fixed-price contracts get overridden by the admin staff... the
    system needs to account for that and issue credits or additional invoices." Greg: "Correct. That's in
    version six of the document" (B L301-303); "If they want to lock it down, they can make the prepays
    non-editable, non-price overrideable"; Donald: "And even then, the admin staff could still do
    something" (B L307-311). Overtaken by point 1. Bears on US-06.4.1, US-05.4.2, US-04.2.14 and OQ-96.
60. **Automatic difference invoices: Greg for, Donald against, Ben decides.** Reading US-06.4.1 (no
    automatic invoice or credit), Greg: "I don't agree with that" (B L325); "by overriding the price at
    the time of the procedure, the anaesthetist is initiating a price adjustment event, either an
    additional invoice or a refund" (B L329); "This is not a behavior related to prepays" (B L345); "the
    second invoice is a regular invoice" (B L353). Donald: the cheaper build is "a rule in the system to
    say... fixed price contracts can't have a price override", with exceptions "solved by ad hoc invoicing
    events" (B L359). Greg: "I'm not convinced at all that actually one path would be significantly more
    expensive than the other, so I'm happy to have the conversation later in the project" (B L365). Greg
    on the normal case: "if a prepayment procedure payment is not received, it's cancelled" (B L387), so
    payment has always been received, and with no change "there's no invoice issued to the... patient"
    (B L387); "If the quoted price has changed on a prepaid procedure, that's all we need to know. It
    doesn't matter how it happened." (B L403) Why automate, Greg: "Because Ben's chasing automation"
    (B L423). Donald: "I think a lot of pain and time could be saved by not trying to catch this, or at
    least not catch it during the MVP." Greg: "I don't agree with you, but ask them." (B L433-439) Donald:
    "Claude... Could you try and summarize this into a more succinct question that we can then ask Ben"
    (B L443); Greg: "The answer to the question is whether you want changes to prepaids automated." (B
    L445) Ben's answer, by phone, is point 1. Settled by that call. Bears on US-06.4.1, FT-06.4 and OQ-96.
61. **FT-06.4 to be dissolved; prepaid Contracts are not editable.** Reading FT-06.4 ("The same holds for
    every fixed price contract"), Greg: "I think we're confusing here, fixed price and editable contracts
    ... prepaid contracts must be set up as not editable. That locks all this down" (B L773). Donald: "this
    feature, which currently only has one story, could probably be dissolved and its story moved into
    another section", though the story "has value in the fact that it just makes it very explicit that
    there's no special logic" (B L787-791). Donald: "I'll mark this one as agreed. And the other one will
    get removed." (B L805) Which is which was not said; the board moved US-06.4.1 to Agreed and left
    FT-06.4 at Verify (point 88). Settled in direction; not yet edited. Bears on FT-06.4 and US-06.4.1.

## Trust account and holding account (Part B)

62. **The holding account is paid out automatically, not "handled centrally by the office".** Reading
    FT-06.5, Greg: "It's not handled centrally by the office. It's just paid to whoever did the
    procedure." (B L449) "The draft payable record is AA holding account." (B L457) After the call, Greg:
    "It is credited to a payables account called AA holding account... it's one of those guys on the
    right... It's a software account... None of that's handled centrally. It's just automated." (B
    L751-759) "Expect the Xero automation to do, it'll just do it." (B L735; the transcript gives this to Greg, but it
    completes Donald's unfinished "So what I would?" at B L733, so who said it is uncertain) Donald: "A booking that moves
    to another anaesthetist keeps its prepayment price"; the "Today, if the anaesthetist has already been
    paid..." paragraph is "not really needed for this" (B L761-769). Greg has spoken to the accountant only
    once and expects them to be "very competent at Xero"; Donald sees the accountant as the subject matter
    expert at build (B L737-749). "We've done the feature and we've accepted the feature. Agreed." (B
    L805) Edited (point 89). Settled. Bears on FT-06.5 and US-06.5.1.
63. **The trust account is a bank account; the holding account is a creditor.** Greg: "Don't confuse a
    holding account with a trust account. So a trust account is a bank account... That bank account is
    analysed out into which anaesthetists are due to be paid. What we're saying is we're going to create a
    fake anaesthetist called holding account" (B L467), which "receives money and pays out, transfers
    money to other anaesthetists, but never actually gets paid itself" (B L471); "It's not a ledger, it's
    not a Xero ledger. It's actually a creditor... every anaesthetist is in the system as a creditor... And
    we also have this creditor called AA Holding Account." (B L475) Asked why it matters, Greg: "you have
    to specify it for the developers." (B L527) He then drew T-accounts on the whiteboard (B L541-657),
    inside a box he called "This is the Xero system" (B L545). Greg: a normal invoice is "a credit to
    sales, and it's owed to us by the patient" (B L549), with a matching bill because "if we are owed 100
    bucks by the patient, then we owe 100 bucks to the anaesthetist" (B L553); the patient pays into the
    bank and the anaesthetist is paid out (B L577-581); "these are called control accounts because they
    just have a total in them. And these are called the sub-ledgers because they provide the details. And
    the sub-ledger... reconciliation at the end of the month always has to equal the control account" (B
    L603); "we've also got one here called Holding... it's a place where stuff sits" (B L607-611). The
    prepayment: invoice $200, paid $200 into the bank, then "we now owe the anaesthetist 200, but we don't
    know which anaesthetist, so we're going to stick it in there" (B L629-637); then "we credit this one
    and we debit that one. We're just moving it. That's an accounting move. So now we've got that we owe
    Ben 200 instead of the holding account... And then we pay Ben." (B L649-657) Donald: "This is why it's
    a transfer." (B L643) Earlier, before the T-accounts, Greg had said of Donald's own drawings: "The two
    diagrams are actually the same. There's a time here." (B L519) Later Greg added that the patients
    total is "mirrored in our app... the same list or the same value" (B L847), and Donald: "us mirroring
    what Xero sees" (B L849). Donald: "this makes sense to me. Thank you for doing this." (B L579)
    Settled. Bears on US-06.5.1, FT-06.5, US-06.3.1, US-08.3.1 and US-08.3.2.
64. **US-06.5.1: an accounts payable prepay account; payments only from the system; balances checked
    before each payment run.** Greg: "an accountant would read that and wouldn't know specifically what
    your design was because they have holding accounts all over the place... We're talking about an
    accounts payable holding account... So call it held in an accounts payable prepay account." (B
    L807-815) The ledger treating it as an anaesthetist, Greg: "It thinks the holding account is an
    anaesthetist... That's fine. It doesn't know." (B L823-827) On "in place of another invoice to the
    patient", Greg: "that's more noise... It's just that's where it moves it." Donald: "let's remove that
    then." (B L835-837) Payments out from the system: point 8. Greg: "every time they do a payment run
    before they make the payments, I'll be putting a system in where the accountant or Vanessa has to
    demonstrate that all of these critical numbers balance. If they don't balance, stop." (B L851) Donald:
    "I think we read everything there, and we agree." (B L855) Edited (point 90). Settled. Bears on
    US-06.5.1, US-08.3.2, FT-10.2 and OQ-47.
65. **Cancelling a prepaid Booking: a credit note if unpaid, a refund if paid, automatically.** Greg on
    the refund: "That's just a normal refund transaction." (B L857) On "the office handles the refund",
    Greg: add "as is the current practice"; Donald: "Or we just remove it all together... Cool. Agreed."
    (B L861-863) Greg: "if you're going to cancel a prepaid booking, you need to reverse the invoice. It's
    not owed anymore" (B L865); if they pay after a credit note "you send the money back again. It's a
    double transaction" (B L873); "Maybe we should call this cancellation of prepayment procedures...
    scenario one is they haven't paid, so you raise a credit note and it nullifies the transaction.
    Scenario two, they've paid you refund. That should be as part of the booking cancellations process. So
    if you press cancel, it should automatically do this." (B L877-881) Edited (point 91). Settled. Bears
    on US-06.5.2, US-02.5.3 and OQ-115.
66. **A replacement anaesthetist after a cancellation starts a new prepayment.** Donald: "booking A is
    cancelled and a whole new instance is created and the two don't know about each other" (B L863); the
    patient may see two amounts; a Booking moved without cancellation keeps its prepayment; "That seems
    right to me." Greg: "Yeah." (B L883-885) Settled. Bears on US-06.5.3.
67. **US-06.5.4 is basically agreed, but its patient email paragraph is muddled.** Donald read it:
    nothing changes in the ledger, the payable does not move, nothing is recalculated, and the new
    anaesthetist "claims no more... than what's prepaid. Unless they decide they want to and Ben already
    just described that"; the patient-email paragraph "kind of just contradicted itself a little bit"
    (B L889). Greg: "I think it's reflecting a conversation that we did not resolve... What do we need to
    ask?" (B L891-895) Donald: the answer to whether the prepayment invoice names the anaesthetist (point
    53) decides it; "I'm just going to mark this as basically agreed and we can let their later story
    change it if needed." (B L899) Its status was not changed on the board. Not settled. Bears on
    US-06.5.4 and OQ-70.

## Anaesthetist profile and reporting (Part B)

68. **EP-12's summary is messy; the profile lacks the practitioner number and preferred and blocked
    lists.** Donald: "Claude, that's a very messy sentence" (B L899); the admin-side profile settings
    are probably missing "that preferred list block list stuff. Who do I want to work with?" (B L899);
    on FT-12.1, "also missing here is practitioner number. And... that block list, preferred list stuff"
    (B L909). Greg: anaesthetists "need a report because they send a PDF to their account[ant]" (B L901);
    "it doesn't talk about my profile settings" (B L905). Donald: "I'll leave it open for now" (B L909);
    he expects Claude to "make new stories for that, or at the very least link in the feature the other
    places those stories are captured" (B L917). Not settled. Bears on EP-12 and FT-12.1.
69. **Anaesthetist rate and unit value are one thing; drop the borrowed technical discussion.** On
    US-12.1.1, Greg: "Anaesthetist rate and unit value, that's actually the same thing. It's just the
    anaesthetist unit rate." (B L911) Donald: the technical discussion came from Stratos' RFP response;
    "Claude should just update it based on this... Claude, go ahead and update that." (B L913) The story
    still says anaesthetists "cannot collectively agree on price under the Commerce Act" (reading, B
    L909), which Greg found too bold in Part A (point 15). Settled; not yet edited. Bears on US-12.1.1
    and US-05.2.1.
70. **The anaesthetist's master record details are mandatory, not "where available".** Donald read
    "registration number... and, where available, bank details." Greg: "not where available, it's
    mandatory." Donald: "Yeah, it is mandatory, isn't it?" (B L917-923) The story's own text had "HPI CPN
    (Common Person Number) where available, and bank account details"; Donald's reading put "where
    available" on the bank details. Bank details "are used for the payables run" (reading, B L923).
    Settled that bank details are mandatory; whether the HPI CPN is was not discussed (point 93). Bears
    on US-12.1.4.
71. **The ledger records what patients and Contract holders owe.** Reading FT-12.2 ("system of record
    of what is owed"), Greg: "just say by patients and insurers, by patients and contract holders. That'll
    do." (B L925) On payables, Greg: "it depends whose eyes you've got. If you're AA, an anaesthetist has a
    payable because you owe them money. If you're the anaesthetist, you have a receivable" (B L929). Edited
    (point 94). Settled. Bears on FT-12.2 and US-12.2.1.
72. **The outstanding list jumps back to the Booking.** On US-12.2.1, Greg: "is there a way to go back to
    the booking ID if you click that?... Probably would be very helpful." Donald: "I think there should be
    traceability." Greg: "You want to click through for booking, it doesn't have to be shown. Just needs
    to jump... I'm talking about a user feature." (B L933-945) Edited (point 94). Settled. Bears on
    US-12.2.1.
73. **The GST report lists payments; where the BCTI comes from is not written anywhere.** Reading
    US-12.2.2, Greg: "it lists payments made by AA to the anaesthetist"; the paragraph on part payments
    and repayment plans "starts falling over itself. It really doesn't need that" (B L951). "We're going
    to generate a buyer-generated tax invoice for each of these payments to save the anaesthetists having
    to do it... We haven't talked about that" (B L951); "The second pair is the buyer-generated tax
    invoice" (B L959); "It mimics the anaesthetist sending AA an invoice for that amount" (B L963); "if we
    did a weekly run, we could generate one BCTI for the run, which had all the lines on it that we were
    paying... So it talks about a BCTI, but it never said where it came from." (B L967) Donald: "Approve
    the period's BCTI for payment. We haven't gotten to it yet." (B L953) Not settled. Bears on US-12.2.2,
    FT-12.2, US-10.2.6, FT-10.3 and OQ-47.

## Board edits made during the session

From the uncommitted board changes; each is tied to the transcript lines that produced it, or flagged
where none did. Status numbers: 1 Proposed, 2 Open, 3 Verify, 4 Agreed.

74. **AR-24, the billing and invoice flow.** Its region `prepayment-settlement` is renamed "Release the
    prepayment from the holding account"; a new region `invoice-sender`, "Sender to decide at build: our
    system or Xero" (note: "Shown as our system for explanation; not a requirement"); its description now
    says the prepayment "is released from the holding account to whoever did the List by a second pair"
    and that the engine sends the invoice "shown so for explanation: whether our system or Xero sends
    invoices is for the Stratos dev team to decide at build". The drawing (AR-24.svg) was redrawn to
    match: the renamed node, a "Sender to decide at build" note, and the prepayment approval, pair and
    Xero nodes moved, the approval node now directly under "List AUTHORISED" and outside the engine
    stage. From A L1027-1077 (points 50 and 51). Two doubts: the renamed node's subtitle still reads "in
    place of another invoice", which Greg called noise (B L835); the requested small "prepayment stream"
    label on the approval node (A L1107) is not in the drawing.
75. **OQ-117 created.** "Price override on fixed fee", status Open, affects US-05.2.5, no owner or
    sources, body "Do fixed fee contracts ever have the option to override the price? Details to follow".
    From A L123-135 (point 2). Donald asked Claude to fill it in; that is not done, and Ben's call (B
    L677-723) and the prepaid rule (B L793-799) now answer much of it.
76. **AR-44 linked on the contract and payer items.** EP-04 and EP-11 (AR-44), FT-11.2 (#bill-holder),
    US-04.1.1 (#arrangements), US-04.1.5 (#contract-holder, #holder-setting), US-04.2.1 (#billable-party,
    #holder-question), US-04.3.3 (#no-contract), US-04.3.4 (#booking-setup), US-11.2.1 (#bill-payer),
    US-11.2.2 (#payer), US-11.2.4 (#patient) and US-11.4.3 (#sxap). Links only, no text or status change.
    The diagram was walked at A L537-559; no line asks for these links.
77. **US-05.2.1: the competition law and Commerce Act wording removed.** "which competition law does not
    allow" and the paragraph "This default is a Commerce Act requirement: anaesthetists cannot
    collectively agree on pricing" are deleted. From A L85-111 (point 15). Status unchanged.
78. **US-05.2.2: "The anaesthetist is only inputting start and stop times; the system calculates the
    units."** From A L117-123 (point 16). Status unchanged.
79. **US-05.1.1 and the RVG stories.** US-05.1.1 replaces "A unique system (human readable) code: still
    open, Greg's proposal to come back to" with "A unique system code" (A L23-25, point 10) and also drops
    "its code and description, as published"; that second removal was not discussed and looks unintended.
    US-05.1.3, US-05.1.4 and US-05.1.5 go Verify to Agreed (A L39, L41, L67-69; points 11 to 13).
80. **FT-05.5 and US-05.5.1 to Agreed.** FT-05.5 Proposed to Agreed, its text now "using the standard
    base, time and modifier calculation if it's an RVG style contract" (A L221-223, point 22); US-05.5.1
    Proposed to Agreed, no text change (A L229).
81. **US-05.5.2: the pre-op event bullets deleted; Open to Agreed.** "is priced by a fixed-fee Contract",
    "is never the primary procedure" and "shows as its own line on the invoice" are removed. From A
    L375-387 (point 9). The three codes are still "to be confirmed".
82. **US-11.2.1 and US-11.2.2 trimmed.** US-11.2.1: "This is the common case, since most patients pay for
    their own procedure" becomes "This is the common case." (A L597-605, point 32). US-11.2.2: the
    paragraphs "A hospital or insurer taking the invoice is not a payer on the Booking..." and "This
    covers cases where the person responsible for payment is not the patient themselves, such as a
    guardian paying for a child" are deleted (A L609-645, point 33). Statuses unchanged.
83. **NHI stories to Agreed.** US-11.1.1, US-11.1.2 and US-11.1.5 go Proposed to Agreed (A L481, L507,
    L527; points 25, 27 and 28). US-11.1.4 stays Agreed: Donald said "let's move this back to open" (A
    L507) and later "I think we're agreed on that too" (A L527); the new question he asked for (point 26)
    is not on the board.
84. **US-11.3.2 and US-11.3.3 to Agreed.** US-11.3.2 Verify to Agreed (A L695), US-11.3.3 Proposed to
    Agreed (A L741). No text change: the anaesthetist visibility (point 37) and the free-text note (point
    39) are not yet written in.
85. **US-11.4.1 back to Proposed.** Agreed to Proposed, no text change. From A L781 (point 3).
86. **EP-06 to Agreed.** Verify to Agreed, no text change (A L859, point 43). Its text still says "this is
    the build's position until Ben answers can the price be changed", which point 1 overtakes.
87. **US-06.2.1: "checked across the whole Booking" deleted.** From A L873-883 (point 45). Status
    unchanged. The non-zero price (point 44) and US-06.2.2's practitioner ID (point 46) are not on the
    board.
88. **US-06.4.1 to Agreed; FT-06.4 unchanged.** US-06.4.1 Verify to Agreed, no text change (B L805,
    point 61); FT-06.4 stays Verify though Donald said one of the two "will get removed". The rewrite
    (B L785) is not done.
89. **FT-06.5 to Agreed and reworded.** "It is held in a prepay holding account... It is handled
    centrally by the office rather than by the anaesthetist" becomes "It is credited to a payables account
    called the AA Holding account"; the move bullet now "keeps its prepayment price"; the "Today, if the
    anaesthetist has already been paid..." paragraph is deleted. From B L449, L751-769, L805 (point 62).
90. **US-06.5.1 reworded.** "held in a prepay holding account" becomes "held in a ACCPAY prepay holding
    account" (from Greg's "accounts payable prepay account", B L815; "a ACCPAY" is a typo); "in place of
    another invoice to the patient" is removed (B L835-837) and the cancellation sentence split into its
    own paragraph. Status unchanged. Point 64.
91. **US-06.5.2 retitled "Cancellation of prepayment procedures"; Verify to Agreed.** Scenario 1, unpaid:
    a credit note as part of the cancellation; Scenario 2, paid: the full refund from the holding account
    as before; "The office handles the refund; the anaesthetist is no longer left to refund..." deleted.
    From B L861-881 (point 65). Scenario 1 is written in the second person ("you raise").
92. **US-06.3.5, US-06.3.6 and US-06.5.3.** US-06.3.5 Verify to Open (B L99), with its example sentence
    and closing "This is so..." paragraph deleted (B L93) and "claims no more than was prepaid" become
    "claims the prepaid amount" (B L59-63), leaving a stray full stop before the closing link (points 56
    and 57). US-06.3.6 Proposed to Agreed, no text change (B L99-105; no one said "agreed", and the
    one-template tweak is not done; point 58). US-06.5.3 Verify to Agreed, a paragraph split only (B
    L883-885, point 66).
93. **US-12.1.1 and US-12.1.4 to Agreed.** US-12.1.1 Proposed to Agreed, no text change (B L909-913;
    the update Donald asked for, point 69, is not done). US-12.1.4 Verify to Agreed, and "where available"
    removed after "HPI CPN (Common Person Number)" (B L917-923). Greg's "it's mandatory" answered Donald's
    reading of bank details (point 70), so the edit may have landed on the wrong field; bank details were
    already unconditional in the text.
94. **FT-12.2 and US-12.2.1.** FT-12.2: "the system of record for what is owed by patients and contract
    holders" (B L925, point 71). US-12.2.1 gains "There should be traceability back to bookings so it's
    easy to understand what's what." (B L933-945, point 72). Statuses unchanged.
95. **US-12.2.3 to Agreed.** Proposed to Agreed, no text change. Donald read it as "an interpretation or
    regeneration of this screenshot" and then stopped (B L971); no one said it was agreed.

## Not answered

96. **Requests to Claude not yet on the board.** Part A: fill in OQ-117 (L135); take "price override"
    as the simpler term (L169); a new question for Vanessa and/or Ben on Bookings arriving without an NHI
    (L481); a new feature for stub Bookings on a List (L523-527); the payer as "or other" (L553); email or
    postal address on the payer, and US-11.2.3 (L657-665); "contract holder" in US-11.2.4 (L679);
    anaesthetists seeing the alert, US-11.3.2 (L695); fold most of FT-11.4 away and move the approval
    number story (L845); US-06.2.2 for surgeons and practitioner ID (L957); a new prepaid and not-prepaid
    money flow diagram (L995, L1115); a small "prepayment stream" label on AR-24 (L1107); ask AA whether a
    prepayment invoice names the anaesthetist (L1107); US-06.3.1 as a transfer and without "never an
    organisation" (L1115, L1139). Part B: a new requirement and a new question for Vanessa and Ben on a
    Contract changed after a prepayment is sent or paid, and the draft payable in US-06.3.5 (L93); one
    letter template in US-06.3.6 (L105); a succinct question for Ben on US-06.4.1 (L443, overtaken by his
    answer); the prepayment invoice naming question again (L899); EP-12's messy summary (L899); US-12.1.1
    (L913); stories or links for the practitioner number and preferred and blocked lists (L917). Also
    asked without "Claude": the non-zero prepaid price (A L865), a question for Vanessa on billing events
    (A L339-347), asking AA whether the anaesthetist sees the approval number (A L821), and dissolving
    FT-06.4 (B L787, L805).
97. **Questions touched but not answered.** OQ-95 (age modifiers): only the P1 rule came up (point 12).
    OQ-101 (base unit ranges): Greg asked about ranges for modifiers, not settled (point 13). OQ-97 (a
    credit note for part of a prepayment): half-done work is "a separate invoicing event" (A L1023) and
    Ben's second invoice (B L683), but a part credit note was not discussed. OQ-47 (weekly payment cycle,
    accountant's agreement): part payments (point 52), the balance check before each payment run (point
    64) and one BCTI per weekly run (point 73) were raised, nothing settled. OQ-104 (prepaid price when the
    Contract changes): Donald recalled Ben honouring the prepaid price (B L677); the Contract switched away
    from prepaid is a new case for a new question (point 56). OQ-49 and OQ-63 are answered on the board
    but this meeting adds to them (points 23, 24 and 26).
98. **Next session.** Donald stopped "at my capacity" to process the day before the next meeting; Greg:
    "Now I have to cancel tomorrow's meeting. Well, I can't do it in the morning." (B L971-973)

### Added on verification

99. **Greg's opening position on changing a prepaid amount.** Before point 1's lock-down, on the AR-24
    flow, Greg: "we have allowed in the design that while it's highly unusual for a prepaid amount to be
    changed, in theory it can be." Donald: "That doesn't ring true to me." Greg: "It'd be a lot easier if
    we didn't. They could just raise another transaction." (A L1013-1017) Overtaken by point 1. Bears on
    OQ-96 and US-06.4.1.
100. **What triggers the prepayment release.** Donald read out the catalogue's account of the trigger
    (the office authorising the List, per the 19 October ruling; A L1035). Later, on why AR-24's prepaid
    line loops back, Donald: "the reason it loops back is because the procedure hasn't happened yet...
    all of that flow ultimately releases the payment here in all the post-procedure actions" (A L1081).
    Greg: "The trigger is, is it a prepaid transaction or not?... The trigger for deciding which
    anaesthetist gets the money." (A L1083-1087) Donald: "not quite... once the procedure is finished,
    then that money is released to whatever [anaesthetist] did the work." Greg: "Yes. Yes. Yeah, okay."
    (A L1089-1093) Agreed that the release follows the finished procedure; the exact event that triggers
    it (the List authorised or the procedure recorded) was not restated, so AR-24's "trigger still to
    confirm" is not plainly settled. Bears on AR-24, US-06.3.1, FT-06.5 and US-06.5.1.
101. **Ben eyeballs the differences between versions of the List.** On events and the List, Greg
    recalled that Ben "needs the list because he needs to look up the patient and see what morbidities
    they've got" (A L279), and that Vanessa "keeps sending him and everybody multiple updates of the list.
    That drives him nuts because he's got to eyeball the differences." Donald: "That's why he wants to get
    rid of that." (A L283-285) Not a ruling; it bears on how changes to a List are shown to anaesthetists
    (US-02.3.3, US-02.3.5, FT-02.5).
102. **Why is the modifier list separate from the RVG groups? Not resolved.** Opening EP-05, Greg: "why
    have you split out the modified list separately from the RVG groups? Aren't they inherently the same
    thing?... It's a separate part of the document." (A L13-17) Donald: "it's all in the same document"
    (A L19) and moved on. Bears on FT-05.1 and US-05.1.1.
