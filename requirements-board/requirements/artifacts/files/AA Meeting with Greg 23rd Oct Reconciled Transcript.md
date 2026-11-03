# AA Meeting with Greg — 23 October 2026

## Reconciled Transcript

> Reconstructed from three automatic transcripts of the same recording. The speaker-labelled Word transcript is the primary guide to who said what, cross-checked against the other two readings for wording and terminology. This is a lightly cleaned spoken transcript, not a verbatim record or a meeting summary. Unrecoverable wording is marked explicitly.


### Opening and review of outstanding requirements

**Donald:** Well, we're here. Good.

**Greg:** Have you had a go at recompiling yet?

**Donald:** Well, I need to, I want to be careful about not trying to build too much before we, you know, work through stuff. So this week I have, I took in everything that we already had from last week, which is some pretty big changes, like all that contract stuff and how the money stuff works is big. But I also did another kind of workflow pass where I got some agents to really scour every requirement just for consistency in terms of wording and language, and it found a lot, and I, went through and looked at the morning when I asked, like, Oh, can you push back an hour? Or maybe I said, No, I was going to ask you to push back an hour, and then I'm cancelling it because things weren't working, but like that morning I was trying to read through everything to try and get through it before the meeting. It was just taking too long, but it basically had almost everything right, so it was good. Yeah. So I reckon we keep, let's try and finish off some of the outstanding questions. I think that all kind of unlock a lot of stuff and then we'll go from there. Cool. So insurance on the booking, contract filtering, the warning and the approval reference. Already settled. The insurer and the approval numbers are stored on the booking from the source data and the office picks up the approval reference. The contract, not the indication, indicates who is billed. So it's just that insurance information is just informational.

**Greg:** Which indication is that referring to?


### Booking insurance details, approval and warnings — Question 93

**Donald:** Because there's this idea that we will capture insurance information from upstream systems. But on our end, the contract is still what decides who's going to be billed. But depending on the relationship between the contract and that information, it might present a warning to say, Hey, it says they have insurance, but you picked a non-insurance contract or whatever. I still haven't really internalized exactly how that all looks, so I'm leaning on you a lot here. Does the insurance indication narrow the contract list? I would say no. Or only drive the review warning, which is a link to this user story.

**Greg:** When you're saying the insurance indication, are you saying, are you talking about the approval number?

**Donald:** I don't know.

**Greg:** I'm not sure what data element is leveraging that off.

**Donald:** Okay, so insurer master data. Admins maintain insurer master list, each with an accept direct claims flag. When an insurer accepts direct claims, that's one thing.

**Greg:** No, I don't really. I'm not sure.

**Donald:** Here we go. I think this is really related to what this is outstanding question. No, we don't want this. We want partial answers. That's a lot in there. There was this previous understanding. I think I can try and sum it up, which is that there was a version of system that didn't have anything to do with any insurance status on a booking. We just got bookings, we selected a contract, and we tried to do that right. Our system had the concept of the direct insurer payment stuff, but in this early version of the system, that was it. It was pretty clean. And then at some point you came with this requirement that the hospital systems or the surgeon systems might have acknowledgement of an insurance status, an insurance tag, whatever, and you wanted, I believe, the system to front up a warning if the upstream system said there was insurance, but a contract in our system was selected incorrectly. Something like that. Does that ring any bells?

**Greg:** Yes, but I wouldn't use that language.

**Donald:** Okay, well, have a think about it either. Blow my nose.

**Greg:** Yeah, it's cold in here. That might be upsetting you too.

**Donald:** Okay, how would you describe it?

**Greg:** I'm not, I think the concept of an upstream insurer is adding confusion to the conversation. I think that there is a booking. Back to the booking. The booking contains 2 pieces of information which may be blank. One is, is there an insurer? Right?

**Donald:** So in other words, this is the information we're getting from upstream?

**Greg:** It's just on the...

**Donald:** In our system, you're talking about?

**Greg:** Yeah, it's coming up. It's coming upstream from the surgeons' rooms. Okay. Yeah. So there are two pieces of information which may be provided. One is, there an insurer involved? Okay. And the other one is, has that insurer approved the procedure?

**Donald:** Sure. Okay.

**Greg:** So there's no concept of a master.

**Donald:** No, I think I clicked on the wrong story here and that was referring to the direct insurer payment thing. So I think clicking on that was a confusion as part of this conversation.

**Greg:** So we get these two, but we're still very contract and patient-centric.

**Donald:** Yes.

**Greg:** But there are two bits of information that come with that booking and we have to...

**Donald:** Two insurance related pieces of the data you're saying? Yeah,

**Greg:** And we behave according to what information is provided.

**Donald:** So, sorry, remind me again what those two pieces of data was. It was the...

**Greg:** Who is the insurer, and has an approval been issued?

**Donald:** Okay.

**Greg:** So we set up a contract and a contract is a way of describing how we're going to build, basically how we're going to build for this procedure. So it sets up a billing method, if you like, or channel. So some contracts are direct, some are insured, some are not insured. And that's really what the contract is doing. It's acting as a control mechanism to say how we're going to build this.

**Donald:** That's right. So I think I agree with you on those things. Your clarification on those two insurance pieces of data from upstream is handy. I know obviously all our contract staff is hopefully pretty well established. But at one point you talked about the fact that our system needs to have a warning related to some concept in our system about insurers, not a contract, and their system, and if they mismatch.

**Greg:** Let me go back to the conversation that triggered that request. The conversation was, we're always billing the wrong party. It's causing a lot of hassle and work. And the reason they're billing the wrong party is because they're sending an invoice, for instance, sending an invoice to a hospital when the insurance hasn't been approved or vice versa, they're sending an invoice to a patient when the insurance has been approved.

**Donald:** Okay.

**Greg:** So in order to trap those... I was

**Donald:** going to say in your second scenario there, when the insurer has approved and they're sending it to the patient, wouldn't that be a situation where the patient still pays and they on charge or claim back to the insurance?

**Greg:** Yeah, that's true. It depends if hospital is acting as the agent for the insurer.

**Donald:** Yeah, I guess, yeah, cool.

**Greg:** Because not every hospital acts as an agent for the insurer.

**Donald:** Yeah.

**Greg:** I don't think Christchurch acts as an insurance agent. They might, not sure. Yeah, so you get these sort of combinations that are effectively invalid. Yes. And we're trying to trap these invalid combinations.

**Donald:** Yes, and so, and okay, I think I can jive with this. So we talked previously about the idea that within Southern Cross, there might be dozens of contracts for different types of procedures. And some of them will say, like, pay Southern Cross and Southern Cross will pay, you know, claim back from the insurer. Others might say something else, like direct pay some payment or whatever, I don't know. Our system already is able to be flexible enough to have an infinite number of contracts to satisfy any different payment sort of condition. But how does our system try and look at information on the booking from upstream and present a warning if it's mismatched? How do we answer that question?

**Greg:** Well, the most obvious one is that if the insurance field is filled in and the approval is blank, then that's a warning condition.

**Donald:** Yes, okay, so just alert the office slash anaesthetist if they're looking at themselves. And so if upstream tells us, yes, this insurance company is going to pay for it, have they actually approved it, no or yes, then we present a warning. Yep. Is there any other configurations where we might present a warning?


### Other outstanding questions: imports and RVG ranges

**Greg:** Not that I think we can detect.

**Donald:** Yeah, okay, cool. That keeps it simple. So really it's not even about matching an upstream piece of information with our contract system. It's actually very simply just isolated on its own to say, If the upstream system says yes, insurer, no approved, you start asking questions and resolve it. Okay. So we're looking at question 93 here. So does the insurance indication narrow down the contract list? No, I don't have any idea where it got that from. But yes, in the condition we've just talked about, it does present a warning. Question #2, is a warning the right response when a booking notes insurance but the patient-billed contract is chosen? We've said that doesn't matter at all. At this stage, we don't know enough about our system to confidently say that we can try and detect these. Maybe in the future we'll have more knowledge once we start building it, it's a bit more easy to understand. But as of now, we don't have to try and do any matching or magic algorithm with upstream and our contract system. We just do what we said before. Is Greg's quote unquote approval number the same as the designs insurance acceptance reference? Apparently yes. Okay. Claude, please update 93. 95. I think this is for Vanessa, so we can move on. For Ben, for Vanessa, for Greg and Donald. Question 100. Is a contract schedule upload needed for the first release? This is actually still a conversation to have with Greg and Vanessa, Ben and Vanessa and such. They've been asking some weird questions here. I think I'm just going to rename this and we can... Ben and Vanessa. I think also my meeting, I think when I cancelled the meeting on Tuesday I somehow cancelled the series so I need to remake that.

**Greg:** Oh okay, I didn't notice.

**Donald:** Okay, how an RVG base unit range is held. Should an RVG group hold its published base unit range, as well as the stated figure, or only the stated figure? Some RVG groups print a range of base units, for example H4 complex procedures is 10 to 12, and the anaesthetist chooses the exact value. With only the starting figure, the anaesthetist is free to change it. Holding the range as well would allow an opt out warning. So right now in the prototype, when you pick a procedure that has a range like this one here, it does kind of ask you to pick between this range, but can always be overwritten down here. So I would say something like that still seems appropriate to me.

**Greg:** You'd have to ask Ben.


### Invoice description hierarchy — Question 103

**Donald:** Which description goes on the invoice? Already settled. The invoice prints its own wording for each procedure, never the source text. Agreed in principle on 16th of October. The booking adds an invoice description copied from the contracts lines description if there's one, Ben's preference, otherwise from the bookings. procedure description. So my memory of this is that we'll get the raw text from a surgeon's room, but then the hospital system, in your words, would post an update generally the day before that has a more standard readable procedure name, and that's what we try to use for the invoice.

**Greg:** I think the way that's expressed is unhelpful. I think there is a The idea that if we get a better description, we'll use that one. So if the hospital provides an updated description, then we should use that. If a contract, if a specified procedure is identified in a contract, which is not necessarily or normally the case, then we can use that.

**Donald:** Maybe, you're right. Maybe it can't. Again, this might be something we still discover as we go to build, but maybe at this stage we can't actually be sure which is the best one. And so at the point where invoices are generated, maybe the admin staff have to pick a text from the possible available options.

**Greg:** Yes, We start with the surgeons' rooms booking, which is usually verbose and garbled, and we hope, and at the moment that's been printed, we hope that the hospital sends us something better.

**Donald:** Thank you. That's what I was going to say. I was like, can we rely on the hospital always doing that?

**Greg:** No, we can't. It depends on the hospital. Some do, some don't, it's my understanding. And then thirdly, if we have known procedures that are put in contracts such as the prepaid contracts, for instance, which have descriptions attached to them.

**Donald:** Yeah, this is like the fixed ones, you know.

**Greg:** then we could use that description.

**Donald:** That's a confidence. That's what we could be confident about. We have a contract in our system which is named from another provider that we can use.

**Greg:** So I would suggest that we set this up as a series of overriding defaults. So we start with the, we start with the surgeon's description, we replace it with the hospital description if we get one. And if we've got a contract description, we use that.

**Donald:** So our contract system can have a line, you know, so let me show you something here. This is our.

**Greg:** Then we put it in front of Ben and Vanessa and say, do you agree with this hierarchy of selection?

**Donald:** Yeah, totally, totally. So let's go to this project right here. So this is the discovery project that we use for time sheets and things. So in this project settings, there's a line. Where is it? Maybe I should go to an agreement. Let's go somewhere else. Let's go to. Yeah, let's go to our line. I could have described it better by the time I did this, but here we go. This is another company. So here is an agreement for some time materials. And when we go in here, there's a thing down here called description of invoice line item. So reactive support time materials for this period and expiry date. And so I would imagine that our contracts could have a line in here that if filled in, applies a description to the invoice.

**Greg:** That's right.

**Donald:** But if it is not there, then we kind of fall back to other things like you have just described.

**Greg:** So it's three layers and there's a priority.

**Donald:** Yeah. But I would say even then, if it falls back to whatever the surgeon has written, the admin staff may still want to override that with some free text.

**Greg:** absolutely. That stays with the rule that says the admins can change anything.

**Donald:** So there's even another line on top of that, which is that they can always edit it if they want to. It's editable. Okay. So let's ask a specific question. So what does the inventory say when an RVG code is picked? What that is, there's no contract, RVG, or the hospitals play an RVG contract. Do not agree that a patient should not receive an RVG group name like H1 minor procedures. Greg leaves the wording to the developers.

**Greg:** Well, it's got nothing to do with the RVG code. It's because the RVG code, the RVG code isn't in the selection hierarchy that would replace the surgeons.

**Donald:** Yeah, the surgeon description comes in and let's say it's something that is not common. And so they just say, hey, Anaesthesia Associates, just bill it how you need to bill it. And then, maybe there's no hospital thing. And so it falls back to our system to say, okay, you've selected the RVG no-contract. The anaesthetist.

**Greg:** The surgeon always writes what he's going to do.

**Donald:** Yes, it's right. That's right. So the surgeons got his scribble or whatever, or his, whatever it is. That's our baseline. Yeah. It's always there. And so, and then it can be overwritten by the AA staff if they need to. So yeah, okay, we've answered that. Which description do anaesthetists want in each case? They have not thought it through. Donald's idea that Greg backed when a hospital was billed used the hospital's own description. So yeah, so just what we said, that's a layer of hierarchy and stuff. And can the office edit? Yes, they can. Yep, they can. Okay, so that's question 103. Claude, please go ahead and update. 104, prepaid price when the contract changes before the procedure. Still to answer for better, Vanessa. Okay. When a fixed price changes after the patient has been prepaid. has been quoted, does the procedure keep the old price for new ones? Yeah, so we need to ask them. So this is the situation where I do a prepayment for my facelift on a Monday and then Merivale Plastics on a Tuesday send an updated list and on Wednesday I have the procedure done. Previously we had this established thing where We'd said that the price for a procedure is determined on the day the procedure is done. But if it's prepaid, what do you do then? So that's what this is asking about. Okay, moving on. Question 105. How a surgeon's fixed price agreement is found for a booking? A surgeon's agreement is a contract like any other. Still to answer, is a surgeon's fixed price agreement held by the surgeon or by their rooms? That decides whether it is offered on every booking with that surgeon or with any surgeons of those rooms.


