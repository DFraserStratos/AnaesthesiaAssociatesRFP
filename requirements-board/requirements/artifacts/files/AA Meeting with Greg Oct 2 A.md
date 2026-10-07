# Anaesthesia Associates Discovery — Reconciled Transcript

> Reconciled from two automatic transcriptions of the same recording. The speaker-attributed transcript was used as the primary source for turn boundaries and attribution; the second transcription was used to recover wording and correct obvious ASR errors. A duplicate copy of the speaker-attributed transcript was also supplied and was not treated as independent evidence. Genuine uncertainty is marked rather than guessed.

**Greg:** I'll just reply to Matthew.

## Opening

**Donald:** Okay, let's read some new questions.

**Greg:** Okay.

**Donald:** Now we ended on question 59.

**Greg:** Is it me? I can't read that. Is that me or is that me?

## Question 60 — AA fee basis

**Donald:** No, I can't read it well. What about that? Yeah. Okay. Question 60 is the next one, but it's marked it for the accountant. So I'm going to read it here, but I think we'll just have to move on. Maybe we can answer it. The AA fee basis settled the shape of AA's monthly fee, fixed charges plus a charge per BCTI issued to the anaesthetist. Still to settle: the schedule of fixed charges; several items may make it up. Two, does the per-invoice charge count only towards invoices that were paid so that bookings move from one anaesthetist to another and not charged twice.

**Greg:** Good question.

**Donald:** Three, does the net fee against the anaesthetist payables, or is it always a separate receivable paid by the anaesthetist? Anyway, we can talk to the accounting about it. It seems...

**Greg:** No, no, no, no, it absolutely doesn't. Under trust law it mustn't. So it's always a separate invoice and it's paid into a separate bank account.

**Donald:** Okay. So we still don't know obviously the answer to number one here, which is what all the different fixed charges are.

**Greg:** No, I don't know.

**Donald:** Two, does the per invoice charge count only on invoices that were paid?

**Greg:** It should. I don't know what it does, but that's definitely what it should do.

## Question 61 — Final fee versus prepayment

**Donald:** Cool, so we can kind of agree on that. And then three, does the net fee against it, or probably the separate, yeah. Cool, okay, well, we can move on from that for now. Final fee above the prepayment, always invoice the balance. Settled, a prepayment above the final fee is not refunded, and in the other direction, the catalogue says invoice any positive remaining balance, but Greg said the shortfall is often let go unless it's really significant. The transcript says there may be a subsequent bill. Is every positive balance invoiced, or only above a threshold? And what is that threshold?

**Greg:** So I'm just doing that.

## Question 62 — Base units and procedure selection

**Donald:** Okay, you solve that. Okay, so we've determined that question 61 we need to ask Ben. So moving on, where base units live and how the procedure is picked. Base units on the RVG code or on the contract. The board answer puts base units on the RVG code master. A contract may override. A meeting agreed the opposite. Base units live on the master procedure list. Each procedure with its own base units ideally derived from the RVG code with the default and hospital contracts taking them off it. And Donald proposed dropping the RVG from its name. Which is it? Also, the user picks from a procedure list group of RVG body headings. How are combined procedures modelled: as a list of operation names and procedures, or the RVG codes? So I can understand why it got confused here. I think we need a list of master procedures, a master list of procedures, which has the groupings of body parts and things. And all the RVG codes; that may reference RVG codes if you want to. But really the base units live in the contracts. And so there needs to be basically generated base contracts that we've talked about, those RVG contracts, and the base units live in there.

**Greg:** Okay, so what are you going to do where the RVG does — it would be pretty rare — but when the RVG changes one of those units that it specifies, how's that going to flow through the system?

**Donald:** My view is that all the contracts are basically maintained by hand. We'll obviously import a bunch at the beginning with spreadsheets and things, but there will just exist, for every procedure, a base contract that is basically understood to be the standard RVG recommendation for base units.

**Greg:** Yeah, I mean if I was doing the wholesale system I'd be calling the contracts a price book. Because there's not much it's really just a linking table that says this procedure, this customer, or this whatever, this price, or whatever. But you could make those contracts children with master code so that you could link backwards. Yeah, you could just change the master code, you just route through the contracts and anything that's got that master code as a parent, it just changes it to that.

**Donald:** Yeah, and it could have multiple parents.

**Greg:** Yeah, we talked about that yesterday. Yeah, good. So, okay, [unclear]. That's all right if we do that. All those thousands — it's becoming really too many relationships.

## Question 63 — Pre-op, post-op and other events

**Donald:** Question 63: How pre-op and post-op events are modelled, named, and approved? Anaesthetists can add pre-op and post-op events, a time or fixed fee, no other modifiers, to a procedure. Not settled: One: is an event a procedure added to the booking, Greg's line, or its own element attached to the original procedure, Donald? I'm going to say Donald. Because we're not adding new procedures, we're adding something attached to a future procedure or a past procedure so that you have linkability to a contract or a procedure, you know.

**Greg:** It's a thing. You've got to put it somewhere.

**Donald:** Yeah, yeah, yeah. I mean, where it exists in the UI, you'd still find it against that procedure, but it doesn't become a whole new--.

**Greg:** Where does it exist in the data model?

**Donald:** Well, that's-- Because that's what I'm thinking about. Yeah. I can't speak to that too much, but I imagine it would attach to the procedure itself. And in the UI, you would just see a list of events related to that procedure.

**Greg:** Even though the coders get to make all these final decisions about what the data model looks like. I think we need to be clear about our logical data model, because that makes it a hell of a lot easier for the database designers.

**Donald:** Much like you proposed a bunch of ways you think it should work, that gave everybody a springboard off to kind of think about it and take it or leave it, right? And so, yeah, we can build upon that.

**Greg:** So I'm thinking about, I mean, there's two ways of thinking about these things. It's like, how do I present? and where they live. And I think one of my biggest bug bears with software development, especially in Microsoft is they conflate those two things. So there might be something that appears that is part of a data model and then they force it to behave like that in the UI and that's so wrong. So I think in here too, where does this live in the data model? Because it's definitely something that has a relationship to procedure one.

**Donald:** Well, I mean, yeah, like.

**Greg:** So, if procedure one, what does procedure one have in it? has some clinical detail and some billing detail.

