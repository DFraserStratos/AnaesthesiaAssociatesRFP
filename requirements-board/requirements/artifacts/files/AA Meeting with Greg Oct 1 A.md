# Anaesthesia Associates — Discovery Meeting, 1 October 2026 — Reconciled Transcript

> Reconciled from two automatic transcriptions of the same recording. The transcript with explicit speaker names was used as the primary source for speaker attribution and turn boundaries; the second transcript was used to cross-check wording and recover obvious ASR errors. Genuine uncertainties are marked rather than guessed.

## Prepayment, cancellation and anaesthetist reassignment

**Greg:** Yeah. In the last meeting, we talked about the scenario where a patient prepaid and then cancelled the procedure—say they had the flu—so they rebooked. And they may have had the procedure a second time with a second anaesthetist.

**Donald:** And what we had previously said, just to make sure I'm up to the same area you were at, is that in that scenario our recommendation—we kind of agreed in the room—was that the entire prepayment would be credited. And then whenever the new booking is set up with the new anaesthetist, they would get another prepayment invoice. That's what we had agreed the other day.

**Greg:** We did. And Ben disagreed. So that was the interesting part.

**Donald:** It's interesting. I'm not in the room, so obviously it's a company's conversation, so it's a bit hard for me to engage with it after the fact. But it's interesting to know where his opinion comes from, or what context he has that I don't have, or what context he has that Vanessa doesn't have. On some level I would have thought the administrative team hold maybe more of the pain around that process than the anaesthetists themselves. So why does he reckon it needs to be different?

**Greg:** He doesn't think the patient should be rebilled. Too confusing.

**Donald:** Too confusing for the patient, he thinks.

**Greg:** And the rate and the estimate may be different.

**Donald:** Exactly. Well, either way, unless you have two anaesthetists with exactly the same rate.

**Greg:** Unlikely.

**Donald:** Unlikely, they're already going to get rebilled. So it's in scenario A where you credit them and then bill them, they've received two bills. And in scenario B where you just bill them the difference or maybe also credit them the difference because maybe the next person is cheaper with their prepaid. In that case, you're getting one to two invoices. So it's not too different.

**Greg:** So the understanding between the anaesthetists is if they pick up a booking like that, they wear it or they benefit, depending on whether it's more or less.

**Donald:** Oh, well, that's that changes things. So that means that.

**Greg:** Gives the patient stability and they just do the procedure for the agreed rate.

**Donald:** But that's fine.

**Greg:** There's a but Ben doesn't think the anaesthetist should be paid the money prepaid until the procedure is complete. So he thinks we should put the money.

**Donald:** Into the trust or the?

**Greg:** Trust, and hold it as a pending payment. Then it's like it is a prepayment at that point and it's due. I don't know how you flag it, but it needs to just say, 'Oh yeah, they've done it,' at which time the prepayment is applied to.

**Donald:** Well, yeah. I mean, the way you've described how this works in Xero—which I really don't have any expertise on—is that our system will create a pair of receivable and payable invoices. So the payable, which is now in this case a prepaid payable, invoice goes to the patient, and whenever they pay it comes into AA. And previously the system would say once paid—the receivable, no, sorry: receivable comes in, the payable goes out. So once the receivable comes in, previously the system would say, now that Part A of the pair is in, Part B goes out the door. And what we're saying is actually Part B does not leave the system until the procedure is done, which gives cover for: procedure is cancelled, then we credit it; procedure is moved to another anaesthetist, then the second anaesthetist becomes the recipient of the payable. That all makes sense to me.

**Greg:** Yeah.

**Donald:** Okay.

**Greg:** Well, I think it's, I don't think there's any special pathway for it because. If a second anaesthetist, there's a booking ID, so the payable is associated with the booking ID. When the time sheet comes through, the anaesthetist might not be the original anaesthetist. It doesn't matter.

**Donald:** When the time sheet comes in.

**Greg:** Well, it might be a different anaesthetist.

**Donald:** When you say time sheet, you mean that?

**Greg:** Well, it might be on Ben's list, but Nick might do it.

**Donald:** But wouldn't it then be moved to his list?

**Greg:** Yes, it will, won't it? So then it is Nick's booking.

**Donald:** Yeah.

**Greg:** So then Nick gets the booking.

**Donald:** I'm currently not aware of any part of our system that supports a procedure being on Anaesthetist A's list, but Anaesthetist B just happens to jump into the room and do it on their behalf. Whoever submits the list is always, in our view, the person who does the procedure. And if, for whatever reason, somebody else needs to do the procedure, that card/booking needs to be moved.

**Greg:** Yeah, well, even if the second list is only one procedure, it would be moved to the second list.

**Donald:** That's right.

**Greg:** So then the timesheet comes through.

**Donald:** We don't have a word right now—we don't use the word 'timesheet' anywhere. So when you say timesheet, we need to use the word 'booking'.

**Greg:** Okay, the booking comes through completed, right?

**Donald:** Yeah, it's the completed booking.

**Greg:** Now we need to work out that there's been a prepayment against that booking.

**Donald:** That's fine. The system's already covering that. The only place it would get weird and...

**Greg:** Hang on. Because the time sheet comes through.

**Donald:** And the booking comes, the booking is completed, submitted, you mean?

**Greg:** Yes, sorry, the booking is submitted. And that normally would trigger an invoice. How does it know not to do that?

**Donald:** Well, currently I believe the way we've described it over here is that, in the scenario where something's prepaid, obviously it's different to something that's postpaid. So which one do you want to cover first? Prepaid. Okay, so the way this is described here is—this still says card—but the booking is created. A booking contains one or more procedures; procedures have a contract. Some rough ideas as to what that contract might look like. Is there any required prepayment outstanding? If yes, you jump all the way over here to the invoicing/billing engine, and it creates a pair of financial records in the internal ledger. It generates invoices for the billable party on the booking, and then a pair of linked financial records are created in Xero: receivable to the billable party and payable to the anaesthetist. And now we go over to payments and Xero reconciliation within, I guess, the Xero bucket: create matching Xero records for accounts receivable and accounts payable draft; send prepayment invoice to billable party; prepayment received into AA's account; payment reconciled against the internal ledger. Then we go back all the way up to here: is prepayment required? At that point, no, because it's already been done. Everything else follows through here. Procedure takes place; anaesthetist finalises final procedure data. And if we pause a second, this draft payable is currently, in the first instance, against Anaesthetist A. Any time before the procedure happens, if the anaesthetist assigned to the work is changed, then that matching draft pair would be updated to point to the new anaesthetist. That's how I would see it. And then you just go through the rest of this.

**Greg:** Yes.

**Donald:** Yeah.

**Greg:** As long as you catch that, you're fine.

**Donald:** Yeah.

**Greg:** So any time a list is moved, you have to run that check against prepayments. Yeah—any time a procedure is moved.

**Donald:** Yeah, that's fine for now. The recording will capture everything we just said. Cool. Is that everything that is on your list at the beginning? Yeah, I think so. Okay, cool. Not that it's secret, but I'm just.

**Greg:** Going to pause this.

## Outstanding questions: AA fees, BCTIs and GST reporting