### Surgeon agreements and contract filtering — Question 105

**Greg:** OK, the answer is it's I've checked with Vanessa. It's always the individual surgeon. We don't have arrangements with rooms.

**Donald:** OK, so if there's a collection of surgeons called Colombo surgeons.

**Greg:** Yes.

**Donald:** And they have six guys.

**Greg:** Potentially problematic in the long term about not supporting a grouping arrangement, but there isn't one. Okay. So in theory, if we had endless time and money, we'd build that, but it's not required.

**Donald:** Okay. So we're going to have contracts filtered down to surgeons, individual surgeons.

**Greg:** Yes, which is why we changed that field to practitioner ID so that we can identify the surgeon or the anaesthesia related to this procedure.

**Donald:** Sure. Okay. Is the surgeons fixed? so number one is to the individual surgeons. Two, where it is offered, does the office pick it by hand or does the system suggest it? So I would say that since we already know who the surgeon is going to be, we're going to filter the contract list to only show those surgeons slash hospital slash everything else that might be valid. Yeah. So we'd never show them. another surgeon's contract or another anaesthetist contract, but we might show other hospital contracts from that list because...

**Greg:** So we get a booking comes up. Yes. We need to search and we go through to see if we can find any matching contracts. So we're talking here about how an admin would navigate the contract selection list. decide what to put on to the booking, how to set up the booking. So we've always got the default contract there. There might be some hospital contracts there because we know who the contract is. And then we look to see if we've got any, it could be a plastic procedure, so there could be So we look to see if it's one of those.

**Donald:** So this here actually is the room, right? Like Merivale Plastics would submit a plastics list of fees for that entire office.

**Greg:** Well, Vanessa said she sets them up by the list. I agree with you, but I think that, you know, I can see that setting up a layer in there is going to be really complicated.

**Donald:** I guess what I'm hearing you say, Vanessa said, is that if Merivale Plastics today has 8 surgeons and they give you a list of 12, 14 things, they're doing 14 times 8.

**Greg:** Yeah, but the alternative is that we have to maintain a relationship between the models and the surgeons.

**Donald:** I think what I would probably be suggesting is that you would set up a single contract and attach it to multiple surgeons.

**Greg:** Yes, yeah, that would work.

**Donald:** Yeah. It's a Merivale Plastics contract as we name it. And that name is just a name. And then what does it show up against? You could be attaching it to multiple surgeons. We already keep all the surgeons.

**Greg:** You'd have to put another table in that design to just allow you to have many surgeons to a contract. You could do it.

**Donald:** Yeah. It's not a big deal. Okay. Claude, just to make sure you heard Greg, we think we want to try and support that and you may need to update. the database relationships to support it. So that's the surgeons. Okay, so it is held by the surgeons, but we want to make a single contract and attach it to many surgeons. And then where is it offered? Does the office pick up by hand or system suggest it? So at this stage, the system isn't really ever doing any suggesting. I don't think we've really got that in the spec at the moment. It doesn't suggest, but it does filter. Yes, it can filter everything, it can safely filter. And we probably need some sort of override button for any sort of situation where you want to remove that filter and just look at the whole rule list just in case. Weirdness. Okay, so that's question 105. Routing procedures as lines on no contracts. Should the first release load procedures as lines on no-contract RVG? The V6 document proposes it. So the office or anaesthetist can pick a predefined procedure instead of an RVG base code. Nick and Ben, via Greg, dismissed the idea and Donald wants to build without it. If lines go in, whether they carry any price is also open since the documents suggested. Not in the first release. Keep no contract line without any lines. Again, I don't know what the lines are talking about, but I think this is right, which is to say When you pick an RVG, no contract, there's no predefined base units, no predefined anything.


### No-contract RVG behaviour — Question 106

**Greg:** That's right. That's right. Basically, all it's doing is saying, bill the patient.

**Donald:** The patient will be billed or their guardian.

**Greg:** Yeah, when I say, yeah, I know.

**Donald:** Yeah, that's right. Yes. Bill the patient. Yeah. Okay.


### Booking integration priorities — Question 108

**Greg:** And that's. That is the contract performance. It's essential.

**Donald:** Yes, bare minimum. Yeah, Okay, so that's 106. 108. Which source starts a booking and which integration comes first? That's a question for Ben and Vanessa. Basically a repeat of the previous one. Claude, it might be nice if you could kill one of these and merge them into two.

**Greg:** Yes, I was there a question now saying we start somewhere else.

**Donald:** Yeah, that's 108. And then earlier we had. This one, 100 and 108, are asking the same thing, basically.

**Greg:** Yeah, sort of different.

**Donald:** Oh, you reckon?

**Greg:** Yeah, This is about your contract master lists.

**Donald:** Is a contract schedule uploaded needed for the first release?

**Greg:** And this one is still about your bookings, actually.

**Donald:** Oh, okay. Yeah, I see. Which integration goes first? Okay. Yep, you're right. Okay, St George's and Southern Cross integrated today and synced in the first release. Okay, that is a similar question. Okay.

**Greg:** I think we're going to find that, you know, I, it's kind of interesting, it's something that does vary. I know this is blowing in the wind a bit, but I think we're going to end up back with the sessions bookings being the initializing transaction, the one that released first.

**Donald:** Okay. I mean, or there's a version of this where you just have to do both, maybe. Okay, internal booking model, FHIR R4 or our own. Inside the system, are bookings held as FHIR R4 or in their own booking patient practitioner model with a translator for each source format. The RFP holds inbound bookings as FHIR. Our RFP response proposed our own canonical model, nothing has since been picked.


### Internal booking format: FHIR or canonical model

**Greg:** That's because I've always agreed with your response.

**Donald:** Okay. Yeah.

**Greg:** So it just made a lot more sense. It was a bit of design.

**Donald:** Okay. So at this stage, I guess the answer is the dev team will decide.


### Xero, internal financial records and anaesthetist payments — Question 111

**Greg:** Yes.

**Donald:** Dev team will decide the prototype should do whatever's easiest. The prototype doesn't need to be, doesn't need to bend over backwards to support FHIR if it's just really trying to display an experience. Okay, so paying an assist through Xero or from the new system. Yeah, I think there's a handful of questions related to this and I think it's getting a bit funny. Xero is not a ledger. It holds matching records and the business logic stays in the system. Trust payments to the anaesthetists made from the new system, the new system we're going to build together with the bank details on their profile.

**Greg:** Still, I don't agree with that.

**Donald:** The thing that's already settled?

**Greg:** Yeah. The intention was to pay the anaesthetists from Xero.

**Donald:** That makes sense to me.

**Greg:** Xero—if you want an elevator pitch—Xero does the banking in and out.

**Donald:** Our system creates all the entities in Xero and pairs them up so we can track them and see what's going on. Our system keeps an internal ledger of who we're going to take money from or get money from and who we're going to give money to.

**Greg:** Yes, which is not the same as our internal ledger.

**Donald:** What's the difference in that?

**Greg:** Well, the external ledger, we're really interested in who the billable party is and have they paid, right?

**Donald:** Yes.

**Greg:** Whereas in the internal ledger, it's the same list, right, but it's inverted to be anaesthetist-centric, whereas that list in Xero is patient-centric or customer centric. Because we're only interested in the billable party to the extent whether they paid or not.

**Donald:** I think both sides of the fence need to...

**Greg:** They have to balance.

**Donald:** No, They also have to have balance, but our system and Xero, I think they both equally care about making sure people got what they should be getting. Absolutely. Yeah, So our system, through our invoicing, booking, whatever system, no billing system, billing slash invoice system, engine in your words, It is going to create the pairs of receivable and payables in our system, and then create the same pair in Xero. One is a draft, one actually goes out, and then money comes in. It basically communicates with our system. It resolves and throws back over the fence to send the money out to the system. Yeah, so Xero does all of the payments. Our system is checking all of its work.

**Greg:** The reason why we need two systems is because Xero doesn't architecturally allow for these two perspectives of what's outstanding. So Xero, when you go to Xero and ask what's outstanding, it will give you the list of billable parties that haven't paid. When you go to.

**Donald:** Yeah, it's just got a whole bunch of work.

**Greg:** If you ask what's outstanding, it will give you a list of what anaesthetists haven't been paid. It's the same total figure, but it's a different part.

**Donald:** That's right. So our system is the system that we use to actually understand that data and scope it to different people and, you know, that sort of stuff.

**Greg:** It's anaesthetist-centric, right? Whereas Xero is patient-centric, if you like, patient-centric. And Xero can't handle both. If it could, we wouldn't need to do it.


### Anaesthetist list swaps and colleague availability — Question 113

**Donald:** Sure, okay. So this is question 111. And so I think that should make it clear from the reporting. 112, monthly AA fee invoice, end of month of the 20th. This is for the accountant, so we can move on. 113, unless it's moving their own list, are colleagues ordered by tier? I think we already said no. When the office moves the list, the colleagues are ordered by admin only tier and preference pairings, the availability finder and anaesthetist moving their own list sees no pairing warnings. Still to answer, when anaesthetist moves their own list or a single booking, are colleagues offered also ordered by tier? No, they don't see that. They just search for people who are free and available. Yeah. Okay.

**Greg:** I was going to say the system might not be true, given the way AA is going. That PHP bug's a beauty, isn't it?

**Donald:** Yeah, I haven't really looked into it, but yes, and the CA one, the certificate authority.

**Greg:** I haven't heard about that. What's that one?

**Donald:** I think. So the certificate authority got hacked, which means they can generate certificates that look and will be accepted. Yes, free by default, but also with an option two. Cool. Moving on to 114. Insurers accept direct claims flag. What is it for? Already settled. The selected contract decides who is billed, the billable, the holder's billable party, and when the holder pays AA itself, it's is billed setting. Otherwise, the payer named on the booking with the holder is billed. Okay, cool. Still to answer for Donald and Greg, what does the insurer accepts direct claims flag do now? Either A, it's the same thing as the holder is billed setting, so it's dropped, or B, it's the default that it pre-fills as billed on the new insurer contract, or C, the information only for the office.


### Insurers, contract holders and direct claims — Question 114

**Greg:** I think this goes back to one of those pages you put up at the beginning that seemed to talk about some sort of insurer's master list.

**Donald:** Yeah, so basically we know right now that nib is the only insurance company that AA bills directly.

**Greg:** Yes.

**Donald:** And I believe that insurance master list is a generic system for if there was ever more insurance companies that could be billed directly. So if we go to the board here, just search. Insurer master data. So admins maintain the insurer's master list. So this is user story 11.4.1. Each with an accepts direct claims flag where the insurer accepts direct claims. It is an insurer, it is a holder that AA invoices and holds one or more insurer held contracts governing how procedures build to it are priced. So that's what that is.

**Greg:** It's interesting. We do have to think about it. We talk about contract holder and that effect. See the contract holder is the hospital. The only contract holder that's an insurer is indeed. So this is distinguishing. It's saying there's an entity above contract holder or insurer.

**Donald:** My basic understanding of this is that on a contract there is a flag that you could say, just say, no, I guess on a contract when you pick who's going to be invoiced, is it the patient, is it the hospital, there's an option in there to pick an insurer. And if that's picked, then they're in date.

**Greg:** A contract is, I don't think there is at the moment. I think a contract is a child of a contract holder. We haven't really defined a contract holder as far as I'm aware and tend to work out what is this thing, a contract holder. And it would typically be a hospital, but it could be nib. I'm not sure that we recognize insurer as an entity in the model at the moment.

**Donald:** Okay.

**Greg:** So we've got this generic model that says there are contract holders, one of them happens to be an insurer.

**Donald:** What a pays AA hospital is wrong. Yeah, okay, there we go. That's represented.

**Greg:** Yeah, it's like that. But we haven't defined those entities beyond the holder. So can we, can we, do we need to is my question. Do they serve any useful purpose?

**Donald:** Sorry, I'm gonna rephrase the question to make sure I'm understanding it. So you're saying Is an insurer just another entity that you can select for who's going to take accept the bill? Or is it something bigger? Is that what you're asking?

**Greg:** Yes. So I'd like to rephrase your question. Yeah. If an insurer is just another form of contract holder. Yeah. If we bill them directly.

**Donald:** Yeah, that's.

**Greg:** If we're not billing them directly, we don't care.

**Donald:** Yes, exactly.

**Greg:** Are these the properties of the generic contract holder?

**Donald:** This sounds right to me.

**Greg:** We've got one instance of a contract holder that we want to send stuff to a portal. And all the other contract holders, we send.

**Donald:** Them, we e-mail them invoices. Again, to keep this really simple, these holders are a name and generally an e-mail address. We don't really have mail addresses, right, or faxes.

**Greg:** Well, there is a thing called a billable party, but it's the same thing.

**Donald:** Oh, that's what I meant, like the billable party, right? That's like that's a name and an e-mail address, right? Yeah. And so for these insurers, we could say that the billable party is a name, nib. And is it an e-mail address in terms of it's actually goes to an inbox somewhere and then somehow gets to a portal? Or is it some other sort of fancy integration that needs extra data?

**Greg:** I don't know how the portal works.

**Donald:** Yeah. So, but even if it was some other special integration, as far as our system, in terms of the front end user experience, the experience should just really be choose who the billable party is going to be and it's nib and the particulars need to be worked out.

**Greg:** Yeah, and potentially maybe how that billable party is transmitted the information. Is that a characteristic of the bill?


### Cancelled prepayments and trust account refunds — Question 115

**Donald:** Yeah, OK, so I think that answers 114. 115 cancelled payment refund from the system or through Xero. So Xero, as we established earlier, actually handles all of the money. Our system is just keeping track of it all. So when a prepayment is cancelled is the cash refund to the payer paid out from the new system or through Xero. So in a situation where So the prepayment sits in a trust account. I don't know how Xero touches that, but when a refund needs to be applied, potentially there's just like a pool of money that sits in Xero that it can pull from to do that refund. But then something else needs to trigger something from the trust account back into Xero.