**Donald:** The events, like the, if an anaesthetist turns up and does a pre-op or a post-op on a patient, they can choose which procedure to attach that to. I guess in my brain, I don't really know whether or not it should attach to the procedure or the contract in that instance.

**Greg:** Oh, yeah, that's an interesting concept.

**Donald:** Mostly if we say nothing, the AI will decide. I don't know technically what's the right call, but in my heart it feels more right to be attached to the procedure.

**Greg:** Yeah, I can't see an argument for it attaching to the contract. What would be an argument for putting it over there? Because a contract to me is like a master table.

**Donald:** Well, since the contract contains a whole bunch of billing information and like billable party.

**Greg:** No.

**Donald:** It's, right, billable party sort of stuff lives in the contract, but those pre-op and post-op events, who knows who they could be charged to? And so if you attach it to the procedure, it could be, the system could be smart enough to…

**Greg:** I don't agree with that argument because The contract may be the default contract and it absolutely doesn't specify a billable party in that case, does it?

**Donald:** Default contracts have, when you pick a default, what we're saying in the system is that when you pick a default contract, we'll present like a name and email field to who it's going to be. And maybe the patient, maybe the guardian, maybe your uncle, I don't know. But that gets determined. And so even a base contract will still have a billable party. I'm not suggesting, I will take your leaning on this. You just asked why, what would be the benefit of it being in a contract? And I decided to talk about what the contract has, but I still really feel like it, my gut tells me it should still be attached to the procedure, but I won't die on a hill here.

**Greg:** Oh, well, I agree with your...

**Donald:** My gut.

**Greg:** I agree with your conclusion that it should be in the procedure. I think maybe we need to have discussion at some later point about what is a contract. That was the thing we got hung up about yesterday.

**Donald:** We had lots of conversations about our contracts. I know. It's clearing my brain. You're still working on it.

**Greg:** It's still, yeah.

**Donald:** Yeah, it's okay. Okay, so answer number one here is Donald.

**Greg:** I don't want to be arguing to do it. Just because it's clearing your brain doesn't mean I agree with you.

**Donald:** Yeah, that's fine, but you'll have to come back later once you've got something, you know.

**Greg:** Yes, I will, yeah.

**Donald:** Number two on it.

**Greg:** Yeah, but I'll come back to you next time.

**Donald:** Yeah, on an invoice, is it a line item or a procedure? So we talked about like a different, I think it's a line item. So a post-op or pre-op event is a line item on an invoice.

**Greg:** And a pre-op event. I mean...

**Donald:** Yeah.

**Greg:** We'd put names on those things, but by the time you get to print stuff on an invoice, it's a bit moot, isn't it? Because they all come out looking like lines, don't they?

**Donald:** Sure, maybe. And I don't know. I mean, potentially AA might want to have them just bundled into a final cost, but I think it's safer to have them split off so everyone can see it and do what they want with it.

**Greg:** I absolutely agree with you with that. I think if you're going to have a pre-op procedure, it has its own life.

**Donald:** Yeah, yeah, yeah. Okay.

**Greg:** Yeah.

**Donald:** Number three, what is its short name? I'll let the AI decide what the short name is for now to have a pithy sort of thing for all these events. But I mean, just calling them events is a nice, what's it called, umbrella term to me because there could also be an event which is an ad hoc invoice, right? Sure. So, does it go through the admin approval before invoicing? These are all generated by admins, so they inherently are pre-approved. Oh, sorry, no, you're right, sorry, yes, some events may be originated by an admin, but you're right, sorry, of course.

**Greg:** I don't think they have a separate life. I think they just travel with the procedure.

**Donald:** So would a pre-op event be billed with the procedure or before the procedure?

**Greg:** No, with the procedure.

**Donald:** Okay, so pre-op events would be bundled with the procedure’s invoicing, but post-op events will be in the next run.

**Greg:** Well, I think we'd need to have a discussion with Ben about this, but I think we did talk about this at one stage, and I think that if there are post-op events or if the anaesthetist thinks there's going to be post-op events, he doesn't submit the procedure for billing; he sort of leaves it, but sometimes, but sometimes it might end up on its own.

**Donald:** Well, sometimes there might be, you know, some period of time ahead in the future.

**Greg:** Yeah, really.

**Donald:** And I imagine an anaesthetist might be motivated to submit a list as soon as he can and just wash up any post-ops that happen in the next round.

**Greg:** They're very sort of do it now people. That sort of thing.

**Donald:** Yeah, get it off my plate. If I have to do something later, I will.

**Greg:** They're tick-box people. That's amazing how they operate. They're very do it now.

**Donald:** Okay, so we'll say that for number four here. Yes. Pre-op is just something that's approved with the procedure. A post-op probably still needs to be approved by an admin person before an invoice is generated and sent.

**Greg:** No, I think an event that occurs before the invoice is approved just travels with the procedure.

**Donald:** I said that, that's what I was saying.

**Greg:** An event that happens after the invoice is raised generates a separate invoice. Which goes through the same process.

**Donald:** But it's the same. It just gets approved like other things do.

**Greg:** Yeah. But it's not that it's a post-op event. It's that it's a post-op event after the invoice was raised. Because normally it would just be bundling. Sure.

**Donald:** Okay. So the pithy way of putting it is that any events, be them post-op, pre-op or additional invoices, are invoiced with the original procedure if possible. Otherwise they're invoiced in the next round.

**Greg:** Yeah.

**Donald:** Okay. Cool.

**Greg:** That's it. I think we should make it simple like that.

**Donald:** Cool. And then five, what may or may not be billed means in practice. I think maybe you said that line maybe in the transcript. You're like, oh, may or may not be billed.

**Greg:** Oh, well, that's again, this originates with the anaesthetist.

**Donald:** If they don't want it billed, I'd say they shouldn't record.

**Greg:** It. Well, they may record it from a clinical perspective.

**Donald:** Do they do that today?

**Greg:** Or we'd need to check with Ben. OK, well, because they record everything, insurance, whatever, and hospital records as well.

**Donald:** OK, well, in that case, I would say let's make a call here and just have a button on an event to say it's billable or not. Yeah, your tick box to say, will this be invoiced or not?