**Donald:** So I thought the first place to start would be working through these remaining outstanding questions. Some of them I didn't ask to Vanessa because I thought it'd be better for you and I to get into them. And so we'll start here and then we'll start working through the user stories themselves. And so these questions are also linked to the features themselves. So here's a feature up here as an epic, right? But if we go back to this. So how is AA's fee to anaesthetist calculated and when is it? I haven't really answered this question, I thought. Percentage of collections per invoice. So is our system going to be handling the invoices to the BCTIs to the anaesthetists to pay AA? Because we know it's obviously not a percentage on the payable.

**Greg:** It's very simple from that point of view because.

**Donald:** It's money in, money out.

**Greg:** I know that. Yeah, but I'm saying: we've talked about this. I talked about this very early in the piece and then it's been lost in the rush. So it's great that this question has come back. I think if the system generates the BCTI, it's going to save everybody a hell of a lot of work. Ben did say that one of the deliverables needed very early in the piece was some sort of schedule that would assist the anaesthetist in preparing the [unclear] GST report—bi-monthly GST report.

**Donald:** GST report, interesting, okay.

**Greg:** So they need a summary. It's basically a sales report that says, here's your AA sales, here's your AA GST component, and by the way, this month it balances with your payments.

**Donald:** Is that something they want in the first release? I imagine it's just a case of these are all of the procedures, not lists, but these are all the procedures this anaesthetist did during this time period.

**Greg:** GST's cash basis. So it's this is a list of your payments over the period.

**Donald:** How much you got paid?

**Greg:** So it's just a list of the invoices, just a list of the payables.

**Donald:** Okay, great. So here's a list of the payables you got during this time bracket. And payables received, not payables due.

**Greg:** What we paid the, what AA paid the anaesthetist.

**Donald:** Yeah, so yeah, totally. Yeah.

**Greg:** Anything that's outstanding gets pushed into future GST period.

**Donald:** Yeah, great. Okay.

**Greg:** So it's really easy.

**Donald:** That seems easy. So that's a new requirement. But the BCTI itself, like how, what is this fee structure between AA and the anaesthetist?

**Greg:** Okay, so the BCTI is just the unburdened, straight in, straight out document, right?

**Donald:** No, Yes, hang on, listen.

**Greg:** Separately, at the end of the month, the accountant raises an invoice to the anaesthetist for their fees.

**Donald:** That's the BCTI.

**Greg:** No.

**Donald:** So sometimes my brain gets confused about that, so let's be clear. Buyer-created tax invoice.

**Greg:** It's changed by the way, but let's call it that. I prefer that.

**Donald:** Okay.

**Greg:** IRD changed the name of it about 18 months ago.

**Donald:** Is it still BCTI or is it?

**Greg:** No, it's probably bloody ridiculous.

**Donald:** Okay, but essentially it's like, I did work for you, but you're too busy and I'm going to help you out and I'm going to, see, that's the way I word it, it's always weird. It's like the person who, I do work for you, but you generate, no, I generate the invoice for you to pay me.

**Greg:** So let me, it's.

**Donald:** Always a bit confusing. I'm AA, right? You earn, yeah, I'm.

**Greg:** Gonna pay you some money. But to save you the overhead of raising the invoice, because I know what the money amount is and you don't, I'm gonna do the invoice on your behalf.

**Donald:** That's right.

**Greg:** I'm gonna do, I'm gonna raise your invoice.

**Donald:** Yes, that's right. I would normally... You are doing the work. This isn't actually a BCTI.

**Greg:** Yes, it is.

**Donald:** Yes, it is.

**Greg:** Technically, the anaesthetist should invoice us for what we're paying him.

**Donald:** No. AA is doing a service for the anaesthetist, and the anaesthetist should pay for that service.

**Greg:** We're not talking about paying for the service. We're talking about remitting the funds that we've received on his behalf.

**Donald:** But isn't that the service AA is doing? AA is doing a few different services.

**Greg:** No, we'll slow down.

**Donald:** Okay.

**Greg:** When we get money here, we get $100 in, right? So we're now holding $100 on behalf of the anaesthetist.

**Donald:** Yes.

**Greg:** In order for us to pay that, the anaesthetist needs to bill us $100.

**Donald:** Yes, okay, that part is a BCTI.

**Greg:** That's the BCTI.

**Donald:** Yes.

**Greg:** And it's always very...

**Donald:** Which is what we've been calling the payable invoice.

**Greg:** No, it's very simple because it's money in, money out.

**Donald:** Okay, yes, okay, that part is a BCTI, yes. I guess what I'm talking about is...

**Greg:** So there'll be one invoice for each procedure.

**Donald:** That's right. Yeah, so that's already established.

**Greg:** So when I go backwards and pause during the month, you end up with—I don't know—Ben might do 50, 70 a month. Some of them will only do three, four, five, ten. Quite a few anaesthetists have got [unclear: possibly 'one day a week that they work']. So they might do four or five on a list—20 or so. Anyway, that's a lot of paper going backwards and forwards from the anaesthetist's point of view; [unclear: possibly 'pain in the arse'], just a pure overhead, right? And actually, we'd have to tell them what the bill was before they billed us. So it's much easier if we just—

**Donald:** That's right, that's right. So that part is a BCTI, that's established.

**Greg:** It's right over here, Donald sitting in his office in Ireland.

**Donald:** Who's Donald? Who's Donald?

**Greg:** Michael, the accountant sitting in his office in Ireland. It says, Okay, Ben, you've got.

**Donald:** And Ben is an anaesthetist.

**Greg:** Yeah, you're part of AA. You have to pay a service fee for... using the services of AA.

**Donald:** Yeah, that's right, that's right.

**Greg:** Now that service fee is made-up of some standing amounts, some various charges, and also there's a metered charge per invoice.

**Donald:** Okay, so let's break that down. So there's a fixed cost regardless, so just a ticket to get in the door.

**Greg:** This is a series of small charges.

**Donald:** Do you know what those are?

**Greg:** No, I don't need to get one.

**Donald:** Does Vanessa have it? Can we just get it from Vanessa? Or is it the accountant? We'll get one from [unclear: Ben/Peter]. Okay, but there's a fixed cost because you're just in the club. And then what's the next one you said?

**Greg:** Well, there's a schedule of fixed costs because you're in the club.

**Donald:** Okay, sure.

**Greg:** And then there is.

**Donald:** A variable based on how many, basically a fixed cost per invoice.

**Greg:** Yes, there is.

**Donald:** Which is per invoice or per procedure.

**Greg:** Same thing.

**Donald:** So in the situation we talked about before, where an invoice is generated for Anaesthetist A and then it moves to Anaesthetist B, that procedure has moved, but multiple invoices have been created. So that's why I want to be specific, right? Because an invoice is created and then basically voided or credited, right? Or maybe a draft invoice. If it was a real accountant doing it, they would draft an invoice payable—the BCTI. The system kind of... the ledger is keeping track of that until it changes. And so I just want to be clear: it's actually only paid invoices, or procedures, that they're going to get the fee on.

**Greg:** Can I come back to that? This raises another. It will end up down a little and it's worth going back to.

**Donald:** OK.

**Greg:** So there's this at that point AA raise an invoice to the anaesthetist that he actually pays.

**Donald:** So, again, at that point, at what point?

**Greg:** AA monthly bill fees to the anaesthetist and he pays that fees bill.

