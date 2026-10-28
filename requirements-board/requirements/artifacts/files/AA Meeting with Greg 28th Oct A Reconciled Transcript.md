# AA Meeting with Greg — 28 October 2026 (Part A) — Reconciled Transcript

> Reconstructed from three automatic transcriptions of the same recording. The speaker-labelled transcript supplies the turn structure; the two alternate transcriptions help verify wording, particularly acronyms and domain terminology. Speech is lightly cleaned for readability, not rewritten as minutes. Unresolved audio/transcription ambiguities are marked **[unclear]**.

**Participants:** Donald and Greg  
**Recording:** AA Meeting with Greg 28th Oct A.mp3  
**Scope:** Part A, ending when the participants break for lunch.

## RVG master data, anatomy groups and modifier catalogue

**Donald:** I just hadn't gotten there yet. But I believe when we finished last time, we finished looking at all the contract information and we had that breakthrough of me now understanding your vision for a contract versus a contract line and how that stuff is shaped. So now we're looking at RVG master data and calculation rules. And yeah, let's see what this kind of looks like. I wonder if there's some parts of this that are a relic of an older time, but we shall see. Okay, feature 05, the building blocks of RVG master data and fee calculation rules. The building blocks of every price starts with the RVG's groups as published plus AA's own and the modified list.

**Greg:** So why have you split out the modified list separately from the RVG groups? Aren't they inherently the same thing? Or are they not?

**Donald:** No, I guess like...

**Greg:** It's a separate part of the document.

**Donald:** Yeah, it's all in the same document, but... And modify list on them sets pure calculation rules. So base time, modify units, multi-procedure split across a booking. Now this is a feature, right? It's just kind of give me an overview of everything we're going to talk about later. the pricing values on a contract, values a contract can set, changes to a procedure's price by the anaesthetist and the office. So, first one, RVG groups and modifiers. The NZSA RVG 2021 groups as published, each with its anatomy heading plus AA's own groups. I keep saying AA's own groups, I think there was a reference once to Vanessa talking about Maybe there's something in here about AA having their own sort of extensions?

**Greg:** Yeah, it's not encyclopaedic, the RVG.

**Donald:** Plus the modify list. The office maintains them. Every change is recorded. This is every RVG code has a published starting point for space units found by the type. Now by type ahead on code and description. So that's just talking about, as you start to type. Cool. RVG groups, admins hold each RVG group as published in the guide. For each group, this includes a unique system, human readable code. Still open, Greek proposers to come back to this. I think this is talking about the fact that each contract in our system will have a human readable code not that the RVG groups need to so I think that's wrong.

**Greg:** No there's nothing I don't think there should be anything open there do you it's um they just need a unique identifier yep and actually the user will never see it because they're just interested in the codes that are published.

**Donald:** Okay let's just go Its anatomy heading, for example, head as the guide prints it. The recommended base units always set above 0, and its modifier units 0 by default. AA can add its own groups where the guide does not cover what it needs and set their base units. This is so every RVG code has base units from the start. A procedure takes them when the RVG procedure takes them. Yes, okay. When the RVG code is chosen, unless the contract line state its own, and then this system may change them. Users find a code and a type head that shows each row's code, short descriptions, base units, since the same code can appear more than once, on more than one row with different values. Sure.

**Greg:** So when it says the contract line states its own, That's a reference to the fact that an RVG code has already been selected for that contract. Is that what it's?

**Donald:** Saying? I interpreted that as to say if you select a contract that has got a fixed price or something like that, then the RVG code is not needed. So a procedure takes the RVG code that The procedure takes them when the RVG code is chosen, unless the contract states its own.

**Greg:** Because the RVG contract line can, it doesn't state a baseline value, but it can identify the RVG code.

**Donald:** A recommended one, yeah. Yeah.

**Greg:** It reads okay.

**Donald:** Okay. Cool. Anatomy headings and AA groups. Each group carries anatomy heading. For example, head AA adds its own groups besides the published ones. This is how each code keeps its published place in the guide. So, yeah, there we go. An example of what that might look like. Yep. We've got our agreed. Modifiers already included in the base units. Where the NZSA RVG says a code units already include a modifier. The system shows that modifier on the booking already selected at zero units. It is not locked; the anaesthetist can turn it off, but cannot add it a second time. Today this is a supine positioning modifier, P1, two units on six neurosurgery codes and the 14 spine codes S1 to S10 and their sub codes. The RVG's P1 row says on page 12, "if not already accounted for." It is not included in the spine and neuro base units. The list is in here, it's in SV CSV beside the RVG in the data files. No other modifier is pre-fulfilled on a procedure, and the only other modifier as a system applies itself for age modifiers. On the patient's age, every modifier has the anaesthetist choice. This is so the anaesthetist can see the loading already in the base units and cannot change it twice by accident. Seems in line with what we talked about yesterday.

**Greg:** Yeah, personally, I think this is overkill, but you can leave it in. I can take it out, but I don't like it.

**Donald:** OK, cool. And modifier code master. The admin loads the modifier list as a master data. It's its own. It's it is AA's own list made-up of the RVG modifier table and modifiers AA users that are not in the RVG Vanessa's list. Each modifier holds its units.

**Greg:** So what are we doing here?

**Donald:** So I think it's saying, just like the fact that, just show it here, we go. Just like AA apparently has their own RVG codes that extend the ones from the Society of Anaesthetists. I believe at one point she described that they might have other modifiers that they create as a standard.

**Greg:** Right. What happened to the ranges for these values?

**Donald:** I know that RVG, like base units definitely show ranges. Do modifiers have ranges? Maybe some of them do. Yeah, maybe some of them do have ranges. See this one here. POC2A, anaesthetist at home care providing cover per day, 2-6. There's some complexity in here in terms of units plus time. I think the way... I should talk to Ben more about these at some point. ICU care, anaesthetist and hospital providing cover per day, 25 units. Like that wouldn't really be used in our system, I wouldn't have thought.

**Greg:** Well, they might just contract an anaesthetist to spend a day on the theatre list.

**Donald:** Yes.

**Greg:** I don't know how they build it.

**Donald:** That's right, that's right.

**Greg:** It's not a procedure.

**Donald:** Okay, where are we here? Each modifier holds its units as the RVG prints them. Some values are not one number, for example, true plus time, or two to six, or one per call, or cap. Some modifiers' values need more than one single figure. Some codes repeat across the RVG, and are also base codes, so code alone is not a key. Only the age modifiers are pre-applied. The ages within the modifiers including the base units should zero.

**Greg:** My concern about all this is that I can see it being quite expensive to provide a detailed requirement and then code it. And there's a very small benefit comes out of it.

**Donald:** I hear you. Although there's a nice choice, this is so then it just picks from one complete list and the units each modifiers add are the same for everyone else. Okay. That seems right to me. Thoughts.

**Greg:** Well, yeah, as written, it's okay as written. I can just see it driving a lot of complexity. I'm questioning whether it's of value.

## Unit calculation and contract pricing rules

**Donald:** Okay. Unit and fee calculation. A procedure is priced by its contract and the values held on the procedure. procedure is price by its contract and the values held on the procedure. This doesn't quite seem right to me. We don't really have values on a procedure anymore, but let's keep reading and see what it says.

**Greg:** Well, we do once there needs to descent, don't we?

**Donald:** So previously we had this concept of you pick a procedure and procedure had some information about base units and whatnot. And then below that was the contract and the contract, you know, inherited some of that information and then worked with it to figure out the price. But now that we don't, the procedure doesn't really hold anything, right? It's just a string of text that we get from different systems, some of them more clear than others. But we don't, the procedure isn't, doesn't have any particular metadata or value attached to it. Yeah. So this is feature 5.2. Choosing the contract and it's line. And the RVG code fills those values in starting units. Whoever is permitted can change them in the last change stance. So if a procedure holds a price, e.g. a fixed price from a contract line, a prepaid amount or a price entered by someone permitted. That's some confusing wording. that is the price the BTM units are kept for reference if recorded so not going to have to be recorded otherwise the price is base plus time plus modifier multiplied by rate multiplied by 1 minus discount where the rate is the contract rate where the rate is the contracts rate where it has one set, otherwise it needs its own rate. The discount is the one held on the procedure from the contract or entered where permitted, such as a fraction, and is shown as its own line on the invoice. Prices are worked out with the contract version in force on the procedure date. Contract version in force. So as earlier we talked about contract price is effective from a date, okay? Except a prepaid procedure, which keeps the price on its issued prepayment invoice. The price of zero gives no charge invoice and the BTM is still recorded if entered. This is so every procedure is priced the same way. Some confusing wording in this feature. which we'll obviously get into more detail in the individual story breakdown. But I don't know, how does that sit with you.

**Greg:** This looks all right to me.

**Donald:** Okay.

**Greg:** But we know what we're talking about. Yeah. It'll be a bit of a challenge for a cold read.

**Donald:** Yes, yes. Okay, let's hopefully these are better. Per unit pricing rate. The system prices RVG units at each anaesthetist's own dollar value per unit by default. Never a price list shared across anaesthetists. No Contract RVG carries no practice-wide prices with competition law the British competition law does not allow. This applies whenever the procedures contract does not whenever the procedures contract does not set a fixed fee or its own rate. This is the default this default is the Commerce Act requirement. Okay.

**Greg:** I'm not sure we can make a statement as bold as that.

**Donald:** Which one's that?

**Greg:** No contract there is a practice-wide price. You're talking about a rate, right? Price, a rate, price.

**Donald:** Yep.

**Greg:** Because there are some contracts that have been offered by ACC and they have negotiated an agreed rate for work done under that ACC contract.

**Donald:** That makes sense to me.

**Greg:** So probably worth removing that. I mean, it's not being quite so, not making it quite so constrained because while the anaesthetists may not collude with each other, they may accept a price offer from a vendor. And one of the things about AA is that it does accept price offers from vendors. And then the anaesthetist has the option to do it or not do it.

**Donald:** Yep.

**Greg:** So I think we need to make that not so constrained.

**Donald:** Nice. I just edited that a little bit. I removed the pit up here and the bit below. I think that that's what you're talking about now.

**Greg:** No Contract RVG carries.

**Donald:** So no contract RVG is a particular type of contract. And that one does not carry a practice-wide price, but it does not exclude the fact that other contracts might have a fixed price, like the ACC ones.

**Greg:** Yeah, I just think double no is a bit confusing, but it's all right.

## Tiered time, fixed fees and multiple procedures

**Donald:** Yes, it is a little confusing, isn't it? Tiered time units. Time units are tiered, not linear. The first two hours of anaesthetist's time are charged this way, and then starting from the third hour, they're charged this way, a part interval is always rounded up. always under the RVG tiers. So, this is understood to me.

**Greg:** So, it enters a start time and a stop time, and the system has to calculate the number of units. Yeah. Yeah. And that's what this is about. Yeah.

**Donald:** Fixed fee schedule pricing when a contracts, when a procedure's contract is fixed fee.

**Greg:** Sorry, can we just go back to that? Does it specify that the anaesthetist enters?

**Donald:** It doesn't say that, but the prototype shows that, but let's make it more clear. Cool. Nice. Cool. When a procedure's contract is fixed fee, the system uses the fixed fee as the total price for the procedure, not the BTM units. The base time modifier units are not required for a fixed fee where the anaesthetist records them, they're only kept for reference. On a fixed fee contract, the system calculates nothing further. If the recorded BTM comes out more or less than the fixed price, no additional invoice or credit is raised automatically. Where the work is very different, the office may raise an ad hoc invoice or credit note by hand.

**Greg:** We talked about flagging a contract or a contract line to say whether it was fixed price but editable, didn't we, at some stage?

**Donald:** Yeah, so all contracts have the ability to flag whether or not there can be a price override. And so you described...

**Greg:** Do you want to reference that here?

**Donald:** Okay, yeah. Do you know if a contracts like that exist? Where there's a fixed price but an override is...

**Greg:** Well, I just don't think, no, I don't know for sure.

