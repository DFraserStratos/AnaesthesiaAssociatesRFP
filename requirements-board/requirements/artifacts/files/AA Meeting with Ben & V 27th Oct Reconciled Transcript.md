# AA Meeting with Ben & Vanessa — 27 October 2026

## Reconciled Transcript

> Reconciled from three automatic transcriptions of **“AA Meeting with Ben & V 27th Oct.mp3”**. The transcript with explicit speaker names was used as the primary source for speaker attribution; the other two were compared to repair wording and recover interjections. Speech has been lightly cleaned for readability, without turning suggestions into agreed requirements. Unrecoverable words are marked `[unclear]`.

**Participants:** Donald, Greg, Ben and Vanessa. Vanessa joins partway through the meeting and leaves before Ben.

---

## 1. Prepayment, anaesthetist reassignment and fixed-price changes

**Donald:** Greg very thankfully went through some of the work. I'm just going to [unclear] here a moment to get our kind of state of things set up. Nice. Okay, so let's filter this by questions for Ben. Cool, so—

**Greg:** You can describe it.

**Donald:** Yeah, thank you. So Ben, you've really talked about the idea that if a patient prepays for a procedure and then it moves to another anaesthetist, generally the accepted process is that the new anaesthetist will just pick up whatever that price was, and not sort of force anybody to pay some sort of difference. Is that right?

**Ben:** Correct.

**Donald:** And you've also talked about the fact that the price for a procedure should be true based on the day that the procedure was done on, right? What happens if—well no, just separately from prepay, if there's a fixed price for a procedure, it's priced on the day that the procedure is actually done, not when it was booked. But what happens if the price changes on a prepaid procedure?

So the idea here is that if a patient pays for a procedure on a Monday, and then it just happens to be that the next day, Tuesday, is when all the anaesthetists and AA resubmit all the new fixed prices they want, and then the procedure itself is on a Wednesday. What would you expect to happen in that scenario?

**Ben:** You would honour the money that's been prepaid, because that's the quote that the patient's been given.

**Donald:** Yeah, great. That makes the most sense to me, but we just wanted to hear it from you. Yeah, great. Okay, so that is good. Let me just write something here. Actually, I won't do that, because we won't worry about that. Okay, cool. Some other questions here. Surely that's not the only one.

---

## 2. Booking sources: surgeons' room PDFs versus hospital integrations

**Donald:** Okay, so we've heard some conflicting reports about where—and this may be a question we have to wait for Vanessa, but keen to hear your thoughts—mixed ideas about where most of the bookings come from in the system.

At one point in time, it was definitely coming from the surgeons' rooms and the PDFs from them. Another point in time, it was coming from the hospital integrations. And so for the very first version of this application, what do you feel is the must-have integration that needs to exist to support how you guys work?

**Ben:** Well, I think that is a Vanessa question, and it might be that we can quickly ask her that. But yeah, I don't want to speak for Vanessa. My thoughts would have been that the PDFs from the surgeons' rooms would be the most reliable, but then I'm not [sure], because my understanding is that the hospital integrations have been quite unreliable.

**Donald:** Yes. Just because it's unreliable now doesn't mean it necessarily would have to be unreliable in the future. I don't know enough to confidently say, but it's not hard for me to imagine that some of the reason it's unreliable is because of Solutions Plus.

**Ben:** Well, I think that's probably a pretty safe bet.

**Donald:** Yeah.

**Ben:** I mean, it would be lovely if the hospital integrations worked. But my understanding is that some of the data is a bit scrambled as it comes through.

**Donald:** Yes.

**Ben:** I was just talking to one of the surgeons about that this morning, actually, and she uses Elixir for her rooms, for her surgical rooms. And I talked a little bit about how we're looking at maybe doing some sort of integration with the hospitals, and maybe possibly even Elixir. And she was certainly saying that would be amazing.

Because some of the things she was talking about are that often, last minute, they might take a patient out, put another patient in, or change the order of the list, or that sort of stuff. So it would be nice if it was all integrated and, if something changed in Elixir, it would seamlessly update all of the other systems.

**Donald:** Yeah, I can understand why that would be valuable. On an infinite timescale, all of this stuff is possible. And so I'll hold this question until we get Vanessa back to figure out exactly what needs to happen.