**Donald:** He been Ben. Yeah, that's what we're talking about. Yeah, so we're saying there's a fee, some part of it's fixed, some part is variable based on a procedure or an invoice.

**Greg:** And it becomes an AA invoice.

**Donald:** Yeah, that's totally, that's right.

**Greg:** And Ben pays that.

**Donald:** Yes.

**Greg:** Whereas all the other transactions AA pay Ben.

**Donald:** Yeah, we're on the same page. So there is, in the prototype right now, obviously we talk about money coming in and money going out of AA's trust account related to our procedure. But it doesn't, I believe, capture, and this is what this question's asking, how does AA get paid? The prototype assumed, because I told it, some sort of cut on the payable, but that's not. But at the moment.

**Greg:** Those invoices—I believe those invoices are generated manually. But it would be very easy to generate them.

**Donald:** Especially because we're doing all this other stuff, so what I'm that's why we're trying to get to it, so.

**Greg:** We'd have a monthly invoice run where, monthly, we'd press a button and it would generate all the fee invoices for a period.

**Donald:** So anyway, we need to ask the AA accountant the specifics, but we know there will be a fee. There'll be some sort of fixed component of the fee and a variable component based on how many invoices—BCTIs, essentially—the anaesthetist received.

**Greg:** Yeah. And that could all be driven out of a little parameter page.

**Donald:** Yeah.

**Greg:** Because it's. It's the same bit that we put.

**Donald:** Yeah. Is it monthly? In a month. AA creates an invoice.

**Greg:** What was that?

**Donald:** [unclear: brief UI/dictation fragment while editing notes]

**Greg:** But I do think you should note there that it may be several items that make up the fixed fee.

**Donald:** Yeah, I said fixed fees. Yeah. And so I'm going to say it's, we need to still verify this, it's not confirmed. And then we can move on to the next question. Cool. When refund Refund when prepaid exceeds final. So when the prepaid estimate exceeds the final calculated fee, is the difference refunded? How does credit or against future work or enough? Who actions it? And so what we've already determined here is that when a procedure—or sorry, when a booking—changes from one anaesthetist to another and the procedures within it have fixed fees, the next anaesthetist keeps those fixed fees regardless of whether or not their rate is different.

**Greg:** Which is not the same answer. That's not the question. It's a different title.

**Donald:** Well, if you if the prepaid exceeds what the final would have been, we're ignoring it. That's the answer. Yeah.

**Greg:** And often that's true if it's the other way around as well. So if it's-- That's right. Yeah. I think I'd only go back if it was really significant.

## Flexible additional invoices and changes after initial billing

**Donald:** So, something that was talked about—I'm going to mark that as verified for now. I'm going to assume all of our requirements still need to be verified once I speak to them. One of the things we talked about after you left the other day was all this messiness in the Solution Plus current solution, but also in some of the fixed-fee costs that come in from the other surgeons' rooms, where they don't always have a clean, 'here's your one price for this procedure.' Sometimes they'll say, 'here's a fixed price for these combinations of procedures.' Contract prices. And so that's fine: you can make a contract that's a combination of procedures and put it into the system. That's easy to support. But then she said sometimes we will invoice a billable party, maybe the patient, for a combination of procedures. Then after the fact, it turns out insurance is going to pay for it, which means the billable party needs to change to Southern Cross. And then Southern Cross will come back to AA and say, 'I want you to break out that combination procedure into three separate costs.' My recommendation for the way to support this is we still have a single contract that maybe has that combined procedure, but attached to that procedure is the ability to create additional invoices. We did talk about this: all the invoices are sent for a procedure, but two weeks later there's post-op care that's done. So that ability to create additional invoices related to a procedure means AA has flexibility whenever they need it to just create additional invoices related to a procedure. There's traceability—you can see where it came from. It just needs to be a flexible system where they can free-type whatever they need to and put free numbers in to do what they need to do. That's the part that needs to be flexible and probably not programmed.

**Greg:** It's an admin function at this point, isn't it?

**Donald:** Yeah.

**Greg:** Because did we talk about the unices being able to go back to the original booking and add a procedure for the post-op care if it wasn't in there, even if that procedure had already been built?

**Donald:** We have not talked about the the anaesthetist to be able to find that list in booking and add stuff. Maybe that is something that's valuable, but what Vanessa said is that often the anaesthetist will just call them and say, can you also invoice for this? I don't know. You have more history with them. I wonder if some of that is because sometimes the anaesthetist will do it and not build, because it's very short or small. I don't know if they're like lawyers and they just do everything, but she just said that they would e-mail her. If there's functionality in the app for them to go to historical lists and add some extra modifiers, whatever, that makes some sense to me. Well, I'm just, we just need to figure out.

**Greg:** I don't know the answer to my own question, but I'm just curious as to whether they do that because they can't do anything else. Yeah, it might actually be easier for them to be able to.

**Donald:** Them being in STS.

**Greg:** Yes, look up the original.

**Donald:** Procedure, yeah, that might be good.

**Greg:** Look up the booking, add a procedure to it, and then you've got your booking effectively. We've talked about them disappearing, but maybe they're not amusable. Maybe it comes back and you can add something and then you've got that piece of it.

**Donald:** Well, I would imagine that actually you would just need somewhere else in the app just to look up historical ones. So you'd have a calendar and you could just go back anywhere. Because the prototype right now, it's just like here's your four month rolling thing and you can just scroll as much as you want forward. But I don't really want an infinite list. You can scroll backwards. I would probably want to have some other functionality to go back to a day or search a patient.

**Greg:** And then maybe add something to it and just press done. Then it just flows. Because I know how much people value self-service, and I suspect.

## Historical bookings and additional pre-/post-operative events

**Donald:** Yeah, I think this has a lot of value. You don't need to convince me. I got it. I'm with you here. So we are on October 1st. Recording, please interpret this text as a new requirement. Anaesthetists need to be able to historically look back on procedures—sorry, lists and bookings—to be able to add basically additional post-care or modifiers to a procedure. And then that would automatically generate new invoices that probably need to go through the same approval flows for the admin staff.

**Greg:** I think the way we're talking about the structures, it would be that we'd be adding a procedure to a booking because the first procedure's been built, so it's sort of...

**Donald:** But it's not the same procedure because there's going to be no more base and time, which would be more modifiers, wouldn't it? Or would it just be time? It would just be time.

**Greg:** Probably just be time.

**Donald:** Okay.

**Greg:** But it would be, wouldn't it be easier to just treat it as another entity in the booking entity? Say you've got another child, but it's got a different date and time on it.

**Donald:** Yeah, maybe it needs to be properly supported as like a separate visual element, which is just, it's still attached to the original procedure because that's what the care is against. But it's, is it just time?

**Greg:** Was it occurs at a different time?

**Donald:** Would it be modified as well or just time?

**Greg:** Just time.

**Donald:** Okay.

**Greg:** I think if it was significant, it would, they would create another card for it. But this is, if it's just an add-on, like.

**Donald:** But you couldn't.

**Greg:** Pain management is a common one. Although most surgeons do their own pain management.

**Donald:** Yeah, I guess there's nothing stopping an anaesthetist from creating a new card.

**Greg:** No.

**Donald:** They couldn't create it in the previous list. They would have to create it in a current list.

