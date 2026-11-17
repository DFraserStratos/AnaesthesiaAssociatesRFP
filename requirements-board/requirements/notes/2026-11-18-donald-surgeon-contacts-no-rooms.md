# Donald's decision: surgeon contacts on the surgeon, no surgeons' room record, 2026-11-18

- **Who:** Donald Fraser (Stratos, product owner), in a question-and-answer session with Claude while
  working through OQ-127 (PA contacts by room or by surgeon) and OQ-128 (a surgeon at more than one
  room). AA has not seen it yet.
- **Covered:** whether the system keeps a surgeons' room record, where surgeon contacts are held, how
  more than one office contact is entered, the practice name, where a List came from, and which address
  the office's emails about a Booking use.
- **Standing:** Donald's decisions, made for the build. They are not yet confirmed by AA, so the items
  they change go to Verify, not Agreed. Vanessa was to be asked about OQ-127 and OQ-128; point 9 says
  what is still worth checking with her.
- **Inputs gathered here:** Donald's answers to OQ-127 typed on the board, and his replies in the
  session to options Claude put to him. Nothing was recorded or transcribed; the wording below is
  Donald's where quoted and a paraphrase of the option he chose otherwise. A search of the November
  transcripts found no meeting where Ben or Vanessa discussed a surgeon at more than one room: OQ-128's
  only evidence is Ben's specialist list ("Notes 2026-11-03 · Ben specialist list email #8").

Cite a point as `"Notes 2026-11-18 · Donald surgeon contacts no rooms #n"`. Points are numbered once
across the whole note.

## Questions answered

1. **OQ-127 part 1, where a contact belongs: on the surgeon.** Board answer: "I think each surgeon
   should have a personal contact fields and an office contact fields. (Name, Email and phone.)" In the
   session Donald extended it to one or more office contacts (point 7).
2. **OQ-127 part 2, which address the office's emails use.** Board answer: "I don't know at this stage.
   Likely the office contact." Settled in the session as points 10 and 11.
3. **OQ-127 part 3, where the contacts come from.** Board answer: "AA Admins will fill it in."
4. **OQ-127 part 4, a surgeon's own email.** Board answer: "Yes." It is the surgeon's personal contact
   (point 7).
5. **OQ-127 part 5 and OQ-128, a surgeon at more than one room: no longer arises.** With no room
   record (point 6) there is no "which room" to choose. A surgeon who works from two practices holds an
   office contact for each. OQ-128's 4 November answer ("Our system doesn't need to assume a surgeon at
   one room") is superseded: surgeons are not attached to rooms at all.

## Donald's decisions

6. **No surgeons' room record, for now.** Donald: "I think in some ways the room information is, and
   Surgeon's contact information is supplementary to the functions of the app. And before any of this
   existed, the app was still going to work because the lists would come in and we would know where
   they came from, and so we could communicate back in any way if we needed to. The rooms would list
   who the surgeon was, and the surgeon would have a HPI or CPI number." And: "for now we don't have a
   room, and we record this information just against the surgeon's profile." The surgeons' rooms stay
   what they are in the world (the practices that book surgery and send List PDFs); the system just
   holds no master record of them. Bears on FT-13.6, US-13.6.1, US-13.6.2, US-13.4.1, US-13.4.3 and the
   domain model.
7. **Contacts on the surgeon's profile: one personal contact, one or more office contacts.** Each
   contact holds a name, an email and a phone. The form always shows one set of office contact fields;
   a plus button adds another set, and a minus button on an extra set removes it completely. Donald:
   "let's allow more than one office contact on surgeon and have one of those UI paradigms where there
   is always one contact field or group of fields, and you could press a plus button to add a new set
   of fields, and then you could press a minus button on that second set to remove it completely, that
   sort of thing." AA's admins enter the contacts (point 3). Bears on US-13.6.5 and US-13.6.2.
8. **The practice name is plain text on the surgeon.** The surgeon's profile holds the name of the
   practice they work from as text, not a link to a record, so Ben's list loads and the office can see
   which practice a surgeon is at. Chosen from Claude's proposal. Bears on US-13.6.2 and US-13.4.3.
9. **A List keeps where it came from.** Each List records its source, and for a List from a surgeon's
   rooms' PDF, the email address the PDF arrived from. Donald: "And yea lets keep where the list comes
   from." Still worth checking with Vanessa: whether a surgeon at two practices has a PA at each, or one
   PA for both. Bears on FT-02.2 and a new story under it.
10. **The office's emails go back to where the List came from.** A drafted booking update email or a
    request for a missing NHI goes to the address the Booking's List came from. Where the List has none
    (it came from the hospital feed or was made by hand), it goes to the surgeon's first office contact,
    with any others offered for the office to switch to. Chosen from Claude's proposal. Bears on
    US-02.3.3 and US-11.1.5.
11. **Never to every contact.** The system never fills in every office contact at once: a missing NHI
    request carries patient details, and a practice with nothing to do with the patient must not
    receive them. Chosen from Claude's proposal. Bears on US-02.3.3 and US-11.1.5.