**Donald:** Okay. Well, I'm going to leave it hazardous for now and I will raise a question we can ask. That's the item question. Fixed fee. Can... have the option to... What is the price? Details follow. Claude, I just made question 117. Can you take the context of our conversation now, but also previous conversation where we described the fact that there could be a combination where a fixed fee contract is allowed to have a price override. And in that unique scenario, if the price override causes there to be extra costs or less costs, then the system should automatically create an invoice. We want to investigate whether or not this is a use case that impacts AA. Nice, it already attached it to this, which is cool. okay. Happy to move on. Okay. Fixed rate contracts. Some contracts set a fixed rate. The system still prices the procedure from its BTM units multiplied by the contract's rate instead of the anaesthetist's own unit value. The rate applies to the whole procedure, not separate billing line. The anaesthetist can change the rate only where the contract lets them change the pricing. This is so contract holders agreed unit rate is honoured while the price still reflects the work recorded. Seems good to me. GST. Every system holds every price excluding GST and works GST out only when it's needed at the bottom of an invoice. Some contract holders publish both figures, only exclusive one is held. This is because GST rate can change and the price held inclusive would then be wrong. Nice. Multi procedure rule supersedes RFP split billing rule.

**Greg:** You notice that when you go to Europe, GST is 22%. It's a real leak.

**Donald:** New Zealand has laws that require GST to be listed as a part of the listed price and whenever I travel to a country where it's not and I'm like oh great this lunch is only going to cost me $8 and then I get a bill for $12 whatever it is I find it disconcerting and.

**Greg:** It's worse in the states because you get two or three taxes on the bottom of one angles.

**Donald:** Within one booking the primary procedure and any additional procedures earn units differently Primary units, only the primary procedure carries them. So base units, only the primary procedure carries them. Time units, every procedure carries its own, calculated from its own recorded times. Modified units, all sit on the primary procedure when the total is 4 units or fewer. When it's above 4, they're split equally across all procedures in the booking with any remainder going to the primary. Seems true to me. The system never allows base units on an additional procedure within a booking, only the primary procedure carries them. This is reinforced structurally, not just as a UI hint. The base units field is not editable on an additional procedure. Time units are different. Every procedure in the booking earned its own calculated from the procedure's own recorded start and stop times, whether it is the primary procedure or an additional one. Modifier units sit wholly on the primary procedure while the booking's total is blah blah blah blah blah, what you just said. Yep. Okay. Great. This ledger tracks each procedure's share. The system records the units and dollars attributed to each procedure in a booking. This is so that when procedures in the same booking sit on different contracts, for example, a hospital contract for the primary and a contract that bills a patient for a cosmetic add on. Each one still carries the right amount.

**Greg:** It's a bit cumbersome, but that's right.

## Changes to pricing parameters and overrides

**Donald:** Yes. I'm just like reading it again. Yeah. Yeah. Okay, cool. Changes to the procedure's price. The anaesthetist on a contract whose flag set by AA lets them, and the office on any contract can change a procedure's price, rate, or discount. Each is a change to the values on the procedure. No reason is needed. Every change is audited and flagged at the office review, and the last change stands. BTM is kept as recorded. So this is the feature 5.4. Apply anaesthetists adjustment. Anaesthetists adjustment is a changed price rate percentage discount applied where the contract lets the anaesthetists change their pricing. Typical arrangements including a discount to the contract, a discount the contract sets. The contract carries this as a flag set by AI, not a global rule, not a contract that does not let them. The price, the agreed price stands until the anaesthetist changes the contract or the office changes the price.

**Greg:** This English is like it's written by a 10 year old. It's not great English, but anyway, we will continue.

**Donald:** It's there. Yeah, no, I think it's fair. This is written by AI.

**Greg:** But AI is really good at writing rules. [unclear] English. I'm wondering if it would be an interesting experiment to go through this and ask it to clean up the English and see what it did. You know, maybe you could, can you mirror the repository and get it to have a go at that?

**Donald:** Yes.

**Greg:** It would be an interesting experiment.

**Donald:** Yes, but then you'd have to read another 200 stories to review it.

**Greg:** Well, maybe you're going to start with one, you know.

**Donald:** We're allowed the system applies a changed rate percentage.

**Greg:** I know Claude can do better because it's done a lot better for me. So I'm not sure why it's become so fumble-footed at the moment. But anyway, we're on.

**Donald:** Well, I think what we, there was an earlier story where you wanted to add in the note about whatever it was in terms of, I forget, you asked me to add something in, right? But then a few stories later, it talked about the same thing. And I think that's a little bit of what we're seeing here is we've asked the system to reference other parts or rules as it goes through. And so when you read these stories, it's tripping over itself to also include all the bits. I think that's what's going on. We're allowed the system applies a changed rate, a percentage discount, or replaces the whole total with a fixed final price. Either way, it records the fee as it stood before the adjustment so the calculation is never lost. A 100% discount or a $0 price gives a no charge invoice. No reason is needed, the change is audited and flagged at review. So, adjustment in charge, this is the current mock up and I I think I keep referring to this as a price override, and I think that's kind of a bit more of a simpler language. And so Claude, maybe take that on board as you read through this transcript.

**Greg:** I think the word pricing might be better because price refers to one of the fields and pricing could be seen to refer to any of the editable fields.

**Donald:** I always consider that. the price override is something that happens after all of the other calculations and contracts and things that might exist above it, all the time units, modifiers, all that sort of stuff. After you do all of that, you may then still choose to apply a price override to a higher fixed price or a discount, whatever it might be. When I think about the chain of actions, yeah.

**Greg:** Well, when you're looking at a time sheet, there are four or five fields that you can change. Price, discount, rate, units.

**Donald:** Yeah, so obviously you've got all your modifier units, you've got your procedure, your base BTM.

**Greg:** You could change the time, you could change the BTM. You could change the price, you could change the rate, you could change the discount. You can change all of those things. We need to ask the client if they want the price displayed, but theoretically you could display the price and if they didn't like it, they could change more until they were happy, couldn't they?

**Donald:** Yes, you're right. Yeah.

**Greg:** So I'm thinking about change, when you say change the price, I'm talking about change the pricing parameters. Yes. But price?

**Donald:** Sure.

**Greg:** So I just have a hesitation about using the word price because it's already used.

**Donald:** Yes, yep, that's fair. Okay, office can change any price. Admins can change the procedure's price rate discount at any time on any contract, including a fixed price. It is the only way to change a fixed price without changing the contract. It is a change to the values on the procedure like any other. No reason is needed. It is audited and the last change stands. The office normally touches booking last at review but it has no special authority over the anaesthetist.

**Greg:** That's not technically true anymore because it's the only way you can change a non-editable fixed price.

**Donald:** Yeah, yep, yep. Well that's what it says, right?

**Greg:** No it doesn't.

**Donald:** It is the only way to change a fixed price without changing the contract. I guess the implication is it's a fixed price it normally doesn't allow a price override.

**Greg:** But it's not universally true.

**Donald:** We don't quite know whether or not there are fixed price contracts that still allow a price override yet, right? Well...

**Greg:** And a lecitus might have a fixed price list.

**Donald:** At which point?

**Greg:** But they can change their tailor.

**Donald:** Sure, okay, yeah, yeah, yeah.

**Greg:** And there might be a similar arrangement with the surgeon where They have a fixed price list, but there's a proviso that says, You know, if we end up spending hours more on this, then you can charge more. Yes, which is whatever, because we put that flag in there, we can't make a statement quite that broad.

## ACC contracts and pre-operative billing

**Donald:** I think I know what you're saying. But I think it's really saying that only the admin staff can choose to override a price regardless of any of those previously established conventions. Fine. Yeah. Fixed discount contracts. Some contracts carry a fixed discount, for example, hospital at standard RVG pricing, less 20%, or a DHB contract at a discount. The system prices, the procedures as usual, BTM, multiplied by the anaesthetist own rate, less the contract's discount shown as its own invoice line. Where the contractor does not let the anaesthetist change its pricing, they see the discount applied and cannot edit or remove it. The office can change the price regardless. This is so the discount agreed with a contract holder is applied every time without the anaesthetist having to remember it. Seems right to me. Cool. ACC is billed via the contract holder's contract using the standard BTM modif BTM calculation. There's no separate ACC calculation paths. Yep, that's right.

**Greg:** That's assuming.

**Donald:** This is a feature, not the user story, is it?

**Greg:** Not all ACC contracts are RVG contracts.

**Donald:** That's right. Yeah, let's edit that in. Cool. There's no separate calculation path for ACC though. It's just obviously a name.

**Greg:** I'm not sure why we're separating it out. Well, let's see where this goes. Because we've got a really strong generic case now. So let's see if there's a reason why.

## Pre- and post-operative events, dates and scheduling

**Donald:** Yeah, you're right. This may be some redundancy in a couple of these stories. The system treats an ACC funded procedure as an ordinary procedure priced by the hospital or any other contract holder. ACC contractor using the standard base, time and modified calculation. ACC is never billed directly, it is simply who the contract holder ultimately claims from, which is invisible to the billing invoice engine. ACC pre-op flat fee codes. An ACC pre-operative assessment is a fixed price service ACC pays for when the anaesthetist sees the patient before the procedure. The anaesthetist records it against the real procedure as a pre-op event as an event not an added procedure its own element attached to a real procedure.

**Greg:** Now that's the first time I've seen that language isn't it?

**Donald:** Which one's that?

**Greg:** It's an event not an added procedure.

**Donald:** It's an event not an added procedure. so we have this generic understanding of pre-op or post-op event that you attach to a procedure. So you've got traceability of seeing the original thing it is attached to, but there's also the ability to just have an ad hoc invoice event as well.

**Greg:** So how do we, what's the user experience of it? How do we see that from the user perspective and how does that look?

**Donald:** I have some rough ideas in my head, but it's not made out yet. It's not been built yet.

**Greg:** If you've got multiple procedures on a booking, then couldn't it just be another form of procedure, non-primary procedure?

**Donald:** I suppose anything's possible, but I think in terms of traceability, especially when you do have multiple procedures related in a single booking you know when the necess is going to that post op here I would I think the best course of action would be to attach that visit to one of those procedures which ultimately infers who is going to be paying for it or you go all the way out and you attach it to the entire booking but obviously that can cause some weirdness as well.

**Greg:** Well that raises some complications about lists because usually done the previous or in that period preceding procedure, not on the day of the procedure. So that creates a list complexity. So is it another type of entity that sits on a list?

**Donald:** No, you would like, if we go to your list like this and you're looking at tomorrow's, I don't know, the name of this is probably not accurate, but you go to tomorrow's list and you talk to Paul here and you say, ah, I better go talk to him. you would find that, again, this prototype doesn't have it yet, but you'd find the particular procedure that you've got here and add a pre-op event to it.

**Greg:** But the procedure is anchored to a list, right? Yeah. And the list is on a different day from the pre-op event.

**Donald:** Yes. And a post-op event will definitely be on a different day, sorry, not definitely, but could totally be on a different day as well. Yeah, yeah.

**Greg:** You could see this one patient turning up on three different days potentially.

**Donald:** The way that the mental model I've got at this stage is that you might interact with this patient on many different days, but those interactions all have an origin against a booking and a procedure.

**Greg:** That's fine, but they They have different schedules.

**Donald:** When you say schedule, what do you mean?

**Greg:** They occur on different days. They sit on different lists because they're scheduled events.

**Donald:** So you're saying that like at the moment in, let's go back to here and look at the holy documents of the RFP. Hope you know that, I'm just joshing. this shows the different week, month to do, whatever. Okay, this shows different lists, right? Are you saying that some pre-op events are scheduled in and visible in their app?

**Greg:** Well, we're talking future state here. Okay, so you've got... These events that all have, these three events have a relationship, right? Pre-op one day, procedure the next day, post-op the next day, badly for the patient. But they effectively fall into, while they have a relationship to the procedure, the original booking, time-wise they would sit on different day schedules.

**Donald:** Yeah, so you.

**Greg:** So how do we represent that?

