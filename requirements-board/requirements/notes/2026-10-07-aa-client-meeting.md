# AA client meeting, 2026-10-07

- **Who:** Donald Fraser (Stratos), Ben (AA principal), Vanessa (AA administrator) and Greg (RFP
  author, Peritia). Teams recorded Donald on his own and everyone in the room as one speaker, "Ben,
  Vanessa or Greg"; this note names Ben, Vanessa or Greg only where the transcript does, and
  otherwise says "the room".
- **Covered:** Donald took the open questions to Ben, Vanessa and Greg: the modifier split (OQ-15),
  when a List leaves the anaesthetist's view (OQ-31), prepayment amounts and who keeps them (OQ-38),
  the privacy of surgeon and anaesthetist preferences (OQ-43), the weekly payment cycle (OQ-47),
  Contract effective dates (OQ-48), NHI (OQ-49), partial prepayments (OQ-76), splitting a combined
  invoice (OQ-77), the admin dashboard and shared notifications (OQ-79), change emails (OQ-82) and
  anaesthetists claiming Draft Lists (OQ-86). New in the meeting: anaesthetist priority tiers for
  assignment and positive preferences. Then the procedure master: a curated procedure list mapped to
  RVG codes, picking a procedure then a Contract, leaving the RVG code blank, and showing the source
  text; the spreadsheet Vanessa and Ben are filling in; and "Booking" in place of "Card".
- **Inputs gathered here:**
  - one reconciled transcript, `../artifacts/files/AA Meeting with AA Oct 7th Reconciled
    Transcript.md` ([AR-27](../artifacts/AR-27.md)), reconciled from the Teams and Voice Memos
    transcriptions of the same recording;
  - the answers already on the board for the questions this meeting covers (OQ-15, OQ-47, OQ-86).

Cite a point as `"Notes 2026-10-07 · AA client meeting #n"`. Points are numbered once across the
whole note. Quoted wording is the speaker's own (spelling fixed, filler dropped); the summaries are
paraphrase, with the transcript as the authority. Positions are line numbers in the transcript, with
the recording time alongside: "L61-73 (8:41-10:41)" is lines 61 to 73.

## Questions answered

The board answer is quoted first where there is one, then what the meeting adds.

1. **OQ-15 Modifier split when units do not divide evenly.** Answer: "Agreed." This is the meeting
   where Ben was to validate it. L10-17 (0:03-0:57), Donald: "if there are seven modifier units and
   three procedures, anything over four is essentially split as evenly as possible between the
   procedures on that booking, with the remainder rounding up onto the primary procedure... We agreed
   about it last night." The room: "basically what Vanessa does in the office normally. If there are
   lots of modifiers, the primary procedure gets a little bit more, but sometimes they do have to be
   split. Yeah. That sounds fine." Donald: "So that's solved." No change to the rule.
2. **OQ-31 Event that removes a List from the anaesthetist's view.** No board answer yet (Open).
   L17-21 (0:57-2:22). Donald asked when a List should leave the anaesthetist's view, noting the RFP
   has it go once the office approves it for invoicing. The room: "once the invoicing has been done,
   it's been finalised, and there are no more questions. So probably once the office staff have
   finalised it and sent it through to invoicing." Then: "we'd still like the ability to go back and
   look at old invoices. Sometimes there's a query about an invoice you did three months ago: what
   did I enter?" Donald's proposed screen is point 16. Donald, L28 (3:27): "the transcript will
   answer it for question 31."
3. **OQ-38 Two modifier units in the prepayment estimate.** No board answer yet (Open). The question
   no longer arises in its own terms: the estimate is replaced by a fixed amount. L28-32 (3:27-4:51),
   Donald: "What Nick, Ron and Ben said last night is that, going forward, if an anaesthetist wants a
   procedure to be prepaid, they need to define a fixed prepaid amount that is selected and used for
   that prepayment, rather than an estimate based on BTM." The room: "When you do, say, Owen's lists
   and he's got a fixed price for his dentals, hasn't he? Are there any cases where somebody says,
   'Can you do a prepayment because they're not insured?' and you're doing an estimate? No - every
   anaesthetist always has a defined amount: this is how much the prepayment is. I think that's
   reasonable." This agrees with the 6 October directors' answer, which already replaced OQ-04's answer ("Base +
   time + 2 mod * anaesthetist's unit value") with a fixed-price contract (Notes 2026-10-06 · AA
   directors meeting #4). Where the amounts are
   kept is point 17; who keeps them is point 18. Donald, L56 (8:36): "So that's question 38."