**Greg:** There's only one trust. Xero is operating on the trust account.

**Donald:** Okay, it just has, it does that, it just controls that.

**Greg:** Yeah, there's only one account.

**Donald:** Okay, great.

**Greg:** So what there is, we've got all these anaesthetists sitting in Xero. We've got one there called AA prepayments. So there's an account of Xero called AA prepayments.

**Donald:** When you say that is, you mean there will be.

**Greg:** Yeah, and that account will have a balance, and the balance in that account will be, this is like a debtor. So all the money's in one bank account, and you can analyze it by the people. So that AA prepayments account will be where the money goes in and out of the prepayments through the trust account.


### Prepayment price overrides and mixed bookings — Question 116

**Donald:** Cool. Okay. That's 115 answered. 116, mixed bookings. Does the final invoice deduct a prepayment? So a prepaid procedure price is issued, is it's issued prepayment invoice and nothing more is calculated for it. No balance, invoice or credit. A really weird way to describe.

**Greg:** I'm just going to check this out. What is it doing?

**Donald:** So.

**Greg:** Prepaid issues an invoice. Yeah, that's it. Oh, hang on. Well, it issues an invoice. I'm not sure what the matter.

**Donald:** It's worded quite confusingly here. So statement after procedure.

**Greg:** Maybe we should help clean this up so it.

**Donald:** Doesn't go down on dark holes. We haven't actually read the story, but let's read it now. No automatic invoice or credit after a prepaid procedure. That's true. So once the list is authorized, a prepaid procedure is priced at the prepaid amount. The price on its issued prepayment invoice taken from the prepaid contracts line, normally then it's this own price list. The BTM units recorded on the day are for reference only, nothing is calculated against them. No invoice or credit note is raised automatically whether the work turned out to be more or less than expected. There is no threshold. Where one is needed, for example, because only half the work was done or the procedure took far longer, the anaesthetists or office may raise ad hoc additional invoices or credit notes by hand, using the abilities the system already has for any procedure. This is the build position until Ben answers whether a prepaid price can be changed, whether part of pre-made is credited. So some questions there.

**Greg:** So this conflicts with the last conversation we had, which was that in the timesheet, the investigators can change the prepaid amount on the timesheet.

**Donald:** When did we had that conversation? Earlier today.

**Greg:** No, the last meeting we had, we talked about that the prepaid If there's a prepay amount on the procedure, the surgeon may alter that.

**Donald:** The surgeon or an anaesthetist?

**Greg:** Sorry, the anaesthetist may alter that at that time of the procedure if he chooses to. And that would automatically trigger a refund of the difference or a bill for the difference.

**Donald:** Yes, so just to rephrase that, there are contracts in the system. that can belong to an anaesthetist and those contracts could allow or disallow a price override in a situation where...

**Greg:** Have we got a flag on that for that, have we?

**Donald:** Well, yeah, it's just a unique flag for all contracts, which is like basically a price override is allowed. So a [unclear: possibly "Christchurch Eye"] fixed-price contract is not a price override allowed because the price is what's already been pre-agreed. And so that just anaesthetists can't come in and just offer a discount charge more. Sure. So that system exists. And so if a patient has been prepaid for a procedure, a contract will be selected for that procedure. And you're, I believe, saying that in a situation where that contract happens to have a prepaid price and they are allowed to override the price for whatever reason, The BTM that may or may not be inputted because it's not mandatory aren't used for calculations. But if the anaesthetist does a price override, that should actually trigger something automatically.

**Greg:** It's got nothing to do with the BTM, but it should trigger something automatically.

**Donald:** Well, I just wanted to be very clear that the BTM could still be recorded on a fixed price contract with a price override. And it gets ignored. It's always just for historical if it's captioned. But if they do a price override, so they do a discount or they decide to make it more expensive, you're saying in that situation, it should be resolved automatically as opposed to an additional invoice.

**Greg:** That's what was in the previous work we've done relating to the data entry here.

**Donald:** Interesting. I'm not, I don't think you're, I'm not telling you you're wrong. I don't remember talking about that. I can see our system totally supporting this, but it feels like a, it feels a bit gross to me.

**Greg:** It's in the document I uploaded, the version two of the design document.

**Donald:** Version 2 or version 6? Whatever. The last version you sent me? Yeah, the last version you sent me.

**Greg:** I've been seen that.

**Donald:** I'll just say again, I think what you just described is a rule that is knowable enough that I've just described it and the system could do it.

**Greg:** Yes. And it's consistent with what we've said in other parts of the requirement.

**Donald:** Okay, so I'll just say that right now. I'll say it again so that the recording can get it. We are looking at... I guess this question here, I think. Nope, let's keep going. It was like 14 maybe. Nope. Nope, let's see this one. Yes, prepayments. So the system can set up any number of contracts or any number of situations that might be needed. We've generally talked about the fact that most fixed price contracts won't allow price override, but there's no reason to say that they couldn't be set up to allow it. And in a situation where it was set up to allow it, and a patient has been pre-invoiced for a procedure, and they pay it. And then they turn up on the day, and the anaesthetist is feeling like they need to make a judgement call and decide to apply a discount or an override, well, you know, more tire, you're saying in that situation, the system should pick it up and automatically invoice.

**Greg:** Yes, and I would expect all the needs of the specific contracts would be an example of this.

**Donald:** Okay. Okay, cool. I can't say whether or not that's right. And then to answer this specific question though, because you kind of answered a slightly different question. This is saying in a regular prepayment situation, regardless of any price overrides. So this is 116. This is describing that if I'm prepay, if I prepay for my facelift and then I have a procedure done and maybe there's another procedure on there, I get a wart removed, whatever, When I get my post-procedure invoice, do I see a line item for the prepayment at a cost of 0, right? Or, like, it's showing me the end to say it exists, but I don't need to pay anymore for it, or is it completely not visible in that invoice? That's what this is asking.

**Greg:** You don't get a post-procedure invoice.

**Donald:** If it's mixed, you do.

**Greg:** If it's mixed, you do. You need to check with Vanessa.

**Donald:** Okay. My understanding is you don't see it. Okay.

**Greg:** There's nothing to do.

**Donald:** Cool. Yeah, I could see it existing either way, really.

**Greg:** Yeah, we're neutral, right? We're just providing a mechanism.

**Donald:** Yep. Okay, that was the last unanswered question that you and I could do, I think.


### Prepayment accounting and reallocating anaesthetist payables

**Greg:** There's an interesting issue there that I'd just like to cover off in more detail about prepayments. So I left one of our previous meetings scratching my head about, okay, so how are we going to get Xero and everything else to actually manage a prepayment? Will we need a second bank account, right? The prepayments are not paid to the anaesthetist. So what are we going to do?

**Donald:** Do they come into the trust? Didn't we already figure this out?

**Greg:** Yeah, but everything in the trust belongs to someone. Like if money is put into the trust, it's held on behalf of an anaesthetist, right? And if money is sent out of the trust, it is paid to an anaesthetist. So every cent in the trust It's allocated to a party.

**Donald:** So when we send out a prepayment invoice, the receivable invoice goes directly to the patient to pay, and the payable invoice to the anaesthetist is drafted. So that money that is going to come in is already earmarked against somebody, and that earmark or that draft can change depending if the anaesthetist changes, but it is already attached to somebody.

**Greg:** And then what do we do if someone else does the procedure?

**Donald:** Yeah, I think that's already answered somewhere else in here, which is that if somebody else does the procedure, so more technically, if the anesthesis changed on a procedure in advance, then we reassign that draft payable to somebody else. or gets deleted and a new draft payable is created against the new anaesthetist. And we know that the rules are already that the anaesthetist, the new anaesthetist that picks it up by default honors the previous price.

**Greg:** Okay, that's fine. Yeah.

**Donald:** Okay, cool. I think that's all of our questions that you and I can answer, which is great. Recommendation proposed. Did we? That's for the accountant. Okay. Sweet. Do you want to take a break? Go to the bathroom.

**Greg:** I'll make a coffee.


### After the break: contract epic, catalogue and core concepts

**Donald:** Yeah, okay. Cool. I'll pause the recording. So another thing I did is I was marking everything you and I talked about as confirmed. And I always had this plan to update this, but I've changed the statuses to everything you and I did to agreed. And then confirmed will be when actually it's confirmed with AA themselves. And so we can look at everything that's been verified, which was open. Some of these actually basically are all synonymous. And so I probably would want to actually combine, you know, some of those down into something else. But anyway, if I just do this, we can see what we have done a little bit. So not too bad, but we, yeah, we need to kind of read over all this contract stuff unless you don't think we've agreed on this. It's just probably got some bad statuses.

But for today, we've got some time. Should we finally dig into contracts and get them all knocked out? Sure. Okay. 2 minutes ago, I was like, we should skip over this. But no, I think we should do it. We should do it. Yeah. Okay. So this is the epic for contracts, epic 4. A contract is a structure in the system that sets the rules for how a procedure on a booking is paid for and who pays. It's not necessarily a legal contract between AA or anybody. AA is the party at the centre, everyone else with an arrangement is a contract holder. An insurer, hospital surgeon or surgeon's room, an anaesthetist for their own price list. AA itself holds no contract, RVG. A contract is set up from a few settings, who's billed, whether anaesthetist can change its price, whether it's prepaid. Yes, yep, previously it wasn't that way, but yes, no contracts now defined if it's prepaid. And whether it belongs to one anaesthetist or surgeon. And we've said now, actually, that's one or many. And with them, it can express any arrangement AA needs. Typical arrangements. What is that? Is that another story?

Okay, we'll get to that, I guess. It stays 1 unit of how a procedure is priced and who is invoiced. AA manages contracts as master data and every procedure selects exactly one. Picking it sets how the procedure is priced. This replaces the RFP's separate step of resolving the billing route and looking up the governing contract. There can be as many contracts as AA needs. A contract decides who is billed, its holder, then the holder, its holder, then the holder pays AA itself. such as an insurer accepting direct claims. Otherwise, the payer named on the booking, the patient by default or a patient or guardian. Contracts are kept as dated versions, never backdated, never deleted. Contracts are staged, reviewed and then submitted. Staged and submit contract changes is another story. And whether an upload is in the first release is open as a contract schedule upload needed for the first release. When nobody has a special arrangement, the procedure is priced on a no-contract RVG, offered first sorted as a contract like any other held by AA.

This is so every procedure knows from one choice how it is priced and what rules apply to who gets the invoice. So that's the high level pitch. The first feature here, contract catalogue. The contract catalogue is where the office keeps every contract holder and every contract dated set of terms. Contract definition, okay, we'll get to that, I guess. We don't want to do that, we want to do this and this, okay, and there, nice. a header with its name, dates, and settings, and lines under it, and creates edits and versions and retires them. Does that sound right?

**Greg:** Contract catalog. Every contract holder and every contract. Yeah, that's fine. Yeah.

**Donald:** Contract screens are needed from the first release, so AA admin staff can define the rules for every agreement AA holds. Correct. So we've agreed on that. Typical contract arrangements. Huh. Feature request. Let's analyze this. User story has a table, but the violence board doesn't see.

**Greg:** Support display tables.

**Donald:** So it can. Cool. Okay. There are no kinds or categories of contracts. Each contract is set up from a few settings. Whether its holder is billed, whether the anaesthetist can change its pricing, a flag on each contract set by AA, not a global rule, whether they can is determined in this question, which should be answered next time we read it, whether it is prepaid. Hey, look at that table displayed. And whether it belongs to one anaesthetist or surgeon or many as we've determined now. Five arrangements cover most work. No contract RVG, the payer on the booking, the patient or the guardian. This is who pays. Based on the RVG times the anaesthetist own value, unit value. anaesthetist can change the price, yes. Prepaid, no. Now that's the default one. This is the common, but there's no reason why somebody couldn't set up an RVG that also, for whatever reason, is different. Yeah. OK, the cost of the hospitals on RVG, so based on RVG units, who pays the hospital? This is presumably the hospital then either invoices the patient or invoices the insurer, whatever. Yeah, cool. Anyway, we can understand those. Other accommodations can be set up for specific billing needs. For example, a contract at standard RVG pricing less a fixed discount. or one with a fixed rate. A contract stays one unit. A hospital can hold several contracts at the same time. Oh, sorry, for the same procedure. One bill to ACC and another to an insurer. Each a contract on its own. Surgeons arrangements are contracts like any other. The contract picker is a filtered contract list. Most insurer and hospital contracts, for example, Southern Cross serial contracts, are plain RVG contracts with no special prices billed to their holder. This keeps contracts as simple as the business is, who holds the agreement, what it sets, chosen by settings, not categories.

**Greg:** So there's no ecosystem of supporting tables here. It's just one simple table with some settings in it. Does everything.

**Donald:** Yeah.

**Greg:** Cool. Which is nice if we can get away with it.

**Donald:** Yep. Cool. Okay. Create, edit, retire contracts. Admins create, edit, create, edit version of retire contracts, including each anaesthetist's own price list contract, which the office enters from the price list the anaesthetist supplies. do not create or edit contracts in the app. Each contract has a start date and if needed an end date. And a review date. A review date, is that the one we've talked about?


### Contract review dates, audit history and versions

**Greg:** No, it's new.

**Donald:** Okay, we're reading 4.1.2. I think the concept of a review date is not a concept that any part of a system should support. So Claude, can you, when you read this transcript, make a note to just review all of the requirements and make sure this concept of review date is actually removed, unless you have a good reason to raise it up again as a question. A price review creates a new dated version of a contract rather than changing the old one. Is that correct?

**Greg:** I'm letting Claude work out the mechanics of how you version contracts.