**Donald:** Well, as of now I don't have any concept or understanding of the system prompting the anaesthetist to do anything, right? It doesn't say you need to review next week's list or you need to review this procedure. That may be something that comes in the future, but as of now I'm not aware of any sort of requirement related to anything like that.

**Greg:** The system isn't proactive in that sense, but the anaesthetists do it.

**Donald:** That's fine, right? So The anaesthetists.

**Greg:** Remember being saying he needs the list because he needs to look up the patient and see what morbidities they've got and if they need any.

**Donald:** That's right. That's right. And he was saying he reads them as they come through in emails because that's easier than doing it through the app today.

**Greg:** His problem with that is that Vanessa's keeps sending him and everybody multiple updates of the list. That's right. That drives him nuts because he's got to eyeball the differences.

**Donald:** That's why he wants to get rid of that. Totally.

**Greg:** But I'm positing here that it might be simpler for everyone in the end to actually put a separate booking in for the pre and post-op procedures because it just sits nicely within the current methodology of how they schedule their activity. But they do have a relationship. Can we set up a link then to those three?

**Donald:** Well, yeah, we started this idea with the statement that this makes lists a little tricky. And I think it would make lists tricky. Yeah, it would make them pretty ugly. Yeah. Well, the thing is, once we get the prototype updated and caught up, we can actually start to look at what these things look like and test them and we still change them. But I think it would be good to get there.

**Greg:** And the argument is that a procedure is, if you like, a type of event, right? So we've now identified a couple of different types of events that we don't call procedures, we call them something else. But technically they're an event because the necessity does something at the time.

**Donald:** That was like, this is deep. We could call so many things an event, right?

**Greg:** Well, exactly, but I don't think, I think it would be very valuable to maintain a linkage between the pre-op and post-op events and the booking for the procedure.

**Donald:** Oh yeah, that's already understood.

**Greg:** How do you do it? I mean, technically it's easy, you put a link in. How do you do it if you're Vanessa?

**Donald:** Yeah, so it sounds as though I've not done a great job at casting you the vision of how I think this is all gonna come together. But if somebody comes to Vanessa or she gets an email, whatever the case may be, and they say, hey, I need you to create an invoice for this thing, or I need you to record a pre or post-op event for this patient, The inevitable question would be, who's the patient? What's the procedure that it's related to? All those sorts of stuff. So you would go and find that booking and the particular procedure, and you would attach the event to that. There'd be a button within that screen to say, create new pre-op event. You'd fill in the particular details. And then if it's something that needs to be invoiced, because I think we previously talked about the idea that you could skip I mean, let's click on this. Have we read it already? Yeah, we have, you know, there's a tick box to say whether or not these events will even be invoiced.

**Greg:** Yeah, well, they normally would be.

**Donald:** Yeah, yeah. And so that's how she would find it. She would find it based on the patient and the procedure that it was related to.

**Greg:** Yeah, but I'm talking about the time.

**Donald:** A time recording.

**Greg:** Well, no.

**Donald:** You're talking about. The calendar. Yeah, I think what I'm hearing you say is that.

**Greg:** I get all that. Yeah, But if you go into the procedure or booking and you add an event, that's good. But you might be adding that event for the previous day.

**Donald:** Yeah, so when you record that event, I would suspect you could also record the time that event happened. So even if the event is on the 20, if the procedure is on the 25th but pre-op is on the 24th and you're recording that pre-op event, you'll put a date related to that event so you could see what it was.

**Greg:** Yeah, because the I think we're going to find that it's mainly the anaesthetists that initiate these types of entry because they will do them in response to what they're reading. So I'll be looking at the booking for the day. I want to add an event to it for the previous day. Do they need to actually schedule it? Will it be on the surgeons? No, it won't. It won't be on the surgeon's list. Yeah, okay. Let's just leave it as a, it's effectively another event in the list of events in a booking. The procedures being the normal ones. And it may have a different date on it. Yeah. And it may, we'll need to clarify with, It may be billed all in one invoice or they may want to separate the billing app. I'm not sure about that.

**Donald:** Say that again.

**Greg:** Well, if they go into the booking and they click whatever and they add. a pre-op event to it. Yes. And they say it's, you know, the day before.

**Donald:** Yes.

**Greg:** Because the ops tomorrow and they're going to do a pre-op event today.

**Donald:** Yes, yes, yes.

**Greg:** Could have been a phone consult patient, could have been even.

**Donald:** Are you describing like holding off on the invoice to go with the procedure or bill as soon as possible?

**Greg:** I imagine there will be situations where that will just be another line of the invoice.

**Donald:** Certainly, certainly.

**Greg:** Or there may be We'll need to ask Vanessa. Well, there may be instances where it requires a separate invoice. So we'll need to talk to Vanessa to find out if there are any business rules around how we manage that.

**Donald:** Yeah, that's a good question. My assumption would be that if the system marks that an invoice needs to be created, it would create them right away and send them out.

**Greg:** So, and the other thing that's come out of this, which I think you had sorted before I had, is that the pre-op events don't appear on the schedule. They're just an addendum to the call booking. This one. Okay. On there.

**Donald:** Cool, cool, cool, cool. So.

**Greg:** It's worth a question for Vanessa though, about events on a book.

**Donald:** Yeah, and when they're billed and stuff, because-.

**Greg:** How, what are the business rules about?

**Donald:** I agree, because like I said, my assumption is that they would just be billed in the next round of invoices, whatever. But maybe not. Maybe they actually just get held until the actual procedure. So we need to figure that out.

**Greg:** They're pretty rare, although I understand that in other areas of the country, there's a lot more of this activity than occurs than the way AA operate in Christchurch. And Ron knows more about that.

**Donald:** Okay.

**Greg:** All right.

## Pre-operative codes and configurable event pricing

**Donald:** The pre-op event, priced at the fixed fee contract, price of the fee contract, never. I don't know what these are talking about. Actually, like, I don't remember talking too much about ACC pre, I mean, what are the sources for this? Notes for meetings with you, RVG guide, does that talk about CSV somewhere? I mean, ACC.

**Greg:** I would doubt it. Okay.

**Donald:** Clinical service operation. Okay. Preoperative consultant. Okay. So these are the three codes that it's talking about. If we go back here. So actually if we go to.

**Greg:** Back to this.

**Donald:** Page 15, 14. There we go. So simple pre-operative complex consultation. Doesn't even provide prices, presumably that information going somewhere else.

**Greg:** Yeah, OK. So that's just the codes, right? Yeah.

**Donald:** OK. Cool, so this is describing the three different types of things. The pre-op event is priced by a fixed fee contract. I don't know if that's true. No, I don't know if that's true either. There's never a prime procedure. I don't know where this ******** came from. 5.5.2, I'm going to delete these pre-op event lines.

**Greg:** Yeah. Well, we want to make it follow the rules that we've got in this because we've got an engine that will We'll allow the admins to configure that that way if they want to.

**Donald:** Yeah, the only way the only thing I'm seeing here is that if you select, you know, create a pre-up event.

**Greg:** CS250.

**Donald:** Yeah, there might be some pre-configured ones like these ACC ones, otherwise it's just a free text field, you're putting whatever you want in.

**Greg:** Just set up country.

**Donald:** Yeah. Okay, agreed. Cool, by golly, we finished it, we finished that one. We're making good time. Do you want to grab a coffee or something?

**Greg:** Yeah. Do you think we doesn't matter, but just for clarity for the developers, do you think we should put in there that these events don't appear, even if they're dated differently, they don't appear on any other list, they just, they live with the booking.

**Donald:** That is always been my understanding. That's an assumption. Yeah, yeah, that like if you did something, a pre-op event for somebody next week, next Tuesday, and then you look at your list for today's Tuesday, you would not see that and come back to you. Also somewhere in here... I made an artifact somewhere that was... relevant to what we're about to talk about. Let's see if I can find it.

**Greg:** Now, you said one o'clock.

**Donald:** So I meant 12.

**Greg:** You meant 12?

## Patients, NHI identity and intake exceptions

**Donald:** You meant 12. 12 to 1 is the break. Patients and billable parties. Every patient has one record in the system, key to the NHI with their contract details. Contact—contact details, thank you. Thought that sounded weird. Each booking, sorry, names a payer, billed whenever the procedures contract does not hold. ballots holder. The payers defaults to the patient but can differ for example a guardian paying and receiving the invoice for the child. NHI is mandatory with no blank. Insurers are held as master data with an accepts direct claims flag and the office records the approval number on an insured booking The selected contract decides who is billed, the holder's billable party, when the holder pays AA itself, otherwise the payer named on the booking. Admins can see a patient's outstanding balance across all anaesthetists and are alerted when a patient who owes AA money, mild alert under the threshold, are strong over it, or holds a credit balance, mild alert is booked again. So that's the epic that's going to describe a little bit of everything we're going to talk about underneath this, epic 11. Let's just see what's happened here. Looks like it didn't get saved somehow. Maybe had a branch before I merged on my computers, or wiped my computers, that's right. Actually, let me pause this recording so we don't do it twice. Cool, patient record, each patient has exactly one record on the system. identified uniquely by the NHI. The system keeps exactly one patient record per NHI, holding demographics, ethnicity coded to NZHIS level 4 and contact details. This information can be supplied by the hospital, the surgeon or AA itself.

**Greg:** Now where did that come from, demographics, ethnicity coding? Because.

**Donald:** Feature 14 down the road here New Zealand identity standards it may not be right but IFP booking and systems upgrade maybe this is something from here or from here you don't think that's right I guess if we don't need it right I don't.

**Greg:** Think we need it okay yeah I think It may be part of the FHIR document standard, and it may come in as an extra bit of information on the interface, but it's not necessary.

**Donald:** Yep.

**Greg:** It doesn't mean we shouldn't allow for it if there's a field in the end. one of the interfaces for it, but that's different from requiring it.

**Donald:** Yeah, let's ask. Thinking about it, let's keep reading. This information can be supplied by the hospital. When a patient returns, the system matches them to this exact existing record by the NHI, even when their number or address has changed since their last visit. rather than creating a new one. Each patient record has an NHI from the moment it's created with no blank. A booking that arrives without one waits at intake and creates a no patient record. See, patient with NHI, does it do that? We're about to look at this. NHI is mandatory, every patient record has one and there's no blank NHI. booking cannot be saved without an NHI. A booking that arrives without one from a feed or surgeon's PDF is not a booking yet. It waits at intake on the unmatched queue until the office adds the NHI and then it is matched and becomes a booking. The early idea of a booking going ahead with NHI pending and authorising blocked is dropped. That's because the booking arrives at the feeds and theatre list that sometimes omit NHI and you don't want things rejected out of feeds, the intake row is kept, not lost. The procedure never goes ahead without NHI in the room. So the NHI exists when the office does not have it, even when the office doesn't have it. This is contradicting itself a couple of places. Right? Is that the way you read that?

**Greg:** Well, it's creating an interesting problem because you've got a list from a surgeon and you drop it onto the schedule, but there's a booking on it that doesn't have an NHI.

**Donald:** Well, I heard that, I heard from Ben and Vanessa that that never happens. Well, that they keep, those upstream systems also. care about NHI and put someone on, wouldn't put somebody on a list if they couldn't identify the patient was.

**Greg:** I wanted to enforce this because this issue is causing a lot of problems at the moment.

**Donald:** As far as I understand, it is agreed that the system does not allow like this. I think it is. I want in principle.

**Greg:** It absolutely is and I agree with it. The question is what does that mean in terms of? operational system, where are you going to put it? Because you've got a broken list now.

**Donald:** So if for whatever reason, an upstream system submits a booking in a list that doesn't have any NHI, I would say we would need some sort of workflow to accept the list, but not accept that single booking. And it would sit there in a way that needs to be resolved somehow. But if I trust what Vanessa and Ben said, the other systems People should be motivated to solve that problem and it generally getsts solved before it comes to us.

**Greg:** It's a high priority problem.

**Donald:** Yeah. So...

