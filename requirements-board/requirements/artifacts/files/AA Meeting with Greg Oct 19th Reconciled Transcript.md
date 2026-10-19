# AA Meeting with Greg — 19 October 2026 — Reconciled Transcript

> Reconciled from two automatic transcriptions of the same meeting. Speaker labels come primarily from the named transcript; wording has been checked against the continuous transcript. Obvious recognition errors have been corrected without converting the conversation into formal meeting minutes. Unresolved wording is marked `[unclear]`.

**Participants:** Donald and Greg

## Opening and screen share

**Donald:** I purchased software. I'll just get Stratos to reimburse that. What a bloody shitshow this has been. I'm sorry, mate.

**Greg:** It's all right. It happens.

## Submitted lists: office review and corrections

**Donald:** Okay, so let's go ahead and just share my screen and we can go. Nope, not that screen. We want to share this one. Okay, cool. So we have a recording, hopefully talking about the new feature. We can move on from that and look at the submitted feature. Once a list has been—feel free to turn your camera off, I don't mind. Once a list has been submitted, the office reviews it, corrects it, and the anaesthetist can see it and can change it until it is authorised. For example, realizing on the next day that something was wrong, submitting makes the list less prominent for the anaesthetist and tells the office it has a job to do.

**Donald:** So that's the feature, not the actual user story. So let's read the user story. Once a list is submitted, the anaesthetist can still see it and change its bookings until the office authorises it. These changes are audited. The office sees them at review. The last change stands. It stays visible to them, less prominent than active work, scrolling up from today on their main view until it is authorised. Cool. That seems fine to me. We don't have images of this yet, but we will in the future.

**Donald:** Cool. Next one here, office review of contracts and references. The admin reviews each booking on a submitted list covering its procedures, contract selected for each one, each shown as text received, then the contract and the RVG code. This is linking to another user story that we haven't, we got into the other day, which was the description and the contract being shown together. If we look at the history of this guy, is this new? I think it's new. I think it's one that we, it was made on the 7th, but some updates were made yesterday. Okay, so we did look at it. Okay.

**Donald:** Cool. Whether a procedure needs an insurer's contact, the insurer status that came with the booking. So these are the things that they're reviewing. Where did we land on having insurance as a status or a chunk of information in our app?

**Greg:** It's meant to have the insurer and the insurance approval number. Those two things have to sit somewhere on the booking.

**Donald:** Okay. They would check.

**Greg:** And the thing is, if one is, if the insurance is blank, that's probably okay if the patient's paying. Otherwise, you need to specify the insurer and the office at this point would be checking that the approval was there, but the hospital will have already done the work for them. So they just need to make sure their version has got it as well.

**Donald:** Okay. Cool. So this is just listing all the different things that the admin team might review.

**Greg:** Yeah.

**Donald:** The admin then approves the contract selections made earlier or corrects them. The review raises two warnings, neither a block. If a patient is under 18, [unclear] the payer on the booking or the procedure billed for that payer? So a warning if the child is the payer on the booking. And then the booking says the insurer will pay, but there's no insurer contract chosen for any of its procedures. Still marked as confirmed in the design. Pre-approval often falls through on the day when the patient and the anaesthetist changes to the contract, or no-contract RVG. This makes mistakes in the anaesthetist contract choice and billing details are caught before the list is authorised. AA acts as an agent for independent anaesthetists, so the system accepts the anaesthetist choice and relies on this review. Okay.

**Greg:** Yep.

**Donald:** And then it doesn't really talk about features more. It's just like an understanding of what happens.

**Greg:** Yeah.

**Donald:** And then office corrections. The admin corrects a booking directly without sending it back to the anaesthetist. There's no returned state. Until the list is authorised, the anaesthetist can also change it. Neither side has authority over the other. The last change stands. In practice, the office is usually the last one to touch it.

**Greg:** Yep.

## Authorisation and whole-list billing handoff

**Donald:** Cool. Authorised! Once the office authorises the list, it is locked and handed to the billing/invoice engine as a single unit. This is so the engine always works from a stable, unchanging record with no risk of late clinical corrections, disrupting the billing already calculated. So that's the feature, the user story. The admin marks the list as authorised. This locks the list's bookings, procedures, and contract versions selected for them, and passes the whole list to the booking slash invoice engine as a single unit.

**Greg:** Now, did we at some stage have a conversation about whether the users were okay with keeping everything batched as a list? Or do I recall, did we have a conversation that said you could let go the ones that were good and hold back the one that was...

**Donald:** Oh, interesting. I can't remember.

**Greg:** I can't remember whether I thought about it or whether we talked about it.

**Donald:** Yeah, No, I have some vague memories of what you're talking about. So I... Well, let's search. Let's just go over here, maybe. Go to the board. [unclear]. No. There's no partial payment, there's no partial invoice pair creation.

**Greg:** Let's leave it like this because it's cleaner to start with and it will work.

## Immutability and post-authorisation corrections

**Donald:** Okay, cool. Immutable after authorised. The system rejects any attempt to edit an authorised list, its bookings or procedures. This keeps the list exactly as it was when it was handed to the billing invoice engine. So the record, so the record it works from never changes underneath it.

**Greg:** That's sort of a long way of saying it's locked.

**Donald:** That's good. And we've already discussed many times that in the situations where AA needs to do some random stuff, they have the tools of generating credits or invoices, ad hoc attached to a procedure if they need to. So they can always kind of have ways of doing stuff to fix things. But they wouldn't go back and edit something itself.

**Greg:** No, so it becomes like a list of changes really, rather than changing the original. It's all good.

## Anaesthetist app: list visibility and outstanding balances

**Donald:** Cool. List visibility in the anaesthetist app. Once the office has authorised a list, it's sent through to invoicing. The list drops off the anaesthetist main view and its invoices show as lines in their outstanding balance. The anaesthetist can still find the list afterwards by search. This is so the main view holds the work still in progress while the anaesthetist can still go back to finished work when the invoice is [unclear: "queried" or "settled"] months later. And so here's some stories talking about that. The list leaves the anaesthetist main view once the office authorises it, hands it to invoicing. Its invoices appear as lines in the anaesthetist outstanding balances. So I guess those are lists. These are accounts, I guess.

