# AA meeting with Greg, 2026-10-07

- **Who:** Donald Fraser (Stratos) and Greg Smith (RFP author, Peritia), about 08:45 to 11:00 NZDT
  (estimated from the board edit times below; the recording runs 2h 14m). Ben (AA principal), Nick
  and Rob (AA) and Vanessa (AA administrator) are referred to but were not there. "Last night" in
  the transcript is the [AA directors meeting](2026-10-06-aa-directors-meeting.md) of 2026-10-06.
  The session ended minutes before a meeting with AA at about 11:10 the same morning (L877, L922,
  L1349).
- **Covered:** the procedure level between booking text and the RVG, the first-version intake and
  matching flow, then a read-through of EP-04 (Contracts) on the Requirements Board: the Contract
  catalogue, Contract definition (holder, billable party, pricing settings, schedule lines, GST,
  required inputs, prepayment, effective dates, combination Contracts), a long argument about
  uploading Contract schedules, Contract selection on a Procedure (FT-04.3) and the default
  Contracts feature (FT-04.4), which was retired.
- **Donald's framing (typed 2026-10-07):** "Quite a difficult one. We focus solely on contracts and
  there's lots of thrashing around of ideas that are somewhat up in the air, but in the end you'll
  see that Greg ultimately agrees with a lot of what is already proposed in the catalogue."
- **Inputs gathered here:**
  - one reconciled transcript,
    [AA Meeting with Greg Oct 7th Reconciled Transcript](<../artifacts/files/AA Meeting with Greg Oct 7th Reconciled Transcript.md>),
    registered as artifact [AR-26](../artifacts/AR-26.md);
  - the board edits Donald made during the session, 09:05 to 10:56 NZDT, from
    `requirements-board/.history` (edits tagged `board`);
  - Donald's typed framing above.

Cite a point as `"Notes 2026-10-07 · AA meeting with Greg #n"`. Points are numbered once across the
whole note. Speakers' wording is kept in short quotes (spelling fixed, filler dropped); the
summaries around them are paraphrase, with the transcript as the authority. Positions are transcript
line numbers ("L593-617" is lines 593 to 617); the transcript also carries timestamps. Board times
are NZDT from the board history. Much of the transcript is Donald reading an item aloud; a reading
is the item's text, not a statement by either speaker. Several items were left for rewording once
Greg's technical document and database model arrive (point 12); where that is so, the point says so.

## Questions answered

1. **Which date decides the price: the procedure date, per Greg (OQ-48, partly).** No board answer;
   OQ-48 is Open, owner "Donald to ask AA". Donald read the question out (L221-225). Greg: "Oh no,
   that's settled. It's the date of the procedure that's been discussed." (L227) He tied it to Nick's
   point the night before about the age of the patient: "Same concept here." (L231-235) Donald: "that
   makes all the sense in the world to me", but "I probably just leave it open here until I hear from
   them" (L229). Later both agreed that Contract pricing must carry an effective date, leaving how it
   is modelled open (point 40).
2. **Combination Contracts accepted as written (OQ-53).** The board answer: "A combo procedure exists
   as a contract against each of the relevant parent procedures." Donald read the combination story
   (L896): a combination is a fixed fee Contract under a procedure, not a separate procedure, and one
   Contract sits against each of its parent procedures, "so picking any of them offers it". Greg first
   doubted it: novel combinations will keep arising, "or are we talking about a prearranged bundle
   that has a fixed price on it?" (L898-902). Donald: "We're talking about a bundle", a bundled fixed
   price on a third party's price list (L904). Greg: one Contract linked to several parent procedures
   is "a really complicated construct", like his earlier idea of procedures as children of procedures,
   and "an expensive feature because it changes the design of the whole system"; perhaps the admin
   should always split a bundle into lines (L910-922). Donald: "as far as the system is concerned, it doesn't actually
   know what it is. It's just a free text field contract that has a title, that has a parent, multiple
   parents maybe, and it's got a fixed fee." (L948) The combined price can be lower than the parts, so
   the picker shows both the single and the combination Contracts (L944-946). His example is a plastic
   surgeon's price list (the name is unclear in the transcript, likely Merivale Plastic Surgery) with
   abdominoplasty and breast reduction simple or complex, mastopexy, and one box combining mastopexy,
   breast reduction and abdominoplasty (L964-980). He rejected building combined prices from component
   procedures: "the health system isn't nice and clean... 10,000 procedures, 40 RVG codes" (L988).
   Greg came round: "all you're trying to do is associate that contract with that procedure and you're
   done" (L1002). Donald: "you and I are aligned that the combination part of this is understood and
   the proposed way of handling that is accepted"; Greg: "That's fine." (L1047-1053) US-04.2.11 went
   Verify to Confirmed on the board at 10:31.