**Greg:** Yeah, and the same thing goes with that, you know, you said you had a pop up with billable. That pop up needs the same sort of thing you get with couriers, which is, you know, delivery address, same as the billing address tick, otherwise you fill it out, right? You can have that sort of mechanism, sorting out your billable party too, just that UI.

**Donald:** Oh, sure, yeah, okay. So for one.

**Greg:** So the database guys are definitely going to implement this as a separate table, so it is just linked to it, right?

**Donald:** Two: line item. Three: all of these are just called events. Okay. I'm imagining that somewhere in the UI, you can just see all the events related to a procedure. Some of them will be pre-ops, and they just will be tagged pre-op post-op. But it's just a generic place in the UI for all of these things to live.

**Greg:** This is fine for the technical people. I don't think events is necessarily...

**Donald:** What would you call... Do you have a better idea at this stage? Renaming things is easy in the future, but we just pick something now.

**Greg:** Okay.

**Donald:** So we'll just call events. And then in the UI on a procedure, All events will be visible. We don't know. There may be other events that may pop up in the future. just give them all a home. Also, this could be an easy place to see the history where if something ever got refunded, you would see an event that just shows refund. Yeah. Does it go through admin approval? All events are bundled with the procedure if possible; otherwise, they go in the next round. Yes, they all have the same process.

**Donald:** Some events are pre- and post-op, yes, but there could be a situation where someone calls up and asks the admin team to record it. So it could come from kind of everywhere, but we know mostly it will be the anaesthetist. And then five: what does “may or may not be billed” mean in practice? Oh yeah. These events have a checkbox to mark whether they will be invoiced. So these events will still be recorded.

## Prepayment estimates and anaesthetist discretion

**Greg:** Why don't you use the same openness for anaesthetist discretion on fixed plus prepayments?

**Donald:** Well, by default, the anaesthetist profile defines if a procedure will be prepaid. And so that is something that the anaesthetist doesn't at this stage really see, I believe. So if I'm getting a facelift done, an anaesthetist is assigned and the anaesthetist has marked that procedure as a prepaid one. I would just expect the admin team to see that, have a step to approve the generation of an invoice to go out right away.

**Greg:** Yes, all good.

**Donald:** And so, obviously there could be situations where, as you said before, the doctor's wife is getting a procedure done, but in that case it probably isn't using a fixed fee procedure. It would be using an RVG.

**Greg:** That would be possible.

**Donald:** Yeah, something like that.

**Greg:** I'm thinking about the ones where you go through that normal process, that the procedure takes a lot longer and the anaesthetist decides to bill more.

**Donald:** But if it's fixed, they can't bill more.

**Greg:** It's a prepayment, it's our estimate.

**Donald:** So, earlier on in the requirements, you described that there were situations where only part of a procedure could be prepaid. And so we had this concept of, okay, you prepaid as a percentage and then the rest gets washed up in the final procedure. But Vanessa made it sound like it doesn't happen, pretty explicitly, she said, no, it's all or nothing. Anyway, we could add to this in the future, but that's what I heard from Vanessa.

**Greg:** Okay. Well, I think it's probably worth waiting. There's a bigger conversation just to clarify prepayment.

**Donald:** I can add a new question.

**Greg:** Yeah, the procedure might be more than an estimated cost.

**Donald:** More or less than the estimate. Okay, so I see what you are saying. This is worth clarifying with them both, I guess, because she made it sound like it was everything. But if they estimate that a facelift is normally 40 minutes and has some standard number of modifiers, that is the prepaid amount in, quote-unquote, full — the full estimate. But if it goes longer, what do they do then? Okay.

**Greg:** Because they don't have a computation. So that's the question. I'm not sure if ‘all or nothing’ captures it.

**Donald:** We can talk about it in the room.

**Greg:** Yeah, my computer is running hot.

## Question 64 — Logical model of days, slots and lists

**Donald:** I'm starting to do some building in the background, so I might need to go plug in. Microsoft Teams also is not helping. Okay, what else? Okay, I'm going to pause this work, so 11 o'clock. Back to here. Logical model of days, slots, and lists. Greg, I think we need to be clear on what the logical model is, and I don't think we are. That's my voice for you. The working model is a day holding an AM.

**Greg:** This has come out of the transcripts.

**Donald:** It's a new one.

**Greg:** It's amazing, isn't it?

**Donald:** Yeah. The working model is a day holding AM and PM slot [unclear: possibly “per active anaesthetist, default free”]. A status on the blah blah blah blah blah. Okay, what are the questions? One, Is the day a real parent of lists, as in its children's and slots only a view? And is it unavailable half days of status, or ironically, quote unquote, a list? I don't think we need to decide that. I think we can leave the AI choose whatever it wants for now, and we're going to be rebuilding it all anyway, so the dev teams can decide what they need it to be.

**Greg:** do we need to decide that? Only because I'm obsessing about the logical model. But we talked about a list and a draft list yesterday. A draft list. Slot — a slot's not the same as a draft list.

**Donald:** Okay.

**Greg:** I'm just going to make some notes here for things to think about over the weekend. As much like you, I think I need chew time on some of these issues.

**Donald:** Okay. so I think for now the prototype can choose whatever it wants to do for that and the developers at this stage will figure out how they want it to be modeled. Good. Question two. Is every slot stored, or are empty ones inferred? I kind of, it's a good question. I would say in my head the empty ones are inferred to just be available and they only get filled in once they have a status that's either not available, when it has a status other than available, then it's got some data in it, or when it's got a list, it's got data in it, that sort of thing.

**Greg:** That was the conversation you were having yesterday about a concrete or a sparse list.

**Donald:** Sure.

**Greg:** Right, that's exactly the question. My view is that it's easier to manage if it's concrete, but it may not be a lot harder to manage if it's sparse and I agree ultimately it's up to the DBA to decide how they're going to do it.

**Donald:** So the prototype can do whatever it wants. When anaesthetists with lists marks themselves unavailable, do the lists become drafts? List status versus anaesthetist availability calendar or they stay with a conflict flag?

**Greg:** Okay, so that means if I got a list it means there are bookings on the list, right?

**Donald:** Yes,

**Greg:** So that means the list reverts to a draft list.

**Donald:** Yeah, so we talked about that the other day, that it's on the anaesthetist to hand this over to another anaesthetist or return it to the admin team. And I think that makes sense to me.

**Greg:** Now, just going back for a moment, I'm an anaesthetist, I go into my calendar and I mark Monday morning unavailable, right?