**Greg:** There's probably going to be a time delay about that. I don't think we need to worry about it. I think we'll just We'll just train the anaesthetists that it's like an overnight refresh and they should just check the next day and that'll give everything time to catch up again because Xero will not operate. I don't think it'll operate completely in real time. I'm not sure if it does.

**Donald:** Yeah, I mean, I don't know, maybe I'm too impressed with my team at Stratos, but I would expect that they would see this pretty quickly because we have a pair, right? And so we create a pair of entries in our system. our pair would still interface or our internal ledger would still interface with Xero to like get status updates and changes and all that sort of stuff. But I'd like to see, I would like to think that some version of it would be visible pretty quickly.

**Greg:** Yeah, well, when they insert the record, they're going to get a, there's a return value which has got like a unique ID on it. So actually, that is, that is, it's synchronous effectively. Yeah.

## Anaesthetist main view and transition to open questions

**Donald:** The list stays findable afterwards through search, by patient name, [unclear], NHI or date. This is where the main view holds the work still in progress, just repeating itself here. Okay. Cool. And then the last one here, anaesthetist main view. The app's main screen shows any list starting at today, upcoming work, any earlier list not authorised yet, which you can scroll back to; lists they have submitted that are not authorised, which they can still change. Yeah, that's right. That's yeah, it was a bit confusing, but I got it there. So you can see all the work coming up and any previous work that has not yet been authorised.

**Greg:** Yeah, two and three are almost repeat.

**Donald:** Yeah, it is repeating itself on 7.4.2. Authorised lists are not shown there, anaesthetists find them through search. Again, repeating this, okay, this is fine. So, what I realized I've done here is I've not confirmed these, so I'm gonna just quickly whip back through them. Okay, now that we've finished this epic, I actually think the best thing for us to move on to might actually just be working through questions. We haven't looked at the questions in a long time, and I think that would actually unlock a bunch of different bits and pieces. So when we last left things, there was a handful of questions up here that we're going to hand ask to the accountant. This is obviously a technology question for us. Another accountant question. Ben, I believe, has answered this. Booking without an NHI update. NHI is mandatory with no block.

**Greg:** It's mandatory now, so that's that.

## Question 77: pre-authorisation invoice splitting

**Donald:** It's answered. Okay, save that. Cool. What the AA per-invoice fee counts and how the fee is paid. This is a question to the accountant. Okay. Donald to ask AA, splitting the combined invoices, the rebuild total, therefore... Okay, I thought this was answered. Rebuilt lines must equal the total. Yeah, so still open part three. How a split asked for before the combined invoice is sent is handled. I don't understand.

**Greg:** Oh, okay. Before it's sent, I don't think it does it make any difference.

**Donald:** Parts one and two-part three partially. So part three was not raised with AA, with Greg the same morning. There's a good chance that this would get caught before it was invoiced, so you wouldn't need to raise a credit. What you actually want to do is override the fixed price and split it It sort of contravenes the can't-change-price rule, but it's fine. Maybe we should just leave things open. Donald floated showing the pending invoice can be cancelled. So what's it asking here? I don't understand, actually.

**Greg:** It's saying, well, the first process is it's gone out, so you roll it back and redo it. But of course, if it hasn't gone out, you just— the admin just edits it.

**Donald:** Yeah. So if it's not authorised and sent to the billing engine yet, you would just, yeah, you would just edit it.

**Greg:** Just edit it.

**Donald:** Okay.

**Greg:** So that should just say that's handled by a normal admin edit.

## Shared admin notifications: resolution and retention

**Donald:** Yeah. Okay. Just bringing this down here so I can see it. Okay. Well, Claude, when you read the transcript about question 77, please mark it as completed and just, yeah, change it to represent what we've just said. Okay, Donald to ask Vanessa what posts to the shared notification pool, how long it lasts. This is a really wordy meeting update. This question we answered, answers added to a shared pool to the admin app, separate to the to-do list. The first source is anaesthetists moving their own list. not settled. What else posts to it? Whether notice expires or kept, how do they expire? Just let me scroll. Yeah, I'm just going to do something in real time here. There we go. Okay. [unclear]. All right. To be more clear about what the question is. Okay, let's come back to that.

**Greg:** I think the answer here is they just need some sort of tick and flick mechanism where It's a shared notification. Somebody reads it. If it's just a notice saying being moved to this list, you just tick it and move on.

**Donald:** Yeah.

**Greg:** Because it's saying, well, you know, now you know, if you need to do something about it, do it. But I've told you. Yeah. Okay. So why don't we just say that it should have a tick-to-hide mechanism or something?

**Donald:** Okay. I'm fine with that. I still don't actually quite know what's been asked. And so what I'm doing?

**Greg:** What's being asked is how do they expire so they don't stay on the list on the screen?

**Donald:** Yeah, okay. Well, I've kicked off this.

**Greg:** What would you suggest?

**Donald:** I think what you've said here makes sense to me. I just want to see this finish rewriting it to make it more clear to me.

**Greg:** Yeah, okay.

**Donald:** But I'm very much on board with what you've said here, if that's if that's the right question. Editing. OK, let's come back to it.

**Greg:** Oh, and then down the bottom there, there's that item again there. There we go. Yeah.

**Donald:** Live update. So still to answer for Vanessa. What else posts to the pool? Only list moves are agreed. One candidate came up. And this is flag a procedure back to the office to check. So yes, we've talked about that. And so lists and bookings can both have an option somewhere to raise it with the office alongside a note so they can check something or make an edit or whatever. Do notices expire, either keep every notice and let the list scroll and paginate or archive old ones after a certain amount of time. So I would say that they would only ever be archived or hidden once they are resolved. So one, for now, lists and bookings will have an option to alert the office. To review slash action, then with a note. Two: never expire; must be marked as resolved manually, then hidden. Three: Can a notice be marked and actioned or read? Donald raised it, but a notice, by definition. There's no action. So there's no state to read. So yeah, I think I don't like the idea of one person reading a notification but not actioning it and then having it look like it's been read by somebody else. So I feel like it just needs to be active or resolved. Do you agree?

**Greg:** Sorry, my mic was turned off. Yeah, that's exactly right. It's a tick box thing. So why don't we just put tick box and brackets and just leave it like that? It answers all these questions. I need a way to make them go away, whether they're to do or notifications. I think we don't want notifications that all just magically disappear. So that's good.