3. **Splitting a combination before it is invoiced (OQ-77 part 3, partly).** No board answer; OQ-77
   is Open. Donald restated Vanessa's scenario (a combination billed to the patient, then insurance
   covers it and Southern Cross needs the individual line items priced separately) and the
   after-invoicing flow: credit the original invoice, then raise additional free-text invoices (description, maybe quantity, price) on the same Procedure, with every
   event visible for traceability (L1011-1015). Vanessa had told him the split amounts are not the old
   uncombined prices: "We would just figure out the right way to split it", so it "needs to be just a
   free form way" (L1019). Greg added the before-invoicing case: "There's a good chance that this would
   get caught before it was invoiced, so you wouldn't have to raise the credit... What you actually
   want to do is override the fixed price and split it." (L1025-1029) Donald: "you're totally right"
   (L1031). Greg: "It sort of contravenes [the] cannot change price law. But that's fine. Maybe we
   should just leave things open and they can adjust the price of the first procedure and add one or
   two more." (L1037) Donald floated showing a pending invoice that can be cancelled and replaced with
   free-form invoices (L1039). Greg: when an insurer pays, the split may be routine and predictable,
   "We could check that with Vanessa today" (L1045). Closed for now as "just a generic invoice", to be
   tackled later (L1047-1049). Parts (1) and (2) of OQ-77 were not discussed.
4. **AA identifier and Contract versioning read without change (OQ-66).** The board answer: "Lets go
   with your Recommendation for now" (a short structured AA code per Contract, a filtered picker with
   code search). Donald read the audit and versioning story and the AA identifier story (L237); Greg:
   "OK. So far so good", then rechecked the holder codes paragraph: "that's OK, that's fine" (L239).
   US-04.1.3 went Proposed to Confirmed (09:09) and US-04.1.4 Verify to Confirmed (09:09). Later the
   holder's own code was kept as searchable when picking a Contract, and Greg asked for "some sort of
   composite... like a modern search where you can type it in and figure out where it is" (L447-453).
5. **Schedule line extras dropped, except the time band (OQ-89 part 3, partly).** No board answer;
   OQ-89 is Open. Reading US-04.2.4 (L439-447), Donald: "there's a time band. There is a flag marking
   it as an add on. I don't know about that." Greg: "No, I don't think so." Donald: "And a quantity
   rule, I don't know about that." Greg: "No." Donald: "I'm just going to delete those so that this
   sits a little more slim." On the board (09:29 to 09:30) he removed the add-on flag, the quantity
   rule, the optional RVG mapping and the sentence explaining it (point 31); "an optional time band"
   stays in the text. Whether the time band was meant to go too is not clear from the transcript.
   Parts (1) and (2) were not answered, but the custom unit rate and the discount were split into
   separate settings (point 28).
6. **Greg: the Booking does hold the funding source (OQ-55, contradicts its answer).** The board
   answer: "The contract defines the billable party. And there can be many contracts for any mix and
   match needed." Its summary adds "neither the Patient nor the Booking holds it". Reading FT-04.3's
   line "The patient's insurer or funding source is not a filter: neither the Patient nor the Booking
   holds it" (L1062), Greg: "the booking does hold the funding source. That's where it's meant to be
   defined. It's part of our problem here." (L1064) Donald: "I'll go ahead and delete that line out of
   here for now", to be revised later (L1066); he removed it from FT-04.3 on the board at 10:33.
   Donald, on the line: "once we know what data the system does have, we can figure out what filters
   might need to be handy" (L1062). Greg had said the same earlier: "There'll be something on the
   booking that says how it's being funded" (L326, point 27). This agrees with OQ-55's original
   recommendation (on the Booking) and not with its recorded answer: flag for the update.
7. **No hospital default Contracts; who the no-contract Contract bills is still Greg's to come back
   on (OQ-78, partly).** No board answer; OQ-78 is Open, owner "Donald to ask Greg". Settled in the
   room: a hospital-specific default RVG Contract does not exist. Donald: "the idea that there was a
   hospital specific RVGs... doesn't really exist. It would just be the no contract contract." Greg:
   "No, no, it doesn't exist." (L1070-1072) Donald took "hospital" out of FT-04.3's default sentence
   on the board (10:34: it now reads "defaults to the RVG Default Contract"). On US-04.3.3, Greg: "if
   we just take the word hospital out of that, then it's good" (L1163). On FT-04.4, Greg: "it's got
   this upside down... the RVG is the default starting place for everything. And then you change it."
   (L1225-1229) FT-04.4 and US-04.4.1 were retired (point 59). Not settled: Donald's reading that "the
   default no contract contract will always default to [billing] the patient", with other Contracts
   billing the hospital or whoever their billable party is; Greg: "I'd like to have a think about
   that... I'll come back to you on that." (L1165-1167)

## Donald's notes

Donald's requests, spoken aloud to Claude during the session.

8. **Explain what a Contract is, in plain words, in EP-04.** Greg: "for people who haven't been part
   of this journey, it might be worth putting a sentence in here about what is a contract... it's a
   structure we're using to reflect the various arrangements that are made between the parties."
   Donald: "Claude, as you read this transcript, please go ahead and update the appropriate epic to
   just put a little bit more human language in there, to explain that a contract is basically a
   structure within our system that defines the rules of how people get paid, not necessarily an
   actual legal contract between AA and any other party." (L176-178)
9. **Reword "the Booking's own billable party" in US-04.2.1.** "Hopefully based on this transcript,
   Claude, we can update the wording on this one." (L312) The discussion is point 26.
10. **Clean up the required inputs and prepayment story.** On US-04.2.7: "this is a story I'm not
    really understanding what it's describing and probably just needs to be rolled up into something
    else" (L458), "I think this story just needs to be rolled up with the ones before it" (L498), and
    "I'm going to pass over this particular story and ask Claude, based on our transcript, to do the
    appropriate cleaning up of this section." (L562) The discussion is points 33 to 36.
