# Anaesthesia Associates — Meeting with Ben and Vanessa, 5 November 2026

## Reconciled Transcript

> Reconciled from three automatic transcriptions of the same meeting. The speaker-labelled transcript is the primary source for turn-taking; the other two automatic transcripts were used to correct transcription errors and gaps. This is a lightly cleaned record of what was said, not a verbatim audio transcription or an agreed requirements specification. Unrecoverable passages are marked `[unclear]`.

**Participants heard:** Donald, Ben and Vanessa. Greg and Michael are discussed but are not speakers in this recording.

## Opening and prototype feedback

**Donald:** Are you doing all right, Vanessa?

**Vanessa:** Yeah, I'm good. How are you?

**Donald:** Yeah, good. So, I'm really glad you guys are happy with this. You know, the purpose of our last meeting really was to try to get a sense of—there are always complex UI problems that might exist, and I wanted to understand...

**Ben:** Hang on, what's UI?

**Donald:** Oh, so user experience, right? So, you know, nobody wants to scroll through an infinite list of things. And so lots of the conversations and bits and pieces Greg and I have been trying to ask you guys about have been with that context in mind, right? How can we take your needs but also marry them up with an experience that makes this easy for everybody? And you unlocked the idea of going billable party first, and so that already put some of these images in my brain. And so, yeah, I'm glad you guys liked it. Do you want to tell me what you think?

**Ben:** You go first, Vanessa.

**Donald:** And you don't need to just give me compliments. You've already said you love it. But specifically, obviously now's a great time to ask for things that aren't quite working, or aren't quite right.

**Vanessa:** I really like it.

**Ben:** You've clicked through all of the different things? Yeah.

**Vanessa:** I like the drop-down boxes, and I like, as I said to Ben, about the prepay system.

**Vanessa:** Can we swap places, Ben? Just so I can [unclear].

**Vanessa:** Obviously, because we are moving into more and more prepays with the anaesthetists. So to me, that's a big part of our job at the moment, is prepays. So that's a function that...

**Ben:** Click prepay, yeah.

**Donald:** So when you said you like the drop down, just specifically kind of like it, like this part here you were saying?

**Vanessa:** Yeah.

**Donald:** Yeah, cool.

**Vanessa:** So I think that will make our job a lot easier and not so time-consuming.

**Donald:** Yes.

**Vanessa:** Because at the moment the prepays are quite time consuming for us.

**Donald:** Actually, I might pass this to you, because mine won't probably have that little weird bug there. I've got the same thing loaded up here. If you notice, you can't click to the top of the thing. Anyway, it's just a bit odd.

**Ben:** Oh, there.

**Donald:** Yeah. So let me just tweak this a little bit here.

**Ben:** Is that because that's on Safari or something?

**Donald:** No, it could be a Safari bug, not a silly idea, but I think it's mostly technical reasons I could get into, but it's not worth it. Oh, mine's doing the same thing a little bit. Okay, never mind. Okay, okay. As we were. Yep, so cool, you're liking that. That's great. I guess sometimes I have a really clear picture of what a customer is wanting and understanding, and when I was playing around with some of the earlier versions of this, I wasn't quite sure they were landing right. And so when you sent me that flowchart of the different stages, that was really helpful to unlock this.

**Ben:** Did you find that helpful?

**Donald:** I did find it helpful, yes, thank you. And so when we go to the top level here, 'patient' here, it's suggesting a surgery based on the card itself—no, sorry, the booking itself, right? The booking already has a location, so we can kind of infer from that. Would there ever be a situation where you would want to select a contract for somebody else that wasn't this eye surgery in this context? Or, to ask maybe a more specific question...

**Ben:** I don't quite understand what you mean.

**Donald:** Yeah, yeah, so.

**Vanessa:** So you're meaning if it's an eye.

**Donald:** So would it be valuable if there was a button to say show me all different hospital providers and then you could choose those alternatively as opposed to just having it hide everything and just show the eye surgery?

**Ben:** So in my opinion, well I'm just thinking about just in terms of this meeting, should we just run through Vanessa's comments and then we'll go back and then dig down on some specific things.

**Donald:** That's fine for me.

**Ben:** Is that all right? Just to get a bit of an overview of what Vanessa, and then we'll dig down on some specifics like that.

**Donald:** Is that good? That's totally fine.

**Ben:** Okay.

## Prepay workflow, fixed-price selections and procedure catalogues

**Vanessa:** So, the prepay thing is really good. I like the way the contracts obviously are set out. So if you...

**Ben:** This one or that one? You click.

**Vanessa:** This one.

**Ben:** Oh, that one. So if the patient-.

**Vanessa:** Yeah, when you go to the patient and then all of those—these different groupings? Yep.

**Donald:** Okay.

**Vanessa:** The different groupings.

**Ben:** Yep.

**Vanessa:** As long as all of the groupings are there, it will work. I don't think we necessarily need all of the [unclear], because there are so many different eye [procedures].

**Donald:** Yes, so in this given example right here, are those all the ones you expect to see, or is there something missing?

**Ben:** So in this example here, I think you would click this, and then you wouldn't click the procedure because you've already got the procedure up here. You would just click that and then through to the anaesthetist. Agree?

**Donald:** So she obviously she could choose a procedure if she wanted to, unless you're saying actually we want to prevent the admin office from ever picking a procedure.

**Ben:** Well, that is just because it's a waste of time because we've already got the procedure. We don't need to select a procedure.

**Donald:** You're saying the admins don't need to select it or nobody does? Because presumably you would then as an anaesthetist come through and select the right one. So that's what this whole demo on the right hand side here.

**Ben:** No, because the procedure is up here.

**Donald:** Yes, so that procedure at the top here, our system doesn't consider that any sort of object it can make decisions based on. It's just free text, given to everybody involved so they can see what it's going to be. Whatever the rooms give us, or the hospitals, we just kind of give that to you as it is. That's what the demo is trying to present. But obviously underneath [unclear: possibly 'SXAP'] there is a bunch of what we've been calling contracts in the system. Maybe I'll put it there, so it moves a bit easier for me. And so somebody would need to select one of these, which is presumably a fixed-price contract for a given procedure. Or have I understood something incorrectly?

