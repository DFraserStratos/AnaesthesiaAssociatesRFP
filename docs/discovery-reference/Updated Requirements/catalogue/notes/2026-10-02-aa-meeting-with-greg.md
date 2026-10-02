# AA meeting with Greg, 2026-10-02

- **Who:** Donald Fraser (Stratos) and Greg (RFP author, Peritia). Ben (AA principal), Vanessa (AA
  administrator) and AA's accountant are referred to but were not there.
- **Covered:** the AA fee and trust law, the final fee against a prepayment, where base units live
  and how RVG changes flow through contracts, pre-op and post-op events, prepayment estimates and
  anaesthetist discretion, the logical model of days, slots and Lists, List status values,
  notifications when a List moves (a new shared notification pool), contract identifiers, contract
  ownership and who pays, the split billing basis, booking update emails and templates, a prepaid
  Booking moved to another anaesthetist, a negative balance with no later payment, additional
  invoices with credit and rebill, prepayment and the billable party, patient balance warnings, the
  RVG time rule, and the open prepayment questions for Ben. It was a walk through OQ-60 to OQ-76 on
  the Requirements Board, continuing from the 2026-10-01 meeting.
- **Inputs gathered here:**
  - one reconciled transcript: `../../../Meeting Recordings/AA Meeting with Greg Oct 2 A.md`;
  - the answers Donald made to open questions in the Requirements Board: OQ-62 and OQ-63 in commit
    `1b8f118` (earlier the same morning), and OQ-64 to OQ-75, OQ-61's owner change and the new
    OQ-76 in commit `124ca2c`;
  - Donald's typed new requirement: "AA Admin portal needs a shared notification pool" (also written
    into OQ-65's answer).

Cite a point as `"Notes 2026-10-02 · AA meeting with Greg #n"`. Points are numbered once across the
whole note. Quoted answers and Donald's notes keep his wording (spelling fixed, filler words
dropped); the transcript summaries are paraphrase, with the transcript as the authority. The
transcript carries no timestamps, so positions are line numbers: "L27-33" is lines 27 to 33 of the
transcript. Much of the transcript is Donald reading a question aloud before answering it; those
readings are the question's text, not a statement by either speaker.

## Questions answered

One entry per question answered or changed on the board on 2026-10-02, plus OQ-60, which was
discussed but not answered on the board. The board answer is quoted first, then what the
transcript adds. Where they disagree, both are kept and the point says so.

1. **OQ-60 What the AA per-invoice fee counts, and how the fee is paid.** Not answered on the board;
   still Open, owner "AA accountant". Discussed in the room (L19-37):
   - Part 3, netting (L23-25), Greg, emphatic: "No, no, no, no, it absolutely doesn't. Under trust
     law it mustn't. So it's always a separate invoice and it's paid into a separate bank account."
     The fee never nets against the anaesthetist's payables.
   - Part 2, paid invoices only (L31-33), Greg: "It should. I don't know what it does, but that's
     definitely what it should do." The per-invoice charge counts only invoices that were paid, so a
     Booking moved between anaesthetists is not charged twice. Donald (L37): "so we can kind of agree
     on that."
   - Part 1, the schedule of fixed charges (L27-29): Greg does not know. Still for AA's accountant.
   - Donald had flagged it for the accountant before reading it (L19, L23: "we can talk to the
     accounting about it"). Parts 2 and 3 are Greg's view in the room, not confirmed by AA.
2. **OQ-61 Final fee above the prepayment: always invoice the balance?** Still Open; owner changed
   from "Donald to ask AA" to "Donald to ask Ben". L37-43: Donald reads the question; it is not
   answered ("we've determined that question 61 we need to ask Ben", L43). No threshold was named.
   The prepayment questions raised later (point 21, OQ-76) bear on it.
3. **OQ-62 Where base units live, and how a Procedure is picked.** Answer: "As I see it. The Master
   RVG procedure list holds RVG codes, and each procedure has one or two default RVG contracts which
   hold the base units and all other settings."
   - L43, Donald: "I think we need a list of master procedures, a master list of procedures, which
     has the groupings of body parts and things. And all the RVG codes; that may reference RVG codes
     if you want to. But really the base units live in the contracts. And so there needs to be
     basically generated base contracts... those RVG contracts, and the base units live in there."
   - L45-47: Greg asks how a (rare) change to an RVG unit value flows through the system. Donald:
     contracts are maintained by hand, a bunch imported from spreadsheets at the start, and "for
     every procedure, a base contract that is basically understood to be the standard RVG
     recommendation for base units."
   - L49-53: Greg's idea for propagating changes, contracts as children of a master code (point
     22). Not adopted or rejected.
   - **Difference in detail.** The board says "one or two default RVG contracts" per procedure; the
     transcript says "a base contract" per procedure. The board's list "holds RVG codes"; in the
     transcript the list is "a master list of procedures" grouped by body part that "may reference
     RVG codes". Both agree base units live in default (RVG) contracts, not on the list or the RVG
     code master. Both supersede the master-procedure-list base units of the 2026-10-01 note's
     point 4; the detail is still in tension (point 40).