**Donald:** Okay. cool.

**Greg:** Yep.

## Question 80: prepayments and the holding account

**Donald:** That's great. Donald asked Greg when a prepayment receivable and payable pair is created and amended. Actually, I'm going to let's do something here.

**Greg:** We probably changed the thinking since this was written.

**Donald:** Yeah.

**Greg:** Because now we don't pay the money to the anaesthetist, we hold it. And it makes all the curly problems go away.

**Donald:** Okay, I've just asked Claude to kind of look at all the open questions and make sure they're actually worded in a way that's easy to understand what the outstanding question is. Yeah, so when a prepaid booking moves to another anaesthetist, the payable half of the draft is updated to the new anaesthetist. Yes, we'll amend the payable-pair recommendation. Create a pair, create the pair when the prepayment invoice is generated. as the catalog already says, and amend only the payable on any move before the procedure. I don't know. I mean, you've, I quite liked your idea that like the pair is kind of generated. Wait, when is a pair generated? It's generated only on authorization or prepaid.

**Greg:** No, there has to be a pair created when it's prepaid.

**Donald:** Yes, but.

**Greg:** Well, that's a very good question because if it's a prepay, it shouldn't be credited to the anaesthetist. We need to set up a prepay account that has the same sort of accounting status as an anaesthetist. So it's the prepay account with the balance of the prepay account would be all the deposits we've received for procedures that have not happened yet. So that's a very, that's a great catch.

**Donald:** Can you read the, can you explain to me what the question is?

**Greg:** Hang on a minute. This question is about how we manage all the accounting backwards and forwards. On the assumption that the anaesthetist is paid the prepay at the time it's received. And that's no longer true. So we now need to hold back the prepay. Hang on, I just changed my headphones. Can't hear my own voice. That's better. We need to change the accounting around the prepay so that when we issue the pair, one side of the payer is the patient. And normally the other side of the pair is the anaesthetist. But in this case, the other side of the pair would be the prepay holding account. So we could treat it just like an anaesthetist and it would all work fine.

**Donald:** So here we say is if a prepayment is outstanding, we jump all the way to the end of the billing invoice and we create a linked receivable and payable pair and the internal ledger would generate the prepayment invoice and send the pair to Xero. And I guess this is the question here that we've just been talking about. When are a prepayment receivable and payable created: when the invoice is generated, approved or paid, when is the invoice generated, approved or paid? I still don't get the question, sorry. I don't think I'll get it. But this has now been updated, so let's make this more clear.

**Greg:** I can answer this question. The invoice is always generated in order to collect the prepayment.

**Donald:** Yes.

**Greg:** Right. Otherwise, you haven't got a prepayment, right.

**Donald:** Yes.

**Greg:** But—hang on a minute. But instead of paying the anaesthetist that amount, we hold it.

**Donald:** That's right. Yeah. So this question here, I mean, the first two options is a little bit interesting to say that does an administrator need to approve it before the prepayment is sent? And I think that makes sense to me. It becomes like, you know, I can imagine on screen A, they select the anaesthetist's prepayment contract and then when they close or save that screen on screen B, which is when the screen when they need to approve all the invoices that go out, that item would be listed there and they could approve it, right? So that makes sense to me and none of this money received because the money can never be received unless it's been sent. So I don't really understand why it's asked that as a potential option. So prepayment invoices generated when an admin approves it. Yeah, cool.

**Greg:** Is the answer.

**Donald:** Yeah. At which points, at which point is it amended? Candidates, when it moves to an anaesthetist, a cancellation or the final invoice. So yeah, I would say the moment the, like, oh, okay. So when the prepayment has been sent to me as a patient, it will say, Greg, your anaesthetist, needs a prepayment from you, Donald. And then the procedure moves from Greg to Vanessa. Do I as a patient get an updated notice that my prepayment has changed to a different anaesthetist or do I just receive nothing and it's fine because the bill I paid is still true?

**Greg:** Patient didn't know who the anaesthetist was going to be in the 1st place.

**Donald:** They don't. So just they just get an invoice from AA. Because I thought when they get an invoice from AA, it's actually it's got AA's information, but it's actually still the anaesthetist name.

**Greg:** This is a prepayment, so it will have an invoice accompanying it. Not an invoice, I'm sorry. This is a prepayment request for a prepayment, so it will have the invoice, but it will also have an email that has some text in it. So that text could well, could identify the anaesthetist. When the list is moved, there's nothing to stop the system saying, sending out an email saying your anaesthetist has changed.

**Donald:** Yeah, but your payment remains the same. I think that makes sense.

**Greg:** The payment's been paid, right?

**Donald:** Yeah, we saw it, but yes, that's right. But I would imagine in the same email, you just kind of get in front of any potential question that could be there, which is said, hey, your anaesthetist has changed, but you need to do nothing. This is just informational, you know.

**Greg:** Yeah, whatever they want to put, no worries.

**Donald:** Yeah, okay. And then third question, is the payable still updated on a move given the director's later rule that the system should have no logic to detect these flows?

**Greg:** I don't know about that one.

**Donald:** Yeah. What is this referring to?

**Greg:** Yeah, if a booking is moved, so the payable doesn't move because the payable is no longer the anaesthetist, the payable is the holding account. So this is a little bit of accounting that you might not be familiar with. So normally you send out an invoice. The two legs, there's actually four legs, but the two legs would be between the patient and the anaesthetist. But in this case, a prepayment is between the patient and the holding account. So the money sits in the holding account. And then when the booking is confirmed and submitted and Because it's a prepayment, instead of generating another invoice to the patient, it generates another pair to move the money from the holding account to the anaesthetist. That's how they get it. Whichever anaesthetist did the list.

**Donald:** Okay.

**Greg:** So it's just a two-step. So that workflow will have to change a bit because a prepayment now is a two-step process. One is to collect the money and put it into a holding account. And the second step is to move it from a holding account to the anaesthetist.

**Donald:** Yes, and in a regular procedure, you know, the money would go, well, Yeah, the money would always come into AA, but then always instantly go back out to the anaesthetist, whereas in this case, it's pause until the procedure is actually finished.

**Greg:** Yes.