**Donald:** Does that Monday morning have a list or not?

**Greg:** Well, let's look at both scenarios. So if it doesn't have a list, so before I mark it unavailable, if it doesn't have a list and Vanessa brings up her calendar view and looks at that anaesthetist, what does she see?

**Donald:** She would see that you've marked yourself.

**Greg:** No, I haven't got a list.

**Donald:** I know. I'm with you. She would come here and she would see your name and it would say unavailable.

**Greg:** It might say free to start with, and now I'm going to say not available.

**Donald:** Oh, you're saying before you change... Sorry. Order of events here. You wake up, you see you are free, and then you mark yourself unavailable.

**Greg:** Okay, let me start. Let me go back. The process that generates the forward live view effectively fills in all those days, right?

**Donald:** Yes, and in my view, I was saying that an open slot, a slot when a slot is generated, it's assumed you're available, and then the next round of processes would then fill in any recurring booking.

**Greg:** So this comes back to my argument about needing a concrete list. I think we should create all the slots.

**Donald:** Yes.

**Greg:** So there is something there.

**Donald:** Yeah, sure.

**Greg:** Right, sure. It's effectively the foundation on which everything else is painted.

**Donald:** Great, love it.

**Greg:** So we're calling that a slot simply because we've defined a list as having a booking and an anaesthetist, which is true, because it's only a draft list until it's got an anaesthetist.

**Donald:** Hold on. A list could be created without bookings. according to these rules and everything we've talked about in the past.

**Greg:** What would a list need to be different from a slot?

**Donald:** Well, just specifically, a list could exist without bookings because when you have a recurring booking with a surgeon four months in advance, that list is created against you as an anaesthetist, a surgeon, a hospital, a day, and a session. But — I'm going to turn this other thing off here — not any bookings.

**Greg:** So I think this is where we have a philosophical difference about how we're managing these vacant lists. My original design was proposing that there is a foundation data element, which I was calling a list, which may start off empty, as in it's effectively owned by the anaesthetist and it is showing no activity. It's free. It's showing a free day.

**Donald:** I'm actually not listening now. But keep going.

**Greg:** That's all right. So that I'm saying the default state is the anaesthetist always has a list, but different nomenclature. I'm going back to the beginning, right? Always has an entry in his calendar because he's an, let's call him an employee, because he's an employee, he always has an entry in his calendar, two per day, right? Because he is who he is. And then the issue simply is what is the status of that entry? And so you've got one entity that has different statuses to represent its life cycle. But that there, because you have effectively the primary management view assumes that these lists exist. So if they didn't exist, you'd have to paint them anyway for the visualization of the free spaces because you're calling them slots. But actually it's just a list with a different status.

**Donald:** I'm going to assume that you're doing a lot of thinking out loud there. Do you want to give me a summary? What do you need? Just pause a moment and you say the whole thing again.

**Greg:** There's no slot. There's just a list with a different status.

**Donald:** No, we're not going backwards.

**Greg:** Yeah, we are. Why can't we go backwards?

**Donald:** Okay, we can go backwards if there's a good reason, but can you help me understand what the good reason is?

**Greg:** The good reason is we don't need a slot because it's just a list with a different name.

**Donald:** I think that changing the... Even if the devs decide to model it that way, I still think we need to have our, I still think we need to call them a slot so that we can be clearly understood when we're talking about the differences. Because we don't even have a term for a list that, what is the definition of the word we call a list that has nothing in it?

**Greg:** It's an empty list.

**Donald:** No, an empty list would be a list with no bookings.

**Greg:** I'm saying that the list belongs to the anaesthetist. Well, the day belongs to the anaesthetist and he's divided into two parts because we're looking at this. Put up the calendar view. We're looking at this calendar view. So this is the fundamental model that everybody in the business uses. Right? So they are looking at their calendar, just like you have a calendar, right? Except their life is divided, pre-divided into half days.

**Donald:** Yeah, sure.

**Greg:** So every anaesthetist and every admin looks at a day and thinks about that day as a morning and an afternoon, and that those parts of the day always have a status, always have a status.

**Donald:** Okay.

**Greg:** And that status, when you pre-populate it and you create it in the 1st place, the pre-population, the first pass of the pre-population run, for instance, would go through and it would create just doing one day out there, it would go through and for every anaesthetist it would create a morning and afternoon list that had a status of free. That's the default setup. And then it goes to the anaesthetist calendar and it overlays anything else that might have happened, like public, which is a form of unavailable; holiday, which is a form of unavailable. Or it might, so it applies the anaesthetist calendar and then it applies the surgeon's calendar or vice versa, depending on your priority of who wins. So you might say, well, if the anaesthetist is away and you probably want to put the surgeon's booking in and flag it as a conflict. But you're basically just painting over that single object and changing its status. So if you use that logical approach to how the structures in the system work, what I'm saying here is that this is how everybody currently thinks about them. And I don't think we should change that if we don't need to. And I don't think we need to.

**Donald:** So I feel like I just heard everything you said. And the main point of difference I'm hearing from you is that you're concerned about how an anaesthetist or an administrative staff member considers in their mental model what this green box is saying, what this purple box is saying, what this blue box is saying.

**Greg:** And what they call it.

**Donald:** Yep. And so if they want to call it a list, I don't mind. But I think that in order for us to explain to a team of developers who are building this what it is, I think if we call it a list that has all these things missing, it might be a bit harder for them to think about some of the concepts of when, if they already have a list, but then you give them a list, are they losing the list that was there? Is that list that they already had been updated? All that sort of stuff. But if we just call it a slot, it's a box that you could put a list into. Or it's a box that has a status of I'm free in order to have a list be put in. Or it's a box that has a closed lid because you're on holiday, you're unavailable, whatever. I think that language makes it easier to explain to everybody how it works regardless of the name. And I'm mostly hearing from you that you're concerned that AA staff members or anaesthetists might be confused about the language. And so let's see how it all comes out on the other side of updating all of the prototype stuff.

**Greg:** What we're having an argument about is the logical model versus the implementation model. And I don't mind how they implement it. I really don't. But I think At this level of the design, we need to be crystal about what we're trying to achieve.

