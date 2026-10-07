# AA requirements review with Greg, 2026-10-02

- **Who:** Donald Fraser (Stratos) and Greg (RFP author, Peritia), 12:00 to 14:00 NZDT. Ben (AA
  principal) and Vanessa (AA administrator) are referred to but were not there.
- **Covered:** a walk through the Requirements Board item by item, confirming or editing as they
  went: EP-13 (the Admin App: dashboard, ledger balance, billing flow monitoring, master data and
  cutover, roles and audit, surgeons and blacklists, warnings, the shared notification pool), then
  EP-01 (canvas, Slot status, List assignment, reassignment and moves, calendars and conflicts,
  Draft Lists), then the start of EP-02 (booking intake, hospital import and matching). Along the
  way: the login experience, and moving a single Booking as well as a whole List. It continues
  from the morning's meeting (`2026-10-02-aa-meeting-with-greg.md`).
- **Inputs gathered here:**
  - one reconciled transcript: `../artifacts/files/AA Meeting with Greg Oct 2 B.md`
    (ends mid-sentence at the US-02.1.5 discussion);
  - the board edits Donald made during the session, 12:17 to 14:00 NZDT, from
    `requirements-board/.history` (edits tagged `board`). The morning run's change log already
    lists the 12:17 to 12:59 edits as "(board, Donald)"; they are recorded here as this session's
    evidence;
  - Donald's two typed requirements (points 2 and 3).

Cite a point as `"Notes 2026-10-02 · AA requirements review with Greg #n"`. Points are numbered once
across the whole note. Donald's typed notes keep his wording (spelling fixed); board edits quote
the new words as they now stand in the file; the transcript summaries are paraphrase, with the
transcript as the authority. The transcript carries no timestamps, so positions are line numbers:
"L27-33" is lines 27 to 33 of the transcript. Board times are NZDT from the board history. Much of
the transcript is Donald reading an item aloud; a reading is the item's text, not a statement by
either speaker.

## Questions answered

No question was answered on the board in this session. One open question is settled in the room,
in part:

1. **OQ-81 Which calendar wins when Lists are generated.** Still Open on the board, owner "Donald to
   ask Greg"; no board answer. Parts 1 and 2 settled in the room:
   - Part 1, the order (L661-665, L751-753), Donald: when the day rolls over the system creates the blank
     slots, then "applies the anaesthetist availability first... you would create the anaesthetist
     block out first, and then the next process after that would apply all of the surgeon's
     recurring bookings." Greg: "Yes." (L663, and L751-753 when Donald restates the
     order)
   - Part 2, a recurring booking on an unavailable Slot (L665, L751-761). Donald first: it "becomes
     a draft list or a notification to the admin team" (L665). Then, on US-01.5.2: "I think the
     system should automatically create that list as a draft rather than assigning it to an
     anaesthetist for someone else to come and grab." Greg: "So do I. Yeah... And it should blank
     it." This reverses OQ-81's recommendation (create and flag as a conflict) and Greg's morning
     view (morning note point 27). The board NOTE on US-01.5.2 says the same (point 28).
   - Part 3 (short-notice sickness marked by the anaesthetist) was not discussed.
   - OQ-43 (one blacklist or two) and OQ-79 (notification pool lifecycle) get evidence but are not
     settled: points 44 and 48.

## Donald's notes

2. **Login experience to be defined (new requirement).** "The login experience should be defined.
   We talk about this a little in the transcript." The transcript adds:
   - L181-191: Greg: "what's the experience going to be when the anaesthetist brings up the app on
     the phone?" Donald: "I don't know... This doesn't describe that at all... I'll make a note." It
     came up right after US-13.5.1 (role-based access), as Donald moved to the audit trail.
   - L193-203, biometrics: Donald: "Native app definitely can use face ID. PWA: unclear... Standard
     PWA, no... the safest assumption is that that biometric sort of stuff is probably not
     accessible." Android devices may have face or fingerprint unlock, "all of it comes under some
     sort of biometric access."
   - L205-213: Greg: check "what we can do and what the experience will be." Donald: "first we
     need to define this type of deployable platform we're going to be supporting, and then from
     there we can discuss any sort of experience."
   - L215-221: Donald: "our assumption is that there's going to be a PWA for the anaesthetists at
     the beginning. So it will need to be some sort of account login." Greg: "Yes." Donald:
     "Stratos' default would be using Auth0 for accounts... it handles MFA, passwords... higher
     tiers of Auth0 that enable single sign on with like a Google account or something else... we
     need to define what a login experience may look like."
   - Nothing was decided beyond an account login for the PWA. Today the catalogue holds login only
     in FT-13.5's Technical discussion (IDaaS Auth0 or Entra, MFA for admins, self-service reset,
     login attempts logged, Google and Apple social login on mobile), with no story.