**Ben:** So, yeah, sorry, correct me. I'm actually incorrect here. So, yeah, this is in the context of eye surgery. Yes. So if it's a fixed price, that has to be clicked. So that could be the admin team. And that's pretty easy, because you would just go, 'CAT', and then cataract comes up. And what I would do is actually need to go through this list and edit some of this stuff, like toric or multifocal. That's for us, you know.

**Donald:** Yeah, this is all just based on files that you gave me, but ultimately all the fine-tuning of that you guys would clean up and edit as you need to.

**Ben:** Whereas we would just be like cataract one side, cataract both sides. Yeah, great.

**Donald:** And awesome.

**Ben:** So, in this context, yes.

**Donald:** Cool. And the system obviously does not dictate that anybody has to fill this in at this stage, but in theory they could.

**Ben:** If this was not a cataract, if this said tonsillectomy up here, okay.

**Donald:** Well, if we go up here, right, we can select some different example procedures. So pick one of those that's not pre-filled. No, see, those ones are just preconditioned to select something. But if you go to another one that looks good. Nice, cool. So it starts on zero again. So, left knee.

**Ben:** Okay, so just say this is an ACC one. Okay. Yeah, okay, that's fine. Okay.

## Future contract options and RVG defaults

**Donald:** Now just to pause here a second. In theory, if there were some particular ACC contracts, you could imagine they might exist under that if they were available.

**Ben:** Indeed. That's perfect. So if in the future Forte comes to us and says, okay, we've got a fixed price—which I imagine they will, it's inevitable—they'll say, 'We want to provide a fixed price for a knee arthroscopy,' which is what this is. And then that would be able to be uploaded, and you would go, okay, this is a Southern Cross contract at a fixed price, and it would come up here. So it could be Forte, Southern Cross, and then...

**Donald:** Well, in this demo here, we don't have anything set up like that.

**Ben:** Well, because there are no fixed price Forte ones.

**Donald:** That's right, but then you'd.

**Ben:** Imagine that in the future.

**Donald:** If you've actually made them, then.

**Ben:** Based on this condition, just like you have for the eye hospital.

**Donald:** Yeah. So one of the particular things that Greg and I talked about almost throughout all of our work together is that by default there should always be at least an RVG contract for every configuration. So that's what this is doing, right? There are actually no Southern Cross contracts for Forte. So the system's just going to present to you the RVG code to select. And obviously the admin team can choose it, but at this point the expectation is you'd pass it over to the anaesthetist.

**Ben:** So at this stage, how is that passed to the anaesthetist? There'd be a button to say 'pass to anaesthetist'?

**Donald:** No, no, no. So again, you would never see this in the real app. This is just for the demo. But as you change this on the left, you see that this is you looking at it in the morning, but you might look at it in the afternoon and then it looks like this. At that point most of it's been filled in, and maybe in the future we can have some smarts to do this, but certainly the administrators can do it. And at this point your job, to finish off this part of the puzzle, is to come through and pick what you want to do.

## Updating bookings, change history and overdue alerts

**Vanessa:** So can I ask a question? In the app we have at the moment, if we make an update or change something, the anaesthetists have to log out and then back in to see the new update. Will this apply with this?

**Donald:** So my expectation probably would be that if you made an update, he would at least need to go from the booking back to the list and then come back into the booking. It wouldn't just magically update underneath his feet. If you think about Google Docs, if somebody types something, you see it in real time and nobody has to refresh the screen. I would think that probably the way this ends up being engineered would not be like a Google Docs experience. It'll be a refresh of the page, and it's there. But certainly you don't need to log out and log in.

**Vanessa:** It's just that, yeah, the anaesthetists get quite frustrated with that.

**Donald:** Yep. And we could implement some sort of like pull to refresh. People often expect-- A little.

**Ben:** Refresh page button or something.

**Donald:** Yeah, something like that. Or I mean, this is a sort of stage where maybe I should pause before I commit to anything. but it's, I'm just saying that it may be possible that we can set it up where it's listening, and even if you have it open every minute, maybe it takes a look and see if it's an update. Something like that could be possible.

**Ben:** We'll see. Yeah. Other things before we drill out, drill down on a couple of other things, Vanessa.

**Vanessa:** Up here with the little price. So also, if we were to amend an invoice, will that obviously automatically change for the anaesthetist to see? Plus when we send it off to the hospitals, all of that kind of stuff, will that automatically add notes and update it?

**Donald:** Yeah.

**Vanessa:** You know, like all of that kind of stuff.

**Donald:** All of that sort of stuff you're talking about isn't really represented in this little small prototype. But what I expect when all is said and done is that when you come to a booking page as an administrator like yourself and it looks something like this, or maybe more accurately, you could imagine this is the fuller version of it, right? You would be able to see the total cost of all of the procedures within it. And when I say a procedure, you know, there'll be a chunk of logic where you have your contracts and all this sort of stuff, but you have multiples in a single booking, right? So you'd see the total cost of everything in for that booking, but within a single block or a single procedure, you could see in there that there might have been pre-op or post-op events, and you could see, and you'd have options to go ahead and override things as needed. I don't know exactly what they look like, but I know that's something you need, and so we'll make sure that we get that right.

**Vanessa:** Going back to the system that we have now, it says our names when we've updated something or changed something that will exist in this.

**Donald:** If you needed to, if you want to basically have an author of each edit. I would imagine that sort of thing would have already existed in the background, but if you need it to be presented in the front end, that's fine.

**Vanessa:** It's just, with having office staff, it needs to have even a user ID, say T1 or V1 [unclear]. It's important for that kind of system to roll through, because otherwise we're never going to know who's changed an invoice or...

**Donald:** As in maybe an alternative idea, I think it's important to have the time stamp and who edited it and all that sort of stuff visible. What if there was something similar to this? Let's go here. So if I look at this user story right here. there's a history button and this shows a log of everything that's changed. So there can be challenges, just like visual noise when you have too much stuff on a page. And so if somebody, anybody in the office, a dozen different people edited a single booking or an update comes from a hospital system or wherever else, I think it might be nicer if you had a log of changes like this that you could go and review if you ever needed to see who made this change or when did it happen or what, but it could appear somewhere a little bit behind a door as opposed to just at the front. Would that be okay? Or would you need something more visual all the time?

**Vanessa:** No, it just needs to be somewhere within the invoice booking.