**Greg:** Yeah.

**Donald:** And hopefully that means It's a they are doing it in the same hospital that this is attached to, but if you add, it's like just yeah, if an anaesthetist did add a new card to a current list for a procedure to for a patient that's only for sort of post-op care, they would have to sort of pick the procedure and then zero out the base. It seems like probably not the right way to handle this. Yeah, so I was.

**Greg:** But I think adding a procedure to the card is probably the cleanest way to do it.

**Donald:** We need kind of a pithy term for this, because it's basically like a time-only additional post-op event. Post-op event...

**Greg:** And let's just to capture time to.

**Donald:** Capture time only recordings for future voices.

**Greg:** [unclear]

**Donald:** Okay. Cool. Calendar view to find day. then list, then booking.

**Greg:** Search for NHI could be useful.

**Donald:** That's right. Search via NHI / patient name, name to find bookings procedure. Okay.

**Greg:** So the health industry has a mantra of a three-way match, which is why they always ask your date of birth, right? They want three things to identify you. I don't know if the investors use that.

## Billing failure handling

**Donald:** Okay. Until it comes up, I'll pretend you didn't tell me that. This water's here for you, by the way. Cool, okay. Booking level versus list level failure. If one booking fails in the billing/invoice engine, does the whole list wait or do other bookings invoice?

**Greg:** Good question.

**Donald:** I assume it's booking by booking. I don't think, there's no reason the list needs to fail.

**Greg:** [unclear]

**Donald:** What do you mean?

**Greg:** [unclear]

**Donald:** Yeah, that's all done, that's all gone. So if there's any reason an issue with an invoice being generated. Then, it's like some sort of manual process that we need to support in the future. That can be processed. Will be. Save, and I think I can mark that one as confirmed.

**Greg:** Qualifier on that in terms of. It may mean that one procedure on a multi-procedure booking is failing, but you would want to hold the whole booking back, wouldn't you?

**Donald:** I don't, I'll say that's a good point. So just to repeat it, so I understand it, so it's in the recording. So you're saying that one booking can have multiple procedures, and in the happy path, normally all those procedures are invoiced to a single person, but there are many not uncommon scenarios where different procedures are billed to different people, different parties. And so you could have a situation where, for whatever reason, one of those billable parties fails, but the other one does not. But all of them are attached to the same procedure. And so, yes, I think you're right that... Well, no, it's a decision. What do you think should happen?

**Greg:** I think you should hold the card back.

**Donald:** Hold the full booking back.

**Greg:** I do, because then you've got the view and you've got the ability to look at whatever's wrong with it.

**Donald:** Okay, so there's no reason the list needs to fail when a booking can pass. But a booking could fail if one of the billable parties on one or more of the procedures fails. In this case, the full booking would fail and fall back to a manual fix by AA admin staff. Cool. I'm happy with that. In that case, we probably should—I'll leave that as verified, or verify.

## Archived Xero contacts

**Donald:** Okay, next. Invoicing an archived Xero contact. Does Xero require an unarchive step before invoicing an archived contact? I would assume yes. So the scenario here is that I had a procedure with AA ten years ago. Xero has a limited number of contacts or something you've said, and so it will archive people it hasn't seen in a while. When I come back to have another procedure done, we probably don't want Xero to create a duplicate of me, so it probably needs to unarchive me and then invoice me. That seems right to me, but what do you think?

**Greg:** Yeah, I think that'll be, I'm not, I'm not, so I haven't had a lot of experience with archiving.

**Donald:** Is there a reason we have to archive? What's the reason we have to archive?

**Greg:** Theoretically. It doesn't want more than 10,000.

**Donald:** 10,000 is the limit. Okay.

**Greg:** But that's 10,000 active.

**Donald:** Yeah. Okay. Yeah. Just performance and things like that. Yes, unarchive to prevent account dupes.

## ACC pre-operative assessments

**Donald:** I was going to ask you—ACC pre-op codes. Confirm ACC pre-operative assessments are billed separately as flat-fee lines, and that ACC otherwise follows the contract holder. I don't know what this is asking.

**Greg:** I don't know what the answer is.

**Donald:** Do you know what it's asking?

**Greg:** Yeah, it's saying that those pre-operative assessments are fixed fees.

**Donald:** So when there's a fixed fee procedure, those are flat.

**Greg:** So that would be a procedure within a card and that procedure.

**Donald:** A procedure within a booking.

**Greg:** Yes, the procedure within a booking, that procedure may not follow the contract rules at the top of the booking.

**Donald:** A booking does not have a contract. A procedure has a contract. You pick a procedure and below the procedure—I'll just bring us to the image to centre us here. And I just want to be really clear. I'm not being pedantic about the language because I'm a jerk; I just want to make sure I'm understanding what you're communicating. A booking can have multiple procedures. One of those procedures is marked as primary, and each of them has a single contract. So this procedure might be standard RVG, whereas this one could be fixed.

**Greg:** That's a good example where the first procedure may not be the primary one.

**Donald:** The way I've described this, rightly or wrongly, is that, let's do that, is that there always needs to be a primary procedure and somebody needs to pick it.

**Greg:** That's right.

**Donald:** So somebody needs to define that when it's created and we don't have to worry about future automatic integrations at this stage. But when AA staff are importing these or creating these, they will decide which one is the primary. Now, Vanessa said to some effect that the surgeon's room will, basically, basically on the order of their sheet or whatever, they define that this one is the primary and this one's the secondary that they're tacking on. But I would say I would always want the primary one to be the first one that shows up in the booking.

**Greg:** In this case, it wouldn't be the first one that was done.

**Donald:** In this case, you mean the question here.

**Greg:** Yeah, in the case of the ACC pre-op assessment, that would be the first one that was done. It's not the primary.

**Donald:** So remind me, a pre-op assessment is that modifiers?

**Greg:** A pre-op assessment.

**Donald:** Yes.

**Greg:** Is a fixed price service that ACC will pay for where the anaesthetist wants to see the patient before.

**Donald:** Okay, so when I've been going through these diagrams down here and I see things like ACCREC, ACCPAY, I didn't actually know what that meant. When I read your RFP—different ACC, exactly—so I was like, 'ChatGPT, what does this mean?' It's accounts receivable, accounts payable. But this ACC is actually talking about ACC. What does ACC stand for again? Accident Compensation Corporation. That's right, that's right. Okay, so this is actually talking about a specific...

**Greg:** It's a contract, fixed fee contract. It's not, never the primary.

**Donald:** Okay, so I've not heard about this. It's a whole new concept to me. So...

**Greg:** Funny enough, AA don't do much of it. But in this practice in other parts of the country do. Now, don't ask me how this happens.

**Donald:** So do we need to support it?

**Greg:** Yes, I do.

**Donald:** Okay, then that's all that matters. So you're saying that only when ACC is paying for a procedure—so there's a contract that's an ACC contract—in those scenarios anaesthetists will sometimes want to go and visit the patient beforehand, and that's a fixed billable event. In that case, I think the right answer is to modify this requirement we just created over here. These aren't always post-op events; we also need to support pre-op events.

**Greg:** True.

**Donald:** And then it just covers it. It's still traceable to the real procedure.

**Greg:** Yep. Yep, absolutely.

