# AA meeting with Greg, 2026-10-16

- **Who:** Donald Fraser (Stratos) and Greg Smith (RFP author, Peritia), on a Teams call of 1h 56m,
  about 14:07 to 16:03 NZDT (estimated from the board edit times below). Ben (AA principal), Nick
  (AA director) and Vanessa (AA office administrator) are referred to but were not there. Greg
  reports a short talk with Ben and Vanessa "yesterday" about the life of a booking (L66, L130). The
  earlier session Donald says he will bring together with this one (L1546) is the meeting of
  2026-10-14 ([AR-37](../artifacts/AR-37.md)).
- **Covered:** Greg walks through his v6 executive summary and technical design: wording changes,
  booking updates from surgeons' rooms and hospitals, the insurance approval number, Contract
  maintenance, versioning and schedule uploads, and prepayment against price changes. Then a
  read-through on the Requirements Board of EP-12 (anaesthetist profile and reporting) and EP-03
  (FT-03.1 to FT-03.7), with Donald editing statuses live and asking Claude to update many items from
  the transcript.
- **Inputs gathered here:**
  - one reconciled transcript,
    [AA Meeting with Greg Oct 16th Reconciled Transcript](<../artifacts/files/AA Meeting with Greg Oct 16th Reconciled Transcript.md>),
    registered as artifact [AR-38](../artifacts/AR-38.md);
  - the board edits Donald made during the session, 14:39 to 16:00 NZDT, from
    `requirements-board/.history` (edits tagged `board`).

Cite a point as `"Notes 2026-10-16 · AA meeting with Greg #n"`. Points are numbered once across the
whole note. Speakers' wording is kept in short quotes (spelling fixed, filler dropped); the
summaries around them are paraphrase, with the transcript as the authority. Positions are transcript
line numbers ("L593-617" is lines 593 to 617); the transcript also carries timestamps. Where a point
names the v6 documents, "exec v6" is the executive summary ([AR-28](../artifacts/AR-28.md)) and
"tech v6" the technical design ([AR-29](../artifacts/AR-29.md)), with their page. Board times are
NZDT from the board history. Much of the transcript is Donald reading an item aloud; a reading is
the item's text, not a statement by either speaker. Donald often says "Claude, update X" during the
read-through: each is an explicit request to change that item, and the point says so.

## Questions answered

1. **Insurance approval number held on the Booking (OQ-93, partly).** OQ-93 is Open. Greg, after
   talking with Ben and Vanessa: "there's a big difference between being insured and having your
   insurance claim approved" (L78). Bookings are often made weeks or months ahead, the surgeons'
   rooms settle the insurance because the surgeon has to be paid too, and "they don't usually put the
   booking on the list until the insurance is settled" (L82-86). So most data that comes through
   carries "the really important missing piece of information, which is the approval number" (L90). Greg:
   "I've added the approval number to the booking data so that there's a place to put it." (L94) Most
   of the time the office knows the hospital, surgeon, insurer and approval number (L98). "If a
   booking comes through and says it's insured and there's no booking reference, then the process is
   going to be Vanessa rings the surgeons' rooms" (L114); Donald agreed. Settled: the Booking holds
   the approval number. Still open: whether a separate insurance indication is stored, and whether it
   narrows the Contract list or only drives the review warning. Bears on US-03.6.1 (point 57) and
   FT-11.4.
2. **Hospital data: one theatre list, the day before (OQ-13, partly).** OQ-13 is Open. Greg: "Each
   day the hospital will provide an updated theatre list of the following day's bookings... They
   don't send repeated updates" (L122). From what Vanessa said in front of Ben, who did not
   contradict her, "the hospital only actually sends one shot of the data, and that is tomorrow's
   theatre list. That's the first and last time you hear from them in that regard." (L130) Donald
   asked whether an anaesthetist might not know where they will be until the day before; Greg: "No,
   because the surgeon's booking always has the hospital on." (L132-134) Vanessa says the hospital
   knows a few things the surgeon does not, and these come on the hospital update (L142). The exec
   v6 says the list comes "as a PDF and as a direct data integration" (exec v6 p.3). Settled for now:
   the cadence (one list per day, for the next day). Still open: the format and fields per hospital.
   The review and merge step Greg wants for incoming data is point 14. Bears on FT-02.1, US-02.1.1,
   US-02.1.5 and US-14.6.1.
3. **NHI is mandatory, with no blank allowed (OQ-49, partly).** OQ-49 is Open. Reading US-03.1.5,
   which shows a missing NHI "clearly instead of a blank", Donald: "I think we'd already determined
   that NHI is a mandatory thing... So there can be no support of a blank." Greg: "Yep it is." (L725-727)
   Donald: "I want the AI to clean up anywhere that talks about an NHI potentially being blankable
   because we don't think it should be." (L729) Donald asked for the catalogue to be cleaned up on
   this from the transcript (L741). On the story's line that the NHI stays inside the clinical and
   ledger systems, Donald: "we don't put NHI information into Xero. Right." Greg: "Yeah, that's
   right... It could be more explicit than that." (L733-739) On the board US-03.1.5 went Proposed to
   Confirmed, then to Open, at 15:05. Still open: whether a Booking can be held pending an NHI with
   later steps blocked, which this exchange did not address directly. Bears on US-03.1.5, US-11.1.4,
   US-11.1.5, US-09.3.1 and US-15.0.6.
4. **A prepaid price should not move when the schedule changes (OQ-96, moved).** OQ-96 is Open.
   Donald's scenario: a patient prepays on Monday for a Thursday procedure, and on Tuesday or
   Wednesday a new Contract arrives with a new fixed price (L318-326). Greg: "it should really be for
   the price that's been paid, even if the anaesthetist has changed their price" (L328), though "we
   might want to check this with the anaesthetists". Donald expects Ben would want the price to stay
   the same for the patient, but Ben has also said fixed prices are "based on what the price is on
   the day [of] the procedure" (L330-338). Donald was picturing a third party (for example a plastic
   surgery price list) changing a prepaid fixed price, not only the anaesthetist (L342). Greg:
   "There needs to be a way to not alter the price of a prepay arrangement. Because... when you
   update the schedule it will point to the new price. So you don't want it to do that if it's
   prepay." (L344-348) He added that prepay applies only to anaesthetists, not surgeons, but surgeons'
   rooms that have a deal raise the same case (L352-356). Donald asked that Claude "front up the
   questions and the conditions where that will be applicable" from the transcript, to put to Ben
   and Vanessa (L358-362). Greg will add a line that "the management of prepay and certain fixed
   price arrangements is not fully resolved" (L364-368); tech v6 p.11 carries it. Not settled. Bears
   on FT-06.2, US-06.2.2, US-04.2.10, US-06.5.4 and OQ-92.