**Donald:** Yeah. Okay. Well, Claude, please update question 80 with our answers and mark it as complete. Let's just answer, let's just look at this thing here. So, Donald's expansion. The system should not try and have any logic to detect these flows. that would retrigger any sort of calculations. Okay, so I think what this section here is mentioning and what it's asking about here was saying that should the system try and calculate the differences between anaesthetist A&B? And the answer is no. Whatever was the prepaid price for the first anaesthetist when the booking was created and the prepaid invoice went out, that's just the price. That's what that's talking about. Yeah. I'm happy with that.

**Greg:** Yes, hang on a sec. I'll just turn the mic off for a sec. Yeah, there's some, there's a thing there about what do we do with prepays where there is a, where the anaesthetist overrides the price, but that's, we might need to go and revisit the prepay process again in a bit more detail. But let's leave it for now.

**Donald:** Is that a thing that can be done? It's prepaid and it allows a price override. All those prepaid prices, all those prepaid contracts that are made, I guess in theory they can be configured to allow an override, but practically speaking they shouldn't be. They should just be a fixed cost like, yeah, they should be a fixed cost, right?

**Greg:** Technically, they are always an estimate. And Ben said there's a strong [unclear] that they don't change prepaid values, right?

**Donald:** Yeah.

**Greg:** We're only talking about a few a few guys here, by the way. It's not the whole fleet. So but they are allowed to both up and down, which was in the document, you know, that I updated recently and that was checked by Ben. So It's just that in this situation you could have a change of anaesthetist, a holding account and an override amount and they could all happen on the same procedure. So we may need to redraft that a bit so there's some clarity. We'll see what Claude makes of it next time around.

**Donald:** Okay.

**Greg:** I might draw that out because it is a bit subtle and it's going to happen Sunday.

**Donald:** Okay.

**Greg:** Because it's a combination of process and accounting rules and it just all gets a bit heavy. It's easy if you're an accountant and you're happy with doing debits and credits and ledgers, but if you don't really understand ledgers, it might all seem a bit like black magic, but it's not really.

## Question 81: sickness and reassignment

**Donald:** Yeah. Cool. Okay. Short notice sickness, draft list or conflict. Already settled. When the day rolls over, the system creates a blank slot, applies the anaesthetist availability, and then the surgeon's recurring bookings. A recurring booking that lands on an unavailable slot becomes a draft list for the office to resolve, yes. When an anaesthetist marks themselves as sick at short notice, do their bookings take the same return or assigned path as any other unavailability on a booked slot? Or does the office record it as a conflict with the bookings left in place? So I think what this is asking or talking about is that when we look at the admin screen right now, there's some demo data in here. I guess let's refresh it. Is it on this day? Hospital's closed. Some of this may have changed. Here we go. And this is unavailable. So this list is currently showing as assigned to James, but has a warning to say that the anaesthetist says they can't do it. And so I think what this question is asking, which I think I like the question, is, in a world where draft lists now exist, it would make more sense, I think, for any of these things to just fall back to the anaesthetist, sorry, back to the admin office and not still stay on the anaesthetist as a thing where they're sick. Do you grok that?

**Greg:** Do you remember Ben talked about this in one of our meetings? If I remember correctly what he said, he said that on the day, the anaesthetist would typically resolve it himself because it's one of those ring a friend, can you do the list type things?

**Donald:** Yeah, this is one of these 6 a.m. sort of situations.

**Greg:** Yeah, or even a morning and afternoon. And they often try and find, do you remember they often try to find it as an anaesthetist who's doing a morning list at the same hospital and ask him if he can do the afternoon list. So they do that sort of thing. But I think if the anaesthetist would normally, if it was on the day, the anaesthetist would normally try and resolve it first himself or herself. And certainly if it was after hours, that would be absolutely a necessity. Otherwise they give it, I think he said they give it to the office, like if it's the next day or later, they give it to the office and ask them to sort it out.

**Donald:** I think, yeah, I basically see this as two paths. You either reassign to somebody else and mark yourself as unavailable, or you hand it back to the office and mark yourself as unavailable. But I don't see that there should be ever be a state where you keep it with yourself and mark yourself as unavailable, because then it requires proactive searching from the admin team.

**Greg:** There's a risk there that the anaesthetist could mark as unavailability first and have it disappear, and that wouldn't be helpful.

**Donald:** Yep, that's a fair question. We should figure out the kind of proper UX flow. And if like we could make it so that the system detects if you have a list on a day when you've marked yourself as unavailable and force you to resolve the question, transfer or return to office.

**Greg:** Yes, this would, yes, this would be a question that was relevant to a today list rather than a tomorrow list.

**Donald:** Yeah. I think there was already an idea and some of this is represented in the prototype here with the draft lists where they're sorted by the most relevant day at the top. So, you know, 21st AM, PM.

**Greg:** Yeah.

**Donald:** So it would basically sit in here somehow.

**Greg:** Yes, I think that's fine. I think you can have a single, as long as you had a I double check that. Check the anaesthetist before he sent it back to the office to say, do you want to send this to the office or do you want to reassign it yourself? But also that view you just showed me, that solves the problem anyway because it doesn't disappear. If it drops off his phone, he can go to this sort of view and he can see the list at the top of the page and he can do it from there.

**Donald:** Yeah, this is the admins portal. So this is the admin people seeing this. But I basically don't ever want there to exist a situation where they still have a list assigned to them and they can't do it because they just, I think that's just a recipe for disaster.

**Greg:** It is, you're right. So I think as soon as they try to do the assignment to say, I'm unavailable.

**Donald:** Yeah.

**Greg:** It forces them to make that decision about do you want to transfer this list or do you want to return it to the office? So that's conscious.

## Authentication and platform questions

**Donald:** Yeah. Okay, cool. Well, Claude, can you please update question 81 based on our chat and all relevant stories? Okay, this is actually just something we haven't talked about at all. It's probably, well, let's just talk about it. So far, an account login for the anaesthetist PWA is assumed. What's the one this is going to be? Still to answer for Donald, which platforms are supported? Yes, we don't know that yet. Can an anaesthetist sign in with biometrics? Is MFA required for an anaesthetist single sign on offered? So yeah, these are all questions to kind of ask towards the end of the discovery, I think.