**Donald:** [unclear: brief note-editing fragment]

**Greg:** And they both have the same philosophical approach, right?

**Donald:** Yep.

**Greg:** They're time or fixed price events. They don't attract any other modifiers.

**Donald:** Pre-op events to procedures. That really solves the question. And so when we go back to this, confirm ACC pre-operative assessments, blah, blah, blah, are built separately as flat fees that ACC otherwise follows. Yeah, so this is the answer. So our new feature for pre-op slash post-op events will cover this requirement.

**Greg:** We're noting that they only ever tracked either a fixed fee or a time, but they don't they don't attract.

**Donald:** Okay, so this here says to procedures to capture time only, so we need to say it's no longer time only to capture time or fixed fee fixed fees. Okay, so actually we need to say time. Recordings or fixed fees. Fixed fees.

**Greg:** Yep.

**Donald:** Cool, okay.

**Greg:** So that classic, that's a perfect example of something we're in, this might put in a time, but the contract will override it with a fixed fee, if that's the case.

**Donald:** Oh, good point. Yeah, yeah. So they may meet them for [unclear: possibly 'two hours'], but only charge a fixed fee. Yeah, okay. A new feature will cover this requirement. But yes, these events are recorded and displayed as distinct line items.

**Greg:** Procedures.

**Donald:** On an invoice, they become line items, don't they?

**Greg:** Is that their term?

## Hospital integration formats and supplementary PDFs

**Donald:** Yeah, cool. Okay. Cool. Next: hospital download format. What file formats do the hospital download bookings arrive in? We don't know, and I don't think we need to know this right now, so we'll just leave it as an outstanding question. HL7 is a format, but even within that, I don't think it's safe to assume that if two hospitals both use HL7, the data within those requests will be in the same shape, which means we can ingest them in the same way.

**Greg:** Well, HL7 specifically provides for that mapping, for that variability to be the case.

**Donald:** As in that can be a variable, you're saying? Exactly. Yeah, So anyway, I don't think we need to know this in order to understand.

**Greg:** However, it came to light during the Friday interview—whenever it was—that whatever the hospital download format is, it's not comprehensive, and they need the hospital theatre list to find out who the insurer is or who the contract is.

**Donald:** Yeah, that's probably a level of detail that's implementation that we can worry about when we... I know, but like I said the other day in our call, because we're not charging a fixed cost or trying to give anyone a perfect prediction, like David will often say, when we do integrations they actually just have to be time and materials because you can't perfectly plan for everything in advance. So you just kind of have to get into it.

**Greg:** Well, it's just that that will, when we get this working and we start ingesting HL7 or FHIR, HL.

**Donald:** HL7 v2.

**Greg:** Yeah, v2. We still will have to ingest PDFs because the theatre lists have got additional information.

**Donald:** Maybe we've already said that we think you originally said you thought the first cut of application needs to definitely support PDFs and we've now changed our tune and said actually we think since most things come from the hospital as the largest source of data, maybe the first cut needs to have a similar matching capacity like their current system.

**Greg:** Yeah, we have to pay more. We'll have to pay.

**Donald:** I think we should do that. I think we should just stick with what that is. So anyway, in terms of this, I don't need to answer this because somebody else needs to ask the question who can really understand the information. So I'm just going to edit this to say [unclear].

## List status vocabulary, slots and draft lists

**Donald:** Okay, cool. Moving on. List status vocabulary. Oh yeah, so there's two questions here that are really thorny and I don't really know the difference. There's 27 here and then there's 17, and my brain kind of broke, so I'm going to let you read this. No, we'll do it together. Okay, the RFP gives two different sets of values for list status and doesn't say which is final. Page 14 says this, page 17 says this. Now I might just jump to the other one because it has the full quotes here. The RFP describes two different things that both sound like an anaesthetist is unavailable for a half-day, and it's not clear if they're the same mechanism. Vis-à-vis, words are important. Page 14; page 19, Principle 3: a field painted directly on a list whose own example value is 'on leave', e.g. 'this anaesthetist is on leave Tuesday PM.' RFP quotes: 'Status reflects the current state of the list, e.g. available, available for emergencies, unavailable, on leave.' 'Availability is set at the list/half-day level.' 'A list status is meaningful on its own, e.g. anaesthetist is on leave Tuesday PM, even with no card attached.' So now we would call that—remember the other day we talked about there's kind of three versions of a list? There's a list that doesn't have anything attached, there's a list with something attached, and then a draft list.

**Greg:** So it's a draft list.

**Donald:** It's a list that's been created. It's got bookings in it, but it's not attached to an anaesthetist. And so I've now written into here, there's a language of there is a slot.

**Greg:** How does that occur?

**Donald:** We talked about it on Tuesday with Vanessa.

**Greg:** Try me again.

**Donald:** She said that sometimes surgeon's offices will come through and say, here is my theater list, but it's not attached to an anaesthetist yet. And so other times things will automatically attach, but basically the system needs to have a concept of a list that's being built up before it's attached to somebody. And that needs somewhere to live, so somebody can look at it.

**Greg:** Yes, that's true. Yes, until the list has an anaesthetist associated with it, you don't know its status because this list status is the status of the attached anaesthetist. So actually the list status at that point would be unassigned, if you like. Yeah, so that is a replay.

**Donald:** We can, if we ever get there when we start reading the requirements—this is good, we have to do this, there's no way through this other than doing this. I've selected the language of—and the image before doesn't reflect that anymore—but if we go back to that image for our own benefit: on a four-month rolling basis, when a new day is created, they'll actually have a slot, an AM slot and a PM slot, and it only becomes a list when something's in it. That's kind of the language, because otherwise I think it's really confusing to talk about in terms of developers, code, everywhere else. I think we need some language to say that a list is an entity that contains procedures and things. But we're not actually creating a list for an anaesthetist until those things are there. So they have a slot that a list goes into. Lists can exist unattached to an anaesthetist, and that is a draft list. An anaesthetist can have a list because it's attached to them; it's no longer a draft. Maybe we don't like the word draft—we can change that—but the scheduling system needs to create, and is creating, essentially a slot that a list can go into. That's the terms I've used.

**Greg:** I don't agree with the language.

**Donald:** Okay, but you agree with the concept.

**Greg:** No. Well, in principle, but not in detail. I think, is that true? And if we have a calendar, then the underlying entity in the calendar is the day.

**Donald:** So if we go 4 weeks in the future here, this spot here with Sarah, it says open to cover, but this is, she doesn't have any lists or any cards, you know, as far as this language attached to her. She has a slot that a list could go into. And the moment that, but you know, James over here or our famous Melanie Suiter, she does have, well, okay, she doesn't, but because this example is bad, but if we go back a few weeks then. whatever just go to today, this is a list of bookings.

**Greg:** This to me is a view of the underlying entity, but it doesn't portray the entity structure.

**Donald:** Okay, so name the entities for me so we can be on the same page.

**Greg:** The underlying entity is a calendar in that it's a date. I mean, that's beautiful.

**Donald:** I'm not going to tell you that days don't exist. Yes, days exist.

**Greg:** Right. And what I'm suggesting is that a list is an entity that is associated with the calendar, not the in the first instance. So it's a child of the day. So if there's a day.