5. **A Contract with no lines can still be applied by the office (OQ-98, partly).** OQ-98 is Open.
   Donald recalled the shift earlier in the week: "a no contract RVG has no base units or modifiers
   pre applied", "the anaesthetists themselves have to apply the RVG", "but... that would still allow
   the admin team to apply that contract which defines how it's being paid and who is paying." Greg:
   "Yes, even if it's got no lines on it." (L906-916) Settled: an RVG Contract with no lines can be
   set on a Procedure and decides who pays. Still open: how such a Contract is offered for every
   procedure. Bears on US-04.3.3, US-04.3.4, US-03.3.1 and OQ-06.
6. **Invoice wording for a general procedure left open (OQ-103).** OQ-103 is Open. Donald read it
   ("Every RVG group now has a general procedure") and stopped: "actually I don't want to answer this
   until we can look at this another time because... anything that says RVG, I'm nervous because...
   it's all gonna change a little bit." "I'm gonna leave this as open, but it will be updated."
   (L1026-1030) The surrounding discussion moved the question on: an invoice description on the
   Booking (point 36), the open question of what an RVG Contract prints (point 37), and Donald's idea
   that an RVG invoice could use the hospital's description (point 38). Not settled.
7. **Modifier prompting and the locked age modifier (OQ-95, moved).** OQ-95 is Open. Greg: "any of
   the prompting around ASA modifiers and things, Ben's really anti it... he feels very strongly
   about this issue that we shouldn't be doing this for them... they want to do it themselves."
   (L1130-1138; the transcript has "spin's" for Ben, as Donald reads it at L1211) Donald: "I don't think that's what this is saying. I think this is saying it's
   predefined modifiers... a procedure has modifiers [that] can be optionally applied", and the ASA
   grade is one of the optional modifiers given its own space (L1140-1144). On US-03.3.4 (the system
   adds only modifiers that cannot be removed, shown selected and locked), Donald: "You've told me
   that Ben is now not really happy with this... leave it as verify for now" (L1211); Greg: "I'm not
   prepared to talk to him about it anymore" (L1217). On US-03.3.8 (the age modifier applied and
   locked), Donald: "I'll talk to Ben about this, so I'll mark it back [to] verify." Greg: "I would
   challenge whether it should be locked... it's another thing at all to lock it"; "everything's
   permissive". Donald: it "could potentially cause trouble in some random configuration" (L1219-1233).
   On the board US-03.3.8 went Confirmed to Verify at 15:39. Not settled. Bears on US-03.3.4,
   US-03.3.8 and US-05.1.4.

## Other points

### Greg's v6 documents

8. **Greg's edits to the v6 documents.** Greg: the first change in the executive summary was "to
   change that word 'locked' to 'fixed', because it appeared in a number of places" (L47). "I took out
   the unresolved issues because... we've talked about them all, Ben's made his contribution... we can
   regard them as resolved." (L51) "Ben's been getting very irritable about thinking that the office
   enter the RVG code because he says they don't really know what they are. So I just took the line
   out. It doesn't change the fact that you can put one in." (L55) He added "rate" to "overriding a
   price, rate or discount" (L55), and a section on booking updates "without being very specific about
   anything at all, just saying that the system will receive updates" (L59; exec v6 p.3). Later, on the
   technical design: "we've got open points here. I took those out. You put them back in... I'll take
   those out because they're all decided", and "I'll take section 15 out" (L400-404). Section 12
   (updates, history and data loading) is new: "a proposal for how an upload might work... The
   developers might go, oh, this is ridiculously difficult or expensive. And that's fine." (L189)
   Bears on US-04.2.13, US-03.5.1 and US-05.4.2.
9. **Surgeons' arrangements are Contracts like any other.** Greg had wondered whether surgeons'
   arrangements are "really any different from an anaesthetist arrangement, apart from the fact that
   they're not prepaid" (L19). Donald checked that "arrangement" means Contract. Greg: "They are
   effectively contracts because AA have agreed to use that price list. So it's a contract just like
   anybody else's." (L21-23) Settled. Bears on US-04.1.1, US-04.1.5, FT-13.6 and OQ-67.
10. **The office is the last to touch it, with no special authority.** Donald, on the revised
    wording: "We had lots of conversations about the term 'override' or 'final say', which was mostly
    documenting that, sequence-wise, probably the office was the last person to touch it, but they
    don't have any special authority. I think that's what the changes here are." Greg: "Yeah, that's
    changed that." (L61-66) Settled. Bears on US-05.4.2, US-07.2.3, US-07.2.2 and OQ-16.
11. **The executive summary's numbered list was reordered.** Greg: "I inverted this list. So the top
    one is where you start and the fourth one is... each one, if it's valid, overrides the previous
    one... so this is easy to understand." (L174) Donald made no comment in the meeting.

### Booking updates from surgeons' rooms and hospitals

12. **Rooms re-send the whole List as a PDF on every change.** Greg, from Ben and Vanessa: bookings
    come from the rooms "as a list as soon as there's a booking assigned to a day and an
    anaesthetist", and "whenever there's a change to a list... right up to the procedure day... the
    list is re-emailed to the office as a PDF. So it just comes in repeatedly." (L70) Donald: "you've
    talked about that in the past" (L72). Greg noted Ben corrected Vanessa as she described it (L74).
    Bears on FT-02.2, US-02.2.1 and US-02.5.4.
