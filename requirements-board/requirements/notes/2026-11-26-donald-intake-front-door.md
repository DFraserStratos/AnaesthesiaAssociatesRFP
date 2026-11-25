# Donald's decisions: Intake as the front door, 2026-11-26

- **Who:** Donald Fraser (Stratos, product owner), designing with Claude how incoming Lists and
  changes reach the schedule through the Admin app's matching screen (Intake). Greg and AA have not
  seen it yet.
- **Covered:** one screen for everything that arrives from the surgeons' rooms and the hospitals; a
  List as the thing that arrives and is decided; showing why a match was proposed; feeds and the
  rooms' mailbox arriving with no import button; how a PDF is read and shown; a re-sent List and the
  Bookings missing from it; placing a new List; Draft Lists from intake; rows waiting for an NHI;
  confirming unchanged Lists together; each source's state; inbound only; a List holding only a stub.
- **Standing:** Donald's decisions, made for the build. Donald chose Idea 1 ("Feed and workbench") of
  the exploration and asked for its recommendation to be recorded. Items they change go to Verify,
  not Agreed.
- **Inputs gathered here:** a review of the catalogue (EP-02, FT-02.1, FT-02.2, FT-02.5, FT-02.6,
  EP-14, US-11.1.4, US-11.1.5, AR-21 and the questions they cite), of every AA transcript that
  mentions lists, PDFs or hospitals, and of the prototype's Intake screen; and the exploration
  `docs/explorations/intake-ideas.html` (commits b4fca40e, 86ee39c6, 27e25401), with its
  recommendation. The wording below is Donald's where quoted and a summary of the design he chose
  otherwise.

Cite a point as `"Notes 2026-11-26 · Donald intake front door #n"`. Points are numbered once across
the whole note.

## Donald's decisions

