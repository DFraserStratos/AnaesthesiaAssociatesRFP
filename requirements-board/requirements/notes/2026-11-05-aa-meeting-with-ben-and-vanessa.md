# AA meeting with Ben and Vanessa, 2026-11-05

- **Who:** Donald Fraser (Stratos, product owner), Ben (AA principal) and Vanessa (AA office
  administrator), in person, with Donald's laptop and phone passed between them (L49, L257, L689).
  Greg Smith (RFP author, Peritia) and Michael (AA's accountant) are discussed but not present (L7).
- **Covered:** Ben and Vanessa's feedback on the contract picker mock (`contract-picker-mock/`, the
  step rail of Notes 2026-11-04 · Donald working decisions #9): its wording ("needs an invoice
  destination", a "payment type" step), a prepaid amount outside any price list, future fixed prices
  from funders, the RVG fallback, filtering Contracts by the surgeon's specialty, and how the office
  keeps price lists current and safe. Also: anaesthetists' pain work, pre-op consult room billing and
  add-ons; lists shared by two surgeons and out-of-hours Lists; the hospital's procedure text
  replacing the rooms'; recording RVG detail under a fixed price; showing the anaesthetist the price;
  the edit history on a Booking; overdue and credit alerts; updates reaching the app without logging
  out; next steps, Xero and Michael; and help desk hours. No items or questions were edited during
  the meeting.
- **Inputs gathered here:**
  - one reconciled transcript,
    [AA Meeting with Ben & V 5th Nov Reconciled Transcript](<../artifacts/files/AA Meeting with Ben & V 5th Nov Reconciled Transcript.md>),
    registered as artifact [AR-57](../artifacts/AR-57.md), reconciled from three automatic
    transcriptions of the recording (the raw audio is not in the catalogue).
  - Donald's typed decisions of the same day (D1 to D11 and later notes), made after the meeting,
    are not this note's evidence: they are the appendix of the contract model design,
    [Contract model proposal 5 November 2026](<../artifacts/files/Contract model proposal 5 November 2026.md>),
    artifact [AR-58](../artifacts/AR-58.md), and recorded point by point in Notes 2026-11-05 ·
    Donald contract model decisions
    ([2026-11-05-donald-contract-model-decisions.md](2026-11-05-donald-contract-model-decisions.md)).
    Where one of them settles a point left open here, the point says so; they are Donald's, not yet
    confirmed by AA or Greg.

Cite a point as `"Notes 2026-11-05 · AA meeting with Ben and Vanessa #n"`. Points are numbered once
across the whole note. Speakers' wording is kept in short quotes (spelling fixed, filler dropped);
the summaries around them are paraphrase, with the transcript as the authority. Positions are
transcript line numbers ("L17-19" is lines 17 to 19). The transcript's own reconciliation notes
(L837-843) say that questions, tentative implementation suggestions and discovered exceptions "should
not be treated as final design sign-off"; this note follows that reading. Close to firm in the room:
the wording changes Ben asked for (points 12 and 13), the hospital's text replacing the rooms' (point
30), an audit log on each Booking (point 33) and showing the anaesthetist the price (point 34). The
rest are wishes, proposals or reports. Names in the mock (Anna Whitcomb, Margaret Ellison, Miravell
Plastics) are demo data; "Miravell Plastics" is a phonetic best guess (L841).

## Questions answered

1. **OQ-131, how the office keeps prices current: item by item, in settings.** No board answer.
   Donald asked: when a price list holder (his example, Miravell Plastics) "comes in and says, 'Hey Vanessa, here's a new price list. Please
   update the prices in the system,' how do you want to handle it? Without seeing any mock-ups, what
   would you expect it to look like?" (L699) Today the list "gets emailed to us and then we manually
   do it" (Vanessa, L707). Vanessa would like "a screen, like a spreadsheet" (L737). Donald's
   expectation, whether or not a spreadsheet export exists: "you could go into the system, find each
   one of these line items (breast reduction simple, breast reduction complex) and just update the
   prices... back in the settings." Vanessa: "That's what I'd love to do." (L739-745) Donald then
   concluded: "Greg and I were having some back and forths on whether or not you would have all those
   settings exist at a different tier or level and it sounds to me like the best solution would be to
   have each of them be an individual thing" (L755), and "there will always be functions in the
   system to allow you to update individual items, and each one can have unique settings and
   information on it" (L775). This favours the question's option 3, editing in place, at the level of
   each priced item. Dates were not discussed: whether a price can be set from a future or past date,
   and how a Procedure's price follows its date, came later in Donald's D6 (price ranges with a start
   date that may be in the past). Vanessa agreed to editing items in place; Ben deferred to her
   (L777); the flat model itself is Donald's conclusion (point 25). Partly settled. Bears on FT-04.2, US-04.2.4, US-04.2.10,
   US-04.2.14 and US-04.1.2.
2. **OQ-100, a Contract schedule upload in the first release: not settled.** No board answer. Donald
   reported Greg's view: "Greg feels quite passionately about the idea of exporting some versions of
   our contracts out, editing them in a spreadsheet and then bringing them back in. And I think some
   version of that is currently in scope." (L739) Even without it, prices can be edited item by item
   (point 1), and "The specifics would be if you wanted to do a big bulk update or things to that
   effect." (L775) Vanessa's "a screen, like a spreadsheet" (L737) may be a wish for a grid on screen
   rather than for a file to upload; it was not explored. Ben and Vanessa did not ask for an upload,
   though Ben's wish for a copy of the contracts outside the system (point 27) touches the export.
   Later the same day Donald's D10 put bulk upload and export out of scope of the contract model and
   into the requirements update. Not settled by the meeting. Bears on US-04.2.13, FT-13.4 and
   US-13.4.3.
3. **OQ-78, a fallback for every configuration: restated.** No new answer. Donald: "one of the
   particular things that Greg and I talked about almost throughout all of our work together is that
   by default there should always be at least an RVG contract for every configuration." With no
   fixed-price Contract set up for the List's hospital and funder ("There are actually no Southern
   Cross contracts for Forte"), "the system's just going to present to you the
   RVG code to select. And obviously the admin team can choose it, but at this point the expectation
   is you'd pass it over to the anaesthetist." (L151) The mock's morning and afternoon views are a
   demo device, not a "pass to anaesthetist" button (L153-155). Ben did not comment on the rule.
   Donald's D8, later, adds an open-price fallback for every destination. Bears on US-04.4.1,
   US-04.4.2 and US-04.3.3.
4. **OQ-130, a later default over an admin's edited invoice description: not discussed.** The meeting
   changes the question's premise: the hospital's procedure text now replaces the rooms' text on the
   Procedure (point 30), and the hospital's text is the default on an RVG invoice. Whether it replaces
   an admin's edit was not raised. Donald's later note of the same day (AR-58 appendix): "the
   Procedure's invoice description always wins over the hospital's description on the invoice". Still
   open. Bears on US-08.4.6, US-03.1.9 and US-02.5.7.
5. **OQ-132, base units on a mixed Booking: not discussed.** The meeting asked for RVG detail
   recorded under a fixed price (point 20), which is the case the question turns on, but nobody spoke
   to where the base units go. Still open. Bears on US-05.3.1 and US-03.2.1.
6. **OQ-33 and OQ-74, the 90-day and credit-balance alerts: restated, not re-decided.** Donald
   restated the 90-day threshold OQ-33 already holds and the alert on a credit balance of OQ-74
   ("alerts as well if somebody has a positive balance", L203; point 36). Vanessa called alerts "a big
   thing for me" (L221), and said overdue stages matter to the anaesthetist as well (L193), which
   touches OQ-59. No change to the answers. Bears on US-11.3.2, FT-11.3 and US-12.2.1.
7. **OQ-126, the surgeon address book: not discussed, but specialty becomes a requirement.** The
   question asks whether AA wants more than the surgeon master data, "such as searching by
   specialty". The meeting did not discuss the address book, but it makes the surgeon's specialty
   part of pricing (point 16), as US-13.6.2 had recommended, and Ben named "this spreadsheet" that AA
   is working on, likely the specialist list of 3 November, which already has a specialty for each
   surgeon (Notes 2026-11-03 · Ben specialist list email #5), as where it comes from (L355). Bears on
   US-13.6.2, FT-13.6 and OQ-129.

## Contracts and pricing

### The contract picker mock

8. **Vanessa likes the mock, the prepay flow most.** Vanessa: "I really like it." "I like the
   drop-down boxes, and I like, as I said to Ben, about the prepay system." (L25-29) "We are moving
   into more and more prepays with the anaesthetists... that's a big part of our job at the moment,
   is prepays" (L33); "I think that will make our job a lot easier and not so time-consuming...
   because at the moment the prepays are quite time consuming for us." (L43-47) On the patient's
   groupings: "As long as all of the groupings are there, it will work." (L91-99) At the end: "I'm
   really impressed by it." (L241) Ben: "Definitely heading in the right direction." (L687) Donald
   credited AA with the design: "you unlocked the idea of going billable party first" (L19), and
   Ben's flowchart of the stages "was really helpful to unlock this" (L57). Feedback on a mock, not a
   requirement; it supports prepay as a priority. Bears on EP-06, FT-06.2, US-04.3.4 and EP-11.
9. **Show every hospital provider: asked, not answered.** The mock suggests the booking's own
   location's Contracts. Donald: "would it be valuable if there was a button to say show me all
   different hospital providers and then you could choose those alternatively as opposed to just
   having it hide everything and just show the eye surgery?" (L61-69) Ben asked to run through
   Vanessa's comments first (L71-75), and the question was not returned to. Donald's D3, later, rules
   there is no "show all". Not settled by the meeting. Bears on US-04.3.2 and FT-11.2.
10. **The procedure text is free text; the office picks a fixed-price item.** Ben first said the
    office would not pick a procedure, "because we've already got the procedure up here" (L103-111).
    Donald: "that procedure at the top here, our system doesn't consider that any sort of object it can
    make decisions based on. It's just free text, given to everybody involved... Whatever the rooms
    give us, or the hospitals, we just kind of give that to you as it is." Underneath sit what "we've
    been calling contracts", and "somebody would need to select one of these, which is presumably a
    fixed-price contract for a given procedure." (L113) Ben corrected himself: "I'm actually incorrect
    here... if it's a fixed price, that has to be clicked. So that could be the admin team. And that's
    pretty easy, because you would just go, 'CAT', and then cataract comes up." (L115) Donald: "the
    system obviously does not dictate that anybody has to fill this in at this stage, but in theory
    they could." (L125) Settled in the room: the office can pick the fixed-price Contract at booking
    setup by typing to search, and nothing forces it then. Bears on US-04.3.4, US-04.3.2, US-03.1.2,
    US-03.1.9 and US-02.5.7.
11. **Hospitals' fixed prices to come, under a funder's tag.** On an ACC knee case, Donald: "if there were
    some particular ACC contracts, you could imagine they might exist under that if they were
    available." (L131-135) Ben: "if in the future Forte comes to us and says, okay, we've got a fixed
    price, which I imagine they will, it's inevitable... 'We want to provide a fixed price for a knee
    arthroscopy'... then that would be able to be uploaded, and you would go, okay, this is a Southern
    Cross contract at a fixed price, and it would come up here. So it could be Forte, Southern Cross"
    (L137); "Imagine that in the future" (L145). The demo has none, so only the RVG shows (L139-141).
    Ben's expectation, not a current contract. Forte is a hospital; with Donald's "There are actually
    no Southern Cross contracts for Forte" (L151), the reading is a Forte fixed price for Southern Cross
    patients, the hospital-plus-funding-tag case (D7). "Uploaded" here reads as set up, not as a bulk
    upload. Bears on US-04.1.1, EP-04 and US-04.2.14.
12. **"Needs an invoice destination", not "needs a contract".** Ben on the mock's warning: "the term
    contract is something different to when Vanessa and I talk about a contract... I'm wondering if
    rather than saying needs a contract, if it just says needs an invoice destination." (L263-267)
    Donald: "We talked last time when I came in about maybe the term contract is too confusing. So I'm
    totally okay with changing it." (L269) Asked for a better word for step 2, Ben: "if you're
    choosing one of these, this is a contract case. But if you're going to, where does the invoice go,
    patient, that's not a contract." (L273-275) Vanessa: "It could just say destination." Ben:
    "Invoice destination." Donald: "invoice destination or payment details outstanding." Ben agreed
    (L279-285). Agreed in the room for the warning and the first step; the step 2 term was left open.
    Donald's D1 records the wording. Bears on EP-04, EP-11, FT-11.2 and US-04.3.2.
13. **"Payment type: Standard or Prepaid", Standard first.** Ben: "rather than saying 'not prepaid',
    I wonder if we should just say something like 'standard invoice'... because it sort of makes
    prepay the default or the normal." (L293) Vanessa suggested "self-funded"; Ben: "No, it might not
    be." Donald: "Both of them could be self-funded, but one is paid before." (L295-299) Ben: "I don't
    like the term 'not prepaid' because 90% or 95% of what we do is just the normal pathway, which is
    not prepaid." (L301) Donald: "the question should be 'payment type' or 'payment style'"; Ben:
    "Perfect" (L307-309). Donald: "the first option should be standard invoicing and the secondary
    option would be prepaid." (L311) Agreed in the room; the exact wording is not final. Ben's 90 to
    95% is a rough figure. Bears on EP-06, FT-06.2, US-06.2.2, US-04.3.4 and OQ-25.
14. **A prepaid amount from outside any price list: "Other price".** Ben: "Sometimes it may not be
    predetermined." A secretary asked him what he would charge for a spine operation; he decided a
    price, and "I'm not going to get them to prepay, but I could ask them to prepay." "So there'd be
    times when it'd be either from a predetermined list, or Vanessa might say, 'Hey Ben, how much do
    you want them to prepay?' And I would say, 'Oh, just make it two grand.'" "And then Vanessa just
    put in 2 grand." (L315-323) Donald pointed to the non-prepaid side's fixed price or RVG toggle,
    "a similar slider which was select..."; Ben: "Select from above or..."; Donald: "Or fixed price";
    Ben: "Or other price." Donald: "That makes sense to me." (L325-333) So the office types the amount
    the anaesthetist gives. A wish Donald accepted; Donald's D7 and D8, later, make it the "Other
    price" toggle on the destination's open-price fallback. Bears on FT-06.2, US-06.2.2, OQ-96 and
    OQ-25.
15. **"Procedures" or "contracts": AA thinks of them as procedures.** Donald: "procedures and
    contracts are obviously words that we've had trouble with. Is there a better word for procedures
    here?" (L337) It was not answered directly. Later Ben: "Our procedures will have... Which, if you
    want to call them contracts, that's fine as well. But we think of them as procedures." Donald: "I'm
    going to say the word contract just because the transcript will know what I mean." (L363-369) Not
    settled; Donald's D1, later, keeps Contract in the model and the code. Bears on EP-04, US-04.1.1
    and US-04.3.2.

### Specialties

16. **The surgeon's specialty narrows the Contracts offered.** Ben: "I wonder whether or not we
    should have another line or specification for specialty. And the specialty would be dictated by
    the surgeon... if you had that, it would then focus or limit the pick list." (L341) The specialty
    is attached to the surgeon, not inferred: "we will have a list (we're working on this
    spreadsheet) and we'll attach the surgeon's specialty to that. We can be quite generic; rather than
    saying upper-GI surgeon or something, we can just say general surgery. And then when it comes to
    our procedure contracts, we can also, on our spreadsheet, add a column of general surgery, general
    surgery, plastic surgery, ENT surgery" (L355-359). Donald: "surgeons have specialties attached to
    them, but also our contracts will have specialties attached to them." (L361) A Contract can carry
    more than one: Ben, "breast reduction... can be done by a plastic surgeon or... by a general
    surgeon. So we can assign 2 specialties maybe to the procedure"; Donald, "We don't need to limit it
    at all." (L371-373) On the mock's eye case (surgeon Anna Whitcomb, an ophthalmologist), Donald:
    "We can filter down these anaesthetist contracts to filter anything that's not an
    ophthalmologist." (L381-393) Broad specialties only for the first version: general surgeons
    subspecialise, but "if we ignore the sub-specialties and just do the top level ones"; Ben: "The
    broad specialties." (L411-415) Agreed in the room. AA ("we") will add the surgeon's specialty to the
    spreadsheet it is working on, and can add a specialty column to its procedure contracts. Earlier,
    Donald restated an AA statement and added a wish of his own: "you were saying that surgeons' rooms
    don't really exist, like each surgeon has an individual price list. That's something you'd said.
    And so we still want potentially the flexibility of having one fixed-price contract in the system
    that could be applied to multiple surgeons at a surgeon's room if they decide to." Asked whether a
    Miravell Plastics facelift would carry the setting "cosmetics" or the specialty, Ben: "because she
    is a plastic surgeon, so that's her specialty." (L347-351) The one-Contract-for-several-surgeons
    wish was not discussed further; Donald's D4, later, takes it up as any number of linked surgeons.
    Whether a Contract with no specialty shows for every surgeon was not discussed
    (Donald's D3, later: none means every specialty). Bears on US-13.6.2, FT-13.6, US-04.3.2,
    US-04.2.13, OQ-126 and EP-04.
17. **One specialty per surgeon, or several: left open.** Donald asked whether surgeons "will never
    have multiple specialties, or it's really rare." Ben: "It would be extraordinarily rare. I'm not
    saying it's impossible" (L417-419). Donald: "Should our system allow for multiple specialties?"
    Ben: "No, like I don't..." Donald: "Just one." (L421-425) Ben: "if there is an unusual situation, we can put them in twice"
    (L427); "I do not know in the context of private practice of a surgeon that does multiple
    specialties", only a doctor who is also an intensive care specialist, "not two different
    surgical." (L431) Vanessa: "I've never come across it." (L433) Donald noted a surgeon "can't be
    duplicated because they have a HPI number" (L429), so Ben's workaround would not work, and: "It
    might be easier for our system just to support it, even if it's mostly not used... I'll leave that
    open in the air, then." (L439) Ben: "It's not a thing." (L441) Not settled: Ben answered no, and
    Donald left it open; Donald's D3, later, goes the other way (a surgeon holds a list of
    specialties, usually one), so it needs AA's confirmation. Bears on US-13.6.2 and FT-13.6.
18. **A surgeon's List is one specialty.** Donald asked whether a surgeon's List could mix
    specialties; Ben: "Anna is only an ophthalmologist. She will only be operating within her
    specialty." (L397-399) Before that Donald restated the List rules: a List from upstream becomes
    active only with "an anaesthetist, surgeon, hospital, day and a session", and is a draft with a
    hospital, surgeon, day and probably a session but no anaesthetist (L353). So the specialty comes
    from the surgeon, known even on a Draft List. Lists shared by two surgeons are point 28. Bears on
    FT-01.6, US-04.3.2 and US-13.6.2.
19. **Anaesthetists' pain work does not bill through AA.** Donald asked whether anaesthetists have
    specialties. Ben: "an anaesthetist can also be a pain specialist. We have had that in the past...
    I know Jordan is doing a bit of pain." Donald: "Does any part of the system need to care about
    that?" (L445-449) Vanessa: it "comes up as CPH/pain. We can manually..." (L463); Jordan does not
    bill privately for pain (L465-467); "Jeremy did, but Jordan has never billed through us." (L471)
    (Jeremy Fote and Rick Ackland are past anaesthetists, L469.) Vanessa: "Doesn't, it kind of
    doesn't", and pain work does not go through AA's system (L455-459); so no anaesthetist specialty
    is needed now. Pre-op and post-op events on a
    Procedure are a separate path and are not touched. Bears on FT-13.6, EP-04 and FT-03.7.

### Pricing on the Procedure

20. **RVG detail recorded under a fixed price.** Ben: "one of the anaesthetists decides on the prices
    himself, and on his card he'll just put in his price... But he also wants for his own personal
    reference the RVG codes." "He wants to be able to stick in his RVG codes, the time, the modifiers,
    and say, 'I've got that recorded, but blow that, I'm just going to do my fixed price.'" "If
    somebody queries his fixed price, he can say, 'Well, look, if I did it by RVG, these are my RVG
    codes.'" (L589-601) Today "it's either/or... you're having to delete the RVG and record that
    somewhere else; it's a manual process." (L605) Donald: "that's fine" (L595); the earlier idea was
    that "you'd select your RVG code... fill in all your information, but at any point on a procedure
    you could come down here and override the price... The system would still record everything else
    you put in" (L603). Accepted in the room, for one anaesthetist's practice. It sits against
    US-03.5.1, where the anaesthetist may change an RVG price only where the Contract allows and a
    fixed price is never theirs to override; whether this anaesthetist's price comes from his own
    price list Contract, an open price, or an override of the RVG price was not said. Donald's D9,
    later: where the Contract allows, the anaesthetist overrides an RVG price with the RVG detail kept.
    Bears on US-03.5.1, US-05.4.1, US-05.2.5, US-03.3.1, US-04.2.14 and OQ-132.
21. **Under a fixed price, the RVG is optional: Donald's gut.** Donald first said that on the
    override path "the RVG would be mandatory; it wouldn't let you submit unless you submitted the RVG.
    But you'd still override it." (L607) Ben: "Can you do it without the RVG? Like for me, if I'm just
    doing a price, I don't want to fill out any of this rubbish." (L609) Donald: "we can test this out
    once we build it out a bit more, but my gut tells me if you choose a fixed price, you can
    optionally choose an RVG in there, but you're not required to put in the time or the modifiers."
    (L613) A proposal, not a decision; it fits US-03.3.1, where a fixed-price Procedure needs no RVG
    code. Donald's D9, later: on a fixed or open price the form collapses to an optional RVG code for
    reference. Bears on US-03.3.1, US-03.1.9, US-05.2.5 and FT-03.3.
22. **Add-ons, and pain work by ad-hoc invoice: Donald's proposal.** Donald: "some of the documents
    you sent us... will say this line is $500, and this line is plus $200 if you do that at the same
    time. And so this whole idea of add-ons is something we probably inevitably need to support. Again,
    I'll mock it up... But potentially either through an add-on or through a general ad-hoc invoice, we
    can support any of that pain stuff. It doesn't need to be too complicated." (L475) Ben and Vanessa
    did not respond. A proposal and an intention to mock it up, not agreed. Donald's D10, later: a
    combination is its own Contract; extras are ad-hoc invoices or events. Bears on US-08.6.3, FT-03.7,
    US-03.3.6 and EP-04.

### Keeping contracts current

23. **AA cleans up the procedure list, and removes the ones it does not use.** Ben: "what I would do
    is actually need to go through this list and edit some of this stuff, like toric or multifocal...
    Whereas we would just be like cataract one side, cataract both sides." (L115-119) Donald: "this is
    all just based on files that you gave me, but ultimately all the fine-tuning of that you guys would
    clean up and edit as you need to." (L117) Vanessa earlier: "I don't think we necessarily need all
    of the [unclear], because there are so many different eye [procedures]." (L99) And later: "I think
    we need to remove some of the operations, like what we said. There are quite a lot that we don't
    use." Donald: "There's a little demo data at the moment, but the expectation is that you guys will
    manage that." (L247-249) AA curates its own list; how an unused one is removed (deleted, or
    disabled so history keeps it) was not discussed. Bears on US-04.2.4, US-04.2.13, FT-13.4 and
    OQ-100.