13. **Ben: do not forward the rooms' List PDFs to anaesthetists.** Greg: Ben told Vanessa she should
    not send the surgeons' list updates to the anaesthetists, "because if they're doing their job
    properly, everything they need to know is on their phone", and "the PDFs from the surgeons are
    just noise because they've got to manually check them all" (L146). They are "snapshots, so it's
    the worst sort of data... that doesn't even tell you what's changed" (L154). Donald: "This was a
    concept I had not considered at all", that anaesthetists today get these documents as well as the
    app (L148). Greg suspects they ignore them until the day before (L162). No decision was recorded.
    Bears on EP-02, FT-02.2 and US-02.2.1.
14. **A review and merge step for incoming booking data.** Greg: "when the stuff comes in like the
    PDFs. And even if there's an integration... there needs to be some sort of review and merge
    capability where the data comes in, they look at it. They action anything they need to and they
    press accept or whatever and off it goes." (L166) The exec v6 says the same (p.3). Donald gave no
    firm reaction. Bears on FT-02.1, US-02.1.2, US-02.1.3, US-02.2.1 and OQ-13.

### Contract maintenance, versioning and schedule uploads

15. **Two kinds of Contract change; "periodic renewal".** Greg: Contracts change in two ways, "a
    correction or a mid-year update to some of their lines and an annual review... or periodic review
    of the whole structure. Both are handled on one screen." (L201) Donald had heard Nick say some
    prices update every two years (L207). Greg: "technically I should call that a periodic renewal
    of the whole schedule... I'll change this." (L213) Vanessa said one party (the name is unclear in
    the transcript) sends additions and updates all the time (L217); tech v6 p.10 says some hospitals
    send these regularly. Settled. Bears on US-04.1.2, US-04.1.3 and US-04.2.13.
16. **Every change is a new version from a date the office picks, never backdated.** Greg: "every
    change creates a new contract version from a date that the office chooses. Nothing is... back
    dated. That's important. And nothing is deleted." (L221) "You can't back date a price upgrade
    because it might stuff up your existing invoicing... So a valid from date cannot be less than
    today." (L225-229) Donald agreed. Tech v6 p.11 adds that the procedure date decides which version
    prices a procedure. Settled. Bears on US-04.1.3, US-04.2.10, US-04.2.13 and OQ-48.
17. **Contract maintenance screen, with changes staged for review.** Greg: "the office maintains a
    contract on a header and lines screen. The header holds the name, dates and flags. The lines sit
    below it. Both can be edited on screen and lines can also be loaded from a schedule uploaded in
    the AA template. So that's to be confirmed." (L233) It is "a list of the contract lines for one
    contract", one Contract (so one holder) at a time (L241-253). "Edits and uploads are not applied
    immediately... They are staged and shown on a review dashboard for that contract. The office
    reviews them, then submits. On submit the system creates the new version and writes audit records
    of what changed." A single-line fix on screen "treats it exactly the same way" (L257). The
    dashboard shows header and line changes so the office can sanity check before submit; Donald: "a
    pending change" (L388-390). The upload template stays to be confirmed. Bears on US-04.1.2,
    US-04.1.3, US-04.2.4, US-04.2.13 and OQ-100.
18. **Alter and Replace; nothing deleted; validity on the Contract head.** Greg: "an alter is used
    for correcting an error or midterm... adds and updates to a subset of lines"; "replace" is for "a
    periodic... renewal or any complete new schedule", closing all the current lines "and here's the
    new list" (L261-269). "A new version starts with a copy of every line in the current version";
    the proposal is that for an alter the office exports the lines to a CSV, edits and reloads them,
    with an operation column per row (add, alter or remove) (L273). Donald asked how a complete
    replace fits with keeping what was on an invoice so a PDF can be regenerated (L275-283). Greg:
    "lazy language. I'm not deleting it, I'm just flagging them all as having a date set so that they
    become legacy... No, nothing is deleted." (L285-297) "Validity stays on the contract head and not
    on the line." (L309) Greg calls the details the outcome of a Claude conversation that may help
    whoever codes it (L309). Bears on US-04.2.13, US-04.2.4, US-04.1.3, US-08.4.4 and OQ-100.
19. **Enough detail for now.** Donald: in a normal discovery "we would probably want to hash out
    maybe more of these details", but given the expected funding model (a charge on every invoice)
    only high-level sizing is needed, and "this is probably all a good enough starting point to
    understand the outcomes" (L394). Greg: "I think we've beaten this to death for the time being."
    (L396) Donald wants to read through the Contract screens on the board again once everything is
    incorporated, since they were skipped last time (L417).

### Prepayment and procedures

20. **Prepayment is triggered by a Contract a person sets up.** Donald: "all this prepaid procedure
    stuff isn't automated anymore because we can't really automate it... There needs to be some human
    in the loop that places [it] on the contract to then trigger the prepayment." (L520-524) Greg:
    "There is a prepaid procedure. But it comes after the contract's been set up. So if a booking's
    made using that contract, then it does invoke a prepay procedure. But it's not the procedure to set
    it up, it's the procedure to bill the customer." (L526) Settled. Bears on EP-06, FT-06.1,
    US-06.1.1, US-06.2.1, US-04.2.14, US-12.1.3, OQ-92 and OQ-76.
21. **"Procedure" is now a free-text field on the Booking.** Donald: the procedure "used to be this
    like first class citizen that was a list that you would look through and then find a contract.
    Whereas now procedures has been neutered to the point where it's actually just a free text field."
    Greg: "Oh yeah, yeah." (L535-537) It still represents a logical entity on a Booking "that has a
    contract and maybe has an RVG", so "there's no longer the capital P procedure... for a prepaid
    automated system to attach onto and so all of that stuff needs to be triggered via a contract."
    Greg: "Yep." (L539-541) Settled. Bears on EP-03, US-02.5.7, US-06.2.1 and OQ-62.

### EP-12: anaesthetist profile and reporting