**Donald:** Yeah. And so I would like to think that you and I are aligned in the functionality of what we mean when we say slot and the functionality of what we mean when we say list. How the prototype decides to build it, Claude, versus how the team want to build it is up to both of those parties. I don't really need to dictate that.

**Greg:** But I don't want the word slot used in front of the customer. Because they're lists.

**Donald:** Yeah, I mean...

**Greg:** I like the idea of the draft list. I think that's great.

**Donald:** Yeah, it's true. That's what they have. So a big part of being a BA is making things understandable and simple for everyone. And I believe I'll probably still stand in front of Ben or Vanessa and explain it as a slot. But if they still want to think about it as a list, that's fine. But I don't imagine the UI might necessarily call it a slot. Because already you have a lot of context that brings potential baggage when you say a list. As a slot makes it clear in terms of what could be different.

**Greg:** I just don't understand why you need a different entity name when all you're doing is changing the status of the container.

**Donald:** Because if you, again, maybe I'm thinking about this incorrectly. I want to kind of give all the sort of space in the world to me being wrong. But if we say a list is a status, it then raises questions and rules related to, well, can an empty list have bookings in it? Or can a holiday list have, like, you know, status. Lists currently don't have statuses. You either have a list or you don't have a list. That list can have bookings in it or not have bookings in it, but that list doesn't need a status. The space where the list goes.

**Greg:** This is my design philosophy difference from you is that I think, if you like, from a Vanessa and Ben point of view, a list isn't something you create. It's something that is always, it's there to begin with. Just like the day, right? There's always a day, right? And there's always a list, but that's the underlying structure. And then you start adding stuff on top.

**Donald:** But if I'm on holiday, I don't have a list.

**Greg:** You do.

**Donald:** No, because a list.

**Greg:** Is a it's actually it is your slot, right? It is a container.

**Donald:** It is a container.

**Greg:** It's empty.

**Donald:** It's an empty container that a list could go into.

**Greg:** I don't see why you're torturing the users with slot, because they just think about it as a list that's free.

**Donald:** I promise I won't torture them.

**Greg:** I still think that it's wrong to use the word slot in front of the user, because you're forcing them to learn a new term that they don't need to know they don't need to learn.

**Donald:** Yeah, I don't think we need any part of the UI to say the word slot, right? You just literally you have positions on this calendar or this calendar that has things or doesn't have things, and the way it's presented is an implementation detail, and I don't believe that we need to describe any of these slots here, but when it comes to understanding their functional differences and how they operate, this space is a box, a container that has rules based on what's in it.

**Greg:** That's fine, and in terms of having implementation discussions, if you're more comfortable. Or if they want to implement it using the concept of a slot, go for it. But I don't think we should drag that terminology back into the user land because they don't need it.

**Donald:** Yep, we're aligned on that. We had, you know, we were working on a system called Seed Crop Isolation Distance, SCID, earlier this year. And when we were building it, there was a bunch of things in the code base called fields.

**Greg:** Yes.

**Donald:** But we also talk about seed fields, fields that, and so parts of the UI would talk about a field that, anyway, just names are important, they mean things, they cause confusion.

**Greg:** They do.

**Donald:** And so that's why I'm currently still dying on this hill.

**Greg:** Yeah.

**Donald:** Because anyway.

**Greg:** So again, logical model, implementation model. Yeah, Slots belong in the implementation model. Talk about the whole day if you like and I'm happy.

**Donald:** Is the day the real parent with lists as its children and slots only as a view? And is it unavailable or whatever? So I'm going to answer this question in saying the developers slash Claude can decide how it's implemented. But the transcript describes the differences.

**Greg:** And actually they both are children because a slot by definition belongs to a day.

**Donald:** Yeah, slots exist on a day.

**Greg:** They're both children.

**Donald:** Yeah.

**Greg:** So, I know this one, just let me ask you one more question.

**Donald:** Can you let me finish this line first? Go.

**Greg:** So it asked about changing the status there. So.

**Donald:** Well, let's answer the questions in order then. So question two, is every slot stored or are empty ones inferred? Every one is stored.

**Greg:** But that's an implementation detail.

**Donald:** But we agree on it, so let's just write it down. Every one is created and stored across the rolling four months. Okay, cool. And then number three, when an anaesthetist with a list marks themselves as unavailable, does the list become a draft list? And we think yes. So essentially when you're unavailable, it can initiate the flow or ask the question: return to office or assign to an available anaesthetist. Cool. Number four, the final status values and their colours not a concern. You decide. Oh, so the final status values. There was a whole question we had that we answered the other day, I think, in terms of when I pulled out the RFP document, it was question 17. What do we decide with that?

**Greg:** Well, I think that they're effectively an enum.

**Donald:** That's right.

**Greg:** And I think that the users are still a bit confused about what they want those values to be. And I think that points to the fact that the trap of making them an enum because, but then they are operated on logically. It's a bit of a bind. I think we need to have a discussion with the user about the permanence of these statuses, because they have a lot of redundant statuses at the moment. So I think we need to get a very clear definition of that from the user, because it's very hard to change that. A change in status is a logical change. It's something that a code operates on. It's not just a label, is it?

**Donald:** I don't know. I assumed it could be.

**Greg:** Well, for instance, if it's just a label, how do you determine what colour it's going to be?

**Donald:** I would have thought you could have a status that has some sort of, whatever, ID in the background. And it can have any label it wants. It can be signed any colour it wants. You can change those things willy-nilly.

**Greg:** And let's say you want to add another status.

**Donald:** Then you got a new status. It has a new internal ID and you pick its name and pick its colour.

**Greg:** And so from the program’s point of view, does that have any logical consequences?

**Donald:** Well, I'm not, because I'm not an expert, but I assume you would have status one, status two, status three, and whatever they're called and what the colours are can be defined. And what their rules are can be defined. Any downstream processes that need to make decisions based on the status can just look at status one, status two, status three, not the name of it. That's what I would have thought.

**Greg:** Okay, so I think that, will need some implementation thinking, but yeah, kind of, so I agree with you. We can set them up as a user-based list that's much better than an enum. Yeah, I can see that could be one of those areas where we get a new customer and they have different statuses.

**Donald:** That's fine. That's why if you can rename them, but frankly they have the same rules, then you're fine. If you need to have more of them, that's fine. Okay. That's it.

**Greg:** So I know this is winding up. Just let me ask you this question. So a slot is a container.

