# AA meeting with Ben and Vanessa, 2026-10-27

- **Who:** Donald Fraser (Stratos), Greg Smith (RFP author, Peritia) and Ben (AA principal). Vanessa
  (AA office administrator) was busy and had asked not to be included (Greg, L129); Ben texted her
  and Greg offered to go and ask her ("She can just jump in", L161-163; that he went is likely but not
  recorded), and she joined partway through (L179) and left before Ben (L371). The setting is not
  stated, though Greg offering to fetch Vanessa suggests Ben, Greg and Vanessa were in one building. Greg had gone through the questions before Donald
  arrived (L13, L391), and Donald worked from the Requirements Board filtered to the questions for
  Ben (L13).
- **Covered:** a short pass through the questions held for Ben and Vanessa: a prepaid price when
  prices change before the procedure (OQ-104) and when the Booking moves to another anaesthetist;
  which booking source should be integrated first, surgeons' room PDFs or the hospital feed (OQ-108),
  with the hospitals integrated today (OQ-109) and what else the hospitals send (OQ-13); modifiers
  (OQ-95); an introduction to AA's accountant; and Ben's wish that the anaesthetists' own app replace
  the emailed lists. No items or questions were edited during the meeting.
- **Inputs gathered here:**
  - one reconciled transcript,
    [AA Meeting with Ben & V 27th Oct Reconciled Transcript](<../artifacts/files/AA Meeting with Ben & V 27th Oct Reconciled Transcript.md>),
    registered as artifact [AR-47](../artifacts/AR-47.md), reconciled from three automatic
    transcriptions of the recording (the raw audio is not in the catalogue). The recording ends
    mid-sentence after Ben leaves (L393).

Cite a point as `"Notes 2026-10-27 · AA meeting with Ben and Vanessa #n"`. Points are numbered once
across the whole note. Speakers' wording is kept in short quotes (spelling fixed, filler dropped);
the summaries around them are paraphrase, with the transcript as the authority. Positions are
transcript line numbers ("L17-19" is lines 17 to 19). The transcript's own reconciliation notes
(L397-405) treat the prepaid quote as an answer to a business-rule question, and the zero-value
positioning modifiers, the first-integration choice, ending emailed lists and billing-practice
reporting as proposals or preferences, not decisions; this note follows that reading.

## Questions answered

1. **A prepaid price stands when prices change before the procedure (OQ-104).** No board answer.
   Donald restated Ben's earlier rule, "if there's a fixed price for a procedure, it's priced on the
   day that the procedure is actually done, not when it was booked", then asked: "what happens if the
   price changes on a prepaid procedure?" His example: a patient pays on Monday, on Tuesday "all the
   anaesthetists and AA resubmit all the new fixed prices they want", and the procedure is on
   Wednesday (L21-23). Ben: "You would honour the money that's been prepaid, because that's the quote
   that the patient's been given." Donald: "That makes the most sense to me, but we just wanted to
   hear it from you." (L25-27) This matches the question's recommendation, which the build already
   assumes: a prepaid Procedure keeps the price that was prepaid and a new Contract version does not
   relink it. Against the question's conditions: the anaesthetist's own price change (1) and a change
   by AA are covered by Donald's example; a third party's price list, such as a surgeon's rooms' (2),
   was not raised separately; on which date governs (3), for a prepaid Procedure it is the prepaid
   quote; whether a surgeon's fixed-price arrangement that is not prepaid differs (4) was not
   discussed. Ben did not comment on Donald's restatement that a non-prepaid fixed price follows the
   procedure date. Vanessa, whom Donald wanted to confirm this (20 October), was not asked. Settled
   for a prepaid Procedure. Bears on US-06.2.2, US-04.2.10, US-04.2.14, FT-06.2, US-06.5.4, US-06.3.5
   and OQ-96.
2. **A prepaid Booking moved to another anaesthetist keeps its prepaid price (OQ-03).** OQ-03 is
   already answered: the new anaesthetist receives the fixed fee the first set, for stability for the
   patient. Donald asked Ben to confirm it: "if a patient prepays for a procedure and then it moves to
   another anaesthetist, generally the accepted process is that the new anaesthetist will just pick
   up whatever that price was, and not sort of force anybody to pay some sort of difference. Is that
   right?" Ben: "Correct." (L17-19) This repeats Donald's 7 October expansion (Notes 2026-10-06 · AA
   directors meeting #10) and fits the prepay holding account (Notes 2026-10-19 · AA meeting with
   Greg #4). Settled. Bears on US-06.5.4 and FT-06.5.