11. **Pick up the split scenario from the transcript.** "From our transcripts I'll ask... Claude can
    pick up the kind of scenario we've just described." (L1047; point 3)
12. **Contract wording waits for Greg's documents.** Donald asked Greg to say whether he accepts the
    human-language document and to make the technical document "what you believe it needs to be":
    "I'm not really interested in going in and contesting the technical parts of this. And we can
    bring that in here and have these requirements be updated to reflect that." (L826-830) On
    US-04.2.10: "I won't mark this as confirmed. But the sooner you can do your technical document, I
    will then pass in the human language document [and] your technical document and ask it to update
    all of these based on those." (L617) On US-04.3.2: "I won't rewrite it too much because I suspect
    it will be updated based on transcripts and new documents." (L1113) On FT-04.4: "in the documents
    we will pass, this will correct this" (L1235). Near the end: "You and I will have to go through
    and look at all of this again after we've got those documents in." (L1334)

## Other points

### Procedures, the RVG and booking intake

13. **No procedure list exists today; invoices print the rooms' text.** Greg, reporting Ben from the
    night before: "the invoices all just print whatever the surgeon has typed on the booking record...
    there is no such thing as a list of procedures", and Ben does not think capturing every procedure
    is "possible or cost-effective or practical" (L11). "All we do is look up the RVG to basically get
    the base units." (L15) Nick and Rob (the transcript has "Ron") are "quite happy" to keep printing
    the rooms' description. Greg proposed reframing the problem as how to "deduce the RVG group that we
    need as a reference point from the description that's in the booking" (L15).
14. **A managed list of procedures between the booking text and the RVG.** Donald: this repeats the
    night before, with "10,000 different ways to name procedures" and "about 40 different RVG codes",
    and agreement that "we need something in between" (L17-25). Greg: "I seeded with Ben before the
    meeting that we'll need some sort of intermediate level... next level down from the RVG", a record
    that "encapsulates a whole family" of procedures; "we're both talking about the same thing" (L27-31).
    Donald: "some sort of managed list of procedures that AA can manage, and it's up to their discretion
    to say, do we have one tooth extraction or do we have a few different tooth extraction styles",
    with RVG codes attached, used as "a grouping/sorting method to more easily discover and pick the
    contracts that are relevant" (L33). Greg asked whether to call them something other than procedures
    ("a generic descriptor for a family of procedures", L35-39), then: "it's like a meta procedure,
    which is fine. We'll call it a procedure." (L47) Later Greg: the standard procedures "have a one to
    one relationship with the RVG, and that's where they derive their value from"; Donald: "We've talked
    about all of that." (L1312-1314) Whether procedures sit under RVG codes or in a flat list (OQ-88) was
    not settled.
15. **How big the list is.** Greg expected "a couple of 1000 standard procedures" (L67). Donald: "the
    list I have right here, which is filtered down from what Solutions Plus gave me, comes in at about
    400 procedures"; Vanessa may "add another 200 or another 600... it's up to them to fill this in"
    (L69-73).
16. **Pick by procedure or straight by RVG.** Donald: some users "may want to search against sections
    of the body and procedures. Others may already know the exact RVG code they want, or they want to
    browse the RVG... what we have been calling the procedure picker, we need to simultaneously have an
    option to not pick via procedure and pick just via RVG." (L45) Greg did not object. Reading US-04.4.2
    near the end, Donald: "at the beginning of this transcript and last night we talked about being able
    to search either by the procedure list or the RVG list... whatever path you go down, when you get to
    the point where you're selecting a contract, there will always be at least one contract, which is
    the no-contract RVG." Greg: "Yeah, yeah." (L1266-1272) The story does not say this yet.
17. **First version: no automated intake, a matching screen with gates.** Donald: "for the first
    version of the application, there's no automation that happens at all." Downloads from "probably
    just the same two hospitals" land in "a matching/creating screen"; the system shapes them into draft
    Booking data; staff see the patient details and what is missing, then save a draft List with no
    anaesthetist or assign one. A later update arrives in the same screen, matched by "the date, the
    surgeon, the location, the slot", and staff "just say approve update". Once the heuristics are
    trusted, "let's set up some automated approvals". (L53-61) Greg agreed (L55-59).
18. **Every booked procedure is assigned to a procedure, even on a fixed price.** Greg: the matching
    screen "will have a picker in it where they can assign the booking to one of these codes... all
    procedures will need to be assigned to one of these codes." Donald: "that's exactly what we're
    already talking about." (L75-77) Greg: "they should be matched, shouldn't they? Even if they're using
    a fixed price. Because the base status is that they should live somewhere in that hierarchy." Donald:
    "Yes, yes, yes, definitely." (L79-81)
19. **Why the picker must be easy: misallocation and pushing work back to the office.** Greg reported
    the directors' "aggravation of the mismatches in terms of billable party, and also misallocation of
    bookings to the wrong RVG group" (L83). Nick's example: a new anaesthetist doing ophthalmology work
    in his first week "doesn't know his way around the system... just sends everything back to the
    office and he gets into that habit"; "We really want to avoid that." Greg: "If we can get this
    navigation tidy, then I think it will address a lot of those concerns about errors and time [and]
    who's spending the time on it." (L87)