24. **A new price list today, and a new procedure needing a new line.** Asked how a holder's new
    price list should be handled, Vanessa first asked where in the system they would enter it: "Like
    now, at the moment, we just do prepays." (L701) Today a holder's new price list "gets emailed to us and then we manually do it" (Vanessa, L707), "looking it up, getting a piece of
    paper" (Ben, L703). For editing in the system, see point 1. Ben: "There might be a completely new
    procedure, which often happens." A gastroenterologist asked his fixed price for a brand-new
    procedure that is "not insurable. Patients are going to have a fixed price"; Ben worked one out;
    "something completely new that's not in the system already... It needs a new line." (L749-753)
    Donald supposed that a holder's document could mix kinds: "the first half of it would be a bunch of
    fixed price things, but maybe the bottom two would be a fixed discount or a fixed rate" (L755); not
    confirmed by Ben or Vanessa. Ben also said the price list on screen was one he wrote himself and
    gave to Kerry (her role is not said; presumably the surgeon whose
    price list it is) to put her letterhead on, "because of the Commerce Commission, this is
    not from me" (L713-729). Bears on US-04.2.4, US-04.2.14, US-04.1.2 and US-05.4.3.
25. **Each priced item its own record: Donald's conclusion.** After point 1, Donald: "Greg and I were
    having some back and forths on whether or not you would have all those settings exist at a
    different tier or level and it sounds to me like the best solution would be to have each of them
    be an individual thing." (L755) For Greg: "you would have seen in some of his documents he talked
    about something called a contract, and then a contract line. He and I had basically this eureka
    moment the other week... there will always be functions in the system to allow you to update
    individual items, and each one can have unique settings and information on it." (L775) Ben: "I'll
    be completely guided by Vanessa because she's the one who's doing it." (L777) Donald's conclusion,
    not agreed with Greg; Ben and Vanessa did not discuss the structure. It is Donald's D1 (one record
    per priced item, no header and lines) and the flat Contract model of AR-58. Bears on EP-04,
    FT-04.2, US-04.2.4, US-04.1.2 and OQ-131.