1. **Intake is the front door for every List and change that arrives.** Rooms' PDF Lists and hospital
   feeds (St George's and Southern Cross, and other hospitals when connected) all arrive in one feed on
   the matching screen, and each arrival is either placed as a new List or merged into a List AA
   already holds. Donald: "it essentially should be acting as a front door to all lists that are sent
   by PDFs, and also all hospital integrations that come through and update said bookings", and "I
   really want a main screen that shows all of the updates kind of on the left ... and then on the
   right hand side ... we're either making a new booking or list because it's the first time any of
   this stuff has been seen, or we're merging it in." Also: "there should be tabs or ways to see
   specific hospital only or PDF or ingestion only feeds." He chose the feed and workbench: "I'm happy
   to go with idea 1." Bears on EP-02, FT-02.1, US-02.1.2 and US-02.1.4.
2. **The thing that arrives, and is decided, is a List.** The feed groups incoming rows by the List
   they belong to: a hospital's file is a heading over the Lists it holds, and a PDF is one List. The
   office applies a whole List's changes at once, with each Booking's change able to be left out, so
   one bad row never holds up the rest. Bears on US-02.1.2 and US-02.1.3.
3. **The screen shows why it proposed a match.** Before anything is applied, the office sees each match
   key and whether it agreed (surgeon, hospital, day and session, and how many patients were found by
   NHI), the List's earlier versions (where it first came from and each later arrival), and the session
   the List sits in. There is no confidence score. Donald: "I want this to seem like a bit more of a
   robust tool that is giving confidence about the things that are coming in and how they have been
   ingested in our systems." Bears on US-02.1.3.
4. **The rooms' List and the hospital's List are versions of the same List.** A List first sent by the
   rooms is placed in an anaesthetist's session; when the hospital's List for the same surgeon,
   hospital, day and session arrives, it is proposed as an update to that List. Donald: "we have a list
   come in from a PDF from the surgeon's room, and then we can accept that as a list that goes into a
   slot for one of our anesthetists, and then some days later we should see an update from a hospital
   for the exact same list, and then in the matching screen we should be able to see that it's a
   proposed update." Bears on US-02.1.3, US-02.2.1 and US-02.5.7.
5. **Feeds arrive on their own: no import button.** Hospital rows reach the matching screen as each
   hospital sends them; nobody imports a file. Donald: "I don't think we are planning to have any sort
   of, in an ideal world, planning to have any sort of like ingest button. So that import hospital
   file, I don't know what it's doing on the screen, but it seems unhelpful", and "Please build the
   prototype as if we have the ability to do all of these different hypothetical integrations." This
   replaces the 18 November answer to OQ-109 ("No auto syncing on the first release"). Applying still
   needs the office: nothing is applied automatically. Bears on OQ-109, US-02.1.1, US-02.1.5, FT-02.1
   and the domain model.
6. **The rooms' PDFs are read from the office's mailbox as they arrive.** The sender is the address the
   email came from. A PDF that reached someone's own inbox can still be added by hand, with its sender.
   A PDF that cannot be made into a List still lands in the feed, with the reason, and is never
   dropped. Bears on US-02.2.1 and US-02.2.4.
7. **The PDF is shown beside the values read from it.** Donald: "There's probably some value in also
   displaying the PDF itself." Each value read shows how sure the reader was; a value it was unsure of
   is marked for the office to check, and shows where it sits on the page. How the PDF is read is the
   development team's choice: "It'll be on the development team to decide exactly how we do it."
   Bears on US-02.2.1.
8. **A re-sent List is merged as an update, and its missing Bookings are offered as removals.** A
   rooms' PDF for a surgeon, hospital, day and session AA already holds a List for is the next version
   of that List: the office sees what changed (times, patients added) and accepts it, and a Booking that
   is on the List but missing from the re-sent PDF is offered as a removal to confirm as a cancellation.
   This is in the first release. Bears on US-02.2.1 and US-02.2.3.
9. **A new List is placed with the anaesthetist the PDF names suggested.** When an arrival is a List AA
   does not hold, the office places it in an anaesthetist's session, with the session of the
   anaesthetist the PDF or hospital List names suggested when it is free; the alternatives are another
   anaesthetist's free session or a Draft List. Bears on US-02.1.2 and US-01.3.3.
10. **A Draft List can be made from Intake.** An arrival with no anaesthetist to place it with can be
    made a Draft List on the matching screen. This settles what OQ-44 left for later. Bears on
    US-01.6.1, US-02.1.2 and OQ-44.
11. **Waiting for an NHI is a filter on the feed, not a tab.** Rows waiting for an NHI show in the same
    feed with a "Needs NHI" filter, still counted once on Intake, with who to chase and how close the
    date is. There is one way to add an NHI. When a later arrival for the List (usually the hospital's)
    carries the NHI, the update shows it, and applying it turns the stub into the Booking. This replaces
    the 25 November choice of "A tab on Intake". Bears on US-11.1.5 and US-02.6.3.
12. **Lists that match exactly are confirmed together.** Lists in an arrival that match what AA holds
    with no differences are shown as such and can be confirmed in one click. They change nothing, and a
    person still confirms them. Bears on US-02.1.2.
13. **The matching screen shows each source's state.** A second view lists each source (each connected
    hospital and the rooms' mailbox) with whether it is receiving, when it last sent something, how many
    messages came today and what they became, and anything that could not be read or was held, with the
    reason. Sources not yet connected are listed as such. Bears on FT-02.1 and US-14.5.1.
14. **Inbound only.** Donald: "We never feed back to other systems, we only ever bring stuff in." The
    sources view says so. Emails the office sends to the rooms or hospitals stay drafts the office
    sends. Bears on US-02.1.5 and EP-14.
15. **A List holding only a stub cannot be completed or authorised.** A List whose only line is a stub
    never reads complete, and it can be neither marked completed nor authorised until the stub is
    resolved or rejected, with the reason shown. A List that also holds Bookings is never held up by its
    stub. Donald asked for the stub guard to be built ("add the stub guard to the rebuild plan"). Bears
    on FT-02.6.

## Other points

16. **The matching screen keeps its two views and drops the rest.** Arrivals and Sources are the two
    views. The prototype's Data quality and Validators tabs leave Intake: no requirement asks for
    either. No requirement change.
17. **AR-21 is out of date.** It still marks the rooms' PDFs as future work and loops back "before the
    List is submitted" where US-02.5.4 accepts changes until the List is authorised. To redraw.