**Donald:** Okay, cool. Yeah, we can have some sort of audit log on each booking.

**Vanessa:** Yeah, it's just important for us, but important for the anaesthetist as well, because the invoice has so many different stages. Like overdues, also overdue stages and stuff like that. That kind of stuff.

**Donald:** Cool, yeah, I understand that.

**Vanessa:** So, yeah.

**Donald:** Cool, what else?

**Vanessa:** Will there be just a few things? Obviously overdue, stuff like that.

**Donald:** Yeah, so based on earlier conversations we've had, we've basically got this concept in the system of alerts and there are mild and there are heavy alerts. So a mild alert would be if this person has an outstanding bill, but it's within 90 days and so you want to be notified as you said in the past. But it's not like desperate. But then if it's over 90 days, you want it to be more of a red, angry alert. And then there's also, I think, alerts as well if somebody has a positive balance for whatever reason.

**Ben:** I was just going to say, for the purposes of today, because that's all stuff that we are going to do down the track.

**Vanessa:** But where would that sit on?

**Ben:** Are you talking about if there's a, if this Margaret Ellison patient hasn't previously paid a bill, I see.

**Donald:** Yeah, no, that's, I think that's a fair expectation that it would, again, I don't know exactly what's going to look like, but I'm pretty sure, I mean, I know we have requirements to this effect.

**Vanessa:** Yeah, because that needs to sit somewhere.

**Ben:** A little alert, maybe, you know, like there's an alert box here where you could have other alerts, maybe.

**Donald:** Yes, so ledger balance. Anyway, we have something to that effect, and I can look at that later on. But yeah.

**Ben:** Good point, Vanessa. Thank you.

**Vanessa:** Yeah. So yeah, the alert thing is a big thing for me.

**Donald:** Yes.

**Ben:** Yeah.

**Donald:** I know that when we've talked about it, we know that it has to exist in the context of I'm looking at a patient and I want to see that information. Yeah.

**Vanessa:** Yeah.

**Ben:** Yeah, that's a good point.

**Donald:** Yeah.

**Vanessa:** It's just yeah, we have quite a few that slip through the radar. And even though they have insurance, they still seem to slide through because we don't have any alerts.

**Ben:** Good visibility that this has been a problematic patient in the past. Yeah.

**Donald:** Is that all?

**Vanessa:** Yeah, I'm really impressed by it.

**Donald:** Okay, well, as Ben said, I think there will be lots more chances to tell us, 'Oh, actually, that's not quite right, Donald,' or 'There was another thing I thought of that's important,' and we can come back to that in the future.

## Removing unused catalogue items and clarifying terminology

**Vanessa:** Just another thing, I think we need to remove some of the operations, like what we said. There are quite a lot that we don't use.

**Donald:** Oh, this is from like the contract list? Yeah, cool. There's a little demo data at the moment, but the expectation is that you guys will manage that.

**Vanessa:** Yeah.

**Vanessa:** What do you think?

**Ben:** Yes, so my feedback, I might just take it from the top. So if we're using this thing...

**Donald:** Can you imagine that's your phone, you're looking at it somewhere else.

**Ben:** No, I'm just looking at this bit first.

**Donald:** Okay.

**Ben:** Not this side. Okay, you're going to work with that. This bit here. Just in terms of the terminology, 'needs a contract', I wonder if—I’d be interested in what Vanessa's opinions are, so jump in, Vanessa. Rather than saying 'needs a contract', because I know with the build of the system, the term contract is something different to when Vanessa and I talk about a contract.

**Donald:** Yeah, cool.

**Ben:** So I'm wondering if rather than saying needs a contract, if it just says needs an invoice destination.

**Donald:** Okay, so this here, We talked last time when I came in about maybe the term contract is too confusing. So I'm totally okay with changing it. So at this stage, we're selecting who the invoice destination is going to.

**Ben:** Yeah, Put this little warning. Yeah.

**Donald:** I know that. Yeah. But at the second stage, step 2, we're trying to choose who maybe these different providers are. Like what's the correct term for stage two? If it's not contract, what do you think is a better term?

**Ben:** Well, so if you're choosing one of these, this is a contract case. But if you're if you're going to, where does the invoice go patient, that's not a contract.

**Donald:** Yes, okay, so the more generic term at the top, which is basically saying.

**Vanessa:** It could just say destination.

**Ben:** Invoice destination.

**Donald:** Yeah, invoice destination or payment details outstanding.

**Ben:** Yeah, yeah, yeah, yeah.

**Donald:** Okay, yep.

**Ben:** It's just, you know, you're asking.

**Donald:** No, this is good, this is good.

**Ben:** So I'm looking at this. Okay, so where does the invoice go? Let's go patient. Okay. So is it prepaid, yes or no? Which is good. Again, this is just a little suggestion: rather than saying 'not prepaid', I wonder if we should just say something like 'standard invoice' or something like that, because it sort of makes prepay the default or the normal. By saying 'not prepaid', it sort of makes it sound...

**Vanessa:** why don't you say self-funded?

**Ben:** No, it might not be.

**Donald:** Both of them could be self-funded, but one is paid before, but I hear what you're saying.

**Ben:** Well, that's like standard or bill post-op or something. But I'm being picky. I don't like the term 'not prepaid' because 90% or 95% of what we do is just the normal pathway, which is not prepaid.

**Donald:** Yeah, so rather than having stage two under the patient.

**Ben:** I like the stage two. I think this is important, but I would just be like standard or prepaid.

**Donald:** I'm hearing you. So rather than calling it 'prepaid', because it's presuming something that's not really the priority, the question should be 'payment type' or 'payment style', something like that.

**Ben:** Perfect, yeah.

**Donald:** Okay. And then I would think the first option should be standard invoicing and the secondary option would be prepaid.

## Prepay amounts outside a predetermined price list

**Ben:** Okay, so now just say we are doing prepaid.

**Donald:** Yes.

**Ben:** Now, at the moment we've got 'click on the procedure'. So just two points I wanted to raise. Sometimes it may not be predetermined. So for example, I had an email from a secretary yesterday saying, 'How much would you charge for this operation if we do this and this?' And I said, 'Can you clarify? Send me some more patient details.' And I sort of thought, okay, I'm going to charge this amount. I'm not going to get them to prepay, but I could ask them to prepay. This is for a spine, you know? So there'd be times when it'd be either from a predetermined list, or Vanessa might say, 'Hey Ben, how much do you want them to prepay?' And I would say, 'Oh, just make it two grand.'

