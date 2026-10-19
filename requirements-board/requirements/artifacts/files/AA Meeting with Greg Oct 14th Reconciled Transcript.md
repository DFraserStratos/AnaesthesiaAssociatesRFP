# AA Meeting with Greg — 14 October 2026 — Reconciled Transcript

> Reconciled from three automatic transcriptions of the same recording. The speaker-labelled transcript is the primary source for turn boundaries; the two additional readings were used to restore terminology and unclear passages. This is a lightly cleaned, **not verbatim**, transcript. Unrecoverable wording and ambiguous speaker attribution are marked explicitly. Discussion, questions, proposals and agreements are preserved as spoken, rather than rewritten as a requirements document.


## Modifiers and prioritising the real problem

**Donald:** There was some stuff he didn't agree, but he didn't go into it. And I said, oh, it's fine. I don't really know. But I'm sure, you know, you guys will chat about that. But I thought it'd be good for us to read through it all together.

**Greg:** It's probably about the modifiers. I didn't expunge them.

**Donald:** Oh, okay.

**Greg:** He's touchy about that.

**Donald:** What particularly is he touchy about?

**Greg:** He just doesn't think they should be in at all.

**Donald:** Well, because he had previously said like modifiers don't exist, but.

**Greg:** He thinks from our perspective modifiers don't exist. He thinks there's no point in spending money on it as a feature because the anaesthetist is so much across and in charge of what the modifiers are going to be that anything we do to default or prompt a modifier is just a waste of time.

**Donald:** Okay.

**Greg:** That's more, that's pretty much where he's coming from.

**Donald:** Yeah, I mean the other day.

**Greg:** And the other thing that comes up with that is that you're not focusing on the right thing. This isn't the problem we're trying to solve.

**Donald:** Sure. Yeah. I mean, that's that was a little bit of a trend. I think some of that comes a little bit from them. Like there's always conversations about we've had about procedures, this procedure list not needing to be valuable. And I gave a sense that maybe been thinks more time has been spent talking about it than I feel it has. But anyway, it's okay. It's all okay. I'm just trying to find your other document you shared the other day with that meeting like on last Tuesday night. I did. This one probably. No. Actually, I guess it's in... No, I need to find the name. One moment, sir.

**Greg:** I don't think I've seen anything to David since the proposal went out, have I?

**Donald:** David.

**Greg:** Yeah.

**Donald:** No, but I think he said he's going to pop his head in today.

**Greg:** Good.


## Reviewing Greg’s pricing-model documents

**Donald:** Okay, so documents, documents, documents. Contract Pricing Model V4, [unclear title: 'Each ... a price and who pays']. There we go. So this is the one I actually looked at while we were reading the other day, and I just wrote some notes down here, specifically around modifiers. So the only ones I thought there was any agreement about in terms of modifiers were age, since we just literally have that from a patient, and there was some talk about some of the positioning stuff that I thought we'd also sort of agreed on.

**Greg:** I wouldn't like to get into a discussion and finalize that.

**Donald:** You would or wouldn't.

**Greg:** I wouldn't because I think, I mean, I tend to think, look, we can add little value here in terms of modifiers and all of it has a cost and there's not really a cost benefit for this particular feature. Like there's a cost benefit for every feature and I just. Don't think it's worth pursuing, but it would need Ben to confirm that with you.

**Donald:** Yeah, that's fair. Okay, well, let's just read the document as it is then.

**Greg:** Yeah, look, this document is meant to supersede that, and it's meant to try to [unclear].

**Donald:** For sure, for sure. I just brought that one up because I literally wrote the notes and the questions at the end here. Okay, so this one here. So the pricing model describes two things for every procedure. AA bills, how much it costs and who receives the invoice. Every procedure is priced from the published RVG unless a contract with a hospital insurer or surgeon or anaesthetist sets different terms. The summary covers the business rules and the processes for director's anaesthetists and the office. The data model and calculation details are in the other document. So a fee is the procedure's units multiplied by a rate.

**Greg:** By the way, I should mention I use Claude a lot to cross-validate the document a lot. And Claude just could not get past first party and third party. So I dropped it. I just took him out with it. It's just too hard. He had a point, or he had a point, she had a point. that they're not truly third and first party circumstances in all cases. So why are we using that term? It's like, okay, fair enough. I won't use them. Don't need to use them. That's why they're gone.

**Donald:** Sure, [unclear].

**Greg:** That is gone.

**Donald:** That hadn't crossed my mind at all. One thing I had crossed my mind in terms of assuming, you know, your AI support in this is when it came to some of these questions, I know that when I am obviously, when I produced the version for, you know, question document, my cloud code instance has access to all of the written requirements as I sit in the repo. And so it's using that context to inform gaps and questions that things exist. And I was curious as to how your one came up with those gaps and questions because you obviously have fed a lot of information into it, but I don't know exactly your configuration and obviously it doesn't have access to the things I have access to. So it was interesting to me.

**Greg:** It came out, I started with something that you had sent me that had those questions on the bottom of it. might have been the who pays document.

**Donald:** That would make the most sense I think.

**Greg:** They did come across from that and actually I know some of that area is wrong, undecided, whatever and I just thought it doesn't matter.

**Donald:** Okay.

**Greg:** We'll sort it out later.

**Donald:** Okay. Nice. So BTM multiplied by rate brackets 1 minus discount percentage.

**Greg:** I'm not sure that's right, is it?

**Donald:** Well, I don't know. I just, it's like, it's communicating a general idea, but I'm not, I'm not exactly sure whether or not the formula is exactly right.

**Greg:** But if you use, if you go to the Excel model, all discounts are stored as decimal fractions.

**Donald:** Yeah.

**Greg:** So it's point, it would be 20% would be.2.

**Donald:** Yeah.

**Greg:** That would be 0.1 times 0.8.

**Donald:** Yeah.

**Greg:** So that's where it's coming.

**Donald:** Cool, OK.

**Greg:** And is that right one minus the discount?

**Donald:** That's where I don't know, but I understand maybe the spirit of what it's trying to communicate.

**Greg:** Yeah, it is, because it's one minus 0.2, so it's rate times 0.8. Yeah, it's right, if you assume that discount is a decimal fraction — which it doesn't specify.

**Donald:** Yeah, cool. So I think it's right. So inputs here: base units, RVG, time units, anaesthetist modifiers, claimed by anaesthetist, with a note explaining they're zero by default. And so...

**Greg:** It's just a glossary, I think.

**Donald:** Yeah, the anaesthetist's own rate. And so this is a short version of explaining what these are, but I think later on, or maybe in your other document, there's a more expansive list of all the particulars.

**Greg:** Yeah, again, that came from you. It's a good starting point.

**Donald:** A fixed rate, fixed price, rate or discount set by contract or entered by the anaesthetist overrides the default RVG calculation. Contracts only state what differs from the RVG-style calculation. Yeah, so this is kind of a theme a little bit in this document. I'm not saying it's wrong, but it always comes with this assumption that there's always an RVG calculation that could exist, but it's overwritten by this concept of a fixed cost or some other sort of thing on top of it.

**Greg:** Overwritten, yes.

**Donald:** Whereas I just...

**Greg:** I think this wording comes out of the idea that we wanted to express that it's a sparse thing that lays itself over the top of the contract.

**Donald:** Yeah, and this is where I don't really know the right.

**Greg:** Does it matter?

**Donald:** Yeah, okay, cool.

**Greg:** I've got to the point which is like, I think I've settled in my own mind what we're trying to say. I'm quite happy to kick this over to you and the developers and just go, well, you know, here's the outline of what we think we need.

**Donald:** Okay.

**Greg:** Take it away.

**Donald:** Okay, sweet.

**Greg:** See if you can, you know, make it work.


## Contract-based billing and identifying the billable party

**Donald:** Yeah, cool. Okay: 'Who pays?' A contract is a structured way of thinking about how we solve this question. Under the covers, everything is represented by a contract; even 'no contract' is a contract. The selected contract decides who receives the invoice, with 'no contract' as the patient pays.

**Greg:** Yeah, the executive audience, right.

**Donald:** Oh yeah, perfect, perfect. So that's what that is, selected contract. A contractor who, yeah, so I think early on, I think you and I both were pretty excited about the idea that once a contract exists within the system, unless it was something like the standard no contract, there would be a pre-assumed billable party on attached to it. And if you want to do have, I think the way I pictured in my head is that if you had two contracts that had the same amount of payments or style of payments but had two different endpoints, you won't make a different contract for each of them because one is for...