26. **Spreadsheet export and import: Greg's wish, reported.** Donald: "Greg feels quite passionately
    about the idea of exporting some versions of our contracts out, editing them in a spreadsheet and
    then bringing them back in. And I think some version of that is currently in scope." (L739) Later:
    "if we didn't do any sort of Excel export-import stuff that Greg is keen on, and I totally
    understand the value of it" (L771). Reported, not asked for by Ben or Vanessa; see point 2. Bears
    on OQ-100, US-04.2.13 and FT-13.4.
27. **A safe copy of the contracts: Ben and Vanessa's wish, Donald's pushback.** Ben: "I think Greg
    was suggesting to have like a source of truth somewhere, like a spreadsheet or something." (L757)
    Donald: "the system itself would be the source of truth, but you could tell it to spit something
    out if you needed to." (L759) Ben: "It's whether or not we have a source of truth that sits outside
    of your system as well... it needs to be kept somewhere safe so that we don't lose it." Vanessa: "I
    think we do need it." Ben: "we would probably need to keep something in your system and something
    outside of your system, but it would basically be replicated in case, I don't know, a cyber attack
    and your whole thing goes down." (L761-769) Donald, of Greg: "He's not used those terms source of truth
    with me, so maybe you guys are having a conversation about something different" (L763); "the
    services we use within Microsoft to host this application do their own backups"; keeping
    spreadsheet backups is "creating yourself another job that may inevitably fail in the future.
    Because the system is always going to be a source of truth; your backup is always just going to be
    a snapshot in time." (L771) Ben: "As long as there's a safe, secure source of truth that sits
    somewhere." Donald: "I think you should expect to put your trust in the system to do that."
    (L777-779) A wish and a pushback, not a decision: Ben softened but did not drop it, and Vanessa did
    not speak again on it. Donald, at the checkpoint for this note: covered by the requirement to export the data to a spreadsheet, so no question is raised. Bears on EP-15, FT-13.4,
    US-04.2.13 and OQ-100.