**Donald:** Yes.

**Ben:** And then Vanessa just put in 2 grand.

**Donald:** Yeah. So over here when we say not prepaid, we have the option of a fixed price or an RVG. So you could imagine a similar slider which was select...

**Ben:** Select from above or...

**Donald:** Or fixed price.

**Ben:** Or other price.

**Donald:** Yeah. Cool. That makes sense to me.

**Ben:** So, and then...

**Donald:** This here term procedures, procedures and contracts are obviously words that we've had trouble with. Is there a better term rather than, if I go down one more, is there a better word for procedures here? Because these, in my head or in our terminology internally, these are, I guess you're picking a procedure that has a fixed price. Okay.

## Surgeon specialties and procedure/contract filtering

**Ben:** So now I had a question, and this will sort of affect this dropdown list, right? In here we've got list, surgeon, anaesthetist, funder. I wonder whether or not we should have another line or specification for specialty. And the specialty would be dictated by the surgeon. The reason for that is if you had that, it would then focus or limit the pick list.

**Donald:** Interesting. So yeah, so.

**Ben:** Do you see what I'm saying?

**Donald:** Yep. So in the system, when we think about all these things we've been calling contracts, it's basically just a box that has a bunch of settings in it. And because we don't have the concept—you were saying that surgeons' rooms don't really exist, like each surgeon has an individual price list. That's something you'd said. And so we still want potentially the flexibility of having one fixed-price contract in the system that could be applied to multiple surgeons at a surgeon's room if they decide to. When we think about, let's go back to the Miravell Plastics example, because it's easy for me to think about. When we think about a fixed price for a Miravell Plastics facelift, would you want to apply the setting 'cosmetics', or what would the setting be, the specialty?

**Vanessa:** Because that's what it says.

**Ben:** Well, because she is a plastic surgeon, so that's her specialty.

**Donald:** So right here we've got these rules in the system that we talked about, which is that when a list comes through from upstream, it doesn't become an active list until it has an anaesthetist, surgeon, hospital, day and a session, right? AM or PM. But we do know the list could be a draft if it has a hospital, surgeon, day, and probably a session as well, but we don't know who the anaesthetist is. When you get this information from upstream, do we need to infer what the specialty is, or can we attach a specialty to the surgeon?

**Ben:** You can attach a specialty because we will have a list—we're working on this spreadsheet—and we'll attach the surgeon's specialty to that. We can be quite generic; rather than saying upper-GI surgeon or something, we can just say general surgery. And then when it comes to our procedure contracts, we can also, on our spreadsheet, add a column of general surgery, general surgery, plastic surgery, ENT surgery, you know.

**Donald:** Okay, so.

**Ben:** Then that way, when we've got the surgeon, a general surgeon, and then we go here, we don't have our contracts in with our breast reductions—cataracts, yes. Because these will have another tag of ophthalmology and these will have a tag of plastic surgery or general surgery.

**Donald:** Great. Do you understand what I'm saying? I do think I understand what you're saying. So we could have surgeons have specialties attached to them, but also our contracts will have specialties attached to them.

**Ben:** Our procedures will have.

**Donald:** Procedures, thank you. Procedures.

**Ben:** Which, if you want to call them contracts, that's fine as well. But we think of them as procedures.

**Donald:** I'm going to say the word contract just because the transcript will know what I mean when I say that. So our contracts will have the concept of a specialty. And so you would have a surgeon who does both, would do multiples, right? Someone who does general plus plastics or plastics plus eyes.

**Ben:** No, I think the way we would do that would be that we would assign the specialist surgeon or proceduralist by a specialty. But then there are some like breast reduction. They can be done by a plastic surgeon or they can be done by a general surgeon. So we can assign 2 specialties maybe to the procedure.

**Donald:** Well, a procedure could potentially have multiple specialties. We don't need to limit it at all. So if you want multiples, that's fine. But you just said something that's a bit confusing when you say you are selecting the surgeon. The surgeons come to you.

**Ben:** Yeah, sorry. What I mean is the software system has the list uploaded, applies a surgeon or selects a surgeon. So the software system already knows that, you know, Dr Lucy whatever...

**Donald:** Yeah, if Lucy has a...

**Ben:** Lucy is an ophthalmologist, so then the system knows that we're looking at ophthalmology.

**Donald:** Yeah, so when it's filtering against, say, your contracts, obviously this here is actually an anaesthetist contracts of fixed prices. So in this scenario here...

**Ben:** Oh, so Lucy's the anaesthetist.

**Donald:** Okay, sorry, who's the surgeon? Does it say it down here?

**Ben:** No, down here.

**Donald:** Yeah, cool. Anna.

**Ben:** Anna. Cool. Anna Whitcomb. So Anna Whitcomb is an ophthalmologist, and then when we're clicking on...

**Donald:** We can filter down these anaesthetist contracts to filter anything that's not an ophthalmologist. Great. Okay, that's cool.

**Ben:** Is that, do you agree? Nice. Just, you know, stop me if I'm saying...

**Donald:** Okay, so when Anna brings a list to AA and says, 'Here's all my things for AM on this day,' will all of those be one specialty or could they be mixed?

**Ben:** No, Anna is only an ophthalmologist. She will only be operating within her specialty.

**Donald:** Okay.

**Vanessa:** Can I ask a question?

**Donald:** Is it related to this?

**Vanessa:** Kind of.

**Donald:** Hold on to her just a second. So just asking that question again earlier. When Anna's list comes to AA, you're saying because she's an ophthalmologist, she's only doing that. But you mentioned that there's also a set of general surgeries.

**Ben:** Yes, so that's a specialty. A surgeon who does gallbladders and bowel resections and hernias, they're called general surgeons. A general surgeon will have subspecialties. They do general surgery training and then subspecialise in, say, upper GI surgery. An upper GI surgeon would specialise in gallbladders, stomach and maybe the oesophagus. However, if somebody comes around and says, 'Hey, can you fix my inguinal hernia?' they'll say, 'Absolutely, I can do that as well, because I'm also a general surgeon.'