**Greg:** What do you mean by an endpoint?

**Donald:** As in like who's the e-mail address and the billable party?

**Greg:** Yeah, that's right.

**Donald:** That was sort of something I thought we had kind of...

**Greg:** I think that's right. I can't think of an exception to that. That should work. That's what it's there for.

**Donald:** Yes.

**Greg:** To identify the billable party.

**Donald:** Great, great. Okay, so a contract whose holder pays — an insurer or the hospital — [unclear]. And so there's probably a [wording issue].

**Greg:** It should probably say 'its holder pays'. 'Just pays' is a bit sloppy English. 'Whose holder pays' is a bit sloppy, but basically it's saying the holder pays.

**Donald:** Okay. When we, if I could jump back to...

**Greg:** Technically that doesn't have to be the case, but that's the general, that stuff.

**Donald:** Yeah.

**Greg:** That's the case we're working with.

**Donald:** I know based on conversations we've been having that what I'm about to flash up on the screen isn't quite accurate anymore, or fairly inaccurate, but what am I thinking about? Oh yeah, so when we talked about this, I think the other week with Vanessa and Ben, they understandably poked holes and they're like oh there wouldn't be insurer ones there wouldn't be hospital ones or surgeons ones and I think there is a part of this where you still have quite a good idea about these different entities who have contracts and specifically how they interface with Southern Cross being the hospital but they interface with the insurance on behalf of the patient and how that sort of makeup all happens it's still a little blurry in my brain and so If I have gaps in my understanding when we talk about this, maybe just consider that.

**Greg:** Yeah, sure.


## Insurance indicators, preapproval and incorrect billing

**Donald:** A selected contract, a contract where the patient pays, a surgeon's fixed fee, an anaesthetist's price, the patient or the named payer. Yeah, we're aligned on that. 'No contract' itself is a standing contract held by AA, so every procedure follows the same pricing and billing path. Insured patients who claim the money back themselves are billed. If a booking indicates insurance but the patient-billed contract is chosen — okay — the office sees a warning at review. It's not a block, because preapproval can fall through on the day. And so I've still not seen what these surgeons' PDFs look like. But have you seen them? Do they mention insurance information? How is that described?

**Greg:** Yeah, sorry. I thought you'd get a dump from...

**Donald:** Not yet. I signed an NDA, or David signed an NDA, but he hasn't seen anything over yet.

**Greg:** Okay, so I actually think this could be very difficult to enforce because I think there's a real gap here in the information chain. They get the booking from the hospital, but Vanessa has said, based on what Vanessa has said, and she would know more about this than the anaesthetists actually, the way in which the billable party is actually tied down is a bit flaky because there's not a feel for it in the integration. It comes through on the theatre lists that come from the hospital later. And a patient will go to a surgeon, da, da, da, da, have you got something across? Yeah, you got something across, oh, good. So you put something across in the booking, right?

**Donald:** Yes.

**Greg:** But that doesn't mean it's been approved.

**Donald:** Yes.

**Greg:** And that's the difference, right? Because the question is, do you have an insurer? The question we're interested in is, has the insurer accepted the charges, right? I don't think the system really supports that very well, actually. So this will continue to be a bit of loose thread in the whole process, I think.

**Donald:** Yeah, okay. And sometimes like a surgeon's room or the secretary or whatever, don't sometimes they basically do a bit of a service on behalf of the customer to engage an insurer and try and get that pre-approval? Or is it always the customer or the patient?

**Greg:** My anecdotal experience of that is that the surgeon's rooms — it's the hospital. I think the hospital actually makes the application.

**Donald:** On behalf of the patient.

**Greg:** On behalf of the patient.

**Donald:** Okay.

**Greg:** Because they are the agent for the insurance company.

**Donald:** So I guess.

**Greg:** And when we say agent here, we mean that the insurance company pays the hospital, right? They're in the process of certifying cover before they extend the risk to the patient.

**Donald:** So.

**Greg:** And the anaesthetist and the surgeon are all downstream of that, because they all want to benefit from that, but actually the hospital does the work.

**Donald:** Yeah, yeah, yeah. Okay, so early on when we came back to this idea of having this original procedure list and the contract below it, I had this potentially naive idea that when information comes in from these outside systems, that there would be at least some sort of predictable structure that would allow you to systematize it. And what has since been revealed is that sometimes the notes that, the descriptions that surgeons rooms put onto these things is essentially a scribble of codes that communicate something, but it could have infinite variations and that sort of thing, right? You have to...

**Greg:** There is the generic code, which is SXAP, which means Southern Cross [unclear: 'Auxiliary Provider' or similar], which is what the hospital is. And they put that on. What that means to anyone who's reading it is, 'Oh, the hospital's going to arrange Southern Cross insurance for this patient.' That's where the route, where the money comes from. That says they're not paying for themselves, they're not ACC, because there's another thing they use for ACC, and so on. But it doesn't actually tell you the status of the request. I think this is going to continue to be a problem. And it's something you might want to talk through in more detail with Vanessa about what actually happens here, because it's definitely a gap in the information chain.

**Donald:** Yeah, that'd be good to see.

**Greg:** And it often arrives quite a bit later than the original bookings. So you could sort of say that it always comes through after the initial booking. So it's booked on the assumption that it's insurance initially. And after that, I don't know.

**Donald:** Yeah, and that's, you know, you described pretty well in your document that there's still this review step from the admin team, and that would be sort of a last stop where they would figure out if it had been If that's still right.

**Greg:** In the case of insurance, it doesn't usually get past admission. So the hospital will stop it, because they're not going to get paid. So the patient...

**Donald:** If they're not confident, the patient will pay for it.

**Greg:** Yeah, so the patient has to make alternate arrangements before the hospital will proceed.

**Donald:** Okay, What else?

**Greg:** So you can see it's all happening outside the fence, right?

**Donald:** Yes, So what I was getting at with the procedures thing, like this naive idea that you could look at a surgeon's PDF and basically extract the data and link them to things and concepts our system will identify. That is in some ways out the window and we're just going to take, you know, the raw text snippet of what the surgeon's room says a procedure is and force define, you know, force the office team or their anaesthetists to pick the RVG code. And so in that same idea, when these bookings come in for a patient, is some of that insurance information, does it exist in a standardized sort of way? Or is it always quite missing?

**Greg:** It usually does.

**Donald:** Usually is, yeah, okay.

**Greg:** And what that means is that if SXAP comes along, right, then you know that the hospital's billable party.

**Donald:** Yes.

**Greg:** Right? So you can set up the contract that way.

**Donald:** Okay.

**Greg:** You don't really have to worry about it 'cause we can't do anything about it after that because we don't have any information to operate against. But Vanessa does because she'll ring the hospital, is that what's going on with this guy, this guy? Or Ben will get, you know, Nick, any of them, will get to the hospital and the hospital goes, surgeon's not sure. Basically not sure. It hasn't been approved. So the patient says, don't worry about it. I'll pay for it myself.

**Donald:** And then they figure out if they trust him or not.

**Greg:** I don't know whether Ben said this to you or to me. But he said, often I get in that situation, I'll say to the patient, look, if you want to go ahead with it, I'll give you 25% off. Because it just fills this lot. Otherwise it's a dead slot.

**Donald:** Totally.

**Greg:** And it's paid and it's like whatever.

**Donald:** A hundred percent of zero money earned.

**Greg:** So at that point, then he's got the booking on his thing. He's about to go into theatre, start of the day. He just changes the contract from SXAP to patient billing.

**Donald:** No contract, yeah, exactly.

**Greg:** No contract, and you're done. And it's only, so it's not a serious problem. I mean, it's wrong, it's clearly wrong, but we're picking out one situation here where things get wrong, right? The thing that happens more often than not is that something like that slips through and then the wrong party gets billed. I think that's going to be slightly more difficult to close that gate because of the lack of information. And this is where you're probably going to need Both of us are going to need some time with Vanessa just on this one question. Yes, Going through all the use cases.

**Donald:** Yes.

**Greg:** It's like, well, what will happen? What will happen? If it's a problem, why is it happening now? I have to say I don't really understand why it's happening.

**Donald:** In a situation where...

**Greg:** We haven't changed much.