**Greg:** So, would we put a placeholder in the list to show that there's a booking there that has an error condition and then stick the booking on an error list or the evidence fix?

**Donald:** Can you say that one more time, sorry.

**Greg:** When we get the list in and it's got a booking in it without an NHI. We add the list, we indeed add the bookings in the list, but we can't add the booking that hasn't got the NHI, so we stick it in an error queue.

**Donald:** Yeah, something like that.

**Greg:** But maybe we should put a placeholder in the list that says...

**Donald:** Oh, I see what you're saying, error to be advised. Yeah. I mean, something like that makes sense to me.

**Greg:** Well, it's a really good visual for the, at least it is saying there's a problem. There is a booking here, but there's a problem with it.

**Donald:** Yeah. I mean, that sounds quite nice.

**Greg:** And the office would see that as well.

**Donald:** Yes, it's basically, it's a stub and a list. Everyone can see it. Everyone can be warned about it. But none of it would be needed if the system just says ****** off. You can't submit. None of it. Nothing can be created without it.

**Greg:** That's not helpful.

**Donald:** Yeah. So. If we want, we could raise this as another question to really drill down and say like, are you sure?

**Greg:** About what?

**Donald:** Are you sure that the system will deny any sort of creation of a booking without an NHI? But as far as I understand from the previous conversations.

**Greg:** I've got a design problem if it does, because then you've let a patient into the system without a unique identifier.

**Donald:** No, I'm saying we wouldn't allow a patient to come into the system without a unique identifier. You don't agree, like even all the problems you were talking about make a lot of sense to me.

**Greg:** So that works, right? We dump it on an error queue and we put a stub in the list so that anyone who looks at that list goes, oh, the first thing that will happen is Ben will ring Vanessa and go, what's going on with this? Or anybody will ring Vanessa and go, what's?

**Donald:** Going on with this? Well you have to, yeah.

**Greg:** And that's great.

**Donald:** What you're describing, I think truly is a very good experience for everyone involved. But then that implies that our system will still allow a booking to somewhat be ingested without an NHI. Without that, upstream system might get an error or an email saying, could not import this, or somebody will get some sort of error log saying.

**Greg:** Well, we have some sort of good on it anyway, but the NHI is still a unique index, so it's mandatory, right? So it's got the record will have an underlying identifier other than the NHI. So database guys don't like creating too unique indexes, but that's effectively what you'd need to do. And that lets you handle it from a user experience point of view, it lets you handle it quite elegantly.

**Donald:** Yeah, I mean, your design solution is very nice. I'm just thinking, is there a version of this app that can exist without needing any of that? Because we just don't allow this grey zone of a booking without NHI.

**Greg:** The problem is that you can't just not accept something, you've got to do something with it, especially if it's a hospital fee. Now, how you would get a hospital fee without NHI is beyond me, but you would need to allow for it, right?

**Donald:** Okay.

**Greg:** You would need to allow for it because it's a circumstance that would crash your system or start, you need to.

**Donald:** Account. Yes, you either bring it in gracefully or you deny it in some way that is a bother to either the upstream systems who will ignore it or ask people who then need to communicate with those upstream to fix it. Yeah, that's right. And so I think you've rightly raised it. Let's bring out another question and figure out the right way to do it. And so Claude 11.1.4 is a bit of a muddled thing right now. And so I'd like you to raise a new open question for Vanessa and/or Ben, and we can address that. So when we go back to this, which is 11.1.1, When a patient returns, the system matches them. Oh, sorry. Each patient record hasn't yet tried for the moment it's created with no blanks. A patient that arrives without one waits at the intake and creates no patient record. Yeah, so I still think that makes sense to me, which is to say on the matching screen, it sits there until it's resolved. Absolutely. Cool. Okay, let's pause a moment and go back to this ethnicity code because we have an answer over here. The wording comes from the RFP. None of the meeting notes or change logs mentioned ethnicity, demographics, the phase has been in story since the catalogue moved. Two parts it comes from. Holding demographic, RFP page 8. Patient identifiable NHI number plus demographics, patient and billable party details as applied by surgeons. And down here, all patient records must be linked to a national health record, number available, ethnicity coding must use this. So there you go. I guess RFP page 38.

## Patient demographics, NHI checking and unmatched bookings

**Greg:** But again, so I'm happy with that because I know I'm sure the NHI will have all this stuff in it as part of its identity management. And it just, when you hit it with a number, it's going to give back to you, but we don't care.

**Donald:** You're saying our system doesn't need to display it anywhere?

**Greg:** Well, it might want to hold it, but there's nothing mandatory about it. That's the point I'm trying to make. I'm happy to have a place for it.

**Donald:** Yeah, I mean, I would say that if no part of our system does anything against it, we just display it as information.

**Greg:** Exactly. And it could be useful information if it's there, but that doesn't mean it's mandatory. That's all I'm saying.

**Donald:** Yeah, sure, sure, sure. Yeah, you're saying that if whatever reason the NHI records don't include an ethnicity, then our system's fine with that.

**Greg:** Yeah, it is. And I think part of this requirement somewhere is we ping the NHI when we get a number to.

**Donald:** Validate it, and that.

**Greg:** Probably all just comes back in the return message.

**Donald:** Cool. Yeah. Okay. So this is so that every clinical episode for the same patient links back to a single record, whoever supplied it, and the same patient is never duplicated just before the details are recorded differently at check-in. Okay, cool.

**Greg:** That's the issue we're trying to solve is a lot of duplicates in the system.

**Donald:** Cool. Okay. Dual format NHI validation. The system validates both NHI formats, including the new format Health New Zealand is introducing. Because new NHIs are issued randomly rather than sequence, the system never assumes the NHI is numeric or sequential. This must be working by July next year. Sure. Seems fine to me. Patient without NHI we just talked about. We have some open questions, so let's move this back to open. And then intake rows waiting for NHI. An incoming booking with no NHI waits on the unmatched queue until the office adds the NHI. This story is the office's view of these waiting rows. It shows the patient as received the list or date and the surgeon's room to chase and marks the ones whose besieges date is close. No booking and no patient records exist for such a row. So a missing NHI can never produce a duplicate patient. Cool. The office emails surgeon's rooms to get the NHI, some rooms PDS leave it out. So it may only arrive with the daily hospital theatre list when it arrives the office adds it and the row is matched to the patient's single record and becomes a booking So it's crazy to me that this could sit unresolved until the day before I know.

**Greg:** There's also a hint there that reinforces what Vanessa was saying more that the hospital only sends the theatre list 24 hours before and that's the only time missing But she also said they said something else.

**Donald:** I mean, yeah, you said yesterday at the end of yesterday that you wanted to kind of look into more of what these things look like, these messages in hospitals and such.

**Greg:** Yeah, yeah, I'm gonna do that.

**Donald:** Because, yeah, it's a big, like everything we've just described up to now, if we assume that we are aligned on that, what this is saying is that you might get a list from a surgeon's room a month ago and it sits there unresolved without NHI until the hospital and comes into the picture the day before.

**Greg:** Well, the system's now going to chase you to resolve it.

**Donald:** Yes, that is good, but it's pretty poor that it's not included there. And so...

**Greg:** Well, the reason why it's happening at the moment is because the NHI is an information field, not a unique mandatory field.

**Donald:** You're saying in their current solution? Yeah. Yeah, that's fine. It's allowing them to slip through. Yes, but... if for whatever reason the admin staff do not chase up that NHI and get it resolved, you then have a whole bunch of partial lists sitting there for patients. And this is where the stubs become even more important. Yeah, so this sounds like it could be more common. Okay, this is because the NH, so Claude, you just heard us talk about a whole bunch of stub booking within a list. for patients that are missing an NHI. So we still really want those stubs to exist because anaesthetists may want to see them, but everyone involved, anaesthetists and administrators should be made really clear about what this stub is and the admin team need to resolve them.

**Greg:** And the reason we need a stub is because you can't post the record because it doesn't have an NHI.

**Donald:** So please make a new feature for that and figure out how it fits in with everything else we've talked about. This is because the NHI has a patient identifier, blah, blah, blah, blah. OK, cool. Yes, I think we agreed with this. And then I think we actually should just go back to this patient without NHI. And I think what we've just described probably needs to exist. And so I think we're agreed on that too. OK. Cool, this brings us to feature 11.2, who is billed, holder or the payer on the booking?

**Greg:** One moment.

**Donald:** Okay.

**Greg:** Yep.

## Contract holders, payers and billable parties

**Donald:** Cool. So this is a document that just got created while we were talking. So let's be clear about who's who. A contract holder, who is who the agreement is with, it sets how a procedure is priced and Rules that apply. Holds many contracts, that could be a hospital, insurer, surgeons or rooms, anaesthetist, AA. Keep the master data with the contracts. Over here we've got the payer on the booking. Who pays if the holder doesn't? If your booking name is one, pre-filled, from the patient, the office, or anaesthetist can change it. Can be a patient, parent or guardian, keep it on the booking. So that brings us to this middle thing, which is the billable party who receives the invoice, decided by each besieger's contract, holds the invoice email, never the contract.

**Greg:** I could imagine there will be some cases possibly where we've got very focused on the guardian, but there could be cases, for instance, where-- A benefactor. A family trust is involved. Sure. So it's just another party.

**Donald:** Another party, exactly. Yeah, I agree with you. Billable party. Holder is billed, yes, they become the billable party. If the holder is not billed, no, the payer is insurance debt. These arrows are confusing to me. If the holder, culture holder is billed, they become the billable party. If the holder is not billed, the payer becomes the billable party, I think is what it's saying. Cool, does that seem right to you in terms of our language? Yeah. So we've got some other stuff here, let's take a look. So we're looking at artifact 44 here. The officer's main job at booking setup is to identify who pays. Pick a contract holder, then the contract in line. Is the holder the billable party? Yes, then bill the holder, if not, bill the payer. Seems good to me. And then some typical arrangements here, but I think we're aligned. Okay, great. So with that and done, each Procedures contract decides who is billed. If the contract's holder pays AA itself, such as an insurer that accepts direct claims or hospital, the invoice goes to the holder's billable party. Otherwise, the invoice goes to the payer named on the booking. This covers a holder that only sets the price, a surgeon's fixed price arrangement, and needs its own contract or no contract REG. Oh, hang on, let me.

**Greg:** Just read that again. or pays AA. Yep. That would be a hospital or an ENIB, such as an insurer that accepts direct payment. Yep. The invoice goes to the holder's billable party. Yes, that's correct.

**Donald:** That's point one.

**Greg:** Yeah. Otherwise the invoice goes to the payer named in the booking. That's correct. Because the patient is the default billable party. Yeah, the default payer, this covers a holder that only sets the price.

**Donald:** Yeah, so you might have a contract that will still define what the price is going to be, but who pays for it is, in this case, the... payer name of the booking.

**Greg:** Yes. This covers a honor that only sets the price. And unless it is the same contract and no contract. Yeah, that's fine.

**Donald:** Yeah, I'm with you though. It's a little, you got to step through it. The payer on the booking is filled from the patient automatically in the office, or the nurses can change it to a parent or guardian. and Claude, as you just described, or other, right? It could be a trust or whatever else it might be. This is so that a contact alone decides, sorry, this is so the contract alone decides who is billed while the name and email of whoever pays in the payments place are recorded on the booking. Is that right?

**Greg:** So the contract alone decides who is billed. or the name and email of whoever pays.

**Donald:** Yes, it's called the booking, yes.

**Greg:** That's correct.

**Donald:** Yeah.

**Greg:** I think this, just from a storage point of view, it's duplicating every address of a patient that's billed. It probably just needs a tick box that says different payer.

**Donald:** Yeah.

**Greg:** And then it would only fill out the payer file. It's just a little bit lighter on storage. use the address of the patient or tick, don't use the address of the patient. Because Ben said, look, we only need an email address and a phone number. It's not very hard.

**Donald:** Yeah.

**Greg:** So, although I think that's the odd way that doesn't have email and they want hard mail. So that happens.

**Donald:** Okay.