## Other points

### Lists and Slots

28. **Two surgeons sharing a session: an A and a B List.** Vanessa: "we have a lot of lists where
    it's say a general surgeon and then an added on surgeon", for example "a general surgeon and a
    gynae surgeon." (L479-493) Donald: "So a single list has multiple surgeons... Well, this is new."
    (L481-485) Ben first: "I think the solution to that is just create a new list." (L489) Then: "some
    surgeons are not very busy and can't fill a whole list. They might share a session, like a morning
    or an afternoon, with another surgeon... 'I'll take the list from eight until ten.' And then the
    second surgeon goes, 'Great, I'll take that list from ten o'clock'" (L497). Donald: "it'd be two
    different lists. As of now, an anaesthetist can only have one list in AM or PM slot. So would you
    expect those to have different anaesthetists or the same anaesthetist?" Vanessa: "No, they have
    the same." Ben: "Typically it would be the same anaesthetist, but a list might get split into two."
    (L499-503) Donald: "that's like a whole new kind of breaking concept... Half a slot. Would you ever
    slice a slot in three or four?" Vanessa: "No, just two." (L505-513) Today it is "all in the one
    list, but then have a little, you know, brackets. It's actually somebody else doing the procedure"
    (Ben, L535). Ben also recalled a plastic surgeon who "couldn't find a pediatric anaesthetist, so they
    did it on Mel's list" (L539); who Mel is was not said. Donald: "at this stage, we'll see if the
    developers when we start building it have a different opinion, but at this stage I think the idea
    is that it would probably be nicer to split the slot in half and have an A and B list, as opposed to
    having a single list with multiple surgeons" (L541). Ben: "The default would be just normal, but
    the special circumstance would be potentially." (L543) A new need; the A and B split is Donald's
    working idea, not a decision. Ben's "typically" leaves a different anaesthetist per half possible.
    It breaks the one List per Slot rule. Bears on US-01.1.1, FT-01.2, FT-01.6, US-01.4.2 and EP-01.