**Donald:** In a situation where the anaesthetist changes it in the room from a fix to a no contract. I would think it would be helpful for the anaesthetist to not have to necessarily fill in the name and e-mail address on the patient. And that could be something the admin team would do.

**Greg:** Already on the booking.

**Donald:** Oh, the booking will already have it. Okay. Yeah, of course.

**Greg:** They just need to change the contract.

**Donald:** Yeah, great. Okay, cool. Contracts are configurable arrangements.

**Greg:** Of course, we're talking about one of the ones that doesn't slip through, right?

**Donald:** Yeah.

**Greg:** I don't think I understand enough about the ones that do slip through.


## What contracts attach to, and the disappearance of the procedure master list

**Donald:** 'Contracts are configurable arrangements. Five arrangements cover most work. A contract is configured and can then be associated with any procedure.' Again, I guess the more technical thing our system needs to know about now is we're not linking contracts to procedures anymore. We're linking them directly to RVG codes.

**Greg:** Oh, that's small P. Oh, sure.

**Donald:** Okay.

**Greg:** And I've been deliberate about that, so that's lower-case 'p'. This is just an executive extraction of the table in section [unclear: four or five].

**Donald:** I think [unclear name, sounds like 'Greg' or 'Greek'] had a rough look at what you did, not a full look. And he seemed to think it was a good place to start. Just while I'm on this can of worms, if we go to the RVG guide...

**Greg:** Yes, now this is-- It will get large. Well, okay, so did you get from the document that it does have a provision for the Inesitus to put in his standard fixed prices?

**Donald:** The one we're reading right now.

**Greg:** Yes.

**Donald:** Yes, I think like--.

**Greg:** And it does have a provision, it mentions it but doesn't provide any examples. that if you were inclined, you could set up a list in the default contract of what Ben was calling favorite procedures, a similar sort of, because there was a long debate about that AI stuff that you'd done and how difficult it was going to be to provide a reasonable percentage of coverage of what actually goes on. And at the other hand, What was provided, what provided was the catalyst to get the thinking going in practice for these guys to go, what does this actually mean? And that talked about, well, we could shrink that list down, but what are we proving? And so that came around full circle, well, we're spending a lot of time and effort doing something that we don't really think is necessary, which is sort of what Nick was saying yesterday. So they've dismissed it as not being there. But I still think at some point in the future, what we're actually trying to map is RVG codes to. booking procedures that are given as by surgeons. And I'm sure there will be a pattern there, a really strong pattern there. And once you've got some history, you could run some smarts across that and almost pre-allocate them based on that.

**Donald:** Yeah. I mean, I heard pretty clearly from Nick and Ben that every anaesthetist will want to figure out which RVG code they want to apply and that sort of stuff. And unfortunately, you know, haven't had a lot of time in the room with them to just hash out the consequences and implications of the different approaches. But if we just assume we go with what they're interested in right now, it just means that when we look, when anybody, admin staff, when they look at a procedure and they might want to try and match it up, Maybe they don't. Maybe there's no matching to be done at all. The booking comes in. But if they did want to, when you're looking at all the different appropriate contracts that would exist, it could be quite large now because if we go-- I'm going to take this out of artifacts as well. If we go back to this image here that illustrates an idea, it's not perfect. But you would have one RVG contract for each code. But even then, you'd actually have to have two for, let's say, T2, because there's a T2 minor and a T2 simple. Both have different things. So in that case, there'd probably be two. I don't need to be able to. Are you following me here?

**Greg:** Yeah, I'm following you.

**Donald:** Yeah, and then for every single potential procedure coming in from Southern Cross, any fixed cost ones, right, all these fixed cost different procedures, There would be a lot of them under a single code, which means there'll be more to sift through. Previously, you were sifting from a list of procedures into a smaller list of contracts. Now you have a small list of codes and a large list of contracts.


## Hospital contracts, reference codes and invoice formats

**Greg:** So let me just provide some more information about where you're up to with this. Even when they have contracts, a lot of the contracts are RVG contracts and it appears that all that is being all that has been required out of those contract arrangements is that that undefined billable party the contract reference like SXAP gets put onto the invoice.

**Donald:** Yeah, so it's still RVG-style.

**Greg:** He said, 'All that does is still RVG.' All that does is, when Southern Cross gets the invoice, they know which contract to put it under in their accounting system. Otherwise it's an RVG contract, right?

**Donald:** Yeah, that makes sense.

**Greg:** Any contract that's fixed price — you're going through the contracts which are at a highish level, like what you've seen for [unclear: 'Christchurch ...']. I've seen the list for Southern Cross, and we haven't put it on the table because we think it's noise, but it's about two and a half thousand lines long. Those are all the procedures they use internally. It's their internal process; it's not what's being imposed on us. They use those internally to do their cost accounting: how much does this sort of operation cost? They've got theatre time, nurse time, disposable equipment, reusable equipment — a big bill of materials — and they use that to negotiate with Southern Cross what the price for that would be.

**Donald:** And so if we imagine Southern Cross have their own computer system and they have a big master list of all the different, let's call it procedures, when- There's still procedure types. Yeah, yeah, yeah. When Southern Cross sends some booking information to AA, presumably on that PDF or whatever communication looks like there, the integration, there will be something in there that describes what the entity is in that Southern Cross system.

**Greg:** I don't believe so, but we'll need to ask Vanessa. I don't think so, but I'm not sure. It would be very helpful if it did.

**Donald:** Yeah. And I guess we could make our contract system be flexible enough where you don't have to define the base units. You just have to say it's an RVG contract for Southern Cross. And this is who you send the invoice to, and then anybody else down the chain can pick the RVG code, record their time as they would, and the right person still gets billed. Exactly, yeah, and so it's kind of, we just actually, I think that kind of unlocks it a bit in my head, is that. It's still going to be an RVG style thing, but we're actually no longer really pre-filling in any RVG codes.

**Greg:** No. However, I suspect the hospital would get a lot of utility out of us if we had that reference code, put it into the booking and printed it on the invoice. I suspect the hospital would think that was great.

**Donald:** Well, I think since, so over the past week, I have been updating the plans and the requirements based on different transcripts and things we've had. And I think I've communicated to say that we will take the raw text from whatever the procedure is called from other systems and just display that as is. So we don't need to try and interpret what the upper left CTQ down, blah, blah, blah, blah, blah, blah. The ASIS can and everybody else can just see exactly what that is, but you're describing what the patient needs to see. Would they also want to see, would they be described the exact code or does there need to be a something else?

**Greg:** I know there are two styles of invoice.

**Donald:** Yes, not seeing them, but I've heard.

**Greg:** Sorry.

**Donald:** I've still not seen those, but I've heard them.

**Greg:** They're very similar. Things like the BTM breakdown are on a hospital invoice, and they're not on the patient invoice. They both contain the booking description unfiltered.

**Donald:** Okay.

**Greg:** Right. And there are a couple more data fields go into the hospital invoices. So they can cross-match.

**Donald:** Yeah, okay.

**Greg:** Ben said, look, what they do is they look up the NHI and they find the details from the patient there and they put it in there.


## One default contract and manual RVG selection

**Donald:** I think given what I've just sort of described and unlocked in my head, there wouldn't actually be a no contract RVG per RVG code of per procedure. It's just one in the entire system.

**Greg:** That's right. That's dead right.

**Donald:** Yes.

**Greg:** And Ben is quite happy. He said, look, he used some example procedures. Vanessa wouldn't have a clue. And she's been in a hospital game for 20 years. She wouldn't have a clue what RVG code that belonged to. And we don't expect her to. Just leave it unfilled, pass it through, we'll do it. He said it takes us two seconds.

**Donald:** Cool. Okay, I think that'll be good and a good important change in this.

**Greg:** So the idea of putting an RVG code onto a booking is: if you can find it, fine; if you don't know, don't worry.

**Donald:** And so when we go back to the technical document that you made, which I haven't looked at, but it has some sort of... database diagram that looks something like this. I know it's simpler actually. This has some concepts in here in terms of recording base units and modifiers, but I think actually that needs to be stripped out now, right?

**Greg:** I left them there because they might be needed in the future and I thought it's not a bad way to populate. I mean an RVG group does have a default mod base unit and actually it is that table that the surgeon will look up on his. And I've noticed Ben said, look, it's like this. And he pulled out a time sheet. There's a place in the time sheet which says an image off in the original document, the original request for a proposal.

**Donald:** Oh, yeah.