And maybe there's a version of this where we just have to support both, right? We have to support some sort of PDF ingestion as well as the hospital.

**Ben:** With modern PDF ingestion, I think that should still be fairly reliable in the first version of the software, right? Because already we will be saving on data entry.

**Donald:** Yeah. At this stage, the vision is that there will be essentially an ingestion or a matching screen that will exist. And so when a PDF comes in, it could land in that location as well, the same sort of way that a hospital system would.

I guess there was an earlier idea, in different iterations of these conversations we've been having, where we thought maybe we could get away with just one integration, be it PDF or the hospital. And like I was saying, it's kind of flip-flopped a little bit in terms of where that might land. And so we're just still following that journey.

**Ben:** Yeah, because not all the hospitals are integrated, of course. Like, we don't have integration with the eye hospital, for example.

**Donald:** That's right. Yeah, yeah, yeah. Okay, we'll kind of circle back around to that one.

---

## 3. Modifiers: age, positioning, overcharging and reporting

**Donald:** Now Greg tells me you guys have had lots of really fun conversations about modifiers.

**Ben:** Oh, yeah.

**Donald:** So, in earlier—modifiers are a tricky one. Yes. When we had that nighttime call that I joined in on, generally what I heard from you guys was that we don't want the system to pre-assume any modifiers except age.

And we talked about the situation where some of those position modifiers—there was an acceptance at that moment in time to include some of those. But it sounds like you guys have had some more conversations about basically not assuming any modifiers, even age. And so where are you at with that, in terms of what you want the system to be doing?

**Ben:** I think age modifier, that's an easy coding thing, right? That's an easy one. The position one, the point was that you don't add the modifiers, is that the modifiers are not allowed to be added.

**Donald:** That's right. And so you shared an anecdote that in the past there were some anaesthetists that either mistakenly, or if they were taking the piss a little bit, tried to—

**Ben:** Mainly mistakenly. They just didn't realise that within the code, within the RVG, the reason why there were so many units assigned was because it had already taken into account the positioning.

**Donald:** That's right, that's right. And so I'm not sure if you remember, but in that last call that I was in, we talked about the idea that for those particular RVG codes, the positioning modifiers would appear to be pre-selected but with a value of zero, so that there could be no confusion that they would be included.

But is that still something you guys are interested in, or are you wanting not that at all?

**Ben:** Look, I mean, that might be a nice way to do it. I'm pretty neutral about that. But yeah, I think that is a neat solution to that problem about people adding modifiers that shouldn't be added.

**Donald:** What are some other concerns you might have about modifiers and how we use them or don't use them?

**Ben:** So my major concern about modifiers is that people apply too many modifiers to an account and they start to stack up.

**Donald:** That sounds like it's a bit more of a policy teaching problem than it is an application problem, right?

**Ben:** Yeah. And sometimes what I do is that if it's a prepaid patient or a self-funding patient, I don't apply any modifiers.

**Donald:** That's nice. I guess it does raise an idea.

**Ben:** I guess there's always the option to take them away, right?

**Donald:** Yes. I mean, outside of the things we've just talked about, which is age and some of those position modifiers that are pre-applied with a zero value, everything else just has to be applied by the anaesthetist.

You did just give me an interesting idea. So AA as an organisation, would you guys want to be reviewing or collecting any data on things like how many modifiers anaesthetists use? Or is that kind of a level of oversight that the organisation isn't expected to do?

**Ben:** Look, I think it would be interesting for us to have the opportunity to collect data in terms of the billing practices, because when we come to negotiating contracts, then we come from a more informed position because we know what's actually happening out there.

**Donald:** Yeah. Do you guys have any sort of data like that at the moment?

**Ben:** Yeah, we can actually see how many units people are charging, but it's pretty [unclear].

**Donald:** But not a breakdown of what they are?

**Ben:** No, no.

**Donald:** Okay, well, that's something I should maybe record as an idea for the future, or at least make sure that we have some sort of hooks to enable some sort of reporting. Yeah, okay, that's good.

What else have we got here? There's some stuff here. Okay, honestly, maybe we keep it light like this for now, and we can come back around when Vanessa's back. There's a handful of questions here for her.

---

## 4. Accountant introduction and asking Vanessa to join

**Ben:** Has Vanessa not even got ten minutes?