**Greg:** We haven't talked about what we're going to do about that. I think.

**Donald:** I mean, any invoices that are created in the system could presumably just have a dialogue to print them, and then they get printed and put into an envelope and sent out. But Xero does not handle that. So, well wait, maybe Xero does handle it, because you still create the record in Xero, and when something is paid, Xero will record that payment.

**Greg:** Oh yeah, but the invoice is generated outside of Xero, just the invoice detail is sent. Yeah, we're not, we're not issuing the invoices out of Xero. Okay, we'll get back to it.

**Donald:** An event on a procedure can have its own billable party. By default, the procedures event billable party.

**Greg:** Really? That's an interesting question.

**Donald:** I thought that was decided that there may be situations where it's different people that pay for those.

**Greg:** Yeah, the event is attached to the procedure, not to the booking, isn't it?

**Donald:** Yes.

**Greg:** So therefore it should use the procedure's details.

**Donald:** That's just what I'm saying. An event on a procedure can have its own little party by default as the procedures.

**Greg:** Can it?

**Donald:** Yep. Okay, so that's the feature. Let's go down into the stories themselves now. Patient billed when the contract does not bill its holder. Yep. When a procedures contract does not bill its holder, the payer on the booking is billed. And that is the patient unless the authitis or least this changes it. applies to not contract RVG. It needs its own contracts, a surgeon's fixed price arrangement where the surgeon only sets the price and the patient pays, insured patients who pay AA and claim the money back from their insurer themselves, priced under the no contract RVG. This is a common case, most patients pay for their own procedures.

**Greg:** I'm not sure if that's.

**Donald:** True. Okay, we can remove that line, but it is common though, right?

**Greg:** It's common, but I'm not sure of that.

**Donald:** Okay, cool. Happy with this.

**Greg:** Yes.

**Donald:** Great. Every booking names a payer, a person invoiced whenever a procedures contract does not bill its holder. The payer's name and email are filled in from the patient's details automatically. The office or their necessary can change them to a parent, guardian or other person who pays. The hospital or insurance Taking the invoice is not the payer, the hospital or insurer, taking the invoice is not the payer on the booking, it is the contract whose holder pays AA. For example, why should I take the invoice instead of the patient? Does that sound right to you?

**Greg:** Yeah, it should say accepting the invoice because they are now, they are effectively, but they are being paid as a billable party. I think that's what it's trying to say.

**Donald:** So here it says hospital insurance accepting the invoice.

**Greg:** Yeah.

**Donald:** So what's the, I think I'm getting a little bit lost in the source here.

**Greg:** It's a very ugly wording. Basically what they're trying to say is... What they're trying to say is that a contract holder with a nominated billable party uses the billable party record, so the invoice.

**Donald:** Say that one more time and I'll just have the image up.

**Greg:** A contract holder that nominates a billable party uses the billable party detail for the billing, for the invoice.

**Donald:** Sure, so this is a situation where--.

**Greg:** Southern Cross contract, the billable party is Southern Cross.

**Donald:** Oh, so you might have a Southern Cross contract for ACC, and the billable party is ACC?

**Greg:** Normally, you have a contract holder, the contract holder is Southern Cross. Normally it's a one-to-one relationship between the contract holder and the billable party. It's just an externally held address, right? It's like contact. So if the contract holder, there's a flag on the contract holder somewhere that says has billable party or not, and then it uses that address, which is what that's showing there, right? Holder is billed, yes, use the billable party. Holder is billed, no, use the payer.

**Donald:** Okay.

**Greg:** That's what it's trying to say, but it's really making.

**Donald:** I really don't like this word payer on the booking, but it makes sense because you can't be patient. But I want to think, my brain wants to think patient.

**Greg:** Accounting uses payer and payer. Yeah. It is the payer.

**Donald:** Yeah.

**Greg:** It's an awkward word though, isn't it?

**Donald:** Okay. So this line here, then, just I read it again. Hospital insurer accepting the invoice. is not the payer on the booking. This is a statement. It's not saying 'if', right? Is this trying to say something different than we've already established? Maybe I just delete it. And then it says, This covers the case where the person responsible for the payment is not the patient themselves such as the guardian of a child. Yeah. Okay. Well, we've corrected the record. Payer on the booking editable to the guardian. Every booking names a payer, person invoiced. I think that's right, it's pretty simple. Yeah, it is simple. Payer email required when the payer is billed.

**Greg:** There was one thing I was going to mention there is we haven't mentioned address. There will be some patients who need an address because they don't have an email. So it should say, what does it say about patient? Just maybe the next one back.

**Donald:** Well, here it says that payer email is required, but this one here, nothing else really says the details that this needs. And so what I'm hearing from you is that when a contract, when you're getting a contract and you're selecting the billable party. Yeah. You know, we don't really need the address of the hospital or the insurance because we'll have nominated email addresses for those things to go to. But for a payer on a booking, you're saying we do require an address?

**Greg:** Well, I think it should be part of the record that they should be placed for an email and an address.

**Donald:** Okay, address is optional but not required.

**Greg:** Well, one of them has to be filled.

**Donald:** Sure, okay. So Claude, figure out the right requirement to add this to that. payer on the booking.

**Greg:** Yeah, using the NZ post standard email, standard address format.

**Donald:** Yeah, we need to either have an address or an email, postal address or an email address, yeah. Okay, number three here. When a procedure is billed to the payer on the booking, the system requires a payer's email. This is because no contract holder such as hospital insurer takes the invoice instead.

**Greg:** That should take email or retrace.

**Donald:** Yeah, so this is Claude update 11.2.3. And then last one here, warn when the child is the payer on the booking. When a patient is under 18 and the payer on the booking, and is the payer on the booking for a procedure billed. to that payer, the system gives AA staff a mild warning. There's no warning when someone else is billed, for example, a parent already set as the payer or a hospital whose contract bills it. We can come back to this part in just a sec. The warning does not block saving the booking or authorizing the list. It shows on the dashboard to-do list where admins can clear it. And it reminds the office to check the payer's details. The patient or guardian's name and emails which are held on the booking. There's no separate guardian record. Yes, so we don't record guardians, we just...

**Greg:** No, and we only have the patient's age, so we can only flag on that anyway. We don't have anyone else's age.

**Donald:** Yep, cool. So this part here I've highlighted. Does it, I don't know what that's saying.

**Greg:** There is no warning when someone else is spelled For example, a parent sets payment or a hospital use contract bills. Yeah, that's fine. There's no warning when a hospital accepts payment for a child because they're the payer.

**Donald:** Oh sure, okay. So when a contract holder is the bill party.

**Greg:** Yeah, they've gone away from the term contract holder and it makes the reading difficult.

## Patient balances, warnings and follow-up notes

**Donald:** Okay, well, Claude, update 11.2.4 to use the term contract holder to make some of this a little more clear. Cool, that's agreed. Moving on. Patient outstanding balance and alerts. Admins can see a patient unpaid invoices and are alerted when a patient is booked again while they owe AA money. A mild alert under the alert threshold, a strong one over it. Or hold a credit balance, mild alert. Admins can view a patient's record and see all invoices, all the invoices, each showing whether it's been paid, part paid or unpaid across every anaesthetist the record has been booked with.

**Greg:** That's the problem with the current system. They're siloed that they can't spot unpaid bills and repeat bookings, which you get with naughty cosmetic procedures, patients doing cosmetic procedures.

**Donald:** I should get some done before we build this. This gives AA a single view of a patient's billing history since each one is to otherwise bills separately. We agree. Alert on booking a patient with unpaid bills. When a booking is created or matched to a patient who has a balance with AA the system alerts AA staff. For an amount owing the alert is mild while the unpaid invoice is younger than the alert threshold. it's stronger once it's older. Threshold days count from the invoice date it applies only to amounts owing and starts at 90 days. Until EA asks for a settings page the threshold is fixed. A credit plus balance raises a mild alert. Mild versus strong is yellow versus red warning. Sure. Staff can always waive the alert though, it never blocks a booking. This is how AA can follow up on outstanding balance before the next PG goes ahead. Patients are allowed 90 days to pay AA. AA raises around 100 invoices a day, so a younger unpaid invoice is not yet a problem. Some patients come back with invoices six months to two years old. Sure. I think the only thing I would say needs to be added to this is that I understand anaesthetists also want to be alerted if they're sitting down in front of a patient or in the theatre, whatever the case may be, and they see this patient has unpaid bills. Is that right?

**Greg:** I assumed that it should come up on the list.

**Donald:** I thought I heard that somewhere.

**Greg:** Yeah. So the mild alert is some sort of color code on the list and I guess we could have some sort of generic mechanism that--.

**Donald:** Can display a warning or whatever.

**Greg:** It'll show you all the warnings relating to that.

**Donald:** Yeah, or notes. Yeah, I agree with you. That's all good. OK, 11.3.2, Claude, can you update this to also mention that it's not just the admins that can see it? AA staff, oh, sorry, anaesthetists also want to see it in their apps. Follow up tools, admins. can record follow up actions and resend invoices to patients outstanding items.

**Greg:** Oh, can I just interrupt you there? Yes. So can an admin clear an alert?

**Donald:** Yeah, so we, I think this presents in a few different ways. So at the moment we've got this concept of alerts going to like essential to do list or essential sort of notification pool. And so I don't think this is describing putting something into those pools. This is just something that's on the person's record. So when you're maybe at the matching screen and you're looking through it all and you see it, they are alerted of it. And I would say that that note on that record would never be cleared until the payment is made. They just keep getting alerted for it.

**Greg:** Well, the thing is it stays yellow or red and that might be I have to ask the users, that might be a distraction. So, there might be, like, I imagine if you're gonna put on a booking, you're gonna automatically put it on a list.

**Donald:** So, that's what we've just said, right?

**Greg:** Yeah, automatically, though.

**Donald:** That's right.

**Greg:** Yeah, so then you can have a... a status where you can say, well, I've read that so it doesn't sit on the list forever. But you might also want to say that you want to close the alert because it may be an alert that sort of is good to know, but it's sort of nuisance value and you just can neutralize.

**Donald:** Yeah, we'll have to think about that because you then have a situation where you have to somehow somewhere record the status of the read receipt or the dismissal receipt on every unique notification. And I don't really see this as a notification so much as it is an alert. But I hear what you're saying. It could be frustrating.

**Greg:** Could be annoying, but there's lots of, you know, and they hear you going, oh, oh.

**Donald:** Yeah, that's right. If we find that we launch the system tomorrow and actually about 80% of the bookings are true to this condition, we would have to change it.

**Greg:** So you might even want to attach a note to an alert. So if the alert does bring it up, not only is the alert there, but perhaps there's a Vanessa note there that says, you know, didn't we sorted this or something?

**Donald:** Yeah, it all gets quite complicated because then what do you do if in a situation where somebody excuses an alert by mistake, but they wanted it to come back and then you need some mechanism for that. So it's a pain in the ***. I think it's like doing bank regs. Yeah. I would say on some level, we need to cross these bridges when we get there. And they'll all be solvable, but yeah. Okay, so follow-up tools, admins can record follow-up actions and recent invoices for a patient's outstanding items. This is some admin's follow-ups on unpaid invoices that are tracked in the system, not just remembered. I'm wondering where this came from.

**Greg:** I don't know where this came from either.

**Donald:** Ledger Xero is not built to be a ledger of this kind, especially linking to patients, since patients cannot, our contacts can be purged from Xero while the patient must remain in our ledger. If a patient has something unpaid, a further procedure would probably be cancelled, or at least AA wants to be alerted, features need to make this visible for follow up.

**Greg:** This is all talking about the methodology around managing alerts, right?

**Donald:** Yeah, I guess like these screenshots aren't dated, so I don't know if they come from some mildly updated versions of the prototype. But it's just kind of highlighting, look, you can send voices to people, and you could resend them to people. So I don't think there's actually much here that needs to change. It's just showing.

**Greg:** Yeah, I still think that all of those actions around management should allow a note somewhere so that a follow-up reader can see anything that's been left behind or done before.