29. **Out-of-hours Lists, sometimes made the same day.** Vanessa: "We have had eye lists that go past
    the sessions, AM and PM. If there are emergency cases, then we have to create a slot after six."
    (L515) Known in advance? "It can be done that day, at night." (L521-523) Ben: "Not only in eyes,
    but any specialty, because they might say, '... Is anybody available at five or six o'clock to do
    it?' So that's another thing we haven't thought about." (L525) Donald: the anaesthetist would "see
    AM and PM. The AM could actually be split into AM A and AM B. And then you could imagine some sort
    of out-of-hours or after-hours list... I think that's all doable, but that's new" (L531). A new
    need, not designed: its times, who may create one and how the availability finder treats it were
    not discussed. Bears on US-01.1.1, US-01.1.4, US-01.4.2, FT-01.2 and EP-01.

### The Booking and the anaesthetist app

30. **The hospital's procedure text replaces the rooms' text; history keeps the original.** Ben on
    the mock's "procedure as received": "I don't think we need this." (L549-553) Donald: the rooms
    "might give you some sort of hard-to-read code like this, and then the hospitals will come in with
    something a bit clearer." For a fixed-price procedure, "we can allow the admin staff to hand-author
    what they want to appear on the PDF", and where none exists, because it is an RVG, "Our default
    was that we'd use the hospital text on the invoice, not the surgeon's room text" (L555). Ben: "Yeah,
    I agree with that. But the initial information comes from the rooms, and then the day before the
    hospital sends their list... I would just take the hospital procedure as the source of truth and
    override this procedure." (L557) Donald: "So you would never want to see, does that look right? Or
    do I want to see what originally came through?" Ben: "Yeah." Vanessa: "Because that's what's on
    there." (L559-563) Ben: "when it gets updated with the hospital list, if the procedure has changed,
    just accept the hospital's version." (L571) Donald: "We can remove that from there, and with the
    history we talked about earlier, you'd always be able to see what the original one was in the
    history." (L577) Agreed in the room by Ben and Donald, with Vanessa; not confirmed by Greg. It
    replaces the catalogue's reading that both descriptions are shown "each exactly as sent": the
    hospital's text replaces the rooms' text on the Procedure, and the rooms' original is kept in the
    history.
    What happens to an admin's edit is OQ-130 (point 4). Bears on US-02.5.7, US-03.1.9, US-08.4.6,
    US-02.5.4 and US-02.5.5.