4. **OQ-43 What the blacklist warning shows an anaesthetist.** No board answer yet (Open).
   - **Private, both directions.** L61-73 (8:41-10:41). Donald asked whether a surgeon or
     anaesthetist who does not want to work with someone would want that person to know. The room:
     "Definitely don't want either side to know." Then: "It's really just the same relationship
     viewed from either direction. Whichever way you implement it, it has to be private: the admin
     team can see and update it, but the anaesthetists shouldn't see it." Surgeons do ring the office
     to say they will not work with someone: "So it cuts both ways."
   - **Donald's recap.** L93 (15:02): "There will be a private preference relationship for each
     anaesthetist and each surgeon, because the system keeps profiles for both parties. Within those
     profiles, admin can define who someone does not want to work with in either direction. When an
     anaesthetist moves a list directly, the system will not warn either party that a block or
     blacklist exists. But when admin staff are assigning or moving someone, the system can surface
     that information because admin already has permission to know it. For example, when assigning a
     draft list, admin could see available anaesthetists without a conflict separately from available
     anaesthetists who do have a conflict. It is a warning to inform the decision, not a hard block:
     admin can still make the assignment if necessary." Nobody objected.
   - So: two directions, held by admin, never shown to anaesthetists, and no warning when an
     anaesthetist hands their own List on (point 19). This answers "one list or two" and "does each
     side learn of the other's" (no), and replaces the recommendation of a short prompt.
5. **OQ-47 Payment day and cycle.** Board: status Proposed, owner AA accountant; no answer. L163-170
   (24:23-26:29). Donald restated today's run (Tuesday to Tuesday, banked on Wednesday; the 20th of the
   month handled by Michael, the accountant; "Ben can choose to change it"), then read Greg's weekly
   cycle (ISO week number, Friday close and ledger snapshot,
   Monday for the office to sort out issues, Michael pays on Tuesday, anomalies rolled into the next
   cycle). Greg, L165 (25:35), on why: "We effectively have 52 payment cycles in a year, each
   identifiable by week number, which makes it easier to reference which payment happened when... it
   gives you Monday as a maintenance day to make sure everything is right before payment on
   Tuesday." The room: "I'm just wondering whether Michael or the accounts side should also be
   involved, but to me the proposal makes sense." Still for the accountant: see point 15.
6. **OQ-48 Which date decides the price in force.** No board answer yet (Open). L172-179
   (26:29-27:20), Donald: "the price used for the invoice is the price effective on the date the
   procedure actually takes place, correct?" The room: "Correct." Donald: "Okay, so that's question
   48." The recommendation (the date of the procedure) is confirmed.
7. **OQ-49 Booking without NHI: provisional or blocked.** No board answer yet (Open). Partly
   answered. L179-185 (27:20-29:16). Donald recalled that Vanessa "had said a hospital would never send us a
   patient without an NHI", then put both options: "do we make NHI a hard requirement for
   a booking to be accepted into a list? Or do we allow a booking with, say, only a patient name, but
   block invoicing until the NHI is supplied?" and "is it more painful to block a booking without an
   NHI, or to allow it and risk duplicate patient records later?" Vanessa: "I think it's probably
   reasonable to say we need an NHI. If there isn't an NHI, it creates confusion and duplicate
   patient records. So yes, make NHI mandatory." The room: "This is a significant decision because it
   makes NHI the patient identifier throughout the system. In the public health sector, if a patient
   comes in without one, they assign a temporary NHI. Even in an unusual case - say, a self-funding
   patient from overseas - if they're in the hospital records, they'll still have an NHI." Whether
   "mandatory" means a Booking cannot be created without one, or a pending Booking that blocks later
   steps, was not said in so many words: see point 34.