**Donald:** So draft list, a list that's not attached to any anaesthetist, that would still be attached to a day.

**Greg:** It's a child of a day.

**Donald:** Sure. Oh, even there's what it says here, right here, day, list, booking, procedure, contract.

**Greg:** So the views that we see don't paint that structure quite that way because they paint the structure from an anaesthetist's perspective.

**Donald:** So yeah, because I think if I repeat what you're saying, an anaesthetist exists in a day, but they may not have a list yet.

**Greg:** Go back to the list you were looking at with melody in it. The problem with that, if you know what the problem with that display is, it doesn't show you the unassigned lists.

**Donald:** Yeah, that's right. This prototype has no concept of a list that's not assigned.

**Greg:** It's a flaw in the original design now that we're talking about.

**Donald:** Yeah, I know. It's.

**Greg:** Quite a big flaw.

**Donald:** I know. So that's what we talked.

**Greg:** Actually, that's one of the big red flags.

**Donald:** Yeah, that's fine, that's right, that's right. So, I really am aware of that. I don't want a bit too fine a point on it, but yes, you made a mistake, Greg.

**Greg:** No, yeah, I did. Well, I copied that.

**Donald:** That's okay, that's okay.

**Greg:** So I think I'm saying there's an error here in Solution Plus's design, or UI design, that has carried through into the requirements document.

**Donald:** That's okay. We're accounting for this.

**Greg:** Yeah, no, I'm not being defensive here. Yeah, I think that the way you're describing this is an anaesthetist-centric view. And I don't think about it like that. I think it's a calendar-centric view.

**Donald:** I think we're on the same page based on how I'm hearing you unpack it. So maybe I'll repeat.

**Greg:** So I'm saying that the process that effectively, it's not the list that's generated by the forward view, it's the bookings into a list that's generated by a forward view. Because only at that time, I mean that the forward view that the. What I was calling the template, the permanent bookings.

**Donald:** Yes.

**Greg:** They're an intersection.

## Recurring bookings and the logical calendar model

**Donald:** I might call those recurring bookings. I think that's a more appropriate term.

**Greg:** I agree. I don't like the historic term. The recurring bookings are the intersection of a hospital and an anaesthetist and a surgeon.

**Donald:** Yeah.

**Greg:** Right. That's what gives them.

**Donald:** So in my head.

**Greg:** Their identity.

**Donald:** Yeah.

**Greg:** And that gets, I'll use the word painted because it's like layers. That gets painted onto the list.

**Donald:** So my mental model of how it is: I agree with you that lists exist against a day. But when a day does not exist, there's no list there, right? Like when you go four months plus one, nothing exists there. And then, again, I'm not a programmer, but as I imagine the system may interface with this, a day rolls over, the scheduling system generates a new day. By default that day is filled with a bunch of empty slots. Then the next process will—let me finish, please—the next process will kick on to say, are there any recurring bookings? Let's go through the recurring booking system and generate recurring bookings for this anaesthetist, this surgeon, on this Monday or whatever. It would fill that slot, and all of a sudden there would be a list: anaesthetist, surgeon, hospital, day, AM or PM. It doesn't have any procedures yet, doesn't have any bookings, but it becomes a list once these things are attached to it. That's my current mental model, and I didn't hear you say anything that discounts that other than maybe—I don't know. Do you just disagree with the language?

**Greg:** I think there's a. And I'm not saying it's your fault; obviously there's a flaw in the logic here. So, yeah, the program creates a day, because it rolls over and it's going to go, okay, new day.

**Donald:** That's right.

**Greg:** I'm pushing that into account.

**Donald:** Yes.

**Greg:** So there's a day, which is just like a parent. It doesn't do anything. And into that, it needs to add lists.

**Donald:** Why?

**Greg:** Good question. So.

**Donald:** Because if it doesn't have a list, me as an anaesthetist would come in and say, I'm not going to work that day.

**Greg:** Well, ironically, that is a list. It's an unavailable list.

**Donald:** In your mind, it's a list. But does the system have to believe it is?

**Greg:** Well, it's an intersection of the day and the anaesthetist and the status.

**Donald:** At that point, it could just be a status. on a day. That's not a list, because a list brings a whole bunch of baggage with it.

**Greg:** Well, the first thing it brings is the name of the anaesthetist.

**Donald:** Yes.

**Greg:** See, the anaesthetist has a calendar, right? It says...

**Donald:** Yeah, maybe I'm getting too much into a position where I shouldn't be dictating how it can... probably near the studio, right? It's ultimately the development team need to define the mechanical.

**Greg:** But I think we need to be clear about what the logical model is, and I don't think we are.

**Donald:** Okay.

**Greg:** So, I don't care. I know it's implemented differently from how this is visualized, but this is the logical model of the entities, right? Not the implementation model, right? Because they're always different.

**Donald:** Okay.

**Greg:** Just the pennies dropped during this conversation.

**Donald:** Yes.

**Greg:** That a list is created from multiple sources, right? The first thing is...

**Donald:** Different people have different types of lists and I don't want to perfectly equate what a list in our system looks like to a list in a surgeon's office because at this stage I'm not confident that we can perfectly take what they're going to give us and assume we have everything to make a list for ourselves.

**Greg:** The Melanie screen, the first thing you could start with is you could create a list for every known anaesthetist.

**Donald:** Yeah, so this is where you're saying the list, and I have a concept of what a list is.

**Greg:** Well, there needs to be an answer.

**Donald:** I don't like the idea of a list. I think we should have some sort of clear language. This is where I'm getting at: I don't care if it's 'slot' or another word, but I think we need a specific term for when something is in an AM or a PM slot that isn't a list, because the system needs to easily be able to say that person's available, that person's not available, or whatever. Conceptually, I don't like the idea of saying that Melanie has a list and then we're going to give her a list. In the prototype as it exists today there's no such thing as a draft list; lists always exist on a person. Previously I was fine with the idea that we make lists for everybody and then put procedures into them. But now we have the concept of a list being its own sort of thing that you can move around, and it can exist without any anaesthetist. In that world I don't think the positions that aren't filled in the future should be called lists. They should be called something else until a list is in it.

**Greg:** Something the user wouldn't run into. Is that right?

**Donald:** Well, if I'm an anaesthetist and I scroll two weeks ahead, I think presentationally I would still see what I expect to see today. It's just, this is the actual PWA here. So this is my prototype and here's the PWA that's on my phone. So if I go here and scroll down, apparently I don't have enough. Oh, this is the week. Here we go. This month. There we go. I can go further. So like when I see this, I don't really need to know whether it's called a list or not. But in my language today, I would say this is an empty slot. And I can offer cover. And again, the particular functionality here, I don't want to start defending because I didn't know enough about AA when the prototype was made. But this is essentially my current language. This is a slot that's not been filled. But this is a list because, well, I would imagine it would only become a list once there's stuff.

**Greg:** In it. Well, what's the difference?

**Donald:** I guess it doesn't need to have, it could be.

**Greg:** Yes, it could be a permanent, a recurring booking.

**Donald:** It could be a booking that's empty, yes, And so, if we go back to this image again, anaesthetist surgeon hospital day, but no procedures, it doesn't need to have a procedure spare list.

**Greg:** Actually, that's where the status changes, right? When you've got a surgeon, a hospital, an anaesthetist. then it is a list.