**Greg:** Yeah, I think so. I think so. You need to know what your platform's going to be before you can answer them.

## Question 84: status of a vacated list slot

**Donald:** That's right. So save that. Okay, what a slot shows after a list is moved away. What status does a vacated slot take by default? Technical discussion says returns to available or marked as unavailable if appropriate. I guess it depends on how the list is moved away. I would say, and the prototype shows a little bit of this. So when you click on a list here and try to reassign it to somebody else. Let's just do it to this person. It does ask you what does the vacated slot become, right? So you would say that is free, but we just needed to move it for whatever reason, or they're unavailable. And so you confirm that they become unavailable. So I would say some version of that would still exist for this. So if you choose to transfer a list to somebody else or transfer it to the office, the app needs to ask you what does that slot become? And I think it will be the same pattern there.

**Greg:** Agreed.

**Donald:** Is the anaesthetist who moves the list asked? Yes. So right now, I think you only see this from the admin's side, but if anaesthetist himself moves a list, they should be asked. And so let's see if any of that is in here. So let's open this list here. Move this list. Here we go. Some of this is already programmed in, I think, based on our previous conversations. Return to office and then mark as unavailable or free. This is perfect.

**Greg:** Fair enough. This is very nice. We like that.

**Donald:** Okay, so this is good. That's not really a question that's worth being asked, I don't think. Does the same apply when the office reassigns a list? Yes, all of this is all true. Claude, you're wasting my time. Answer this question. 84.

**Greg:** One path is the answer, isn't it? And it's there.

## Question 85: moving individual bookings

**Donald:** It's always the same regardless. Okay, how an anaesthetist moves a single booking? Already settled, anaesthetist can move a single booking as well as a whole list. How does anaesthetist find that receiving anaesthetist? [unclear]. You'd kind of want to have a search box to search for anaesthetist. Yeah, so there is some version of like seeing the availability of your colleagues. So I just want to see all colleagues that have a free slot. So the system, the apps already doing some version of this in the prototype. But the prototype here only shows a handful of potential anaesthetists. And so maybe if you already know who you're looking for. Some sort of search box would be valuable.

**Greg:** Do you know when we talked about looking at the RVG code and I said it had type ahead on it? If you could just type a letter in for the name, that would work well.

**Donald:** Yeah, like it's a, like an active search box where as you type more letters, it continues to filter. Kind of like what happens.

**Greg:** Yeah, it just filters down the list.

**Donald:** So booking and... this is like, it's showing live results as you go.

**Greg:** Yes, that's the one.

**Donald:** It's just that sort of idea.

**Greg:** It's that. It's that.

**Donald:** So how does the answers find the receiving list? They could search via an actual search function or they could scroll the list of available lists. That's the answer to this. So Claude, we're talking about question 85. Does the booking land? Where does the booking land when the receiver has no list in their slot? One option is that the list created on the fly for that booking? Yes. If so, may others be added to the booking? Greg favoured this case. Yeah, so basically you can only transfer the list. So you can only transfer a single booking to either somebody who has a free slot or if they also have the same hospital session surgeon. I don't think that really exists because you're with that surgeon. So when you're moving a booking, it's already with you because you're with that surgeon, right? Is there a use case for moving a single booking?

**Greg:** Yeah, there is. Remember the use case was that somebody rang Ben and said, I don't want to do this child. So he did the last procedure of the list.

**Donald:** So you would have to be free. I do remember you saying that.

**Greg:** Yeah, Ben was free, created a list and put the one booking on it.

**Donald:** Yeah, so I don't think there's ever a situation where you transfer a list, sorry, a booking into somebody else's list. The only option is you transfer it to somebody who is free and it creates a list in that slot.

**Greg:** Well, Ben was free. Yeah, because they can't be working on another list, right? Because they're working.

**Donald:** I mean, in theory, couldn't they have a list that actually only has a couple of sessions in the first half of the AM slot? And they could take stuff in the second-half of the AM slot.

**Greg:** Yes, they could, absolutely.

**Donald:** But our system doesn't really support anything like that at the moment. And I wonder if their current, does their current app support that?

**Greg:** Actually, that's a very good point, Donald. We've created this arbitrary only two lists in a day, but in theory, Ben could do a couple of procedures at Christchurch Eye and then go down the road, literally down the road to the charity hospital and do a couple more all in one afternoon.

**Donald:** My question is, today in their current app and Solutions Plus, Do they basically cover this outside of the system or is it covered inside the system?

**Greg:** No, they do it outside the system. But see, charity hospital is not so bad because it's not billed. So the system doesn't need to know about it.

**Donald:** Yes.

**Greg:** But possibly if it was, let's just, let's make the requirement at the moment that the anaesthetist has to be free. And they can, they can have a play with that. And we can change it later if it's not working.

**Donald:** I think it needs to be free, yeah. Otherwise, you really have to re-engineer a lot of the logic here.

**Greg:** You do. You have to go back and say that you can have multiple lists a day and it gets really complicated. Yeah, for the small benefit, it's probably not worth it.

**Donald:** Yeah. Does the modify, or does the move notify as a list move? Wait, does the move notify as a move list does? That is post the shared notification pool and offer an update email. So I believe there's a concept now. This is something you raised, which is that when you move a list from anaesthetist A to anaesthetist B, a notification would be passed on to the admin team to know about it, but you don't have to do anything about it. So that's kind of the difference between a to-do list versus the notifying.

**Greg:** And that could possibly include... they could offer to raise an email or they could just flag it. Don't bother.

**Donald:** Okay, so there's an option to notify the admin team if needed.

**Greg:** Yeah.

**Donald:** Okay. And then last one, does the blacklist apply a warning? I believe heard in the conversation with Ben was no. That anaesthetists shouldn't be warned when other anaesthetists have a blacklist with a surgeon. And this is a situation where Look, these people ideally would try not to work with each other, but they're professionals and they can deal with it for, from time to time. Is that was what I heard.

**Greg:** Yes, I think it's very sensitive in terms of not everybody knows what's going on.

**Donald:** Yeah, cool.

**Greg:** And remember in the same conversation, Ben talked about a rank for matching. So directors, shareholders, non-shareholders in terms of reference for how the system might auto-allocate lists.

