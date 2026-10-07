# Anaesthesia Associates Discovery Meeting — Reconciled Transcript

> Reconciled from two automatic transcriptions of the same recording. The transcript with explicit speaker names was used as the primary source for speaker attribution and turn boundaries; the second transcript was used as an independent reading to repair wording. Obvious ASR errors and established project terminology have been cleaned, while genuine uncertainty is marked rather than guessed.

## Booking intake — Surgeon PDF ingest and manual admin changes

**Donald:** Cool, this is new. Okay, great. So we are looking at feature 02.2, which is the Surgeon PDF ingest. Now, if you have a keen eye, you might notice there's no cards here. So surgeons' rooms email PDF lists of their bookings. The system reads them, and AA staff correct the extracted details and add them as bookings. This is a similar pathway to the hospital download. The hospital download carries more bookings; this is the smaller pathway today, so this feature ranks second. So that's the feature. When we look at the story itself, which is for the future: admins upload an emailed PDF of the surgeon's bookings. I mean, honestly, I would actually have the system reading the mailbox directly. But the system reads the PDF, extracts the bookings from it, so that staff can review them before they're ingested. Before an extracted row is ingested into the schedule, the admin can confirm and correct its details and fields. This is so mistakes the extraction introduces, such as an invalid NHI, are fixed before the booking reaches the schedule. Anyway, we're not at the stage of thinking that will be in scope for MVP, so the finer points of this can come later. Manual booking by an admin. So this is feature 2.3. Admin staff create and amend bookings directly for bookings that arrive by phone or email rather than through the hospital download or surgeon PDF. Admins can...

**Greg:** Phone/email, in addition to hospital download and surgeon PDF.

**Donald:** Okay.

**Greg:** Because you've got these four pathways converge at the end and create changes to a booking. Don't they?

**Donald:** Yeah, I don't think this conflict is saying that's not true. This is just saying up until now we've only talked about stuff coming in from the hospital download or surgeon PDF, but When it isn't that, when it's any method of receiving an update other than those two, staff need to be able to update it.

**Greg:** Okay, yeah, cool.

**Donald:** And then the first user story here, create or amend a booking admins can create. A new booking on a list or amended existing one, changing details such as patient time, procedures, or contract, every change is recorded against the admin who made it.

**Greg:** Are we implying in that some fields are editable and some are not, or are we just...

## Booking update emails

**Donald:** No, I don't think that implies that. I think everything can be edited until we're told otherwise, I guess. When an admin edits a booking in the admin app, they save it explicitly. The system knows what changed since the last save: for each field, the value before and after, who saved it, and when. This is how the admin can review before committing, and so changes can be reported, for example, in a drafted booking-update email. Seven criteria, some technical discussion. Draft a booking-update email. The admin screen for any booking has an on-demand 'draft update email' button. The admin uses it ad hoc when a change has left other parties' systems out of sync with the booking. It is not a prompt after each save. When pressed, the admin picks one or more changes from the booking's change history and the system opens a compose window in their default email client, pre-filled with a subject, boilerplate message, the changes the admin picked, and the To address where known — the hospital contact for a cover change, or the surgeon's room for a change to a booking. When the anaesthetist moves their own list, the office is notified and offered a cover-change email from that notification. I mean, now that I'm reading this, I wonder if, for an anaesthetist move, it might be an automated email.

**Greg:** I agree with you about that. The office probably aren't even [unclear] in here.

## Anaesthetist-created bookings and photo capture

**Donald:** Okay, let's take this. Click down here to ask a question, which is related to this. No, that's not what it is. Oh, look at that. I hit plus question and it already is pre-populated with this draft email — this draft card that's open. That's bloody amazing. Do we want to automate change emails when the change comes from an anaesthetist? That's a question to AA. Save. Cool. The admin reviews and edits it, including the To address, and sends it themselves. The system sends nothing. This is so hospitals and admin teams are told about a change without a true integration and without writing each email by hand. The main trigger is a cover change — a new anaesthetist on the list — which Vanessa spends a lot of time emailing today. Cool, we'll leave that to verify for now. Update the email templates per kind of change. Admins keep a list of user-configurable email templates, each tied to a kind of change. I think that's fine. Cool, we're now looking at feature 2.4. Anaesthetists can add a booking that's missing from their list directly from the app, optionally by photographing a physical hospital or surgeon booking card. Now, I'm not sure each of these stories will make it into MVP, but let's see. When the hospital's list differs from what is in the app, an anaesthetist can add the missing booking directly to their list, either by entering it manually or by photographing the physical hospital/surgeon booking card. From a photo the system reads... Okay, I think this explicitly needs to be split into two stories.

**Greg:** I do too. It'd be a lot easier. I strongly think one's going to get done and the other one's not, don't you? I do.

**Donald:** Yep, probably. Okay. Where are we? Okay, we will leave it as is and move on.

**Greg:** I'd go and be as bold as to shift the second story in the future.

## Copying a booking

**Donald:** Yeah, totally. Yeah, definitely. I didn't type it in here because I assume the transcript is going to pick it up, but let's write it with the photo story. Copying a booking. An anaesthetist can copy a booking skeleton — its patient, list and reference — without copying its procedure details. This is so an anaesthetist can quickly add another booking, capturing the new procedure. So this is in the prototype. We can see it down here, 'copy booking' against this patient. And we can see it here, source: copy of another booking. And then over here there's a button, 'copy booking', and then you see when it's been copied. Now, this definitely came from the RFP. And I don't really understand its use case. It could have been made up during the RFP process in the first prototype. But it's copying everything. Like, why would an anaesthetist themselves...? Yeah, I just feel like nobody's talked about this and it doesn't really seem like something that is proper.

