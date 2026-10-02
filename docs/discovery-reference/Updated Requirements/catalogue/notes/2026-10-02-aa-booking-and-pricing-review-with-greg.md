# AA booking and pricing review with Greg, 2026-10-02

- **Who:** Donald Fraser (Stratos) and Greg (RFP author, Peritia), 14:30 to 16:00 NZDT. Ben (AA
  principal) and Vanessa (AA administrator) are referred to but were not there.
- **Covered:** the rest of EP-02 on the Requirements Board (surgeon PDF ingest, manual booking entry
  and update emails, anaesthetist ad hoc booking, change types and audit), a short look at EP-04
  (Contracts, punted to Greg for the weekend), then EP-05 (the RVG code master, default modifiers,
  the modifier and procedure masters, and unit and fee calculation as far as the Contract defined
  rate). It continues from the midday session (`2026-10-02-aa-requirements-review-with-greg.md`).
- **Inputs gathered here:**
  - one reconciled transcript: `../../../Meeting Recordings/AA Meeting with Greg Oct 2 C.md`
    (ends as Donald pauses the session, after US-05.2.6);
  - the board edits Donald made during the session, 14:31 to 15:43 NZDT, from
    `requirements-board/.history` (edits tagged `board`), and OQ-82, created on the board at about
    14:40 with no history entry;
  - Donald's four typed requests (points 2 to 5).

Cite a point as `"Notes 2026-10-02 · AA booking and pricing review with Greg #n"`. Points are
numbered once across the whole note. Donald's typed notes keep his wording (spelling fixed); board
edits quote the new words as they now stand in the file or history; the transcript summaries are
paraphrase, with the transcript as the authority. The transcript carries no timestamps, so positions
are line numbers: "L51-63" is lines 51 to 63 of the transcript. Board times are NZDT from the board
history. Much of the transcript is Donald reading an item aloud; a reading is the item's text, not a
statement by either speaker.

## Questions answered

1. **No question was answered.** One question was created on the board in the session:
   **OQ-82 Do we want to automate the change emails** (affects US-02.3.3): "When the change comes
   from an anaesthetist, do we want to automate the email." It comes from L25-31: reading US-02.3.3,
   Donald: "now that I'm reading this, I wonder if, for an anaesthetist move, it might be an
   automated email." Greg: "I agree with you about that." Donald, creating it: "Do we want to
   automate change emails when the change comes from an anaesthetist? That's a question to AA."
   Then: "we'll leave that to verify for now." Owner "Donald to ask AA"; still Open.

## Donald's notes

2. **Split the ad hoc booking story.** "Please split US-02.4.1 into two stories. With the photo story
   being moved out of MVP." The transcript adds (L31-41): reading US-02.4.1, Donald: "I think this
   explicitly needs to be split into two stories." Greg: "I do too. It'd be a lot easier. I strongly
   think one's going to get done and the other one's not." Greg: "I'd go and be as bold as to shift
   the second story in the future." Donald: "Yeah, totally... let's write it with the photo story."
   Donald, on the FT-02.4 reading: "I'm not sure each of these stories will make it into MVP" (L31).
3. **Retire Copy a Booking.** "US-02.4.3 should be retired and its features removed from the
   prototype." The transcript adds (L41-51): Donald: the copy is in the prototype, it "definitely
   came from the RFP. And I don't really understand its use case... nobody's talked about this."
   Greg: "I think it's redundant because it was probably an early response to the fact that they
   couldn't add a procedure to a booking." Donald: Vanessa's "three-numbers, six-numbers stuff" was
   "them working around the system by creating a whole other booking, which is a single procedure,
   even though, in theory, it should have been a procedure within a booking." Greg: "So I think we
   should remove it from scope." Donald: "It should be retired, and its features removed from the
   prototype."
4. **Flesh out Apply a reschedule.** "Please update US-02.5.2 to list more of the technical specs /
   AC from the transcript." The discussion is points 9 and 28 to 32. Donald, closing it: "I do
   think there's a set of rules that would allow it to happen automatically... I'll ask the AI to
   kind of flesh it out. So that's specifically talking about 2.5.2." (L161)