**Donald:** Well, this is, yeah, I do certainly remember all those conversations. My memory wasn't quite that it was auto-ranking, not auto, it wasn't auto-assigning, but if you look, see here where I reassign.

**Greg:** It was sequencing the list of availability. Yeah, so you using that seniority?

**Donald:** That's right. So if I go ahead and reset the data here, you can see a version of it and I guess I got it tomorrow. It'll be a bit better. So you can see all the available anaesthetists and you can see their tiers. And so it's kind of weights some doctors like Kate here higher than it does down here. And then you can see that Priya here has a preferred pairing with that surgeon.

**Greg:** Excellent.

**Donald:** So that's excellent.

**Greg:** It's really very clever, isn't it?

## Question 87: integration-driven changes and rescheduling

**Donald:** Yeah. So, okay, Claude, we talked about a lot there in question 85. Please update. Now onto 87. Automated reschedule from an integration, 3 unsettled cases. Proposed so far: verify. Okay. For an automated reschedule from an integration, a clash means the change is accepted, but the list becomes a draft list and a single booking can move. onto the same surgeon's list in a new session whomever the anaesthetist.

**Donald:** So I guess the idea here, right, is that a new booking comes in from a hospital or a surgeon's room and it goes into the matching screen that already exists today. And the admin staff need to approve that or create, basically, let's bring up an image, a picture's worth a thousand words.

**Donald:** Cool, this is the one here. So on the left here, we've got our booking sources. Now other hospitals and surgeons rooms, these are future work to be done, but we know that hospital integrations will exist. So they come into the matching screen for the admin app, in the admin app. The AA admins, they will look for, or the system itself, sorry, will look for a match. So if there's already a list that it has the exact same matching surgeon, hospital, day and session, and patient NHI, it knows that it can present the differences to the admin staff and they can approve it. Whereas if nothing exists, then the admin staff will need to look at it and create a new booking. You with me?

**Greg:** Yes, it's not unusual. In fact, it would be normal for a list to start with one booking and then they will get at it over time.

**Donald:** That's right. And so what I believe the question here is asking, all the question here is asking is, or even what's pre-proposing here is that if an update comes in, so we go back to our image here, so.

**Greg:** Actually, can I just stop you there for a minute? Can you go back to the left side of that? See how that diagram is drawn with the solid line on the hospital? I think subsequent conversations have determined that the surgeon's room is probably the dominant provider of information and the initializer, the initiator of information. And the hospitals are only seen once, on the day before the list is performed. So I think how it's going to work out is surgeons room is marked here as future work, but I think we may need to invert that and make the hospital's future work and the surgeons the initial work.

**Donald:** OK, I will. I think it's worth having a next time we have an all of us in conversation with Vanessa and Ben to talk about this, because I certainly remember at the beginning you talked about surgeons' rooms being the biggest intake, and then we had another conversation with Vanessa where she said, No, most bookings come from the hospital.

**Greg:** That's right.

**Donald:** And then you've since had a conversation where you shared with me that they said that the hospital actually only gives, you know, a handful of updates. Or maybe most of them start at the hospital, but then there's actually not many updates until the day before. That's kind of was the idea.

**Greg:** No, they start at the surgeon's room and the hospital only updates the day before. This is the latest version I've had from Ben and Vanessa together. I'm not sure that Ben actually knows.

**Donald:** Yeah, so probably worth getting some more clarification on that. So I'm happy for all of us to not really be set in stone. We need to figure that out.

**Greg:** It doesn't matter. It just determines which integration gets done first. That's all.

**Donald:** Yes. Yeah. Okay. So going back to the question here, for an automated reschedule, so if this will be an update from the hospital in this scenario, if they say actually this procedure is going to have the same surgeon slot, but it's going to be one week from now and the already assigned anaesthetist has something else in that slot, what's going to happen, right? So a clash means a change is accepted. So we will still take that update from the upstream systems. But the list becomes a draft because we can't attach it to that same anaesthetist.

**Greg:** And I think this is, there's some interesting language here. I think it's very common for the time of a procedure to be rescheduled within a list.

**Donald:** Sure.

**Greg:** If it's a different day, by definition it's a different list. And I think we need to look more deeply at what happens from the surgery end in terms of if they cancel a list and move the list to another day, what they're really doing is moving all the bookings onto a different list.

**Donald:** Yeah, I can see that. I mean, that I don't know if this is a conceptual explanation or a practical actual what they do, but I think I hear what you're saying.

**Greg:** I think that's what they do. And I think, you know, this is this question sort of trips over itself because it doesn't understand the difference between a list which is immutable because it's defined by what day it's on and the bookings which sit on the list and then the bookings get moved to another list. I think that's fundamental to how the system works. And I also think that's how the surgery thinks about it.

**Donald:** So just to play that back to you, in a situation where a surgeon's office moves all the bookings that was in list A from this week to next week, are they moving list A and updating the day or does list A is actually get deleted and it's recreated in list B with all the same bookings?

**Greg:** List A gets emptied, right?

**Donald:** Yes, emptied.

**Greg:** So I'm not sure whether that means it's a draft, but it goes back to being a slot almost for the whatever happened. Yeah, it would go back to be a slot. Say the doctor was sick and it was cancelled, right? That list would be perhaps cancelled. We could think of it as cancelled and then the bookings arrive again on different days, right?

**Donald:** Yeah, so a new list has to be created. Things aren't moved when a day changes or a list is cancelled. As far as our.

**Greg:** Our system is concerned, the bookings move, the list doesn't move. And actually the way the doctor would do it is they would cancel the list and repopulate another day. They wouldn't actually do it as moves because they don't have the capability of doing that across an integration. So we just get PDFs, we just get new PDFs arrive and those bookings would be popping up on a different day.

**Donald:** Yeah, so I would see like if the way I would imagine, now maybe this is a technical question for somebody else, but the way I would imagine is that The version of Donald that existed on list A is a different, like I'm still the same patient, unique NHI, but the unique identifying number for that booking is not kept, right? It's literally a new booking is created with me and it's deleted. Yeah, so essentially, yeah, that's right. So that makes sense to me.

**Greg:** I don't know what happens to the booking, but I don't care. It just becomes an empty slot at that stage.