**Greg:** I think it's redundant because it was probably an early response to the fact that they couldn't add a procedure to a.

**Donald:** Booking. They couldn't add a procedure to a booking. Yeah, because it's talking about copying a booking as a whole. This is actually — you're right — because Vanessa talked about all this three-numbers, six-numbers stuff, which was essentially them working around the system by creating a whole other booking, which is a single procedure, even though, in theory, it should have been a procedure within a booking.

**Greg:** So I think we should remove it from scope.

## Change types, audit and rescheduling

**Donald:** We can retire it. It should be retired, and its features removed from the prototype. Yep, I'm glad we are in sync with that. Okay, final feature of this epic: change types and audit. Every inbound change to a booking is classified before it's applied. It is one of: new booking, modification, reschedule, or cancellation. Whatever it is, the change is applied and its source/history recorded. That's the feature. Apply modification. The scheduling engine updates an existing booking whenever a modification arrives from any source. Every update records who or what changed it, when, and what changed. And we see that here in terms of that view of the history. And that's being faked in these other screens. So, cool. Yep. Confirmed. The scheduling engine moves a booking to a new date. Oh, I'm really zoomed in. I can zoom out a little bit here, can't I? Can you see that fine? Yeah. The scheduling engine: apply reschedule. The scheduling engine moves the booking to a new date, list and/or time whenever a reschedule arrives. Its change history stays intact through the move. Now, is there a situation where a list exists for anaesthetist A on a day and a slot, and then they also already have — so let's say it's on a Monday morning, and the anaesthetist already has something on a Tuesday morning, and the surgeon's office wants to move it from Monday to Tuesday morning, but the anaesthetist already has something on Tuesday morning. Therefore it can't be moved. I think that definitely would happen. Why would the surgeon's office know that that anaesthetist would be free on that day? They're moving their list and they get assigned a new anaesthetist.

**Greg:** It sort of generically falls under move a booking, doesn't it?

**Donald:** When you move a booking, there's a human looking at it. This here is automatically applying a reschedule. So I think we just need to edit it to say In the case of a flash slash conflict where the booking can't be moved to the new location, do we want to say that the automated transfer is paused? or it goes through because the surgeon's office is the source of truth and then it becomes a draft booking again.

**Greg:** Well it could be going to another, it could be going to another anaesthetist list.

**Donald:** Does the surgeon's office pick who the anaesthetist is or does the admin staff pick it?

**Greg:** Well it could for instance be going from a regular list to an ad hoc list because the surgeon's got something that's more critical and he's rescheduled somewhere. Or someone may have just rung up and asked for a move.

**Donald:** All the same, I'm asking, this story is describing an automated update of a booking or a list, I guess. It says booking here, booking. But if the destination that the surgeon's office said they're going to move it to is in conflict with information in our system, because their system doesn't have all of our information, what do we do?

**Greg:** The only criteria would be that it must be an existing list for the same surgeon.

**Donald:** Okay, can only move if the surgeon, well, hold on, no, even if it's the same surgeon, I'm saying that.

**Greg:** It could be a different list.

**Donald:** Oh, same surgeon, sorry. Same surgeon.

**Greg:** Because it says list.

**Donald:** It's surgeon, yeah, of course, that's an assumption. It's always an assumption that.

**Greg:** Two days, two different lists.

**Donald:** Yeah, okay, so don't need to get to the whiteboard. So, on a Monday, the surgeon's office call up or email, they want a booking made.

**Greg:** Okay.

**Donald:** All right, so booking is made and then admin staff assign it to me and the assignment is for Wednesday.

**Greg:** When your surgeon rings up, is he ringing up about just creating an ad hoc list or is he ringing up to say he wants a booking on this?

**Donald:** Ad hoc list is something you have talked about, but our system doesn't use that language anywhere. So what do you mean when you say ad hoc list?

**Greg:** When you said booking, you mean list, did you? On a Monday, the surgeon rings up and says he wants.

**Donald:** Could be a booking.

**Greg:** They wouldn't ring to say they wanted a booking, they just put it on their list.

**Donald:** They'd add a new booking to their list and that list would already be assigned or unassigned to an anaesthetist. So let's say it was a list. Yeah, you're right, you're right. So it's a new list to be created.

**Greg:** But some booking information comes through when it's populated, whatever.

**Donald:** A list with booking information, yeah. And obviously the surgeon's office don't have it assigned to an anaesthetist. So AA assign it to me. This happens on a Monday, so that's the creation date. On Wednesday is when the... procedure or the list is scheduled to work or happen and the following Wednesday I already have a list in the system with anybody, doesn't matter, another hospital surgeon, whatever. It's not to me but I've already got one. Therefore when on a Tuesday before the procedure happens the office calls up and says Whoopsie. By the way, here's an update for that list, ID 123.

**Greg:** Whose office is calling who?