3. **Which integration comes first: Ben leans to surgeons' room PDFs (OQ-108).** No board answer.
   Donald: there have been "mixed ideas about where most of the bookings come from"; "for the very
   first version of this application, what do you feel is the must-have integration?" (L33-35) Ben
   called it "a Vanessa question", but: "My thoughts would have been that the PDFs from the surgeons'
   rooms would be the most reliable... because my understanding is that the hospital integrations
   have been quite unreliable" (L37) and "some of the data is a bit scrambled as it comes through"
   (L45). Donald suspected part of that is Solutions Plus; Ben: "I think that's probably a pretty
   safe bet." (L39-41) Donald: "maybe there's a version of this where we just have to support both"
   (L55). Ben: "With modern PDF ingestion, I think that should still be fairly reliable in the first
   version of the software, right? Because already we will be saving on data entry." (L57) Donald:
   "there will be essentially an ingestion or a matching screen... when a PDF comes in, it could land
   in that location as well, the same sort of way that a hospital system would." (L59) Ben: "not all
   the hospitals are integrated, of course. Like, we don't have integration with the eye hospital, for
   example." (L63) Donald held the question for Vanessa (L53, L65). Not settled: see point 4. Bears on
   EP-02, FT-02.1, FT-02.2, US-02.2.1 and US-14.6.1.
4. **Which integration comes first: Vanessa says the hospital, but the surgeons' room sheets if
   easier (OQ-108).** Donald put the question to Vanessa: "if you could only have one, what would you
   say is the most valuable thing to you guys?", assuming both land in a matching screen (L193-195).
   Vanessa: "Probably from the hospital." (L197) Donald: the hospital "only sends an update the day
   before"; Vanessa: "Yeah, it does." Donald: so if only the hospital were integrated, "you would
   manually still do all the PDFs you receive, and the hospitals would just send the updates the day
   before?" Vanessa: "Yeah, that's the only downfall... It's the day before, whereas the rooms, we get
   lists... we can get them a month in advance." (L199-209) So with a hospital-only build the rooms'
   PDFs stay manual as well as arriving earlier. "But the hospitals have the
   contracts, dates of birth, all of that kind of stuff more"; she agreed the rooms' lists can have
   gaps (L213-217). Donald: it "would be quite painful for you guys to continue to manually import a
   bunch of this stuff. And so we should try and look at maybe supporting both." (L261) Then
   Vanessa: "If it's easier to use surgeons' room sheets, then go that way, because we do get them
   probably a lot more in advance." Greg: "And updated." Vanessa: "And updated." (L269-273) On
   Donald's recap that her preference is the hospital, "but obviously, in an ideal world, you'd have
   both": "Yeah, but if it's easier, then we'll go with surgeons' rooms... I'm happy with anything."
   Ben: "As long as it's easier." (L325-339) So Ben leans to the PDFs, Vanessa to the hospital with a
   readiness to take the PDFs, and both leave it to what is easier; Donald leans to supporting both.
   On whether most bookings start at the rooms, the question's first part, Vanessa's "a month in
   advance" for the rooms against the hospital's day before supports Greg's account (Notes
   2026-10-19 · AA meeting with Greg #19), but nobody said it in those words. Not settled; the
   question's current working rule (20 October: the hospital download stays the priority) is
   neither confirmed nor overturned. Bears on EP-02, FT-02.1, FT-02.2, US-02.1.1, US-02.2.1 and
   US-14.6.1.
5. **Two hospitals are integrated today, one of them Forte (OQ-109).** Ben: "the hospital
   integrations, we've only got two hospitals, haven't we?" Vanessa: "Yeah." Ben: "we've only got
   Forte and [unclear], so the other ones would be coming as a PDF anyway, wouldn't they?" (L221-225)
   The second name is not recoverable and has not been guessed (L402). This supports the question's
   29 September reading, that AA's current system already receives bookings from two hospitals, but
   the catalogue names those two as St George's and Southern Cross while Ben names Forte (OQ-13 also
   mentions "the Forte material"): whether St George's and Southern Cross are the two, or Forte is
   one of them, is not resolved. A hint only: straight after, answering Greg on what integrated
   hospitals also send, Vanessa said "for St George's it's a month in advance" (L233), which may mean
   St George's is one of the two, with Forte (or "Tracy", point 6) the other. Whether the first release syncs them automatically (part 2) was not
   discussed. Not settled. Bears on US-02.1.5, FT-02.1, FT-14.6, US-14.6.1 and EP-14.