3. **Anaesthetists move a List or a single Booking (new requirement).** "Anaesthetist can move lists
   OR booking in the system. Right now, I don't believe the prototype features moving bookings,
   just lists." The transcript adds:
   - L375-387, while reading US-13.8.2: Greg: "The anaesthetist needs to be able to move up
     booking... Both. They need to be able to move at the list level or at the booking level,
     because there may be one thing that they're gonna do or not do, or they may be moving a
     list... Choose to move a list, a whole, a full list, or a single booking."
   - L379, Greg: when a full List is moved, "You're left with your slot, right? So we need to give
     that slot a default status." Not answered.
   - L389-393, Donald: moving a List is well defined, because the system knows who has an empty
     Slot; "I don't quite picture... what the experience would look like to move a booking... It
     couldn't show you all of the lists. You'd kind of want it to just have a search box to search
     by an anaesthetist."
   - L395-433, a target on leave: Greg's example is a colleague on leave who agrees to do one case
     and so does not show in the available list. Agreed: the receiving anaesthetist changes their
     own status to available first ("I think we have to force the anaesthetist to change their
     status to available again"; Greg: "I think so"), because "if they move themselves, then that's
     their declaration that they accept responsibility to do the work." The office should not
     assign a List to someone marked unavailable without them knowing (Greg: "I don't think she
     should do that").
   - L437-441, Greg: "As long as it can move a booking as well as a whole list." Donald: "Yep, and
     we've recorded that as something that's needed." No catalogue item yet covers a user moving a
     single Booking: US-01.4.3 moves Lists only, and US-01.4.6 is a rule about who did the
     procedure, not a move flow.

## Board edits in the session

Status moves are grouped by feature; each text edit is its own point.

4. **Dashboard confirmed (12:17 to 12:18).** FT-13.1 and US-13.1.1 Proposed to Confirmed. L7-31:
   Donald: "this feature is confirmed. We definitely want this." Greg asked whether it should say the
   dashboard scrolls or has a calendar; Donald: no need, "the prototype already presents that"
   (L13-15).
5. **US-13.2.2 Per-patient balance, text (12:24).** Added: "This is attached to the patient, even if
   it's a guardian who is going to pay." L67-85, Greg: "the balances are always shown as
   attributable to the patient, doesn't care about the billable party. It's a patient-centric
   view." Greg adds (L79) that the same holds for an insurance claim; the new wording names only a
   guardian.
6. **FT-13.3 Billing flow monitoring confirmed (12:25).** L91-93: monitoring in the Admin App rather
   than a separate billing engine console; Greg: "Fine."
7. **US-13.3.1 Processing monitor, text and status (12:27).** Added: "This list will get quite
   large, and the prototype's current styling of this needs to be updated. With that update, we
   would expect standard sorting and filtering features." Proposed to Confirmed. L95-121: the view
   is grouped by anaesthetist, not ordered by it. Greg first wanted "a filter that says just show me
   the problems", then accepted that this view is where authorised Lists are approved ("That's
   absolutely fine"); he then asked for a filter "so that you could choose all or one" (L117).
   Neither specific filter is in the new words.
8. **US-13.3.2 Manual intervention confirmed (12:28).** L121: resolve and retry, shown in the
   prototype. Donald: "A little less implementation detail than I would have expected."
9. **US-13.4.2 Clean-cut start confirmed (12:30).** L133-139, Greg: "Absolutely agree with that."
10. **US-13.4.3 Reference data from controlled spreadsheets, text (12:35).** The bullet now reads
    "fixed fee schedules and any Contracts (Could be RVG, fixed or other style)". L159-165: Greg:
    "contract specific overrides... I think that's not very clear language... just contract
    details"; Donald: "This just needs to be just contracts"; Greg: "it doesn't need to say fixed
    fee schedules because contract isn't necessarily a fixed fee." The bullet still names fixed fee
    schedules (point 77). Greg's calendars ask (point 40) is not added. Status stays Proposed.
11. **US-13.5.1 Role-based access confirmed (12:36).** L173-177, Greg: "Yep, agreed. And there'll be
    a very small number of roles."
12. **US-13.5.2 Audit trail, text and status (12:39).** "disbursements" removed from the audited
    list, which now reads creates, updates, reassignments, authorisations, invoices, payments.
    Proposed to Confirmed. L223-241, Greg: "you've got invoices and credit notes, but not
    disbursements or payment... Or receipts when you think about it. It's done in Xero." The list
    keeps "payments" and does not name credit notes (point 78). Donald: the depth of audit is for a
    developer discussion (L243).
13. **Surgeons and rooms confirmed (12:40 to 12:41).** FT-13.6, US-13.6.1 and US-13.6.2 Proposed to
    Confirmed. L247-279; structure of the rooms record is point 43.
14. **Warning routine and to-do list confirmed (12:44 to 12:45).** US-13.7.1 and US-13.7.2 Verify to
    Confirmed. L281-317. The morning run held both at Verify (point 72).
15. **US-13.7.3 Warning flag on a Booking, text (12:47).** "like Excel's, in both the anaesthetist's
    app and the Admin App. Tapping the triangle shows the warning text." removed; added "(Much like
    the prototype does today. See Fitzgerald, Emma on on July 21st PM)". L319-327, Donald: "I don't
    actually want the implementation detail of the Excel warning. Much like the prototype does
    today." The transcript renders the example as "Ferguson and Emma" (speech recognition).
16. **US-13.7.3 Warning flag on a Booking, text and status (12:48 to 12:49).** "When the anaesthetist
    submits a Booking that carries a warning, a short confirm step shows before it goes through."
    replaced by "When the anaesthetist opens a Booking that carries a warning, it is visually clear
    to the user." Verify to Confirmed. L329-341: Greg: "Do we want to get in their way?"; Donald: "we
    don't need to get in the way of the submitting"; Greg: "we don't need a pop up saying, do you
    know what you're doing?... Vanessa will see it. So if they can see the warning and they ignore
    it, there's a second check... they'd see that the night before because they always check." The
    ACs and Notes still describe the confirm step (point 73).
17. **FT-13.8 Shared notification pool confirmed (12:50).** Verify to Confirmed. L351-355, Greg:
    "Yeah, really good."
18. **US-13.8.1 See the team's notifications, text and status (12:50).** Line "Paginate" appended
    after the "This is so..." paragraph; Verify to Confirmed. L357-371: Greg: "how big is this list
    going to be?... it's a roller"; Donald: "It'll paginate"; Greg: "It's only going to have to hold
    while it sees... The rest of it's just a log file... We may put some archive rules around that
    later, kill it off after a week or something." The line is a working note (point 74).
19. **EP-01, text (12:59).** "belongs to exactly one surgeon and one hospital" now reads "exactly one
    surgeon, one anaesthetist and one hospital". L459-483: Donald: "One anaesthetist, one surgeon,
    and one hospital was missing." Greg: "That is a definition of when you can create a list... It
    has to have those three things." Donald: "It can't be assigned until it has all those things...
    It could be drafted." Donald still reckons "potentially a draft could miss some of those
    things, but that's something we can figure out in the future" (L483). Then (L483) the epic's
    settled logical model is read and accepted.
20. **FT-01.1, text (13:02).** Added: "Four months in the current practice, but the system should be
    flexible enough to have any number of months." L485-511: Greg: "make that X months ahead
    because they extended at Christmas"; four months "was defined by Vanessa. That's their normal
    practice. But over Christmas they stretch it." Donald: "the system shouldn't care how many
    months it is... four months ahead for now", with possible performance limits at, say, 36 months.
    Greg: "changing that is a real pig's job": shortening drops future days, extending heals. Donald:
    a setting changed rarely, "we don't have to worry about it for now." Status stays Proposed.
21. **Canvas stories confirmed (13:03 to 13:06).** US-01.1.2, US-01.1.3 and US-01.1.4 Proposed to
    Confirmed (US-01.1.1 was already Confirmed). L515-529: Donald reads two Slots per day ("I moved
    the other one in front of it") and says "Confirmed", then reads the horizon story; Greg asks
    about a new anaesthetist and US-01.1.3 already covers it ("Easy"); slot default times in point
    51.
22. **Slot availability status confirmed (13:08 to 13:14).** FT-01.2, US-01.2.2 and US-01.2.1 Verify
    to Confirmed. L531-679; the slot-holds-status discussion is point 53, the enum story point 55.
    The morning run held both stories at Verify (point 72).
23. **List assignment (13:23 to 13:29).** FT-01.3 Verify to Confirmed; US-01.3.2 Proposed to Verify
    (L683-687, Donald: "this is new since earlier this morning... They won't mark this as confirmed
    yet. I'll mark it as verify. But we agree with this language here"; Greg: "It's an empty list");
    US-01.3.3 Proposed to Confirmed (L687-701, with a note requested, point 58); US-01.3.5 Proposed to
    Confirmed (L717: "Confirmed").
24. **Reassignment and moves confirmed (13:30 to 13:31).** FT-01.4, US-01.4.1, US-01.4.2 Proposed to
    Confirmed; US-01.4.3 Verify to Confirmed. L717-719: Donald: "We agree that this is something
    that the system needs to do"; US-01.4.2 "already basically covered in an earlier story"; on
    US-01.4.3: "The colleague does not need to accept. The office does not confirm... This is a high
    trust system." US-01.4.3 still says "Ben is still to confirm" (point 72).
25. **US-01.4.5 Blacklist warning on an anaesthetist's own move, to Verify (13:32).** Proposed to
    Verify. L721-723, Donald: "I'm going to leave this as proposed or verify because... I still think
    I want to hear from Ben directly about sensitivity of knowing these blacklists." Greg: "Fine.
    Good question."
26. **US-01.4.6, text (13:33).** "(before the procedure)" inserted after "moved to that
    anaesthetist's List". L725-731: Greg: "Before the procedure." Donald: "let's put that in... An
    anaesthetist never does a procedure on another anaesthetist list"; "self-evident, but it's fine
    that it's spoken out." Status stays Verify; its open question for Greg (OQ-80) was left for later.
27. **Hospital holiday calendar confirmed (13:34).** FT-01.5 and US-01.5.1 Proposed to Confirmed.
    L731-737: "Already in the prototype."
28. **US-01.5.2 Conflict flagging, text (13:38).** Appended: "**NOTE** We now think this is wrong,
    and the new recurring list becomes a draft for admin staff to resolve." L751-761 (point 1).
    Donald: "I'm going to leave it as verified." The body, ACs and Notes still describe the flag
    (point 75).
29. **US-01.6.1 Create a Draft List confirmed (13:45).** Verify to Confirmed. L803-825: Donald: "Yep,
    I accept all of those" (the ACs). Greg: in practice the hospital, surgeon and day are required.
    On "enters the matching process", Greg: "What does that mean?"; Donald: "I actually don't know",
    then guesses it means the office's own matching today (L809-813).
30. **US-01.6.2 Draft Lists flagged, AC (13:48).** Added "**Sorting.** Draft lists are sorted in
    ascending date order." L835-839: Greg: "The list should be sorted by date"; Donald: "it should be
    sorted by day... I don't think it says anything about sorting, but we can add it." "Ascending" is
    the board's word. Donald also found the "one day dashboard" mention redundant (L829-833).
31. **US-01.6.3 Assign a Draft List, text and status (13:49, 13:52).** "by choosing the anaesthetist
    and the AM or PM Slot it falls in" now reads "by choosing the anaesthetist (the AM or PM Slot is
    predefined on the draft list)". Verify to Confirmed. L841-853: Greg: "you just choose the
    anaesthetist because... everything else is already there"; Donald: "The AM/PM slot is predefined
    on the draft list"; Greg: "it's just language."
32. **US-01.6.4 Remove or re-date an unfilled Draft List confirmed (13:53).** Verify to Confirmed.
    L905-911: Donald reads it; Greg: "Yep... That happens all the time." Donald's "Yep, verify"
    (L905) closes US-01.6.3, just before this story is read.
33. **EP-02, text (13:54).** "applied to the schedule" now reads "applied to the list/booking".
    L915-929: Greg: "Shouldn't that say it's applied to the booking?... It's either applied to the
    booking or the list, however you want to view it." Donald: "If it's a new booking, that goes to
    the list, but if it's an update of an existing one, it edits the booking."
34. **US-02.1.1, text (13:56, 13:57).** "Admins import a downloaded hospital booking file into the
    system." now reads "The system / Admins import hospital bookings into the system." L929-957:
    Greg: "download" holds only for HL7 version 2, "not for version four, because version four is a
    REST architecture"; "take out a downloader, just import." Donald: "Get rid of files... just
    bookings, hospital bookings"; the integration team will establish what each hospital provides,
    "We just know that it's going to come in"; "honestly, the system imports them, but... Let's keep
    moving."
35. **US-02.1.2 Match rows, text (13:57).** The option "create a new List in an anaesthetist's Slot,
    or a Draft List when nobody is assigned yet" split into "create a new List in an anaesthetist's
    Slot" and "[Draft List](US-01.6.1) when nobody is assigned yet". L957-965: Donald, reading "For
    each row imported from a hospital download": "let's just leave it as it is." Greg: "I do not understand why this is a manual task. Because it's obvious
    which one it needs to be." Donald: "I don't think we should assume we understand at this stage
    how confident we can be about automatically matching anything"; the first release keeps an
    import gate like today's, as Ben said AA can get value without integrations first. Greg: "Okay."
36. **US-02.1.3 Show differences on match confirmed (14:00).** Proposed to Confirmed. L965-981:
    Greg: "I would love you for that." An update to an already matched Booking still goes through a
    manual approval showing the differences; a row with no match is accepted as a new record.
    Donald: automating after the first match "wouldn't take too much... let's leave this in here for
    now." US-02.1.4 (unmatched queue) is read and accepted at L981-983 with no board change.

## Other points

37. **US-13.1.2 Pre-op review of tomorrow.** L35-57: neither could see why it says "tomorrow"; it
    reads as the scrollable day view. Donald asks for it to become "a bit more of a general
    requirement about being able to review all of the days in the future up until slots are
    created." He says "13.1.3"; only US-13.1.1 and US-13.1.2 exist, so US-13.1.2 is meant.
38. **Ledger balance per anaesthetist.** L57-63: Greg: the office should be able to tell the ledger
    is out of balance for one anaesthetist ("Yes, you should"). Donald: in US-13.2.1, "the they and
    them is unclear" (what AA is owed versus what the anaesthetist is owed); an AC for what the
    screen looks like will come with the prototype. Greg: "It's just a list."
39. **Master data, not reference tables.** L123-131: Greg is "quite happy for them to sort out
    what's master data"; on US-13.4.1's list, "I wouldn't call those reference tables. Some of those
    are definitely master data." Donald: the story already treats them as master data, referred to
    rather than copied. Already in the prototype; "Confirmed" (L133).
40. **Calendars loaded from spreadsheets too.** L143-171, Greg: should schedule and calendar data
    come from the spreadsheets? "if you need to do it again into a test system or whatever, you've
    got to do it again. So I'd much rather do it in a spreadsheet." Donald: if AA can supply it
    cleanly, "we will import it." Greg (L171): "do we want to make a note that there will also be
    calendar schedules?" Donald's next words (L175), "Why can't I select this right now?... No, I
    don't think we need to worry about that", may answer it or the board; unclear.
41. **US-13.5.1 is permissions, not sign-in.** L223: Donald: "Cool, that's permissions"; the login
    experience is point 2.
42. **Audit depth and cost.** L241-245: Donald: there are "different levels of what this could look
    like and that will need to be discussed in some sort of developer context." Greg: "I don't want
    to be buying a TB of month to keep it."
43. **Surgeons' rooms record.** L251-259, Greg: the room holds the office contact details ("a short
    contact list") and, as children, its surgeons; "Or it could have a more generic relationship in
    that you've got an actor that has a role of either admin or surgeon." Donald: "Whichever the
    relationship may look like." "Vanessa will supply this" (L253) is FT-13.6's text read aloud, not a new
    statement.
44. **Blacklist: design for two lists (OQ-43).** L265-279: Donald: the one-or-two question is
    deferred to someone (name unclear). Greg: "from a design point of view, we should allow the list
    to be have that double view. And the surgeon may say, I don't want to work with that
    anaesthetist." Whether one side learns of the other's entry: Greg: "Implementation detail";
    Donald: "we'll defer it." Greg: "We'll call it two lists... It's more flexible." Donald still
    wants Ben's view on how sensitive blacklist knowledge is (point 25).
45. **Warnings are not notifications.** L291-309: Greg asked whether warnings include the
    notifications concept. Donald: "Notifications is different to a warning"; the pool is FT-13.8.
    Greg: warnings "flag the thing you're on. Yeah, they don't come up."
46. **Clearing a warning from the to-do list.** L311-317, Greg: "Will it clear it from the base
    element as well?" (the Booking). Donald: "I don't know." Greg: "Don't worry about it." Donald, to
    Greg, calls the to-do list concept "really important" (L283).
47. **Warning thresholds as a constant.** L343-349: US-13.7.4 (settings page) is future work. Greg:
    "you'll set it up as a constant worry about it later."
48. **Notification pool size (OQ-79).** L357-371 (point 18): paginated; it need only hold what has
    not been seen, the rest "is just a log file"; archive rules may come later ("kill it off after a
    week or something"). Bears on OQ-79 part 2 (expiry); not settled.
49. **What puts a List into a Slot.** L449-457: Greg wanted EP-01 to say the List is put into the
    Slot when the first Booking is made. Donald: "recurring bookings is... a list without bookings."
    Greg: "Okay, fine, I agree." (The "already being implied" at L463 is about the surgeon,
    anaesthetist and hospital, point 19.)
50. **Single Booking as a favour.** L539-561, Greg: an anaesthetist on leave sets a Slot to
    available and a colleague pushes one Booking to him; the system creates a List on the fly with
    that one Booking, but "he doesn't want anybody else jumping in and adding bookings into it", and
    no status says "I've got a booking, but I'm still not available." Donald: admins add Bookings to
    Lists and Lists already take notes; "once people are living with it, they will work around the
    problem and if the problem becomes big enough, you build for it." Not built now.
51. **Slot default times keep the standard shape.** L523-529, Greg: a Slot's real time is the first
    procedure's start to the last one's end. Donald: shortening the List visually might suggest no
    more Bookings fit; "respecting the standard sort of shape is probably best for everyone
    involved." Greg: "I agree. Even if there's just one booking in it."
52. **Prototype List colours.** L577-583: the prototype's List colours (private, public, "pre-op
    assessment") are "made-up stuff"; to worry about later.
53. **The Slot holds status; a List has none.** L561-593, L601, L665-679. Donald: "The slot has
    status, but the list doesn't." Greg: "a slot holds the status... once a list is there, it has
    priority in terms of what status is." On US-01.2.3, Donald disliked the sentence that a status
    such as on leave "stays meaningful" when the Slot holds a List; Greg: "The status might not be
    displayed, but the status is determined. The list takes precedence in setting the status of the
    slot." Donald: "the concept of a status disappears and you don't even see the slot anymore. You
    just see the list... I think what this is saying is true." No change made.
54. **Calendars: who owns recurring arrangements.** L607-659, Greg: hospitals (closure days),
    surgeons and anaesthetists may each have calendars; is a recurring agreement anaesthetist owned
    or surgeon owned, and how is a surgeon's holiday six months out flagged? Donald: the surgeon and
    the anaesthetist each keep their own one-off and recurring blockouts ("like creating a series in
    Outlook"), "and the shared view is the list. That's where they come together." The anaesthetist
    sees recurring Bookings in their Lists, not a surgeon calendar. A surgeon's office may ask AA for
    a surgeon's recurring bookings in one place (L617); Greg: "maybe they're just views of the same
    data element"; Donald: "Implementation detail." Greg: it matters whether both ends can edit it or
    one is read only (L623). The generation order that follows is point 1.
55. **Status master data endorsed.** L593-599: on US-01.2.2 (user-maintained statuses, rules read
    the ID), Greg recalls an ERP whose enum statuses "caused horrendous problems" and needed a rewrite.
56. **Several kinds of unavailable, same effect.** L739-749, on US-01.5.3, Greg: "there are several
    versions of unavailable, all of which have the same effect... unavailable... public hospital...
    annual leave... But it's for information." Donald: the prototype shows this, and asks what to
    mark the vacated Slot as when a List is reassigned; Greg: "That's cool. Because I asked that
    question this morning."
57. **Reviews still to come.** L763-769, Donald: after Greg, "we're going to have to do the same
    thing at least with Vanessa, maybe some subset of it with some anaesthetists themselves", with
    mock-ups by then. Greg: "My role here is to prepare the ground."
58. **US-01.3.3 Manual List assignment: note requested.** L687-701, Donald: "let's put a note down
    here. We may delete this once we find another story that covers it, but state that new lists can
    be created by finding an anaesthetist on a day... day, slot, anaesthetist. But we also need to
    support making a list as a draft, not attached to an anaesthetist, which can later be assigned."
    Greg: creating from the availability view is "Not how they work at the moment, but they could"
    (today they "look in the black book"); "if you do it now it's done."
59. **US-01.5.4 Availability conflict dashboard: rewrite requested.** L771-779, Donald: as written,
    conflicting Lists stay with the original anaesthetist with an alert; "You and I have just
    proposed that actually it's just forcibly pushed back to a draft so it's definitely resolved."
    Greg: it "Becomes its own to do list"; "if it's scrollable, it could stay on the site for quite
    some time." Donald: "we're going to not mark 1.5.4 as confirmed, and I want you to take the
    context of everything we've been talking about and rewrite it."
60. **US-01.5.5 agreed.** L779-781: marking a Slot unavailable while it holds a List asks to return
    it to the office (a Draft List) or assign it to an available colleague. Donald: "Do you concur?"
    Greg: "I do." Already Confirmed.
61. **FT-01.6 Draft Lists: rewrite requested.** L785-789, Greg: "There's some redundancy in that
    second bullet. It just needs to say moves the list to the office." Donald: "please write feature
    1.6... to be a little bit more coherent, specifically with the bullet points two and three."
62. **Anaesthetists pulling Draft Lists themselves (question for Ben).** L789-799: Draft Lists are
    never offered to anaesthetists; Greg: "it's an office job." Donald: substitute-teacher apps let
    people grab bookings; Greg: a partner built the same for GPs, "very successful." Donald: "raise a
    question to ask Ben about whether or not anaesthetists would want to peruse draft lists and pull
    them in themselves."
63. **US-01.6.1: wording.** L805: Donald: "we can go ahead and delete this piece of text because
    that requirement describes that an anaesthetist can... So admin staff can create it themselves."
    The text he meant is unclear; the current description names only AA staff as creators.
64. **Surgeon's regulars (declined for now).** L855-899, Greg: when assigning a Draft List, show the
    surgeon's regular anaesthetists first ("a white list... you can derive one"), from "the
    intersection of recurring appointments." Donald: "You don't know if it'll be a huge benefit. We
    may spend some thousands of dollars making it"; a strong foundation first, features like this
    later. Greg: "We accept that." Not added.
65. **US-02.1.5 Automatic sync: rewrite requested.** L985-993: Donald had described buttons,
    schedules and refresh on open, "a bit overkill." Greg: "Let's leave it out... there's probably a
    better way they're doing it now." Donald: "update 2.1.5 to remove all of the faff... and just
    update the story to state that St George and Southern Cross are in scope and the particulars of
    their technical implementation are yet to come." The open question stays.

## Follow-ups

66. **For Ben:** how sensitive blacklist knowledge is for anaesthetists (US-01.4.5, OQ-43; points 25,
    44); would anaesthetists want to browse and pull Draft Lists (new question, point 62). US-01.4.3
    still says "Ben is still to confirm" (OQ-65).
67. **For Vanessa and AA's users:** the same walk-through of the stories, with mock-ups (point 57);
    surgeons' rooms data (point 43); calendar and schedule data in spreadsheet form (point 40).
68. **For Stratos (Donald):** define the deployable platforms (PWA first, native later?) and then the
    login experience, including biometrics, MFA, single sign-on and identity provider (point 2);
    the experience for moving a single Booking, including the search by anaesthetist and the
    vacated Slot's default status (point 3); the depth of audit, with storage cost in mind (point 42).
69. **For the catalogue (spoken requests in the room):** generalise US-13.1.2 (point 37); add the
    note to US-01.3.3 (point 58); rewrite US-01.5.4 (point 59) and FT-01.6 bullets 2 and 3 (point 61);
    trim US-02.1.5 to scope only (point 65); add the per-patient note (done, point 5); tidy the
    disbursements line (done in part, point 12).
70. **Later, with the prototype:** an AC for the ledger balance screen (point 38); the processing
    monitor's filters (point 7).
71. **For Greg:** OQ-80 on US-01.4.6 was left for later (point 26).

## Unresolved or in tension

72. **Board confirmations ahead of the morning run's holds.** The stakeholder confirmed items the
    morning run (2026-10-02 change log) held at Verify; the board version stands, for the owner to
    check:
    - US-01.4.3 Confirmed while its text still says "Ben is still to confirm" (point 24).
    - US-01.2.1 and US-01.2.2 Confirmed while the final status values are still to be defined with
      Vanessa and AA's users ("Owner decision for now", OQ-64 part 4) (point 22).
    - US-13.7.1 Confirmed while several warnings have kind or strength "not yet set"; US-13.7.2
      Confirmed while clearing semantics are unanswered (points 14, 46).
    - FT-13.8 and US-13.8.1 Confirmed while OQ-79 is open (points 17, 18, 48).
73. **US-13.7.3: description against ACs and Notes.** The description now says the warning "is
    visually clear" when the anaesthetist opens the Booking; the AC "Confirm step" and the Notes
    ("The confirm step on submit was Donald's suggestion") still describe a confirm step on submit,
    which the room rejected (point 16). The AC "Flag" still says the triangle shows "in either app"
    and tapping it shows the text, both removed from the description at 12:47 (point 15); whether
    dropping them was meant is unclear. Also: "on on" typo; the example name "Fitzgerald, Emma"
    against the transcript's "Ferguson and Emma" (check the prototype seed); no blank line before
    "This is so...".
74. **US-13.8.1: stray "Paginate".** A one-word working note in the body between the description and
    the ACs. Meaning from L357-371: the pool paginates and need only hold what has not been seen, with
    archive rules maybe later (point 48). Its proper wording, and whether it bears on OQ-79's expiry,
    are open. The story's text also says "staff scroll back through it"; paginate and scroll are not
    reconciled.
75. **US-01.5.2: NOTE against the body.** The appended NOTE (a recurring List landing on an
    unavailable Slot becomes a Draft List) contradicts the story's own body, ACs and Notes (soft
    warning, the Booking stays, the List changes colour), OQ-81's recommendation, and Greg's morning
    view (morning note point 27). Greg's "it should blank it" (blank the anaesthetist) is not
    captured. Interacts with US-01.5.4 (point 59) and US-01.3.2 (point 1).
76. **Moving a single Booking is not in the catalogue.** Donald said "we've recorded that as
    something that's needed" (L441), but no item covers it, nor the vacated Slot's default status
    (point 3). FT-13.8, US-13.8.2, US-01.4.3, FT-01.4 and US-01.4.5 all say "List" only.
77. **US-13.4.3 wording.** Greg said to drop "fixed fee schedules" ("contract isn't necessarily a
    fixed fee"); the board kept it beside "any Contracts". The Notes still say fixed fee schedules
    loaded this way is "our inference" and list "contract overrides" (point 10).
78. **US-13.5.2 audited list.** Greg: invoices and credit notes, not disbursements, payments or
    receipts ("It's done in Xero"). The board removed only "disbursements": "payments" stays and
    credit notes are not named. Confirmed with this open (point 12).
79. **Slash forms in final text.** US-02.1.1 "The system / Admins import..." (Donald: "honestly, the
    system imports them") and EP-02 "applied to the list/booking" read as placeholders (points 33,
    34). US-02.1.1's title, sources and Notes ("File format(s)", OQ-13) still speak of a download or
    file.
80. **US-02.1.2 bullet split.** The bullet was split; Donald's "let's just leave it as it is" (L957)
    comes right after "hospital download" in the text he was reading, so it likely refers to that
    wording, not the bullet. The new bullet "[Draft List] when nobody is assigned yet" has no verb. Greg's challenge to manual
    matching is not recorded (point 35).
81. **Spoken status against board status.** US-01.6.3: Donald said "Yep, verify" (L905) and the
    board moved it to Confirmed at 13:52; "verify" may mean "verified" (point 32). US-01.3.3: Confirmed although Donald asked for a note and said the
    story may be deleted (points 23, 58). US-02.1.3: confirmed at 14:00 as the recording ends
    (point 36).
82. **Horizon length.** FT-01.1 now says "any number of months", while other items (EP-01,
    US-01.1.1, US-01.1.3) state four months as fixed. Why it is four months is in doubt: Greg says
    Vanessa's normal practice, stretched at Christmas; Donald heard that Christmas is the reason for
    four months (L489-491) (point 20).
83. **Draft List attributes.** EP-01 and US-01.6.1 require surgeon, hospital, day and session; Donald
    still thinks a draft might lack some of them, "something we can figure out in the future" (point
    19); Greg says in practice they are required (L817-823).
84. **Login undefined.** Only an account login for the PWA is assumed; platform, biometrics, MFA,
    single sign-on and identity provider are open, and no item or question covers the sign-in
    experience (point 2).
85. **Also open from this transcript:** the per-patient balance names a guardian but not an insurer
    (point 5); the processing monitor's specific filters (point 7); calendars in the cutover
    spreadsheets (point 40); one blacklist or two (point 44); a single-Booking favour List (point
    50); whether recurring arrangements are edited from both ends (point 54); US-01.2.3's "stays
    meaningful" wording, accepted but disliked (point 53); OQ-81 part 3, sickness (point 1); the
    unclear name in the blacklist discussion and the transcript ending mid-sentence.

## Additional points

86. **Master data "Confirmed" with no board change.** L133, Donald, after reading US-13.4.1 and
    noting the prototype already has it: "Cool. Confirmed. Moving on." US-13.4.1 is Confirmed;
    FT-13.4 is still Proposed on the board. Which of the two "Confirmed" refers to is unclear
    (point 39).
87. **US-13.6.3 Blacklist accepted in the room.** L263, after Donald read the blacklist story,
    Greg: "Yeah, good." Its status is still Proposed on the board (design for two lists is point
    44).
88. **FT-13.7 Warnings and the to-do list accepted in the room.** L283-289: Donald read the feature
    and US-13.7.1; Greg: "Yep." The stories moved to Confirmed (point 14); FT-13.7 is still Verify.
89. **FT-02.1 Hospital booking download read with no objection.** L929: Donald read the feature
    and went on to the stories; Greg's issue (L931) is with the import story, not the feature
    (point 34). FT-02.1 is still Verify.
90. **US-13.8.2's open question left unanswered.** L447, Donald: "what was that question here? I'm
    not going to read it again. We said we haven't answered it, so we'll come back to it." This
    follows the List-move notification discussion (L373-443); US-13.8.2 links OQ-65.
91. **"Most" in US-01.3.2 doubted.** L683, Donald, reading the title "recurring bookings drive most
    assignments": "Not sure about the most, but we'll go on." The title is unchanged.
92. **One anaesthetist per Slot per day.** L461, Greg, as Donald read that a List belongs to
    exactly one surgeon and one hospital: "One anaesthetist for a day for a slot." Donald: "One
    anaesthetist, one surgeon, and one hospital was missing" (L463); Greg: a List needs those three
    to be created (L465).
93. **Draft List shows who is available.** L849, Donald: "when you click on a list, you would
    actually see everybody who's potentially available in the same way anaesthetists can see other
    available anaesthetists." Greg: "Absolutely. Great." (L851).
94. **"Draft" in the prototype's List labels unclear.** L565, Donald: the prototype's Lists show no
    status "other than like it says draft but I don't think this prototype knows what it means
    draft... compared to what we think it means" (point 53).
95. **Surgeon's regulars, extending point 64.** L869-879: after Donald's "let's not", Greg: "It's
    too hard... The admins will know." When Donald suggested the system always pick the regular,
    Greg: "It doesn't have to auto-pick, it just might put them first, so the admin can see them."
    Still not added (point 64).