**Donald:** Yeah, I hear you. I think maybe the right way to solve what you're describing then is some sort of generic free note section, which I think already sort of exists to some extent.

**Greg:** Well, we're sort of...

**Donald:** So we had notes from the office.

**Greg:** It's a generic handler, it's a generic alert handling mechanism, isn't it?

**Donald:** Well, yes, we, what you described, like what I heard you describe earlier sounded quite good to me, which is that there could be dozens of different reasons why an anaesthetist or whoever the case may be would want to be alerted of something on a booking or a procedure or a list maybe and so some sort of generic way to handle that makes a lot of sense to me the added wrinkle on top of that which is letting people have free notes attached to those and then dismissing them and maybe recalling them back and all that sort of stuff I see lots of wasted hours of time trying to do that so I'm thinking maybe a more right-sized way to solve that is basically a free text field that can exist attached to a list or a booking that allows like anybody to type in there and they can see it yeah yeah yeah.

**Greg:** I'm not precious about that just something.

## Insurer billing and approval numbers

**Donald:** Yep I hear you I hear you okay last one under patients and billable parties insurers held as a master data, each flagged as accepting direct claims of AA or not. The selected contract decides who is billed.

**Greg:** Actually, they're just an instance of contract holders.

**Donald:** Yeah, you and I talked the other day about basically you'd see a drop down, it's like a tiny little address book, who's actually the person who's going to receive this invoice and you can pick them.

**Greg:** I mean, normally there'd be a one-to-one between those two boxes.

**Donald:** Yes.

**Greg:** But there potentially could be, they could have different email addresses for different contracts.

**Donald:** They could, yeah, you're right.

**Greg:** But that is just a contract holder. I don't see that being an insurer.

**Donald:** Yeah, the only, the only unique thing is the potential that if somebody's direct paid, We don't know how that's handled at the moment. Does it go to an email that goes into a portal or is there some other sort of API integration that goes directly to NIB? I don't know how that works. That's right. So I think that's maybe the only thing, but I think I hear what you're saying, which is that potentially this is a little bit heavy what's needed because it's creating a whole bunch of structure where they may not need it. Is that right?

**Greg:** I just think they've gone away from using contract holdup in contract and the narrative is now talking about insurers, hospitals, etcetera, etcetera. And actually it's more concise to talk about contract holders because they have a different status from a patient.

**Donald:** Yeah. Yes.

**Greg:** And I would rather see all of this headed as contract holder, right?

**Donald:** Yeah, this is all sitting underneath the patients and billable parties epic. And I think, let's read through them, but I think I might be totally aligned with you to say that probably lots of the questions that these are maybe uniquely trying to answer could just be filtered into the other epics or features. Okay. The selected contract decides who is billed, yes, the holders billable party when the holder pays AA itself, such as an insurer billed directly under its own contract. Otherwise, the payer named in the booking, usually the patient who forwards the invoice to the insurer for reimbursements. Yes. So, maybe, okay, I'll finish this. The booking records the insurance approval number and the V6 diagram also names insurer here. So yeah, I guess there's the other part of insurers is that bookings come through and say whether or not it has insurance or it's been accepted.

**Greg:** Yeah, but it's only a data field on the booking.

**Donald:** OK. And we only-- It's not mastered. OK. OK. Well, that's the epic, so the feature. Let's read the stories and see what comes out of this. Admins maintain insurance master list, maybe. Each with an accept direct claims flag. Again, we don't quite know how that works, but this doesn't necessarily have to be the solution for that problem. Where an insurer accepts direct claims, it is a holder that AA invoices and holds one or more of the insurer held contracts governing how the procedure is billed and priced. I think I agree with you. Why is this special? It's really just essentially a billable party you can select.

**Greg:** We will need a flag on billable, on contract holder or billable party.

**Donald:** Yeah.

**Greg:** Which says whether it generates an email invoice or whether it generates some other output for reporter. Yes. If it's talking about that, then it's sort of, again, making a real muddle of something.

**Donald:** Yep, I think I totally agree with you, mate. So I'm going to mark this as, just proposed, which is our lowest version of this, and let's read the last two and then we can tell Claude what we want it to do. Insured patient who affords the invoice when a contract chosen for an insured patient's procedure does not bill its holder, for example, no RVG, the patient pays and claims the money back. The system invoices the payer named, usually the patient who's billed, The patient then forwards the invoice. Our system doesn't need to care about any of this. It just needs to select who's going to get the invoice. And so if a booking comes through and it says they have insurance, and we already talked about the condition where it says the patient has insurance but not pre-approved.

**Greg:** We bill the patient, end of story.

**Donald:** Yeah, we bill the patient and also that's just information that is used by the admin staff to select the right contract which will determine who pays. Insurer and approval number on the booking. Where a booking is insured, the office records it on the insurer and the insurance approval number. I don't think we need insurance approval numbers, do we?

**Greg:** No one's talked about this? Ah, yes, it's only come up recently. You can have insurance like Southern Cross Insurance, but that doesn't mean that Southern Cross have accepted your claim your pre-op claim for cover on whatever you're having done.

**Donald:** Say that again, sorry.

**Greg:** Okay, so I've got something across insurance. Yes. I go to the skin specialist, requires an anaesthetist. The skin specialist will, on my behalf, seek approval for pre-approval for that procedure.

**Donald:** Yes.

**Greg:** Could be declined. I've still got something across insurance. Yes. But not for that procedure. Yes. Right. So the insurance, the insurer field tells us to start with whether you have any insurance at all. The approval number says whether the claim's been accepted, pre-excepted.

**Donald:** But when you get to the.

**Greg:** If not before, when you get to the hospital, if you haven't got an acceptance number there, then that has to be changed to build a director patient.

**Donald:** But why do we specifically need the approval number versus just some other sort of Boolean tick to say? Yeah.

**Greg:** Actually the hospital.

**Donald:** The hospital deals, yeah, may deal with all of this.

**Greg:** I've heard Vanessa say that sometimes the hospital asks for the approval number on the invoice so they can match them up.

**Donald:** Okay, well there you go. There's a reason for it. Okay, so we're- I.

**Greg:** Think it's a very good, I mean the problem with the tick is it's lazy, right? So it may or may not be right, but if you've got an approval number, you've got a higher level of- Yep, yep, yep. What's the word, credibility?

**Donald:** Okay, so, In my mental model, when bookings come in and they sit in the matching screen, we'll see information about whether or not they have insurance and pre-approval. And then presumably somewhere on the booking itself, that same information would be represented somewhere.

**Greg:** Somewhere. They're just too little for you.

**Donald:** Yeah, In terms of, I probably wouldn't want to display the approval number for the anaesthetist, but the admin team would want to see it.

**Greg:** Well, the anaesthetist will want to see it. doing this, when he's looking at his theatrist for the day when he gets to the hospital, he's going to check that all of those, because they get a lot of billing where they bill the contract holder and the contract holder says no, sorry, not approved. Comes back to credit it and bill the customer.

**Donald:** I'm picturing that, yes, the anaesthetist wants to know whether or not it's approved, But do they necessarily need to see the approval number? Ask them. Okay, we can ask, yeah. Okay, so we are, oh yeah, and then.

**Greg:** Don't forget that he's standing in the hospital and he's talking to someone in the hospital. Yeah. We can either tell them whether that's the correct approval number or not, whereas if he's just got a tick, he hasn't got that information to talk to the hospital.

**Donald:** Yeah, I guess maybe I'm trying to think about the right way to like progressively disclose this. Maybe in the same way that we talked about the NHI being able to kind of pop into it or go dig deeper into it to see more information about the patient. Maybe in a similar sort of way you can see, you can dig in to find that information if you need to, but it's not directly visible. Yeah, yeah. Okay, so when, oh sorry, but then final question. So the booking field has it So the external upstream systems bring it in, you accept it or deny it, whatever.

**Greg:** The last time we sat down with Ben, he said they should get that approval number the first time they kept the list from the surgeons.

**Donald:** Great, great. So that's cool.

**Greg:** But it doesn't happen as much as it should.

**Donald:** Yes, I think the thing I was just puzzling clear in my head and I think I got the answer is that as in admin looking at a booking like this, they could just choose to edit and see, you know, that information. So yeah, that's fine.

**Greg:** It'll be a warning. It should be a warning.

**Donald:** We've already talked about that. Yep. Okay. So where a booking is insured, the office records it on the insurer and the insurance approval number.

**Greg:** No, it doesn't. It records it on the booking.

**Donald:** Yeah, the booking holds it, correct. Where booking is insured, the office recorded. Yeah, so that's right. This is wrong, we are correct. So 11.4.3, insurance details are held at the booking level, not any sort of high level master anything. Most of the time the office knows the hospital surgeon or insurer and the approval number from the booking. If a booking says it is insured but has no approval number, the office rings the searcher's office. A code such as SXAP from the rooms from the hospital says the hospital is arranging the insurer's billing, not that it is covered. It guides which contractor has chosen. Recording these as the officers job, it is not required of the anaesthetist.

**Greg:** That's, I wouldn't bother with that sentence because actually the anaesthetist may well change that on the day of the procedure. Okay. This might be blank and they might find out on the day. Okay.

**Donald:** Yeah. Okay. The approval number is held on the booking. Okay. It's separate to what above says, but it is correct. The V6 design also holds the insurer's name and the booking procedure Greeks proposal no you confirmed whether insurance narrows the contract list is open uh okay the contract is still decides who's billed this has been this is because being insured is not the same thing as having claim approved and the insurance number okay so Claude I think after reading everything underneath feature 11.4 I think most of this could probably go away. We don't have a master insurance list, information about a patient 40 on an invoice. Our system doesn't really care about that. It's just the office would then choose the payer on the booking to be the person who receives the invoice and what happens after that is the patient's concern. And this last one about insurer approval numbers on the booking probably needs to just be moved into one of the other features. and rewritten to reflect what Greg and I have talked about. Is that right?

**Greg:** Yeah, it's just fields on the booking.

## Prepayment contracts and pricing arrangements

**Donald:** Fields on the booking, that's right. Okay, cool. Let's keep moving. Prepayment. Some procedures, typically cosmetic, plastics or dental work must be paid for before they go ahead. Must is strong, but generally it happens. Prepayment is triggered by the contract when the office sets up the booking and picks a contract flagged as prepaid. Normally, they need to own price list. The system starts the prepayment, a letter and an invoice. The anaesthetist tells the office which procedures they want prepaid and at what price. And the office sets up that contract. Nothing on the anaesthetist's profile triggers it. The prepaid amount is a fixed price on that contract's line which always carries one and the full amount is prepaid. There is no part payment or deposit. The office approves the prepayment invoice where outgoing invoices are approved and then it is sent. The anaesthetist sees the prepaid amount on the booking. Now, just pausing there for a moment. We're still reading the Epic itself, Epic 6. And you've already mentioned in the past that once trust and system is built up, potentially you wouldn't want all of these to be manually triggered or approved before they go out. They may automatically, once we build up trust.

**Greg:** So you want to be able to--.

**Donald:** It's an optional gate.

**Greg:** Skip the step in the workflow. Yeah.

**Donald:** A prepayment is not paid to anaesthetist. It's held in a prepaid holding account within the AA's trust accounting until the procedure is done. Prepayment is then two steps. The money is collected into the holding account, and once the procedure is done, the office authorizes the list, and a second payer moves it from the holding account to whichever anaesthetist did the list in place of another invoice to the patient. If a booking is cancelled, the prepayment is refunded in full. By default, the prepaid amount is the full price and the BTM units recorded on the day of reference only. The system calculates nothing further and raises no invoices or credit automatically. In either direction, this is the build's position until Ben answers can the price be changed. So we actually answered that the other day, it's just not reflected here. Where the work turns out very different, for example half is done or much longer than expected, the anaesthetist or the office may raise an ad hoc invoice or a credit note by hand. If the booking moves to another anaesthetist, nothing changes in the ledger because the money sits in the holding account and nothing is recalculated, the price prepaid when the invoice went out is the price. See prepaid booking move, more details. This all seems true to me. He says apprehensively. Okay, let's dig into his specifics when we get there. Prepayment trigger and amount. When the office sets up a booking and picks a contract flagged as prepaid for one of its procedures, the booking needs prepayment. Such a contract typically does not bill the holder. So the payer on the booking prepays the amount is the fixed price. on the contract line picked, which always carries one. Don't know what it means by always carries one.