**Donald:** The surgeon's office. The surgeon's office is calling AA. The surgeon's office is calling AA. So it was created on Monday. They're asking you to edit it on a Tuesday. And they say, we're moving this list in its entirety from tomorrow, which is Wednesday, to the following Wednesday. In that scenario, I, as the assigned anaesthetist, cannot receive the update to that list because I'm already busy that day. This is talking about an automated update. If I was free, the system would just move it. But if I'm not free, if there's a conflict or a clash, the system should do what? I've got ideas. What are yours?

**Greg:** I'd move it back to a draft list.

**Donald:** I think so.

**Greg:** Change the date and put the new anaesthetist in.

**Donald:** It moves to a draft list and then what the admin team do with it after that's their prerogative.

**Greg:** So the admin team move it to the draft list.

**Donald:** This is talking about automated integration. So I'm saying there's two options. I think there's two options. So maybe more. If an automated process cannot move it by itself, it can A, pause the automated change and it just sits in the same matching screen that the admin staff already have. Or the change is accepted because it has to be. The surgeon's rooms have said it's going to happen and they're the boss. But since we can't match it to the anaesthetist, it just becomes a draft list.

**Greg:** It has to because the surgeon's room is not the boss who does...

**Donald:** I know that. They're the boss that's going to happen. So we can't say, well, it's not going to happen. So we just have to accept that the change is happening, but the anaesthetist assigned may be different.

**Greg:** Or maybe unavailable. That's right, that's right.

**Donald:** That's right. So in the case of a clash or conflict where booking can't be moved to the new location automatically, the list becomes a draft list.

**Greg:** Right, so the criteria for an automatic move are same surgeon, same anaesthetist.

**Donald:** Well, the list already has the surgeon anaesthetist, so that isn't the condition for an automatic move. The slot that it needs to go into needs to be free. That's the... Because are you describing a situation where the following Wednesday, it is actually already the same anesthes, the same surgeon, and there's that, which means there's already a listed here. And so in that case, a booking could change from one list to the other list.

**Greg:** Yeah, the booking could.

**Donald:** But the list could not self-change because apparently the two lists can't merge.

**Greg:** You would effectively remove all the bookings.

**Donald:** But some of those bookings might be in the same time, so they're different lists, but yeah. Anyway, so.

**Greg:** I don't know if we're dealing with a real scenario.

**Donald:** If you want integrations, you are. Yeah. I imagine-- If you want automated integrations, you are.

**Greg:** I would imagine that seeing a booking move from one surgeon's list to the same surgeon's list on another day would not be unusual. It might be a different anaesthetist, but.

**Donald:** It's certainly in the scenario where there's a recurring booking, so you know it's the same surgeon, you know it's the same anaesthetist, and you're moving the booking that can be automated, but we.

**Greg:** Need a generic criteria, right? So, if you're moving the booking, all we need is a list for that surgeon for that session.

**Donald:** So we're having a booking, we need a list for that surgeon for that session.

**Greg:** Yes, doesn't matter who the anaesthetist is, you're just moving the booking. He's in charge. He says who's on the list?

**Donald:** Yeah.

**Greg:** Right, so that's easy. If you're moving the list, I think it goes to draft because there are some ugly combinations there. But actually... [unclear]. Because the surgeons don't send individual bookings; they send a copy of the list. It's like snapshots of their list, and we're trying to work out the deltas.

**Donald:** Okay.

**Greg:** I think it's too hard. I think we're just like draft.

## Cancellations, late changes and submission locking

**Donald:** No, I do think there's a set of rules that would allow it to happen automatically. I've asked — I'll ask the AI to kind of flesh it out. So that's specifically talking about 2.5.2. Record a cancellation. The scheduling engine records a cancellation and updates the schedule accordingly. The cancelled booking is never removed, and it stays in the list's history. So obviously you've got a list full of six different bookings. One of them gets cancelled; it stays there visible, but it's marked as cancelled. Because I guess that means an anaesthetist can turn up to the hospital and they don't have a mismatch where one system might say it's there and another one doesn't. It just makes it visible. Okay. I think all of the stories here in this... I need to make it so that if you click on this — oh, does it? Link copied. Clicking on it... I actually don't really want to copy the link; I want to copy just an ID/name. [unclear]. Okay, so we were talking about cancellation. If a booking has a paid prepayment, its refund is covered by the refund/prepayment-or-cancellation story. So this shows a cancelled booking in a list. Okay. Changes accepted until the procedure. The scheduling engine accepts booking changes from every source right up to the start of the operation session. This is so a late booking is still supported, however close to the session it arrives. Okay, yep.

**Greg:** So in practice that means that the booking can be changed until the time's entered.

**Donald:** Until the time's entered or.

**Greg:** In practice. Because they don't flag, there's no condition that says procedure started.

**Donald:** Except we know the start time of the procedure.

**Greg:** No, the scheduled start.

**Donald:** Scheduled start time. Okay. Yeah, fair enough. To be clear, this lock probably only locks once the [unclear: likely 'BTM data'] is entered. At the moment, on all of these bookings in a list, there is no save state. Everything is saved when you do an action, and the list is submitted when it's complete. So... it's a long day. I'm having trouble articulating this perfectly, but you see where I'm going.

**Greg:** I've got it. There's no big drama here. Just make it on the submission of the list. The anaesthetist can twiddle anything they like until then.

**Donald:** Yeah. So we...

**Greg:** There won't be any automated updates coming through.