**Donald:** Yeah, the slot is restored. The list and all the bookings in it get some sort of cancelled state, archive state, whatever the right word is. And then downstream should, well, I mean, presumably this is all one action where an update is given, it changes the day, and therefore the previous day or list needs to be somehow removed and the new one is created with, rehydrated with new information.

**Greg:** Yeah, but not by us. All right. So we get the simple end of it. We just delete the booking and the new ones just arrive because they might not move the list in toto. They might re they might reshuffle those bookings amongst existing future list. That's right.

**Donald:** It's not always one to one.

**Greg:** No, we don't care. We just delete it and wait for new news.

**Donald:** Cool. Well, I'll say that that's good. And then where does a single booking go when it moves to a session? So I think we've answered this. What happens when the whole list moves to a session? We've answered that and how is the move recognized at all? I think we answered all of this. So Claude...

**Greg:** It raises an interesting question though, which is how does the surgeons rooms notify deletion? Because we just get PDFs. So we're going to have to detect where a booking is no longer on the list where it was before because a patient may have insurance declined. They may say, okay, I'm cancelling that. And what happens is the rooms will delete the booking and they'll send us a snapshot of the list again and it just won't be there. So we're going to have to do some sort of match and merge. to detect removals.

## Short break

**Donald:** Yep. Okay. Cool. This is cool. Well, Claude, if you can go ahead and update question 87. And I think I want to have a little 5 minute break to go to the bathroom. Sound good, Greg?

**Greg:** Okay, cool. Yeah, good. I'll just wait for you to come back.

**Donald:** Cool. I'm going to leave this call open. I'll be back in a moment.

**Greg:** Yeah, I'll make a phone call. Cheers.

**Donald:** Okay, I've returned.

**Greg:** Sorry, [unclear] took longer than planned.

**Donald:** All good. Are you finished?

**Greg:** Yep, I'm good. Thanks.

## Question 89: contract rates, discounts and contract lines

**Donald:** Okay. Let's get back to it. Where are we? are looking at, I guess, this. Yeah, nice. Okay. Question 89. Is the time band dropped from the contract lines? The contract defined rate is an override, contract defined rate, okay, is an override rate in place of the anaesthetist's for the whole procedure, not just a separate billing line. A fixed discount is a contract level percentage discount. Contract lines have lost the add-on flag and quantity rule, and the anaesthetist adds their own price discount where the contract lets them change the pricing, okay.

**Greg:** That's a bit scary. They're just talking about the rate there, aren't they? Not a price. So they're talking about the unit rate?

**Donald:** This is describing what presumably is already true based on the documents we've provided. We have to decide if we agree with it, but the contracts defined rate as an override, so that's true. the whole procedure, not just the billing line. So yeah, so basically you've got a procedure, procedure has one contract. If that contract has a custom rate that is defined, then that's the rate that's used.

**Greg:** Yes.

**Donald:** A fixed discount is a contract level percentage discount. So if a contract has a fixed discount on it, then you know, then this can't do a price override because the discount's already been applied. Contract lines have lost the add-on flag or a quantity rule. I don't know what that means.

**Greg:** No, I don't know what that means.

**Donald:** Okay. And the anaesthetist adds their own price or discount only where the contract lets them. So everything else on there is true except for this part I don't understand. So I'm going to ask Claude what it means.

**Greg:** Yeah, I think the definition of what's fixed or not might be a little rigid, but we can worry about that another day.

**Donald:** Okay.

**Greg:** So there's this question about, we'll need to ask Ben and Nick, if a contract specifies a rate, price or discount, are anaesthetists allowed to change it? We haven't really clarified that to my satisfaction.

**Donald:** Where did you, where are you reading that?

**Greg:** I'm not.

**Donald:** Oh, okay.

**Greg:** If a contract specifies price, rate or discount, Are the anaesthetists allowed to change it? I don't think we fully resolved.

**Donald:** If the anaesthetists say that one more time for me.

**Greg:** Sure. If a contract specifies a price, a rate, or a discount.

**Donald:** A fixed price, a fixed rate, or a...

**Greg:** No, the word "fixed" isn't part of the definition. It's got a price. It's the word we use to describe the fact that it's got a price, right.

**Donald:** Yeah, because I guess.

**Greg:** So as a contract defines a price, a rate or a discount, is the anaesthetist allowed to change it? We haven't answered that question to my satisfaction yet, I don't think. Yeah, so with the users.

**Donald:** I guess, I guess as far as the system is concerned, it doesn't really matter. It can just be a setting that is applied by AA. So you in theory could have a price on a contract, and mark it as not being able to have a price override and therefore it sort of becomes fixed. Or for whatever reason, you might have like, hey, between these two organisations, we will have a price on this contract, but we trust you, anaesthetist, to do what you need to do. So yeah.

**Greg:** You're quite right. The flag on the contract might be the best way because then it's not global. The rule is not global.

**Donald:** Yeah, exactly. It's just like this is just another way to...

**Greg:** I'm happy now.

**Donald:** Yeah, cool.

**Greg:** I'm not sure what question one is here.

**Donald:** Yeah, so this has just been updated in the background here, so I'm just going to reread the already settled section. So the contract defined rate is an override rate for the anaesthetist, a fixed discount percentage. Contract lines no longer carry an add-on flag, brackets, a fee added on top of another or a quantity rule. a fee charged per unit, EG per area, both were dropped in this meeting. the anaesthetist adds their own price or discount. Does that make it any more clearer? I don't know what that's talking about still.

**Greg:** I think you can just delete that because they were dropped, but it doesn't matter.

**Donald:** Yeah, okay, I'll delete it. Okay, so there are outstanding questions still to answer for Donald and Greg. Is the optional time band dropped from contract lines? The story no longer lists one and neither the V6 contract line nor the technical design has one, but dropping it has not been confirmed. Well, that's nice. Contract lines are able to carry an optional time band that with the matched lines fee is the price. I don't think that's a thing.

**Greg:** I don't think, I don't recall any conversation about that, do you?

## RVG rules for multiple procedures