20. **The picker will be a centrepiece; design later.** Greg: the current Solutions Plus booking screen
    is "awful", "like somebody fired a shotgun at the screen" (L87-99); "the picker screen is going to
    become one of the really central artefacts that will need some thought around design" (L103).
    Donald: focus on requirements now; the experience will get "lots of iteration on that and definitely
    lots of testing with AA" (L105-113).

### Greg's database model

21. **Greg to review the technical document and update the database model.** Donald has a technical
    and a non-technical document made from the catalogue; he has not read or approved the technical one,
    and asked Greg for "an updated database model... as a way to kind of move past this" (L120). Greg had
    given it "a quick read", found it "pretty good", going "down another layer or two from where I took
    it", and will go through it "sometime in the next day or two" (L122-134). Donald needs it before
    updating the prototype and offered to shorten a meeting day for it (L136).

### Contract catalogue

22. **AA in the centre, everyone else a contract holder.** Greg: at the directors meeting "they were
    treating themselves as the contract holder and were struggling with the conversation"; once he
    inverted the language ("AA is the party in the centre and everybody else has a contract and we're
    referring to them as contract holders"), "the penny dropped and they got it immediately and they
    started engaging with the model" (L180-184). Point 8 has the request this led to.
23. **Contract categories: not settled; one long drop-down for now.** Reading US-04.1.1, Donald: the
    story "hasn't probably been updated to more closely match the new artefact" (the procedure and
    Contract selection diagram); the default hospital RVG "sounds like is not really the case" and is
    not on that diagram (L193); "we reconfirmed last night that... contracts can have a custom rate, so
    you're still using RVG, but you're not using the anaesthetist rate, you're using a predefined rate";
    the categories "can be refined" (L197). Greg: "Not completely lined up with you about how you're
    explaining the categories, but... it doesn't matter" (L207), and asked whether categories are a
    formal pick-list "or are you just saying there are these styles of contracts?" (L211). Donald: "I don't
    think I'm 100% certain on it yet", to validate with Vanessa (L209); the admin picks a procedure, "then
    there'll be a drop down of contracts... all the contracts that were relevant for that procedure...
    maybe they've got some headings within the drop down, but it's one long drop down list" (L217). The
    board shows US-04.1.1 going Verify to Confirmed at 09:05, during this reading, despite Greg's
    reservation.
24. **Filters on the Contract list: active or all, and contract holder.** Greg: "there'll be a filter
    on that about whether you're looking for active contracts or all contracts, and probably another
    filter for contract holder... they'll always be interested in a contract holder's contracts."
    Donald: "That's right." (L250-252)

### Contract definition: holder, billable party, scope and pricing settings

25. **What extra information a Contract can require: the guardian example.** Greg asked for an example
    of "what extra information the booking needs to collect" (L256-262). Donald: where "the default
    billable party is the patient and they're under 18... the system would prompt to make sure we have
    contact details for the guardian." Greg: "OK. Maybe... we'll let it go." (L264-266)
26. **"The Booking's own billable party" means the default Contract case.** Reading US-04.2.1, Greg:
    "Where is the circumstance where the booking's billable party would hold a contract that isn't
    covered by the previous list?" (L274) Donald: "the language here is probably not quite right... it's
    probably in the situation where there is no contract... you would select the no RVG contract... and
    within that, assume the billable party is the patient, unless they're under 18" (L276). Greg:
    "Those circumstances... are people who don't have a contract, but for whom we are using the default
    contract, right?" Donald: "I believe that's what we're defining here." (L306-308) Greg suggested
    something like "or the default contract" (L302), and "there's probably a better way to express that
    for the developers" (L310). Donald also set out the audience for the requirements: developers, the
    AI updating the prototype, and AA approvers, "close enough... to get to the next stage" (L280-288).
    The board shows US-04.2.1 going Verify to Confirmed at 09:19, after this exchange; the rewording is
    point 9.
27. **Scope narrows the list for every user, and the holder comes first.** Reading the scope paragraph
    (filters on hospitals, procedures, surgeons, insurers, RVG codes or groups, funding source and
    specific anaesthetists; the anaesthetist filter empty by default), Donald: the list "would be
    filtered for any user using the system", not only admins (L320-324). Greg: the business "identifies
    the contract holder as one of the early steps in reducing the list... There'll be something on the
    booking that says how it's being funded. The admin has to determine who the contract holder is...
    the hospital... or the patient is effectively the contract holder, or the surgeon... then it's very
    easy to give the list of contracts under that holder." (L326) Donald: "what you're saying isn't out
    of sync with what my understanding is", and the experience "can be refined as we build it out"
    (L332). Points 6 and 52 carry this on.
28. **Custom unit rate and pre-applied discount are separate settings.** Reading US-04.2.2's list,
    Donald: "Custom unit rate or discount? I really think those should be two different lines. Custom
    unit rate. Pre-applied discount." (L332) On the board (09:20) the bullet "a custom unit rate or
    discount" became "a custom unit rate" and "Pre-applied discount".
29. **The billable party is a reference, not an email on the Contract.** Greg: a billable party such as
    a hospital "can hold many contracts, so the contract should just... point to the billable party"
    (L338-342). He wants "two fields in the contract around managing billable party": "contract holder
    is billable party, yes or no", and a pointer to the billable party, where "the billable party is
    the table somewhere that holds the list of all the billable parties, including hospitals, surgeons
    and patients or patient guardians... a reference table" (L358). "If the contract holder is not the
    billable party, then by default it is the patient" (L366). The invoice email should not be named in
    the Contract: "it implies that the email is embedded in the contract and it wouldn't be" (L370), and
    a developer would "reach a conclusion intuitively that he'll then have to unwind" (L378). Donald:
    "this is the sort of thing that I think is great for you to define in the technical document"
    (L368); "I won't confirm this one... the particulars around billable party, invoice email, that sort
    of stuff, you want to shape up and redefine, that's totally fine." (L372) US-04.2.2 kept its status.

### Schedule lines, GST and the RVG link

30. **Schedule lines are generic Contract lines.** Greg: "I think this is generic about contract lines.
    It may not just be a fixed fee schedule. It could be one of those ACC contracts... where the
    contract is for an agreed rate" (L389), and the story "seems to have conflated the fact that this is
    a 2 table story, not a 1 table story" (L401). Donald: the story repeats the one before (US-04.2.2),
    and "based on the transcript, it may decide to merge these into one" (L395, L411, L447).
31. **Every line and procedure always has an RVG code.** Greg: "it says it's got an optional mapping to
    an RVG code, but would that be correct?" Donald: "It's not really an optional thing. Every
    procedure will have a link to an RVG code." Greg: "it's mandatory, isn't it?" (L425-433) Donald:
    "There will always be an RVG attached, so I'm going to delete that line." (L447) The holder's own
    code stays as a reference and is searchable when picking: for Christchurch Eye Surgery, staff who
    know the code from the PDF "can search against that code as well and have it show up"; Greg:
    "Absolutely." (L447-449) The board edits are in point 5.
32. **All prices held GST exclusive.** Greg: "a fixed fee wouldn't carry GST inclusive pricing. It would
    just carry the price... always excluding the GST." Donald: "the system shouldn't include a GST price
    in everything. It should just be calculated when it needs to be calculated." Greg: "Absolutely,
    because it changes." (L413-421) Reading US-05.2.7's reasoning later, Greg noted the Christchurch Eye
    schedule shows both (L583); Donald: "Some of them... not all of them" (L585). Greg: "the rule for
    the system is that everything internally is exclusive and then the GST goes on the bottom of the
    invoice." Donald: "we're aligned on that." (L587-589) On the board (09:28) US-04.2.4's "both
    excluding and including GST" became "both excluding GST" (the word "both" was left in).

### Required inputs, prepayment and anaesthetists' own Contracts

33. **Required booking inputs: a Contract just has a prepaid amount.** Donald: admins set on a Contract
    who the billable party is, "or if it's unknown, it's inferred, or the patient"; "I don't think
    there's any options to define whether or not a prepaid amount can be defined per booking or per
    anaesthetist... a contract has a prepaid amount set on it and that's what it is." (L458) Greg: "there
    wouldn't be an invoice email... there'd be a billable party" (L500). Point 10 has Donald's request.
34. **Prepayment through the anaesthetist's own fixed-price Contract.** Greg: "we could use the [contract]
    construct to capture those cosmetic prepayments for individual anaesthetists... it's a fixed price
    contract and the admin just selects that contract, done." Donald: "That's what this whole first
    party... contract is for." (L460-468) Donald: "Ben said it, or maybe it was Nick: if anaesthetists
    want to be prepaid for something, they will need to define what the fixed price is for that
    procedure." Greg: "Yes, they have to." (L470-472) Greg: "Any anaesthetist can opt to be prepaid for
    any procedure, right? But the practice is that it mainly works for cosmetics, because that's an area
    that's problematic to collect." Donald: "we're aligned on that." (L512-514) The first-party Contract
    has the anaesthetist as holder, "and then under that there is the schedule of procedures that are
    prepaid" (Greg, L536-540); Greg: "a contract line for each procedure... Just think of it like a price
    list." Donald: "one contract that could be attached to many procedures, or an RVG code"; Greg: "Yes."
    (L552-560)
35. **Where the prepaid flag lives: disagreed, then converging.** Greg: "it would be a good idea to have
    a flag in the contract master for is pre payable, because that would be the trigger" to raise a
    prepayment invoice (L500). Donald: "as the requirements currently understand it, that is a setting
    that exists on an anaesthetist, not on a procedure or a contract" (L502). Greg: "it's only when that
    anaesthetist does... cosmetic work that he prepays" (L504-508); "therefore the flag belongs with the
    contract, not with the anaesthetist" (L516). Donald: "that's the part that we're not aligned on"
    (L518); the same Contract could be prepaid for anaesthetist A and not for B, "defined as a decision of
    the anaesthetist on the anaesthetist profile, not on the contract" (L526-530). Greg: "I would set up
    two contracts for that" (L532). Donald: "You're totally right. We'd already talked about the fact
    that [they] need to have a first party contract for themselves." (L534) Final position: prepayment
    comes from selecting the anaesthetist's first-party fixed-price Contract (point 34); whether a
    pre-payable flag sits on the Contract was not settled. This differs from the OQ-25 answer ("Prepaid
    is a property of the procedure from the anaesthetist profile, not of the contract") and FT-06.1
    (prepaid codes set on the anaesthetist profile): flag for the update.
36. **The office keeps control of Contracts in version one.** Donald: "there ultimately needs to be a
    function in the anaesthetist app... to allow them to manage all of their own fixed fee contracts"
    (L474). Greg: "Or they could behave like any other contract holder and just give the office [a]
    schedule" (L476); "it means the office stays in control of contracts. And I think that's probably a
    good principle." (L484) Donald: "some anaesthetists would want to be able to manage that themselves
    or review it themselves... something we can figure out" (L486). Greg: anaesthetists could "just use
    our schedule to lodge their contract prices once a year... and then we wouldn't have to build
    anything in the app to do it. And we could revisit that some other time." Donald: "Certainly not
    something that would be needed for the version one." (L492-494)
37. **Greg floated leaving modifiers out of version one.** In the same breath, on version one workload
    "after the conversation last night": "I reckon we could just pretty much forget about modifiers... any
    assistant work and modifiers, and no one would mind." (L488-492) The transcript is garbled here, and
    Donald's "Certainly not something that would be needed for the version one" (L494) may answer only
    the anaesthetist self-service idea. Floated, not decided; nothing else in the meeting takes it up.

### Invoice presentation and price effective dates

38. **Invoice layout, delivery and GST treatment set on the Contract.** Donald read US-04.2.8 (layout
    for contract holder or patient, delivery by email or portal upload for a direct insurer such as nib,
    GST treatment, so staff do not choose per Booking): "these are set out or defined in the contract,
    which seems right to me." Greg: "Yeah." (L566-575) US-04.2.8 went Proposed to Confirmed at 09:41.
39. **Dated Contract or dated lines: left to Greg's model.** Reading US-04.2.10, Donald took it to mean
    one Contract holding a history of prices for a procedure in time bands, without making a new
    Contract (L593). Greg: "I had envisaged that the contract would be dated, but the lines wouldn't,
    because the lines are all children of the contract" (L595); a dated line "stops being a child of
    the contract... it's sort of got a life of its own", whereas the Contract groups a pricing schedule
    "under a single thing... so by definition, they all need to move together as a unit" (L599-603).
    Greg: the story "got itself all fouled up here too by referencing fixed fee schedule line again"
    (L615). Later Greg defined it: "The purpose of the contract is effectively to group in a time band a
    set of lines of procedure allowance that are subject to this agreement for this period of time."
    (L753) Donald: whether time bands sit inside one Contract or each band is its own Contract is for the
    back end to decide (L755). US-04.2.10 stays Proposed (point 12).
40. **Agreed: Contract pricing carries an effective date.** Donald: "We know that pricing needs to be
    effective from a date. The particular way the system defines this, I don't know... you should
    propose what those are", and in the end the developers decide (L609); "Pricing on a procedure from a
    contract needs to have an effective date." (L613) Again at L842: "contracts need an effective from
    date... we agree that this is something the system needs to support and model." Greg: "OK... let's
    move on." (L844)

### Uploading Contract schedules

41. **Full overwrite rather than a delta, if schedules are loaded.** Greg returned to "the ability to
    load a contract schedule either as a delta or a full set" (L630); Donald: "Which we I think determined
    was out of scope." (L632) Greg: "A delta could be problematic, so we might just go with a complete
    overwrite which says, here's the new contracts and this is everything. So you basically mark all the
    old contracts as finished." (L634)
42. **Donald and Nick: schedules change rarely and are keyed by hand.** Donald: "what Nick was saying
    last night, which I absolutely agree with... all of these will be updated manually when they come in
    by the admin team, rather than any sort of automated structure to do deltas or updates." Greg: "I
    don't share that view, for a control point reason. But that's OK. Let's move on." (L636-638) Both
    agree third parties will not be made to fill in AA's template; Nick: "They already have a system for
    producing price lists, and they'll send it to us like they always do" (Donald, L648); Greg: "Yes, he
    did, and I agreed with them on that." (L650) Greg: "I said, so the admin team will create the
    spreadsheet, and he said yes." (L654)
43. **Greg: one pre-approved upload format, checked by a second person outside the system.** Greg:
    "there'll be a spreadsheet upload mechanism as a way to update a contract schedule" (L658); "There
    will be one format for a contract upload that the admin team will use for any contract that comes in,
    so that it can be uploaded in a consistent way. And it's been pre-approved." (L662) The reason is
    office control, not system validation: "The system can't check that the line price is right" (L678);
    "There needs to be a process in the office itself where the data being uploaded is checked." (L682)
    Donald played it back: staff member A transposes the holder's PDF into the formatted spreadsheet,
    staff member B checks it against the PDF, then either imports it; Greg: "Yep... And it's a formal
    process." (L712-718) Greg: "we need the system to support that style of upload, so that we can
    implement those office disciplines, which do not currently exist and cause problems every day."
    (L722)
44. **Donald's counter: the same two-person check works in the screens.** Donald: the human process
    "exists outside of the system, and the only part the system cares about is the ultimate spreadsheet
    that arrives" (L720); a GUI or an Excel import, "I don't think one trumps the other in terms of
    security [or] audit" (L688); staff member A could edit a Contract in the system and staff member B
    check it before saving (L724). Greg: "I don't agree with you about that... what's to stop that user
    transposing a figure?" (L690), and "there's a great flaw in having an individual sit in front of a
    screen and type... nobody has cross-checked that the data is correct" (L710).
45. **The exchange became heated; Greg asked for it as a requirement.** Greg, angry: "This is an
    important feature and it's not appropriate for you to sit here arguing about it, right? I need it as
    a requirement." (L729) He felt "I'm not being heard at all" (L741), and later: "you need to respect
    the fact that... I'm representing the customer and there is a need for the office to sort out its
    processes... I needed some sort of a tabular or schedule update" (L859). Donald apologised (L735,
    L743) and they talked it through after the effective-date discussion (L849-867).
46. **A tabular upload with control totals (Greg's alternative).** Greg: "we could create some sort of a
    tabular upload strategy where that data could be put into a table format screen", held in draft so
    "a second person [can] go through that data", with cross-checks such as "a total of the numbers in
    the column, even though they're meaningless, to compare [with] the total of the numbers in the
    schedule that arrived", because typing 100 lines without error is unlikely; it is designed "to
    minimise the errors... when sets of data get uploaded rather than just single lines" (L745). Later:
    "eventually it doesn't have to be a spreadsheet, but there needs to be a tabular control in the way
    this data is uploaded" (L788). Donald had said he did not yet have a picture of it (L762).
47. **Contract screens are needed from day one; bulk upload perhaps later.** Donald: there will already
    need to be a screen "that allows the AA admin staff to define all of the rules for all of the
    appropriate contracts" (L747-751); "I can see the value in what you're describing... bulk uploads from
    time to time, bulk edit from time to time", but questioned whether it must "exist maybe on day one
    versus later on", since "the system will still just accept what the user gives them, whether that be
    via spreadsheet or via somebody editing a screen" (L755). Greg: "Disagree with you" (L760).
48. **Final position: a requirement for a schedule upload mechanism, for Contracts only.** Greg: "I'm
    quite happy to leave this spreadsheet conversation alone if we just have a requirement that says
    there [is] to be a mechanism to support the upload of a schedule." (L832) And: "there was a very easy
    reconciliation... we just need to say in the requirements here that we'll need to support some sort
    of schedule upload" (L867). Donald: "how about we do this then... we can fill in the details of that."
    Greg: "For contracts, just for contracts, right?" Donald: "Yeah." Greg: "That's fine." (L869-875) On
    the board at 10:09 to 10:10 Donald created US-04.2.13, titled "The system will support some sort of
    bulk upload feature.", and moved it under FT-04.1; it sits in the Future Work lane with no body and no
    sources. Whether the upload is needed on day one was not settled (point 47).
49. **Greg's concern that the Contract model is not yet understood.** Greg: "I don't think you've really
    got the picture inside your head at the moment as to how a contract works... it drives so much else"
    and "in many ways, it's the guts of why the system's being built" (L764-780). He read the Contract
    definition feature as mixing Contract and Contract line (L792). Donald: the requirements predate
    Greg's pricing document from the weekend and the recent transcripts, which "hasn't been ingested
    and incorporated" (L782, L794, L826). Greg: "Well, that explains why it's mixing all this stuff up
    together... Because it hasn't unpacked it." (L800-804) Greg: "The context of this being prior to that
    I had forgotten. So that changes how I'm viewing this." (L844) Donald set out his approach: he defines
    the outcomes, the prototype's technical shape comes from Claude and the real one from the developers,
    and the requirements and prototype keep being iterated once the prototype catches up (L786, L834-842).

### Contract selection on a Procedure (FT-04.3)

50. **Contract holders, not categories, when it is rewritten.** On the FT-04.3 paragraph about third
    party Contract types, Donald: it "may have changed since this was originally written... assume it
    would be rewritten once we get your document and my document" (L1058). Greg: "It'll just be written
    as budget holders and then it's still valid." (L1060; "budget holders" as transcribed, likely
    contract holders)
51. **Exactly one Contract per Procedure.** Donald read US-04.3.1 (L1078). Greg: "That's true... I won't
    worry about when and how that's true." (L1080-1084)
52. **The filtered Contract list: the essence stands, the wording will be redone.** Reading US-04.3.2,
    Greg: "the terminology here is pre our discussion, where it's using contracts to describe both
    contract and contract line, and therefore it doesn't really have the idea of a contract holder to work
    with yet... this will get reworked" (L1091-1095). On a combination Contract sitting under several
    procedures: "It's a bit problematic, but I think we should just leave that and see how it looks...
    further down the road." (L1099) Donald: you would see only the anaesthetist's own first-party
    Contracts, not everyone's (L1105); "you wouldn't see every contract that exists in the world";
    Greg: "Absolutely." (L1117-1123) Greg's alternative way in: "You can start your navigation two ways.
    You can just traverse the raw RVG tree... because you're doing an RVG procedure, or you need to know
    who the contract holder is, and... once you know that, that provides you with the natural filters of
    what contracts are available." Donald: "That's right." (L1107-1109) On the board Donald removed
    "narrowed by the List's hospital (and possibly the surgeon...)" (10:36) and the "RVG Default
    Hospital" group (10:37), then moved US-04.3.2 Verify to Confirmed (10:39).
53. **Most insurer and hospital Contracts are plain RVG Contracts.** Greg: "Ben emphasised last night
    that most of the contracts are still RVG. So for instance Southern Cross have a number of different
    contracts that they hold... those are almost like identifiers for their billing... they are just
    still RVG contracts and there's nothing underneath them... it falls through to the default values."
    Donald: "it would be an RVG contract and it would probably be grouped by Southern Cross... it wouldn't
    be a fixed price, it would be the RVG price", invoiced to whoever its billable party is. Greg: "there
    are a lot of hospital RVG contracts." Donald: "The system can support that." (L1127-1149)
54. **US-04.3.3: the RVG default without "hospital".** Donald: the story "should just be rolled up into
    the previous one" (L1153). Greg: "the RVG contract will always be at the top of the list, right?"
    Donald: yes, defined in several places (L1159-1161). Greg: "if we just take the word hospital out of
    that, then it's good." (L1163) The board shows US-04.3.3 going Confirmed to Verify at 10:41. Who the
    default bills is point 7.
55. **Contract set at booking setup is mandatory.** Donald read US-04.3.4; Greg: "Absolutely... In fact,
    we've made it mandatory, right? It's going to sit on that admin list until they sort it out." Donald:
    "Yeah." (L1169-1179)
56. **Contract version locked at AUTHORISED.** Donald read US-04.3.5 (snapshot of the Contract version
    on each Procedure when the List is authorised); Greg: "Yep. Good." (L1181-1183)
57. **Hospital data changing a Booking should go to an admin queue (future).** Reading US-04.3.6, Greg:
    "if a hospital update changes data in a booking, it should go onto an admin queue." Donald: the story
    belongs to "a future phase of work... an integration detail for the future"; skipped. (L1188-1202)
58. **Procedure not on the Contract's schedule: default to RVG and stop, per Greg (future).** Donald, on
    US-04.3.7: "I don't understand what this is saying." (L1204) Greg: "that should be saying it just
    defaults to RVG because it has to be checked by an admin anyway. It's an error condition. Should just
    stop." (L1206-1210) Donald: in the MVP there will "probably [be] no contract selection smarts"; staff
    read what the hospital said and "find or create the matching contract in our system" (L1212). Greg:
    "Definitely a future... I don't agree with it, but I don't think we need to sort it out today... Make
    it future." (L1218) The board moved US-04.3.7 to the Future Work lane at 10:45; its text still has the
    admin setting the Contract and flagging it "to confirm with the hospital".

### Default Contracts (FT-04.4)

59. **Default Contracts for hospitals and insurers retired.** Reading FT-04.4, Donald: "every hospital
    and every direct billing insurer needs a default contract already in place. I don't agree with this"
    (L1223); "we've said every procedure has a default, which is the RVG, and everything else on top of
    that is a contract that needs to be selected." Greg agreed (point 7). On US-04.4.1 (a default Contract
    made automatically for each new hospital or insurer), Donald: "No, this is not a thing." Greg: "it's an
    interesting idea, because that's where I thought we were going to have to be. But there's got to be a
    better way to do it. So I agree. I think we should not do this." (L1239-1241) Donald: "I'll archive
    this feature... because we don't have default contracts for hospitals, insurers or procedures"; Greg:
    "Yep." (L1345-1347) On the board at 10:56 US-04.4.1 and FT-04.4 went Proposed to Retired, and US-04.4.2
    moved under FT-04.1, keeping its Verify status ("I'm going to leave this as verified now, but I think
    we mostly agree with this", L1345). Donald's phrase "default contracts for... procedures" sits against
    US-04.4.2 still being called "Default RVG Contract for every procedure" (point 60).
60. **Greg: a default RVG relationship, not a default RVG Contract.** Greg: "the procedure doesn't have
    the contract. The booking has the contract, right?" (L1249) Then: "There isn't an RVG default contract
    except for a header in the system that says 'I'm an RVG default contract'... There is an RVG guide"
    (L1300); "The default RVG relationship for every procedure. It's not a contract. Because we hold all
    these relationships and we derive the value at the time we look it up... that's not a default RVG
    contract. It's a default RVG relationship." (L1312-1316) Donald: "maybe what we're talking about here
    is semantics": "when you select a procedure and then you click on that drop down to select how it's
    going to be paid, there's always going to be at least one option, and that one option is using the RVG
    guide to determine the base units and modifiers"; it is "not even a hand authored [contract] that AA
    staff edit. It's just a pre-system-defined one" (L1318-1322). Greg: "It will always generate one
    contract that can be selected. I think the language is very mingled." (L1324) Same outcome, different
    words; left until both documents are in (point 12). Bears on OQ-62 and OQ-88.
61. **Custom RVG-style Contracts accepted.** Donald read US-04.4.2's first paragraph (one default RVG
    Contract per procedure; any number of named custom RVG-style Contracts, for example a complex facelift
    at 10 base units against NZSA RVG H4 "complex procedures" at 10 to 12 units; RVG-style Contracts
    always offered). After the default RVG Contract sentence and before Donald read the custom part, Greg:
    "I think I can live with the first paragraph" (L1276); on the custom RVG-style Contracts: "True"
    (L1278-1280). He then disputed calling the default a Contract at all (point 60).
62. **RVG starting data seeded once, then changed by hand.** On "imported from spreadsheets at the start,
    then maintained by hand", Greg: "I don't think we need to do that, do you?... They can just type it in
    by hand. It's such a rare event." (L1284-1288) Donald: Stratos does not usually build "a large
    infrastructure for importing spreadsheets"; Vanessa fills in a spreadsheet to seed the empty system,
    done "directly against the database or other such sort of process", and later changes are by hand
    (L1290-1294). At wrap-up Donald read the one-time seeding import and "so that base units live in
    contracts, every procedure always has a standard price to start from"; Greg: "Yeah, that's fine."
    (L1341-1343) This one-off seeding is separate from the repeated Contract schedule upload Greg wants
    (point 48).
