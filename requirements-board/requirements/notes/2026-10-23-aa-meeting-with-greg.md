# AA meeting with Greg, 2026-10-23

- **Who:** Donald Fraser (Stratos) and Greg Smith (RFP author, Peritia), in person, in one room with a
  whiteboard ("it's cold in here", L39; "Time for the whiteboard", L966), with a short break after the
  open questions (L473-480). Ben, Vanessa and Nick (AA) and AA's accountant are referred to but were not
  there.
- **Covered:** before the break, the open questions on the board from OQ-93 to OQ-116 (insurance details
  on a Booking, invoice descriptions, surgeon agreements, No contract (RVG), integrations, the internal
  booking model, paying anaesthetists through Xero, list swaps, insurers, prepayment refunds and mixed
  Bookings). After the break, a read-through of EP-04 (Contracts) on the board: FT-04.1 (the Contract
  catalogue, holders, codes, staging) and FT-04.2 (Contract definition, pricing terms, lines, invoice
  presentation, dated versions, combinations, the anaesthetist's own price list). At the whiteboard and
  over the Merivale Plastics and Southern Cross price lists, Donald and Greg reached a shared model of a
  Contract (the whole price list or schedule a holder sends, with its settings and dates on the header)
  and a Contract line (one row of it). Donald had been treating each row as a Contract. At the start
  Donald described the week's consistency pass over the catalogue (L14); during the session he edited
  items live on the board and, several times, asked Claude to make a change ("Claude, ...").
- **Inputs gathered here:**
  - the reconciled transcript,
    [AA Meeting with Greg 23rd Oct Reconciled Transcript](<../artifacts/files/AA Meeting with Greg 23rd Oct Reconciled Transcript.md>)
    (artifact [AR-54](../artifacts/AR-54.md));
  - the whiteboard drawing of Donald's model and Greg's (L966-1040), which was not filed; the transcript
    is the evidence for it;
  - the holders' price lists shown on screen (Merivale Plastics, the Southern Cross affiliated provider
    MIGS schedule, and a "CESL" document), from the discovery data files, not filed with this note;
  - the board edits made during the session, committed later with other changes; they are not listed
    here, and a point says where an item already carries what was said.

Cite a point as `"Notes 2026-10-23 · AA meeting with Greg #n"`. Points are numbered once across the
whole note. Positions are line numbers in the transcript ("L1063" is line 1063; "L1061-1103" is lines
1061 to 1103). Lines in the later transcripts are given as "27 Oct L25" (Ben and Vanessa) and "28 Oct
A L837" or "28 Oct B L457" (Greg, Parts A and B). Speakers' wording is kept in short quotes (spelling
fixed, filler dropped); the summaries around them are paraphrase, with the transcript as the
authority. Much of the transcript is Donald reading an item aloud; a reading is the item's text, not a
statement by either speaker. Where Donald says "Claude, ...", that is an explicit request to change the
catalogue, and the point says so.

This note was filed on 4 November, after the notes of 27 October (Ben and Vanessa) and 28 October
(Greg) and the typed decisions of 29 October. Where a point differs from them, the later ruling stands
and the point says so. Evidence older than this meeting (notes up to 19 October, typed decisions of 20
October) gives way to it. The "Catalogue:" lines in points 1 to 86 describe the catalogue as it stood
when this note was filed, before the requirements were updated from it.