22. **Only the unit rate matters on the profile; GST period and prepaid RVG codes go.** Donald read
    EP-12 ("a dollar value per RVG unit, a GST period") and asked where the GST period came from.
    Greg: "No, that's way too complicated... all they have is a unit rate. That's the... only thing in
    there that matters to the billing. The rest of it I believe is just contact information." (L440-446)
    On "the RVG codes they treat as prepaid", Donald: "we no longer have that concept". Greg:
    "There's no association between RVG codes and prepay." (L456-458) Greg wants the rate described
    "per Unit... as specified in the RVG" (L462). Donald: "This RVG code's treated as prepaid. I think
    needs to just be deleted." Greg: "It does." (L468-470) On the board EP-12 went Confirmed to
    Proposed at 14:39, the GST period came out of its description at 14:39 and the prepaid RVG codes
    at 14:42. Settled. Bears on EP-12, FT-12.1, US-12.1.1, US-12.1.2, US-12.1.3, US-12.1.4, FT-06.1
    and US-06.1.1.
23. **Blacklist and whitelist settings on the profile (doubt).** Donald: "the blacklist, whitelist
    stuff is also meant to be in their [profile]", and the epic text "is not probably even quite true
    to that... But maybe it's been presented elsewhere." (L448-452) Greg's reply is unclear (L450-454).
    Not settled. Bears on EP-12, US-13.6.3, US-13.6.4 and OQ-43.
24. **The GST report is a monthly list of payments with the GST component.** Donald recalled a month-end
    summary "of every invoice that was sent" (L484). Greg: a summary "of all payments made", because
    invoices may not be fully paid; some patients are on repayment plans, paying "$500 a month or
    something off the bill" (L486-498). "What the anaesthetist wants to know is what numbers do I need
    to do my GST return?... how much income they've had... and what is the GST component of that
    income... It's a payment list showing the GST component." "Monthly." (L498-502) Settled. Bears on
    FT-12.2, US-12.2.2, US-05.2.7 and OQ-29.
25. **Donald asked for EP-12 and its stories to be updated, not confirmed.** Donald: "Claude, based
    on the transcript, please update Epic 12 to more accurately describe what we've just been talking
    about here... So I'm not gonna mark this as confirmed... we might need to come back to it again
    another day." (L504) His summary: "dollar value per unit. Prepaid procedures, no, contact details."
    (L508) Greg: prepaids are "not really" part of the profile (L510-514). Donald asked for "a big
    update" on the stories, "because we have talked about the fact that the anaesthetists need to
    somehow communicate with the admin staff to create all of the contracts for the fixed fees they
    want... that's a big change and all this prepaid procedure stuff isn't automated anymore" (L520).
    Bears on EP-12, FT-12.1, US-12.1.1 to US-12.1.4 and US-12.2.2.

### EP-03: Lists, scope and finding past work

26. **The anaesthetist can edit a submitted List until it is authorised.** Reading EP-03, Donald:
    "the anaesthetist can still see that submitted list until it is authorized, at which point it
    drops off. And they have to find it through a more rigorous... search function." (L543) "Is there
    any particular reason why the anaesthetist can't edit it again?" Greg: "Not particularly." (L547-549)
    Donald: the admin staff are probably the last to edit, "but in reality the anaesthetist could
    submit their list and the next day realize something was wrong" and fix it themselves (L551).
    Greg's original RFP aim: "I didn't want a sharp eyed anaesthetist to have a booking effectively
    disappear when he submitted it. Because it doesn't appear on his receivables unpaid list until
    that process has been completed by the office" (L557); "the thinking's a little bit flaky" and he
    has had no specific instructions on it (L565). Donald pictured scrolling up from today to see
    submitted Lists, and authorised ones somewhere else in the app for history (L567-571). Greg:
    "Perfect." (L577) Greg: "to be honest, if they get a query, they're gonna ring Vanessa" (L581).
    Donald: "the transcript can fix up Epic 3 for that." (L587) Settled; FT-03.4 picks it up again in
    point 49. Bears on EP-03, FT-07.2, FT-07.4, US-07.2.1, US-07.4.1, US-07.4.2, US-07.3.1 and OQ-31.
27. **Keep both the mobile and the web anaesthetist apps in scope for now.** Donald: "I want to keep
    the idea of having a mobile app and a web app, both of them in scope, until we just kind of know
    the breadth of everything and then we can decide and have conversations with Ben... the directors
    about cost and scope." Greg: "Agreed." (L587-592) Settled. Bears on FT-03.1 and US-15.0.2.
28. **Schedule to List to Booking drill-down confirmed.** Donald read US-03.1.1. Greg: "Yeah, that's
    fine." Donald: "I am happy with that too." (L594-598) He noted the story shows duplicate mobile
    screenshots, perhaps a bug (L594). On the board US-03.1.1 went Proposed to Confirmed at 14:52.
29. **Model the app closely on the current one.** On US-03.1.2 (see the Contract on each Procedure),
    Donald did not know what the "three-part stack" was (L602). Greg: "I think the closer you can make
    this to the current mobile app, the more buy-in you'll get... It's not the app that's the problem,
    it's what happens behind the app... we should start by trying to model this very closely to the
    current user experience on the current app." (L604-612) Donald would like to see it; Greg says Donald will need to sit
    with Ben for that, since someone (name garbled in the transcript) has no access to it (L614-616). Donald: the prototype has not been updated for
    recent thinking, but "in concept this is what we expect" (L618-622). Bears on US-03.1.2, FT-03.1
    and US-15.0.1.
30. **Attachments (US-03.1.3) retired, and references to it removed.** Donald: attaching files to a
    List "seems quite unusual to me" (L634). Greg: "I don't recall any requirement for that" (L636);
    holding reference information is a generic need, "like a corporate resource", not tied to a List
    (L632). On keeping the rooms' PDFs on a Booking: "Never been talked about. But then at the moment
    they're getting emailed... Ben doesn't want them... I'm comfortable removing this feature because
    I don't think it represents what I've been asked for." (L644-648) Donald: "3.1.3, I'm just going
    to retire this as something that's not needed. And Claude, if you can go ahead and find anything
    else that references this and un-reference it because it's no longer in scope." (L678) On the
    board US-03.1.3 went Proposed to Retired at 14:58. Settled.