4. **OQ-63 How pre-op and post-op events are modelled, named and approved.** Answer: "1. Donald's
   right: its own element attached to the original Procedure. 2. Line item. 3. All of these are just
   called events. And in the UI on a procedure, all events will be visible. Pre-op, post-op,
   additional invoices, whatever. 4. All events are bundled with the procedure invoice if possible.
   Otherwise, next run. And yes, all have the same standard review step, single process for
   everything. 5. These events have a tick box to mark if they will be invoiced. So these events can
   still be recorded, but not invoiced."
   - Part 1 (L57-111): Donald: not a new procedure, but something attached to a procedure so it
     links to a procedure or contract; in the UI "you would just see a list of events related to that
     procedure" (L65). Donald wondered about attaching it to the contract, which holds the billable
     party (L77-89); Greg: "I can't see an argument for it attaching to the contract" (L83), and a
     default contract "absolutely doesn't specify a billable party" (L91). Donald: picking a default
     contract presents a name and email field for whoever pays, "so even a base contract will still
     have a billable party" (L93). Greg (L99): "I agree with your conclusion that it should be in the
     procedure", with a later discussion owed on what a contract is (point 37). Greg (L195): "the
     database guys are definitely going to implement this as a separate table, so it is just linked to
     it."
   - Part 2 (L117-129): a line item. Donald: AA might want them bundled into one final cost, "but I
     think it's safer to have them split off so everyone can see it"; Greg: "I absolutely agree...
     if you're going to have a pre-op procedure, it has its own life." Greg (L123): by the time it is
     printed, everything is a line anyway.
   - Part 3 (L133, L197-205): "events" as the umbrella term, which also covers an ad hoc
     (additional) invoice; tagged pre-op or post-op in one generic place in the UI. Greg (L199): "I
     don't think events is necessarily...", no alternative offered; Donald: "Renaming things is easy
     in the future, but we just pick something now." See point 44.
   - Part 4 (L133-175, L205): Greg: a pre-op event is billed with the procedure, not before (L139).
     "An event that occurs before the invoice is approved just travels with the procedure. An event
     that happens after the invoice is raised generates a separate invoice. Which goes through the
     same process" (L159-163). Donald's summary, which Greg accepts ("I think we should make it simple
     like that"): "any events, be them post-op, pre-op or additional invoices, are invoiced with the
     original procedure if possible. Otherwise they're invoiced in the next round" (L169). This
     settles the 2026-10-01 tension over approval (that note's point 61): one review step for all.
   - Events can come from the admin team as well as the anaesthetist ("someone calls up and asks
     the admin team to record it", L207), though mostly from the anaesthetist.
   - Part 5 (L177-193): Greg: anaesthetists may record an event for clinical reasons; "they record
     everything, insurance, whatever, and hospital records as well", but "we'd need to check with
     Ben" (L187). Donald: "let's make a call here and just have a button on an event to say it's
     billable or not" (L189). Greg adds a billable-party control on the event (point 24).
5. **OQ-64 Logical model of days, Slots and Lists.** Answer: "1. Claude and the final devs can
   decide how these are handled behind the scenes. In our view, Slots exist in a day. They are a box
   or container. They can have a status. Lists go into that box. 2. Every one is created and stored
   on the four rolling month thing. 3. When an anaesthetist marks a AM or PM slot on a day as
   unavailable, while that slot has a list. They are presented with a choice to return the list to
   the office to resolve or assign it to another anaesthetist's. 4. You decide for now. 5. Admin staff
   will see draft lists yes. This is a major feature for AA staff. As for the word slot, we will
   keep that out of the UI as text. But it is represented much as it is today in the prototype."
   - Part 1 (L255-263, L419-427): left to the prototype and developers. Greg on slots and Lists:
     "they both are children because a slot by definition belongs to a day" (L421).
   - Part 2 (L263-311, L435-439): Donald first leaned to inferring empty slots; Greg preferred
     concrete ("easier to manage"), though "ultimately it's up to the DBA". Greg: "we should create
     all the slots... It's effectively the foundation on which everything else is painted." Donald:
     "Every one is created and stored across the rolling four months"; Greg: "that's an
     implementation detail", Donald: "But we agree on it."
   - Part 3 (L271-279, L439): Greg: the List "reverts to a draft list"; Donald: "it's on the
     anaesthetist to hand this over to another anaesthetist or return it to the admin team". At
     L439 Donald reads "does the list become a draft list?" and answers "And we think yes. So
     essentially when you're unavailable, it can initiate the flow or ask the question: return to
     office or assign to an available anaesthetist." See point 45.
   - Part 4 (L439-463): Donald took "you decide" first, then raised OQ-17. Greg: users "are still a
     bit confused about what they want those values to be" and have "a lot of redundant statuses";
     status changes are logical, not labels. Agreed: statuses as a user-maintained list rather than
     an enum (point 30). Greg wants a clear definition from the users (point 38).
   - Part 5 (L365-417): Greg: "I don't want the word slot used in front of the customer. Because
     they're lists." "I like the idea of the draft list. I think that's great" (L369). Donald: "I
     don't think we need any part of the UI to say the word slot" (L399). Greg: "Slots belong in the
     implementation model" (L417). The board's "represented much as it is today in the prototype" is
     not said in the transcript.
   - The long slot-versus-List debate between the two parts is point 29.
6. **OQ-65 Who is told when an anaesthetist moves their own List.** Answer: "Yes on all of your
   recommendations. There will also be a new feature: AA Admin portal needs a shared notification
   pool." (The recommendation: the office is notified and offered the cover-change email; the
   colleague sees the List appear with a notice.)
   - L493: Donald accepts, because update emails already exist for Booking changes (OQ-46): when a
     List comes back unassigned or a Draft List sits "in the warning area", "somewhere in that
     process flow you could also have it generate the emails that need to go to the parties. It's
     the same sort of change-state email flow." L521: "Office are notified and offered coverage.
     Okay. Yes." (Read: the cover-change email.)
   - L495-547: the notification pool; see point 18.
   - Owner stays "Donald to ask Ben", though the transcript settles it in the room with no ask-Ben
     follow-up stated.
7. **OQ-66 Contract identifiers and finding Contracts among thousands.** Answer: "Let's go with your
   Recommendation for now." (A short structured AA code per Contract and a picker filtered by
   procedure and hospital with code search.)
   - L547-553: Greg: "Yep, I agree. It's to be designed. I think that's the challenge, right? We need
     to design a contract." He notes it among "things I need to think about over the weekend"
     (contract design in general, not the coding scheme specifically). The code format is not set.