8. **OQ-76 Outstanding questions for prepaid procedures.** No board answer yet (Open). The part still
   open (all or nothing, or part such as 20%) is answered. L190-204 (30:08-33:06). Ben: "One of my
   surgical colleagues charges self-funding patients a 50% deposit... That's a surgeon rather than
   anaesthetics... I don't know anyone doing it for anaesthetics at the moment." Donald: "if nobody
   is doing partial anaesthetic prepayments now, we design for the current case: use the defined
   prepayment amount. If a genuine need for partial prepayments appears later, we can add it." His
   workaround: "cancel or credit the original prepayment, create a separate invoice for 50%, and then
   let the system handle the difference after the procedure." Greg: "the prepayment is the fixed
   amount Vanessa keeps in that anaesthetist's prepayment list. That's the amount of the prepayment.
   It doesn't need to be thought of by the system as '100% of the procedure', because the system can
   still create a later invoice to increase or decrease the final amount." Donald: "it doesn't really
   have a concept of '100% of the procedure' or 'not 100%'. It's simply a prepayment amount." The
   "another invoice?" part was answered on 2026-10-06 (Notes 2026-10-06 · AA directors meeting #1
   #2).
9. **OQ-77 Splitting a combined invoice, the rebill total and the before-invoicing case.** No board
   answer yet (Open). Parts 1 and 2 answered. L209-218 (33:17-35:22). Donald, part 1: "When you split
   the combined invoice, you're not simply applying those individual catalogue prices; you manually
   allocate the original combined amount across the component lines, right?" (his example: Merivale
   Plastics' individual prices for several procedures could add up to more than the combined fixed
   price). The room: "Yeah, but it always has to equal." Vanessa: "the rebuilt lines always have to
   equal what the original invoice was." Part 2, Donald: "Greg also noted that the credit should
   automatically include the corresponding reversal of the linked payable to the anaesthetist; that
   makes sense. I think that answers question 77." Part 3 (a split asked for before the combined
   invoice is sent) was not raised; Donald had said "I haven't read these new ones yet" (L209). Part
   1 goes against the recommendation and US-08.6.4: see point 37.
10. **OQ-79 What posts to the shared notification pool, and how long notices last.** No board answer
    yet (Open), and its four parts were not answered. L218-225 (35:22-37:35), Donald: "a shared admin
    notification feed - not per-user - so if, for example, Ben transfers something at 6:00 in the
    morning, the office can see that event when they log in. The idea is to surface important
    activity without making it invisible or excessively intrusive." Vanessa: "Yeah, that sounds like
    a good idea." Donald: "We'll stick with that recommendation for now and clarify the details
    later." The shared, not per-user, pool is OQ-65's answer, now agreed by Vanessa. The Draft List
    view raised in the same breath is point 24.
11. **OQ-82 Do we want to automate the change emails.** No board answer yet (Open). L225-233
    (37:35-39:51). Donald described the admin's button that drafts an email of a Booking's changes,
    for example to tell a hospital who is now turning up, and asked whether the system should send
    these automatically or admin should always start them. Vanessa: "An automated email would be
    wonderful, because doing it manually is time-consuming." Donald proposed it stays "a manual action
    in the MVP, even if automation is desirable later" (the reason is point 25). Vanessa: "That's fine
    as long as we've got the option to add it later on." So: manual in the MVP, automation as later
    work. Donald's instruction for the catalogue is point 13. The question was framed around admin
    changes, while OQ-82 asks about changes from an anaesthetist: see point 39.
12. **OQ-86 Should anaesthetists browse and pull Draft Lists themselves.** Answer: "NO". L238-242
    (40:31-41:26). Donald asked whether anaesthetists should "view those draft lists and claim them
    themselves", like a substitute-teacher app. The room: "No." Donald: "Okay. Awesome, easy." The
    board answer is confirmed with Ben, Vanessa and Greg together.

## Donald's notes

No typed notes came with this meeting. Donald spoke these instructions during it.