**Donald:** And it needs to be of a day and an AM or a PM.

**Greg:** Yeah, then it's a list, right?

**Donald:** Yeah, okay, we're aligned.

**Greg:** And if any of those fields are missing, then it's just a slot.

**Donald:** It could still be, yeah, it's just a slot in terms of the anaesthetist side. But you could potentially have a draft list that has...

**Greg:** You never have a draft list.

**Donald:** Could you, in theory?

**Greg:** Recurring booking is a draft list, but recurring calendar is a draft list.

**Donald:** Yes, but in theory, could you have a situation where you have an anaesthetist and a surgeon, but the hospital's not known?

**Greg:** No.

**Donald:** Or you have an anaesthetist, a surgeon, and a hospital, but the day is not known.

**Greg:** No.

**Donald:** Or you have an anaesthetist, a surgeon, a hospital in a day, but a session is not known, is it AM or PM?

**Greg:** No, because the hospital. booking is always the first thing that's done.

**Donald:** Okay, well, if you say that it's true, then that's great. But am I right in saying that we're aligned, that the system should have some sort of mental model?

**Greg:** Yeah, we'll call them slots.

**Donald:** We'll call them slots for now.

**Greg:** They're slots until they've got a full complement of things. So in that case, we've got an anaesthetist, sorry, a surgeon and no anaesthetist. Those are your unallocated.

**Donald:** Those draft lists?

**Greg:** Well, see that now we're calling them lists, but actually we just defined that as a slot.

**Donald:** Okay, well I don't mind if we pick another piece of language for that.

**Greg:** The language that, the language used is that only for this list, because the surgeon thinks it's a list.

**Donald:** Yeah, everyone else still calls it's a list, but our system also thinks it's a list, but it's just a draft until someone is attached to it, I think. Or you can call it an unassigned list. Maybe that's a bit more descriptive.

**Greg:** Well, it's true because the surgeon will bring up and say, I need an anaesthetist for this. So what have you got at that stage? You've got.

**Donald:** Because I just, even though you say all of these need to be here, I just imagine that the system maybe should be flexible enough to say, a draft could contain a lot of different permutations of state. Because who knows, maybe they do have a situation where obviously they'll have an anaesthetist.

**Greg:** Well, an anaesthetist might have to withdraw, in which case the list could revert to some sort of unassigned status.

**Donald:** It could revert before, yeah, because I think the current prototype, it just has you moving a list from one anaesthetist to another. But we definitely know anaesthetist A can't do it, so it needs to revert to a draft and then it could be assigned to somebody else after.

**Greg:** Yeah, I think the language is a hurdle, but I agree with that.

**Donald:** OK, I'm happy to change.

**Greg:** I don't know what the answer is.

**Donald:** OK, we'll keep it for draft for now.

**Greg:** Because I think we need to find something that is intuitive for the users. And I don't think we've found the language for that yet.

**Donald:** Which users? Admin or anaesthetists?

**Greg:** Anaesthetists and admins.

**Donald:** I think anaesthetists can handle the language we've talked about. Sorry, I think the admin staff can handle the language we've talked about. And I don't know if we necessarily need to present that language to an anaesthetist.

**Greg:** Well, they'd never see it.

**Donald:** Well, they would see a slot. They would see that a PM exists for them without anything in it.

**Greg:** Well, by definition, that's free. Isn't that the default?

**Donald:** So a slot.

**Greg:** Hang on a minute.

**Donald:** You know, it could be.

**Greg:** See, that's kind of interesting.

**Donald:** It could be free or it could be on holiday, which is, or unavailable for a non-defined reason.

**Greg:** So let me think about this before I open my mouth. In order to present this view, You need to create a slot on the day, even if it's free or not available, which are two versions of the same, which are both empty concepts. So when you go through populating your days, your four months ahead, you can create a day And theoretically, you could, if you needed to, you could create all the slots.

**Donald:** Yeah, all the slots are filled in. And if somebody essentially has a recurring day off, then that slot is filled in with a...

**Greg:** That's from their calendar. That's from the calendar.

**Donald:** Yeah, I mean, if they always have Tuesday off or Wednesday off, then we can have a rule in their profile to say recurring booking.

**Greg:** And if you've got the concept of a surgeon has a calendar where he has...

**Donald:** Yeah, but surgeons don't have any view into the system.

**Greg:** No, but the surgeon is an entity, could have a calendar. Sure. Which is effectively where you keep the list of his recurring appointments, logically.

## Surgeon and anaesthetist calendars

**Donald:** Between the gap of the prototype and the requirements as they stand now, we've described—or I've described—that there is a surgeon's profile that contains a bunch of information like HPI number and CPN number and all that sort of stuff. So yeah, if that page also contained a calendar, and maybe that calendar is the home for those recurring bookings. Maybe you'd also want another place for them, but yeah, sure, you could have a calendar there.

**Greg:** And similarly, you've got a surgeon, and the surgeon has a calendar.

**Donald:** We just talked about the surgeon.

**Greg:** Sorry.

**Donald:** Anaesthetist.

**Greg:** Anaesthetist has a calendar.

**Donald:** Yes.

**Greg:** Where he pre-marks his...

**Donald:** That's right. Yeah.

**Greg:** Days off.

**Donald:** Yep.

**Greg:** And then you'll leave.

**Donald:** And much like Microsoft Word, like Microsoft Office, or maybe a little bit different than Microsoft Office, but like you can say, I can create a series in Microsoft Office to... say every Tuesday I'm doing this meeting, but then a single instance of it can be edited to be deleted or shifted or whatever. And so, yes.

**Greg:** So that's why I've been calling it a template, because it's used to create.

**Donald:** Yeah, right. It's just a recurring booking. For them, their booking is not a list, it is a status.

**Greg:** So. If you look at that, like I'm looking at the one in the middle, the green one on both sides, right? When you come to present this view, to who? To Vanessa in this case. What information are you looking at that tells you that He's free on those days.

**Donald:** So I'm going to reframe your question to make sure I'm answering the right thing. Are you saying what information does the prototype or our future system have in the background that defines that this is free? Is that what you're asking? Well, I would imagine that four months ago when this day was created, there would have been two slots that were already created for them, an AM and PM, and they were filled with the default status of free. Unless, and then after that, maybe they could have been overwritten, but let's just imagine they weren't. And then in the four months between four months ago and today, maybe cards were put into them and for whatever reason taken out. And so we're looking at the today view for this person.

**Greg:** Or he's changed the status from a holiday to free.

**Donald:** Exactly. Anything could have happened, but for whatever reason Vanessa opens her computer that day and [unclear name] happens to have two free slots because nothing has been assigned to them yet. Does that answer your question?

**Greg:** Well, it begs the question because you said this is really thought discussion. It's good.

**Donald:** I'm cool with all this.

**Greg:** How did that? You're saying that there's a slots been created with his name on it, right?

**Donald:** A yes.

**Greg:** So it looked at as...

**Donald:** No, so a day is created against him, or he's whatever, I don't know the right way around. But he exists, a day exists, and in the cross-section of those two things, there are two slots. An AM and a PM slot.

**Greg:** I guess I've got a mental model internally as a developer.

**Donald:** Yes.