5. **Integration context for FT-02.5.** "I think all of the stories in FT-02.5 need a little
   fleshing out to include the context of an automated update from an integration." The transcript
   adds: Donald: "When you move a booking, there's a human looking at it. This here is automatically
   applying a reschedule." (L55) Later: "this is because it is an automated integration. We're
   saying automated integrations may be out of scope." (L181) "I think this just continues to
   support the idea that automated changes need to happen after MVP... I'm going to put all of these
   into the future... these are, yeah, all related to automated changes, is my current
   understanding when I read these." (L187) And on concurrent edits: "I'm putting that out of scope
   because this is related to an automated thing." (L225)

## Board edits in the session

Status and lane moves are grouped where they belong together; each text edit is its own point.

6. **US-02.2.1 Read, correct and ingest a surgeon PDF list to Future Work (14:31).** L7: reading
   it, Donald: "we're not at the stage of thinking that will be in scope for MVP, so the finer
   points of this can come later."
7. **Manual booking entry confirmed (14:36 to 14:41).** FT-02.3, US-02.3.1, US-02.3.2 and US-02.3.4
   Proposed to Confirmed. L9-31: the feature and stories were read with no objection; on US-02.3.4
   (templates per kind of change), Donald: "I think that's fine." US-02.3.3 stays Verify ("we'll
   leave that to verify for now", L31).
8. **OQ-82 created (about 14:40).** See point 1.
9. **US-02.5.2 Apply a reschedule, text, status and lane (14:53, 14:55, 15:01).** Added: "In the case
   of a clash / conflict, where the booking can't be moved to the new location automaticlly, the
   list becomes a draft list." Confirmed to Verify, then to Future Work. L51-161; the reasoning is
   points 28 to 32. Donald's spoken version: "So in the case of a clash or conflict where booking
   can't be moved to the new location automatically, the list becomes a draft list." (L123)
10. **US-02.5.4 Changes accepted until the procedure, status, text and lane (14:58, 15:00, 15:01).**
    Proposed to Confirmed. Added: "To be clear, this only locks once the anaesthetist enters the";
    the sentence was left unfinished on the board. Then to Future Work. L161-187; the spoken
    reasoning is point 34.
11. **The other change-type stories to Future Work (15:01 to 15:06).** US-02.5.1 Apply a
    modification, US-02.5.3 Record a cancellation and US-02.5.6 Concurrent edits moved to Future
    Work, with US-02.5.2 and US-02.5.4. US-02.5.1 had been read and confirmed ("Yep. Confirmed.", L51). US-02.5.5 Append-only change history stays in MVP: "I'm just
    going to leave it right as-is for now." (L225) The reasons are point 5.
12. **US-04.1.1 Contract categories, status (15:09).** Proposed to Confirmed, then three seconds
    later to Verify. L231-237: Donald: "This could use a little bit of fleshing out"; Greg: "I'm not
    on board with all of this stuff yet"; Donald: "how about we punt on this for now and move on?
    Do you reckon you've got time on the weekend to mull it over?" (point 38).
13. **US-05.1.1 RVG code master data, text, AC and status (15:15 to 15:20).** Added the first bullet
    "A unique system (human readable) code."; removed the bullet "any positioning loading it already
    absorbs"; the "This is so" sentence now reads "its unique system code, description, site and
    guide base units" (was "... absorbed loadings"); removed "Each of these is marked as AA-sourced,
    so it stays distinguishable from the standard NZSA set." from the description and from the
    AA-added codes AC. Verify to Confirmed. L237-335; points 39 to 43.
14. **US-05.1.4 Absorbed modifiers renamed "Default modifiers", text and status (15:21 to 15:24).**
    The description now reads: "Some RVG base codes already include a modifier. Eg, Spine and neuro
    codes /. procedure will include a prone positioning modifier.. The system records which base
    procedure codes specify default modifiers." The "never charged for a loading its base code
    already includes" clause is gone. Proposed to Confirmed. L335-389; point 45.
15. **US-05.1.5 Modifier code master, text and status (15:24 to 15:25).** The listed codes (PA1 to
    PA5, A1 to A2 and so on) removed; it now reads "Admins load the modifier code set as master
    data, with each code's unit value." Proposed to Confirmed. L391: "It's got a bunch of junk that
    does not need to be in there." Point 46.
16. **US-05.1.6 Procedure master mapped to RVG codes confirmed (15:32).** Verify to Confirmed.
    L445-491; points 48 to 51.
17. **Unit and fee calculation confirmed (15:33 to 15:34).** FT-05.2 and US-05.2.1 Proposed to
    Confirmed. L495-503: FT-05.2, Donald: "We're all in agreement on that"; US-05.2.1: "Confirm."
    Point 52.
18. **US-05.2.3 Conditional positioning modifier retired (15:35).** Proposed to Retired. L517:
    Donald: "'The system adds P1 positioning modifier only when the procedure's base code does not
    already...' This is wrong. I think we just retire this and keep moving. We can come back to it
    if we ever need to." US-03.3.4 still links to it ("non-standard positioning").
19. **US-05.2.5 Fixed fee schedule pricing, text (15:38).** The first paragraph now reads: "When a
    Procedure's Contract is a is a [fixed fee](US-04.2.4), the system uses the fixed fee as the total
    price for the procedure. Not the BTM units." (the doubled "is a" is a typo). Removed: "from the
    matched schedule line instead of RVG units, including any time band or add-on the line
    carries". Status was already Confirmed. L517-533: Donald: "When a procedure's selected contract
    has a fixed fee, the system prices it from the fixed fee and not the RVG." Greg: "As the total
    price for the procedure." Donald: "Not the BTM units... Base, time and modifier units are still
    recorded. Yeah, I think that's right. Cool. Confirmed." (point 54)
20. **US-05.2.6 "Rate x time pricing" renamed "Contract defined rate", text and status (15:42,
    15:43).** Now reads: "When a Contract defines a [Contract arranged rate](US-04.2.2), the system
    prices that [procedure ](US-03.3.6) at the specified rate." Was: "When a Contract permits an
    individually arranged rate, such as a simple hourly rate, the system prices that billing line as
    the rate multiplied by its duration." Proposed to Confirmed. L533-591; point 55.
21. **US-03.3.6 renamed "Other billing lines (including UNIT X RATE)" (15:42).** Was "(including
    rate x time)". Only the title changed. L587-591: Donald: "other billing lines, including rate
    times time..." Greg: "That's got an individually arranged [rate], so that's good." Donald: "Unit
    times rate. We'll come back to that when we get there."