**Donald:** Yes, okay. Well, maybe at least for the first version of the application, if we ignore the sub-specialties and just do the top level ones, that's right.

**Ben:** The broad specialties. And that's why I say general surgery rather than the sub-specialties.

**Donald:** Great. And just I'll just put a fine point on this. You're saying. surgeons will never have multiple specialties, or it's really rare.

**Ben:** It would be extraordinarily rare. I'm not saying it's impossible, but it's...

**Donald:** Should our system allow for multiple specialties?

**Ben:** No, like I don't...

**Donald:** Just one.

**Ben:** You know, to be honest, if there is an unusual situation, we can put them in twice, we can call them an ophthalmologist and a [unclear].

**Donald:** We consider each surgeon a unique thing that can't be duplicated because they have a HPI number. So we would...

**Ben:** I do not know in the context of private practice of a surgeon that does multiple specialties. I know, for example, there would be somebody who might be an intensive care specialist as well as an anaesthetist or an intensive care specialist as well as a surgeon. But not two different surgical.

**Vanessa:** I've never come across it.

**Donald:** Okay, it might, I mean, these things can always be changed.

**Ben:** I'm not saying it's impossible, but I'm just saying it's not.

**Donald:** It might be easier for our system just to support it, even if it's mostly not used. Okay, cool. I'll leave that open in the air, then.

**Ben:** It's not a thing. Okay.

## Anaesthetist pain work, add-ons and ad-hoc billing

**Donald:** And so we know basically just because of the surgeon and their specialty that we can filter those lists down on that, which is great. Are there any other specialties within anaesthetist's role or is it just anaesthetist?

**Ben:** Well, yes, so an anaesthetist can also be a pain specialist. We have had that in the past. I don't think anyone... I know Jordan is doing a bit of pain.

**Donald:** Does any part of the system need to care about that?

**Ben:** Does Jordan do his pain [work] through here? Does he?

**Donald:** And so when he is recording activities that are billable as a pain specialist.

**Vanessa:** Doesn't, it kind of doesn't.

**Donald:** Does it go through your system?

**Vanessa:** No.

**Donald:** He just does it outside of the system.

**Vanessa:** Well it comes up as CPH/pain. We can manually...

**Ben:** No, no, does he bill privately for pain?

**Vanessa:** No.

**Ben:** So when Rick Ackland was around or those sorts of old, you know, they did, or even Jeremy Fote, was he doing any billable private procedures?

**Vanessa:** Jeremy did, but Jordan has never billed through us. The only thing that we've billed through here is if the room gets used for pre-op consults. So we do have to have that added in here.

**Ben:** Yeah. We can talk about that later if you'd like.

**Donald:** Yeah, there is something that Greg and I started to explore when we looked through some of the documents you sent us. Some things will say this line is $500, and this line is plus $200 if you do that at the same time. And so this whole idea of add-ons is something we probably inevitably need to support. Again, I'll mock it up and we'll all be able to look at it one day. But potentially either through an add-on or through a general ad-hoc invoice, we can support any of that pain stuff. It doesn't need to be too complicated. Okay, I think that's my current question. What were you thinking? You had another question.

## Shared surgeons, split sessions and out-of-hours lists

**Vanessa:** So we have a lot of lists where it's say a general surgeon and then an added on surgeon.

**Donald:** So a single list has multiple surgeons.

**Vanessa:** Yeah.

**Donald:** Well, this is new.

**Vanessa:** So with the system we have now, we.

**Ben:** I think the solution to that is just create a new list.

**Donald:** Would both of, so if we had.

**Vanessa:** So it can be a general surgeon and a gynae surgeon.

**Donald:** But both in the same procedure.

**Ben:** No. So for example, some surgeons are not very busy and can't fill a whole list. They might share a session, like a morning or an afternoon, with another surgeon. They'll say, 'Look, I've got two hysteroscopies I need to do,' a gynaecologist, 'at eight and nine o'clock, and I'll take the list from eight until ten.' And then the second surgeon goes, 'Great, I'll take that list from ten o'clock and do a gallbladder operation afterwards.'

**Donald:** Yeah, I would say the way the system would support it is it'd be two different lists. As of now, an anaesthetist can only have one list in AM or PM slot. So would you expect those to have different anaesthetists or the same anaesthetist?

**Vanessa:** No, they have the same.

**Ben:** Typically it would be the same anaesthetist, but a list might get split into two.

**Donald:** Okay, that's like a whole new kind of breaking concept, which is that a slot could have...

**Ben:** Slots.

**Donald:** Half a slot. Would you ever slice a slot in three or four?

**Vanessa:** No, just two.

**Donald:** Just 2. Okay, half slots.

**Vanessa:** Plus, sorry, I do have another. We have had eye lists that go past the sessions, AM and PM. If there are emergency cases, then we have to create a slot after six.

**Donald:** Okay, so like out of hours slots?

**Vanessa:** Yep.

**Donald:** Those are known in advance or it's kind of.

**Vanessa:** It can be done that day, at night. So that's another thing that...

**Ben:** Yeah, that's a good point, and that's exactly right. Not only in eyes, but any specialty, because they might say, '[unclear] I need to do. Is anybody available at five or six o'clock to do it?' So that's another thing we haven't thought about.

**Vanessa:** So that's enough.

**Ben:** And then we might have to then create a.

**Donald:** Yeah, cool. So imagine Dr [unclear: possibly 'Suta'] is looking at their list that day. They see AM and PM. The AM could actually be split into AM A and AM B. And then you could imagine some sort of out-of-hours or after-hours list. Okay. I think that's all doable, but that's new, and good to know about. Really good to know.

**Vanessa:** You might get lots of things like this.

**Ben:** Because at the moment what we do is we just do it all in the one list, but then have a little, you know, brackets. It's actually somebody else doing the procedure.

**Vanessa:** There might be someone that's.

**Ben:** I'm thinking about the split list, like I've had one where a plastic surgeon couldn't find a pediatric anaesthetist, so they did it on Mel's list.

**Donald:** Yeah. I think in terms of the way our current mental model is for how we're structuring the data and how we do filtering and that sort of stuff, I think at this stage, we'll see if the developers when we start building it have a different opinion, but at this stage I think the idea is that it would probably be nicer to split Split the slot in half and have an A&B list, as opposed to having a single list with multiple surgeons, because then.