31. **The photo use case: a patient added to today's List.** Donald: what has come up several times is
    "taking a photo and creating something from that", and some version of the story may still be
    needed as a place for the photos (L654-658). Greg: "The use case for the photo is a very specific
    one": the anaesthetist arrives at theatre and a patient has been added to the List that they do
    not know about; a photo of the current List would put it "all there ready to go... That is the use
    case." It is "a little bit sophisticated, but that was what he was looking for as a benefit"
    (L660-676). Not settled. Bears on US-02.4.4.
32. **Web app parity is a nice to have, not a requirement.** Greg: "nice to have. It's not currently
    true... And in fact if you have it, it sort of undermines the argument about whether you need a
    web app." (L699) Some people are natural phone users and some prefer the web: "You'll need to run
    that past them directly." (L703) Donald: downloading PDFs and monthly reconciliations are painful
    on mobile and natural on a desktop (L705). Greg: "I'd be a bit judicious about how much overlap
    you'd actually want... you should use each app for what it's best at" (L707-711); the GST report,
    or "anything that you might... want to email or print as a document", is "a natural for a web
    app" (L719-723). Donald: "So I leave that as a verify." (L725) On the board US-03.1.4 went Proposed
    to Confirmed at 15:02, then to Verify at 15:04. Not settled; to ask the anaesthetists. Bears on
    US-03.1.4, US-15.0.2 and US-12.2.2.
33. **Find past work: patient name first, NHI too.** Reading US-03.1.6 (calendar and archive), Donald:
    "I don't really picture it as an archive, more just a search function." (L741) Greg: going back
    through the calendar is not very practical; beyond a few days "a visual rollback is limited value"
    (L743-747). Donald: the date is a cue when someone rings about a patient on a given day (L749).
    Greg: "That's fine. I agree with that. But I wouldn't propose it as the primary lookup. I think
    the primary lookup would be the patient's name." (L751-755) "I wouldn't limit it to NHI", since
    people asking may not have it; "some sort of loose search where they could type in Smith and get
    all the Smiths" (L759). Donald: "I see no reason why not to have both searching abilities." (L761)
    Donald asked: "Claude, can you update 3.1.6 just to reflect what Greg and I have talked about
    here?" (L765) He then read US-03.1.7 (search by NHI or patient name, then a Booking's procedures):
    "we agree on that." On the board US-03.1.6 went Proposed to Confirmed at 15:08 and US-03.1.7 at
    15:09. Settled. Bears on US-03.1.6, US-03.1.7 and FT-03.1.
34. **Prepaid amount on the Booking confirmed.** Donald read US-03.1.8: "Yep, that's true. That's
    confirmed." Greg: "No, it's good." (L773-778) It was already Confirmed.

### Source text, invoice wording, the RVG code and Contract selection (US-03.1.9)

35. **No capital-P procedure in the stack.** Reading US-03.1.9 (each procedure shown as a stack of
    three), Donald: "So we're no longer having this idea of a capital P procedure." Greg: "Yep."
    (L780-782) Donald pictured the box replaced by "the actual text that comes from the hospital, the
    surgeon's room. And then below that's where you're picking the other things." (L798) Later he
    summed up: the screens show the specific text from the hospital or rooms, "an RVG if applicable...
    a field to select an RVG", and "a contract drop down to select the contract". Greg: "Yes... in the
    reverse order, because if... any part of it [is] fixed, like a price or a rate... the selection of
    the RVG is not necessarily [needed] if it's fixed." Donald: "That's right." (L918-930) Settled.
    Bears on US-03.1.9, US-02.5.7, US-03.3.1 and OQ-62.
36. **An invoice description on the Booking.** Greg: "The booking carries a description supplied by
    the surgeons' rooms... if there is a contract line that applies to that procedure, Ben would
    prefer the description [on] the contract line to be used on the invoice. So I don't think we
    should ever replace the description. We should have an invoice description field in there and it
    either is a copy of the booking procedure description, or the contract line description if there
    is one." (L804-812) Donald: "I think that's compatible" (L814), and "having an invoice name field...
    makes sense to me" (L842). Later Donald said the invoice wording "feels new to me"; Greg: "It's a
    new idea", since there are various versions of the description "and we don't necessarily want to
    lose those, but they also may not necessarily be the ones we want to print" (L998-1004). Settled
    in principle. Bears on US-03.1.9, US-04.2.4, US-04.2.8, US-08.4.1 and OQ-103.
37. **What an RVG Contract prints on the invoice is open.** Donald: on an RVG (no contract) pick, "the
    RVG code essentially holds a description" that "could describe a whole bunch of different
    things"; "if I'm a patient, do I want to receive an H1 minor procedures...?" Greg: "No, I agree."
    (L818-828) Fixed Contracts, including the anaesthetist's own, can have nice names and invoice
    descriptions, "but how the heck do you handle RVG" (L830-834). Greg: "I'm leaving it to the dev
    team to come up with some answers... There's a bit of friction around... what the user experience
    is in terms of RVGs and contracts." (L836) Donald: "There's just a big hanging question mark which
    is what the heck happens for an RVG. So we need to define that somehow." (L846) Donald wants to
    build "without that intermediate list" and expects the Contract drop-down may be very large; Greg:
    "I don't actually agree with you about that. I think the filters will always make it small, but
    time will tell." (L850-856) Not settled. Bears on US-03.1.9, US-04.2.8, US-05.1.6, US-04.3.2,
    OQ-103 and OQ-88.
38. **Keep the rooms', the hospital's and the invoice descriptions apart.** Greg recalled Ben saying
    "the hospital expanded all of the abbreviations", so the hospital list's description, "received
    the day before... might actually be superior to the one we get from the surgeons' rooms. And he's
    saying we should capture that." Donald: "we're in alignment." (L988-994) Greg: "not only should we
    keep the... surgeon's description, but we should keep the hospital description. And then we should
    also have an invoice description on the booking. Because they all three could potentially be
    different." The anaesthetists have not yet thought through "the heuristics for which one they
    would like to use" (L1016-1020). Donald: this answers part of what goes on the invoice for an RVG
    Contract, "you can actually probably just use the hospital's one". Greg: "you're invoicing for
    exactly what the hospital's description is because you're invoicing the hospital, and that makes
    sense" (L1022-1024). Settled: keep all three. Bears on US-03.1.9, US-02.5.7, US-02.1.3, US-08.4.1
    and OQ-103.