**Greg:** And it's got the RVG list in it. But I noticed that the way he uses that is he doesn't scroll it. It's got type ahead on it. So, he said, If I want H1, I just press H, and there they all are.

**Donald:** Is this part here?

**Greg:** Yeah, So, that scrollable list has actually got the RVG code. Yeah, and he just types H, and it just gets all the H's.

**Donald:** Oh, yeah, that's fine.

**Greg:** Yeah, he just types H1, and that's all he needs. He doesn't need any more than that. If he says, 'It's something to do with the head area, H,' he said it's super efficient.

**Donald:** I mean, I assume that what we would do is it would have three parts. You'd have the code, T, H, whatever it may be. You'd have whatever the short description is, and sometimes not so short. And then you'd have to have the value because there'd be two T2s represented.

**Greg:** That's what that table's there for.

**Donald:** Yeah. And so...

**Greg:** And I left the modifiers at zero because it's just a good place to populate a value as a default.

**Donald:** I think the modifiers are still a worthy conversation we're having with Ben.

**Greg:** You're brave. You are. I'm warning you now.

**Donald:** I'm not trying to tell you I'm right about it, but just given, like, I quite liked your elegant solution before in terms of, you know, this top-level entity, you know, had the base units and it had some modifiers. And then one below it, if it was zero, would just look ahead behind it and say, what was my parent, what did my parent have? And that made a lot of sense to me. And what we're describing now, that's not needed because it's just not.

**Greg:** Well, I think we can still build that by putting the, by just defaulting modifiers to zero on the base table. That functionality is inherently part of the design to look through. But we don't have to rub their noses on it, right? It's just there quietly. And if they ever decide they want a prompt for modifiers, it's easy to backfill. You don't change database.


## Whether to automate or constrain modifiers

**Donald:** Yeah, I mean, in the call last week, in the evening, we talked about the prone positioning and the included modifiers.

**Greg:** Yeah.

**Donald:** And so, I mean, maybe their thoughts have changed since last Tuesday night, but I would imagine that there would be a scant few scenarios where a modifier is pre-selected. And if I can tell, it's exactly two things. It's age and this, I think.

**Greg:** Actually, I think you're misreading that, but I think what they were trying to tell you when you had that discussion is that those two are already in.

**Donald:** No, no, no, I agree. I'm there with that. So we talked about the idea that they had said there were times in the past when Anisis tried to double dip and they would put a plus two somewhere else in the modifiers. And so we had talked in that meeting last Tuesday about you would see in the app the plus two modifiers would already be selected and it would say zero, and you couldn't then select it to add more.

**Greg:** That's a problem, I think.

**Donald:** Okay.

**Greg:** I think the lockdown was a problem.

**Donald:** Oh, how come?

**Greg:** Because ultimately they can't constrain them. And the thing you might have missed in that conversation was that the anaesthetist already knew he shouldn't be doing that, but he was just trying it on.

**Donald:** Okay.

**Greg:** So you don't want to get into that.

**Donald:** Okay. Well, maybe we assume that it would be fine. It would be fine for the system not to presuppose any modifiers and they just deal with it. But yeah, certainly worth the conversation.

**Greg:** I left it in a logical design because the user never interacts with it. It's just a value that's brought through. You know, at the moment the application would just default back to zero, but you've now got the option of it defaulting from the base table. Okay. And you could write it that way and it would still work.


## Typical arrangements, fixed prices and override permissions

**Donald:** Yep. Okay, let's typical examples. So arrangement, hospital contract using RVG, who pays hospital, it's an RVG style contract. And so again, when we say who pays, essentially that's saying, There would be a contract named against Southern Cross. They would be the little party, so it already, you would not have to remember or fill in who that person is.

**Greg:** Yep.

**Donald:** Anaesthetists can change the price in this scenario, apparently; yes, great. So we just have an option: can the anaesthetist do a price override? Is it prepaid, yes or no? That's a good example. Fixed price from the hospital, same idea: contract price or rate. So that's a fixed rate versus the variable rate for anaesthetists. And you're saying that in this scenario they wouldn't be able to apply discounts?

**Greg:** No, I've checked that with Ben and he said no, because I said this is sailing very close to the wind in terms of the Commerce Commission. He said, 'No, we just say to the anaesthetists, if you don't want the rate, don't do the procedure.' An anaesthetist can always turn down a procedure.

**Donald:** This isn't the anaesthetist defining a price and colluding; it's the hospital saying, 'You're doing it for this. Take it or leave it.'

**Greg:** And then AA is saying, look, that's the price this hospital pays. If you don't like it, don't do it.

**Donald:** Yeah, cool. 'No contract', we've talked about this. RVG units, right? Yes, cool. And then this is prepaid price, patient pays, anaesthetist's own price. So you don't say it here, but I suspect what you're saying is it's an anaesthetist fixed price.

**Greg:** It is.

**Donald:** Cool.

**Greg:** Well, actually, technically it's an estimate, but it's the anaesthetist's price.

**Donald:** The anaesthetist can change it in the room.

**Greg:** Yes.

**Donald:** They can, but.

**Greg:** It's covered in the next paragraph.

**Donald:** Okay. And then prepaid, yes. And then surgeon's fixed-fee arrangement: patient pays, surgeon's fixed fee. No, no, no. Okay. Other combinations can be set up for specific billing needs. 'The office can override any price at any time, and that is the only way to change a locked price after changing the contract.' Now, this sentence, 'changing a locked price,' will carry some ramifications if we don't unpack it a bit.

**Greg:** Yeah, I'm not sure that language is too flash.

**Donald:** That's cool. I think if we jump back over to here.

**Greg:** What I'm trying to say is, if you've got a fixed-price contract, only the admin can change it.


## List states and changes after prepayment

**Donald:** Cool, There's a handful of newer diagrams here. And so if I go back to the Miro board here, we looked through a bunch of these different sort of flow charts. And there's one here that talked about the status. And when I came back to look at it, I'll zoom in here for effect. We have this thing called a draft status. And so we now have talked about draft being a really specific thing. And so I've now updated from the original, I think, language on the requirements to say that there is such a thing as a draft list. An active list is once it's been assigned to an anaesthetist. And then after that it's submitted. and then authorized. And so in your document.

**Greg:** So once it's an active list, it's just part of this mainstream.

**Donald:** Exactly. It's basically just replace the word draft with active, because now we know draft means something else. And so in here where it says, only way to change a lock.

**Greg:** It should say fixed.

**Donald:** Oh, that's what that's saying. Only way to change a fixed price without, okay. Change the fixed price without changing the contract. Correct. Okay. That seems good to me. In this context, price can be any price rate discounted. Okay, percentage. I've.

**Greg:** I've done that in the document: talked about price with a small 'p', and it's any of the pricing things, right?

**Donald:** Yeah, cool, cool, cool.

**Greg:** I think I've got them off, not sure.

**Donald:** Nice.

**Greg:** The next page is for Ben. I put booking set up first, identify the billing party, because every time I open my mouth I get hammered. Cool, cool, cool.

**Donald:** No, this was good. This was good. Just going back to this though. Anaesthetist changing the price on one of their own fixed price things. So let's go back to our facelift example. It's cosmetic. He wants it to be prepaid. We would assume that somebody would have set up a prepaid contract for that anaesthetist in the system. What we were previously calling a first party contract.

**Greg:** I think it could be a generic process. There'll be a templated letter somewhere and it just goes out. But we'll have to test that.

**Donald:** Okay. But in terms of what this is saying, in the scenario that the prepaid contract is selected for that anaesthetist, the patient gets sent, they pay it, they come get their facelift done. And in the room, at that point, if the anaesthetist wants to change something related to the price, up to this point, I have been reading this column here as price override. separate two can change the price. And I guess when I see this, I want to, my current mental model of how this is working is that if there's only half of the procedures done and they want a discount, or if there's extra done, I wouldn't think you would handle that via the price override. It would be through the additional invoices sort of stuff we've talked about.

**Greg:** That's what happens.

**Donald:** Yeah, great. Okay. I just wanted to make sure.

**Greg:** Section 6 of the technical document, I think.

**Donald:** Okay.

**Greg:** It says exactly what happens in the equals, under and over scenarios.

**Donald:** Cool, I haven't read the technical one. It's a bit beyond me, I think.