**Greg:** Oh, it means that the price is mandatory on the contract line.

**Donald:** Okay.

**Greg:** I think that's what it means. Which is a point worth making, that a non-zero price is mandatory on a prepayment contract line.

**Donald:** So this is feature 6.2, now reading user story 6.21, Detect prepayment required. The billing invoice engine flags a booking as required prepayment whenever any of its procedures is on a contract flagged as prepaid. Seems simple. Prepayment is always from the person paying, sorry, prepayment is always from a person paying for the patient. The typical prepaid contract does not bill its holder, so the payer on the booking prepays. This is checked across the whole booking, not just its primary procedure. Since the typical case is a hospital booking with an additional elective cosmetic procedure added on.

**Greg:** Oof, let's go back through that. Prepayment is always from a person. Payment, patient, okay. Prepayment invoice. So this is a question... billable party.

**Donald:** We answered this the other day. Oh yeah, it's fine. Yeah, okay.

**Greg:** The typical freebag contract does not bill its holder, so the payer on the booking prepays you. That's true. In fact, I can't think of a case where the converse is true, but the configuration engine lets you do it. This is checked across the whole booking. I don't know if that's true, eh? No, I don't think that's correct at all.

**Donald:** You could have...

**Greg:** It's per procedure.

**Donald:** It's per procedure. You could have six procedures and the first five of them are regular medical things, non-cosmetic, that are approved by an insurer. But then the last one is a cosmetic add-on. Yeah.

**Greg:** Which has been prepaid.

**Donald:** Prepaid. Okay, I'm going to delete that. Cool, other than that I think we agree with this. The prepaid amount is the fixed price on the line of the prepaid contract the office picks. Normally the anaesthetists own price list for a procedure when the office sets up the booking. It selects the contract for the procedure and the amount follows from it. Nobody estimates it or works it out by hand. The prepaid line always carries a price.

**Greg:** Could we change that to the anaesthetist or surgeon's home price list? Because remember we changed anaesthetist ID to practitioner ID because we can use this exact same mechanism for surgeon's prepaid amounts. Surgeon's arrangements.

**Donald:** Yeah.

**Greg:** But they're not prepaid, but otherwise they're identical.

**Donald:** So, if you... I don't know if the surgeon cares about any prepayment.

**Greg:** No, they're not asking for it. Oh, it's an agreed price.

**Donald:** The price is agreed. I'm a surgeon, you are AA or an anaesthetist working for AA, and I've said we've made an agreement to say, mate, whenever we do a facelift, I want to give my customers more confidence about what they're going to be charged.

**Greg:** This is the surgeon.

**Donald:** I'm a surgeon. So you and I, let's come up with an agreement. It's a flat $2,000. And you say, yes, sure, I'll do the work for $2,000. But personally, you say, I want the patient to pay before the procedure. And so you have a contract that is selected in the system to say that you're going to be prepaid. But me I don't care. I just care about what I'm going to communicate to my patient, right?

**Greg:** Well, almost.

**Donald:** Okay. I'm going to make a coffee. Okay, okay.

**Greg:** Here's his scenario, right? An anaesthetist's price list for prepays is always his own, right?

**Donald:** Yes.

**Greg:** But a surgeon may have an arrangement with AA for the same arrangement. So anytime that surgeon does that procedure, whichever anaesthetist is working on it will use that price, will be doing that price.

**Donald:** I agree what you just said.

**Greg:** So that means you've got a contract here, which is the idea is I'm the anaesthetist and this is my list, this is my price replace list, $2,500. and I've got, and then Bob the surgeon has this contract over here, and that is a faceless prepaid $2,000, right? So...

**Donald:** Question, where does the money go? So is there ever a situation...

**Greg:** The patient pays direct, always goes to the next list.

**Donald:** There's no situation where the patient pays the surgeon and the surgeon pays AA.

**Greg:** No, not that I know about, because he'd be a contract holder, billable party. So that goes away. So, but the point I'm trying to make is that surgeon may apply that special price to any AA anaesthetist who works with them, right? And it's not the same amount.

**Donald:** Is that right? Is that right? Yeah. Okay. So, okay. Yep, thank you for explaining that. We'll recap it again once you get coffee.

**Greg:** It's a pretty potent billing system we'll end up with, if we could.

**Donald:** So just to recap my understanding of what you just said, is that prepayment contracts could, a prepayment setting is a setting that could exist on any contract, but the most likely usable scenarios is either an anaesthetist themselves is defining the price that they will charge for a prepaid event, or the anaesthetist may, sorry, a surgeon's room might make an agreement with AA. And in that scenario, it is the surgeon's room that defines the price so that their patients have price confidence and easy communication and that sort of stuff. But the prepaid amount is still the agreement between all these parties and the anaesthetists can still decide they want that to be prepaid. And at this point, it then becomes a prepaid condition across all anaesthetists because it's set at the surgeon's contract as opposed to an individual anaesthetist contract.

**Greg:** Yes, agreed. There's one point I'd like to make though, and that is that there's not a requirement to be able to hold these contracts by surgeon's rooms because it's not currently done, but it probably is a better generic model.

**Donald:** What do you mean? Oh, rooms, yes, we've determined that there's no... There's no rooms, yeah, it's all against individual surgeons. It's a better model. That's also.

**Greg:** It's a better model.

**Donald:** Yeah, so just to be clear, we talked about this the other day, so it should be in a transcript somewhere, but the idea is that you could create a contract for a surgeon's room and you just name it whatever you want to name it, but then you apply it to individual surgeons that exist within the system.

**Greg:** The problem I have with that is that the way the version 6 data tables are designed, I mean, they are proposed logical models, so that's all right, is that when you, the operator, when the operator is looking at the booking and it wants to know...

**Donald:** Operator being the admin, sorry.

**Greg:** The admin start booking and wants to know how to assign it to a contract, the system applies filters to get them shorter lists. So the first one will be One of the filters was we know that We know the practitioner ID of the surgeon and we know the practitioner ID of the anaesthetist. So you can go through the contracts and find out.

**Donald:** Yes, filter against those.

**Greg:** Filter against practitioner, right? To give you any contracts that might, because you don't facelift, right? So any contract that might apply to that surgeon or to that anaesthetist. If you go one to many on surgeons rooms, that breaks. Or does it break? Oh, it doesn't really break. Just the select gets a lot more complicated.

**Donald:** But we don't have surgeons' rooms.

**Greg:** Well, we might build it into the theoretical model because I said it's a better model. But then it makes the selection of the contract just a bit more, a bit uglier.

**Donald:** OK, so reading this then, Prepaid amount, blah, blah, blah, blah. So he's in full, blah, blah, blah, blah. The particular thing you want to change here is that in terms of contract configuration and setup, you want to be able to attach these to any practitioner ID, be it anaesthetist or surgeon. Yes.

**Greg:** Yeah. So in the second line, I just want to say the anaesthetist or surgeon's own price list. And maybe we should put a note in there to say it's identified as practitioner ID in the contract.

## Prepayment account and the role of the practitioner

**Donald:** Okay, well Claude, you've heard everything we just said. We're talking about story 6.2.2, so please update this to also reflect the surgeon, practitioner ID, sort of surgeon filtering sort of stuff we talked about. Maybe not filtering, you know, you figure it out.

**Greg:** Yeah, it comes down the screen.

**Donald:** Yeah. Okay. Prepayment invoicing and tracking. Prepayment, this is a feature, 6.3. Prepayment invoices go through the same internal ledger and Xero [unclear] pair as any other invoice, each one creating its own linked receivable and payable. That's true. That's just the high level idea. Raise the prepaid invoice.

**Greg:** Actually, can we go back to that? There is a trick here that I would like to make sure that you understand. I don't know how strong your basic accounting is in terms of bookkeeping, so I'll assume that we might need to walk through this. You know, there was a mention before about a holding account.

**Donald:** Yes.

**Greg:** So that's not a bank account or a Xero ledger account, it's a So it's the equivalent of an anaesthetist, but it's called, that account is called the holding account. So when a prepayment goes out, it's not attributed to, normally you have a two-legged record, one goes patient, anaesthetist, right, so it creates a bill to the patient And well, actually an invoice to the patient and a bill.

**Donald:** A bill is a draft.

**Greg:** A bill. Yeah, it's all status draft, but it creates an invoice to the patient and it creates a bill, which in Xero's language is an item that is payable to the anaesthetist. So you get the two legs happening all the time. And so when you look at Xero, The total amount that is owed by patients should be the exact same number that's owed to anaesthetists.

**Donald:** I'm following.

**Greg:** When it's a prepayment, you don't use an anaesthetist, you use another payable account called holding account. So it's...

**Donald:** Yeah, so the patient themselves is paying to the payable account. Yes.

**Greg:** But it is the payable, the recipient of that money is not an anaesthetist, it's the holding account. Yep. So it's a special case treatment. Yeah. In that when the invoice, because when the invoice is raised and those two legs go out to Xero, the billing engine has to say that leg's to the patient and that leg is not to the anaesthetist, it's to the holding account, and then to Xero It's transparent to Xero, but that's how it works. Then when the payment arrives, oh, sorry, when the payment arrives, it doesn't go to the anaesthetist, it goes to the holding account and it sits there and doesn't go out, doesn't disperse. And then when the timesheet comes in and it's time to do the invoice, it goes, oh, this was a prepaid. and it has to go back and go, okay, I'm going to take the money that's sitting in a holding account and I'm going to transfer it to O2 the anaesthetist. So it's a different pathway from the standard process. So the data model needs some way of understanding that this was a prepaid transaction and therefore the handling route is different. Otherwise we're good.

**Donald:** Yeah, I think nothing you said sounded new to me.

**Greg:** Okay, good.

**Donald:** And then the only other kind of point in my brain that... The only other point in my brain is when they get their final invoice, I'm not sure if he had an answer for this or not, do they see So let's- Who gets the final invoice? When the patient gets- They don't. They wouldn't see a line that shows your prepayment with zero on a, yeah, it's just, it doesn't exist anymore 'cause it's already been paid. Or it's already accounted for on another invoice, which we should have been paid, yes, yes, yes, yes, yes.

**Greg:** So actually the second part, if it's a prepay, the second part is more like a transfer than a payment, it gets paid, but it's been transferred from the...

**Donald:** Well, once the procedure's done, it's released from the holding account.

**Greg:** Yeah, by a journal transfer. It goes from there to there, and then it sits on the... A list that Ben or Michael go through, or maybe Vanessa goes through, and it's on their approved for payment list, and they go through, tick, tick, tick, tick, tick, and make that.

## Review of the billing and prepayment flowchart

**Donald:** Claude, we already have artifact 24 that describes the billing slash invoice flow. But it might be nice if you made something a little bit more visual that is just talking about the prepaid slash non-prepaid conditions and where that money goes to, you know, those related pairs. So if you could make a new artifact for that in this new round, that'd be nice. OK, so. Yeah, exactly. 'Cause you described a lot of particular terms there that are Xero related that I don't know about. Yeah, yeah, sure. I thought I was following, but yeah. That's good. Okay, so prepayment invoice and tracking. So yes, this is true. You just want to explain some extra stuff there.

**Greg:** Prepayment always go through the same. Let me, let's- Well, actually, that's not quite right.

**Donald:** How about we go through this flow?

**Greg:** It's not the same as any other invoice because it doesn't credit the anaesthetist, it credits the holding account.

**Donald:** Okay, let's read through this flow chart and let's see if this is, we agree with how this works. Okay. So bookings created, booking is one or more primary procedures. Each procedure has one contract. Bridge or gap. Is prepayment required? Let's say no for now. OK, let's keep moving. So the procedure will take place. anaesthetist records billing data. anaesthetist checks the contract. Contract selects anaesthetist change the price. If yes, they may change the price. Otherwise, no.