**Donald:** Well, I don't know. When I spoke to her a bit earlier—you tell me what you've heard, but I think she's—

**Greg:** A bit busy. She asked not to be included.

**Donald:** Yeah, there we go. Maybe, who is the accountant for AA? At some point we would—

**Ben:** His name is Michael Hooker. Greg's got his details. You've got his number, have you, Greg?

**Greg:** Yeah, I think so.

**Donald:** Yeah, maybe it'd be good for one of you guys to connect us at some point. We've got a couple of questions for him, so even just a remote Teams call would be good.

**Ben:** Do you want me to see if he's available now, or—

**Donald:** Oh, no, no, no, not right now. I mean, we've got some questions we could jump on him, but probably better to give him a bit of a heads-up.

**Ben:** Yeah, yeah, okay. Do you want me just to flick you his—

**Donald:** Yeah, maybe if you could just send an email, give me a little e-introduction and say—

**Ben:** Yeah, like an e-introduction. Okay, yeah.

**Donald:** Perfect, that'd be perfect. Okay, well, Greg and I still have a bunch of work to do, and so we'll keep doing that. But while we're all together, is there anything you're particularly concerned about, Ben?

**Ben:** No, no. I'm just wondering whether or not, if it's helpful, whether or not I'd just ask Vanessa to give you five minutes to go—

**Donald:** You're the boss. I'll leave that to you.

**Greg:** She's happy to come. She's happy to join a meeting later in the week, Ben.

**Donald:** Yeah, we can catch up another time. She's not really a roadblock at this stage, so I'm fine leaving her.

**Ben:** Yeah, I'll just ask her for five minutes just to clarify, because that's an interesting question that you had. It would be interesting to see.

**Greg:** Do you want me to go and just ask her? She can just jump in.

**Ben:** Yeah, okay. I've just texted her as well. But yeah, just ask her. How was your weekend?

**Donald:** Yeah, not too bad. My wife is pregnant and that cold I had [unclear]. Twenty-one, I guess.

**Ben:** Twenty-one, yeah. That's exciting.

**Donald:** It is exciting.

**Ben:** Yeah, it starts getting [unclear].

**Donald:** [Unclear].

---

## 5. Vanessa joins: which feed should be the initial priority?

**Ben:** Hi, Vanessa.

**Vanessa:** Hi, how are you?

**Ben:** Good, good, good. Thanks for giving us—

**Vanessa:** It's okay.

**Ben:** —a few minutes. I just thought I'd [unclear]. Yeah, yeah. Okay, cool. Because Donald just had a question with regards to the lists that come through from the surgeons' rooms versus the hospital integrations.

**Donald:** Ben will say it was a very insightful question. I'm kidding. Yeah, so the question is, at different points in this project, there's ideas that maybe we would only integrate with one thing, be it the hospital or maybe some PDF ingestion from the surgeons' rooms. And it's flipped around a little bit as to which was the most important.

**Greg:** One thing to begin with.

**Donald:** Well, yeah, to begin with. We know that it'd be nice to have everything, and even more integrations with different partners as well. But on day one, if you could only have one, what would you say is the most valuable thing to you guys?

With the assumption that whether it's a PDF or an integration with the hospitals—the ones you currently use, the two—assuming that both of those still land in a kind of matching screen for you guys, which would be the most valuable?

**Vanessa:** Probably from the hospital.

**Donald:** Hospital, okay. And so Greg said he learned a little bit of a nugget, which is that the hospital actually only sends an update the day before.

**Vanessa:** Yeah, it does.

**Donald:** So does that mean if we only integrated with the hospital, as you do now, you would manually still do all the PDFs you receive, and the hospitals would just send the updates the day before?

**Vanessa:** Yeah, that's the only downfall.

**Donald:** Yeah.

**Vanessa:** It's the day before, whereas the rooms, we get lists—we can get them a month in advance.

**Donald:** Yeah, yeah, yeah.

**Vanessa:** But the hospitals have the contracts, dates of birth, all of that kind of stuff more.

**Donald:** Because the stuff the surgeons' rooms send you might have gaps, you're saying?

**Vanessa:** Yeah.

**Donald:** Okay. Well, how about this? Maybe that sounds pretty painful for you guys to still be doing this stuff manually. I don't have a good—