**Greg:** Of creating this as a concrete model that can be modified. You could design it as an abstract model where it was full of holes and then you could infer what the holes meant.

**Donald:** All of the holes came because we now have the concept of a draft list, a list that exists. That's why, like I was fine with all of this. My brain didn't think about any of it until draft lists exist and then it kind of...

**Greg:** Yeah. So Whether it's a concrete model where every slot is created and then it effectively becomes a tree structure that you then operate against, or whether it's a sparse tree, you've effectively got a view here that presents the status of a slot for every known anaesthetist, right?

**Donald:** Correct.

**Greg:** But there are other slots for the same day that don't have an anaesthetist.

**Donald:** There are other slots on the same day that don't have an anaesthetist.

**Greg:** Yeah. As a surgeon, as Roman said, I need...

**Donald:** But we don't track—at the moment, we have no concept of [unclear]. That's a major deficiency in the current system.

**Greg:** But we... It's a major deficiency in the current system. Vanessa's got a pile of paper like that on her desk.

**Donald:** A surgeon can have recurring bookings.

**Greg:** Yes.

**Donald:** But at the moment, the surgeon could exist in multiple lists. That system doesn't say a surgeon can't exist in multiple lists in the same slot. So like Vanessa is a surgeon, you and I are both anaesthetists. Same hospital, different hospital, who cares? We've got two different slots. But currently the system doesn't say we couldn't share a surgeon.

**Greg:** But it's physically impossible.

**Donald:** It's physically impossible.

**Greg:** We don't need to worry about it because the surgeon will never keep himself in that position.

**Donald:** Exactly, but I'm saying I don't think the system should care about keeping track of a surgeon's slots.

**Greg:** We're not. We're keeping track of an unassigned slot. We've been asked.

**Donald:** Oh, so you're talking about a slot being assigned to an anaesthetist without a surgeon?

**Greg:** Other way around.

**Donald:** Say it for me.

**Greg:** A surgeon rings and says, 'I've got a slot. I need an anaesthetist.'

**Donald:** That's a draft. Now, a surgeon could come in and say.

**Greg:** So hang on just how. How does it get created and how does it get shown here?

## Surfacing unassigned work and draft lists

**Donald:** Well, that's an outstanding question, right? How does the application present a draft list existing? I imagine there'll be some extra view, but that's yet to be decided. But yes: a surgeon calls up and says, 'I need somebody today.' Vanessa or the AA staff capture all that information and create a list, and then it exists as an entity within the system without an anaesthetist attached to it. Then Vanessa could look at the screen and be like, out of my 80 anaesthetists, zero of them are free.

**Greg:** Yep, and that happens.

**Donald:** And so that means that list cannot be assigned to anybody that day.

**Greg:** It dies.

**Donald:** It dies or needs to be, have its date edited, whatever has to happen.

**Greg:** [unclear]

**Donald:** The anaesthetist or the surgeon?

**Greg:** Sorry, the surgeon. Cool.

**Donald:** Yeah, so what's the problem? Yeah, what gaps are we still missing?

**Greg:** Well, this, okay, we might be on slightly different pages here. This is one of the core planning views of the system, right?

**Donald:** Yes, So, you're quite concerned about how we're going to present a draft list to any system?

**Greg:** I'm concerned about the fact that somewhere in this view we need to prominently display this existing deficiency. When you assign that list—if you give it to [unclear name]—you're effectively replacing [unclear name]'s free slot; you're moving that list into [unclear name].

**Donald:** Of course.

**Greg:** So is there an entity there?

**Donald:** Being where my mouse is.

**Greg:** Yep. That we are... Are we adding the empty list into that or are we deleting that and just...

**Donald:** I don't know exactly how it would present in a programming sense, because it's not really my position to define that. But in my head, I would say that slot has a status, and then once a list is applied, the list overrides that status—something to that effect.

**Greg:** So we would create these things.

**Donald:** Which things?

**Greg:** These slots. And we create them four months ahead. But they can be manipulated and the system heals itself.

**Donald:** I mean, it's not even healing. It just is what it is. If slots are created four months in advance and somebody edits what's in that slot, there's no healing to be done, because changing from free to busy, on holiday, public, recurring booking—none of that is breaking the system. The system is working as it should.

**Greg:** So I'm a newest anaesthetist.

**Donald:** Brand new anaesthetist.

**Greg:** Rock up, sign up to AA and I'm available next week.

**Donald:** System would generate all your available slots.

**Greg:** That's the healing I'm talking about.

**Donald:** Oh sure. Yeah. So if some brand new anaesthetist turns up, you would define when the start date is and the system would generate slots from that date onwards.

**Greg:** And similarly, I'm an anaesthetist and I've got all my life planned out in front of me and My mother dies and I'm not available next week. So I go into my calendar and I just go, not available.

**Donald:** Yes, and all those lists then go back.

**Greg:** All those lists go where?

**Donald:** Yeah, so where visually or where conceptually?

**Greg:** They're real lists because they've got a hospital and a doctor and all the bookings and they've got no anaesthetist.

**Donald:** I've not gone through the design iteration to figure out how those draft lists are presented. But let's just say, off the top of my head, there's a bunch of stuff on the right here which I'm not sure is necessarily valuable. These reviews are for invoices and stuff like that. My gut tells me I might reserve some of this right-hand space to show draft lists. There'd probably also be another page where you could see more of the draft lists. But I agree with you that draft lists are very important problems that need to be solved by an AA staff member, and the front-end interface needs to make those really clear to everyone who's interfacing with it.

**Greg:** Yeah, okay.

**Donald:** Believe me that I will try and solve that problem.

**Greg:** Okay.

**Donald:** Okay.

**Greg:** So we'll call them slots.

**Donald:** Okay. Yep.

**Greg:** And then, at some point, we can call them lists. So I guess, in practice, these slots... [unclear: possibly "until they've got an anaesthetist's name on them"].

**Donald:** Yep.

**Greg:** What about the unassigned ones?

**Donald:** What do you mean unassigned? Unassigned to who?

**Greg:** An anaesthetist.

**Donald:** That's what a draft is.

**Greg:** They've got a date.

**Donald:** To state your question more clearly.

**Greg:** Yeah, go back to the other display. So on the list there, we've got... what people will continue to call lists, even the green ones.

**Donald:** That's fine.

**Greg:** And on the right, maybe in one of those boxes, we've got a list of unassigned requests.

**Donald:** Draft lists.

**Greg:** Draft lists. So we've got draft lists.

**Donald:** Yeah, totally.

**Greg:** Draft lists. That's fine.

**Donald:** Draft lists. Okay. Let's take a moment here I'll just pause this

## Reconciliation notes

- Speaker attribution follows the source with explicit Greg/Donald labels; the second transcript was used as a second reading for wording.
- The surgeon-profile identifier phrase was garbled in both ASR sources; it is rendered as **HPI number and CPN number** using the established project terminology for this meeting context.
- Short passages are marked **[unclear]** where neither transcript supports a confident reconstruction. A few plausible readings are shown as **[unclear: possibly "…"]** rather than silently choosing one.
- Obvious domain-term ASR errors were normalised where strongly supported, including **Xero, BCTI, ACCREC/ACCPAY, RVG, HL7 v2, FHIR, NHI, AA, pre-op/post-op**.