## Other points

22. **Surgeon PDFs straight from the mailbox (idea).** L7, Donald, reading US-02.2.1 ("admins upload
    an emailed PDF"): "honestly, I would actually have the system reading the mailbox directly."
    Not discussed further; the story is Future Work (point 6).
23. **Manual entry covers every other pathway.** L9-17, Greg: "Phone/email, in addition to hospital
    download and surgeon PDF... these four pathways converge at the end and create changes to a
    booking." Donald: FT-02.3 means "when it's any method of receiving an update other than those
    two, staff need to be able to update it." Greg: "Okay, yeah, cool."
24. **Every Booking field is editable by an admin, for now.** L21-25, on US-02.3.1, Greg: "Are we
    implying in that some fields are editable and some are not?" Donald: "No, I don't think that
    implies that. I think everything can be edited until we're told otherwise."
25. **Automated email when an anaesthetist moves their own List.** L25-27: Donald wondered whether
    the cover-change email for an anaesthetist's own move "might be an automated email"; Greg: "I
    agree with you about that. The office probably aren't even [unclear] in here." Recorded as a
    question for AA (OQ-82, point 1), not a decision.
26. **Photo capture expected to lag manual entry.** L31-41 (point 2): Greg expects one of the two
    stories to "get done and the other one's not" and proposed shifting "the second story" to the
    future; Donald: "Yeah, totally." In the room Donald first said "we will leave it as is and move
    on" (L35); the split itself is his typed request.
27. **Copy a Booking was probably a workaround.** L41-51 (point 3): Greg's view, hedged ("probably
    an early response"), is that copying met a need now covered by adding a procedure to a Booking.
28. **This story is the automated path.** L51-63: Donald's example is a surgeon's office moving a
    Booking or List from Monday to Tuesday morning when the assigned anaesthetist is already busy
    then: "I think that definitely would happen. Why would the surgeon's office know that that
    anaesthetist would be free on that day?" Greg: "It sort of generically falls under move a
    booking, doesn't it?" Donald: "When you move a booking, there's a human looking at it. This here
    is automatically applying a reschedule." Greg: a move could also be from a regular List to an
    ad hoc List, "Or someone may have just rung up and asked for a move." (L61)
29. **A clash is accepted, and the List becomes a Draft List.** L99-123. Donald's scenario: a List
    created on Monday and assigned to him for Wednesday; on Tuesday the surgeon's office moves it
    "in its entirety" to the following Wednesday, when he already has a List. "If I was free, the
    system would just move it. But if I'm not free, if there's a conflict or a clash, the system
    should do what?" Greg: "I'd move it back to a draft list." Donald named two options: "A, pause
    the automated change and it just sits in the same matching screen that the admin staff already
    have. Or the change is accepted because it has to be... since we can't match it to the
    anaesthetist, it just becomes a draft list." Greg: "the surgeon's room is not the boss who
    does..." Donald: "I know that. They're the boss that's going to happen... we just have to accept
    that the change is happening, but the anaesthetist assigned may be different." Greg: "Or maybe
    unavailable." Earlier (L109-111), Greg: "Change the date and put the new anaesthetist in";
    Donald: "It moves to a draft list and then what the admin team do with it after that's their
    prerogative." The board text (point 9) records the accept option.
30. **Moving a single Booking needs a List for that surgeon in that session.** L125-151. Greg first:
    "the criteria for an automatic move are same surgeon, same anaesthetist." Donald: "The slot that
    it needs to go into needs to be free." Greg: "seeing a booking move from one surgeon's list to
    the same surgeon's list on another day would not be unusual. It might be a different
    anaesthetist." Greg: "if you're moving the booking, all we need is a list for that surgeon for
    that session... doesn't matter who the anaesthetist is, you're just moving the booking. He's in
    charge." Donald: "Yeah." Earlier (L65), Greg: "The only criteria would be that it must be an
    existing list for the same surgeon." Donald (L143): with a recurring booking, the same surgeon and
    the same anaesthetist, moving the booking "can be automated". What happens when there is no such
    List was not said.
31. **Moving a whole List: Lists apparently do not merge.** L103, L127-135, L153. A whole List moves when the
    assigned anaesthetist's destination Slot is free (L103). Where the same surgeon already has a
    List in the destination session, Donald: "a booking could change from one list to the other
    list. But the list could not self-change because apparently the two lists can't merge." Greg:
    "You would effectively remove all the bookings." Greg (L153): "If you're moving the list, I
    think it goes to draft because there are some ugly combinations there."
32. **Surgeons send snapshots, not changes.** L153-161, Greg: "the surgeons don't send individual
    bookings; they send a copy of the list. It's like snapshots of their list, and we're trying to
    work out the deltas... I think it's too hard. I think we're just like draft." Donald: "No, I do
    think there's a set of rules that would allow it to happen automatically." Greg also asked, "I
    don't know if we're dealing with a real scenario"; Donald: "If you want automated integrations,
    you are." (L137-139)
33. **Why a cancelled Booking stays visible (Donald's reading).** L161, reading US-02.5.3, Donald: it stays on the List
    marked as cancelled "Because I guess that means an anaesthetist can turn up to the hospital and
    they don't have a mismatch where one system might say it's there and another one doesn't. It
    just makes it visible."
34. **Changes lock when the List is submitted.** L161-179, on US-02.5.4. Greg: "So in practice that
    means that the booking can be changed until the time's entered... there's no condition that says
    procedure started." Donald: "Except we know the start time of the procedure." Greg: "No, the
    scheduled start." Donald: "this lock probably only locks once the [unclear: likely 'BTM data']
    is entered. At the moment, on all of these bookings in a list, there is no save state.
    Everything is saved when you do an action, and the list is submitted when it's complete." Greg:
    "Just make it on the submission of the list. The anaesthetist can twiddle anything they like
    until then." Donald: "Yeah. So we..." Greg: "There won't be any automated updates coming
    through." Donald then turned to automated integrations (point 35); the lock point is Greg's
    proposal with Donald's brief assent, against the board's "once the anaesthetist enters the"
    (point 61).
35. **Automated changes come after MVP.** L181-187: Donald: "We're saying automated integrations may
    be out of scope." Greg: "Actually, there could be. The insurance details could change. So there
    are potentially some automatic integration things that you want." Donald: "I think this just
    continues to support the idea that automated changes need to happen after MVP." (point 5)
36. **Invoice reproducibility means keeping the recipe.** L187-225, on US-02.5.5 and US-08.4.4
    ("Who wants this? Who needs this?"). Greg: "when you create an invoice and you send that invoice
    out for collection, what artifacts are you leaving behind that allow you to reference that
    historic invoice...? For instance, that rate may have changed." Greg: "Have you kept a PDF of
    that invoice?" Donald: "I suspect what we would do is keep the recipe of that PDF generation."
    Greg: "That's what I'm saying." Donald: he had read US-08.4.4 as "some mechanism to go back to a
    different point in time and create a new PDF based on that. But really all we need to do...
    Keep something to recreate that recipe." Greg: "So for instance, the address might have changed."
    Donald: "So we don't want to recreate the output... we're on the same page." Along the way Donald
    reached for a word from the RFP (probably "idempotent", L187, L195); Greg offered "Immutable"
    (L189), then described the concept: applying the same change repeatedly does not change the
    object (L201). It does not change the requirement. US-02.5.5 is left
    as-is: "It's weird that it's here, but I believe I understand what it's saying." (L225)
37. **Concurrent edits are out of scope for now.** L225 (point 5): Donald noted the RFP raised the
    question and the story's notes answer it.
38. **Contracts punted to Greg.** L229-237: Greg: "Would you like to leave contracts and go forward?";
    after the EP-04 and US-04.1.1 readings, Greg: "I'm not on board with all of this stuff yet, so
    we're going to have to chunder our way through it." Greg is to mull it over at the weekend.
    Donald suggested punting EP-05 too ("I think we should also punt on"), then went through it
    anyway (L237).
    Greg also wants to revisit the default RVG Contract (L311: "that goes back to default RVG
    contract. I want to revisit that"; Donald: "that's a part of your homework"), and at L445-447
    ("That's the bit I'm thinking about"). This is OQ-78's ground; not settled.
39. **A unique system code for each code.** L243-295. Greg: "the first bullet should say. A unique
    code, a unique AA code." Donald: "I'm going to say system code because it's AA today, but it
    might not be AA tomorrow." Greg: "I want to distinguish it from the underlying RVG code. It's a
    user code. It's what the user would see... it needs to be structured... sort of human readable,
    quasi-structured." Greg: "there's no point having 10,000 codes, right? They need to be able to
    start typing." Greg: "Every line needs a unique identifier... That came from Ben." Greg: "I call
    it a code because an ID is usually a number... It's a code that Ben expects AA to create
    themselves." Greg: "We'll come back to it." The board added it to the RVG code master (point 13).
    Greg placed it there too: Donald: "This is RVG, not contract." Greg: "This is the RVG... This sits
    underneath everything else." (L257-263) But the line Donald described as needing it is a line of
    his procedure list (point 40).
40. **The procedure list.** L265-275, Donald: "we'll have a list of approximately 400, 500
    procedures... only a small handful of those have an actual RVG code from the RVG. But Vanessa
    believes that every one of those procedures can fit into one of those RVG codes." On a brow
    lift, which has no RVG code of its own: "it may match the exact same H2 RVG code and have the
    exact same base units. But this line item itself needs its own AA system code, which is its
    unique identifier."
41. **Parent and child, or a flat list.** L299-309. Greg: "every master code will be a child of the
    RVG code." Donald: "I wasn't seen quite as a child parent thing, just that there was a flat list
    of procedures that have an assigned RVG code... I could be absolutely wrong." Greg: "I think we'll
    find that we come back to a navigation discussion, but we don't have to have it today."
42. **No AA-sourced marker; the guide is a rough reference.** L319-335. On "Each of these is marked
    as AA-sourced", Donald: "the guide is a guide, but if they add another one and they pick the most
    relevant RVG code to use as reference, it doesn't necessarily mean it's wrong... I don't vibe with
    this line as it stands." Greg: "No, it's not quite right." Donald: "I'm going to remove it for
    clarity." Later: "it's more just a rough reference, a very slim starting point."
43. **Free-typed procedure detail stays on the Procedure.** L325-333, Greg: "there are quite a few
    situations at the moment where the anaesthetist just types in the detail of the procedure."
    Donald: "which is where we saw all the garbage data in that list... a lot of that is historical
    due to issues with the current system." Greg: "I don't understand why it needs to be kept,
    frankly." Then: "Be kept on the procedure, but it doesn't need to be kept in the master."
44. **Group codes confirmed, with a reservation.** L335, US-05.1.3, Donald: "Sure, but the site is
    already there. And I don't know if this quite shows what it thinks it's showing, but yes,
    confirmed." It was already Confirmed. (The transcript's group example is "[unclear: possibly
    'colorectal']"; the item says cosmetic.)
45. **Default modifiers, not absorbed modifiers.** L335-389, L483-491. Donald: "The modifiers are never
    included in the base. They are separate things, and this 'absorbing modifiers' is wrong... It
    should actually just be applying the modifier because of that procedure." Greg: "in the RVG
    master... you'd want a column for base and you'd want a column for modifiers." Greg: "They're
    sort of default modifiers, aren't they?" Donald's spoken wording: "For example, neuro
    codes/procedures will indicate the prone-positioning modifier. The system records which
    procedure codes specify default modifiers." (L373, after Greg: "it should say indicate";
    Greg also offered "require" and "Specify additional, specify modifiers"; settled as "Specify
    default modifiers", L385-387.) On the procedure master: "the procedure needs to tell the contract
    underneath it, always include this modifier... when the anaesthetist opens that booking and is
    configuring the details for said procedure, it will automatically be pre-filled in with the one
    that is appropriate. They can untick it if they wanted to." Greg: "That's exactly all it needs
    to do." (L485-491)
46. **The modifier master is AA's own list.** L391, Donald: "we believe that this will be its own
    distinct list that is generated partially from the guide, but partially from extra things that
    are created by AA." Earlier (L241), from Vanessa: the prone position modifier is missing from the
    guide's list, and "There's a whole bunch of other modifiers that they know about that aren't
    listed here."
47. **Australia works the same way; Canada and the UK do not.** L391-439, Greg: Australia shares New
    Zealand's ways of working: "Australia has both because it uses an RVG approach and it has
    private practice... Hybrid, like New Zealand." "Canada does not have private practice... And the
    UK does not have private practice," or very little, outside the health system. "Public hospitals
    don't use the RVG." Market context only.
48. **How the procedure master and Contracts fit together.** L445-449, Donald: the procedure list
    "currently has base units because I'm asking Vanessa to collect it. But in the future, what I
    will do is make a separate list of contracts, which will be pre-populated by default contracts
    based on this, and it's the contract that will hold the base units... you pick a procedure,
    which has a group, a subgroup and an RVG code. But then below that there are all the different
    types of contracts that could exist, and they will always have a default contract which holds
    the base units." He also said he had "led us astray a little bit there earlier because I think
    we answered it differently in a question" (base units live on the default Contract, OQ-62).
    Reading on (L461-465), Donald credited Greg with the line that consistently overridden base
    units mean AA should change its default RVG Contract (Greg: "That's our discussion").
49. **One default Contract with a range, or two.** L449-459: where the RVG gives different base units
    for different kinds of the same procedure, Donald: "AA can decide what they want to do because
    the system would support both. The system could say it's just one appendectomy default contract
    with a range." Greg: "Yes." "Or they could have appendectomy default contract simple,
    appendectomy default contract complex, and each would have an individual value." Greg: "That's
    all good."
50. **A base unit and modifier figure.** L465-469, on US-05.1.6's "giving the Billing/Invoice Engine
    a reliable base unit figure", Greg: "we've just changed that today to base unit and modifier
    figure. Right, because we're going to include modifiers in our master table." Donald: "A separate
    table, but yeah, we just talked about that in literally the story before this."
51. **"Procedure master", and no RVG guide in the system.** L471-479. Donald: "RVG guide is a PDF
    that they put out every X number of years. Our system doesn't have that. Our system only has an
    RVG master list, or I think I might have called it somewhere a procedure master... It's a list of
    procedures that has RVG-code references within it." Greg: "Okay, fine. We're calling it a
    procedure master."
52. **The anaesthetist's own unit value: default or mandated.** L495-503. Donald, reading US-05.2.1: "this
    applies anywhere it's not a fixed fee or an overridden rate." Greg: "So there's no provision for
    any grouping or clustering of that, it's just one to one... it's not only a default, it's
    mandated. So it's not by default because it can't be changed." Donald: "I believe what it's
    describing here is that this applies to default contracts, or contracts that don't automatically
    enforce an overridden rate." The word "mandated" is Greg's; it was not settled.
53. **Time tiers are defined, not hard-coded.** L503-513, on US-05.2.2, Greg: "Are we going to define
    those or are we going to hard code those?" Donald: "I guess probably define them." Greg: "Yeah, I
    would have thought so." Confirmed.
54. **Fixed fee: the whole price.** L517-533 (point 19). Donald on the title: "well, that's the name of
    the user story, maybe? I don't know, we'll find out." The title was not changed.
55. **A Contract defined rate is a unit rate, not an hourly rate.** L533-591. Greg: "It's just such as
    an hourly rate." Donald: "No, it's not an hourly rate, because it's not hourly, it's unit rate...
    It is just a fixed unit rate." Greg: "The anaesthetist has a default rate, and this is an
    alternate rate." Greg: "the system prices that... Procedure using the specified rate." Donald:
    "At the rate multiplied by, no, at the specified rate." On the name, Greg offered "special rate";
    Donald: "something closer to 'contract-defined rate', because alternative rates don't exist on
    anything other than a contract. So you've got an individual rate and a contract-defined rate."
    The agreed sentence (L591): "when a contract defines a contract-arranged rate, the system prices
    that procedure at the specified rate." Donald also noted US-04.2.2 "we've already talked about
    that and we haven't verified it." (L587)
56. **Tooling asides (no requirement change).** The board's add-question button prefilled the open
    card (L31); Donald wants to copy a card's ID and name rather than its link (L161); the previous
    run's stage 3 checkpoint never showed in this harness and was taken as approved (L225).

## Follow-ups

57. **For Greg (weekend):** Contracts (EP-04, US-04.1.1 categories) and the default RVG Contract
    (OQ-78), point 38; the navigation discussion for the code masters, point 41.
58. **For AA:** whether an anaesthetist's own move sends its email automatically (OQ-82).
59. **For the prototype (build plan):** remove Copy a Booking (US-02.4.3, point 3); photo capture
    of a booking card leaves MVP (point 2); the change-type stories other than the change history
    are Future Work (point 11).
60. **For the catalogue, later:** unit x rate in US-03.3.6 and the pricing bases in US-04.2.2 ("We'll
    come back to that when we get there", point 21, point 55); the unique code ("We'll come back to
    it", point 39).

## Unresolved or in tension

61. **US-02.5.4's added sentence is unfinished.** "this only locks once the anaesthetist enters the"
    (point 10). The spoken end of that thought is Greg's "Just make it on the submission of the
    list", which Donald accepted (point 34).
62. **Which list carries the unique system code.** The board put it on the RVG code master
    (US-05.1.1), where Greg also placed it, but the line Donald described is a procedure on his
    procedure list (points 39, 40),
    and Donald and Greg spoke of the "RVG master" and the "procedure master" as one list (point 51)
    while the catalogue keeps an RVG code master (US-05.1.1) and a Procedure master (US-05.1.6).
    Greg's parent and child question is open (point 41).
63. **Default modifiers wording.** The board text keeps "Some RVG base codes already include a
    modifier", against Donald's "The modifiers are never included in the base" (point 45).
64. **Contract defined rate and the agreed contract rate.** US-05.2.6 now prices a Procedure at a
    Contract's specified unit rate in place of the anaesthetist's own (point 55); US-05.2.1's AC and
    US-04.2.2 already have a Contract basis of "RVG units multiplied by an agreed contract rate or
    discount". Whether these are one basis was not discussed. Likewise US-05.2.5 now takes the fixed
    fee as the whole price, while US-04.2.4's fee schedule lines still carry time bands, add-on
    flags and quantity rules.
65. **The automated reschedule rules are not complete.** Settled: a clash means the change is
    accepted and the List becomes a Draft List (point 29); a single Booking can move to the same
    surgeon's List in the destination session, whoever the anaesthetist (point 30). Not settled:
    a single Booking moved where the surgeon has no List in that session; a whole List moved into a
    session where the same surgeon already has a List (point 31); and how a move is recognised from
    the snapshots surgeons send (point 32).