13. **Add a future story to automate the change emails.** L233 (39:51): "Claude, as you listen to
    this transcript for question 82, please add a new story to automate this functionality in a
    future phase of work, but not as part of the MVP." (Point 11.)
14. **Update OQ-38 to the fixed amount.** L32 (4:51): "I'll update this question later on to kind of
    represent that change, but that makes sense to me and fits in what we talked about." (Point 3.)
15. **Build to Greg's payment cycle, and keep it for the accountant.** L172 (26:29): "I might update
    this to be a proposed solution and build out the prototype and requirements with that in mind,
    but I'll leave it as a question for the accountant as well, because we need to talk to him and
    already have some questions pending." (Point 5.)

## Other points

16. **The anaesthetist's main view, and an archive (proposed).** L23 (2:46), Donald, after point 2:
    "On the main screen of the app, you'd see all your lists, with any lists that haven't been
    invoiced yet showing there. Maybe it starts you on whatever today is... and you can scroll back to
    see other lists that haven't been invoiced. Otherwise it shows upcoming work, and somewhere else
    in the app there'd be a deeper search or archive where you can find previously created bookings
    and lists." The room moved on without objection. It meets the room's wish to "go back and look at
    old invoices" (point 2).
17. **A per-anaesthetist list of fixed prepayment amounts.** L34-38 (4:56-5:53). The room (the
    speaker says "Donald and I have been talking this morning"; Donald is recorded separately, so who
    spoke is unclear): "keeping those lists as a custom list for that anaesthetist - his fixed
    prepayment amounts - so that we can attach them to the booking... effectively treating it like a
    catalogue of prepayment amounts that you can use for that anaesthetist until he changes them?"
    Donald: "Exactly right." Then: "for every anaesthetist who wants to have these fixed prices, the
    system will manage them. Vanessa or somebody in the office could log in and change Dr Smith's
    facelift fixed-price amount. Then, when a procedure turns up, nobody has to work out the number
    from scratch: the price is already defined. There'd probably still be an approval step where
    somebody in the admin team looks at it, but the amount itself already exists in the system."
    Greg later calls it "the fixed amount Vanessa keeps in that anaesthetist's prepayment list" (L200).
    What a line is keyed on (a named procedure, an RVG code or a Contract) was not said; Donald's
    example is per procedure ("Dr Smith's facelift").
18. **The office keeps the prepayment list, not the anaesthetist.** L40-56 (6:21-8:36). The room
    asked whether anaesthetists should maintain their own on their mobile: "I think the office should
    manage them, don't you?" Donald: the easiest build is admin, "because they already manage all the
    other contracts", but some anaesthetists may have so many they want to update them themselves; or
    "do they just need to send an e-mail and then the admin team do it themselves?" The room: "I
    reckon they should probably just send an email... if you give too many people too much access to
    change too many things, they start [messing] around with it." Then: "We want the anaesthetists to
    have good functionality, but not unrestricted access to change everything" (after "What do you
    think, Vanessa? I agree."),
    "because then we've got a smaller group of super users for the software, which is the admin team
    and maybe one or two others." Settled: admin maintains; an anaesthetist emails the office.
19. **No warning when an anaesthetist hands their own List on.** L75-91 (10:41-14:42). Donald's
    case: Ben falls sick and passes his List to Donald, who is free but does not want to work with
    that surgeon. Ben: "this is a 6:00-in-the-morning scenario, so there are no admin staff around.
    If the system is just showing which anaesthetists are available that morning in green, I don't
    think you need that alert. There'll need to be a phone call anyway." Ben: "if it was last-minute
    sick cover, the surgeon would rather have the list covered than not covered." Donald: "when Ben
    tries to transfer a list to me, the system reveals nothing. It just lets him see that Donald is
    available and pass it on. You don't get any warning, and I don't see anything." If the surgeon
    complains, "the admin staff can explain that the transfer was initiated by Ben and that the
    system doesn't reveal or block those preferences in an anaesthetist-to-anaesthetist transfer
    scenario." The room added that the anaesthetist and surgeon would normally talk anyway. Floated
    and dropped: the room asked "do you think there should be maybe a yellow warning?" (L79); the
    final position is no warning (L87, recapped at L93).