**Donald:** I think that sounds all right to me. I think in the past when you described it, Again, with me not perfectly understanding the particulars of the database design you were proposing, I had interpreted what you had said to me as, if Christchurch Eye has new contracts coming in, you would, you know, the old contract would exist with an end date and then a whole new contract would exist with a start date. And then the way I was picturing it would be nice is if that contract was just the contract, but then within it, it would be price bands you could define. It's like time bands you could define to have a price. So you could see the history of the price as it changes. That might be the way my brain does it, but we can let Claude propose how it wants to do it. Because I'm coming at it from an experience angle primarily, and you've done a lot of thinking on the background, back end angle.

**Greg:** Yeah, I guess I'm sort of going to keep my brain into gear again thinking about what does a change to a contract actually represent. I mean for Christ HI it's as simple as the fact that it's a price change or it's an additional and it's an addition to a schedule. So those are quite simple. And they're probably mostly what's going to happen in terms of change of contracts. So yeah, let's just see how it's managed. Okay. It's not deleting anything. You should be able to show the history. Yes. Of like you should be able to go to Christchurch and see all the data prices for a given procedure. Yeah.

**Donald:** Okay. The office maintains a contract on one screen, the header, name, dates, and setting, with its lines below. In the V6 design, changes are staged, reviewed, and submitted as a new dated version. Stages submit contract changes, whether the view and upload are in the first release is still open, so yeah. This is so the schedule updates, for example, new rate taking effect on April 1st, can be applied cleanly. I don't think we really have any screenshots for, let's I guess, some ways of Outlook right now. Okay. Cool, I think you and I are agreed on this. Contract audit and versioning. The system keeps every version of a contract, not just the latest one. Every great update retirement of an RVG group. I don't know if we really have a sense of an RVG group anymore. A contract holder or a contract is audited, who, what, when, and each submitted contract change also records the lines added, altered, or removed with their values before and after. Nothing is deleted, a line left out of a new version stays on the earlier one.

**Greg:** Yeah, so it means you can do an incremental update.

**Donald:** Cool. This is so invoice raised under an older version can always be reproduced even after the contract has since changed. Again, I would say the way I imagined it is that even if for whatever reason the dates on a contract were removed or broken or irrevocably changed, I don't think any of that should affect whether or not You should be able to accurately recreate that PDF in the future.

**Greg:** I think that's actually redundant because you can recreate the PDF just from what's stored on the booking.

**Donald:** Yeah, I think the system should have some other way of just restore it. Yeah, keeping the, yeah, so anyway, this is 4.1.3, Claude, maybe just update the wording a little bit, but in essence we agree with this. Okay, 4.1.4. AA identifier for every contract. Every contract carries AA's own unique identifier alongside any holder codes, kept for reference on its contract lines. Each contract line also has a system line key generated and never reused, which keeps the line's identity across versions and the holder's own reference code where the holder supplies one unique within the contract.

**Greg:** So, when Christchurch Eye send us a contract list, they've got codes, but we're not using those as our primary.


### Contract reference codes and overlapping arrangements

**Donald:** That's right.

**Greg:** Reference.

**Donald:** Yep, that's right, that's.

**Greg:** Fine, and because possibly there's multiple versions of that contract. those codes that they give us might only be unique within our contract, not unique full stop.

**Donald:** Oh, you're right. So you're saying the 2025 one might have a code that is different to the 2026 one, even if it's still the exact same facelift contract?

**Greg:** The other way around, that they'll provide us will, it's probably.

**Donald:** Like the code, it sounds to me like the code is attached to the time band that was originally relevant.

**Greg:** Take a hospital, let's move away from contract I because it's a little bit limited in its application. Move to a hospital which has a procedure that it does and it may do that procedure as a DHB procedure or it may do it as an ACC procedure.

**Donald:** Sure.

**Greg:** The hospital has a code for that. Sure. Same procedure name, number, Two different contracts, two different prices.

**Donald:** So you're saying in their system it's represented by one thing, but on our system it's represented by multiple things? We don't really know exactly how it's represented on their side.

**Greg:** I'm just saying that they're going to give us two contracts which have the same item number in them that are current at the same time. One for ACC, one for DHB.

**Donald:** Yes.

**Greg:** So that we will hold two contracts in the system.

**Donald:** In our system, yeah.

**Greg:** With the same validity dates.

**Donald:** Yes.

**Greg:** That will have reference codes in them that are the same.

**Donald:** Okay, you're saying, okay, you're saying that the, yeah, okay, I can hear you. So I was saying that in a situation like, I don't know, yeah, Southern Cross or [unclear], I don't know really if it matters, that year to year the code may change even if it's for the same procedure. And you're saying a slightly different thing, still relevant, which is that. a hospital may reuse codes because that code is unique to the procedure, not that time band with which it exists. Which is to say, in our system, we have no validation to make sure codes are unique or anything like that. We just take what they give us and we attach it as we need to.

**Greg:** Should be unique within a contract, just to make sure it's not duplicated, but otherwise not.

**Donald:** Maybe not, right?

**Greg:** Within a valid contract.

**Donald:** I think it could be...

**Greg:** It's too hard.

**Donald:** Yeah, I think they could use the same code, because I was describing a situation. Again, just depending on how Claude decides to do this, I'm certainly anchoring it in some ideas here, but... If you have a single instance of a contract in our system and then below that or within that you have different lines or time bands with which have different prices valid, I'm saying each of those time bands could have a little field to the left of it for a code. A reference code. And I'm saying some years they could have different codes for the same procedure or they could use the same code forever because they just do that. And we don't know. It just has to be able to support it all.

**Greg:** Well, I guess one of those use cases is we don't care what the code is because it's not significant to us.

**Donald:** It's just something that maybe they could search on if they wanted to. When they have a grand old list of procedures, they might already have something on the upstream system that notes a code. And so you just type it into search to help you find something.

**Greg:** So why do I care question? The scenario I raised for that was If I have two, if I have a code repeated so that effectively if I say show me the valid procedures for this, show me the valid contract lines for this contract, I shouldn't see the same reference code twice.

**Donald:** Oh, so you're talking about, I was saying the same code from an upstream system could exist within one contract multiple times for different time bands?

**Greg:** It will.

**Donald:** It will, eventually. totally. But you're saying something which is that you couldn't use that same code in multiple different contracts on our system. And I'm saying... I'm not saying that. Okay, I'm not saying that. Okay, what are you saying?

**Greg:** I'm saying if I'm looking at one contract and I only filter for only the lines that are time valid.

**Donald:** Now, I shouldn't.

**Greg:** See a code twice.

**Donald:** Yes. No, I mean, I would say that on an edit screen, you see it all. But on a screen where you're selecting a contract, you wouldn't see multiple prices. You only see the price that's relevant to your current time.

**Greg:** And you shouldn't see two lines that have got the same reference code on it.

**Donald:** No, because you're only seeing one. Here's the contract and here's the price and maybe here's the code.

**Greg:** Yeah. So that's my only... The question is, do we want to... to tell the user that I've got a duplicate line in there.

**Donald:** I don't think so. I don't know. I don't think so. Okay. Cool. Okay. We are agreed. All right. Holder codes. I kept only for reference. AO. Yeah. Cool. Nice. This one's for the future. So I'll just quickly read it, but I think we've... Let's see. The office can load a contract's lines from a schedule in the AA template. row per line as well as editing them. The upload is for contracts only, not for other master data. So I guess this is the whole, can you update contracts via a PDF or schedule? And I think this is up for contention because of this open question here. And once that's answered, it can be changed. Yeah. Okay. Contract holders. The office keeps a record of every contract holder, the party a contract belongs to, an assurer, hospital, surgeon, or rooms. It's not really all rooms anymore. We're just saying it's only surgeons, but a contract, I mean, it can be attached to multiple surgeons. So we're reading 4.1.5, an anaesthetist for their own price list. AA holds a no contract. For each holder, it records whether the invoice, whether AA invoices the holder. If so, it's the billable party record required. One billable party may serve more than one holder, which is unusual. Required. One billed party may serve more than one holder. If not.


### Contract holders and billable parties

**Greg:** Yeah, that's right. The billable party might be the hospital, right? Okay. So there'll be dozens of contracts and they all have the same billable party.

**Donald:** Yeah, cool. Yeah. Okay. That doesn't sound unusual. Okay. that this is unusual. If not, the payer on the booking is billed. Yeah, so when I did the consistency review last week or earlier this week, I think that introduces new language between the contract holder and the billable party.

**Greg:** Correct. Yeah. That should be a distinction.

**Donald:** Yeah. So office keeps a record of every contract holder. This is people that can hold a contract, which is all these people. And then, so invoice is the holder. If not, if we're not billing a holder, then it's the billable party is the payer on the booking. So the patient essentially, but we say payer on the booking because it could be the guardian. Cool.

**Greg:** It's got, which is unusual. We're saying that it's not unusual.

**Donald:** It's not. Yeah. Claude, as you hear this conversation, please note down a requirement to update artifacts to make the distinction between these languages clear and maybe some sort of visual to help with it. Optionally, anesthesis or surgeon, optionally the anesthesis or surgeons its contracts belong to. So they are offered only on that patient's bookings. Yes. So I think that's what that's saying is that some contracts are set up so that they are filtered to a hospital. Others are set up to be filtered against something to destroy a surgeon. Yes. Yeah. So no contract is not filtered against anybody. So it shows up everywhere. There basically needs to be some filter settings on a contract. Yeah. This is because staff identify the holder early when narrowing the contract list, and it's the holder's record decides whether the holder or the payer on the booking is invoiced. OK.

**Greg:** That whole thing about. I think the. In order to identify the billable party, the admin has two pieces of information, and they're basically what they're doing is they're associating a contract with a book, and that's the human part, and that's what creates who the billable party becomes, because it's defined in the contract. Okay, it's something that Ben isn't quite good in his head, I think. as to how the mechanics of that works. So a booking comes in and it needs a human to go, okay, what's the booking? Is this?

**Donald:** Yes.

**Greg:** And then they find a contract that actually matches.

**Donald:** Matches. Or make one to serve it. Make one to serve. Yep. Okay. Moving on to 416, stage contract changes for review.


### Possible automation and importing contract schedules

**Greg:** That's the bit I think we could have put some AI in because when we've got some history, there'll be patterns there, which 99% of them will be a pattern. But we can add it as a feature down the road somewhere once we've got some.

**Donald:** Yeah, so you're describing that, and maybe we record this as a future requirement, but you're saying that you can imagine two years from now, we've got two years of good data from AA, maybe even one year is enough. where we have done, what, 40,000 different procedures in a year. And so there should be enough data in there to see when this surgeon or hospital submits this contract and it's got this plain text description of what the procedure is going to be. We know that nine times out of 10, whatever, or 100% of the time, it always ends up being this particular contract.

**Greg:** So we should be able to suggest a match at that point.

**Donald:** Yeah. Okay. Reading 4.6. 4.1.6. Stage contract change for review then submit. The office maintains one contract at a time on a screen with its holder name, date setting and lines below. Edits on screen and uploads are not applied straight away. They are staged and shown on a review dashboard for that contract. The office reviews them, sets the date and change takes effect and submits. On submit, the system creates a new dated version and records what changed. One line fix follows the same path.

**Greg:** So I'm imagining that there's going to be a contract maintenance screen that's effectively completely, it has an on-screen edit mode that lets you do anything you need to do with contract holders, global parties, contract clients and so on. And one of the things that could be part of that screen is that they could upload a list, otherwise they just type it in my hand.

**Donald:** Yeah, I think there's still this open question as well. And I think both this story and the one below, they're both trying to answer the same thing.

**Greg:** One does it manually.

**Donald:** Yeah, and so.

**Greg:** The other one just still means that process.

**Donald:** When we had that wonderful conversation the other week around all of this stuff. Memorable. Very memorable. You were suggesting, hey, let's put it in a spreadsheet. They can all look at it and then it's uploaded and it's live in essence. And I was suggesting, well, there's already going to be an edit screen in the system. And I think somewhere between the transcripts of all those conversations, it's somehow landed on this, which is actually the more expensive version than what you were suggesting. as being accepted and I think I would suggest that we do one or the other and your suggestion from last week which is basically hey we're going to have a process that is managed in the office where they can upload a spreadsheet of changes and it allows them to do any number of reviews themselves before they do it that feels to me like a cheaper way than what is this story is describing, which is a whole robust set of UI UX to do the same thing. And so I don't think I necessarily agree like this story is should be accepted. I really should just edit it.

**Greg:** Hang on. This is this is I don't think it's our job to work out what we think should be in or out.

**Donald:** I think I agree. I agree.

**Greg:** Just put them in here and they should be priced and then David can have a conversation with Ben and Nick and go, if you want this, it's going to cost that extra.

**Donald:** Totally.

**Greg:** And they can say, no, we want that.

**Donald:** Yeah, it is a whole negotiation. But I'm saying is, I think this should sit in the same category as, or same swim lane as the other one to say, we don't know which of these is going to be, we don't know which of these is going to be in, but we know at least one of them needs to be. There needs to be some way everyone seems to be aligned on that. some safety mechanism to make a bunch of changes at once and review them together and accept them.

**Greg:** And I think putting it down there is a problem because the system actually isn't able to run without something in the top. So you haven't provided any viable solution.


### Contract definition and allowable pricing methods

**Donald:** Okay, I'll put them both up here and mark them both as open or proposed, proposed, sure. But both of them kind of rely on that conversation with Ben and Vanessa. Yeah. Okay, cool. Let's move on to contract definition. A contract is a dated set of terms held by one contract holder. Its header, its name, date, settings, and lines, lines set the terms for a group of procedures, for example cataracts, and carries only what it sets. I don't really like what it's saying here. I don't think it sounds right. Tell me if I'm wrong. Sets the term for a group of procedures. We don't really have any group of procedures, right? So this is feature 4.2.

**Greg:** It should say. If it's for a procedure. Well, no, it's not a name.

**Donald:** In the background, each one of these contracts is just a unique code of. AA1234, right? And then it has given, it's been given a human written name to say what the contract is about. And then it's got a handful of settings that define how it works.

**Greg:** So far we're good. That's what it does.

**Donald:** Yes. And so our system has no concept of group these things together. You may filter the contract list when you're searching for stuff. and you would see all of a particular type of contract sitting next to each other, but that's not a group of procedures all related to it. Yeah, there's no problem. Good, So that feature 4.2 needs to be updated to reflect the reality that it's not really.