**Greg:** Just flick over to it for section 6, because that's not hard, that part. And section 5 is worth discussing too, because it's got that table in a little more rigor, and I think the thing I really liked about where the table ended up was it's ended up being this neat little it's like a switches table, and you can just... set these switches and get any contract to technically do anything. And I think that might in the long term not be a really flexible mechanism.

**Donald:** Yeah, if I'm understanding, if I'm understanding what you're saying, I think that's the kind of the way I always envisioned it is that basically there would be. whole whack of different settings you can apply and you name the contract and there you go.

**Greg:** It's just firmed up.

**Donald:** And exactly, it is the flexible tool that allows them to make whatever they need to so that there's a repeatable process for invoicing.

**Greg:** So I think it's worth spending a couple of minutes on five and six. I don't need to drag you through the rest of it.

**Donald:** Yeah, I'll read anything you think is valuable. Five, you said?

**Greg:** Here, here. Okay.


## Contract flags and how contract headers and lines work

**Donald:** So, four flags drive who is billed, how, and what the anaesthetist can change. Sorry, change. 'Contract holder is billable party' flag [acronym unclear]. If true, it indicates the billable party is the contract holder; otherwise, the billable party is always the patient or guardian. Okay. And so this is a setting on a contract that indicates the billable party is the contract holder. Okay, so somewhere else, either before this or in the metadata on this entity, you would have information about the billable party already, I guess?

**Greg:** It's a pointer to a billable party. It's a list of billable parties.

**Donald:** Okay, okay. 'Contract is editable' flag: if true, it indicates an anaesthetist may change the values of any of the contract lines. For a hospital's fixed-price contracts, this is typically set to false to prevent the anaesthetist overriding the price and discount fields for fixed-price contracts. Conversely, for procedures using RVG values, it's set to true. Now, I still haven't fully grokked what a contract line is when you describe it here. Is there a way you could explain it to me?

**Greg:** Okay, so let's take the [unclear: diagram or example] down the bottom right. A contract holder is an organisation that you bill on a regular basis, on some agreed basis. It has multiple contracts, because there's just one hospital but potentially dozens of different contracts. For instance, I think Forté and St George's both have Southern Cross, DHB, ACC, and so they're effectively agents for all of these. They have multiple contracts, and even for one procedure they've got multiple contracts, because ACC procedures' contracts may be fixed price, but Southern Cross contracts at the same hospital for the same procedure are RVG contracts. That's why it's important to get the billable party and the contract lined up, because it drives some of the billing information. So multiple contracts; pick one. It has multiple lines in it. A contract is like a header and lines. The header tells you it's a Southern Cross contract for this hospital for this year.

**Donald:** Okay.

**Greg:** That's the sort of thing it says. And it also says, 'Is this contract editable?' Because that's set at that level. All the lines in that contract have to be of a similar type. They're editable or not editable at that parent level, and prepay or not prepay at that parent level. So you get them grouped in a coherent way. The default contract is empty, which is why I put some of those flags on the header. But for an anaesthetist's prepay list, he'd have all his prepays down there — what they were, and what the amounts were that he wanted prepaid — and the office would need to pick one of those. The anaesthetist would probably need to be involved in specifying what prepayments he wanted, and this would allow the system to generate the invoices because the price details are there.

**Donald:** Is there an analogy you could use to help me understand the contract and the contract line?

**Greg:** Yeah, I'm an anaesthetist. I want to tell Vanessa I've got these 25 procedures that I want to prepay.

**Donald:** Yes.

**Greg:** And they've got prices on them.

**Donald:** And in our scenario here, these would be, oh no, these are actually named procedures like a facelift or a facelift plus one, extra, whatever it might be, yeah.

**Greg:** So that would be an Excel spreadsheet.

**Donald:** And those 25 different things, those are just free text defined, you know, procedures.

**Greg:** Yep, they're 25 lines and they just sit there. And because they're fixed-price, they don't actually need a reference to the RVG group. They're fixed-price, so they sit there.

**Donald:** OK, so. Going back down to five down here. If true indicates if they need this may change the values on any of the contract lines. OK, so basically the settings on that contract, can they modify them?

**Greg:** Yeah.

**Donald:** And so this one here is also a setting on that contract which is saying can you override the price?

**Greg:** Yes.

**Donald:** This one here is saying, can you change other things other than that?

**Greg:** At that level, the contract holder is either identifies themselves or not. So it's a hospital?

**Donald:** Yeah, sorry, you're right.

**Greg:** So the contract holder could be the hospital — they're always the billable party. The contract holder could be the anaesthetist, because it's a generic model, or a surgeon's rooms, and they're never the billable party.

**Donald:** So you're right, I was misreading what this was, but this here saying is editable indicates it needs to change the values of the contract lines.

**Greg:** Yeah.

**Donald:** Okay, so this is the one here saying, essentially, can the price be overridden?

**Greg:** Yeah, that's it.

**Donald:** Discount fixed, whatever it may be.

**Greg:** Yeah.

**Donald:** Okay.

**Greg:** And as you can see, it's associated with a contract and there are no other conditions that determine it's just a can or can't be.


## Prepayment and anaesthetist-specific contract flags

**Donald:** Yeah, Okay, contract is prepaid flag, if true, yep, and triggers that process. That's cool.

**Greg:** Actually, there's an inconsistency there, because in the model it says contract holder. We'll come back to that. Have we done that? No, that's correct. Contract, contract is prepaid. And then contract holder, that's the anaesthetist ID that we had. And there's a better table here than in the exec. If you just walk through this table, it might make more sense.

**Donald:** This one here, you're saying? Yeah, cool. That's the language I was translating in my head. And so ContractHolder.AnaesthetistID is not null, because some contracts could not have an anaesthetist attached to them. Therefore, if I was the anaesthetist on a procedure, I wouldn't want to see your prices; I don't even want to see my own [unclear]. So they could be null, couldn't they? 'Is not null' — maybe that's technical language I'm not grokking.

**Greg:** It has to. If there is an anaesthetist specified associated with the contract, then those contracts, those contract arrangements only belong to that anaesthetist.

**Donald:** Yes. Yeah, Okay.

**Greg:** So that means that when you're looking up a code, if the booking... If the booking is associated on a list with an anaesthetist, then you know that it's that anaesthetist. You can show those contracts for the office to choose one. Yes, That's the only use it has.

**Donald:** Okay, how the cases map. Default hospital RVG, 'holder is billable party': true. Yes. So the billable party is hospital, hospital, patient, patient, patient. Anaesthetist ID: these ones don't have it, this one does. That's in line with what we're saying. Can be overwritten, can't be overwritten, can be overwritten, can be overwritten. And then is prepaid. Cool.

**Greg:** Okay, yep, And those are, now those are unconstrained conditions. There's no interdependency, but you get that combination and they drive the behavior.

**Donald:** Yep, this is cool. This is in line with kind of, I didn't have the words to describe it this way, but this is exactly how I was expecting it. Various other combinations can be used to achieve. Yep, I don't think that was going to bring.

**Greg:** But it could be.

**Donald:** Yeah, totally, totally. I mean, you don't describe them here, but. Or maybe do a look. Yeah, fixed rate. Yeah, exactly. Different things.

**Greg:** Scroll through that. That's not so important. I'm just trying to... You could. Where is... What have we got here? This is just a stab at how the process might work.

**Donald:** Okay, which is similar to the image in this other document here. Yeah, Okay. In about 30 minutes, I should set a reminder. I have a call with a real estate agent.

**Greg:** Yeah, that's cool.

**Donald:** And I think I didn't set any time after that, but if you wanted to, we could spend...

**Greg:** My wife has already grabbed that space.


## Selecting contracts and RVG codes during booking setup

**Donald:** Yeah, great, it's fine then. Okay, so we've got 30 minutes left then. Okay, the process, the office sets up each procedure, the anaesthetists completes it, the office reviews it, and the system prices and invoices it. So booking setup, identify the bill, party, choose the contract holder and the contract. So choosing the contract holder and the contract. So I, oops, let's go to this. Again, this isn't updated yet, but I'm imagining now some version of this where there's actually just like a non-editable text field here. I guess it is editable, because yeah, but there's a text field here that would be filled in with the exact upper quadrant, QTP, whatever the text that comes in from those systems. It's always just there for reference. And then below that you pick your RVG code and then from that you pick your contract. That's currently where I'm sitting. I'm not saying it has to be that way.

**Greg:** Yeah.

**Donald:** And so here when it says you pick your contract holder, then your contract is.

**Greg:** Well, if you see the contract determines whether you even need to select an RVG code.