**Donald:** There is a part from the RFP here that talks about, oh wait, this is mentioned in real-time processing and a future story. Where is it in the future thing? It's a future status. interesting. We'll just have to look at that. that's because it is an automated integration. We're saying automated integrations may be out of scope. Right, until the session starts.

**Greg:** Actually, there could be. The insurance details could change. So there are potentially some automatic integration things that you want.

## Audit history and invoice reproducibility

**Donald:** I think this just continues to support the idea that automated changes need to happen after MVP. Okay. I'm going to just leave this where it is, and I'm going to put all of these into the future. Changes accepted until the procedure. So these are, yeah, all related to automated changes, is my current understanding when I read these. Just read the last two. Append-only change history. So the scheduling engine keeps the append-only change history of booking procedures, including every contract selection and adjustment. This is so an invoice can always be reproduced exactly as it was when it was raised, even after the booking, procedure or contract has since been changed. This is that — what's the... [unclear: possibly 'idempotent']?

**Greg:** Immutable.

**Donald:** Not immutable. You had a word in your RFP that referred to something that could be recreated based on a script or a recipe.

**Greg:** Oh yeah.

**Donald:** [unclear: possibly 'idempotent'] or something. Yeah. Anyway, where did the — you know what we're talking about?

**Greg:** Yes, I do.

**Donald:** Where did that come from? Is that just your own idea of like, just robustness in the system? Because there's, yeah, there's this user story here. Item.

**Greg:** It's a concept that you can apply, you can apply something to, you can apply the same change repeatedly to an object and it doesn't change the object. So, why have I got it here? Where is it here?

**Donald:** Well, there's a future story that's under Billing Invoice Engine. and invoice generation. It says this. The billing invoice engine can regenerate any past invoice exactly from the procedure data and contract version when they were locked at the time, so that an invoice raised under an older contract can always be reproduced later, even after the contract has since changed. Who wants this? Who needs this?

**Greg:** Okay, when you create an invoice and you send that invoice out for collection, what artifacts are you leaving behind that allow you to reference that historic invoice, given that other things may have changed since then and you couldn't reproduce it? For instance, that rate may have changed.

**Donald:** Yeah, so you produce an invoice at a point in time. That invoice is based on, the variables of the day. it's obviously everything the did during the procedure, pre-op events, post-op events, right, any of that stuff. And then at some point in the future, who is asking to reproduce that invoice exactly as it was? The state of that invoice is recorded in the invoice that got created.

**Greg:** Have you kept a PDF of that invoice?

**Donald:** I don't know exactly how we're going to implement this, but I suspect what we would do is keep the recipe of that PDF generation.

**Greg:** That's what I'm saying. That's what that's.

**Donald:** What that's saying. Okay. cool. I think what this was interpreted as was in the future changes might happen to that booking and then when you create a PDF you, it's based on the current state, but I think it was, I interpreted this as some mechanism to go back to a different point in time and create a new PDF based on that. But really all we need to do, all we need to do is keep.

**Greg:** We need to keep something.

**Donald:** Keep something to recreate that recipe. Yeah.

**Greg:** So for instance, the address might have changed.

## Concurrent edits and tooling checkpoint

**Donald:** So we don't want to recreate the output. We just want to have the... Anyway, we're on the same page. Okay, so going back here: append-only change history. It's weird that it's here, but I believe I understand what it's saying. I'm just going to leave it right as-is for now. Concurrent edits. The scheduling engine handles the same booking being edited by two sources closely together in time; neither change is lost silently. You asked the question, I think, in your RFP about how that's going to be handled. So yes, there's notes in there about it. Anyway, I'm putting that out of scope because this is related to an automated thing. Did this finish? Do we have...? So that's 15 done. This gave me the prompt. This is broken. It's not [unclear] scroll; what should actually be scrollable here? How is it going? Let us unbreak what I can see. In theory, it should be running a bit of a workflow in the background, but this particular harness, or Claude Code, doesn't present everything that the CLI does. Nothing is running at the moment. I paused at stage 3 checkpoint waiting for you to OK. I never got to see it. Perhaps a bug. I assume approved. Okay. Awesome. That is us doing that. We can move on to a fun thing like contracts.

## Contract catalogue

**Greg:** Would you like to leave contracts and go forward?

**Donald:** No. These all kind of build on each other in terms of understanding. Every procedure needs to know three things: how it's priced, what rules apply, and who gets the invoice. In this system, the contract answers all three because the contract always defines the billable party. And there can be as many contracts as AA needs. AA manages contracts as master data, and each procedure selects exactly one. This replaces the RFP's separate step of resolving a billing route and then looking up a governing contract. Here, picking the contract is the whole pricing decision. So that's the epic. Epic 4: Contract Catalogue. The contract catalogue is where admins create, edit and maintain every contract AA holds. So this is the feature, and some version of this exists in the prototype. Let's move to the first story. Admins create contracts in one of these categories: RVG default postpaid, RVG default hospital, hospital, surgeon solo, surgeon group, insurance. This could use a little bit of fleshing out, but that's our general understanding of the different types of... So this goes back to this we talked about here.

**Greg:** I'm not on board with all of this stuff yet, so we're going to have to chunder our way through it, right?

## Master data and calculation rules