**Greg:** It's a single procedure.

**Donald:** Yeah.

**Greg:** Wouldn't you agree?

**Donald:** I do agree. Contracts are singular and carries only what it sets. This is true, fixed price, a rate, a discount. These are optional.

**Greg:** Contract line defines A singular procedure. The contract is a set of lines.

**Donald:** I'll agree with you because I still haven't dropped that for whatever reason, but I think we align on what it ultimately ends up looking like.

**Greg:** Well, for instance, you take the simple one-page schedule from Christchurch, right? If you hold a piece of paper in hand, that's the contract. yes but there are two two parts to the contract there's the header information which is once which is its start date and its end date and and the fact that it's from Christchurch Eye but and then under that there are there's a schedule of prices those are the contract lines

**Donald:** sure okay so if I was to translate that you have Merivale Plastics facelift is a contract. Yes. And within that, there's a whole bunch of settings that apply to the entire contract. Yes. And then you can imagine another little table or a set of rows that have time bands with different times and prices attached.

**Greg:** Yes.

**Donald:** Yeah, cool, we're aligned. That's it. Yeah, okay. So it says here, carries only what it sets. All of these are optional, it obviously doesn't have to have any or all of these. has to have one or something, like it probably needs to have at least be an RVG or be a fixed price.

**Greg:** Well, no, because the next sentence says the contract may have no lines. And that's kind of interesting because what it carries is, what it effectively has is a reference code. The contract is a reference code and the hospital may just want that reference code on the invoice.

**Donald:** But it has no information about how it's paid for.

**Greg:** Well, it's an RVG contract.

**Donald:** That's right. That's what I'm saying. It either needs to be.

**Greg:** It's a billable party is the hospital.

**Donald:** That's fine. I'm just saying that it could optionally have a rate, a discount. Base or modifier units are gone.

**Greg:** Well, it would need a line for that, right? It may not have a line.

**Donald:** Okay.

**Greg:** It may just be the header that says, here's a contract for for ACC procedures and we want you to use this code on those invoices, right? And that's an RVG contract.

**Donald:** It's the part of the end there which I'm being specific about, which is that there are a handful of options on a contract which are optional, like rate or discount or can it have a price override? Those are all options, but it needs to at least have a fixed price or RVG be selected. contracts answer two things, who are you paying and how are they getting paid or how you're billing, whatever. Right. So I'm just saying

**Greg:** my answer to that question is if there are no lines,

**Donald:** it becomes RVG by default.

**Greg:** There's no fixed price.

**Donald:** Sure. I just think you can't have both. So it needs to be like an either or radio in my head. It's like, is this going to be RVG pricing at which point, you know, the anaesthetist is forced to pick an RVG code. and then fill everything in, or is it a fixed price, in which case they aren't forced to pick an RVG code and all that stuff is optional. So that's what I'm saying. Those are either or, the rest are optional.

**Greg:** The logic of defining that is, are there any lines on this contract?

**Donald:** Sure. How it works in the background, I don't mind, but I'm just thinking about the front end. That's how it determines. Okay. A contract may have no lines at all, such as hustle. That's what you've just said. Cool. AA deals with many different pricing arrangements across hospitals, surgeons, surgeons groups and insurers. So the contracts need one consistent reusable structure that covers all of them. See domain model.md for the narrative model. That's a document that's been kind of maintained along the way. Okay, that's the feature. Contract, so now we're user story 4.2.1. Contract holder, who's billed and where it applies. Every contract belongs to one contract holder. Insurer, hospital surgeon or surgeon's rooms. So now we're saying surgeon's rooms don't exist, it's just a surgeon and a contract can be applied to multiple surgeons and then an anaesthetist for their own price list. And I would say that an anaesthetist contract cannot be applied to multiple anaesthetists because I was thinking about this earlier. I didn't voice it. Our system could just allow them to do it if they want. But then its system is allowing them to do something which is price fixing, which they're not meant to be doing. As I would say. So it's permissive. So you think we should just allow them to do it? Okay, that's fine. Of course we're not. Yeah, fair enough. Fair enough.

**Greg:** I think we're not distinguishing a surgeon from an in terms of it's a it's a practitioner contract. Yeah.

**Donald:** Yeah, okay. Practitioner contract is a good term there. They're two different sets of practitioners.

**Greg:** Yes, they are. One's internal, one's external.

**Donald:** Yeah, because like.

**Greg:** Yeah, that's right.

**Donald:** And I don't know if there's a reason to do this, but in theory they could apply, they could filter on both. Could you have a contract that's just between you and me? You're the surgeon, I'm the anaesthetist. And it only shows up when both of those are true. Again, I don't know enough information to know whether or not such a thing exists. Mates rates, but maybe. Yeah. So anyway, they're separate lists of surgeons and anaesthetists. Both of them are practitioners. So practitioner filters, whatever. Yeah. Okay. A contract decides who is billed, its holder when the holder pays AA itself, an insurer accepting direct claims or a hospital. Or the payer named on the booking.

**Greg:** So I'm assuming that's when the billable party is null, then it just goes to the payer.

**Donald:** There's no billable party nominated. And the contract holder is null?

**Greg:** No.

**Donald:** Our system's...

**Greg:** The no contract contract. Yes.

**Donald:** Yeah, so our system, I'm sensing, you know, as we're putting the picture together together. is going is has an address book of people who can hold a contract. Yeah so that's the contract holders as determined here in the language we talked about earlier and in the and so when a contract is set up you pick you can pick a contract holder and if you don't then the contract holder falls back to the payer's name on the booking.

**Greg:** I've been thrashing around about whether the contract holder is always the billable party, because if they are, then you don't need a billable party entity. It's just the billable, the billing details on the contract holder. Is that gonna work? It might work. Might not need billable party.

**Donald:** I mean, might be redundant. I would...

**Greg:** Don't we let the developers sort that out?

**Donald:** Yeah, And as a front end way of doing this, I would imagine that in that quote unquote address book, you would have some dynamic entity or whatever that is just the, you know, the patient or the payer named on the booking. Yeah. Okay. When the holder only sets the price, a surgeon's fixed fee agreement and an SSO list and no-contract RVG. Those are examples of what it could be, but not what it has to be, because that system allows for many different things. There can be as many contracts as it needs. When a contract applies, where a contract applies is the context that narrows the contract list for every user, admin, anaesthetist alike. The hospital's list, the surgeon, not surgeon's rooms, it needs to be updated, Claude, anaesthetist or surgeon. a contract belongs to, such as a contract is offered and only on that person's booking. Okay. This is so each contract, both price and procedure, settles who the invoice and every, who receives the invoice and every user sees only the contracts relevant to the booking. I think that's right. Okay. Let's go back to this and mark it as agreed. Agreed. Okay, cool. Contract pricing terms 4.2.2. A contract line can set how its procedures are priced. Fixed price, BTMs are not needed. A rate is used to say that they need to own a discount, a percentage off the calculated price, or base modify units on its own. So we're saying no, right? No, I guess it's saying RVG, not that a contractor finds base units or modifiers, just that they need to be used.

**Greg:** Yes, so it's probably better to, yes, I agree. An RVG method is one of the options for how.

**Donald:** Yeah, it's a better way of describing it. With none of these on a contract or no lines, the price is BTMs multiply units times this own rate. Sure, that's the RVG. So actually, I'm going to remove the RVG units here because I think it was previously trying to communicate an idea that contracts could hold predetermined base units or modifiers. And what we're saying now is that in the situation when a contract does not, a contract is not defining, let's put it another way, when a contract defines that an RVG is being used, then an admin or an anaesthetist needs to pick an RVG code and that code will determine a base unit or maybe a range of base units.

**Greg:** I think another bullet there is valid underway. It says a contract line can set how its procedures priced. So it is effectively saying that it can use an RVG approach. I think for completeness we should put that in.

**Donald:** Okay.

**Greg:** But if you say, rather than just saying RVG, which might imply to putting the units in, it's just using the RVG approach here. That's the other style of pricing. Okay. I think that works. And that then is your comprehensive list of the ways in which you can price them. That's cool.

**Donald:** Each contract carries a flag set by AA that says whether it may change the price, its pricing, price rate discount. I've been calling that price override. It is a flag on each contract, not a global rule. Typically allows Typically it allows this on contracts priced from RVG units and not on a hospital's own fixed price contract, although our system is permissive, where they also cannot hold a discount. Where the flag does not allow it, the anaesthetist cannot change the price. They change the contract, which may change who is billed or asked the office. The office can change any price and the last change stands. So this one here, we haven't got to reading it yet, so I won't jump ahead. We agree, yeah, I think we did agree that, right, that just because an AA admin can actually just put any sort of price override on top of anything else, even if it's a fixed price. Yeah, okay, because they need to be able to.

**Greg:** Lock that down if it gets too loose later. Yeah, in the first instance, that'll be the only way they can fix problems before the invoice goes out.

**Donald:** Yeah, okay. A contract can also name reference holders, so name references its holders need on its invoices, such as an insurance member number or a holder's own reference, for example, SXAP, which go on the invoice. This is the code I think we were talking about before.

**Greg:** Not to be confused with what's on the procedure, because it doesn't know. Now this is that SXAP there, which actually ironically will probably be used on the booking with a different meaning, that is about the fact that this whole contract is a Southern Cross contract. It's distinct from the booking which details the insurance particulars of the patient.

**Donald:** Yeah, contract can also name references its holder needs on its invoices.

**Greg:** Yeah, so the hospital will have, this is the reference code I was talking about, that this might be the only thing the hospital wants and there's nothing else on the contract, right? So they might, it's effectively a bucket for them. They want to put it in that bucket. It's the contract holder's reference.

**Donald:** Yeah, so the contract holder's own reference, that's fine. We've talked about that, right? That's all the codes we've talked about earlier on today. It's this part here that is new to me, such as an insurance member number.

**Greg:** No, that's not right.

**Donald:** Yeah, that's the part that I'm getting tripped up on. So I'm going to delete that.

**Greg:** Yeah. And that reads properly to me now.

**Donald:** Yeah, cool. Okay. This is so that every procedure that selects a given contract is billed the same way. Cool. Okay, contract lines, 4.2.4. Admins, enter a contract's lines. Each line sets the terms for a group of procedures, such as cataracts, facelift, plus one, and carries only what it sets. This group of procedures, where the hell did this come from?

**Greg:** Well, it could be a class of procedures, because that's how the RVG works.

**Donald:** But we're not. Despite the previous attempts, we are not linking any, because actually you and I haven't talked about it in a while. I think we should.


### Contract line descriptions and calculation settings

**Greg:** Keep the case simple for a procedure. Yeah, I do agree. The group thing is going to introduce all sorts of confusion.

**Donald:** Admins enter contract lines. Each line sets terms for just a procedure.

**Greg:** Let's keep it simple. Because it doesn't make any difference to how it's built. It's just, it's just words.

**Donald:** For example, cataracts or facelift plus one add-on and carries only what it sets.

**Greg:** I think that's trying to say that it's sparse. There's a whole lot of data fields in it which can be sparsely populated, right?

**Donald:** Okay.

**Greg:** Like a price might be blank, discount might be.

**Donald:** Yes, Okay, you're fine with this? Yeah, I'm fine. A description which becomes the procedures starting invoice description in place of the booking description.

**Greg:** I think we should take the word starting out.

**Donald:** Sorry.

**Greg:** The bookings description is the starting invoice description. And it effectively this becomes, if it's there, it becomes the description.

**Donald:** Sorry, where is that? The bookings description. A description becomes the procedure's starting invoice. So what am I getting rid of?

**Greg:** It's item.

**Donald:** Okay.

**Greg:** Because the booking is the starting description.

**Donald:** Yeah, a description which becomes the procedure's invoice description. Yes, okay, sorry, yep, okay, I'm with you now. In place of the booking's description where the line is chosen, yes, okay, I'm with it now, and can be edited. Yep, so we talked about that earlier in this conversation. The holder's own reference code, optional and unique within the contract. Did we talk about that before? Not unique within the contract. So 4.2.4, we're still on this. Claude, we're saying that none of these additional codes have any sort of validation or uniqueness that need to be applied.

**Greg:** Did we talk about the duplicate line? We just leave the code.

**Donald:** What do you mean?

**Greg:** Not wanting to see that line duplicated.

**Donald:** We talked about that in our conversation, which is to say that on an admin screen, all of these things are visible. But on a front end, when you're selecting something, you would only ever see the code relevant to the time band you care about. Yeah, absolutely. Yeah. OK. Leap for the contract, kept for reference and searchable and picking a contract, which we just talked about. A default RVG optional. So yeah, this is something I was going to say I've talked about a few times, which is that you could pick an RVG and filter down the contracts or the other way around. And I think I mostly think we should abandon that notion now. Well, I was trying to...

**Greg:** I don't think so.

**Donald:** Oh, really?

**Greg:** No, I don't think so. I think something like the...

**Donald:** You got two lists, and if you select something in list A, it could help filter list B, and vice versa, if you select list something in list B, it could help filter that list A. You think that's good?

**Greg:** No, I think that a contract line might be set up as an RVG procedure, but it has a known RVG association. Why wouldn't you put that in if you know it? Ben just wants to make it not mandatory.

**Donald:** Sure. So, OK, so an option, it's optional. OK.

**Greg:** So Ben's saying some random booking comes in, Vanessa wouldn't know what the hell that is. But on the other hand, if you're setting up contract lines, I know this is consuming contract lines, but if you're setting up contract lines.

**Donald:** And you always know, it's really clear, this is always for this RVG.

**Greg:** You're going to plonk that in.

**Donald:** Great, I love it.

**Greg:** That's another AI thing that we're going to get better and better at.

**Donald:** Yes, OK, cool.

**Greg:** OK, and we're only talking about base units. So it would be the RVG base units, right?