31. **Updates reach the app without logging out.** Vanessa: "In the app we have at the moment, if we
    make an update or change something, the anaesthetists have to log out and then back in to see the
    new update. Will this apply with this?" (L159) Donald: the anaesthetist "would at least need to go
    from the booking back to the list and then come back into the booking... I would think that
    probably the way this ends up being engineered would not be like a Google Docs experience. It'll be
    a refresh of the page, and it's there. But certainly you don't need to log out and log in." (L161)
    Vanessa: "the anaesthetists get quite frustrated with that." (L163) Options floated: "some sort of
    like pull to refresh" (Donald), "Refresh page button or something" (Ben) (L165-167); Donald: "maybe
    I should pause before I commit to anything", but it "may be possible that we can set it up where
    it's listening, and even if you have it open every minute, maybe it takes a look and see if it's an
    update." (L169) Ben: "We'll see." (L171) Committed: no log-out needed. The refresh mechanism is
    open. No item covers it. Bears on EP-03, US-03.1.4 and US-15.0.2.
32. **An amended invoice flows through; the Booking shows its total.** Vanessa: "if we were to amend an
    invoice, will that obviously automatically change for the anaesthetist to see? Plus when we send it
    off to the hospitals... will that automatically add notes and update it?" Donald: "Yeah." (L173-175)
    Then: that "isn't really represented in this little small prototype. But what I expect... when you
    come to a booking page as an administrator... You would be able to see the total cost of all of the
    procedures within it... within a single block or a single procedure, you could see in there that
    there might have been pre-op or post-op events... and you'd have options to go ahead and override
    things as needed. I don't know exactly what they look like, but I know that's something you need"
    (L179). A reassurance, not a design; what "automatically add notes" means for a hospital was not
    explored. Bears on US-08.6.2, FT-05.4, US-05.4.2, FT-03.7 and US-02.3.1.