**Donald:** Okay, well how about we punt on this for now and move on? Do you reckon you've got time on the weekend to mull it over? Yeah. Okay. If you want access to this, I could give it to you. So master data and calculation rules, I think we should also punt on because it's kind of related a little bit. Okay, let's have a go. The New Zealand Society of Anaesthetists RVG codes and AA's own additional codes, together with the calculation rules built on them. Okay. Base, time and modifier units; multi-procedure split across a booking; pricing bases a contract can set. I think this is in the whole contract area to say that a contract can set the base units, I think is what it's trying to describe. And then anaesthetist and office adjustments — whether or not an anaesthetist and office can just plain flat override it. All of it is deterministic and testable. That's the epic. Here is the first feature. Master RVG code set, plus AA's own additions, grouped for search and for prepaid selection. Cool. Admins load the RVG code set as master data. For each code, this includes its description, its section, the anatomical site from the guide, its base units — or a range where the guide gives one — and any positioning loading it already absorbs. So what that means?

**Greg:** Oh, okay, yes, that's part of the modifiers, right?

**Donald:** Yeah, and so that's... This is where this needs to change. I asked Vanessa about this and I was like, where's a good example here? This right here. These units include loading for prone position if needed. I was like, what the hell's that? Plus two? These are base units. Are these modifiers? She suggests those are modifiers. So it's formatted weirdly, but she told me that these are a bunch of modifiers and the prone position one is not here, should be. And There's a whole bunch of other modifiers that they know about that aren't listed here and so separate to this list.

**Greg:** So I think there's one thing missing there and that's the first bullet should say. A unique code, a unique AA code.

**Donald:** Yep, I can be done with that. I'm going to say system code because it's AA today, but it might not be AA tomorrow.

**Greg:** I want to distinguish it from the underlying RVG code. It's a user code. It's what the user would see.

**Donald:** The system could still create it and the user could still see it.

**Greg:** I can't see any option except that it needs to be structured. So the system, it's sort of human readable, quasi-structured.

**Donald:** We can say that. Code.

**Greg:** Structure. We're talking about navigation here too. Like, there's no point having 10,000 codes, right? They need to be able to start typing.

**Donald:** This is RVG, not contract. So it's only going to be...

**Greg:** This is the RVG.

**Donald:** And so.

**Greg:** This sits underneath everything else.

**Donald:** So my current understanding of how this is structured is that we'll have a list of approximately 400, 500 procedures. That's at least what my draft has at the moment, which is pulled out of different things that I've got given.

**Greg:** Yes.

**Donald:** And so every one of those procedures — a standardised named procedure that New Zealand recognises — only a small handful of those have an actual RVG code from the RVG. But Vanessa believes that every one of those procedures can fit into one of those RVG codes if you know the right way to read them.

**Greg:** Well, that's the structural part.

**Donald:** And so she is going to fill that in. But that line item in my spreadsheet, this spreadsheet, right, this brow lift does not have an RVG code, but it will fit into one of the ones that already exists. And so it may match the exact same H2 RVG code and have the exact same base units. But this line item itself needs its own AA system code, which is its unique identifier.

**Greg:** Every line needs a unique identifier.

**Donald:** Yeah.

**Greg:** That came from Ben, by the way.

**Donald:** Which part?

**Greg:** Every line needs its unique identifier.

**Donald:** Sure. So this can still be a unique system, human readable code. That's right. We'll call it an ID here.

**Greg:** No, I call it a code because an ID is usually a number, isn't it? Or a system, it's a system.

**Donald:** Okay, a description.

**Greg:** It's a code that Ben expects AA to create themselves for each [unclear] code.

**Donald:** Okay, well we can, yeah, that's fine.

**Greg:** We'll come back to it.

**Donald:** Come back to it. Okay, so I need to edit this positioning out of it — any positioning modifiers that are in here. This is so the billing/invoice engine has the RVG reference for each code, its description, site, base units, and absorbed loadings. Absorbed loadings: gone.

**Greg:** Has the RVG reference. Okay, so we're going to — every procedure will be a child of some RVG code, right? Is that what you're saying?

**Donald:** Give me just a second.

**Greg:** So every master code will be a child of the RVG code.

**Donald:** I wasn't seen quite as a child parent thing, just that there was a flat list of procedures that have an assigned RVG code. So if you ever wanted to understand a chin augmentation and how that relates to an RVG code, you could, but it's not, I didn't see it as a parent-child. Now, I could be absolutely wrong in that, but it's just like, I don't believe we need to have that because...

**Greg:** I think we'll find that we come back to a navigation discussion, but we don't have to have it today.

**Donald:** Yeah, okay. Cool.

**Greg:** Now, that goes back to default RVG contract. I want to revisit that, but we don't have to do that now either.

**Donald:** Yes, that's a part of your homework.

**Greg:** So far, so far.

## Procedure codes, RVG mapping and grouping

**Donald:** The base units — the base unit prices — come from the procedure's default RVG contract. Yep. Admins can also add procedure codes that the NZSA guide does not cover and set their reference base units. Each of these is marked as AA-sourced so it stays distinguishable from the standard NZSA set. Hadn't thought about that. I think the AI wrote that, and I don't know if that is quite right because, at least the way Vanessa described it, the guide is a guide, but if they add another one and they pick the most relevant RVG code to use as reference, it doesn't necessarily mean it's wrong. But maybe it doesn't matter and we can add it as a data point as well. But I don't vibe with this line as it stands.