**Donald:** That's right. Yeah, good point. So yes, but I guess the RVG.

**Greg:** Might be default and then you can pick your RVG code. I don't know how that navigation's going to work, but.

**Donald:** Yeah.

**Greg:** Or it might be SXAP, right? Because we already know who the hospital is. So that'll be there; you can pick SXAP, and that will tell you the Southern Cross [unclear: arrangement] at Forté, whether that's fixed price or RVG. You're more or less done at that point, and you've got the option to identify an RVG code if you want to, if you need to.

**Donald:** Yeah, so when we had talked about some version of what this was trying to describe, right? There was a problem, which is that there could be thousands of contracts. How do we make it easy to navigate? In the world where Ben and Co want to get rid of any idea of a procedure list, which I can understand the value of, I don't need to relitigate that at the moment. you've been left with the problem of all of the contracts. And so you're right that you could potentially do it from either way where...

**Greg:** We know the hospital.

**Donald:** Yeah, that'll be filtered out. But you could still look, if you didn't have an RVG code selected first and you opened the drop down, let's say for the contracts, you could have a combo box that you can search and scroll, but it would have a fact load of contracts.

**Greg:** No, it might only have a dozen. Six or 12?

**Donald:** I mean, in the scenario I'm saying it would have showed every single contract in the system because an RVG code has not filtered it down yet.

**Greg:** But it knows the hospital.

**Donald:** Yeah, so we know the hospital, but it would show the hospital, default.

**Greg:** So all of the contracts for the hospital.

**Donald:** Yeah, it would show all the contracts for the hospital, but also all the contracts for that anaesthetist.

**Greg:** No, because we haven't, would it?

**Donald:** If you think of it two years down the line, we have, I've done the due diligence of putting all of my prepaid stuff in the system. You'd look at that list, and let's go back to this image here. You would see a no contract. You would then see all the fix.