**Donald:** I'm not even talking about pre-filling the base units. Well, but I'm just saying you, that's a little bit separate, right? You pick the RVG code and the RVG code itself could have, you know, has a base unit. Yeah, OK. It fills the procedures RVG code where the line is picked and lets you search by RVG code to find the line. The terms it sets are fixed price held excluding GST rate. a rate, a discount, and then here, based on modifier units, no.

**Greg:** So we got price discount rates, we got those three in there.

**Donald:** Where were we? Yeah, right here. Term set, fixed price, oh wait, terms and sets. We read that earlier up here. This is everything that is set.

**Greg:** I think if you're gonna specify them, you should always put all three, otherwise you should just put pricing fields.

**Donald:** Yeah, it's, I think it was doing a little bit of a summary of what's previously been determined. Yeah, Okay. Each line also has a system line key, never reused, which keeps its identity when a new version copies it.

**Greg:** How can that be?

**Donald:** A blank means the line does not set that value 0 as a value. What's this one about?

**Greg:** Actually, it's confusing two things here: a blank, we talked about it was look through, right? It's talking about the pricing fields being sparse. Sure, it's a completely different conversation from the first part, which is that each line has a unique system. It has a unique line ID.

**Donald:** Should I just remove that?

**Greg:** Yeah, I think so.

**Donald:** Okay, cool. Lines stand alone, they do not nest, and several lines may share an RVG code. A contract may have no lines at all, such as hospitals plan RVG contract. Lines are not only for fixed fee schedules. An agreed rate or discount contract has lines too.

**Greg:** Yeah, well, the only way you can put an agreed rate or discount then is to have a line.

**Donald:** Yeah, I imagine that once some draft of all of this is built out and I see what it looks like on the front end, I don't really care about the back end. That might make all this clear to me.

**Greg:** You know, the government announced another 300 million of private practice procedures. It was giving trying to reduce its waiting lists, so it gave $300 million worth of DHB contracts to private providers.

**Donald:** I didn't see that.


### Time-based fees, price overrides and date ranges

**Greg:** So part of that is that DHB has negotiated that the procedures will be done at a discount. There's actually a discount in those contracts.

**Donald:** Sure.

**Greg:** Which is insane, because she's pretty gross. Don't worry about that. It is insane. So it's just really bureaucratic, naive. But there's an example where you might have Southern Cross holding a DHB contract, and the thing about that contract is that it's all aligned to discount.

**Donald:** Sure.

**Greg:** I don't know, how would we do that.

**Donald:** Well, in that situation, you know, I heard the conversation that night that Ben or Nick said that they would just increase the units. But that's the system is permissive, but if for whatever reason all these organisations make an agreement to say they couldn't do that, at that point it's there's no price override, it's a fixed price, or oh no, I guess it's no, I'm conflating things, even if it's it would be RVG and yeah, they could just add more units. Yeah, they could add more units. They couldn't add more time, they could add more base units.

**Greg:** Or they could change their rate.

**Donald:** They probably wouldn't be changing the rate for a single procedure. Let's not, let's remove that from the transcript. We don't want to dig into that.

**Greg:** Sounds like Harley Norman.

**Donald:** Okay. A line has no time band, add on flag or quality role. A time is only an optional recording by an anaesthetist. That's what it means by time band, as in like time units. Add on flag or quantity rule. The time is only an optional recording by this. Is the time band dropped in the contract lines? I don't fully know what this is saying because you and I have agreed that beneath a contract you would see a handful of different time bands that have prices applied to them.

**Greg:** You were using the term time band to talk about versioning of the lines, right?

**Donald:** Not necessarily versioning because you could have I could submit to say between July 25 and July 26. This is the price list of all of our things. And then within that same, they may then iterate on that the next week and say, here's a version two of that same thing, but the same time bands. And so that's what I would imagine a version would be. I'm not saying versioning. I'm saying they say, here's our 25 to 25 price list. Put it in your system. And then six months later in advance, they might say, here's our 26, 27 price list. And so you could put that into the system and it would know to only apply the right price based on the day the procedure was done. Absolutely.

**Greg:** I've been calling that date range. You're calling it time.

**Donald:** Okay, we're aligned though. Yeah. So date range, yeah. So this, but what is this talking about? A line has no time band and on flag quantity rule.

**Greg:** Well, if it, I mean, it's right if the contract has the time band, right? Because a contract specifies the validity dates.

**Donald:** Look at this. As far as we understand contracts and contracts, I don't have any concept of a time band. I keep saying time band. Time is an optional recording by the anaesthetist. So, okay, Claude, I'm sorry for everything I've said in this transcript. We're talking about a date range for prices on contracts or perhaps contract lines here. And when this question here, 4.2.4 talks about a time band, this is talking about a predefined time period for a procedure. But no contracts pre-suppose how long it's going to take.

**Greg:** No, they don't.

**Donald:** That's right. If it's a fixed cost, it's a fixed cost. And if they want to add additional invoices, those are things they have to deal with. But just like we don't pre-apply modifiers for the most part, we believe, we also definitely not pre-assuming any time bands. Okay, so I think that's what this is saying here. Time is an optional recording by the nesters. This is so every contract states its terms and one system shape, whatever the arrangement it records. Okay, there was a slog, but we got there and we agreed. Next, invoice presentation and it's cold, eh?

**Greg:** It's on cool node. Just turn it off.

**Donald:** Just a moment. Our box manager keeps moving about things. They have to all be edited together. I'm just going to check some of them.

**Greg:** Okay.

**Donald:** Thank you. Yeah, the other is set to 22, so I'll put this back up. And yeah, I'll turn it off for a minute, I guess.

**Greg:** Thanks. I'm slowly freezing the deck over here.

**Donald:** Okay. Invoice presentation and delivery. 4.2.8, admins can set how a contract invoice look and how they are delivered. The invoice layout, hospital or holder or patient, two are very similar. The hospital carriers, the BTM breakdown, a couple more fields for the hospital can cross match patients, does not. The delivery method, e-mail portal upload for the direct insurer. Again, we don't really know what the portal upload looks like for now, technical detail. GST treatment, the Holders reference for the contract, for example, printed on the invoice. This is so every invoice raised under a contract is laid out, delivered in tax in the same way without the office needing to do stuff. So I believe this exists. We actually don't have any of the particulars other than what's described here, but our system will have some way to select some sort of and create different sets of invoice templates.

**Greg:** We only need, as far as we know, we only need 2 templates.

**Donald:** Cool. That's nice. Agreed, cool. Contract prices effective from date. Each contract is kept as a series of dated versions and every change, correction or renewal creates a new version from a date the office chooses. Is that right?


### Dated contract versions versus individual dated prices

**Greg:** Yep, that's it, the from date.

**Donald:** So I've this sounds a little bit different to me. Each contract keeps a series is kept as a series of data versions. I would say that each contract has some what was the term used before? Date range. Each contract has date ranges within it that state a single date range. You wouldn't want you can't date range can date ranges can never overlap. No, they can't overlap. But it can have multiple date ranges for different time periods or date ranges, yeah.

**Greg:** Yes. Yeah. I guess I'm just thinking about the concept of each contract. That's where I've been using the word version. I'm associating the concept of a version with the contract. the instance of the contract for a particular date range.

**Donald:** Time for the whiteboard. So this is what we were talking about a little bit earlier, that what you just described just now is similar to what you described the other day. And I interpreted that as in the big list of contracts, you would have a Christchurch Eye contract that was for Jan 1, 25, 2, December 25, remember, 30th, 25. And when a new one was needed to be made, you would make a whole new contract. Whereas the way I've described it is that you would have...

**Greg:** Yeah, I've gone off that idea, by the way. I don't think it's going to work. Yeah. Full replacement's never going to work.

**Donald:** Totally. So in my view, there's one instance of this particular procedure, whatever it is, and you would see this date range to this date range, and then this price. Whatever, right? And then you have this rate range, this date range, and this price, then there'd be different code.

**Greg:** The problem with what you're drawing there is that it breaks the conceptual model of the contract having children. So that thing on the right is contract line, right?

**Donald:** Each one of these is a line.

**Greg:** Yes.

**Donald:** Yeah, cool. And so what I was describing earlier is that these time date ranges, date ranges have different prices, but the contract as a whole has the settings of fixed versus RVG versus discount allowed. versus fixed rate?

**Greg:** Okay, so let's say that's, I'm not sure why we're in column two here, but let's say that's the contract as it stands today, and then tomorrow we put in another one starting on the 1st of January 27. Was that 25, 26?

**Donald:** Yeah, so I would say, the reason these are different is that And the way I interpreted it, this may not be what you're trying to say, but the way I interpreted what you're saying is that you would deliberately make a new contract in the system for every date range.

**Greg:** And all its children would comply with that.

**Donald:** What are their children?

**Greg:** The lines.

**Donald:** I still don't know what a line is, it just makes all this hard. And what I was picturing is that you have one conceptual concept of a contract, whatever this i such symbol represents. You've got all your settings within it and then each date range defines a price.

**Greg:** Yes, I'm with you.

**Donald:** Yeah, cool. And I guess in a situation where we're doing a bulk change to prices, if this same date range here got updated, then literally it just gets updated. Whereas if a new date range is given with a new price, then it's a new line.

**Greg:** Yeah, there'll be I imagine we'll get Christchurch Eye... It's nice because it's discrete, but it's messy because of their own procedure process of the fact that they are constantly fiddling. But keeping it simple, we get a contract from Christchurch Eye for the year. And then we get a contract and a nice clean will. We then get another contract from Christchurch Eye for the next year. So we've got the 26th contract and they've now sent us the 27th contract.

**Donald:** Totally, totally.

**Greg:** So the 27th contract will have some new lines, some existing lines that have got different prices on them and it will have some lines removed.

**Donald:** Yes, I see what you're saying. So when you're saying they give us a price list of all these different prices. And between one year and another, some prices will be the same, some new procedures will be added, or new contracts, and some will be removed. New contracts, new procedures. New procedures, okay. New procedures will be added or removed. Thank you. And then in our system, that would mean that some things stay the same, some things are updated, some things are changed. Yeah, okay. I actually need to go to the bathroom again, I'm afraid. It's all right. I'm okay. Each contract, 4.2.10. Each contract is kept as a series of dated versions and every change, correction or renewal creates a new version from the dated office, date the office chooses. So again, based on our image and what we've talked about here, we're not actually creating a whole new version, which would be the left column. We're creating a new time band within a contract. Sorry, not time band, date range within a contract to say what's particulars apply just to that date range. Could be a different code, certainly would be a different price. Yeah. So I think 4.2.10 needs to be updated a little bit to reflect that. date is no default. It is never in the past. Nothing is backdated and nothing is deleted. Does that sound right to you?

**Greg:** And we can't back date a contract from today. That's true. We haven't said anything there about overlapping dates, have it? Only one set of, only one date range can be valid at every one moment in time, can't it?

**Donald:** Only one date range. Yes, that's correct. I'm going to leave this as open and expect us to read it again after some updates to the language. On submit stage and submit contract changes. The previous version ends the day before, so the versions never overlap and never leave a gap. So in theory there could exist a gap if we created a date range and then made a second date range and both of them had an end date and there happened to be a gap in between. In theory there could be a gap to be on the system to prevent that.

**Greg:** I think we need to, I think we're not going to use this any favor if we let them fall into those sort of holes. So it should manage full coverage of the date range.

**Donald:** Yeah, I would like to think that when new price lists come from any upstream provider, that most people would just set them up as an indefinite, you know, without an end date. And only when a new contract comes in, they would set it up. But I agree that the system should not allow a gap. Okay. So in theory, they could try to, but they wouldn't let them save.

**Greg:** In some ways, the system will probably handle this differently under the covers. So we're not talking about how the database guys might handle this in terms of records, but once we set a contract up from the user, experience perspective, we are effectively endlessly extending and changing that contract, right? So we might have a contract with no end date. That would be normal. So we set up a contract with a start date and off we go. Come along and we've got some changes. Now they could be any sort of changes, they could be additions, they could be removals, or they could be edits. And then we want to apply those from a date. Now those are all alterations if you like to the contract. These are the saying, delete this contract, I'm going to give you an entire new one, in which case we close it off and just start a new schedule, right?

**Donald:** Yeah, so this is a situation, because in that image up there, we describe that there can be date ranges for different prices and codes.

**Greg:** Yes.

**Donald:** But the overall settings in terms of is it fixed, is it RVG, is there a discount, is it a fixed rate—all that stuff—all that lives and the entire parent. And what you're saying is true. If there's a situation where they want to change that based on it, from a different point, you would actually make a whole new version of that with it. would start from a new date.

**Greg:** Yeah, I don't necessarily think we have to get into it here because it's not necessarily that the user wants to consciously manage that. But it's effectively what you would have to do to manage what the user wants.

**Donald:** If there was a situation that required that. Yes.

**Greg:** So the user might want to say, look, I want a clean start. And it might be from today, right? They might just say, look, I've got a problem with how I've set that up. Here's a new one. Or it might be from today, here are these additions or removals or edits and merge those in and take them forward. But there's still only, and those additions are merging and so I might relate to the details of the contract line, but the parent has the date and those dates affect all of those lines. So it can get, I think it can get quite subtle about how that gets managed from a database point of view. But basically you're just providing this continuum of contract definition, right?

**Donald:** Okay. Contract ends without a successor only when the office gives its current version end date. Yeah, so this seems to be sort of describing the contract itself having a start and end date, which is different to a date range within a contract for a price.

**Greg:** No, it's not permitted.

**Donald:** What's that?

**Greg:** The lines are not date ranged, only the contract is date ranged.

**Donald:** So in that image there, we're talking about different, and we've been talking about different date ranges for different prices.

**Greg:** And I said, I don't know why we're in column two here, but that's what I was talking about. Only the contract header has the date range, and all its children follow that date range.

**Donald:** And the children's are the lines. Again, this is where you're thinking from a technical thing and I'm thinking from an experience thing. I think.

**Greg:** So the lines inherit the date from the parent, but you can't manipulate them individually.