**Greg:** No, it's not quite right.

**Donald:** Okay, I'm going to remove it for clarity.

**Greg:** And there are quite a few situations at the moment where the anaesthetist just types in the detail of the procedure.

**Donald:** That's right, which is where we saw all the garbage data in that list.

**Greg:** And I'm not sure, I don't understand why it needs to be kept, frankly.

**Donald:** I think a lot of that is historical due to issues with the current system.

**Greg:** Be kept on the procedure, but it doesn't need to be kept in the master. Doesn't need to create a.

**Donald:** Sure. Okay, AA-added codes. 'Admins can add procedure codes that the RVG guide does not cover and set their reference...' So I wrote that part as well. Yeah, I think at some point there was an idea that this hallowed RVG list was going to be an awesome, valuable source of reliable something, and it's more just a rough reference — a very slim starting point. Okay, are you happy for me to accept this? Okay. Group codes. Admins tag RVG codes into groups: the anatomical sites from the NZSA guide, plus AA's own groups such as [unclear: possibly 'colorectal'], dental and plastics. This is so codes are searchable and selectable as a set, for example when an anaesthetist makes a whole group of codes prepaid. Sure, but the site is already there. And I don't know if this quite shows what it thinks it's showing, but yes, confirmed. Okay, reading 5.1.4: absorbed modifiers. Some RVG codes include a modifier loading; spine or neuro codes, for example, include prone positioning. The system records which base codes — 'base codes' here is kind of a new or vague term. I think I want to change it to, like, procedure codes.

**Greg:** It should say base values include modifiers. Because it's units, right?

**Donald:** Yeah, it should be include. Include.

**Greg:** Not which modifiers, which is just modifiers.

**Donald:** Include modifiers, so procedure is never charged for loading its base already included. So, see, it's not even the base doesn't include it.

**Greg:** It's not even, I don't.

**Donald:** Even think that so is right here.

**Greg:** Well, that's the intention, but it doesn't matter. That doesn't solve the problem.

## Default modifiers

**Donald:** The modifiers are never included in the base. They are separate things, and this 'absorbing modifiers' is wrong. The concept of the base absorbing the modifier is incorrect. It should actually just be applying the modifier because of that procedure.

**Greg:** So actually, in the master — RVG master, which is what I'm going to call it, compared to the RVG guide...

**Donald:** Yes, okay, so you're talking about some version of this?

**Greg:** In the RVG master, you'd want a column for base and you'd want a column for modifiers, and you can bring them both in.

**Donald:** I agree. Yes, some of these procedures automatically will apply a modifier. Yeah. Okay. Let's call included modifiers. Included modifiers.

**Greg:** Are they included or are they included? They're sort of default modifiers, aren't they?

**Donald:** Okay, I like that. Default modifiers. Some RVG codes already specify a modifier.

**Greg:** Let's change that to EG.

**Donald:** Yeah, EG neuro codes slash procedures.

**Greg:** Will include. Actually, it should say indicate.

**Donald:** For example, neuro codes/procedures will indicate the prone-positioning modifier. The system records which procedure codes specify default modifiers. [The previous 'already included / avoid double-charging' wording is being removed.]

**Greg:** No, and it shouldn't say include, it should say require.

**Donald:** The system will record which procedure codes require modifiers added.

**Greg:** Base procedure codes, not include.

**Donald:** Apply. No, it's just like, just have them have. Let's have.

**Greg:** Specify additional, specify modifiers.

**Donald:** Specify default modifiers.

**Greg:** Yes.

## Modifier master and international comparison

**Donald:** I think we've just repeated ourselves here, but that's fine. Okay, we are in agreement with that and that's what matters right now. Modifier code master. Admins load the modifier code set as master data with each code's unit value. It's got a bunch of junk that does not need to be in there. There's some examples of what it looks like in the prototype, which is based generally on screenshots and tables from your RFP. But we believe that this will be its own distinct list that is generated partially from the guide, but partially from extra things that are created by AA. So when you talked about other countries having a similar health system to AA — in terms of when you talked about that...?

**Greg:** Australia.

**Donald:** Australia, that's right. And you were saying Canada and the UK aren't. I interpreted you describing that specifically related to the way an agent like AA can manage a bunch of individuals. Is that how you were describing that when you talked? Or were you describing specifically Australia matches our system of base time modifiers.

**Greg:** Australia and New Zealand anaesthetists society or whatever it is, that Australasian entity, right? So they share a lot of their ways of working. Ways of working, thank you.

**Donald:** Yeah.

**Greg:** Canada does not have private anaesthetists, nor does the UK.

**Donald:** Well, two different things, right?

**Greg:** But I don't know if they have an RVG because they don't charge, so they probably don't.

**Donald:** I'm more saying that when I heard you talk about that subject the ways of working I interpreted was specifically in reference to the way the relationships between hospitals and surgeons rooms and some independent trust style third party entity, not specifically an individual anaesthetist having the concept of a base time and modifier pricing way of working. Do you understand what I'm saying, the difference?

**Greg:** Yes, but, so let me clarify that.

**Donald:** Does Australia have that and that, A and B?

**Greg:** Australia has both because it uses an RVG approach and it has private practice.

**Donald:** They have private practice anaesthetists.

**Greg:** Yes. Hybrid, like New Zealand.

**Donald:** Hybrid, okay.