**Ben:** Can I just, sorry, interrupt? Sorry. So Vanessa, the hospital integrations, we've only got two hospitals, haven't we?

**Vanessa:** Yeah.

**Ben:** Yeah, we've only got Forte and [unclear], so the other ones would be coming as a PDF anyway, wouldn't they?

**Greg:** Yeah, but also, Vanessa, you were talking the other day about even when you've got an integration with the hospital, they also send you another form to supplement what's not on the integration data. Is that right?

**Vanessa:** Yeah.

**Greg:** So what's that data? What do they send you?

**Vanessa:** Well, if there's an update, then they're always sending us an updated schedule. So Tracy sends it two weeks, or for St George's it's a month in advance. So we know that we always have our anaesthetists in the right slots, all that kind of stuff. So we are getting a lot of detail prior.

**Donald:** Okay.

**Greg:** And how does that arrive? This is from the hospital?

**Vanessa:** Yeah.

**Greg:** How does that arrive? Is it electronic or some other way?

**Vanessa:** No, it's in an email form.

**Greg:** It's an email.

**Vanessa:** So it's going out from us on a report, but it's coming back in an email form from them.

**Greg:** Right, and is there a PDF on that email or is it just the body text?

**Vanessa:** From us?

**Donald:** The stuff coming back.

**Vanessa:** It's just them writing back as an email.

**Donald:** And is it in a structured way, or is it really free text?

**Vanessa:** Free text.

**Donald:** Okay. Well, like I was saying, I think it would be quite painful for you guys to continue to manually import a bunch of this stuff. And so we should try and look at maybe supporting both.

But I did sign an NDA to get access to those PDFs. So when you feel like you're caught up on things, I'd love it if you could send those to me so I can kind of get a shape of what they might look like for us.

**Vanessa:** All right.

**Donald:** Yeah.

**Vanessa:** If it's easier to use surgeons' room sheets, then go that way, because we do get them probably a lot more in advance.

**Greg:** And updated.

**Vanessa:** And updated.

**Donald:** Yeah, I mean, I lean on you to just—

---

## 6. Anaesthetists' lists as the current source of truth

**Ben:** I'm just thinking about the workflow from an anaesthetist's point of view, Vanessa. One sort of vision that I have, to save you guys a bit of work, is that you know how at the moment we are getting the lists and you are emailing the lists through?

**Vanessa:** Constantly, yep. Constantly.

**Ben:** Constantly.

**Vanessa:** Especially the eyes.

**Ben:** So, I don't think that you need to do that. Basically, if we have the software, everything we need appears in that. So in our own time, we can go, “What am I doing next Tuesday?” You open up the app or the web app and you go, “Oh, there's my list with all of the things. There's all the patient details, their email addresses and stuff.”

So that becomes the source of truth rather than the emailed lists, because that kind of gets confusing as well. If I have a Chris Thompson list, there's multiple versions of it that I have to trawl through my emails, and I'm not too sure which is the most up-to-date one.

So I almost think that, if we get to a situation where we say, “You know what, everyone? We're not emailing you lists anymore. If you want to know what's on your list, you just open up your software.”

**Donald:** I didn't realise you guys were emailing lists. Why aren't you using the current app for that?

**Vanessa:** Because it's not foolproof.

**Ben:** Yeah, well, the current app is sort of—it’s not very user-friendly.

**Donald:** That's true. I can certainly see that. But is it complete? Even if it's a pain in the butt to use, is the data complete?

**Ben:** Well, it's mostly complete. But often Vanessa's waiting for last-minute things from the hospitals, for example.

**Donald:** Yeah, okay.

**Ben:** But you'll have the operation and the name and the things that we need. If we want to contact the patient, we need an email address, a phone number, the operation and the NHI, that sort of stuff.

**Donald:** Okay.

**Ben:** You know, the basic patient demographics. For me, it's easier to copy and paste an email address if I'm emailing a patient from the PDF than it is from the app, because my app is only on my phone, not on my computer. The patient view I don't get on the computer.

**Donald:** Why don't you—I understand there is a web app for yourself. Why don't you use it?

**Ben:** So the web app doesn't give me the patients. It just gives me the other stuff. It gives me my schedule and the banking and that sort of stuff. It doesn't actually have—