8. **OQ-67 Who a Contract belongs to, and who pays.** Answer: "I don't fully understand the question
   but for now, the billable party is always defined by the contract. And there can be as many as
   needed to fit what AA needs."
   - L557-565: Greg: "I'd like to defer that to Monday. This is where you think you've got the
     model right and I think I just haven't got it." (L559; it follows straight on from an aside
     about his wife, so whether "that" means OQ-67 is ambiguous.) Donald: "I don't really desperately understand what
     it's saying."
   - L575-579, Greg (tentative): "whether the assumption that we should create a default contract is
     actually fucking us up." Today staff pick "RVG" as one of the contract types, meaning "just use
     the standard pricing". Without a default contract per hospital ("not strictly hospital"), "the
     billable party is always the hospital that holds the contract and there is no contract with
     individuals at which point you're using the RVG."
   - L581, Donald: "I wonder if you could still go away and think about this. When you're ready, we
     can chat about it again."
   - **Disagreement, unsettled.** Greg's idea (no default contract; billable party the contract
     holder; RVG where there is no contract) sits against the board answer, against Donald's default
     contract with a name and email field for the payer (L93, point 4), against prepayments always
     being billed to a person (OQ-73, point 14), and against the per-Booking override in the
     catalogue (2026-09-29 #24). The fall-through order and guardian details are not discussed. See
     point 41.
9. **OQ-68 Contract split basis.** Answer: "You pick what's best. We can edit after."
   - L587, Donald corrects the framing: a contract "may just all be a single line item so it needs to
     basically be able to split in any which way and what the line items say is something we will
     need to figure out." Then reads Greg's preference, a typed $ or % ("You could also type in $48,
     or you could type in a percentage"). The summary that follows is marked wholly unclear by the
     transcript's reconciler (possibly "typed value, dollar or percentage, set on the booking,
     defaulting to 100%"), so it is not evidence of a decision. "This is just an implementation
     detail... You pick what's best."
   - Whether values must total 100% and whether full or split is a per-Contract default are not
     said aloud.
10. **OQ-69 Update email: prompt after saving, or an on-demand button.** Answer: "On-demand button
    with remembered changes (Donald). But not since last email. It might be nice if there was a
    history of changes that you can pick one or many, which make up the summary of changes in the
    email."
    - L595: why it exists: events in the system update a Booking so it falls out of sync with other
      parties' systems; today staff email corrections by hand. The button is on the admin screen for
      any Booking, used ad hoc.
    - L597-609 (tentative): Greg asks for template emails, "a user configurable template somewhere,
      and there's a list of them", each associated with a kind of change (change of anaesthetist, an
      error, a cancellation). Donald: "Could do... that could be the case." See point 31.