**Greg:** Oh no, you wouldn't see them there. Those are lower-case 'p' procedures. What you'd see is one line for the [unclear: anaesthetist's contract header].

**Donald:** Unpack that for me, sorry.

**Greg:** You know who the hospital is, so you've got a filter of contracts — not contract lines, you've got contracts. The contracts are Southern Cross, ACC, [unclear], and [unclear]'s list. That's all you see.

**Donald:** This is, you remember earlier when I said the particulars of contracts, a hospital versus insurer versus surgeons? This is coming up right now because I don't have good pictures to when a surgeon, when you go to a surgeon directly, when are you getting the surgeon's fixed price versus the hospital's fixed price because that surgeon's using the hospital as a service. You know, that's where I don't quite have a good mental image of it.

**Greg:** Yeah, that's a good point. So how do you navigate? How do you navigate to the surgeons? So you can navigate to the anaesthetist easy enough because he's on the booking card.

**Donald:** Well, this is where I'm imagining, like again, you've got your blurb up here, which is what the procedure is in sort of random text. If we just imagine there was two different drop downs, right? In a world where you look into the RVG first, then this would be filtered based on the RVG. Cool. We can accept that and love that. But in a world where you look at this one first and you've not selected an RVG, I think this list becomes quite large.

**Greg:** Why?

**Donald:** Well, thank you for asking. I don't fully know, that's just my feeling. Because of the, we can, at a point where we know who the patient is, we know who the surgeon is, we know where it's going to be, hospital is going to be happening. When we know all that, we don't still know who's necessarily paying for it until we pick the contract. And so wouldn't you see potentially the surgeons and the hospitals and the anaesthetist and the no contract contract? Like all of those different groups would exist as different lines in that drop down.

**Greg:** Actually you're right because you could go to a hospital and until you knew more, any of the combinations of the hospital's contracts, the surgeons' contracts, and the anaesthetist contracts, and the default contract.

**Donald:** Yes. All of them would be present in that list.

**Greg:** You need to know, you need to make that choice to navigate down to more detail.

**Donald:** And so what you said earlier was true, that like if you chose the contract before you chose the RVG and the contract happened to be fixed price, you would not have to filter the RVG because it's doing no one any favours.

**Greg:** Well, you've got to remember that half the time the office staff might not even know what RVG might necessarily apply.

**Donald:** I'm assuming, when you said that, I just assumed, let's just assume that 100% of the time that happens. I'm imagining the anaesthetist themselves has just done the procedure and they're trying to find the right contract.

**Greg:** Oh, okay, this is the...

**Donald:** It could be either party, right? It could be either side can do it, the admin or the anaesthetist, but... In the situation, as you correctly assumed before or asserted, if a fixed contract is chosen first, the RVG dropdown box, I guess, becomes disabled because you can't select it. But the other way around, you could filter the full contract list based on the RVG. And it could still become disabled after that. But I'm just saying I'm sensing there will be some sort of navigable problem with a very large list of contracts. That's a guess. But thankfully we can test it.

**Greg:** Yeah, we can test it. I don't, we need to ask Vanessa, but I don't think you'll see more than a dozen contracts on a hospital. You'll probably only see one on an anaesthetist and you'd see if there are any, because remember those fixed price ones at the moment are only used by about 6 cosmetic surgeons. So the other 80 would never have a hit on that search.

**Donald:** Yeah, I mean, let's.

**Greg:** And probably there are a couple of surgeons rooms that have surgeons arrangements. Otherwise you'd never get a hit on that list either.


## Contract lists, examples and navigation complexity

**Donald:** Yeah, so these are the files that Vanessa has given me up to this point. This first one here is an export out of Solutions Plus, which is basically garbage, so we don't really need to look at it. Then we started getting these other ones, so Merivale Plastics, a handful of these Southern Cross ones.

**Greg:** Yes, so Merivale Plastics is a really good example. That could be a surgeon's rooms, so those are the agreed prices.

**Donald:** That's right. So I believe we have said that for all fixed price things, we would still want to potentially link them to an RVG code to enable them to show up when you're filtering via RVG. I think we said that or not.

**Greg:** I think that's, well, I can't remember if we said it or not, but I don't think it's compatible.

**Donald:** Okay, you might be right. As I'm saying out loud.

**Greg:** It's not compatible with the design.

**Donald:** Yeah, which just means that we just have to, as of now, if they want to not want to address some sort of navigation issue, you have the potential of looking and get seen potentially a lot of procedures. All of these here, because the system can't attach anything to the wibbly wobbly line of whatever the search and the procedure is going to be, every single version of what's in these documents here will exist as a contract in the system that you have to search through. All of these, these prices right here, right, these are all fixed prices as well. So even just this, that's 15 lines. This is 10. But what's the next layer down?

**Greg:** That's all you're looking at.

**Donald:** I'm saying that my current mental model was that these are all going to be visible.

**Greg:** You're going to blow them all out.

**Donald:** We have to, since we're not — I'm just going back to the beginning. We had this idea that there was an infinite list of potential ways to describe a procedure, and there are roughly 40 RVG codes. Is it 112? Did you count them?

**Greg:** Yes.

**Donald:** Okay, thank you. It's, yeah. Was that including modifiers?

**Greg:** Which is itself, no, which is itself quite a big list, isn't it?

**Donald:** Yes, not bad. Yeah, I agree. So this, but we've now decided, so previously there was this idea that like in between there would be this medium list that you could use to filter and make some sort of just simpler stuff in the system, right? That's out the window. And so now when an active list is in a slot and the schedule and either the anaesthetist or the AA staff is looking at it, they will see the plain text description of what the procedure is from the surgeon. And then basically the other two things will be blank. We don't know the RVG. We don't even know if it's relevant yet, and we don't know the contract that's applied. So somebody will have to sit down and decide which these are going to be. And I would, I'm getting this.

**Greg:** How do they decide?

**Donald:** Well, they decide by looking through the whole [unclear expletive] thing, but like this is one group of things she gave me.

**Greg:** I don't think that's what I'm imagining at all. I think there is a structured approach before you just give them a big data dump [unclear final phrase].

**Donald:** You're right. Obviously, since we know the hospital would never show for an hospital that's not relevant, and we know the surgeon wouldn't show for a surgeon that's not relevant. But I guess as I'm looking through these, it still feels like they could be quite large.

**Greg:** Yeah, but once you get down to that bottom level, you don't have a choice but to scroll through that list, right?

**Donald:** Yeah, and maybe that's just a problem that exists.


## Surgeon-specific arrangements and a contract-lookup gap

**Greg:** That's just the problem, definition. However, this discussion has shown a flaw in my document already. If I've got a contract there that's an anaesthetist fixed price, right?

**Donald:** An anaesthetist fixed price, yes, this one here.

**Greg:** But actually, if we get a contract in that's from Merivale Plastics, how does the system know that contract is relevant to this booking in terms of prompting Vanessa for prepayment? Well, it might not be prepayment. It's a surgeon's contract, but it's not prepayment.

**Donald:** The surgeon, you've described that the anaesthetist would always want it to be prepaid, or maybe Vanessa's work?

**Greg:** That's the anaesthetist contract, yeah. That was the use case.

**Donald:** Well, Vanessa would always want it to be prepaid if a patient is paying [unclear whether referring to a surgeon's arrangement].

**Greg:** Some surgeons would want prepayments for some procedures.

**Donald:** Surgeons or anaesthetists?

**Greg:** Sorry, some anaesthetists would want prepayments for some procedures.

**Donald:** Yeah, and so we had this idea that based on this intermediate list, anaesthetists would have a profile and they would say, yes, no, With that gone and then no profile to do it, the only method to serve automated prepayments Is the contract being selected?

**Greg:** Okay, so I think the identical situation here that we've talked about — having an AnaesthetistID not-null column — we also might need to think about surgeons having pre-made arrangements. Because let me go through the logic I'm thinking about: you've got a booking description and a hospital. You're Vanessa, you're sitting in front of the screen and you have to allocate something to it, because the big job is to identify the billable party and how they're paying.

**Donald:** So, we have a surgeon in the hospital day in a session.

**Greg:** So what is the list of things you can present in front of Vanessa as options for how to traverse the tree? So the first one is The default contract.

**Donald:** Correct.

**Greg:** The second one is, it's a hospital contract.

**Donald:** Yeah, you would present those.

**Greg:** The third one is: does this anaesthetist have any fixed-price contracts? If yes, then you show the header line, the contract header, which says 'anaesthetist prepays'. So that would apply.

**Donald:** Yeah, they'd be grouped. I certainly imagine that'll be grouped.


## Brief interruption

**Greg / others [attribution uncertain]:** And the same for surgeon. [A visitor enters; brief greetings between multiple speakers, exact attribution unclear.] 'Hi, how are you?' 'Good, how are you going?' 'Good to see you.' 'Yeah, you too.'

**Donald [likely]:** Nothing's going over here.

**Multiple speakers [attribution uncertain]:** [Brief interruption; multiple speakers, exact attribution unclear.] 'Yeah, good. We're getting there, making progress.' 'You caught up with Ben today — yesterday?' 'Yeah, it was good, today. They're focused and involved and all the things you want from a good client.' 'Yeah, so that's really good.' 'It sounds like you guys are getting through the requirements.' 'We're not fast enough for either of us, but we'll get there. I think it just shows how nuanced it is.' 'Yeah, there's a devil in the detail, I'm sure.' 'Oh yeah, quite a bit.'

**Visitor [identity uncertain]:** Okay, that's cool. I just thought I'd come and say hello.

**Greg [likely]:** Yeah, thanks.

**Visitor [identity uncertain]:** I'll leave you to it. Cheers.


## Contract-selection paths and surgeon arrangements

**Greg:** So you could get, I think you could drop down to that selection list. Is it a default? Is the hospital got contracts? Has this anaesthetist got contracts? Has this surgeon got contracts?

**Donald:** Yeah, I think the thread you were starting on there was pre-payment on a surgeon. That's where you were going.

**Greg:** The segue I had into that was that the mechanism I put in that said it just applies to anaesthetists would actually — the same mechanism would apply to...

**Donald:** You believe that you could set up a surgeon's contract? that also defined that procedure as being prepaid.

**Greg:** It wouldn't be prepaid, but it would be the same approach as the anaesthetist, in that you've got a default contract, AA, and you've got a hospital, because you know that. But the other variables that could exist within how to select the appropriate arrangement are an anaesthetist's arrangement and a surgeon's office arrangement.

**Donald:** When you say arrangement, you mean contract?

**Greg:** Yeah, and I used 'arrangement' deliberately there, because some surgeons' rooms have arrangements with AA that they will perform procedures for them at a fixed price, regular procedures. The reason they've asked for that is they want to give their patients price certainty.

**Donald:** That's right, because when they are sending the list to AA, they may not know who is going to be assigned, and they don't want the fluctuations.

**Greg:** No, so I haven't accommodated that. In the data model, if you get down to the rigor of the data model, I haven't accommodated. I thought you had quite.

**Donald:** Isn't that just a fixed price contract of the surgeon?

**Greg:** Yeah, it is, but it doesn't support the way it's set up. Does it support?

**Donald:** The question I think is who's the billable party if an assurance is being...

**Greg:** Yeah, but if there's a...

**Donald:** It needs to decide. It needs to decide based on this. That's what you'd said earlier.

**Greg:** Yeah.

**Donald:** That's the con, that's one of the consequences here.

**Greg:** I think there's a little hole there. Don't worry, but then it'll come up. It'll come to light later.

**Donald:** We'll have to figure that out.

**Greg:** Yeah. It's just a lookup hole. It's all right.

**Donald:** Okay.

**Greg:** So those are the contract styles, right?


## Searching contracts, RVG links and fixed-price lines

**Donald:** Yeah. So going back to this list here, when you say choose a contract holder, then the contract.

**Greg:** Yeah, it should say contract.

**Donald:** It's just like you're basically presenting the list of contracts and potentially a list of RVG to filter it down if you wanted to.

**Greg:** Yeah, well, you've got default. It's always at the top, right? Yeah, And then you've got hospital contracts. And then you've got any special surgeons and anaesthetists. But.

**Donald:** I'm having the sense that like you could filter by say body section so this list becomes a little smaller.

**Greg:** You don't know that. You've got no data to work off.

**Donald:** Yeah, that wouldn't have to be authored.

**Greg:** Yeah.

**Donald:** Maybe it's just recreating this problem?

**Greg:** And that's not how the contracts are structured. They don't have that information.

**Donald:** But they could.

**Greg:** Not necessarily. Unless Southern Cross might happen to have an RVG contract with [unclear]. [Unclear continuation about fixed-price contracts.]

**Donald:** So for facelift here, right, you could have a fixed price contract in the system called Merivale Plastics Facelift at this price, and you could attach it to RVG code.

**Greg:** Contract line — just H3 facelift; contract line called 'facelift'. Yep.

**Donald:** Okay, sure.

**Greg:** Yep.

**Donald:** Which means in theory. when the surgeon is in the room and he's trying to find it. And maybe, you can just search on names against facelift, but in theory, he's like, oh, no, it's an H3. So he could search H3 and then he might only see contracts related to H3.

**Greg:** True.

**Donald:** That's kind of what I think.

**Greg:** You could, that's like a reverse lookup. Yeah. You should be able to do that.

**Donald:** So it could kind of go both ways. And you're right, not all contracts will have necessarily an RVG attached. So you would just still need to search, but I think that.

**Greg:** All of the fixed ones should have, really, because there's an opportunity to set up your master data. So yeah, they should have.

**Donald:** Yeah. Okay. So this decides who's invoiced the patient or contract holder, if required, into RVG code. Contract lines already contain it when relevant. We've now said, we've now said no, actually, contract.

**Greg:** Fixed price contract lines would contain it.

**Donald:** Oh, well, yes, sorry, yes, you're right.

**Greg:** You're totally right. Fixed price contract lines aren't there or are there? I don't know.

**Donald:** Well, I think as of now there are RVG-style contracts, fixed-price contracts and fixed-rate contracts. And, not talked about in the details of this table, but there could also be a standard RVG contract with a fixed discount on it. Ben said that. You talk about it up here with the discount, but the detail doesn't present it as a scenario.

**Greg:** You need it because that's the thing that could it be entered before? It could be.

**Donald:** Well, this is where what Vanessa and Ben were saying was that you would, for this given hospital, the rule is just that it's standard RVG pricing minus 20%.

**Greg:** Yeah, so you'd want to put that up, at least on the booking, wouldn't you, as a pre-filled value?

**Donald:** Well, yeah, it would be a new, it would just be another contract line. attached to that hospital, whatever it is. What I would like to do is once some version of this document or your new document is accepted by us, you and me, I'll give it to Claude and then I'll let it loose on all of these other documents like this to try and pre-fill it with some appropriate data.

**Greg:** I was inquiring about this concept with Nick — saying, 'Discount? No one would ever use it.' And he said, 'They do.' I said, 'You're kidding.' He said, 'No, we've got a DHB contract that specifies the price at a discount.' I said, 'It's insanity. All you do is put the rate up.' [Unclear ending.]

**Donald:** Yeah, I was there. He was just, 'Oh, they should increase more units.' But that's what it is.

**Greg:** So obviously there's no end of stupidity in this world today.

**Donald:** So yeah. Okay.

**Greg:** All good.


## Office review, clinical authority and price edits

**Donald:** And this is time entry: record BTM and notes if required. Exactly right. Change the procedure contract or RVG if needed; changes are audited. Then set the price or discount only if the contract allows it. Seems good to me. Office review: check flagged changes and warnings, such as insurance on a patient-billed contract. That's a big question mark, the insurance thing, but we talked through it. Override any price if needed. 'An office override always wins.' You talk about the office always being able to override. We've previously talked about the idea that the list does not disappear for the anaesthetist until it's confirmed or submitted. I think this document describes a general process: it comes in, the anaesthetist does a thing, the office checks it, then it gets billed. But in theory, as I've heard Ben and others say, the anaesthetists are actually the authority; if they think something's right, they basically tell the office to listen to them.

**Greg:** Yeah, but vice versa.

**Donald:** If each side can do whatever they want, the system doesn't allow or disallow it. It's just a case of who saw it last, and they'll update it and then communicate with the anaesthetist.

**Greg:** A more common use case is that the anaesthetist may not be familiar with how this procedure is priced, so he throws it at the office to sort all of that. Apparently that happens regularly.

**Donald:** Cool. Yeah. So this isn't, yeah, that's fine.

**Greg:** So yeah, it's permissive, right?

**Donald:** Yeah.

**Greg:** Goes through.

**Donald:** And then obviously how the billing system works itself.


## Flagging bookings that need special attention

**Greg:** Well, I did wonder — and it doesn't need to be included here — in the situation where an anaesthetist doesn't quite know how to set up something because perhaps he's new, would it be a bad idea to have some sort of tick box on the entry form that asks for a review?

**Donald:** So the system currently assumes that before any invoices are created, some administrator will always take a look at it and say yes. Are you imagining that you would replace that with the assumptions that all invoices would always automatically go out and only optionally be reviewed?

**Greg:** Well, would it be helpful for us, an anaesthetist, to be able to flag a booking in such a way that it's sort of saying, I'm not sure about this one, can you check it?

**Donald:** Yeah, I mean, maybe, yeah, so if it's just a...

**Greg:** It's like a special request above the standard, because one day these reviews might stop, or they may be.

**Donald:** That's right. That's right.

**Greg:** And you want to highlight this as saying, 'This one needs a look.'

**Donald:** Yeah, so I think you and I had already talked about the idea of a notification pool. And some, I have decided to do a little bit of updates to this based on stuff that I thought was safe to do just for the sake of time. And so there is some version of a concept of to-dos here. I'm not, I haven't really been reviewing it and I'm not really going to do smaller edits until all of their catch up work is done. But I could imagine with the use case you're describing, you could have an anaesthetist mark it for like a notification to say, Hey, can this be looked at for a second?

**Greg:** Some sort of attention notification?


## Pricing precedence versus the latest edited state

**Donald:** Okay, yeah, into the regular pool. 'Until the list is submitted, the office changes are starting points, and it can change, and the office sees every change at review. Which price wins when a procedure is authorised by an anaesthetist? The first of these that applies sets the price.' So this is part of a concept you've articulated in some earlier documents about looking through to see the right thing. But I think conceptually it's...

**Greg:** This is just a precedence list. Like, if one applies, stop, you're done.

**Donald:** Yeah. So when I was reading through this, I started to picture a booking which has a procedure and a contract. As it goes through the lifecycle, any of these could be changed at any point; they'll be audited and recorded. If the office or anaesthetist applies a price override, they're essentially updating the record as it goes along. Whereas I read this as if it were a stack of things, rather than a single entry being updated.

**Greg:** No.

**Donald:** I didn't think that's what you're describing, but it's kind of what it felt like it was describing.

**Greg:** I should have used the word 'precedence' or something. The list might make more sense upside down.

**Donald:** Yeah.

**Greg:** So you start off with an RVG calculation if you need one. Otherwise you've got the contract price, which overrides whatever's been done at the RVG level. And then the contract price may be overwritten by the anaesthetist, or either of those, right?

**Donald:** Yeah.

**Greg:** And then, despite what the anaesthetist has done, potentially the office admin can override that. So it's a sequence of priority in terms of what is allowed to override what. I'm saying the office override is king; that'll always override anything else that's been done.

**Donald:** Well, I don't see it as an override. I just see it as the last person who touched it, because there's not actually one group of users having more authority over the other. As far as the system is concerned, it's who updated it, and what does that look like at the point you say 'send it'?

**Greg:** Yeah, good. I agree.

**Donald:** Okay, we're aligned.

**Greg:** It's just the contributors to the end document.


## Event sourcing, prepayments and contract schedule updates

**Donald:** Yeah, there's this, if you're technically interested, there's this methodology or kind of technical solution called event sourcing. You know what this is?

**Greg:** Yeah, I've heard the term.

**Donald:** Yeah, somebody in our team used to work at Zip, which is kind of pay-later stuff. They use that particular domain structure to allow a whole bunch of complexity in their system. And we use that in another customer for some contractual stuff. It has the concept that you have layers of changes and can execute at different points. But that's not what I think this needs or is describing. Okay, I think we might be able to whip through the last little bit. Prepayment: prepaid procedures, common for cosmetic surgeries, collected up front at an estimated price and settled after the procedure. Basically the booking office selects it, the amount is fixed, and after the procedure more or less can be billed if needed. We obviously have an open question about exactly how that should work at this stage. And then the last bit here...

**Greg:** That was just today's punt about how to maintain contract details.

**Donald:** Okay, this area is still under active development, but here's the status. A contract holder's revised price schedule is loaded, and... okay, yeah, yeah, okay.

**Greg:** I've had another thought about that. I think you could hold a contract header, which is manually maintained — and is best manually maintained because there aren't many of them and it's a little complicated. You set up all these parameters, then you've got a list underneath it, and you need to be able to merge new data with old data. So somehow you get a list of new data into the system and need help from the system to understand what's changed, what hasn't changed, what's been removed, and provide some sort of screen that lets the user manage those statuses and say, 'Yep, that's it.'

**Donald:** Yeah.

**Greg:** And we're done. I don't care how it happens. It's just the idea of how you manage data through a time-based lifecycle.


## Next steps: revised documents

**Donald:** So I wonder if it is worth me sending you the transcript of what we talked about today. And do you want to make a V6 of this before we go and try and update requirements based on it?

**Greg:** Yeah, I'm happy to do that. It's only minor.

**Donald:** Yeah, I mean, only if you want to. Obviously, it can try and interpret the changes based on what we've said, but I think. Once we get to a point where you're happy and then there's a version of the technical document that is more true to what you're expecting, that would be the best possible version to send it. Okay, well I'll get that transcript and.

**Greg:** Get it to you. I'll go through that. I'll send that to you tomorrow.

## Reconciliation notes

- **SXAP** is consistently identifiable, but the spoken expansion is transcribed differently across the sources; its exact expansion has not been imposed.
- **RVG** has been standardised throughout where automatic transcription alternated between RVG, RBG, RPG and similar phonetic spellings. **BTM**, **AA**, **ACC**, **DHB** and **NHI** have likewise been kept consistent where the context was clear.
- The name sounding like “Greek/Greg” in the discussion of reviewing the diagrams is not recoverable confidently. The same applies to the organisation referred to as “Christchurch ...” when a large contract list is mentioned.
- A brief visitor interruption occurs during the discussion of surgeon-specific contracts. Neither the visitor’s identity nor every utterance’s speaker is established reliably by the transcriptions; the uncertainty is marked.
- Greg describes the Southern Cross internal procedure list as approximately **2,500 lines** in two of the sources; the third reads **25,000**. The better-supported reading is retained, but the figure should be verified if used as a requirement or estimate.
- This document retains apparently provisional or conflicting statements about fixed-price lines, RVG links, prepayment and office-overrides as **conversation**, not resolved specifications.