6. **Besides the feed, hospitals send schedule updates by free-text email (OQ-13).** Greg recalled
   Vanessa saying that, even with an integration, the hospital sends "another form to supplement what's
   not on the integration data" (L227). Vanessa: "if there's an update, then they're always sending
   us an updated schedule. So Tracy sends it two weeks, or for St George's it's a month in advance.
   So we know that we always have our anaesthetists in the right slots" (L233). ("Tracy" is kept as
   heard; whether it is a person or a misheard hospital is not known, L403.) It arrives "in an email
   form": "it's going out from us on a report, but it's coming back in an email form from them"; "It's
   just them writing back as an email" (Greg had asked whether there is a PDF or only body text, L249; "no PDF" is
   this note's reading of her answer), and it is "Free text" (L243-259). Vanessa also
   confirmed the integration itself sends only the day before (L199-201) and that the hospital data
   holds the contracts and dates of birth more fully than the rooms' lists (L213). The format and
   fields of each hospital's download, the question itself, were not discussed. Not settled. Bears on
   US-02.1.1, US-02.1.5, FT-02.1 and US-14.6.1.
7. **Age is easy; modifiers already in a code's units must not be added (OQ-95).** No board answer.
   Donald recalled the evening call he joined (the 6 October directors meeting), where the system was
   to pre-assume no modifiers except age, with some positioning modifiers accepted, and asked whether
   AA now wants none, "even age" (L75-77). Ben: "I think age modifier, that's an easy coding thing,
   right? That's an easy one. The position one, the point was... the modifiers are not allowed to be
   added." (L79) The anaesthetists who added them did so "Mainly mistakenly. They just didn't realise
   that... within the RVG, the reason why there were so many units assigned was because it had
   already taken into account the positioning." (L83) On showing those positioning modifiers
   pre-selected at zero "so that there could be no confusion" (Donald, L85-87), Ben: "that might be
   a nice way to do it. I'm pretty neutral about that. But yeah, I think that is a neat solution to
   that problem about people adding modifiers that shouldn't be added." (L89) Donald's summary:
   "outside of... age and some of those position modifiers that are pre-applied with a zero value,
   everything else just has to be applied by the anaesthetist." (L103) This answers the question's
   part 2 in Donald's summary (nothing else pre-fills; Ben did not name the ASA grade), keeps age as
   applied, and favours the zero-value display without Ben insisting on it. Part 1, the age bands and
   stacking, was not discussed. Partly settled. Bears on US-05.1.4, US-05.1.5, US-03.3.4 and
   US-03.3.8.

## Other points

### Modifiers and billing data

8. **Stacked modifiers are a policy matter, not a system rule.** Ben: "my major concern about
   modifiers is that people apply too many modifiers to an account and they start to stack up."
   Donald: "it's a bit more of a policy teaching problem than it is an application problem, right?"
   Ben: "Yeah. And sometimes what I do is that if it's a prepaid patient or a self-funding patient, I
   don't apply any modifiers." "I guess there's always the option to take them away, right?" Donald:
   "Yes." (L93-103) No limit on modifiers was proposed. No change. Bears on US-03.3.4 and US-05.1.5.
9. **AA would like data on billing practice, for contract negotiation.** Donald asked whether AA
   would want to review or collect data such as how many modifiers anaesthetists use (L105). Ben: "it
   would be interesting for us to have the opportunity to collect data in terms of the billing
   practices, because when we come to negotiating contracts, then we come from a more informed
   position because we know what's actually happening out there." (L107) Today AA "can actually see
   how many units people are charging", but not a breakdown (L111-115). Donald: "something I should
   maybe record as an idea for the future, or at least make sure that we have some sort of hooks to
   enable some sort of reporting." (L117) An idea for later, not an agreed requirement. Not settled.
   Bears on FT-05.1, EP-12 and FT-12.2.

### Booking intake and the anaesthetist's list