**Donald:** This is in my mental model. I don't know if it has to be the actual practical model.

**Greg:** Yeah, that has a status. But basically a slot is sort of the same as a list with no children, right? If it's got no children.

**Donald:** That's right.

**Greg:** It's childless. So you've basically just got another entity in the hierarchy. That's right. Which is fine.

**Donald:** And so I will need to update this. Let me put a little post-it note here.

**Greg:** See that slots? That thing that says list there.

**Donald:** This thing here or this thing here?

**Greg:** That square.

**Donald:** Which square? The blue one or the yellow one?

**Greg:** There's a sort of a green one there. The blue one that's got list written on it.

**Donald:** The one my mouse is on.

**Greg:** Right. So that you're now saying that there's a square around that which is called slot.

## Question 65 — Notifications when lists move

**Donald:** Yeah. And so up here I already mentioned that it's like an AM and PM list. This will need to be updated to be closer to our current mental model. Yeah, we'll get there. Next one: who is told when an anaesthetist moves their list? Handing a list to a colleague without office confirmation. An anaesthetist can move their own list to the office — it becomes a draft list — or push it to a colleague's free slot, with no acceptance needed. Not said: is the office staff notified? Is the colleague told? Does the cover-change email go to the hospital? Yeah, sure. So recommendation: the office is notified and offered a cover-change email; colleagues see the list appear with a notice. I'll say accept, because we already have the concept — this is question 65 for the transcript — of drafting emails based on a change to a list, sorry, a booking. And so in this case, when an unassigned list has come back or a draft list is sitting in the warning area and needs to be dealt with, somewhere in that process flow you could also have it generate the emails that need to go to the parties. It's the same sort of change-state email flow.

**Greg:** In our dashboard, have we got the concept of an alert log where you might get notices that don't require action?

**Donald:** I don't know yet. We've talked about the fact that there is a to-do list, right?

**Greg:** Yes, this is more like a notification. It's a notification list. So because I'm thinking that every morning there might be several of these occur And it might be useful for Vanessa to know that those lists have moved.

**Donald:** Okay.

**Greg:** You could just drop it into a sort of an alerts table that flicks up on the dashboard.

**Donald:** Probably be best if we call it notifications.

**Greg:** Yes.

**Donald:** That's kind of has a level of baggage that everybody understands. AA admin portal. And this would be a shared notification pool, not individual. So yeah.

**Greg:** If you're logged on the screen, you can see it.

**Donald:** Shared notification pool. So this is a new feature that we will have to add in. That's right. Our budget's infinite, right?

**Greg:** What?

**Donald:** Our budget is infinite.

**Greg:** Yeah, that's right. We'll just build a dream system.

**Donald:** Office are notified and offered coverage. Okay. Yes.

**Greg:** I know I have a weakness in this area, but also it makes it very easy to set.

**Donald:** Yeah, you're a compromised stakeholder.

**Greg:** I might be the owner.

**Donald:** But not yet.

**Greg:** I'm not compromised at all.

**Donald:** At the moment, one customer is paying for this.

**Greg:** Yes.

**Donald:** Yeah. All your recommendations.

**Greg:** We just haven't decided who we're paying.

**Donald:** Yeah, it will also be a new feature.

**Greg:** They could just scroll, I think, but how do they expire? Just let them scroll.

## Question 66 — Contract identifiers and contract search

**Donald:** Well, there'd be, action notifications and unactioned ones, that sort of thing. Yeah. Okay. Contract identifiers and finding contracts among thousands. This is 66. Every contract needs AA's own unique identifier. So that's our system's identifier, with holder codes kept for reference. So these are other parties’ codes. And combinations are contracts too, so there will be thousands. Quote: what coding scheme does AA use for contracts, and how is the bucket kept navigable when picking one — procedure, then hospital, search by code? Donald, give me a shot to make it navigable. Recommendation, a short structured AA code per contract And a picker filtered by procedure, hospital and code search. Let's go with that recommendation.

**Greg:** Yep, I agree. It's to be designed. I think that's the challenge, right? We need to design a contract.

**Donald:** What's that?

**Greg:** Just to do, Microsoft to do. I'm just making some notes about things I need to think about over the weekend.

## Question 67 — Contract ownership and billable party

**Donald:** Nice. Who a contract belongs to and who pays. So a contract defines the billable party with many contracts, with as many contracts as needed. Greg said that contracts are always owned by the hospital.

**Greg:** Just a minute. Just a moment. Is my wife asking about money? That's important. I'd like to defer that to Monday. This is where you think you've got the model right and I think I just haven't got it.

**Donald:** I haven't even finished reading the question.

**Greg:** Okay, I'll let you finish the question.

**Donald:** Okay. Greg said both that contracts are always owned by the hospital — a price book — and that a contract always has a funding source. The catalogue, aka the requirements — requirement 24 — also lets admins set billable party on the booking independently of pricing. Which holds? Is there a fall-through order for who pays, blah blah blah. Okay, recommend it. Draw a fall through. What's a fall through? I don't really desperately understand what it's saying, but I can state what I think it needs to be.

**Greg:** Can you show me what you wrote for the previous question?

**Donald:** If I must.

**Greg:** Are you grumpy?

**Donald:** No. I just had to scroll.

**Greg:** I'm not sure what the, I don't want to end up going down another wormhole with the contract, but I'm just wondering whether the assumption that we should create a default contract is actually fucking us up. And that we maybe we could have, because at the moment what they do is when they select a contract on their little app, RVG is one of the contract types, which basically means.

**Donald:** You're saying today? When they do it.

**Greg:** So they're basically saying, don't bother about contracts, just use the standard pricing. Because then if you don't have a default contract sitting with every, let's call it hospital. It's not technically, it's not strictly hospital, but let's call it hospital. then you could say absolutely that the billable party is resolved in the contract detail because the billable party is always the hospital that holds the contract and there is no contract with individuals at which point you're using the RVG. And even though you may do a procedure at a hospital.

**Donald:** Okay, I wonder if you could still go away and think about this. When you're ready, we can chat about it again. Okay. Split, contract split basis, settled. A contract bill can be assigned party [unclear].

**Greg:** Sorry for the interruptions, I won't be long.

## Question 68 — Split billing basis