33. **The edit history on each Booking, with who and when.** Vanessa: the current system "says our
    names when we've updated something or changed something" (L181); "with having office staff, it
    needs to have even a user ID, say T1 or V1... otherwise we're never going to know who's changed an
    invoice" (L185). Donald: "it's important to have the time stamp and who edited it and all that sort
    of stuff visible", but rather than on the page, "a log of changes like this that you could go and
    review if you ever needed to see who made this change or when did it happen or what... a little bit
    behind a door" (a history button, as on the Requirements Board) (L187). Vanessa: "No, it just needs
    to be somewhere within the invoice booking." Donald: "we can have some sort of audit log on each
    booking." (L189-191) Vanessa: "it's just important for us, but important for the anaesthetist as
    well, because the invoice has so many different stages. Like overdues, also overdue stages" (L193).
    Agreed in the room: a log reachable from the Booking, with time, person and change, including
    changes from a hospital system. Whether the anaesthetist also sees it is implied by Vanessa, not
    settled. The history is already kept (US-02.5.5); what is new is the screen. Bears on US-02.5.5,
    FT-02.5, FT-13.5 and FT-08.3.
34. **Show the anaesthetist the price, but not in their face.** Donald: the earliest prototype, which
    Greg saw, showed the price change as the anaesthetist added time; "Greg's feedback early on was
    that an administrative person would want to see what that price is and see it change in real time,
    but an anaesthetist just cares about the care and doesn't care about the numbers", so it was
    removed: "In the end we got rid of all of it" (L613-617). Ben: "that's what we have at the moment.
    We don't see a price. But maybe for like a self-funded, you see the price go, okay, I might just
    charge a little bit less." (L619) "I think it's fine to say on the app to have what the price would
    come to." Even for RVG? "Yeah but I don't think it needs to be in your face." (L623-627) Vanessa:
    "I think that's important that you see what the price comes to." (L629) Ben: "some people are just
    clicking modifiers and not even thinking about how much they're charging" (L637); Vanessa:
    "Especially when it's like 10 modifiers... the price does get up." (L641-645) Ben: "it might modify
    people's behaviour." (L653) Vanessa gets "all the emails from the hospitals... And now daily...
    Questioning modifiers" (L655-663); she can usually explain from the RVG guide, but when "the
    modifiers are quite a lot... I need to go back to the anaesthetist. But if the anaesthetist can
    actually see the price they're charging, then it might... Limit it." (L667-675) Donald: "I can try
    and resurrect that so you guys can see it." (L635) A wish from both, which Donald accepted; it
    reverses Greg's early steer, so Greg should hear it. Placement and prominence are open beyond "not
    in your face". Bears on US-03.5.1, US-05.4.1, US-03.3.4, US-03.1.4 and US-15.0.2.