11. **OQ-70 Prepayment when a prepaid Booking moves to another anaesthetist.** Answer: "The new
    anaesthetist keeps the agreed amount and wears or benefits from the difference. This is true.
    The draft payable pair is updated to the new anaesthetist."
    - L613: Donald: the OQ-21 reading (credit and re-prepay) is "ages ago... kind of out of date".
      Greg confirms the second reading: "Yes" (L619).
    - L621-627: "repointed" is wrong; only one half of the pair is updated to the new anaesthetist
      (L621; which half is not named, presumably the payable, the anaesthetist's side). Greg: "we'll have to amend the payable pair because the trust account in Xero
      always has to balance because it's always got payable pairs in it", which "raises a question
      about when in the life cycle we should create" it (not answered).
    - L629, Donald: confirming with Ben that the agreed amount stands and the anaesthetist who does
      it is paid: "I mean, that's assumed." Owner stays "Donald to ask Ben".
12. **OQ-71 Recovering a negative invoice with no later payment.** Answer: "Handled outside of the
    system."
    - L635-665: Greg: "you handle that outside the system... It would be an extreme edge case.
      Basically, they just settle that up with the anaesthetist." The anaesthetist "never gets fully
      paid because he's always got this tail of unpaid accounts", and "I pretty much guarantee they'd
      write that off. But anyway, don't worry about that."
    - L645-647: a cancelled prepayment is not the case: the money is still in trust and the
      anaesthetist has not been paid. The case is a refund after the month's last payment run with
      no later work (Donald's example, L651-655).
    - This replaces the recommendation (carry forward and invoice the anaesthetist): nothing is
      built for it.
13. **OQ-72 Additional invoice details still open.** Answer: "1. Desc is description. 2. Yes. 3. The
    additional invoice function needs a credit note option. So any party can receive the credit.
    Then new additional invoices are created."
    - Part 1 (L669-677): description, not discount. Greg: "That shouldn't be in there."
    - Part 2 (L677-691): "they can pick anyone they want for these additional invoices." Greg first
      says life is easier with "no", then accepts: "this lets them mend it." L693: "they'll all be
      recorded as events in the events area for that procedure."
    - Part 3 (L705-751): in the case described, after the invoice is sent (before invoicing was not
      discussed) ("It's always the insurance company will
      ring up and say, Can you split those out, please?"); "she basically should be crediting that
      invoice and rebilling it" (Greg, L711). Donald: one event, the credit to party A, then the split
      events invoiced to whoever (L713). Greg: it must come to the same amount, "it should
      automatically include a reversal" (L715). Donald: any party could receive the credit note, "be
      it the original" (L745).
    - A credit note is not a refund (point 33); copying the original's lines into a draft (point
      32). Donald (L705): the practical tooling is "somewhat of a question for Vanessa".
14. **OQ-73 Prepayment invoice when the patient is not the billable party.** Answer: "That's right,
    it's any person paying for the patient, never an organisation."
    - L755-763: Donald: an insurer or hospital is an institution "that's going to have a harder time
      running away from their bills." Greg: "prepayments are always patient-direct... there's no
      hospital involved in this process"; "So it's never an insurer or hospital?" Donald reads the
      recommendation: "Yes. That's right." Greg: "It's an interesting question that we haven't
      talked about."
15. **OQ-74 Patient balance warning: what the threshold counts from, and credit balances.** Answer:
    "Count from the invoice date; show a credit balance as a mild warning."
    - L769: Donald restates the rule: an amount owing younger than 90 days still gets a warning,
      "not a massive notification"; above it, "basically the difference between a yellow and a red
      warning." "That's kind of what we already, I thought, established." Greg does not comment.
      Owner stays "Donald to ask Ben".
16. **OQ-75 RVG time rule: check against the NZSA RVG 2021 text.** Answer: "Time is always rounded
    up, and is always using the RVG tiered rules."
    - L773-781: Donald reads the rule: "For the first two hours it's one unit per 15 minutes; from the
      third hour it's one unit for every 10 minutes." Greg on part intervals: "It's always rounded
      up" (L779).
    - The comparison with the RVG 2021 text itself was not done in the meeting; the answer confirms
      the catalogue rule (US-05.2.2).
17. **OQ-76 Outstanding questions for prepaid procedures (new).** Created on the board, Open, owner
    "Donald to ask Ben"; the body is Donald's notes (point 19). It comes from L229-241 (point 21).
    L781-783: Donald: "Is it all or nothing? We're asking Ben." Greg: "I still think all or nothing
    is unhelpful, but I can explain it to him."

## Donald's notes

18. **Shared notification pool in the AA Admin portal (new feature).** "AA Admin portal needs a
    shared notification pool." (Typed; also in OQ-65's answer.)
    - L495-503, Greg: "In our dashboard, have we got the concept of an alert log where you might get
      notices that don't require action?" Donald: there is a to-do list (FT-13.7). Greg: "this is
      more like a notification. It's a notification list", because "every morning there might be
      several of these" List moves and "it might be useful for Vanessa to know that those lists have
      moved." "You could just drop it into a sort of an alerts table that flicks up on the
      dashboard."
    - L505-513, Donald: "Probably be best if we call it notifications... AA admin portal. And this
      would be a shared notification pool, not individual." Greg: "If you're logged on the screen,
      you can see it." Donald: "So this is a new feature that we will have to add in."
    - L541-547: Greg: "They could just scroll, I think, but how do they expire? Just let them
      scroll." Donald: "there'd be, action notifications and unactioned ones, that sort of thing."
    - So: separate from the to-do list of warnings that need action; one pool shared by all admin
      users; the first source is an anaesthetist moving their own List (OQ-65). Not settled: what
      else posts to it, expiry or retention, and what "actioned" means for a notice that needs no
      action. See point 43.
19. **Prepaid procedures: Donald's notes (OQ-76 body).** "Is it all or nothing? Greg thinks that
    sometimes a prepaid procedure might be less than the full estimated cost. EG, 20% Does this
    happen? Then what if an estimate is ... 10k which assumes some time / mods. But when the real
    procedure happens, the time and mods are bigger. Another invoice?"

## Other points from the transcript

20. **The prepaid set and the office's approval step.** L211-215, Donald: "by default, the
    anaesthetist profile defines if a procedure will be prepaid", which the anaesthetist "doesn't at
    this stage really see, I believe." When an anaesthetist with that procedure marked prepaid is
    assigned, the admin team sees it and has "a step to approve the generation of an invoice to go
    out right away." Greg: "Yes, all good." This restates OQ-58's answer.
21. **Prepayment is an estimate; anaesthetist discretion.** L211-241. Greg opens: "Why don't you use
    the same openness for anaesthetist discretion on fixed plus prepayments?"
    - L217-219: Donald: a discretionary case (Greg's earlier example, the doctor's wife) "probably
      isn't using a fixed fee procedure. It would be using an RVG." Greg: "That would be possible."
    - L223-227: Greg: if the procedure "takes a lot longer and the anaesthetist decides to bill more".
      Donald: "if it's fixed, they can't bill more." Greg: "It's a prepayment, it's our estimate."
    - L229: Donald: earlier requirements allowed part of a procedure to be prepaid (a percentage,
      the rest washed up at the final), "But Vanessa made it sound like it doesn't happen, pretty
      explicitly, she said, no, it's all or nothing" (2026-10-01 note, point 50). Greg: "it's
      probably worth waiting. There's a bigger conversation just to clarify prepayment" (L231).
    - L235-241: Greg: "the procedure might be more than an estimated cost." Donald (L237): "More or
      less than the estimate", and "This is worth clarifying with them both" (Vanessa and Ben); if a
      facelift is estimated at 40 minutes with standard modifiers, that is the prepaid "full
      estimate", "But if it goes longer, what do they do then?" Greg: "Because they don't have a computation. So that's the
      question. I'm not sure if 'all or nothing' captures it." Donald: "We can talk about it in the
      room." This became OQ-76 (points 17 and 19).
22. **Contracts as children of a master code (idea).** L49-53, Greg: "if I was doing the wholesale
    system I'd be calling the contracts a price book", a linking table of procedure, customer and
    price. "You could make those contracts children with master code so that you could link
    backwards": change the master code and route through every contract with it as a parent. Donald:
    "and it could have multiple parents." Greg: "That's all right if we do that. All those thousands,
    it's becoming really too many relationships." Tentative; ties to combination contracts against
    each parent procedure (2026-10-01 note, point 27).
23. **Logical model apart from presentation.** L67-71, Greg: "even though the coders get to make all
    these final decisions about what the data model looks like... we need to be clear about our
    logical data model, because that makes it a hell of a lot easier for the database designers."
    How a thing is presented and where it lives are separate questions, and software that conflates
    them is "so wrong". Restated for slots at L361 ("the logical model versus the implementation
    model") and L417.
24. **Billable party on an event: "same as" tick.** L191, Greg: the event pop-up "needs the same sort
    of thing you get with couriers, which is, you know, delivery address, same as the billing address
    tick, otherwise you fill it out", as the way to set the event's billable party. Donald: "Oh,
    sure." Read as: a "same as" tick (presumably the procedure's billable party), otherwise filled
    out; the default is not stated.
25. **Events as the procedure's history.** L205, Donald: events give every future kind a home, and
    "this could be an easy place to see the history where if something ever got refunded, you would
    see an event that just shows refund." Tentative. Additional invoices and credits are recorded as
    events (L693, point 13).
26. **When anaesthetists submit when post-op work is expected.** L143-155. Greg: "we'd need to have a
    discussion with Ben about this": an anaesthetist expecting post-op events may not submit the
    procedure for billing yet, "but sometimes". Donald: an anaesthetist is likely to submit the List
    as soon as he can "and just wash up any post-ops that happen in the next round." Greg: "They're
    very do it now." The rule in point 4 covers both.
27. **How the forward view is generated.** L297-353, Greg: the run that generates the forward view
    creates, for every anaesthetist, an AM and a PM entry with status free ("That's the default
    setup"), then overlays the anaesthetist's calendar (public holiday, holiday: forms of
    unavailable), then the surgeon's calendar, "or vice versa, depending on your priority of who
    wins." "If the anaesthetist is away... you probably want to put the surgeon's booking in and flag
    it as a conflict." Donald (L299): a generated slot is assumed available, then recurring bookings
    are filled in. The priority order is not settled.
28. **A List can exist without Bookings.** Greg (L313): "we've defined a list as having a booking
    and an anaesthetist, which is true, because it's only a draft list until it's got an
    anaesthetist." L315-319, Donald, correcting him: "when you have a recurring booking with a
    surgeon four months in advance, that list is created against you as an anaesthetist, a surgeon,
    a hospital, a day, and a session. But... not any bookings."
29. **Slot or List with a status.** L321-489.
    - Greg (L321-353, L377): "There's no slot. There's just a list with a different status." An
      anaesthetist "always has an entry in his calendar, two per day", whose status changes over its
      life; this is how AA staff think ("a list isn't something you create... it's there to begin
      with").
    - Donald (L339, L359, L375): keep "slot" so developers can tell the cases apart: "it's a box that
      you could put a list into", one marked free, or "a closed lid because you're on holiday". Lists
      have no status today; a List with a status raises rules such as whether a holiday List can hold
      Bookings.
    - Resolved as logical versus implementation model (L361-417): slots stay out of the UI (point 5).
      Greg (L465-473): "a slot is sort of the same as a list with no children... It's childless. So
      you've basically just got another entity in the hierarchy... Which is fine." Donald: "This is
      in my mental model. I don't know if it has to be the actual practical model."
    - L475-493: Donald will update his model diagram so a slot square sits around the List.
30. **Status values as a user-maintained list.** L441-463. Donald: each status has an internal ID, an
    editable label and colour, and rules; downstream logic reads the ID, not the name. Greg: "We can
    set them up as a user-based list that's much better than an enum"; a new customer may need
    different statuses. Greg: it "will need some implementation thinking."
31. **Template emails per kind of change (tentative).** L597-609, Greg: "shouldn't we have template
    emails and one of them is attached to each of these scenarios?", user-configurable, in a list,
    associated with the change (change of anaesthetist, error, cancellation). Donald: "Could do...
    that could be the case." Not in the board answer to OQ-69.
32. **Credit then a draft copy of the original (nice to have).** L751, Greg: "it would be very nice
    if... the system could bring the detail of the original invoice into the second invoice. So first
    it does a credit note and then it takes the line items and puts them into a draft invoice, which
    is your starting point for the rebuild. It would be very helpful." Donald (L755): "It would be helpful."
33. **A credit note is not a refund.** L719-747. Greg: "It's not a refund option. It's just a credit
    and rebill... One's cash, one's not." A credit note "turns up in Xero as an imbalance and you
    refund it... there's a separate refund process"; "don't worry about the refund, because that
    happens outside the system." Donald had conflated the two.
34. **Working rules.** Where nothing is said, the prototype (Claude) chooses ("Mostly if we say
    nothing, the AI will decide", L81; L255, L263, L271, L363), and the developers decide the real
    implementation. Names can change later (L201). Donald aims to finish the questions and then move
    on to requirements (L763).

## Follow-ups

35. **For Ben:** OQ-61 (invoice every shortfall or only above a threshold); OQ-76 (all or nothing,
    and what happens when the procedure runs over the estimate), with Greg to explain his view; do
    anaesthetists record unbilled pre-op and post-op events today (point 4); do they hold back
    submitting when post-op work is expected (point 26). OQ-65, OQ-70 and OQ-74 keep "Donald to ask
    Ben" as owner though they were settled or assumed in the room.
36. **For AA's accountant:** OQ-60's fixed-charge schedule, and confirmation of Greg's view on parts
    2 and 3 (point 1).
37. **For Greg:** what a contract is (L99-115: "I think maybe we need to have discussion at some
    later point about what is a contract"; "I'll come back to you next time"); OQ-67, to think it
    through and talk again (L581; possibly Monday, L559) (point 8); the contract design, including
    its coding (OQ-66, point 7); his weekend notes on slots and Lists (L261).
38. **For Vanessa and AA's users:** a clear definition of the List status values and which are
    redundant (L445, point 30); the practical credit-and-rebill tooling (L705, point 13).
39. **For Donald:** update the day, slot and List model diagram (L475-493, point 29).

## Unresolved or in tension

40. **Where base units live, and how many default contracts.** Base units in default (RVG)
    contracts (board and transcript agree), but "one or two" per procedure (board) or one base
    contract (L47); a list that "holds RVG codes" (board) or a master list of procedures grouped by
    body part that may reference them (L43); how an RVG change propagates (hand maintenance, or
    parent links, point 22) (point 3).
41. **What a contract is, and who pays.** Greg's possible no-default-contract model against the board
    answer, Donald's default contract with a payer name and email, prepayments billed to a person,
    and the per-Booking override (point 8).
42. **Prepayment: all or nothing, and overruns.** Vanessa: all or nothing (2026-10-01 note, point
    50); Greg: "unhelpful", sometimes partial (e.g. 20%), and a prepayment is an estimate that a
    longer procedure may exceed; Donald: a fixed fee cannot be billed more, and the final may be
    "more or less than the estimate". Whether an overrun raises another invoice, and what an
    under-run does, are open (points 17, 19, 21). Bears on OQ-61.
43. **Notification pool lifecycle.** Scroll or expire, actioned or unactioned, what else posts to it,
    and how it sits beside the to-do list of warnings (point 18).
44. **The name "events".** Agreed for now; Greg is not convinced (point 4).
45. **Unavailability with a List.** Greg and Donald agree the List becomes a Draft List (L277,
    L439); the board adds the anaesthetist's choice (return to the office or hand to a colleague),
    which Donald also said at L439. The open tension is only with the catalogue's conflict flag
    (US-01.5.2) and Greg's generation run, which would flag a conflict when a surgeon's booking
    lands on an unavailable anaesthetist (point 27).
46. **Status values.** The board says "you decide for now"; the transcript adds statuses as a
    user-maintained list with IDs and a definition still owed by the users (point 30).
47. **Also open from this transcript:** when in the lifecycle the payable pair is created and amended
    (point 11); the split summary marked unclear in the transcript (point 9); template emails (point
    31); the RVG 2021 text check itself (point 16); the order in which calendars are painted (point
    27).