39. **The office picks the holder, Contract and line; anaesthetists pick the RVG code.** Greg: "the
    primary job of the office is to identify the billable party. And they do that by selecting the
    contract and the contract holder and the contract line. So at that point all of that should land
    on the anaesthetist mobile app as pre-filled... this has got nothing to do with the RVG code."
    (L864-868) Donald asked whether the office knows enough, since Ben or Nick keep saying "the admin
    staff don't know" (L886-894). Greg: "Ben and Nick are talking about the assignment of the base
    units in an RVG code. They don't want the staff to do that. What they do want the staff to do is
    work out who is the contract holder and which contract is being applied", for example an ACC or a
    Southern Cross Contract (L896-904). Settled. Bears on US-04.3.4, US-04.3.1, US-04.1.5, US-03.1.9,
    OQ-26 and OQ-67.
40. **A Contract line can carry a default RVG code.** Donald hopes fixed Contracts can be attached to
    an RVG code "as reference. So you could pick an RVG and filter it to see all of the contracts
    related to that RVG. But you don't have to." (L930) Greg: "Ben's still a bit excitable about this,
    and I think we need to come back to him once we've demonstrated progress in other areas. But I
    agree when Vanessa is setting up contract lines... you should be able to provide a default RVG code
    to a contract line because it's a stable thing. And then therefore it will carry through that
    information into the booking screen." (L936-944) "I've just soft pedalled it... You and I know
    she's going to use it." (L948) Donald: "let's demonstrate it and then have the conversation"
    (L954). Agreed between Donald and Greg as a capability; Ben has not yet been asked. Bears on US-04.2.4, US-04.3.2, US-05.1.6, OQ-88 and OQ-89.
41. **Booking views need not look the same in every app.** Donald read that the stack appears on every
    booking screen, in both apps, the hospital matching screen and the office view, and found the
    wording confusing (L958-966). Greg: "There might be a case where they're not looking the same
    actually", since a bigger screen can break a booking out into detailed fields "which the
    anaesthetists don't even see on their phones" (L972). "I don't think we need to constrain it by
    saying that." (L976) Settled. Bears on US-03.1.9, US-15.0.2 and FT-02.1.
42. **Donald asked for US-03.1.9 to be updated; set Open.** Donald: "Claude needs to update 3.1.9...
    And there's some open questions related to this." (L1010-1014) On the board US-03.1.9 went
    Confirmed to Open at 15:26. Points 35 to 41 are the discussion; OQ-103 is point 6.

### Booking structure and clinical capture (FT-03.2, FT-03.3)

43. **The primary procedure is the big one.** Greg asked how the primary is chosen: "Is it just the
    first one in the list? Because that's how a user would think about it." (L1035) Donald has always
    put the first procedure as primary, and Vanessa said "always the most expensive one would be the
    primary, it's just the way it goes", since the rooms send "the big thing being the big thing"
    (L1037-1049). Donald read US-03.2.2 (anyone with edit rights can set the primary) and US-03.2.3
    (add additional procedures, each with its own Contract); Greg: "Yep." (L1053-1059) Settled; no
    status change. Bears on FT-03.2, US-03.2.1, US-03.2.2 and US-03.2.3.