20. **Positive preferences, and a better name than "blacklist".** L98-108 (16:14-18:08). Greg raised
    a preference feature that presents anaesthetists in an order, adding that "the
    negative-preference/blacklist information could also feed into the ordering." Donald: "I would
    probably stop calling this a blacklist and find a better term for it." And: "Greg was talking
    about basically a 'whitelist' - also not a great term, but let's use it for now - meaning
    preferred surgeons someone wants to work with. So admin could see both positive and negative
    preferences when making those matches." No name was chosen.
21. **Anaesthetist priority for assignment, admin only.** L98-120 (16:14-20:09). Greg: "When an
    extra list becomes available or cover is needed, the directors have talked about having
    priorities - shareholders getting higher priority than non-shareholders, for example." Donald:
    "there needs to be some sort of tier list of anaesthetists in the system. It is visible to
    administrative staff and used to inform preferential treatment." The room: "It's an ordering of
    suggested matching for when the admins want to assign someone. At the moment the graph is
    alphabetical... But the ranking itself should really only be known to admin." Donald: "an admin
    only function or view." The room: "admin-only would be the way to go... when you ask, 'Give me a
    list of available anaesthetists who can fill this assignment.' It might be an ad-hoc list or a
    replacement. Instead of a random list, it could give you an ordered list... although the ranking
    could also be used to filter displays." Shareholder status "would be assigned administratively"
    (L128).
22. **Tiers as pools, shuffled within a tier; not a numeric rank.** L122-146 (20:09-23:11). Donald:
    "I like the idea of tiers rather than an exact rank." Greg floated the alternative: "let
    administrators assign a numeric ranking. The trouble is you then get arguments about the
    difference between, say, 38 and 42." Donald: "If instead we have pools of people within tiers,
    then when an admin staff member is choosing someone, the people within that tier can be
    randomised. That helps avoid favouritism from the same person always appearing at the top." The
    room: "three or four tiers would work - maybe four tiers." Where it ended: tiers, with Donald's
    shuffle inside each not objected to (nobody explicitly agreed it); the numeric rank was not taken
    up. In passing, there are five directors (Donald had
    guessed eight, L122-124).
23. **Four tiers, Bronze the default.** L146-158 (23:11-24:10). Vanessa: "Gold Elite would be the
    directors. Gold would be the particularly helpful anaesthetists who are shareholders, Silver would
    be the other shareholders, and Bronze would be the non-shareholders." Donald: "We can work out
    better language, but what I'm hearing is four levels: a bottom/default tier and then three tiers
    above that with different status." Behind "helpful": "anaesthetists who are very helpful, very
    willing to put their hand up and help, and are good team players. Those are the people who should
    be rewarded with a higher tier" (L134). Floated and not taken up: tiers by "years with Anaesthesia
    Associates" (L116, L124). The names are provisional.
24. **A view of Draft Lists by how soon they fall.** L218 (35:22), Donald: "a clear place to see all
    draft lists that don't yet have an anaesthetist attached, sorted by how close they are to the
    procedure date." Vanessa: "Yeah, that sounds like a good idea" (L220).
25. **Manual first at go-live, automate as trust builds.** L229 (39:15), Donald: "Greg has raised the
    idea a number of times that, when the new system first goes live, it may be better to keep some
    manual intervention points. As we discover edge cases and you build trust in the system, we can
    automate more." Vanessa accepted it for the change emails (point 11).
26. **A curated procedure list between the source wording and the RVG.** L247-255 (42:22-43:56).
    Donald: there could be "an enormous number of different ways to name the same procedure", while
    "the RVG only has roughly 40 or 50 base-code categories. So we're proposing something in the
    middle: a curated set of named procedures that are pre-matched to an RVG code." Its purpose: "to
    make things easier for users and to help the system narrow down the relevant contracts attached to
    a procedure." Asked if they were comfortable, no one objected; Ben moved to how messy theatre text
    is: "it literally says something like 'WLE MM, left shoulder + flap repair + SNB + excision SCC and
    flap, left sternum + BCC'... another admin staff member might look at 'WLE MM' and ask what on
    earth it is" (L257-259).