**Greg:** Canada does not have private practice.

**Donald:** And you know this because of Ben.

**Greg:** I know this because I researched it.

**Donald:** Nice.

**Greg:** And the UK does not have private practice. Or they are as like, as somebody described to me the other day, rocking horse poo, right? So I think they're as rare as rocking horse poo, right? So very few people in the UK. And if they are operating privately, they are operating completely outside the health system.

**Donald:** Yeah, OK.

**Greg:** Right. For rich dudes.

**Donald:** You might say they're cowboys, but maybe they're not.

**Greg:** Right, the highly [unclear] specialists. So if they're not operating privately, they don't need a billing strategy because that's not how public hospitals operate. Public hospitals don't use the RVG.

**Donald:** Yeah, okay.

**Greg:** Excuse me. It's all right.

## Procedure master and default contracts

**Donald:** Admins maintain a master list of procedures by operation name — for example, appendectomy, pick one we could pronounce — grouped by body part. Each one holds, or references, an RVG code or category it belongs under, even where the RVG guide does not name that operation. There are far fewer RVG entries than operation names, so mapping is done by hand; gaps are filled with Vanessa's help. This list does not hold base units. Base units live in each procedure's one or two default RVG contracts. That's true. So I think I led us astray a little bit there earlier because I think we answered it differently in a question. So this list currently has base units because I'm asking Vanessa to collect it. But in the future, what I will do is make a separate list of contracts, which will be pre-populated by default contracts based on this, and it's the contract that will hold the base units. And so, again, this is where you need to go away and do your homework. But in my system — or the system as currently proposed, or whatever — as understood, you pick a procedure, which has a group, a subgroup and an RVG code. But then below that there are all the different types of contracts that could exist, and they will always have a default contract which holds the base units.

**Greg:** That's the bit I'm thinking about.

**Donald:** That's the bit you're thinking about. And we won't go any further. Base units live in each procedure's one or two default contracts, understood to be the standard RVG recommendation, because the same RVG can be applied to a different value — for example, minor versus simple. Yeah, that's right. Because there'd be a contract for — specifically, the RVG has the exact same RVG code, but with different base units because they're different styles of procedure.

**Greg:** And what are we going to do about that?

**Donald:** What are we going to do about it? It's a single procedure appendectomy And then you, if an RVG, if the RVG specifically suggests that there are two different base codes for the different difficulties, I guess we have two options and AA can decide what they want to do because the system would support both. The system could say it's just one appendectomy default contract with a range.

**Greg:** Yes.

**Donald:** Or they could have appendectomy default contract simple, appendectomy default contract complex, and each would have an individual value.

**Greg:** That's all good.

**Donald:** We have fun. A contract can override a procedure's base units for a hospital or funder arrangement. If a procedure's base units are consistently overridden, AA should consider changing its own underlying data — the default RVG contract — rather than keeping on overriding. That's a quote from you.

**Greg:** That's our discussion.

**Donald:** Position loading such as beach chair or prone are modifiers, not base units. Good. This is so every procedure maps to its RVG code and has a default RVG contract to price from, giving the billing/invoicing engine a reliable base-unit figure.

**Greg:** Yeah, we've just changed that today to base unit and modifier figure. Right, because we're going to include modifiers in our master table.

**Donald:** A separate table, but yeah, we just talked about that in literally the story before this.

**Greg:** So is there any confusion in this discussion between what we're calling the RVG guide and the RVG master?

**Donald:** RVG guide is a PDF that they put out every X number of years. Our system doesn't have that. Our system only has an RVG master list — or I think I might have called it somewhere a procedure master. Yeah, it's a procedure master list. It's a list of procedures that has RVG-code references within it.

**Greg:** Okay, fine. We're calling it a procedure master.

**Donald:** Yeah, procedure master.

**Greg:** Okay, fine.

**Donald:** I'm just bullying you here.

**Greg:** So the procedure master has an additional column for modifiers, which contain.

**Donald:** Yeah, it's basically the procedure needs to tell the contract underneath it, always include this modifier. Yeah. And what that really would do in my head is it means that when the anaesthetist opens that booking and is configuring the details for said procedure, it will automatically be pre-filled in with the one that is appropriate. They can untick it if they wanted to.

**Greg:** I can always change it.

**Donald:** Yeah.

**Greg:** That's exactly all it needs to do.

## Unit and fee calculation

**Donald:** Yeah. Okay, next feature: unit and fee calculation. A procedure's fee is base plus time plus modifier units, multiplied by the unit value, unless a contract sets a different pricing basis. We're all in agreement on that. Per-unit pricing rate. The system prices RVG units at each anaesthetist's own dollar value per unit by default. Never a price list shared across anaesthetists. This is a Commerce Act requirement: anaesthetists cannot collectively agree on pricing. So this applies anywhere it's not a fixed fee or an overridden rate.

**Greg:** Yeah.

**Donald:** Confirm.

**Greg:** So there's no provision for any grouping or clustering of that, it's just one to one. It's not saying there is. Yeah, It's saying the default. Go back to that. This default is a commerce. Well, it's not only a default, it's mandated. So it's not by default because it can't be changed.