**Donald:** So in a situation where Merivale Plastics give a price list to AA, they say here are their price for this year 2026, let's just say. And then in 2027, in advance of 2027 arriving, they submit a new price list. And that price list will have maybe added procedures, maybe procedures removed, and some of the same procedures with different prices. How does that look? Well, I don't think about the database part. I just think about what's the user experience for maintaining and managing that. So, a single instance of Merivale Facelift contract exists within the system, and in advance of we're talking twenty-seven list coming into effect, what do you imagine the screen looks like? It.

**Greg:** Looks like a typical office document that has a header in line, so an invoice has a header in lines. It would have a header which would say that it was for Merivale, that it was from this date, it was valid from this date. And it would have a whole lot of detail about. Let's take a simple case. Let's take the anaesthetist fixed prices. The contract is for the anaesthetist and he's got 12 procedures that he does that have got fixed prices on them. And it's dated. It's dated.

**Donald:** Yeah, and each one of those is a different contract.

**Greg:** No, that's one contract.

**Donald:** Start again.

**Greg:** It's one contract with this 12 percentage listed on the schedule. Contract has a schedule.

**Donald:** Contract has a schedule. What's that?

**Greg:** Yeah, the 12 percentages. There is this book of one page to Vanessa and it says those are my 2026 prices.


### Contract header and line model: competing mental models

**Donald:** Yeah, totally. So here's a spreadsheet of all my prices and he gives each of them a text description name and a price. And you'd like to think that those descriptive names are enough to let people understand that this is for a facelift and this is for whatever else. But each one of those items in their spreadsheet is an individual contract.

**Greg:** What? The schedule, it's the spreadsheet in total is the contract. The lines in the spreadsheet form the contract itself. Think of an invoice, right? How's an invoice constructed?

**Donald:** So when we invoice customers, we have one customer that we might send, an invoice might have multiple lines, because we invoice this amount of time and materials, this amount of cost for hosting, and this many hours on a particular project.

**Greg:** So what's at the top of the invoice?

**Donald:** Top of the invoice is who is going to receive that invoice. So we might have a situation where sometimes the accounts team wants an invoice, we separately might send an invoice directly to a particular department. Yep. Right.

**Greg:** Yep, the reference of the invoice.

**Donald:** Those are the name of the.

**Greg:** Invoice and your company name.

**Donald:** Sure.

**Greg:** So that's information that is common to everything else that's on the invoice, right?

**Donald:** That's right. So like, yes, Stratus' information is true across all of those invoices.

**Greg:** Yeah, and that customer's name and the invoice reference is the same, the GST reference number is the same. It's all common. And then underneath that, you have all the different services that you have provided.

**Donald:** All the different services we provided as a part of work that's done in that invoice.

**Greg:** Yes, so you have a... The header, the invoice has a structure. It has information at the top that occurs that is common to everything that is listed underneath.

**Donald:** Yes.

**Greg:** So you've got the invoice header and you've got the invoice lines.

**Donald:** Yes, in this instance I understand what you mean when you say invoice lines.

**Greg:** So over here we've got a contract and we have information that is about the contract. Who's it with? Who's it between start date, end date, reference number? Exactly the same as the inbox.

**Donald:** Yes, you're saying that when an anaesthetist gives information to AA to set up all the relevant contracts with that anaesthetist.

**Greg:** Yes, no, all the relevant charges for that anaesthetist, don't use the word contracts, charges He's giving her a list of charges.

**Donald:** So this here, I think, is the example of what we previously called like the first party contracts, right? There's, you know, you see different shapes, like multiple background shapes here, because multiple could exist against this anaesthetist. And so Ben would give Vanessa in the scenario a list of the 22 odd different procedures that he wants to be pre-paid. And he would very likely have a different price for each one of those procedures. And so when Ben gives Vanessa a spreadsheet, there would be a bunch of information at the top that is like, this is still what my company is called and my name and all that sort of faff. And here all the different procedures, which each would require a new contract in our system or a separate contract in our system to define the fixed price. This is, what am I missing here?

**Greg:** That's a contract line. What I'm calling, or what I've been calling the contract, you might fully call the contract header.

**Donald:** Yeah, so I guess. So there's a, there's a. This is where we got in trouble for like trying to define technical structure versus outcomes for users.

**Greg:** I missed this. I missed this.

**Donald:** Yeah, right.

**Greg:** This is more accurately described by having. Not those, but lines down here.

**Donald:** Yes.

**Greg:** This is not, if you're depicting this as a set of these things that are all unique and individual, that's...

**Donald:** Okay, I think I can translate this now in my head. I've been talking about Merivale sending. Let's see, I don't want to do that. I've been talking about Merivale sending through a price list. So let me bring one of those up so we talk to it. Where are we? There we go. Documents, discovery, data files, group one. Bingo. So let's open a preview. Let's make that big boy. So this is a price list submitted from Merivale to AA to say these are all of the prices. And so I have been interpreting every single procedure here as a unique contract in our system as far as the users see them. So when you're looking to edit the breast reduction simple contract from Merivale Plastics, you would search for Merivale or breast reduction and you would find this and you would tweak all the particular settings. Can it have a price override? Does it have a discount? Is it a fixed price versus RVG, right? These are all settings that are trying to represent what this PDF has sent to us. And certainly you would say this is for Carey Moonley, Maryvale Plastic Surgeries, whatever it is, right? There's particulars in that in terms of the descriptions and the data and all that sort of stuff of the hospitals and all that sort of faff. But in 2026, This price list, which we're seeing on the screen right now, says that this breast reduction simple has a fixed price of this. And they would make a separate contract for breast reduction complex with this fixed price. And I'm saying that within the entity, when you're on the edit screen, looking at breast reduction simple, you would have date ranges for different prices. I'm talking about the user experience, not the technical stuff in the background. So you're saying no?

**Greg:** You want to see something on the screen that is a facsimile of that. At the top you want, there are our plastics, contract valid from January 2026. And then the list underneath it is all of the things that are contained within that agreement.

**Donald:** Miss Foley.

**Greg:** 25 agreements there, she sent you one agreement with a price, with a list of prices. That is there, that piece of paper there, that's the contract.

**Donald:** Sure, yeah, so this is what this organisation gives to AA, but when you When a procedure comes in from a surgeons or a hospital, right, on that matching screen, and an AA admin has to pick how we're going to price this and who's going to pay, my expectation is that they would be picking this.

**Greg:** Well, they will eventually, the question is how will they navigate to it?

**Donald:** Okay, so you have had a vision that they actually, you search for this and then underneath that you find this. Yes. Interesting.

**Greg:** Which means that there's a lot less detail on the screen at any one given time.

**Donald:** Yeah. Okay, well this is a user experience mismatch that I guess we could prototype both versions and see how it looks. Yeah. But my mental model of how this has been working this whole time is that you would have a single entity in the system, which we have been calling a contract, which would be called. And it wouldn't actually just, this wouldn't be the simple text description for it. would be something like mirror roll plastics press reduction simple. And then you'd open that up and you would configure all of the settings for it and you would set date ranges for the prices. that would be applied at any given point in time. And so then, in a situation where you do an export of all the contracts in the system, you would see, each one of these line items out with the particular, all the different columns of settings, yes, no, true, not true, and then prices, right.

**Greg:** You're back into Ben's comment that this is, it's an unmanageable problem.

**Donald:** Yeah, I mean, because...

**Greg:** And that's why you've been saying, that's a lot of stuff to scroll through on the screen. It is.

**Donald:** Yeah, totally, totally. And so in theory, in theory, you could have a situation where this item has a discount applied, but this one doesn't. Or this one has a different discount to this one. Well, thinking that I need some more. I'm looking at these other lists here, right? So these raise other questions which are potentially complex. We're still recording, right? Yeah, And so Southern Cross Affiliated Provider, there's a couple of these that all have some different things below them. And so...

**Greg:** They're great examples.

**Donald:** Each of these in my brain, in my mental model, and yeah, exactly. Each row in my mental model is a contract. It is a thing that the anaesthetist searches for. It's a thing that AA admins can edit. It's a thing that anaesthetists can choose between as they're swapping around. And each one of them holds all of the settings relevant to understand how it's built.

**Greg:** Well, I think that... This is, I understand that this has been a difficult area for you, but I think this is fundamental to the understanding of how the system will operate and clearly it is. And I don't think that the model you have in your head reflects how the businesses interact between each other or how the staff think about what they call a contract. So when the staff talk about a contract and when the hospitals and AA talk about a contract, they're talking about that page.

**Donald:** This page. Yeah. I'm just going to put a pin in this. Let's not jump right away. But we need to figure out how to handle things like add-on fees as well. What fees? Add-on fees. Yeah. Quickly moving on from that, so in your world, in your mind, when a procedure comes in, a booking comes in from a system, Vanessa in this scenario, she would select the Southern Cross affiliated provider MIGS fee schedule anaesthesia update effective from this date.

**Greg:** Well, what she's going to see on the booking is probably a reference code that goes...

**Donald:** She might see something like this, right? Unlateral repair of... She wouldn't see the theatre days part probably, but she would see some sort of surgeon's relative description of what the procedure actually is going to be.

**Greg:** Yes, good question. She knows it's for the hospital.

**Donald:** If we go back to this one as a good example, she might see that it is a facelift.

**Greg:** That one's different.

**Donald:** Okay.

**Greg:** It's not an easier case to discuss. So this one's a little easier because the surgeon puts a booking in. She gets the booking and she knows that the booking is at Southern Cross. So she's going to look on the book and she's going to see that it says SXAP links.

**Donald:** Okay.

**Greg:** So that tells her which contract is going to apply to this procedure.


### Southern Cross pricing schedules and contract selection

**Donald:** If we stopped calling what is in our system a contract, does that help any of this conversation?

**Greg:** I'm still talking about the language of the diagram that I sent you, about the model. And this is why I forgot the model was so important to cross.

**Donald:** Yeah. So now I understand this is like, now I've been able to translate this. The contract holder is obviously Southern Cross. The contract is actually what you had previously called as a price list. It's a list of different procedures and the prices for them. And the contract line is the particular line in it. Okay, so that has been your mental model?

**Greg:** And I have to say, I think it's the businesses model and I think it's the hospital's model. That's how they think about their discussions when they're having them with each other.

**Donald:** So when I look through the list of what is in Solutions Plus, which is obviously not Not a good place to start. Not a good place to start my argument. But when I look at that, does not represent what this is representing, right? And so, yeah, this is kind of a bigger conversation to be had with Vanessa and such. But now I'm starting to understand. And In my mental model, where is my thing here? Preview, please. Let's go back to this. Here we go. So in my mental model, our system, our future system, will have a discrete entity for every line on these contracts that come in from other upstream providers. so that we can understand, so we can represent a pre-understood agreement for who's going to be billed and how much they're going to be billed. And certainly within my mental model of what the user's experience is on a screen in the app where you're editing this procedure or representation of a contract, it would be attached to this hospital such that not on the matching screen, but on an actual list and booking when you're selecting which contract is there, you could filter it down based on hospitals and such. And so I We both, I think you and I both want an experience that is easy for everyone involved so that they can easily find the right thing in our future system. So there's confidence that the thing that AA is going to be billing is the thing that Southern Cross is expects to receive because they look at this document here and they say yes, it's the same thing. So we're agreed on that. I'm hearing from you. Where did I go here? This, this, this, this. I'm hearing from you that in the world of Vanessa and such, they think about this stuff at a higher level and they think about this entire document as a thing. Yeah, yeah. Okay, well, I think this is a good time to pause and we need to pick this conversation up with them to understand.

**Greg:** To me it's absolutely critical that we're all on the same page about this model because it's caused a lot of difficulty getting to where we're up to. And I think this is a fundamental design communication issue. They do have a design for the system in their heads. which is that this is how they receive their information about what their arrangements are. And this is mentally what they're going back to this piece of paper saying, where is the data for this mixed thing? And the surgeon will have mixed on the booking.

**Donald:** What's the next one? There we go. Yeah.

**Greg:** So they know that this is glaucoma on the MIGS schedule and not glaucoma on the DHB schedule.

**Donald:** Yes.

**Greg:** Because Southern Cross may well have one of these where they are operating on behalf of a or under a DHB, I know it's not called on the DHB arrangement where there's different price for this but it's exactly the same procedure. So it may be an AP1313 but it could be $795. Same period, same code number, same description, different price because it's a different schedule.

**Donald:** Say that one more time.

**Greg:** So they could have...

**Donald:** They, who's they, sorry?

**Greg:** Southern Cross could send this document to AA as it is there, and that's the MIGS schedule. I'm not sure what MIGS stands for. And they could send something that looked almost identical, which was the DHB schedule.

**Donald:** Southern Cross would send that.

**Greg:** The Southern Cross would have two contract holders that they are working on behalf of.

**Donald:** Sure.

**Greg:** And everything could be the same except prices.

**Donald:** Yes. Yeah. Okay.

**Greg:** So Vanessa's going to go, okay, got the surgeon. It's a Southern Cross contract. It's MIGS. I need the MIGS one or it's a Southern Cross contract. It's DHB. Yeah. I need the Southern Cross DHB. well and so she's thinking at that level higher than the line right she's thinking about which schedule is it that I'm meant to be using.

**Donald:** To process yes okay well um I think we should feel encouraged that there's all these other conversations you and I have had up until this one where we understand and agree on things that need to exist to make these work. And this is essentially a new layer for my brain to understand and think about how that impacts the user experience. And I certainly want to understand a little bit more about how it looks like day-to-day from their side.


### Examples of fixed prices, add-ons and complex fee schedules

**Greg:** Well, at the end of the day, we end up with a line somewhere on an invoice.

**Donald:** Yes, that's right.

**Greg:** And so we are fundamentally, I'm not, it's not just that I'm getting hung up about how it's stored, it's the user navigation of how they think about working their way through the system. So this is very much a mirror of the human navigation of how they resolve Who is the billable party? And what is the price?

**Donald:** Yeah. And in the scenario you gave where one of these is for DHB, the other one is for, I don't know, ACC or something. And it's almost an identical looking document to this, except that it wouldn't say MIG because it would say DHB. In that example, where am I going? No, I lost it. No, go on. Okay. Yeah.