**Donald:** Your list.

**Ben:** —my schedule with the patients. It doesn't have my list in it.

---

## 7. Timing, visibility and the practical ingestion sequence

**Donald:** Very interesting. Okay. So I'll recap what you said. You said your preference, if you only have one, is hospital information. But obviously, in an ideal world, you'd have both.

**Vanessa:** Yeah, but if it's easier, then we'll go with surgeons' rooms.

**Donald:** Oh, sure. Sorry, yeah, okay.

**Vanessa:** I'm happy with anything.

**Donald:** Yeah, of course.

**Vanessa:** It's going to be a better system.

**Donald:** Yeah.

**Ben:** As long as it's easier.

**Vanessa:** Yeah.

**Ben:** Yeah. And the thing is, if we're getting the patient—if we're getting the list from the surgeons, it would get uploaded into the system earlier and then the anaesthetist has better visibility earlier.

**Vanessa:** Yeah.

**Donald:** How often are you looking in advance, Ben?

**Ben:** Well, quite. I kind of look as they come in, so it's about a week out. Yeah, because sometimes you need to look up the patients and get their background medical information. If it's a really complicated operation, you might even be thinking about seeing the patient face to face before they come into hospital.

Or also sometimes, if I'm doing a cosmetic list, I'm thinking, “Oh, this is one that I want to get them to prepay,” because they're having a breast augmentation and they're self-funding.

**Vanessa:** So that's where maybe using the surgeons' room sheets is better, because you've got different people entering different anaesthetists' lists, and maybe the person entering your list is way ahead of the person that's entering, say, Jeremy Hickling's. Do you get what I mean? And if we use the surgeons' sheets, then they're just going to automatically go in there.

**Donald:** I guess if we had a system where we were importing the PDFs—and there's a lot of styles, I believe, to need to support, but let's assume we solve all that—at that point anything that's coming in early is all going to be created and matched automatically and things.

But it will mean that every single day somebody, or multiple somebodies, will have the job of sitting down and manually doing the hospital part until we automate that. And at least that part is predictable, and you're just confirming details or updating details that should already exist within the system.

Yeah. Okay, something to think about. I think that's all I needed you for for now.

---

## 8. Closing

**Vanessa:** Great.

**Donald:** Thank you, Vanessa.

**Ben:** Thanks, Vanessa.

**Vanessa:** Hope you feel better. See ya.

**Ben:** Thanks, Vanessa.

**Greg:** Thanks, Vanessa.

**Donald:** Okay, well, I'll let you go too as well, Ben.

**Ben:** Thank you. Okay.

**Donald:** Great. Have a good one.

**Ben:** Thanks for the call.

**Donald:** Bye.

**Ben:** Bye.

**Donald:** Cool. Not too bad. There were fewer questions for them than I remembered, which is good. There's a couple more detailed ones for Vanessa, but we didn't desperately need it.

**Greg:** I went through the questions before you arrived and I thought—

*[The supplied recordings/transcriptions end mid-sentence.]*

---

## Reconciliation notes

- **Speaker attribution:** The named-speaker transcript is the primary attribution source. A handful of replies embedded in longer speaker blocks—such as Ben's “Correct” and Vanessa's “Free text”—were separated out where supported by the other transcriptions.
- **Elixir:** One source repeatedly misheard the name as “Alexa”; the other readings support **Elixir**, which is used consistently here.
- **Michael Hooker:** The named-speaker transcript obscured the surname, but both other transcriptions agree on “Hooker.”
- **Hospital integration count:** Ben states there are currently two integrated hospitals and names Forte, but the second name is not recoverable from the supplied audio transcriptions. It has not been guessed.
- **Tracy:** All three sources sound like “Tracy” in the discussion of two-week advance schedules. It is retained as spoken, without assuming whether this is a person's name or a misheard organisation.
- **Short personal aside:** A brief exchange just before Vanessa joined is indistinct in all sources. Unclear wording is marked rather than reconstructing it from context.
- **Status of ideas:** The prepayment quote is treated as an answer to a business-rule question. The zero-value positioning modifier display, the PDF-versus-hospital first-integration choice, eliminating emailed lists, and billing-practice reporting remain proposals, preferences or possibilities in this conversation—not finalised implementation decisions.