10. **A surgeon's rooms on Elixir would welcome an integration.** Ben spoke that morning to a surgeon
    who "uses Elixir for her rooms"; she said an integration with the hospitals, "and maybe possibly
    even Elixir", "would be amazing", because "often, last minute, they might take a patient out, put
    another patient in, or change the order of the list... if something changed in Elixir, it would
    seamlessly update all of the other systems." (L49-51) Donald: "I can understand why that would be
    valuable. On an infinite timescale, all of this stuff is possible." (L53) A wish, not a
    requirement. Not settled. Bears on FT-02.2, FT-14.6 and EP-14.
11. **Surgeons' sheets would give earlier sight of a List.** Ben: "if we're getting the list from the
    surgeons, it would get uploaded into the system earlier and then the anaesthetist has better
    visibility earlier." (L343) He looks "as they come in, so it's about a week out", to look up the
    patients' background, perhaps to see a complicated case face to face before admission, or on a
    cosmetic list to decide "this is one that I want to get them to prepay" for a self-funding breast
    augmentation (L349-351). Vanessa: today "different people [are] entering different anaesthetists'
    lists", one far ahead of another, "And if we use the surgeons' sheets, then they're just going to
    automatically go in there." (L353) Donald: with PDF import ("there's a lot of styles... to
    support, but let's assume we solve all that"), anything arriving early is "created and matched
    automatically", but "every single day somebody, or multiple somebodies, will have the job of
    sitting down and manually doing the hospital part until we automate that", which is at least
    predictable: "just confirming details or updating details that should already exist within the
    system." (L355-357) "Okay, something to think about." (L359) Not settled. Bears on FT-02.2,
    FT-02.1, US-02.1.1 and US-06.2.1.
12. **Ben's vision: the app, not emailed lists, is the anaesthetist's source of truth.** Vanessa
    emails Lists to the anaesthetists "Constantly... Especially the eyes" (L281-287). Ben: "if we have
    the software, everything we need appears in that... You open up the app or the web app and you
    go, 'Oh, there's my list with all of the things. There's all the patient details, their email
    addresses and stuff.' So that becomes the source of truth rather than the emailed lists, because
    that kind of gets confusing as well", with several versions of one surgeon's list in his email
    (L289-291). He floated telling everyone: "We're not emailing you lists anymore. If you want to know
    what's on your list, you just open up your software." (L293) To contact a patient the anaesthetist
    needs "an email address, a phone number, the operation and the NHI" (L307). Why today's app is not
    used for this: Vanessa, "Because it's not foolproof"; Ben, "it's not very user-friendly" (L297-299);
    its data is "mostly complete. But often Vanessa's waiting for last-minute things from the
    hospitals" (L303); the patient view is only on his phone, so copying an email address from a PDF
    is easier (L311); and the web app "doesn't give me the patients... It gives me my schedule and the
    banking" (L315-319). A vision, not a decision; Vanessa did not respond to ending the emailed lists.
    Not settled. Bears on EP-01, EP-03 and FT-02.2.

### Follow-ups

13. **An introduction to AA's accountant, Michael Hooker.** Donald asked who AA's accountant is. Ben:
    "His name is Michael Hooker. Greg's got his details." (L131-135) (The surname is from two of the
    three transcriptions, L401.) Donald: "We've got a couple of questions for him, so even just a
    remote Teams call would be good", but "not right now... probably better to give him a bit of a
    heads-up"; "if you could just send an email, give me a little e-introduction". Ben: "Yeah, like an
    e-introduction. Okay, yeah." (L137-147) Ben is to send the introduction. None of the accountant's
    questions was put. Bears on OQ-47, OQ-60, OQ-112, OQ-29 and OQ-12.
14. **Vanessa is to send Donald sample surgeons' room PDFs.** Donald: "I did sign an NDA to get access
    to those PDFs. So when you feel like you're caught up on things, I'd love it if you could send
    those to me so I can kind of get a shape of what they might look like for us." Vanessa: "All
    right." (L263-265) Bears on FT-02.2, US-02.2.1 and OQ-108.

### Not answered

15. **Left for later.** Donald kept it light: "maybe we keep it light like this for now, and we can
    come back around when Vanessa's back. There's a handful of questions here for her." (L119) Greg:
    Vanessa is "happy to join a meeting later in the week" (L155). After Ben left, Donald: "There were
    fewer questions for them than I remembered... There's a couple more detailed ones for Vanessa, but
    we didn't desperately need it." (L389) Not discussed: OQ-95's age bands and stacking, OQ-109's
    automatic sync in the first release, OQ-13's formats and fields, and OQ-47's weekly payment cycle.
    Asked about any concerns, Ben said "No, no." (L149-151)