27. **Two routes to a procedure, then the Contract.** L265-267 (45:19-45:26), Donald: admin need "a
    simple way to match what is written on the incoming PDF or hospital/surgeon source to the
    structured procedure", with "two routes to find the right RVG code. One is to navigate/search by
    body section and subgroup - things like head, dental, ocular. The other is to search directly by
    RVG code if she already knows it. Once the right procedure is selected, the system then filters
    the contract list." L285 (49:21): "what is currently one procedure field would become a two-stage
    choice: first select the procedure, then select the exact contract underneath it. The contract
    defines who gets the invoice, whether it is fixed cost, whether a discount can be applied, whether
    there is a custom rate." Admins such as Vanessa are the subject-matter experts who "over time,
    learn those mappings"; the room's example: a list that says "blephs" against the Christchurch Eye
    contract line "blepharoplasty" (L283).
28. **The RVG code can be left blank; the billable party and billing strategy come first.** L269-307 (46:15-53:05). Ben matched
    his own case that morning to a breast RVG code "because nothing else really fit". The room: "in a
    case where admin can't confidently choose the code, they could leave it blank for the anaesthetist
    to fill in later, or check it with them" (L281). Ben: "At the moment anaesthetists just choose the
    RVG code at the bedside... That would be handy when the match is obvious, but if it isn't obvious,
    there should be an option to leave it blank rather than force a bad match" (L291). The room: "The
    critical thing before the anaesthetist fills in the booking is to have the billable party and
    billing strategy sorted out. After that, it should flow rather than getting stuck because
    something important is missing. And if the RVG code is wrong, it can always be changed" (L293).
    Donald had assumed the office maps every Booking so "the base units are already pre-populated"
    (L295-301); what the conversation "is unlocking", he asked, is whether a Booking could arrive with
    "the patient, surgeon, room and original source description all present, but without anybody
    having successfully mapped that description" (L303). Ben: "There will always be some procedure description on the operating-theatre list"
    (L305); and "procedures can change on the day as well" (L307).
29. **Show the source wording beside the mapped procedure.** L312-316 (53:10-53:56). Donald: "the UI
    needs to show the exact source text that came from the surgeon's rooms or the hospital... alongside
    the structured procedure selected in our app." Ben: hospital lists "are often a bit more accurate
    than the lists from surgeons' rooms"; "today my app had 'WLE MM', but the hospital list had it
    written out in full as 'wide local excision'... a room might send 'RTK' and the hospital may show
    'right total knee'. So if the integrations are working, later hospital updates could give us a
    fuller description." And: "if that text ever appeared on the patient's invoice they'd have no idea
    what it meant. For our purposes, the key thing is still identifying the correct base units."
30. **AI-assisted matching, later (floated).** L287-289 (50:01-50:19). Greg: "are we anticipating that
    sometimes in the future we'll be able to use some AI that may have used the historical
    associations as learning so that it can then match future bookings?" Donald: "absolutely possible
    in future - either by learning from historical associations or by using general medical/domain
    knowledge." No decision.
31. **The procedure spreadsheet.** L321-345 and L375 (55:14-58:10, 1:01:33). Donald: "a generated list
    pared down from the Solutions Plus procedure list. That source list was around 2,000 procedures of
    dubious quality; this working list is down to about 400. All you need to do at this stage is put
    in an RVG code and the base units. If you see a procedure that needs a different mapping, update
    it." Add a row for any RVG code with no procedure; delete duplicates ("three versions of
    'extraction'"). Ben offered to help. Donald offered a Google doc; instead "Greg has already set
    something up in Teams/SharePoint. We can invite Donald and work from there" (L341), with autosave
    (Greg, L345). Donald: "it doesn't have to be set in stone, but it would be valuable as a starting
    artefact to help shape the system" (L375).