### Patients and billing

35. **Pre-op consults in AA's room are billed through AA.** Vanessa, after the pain work (point 19):
    "The only thing that we've billed through here is if the room gets used for pre-op consults. So we
    do have to have that added in here." Ben: "We can talk about that later if you'd like." (L471-473)
    A stated need with no detail: who is billed, by whom, how much and how it is recorded were not
    said. It is not the ACC pre-operative assessment of OQ-12, a pre-op event on a Procedure. No item
    covers it. Bears on US-08.6.3, FT-03.7 and OQ-60.
36. **Overdue and credit alerts on the patient.** Vanessa: "Obviously overdue, stuff like that."
    (L201) Donald: "we've basically got this concept in the system of alerts and there are mild and
    there are heavy alerts. So a mild alert would be if this person has an outstanding bill, but it's
    within 90 days... But then if it's over 90 days, you want it to be more of a red, angry alert. And
    then there's also, I think, alerts as well if somebody has a positive balance" (L203). Ben: "for
    the purposes of today, because that's all stuff that we are going to do down the track." (L205)
    Vanessa: "But where would that sit on?" (L207) Ben: "A little alert, maybe... there's an alert box
    here where you could have other alerts" (L215). Donald: "it has to exist in the context of I'm
    looking at a patient and I want to see that information." (L227) Vanessa: "the alert thing is a
    big thing for me" (L221); "we have quite a few that slip through the radar. And even though they
    have insurance, they still seem to slide through because we don't have any alerts." (L235) Ben:
    "Good visibility that this has been a problematic patient in the past." (L237) Confirms the rules
    held (FT-11.3, OQ-33, OQ-74), with the alert shown on the Booking where the patient is seen.
    "Down the track" is Ben steering the meeting; whether it also means a later release is not clear.
    Bears on FT-11.3, US-11.3.2, US-11.3.3, US-12.2.1 and FT-08.3.

### Project and support

37. **Next steps: build the new prototype, then workshops.** Ben: "the process from here is obviously
    you just sort of tidy up the requirements and then you hand it off to the developers to develop. Is
    that right?" Donald: "Not quite." The plan had been to agree every requirement with Greg, bring the
    prototype up to date, then hold "honestly lengthy workshops with you guys to sit down and read all
    of these and say, 'Do we understand it right?'" (L687-689) Now, "we'll probably talk about this
    tonight... we think we probably know enough information to build the new prototype, and anything
    else that's wrong will [unclear] be picked up in the next phase of sitting down, talking about it and
    having workshops... once you're happy with that we'd go through the process of sizing, chatting
    with you about financials, and getting going on it." (L693) Donald and Greg's proposal, not yet
    agreed between them; a project matter, not a requirement. AA's time will be needed.
38. **Xero, and meeting Michael.** Ben: "The other big piece of the puzzle, and I've talked to Greg
    about this, is getting the Xero integration, getting that right, and you meeting with Michael."
    Donald: "We will meet with Michael, yeah. That does need to happen, absolutely. Everything that
    happens on the Xero side of the fence will obviously need configuration and we will be integrating
    with it... we will continue to meet with people, yourselves and Michael, and adjust as we build."
    (L697-699) Action: Donald to meet Michael (AA's accountant, Notes 2026-10-27 · AA meeting with Ben
    and Vanessa #13); no date set. Bears on EP-10, US-10.2.7, OQ-47, OQ-60, OQ-112 and OQ-29.
39. **Help desk and support hours.** Vanessa: "when we have a problem within the system, what are the
    hours? Like obviously with our old system, it is a limited time." (L791-795) Donald: "If something
    isn't working, or somebody's got a password issue... we would provide a phone number or an email
    line, kind of both, which is what we do for other customers." (L807) Ben: "The ticket, the usual
    thing." (L809) A missing feature "would be a conversation that comes to me or the development team"
    (L811). Ben: "'I've tried to log on at eight o'clock and the system is not working.'" Vanessa: "I
    start at 8 o'clock before anybody else"; the old vendor starts at "Half past eight, 9 o'clock"
    (L815-823). Donald: "our support team, I believe, right now is currently eight o'clock to five
    thirty. The developers may work different hours, but we do have an incident response process, and
    we can talk about that in the future." (L825) Donald's "I believe" and "off the top of my head"
    (L797) conflict with EP-15 and our RFP response, Monday to Friday 8:30am to 5:30pm NZT with no
    weekend or on-call cover by default; AA's day starts at 8:00. Outage response was left for later.
    Not settled. Bears on EP-15 and US-02.5.4 (which carries the support-hours delivery
    constraint).