**Greg:** Pricing, but DRL.

**Donald:** OK. Then anaesthetist marks the booking as complete. The list becomes submitted. The office reviews it. They authorize it. And then the bookings procedures and contracts are all locked. Then it comes to the billing engine. The billing engine reads each locked procedure and contract. Additional procedures in the booking, if no, normal procedure. If yes, then multi-booking procedure rules take place to kind of determine who's going to get invoiced what. Yep.

**Greg:** Those are really the same rule because to me, because it basically just wrote, it just iterates through the procedures, billing each one.

**Donald:** Calculates each procedure's final fee and works out the remaining amount. Here we go. Prepaid. Second pair pays.

**Greg:** Okay, so we have allowed in the design that while it's highly unusual for a prepaid amount to be changed, in theory it can be.

**Donald:** When? That doesn't ring true to me.

**Greg:** It'd be a lot easier if we didn't. They could just raise another transaction. Well, you talked about a prepay amount and they only did half the procedure. So they would then want to rebut the balance.

**Donald:** Yes, we talked about that. That'll be there. I actually don't know what this little bridge here is talking about, so we'll come back to this, but you know, we've got the remaining amount. Oh, this is what I'm saying. If you had a situation, I think this is actually not true anymore, because we've decided that prepayments are all or nothing. So there wouldn't be a situation where a line item was partially prepaid.

**Greg:** But that assumption conflicts with the other use case where they were only able to complete half the procedure.

**Donald:** Well, in the situation where they complete half, they would create their own separate invoicing event to balance the scales. Okay, fine. But that's not, yeah.

**Greg:** So we'll lock it down at the time sheet point and let it flow through. Yeah, So there shouldn't be any remaining amount.

**Donald:** So I think this isn't sure anymore. I don't think this is true anymore. review and tell me if I'm wrong. So second payer pays the anaesthetist who did the list.

**Greg:** Oh that's true. That's exactly true.

**Donald:** Oh so what is it saying?

**Greg:** It's prepaid so the second part of the prepaid process is you now transfer it from the holding account to the anaesthetist who performed the procedure.

**Donald:** I see. Okay, we think this is true but perhaps the wording is off. Okay, what the catalog says now. Trigger itself is decided. It's the office authoring the list that matches the diagram. Your 19th of October ruling records it. Greg named the trigger as confirmed and submitted and the catalog diagram notes matches. You're right that it's drafted. This is confusing. Epic 8 treats the trigger as settled. It's only remaining verify reason is the price reference, not the tree.

**Greg:** So we're going to say we can't change the price on those. We're going to set up those contracts. Those contracts are configurable. So if there's a mistake in the configuration, it could get interesting. But normally they'd be locked as not editable. Those prepaid contracts will be not editable.

## Invoice production, Xero and prepayment ledger flow

**Donald:** So that's not what this is saying I think what you were saying that this is actually maybe describing releasing the that's.

**Greg:** A standard process yeah yeah.

**Donald:** Maybe this node is actually meant to be talking about releasing the prepayment from the holding prepayment from the holding account let's see what this is okay let's keep going so after, this is the regular, you know, flow. The happy path. The happy path. Once we work out the remaining amount, we then create the linked receivable and payable in our internal ledger, generate one invoice per billable party per booking, and send, I've just got it updated, there you go, and send the pair to Xero. So that's what happens there. And then in Xero, the engine sends the invoice. Is Xero sending the invoice or is, no, that is, yep, Xero sends Xero.

**Greg:** That's a very good question. I don't think it can because it can't generate the data on the invoice that we want.

**Donald:** Okay.

**Greg:** So I think the engine needs to raise the invoice PDF and we just send the accounting entry to Xero as a payable and collect of receivable.

**Donald:** Okay.

**Greg:** Okay. Because it has to print the, and I don't think Xero can do that.

**Donald:** We don't pass that through? Okay.

**Greg:** Well, even if we did pass it through, I don't think Xero would know how to do that.

**Donald:** Okay.

**Greg:** I mean, that's, if your design team can figure out how to get Xero to produce the required invoices, then I'm quite happy for it to do so.

**Donald:** Yeah, we just care about the outcome.

**Greg:** I don't think they will be able to.

**Donald:** Okay. Looking at these first items in the Xero box, we're now questioning whether or not Xero is going to send the invoice or if our system is going to send the invoice. So for now let's assume it's going to be our system unless the developers with more Xero expertise believe that Xero is the best place to handle it. This is something that I'm asking you to change now simply for easy explanation, not something that is a hard requirement that we need to obey. Ultimately, we know the outcome that the system needs to do. And when it comes to implementation, the Distratos dev team can decide whether Xero or our system is the best person to send those invoices. Okay, cool. Payment is received into AA's account. The payment is reconciled in the internal ledger. If it's paid in full, then the engine authorizes the matching payable in full. Updates the internal ledger, receivable balance and remaining. If no, finance obligation is settled. Now a couple of branches here. If it was partial payment for whatever reason, Vanessa's talked about sometimes they create payment plans for people. Engine authorizes the payable for exactly the amount received. That's a question I guess for the accountant. Send it to decide. Bill, that's fine. Cool. And then is receivable balance remaining, remaining, remaining amount stays outstanding. So yes, that's the happy path. So now let's go all the way back here. In a world where prepayment is required, if yes, we dance all the way over here to the invoicing engine. And we've said that the admin approves the prepayment invoice. Actually that payment, admin pre-approving it actually probably needs to be aligned with this one here, right? Office reviews and corrects. Yeah. List authorized.

**Greg:** Yeah, because the engine hasn't got any manual steps in it. It's just an engine. So let's pull that back.

**Donald:** This node here actually needs to sit outside of the Xero box and it doesn't need its own box around it, but it should sit aligned somewhere with the list authorized from box three. It gets approved and then all the way over here the engine creates its pair, a receivable pair from the booking payable to the prepayment holding account. And then we'll send that pair to Xero, which...

**Greg:** Sorry, does it scope with the number? Payable to the prepaid holding account.

**Donald:** Yeah, you happy with that? Yep. Cool. A move to another anaesthetist changes nothing in the ledger, the payable is still the holding account. And then... Send the payer to Xero, accounts receivable to the payer, draft accounts receivable, yeah cool. So then Xero or our system will send the invoice, prepayment into the holding account, payment is reconciled in the internal ledger. So prepayment is essentially received.

**Greg:** Can you just let me see the top line a bit? Yes. Why can't you just join the top line? Does it matter? Because it's just a routine transaction at that point.

**Donald:** Well, I think the reason it loops back is because the procedure hasn't happened yet. And so then the procedure takes place, everything else is done, and all of that flow ultimately releases the payment here in all the post-procedure actions.

**Greg:** Well, yeah, the decision point The trigger is, is it a prepaid transaction or not?

**Donald:** The trigger for what?

**Greg:** The trigger for deciding which anaesthetist gets the money.

## Prepayment invoice details and transfer on completion

**Donald:** Yeah, not quite. So my understanding is that if the procedure based on the contract is marked as prepaid, then all the prepayment situations go out to the patient. And they pay it and it goes into the trust account. Holding account. Holding account, thank you. And then once the procedure is finished, then that money is released to whatever an SS did the work.

**Greg:** Yes. Yes. Yeah, okay.

**Donald:** It doesn't matter. Yeah. And my question to you, which maybe you can't answer is on a regular invoice that goes to a patient from AA, Presumably it has AA's letter, you know, template, right?

**Greg:** It does, but it names.

**Donald:** It does name the anaesthetist, great. On a prepaid procedure, do we need to name the anaesthetist?

**Greg:** No, good question. Should ask that, but I wouldn't think so.

**Donald:** This has been my mind for a wee while now, is like, do we name that person? Therefore, if it changes, do we have to send a notice of a change of anaesthetist?

**Greg:** Well, that's the problem. If we name the anaesthetist, we create a problem. So I would be leaning towards not doing that.

**Donald:** Okay, well Claude, let's ask AA. We'd all like to avoid this, but it's worth asking. And finally here, for this node. Please add a little bit of smaller text within it to specifically note that this is for the prepayment, so it looks a little bit different from its not prepayment stream, brother. Okay, so now that we've read through this, this feature is subscribing everything below it, which is to say prepayment invoices go through the same internal ledger. So there's a ledger on our side that keeps track of everything. And there's pairs on the Xero side as any other invoice each creating its own linked receivable and payable pairs. And so there would still be linked receivable and payable pairs, but they're slightly different in the prepayment condition.

**Greg:** Yes, as it stands, that's correct.

**Donald:** It could have a little bit more nuance, but I'm fine keeping the feature a little bit. It's fine. Yeah, okay. Raise the prepayment invoice when the office picks, so this is 6.3.1, when the office picks prepayment contract for procedure on a booking, The office sets the booking up with that contract and the prepayment invoice is generated when the admin approves it. On the screen where the outgoing invoices are approved. It is not generated at the booking setup itself, nor when the money is received. None can arrive before the invoice is sent. That's a bit of a thing you don't need to say. Once approved, it goes out with a prepayment letter. Generating it creates a linked receivable pair in the internal ledger, a receivable pair from the payer named on the booking and a payable to the prepay holding account, not the anaesthetist. It also creates a matching draft record in Xero, a letter list submit a later list submit does not invoice it again, the anaesthetist is paid by the second pair from the holding account settlement. So essentially that draft that was created is then no longer a draft, it's actioned.

**Greg:** Yeah, the anaesthetist is paid by, I mean that's correct, but it doesn't provide any insight into how it's paid. If you said it was a Transfer, because that's what's happening. You're taking it out of one, out of the prepay account and putting it into the analysis account.

**Donald:** Okay, well Claude, can you update this to make that nature a little bit more clear? And inevitably in the diagram artifact we asked you to make, you would make that clear as well. Cool, okay. The invoice amount is the fixed price on the prepaid contract line, its payer is the person on the booking, the patient or for example a guardian. It is raised only when the payer is the person paying for the patient, never an organisation.

**Greg:** That is, that language may cause some confusion as well because what is an organisation? I know what they're trying to say, but it's introduced yet another term into the glossary.

**Donald:** Okay, no, fair enough. So should we ask it to change it to contract holder? Yes. Okay.

**Greg:** Well, the anaesthetist is contract holder because it is a contract.

**Donald:** But not the available party.

**Greg:** Yeah, can we go back and look at that? How does it describe

**Donald:** it? The invoices amount is fixed on the prepaid contract. Its payer is the person named on the booking. It is raised only when the person paying, when the payer is the person paying for the patient, never an organization.

**Greg:** I don't see why we should say that because we built an engine that you can configure all these switches in.

**Donald:** Yes.

**Greg:** And the whole thing point about that engine is that it's flexible and permissive and We can't think of a single example where this situation would ever occur. But theoretically, you could configure something like that. So for instance, if the DHB had a contract, part of that contract may be that the procedures are prepaid. Can't imagine this.

**Donald:** Yes, I see what you're saying, as you were saying. Yep, okay, well.

**Greg:** Just take that sentence out.

**Donald:** Yeah, Claude, if you can kind of re, as you're rewriting 6.3.1, make this a little bit more clear. I think we should pause here for lunch.

**Greg:** 58, my goodness, time flies, isn't it?

## Reconciliation notes

- Speaker attribution follows the Word-derived transcript. A small number of very short interjections are not separated perfectly by the source, so some adjacent replies may remain inside one speaker block.
- The two additional automated transcripts were consulted to resolve technical vocabulary and compare the sequence of discussion. Exact phrasing should not be treated as independently audio-verified.
- "RVG", "NZSA", "NHI", "BTM", "ACC", "FHIR" and "Xero" have been normalised where transcription variants clearly indicated the same terms.
- The conversation preserves unresolved design questions and alternative suggestions as spoken; it does not turn them into agreed specifications.