**Ben:** The default would be just normal, but the special circumstance would be potentially.

**Donald:** Okay, well we can see what that looks like.

## Hospital-supplied procedure text as the later source

**Ben:** Okay, so on to the next thing. I don't think we need this. Do you think we need that?

**Donald:** So we had this. We heard from you guys that.

**Ben:** Sorry for the recording, I'm talking about the procedure as received.

**Donald:** Yes, thank you. So the 'procedure as received', which is the plain text we get from different upstream systems. We heard that the surgeon's rooms might give you some sort of hard-to-read code like this, and then the hospitals will come in with something a bit clearer. Some of this falls into what text ultimately appears on an invoice. We've talked about if we have a fixed-price procedure in the system that's not just using a standard RVG, we can allow the admin staff to hand-author what they want to appear on the PDF so it's really clear. But in situations where no such thing exists, because it's an RVG, how do you guys expect the invoicing to be handled in terms of what is visible on the invoice? Our default was that we'd use the hospital text on the invoice, not the surgeon's room text, because we'd heard the hospital's was clearer.

**Ben:** Yeah, I agree with that. But the initial information comes from the rooms, and then the day before the hospital sends their list and it gets uploaded into the system and the procedure becomes this. I would just take the hospital procedure as the source of truth and override this procedure.

**Donald:** So you would never want to see, does that look right? Or do I want to see what originally came through? You'd always just 100% trust what the hospital gives you.

**Ben:** Yeah. Okay.

**Vanessa:** Because that's what's on there.

**Donald:** In that case, what we talk is.

**Vanessa:** That we don't need all of.

**Donald:** I don't know if this is true to life, right? Obviously, the AI made up what this could have looked like.

**Ben:** Yeah. But I would just have it so that when it gets updated with the hospital list, if the procedure has changed, just accept the hospital's version.

**Donald:** Cool. Okay. And we already talked.

**Ben:** I don't think you need—I don't think you need to be able to [unclear] that.

**Donald:** Yeah, I hear you. We can remove that from there, and with the history we talked about earlier, you'd always be able to see what the original one was in the history. So that works.

**Ben:** Okay.

**Donald:** Hit me, what's next?

## Recording RVG and fixed prices together

**Ben:** Well, so the other thing, and so this is, I mean, this will be covered a little bit later on. So obviously, let's, okay, let's just start again. It's the patient, not prepaid, and it's RVG. So this obviously is not completed because there's no modifiers and no time and stuff. That's right.

**Donald:** That's right. It's just very thin.

**Ben:** Yeah, that's okay. There's one thing I didn't realise: one of the anaesthetists decides on the prices himself, and on his card he'll just put in his price.

**Donald:** Yeah, like a fixed price.

**Ben:** With a fixed price. But he also wants for his own personal reference the RVG codes.

**Donald:** Yeah, that's fine.

**Ben:** So he wants to be able to stick in his RVG codes, the time, the modifiers, and say, 'I've got that recorded, but blow that, I'm just going to do my fixed price.'

**Donald:** Yeah, so.

**Ben:** And then he wants to be able to go back and see what it was, because I guess if somebody queries his fixed price, he can say, 'Well, look, if I did it by RVG, these are my RVG codes.'

**Donald:** So I think last time when I came in and talked to you guys about some of this, this is where the idea of fixed price came from, because sometimes you're like, 'I don't care about RVG, I just want to care about fixed price.' But in a world where you do care about the RVG, before you'd given me that information, we always had this idea that if you look at my phone here, you'd select your RVG code, whatever it might be, fill in all your information, but at any point on a procedure you could come down here and override the price. You could say, 'I want the price to be this.' The system would still record everything else you put in, but you'd see that.

**Ben:** Because currently you can't do that, can you? It's either/or. If you're recording the RVG, it wants to do the RVG. So you're having to delete the RVG and record that somewhere else; it's a manual process.

**Donald:** And so in this scenario here, the RVG would be mandatory; it wouldn't let you submit unless you submitted the RVG. But you'd still override it with whatever price you wanted.

**Ben:** Can you do it without the RVG? Like for me, if I'm just doing a price, I don't want to fill out any of this rubbish.

## Showing calculated prices to anaesthetists

**Donald:** In that case, I would say when we pick the fixed price—again, we can test this out once we build it out a bit more—but my gut tells me if you choose a fixed price, you can optionally choose an RVG in there, but you're not required to put in the time or the modifiers. Cool. In the very, very earliest version of this prototype, which you guys didn't see but Greg saw, when you edited—actually it's similar to what's in here already. Let's find a procedure that's not completed. This list, Margaret, in progress. Great. There was this fun animation that, as you as an anaesthetist, imagine this is on your phone, as you clicked more time, you saw the price of the procedure change. And obviously in the demo that's nice; you can see that when you change something, the price changes as you predict it should. Greg's feedback early on was that an administrative person would want to see what that price is and see it change in real time, but an anaesthetist just cares about the care and doesn't care about the numbers. So in the current version someone choosing a fixed price or RVG doesn't have a clear little widget on the screen showing what the price is going to be. In a world where it's RVG, they just see the modifiers and all of their units. Is that something you want? Do you understand what I'm saying?

**Ben:** Yeah, I understand what you're saying. That's an interesting one.

**Donald:** There were even different versions of this where you saw the units go up but didn't see the price. In the end we got rid of all of it because we thought that would be closer to what you were interested in.

**Ben:** Well, that's what we have at the moment. We don't see a price. But maybe for like a self-funded, you see the price go, okay, I might just charge a little bit less. I don't know.

**Donald:** I mean, for self-funded stuff, you'd obviously be able to scroll through and see what price was selected, but there was this first-class widget that existed in the app and made it really clear. Do you want something like that, or do we go back to just... or something else?

**Ben:** I think it's fine to say on the app to have what the price would come to.

**Donald:** Even for RVG and things?

**Ben:** Yeah but I don't think it needs to be in your face.

**Vanessa:** I think that's important that you see what the price comes to.

**Ben:** Yeah.

**Vanessa:** Okay.

**Donald:** Well, I can try and resurrect that so you guys can see it.

**Ben:** Yeah, because the thing is that because some people are just clicking modifiers and not even thinking about how much they're charging, they might be going, oh, I didn't mean to charge this much.