44. **The anaesthetist reads the procedure, not "records" it.** On FT-03.3 ("the anaesthetist records
    the procedure and its contract"), Donald: "They're no longer recording the procedure. They can
    review it. But the procedure is what comes through other systems." (L1061) Greg: "it's a very good
    point... if they change it, then they're effectively recording it." (L1063) Donald: "Record implies
    that the anaesthetist is adding data or editing data"; they might rewrite the plain description,
    with history kept, but mostly they read it "as an input to select a contract or an RVG". (L1065)
    Greg: showing it may need care so it does not take too much room on a phone (L1074). Settled, as
    a rewording. Bears on FT-03.3 and US-03.3.1.
45. **Other billing lines kept with the procedure; "event" preferred.** Donald read US-03.3.6 (lines
    outside the BTM calculation, such as post-op, nerve catheters and pain consults, some dated the day
    after). Greg: "I think that's right... It just feels like having it in the same sort of area as the
    procedure makes its use a bit confusing... I'm just wondering if we should take it out... and put
    it into another story." (L1090-1098) Donald: traceability, so an event after billing attaches to
    one procedure and its Contract decides who is invoiced (L1100-1108). Greg: "they do logically
    belong together... we'll leave it like this... how it's presented is a separate issue." (L1110-1114)
    Donald: "I don't really like the billing lines, like a billing event... it's basically a flexible
    tool to add another invoicing event to a procedure." Greg: "Good comment." (L1116-1120) On the board
    US-03.3.6 went Proposed to Confirmed at 15:34; it was later asked to merge into events (point 59).
    Bears on US-03.3.6, FT-03.7, US-03.7.2 and OQ-63.
46. **US-03.3.1 to be rewritten.** Donald: "pick the procedure and the contract with the starting
    units. So this all needs to be rewritten... Make sure this is not marked as confirmed. Verify."
    (L1155) Greg: "when you upload that document it'll clean all that up." (L1157) It was already at
    Verify. Bears on US-03.3.1 and OQ-62.
47. **Start and finish times, not "handover".** Greg: "I don't know why it says 'handover'. It should
    say 'finish'... They hand it over to intensive care or post-op care, but that's not what they're
    recording." (L1161-1165) The RFP's screenshots say finish: "so let's use the word finish." Greg:
    "Finish." (L1179-1181) Greg: the rest is correct (L1185-1189). The post-op time units are
    calculated from the two timestamps; both agreed (L1195-1201). The current app has start and finish
    buttons (L1205). On the board US-03.3.3 was retitled "Record anaesthetic start and finish times"
    and went Proposed to Confirmed at 15:37. Settled. Bears on US-03.3.3 and US-03.6.2.

### Contract on the Procedure and price changes (FT-03.4, FT-03.5)

48. **FT-03.4 read: admin sets the Contract, the anaesthetist may change it, admin approves.** Donald:
    "Admin normally sets the contract when the booking is set up... Is visible to the anaesthetist who
    may change it? Yes." Greg: "True." "The admin then approves the selection during the submitted
    review." Greg: "True. True." (L1235-1241) Settled. Bears on FT-03.4, US-04.3.4, US-07.2.2 and
    OQ-26.
49. **The anaesthetist can change it until the List is authorised, not only until submit.** Donald:
    the feature describes "a submitted phase where the anaesthetist loses access and the office then
    authorizes it", but "if the anaesthetist for whatever reason wants to or needs to edit it, they
    could. Up until it's authorized. Once it's authorized, it's... handed over to the invoicing
    engine." Submitted still has a purpose: it makes the List less visible to the anaesthetist and
    "implies to the admin team that they have a job to do." (L1251) Greg: "Yeah. Okay. Yeah, cool."
    (L1253) Greg checked: "till the procedure is billed, right?" Donald: "Authorised." (L1261-1263)
    On the board FT-03.4 went Confirmed to Verify, back to Confirmed (15:41), then to Verify (15:42).
    Settled. Bears on FT-03.4, FT-07.2, US-07.2.1, US-07.3.2, US-04.3.5, OQ-17 and OQ-31.
50. **The status words to be checked with Vanessa and the directors.** Donald asked whether submitted
    and authorised are Greg's words or AA's; Greg: "Some of these words came out of... standard use of
    words." (L1271-1273) Donald: "I'll need to sit down with Vanessa and maybe the directors and
    basically go through these flow charts to make sure we're all aligned on them." Greg:
    "Absolutely." (L1279-1281) Donald: "I'm not gonna update the story myself... I'll let Claude update
    it from the transcript. So I'll just mark it as verify" (L1283). Donald asked for FT-03.4 to be
    updated from the transcript. Not settled. Bears on FT-03.4, FT-07.2, FT-07.3 and OQ-17.
51. **US-03.4.1 becomes "Anaesthetist can change the Contract".** Donald: "they can't change the
    procedure anymore because... the idea of a procedure doesn't really exist, but they can certainly
    change the contract." (L1283) He unlinked the filtered list ("relevant to the booking"), since it
    no longer filters against the procedure; Greg: "technically it's filtered to the booking procedure"
    (L1291-1297). On "when either one changes, the starting units and any fixed price refresh", Donald:
    "Now the only way... that stuff changes is by changing the contract." (L1299-1315) Greg: "The
    contract here is short for contract and contract line, but that doesn't matter. We can use
    contract." (L1321) On clearing an entered price or discount when the new Contract does not allow
    one, Greg: "it just goes back to some initial state. And that includes price as well, so that's a
    slight oversight in the original documentation... It's price, rate or discount." (L1323-1333)
    Donald: "Claude, just based on the documents we give you as a part of this recent group of changes,
    I think 3.4.1 needs to be updated to be more accurate", keeping the audit, the office review flag
    and the insurance pre-approval case (L1335). On the board US-03.4.1 was retitled and reworded at
    15:44 and 15:45 (the starting-units bullet removed) and went Confirmed to Verify at 15:46. Bears on
    US-03.4.1, US-03.3.1, US-03.5.1, US-04.3.2, US-02.5.5 and US-07.2.2.
52. **FT-03.5: the Contract decides what the anaesthetist can change on the price.** Donald read it:
    on No contract (RVG) or their own first-party Contracts they can change the price or apply a
    discount; on a third-party Contract the agreed price stands and to depart from it they would
    change the Contract; on a fixed-discount Contract the discount is shown locked. "I think that all
    sounds right to me." (L1342) Bears on FT-03.5, US-05.4.1, US-05.4.3 and US-04.2.14.
53. **Who else can change a price (unclear exchange).** Greg suggested the second bullet mention "have
    an admin user change the price. Oh, it doesn't matter... Well, the admin always wins, right."
    Donald: "Is that true?" Greg: "So, but they'll do that later." (L1344-1348) Donald: "the mental
    model in my head... is that the price is always the price on the contract. And if the contract is
    a fixed price then nobody can change it. But you're saying actually the anaesthetist..." Greg:
    "Exactly." Donald: "And if they want to change it, they do. And if anybody complains, it'll
    inevitably become an admin team problem. So they do it at their own discretion." Greg: "Yeah,
    exactly." Donald: "Okay, I'm with you on that." (L1350-1358) The transcript does not make clear
    what exactly was agreed. Donald: "Claude, go ahead and update the wording on that based on what
    we've just described." (L1362) Donald asked for FT-03.5 to be reworded. Not settled. Bears on
    FT-03.5, US-05.4.2, US-07.2.3 and OQ-16.
54. **No reason needed for a price change.** Donald read US-03.5.1, which "is basically repeating what
    we've already just said" and requires a reason before a price or discount can be saved (L1362).
    Greg: "I put in [the] document that that's not required because the only place that I've heard
    where an explanation is required is modifiers and that's only because the insurers require it...
    They should be able to change all this stuff and just having it as an audit flag should be
    sufficient." (L1368-1372) Donald: "Makes sense to me. So Claude, please update 3.1 based on today's
    new documents. 3.5, rather." (L1374) Donald asked for US-03.5.1 to be updated: no required reason.
    Settled. Bears on US-03.5.1, US-03.5.3 and US-03.4.1.
55. **BTM is not mandatory on a fixed-price Contract.** On US-03.5.2 (BTM kept in full even at a 100%
    discount), Donald: "I guess this is true, but it's optional. BTM is not mandatory in a situation
    when it's a fixed price." Greg: "Yes, that's correct." Donald: "Fixed rate it would be, but fixed
    price no." (L1374-1378) On the board "BTM is not mandatory when a contract is fixed price." was
    added to US-03.5.2 at 15:50. Settled. Bears on US-03.5.2, US-05.2.5 and US-05.2.6.

### Completeness and events (FT-03.6, FT-03.7)

56. **Booking completeness validation confirmed.** Donald read FT-03.6 (minimum booking data checked
    before a booking is marked complete). Greg: "Of course that's correct... We want validation."
    (L1382-1396) Settled.
57. **US-03.6.1: time and RVG code optional; the reference is not the anaesthetist's job.** Donald, on
    "every procedure must have a procedure which carries its RVG code and contract": "Not true... we're
    eliminating that." The time recorded: "Potentially, but not mandatory, we've just determined... the
    time recording is optional, depends on the contract." Greg: "as is the RVG code, right." Donald:
    "The RVG code is also optional, exactly", though on an RVG Contract "I still think it's a good
    practice... Pick an RVG code." Greg: "That's how they get the base units, so that's okay."
    (L1398-1408) The short explanation for modifiers claimed stays (L1410). On "any reference the
    contract holders need", Greg: "that should be referring to the insurance authorisation number,
    because we want to carry that through. But... should that be a requirement for the anaesthetist?
    It really shouldn't... It's something [the admins] should have to pick up." Donald: "I'll agree with
    you there. And we can get Claude to update that." (L1412-1421) Donald asked for US-03.6.1 to be
    updated, and left it at Verify; on the board it went Confirmed to Verify at 15:52. Settled. Bears
    on US-03.6.1, US-03.3.3, US-03.3.4, FT-03.6 and OQ-93.
58. **US-03.6.2: "finish", and pre-op or post-op unclear.** The example in US-03.6.2 says "record the
    handover time" (L1425). Greg: "that is an important issue, but for me the question that it doesn't
    clarify there is whether this is pre-op or post op." (L1427) Donald showed the prototype blocking
    submit and naming what is missing, such as a finish time; Greg: "that works. That's actually quite
    nice." (L1431-1449) Not settled. Bears on US-03.6.2 and US-03.3.3.
59. **Events are one name for all of them; merge "other billing lines" into events.** Donald read
    FT-03.7: an event is anything recorded against a procedure after it is set up (a pre-op or post-op
    time, a fixed fee, an additional invoice or a credit), each its own element attached to the original
    procedure. Greg: "Yes." (L1451-1457) Greg: they are "only linked in reference... They are often not
    linked in time." (L1457-1461) Donald: "Claude, earlier in this transcript you heard us talk about
    the other billing lines, and I think that concept needs to be merged with this." (L1463) He read
    on: mostly the anaesthetist adds events and the admin team can too; each event has a tick box for
    whether it will be invoiced; "a billed event is its own line item, bundled with the procedure's
    invoice if possible, otherwise invoiced in the next run". Greg asked about an event that turns up
    after the invoices have been issued; Donald: that is the next run. Greg: "Okay. We're good."
    (L1465-1473) On the board FT-03.7 went Verify to Confirmed at 15:56. Donald asked for US-03.3.6 to
    be merged into FT-03.7. Settled. Bears on FT-03.7, US-03.3.6, US-03.7.1, US-03.7.2, OQ-63 and
    OQ-24.
60. **US-03.7.1: the event's billable party.** On the event pop-up ("same as the procedure's billable
    party" ticked, or the tick cleared and the party filled in), Donald: "I don't know what that
    means." Greg: "It means it could go to the original contract billable party or it could be someone
    else." Donald: "that makes sense to me." (L1479-1485) Donald: "I'm gonna confirm that and ACC
    pre-op code. Okay, we can come back to that another time." (L1487) On the board US-03.7.1 went
    Verify to Confirmed at 15:57. Settled; ACC pre-op codes parked. Bears on US-03.7.1, US-05.5.2,
    US-11.2.1 and OQ-12.
61. **US-03.7.2 to be rewritten as a free-form invoice event.** Donald connected the story to Vanessa's
    example of a combination billed one way and later split into billable events (L1487). On "the
    procedure's contract can replace a recorded time with a fixed fee": "That's a pretty confusing line
    of text, Claude." Greg: "It is." (L1495-1497) Donald: "Maybe 3.7.2 if you could update that to be
    closer to what we've described. Which is basically this is a free form way to just create an
    invoice on a procedure slash contract that just gives freedom. So this billing event could be a
    credit. Or it could just be a new positive thing with a free text field to describe what it was."
    (L1499) On the two lines (an event recorded before approval travels with the procedure's invoice; one recorded after the invoice is raised makes a separate invoice traceable to the procedure), both said they are correct, and Donald and Greg agreed the wording is confusing (L1504, L1514-1524). Donald asked for US-03.7.2 to be
    updated. Settled. Bears on US-03.7.2, US-08.6.1, US-08.6.3, OQ-45 and OQ-63.
62. **US-03.7.3: a refund could show as an event.** Donald read it (both apps list all of a
    procedure's events: pre-op, post-op, additional invoices and credits): "A refund could also show
    here as an event." Greg: "not a bad idea... That's a good example of something that would just
    need to be on the web. It would be complicated to do on a phone." (L1530-1536) On the board
    US-03.7.3 went Verify to Confirmed at 16:00. Settled. Bears on US-03.7.3, FT-03.7 and US-08.6.2.

### Next steps

63. **Next: bring the documents and transcripts together, then back to Contracts.** Donald will take
    both documents, the transcript of the earlier session, this one and the board changes "and bring
    it all together as an update" (L1546). After that: "we'll go back to contracts here and then we'll
    trudge through contracts, RVG master data, patients and billable parties, payments. And maybe the
    profiles." (L1558-1562; the transcript has "political parties") Ben is in Australia next week and
    cannot make those meetings; the next session is Tuesday morning (L1575-1599). Bears on EP-04,
    EP-05, EP-10, EP-11 and EP-12.

### Added on verification

64. **A Contract stays one unit: how it is priced and who is invoiced.** Donald, checking whether
    the two could be picked separately: "you could pick how they're built and who is paid
    separately" (L870). Greg pointed to the technical design, where a Contract is configured to behave
    in a particular way (L872-880). Donald's example: a hospital may have many Contracts for the same
    procedure, one invoiced to ACC and one to an insurer or the patient, "all one unit of a contract
    that point to different places but have the same cost"; Greg: "Yes. Yes, yes." (L882-886) No one
    proposed splitting the two. Bears on US-04.1.1, US-04.3.4 and OQ-67.