**Donald:** No, I don't know what it means. Claude, I'm going to mark this. I'm going to answer this question, but you should update it based on the transcript to understand that this is not a thing. As far as we understand contracts slash contract lines don't have any concept of a time band. Time is only an optional recording from the anaesthetist. [unclear]. Okay, answered. Do the RVG base and time units apply to multi-procedure bookings? So already settled, there are no per-contract multi-line procedure rules. So contracts cannot override the RVG default. There are no contract multi-procedure rules. Yeah, so you can't have one contract attached to multiple procedures, I think that's what it's saying. So one leg of the default is confirmed. Modify units split equally across procedures once the total exceeds 4. So it's true. So still to answer for AA. Do the other legs still apply? What are the legs?

**Greg:** Of the split booking? Of the split? I don't know. Multi-procedure rules. One leg of the default is confirmed. Modifier split equally. Okay. Yeah, that's correct.

**Donald:** Okay.

**Greg:** Base units on the first procedure and time only on the other procedures. That's right.

**Donald:** Yeah, I just think the word leg is tripping me up here because it's actually a thing.

**Greg:** Yes, it is.

**Donald:** It's part of the body, but I think it's just saying one part, right?

**Greg:** Yeah.

**Donald:** Anyway, I'll just go back to this first. So. One leg means one of the three parts of the RVG default multi-procedure rule. I've asked it to update it. Here we go. Let's see what it comes up with. Already settled. There's no per contract multi-procedure rules. So contracts cannot override the RVG default. One part of the RVG default is confirmed. Modifier units split equally across procedures once the total exceeds 4. Okay. So question for AA. Do the other two parts of the RVG default still apply to every booking with more than one procedure? I think the answer is no. They are base units are charged to the primary procedure only and time units charge to every procedure. No. Time units are also only charged to the primary procedure.

**Greg:** Oh, wait a minute. Sure about that.

**Donald:** That's my understanding, right? Is that if you've got two procedures happening, so let's bring up an image. Bring up an image. This guy. Cool. So I am getting two procedures done. One is major. It's my facelift. And the other is getting a mole removed, whatever reason. And so my understanding is that Procedure 1 carries the base units and the, let's assume this is all RVG only, it captures the base units and the time and any modifiers are spread across both of them if there's more than four. Do you think that's incorrect?

**Greg:** Yeah, I do. I do. I think procedure 2 has its own time recording. And the point of this is that the base units may only be applied to the primary procedure.

**Donald:** Sorry, I think you can record time units, but you can't. Let's open this. So this has one procedure here. So if I added a second procedure, there we go. choose this code here. I can record time. Maybe you're right. Yeah, maybe my understanding is wrong. So I can't change the base units because the base units come from, well, they're recorded here, but I can't change them. They're not invoiced.

**Greg:** No, there are no base units on the base units only go to the primary.

**Donald:** Yeah, so the secondary.

**Greg:** Only go to the primary. So there should be no base units on the secondary procedure.

**Donald:** Yeah, Let's read this right here. Multi-procedure rules. Within one booking, the primary procedure and any additional procedures earn units differently. Base units, only the primary procedure carries them. Time units, every procedure carries its own, calculated from its own recorded times. Okay, you're right. Modifiers all sit on the primary procedure when the units total four or fewer. Above four, they're split equally. OK, no, this is right. OK, this seems good.

**Greg:** That's good. OK, that's good.

**Donald:** So if we close.

**Greg:** So that screen you showed me?

**Donald:** Oh, this the prototype's wrong.

**Greg:** No, the prototype's wrong.

**Donald:** Yeah, the prototype, the way it's. And it could be that it's just not been updated because not a lot of it. Yeah. OK, so answering this question here still for AA. Do the other two parts of the RVG default still apply to every booking with more than one procedure? I think this is picking up some idea that in the past we talked about having recorded base units and potentially modifiers on the RVG that would be applied, but now we're saying that that's not really the case. And so they are base units charged on the primary procedure only and time units charged on every procedure. The alternate pricing: each procedure on its own base units and time units. I think that's just making up some ********.

**Greg:** Yeah, that's not correct. No.

**Donald:** Yeah.

**Greg:** The first sentence is correct and that's it.

**Donald:** Yeah. V6 design states the rule as applied, but AA has not confirmed it. If it applies, which procedure is primary matters? Vanessa's practice relayed. Keep the default.

**Greg:** That orange text you showed me before had it exactly right.

**Donald:** Yeah, I think, it's, I think here it's just like, it's hearing conversations and it's just making some stuff up, but really the recommendation is keeping the default. as defined in feature 5.3 is true. So I'm just going to answer this.

**Greg:** Yep.

## Close and next meeting

**Donald:** Keep the default as defined in. Yep, okay. It's 4:00 now. We Let's see how much left is left in front of us here in terms of questions. We just did... I thought we were up to 90. I guess we skipped over a bunch of them. Did we? Okay.

**Greg:** I'm still going to keep going if you're feeling okay.

**Donald:** No, I think maybe I'll stop here just so I can process what we've got and be ready for tomorrow morning.

**Greg:** Okay, cool.

**Donald:** Okay.

**Greg:** What are you doing tomorrow? Let me have a look here. Wrong week, I think. Oh yeah, okay, so 9:00 in the morning. See you then.

**Donald:** That's still good. Okay, cool. Is that one marked as remote or in person?

**Greg:** That will be in person. I can do Friday. Sorry, that's remote. I can do Friday in person.

**Donald:** Yeah, cool. Let's keep that one remote then. Okay. Thank you, Greg.

**Greg:** I may. I've got. I may have to make a change on Friday at short notice.

**Donald:** Okay, just let me know. Yeah, it won't ruin my day.

**Greg:** OK.

**Donald:** See you later, Greg.

**Greg:** Thanks.

**Donald:** Bye.

**Greg:** Cheers. Bye.

## Reconciliation notes

- The Word-style source identifies Donald and Greg throughout; the unlabelled source corroborates the overall order and provides a second reading for technical terms.
- The mention of an invoice being "queried" versus "settled" months later differs between the sources and is marked in the transcript.
- The under-18 payer warning and some text read from the screen are incomplete or garbled in both sources; unrecoverable spans are marked rather than silently supplied.
- The brief non-meeting conversation during the bathroom break is mostly unintelligible in the continuous transcription and absent from the named transcription; it is not reconstructed as dialogue.
- Statements about contract overrides, prepayment handling, integration sources, and RVG multi-procedure rules reflect what the speakers said or debated, not independent verification of requirements.