**Greg:** Are you thinking about how you're going to navigate to it in your existing legal model?

**Donald:** Oh, no, that would be fine because they would just be named differently. Yeah. And maybe they'd have metadata. That means that it could be filtered on it as well. OK, let's cleanse our palette a little bit. Add-ons. We haven't really talked about add-ons at all, right? We have this concept that you have, oh, that's what I was going to say, line item on an invoice. In both of these situations, you know, there would be, in my, you would be able to define what the actual thing that's listed on an invoice looks like. Yeah, OK, add-ons. So As of now, you and I, think, have alignment that you select a single contract for a procedure. That contract describes how it gets paid for, and if they want to, they could create pre or post procedure kind of events to invoice and they can just create any ad hoc invoices they need to, right? And, but if they wanted to, they could even with a single contract choose to split the way it is billed and bill some of it to this party and another part of it to this party. So that's like something that happens towards the end of the kind of mental model there. They could split it off. But we haven't really talked about the idea that some procedures with the way they are paid have some sort of add-on fee So like is there a I don't again I'm not sure how much of this you and I can answer without knowing particular medical things but could you have a situation where you choose this line to pay for to be the contract for how the procedure is built, but also add on this.

**Greg:** Yeah, that's interesting, aren't they?

**Donald:** And is that just, do we create an actual system of add-ons that are supported and attached to things that can be selected in a more easy way?

**Greg:** We've got a simple model that says It's clearly not going to work. A simple model that says we've got a procedure and we've got a fee. So it's a single line. It's a single chargeable line for the procedure, right?

**Donald:** Well, you could.

**Greg:** And this contract says that you've actually got a second chargeable line.

**Donald:** That's fine. That doesn't break my brain. And then if we go, dang it. So let's look at this one here. $100 per additional 15 minutes. So that's just different time pricing. This one's got an add-on. Any liposuction.

**Greg:** That's not trivial either. You've changed the rate halfway through.

**Donald:** Well, this here is like, this is a fixed cost for a facelift and then every 30 minutes of liposuction that gets done, you have this. And so I could picture in the UI that when you're setting up a contract, you can set up a number of predefined add-ons such that when a procedure is done, the anaesthetist can say, we had three of this add-on or one of this add-on. And then in the final invoice you see your facelift plus your liposuction too. Or this one, a separate fee for a general anesthetic. For this one, add on to cataract, cat fee this equals this. So you could have this procedure done on its own. You could have this part if it'll let me. You can have the black text on its own, and then have a separate add-on set up for the cataract, which adds the 405. So add-ons is a whole new feature. That's fine.

**Greg:** Well, what it's doing is it's introducing multiple billable lines to a procedure, whereas at the moment we've just got one billable line to a procedure. Suppose so.

**Donald:** Well, no, there could be multiple. No, already the system probably could support multiple billable lines, because you would see your pre-op line in there next to your op line, maybe even a post-op line or whatever. Like, the system probably already did support multiple lines, but it didn't support the idea of some sort of predefined add-ons. Yeah.

**Greg:** Okay. And that one's really just the same. Yeah. It's just an add-on.

**Donald:** Okay, and then there's this list of them that she gave me. And these are more actual spreadsheets, so it's a bit more to get into. Yeah, I haven't really dug into this too much. But I'll need to. Okay, let's bring us back to this. Contract prices from an effective date. We agree that, regardless of how the UX experience looks, that contracts in our system contracts in our system.

**Greg:** You mean in your model or in the new system? What's our system?

**Donald:** Whether you are selecting what? Insurance company. I need to call it a good time. So this here is a contract document between Southern Cross and AA. So for the sake of our conversation and ease of use, we can either rename this to something like a price list or we can rename what we've been calling contracts in our system. What do you want? What's easier for your brain?

**Greg:** That's a contract what I'm looking at there is a.

**Donald:** Contract okay so let's keep calling this a contract so what is a different name for how we present the line well it's called a contract line okay so what was the question a contract line can have a date range.

**Greg:** I don't think so I think a contract has.

**Donald:** You think the contract has, okay?

**Greg:** Because they're being operated on as a collection of lines. So they all, concept of the parent-child, they all inherit the date from the parent, which is the contract.

**Donald:** Yeah, and so when we talked earlier about the idea that.

**Greg:** Yeah, when you look at those schedules, right, none of the loans are dated, right? It's dated at the date.


### Contract date inheritance and contract-line granularity

**Donald:** I understand that, yeah. So, we... I've lost the thread completely. Contract prices effective from a date. So yes, okay, using your language. A contract has a date range. which inevitably means that the contract line below it is valid from a date or within a date range.

**Greg:** Yep, precisely.

**Donald:** Okay, the date has no default and is never in the past. I don't understand what that's saying, has no default, it's never in the past. Nothing is backdated, nothing is deleted. So in my mental model, which let's call the right hand column, in the actual individual lines could have dates with different prices that exist on it, which means that when the new contract comes from Southern Cross, they see it and they would be updating all of the different contract lines and applying dates to them. And in a situation where a procedure no longer exists, they would need to find it and that might be tricky. So in your system, in your mental model, in this mental model, all of those lines existing below the actual physical contract, I think that works for the documents like this, but I'm not exactly sure how it works. Maybe it's the same for documents like this, but what about documents like this? No, it's the same thing. Let's close that. What's the other one? This one? This one? Like this document. Maybe this is just a collective document that collects a whole bunch of other ones. Or CESL. So what's CESL?

**Greg:** Keep going.

**Donald:** But which you were talking about this?

**Greg:** Right, yeah, effective from the 1st of July, 2026.

**Donald:** Yes.

**Greg:** So that date applies to every row on that table.

**Donald:** Yes. And so now you would be searching for some, this document represents one fat as contract. Which has its own problems.

**Greg:** Well, fine, let's go through that.

**Donald:** Yeah. I wonder how much of this is also... I wonder what even this document is. it a summary of other PDFs that have come in.

**Greg:** I haven't seen that document before.

**Donald:** Yeah. Okay. What was that for? Yeah. Okay. Let's, I reckon this is probably just a good taste of pause. I think it's some clarity. I'm understanding, I'm understanding you now. Yeah, What else is down here? So let's leave that open. Combinations as contract lines. So we're now moving on to 4.2.11. A combination is just a line on its holder's fixed price contract, not a procedure or a separate contract. For example, Mirvale Plastic set fee schedule, a surgeon's room agreement bill to the patient has these lines, facelift, facelift plus one, facelift plus two. Each line stands alone. It carries a default RVG code, for example H3, so I can search for RVG code and find it. When the billable party wants the combined price broken into parts, the admin raises additional invoices. This combined work the way it was agreed with no extra structure. Thoughts.

**Greg:** Yes, so this is a particular use case raised by Vanessa where normally you get these combination or compound things happening that are built as a single line and some vendors require them or ask for them to be split.

**Donald:** Yeah, so if a patient was paying for facelift plus one, they would receive an invoice with a single that but in this particular scenario that Vanessa brought up it was changed after this was I think in this particular scenario it was happened after invoice was sent but sometimes if this contract line in your words is selected and Southern Cross is Whatever, some party wants it to be broken out.

**Greg:** The use case she had was that the patient had been billed—to the patient—and the patient passed it to the insurer, and the insurer said, 'Oh, we need to split.'

**Donald:** No, the particular scenario was that. Southern Cross was going to actually be the one that was meant to be billed. And so they had to retract the first invoice and then send invoice it to Southern Cross. And Southern Cross wouldn't accept it as a contract line in your terms. Yes. They needed it split out. Probably this one here might be a better example because it's... Yeah, whatever.

**Greg:** Yeah. So she just does that manually.

**Donald:** She does that manually. So combinations of contract lines. A combination is just a line on its holder's fixed price contract, not a procedure or separate contract. For example, the Merivale plastic. Okay, cool. That seems all right. So each line stands alone. They're each different contract lines. It can carry a default RVG code, for example, H3, so it can be searched against, yes. Yeah, so that's saying that- I'm.

**Greg:** Not sure the RVG code's got a lot to do with this. These lines would normally have their own reference code, but they haven't in this case.

**Donald:** That's right. But no, you and I talked earlier, we seem to be aligned on the idea that you could attach an RVG code to each one of these to help you find them, and that's all that's talking about. Yeah. Okay. Agreed. Yeah, good. Okay.


### Contract lines, RVG references and prepaid settings

**Greg:** And she rolls that back and just writes it, builds it as two lines.

**Donald:** Yes, Or if it was, if you had a situation where you caught it before it went out, you would still select the single contract line in the UI, but you would then through some, UX choose to actually create separate individual invoices and void the automatic one or whatever. Invoice lines. Yeah, that's right. So they could see it broken out. Okay. 4.2.14 anaesthetists own price list contracts. An anaesthetist who wants fixed prices for their own work for example prepaid cosmetic procedures has their own contract. A price list with a line and fixed price for every procedure they price this way. For example, Dr. B Smith, facelift, $3,200. The anaesthetist tells the office which procedures and prices they want, for example, from a spreadsheet of 25 procedures, and the office sets it up. These contracts, offered only on that anaesthetist's own bookings, are created and kept by the office.

**Greg:** Yep, that's correct. You can't do it itself.

**Donald:** From, get by the office, from the price list of any of the supplies, have a holder that is not billed. So they bill the payer on the booking. Yep. Let the anaesthetist change the price where AA has set the contract as editable. Yep. So this goes back to my mental model that using your language, individual contract lines could have different settings of can override, can't override. That's the way I've always pictured it. So if we go back to the image, I imagine that since each one of these is its own distinct entity with different date ranges within it for different prices. No, I'm not saying it's perfectly, it would just mean that for whatever reason, you could attach the add-ons to just one of these, not all of them, because you wouldn't want to see it for anything that wasn't relevant. And for whatever reason, you could say this one could have price override, but this one doesn't, because who knows, like if we look inside that big spreadsheet, Who knows what sort of complexity might exist within that. That's that's how that's how my mental model was reconciling it all. And so here let's just change the price in your the way you've been operating in your head is that actually that entire PDF, that actual contract between Merivale Plastics that has all the settings?

**Greg:** All the shared settings.

**Donald:** Interesting. Yeah.

**Greg:** There'd be, there would be nothing, just thinking that was in a mess of this price list. You could load that twice, potentially. Once as an editable contract, once as a non-editable contract. I mean, couldn't imagine why you would do that.

**Donald:** Yep, you could. Yep, And this is what you and I are thrashing out, right? Because what we enable in the system will then force. AA to, if you don't get it right or whatever, then they'll have to work around it like they already do.

**Greg:** Absolutely. And it cuts both ways. So some designs are done deliberately to make AA's life easier and some designs would, for better or for worse, make it harder. Yeah. Absolutely. Yeah. Absolutely.

**Donald:** Yeah. Let the anaesthetist change the price where AA set the contract editable. Okay. Yep. And then One is the anaesthetist prepaid list.

**Greg:** Now, prepaid at the moment in the model is set at the contract level. So again, you could load that contract twice, once as a prepaid, or you could move prepaid down. Yeah. You could just move.

**Donald:** Which means, I mean, that, that, right. All of both of your and my scenarios have pros and cons. that make them better or worse. But in that particular scenario, you have multiple instances of a single contract line.

**Greg:** It's worth a discussion.

**Donald:** I need to think about some good ways to display this or visualize it so it can be communicated well.

**Greg:** Yes, because the user can make this choice and it's the The app designers won't care less whether the flag's on the header or the flag's on the line. But it will make a big difference to what the user has to maintain and how it works. I feel good. We want that on the line. And we don't, or we don't, we want to be able to treat them as a block.

**Donald:** Yeah, I at least feel good that I now understand. We're now aligned on understandings. Okay, so when one is the initial prepaid list, Flag is prepaid. It starts the prepayment. Yeah. Okay. So yeah. Okay. Lines are fixed prices and need no RVG reference. So one can be given as a default agreed in principle. Ben has not yet been asked. Okay.

**Greg:** Ben will tell you that they don't have them and not need it. So I think technically you can put the bid if you want to. but they're just ignored. That's where I've come from. Because there were other comments that were made by him earlier that said, well, you know, if they're put in, we just don't, we just ignore them.

**Donald:** If what's put in where?

**Greg:** RVG values.

**Donald:** Yes, Okay.


### Final clarification and closing

**Greg:** And then after I've wound them up enough, he got more hard line about it. That's how it goes.

**Donald:** Fixed prices. So lines aren't fixed prices. They, oh yeah, no, these are. Well, no, in theory, they don't have to be, right? Like, anaesthetists could create contracts. They could be contracts exclusive to an anaesthetist that aren't fixed for whatever reason.

**Greg:** Yeah, I've got, I can't think of an example where it would make any sense to do it.

**Donald:** But this goes back to what we've said, which is that the system is permissive and it says practitioner, right?

**Greg:** They could set up a whole list of stuffs that just have a 10% discount on them.

**Donald:** I mean, yeah, it's possible. Okay, I'm actually... We've got 2 minutes left in our meeting. I reckon we've stopped now. My brain is basically fried and needs to kind of process everything we've talked about. So I'm just going to put this as open or proposed, I guess. Yeah. Doesn't really matter too much. Just not agreed. Okay. I think good day.

**Greg:** To do on contract proceeding. That's tomorrow's conversation.

**Donald:** Yeah, so let's, okay, yeah, let's pause.

---

## Reconciliation notes

- The dialogue follows the meeting chronology. Section headings are navigational aids only; no decisions have been inferred from them.
- Technical terminology has been standardised where repeated independent readings support it: **RVG**, **BTM**, **FHIR R4**, **Xero**, **nib**, **DHB**, **Southern Cross**, and **Merivale Plastics**.
- A small number of indistinct names or phrases are marked **[unclear]**. The early split between Donald and Greg in the opening greeting was adjusted so Greg’s question remains intact.
- The three automatic transcriptions overlap through the end of the recording; no substantive passages unique to another source were identified as missing from the named-speaker version.