**Donald:** I think it's talking about the — I believe what it's describing here is that this applies to default contracts, or contracts that don't automatically enforce an overridden rate. Tiered time units. Time units are tiered, not linear. The first two hours of anaesthetist time, the system charges one unit per 15 minutes, or part thereof; from the start of the third hour, it charges one unit per 10 minutes, or part thereof. The partial interval is always rounded up, under the RVG's tiers. The RVG guide defines what the tiers are, so that's what it's saying.

**Greg:** Are we going to define those or are we going to hard code those?

**Donald:** I guess probably define them.

**Greg:** Yeah, I would have thought so.

**Donald:** Makes sense?

**Greg:** Okay. Cool.

## Fixed-fee pricing

**Donald:** Confirmed. Conditional positioning modifier. 'The system adds P1 positioning modifier only when the procedure's base code does not already...' This is wrong. I think we just retire this and keep moving. We can come back to it if we ever need to. But fixed-fee schedule pricing. When a procedure's contract is a fixed-fee schedule, the system prices it from the matched schedule line instead of the RVG units, including any time band or add-on the line carries. Base, time and modifier units are still recorded against the procedure, even though they aren't used for pricing, so the underlying activity is never lost.

**Greg:** Let's go through the first line again because I do not understand.

**Donald:** So I think it is confusing in its language, so I'll convert it to Donald-speak. When a procedure's selected contract has a fixed fee, the system prices it from the fixed fee and not the RVG.

**Greg:** Yes, it's simpler than that. It's tripping over itself, isn't it?

**Donald:** When a procedure's contract has a fixed fee — well, that's the name of the user story, maybe? I don't know, we'll find out. There's a fixed fee. The system uses the fixed fee... cost? Price?

**Greg:** As the total price for the procedure.

**Donald:** As the total price for the procedure. Not the BTM units.

**Greg:** I got rid of the RVG.

**Donald:** Part of it, but I just want to be really clear: not the BTM units. And I'll get rid of the rest of it. Not the BTM units. Base, time and modifier units are still recorded. Yeah, I think that's right. Cool. Confirmed. When a contract permits an individually arranged rate, such as a simple hourly rate, the system prices that billing line as the rate multiplied by its duration.

**Greg:** It prices it doesn't.

## Contract-defined / individually arranged rates

**Donald:** Yeah, so some contracts may still have this. So this is a contract where it has the... Yeah, I think you're right. When a contract permits an individually arranged rate — so it's not simply a simple hourly rate...

**Greg:** It's just such as an hourly rate.

**Donald:** No, it's not an hourly rate, because it's not hourly, it's unit rate.

**Greg:** Oh, sorry, yeah.

**Donald:** Such as an alternate... a fixed unit... This is such as a fixed unit rate. It is just a fixed unit rate. AKA...

**Greg:** It's not a fixed rate.

**Donald:** Yes, so you.

**Greg:** The anaesthetist has a default rate, and this is an alternate rate.

**Donald:** Okay, okay, okay. When a contract defines — it doesn't permit, defines — an individually arranged rate, an alternative rate...

**Greg:** Oh, that's all right. Individually arranged rate, that's fine. Right? Just take all that out.

**Donald:** Okay.

**Greg:** AKA... yeah, get rid of all that. Get rid of all that. Alternative... no, I can take all that out. 'When the contract defines an individually arranged rate, the system prices that...'

**Donald:** Okay, cool. Okay, the system prices that billing line — billing line? Procedure.

**Greg:** Procedure using the specified rate.

**Donald:** At the rate multiplied by — no, at the specified rate.

**Greg:** Just at the specified rate, yeah.

**Donald:** Alternative rate, specified rate, alternative rate.

**Greg:** Let's go to it's called individually arranged at the front, so we're just specifying it's a rate, right?

**Donald:** Okay, and this here is alternative rates — alternative... individually specific. 'Individually' makes me think of an individual person as opposed to an individual contract. What about a contract...?

**Greg:** It's called special rate or special rate.

**Donald:** I would like to call it something closer to 'contract-defined rate', because alternative rates don't exist on anything other than a contract. So you've got an individual rate and a contract-defined rate.

**Greg:** Well, it's individual rates then, isn't it? Isn't it just note about individual rates?

**Donald:** I mean, people might think an individual rate is for an individual person. Contract defined.

**Greg:** You keep hanging the output using contract everywhere, but it's fine. Just carry on.

**Donald:** So I'm going to put it as [unclear: 'defined in contract']. Okay, so if we save this, then we can go and look at the other stories that it's referencing. So contract pricing and adjustment rules. So we've already talked about that and we haven't verified it. Oh, we haven't talked about this. We skipped over it. And then this one: system provides that procedure... other billing lines, including rate times time...

**Greg:** That's got an individually arranged [rate], so that's good.

**Donald:** Unit times rate. We'll come back to that when we get there, but we can agree on this, which is: when a contract defines a contract-arranged rate, the system prices that procedure at the specified rate. Okay. Let's pause for a moment because I need to go to the loo.

## Reconciliation notes

- Repeated project terms were normalised where the evidence was strong, including **AA**, **anaesthetist**, **RVG**, **NZSA**, **NHI**, and **BTM**.
- The speakers appear to be trying to recall the term **idempotent** during the invoice-reproducibility discussion; because neither ASR source captured the word cleanly, it remains marked as a probable reading rather than asserted as verbatim.
- A small number of short UI/tooling phrases and one procedure-group example remain marked `[unclear]` because the two transcriptions do not support a confident reconstruction.