**Donald:** Yeah, it's all gone now, but I can go back and find it and reinstate that stuff.

**Vanessa:** Especially when it's like 10 modifiers.

**Vanessa:** Yes.

**Vanessa:** Yeah, and the price does get up.

**Donald:** Yeah.

**Vanessa:** So I think it is important to have that price somewhere.

**Donald:** Yeah.

**Ben:** I agree. Yeah, because it might modify people's behaviour. And I mean, Vanessa sees it more than me, so she's nodding her head. If Vanessa thinks it's...

**Vanessa:** Important, I think it's really important, because it's myself that gets all the emails from the hospitals.

**Donald:** Yeah.

**Vanessa:** And now daily.

**Vanessa:** And the hospitals are coming back and saying, 'What the heck are you doing? This is really ridiculous.'

**Vanessa:** Questioning modifiers.

**Donald:** And when you go back to the anaesthetist, do they say, oh, I didn't realize, or they say, I don't. My word is law and just.

**Vanessa:** I don't really need to go back a lot to the anaesthetist. I can explain it myself.

**Donald:** Okay.

**Vanessa:** Based on the RVG guide. But there are times when the modifiers are quite a lot. That's when I need to go back to the anaesthetist. But if the anaesthetist can actually see the price they're charging, then it might...

**Donald:** Yeah, that's really great.

**Vanessa:** Limit it.

**Ben:** Yeah, I agree with that. Yep.

**Donald:** Awesome. This has been great. More. What else you got?

**Ben:** That's all I got.

**Donald:** Okay. Cool.

## Requirements validation, prototype and next project steps

**Ben:** I think this is really good. Definitely heading in the right direction. So the process from here is obviously you just sort of tidy up the requirements and then you hand it off to the developers to develop. Is that right?

**Donald:** Not quite. So I built this original prototype that you saw the video of, and there's a working version of all of this. I'll go back to you so I can put this down. If I come over here and remove that filter, all of these little cards on the screen—there we go, they now fit on the screen. Each one of these represents a requirement you guys have talked about that you want and need. If I do a filter, these ones in green are the ones Greg and I sat down and agreed this is how it should work. All these other ones have open questions, or Greg and I haven't got up to them yet. Everything I've been telling you in the past has been that I want to sit down and finish with Greg, get all of these into something that he and I agree on, and then build up the prototype to represent everything we've talked about, bring it up to date. Then we'd need some honestly lengthy workshops with you guys to sit down and read all of these and say, 'Do we understand it right?' We want to ask that question before we build it. That would need some time from some people.

**Ben:** So that looks like you've made good progress.

**Donald:** Yeah, we have. But one of the things Greg and I talked about, and we'll probably talk about this tonight, is that we actually think our proposal is maybe we should—off the back of what we've talked about today, which is some of the biggest outstanding gaps—the question was, our recommendation now is we think we probably know enough information to build the new prototype, and anything else that's wrong will [unclear: transcribed as 'never be picked up'; possibly 'inevitably be picked up'] in the next phase of sitting down, talking about it and having workshops. So that's kind of where I think we want to go from here: I'd update the prototype to represent everything you guys have wanted, see how it works, and once you're happy with that we'd go through the process of sizing, chatting with you about financials, and getting going on it. Does that make sense?

## Xero integration and maintaining contract price lists

**Ben:** The other big piece of the puzzle, and I've talked to Greg about this, is getting the Xero integration, getting that right, and you meeting with Michael.

**Donald:** We will meet with Michael, yeah. That does need to happen, absolutely. Everything that happens on the Xero side of the fence will obviously need configuration and we will be integrating with it. But inevitably we will continue to meet with people, yourselves and Michael, and adjust as we build. We don't expect to get everything 100% today or tomorrow, but we need to get it mostly right so we can say, 'Yeah, this looks right, the shape of it is good, let's go.' I do realise I have another question. So we understand what we think the contract picker should look like now and how that might change, how you might use it. When, let's say, Miravell Plastics comes in and says, 'Hey Vanessa, here's a new price list. Please update the prices in the system,' how do you want to handle it? Without seeing any mock-ups, what would you expect it to look like?

**Vanessa:** Well, so how does, to my question would be, where would we enter into the system kind of a thing? Like now, at the moment, we just do prepays.

**Ben:** At the moment you just—manually. Yeah, you're doing it manually. You're looking it up, getting a piece of paper and going, 'What's this one looking like?' Yeah.

**Donald:** So right now every time you're saying any time there's a procedure you find the piece of paper and you type it in or you are picking stuff in your system.

**Vanessa:** No, it gets emailed to us and then we manually do it. So that's the system that we have at the moment. So this system will be completely different to how the system will be done.

**Ben:** Why don't you tell us what do you think? What's your vision, Donald?

**Donald:** Yeah, great. I just, I don't want to lead the witness too much. I want to see what's in your head. So, once you...

**Ben:** This here, just to be honest, this actually came from me. I actually wrote this.

**Donald:** You wrote this.

**Ben:** I wrote this whole thing, and I gave it to Kerry, and I said, Here, you put your letterhead on it.

**Donald:** Funny. Okay.

**Ben:** Well, because there was a problem, and I said, 'Kerry, this is the solution. Are you happy with this?' And Kerry said, 'This is fantastic, thank you.' And I said, 'Because of the Commerce Commission, this is not from me.'

**Donald:** Yes.

**Ben:** This is from you. And so she's put her letterhead on.

**Donald:** That's right, great.

**Ben:** But I've actually, I've actually, this is, I authored this.

**Donald:** Okay.

**Vanessa:** The thing is, Ben's very good with his accounts and stuff like this.

**Donald:** Yeah.

**Vanessa:** For our office. What I would like to do is if something like this comes through, i.e. Ben, you just go to a screen, like a spreadsheet.

**Donald:** Yeah, so I think both of you know that Greg feels quite passionately about the idea of exporting some versions of our contracts out, editing them in a spreadsheet and then bringing them back in. And I think some version of that is currently in scope. But even if that system didn't exist, my expectation is that you could go into the system, find each one of these line items—breast reduction simple, breast reduction complex—and just update the prices.

**Vanessa:** Yeah.

**Donald:** Right, back in the settings.