The Contract model (Contract, Contract line, header settings and dates) and the payment model (Xero,
the two ledgers, the trust and holding accounts) discussed here come from Greg's architectural design
documents: a proposal held lightly, not settled, and still to be taken to AA (point 85). Donald,
4 November: no requirement is changed to describe them until they are settled; the points record what
was said. His decisions of 4 November on this note (the invoice description, the rulings held with the
Contract model, AR-44's holder kind and the dates of three board answers) are points 87 to 90.

## Questions answered

1. **Insurance on the Booking: no narrowing, one warning, and the approval number is the acceptance
   reference (OQ-93).** Greg: the Booking carries "two pieces of information which may be blank",
   coming "upstream from the surgeons' rooms": "Who is the insurer, and has an approval been issued?"
   (L43-71) The only warning: "if the insurance field is filled in and the approval is blank, then
   that's a warning condition"; any other: "Not that I think we can detect." (L99-106) Donald, the
   warning is "just isolated on its own" and alerts "the office slash anaesthetist" (L101, L108). On the
   question's three parts (L108): (1) "does the insurance indication narrow down the contract list? No";
   (2) a warning when a Booking notes insurance but a patient-billed Contract is chosen: "We've said
   that doesn't matter at all... we don't have to try and do any matching or magic algorithm with
   upstream and our contract system. We just do what we said before", perhaps later "once we start
   building it"; (3) "Is Greg's quote unquote approval number the same as the design's insurance
   acceptance reference? Apparently yes." Then: "Claude, please update 93." (L108) Settled between
   Donald and Greg. The 28 October meeting agrees on the warning ("It'll be a warning. It should be a
   warning", Notes 2026-10-28 · AA meeting with Greg #4) and adds a new matter for AA: whether the
   anaesthetist sees the number itself (#42). Donald answered the question there with "We've already
   talked about that" (28 Oct A L837), and Greg, on the patient-billed case: "We bill the patient, end
   of story" (28 Oct A L783) (Notes 2026-10-28 · AA meeting with Greg #4 #40).
   Catalogue: US-11.4.3 has the missing-approval warning. Its notes still call narrowing open and the
   acceptance reference unstated, and FT-11.2's notes call OQ-93 "partly answered, still open"; this
   meeting answers both. US-04.3.2 still calls narrowing open
   (OQ-93), and US-07.2.2 (and OQ-93's answer) still raise a warning at office review when a Booking
   names an insurer and no Procedure has an insurer's Contract, from the draft design (7 October), kept
   as "TBC" in v6 (16 October); this meeting drops that warning. Where the warning shows, which
   US-11.4.3's notes call unsaid on 28 October, is answered here: the office, and the anaesthetist when
   they look at the Booking themselves (Donald, L101).
2. **RVG base unit ranges: Greg defers to Ben (OQ-101).** Donald read the question and said the
   prototype already asks the anaesthetist to pick within a printed range, "but can always be
   overwritten... something like that still seems appropriate to me." Greg: "You'd have to ask Ben."
   (L112-114)
   Catalogue: OQ-101 is answered (the range is held and shown; any value may be picked; out of range
   warns the office; typed decision 29 October). Greg's deferral changes nothing. The board answer is
   dated to this meeting (point 90).
3. **The invoice description is three layers with a priority, and the office can always edit it
   (OQ-103).** Greg on the 16 October wording: "I think the way that's expressed is unhelpful... if we
   get a better description, we'll use that one." (L121) The surgeon's rooms' text "is usually verbose
   and garbled"; the hospital may send "something better", but it cannot be relied on: "It depends on
   the hospital. Some do, some don't" (L125-129); thirdly, a Contract line's description, "such as the
   prepaid contracts" (L129-133). "I would suggest that we set this up as a series of overriding
   defaults. So we start with the surgeon's description, we replace it with the hospital description if
   we get one. And if we've got a contract description, we use that." (L137) "So it's three layers and
   there's a priority." (L149) The office can always change it. Donald: "the admin staff may still want
   to override that with some free text"; Greg: "absolutely. That stays with the rule that says the
   admins can change anything." (L151-153) When only an RVG code was picked, Greg: "it's got nothing to
   do with the RVG code... the RVG code isn't in the selection hierarchy that would replace the
   surgeon's"; "The surgeon always writes what he's going to do." Donald: "That's our baseline... It's
   always there... it can be overwritten by the AA staff." (L157-163) On which description the
   anaesthetists want, Donald: "that's a layer of hierarchy"; "can the office edit? Yes, they can...
   Claude, please go ahead and update." (L163) Greg: "Then we put it in front of Ben and Vanessa and
   say, do you agree with this hierarchy of selection?" Donald: "Yeah, totally." (L141-143) Settled
   between Donald and Greg, to confirm with Ben and Vanessa. The hierarchy uses the hospital's
   description whenever one arrives, not only when the hospital is billed (OQ-103's earlier idea).
   Catalogue: US-08.4.6 and US-04.2.4 start the invoice description from the Contract line's
   description, otherwise the Booking's. No hospital layer; US-08.4.6 does not say the office can edit
   it and still calls the RVG-only case open (OQ-103). US-03.1.9's body and the domain model (the
   Procedure's invoice description and the glossary row) also give the two-layer order, and US-03.1.9's
   notes still call the RVG Contract wording open, with the hospital's description only "when the
   hospital is billed".
   Not raised with Ben and Vanessa on 27 October, so AA's confirmation is still to get.
   Donald, 4 November: confirmed for now, with the Contract line's invoice description where one is
   filled in (point 87).
4. **Prepaid price when the Contract changes before the procedure: still for Ben and Vanessa
   (OQ-104).** Donald read it: "Previously we had this established thing where we'd said that the price
   for a procedure is determined on the day the procedure is done. But if it's prepaid, what do you do
   then?... we need to ask them." (L163)
   Answered 27 October by Ben: the prepaid price is honoured ("You would honour the money that's been
   prepaid", 27 Oct L25; Notes 2026-10-27 · AA meeting with Ben and Vanessa #1); Vanessa was not asked;
   see also OQ-104's answer of 29 October. On 28 October Donald and Greg recalled Ben's answer ("the
   deals are deals", 28 Oct B L47), and the related case of a Contract changed to a non-prepaid one
   after payment came up, now OQ-119 (Notes 2026-10-28 · AA meeting with Greg #56).
5. **A surgeon's agreement is held by the individual surgeon, and one Contract can be linked to many
   surgeons (OQ-105).** Greg: "I've checked with Vanessa. It's always the individual surgeon. We don't
   have arrangements with rooms"; not supporting a grouping is "potentially problematic in the long
   term... but it's not required." (L168-176) Contracts are filtered to individual surgeons: "which is
   why we changed that field to practitioner ID so that we can identify the surgeon or the anaesthetist
   related to this procedure." (L178-180) Vanessa "sets them up by the list", so a rooms with 8 surgeons
   and 14 prices becomes "14 times 8" (L186-190). Donald: "you would set up a single contract and attach
   it to multiple surgeons." Greg: "Yes, yeah, that would work"; "You'd have to put another table in
   that design to just allow you to have many surgeons to a contract." (L194-200) Donald: "Claude, just
   to make sure you heard Greg, we think we want to try and support that and you may need to update the
   database relationships to support it." (L202) Where it is offered: "the system isn't really ever
   doing any suggesting... It doesn't suggest, but it does filter", with "some sort of override button"
   to remove the filter "and just look at the whole... list just in case" (L202; point 18).
   Catalogue: OQ-105's answer (28 October) and its 29 October update hold this: individual surgeons,
   one Contract linked to one or more surgeons, picked from a filtered list (US-04.3.2, US-04.1.5, the
   domain model). That update calls the one-to-many link Donald's decision; this meeting shows Greg
   agreed to it on 23 October and gives Vanessa as the source of "always the individual surgeon". The
   show-all override is not in the catalogue.
   Revisited 28 October: Donald restated it ("we talked about this the other day... you apply it to
   individual surgeons", 28 Oct A L935); Greg, on the v6 filter by practitioner ID, found one-to-many
   means "the select gets a lot more complicated" but "we might build it into the theoretical model"
   (28 Oct A L945-949; Notes 2026-10-28 · AA meeting with Greg #5 #46). One Contract for many surgeons
   stays Greg's proposal, held.
6. **No contract (RVG) carries no lines: it only means bill the patient (OQ-106).** Donald read the
   recommendation ("Not in the first release. Keep no contract [(RVG), heard as "line"] without any lines...
   When you pick an RVG, no contract, there's no predefined base units, no predefined anything"). Greg: "That's right...
   Basically, all it's doing is saying, bill the patient." Donald: "The patient will be billed or their
   guardian." (L202-213)
   Catalogue: OQ-106 is answered the same way. It was closed in commit 7cd78025 on the 14 and 16
   October evidence, without this meeting, where Donald and Greg agreed the recommendation; US-04.3.3,
   US-04.2.4 and FT-04.3 cite OQ-106 but not this point.
7. **The internal booking model is for the development team; Greg backs our canonical model (OQ-110).**
   Donald read the question (FHIR R4 inside the system, or our own booking, patient and practitioner
   model with a translator per source; the RFP holds FHIR, our response proposed our own). Greg:
   "That's because I've always agreed with your response... it just made a lot more sense." (L240-249)
   Donald: "at this stage, I guess the answer is the dev team will decide." Greg: "Yes." (L251-256)
   Donald: "the prototype should do whatever's easiest. The prototype doesn't need to bend over
   backwards to support FHIR if it's just really trying to display an experience." (L258) Settled.
   Catalogue: OQ-110 and US-14.2.1 say the choice is undecided; FT-14.2 links to the internal booking
   model.
8. **Anaesthetists are paid from Xero; Xero does the banking in and out (OQ-111).** Donald read the
   "already settled" line ("Trust payments to the anaesthetists made from the new system"). Greg:
   "Still, I don't agree with that... The intention was to pay the anaesthetists from Xero." Donald:
   "That makes sense to me." Greg: "Xero, if you want an elevator pitch, Xero does the banking in and
   out." (L258-268) Donald: "Our system creates all the entities in Xero and pairs them up so we can
   track them"; it creates "the pairs of receivable and payables in our system, and then create[s] the
   same pair in Xero... Xero does all of the payments. Our system is checking all of its work."
   (L270, L286) Why there are two ledgers is point 19. Donald: "So this is question 111. And so I think
   that should make it clear." (L301) Agreed between Donald and Greg at the time; part of the payment
   model, held as a proposal (Donald, 4 November), so OQ-111 is not changed.
   Catalogue: OQ-111's "already settled" line (from 24 and 29 September, older) says payments are
   made from the new system; this meeting overturns it. US-09.2.4 already has the anaesthetist's
   payable paid in Xero's payables run. The 28 October update leans the same way and did not say who
   makes the payment (Notes 2026-10-28 · AA meeting with Greg #8 #47 #62 #64); its rule that payments
   out of the holding account are made from the system, not by hand outside it, reads as consistent
   with this.
9. **An anaesthetist moving their own List sees colleagues by availability, not by tier (OQ-113).**
   Donald: "No, they don't see that. They just search for people who are free and available." (L301)
   Catalogue: OQ-113 is answered the same way (its board answer, and the typed decision of 29
   October). US-01.3.6, US-01.4.2, US-01.4.5 and US-01.4.7 carry it, citing OQ-113 only; US-01.4.5
   dated it 29 October. The board answer is dated to this meeting (point 90).
10. **Insurers are just contract holders; nib is the only one AA bills directly (OQ-114).** Donald: "we
   know right now that nib is the only insurance company that AA bills directly." Greg: "Yes."
   (L316-318) Greg: "a contract is a child of a contract holder... it would typically be a hospital, but
   it could be nib. I'm not sure that we recognize insurer as an entity in the model at the moment"; "If
   we're not billing them directly, we don't care." (L326, L342) What differs is delivery: "one instance
   of a contract holder that we want to send stuff to a portal", the rest emailed; the billable party is
   "a name and an email address" (L350-356). Donald: the front end is to "choose who the billable party
   is going to be and it's nib and the particulars need to be worked out." Greg: "potentially maybe how
   that billable party is transmitted the information. Is that a characteristic of the bill[able
   party]?" (L360-362) Donald: "I think that answers 114." (L367)
   Catalogue: the 28 October meeting took the same line, insurers as holders with an output flag on the
   holder or billable party, the insurer feature retired, and left open what the other outputs are
   (Notes 2026-10-28 · AA meeting with Greg #3 #40; OQ-114's update). That nib is the only insurer AA
   bills directly is not recorded. EP-11, FT-11.4, US-11.4.1 and US-13.4.1 carry the insurer-as-holder
   line, citing 28 October only.
   Greg's question whether delivery is a characteristic of the billable party (L360-362) was taken up
   on 28 October as a flag on the holder or billable party for the output of its invoices ("We will
   need a flag on billable, on contract holder or billable party", 28 Oct A L775; Notes 2026-10-28 · AA
   meeting with Greg #3); Donald cites this meeting there ("you and I talked the other day about...
   a tiny little address book", 28 Oct A L749). How a claim reaches nib's portal is still unknown (28
   Oct A L761). Part B uses "patients and contract holders" where the story said insurers (28 Oct B
   L925; Notes 2026-10-28 · AA meeting with Greg #71).
11. **Cancelled prepayment refund: one trust account, run through Xero (OQ-115).** Greg: "There's only
   one trust. Xero is operating on the trust account." There will be "an account in Xero called AA
   prepayments", with a balance "like a debtor... all the money's in one bank account, and you can
   analyze it by the people", where prepayment money goes in and out (L369-381). Donald: "That's 115
   answered." (L386)
   Superseded by Notes 2026-10-28 · AA meeting with Greg #47 #62 #63 #64 and OQ-115's answer: the AA
   Holding account is a creditor in the payables sub-ledger, not a Xero ledger account and not a
   debtor; payments out of it are made from the system, and cancelling raises the credit or refund
   automatically. One trust bank account still holds. Greg corrected this on 28 October (Part A): the
   holding account "is not a bank account or a Xero ledger account... it's the equivalent of an
   anaesthetist" (28 Oct A L963-967); in Part B, "It's not a ledger... It's actually a creditor" (28 Oct
   B L475). The part about Xero doing the banking in and out for a refund was not revisited (Notes
   2026-10-28 · AA meeting with Greg #8 says whether the refund is paid through Xero was not
   discussed; it was, here).
   Payment model, held lightly: recorded only.
12. **A prepaid Procedure gets no post-procedure invoice; a mixed Booking does (OQ-116).** Donald: on
   a mixed Booking, "do I see a line item for the prepayment at a cost of 0... or is it completely not
   visible in that invoice?" Greg: "You don't get a post-procedure invoice." Donald: "If it's mixed, you
   do." Greg: "If it's mixed, you do. You need to check with Vanessa." Donald: "My understanding is you
   don't see it." Greg: "we're neutral, right? We're just providing a mechanism." (L438-452)
   Catalogue: OQ-116's answer (prepaid Procedures are left off; a mixed Booking is invoiced for its
   not-prepaid Procedures only, US-08.2.2) agrees, and was settled later (Notes 2026-10-28 · AA meeting
   with Greg #7 for a prepaid Procedure; the typed decision of 29 October for a mixed Booking). The
   board answer is dated to this meeting (point 90).
   On 28 October Donald raised the prepaid line again, unsure whether it had been answered ("I'm not
   sure if he had an answer for this or not", 28 Oct A L985), and the mixed-Booking exchange here was
   not carried into that point (Notes 2026-10-28 · AA meeting with Greg #7 says a mixed Booking was not
   named). Part B confirms no new invoice in the normal case (28 Oct B L383-387).
13. **Changing a prepaid price: Greg for an automatic invoice or refund of the difference (OQ-96,
   OQ-117).** Reading US-06.4.1, Greg: "this conflicts with the last conversation we had": "the
   anaesthetist may alter that at that time of the procedure if he chooses to. And that would
   automatically trigger a refund of the difference or a bill for the difference" (L400-408); "It's in
   the document I uploaded" (L424). Donald restated it: a flag on every Contract says whether a price
   override is allowed, a fixed-price Contract normally not; BTM units may be recorded on a fixed-price
   Contract but "it gets ignored"; if such a Contract allowed an override and the anaesthetist used it
   on a prepaid Procedure, the system "should pick it up and automatically invoice." Greg: "Yes."
   (L410-436) Donald: "I can see our system totally supporting this, but it feels a bit gross to me";
   "I can't say whether or not that's right." (L422, L438)
   Superseded by Notes 2026-10-28 · AA meeting with Greg #1 (prepaid Contracts are not editable; any
   difference is a second invoice or credit raised by hand, Ben's answer) and OQ-117's 29 October
   updates (a fixed fee never allows the anaesthetist's price override).
   Greg held the same position on 28 October. In Part A Donald opened OQ-117 asking Claude to use this
   conversation (28 Oct A L135); in Part B Greg again cited "version six" of the design document (28
   Oct B L303) and said "Ben's chasing automation" (28 Oct B L423), until Donald put it to Ben by phone,
   who wanted rare exceptions raised by hand ("a rare event can have some manual input", 28 Oct B
   L695), after which Greg agreed prepaid Contracts should be not editable (28 Oct B L773; Notes
   2026-10-28 · AA meeting with Greg #2 #59 #60 #61).

## Insurance details on a Booking

14. **Two fields on the Booking, no insurer master; the Contract decides who is billed.** Greg: "the
   concept of an upstream insurer is adding confusion... there is a booking... two pieces of information
   which may be blank"; "So there's no concept of a master." Donald: "I think I clicked on the wrong
   story here and that was referring to the direct insurer payment thing." (L43-57) Greg: "we're still
   very contract and patient-centric... we behave according to what information is provided" (L59-67);
   a Contract "sets up a billing method, if you like, or channel. So some contracts are direct, some are
   insured, some are not insured... It's acting as a control mechanism." (L75)
   Catalogue: US-11.4.3 holds both as fields on the Booking ("it's just fields on the booking", Notes
   2026-10-28 · AA meeting with Greg #4); the insurer master list was retired on 28 October (#40).
15. **Why the warning: the wrong party keeps being billed.** Greg: "we're always billing the wrong
   party. It's causing a lot of hassle and work": an invoice to a hospital "when the insurance hasn't
   been approved" or to a patient "when the insurance has been approved" (L79). Donald: in the second
   case the patient may pay and claim back; Greg: "It depends if [the] hospital is acting as the agent
   for the insurer... not every hospital acts as an agent for the insurer. I don't think Christchurch
   acts as an insurance agent. They might, not sure... you get these sort of combinations that are
   effectively invalid... And we're trying to trap these invalid combinations." (L85-95)
   Catalogue: OQ-93's background has the wrong party billed (14 October); the hospital acting as the
   insurer's agent is already in US-07.2.2's notes (to draw out with Vanessa) and the domain model's
   is_billable_party row; that not every hospital acts as agent (Christchurch perhaps not) is new.

## Invoice descriptions

16. **A Contract line's description, like an agreement's invoice line text.** Before Greg's hierarchy
   (point 3), Donald floated that at invoice time "maybe the admin staff have to pick a text from the
   possible available options" (L123). He then showed a time and materials agreement in Stratos's own
   tool, with a field "description of invoice line item": "I would imagine that our contracts could have
   a line in here that if filled in, applies a description to the invoice." Greg: "That's right."
   Donald: "if it is not there, then we kind of fall back to other things like you have just
   described." (L143-147)
   Catalogue: US-04.2.4 already gives a line an optional description that becomes the invoice
   description.

## Surgeon agreements and the Contract list

17. **How the office works through the Contract list for a Booking.** Donald: "we'd never show them
   another surgeon's contract or another anaesthetist's contract, but we might show other hospital
   contracts." (L182) Greg: "a booking comes up... we go through to see if we can find any matching
   contracts... So we've always got the default contract there. There might be some hospital contracts
   there... And then we look to see if we've got any, it could be a plastic procedure." (L184)
   Catalogue: US-04.3.2 filters by holder and practitioner ID with No contract (RVG) offered first
   (US-04.3.3).
18. **An override to show the whole Contract list.** Donald: "we probably need some sort of override
   button for any sort of situation where you want to remove that filter and just look at the whole [rule, as heard]
   list just in case. Weirdness." (L202) Greg did not comment.
   Catalogue: not in US-04.3.2 or elsewhere; a new requirement.

## Xero and the two ledgers

19. **Two ledgers: Xero is patient-centric, the system anaesthetist-centric.** Greg: in Xero "we're
   really interested in who the billable party is and have they paid", whereas the internal ledger is
   "the same list... but it's inverted to be anaesthetist-centric" (L276-280). "The reason why we need
   two systems is because Xero doesn't architecturally allow for these two perspectives of what's
   outstanding": Xero lists billable parties that have not paid; the system lists "what anaesthetists
   haven't been paid. It's the same total figure, but it's a different part." (L288-292) "Xero can't
   handle both. If it could, we wouldn't need to do it." (L296) Both "have to balance" (L284). Donald:
   "our system is the system that we use to actually understand that data and scope it to different
   people." (L294)
   Catalogue: the domain model has the internal ledger as the system of record and Xero as the AR and
   banking service; the anaesthetist-centric and patient-centric reason is not stated.
   Revisited 28 October, Part B: Greg walked the control accounts and sub-ledgers (28 Oct B L585-603)
   and wants the balance proved before each payment run ("If they don't balance, stop", 28 Oct B L851;
   Notes 2026-10-28 · AA meeting with Greg #63 #64). Held lightly, like the rest of the payment model.

## Prepayment accounting

20. **Every cent in the trust belongs to someone.** Greg: "how are we going to get Xero and everything
   else to actually manage a prepayment? Will we need a second bank account?... if money is put into
   the trust, it's held on behalf of an anaesthetist... every cent in the trust is allocated to a
   party." (L459-463) Donald: "when we send out a prepayment invoice, the receivable invoice goes
   directly to the patient to pay, and the payable invoice to the anaesthetist is drafted... already
   earmarked against somebody." (L465)
   Donald's account is the model before OQ-80, which had put the payable on the holding account on 19
   October (EP-06, OQ-80). Superseded by Notes 2026-10-28 · AA meeting with Greg #47 #49 #62 #63: the
   prepayment's payable credits the AA Holding account, a creditor, and a second pair moves it to the
   anaesthetist who did the work; no second bank account. In Part B Greg separated the two: "Don't
   confuse a holding account with a trust account. So a trust account is a bank account" (28 Oct B
   L467). Payment model, held lightly: recorded only.
21. **A prepaid Procedure moved to another anaesthetist in advance.** Donald: "we reassign that draft
   payable to somebody else, or [it] gets deleted and a new draft payable is created against the new
   anaesthetist. And we know that the rules are already that... the new anaesthetist that picks it up by
   default honours the previous price." Greg: "Okay, that's fine." (L469-471)
   Catalogue: the honoured price stands (US-06.5.4; Ben, Notes 2026-10-27 · AA meeting with Ben and
   Vanessa #2). The reassigned payable restates OQ-70's answer, which OQ-80 had already replaced on 19
   October (EP-06); Notes 2026-10-28 · AA meeting with Greg #57 #62 #67 and US-06.5.4 keep that: the
   payable is the AA Holding account (Greg: "The draft payable record is AA holding account", 28 Oct B
   L457), so nothing moves in the ledger. Whether the prepayment invoice names the anaesthetist, which
   a move would otherwise turn into a notice of change ("do we have to send a notice of a change of
   anaesthetist?", 28 Oct A L1103), is a question for AA (Notes 2026-10-28 · AA meeting with Greg #53).

## Statuses on the board

22. **Agreed with Greg; Confirmed only when AA confirms.** After the break, Donald: "I've changed the
   statuses to everything you and I did to agreed. And then confirmed will be when actually it's
   confirmed with AA themselves." Some statuses "are all synonymous" and could be combined, and the
   contract items have "probably got some bad statuses" (L480).
   Catalogue: the recode is in changes/2026-10-20-status-recode.md and board.config.json (Agreed:
   "Agreed with Greg, not yet signed off by AA"; Confirmed: "Signed off by AA").
23. **The board renders tables.** Reading US-04.1.1, Donald: "Feature request... User story has a
   table, but the [requirements] board doesn't see [it]." Greg: "Support display tables." Then: "Hey,
   look at that table displayed." (L490-494) A board feature built during the session, not a
   requirement.

## The Contract catalogue

24. **EP-04 read: prepaid is a Contract setting, and a Contract may belong to many surgeons.** Donald
   read the epic: a Contract "is set up from a few settings, who's billed, whether [the] anaesthetist
   can change its price, whether it's prepaid. Yes, yep, previously it wasn't that way", "And whether it
   belongs to one anaesthetist or surgeon. And we've said now, actually, that's one or many." (L482)
   No change raised.
   Catalogue: EP-04 still says "whether it belongs to one anaesthetist or surgeon", narrower than one
   or more surgeons (OQ-105, 29 October).
25. **FT-04.1 agreed.** Greg: "Contract catalog. Every contract holder and every contract. Yeah,
   that's fine." Donald: "Contract screens are needed from the first release... Correct. So we've
   agreed on that." (L486-490)
   Catalogue: FT-04.1 reads as read.
26. **US-04.1.1 read: no categories, and the system is permissive; "one simple table".** Donald, on No
   contract (RVG): "that's the default one. This is the common, but there's no reason why somebody
   couldn't set up an RVG that also, for whatever reason, is different." (L494) Greg: "So there's no
   ecosystem of supporting tables here. It's just one simple table with some settings in it. Does
   everything... Which is nice if we can get away with it." (L496-500)
   Catalogue: US-04.1.1 matches and is already newer on the price-change flag (never on a prepaid
   Contract, OQ-96; never for a fixed price, OQ-117). Its setting "whether it belongs to one
   anaesthetist or surgeon" is narrower than Donald's reading here ("or many as we've determined now",
   L494), as in EP-04 (point 24); held with the Contract model.
27. **Drop the Contract review date everywhere.** Reading US-04.1.2 ("a start date and if needed an end
   date. And a review date"), Donald asked whether it was the one discussed; Greg: "No, it's new."
   Donald: "I think the concept of a review date is not a concept that any part of a system should
   support. So Claude, can you, when you read this transcript, make a note to just review all of the
   requirements and make sure this concept of review date is actually removed, unless you have a good
   reason to raise it up again as a question." (L502-509)
   Catalogue: US-04.1.2 (its text and the criterion "a start date, an optional end date and a review
   date") and US-04.2.10's notes ("start, end and review dates") still carry it.
28. **How Contracts are versioned is for the design; the price history must show.** On "A price review
   creates a new dated version", Greg: "I'm letting Claude work out the mechanics of how you version
   contracts." (L509-511) Donald pictured one Contract with "price bands you could define... So you
   could see the history of the price as it changes" (L513). Greg: a change is usually "a price change
   or... an addition to a schedule... It's not deleting anything. You should be able to show the
   history... you should be able to go to Christchurch [Eye] and see all the [dated] prices for a given
   procedure." (L515) Donald, on the rest of US-04.1.2 and its staging paragraph: "I think you and I
   are agreed on this." (L517) Points 55 to 62 and 69 take the dates further.
   Catalogue: US-04.2.10 and US-04.1.3 keep every version. Seeing all dated prices for one procedure
   under a holder is not stated.
29. **US-04.1.3: reword "RVG group", and an invoice is reproduced from the Booking.** Donald: "Every
   create, update, retirement of an RVG group. I don't know if we really have a sense of an RVG group
   anymore." Greg: "it means you can do an incremental update." (L517-519) On "an invoice raised under an
   older version can always be reproduced", Greg: "I think that's actually redundant because you can
   recreate the PDF just from what's stored on the booking." Donald: "the system should have some other
   way of just restor[ing] it... Claude, maybe just update the wording a little bit, but in essence we
   agree with this." (L521-525)
   Catalogue: US-04.1.3 still audits "an RVG group, a contract holder or a Contract" and ties
   reproduction to Contract versions; US-08.4.4 holds reproduction as keeping the invoice's "recipe".
   RVG groups remain published master data (US-05.1.1).

## Contract reference codes

30. **Holder codes are for reference and search, with no uniqueness check.** Reading US-04.1.4, Greg:
   a holder's codes are "not using those as our primary" (L527). A hospital may do one procedure as a
   DHB or an ACC procedure: "they're going to give us two contracts which have the same item number in
   them that are current at the same time... With the same validity dates." (L546-566) Donald: "in our
   system, we have no validation to make sure codes are unique or anything like that. We just take what
   they give us and we attach it as we need to." (L568) Greg first suggested "unique within a contract,
   just to make sure it's not duplicated", then "It's too hard" (L570-578). Codes are for search:
   "you just type it into search to help you find something." (L584) Greg's remaining concern: on one
   Contract, filtered to the lines valid now, "I shouldn't see a code twice." Donald: "on an edit
   screen, you see it all. But on a screen where you're selecting a contract, you wouldn't see multiple
   prices. You only see the price that's relevant to your current time." This rested on Donald's
   dated-lines picture, overtaken at point 69: under the model reached there only the version in force is
   shown, but a code repeated within one version would still show twice. Whether to warn of a duplicate
   line, Donald: "I don't think so... We are agreed." (L586-608) Point 49 is Donald's request.
   Catalogue: US-04.1.4 and US-04.2.4 make the holder's code "unique within the Contract", and
   US-04.1.6 lists "duplicate codes" as an error that blocks submit; the domain model (the contract
   line's reference code row and the glossary's Reference code) still has it too.
31. **Contract schedule upload: for the future, depending on OQ-100.** Reading US-04.2.13, Donald:
   "This one's for the future... I think this is up for contention because of this open question here.
   And once that's answered, it can be changed." (L608)
   Catalogue: US-04.2.13 is Proposed with OQ-100 open.

## Contract holders and billable parties

32. **A billable party shared by many Contracts is "not unusual".** Reading US-04.1.5 ("one billable
   party may serve more than one holder, which is unusual"), Greg: "The billable party might be the
   hospital, right? So there'll be dozens of contracts and they all have the same billable party."
   Donald: "That doesn't sound unusual." Greg: "We're saying that it's not unusual." Donald: "It's
   not." (L613-623) Greg agreed the holder and the billable party are distinct: "That should be a
   distinction." (L617)
   Catalogue: US-04.1.5 still says "which is unusual". Greg's example is many Contracts sharing one
   billable party, which one holder with many Contracts already gives; the 28 October meeting, later,
   says "Normally it's a one-to-one relationship between the contract holder and the billable party"
   (Notes 2026-10-28 · AA meeting with Greg #33). The two readings differ; flagged.
33. **Make holder, billable party and payer clear in the artifacts, with a visual.** Donald: "Claude, as
   you hear this conversation, please note down a requirement to update artifacts to make the
   distinction between these languages clear and maybe some sort of visual to help with it." (L623)
   Superseded by Notes 2026-10-28 · AA meeting with Greg #29: Donald made AR-44 for this and walked it
   with Greg.
34. **Contracts need filter settings; No contract (RVG) shows everywhere.** Donald: some Contracts are
   filtered to a hospital, others to a surgeon; "no contract is not filtered against anybody. So it
   shows up everywhere. There basically needs to be some filter settings on a contract." (L623)
   Catalogue: US-04.1.5, US-04.2.1 and US-04.3.2 hold the practitioner link and the filtered list;
   US-04.3.3 offers No contract (RVG) first.
35. **Matching a Booking to a Contract is the human step that sets the billable party.** Greg: the
   admin is "associating a contract with a booking, and that's the human part, and that's what creates
   who the billable party becomes, because it's defined in the contract... it's something that Ben
   isn't quite [clear on] in his head... as to how the mechanics of that works." "And then they find a
   contract that actually matches." Donald: "Or make one to serve it." (L625-631)
   Catalogue: US-04.2.1 ("The Contract decides who is billed") and FT-11.2 ("the Contract alone decides
   who is billed", Notes 2026-10-28 · AA meeting with Greg #29); US-04.1.2 lets the office create a
   Contract.

## Suggesting Contracts and maintaining schedules

36. **Later: suggest the Contract from booking history.** Greg: "That's the bit I think we could have
   put some AI in because when we've got some history, there'll be patterns... we can add it as a
   feature down the road." Donald: "maybe we record this as a future requirement": with a year or two
   of data, when "this surgeon or hospital submits this... plain text description... nine times out of
   10... it always ends up being this particular contract." Greg: "So we should be able to suggest a
   match at that point." (L636-640) Greg calls a known default RVG code on a line "another AI thing that
   we're going to get better and better at" (L866).
   Catalogue: no story suggests a Contract; OQ-106's answer notes the same idea for RVG codes as "an
   idea for later, not a requirement now". A candidate future requirement.
37. **Stage and submit (US-04.1.6) and the upload (US-04.2.13): both listed and priced; AA decides.**
   Greg pictures "a contract maintenance screen" with "an on-screen edit mode that lets you do anything
   you need to do with contract holders" and the rest (heard as "global parties, contract clients"),
   where "they could upload a list, otherwise they just type it in by hand." (L644) Donald: the two stories "are both
   trying to answer the same thing"; a spreadsheet upload the office reviews "feels to me like a cheaper
   way than... a whole robust set of UI UX to do the same thing." (L646-654) Greg: "I don't think it's
   our job to work out what we think should be in or out... they should be priced and then David [as
   heard] can have a conversation with Ben and Nick and go, if you want this, it's going to cost that
   extra." (L656-660) Donald: "we don't know which of these is going to be in, but we know at least one
   of them needs to be... some safety mechanism to make a bunch of changes at once and review them
   together and accept them." (L666) Greg: "the system actually isn't able to run without something in
   the top." (L668) Donald: "I'll put them both up here and mark them both as... proposed... But both of
   them kind of rely on that conversation with Ben and Vanessa." (L673)
   Catalogue: US-04.1.6 and US-04.2.13 are both Proposed; OQ-100 is open. The overlap, and that at
   least one is needed, are not recorded.

## Contract definition and lines

38. **A line is a single procedure, not a group; a Contract is a set of lines.** Reading FT-04.2 ("lines
   set the terms for a group of procedures, for example cataracts"), Donald: "We don't really have any
   group of procedures, right?" A Contract is "a unique code of AA1234... given a human written name...
   a handful of settings"; "our system has no concept of group these things together... So that feature
   4.2 needs to be updated." Greg: "It's a single procedure." Donald: "I do agree." (L673-689) Greg:
   "Contract line defines a singular procedure. The contract is a set of lines." (L691) His example:
   Christchurch Eye's one-page schedule: "that's the contract... there's the header information...
   its start date and its end date and... that it's from Christchurch Eye... and then under that...
   there's a schedule of prices; those are the contract lines." (L695) Again on US-04.2.4, Greg: "The
   group thing is going to introduce all sorts of confusion." Donald: "Each line sets terms for just a
   procedure." (L797-808)
   Catalogue: FT-04.2, US-04.2.4 and the domain model (its "Procedures and Contracts" paragraph and its
   glossary row for Contract line) still say "a group of procedures".
39. **A Contract with no lines is a plain RVG Contract; Donald wants RVG or fixed price as a clear
   choice.** Greg: a Contract "may have no lines... what it effectively has is a reference code... the
   hospital may just want that reference code on the invoice"; "It may just be the header that says,
   here's a contract for ACC procedures and we want you to use this code on those invoices... And that's
   an RVG contract." (L703-719) Donald: "there are a handful of options on a contract which are
   optional, like rate or discount or can it have a price override... but it needs to at least have a
   fixed price or RVG be selected"; "it needs to be like an either or radio in my head... RVG pricing at
   which point... the anaesthetist is forced to pick an RVG code... or is it a fixed price." Greg: "if
   there are no lines... There's no fixed price"; "The logic of defining that is, are there any lines
   on this contract?" Donald: "How it works in the background, I don't mind, but I'm just thinking about
   the front end." (L721-733)
   Catalogue: US-04.2.2 prices a Contract with no terms, or no lines, as RVG units times the
   anaesthetist's unit value (OQ-98). An explicit either-or choice on the screen is not stated; a design
   matter.
40. **A "practitioner contract": permissive, and possibly filtered on surgeon and anaesthetist
   together.** Reading US-04.2.1, Donald first held that an anaesthetist's Contract should not apply to
   several anaesthetists, "price fixing", then accepted the system being permissive: "So you think we
   should just allow them to do it? Okay, that's fine." (L733) Greg: "we're not distinguishing a surgeon
   from an [anaesthetist]... it's a practitioner contract." Donald: "Practitioner contract is a good term
   there." Greg: "One's internal, one's external." (L735-739) Donald: "in theory they could filter on
   both... You're the surgeon, I'm the anaesthetist. And it only shows up when both of those are true...
   Mates rates, but maybe... So practitioner filters." (L745)
   Catalogue: US-04.1.5 and US-04.2.1 link a Contract to "one anaesthetist" (own list) or one or more
   surgeons by practitioner ID. An anaesthetist's Contract linked to several anaesthetists, and a
   Contract filtered on both, are not stated; "practitioner contract" is not a catalogue term.
   The competition-law theme came up again on 28 October on US-05.2.1: Greg, "while the anaesthetists
   may not collude with each other, they may accept a price offer from a vendor" (28 Oct A L99), and the
   Commerce Act wording was removed (Notes 2026-10-28 · AA meeting with Greg #15 #77); whether one
   Contract may serve several anaesthetists was not ruled on. Greg's "practitioner contract" is the
   basis for the 28 October ask that a surgeon's agreement use the same mechanism ("we changed
   anaesthetist ID to practitioner ID because we can use this exact same mechanism for surgeon's...
   arrangements", 28 Oct A L885-889; Notes 2026-10-28 · AA meeting with Greg #46).
41. **No billable party means the payer on the Booking; whether a billable party entity is needed is
   for the developers.** Greg: "I'm assuming that's when the billable party is null, then it just goes to
   the payer." (L747) Donald: the system "has an address book of people who can hold a contract... if you
   don't [pick a holder] then... [it] falls back to the payer's name on the booking", shown as "some
   dynamic entity... the patient or the payer named on the booking." (L757, L765) Greg: "I've been
   thrashing around about whether the contract holder is always the billable party, because if they are,
   then you don't need a billable party entity... Might not need billable party... Don't we let the
   developers sort that out?" (L759-763)
   Catalogue: US-04.2.1 and US-04.1.5 keep holder, billable party and payer apart, and the 28 October
   meeting (later) has a holder flag "has billable party or not" (Notes 2026-10-28 · AA meeting with
   Greg #29 #33). Greg's doubt does not change that.
42. **US-04.2.1: "surgeon", not "surgeon's rooms"; agreed.** Donald: "the surgeon, not surgeon's rooms,
   it needs to be updated, Claude, anaesthetist or surgeon a contract belongs to." Then "mark it as
   agreed." (L765)
   Catalogue: US-04.2.1 already says a Contract is held against individual surgeons, though it may be
   named for their rooms (OQ-105, 28 and 29 October, later). The change reached US-04.2.1 (credited
   there to OQ-105 and Donald's typed decision of 29 October) and EP-04's holder list in commit
   7cd78025; EP-04's text edit is credited to nothing and is not in that run's change log. AR-44 is
   point 89.
43. **Pricing terms: fixed price, rate, discount, or the RVG approach; no base or modifier units on a
   Contract.** Reading US-04.2.2's "base or modifier units of its own", Donald: "So we're saying no,
   right?" Greg: "An RVG method is one of the options." (L765-767) Donald: "I'm going to remove the RVG
   units here because I think it was previously trying to communicate an idea that contracts could hold
   predetermined base units or modifiers... when a contract defines that an RVG is being used, then an
   admin or an anaesthetist needs to pick an RVG code and that code will determine a base unit or maybe a
   range of base units." (L769) Greg: "for completeness we should put that in... rather than just saying
   RVG, which might imply putting the units in, it's just using the RVG approach... that then is your
   comprehensive list of the ways in which you can price them." (L771-775) Earlier, Donald: "Base or
   modifier units are gone." (L713) Reading US-04.2.4's terms: "a rate, a discount, and then here, based
   on modifier units, no." Greg: "if you're gonna specify them, you should always put all three,
   otherwise you should just put pricing fields." (L872-878)
   Catalogue: US-04.2.2 (its list and the "Units" criterion), US-04.2.4 and FT-04.2 still list base or
   modifier units as a line term, as does the v6 field list in US-04.2.4's technical discussion, and
   US-04.2.2's note ("a Contract line can state its own"), and the domain model (the Contract line
   table's base and modifier units row, the billing-context row, the section 3 calculation block and
   the glossary row for Contract line).
44. **The price override flag, and the office changes any price.** Donald read the flag on each Contract
   ("I've been calling that price override"), typically allowed on RVG-priced Contracts and not on a
   hospital's own fixed price, "although our system is permissive"; where not allowed the anaesthetist
   changes the Contract or asks the office; "The office can change any price and the last change stands"
   (L777). Greg: "Lock that down if it gets too loose later... in the first instance, that'll be the only
   way they can fix problems before the invoice goes out." (L779)
   Catalogue: US-04.2.2 and US-05.4.2 hold this, with the later, stricter rules: never on a prepaid
   Contract (OQ-96, 28 October) and never on a fixed fee (OQ-117, 29 October). US-05.4.2's note
   credits the agreement to 28 October.
   Revisited 28 October: Greg objects to the word "price" (he prefers "pricing") and to "the only way
   to change a fixed price" (Notes 2026-10-28 · AA meeting with Greg #19 #21); Part B confirms the
   office can change any price regardless of the Contract's flag (Donald: "only AA admin staff can do
   some sort of free text price change on any contract, regardless of the rules of the contract";
   Greg first pointed to the Contract's editable flag, then, once Donald set the office apart from
   it: "Agreed.", 28 Oct B L183-197; Notes 2026-10-28 · AA meeting with Greg #59).
45. **Holder references: the holder's own reference, not an insurer member number.** Reading "such as an
   insurance member number or a holder's own reference, for example SXAP", Greg: the SXAP here is "about
   the fact that this whole contract is a Southern Cross contract. It's distinct from the booking which
   details the insurance particulars of the patient" (L783); "this might be the only thing the hospital
   wants and there's nothing else on the contract... It's the contract holder's reference." (L787) On the
   member number, Greg: "No, that's not right." Donald: "So I'm going to delete that." Greg: "And that
   reads properly to me now." (L789-795)
   Catalogue: US-04.2.2 (its text and the "Holder references" criterion) and the domain model's
   requiredBookingInputs row and Procedure billing-context row (insurerMemberNumber) still name an
   insurer member number.
46. **US-04.2.4: lines carry only what they set.** Greg: "carries only what it sets" is "trying to say
   that it's sparse. There's a whole lot of data fields in it which can be sparsely populated... Like a
   price might be blank, discount might be." (L814-818) "Let's keep it simple... it's just words." (L810)
   Catalogue: US-04.2.4 says this.
47. **Drop "starting" from the line description.** Reading "a description which becomes the
   procedure's starting invoice description in place of the booking's description", Greg: "I think we
   should take the word starting out... The booking's description is the starting invoice description.
   And... this becomes, if it's there, it becomes the description." Donald: "a description which
   becomes the procedure's invoice description... in place of the booking's description where the line
   is chosen... and can be edited." (L820-836) See point 3 for the full order.
   Catalogue: US-04.2.4 still says "starting invoice description".
48. **The system line key sentence: Greg finds it confused.** Reading "Each line also has a system line
   key, never reused, which keeps its identity when a new version copies it. A blank means the line does
   not set that value; 0 is a value", Greg: "How can that be?... it's confusing two things here": blank
   pricing fields and "a unique line ID." Donald: "Should I just remove that?" Greg: "Yeah, I think so."
   (L880-890)
   Catalogue: the sentence is still in US-04.2.4. Which part was to go is not clear; the line key is
   relied on by US-04.2.10 (relinking), US-04.2.13 (upload matching) and US-04.1.4, so a rewording that
   separates the two ideas fits better than a deletion.
49. **No validation or uniqueness on holder codes.** On "The holder's own reference code, optional and
   unique within the contract", Donald: "Not unique within the contract... Claude, we're saying that
   none of these additional codes have any sort of validation or uniqueness that need to be applied."
   (L836) Greg: "Did we talk about the duplicate line?" Donald: "on an admin screen, all of these things
   are visible. But on a front end, when you're selecting something, you would only ever see the code
   relevant to the [date range] you care about." (L838-844) See point 30.
   Catalogue: US-04.2.4, US-04.1.4, US-04.1.6 ("duplicate codes" blocks submit) and the domain model
   (the contract line's reference code row and the glossary's Reference code) still have it.
50. **A line's default RVG code stays, optional.** Donald proposed abandoning filtering Contracts by RVG
   code and the reverse (L844-852). Greg: "I don't think so... a contract line might be set up as an RVG
   procedure, but it has a known RVG association. Why wouldn't you put that in if you know it? Ben just
   wants to make it not mandatory." (L846-854) Donald: "So... it's optional." "Great, I love it." (L856,
   L864) It "fills the procedure's RVG code where the line is picked and lets you search by RVG code to
   find the line" (Donald reading, L872). Donald is "not even talking about pre-filling the base units":
   the RVG code carries its own (L870-872).
   Catalogue: US-04.2.4 and US-04.2.11 hold an optional default RVG code (agreed in principle on 16
   October; Ben not yet asked). Greg's "Ben just wants to make it not mandatory" is second-hand. Still
   not put to Ben at the 27 October meeting.
51. **An agreed rate or discount needs a line.** Donald read "Lines stand alone, they do not nest, and
   several lines may share an RVG code... Lines are not only for fixed fee schedules. An agreed rate or
   discount contract has lines too." Greg: "the only way you can put an agreed rate or discount then is
   to have a line." (L892-894)
   Catalogue: US-04.2.4 says this.

## Time bands, date ranges and invoice templates

52. **A digression Donald asked to leave out.** A remark on government DHB contracts with private
   providers carrying a built-in discount, and how a practice might respond, ended with Donald: "let's
   remove that from the transcript. We don't want to dig into that." (L898-919) Not recorded further.
53. **"Time band" means a predefined duration; Donald's "time band" means a date range.** Reading "A
   line has no time band, add-on flag or quantity rule", Donald: "you and I have agreed that beneath a
   contract you would see a handful of different time bands that have prices applied." Greg: "I've been
   calling that date range. You're calling it time." (L923-929) Donald: "Claude, I'm sorry for
   everything I've said in this transcript. We're talking about a date range for prices on contracts or
   perhaps contract lines here. And when... 4.2.4 talks about a time band, this is talking about a
   predefined time period for a procedure. But no contracts presuppose how long it's going to take."
   Greg: "No, they don't." (L935-937) Donald: "As far as we understand contracts... I don't have any
   concept of a time band... Time is an optional recording by the anaesthetist." (L935) So in this
   transcript Donald's "time band" for prices reads as "date range".
   Catalogue: US-04.2.4 already says this. Donald was reading OQ-89's board answer aloud (written 19
   October: "As far as we understand, contracts / contract line don't have any concept of a 'TIME
   BAND'"). "Date range" is not yet a catalogue term.
   Donald also said modifiers are mostly not pre-applied ("just like we don't pre-apply modifiers for
   the most part", L939); refined 27 October: age, and position modifiers pre-selected at zero, are the
   only exceptions (27 Oct L103; Notes 2026-10-27 · AA meeting with Ben and Vanessa #7).
54. **Two invoice templates are enough.** Reading US-04.2.8, Donald: "our system will have some way to
   select... and create different sets of invoice templates." Greg: "We only need, as far as we know, we
   only need 2 templates." Donald: "Agreed." (L951-955)
   Catalogue: US-04.2.8 has two similar layouts (hospital or holder, and patient). It still sets the
   delivery method on the Contract, which the 28 October meeting moved to the holder or billable party
   (Notes 2026-10-28 · AA meeting with Greg #3).

## Dated versions

55. **US-04.2.10: "the from date"; Greg's "version" is the Contract for a date range.** Donald: "Each
   contract is kept as a series of dated versions... Is that right?" Greg: "Yep, that's it, the from
   date." (L955-960) Donald: "each contract has date ranges within it... date ranges can never overlap...
   But it can have multiple date ranges for different time periods." Greg: "I'm associating the concept
   of a version with the contract, the instance of the contract for a particular date range." (L962-964)
   Catalogue: US-04.2.10 and the domain model hold a Contract as a series of dated versions.
56. **A new Contract for each period: "Full replacement's never going to work."** Donald recalled
   reading Greg as making "a whole new contract" for each period. Greg: "I've gone off that idea, by the
   way. I don't think it's going to work... Full replacement's never going to work." (L966-968)
   Catalogue: consistent; the catalogue keeps one Contract with dated versions.
57. **Donald's whiteboard: one entity per procedure, with dated prices.** Donald: "there's one instance
   of this particular procedure... you would see this date range to this date range, and then this
   price." Greg: "it breaks the conceptual model of the contract having children. So that thing on the
   right is [a] contract line, right?" Donald: "Each one of these is a line." (L970-976) Donald kept the
   settings on "the contract as a whole" and a price per date range; Greg: "Yes, I'm with you." (L978-992)
   Overtaken in the same meeting by point 64.
58. **Year to year, a holder's schedule adds, changes and drops lines.** Greg: "we get a contract from
   Christchurch Eye for the year... another contract from Christchurch Eye for the next year... the 27th
   contract will have some new lines, some existing lines that have got different prices on them and it
   will have some lines removed." (L996-1000) Donald: "some things stay the same, some things are
   updated, some things are changed." (L1002)
   Catalogue: US-04.1.6's review dashboard counts lines added, altered, removed and unchanged.
59. **Donald asks to reword US-04.2.10 as "a new date range within a contract".** Donald: "we're not
   actually creating a whole new version... We're creating a new... date range within a contract to say
   what particulars apply just to that date range. Could be a different code, certainly would be a
   different price... 4.2.10 needs to be updated a little bit." (L1002) Greg agreed nothing can be
   backdated: "we can't back date a contract from today." (L1004) Donald left the story open "to read it
   again after some updates to the language." (L1006)
   Overtaken in the same meeting by point 64 (the date is on the Contract); the "date range within a
   contract" rewording is not needed, but Donald left US-04.2.10 open for a reread after language
   updates (L1006, L1298; point 85) and did not understand its "The date has no default and is never in
   the past" ("I don't understand what that's saying", L1278).
60. **One date range in force at a time, and no gaps.** Greg: "Only one date range can be valid at every
   one moment in time, can't it?" Donald: "Yes, that's correct." (L1004-1006) On a possible gap between
   two dated ranges, Greg: "we're not going to do [them] any favours if we let them fall into those sort
   of holes. So it should manage full coverage of the date range." Donald: most price lists will be
   open-ended, "But I agree that the system should not allow a gap... they could try to, but [it]
   wouldn't let them save." (L1006-1010)
   Catalogue: US-04.2.10 says versions "never overlap and never leave a gap" and the previous version
   ends the day before; no criterion says a gap cannot be saved, and US-04.1.6's blocking errors do not
   name one.
61. **A Contract is a continuum: changes apply from a date, or a clean start.** Greg: "we are
   effectively endlessly extending and changing that contract... we might have a contract with no end
   date. That would be normal." Changes "could be additions... removals, or... edits. And then we want to
   apply those from a date"; or "delete this contract, I'm going to give you an entire new one, in which
   case we close it off and just start a new schedule." (L1012) Donald: the settings (fixed, RVG,
   discount, rate) live on the parent, and changing them from a point means "a whole new version... from
   a new date." (L1018) Greg: "the parent has the date and those dates affect all of those lines... you're
   just providing this continuum of contract definition." (L1024)
   Catalogue: US-04.2.10 (open-ended Contracts, new versions from a chosen date) and US-04.1.6 and
   US-04.2.13 (Alter and Replace).
62. **Lines are not dated; only the Contract is.** On "A Contract ends without a successor only when the
   office gives its current version an end date", Greg: "The lines are not date ranged, only the contract
   is date ranged... Only the contract header has the date range, and all its children follow that date
   range... So the lines inherit the date from the parent, but you can't manipulate them individually."
   (L1026-1040) Donald: "this is where you're thinking from a technical thing and I'm thinking from an
   experience thing." (L1038)
   Catalogue: the domain model ("All lines share the Contract's dates") and US-04.2.10 hold this.
   Donald accepted it at point 64.

## Contract and Contract line: the shared model

63. **One price list is one Contract: a header and lines, like an invoice.** Donald asked what the screen
   looks like when a 2027 price list arrives (L1042). Greg: "a typical office document that has a header
   [and] lines, so an invoice has a header [and] lines... a header which would say that it was for
   Merivale... valid from this date." For an anaesthetist's 12 fixed prices: Donald: "each one of those is
   a different contract." Greg: "No, that's one contract... Contract has a schedule": the anaesthetist's one page to Vanessa
   saying "those are my 2026 prices." (L1044-1056) Then the invoice analogy: "what's at the top of
   the invoice?... information that is common to everything... And then underneath that, you have all the
   different services"; "So over here we've got a contract and we have information that is about the
   contract. Who's it with?... start date, end date, reference number? Exactly the same as the [invoice]" (heard as
   "inbox"; L1061-1095). On an anaesthetist's list: "don't use the word contracts, charges. He's giving her a list
   of charges." (L1099) On each procedure being its own Contract: "That's a contract line. What I'm
   calling, or what I've been calling the contract, you might fully call the contract header." (L1103)
   Catalogue: FT-04.2 and US-04.2.4 already hold a Contract as a header and lines.
64. **Donald's model: "Each row in my mental model is a contract."** Over the Merivale Plastics price
   list, Donald: "I have been interpreting every single procedure here as a unique contract in our system
   as far as the users see them", found by searching "Merivale or breast reduction", each with its own
   settings and date ranges for its prices (L1117); an export "would show... each one of these line items
   out with... all the different columns of settings" (L1133). "Each row in my mental model is a
   contract. It is a thing that the anaesthetist searches for. It's a thing that AA admins can edit. It's
   a thing that anaesthetists can choose between... And each one of them holds all of the settings."
   (L1145) Later, over the price lists, he conceded the date: "A contract has a date range, which
   inevitably means that the contract line below it is valid from a date or within a date range." Greg:
   "Yep, precisely." (L1274-1276)
   Catalogue: not the catalogue's model. Donald's per-line settings remain a question (point 79).
65. **Greg: what users see should mirror the document; how they navigate to a line is the question.**
   Greg: "You want to see something on the screen that is a facsimile of that. At the top... [Merivale]
   Plastics, contract valid from January 2026. And then the list underneath it is all of the things that
   are contained within that agreement... that piece of paper there, that's the contract." (L1119-1123)
   Donald: when a Booking is matched, "my expectation is that they would be picking this [row]." Greg:
   "Well, they will eventually, the question is how will they navigate to it?"; "there's a lot less
   detail on the screen at any one given time." (L1125-1131) Donald: "this is a user experience mismatch
   that I guess we could prototype both versions and see how it looks." (L1133)
   Catalogue: US-04.3.4 has the holder, then the Contract, then the line; the contract picker mock
   (contract-picker-mock/) compares ways of choosing.
66. **Staff, hospitals and AA mean the whole page when they say "contract".** Greg: "You're back into
   Ben's comment that... it's an unmanageable problem... a lot of stuff to scroll through on the screen."
   (L1135-1139) "I don't think that the model you have in your head reflects how the businesses interact
   between each other or how the staff think about what they call a contract. So when the staff talk
   about a contract and when the hospitals and AA talk about a contract, they're talking about that page."
   (L1147) On the agreed vocabulary: "I think it's the businesses' model and I think it's the hospital's
   model. That's how they think about their discussions when they're having them with each other."
   (L1178) Donald: "I'm just going to put a pin in this." (L1149)
   Catalogue: FT-04.2 and US-04.2.11 (lines in the thousands, Contracts far fewer, found by holder and
   code search) use this reading.
67. **The office reads the holder reference on the Booking.** Greg: the surgeon books, the office sees it
   is at Southern Cross, "she's going to see that it says SXAP... So that tells her which contract is
   going to apply to this procedure." (L1163-1167)
   Catalogue: US-04.2.8 prints the holder's reference (for example SXAP); US-04.2.4 makes it searchable.
68. **The agreed vocabulary: contract holder, Contract (the price list), Contract line (a row).** Donald:
   "If we stopped calling what is in our system a contract, does that help?" (L1172) Then: "now I've been
   able to translate this. The contract holder is obviously Southern Cross. The contract is actually what
   you had previously called... a price list. It's a list of different procedures and the prices for
   them. And the contract line is the particular line in it." (L1176) Later, on renaming either the
   document or the system's term, Greg: "That's a contract, what I'm looking at there." Donald: "okay so
   let's keep calling this a contract... how we present the line... it's called a contract line." (L1255-
   1259) Donald still wants "a discrete entity for every line on these contracts... attached to this
   hospital" and filterable when choosing a Contract, so "the thing that AA is going to be billing is the
   thing that Southern Cross expects to receive"; "this is kind of a bigger conversation to be had with
   Vanessa." (L1180) Agreed as vocabulary between Donald and Greg.
   Catalogue: FT-04.2 and the domain model use contract holder, Contract and Contract line in this sense.
   Donald opened the 28 October session with it ("that breakthrough of me now understanding your vision
   for a contract versus a contract line", 28 Oct A L11); it is still Greg's proposal, to be taken to AA
   (point 85).
69. **Every line inherits the Contract's dates.** Greg: lines "are being operated on as a collection...
   they all inherit the date from the parent, which is the contract"; "when you look at those schedules,
   right, none of the [lines] are dated." (L1265-1269) On the CESL document: "effective
   from the 1st of July, 2026... So that date applies to every row on that table." (L1284-1288) Donald
   agreed (point 64). This settles points 55 to 62: the date range is on the Contract header.
   Catalogue: US-04.2.10 and the domain model hold this; OQ-48's answer had left "whether the Contract is
   dated and its lines move with it... or the lines carry their own dates" to Greg's model.

## Southern Cross schedules

70. **Lookalike schedules are separate Contracts; the office picks the schedule first.** Greg: the office
   knows "this is glaucoma on the MIGS schedule and not glaucoma on the DHB schedule"; Southern Cross may
   operate "on behalf of... or under a DHB... where there's [a] different price for this but it's exactly the same
   procedure. So it may be an AP1313 [as heard] but it could be $795. Same period, same code number, same
   description, different price because it's a different schedule." (L1186-1190) "Southern Cross could
   send... the MIGS schedule... And they could send something that looked almost identical, which was the
   DHB schedule... everything could be the same except prices." (L1198-1206) "So Vanessa's going to go,
   okay, got the surgeon. It's a Southern Cross contract. It's MIGS. I need the MIGS one... she's thinking
   at that level higher than the line... which schedule is it that I'm meant to be using." (L1210)
   Greg: the surgeon "will have [MIGS, heard as 'mixed'] on the booking", so the booking tells the
   office which schedule applies (L1182). Greg:
   "it's absolutely critical that we're all on the same page about this model because it's caused a lot
   of difficulty." (L1182)
   Catalogue: US-04.2.10 (each funding arrangement its own Contract) and US-04.3.4 (holder, then Contract,
   then line).
71. **Navigation mirrors how staff resolve the billable party and the price.** Greg: "it's the user
   navigation of how they think about working their way through the system... a mirror of the human
   navigation of how they resolve who is the billable party and what is the price." (L1221) Donald, on
   telling lookalike schedules apart: "they would just be named differently. And maybe they'd have
   metadata. That means that it could be filtered on it as well." (L1227)
   Catalogue: US-04.3.2 filters by holder and practitioner; filtering by funder or schedule metadata is
   Donald's idea, not agreed.

## Add-ons and time-tiered fees

72. **Predefined add-ons on a Contract: "a whole new feature".** Donald: "We haven't really talked about
   add-ons at all" (L1227); on the Merivale facelift with liposuction per 30 minutes, or a separate
   general anaesthetic fee added to a cataract line: "I could picture in the UI that when you're setting
   up a contract, you can set up a number of predefined add-ons such that when a procedure is done, the
   anaesthetist can say, we had three of this add-on or one of this add-on. And then in the final invoice
   you see your facelift plus your liposuction... So add-ons is a whole new feature. That's fine." (L1243)
   Greg: "what it's doing is it's introducing multiple billable lines to a procedure, whereas at the
   moment we've just got one billable line to a procedure." Donald: the system may already have several
   lines (pre-op, op, post-op), "but it didn't support the idea of some sort of predefined add-ons." Greg:
   "It's just an add-on." (L1245-1249) Donald has more of AA's spreadsheets to go through (L1251). Not
   decided.
   Catalogue: US-04.2.4, US-03.3.6 and US-05.2.5 have no add-on flag or quantity rule (dropped 7 October,
   OQ-89), and combinations are lines of their own (US-04.2.11). Nothing later rules on add-ons.
   Related, not the same: on 28 October pre-op and post-op events were taken as billable items that
   live with the Booking and appear on no List, how an event is billed being for Vanessa (Notes
   2026-10-28 · AA meeting with Greg #23 #24); and Ben, on a prepaid facelift that gains liposuction
   on the day, would "raise a second invoice" by hand (28 Oct B L683; Notes 2026-10-28 · AA
   meeting with Greg #1). Predefined add-ons are not ruled on.
73. **"$100 per additional 15 minutes" is not trivial.** Donald: "that's just different time pricing."
   Greg: "That's not trivial either. You've changed the rate halfway through." (L1239-1241)
   Catalogue: the domain model leaves how such a schedule is expressed unsettled.

## Combinations and the anaesthetist's own price list

74. **US-04.2.11 agreed: a combination is a line; splitting is done by hand.** Greg: "a particular use
   case raised by Vanessa where normally you get these combination or compound things happening that are
   built as a single line and some vendors require them or ask for them to be split." (L1300) Donald
   recalled Southern Cross refusing a combined line, so the first invoice was retracted and re-sent
   split (L1306). Greg: "So she just does that manually... she rolls that back and just writes it, builds
   it as two lines." (L1308, L1319) Donald: if caught before it goes out, "you would still select the
   single contract line in the UI, but you would then through some UX choose to actually create separate
   individual invoices and void the automatic one or whatever." (L1321) On the default RVG code (for
   example H3), Greg: "Not sure the RVG code's got a lot to do with this. These lines would normally have
   their own reference code"; Donald: it is "to help you find them". "Agreed." (L1310-1314)
   Catalogue: US-04.2.11 and OQ-77 hold this. OQ-77's answer (19 October) has a split before sending as a
   normal admin edit; Donald's aside here is a loose alternative, not a ruling.
75. **US-04.2.14: the office sets up an anaesthetist's own list.** Greg: "Yep, that's correct. You can't
   do it [your]self." (L1323) Donald read "Let the anaesthetist change the price where AA has set the
   contract as editable" and said "Yep" himself, then raised his per-line settings picture (L1325,
   again at L1337; point 79). Greg did not answer the editable line.
   Catalogue: office-only set-up is in US-04.2.14. The editable reading is superseded by OQ-117's 29
   October updates: a fixed fee never allows the anaesthetist's price override, own list included.
   Revisited 28 October: Greg said an anaesthetist's own fixed list is editable ("They're fixed prices,
   but they're editable") and Donald agreed (28 Oct B L201-203), and Greg named a locum's list and a
   surgeon's list with an extra-hours proviso as possible cases (28 Oct A L203-211); a prepaid Contract
   must be not editable (Notes 2026-10-28 · AA meeting with Greg #1 #2 #61). OQ-117's 29 October
   update (a fixed fee never allows the override) is newer than both.
76. **RVG values on fixed-price lines may be given but are ignored.** On "Lines are fixed prices and need
   no RVG reference, though one can be given as a default... Ben has not yet been asked", Greg: "Ben will
   tell you that they don't have them and [don't] need it. So I think technically you can put [it in] if
   you want to, but they're just ignored... there were other comments that were made by him earlier...
   we just ignore them." (L1349-1351)
   Catalogue: US-04.2.14 and US-04.2.4 say a default RVG code can be given; US-04.2.2 already keeps
   BTM units recorded on a fixed price for reference only, which is Greg's point. Still not put to Ben
   at the 27 October meeting.
77. **An own list need not be fixed prices.** Donald: "in theory, they don't have to be... They could be
   contracts exclusive to an anaesthetist that aren't fixed." Greg: "I can't think of an example where it
   would make any sense"; "They could set up a whole list of stuff that just have a 10% discount on them."
   Donald: "the system is permissive and it says practitioner, right?... it's possible." (L1364-1372)
   Catalogue: US-04.2.14 describes fixed prices only; US-04.2.4 says lines are not only for fixed
   schedules.

## Not answered

78. **Questions read and passed over.** OQ-95 (age modifiers): "I think this is for Vanessa, so we can
   move on." (L108) OQ-112 (monthly AA fee invoice): "This is for the accountant." (L301) OQ-109 (St
   George's and Southern Cross): read as "a similar question" to OQ-108 (L236). Near the break, Donald:
   "Recommendation proposed. Did we? That's for the accountant." (L473); OQ-47 (the weekly payment
   cycle) is the only question at that status, so it is probably the one meant.
   Revisited later: OQ-95 was put to Ben on 27 October and partly settled (Notes 2026-10-27 · AA
   meeting with Ben and Vanessa #7 #8). On OQ-109 Ben named Forte as one of two integrated hospitals
   (27 Oct L221-225), which does not match St George's and Southern Cross; unresolved (Notes 2026-10-27
   · AA meeting with Ben and Vanessa #5). For OQ-112 and OQ-47, Ben is to introduce AA's accountant by
   email; none was put that day (Notes 2026-10-27 · AA meeting with Ben and Vanessa #13). OQ-47 was
   touched again on 28 October, not answered (Notes 2026-10-28 · AA meeting with Greg #64 #73 #97).
79. **Where settings live: on the Contract or on each line.** Donald's picture: "individual contract
   lines could have different settings of can override, can't override", and add-ons on one line, not
   all (L1325). Greg: the Contract holds "All the shared settings." (L1327) "You could load that twice,
   potentially. Once as an editable contract, once as a non-editable contract. I mean, couldn't imagine
   why you would do that." (L1331) Donald: "what we enable in the system will then force AA to... work
   around it like they already do." Greg: "it cuts both ways." (L1333-1335) Not settled.
   Catalogue: the price override flag is on the Contract (OQ-107, the domain model).
80. **Prepaid on the Contract or on the line.** Greg: "prepaid at the moment in the model is set at the
   contract level. So again, you could load that contract twice, once as a prepaid, or you could move
   prepaid down." (L1339) Donald: both models "have pros and cons... in that particular scenario, you have
   multiple instances of a single contract line." Greg: "It's worth a discussion." Donald: "I need to
   think about some good ways to display this or visualize it." (L1341-1345) Greg: "The app designers
   won't care less whether the flag's on the header or the flag's on the line. But it will make a big
   difference to what the user has to maintain... We want that on the line. And we don't, or we don't, we
   want to be able to treat them as a block." (L1347; his preference is not clear from the transcript.)
   Not settled; no question holds it.
   Catalogue: the prepaid flag is on the Contract (the domain model, US-04.2.14, FT-06.2).
   28 October, Part B, speaks of "prepaid contracts" that "must be set up as not editable" (28 Oct B
   L773) but did not revisit whether prepaid sits on the Contract or the line.
81. **OQ-100: for Ben and Vanessa, not Greg.** Donald: "This is actually still a conversation to have
   with... Ben and Vanessa... I think I'm just going to rename this... Ben and Vanessa." (L108) See point
   37.
   Catalogue: OQ-100's owner is still "Donald and Greg". Not raised with Ben and Vanessa on 27 October.
82. **OQ-108: not merged with OQ-100; Greg's hunch.** Donald: "Claude, it might be nice if you could kill
   one of these and merge them." Greg: "This is about your contract master lists... And this one is still
   about your bookings." Donald: "Yep, you're right." (L220-236) Greg: "I think we're going to end up back
   with the sessions bookings being the initialising transaction, the one that['s] released first." Donald:
   "or there's a version of this where you just have to do both, maybe." (L238-240)
   Catalogue: OQ-100 and OQ-108 stay separate. OQ-108 already has Greg's account and Donald's lean to both;
   Ben and Vanessa answered in part on 27 October (Notes 2026-10-27 · AA meeting with Ben and Vanessa #3
   #4), without settling it: Ben leaned to the surgeons' rooms' PDFs (27 Oct L37); Vanessa's first
   choice was the hospital ("Probably from the hospital", 27 Oct L197), but she would take the rooms'
   sheets "If it's easier" (27 Oct L269); Donald again leaned to both (27 Oct L55, L261).
83. **"That is the contract performance. It's essential."** Greg, just after OQ-106; Donald: "Yes, bare
   minimum." (L218-220) What it refers to is not clear from the transcript. Not acted on.
84. **The CESL document.** Donald: "what's CESL?"; "this document represents one fat contract. Which has
   its own problems... I wonder what even this document is. Is it a summary of other PDFs that have come
   in?" Greg: "I haven't seen that document before." (L1278-1296) Left open.
85. **The header and line model still to take to Vanessa; the section left open.** Donald: "this is kind
   of a bigger conversation to be had with Vanessa and such" (L1180); "I certainly want to understand a
   little bit more about how it looks like day-to-day from their side." (L1212) Donald left US-04.2.10
   open "to read it again after some updates to the language" (L1006; "let's leave that open", L1298).
   At the close, on US-04.2.14: "I'm just going to put this as open or proposed, I guess... Just not
   agreed." Greg: "To do on contract proceeding. That's tomorrow's conversation." (L1372-1374) Nothing
   from point 55 on is agreed beyond what each point says.
86. **Requests to Claude in this session.** With "Claude": update OQ-93 (L108, point 1); update OQ-103
   (L163, point 3); support one Contract on many surgeons in the data relationships (L202, point 5); merge
   OQ-100 and OQ-108, withdrawn (L220, point 82); remove the review date everywhere (L509, point 27);
   reword US-04.1.3 (L525, point 29); make holder, billable party and payer clear in the artifacts with a
   visual (L623, point 33); US-04.2.1 "anaesthetist or surgeon" (L765, point 42); no validation or
   uniqueness on holder codes (L836, point 49); read "time band" as "date range" (L935, point 53). Asked
   without "Claude": rename OQ-100's owner to Ben and Vanessa (L108, point 81); put the description
   hierarchy to Ben and Vanessa (L141, point 3); a show-all override on the Contract list (L202, point 18); record suggesting a Contract from history as a future
   requirement (L638, point 36); keep US-04.1.6 and US-04.2.13 both as proposals (L673, point 37); update
   FT-04.2 away from groups of procedures (L681, point 38); remove base or modifier units from the pricing
   terms (L769, point 43); delete the insurer member number (L793, point 45); remove "starting" (L822-836,
   point 47); remove the line key sentence (L888, point 48); reword US-04.2.10 (L1002, overtaken, point
   59); refuse to save a gap in dates (L1010, point 60).

## Donald's decisions, 4 November

87. **The invoice description: a series of defaults, and the office can always edit it (OQ-103).**
   Donald, 4 November: "For now, let's say that we will use the text from the hospital by default, but
   at any time, AA admins can edit. Free text." The description starts as the surgeon's rooms'
   description; the hospital's description replaces it whenever one arrives, and before then, or if
   none ever arrives, the rooms' text stays. "If a contract line in the system has a filled in 'Invoice
   Description' then that becomes the default on the invoice." The received texts are never changed,
   and the RVG code plays no part (point 3, L157). This confirms Greg's three layers of point 3
   (L137-163) for now; it has not yet been put to Ben and Vanessa.
   Catalogue: OQ-103 is answered. US-08.4.6 becomes Agreed; US-04.2.4's line description clause is
   reworded to match (the line's invoice description, where filled in, becomes the Procedure's invoice
   description when the line is chosen, in place of the hospital's or rooms' description, and the
   office can still edit it), released from the hold on the Contract model for this alone; US-03.1.9
   keeps its status.
88. **Rulings held with the Contract model.** Donald, 4 November: his 23 October rulings to drop the
   review date (point 27), base or modifier units on a line (point 43), the insurer member number
   (point 45), the line key sentence (point 48) and any uniqueness check on holder codes (points 30 and
   49) are held with the Contract model and not yet carried into the requirements. The items those
   points name keep their wording until the model is settled. Dropping "starting" from the line
   description (point 47) is settled by point 87.
89. **AR-44: the holder kind is "Surgeon".** Donald, 4 November: AR-44's holder kind "Surgeon or
   rooms" becomes "Surgeon", in the diagram and in its region note for the contract holder. This
   follows point 42 ("the surgeon, not surgeon's rooms", L765) and Vanessa via Greg at point 5 ("It's
   always the individual surgeon. We don't have arrangements with rooms", L168-176).
90. **Three board answers dated to this meeting.** OQ-101, OQ-113 and OQ-116 were answered on the board
   in line with what Donald said here (points 2, 9 and 12). The 28 October requirements update dated
   them 29 October, the day the requirements were updated. Donald, 4 November: they are dated to the
   transcript, 23 October, and cite this note (OQ-101 point 2, OQ-113 point 9, OQ-116 point 12). Typed
   decisions of 29 October that go beyond what was said here keep their date, with this note added as
   a source where it applies: for example the multi-procedure reduction on a mixed Booking, and one
   Contract for many surgeons. Points 2, 9 and 12 above give the 29 October date as the catalogue had
   it when this note was written.