**Donald:** Question 68. A contract can bill the assigned party in full or split its line items between parties. I would correct that because it may just all be a single line item so it needs to basically be able to split in any which way and what the line items say is something we will need to figure out. The split basis: the board answer says percentage only. Donald says percentage or free field. Okay. As Greg preferred, typed dollar or percentage. You could also type in $48, or you could type in a percentage. Okay, what is it? [unclear: typed value, dollar or percentage, set on the booking, defaulting to 100%]. This is just an implementation detail. Yeah. You pick what's best. Okay, cool.

## Question 69 — Booking update emails

**Donald:** Update email, question 69. Prompt after saving or on-demand button. Settled on the update email is offered, who gets and who it goes to. The mechanism is to be defined. A prompt after each save, Greg finds that annoying or a draft email button that uses changes the system remembers since the last email? On-demand button with remembered changes. Yep, let's go with that. But not since last email. It might be nice if there was a history of changes where you can pick one or many, One second. Which makes up the summary of changes in the email. Okay, your question.

**Greg:** When's this email being sent?

**Donald:** So there's a number of events that can happen in the system that cause a booking to be updated in an AA system, and then it becomes out of sync with anybody else's systems. At the moment, they manually send emails to other parties to correct that. And this here is something that is just visible on the admin screen for any bookings. And then they can do it ad hoc.

**Greg:** So shouldn't we have template emails and one of them is attached to each of these scenarios?

**Donald:** Well, the way I've just described it here is that yes, it would be a template email, right? It'd be a, you know, hello, party, you know, booking has had a number of changes. Sincerely, somebody, yep.

**Greg:** So that's a user configurable template somewhere, and there's a list of them.

**Donald:** Could do.

**Greg:** Can you associate them with the event? Because there's a change of anaesthetist, there might be an error, there might be a cancellation, there might be.

**Donald:** Yeah, I mean, that could be the case. Yep.

**Greg:** Okay.

## Question 70 — Prepaid booking moved to another anaesthetist

**Donald:** Cool. Prepayment, so question 70, prepayment when a prepaid booking moves to another anaesthetist. Three readings were heard. Credit the whole prepayment and repay the new rate, which was an earlier question, which was ages ago, 21, so it's kind of out of date. Which Ben disagreed with, there you go. A new anaesthetist keeps the agreed amount and wears or benefits from the difference. Yes. And then the next one, the draft payable pair is repointed to the new anaesthetist. Confirm with Ben that the agreed amount stands, and the anaesthetist who does it is paid.

**Greg:** So what's the question?

**Donald:** I don't really understand the question. So number two is true. That, so let's just go into the answer here. The new anaesthetist keeps the agreed amount and wears or benefits from the difference.

**Greg:** Yes.

**Donald:** This is true. The next part, the payable pair is repointed to the new anaesthetist. Yes. I mean, only one half of the pair.

**Greg:** This raises a question about when in the life cycle we should create— or no, we'll have to, we'll have to amend the payable pair because the trust account in Xero always has to balance because it's always got payable pairs in it. So we need to...

**Donald:** “Repointed” is probably wrong here; it is updated to the new anaesthetist.

**Greg:** Yes.

**Donald:** Confirm with Ben that the agreed amount stands and the anaesthetist who does it is paid. I mean, that's assumed. Yeah. This is the answer.

**Greg:** This is the answer.

## Question 71 — Negative balance with no later payment

**Donald:** Okay, cool. Recovering a negative invoice with no payment later. A refund after the anaesthetist has been paid becomes a negative invoice netted in their next payment run. We have established that. If there is no later positive payment to net against — for example, the anaesthetist has stopped working with AA — Greg: the only person who can fund the refund is the anaesthetist. How is this recovered? So this is going to be an edge case, right? Somebody retires and they have some negative amount in their ledger. I would say you just handled that outside the system.

**Greg:** Yeah, you handle that outside the system. Yeah. It would be an extreme edge case.

**Donald:** Yeah. I mean, yeah, exactly.

**Greg:** Basically, they just settle that up with the anaesthetist. But it could happen. Yeah, it could happen. They could.

**Donald:** I'm one day away from retirement and somebody wants a refund.

**Greg:** Well, I'm one day away from retirement and somebody cancels on a prepaid, right?

**Donald:** Yeah, yeah, yeah. But that's, if I cancel on a prepaid, that doesn't matter because that money's in trust and the anaesthetist hasn't been paid so it doesn't have to return it.

**Greg:** So what's the scenario then? You're quite right. What's the scenario?

**Donald:** Thank you. I like being right. The scenario is, yeah, let's just do something really morbid. So it's like extreme. Your month end payment wash up, whatever, happens on a Monday.

**Greg:** Yep.

**Donald:** And so the next day is a new month. And before you start any of your other future procedures, somebody from the previous month gets a refund. And before you go on your way to the procedure to the hospital, you get hit by a bus and die. So you as an anaesthetist suddenly have a negative balance for a month and there's no positive balance to take that negative out of. And so how does AA get money from that anaesthetist?

**Greg:** Not only is it an extreme use case, but... The anaesthetist in practice never gets fully paid because he's always got this tail of unpaid accounts, right? So it would be an extraordinary event.

**Donald:** Yeah.

**Greg:** So no, don't worry about it.

**Donald:** Great. 72.

**Greg:** In fact, I pretty much guarantee they'd write that off. But anyway, don't worry about that.

## Question 72 — Additional invoices, credits and rebilling

**Donald:** Additional invoice details still open. Which pricing rules apply to additional invoice? And additional invoice is a free form. It's free form. Open: one. Does the description mean description or discount? Damn it. It is description.

**Greg:** You fixed that. That shouldn't be in there.

**Donald:** I should have figured it out from context; it was in the transcript.

**Greg:** Yeah.

**Donald:** Description is description. Yep. If you're talking about discount, can it go to a different billable party from the original? Yes, they can pick anyone they want for these additional invoices. It's just a free form, flexible thing for them to decide. One, two, three.

**Greg:** Actually, yeah, we're going to make life a lot easier if you say no to number two, aren't you?

**Donald:** No, what?

**Greg:** Because.

**Donald:** Yes, they can. They can go to anyone. If for whatever reason, it's just, if somebody says, I want you to mend or fix up whatever the billing is on a procedure.

**Greg:** Yeah, this lets them mend it.