**Vanessa:** That's what I'd love to do.

**Donald:** Okay. Would you have a situation where, if we go to like this...

**Ben:** There might be a completely new procedure, which often happens. New procedures, yes. For example, I had a gastroenterologist email me—I don't know if I CC'd you. They're doing this brand-new procedure. He said, 'What's your fixed price for that? Because we just want to tell the patients. It's not insurable. Patients are going to have a fixed price. How much are you going to charge for it?' And I said, 'How long does it take? What's involved?' Blah, blah, blah. And I said, 'Bang.' And he said, 'Great.' So something completely new that's not in the system already.

**Donald:** Yeah, nice.

**Ben:** It needs a new line.

**Donald:** Yeah, okay. And it's conceivable that you would have a document like this that comes from somebody upstream and the first half of it would be a bunch of fixed price things, but maybe the bottom two would be a fixed discount or a fixed rate or something else like that. Okay, cool. Okay, I think that answers my question. So Greg and I were having some back and forths on whether or not you would have all those settings exist at a different tier or level and It sounds to me like the best solution would be to have each of them be an individual thing. Yeah.

**Ben:** I mean, I don't know. I think Greg was suggesting to have like a source of truth somewhere, like a spreadsheet or something.

**Donald:** Well, the system itself would be the source of truth, but you could tell it to spit something out if you needed to. Yeah. So.

**Ben:** It's whether or not we have a source of truth that sits outside of your system as well, I think.

**Donald:** He's not used those terms source of truth with me, so maybe you guys are having a conversation about something different.

**Ben:** I'm thinking about having somewhere essentially that our contracts get updated or kept. So it needs to be kept somewhere and it needs to be kept somewhere safe so that we don't lose it.

**Vanessa:** I think we do need it.

**Ben:** So, you know, we would probably need to keep something in your system and something outside of your system, but it would basically be replicated in case, I don't know, a cyber attack and your whole thing goes down or something.

**Donald:** I would say that if we didn't do any sort of Excel export-import stuff that Greg is keen on, and I totally understand the value of it, the services we use within Microsoft to host this application do their own backups and that sort of stuff. And inevitably if you're saying, 'Stratos, Donald, we want to keep a backup of these Excel spreadsheets,' you are creating yourself another job that may inevitably fail in the future. Because the system is always going to be a source of truth; your backup is always just going to be a snapshot in time. And if there was a failure in the system, I understand, you would certainly go...

**Ben:** To that we would update them in the system.

**Donald:** There would always be the ability to update everything in the system. That was always going to be a part of the design. The specifics would be if you wanted to do a big bulk update or things to that effect. But more, just to be more specific for the transcript and for if Greg wants to listen to us: you would have seen in some of his documents he talked about something called a contract, and then a contract line. He and I had basically this eureka moment the other week, and I think I talked to you guys about it, where he'd always been describing what this was, and for whatever reason I wasn't getting it, until eventually we came to an understanding of what that meant for the design of the system. That's where some of these recent conversations have come out of, which is, how do you actually think about it? How do you think about it in your brain? Because that's what's important. How would you expect to maintain it? And I'd say there will always be functions in the system to allow you to update individual items, and each one can have unique settings and information on it.

**Ben:** I'll be completely guided by Vanessa because she's the one who's doing it and organizing it. So I'm fairly open. As long as there's a safe, secure source of truth that sits somewhere.

**Donald:** Yeah, definitely. I think you should expect to put your trust in the system to do that.

## Help desk, support hours and outage response

**Vanessa:** Can I ask a really important question for the office?

**Donald:** Okay.

**Vanessa:** It's probably further down the track for us. I just realised [unclear]. So, help desk.

**Donald:** Oh yes.

**Vanessa:** When the system does get up and running, when we have a problem within the system, what are the hours?

**Donald:** Yeah, sure, So.

**Vanessa:** Like obviously with our old system, it is a limited time.

**Donald:** Yeah, Off the top of my head.

**Vanessa:** No one asks questions, and I just, yeah, sorry.

**Donald:** That's a good question. Yeah, because ongoing support and maintenance. Totally.

**Ben:** So, what does the support look like? Is that what you're asking?

**Vanessa:** That's what I'm asking.

**Donald:** Yeah, so I guess there's a couple of things. If something isn't working, or somebody's got a password issue, whatever it might be—be it an anaesthetist or yourselves—we would provide a phone number or an email line, kind of both, which is what we do for other customers. You'd reach out and we'd help you.

**Ben:** The ticket, the usual thing.

**Donald:** That sort of thing. If it was, 'Hey Donald, we realise there's something the system doesn't support,' that would be a conversation that comes to me or the development team, and we'd make a plan for how to build a feature or fix something.

**Vanessa:** So there's always someone.

**Ben:** 'Holy shit, I've tried to log on at eight o'clock and the system is not working.'

**Donald:** Yeah, so obviously if there are outages.

**Vanessa:** Yeah, because I start at 8 o'clock before anybody else and...

**Ben:** What time does Solutions [unclear] start?

**Vanessa:** Half past eight, 9 o'clock.

**Donald:** Yeah, so our support team, I believe, right now is currently eight o'clock to five thirty. The developers may work different hours, but we do have an incident response process, and we can talk about that in the future.

**Vanessa:** Yeah, that's [unclear].

**Ben:** Presumably, if you have an outage, you have, like...

**Donald:** A little [unclear], yeah.

**Vanessa:** Okay, great. Cool.

**Donald:** Well, I will stop our recording.

## Reconciliation notes

- Microsoft Word’s “Speaker 4” label was consistently treated as Vanessa. A few obvious cross-talk misattributions were corrected where the turn-taking made the speaker clear.
- “RVG”, “Xero”, “anaesthetist”, “HPI”, and “Forte” have been normalised where the automated transcriptions used phonetically similar words.
- The name of the plastics example (“Miravell Plastics”) is a best-supported phonetic rendering across the sources, not an externally verified spelling. The acronym pronounced near the first contract demonstration could not be reliably resolved.
- Some short interruptions and overlapping utterances were imperfectly segmented by the automatic transcript. The substantive dialogue has been retained, with ambiguity marked rather than invented.
- Questions, tentative implementation suggestions and discovered exceptions remain phrased as they were discussed; they should not be treated as final design sign-off.