32. **"Booking" in place of "Card".** L352-359 (58:18-1:00:11). Donald asked Ben to confirm the move
    from "Card" to "Booking". Ben: "We used the term 'Card' because each case literally used to have a
    paper card that we filled in. 'Booking' or 'case' is fine; the exact name doesn't really matter...
    it's probably time to move on from the term." Donald: "That's already basically captured in the
    requirements."
33. **Next meeting.** L359-373 (1:00:11-1:01:24). The standing meeting moves from Tuesday to Wednesday
    next week at 1:30 (Ben is working on Tuesday); Donald may cancel it if there is little to discuss.
    Logistics only.

## Unresolved or in tension

34. **How hard "NHI mandatory" is.** Vanessa: "make NHI mandatory" (point 7), with NHI the patient
    identifier throughout. OQ-49 and US-11.1.4 assume a Booking can go ahead with the NHI pending,
    authorising the List blocked, and propose the system's own patient ID with the NHI as a second
    index; OQ-49 also notes that some surgeons' rooms' PDFs omit the NHI. The meeting leans to the
    strict reading but did not say whether a Booking from such a PDF is refused or held pending.
35. **The fixed prepaid amount against the catalogue's estimate.** Points 3, 17 and 18 have the
    prepayment taken from a fixed amount the office keeps for each anaesthetist. US-06.2.2 and
    US-06.2.4 have it "calculated automatically" as an estimate with two contingency modifier units,
    set by "an admin or the anaesthetist"; US-06.1.1 has the anaesthetist tick prepaid codes on their
    own profile, and US-06.1.2 has admin maintain them "on behalf". The 6 October directors' answer
    was "Anaesthetist will create and manage their own fixed price contracts" (Notes 2026-10-06 · AA
    directors meeting #4), against point 18's office-maintained list. What the "approval step" in
    point 17 approves was not said.
36. **No warning on an anaesthetist's own hand-over.** Point 19 has no warning at all. US-01.4.5
    (Verify) shows the same soft warning as the office sees; US-13.6.3 says the blacklist "could also
    be shown on the anaesthetist's profile" and keeps it on the surgeon's profile; OQ-43's
    recommendation was a short prompt without the reason. On 2026-10-01 Greg pictured anaesthetists
    keeping their own list on their own screen (OQ-43).
37. **Rebill total.** Point 9 says the rebuilt lines "always have to equal" the credited invoice.
    US-08.6.4 says "The component prices need not add up to the bundle price... The system does not
    force them to match", and OQ-77's recommendation (1) was to keep no forced total. OQ-77 part 3 is
    still open.
38. **A Booking without a mapped procedure.** Point 28 lets the RVG code be blank until the
    anaesthetist fills it in, with the Contract and billable party set first; Donald's working
    assumption (and the catalogue's) has the office map the procedure and pre-populate base units.
    What then blocks the anaesthetist's submit (FT-03.6) was not discussed. The spreadsheet in point
    31 asks for base units on each procedure row, while base units sit on the procedure's default
    Contract (US-05.1.6, OQ-62); US-05.1.6 says the list holds them for now only to pre-populate
    those Contracts.
39. **OQ-82's framing.** OQ-82 asks whether to automate the email when the change comes from an
    anaesthetist (US-02.3.3 already offers it to the office when an anaesthetist moves their own
    List). The meeting asked about changes the admin team makes. The answer (manual in the MVP,
    automation later) was given for that framing.
40. **Names and attribution.** Donald names the directors at the 6 October meeting as "Nick, Ron and
    Ben" (L28); that meeting's note has "Nick and Rob". In L34 the room speaker says "Donald and I
    have been talking this morning", though Donald is recorded separately, so who said it is unclear
    (possibly Greg, who met Donald that morning: Notes 2026-10-07 · AA meeting with Greg; an
    inference, not said).
41. **The List's exit point.** The room's "once the office staff have finalised it and sent it
    through to invoicing" (point 2) is near, but not word for word, US-07.4.1's "once its invoices
    are generated". On 2026-09-29 Greg's reason for keeping it visible was that a List should move
    from unbilled to billed and processed, not simply vanish (paraphrase, Notes 2026-09-29 · AA
    client meeting #11; OQ-31); point 16's archive keeps it findable.