**Donald:** Just means they can do whatever they need to.

**Greg:** Cool.

**Donald:** Yeah. And they'll all be recorded as events in the events area for that procedure. Three, when a combined procedure is split into additional invoices, is the original invoice credited? Now, my brain thought about this, but kind of shoved it away into a dark corner.

**Greg:** Yeah.

**Donald:** But yes, what practically needs to happen? You answer that while I talk out loud. Oh, no.

**Greg:** Excuse me. That's important. Hey, Ash.

**Donald:** Good morning.

**Greg:** How are you? Good.

**Donald:** Returning. So how is the original fixed cost from a combined procedure handled when you create the additional ones to resolve it? This is probably somewhat of a question for Vanessa, but we can kind of brainstorm what the tools we could give her are. And so all of this kind of depends on if it happens before or after something's already been invoiced. In the scenario that Vanessa shared on Tuesday, she described it happening after the invoice has been sent.

**Greg:** Yes.

**Donald:** And so in that case.

**Greg:** The insurance company will ring up. It's always the insurance company will ring up and say, Can you split those out, please? So she basically should be crediting that invoice and rebilling it.

**Donald:** Yeah, exactly. So probably somewhere in the additional invoices functionality is the ability to create a credit against that invoice. And so you'd have one event, which is the credit to party A, and then you'd have three split out events, which are invoiced to whoever needs to be invoiced.

**Greg:** Because it needs to come up to the same amount she needs to sort it out. So yeah, it should automatically include a reversal. It should.

**Donald:** Yeah.

**Greg:** Isn't there a refund option? It's not a refund option. It's just a credit and rebill.

**Donald:** Credit, refund, okay.

**Greg:** No, very different.

**Donald:** Okay.

**Greg:** One's cash, one's not.

**Donald:** Well, in the scenario that Vanessa described, party A, well, I guess it depends on whether the invoice has been paid. The invoice may be sent but unpaid. But Vanessa described, yes, but Vanessa described a situation where the patient gets the invoice, and then later on it's figured out that it needs to go to Southern Cross. And when it goes to Southern Cross, they want to split out, but the patient didn't need to split out. That's the scenario that you described.

**Greg:** So there you are, you refund the patient.

**Donald:** If they've paid.

**Greg:** If they, well, no, so you raise a credit note, right?

**Donald:** Okay, sure.

**Greg:** You raise a credit note and that turns up in Xero as an imbalance and you refund it, right? So there's a separate refund process goes there, which sorts out the Xero problem. And you're actually billing a different party at that point.

**Donald:** Yes.

**Greg:** So you're not just rolling it back in?

**Donald:** But it's flexible, right? Any party could receive that credit note, be it the original. Yeah. Anyway, using it, there's a credit note option.

**Greg:** And don't worry about the refund, because that happens outside the system.

**Donald:** Sure.

**Greg:** Now it would be very nice if, as part of this process, the system could bring the detail of the original invoice into the second invoice. So first it does a credit note and then it takes the line items and puts them into a draft invoice, which is your starting point for the rebuild. It would be very helpful.

## Question 73 — Prepayment and billable party

**Donald:** It would be helpful. Okay. Prepayment invoice when the patient is not the billable party. So question 73. Who raises the prepaid invoice at booking setup? The answer says: raise the prepayment invoice only if the patient is the billable party. So I think to clarify what that's saying is we said that if an insurance company or hospital is the billable party, the anaesthetist does not require it to be prepaid, because that's an institution that's going to have a harder time running away from their bills. But when it's a patient, then they do get prepaid, pre-invoiced.

**Greg:** It's an interesting question that we haven't talked about. So prepayments are always patient-direct, in instances where the patient is paying their fee directly. So there's no hospital involved in this process, right?

**Donald:** So the next part here says, in the meeting, Donald said, we say patient as a generic term, meaning the person paying for the patient, for example, the guardian. Does a prepayment apply when the billable party is the guardian and when it is an insurer or hospital?

**Greg:** So it's never an insurer or hospital?

**Donald:** What do they say here? Recommendation, any person paying for the patient, never an organization. Yes. That's right. Cool. I think we were close or very close. If we do well, we can finish all these questions before lunch and then come back and move on to requirements.

**Greg:** Yeah, great.

## Question 74 — Patient balance warnings

**Donald:** Okay, a patient balance warning. What the threshold counts from and credit balances. Confirm 90-day unpaid patient threshold is the name of the question says alert AA staff about patients with positive or negative balance for amounts owing: mild under the threshold, strong above it. So if they have a negative balance younger than 90 days, they're still warned, but it's like not a massive notification. It's a notification. Yeah, but if it's above, it's basically the difference between a yellow and a red warning. Not answered, what the days count from and how is a positive credit balance shown? Count from the invoice date, show a credit balance as a mild warning. Yes, that's kind of what we already, I thought, established.

## Question 75 — RVG time rules and the remaining prepayment question

**Donald:** This is second to last. RVG time rule: check against RVG 2021 text. RVG time rule after two hours: settled that time units only come from the RVG rules. The check it asked for is still to do, e.g. compare tiered time units. What is that? Time units are tiered, not linear. For the first two hours it's one unit per 15 minutes; from the third hour it's one unit for every 10 minutes. Yeah, so that's clear.

**Greg:** What's the problem?

**Donald:** What is the problem here? [unclear]. Including how a partial interval is rounded.

**Greg:** It's always rounded up.

**Donald:** Time is always rounded up. And it is always using the RVG tier. Outstanding question for prepaid procedures. Last outstanding question for now. Oh, this is the one we wrote earlier. Is it all or nothing? We're asking Ben.

**Greg:** I still think all or nothing is unhelpful, but I can explain it to him.

**Donald:** Cool. Okay. Well, let's consider this done. And what I can do here, I'll pause my recording.

## Reconciliation notes

- Terminology was normalised where both transcript context and project terminology strongly supported the correction, including **anaesthetist**, **RVG**, **Xero**, **payable pair**, and **SCID**.
- One sentence in the slot/list discussion remains uncertain and is marked inline: the phrase after “AM and PM slot per active …” could not be recovered confidently from either transcription.
- The source transcriptions include a few moments where Donald reads working notes/questions aloud. Those passages have been kept as spoken content rather than rewritten into final requirements.