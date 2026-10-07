# AA Meeting with Greg — 7 October 2026 — Reconciled Transcript

> Reconciled from two automatic transcriptions of the same 2h 14m recording. The Microsoft Word transcript was used as the primary source for speaker attribution and timestamps; the second transcript was used to cross-check wording and recover or correct obvious ASR errors. Speaking style has been retained, with light cleanup for readability. Genuine uncertainty is marked rather than guessed.

**Participants:** Donald Fraser, Greg Smith

## Procedure model, RVG matching and the booking intake workflow

**Donald Fraser (0:04):** OK. So what is this new information you have about procedures?

**Greg Smith (0:15):** Ben wanted to have a talk about the document before the others arrived last night, so we sat down for half an hour and we're talking about it in more detail. And. He. Re walked through the process they go through and. He said the problem with procedures is that there are an infinite number of procedures. And we looked at the invoices and the invoices all just print whatever. The surgeon has print, has typed on the booking record. As you were briefly looking at last night, so there is. Apparently there is no such thing as a list of procedures and he doesn't think that. It's. Possible or cost-effective or practical? To try and capture every procedure because it's just this unbelievable list and he said and he said we don't need it anyway.

**Donald Fraser (1:25):** Yeah, we.

**Greg Smith (1:28):** He said all we need to do. All we do is look up the RVG to basically get the base units, and that's all we do. And so all we need to understand is from the description in the. Booking from the surgeons rooms. Deduct this is what we're talking about during the meeting. Deduce. We're in the hierarchy of the RVG. This lives right? So the I so I realised that I had a mental model of. Keeping this list of procedures that we would then. Scan through and use to print on the invoice. But that's not what happens. And while he was a bit horrified, he didn't realise that they just printed. What the doctor's rooms give them on the invoice, but Nick and Ron were quite happy about that, so. They're happy to just keep going with that, so I think. We need to reframe. When we started to do it in the meeting a bit last night. Reframe the discussion a bit around how do we deduce? The RVG group that we need as a reference point from the discussion. From the description that's in the booking, which is a different sort of story from which is why we branched into AI a different sort of story from. How do we look up a structured catalogue, wouldn't you agree?

**Donald Fraser (2:57):** Yeah. So yeah, I mean everything you're saying that you talked about before with Ben, sounds like a fair repeat of everything we talked about in the meeting. And I thought we had. I had received alignment from Nick and Ron and Ben that we know that there could be 10,000 different ways to name procedures and we know that there's about 40 different RVG codes. But.

**Greg Smith (3:16):** Yes.

**Donald Fraser (3:20):** I believe in that call. I got alignment on the idea that we need something in between. That is basically a grabbing on point to more easily allow. You know, humans or future AI models to more accurately.

**Greg Smith (3:32):** Yes. Yeah.

**Donald Fraser (3:37):** Grasp onto the most relevant procedure. To receive RVG units from. So None of this sounds like new to me.

**Greg Smith (3:47):** Yes, that was the idea. No, that was the idea. I seeded with Ben before the meeting that we need. Looks like we'll need some sort of intermediate level or next level down from the RVG, which is like a summary. Or record that effectively encapsulates a whole family of. Indeterminate size procedures.

**Donald Fraser (4:11):** Yeah, I mean, yeah.

**Greg Smith (4:11):** So yeah, we're both talking about the same thing, I think. What do you think? The consequences of that are.

**Donald Fraser (4:18):** Umm. Like I was saying last night, I believe that if we don't create a little bit of structure within the future system. I believe there'll be a risk of lots of bad data polluting. It and. Eventual. Eventually a lot more confusion in the system, much like Solutions Plus has right now. And So what I've proposed is, you know, some sort of managed list of procedures that AA can manage and it's up to their discretion to say, do we have one tooth extraction or do we have a few different tooth extraction styles if when they become relevantly different, that sort of thing. That we can attach RVG codes to and use as. A grouping/sorting method to more easily discover and pick the contracts that are relevant be those obviously actual contracts with other entities or you know an RVG style. No contract to help determine how the invoicing and billing is going to work. In terms of consequences. I'm. I'm not sure I'm seeing a lot of really difficult ones now. It's just really up to the humans managing the system to find the right way to right size it such that whenever they are adding in a new procedure they think is distinctly different enough from what's already available to allow them to create the appropriately attached contracts and RVGs.

**Greg Smith (6:04):** So I think we did. We probably need to call them something other than procedures, don't we? Or do we?

**Donald Fraser (6:12):** Uh.

**Greg Smith (6:13):** It's a generic descriptor for a family of procedures.

**Donald Fraser (6:17):** Yeah. And we can bat that around. But but you also you also you would have heard last night in the call that I said.

**Greg Smith (6:19):** Do we care? Do we care?

**Donald Fraser (6:25):** In some cases, they may. Some you know, they being AA staff or anaesthetists may want to search against you know, sections of the body and procedures. Others may already know the exact RVG code they want. Or they want to browse the RVG and so I suspect that what we have been calling the procedure picker, we need to simultaneously have an option to. Not pick via procedure and pick just via RVG.

**Greg Smith (6:52):** OK. So if we keep calling it a procedure because it does have some legitimacy, it's just a it's like a meta procedure, which is fine. We'll call it a procedure. So let's go back and just think for a minute about the life cycle of the booking, right. So the surgeon types in whatever he types in on his notes. And then arrives. That arrives at AA.

**Donald Fraser (7:17):** Mm.

**Greg Smith (7:18):** So how does this travel from there? What what happens when? As it does now, this booking arrives in the office with this description.

**Donald Fraser (7:29):** So for the first version of the application, there's no automation that happens at all. All ingestions, which are probably just the same two hospitals that system currently has.

**Greg Smith (7:32):** Yes. OK.

**Donald Fraser (7:41):** You know those will land in basically a matching/creating screen and. Let's assume that no, this is day zero. No bookings exist within the new AA system. Those new bookings will arrive, and there's nothing to match them to.

**Greg Smith (7:53):** Yep.

**Donald Fraser (7:56):** And so you would look at the data that comes in from the hospital and our system would shape it in a similar sort of format that is. What the new system would expect in terms of here is a you know the draft data of what a. Booking will look like. And. AA staff can look at that. They can see. Oh, you know, here's the patient details. Here's this or this is missing. Whatever it might be. And then they can go ahead and either save it as a draft list that doesn't have an anaesthetist assigned right away, or they can go ahead and find an anaesthetist who doesn't already have. You know that that that, that booking/list can then go and be attached to. And so in that instance, and basically a new list or new booking had it been added to a list. Is created and generated. You could picture then, two days later there's an update on one of the bookings that would come into the matching screen. And I could see this new thing has come in. We believe based on all of these heuristics, the date the surgeon, the location, the slot, that this is an update, not a new one, and they would see the list that already exists or the booking that already exists and they can just say approve update. You've said already that the system should have these kind of gates in place to build trust, but it wouldn't take too long to say OK, we trust. In the heuristics of our matching, let's set up some automated approvals for these sorts of things. But that's how I would picture it.

**Greg Smith (9:30):** the point the issue I'm focusing on.

**Donald Fraser (9:30):** OK.

**Greg Smith (9:35):** So I'm not. I'm not trying to be pedantic here or waste time. The issue I'm focusing on is thinking about Uh. More from the user perspective of. How they match these? So before we go before we go live, we'll need to develop our list of, let's say, a couple of 1000 standard procedures that we're going to. Embed in the next level of a hierarchy. Do you agree?

**Donald Fraser (10:06):** And I'm not sure if it would be 1000. I mean the list I have right here which is filtered down from what Solutions Plus gave me comes in at about 400 procedures now Vanessa, which we'll talk to today.

**Greg Smith (10:18):** OK, OK.

**Donald Fraser (10:21):** You know, we'll see if she wants to add another 200 or another 600 like, you know, it's up to them to kind of fill this in as I see appropriate. But yes, there'll be some sort of intermediate between an infinite list of procedure variety and. The. RVG guide.

**Greg Smith (10:40):** OK, cool. We're all. We're all on the same page, so. The. Predictably, we'll need to build a matching screen, right? Which will let them which will have a picker in it where they can assign the booking to one of these codes. Yeah, and all procedures. Will need to be assigned to one of these codes.

**Donald Fraser (11:05):** Yeah, that's that's exactly what we're already talking about.

**Greg Smith (11:06):** The wicked. Do we care if it's a fixed price? Do we care? We only care if they're RVG, but he might change it to an RV G. Contract. Yeah, they should be matched, shouldn't they? Even if they're using a fixed price. Because the base status is that they should live somewhere in that hierarchy, you agree.

**Donald Fraser (11:30):** Yes, yes, yes, definitely.

**Greg Smith (11:31):** Yeah. OK. So. I mean, one of the topics that after I mean the discussion we've on for a while after after we finished it was more free form. But they were talking about the. The aggravation of. The mismatches in terms of. Billable party and also. Misallocation of bookings to the wrong RVG group. So Nick was using the example of a new.

**Donald Fraser (12:03):** Sure.

**Greg Smith (12:08):** Ophthalmologist to sort of a new anaesthetist who's doing ophthalmology work and it's his first week on the job. End. He doesn't know. His way around the system, which is an interesting training issue. So, and we'll address and. It's all too hard. It just sends everything back to the office and he gets into that habit and he just stays lazy forever and he just keeps pushing everything back to the office and says, well, you know, here you go. You sorted out and he said. We really want to avoid that. So I think that. If we can get this navigation tidy, then I think it will address a lot of those concerns about. Errors and time who's spending the time on it. And so on. So I think that's gonna work out quite nicely. I'd be interested to see have you seen the screen? Has Vanessa shown you the screen where the booking lives? Because it's just awful. It's just little field. It looks like some.

**Donald Fraser (13:12):** Yep, she's. I believe I've seen it.

**Greg Smith (13:13):** It's like a shotgun. Somebody fired a shotgun at the screen.

**Donald Fraser (13:17):** Yes.

**Greg Smith (13:17):** It's just dreadful so.

**Donald Fraser (13:19):** Yes, yes.

**Greg Smith (13:20):** Classic. If it's day, of course. Classic. Sort of. Uh. What's an excess type form layout that you would have seen in the 80s and 90s?

**Donald Fraser (13:32):** Yeah.

**Greg Smith (13:33):** So yeah, I think that's what I'm getting around to saying here is that I think the picker screen is going to become one of the really central artefacts that will need some thought around design just so that we get the same sort of great user experience that we've had developed for the anaesthetist.

**Donald Fraser (13:41):** Yep. Yeah, yeah. Yeah. Yeah. So just when it comes to any of the design stuff, let's try not to stress on that too much right now, because you can probably trust that I'm going to make it look as nice as possible. That stuff's really important to me.

**Greg Smith (14:03):** Yeah, I'm not. I'm not going to get involved in that at all, Donald, it's.

**Donald Fraser (14:05):** Yeah. Yeah, but. We just need to focus on basically what are the requirements, right? What are the problems or the specifications that we need to make sure all the system is accounting for and then when it comes to kind of witnessing that experience, you know there'll be lots of iteration on that and definitely lots of testing with AA. So that stuff I'm really looking forward to, but that you can probably just trust that that will have some TLC for sure.

**Greg Smith (14:32):** Yeah, I'm not fretting about that. I'm just. I'm just making the comment that it will be a centrepiece of the. It will become a centrepiece of the application.

**Donald Fraser (14:37):** Yeah, that's right. That's right. Totally. There's a reason that we've talked about all of this as much as we have, because it is fundamentally important. And like I said, in the early versions of creating these process maps, it was really clear to me that all of this stuff needed to be defined upfront, not at the end. To bring that clarity to the system and so. Yeah, I think it'll come together.


## Requirements documents and Greg’s database-model review

**Greg Smith (15:04):** Good.

**Donald Fraser (15:04):** OK, my question to you is I made a document that was designed for technical people and a document I say I obviously Claude based on the source of truth, which is the requirements that we've got in the repo. I said make one for technical audience. Make one for non-technical audience. I have not read the technical document and I certainly have not ingested and understood or approved this, but you and I talked the other day that you were going to make an updated database model. I still need you to do that as a way to kind of move past this. So did you give this document a read?

**Greg Smith (15:43):** I've given it a quick read, but I was more focused on the other one yesterday because because of the meeting, so I will do that.

**Donald Fraser (15:47):** OK. OK well after. Yeah.

**Greg Smith (15:53):** It's it's pretty, it's pretty good. And it goes down another layer or two from where I took it, which is fine. I will go through it.

**Donald Fraser (16:03):** Yeah. Cool so.

**Greg Smith (16:04):** Some sometime in the next day or two, we've got a lot of meetings, but I'll fit.

**Donald Fraser (16:07):** Yeah, if.

**Greg Smith (16:08):** I'll put it in somewhere.

**Donald Fraser (16:09):** Yeah, yeah. If you if we need to shorten one of our meeting days to you for you to do that, it would be good. Because tonight my. Well, you know, we need to get through all of these requirements. 'cause I wanna start updating the prototype and catching up on all that stuff. So it would be good for you to have that either accepted or updated for us. Awesome. Awesome. OK, well, let's push on, eh? Um, I will put some new eye drops in and. Let's. Yes, we'll carry on.

**Greg Smith (16:39):** Carry on.


## Brief break

**Donald Fraser (16:41):** So let's I'll just be right back in a moment, OK?

**Greg Smith (16:44):** OK. Yeah, sure.

**Donald Fraser (17:37):** My eye drops need to be kept in the fridge and until this week I have never put my drops in before and so I was very bad at it, but now I'm pretty good.

**Greg Smith (17:40):** Ah dear. Even the cold ones.

**Donald Fraser (17:50):** Yes.

**Greg Smith (17:51):** I bet that's a shock to the eyeball, too.

**Donald Fraser (17:53):** Yes, yes.

**Greg Smith (17:54):** Yeah, I get it. I think from time to time that I have to put drops in a steroid in for, but I don't have to keep them in the fridge. Thank God.


## Epic 04 — Contract model overview and terminology

**Donald Fraser (18:03):** Hmm. OK. Let's start reading. So reading the contracts, epic epic.

**Greg Smith (18:08):** Can you make that a little bit bigger for me?

**Donald Fraser (18:11):** Epic 04, OK.

**Greg Smith (18:13):** Just here. I'm just struggling to read that.

**Donald Fraser (18:14):** Yeah. Understand.

**Greg Smith (18:17):** That's good.

**Donald Fraser (18:18):** OK. Every procedure needs to know three things. How is it priced? What rules apply and who gets the invoice the system? The contract in the system, the contract answers all three because the contract always defines the billable party. And there can be as many contracts as AA needs AA manages the contracts as master data in each procedure selects exactly 1. This replaces the RFP separate step of resolving a billing routine and then looking up a governing contract. Here, picking the contract is the whole pricing decision. So that's the epic. The first feature here, the contract catalogue. The contract catalogue is where admins create, edit and maintain every contract they holds across the confirmed categories.

**Greg Smith (19:09):** You know, I might be thanked for people who haven't been part of this journey. It might be worth putting a sentence in here about what is a contract. Because they might think that there's a file on the table that's got all the contracts in it, whereas it's a. It's a structure we're using to reflect the various arrangements that are made between the parties.

**Donald Fraser (19:33):** Yep, that's a fair call. So Claude, you know, as you read this transcript, please go ahead and update the appropriate epic to just put a little bit more human language in there as to explain that a contract is basically a structure within our system that defines the rules of how people get paid, not necessarily an actual legal contract between AA and any other party.

**Greg Smith (19:59):** So I don't know whether you picked it up last night, but they were treating themselves as the contract holder and were struggling with the conversation. And when I pointed out that we've inversed the language there, so that inverted the language there. And we're saying that. MMM. You know AA is the party in the centre and everybody else has a contract and we're referring to them as contract holders. Then the penny dropped and they got it immediately and they started engaging with the model.

**Donald Fraser (20:26):** Yep.

**Greg Smith (20:27):** I was quite impressed about how rapidly they were able to. Invert their language and continue the conversation. It was pretty good.


## Contract catalogue, categories, effective dates and identifiers

**Donald Fraser (20:34):** Yeah. Thank you for your help on that. OK, so Admins create contracts. This is user story 4.1 dot one Admins create contracts in one of these categories which are also the groups the contract picker shows.

**Greg Smith (20:43):** Yeah.

**Donald Fraser (20:50):** Now, this hasn't probably been updated to more closely match the new artefact. The procedure and contract selection artefact, but just go with it for now. There's an RVG-style contract and any custom RVG variants always offered. There was a previously this idea of an default hospital RVG, which again sounds like is not really the case. And if we go back to. This version of the artefact here. It's not really even mentioned now, right?

**Greg Smith (21:26):** And what was the scenario for that had it that week?

**Donald Fraser (21:29):** So again, I think this is something that came from you was something that we're look in the absence of any other specific. I think this might be the situation where there might be RVG contracts from a hospital that define a particular rate or something like that. But really, the particulars here don't matter too much just to say that there's a whole bunch of different types of contracts that can exist. We'll have to figure out the right way to to name them or sort them or group them to make sure they're easy to understand. But as we've already defined, contracts that have a bunch of different settings in them, base units modifiers. Modifiers included that can't be removed. And we reconfirmed last night that there are. Contracts can have a custom rate, so you're still using RVG, but you're not using the anaesthetist rate, you're using a predefined rate. So anyway, the particulars of the categories I think can be refined and I'm sure they will be as these requirements here are updated based on transcripts because I haven't updated the particular. Visa requirements in a wee while, but just to say that there are categories. Unique contracts exist only we're in agreement has arrangement has been agreed with a solo surgeon group, solar group Surgeon Group contracts are filtered by surgeon and not. The filtered by the surgeon is not decided. Sure, OK. Anyway thera.

**Greg Smith (22:58):** I'm not sure whether this contract with a surgeon group or you. There must be. Yeah, there is. There is OK.

**Donald Fraser (23:03):** Yep. But we do know there will be categories.

**Greg Smith (23:09):** Yeah, I think I'm not.

**Donald Fraser (23:09):** OK.

**Greg Smith (23:12):** Not completely lined up with you about how you're explaining the categories, but we can do it doesn't matter.

**Donald Fraser (23:17):** Yeah. And I don't think I'm 100% certain on it yet too. And that's something that we can easily define and sort of, you know, validate with Vanessa and Co. As they start to see what this looks like, you know as we build it out.

**Greg Smith (23:30):** Are you? Imagine, are you imagining that we are going to formally? List or pick a contract category? Or are you just saying there are these styles of contracts?

**Donald Fraser (23:42):** I what I picturing at this stage again, if we go back to this. See what it would look like for the. The admin right. And you could picture this as maybe on the matching screen or just any screen they come to right. They would pick.

**Greg Smith (23:59):** Sure.

**Donald Fraser (23:59):** They would pick a procedure and then there'll be a drop down of contracts and it would just be all the contracts that were relevant for that procedure. As we've already talked about. And maybe they've got some headings within the drop down, but it's one long drop down list. That's kind of as of now what I'm imagining. OK.

**Greg Smith (24:19):** Yeah. OK. OK, let's move on.

**Donald Fraser (24:20):** Let's keep going. Cool SO4 dot 1.2 Admins create edit. Version and retire contracts. Each contract carries an effective from date an effective from date and a review date. This is so fee schedules update. For example, a new rate taking effect on April 1st can be applied cleanly. This is an open question here, which is an earlier one that we said. It needs to be. We need to ask AA about and so we can ask about that later. But essentially. Regardless of answering.

**Greg Smith (24:58):** What was the question? I didn't get to read the question effective date sometimes further.

**Donald Fraser (25:00):** Yeah, we read it the other day as I didn't want to read through it all again. But contract prices carry an effective from date and hospitals and funders usually give an effective date, sometimes a few weeks notice when a procedure is priced. Which date. Picks the price, the date of the procedure, or the date the booking was made, or the date the invoice was raised.

**Greg Smith (25:21):** Oh no, that's settled. It's the date of the procedure that's been discussed.

**Donald Fraser (25:24):** OK. Well, that's easy then. I probably just leave it open here until I hear from them, but that makes all the sense in the world to me as well, considering the way the other rules work.

**Greg Smith (25:36):** Yeah. It's the same Nick was talking last night, remember? About the age of the patient, said the age of the patient.

**Donald Fraser (25:41):** Exactly that same concept.

**Greg Smith (25:43):** Same concept here.

**Donald Fraser (25:45):** Yeah, yeah. OK. Contract audit and versioning. The system keeps every version of a contract, not just the latest one. This is so an invoice raised under an older version can always be reproduced even when the contract has since changed. Again, RFP talks a little bit about SQL versioning of this stuff. Umm. So this is something that needs to happen AA identifier for every contract. Every contract carries AA's own unique identifier alongside any holder codes kept for reference on its fixed fee schedule. Lines holder codes are kept for reference only kept only for reference. So AA needs its own codes to identify each contract among thousands. The identifiers short structured AA and admins can search by search the contract list, buy it. Such criteria given a new contract when it is saved, it has a unique short AA code. Uh. Holder codes are kept for a reference and do not replace the AA identifier.

**Greg Smith (26:54):** OK. So far so good. I just want to go back and clarify that second paragraph. Scroll to the top again. Objects only need identify cold codes. Yep, Holder codes are kept for a reference saying it's sound code, yeah. Umm. That's no, that's OK, that's fine. It's fun.


## Contract definition, holders, billable parties and scope

**Donald Fraser (27:24):** OK. Cool. So that is the contract catalogue feature. Moving to contract definition. So 4.2.

**Greg Smith (27:33):** Is it worth?

**Donald Fraser (27:33):** A Contra.

**Greg Smith (27:33):** I guess there'll be a filter on that about whether you're looking for active contracts or or. All contracts and probably another filter for contract holder because. They'll be able to navigate down to a filter. Rather than just be preceded with all contracts, they'll always be interested in a contract holder's contracts.

**Donald Fraser (27:54):** That's right. Yeah. Yep, Yep.

**Greg Smith (27:57):** Yeah, OK, cool.

**Donald Fraser (27:59):** OK, the contract is the record that defines how a procedure is priced. Who is invoiced? For it by default and what extra information the booking needs to collect before it can be billed?

**Greg Smith (28:10):** Yep. What's an example of that?

**Donald Fraser (28:13):** AA deals.

**Greg Smith (28:16):** What's what's the extra information?

**Donald Fraser (28:16):** At. So for example, you might have a situation where. The default billable party is the patient and they're under 18, and so the system would prompt to make sure we have contact details for the Guardian.

**Greg Smith (28:39):** OK. Maybe. OK, we'll let go. Let it go.

**Donald Fraser (28:43):** OK, AA deals with many different pricing arrangements across hospitals, surgeons, surgeons, groups, insurers. So contracts need one consistent reusable structure that covers all of them. See domain model MD for the full field by field structure.

**Greg Smith (28:53):** To.

**Donald Fraser (29:01):** The first feature here. Which is 4.2 dot one. Holderscope organisational reach admins to find who holds each contract. Hospital surgeon, surgeons group and insurer, or the booking's own billable party, the contract or.

**Greg Smith (29:19):** Yeah, I'm not. I'm not sure about that. Where is the circumstance? Where the bookings billable party would hold a contract that isn't covered by the previous list.

**Donald Fraser (29:31):** Yeah, I think the language here is probably not quite right. Again, it's probably in the situation where there is no contract. You don't suddenly have a, the system would. You know you would select the contract. You know no RVG contract, right? And that would be. You know that within assume the billable party is the patient, unless they're under 18 and then you know, you then define another billable party or whatever the case may be.

**Greg Smith (30:08):** I just think. I mean, who's the audience for this? I want this sentence. Because the pit. Yep.

**Donald Fraser (30:29):** And they should be written so the development team can understand how the system is going to work, so that the AI can build out updates to the prototype to fulfil these requirements, and in a language that I can sit down with Ben or whoever else and have them approve that they're right. And so right now, the phase we're in, we're trying to get essentially a close enough approximation of what AA needs and wants so that we can update the prototype.

**Greg Smith (30:48):** Yeah.

**Donald Fraser (30:49):** To meet this level, because the prototype is, you know, woefully out of date and not accurate.

**Greg Smith (30:51):** Yeah.

**Donald Fraser (30:55):** And then once we're at that point, you know all of the language in these will likely be updated based on our transcripts. Again, there's lots of new data that these requirements haven't quite been updated to interpret or be accurate so. Umm. These are not the final written words of the requirements that will be put in front of, let's just say being in this example, but. They need to be close enough. For us to get to the next stage.

**Greg Smith (31:29):** OK, I think into the language. I'm I'm. I'm just making the comment here that the phrase the booking's billable party doesn't jive with me in terms of I don't understand what you're trying to say.

**Donald Fraser (31:33):** Yes. OK.

**Greg Smith (31:41):** I was just trying to extract a use case that would explain it for me.

**Donald Fraser (31:43):** Yeah, totally so. If we go back to this image here. I'm gonna get a cosmetic facelift procedure.

**Greg Smith (31:53):** Yep.

**Donald Fraser (31:54):** Umm. I don't have insurance for it. And So what this is saying. Admins define who holds each contract. Hospital Surgeon Group, an insurer. All that sort of stuff or the booking's billable party and so an RVG contract in our system when it says billable party, there will basically be a. Also write technical term a variable that says you know at patient and the patient becomes the billable party you know.

**Greg Smith (32:30):** Yeah, yeah. I'm just wondering if you could say there. Or the default book or the default contract because it just. Yeah, it's least specific because the sort of what's happening isn't it.

**Donald Fraser (32:40):** OK. OK. So specifically here, where it says admins to phone who holds each contact. Or the. No. The bookings. Patient. What's what specifically do you want me to change?

**Greg Smith (33:04):** Wallet. It's just that the language is. Umm. Those those circumstances that you're trying to capture here are people who don't have a contract, but for whom we are using the default contract, right? Is that correct? Is that what we're talking about?

**Donald Fraser (33:25):** I believe that's what we're defining here, yeah.

**Greg Smith (33:27):** Yeah. So I'm just. I don't have to fix it now, but I'm just. Suggesting that there's probably a better way to express that. For the developers.

**Donald Fraser (33:36):** OK. Cool. Well, this is we. We can pass over this again in the future. Hopefully based on this transcript, Claude, we can update the wording on this one.

**Greg Smith (33:43):** Yeah, yeah.

**Donald Fraser (33:50):** The contract always defines who defines the billable party and there can be many contracts as many contracts as AA needs. Uh.

**Greg Smith (33:59):** Yep.

**Donald Fraser (34:01):** Admins also set where the contract applies, using filters such as hospitals, procedures from the master procedure list, surgeons, insurers, RVG codes or groups. Funding source specific anaesthetists, right? So that's the situation where you might have a first-party contract in the system for a fixed price within these settings. By default. The anaesthetist filter is empty and the contract applies across the whole organisation.

**Greg Smith (34:26):** Yep.

**Donald Fraser (34:32):** Admins can narrow it down to specific anaesthetists instead, which is how individual anaesthetist own agreements get set up as its own contract without affecting the organisational 1. This scope is what the system uses to narrow the list of contracts offered when one is chosen for a procedure, so admins only see the contracts relevant to the procedure in hospital, or possibly the surgeon. Not settled now. This is obviously saying the list is being filtered for the admin staff, but also it would be filtered for any user using the system, right? So and then it's just looking at the list wanting to change it. They would also get the same benefits of an easier way to navigate.

**Greg Smith (35:12):** I think they. Business. Currently. Identifies the contract holder as one of the early steps in reducing the list visible. So it's got. Can't. OK. So let's say we have a surgeon. Who's booking a procedure at a hospital? There'll be something on the hospital that sees. Something on the booking that says how it's being funded. The admin has to determine whether it's a. Who the contract holder is in order for the rest of this logic to flow. So they have to say, well, it's. It's the hospital as the contract holder or the patient is effectively the contract holder, or the surgeon is the contract holder. So that and then then it's very easy to give the. List of contracts under that holder. And identify.

**Donald Fraser (36:22):** Yeah.

**Greg Smith (36:22):** That's how they navigate it, right?

**Donald Fraser (36:24):** I think I think what you're saying isn't out of sync with what my understanding is and what I think this is communicating. I think the particular experience here can be refined as we kind of build it out. Yeah, cool. OK. Umm. Contract pricing and adjustment rules admins need to be able to create and manage contracts. Each contract is made-up of a few different settings that together define how a procedure using it gets priced. Our contract sits under a procedure and defines base units or range. Custom unit rate or discount? I really think those should be two different lines. Custom unit rate. Pre-applied discount. Pre-applied modifiers. Fixed fee with the fee overrides are allowed. The billable party and invoice e-mail its scope OK. A contract sets its price basis RVG units multiplied by the anaesthetist's own unit value. By default, RVG units may be modified by an agreed contract rate or discount percentage. A fixed price taken from a fee schedule or a contract defined rate. A unit rate this contract specifies. Cool. Base unit.

**Greg Smith (37:59):** So I'll just go back here. You're going very fast, Donald. I need a chance to comment on this rather than just read through it so.

**Donald Fraser (38:03):** Yeah. Yep.

**Greg Smith (38:08):** You're saying that the billable party and the invoice e-mail. A contract. A billable party, such as a hospital.

**Donald Fraser (38:17):** Yeah.

**Greg Smith (38:18):** Can hold many contracts, so the contract should just have identify. Two things I think. A. It should point to the billable party where there is a billable party being identified.

**Donald Fraser (38:33):** Mm.

**Greg Smith (38:33):** So so it would point to the hospital somewhere. We need to have a recall.

**Donald Fraser (38:36):** Yeah, like.

**Greg Smith (38:37):** That said, this is hospital contacts, emails, blah blah blah, right?

**Donald Fraser (38:40):** Yeah. Well, like a crush or try, you know.

**Greg Smith (38:40):** So it doesn't capture that infant. Yeah. So it doesn't capture that information in the record. It just points to. It identifies the billable party right and.

**Donald Fraser (38:55):** Opposing just there, Marvin, are you? Are you saying the difference here is that in one example of the system, the contract would have the named hospital and the e-mail address, and then the other thing which I think is what you're saying, the system would keep a record of all hospitals and then the contract would point to that hospital and that hospital would have the contact name and e-mail address or the invoice, you know mailbox.

**Greg Smith (39:17):** No, I'm not. I'm not. No, I'm not. I'm not saying that I'm saying. That there need to be two fields in the contract around managing billable party. So 1 field would be this field that says. Contract holder is billable party, yes or no? And then it commits to the billable party now. The billable party is the table somewhere that holds the list of all the billable parties, including hospital surgeons and patients or patient guardians. However, that resolves. We'll just call it patients. So the billable parties. Sit is a reference table. So that the contract says OK. This contract holder. Is the billable party and here is the reference to the billable party name.

**Donald Fraser (40:18):** Yeah.

**Greg Smith (40:18):** So this is how. That's how we join. The contract to the hospital, and similarly, if it's if it says it's not if the.

**Donald Fraser (40:21):** OK.

**Greg Smith (40:28):** If the contract is not a. Contract holder is not the billable party. Then by default it is the patient and that points to either the patient record or the billable party record where wherever they decide to keep it.

**Donald Fraser (40:45):** Yeah, this is the sort of thing that I think is. Yeah, this is the sort of thing that I think is great for you to define in the technical document, like when you update that and you.

**Greg Smith (40:53):** Yeah. So I'm just pointing out here. Yeah, I'm just pointing out here that it's probably better not to refer to the e-mail in that line because it implies that the e-mail is embedded in the contract and it wouldn't be. It will be somewhere else. You just want to identify who the billable party is in this table.

**Donald Fraser (41:14):** OK. Well, I won't. Confirm this one. I'll leave it as it is because yeah, I appreciate that you. Have concerns about the particular shape and ownership of the different entities. But in essence, what this is defining is that. There is a bunch of different rules that a contract can hold. We're happy with most of them or our understanding and most of them as they exist right now in this sort of text form, the particulars around buildable party invoice, e-mail, that sort of stuff. You wanna kinda shape up and redefine, that's totally fine. Yeah, I'd appreciate it if you can find some time to. Ah. To find that in a way that then I can take it in and update all of these with.

**Greg Smith (42:07):** Good.

**Donald Fraser (42:08):** Yeah. Nice. Right. Does that sound right to you?

**Greg Smith (42:12):** Yeah, I'm just making the point that if a developer is reading this, there's an implication here about. That he'll have to. He he'll reach a conclusion intuitively that he'll then have to unwind that I'm just just making a comment about the language, that's all.

**Donald Fraser (42:29):** Nice. That's good. That's good. I'm well. I'm glad that you can bring that lens to this. Yeah. And once you've shaped it up, we can then make sure. What they're saying is aligns with what you're intending.


## Pricing rules, fixed-fee schedule lines, GST and RVG mapping

**Greg Smith (42:45):** Cool.

**Donald Fraser (42:45):** Nice. OK #3 here. Fixed fee schedule lines. Admins enter the individual lines of a fixed fee schedule for contracts priced this way. Each line carries the contract holders, own code and description, and its price, both excluding and including GST. A line can also carry an optional.

**Greg Smith (43:08):** Sorry. Can I just go back to the first line? I think this is generic about contract lines. It's it's not. It may not just be a fixed fee schedule. It could be one of those ACC contracts. Last night they were discussing where the contract is for an agreed rate, so it could be any of those variables, right?

**Donald Fraser (43:33):** Yep, Yep, I think.

**Greg Smith (43:34):** So you could just say that into the individual lines of the. Schedule right? This this description will cover all styles unless you've got more lines following with different styles. What have you handled it?

**Donald Fraser (43:51):** Yeah, I don't know why it's predefined this as. A story with the previous one, I thought. Kind of already captured fixed fees sort of acknowledgement.

**Greg Smith (44:05):** Oh, because we are talking here. That's true. Actually that shouldn't be there.

**Donald Fraser (44:09):** Yeah. So.

**Greg Smith (44:09):** It seems to have conflated the fact that this is a 2 table story, not A1 table story.

**Donald Fraser (44:14):** Well, maybe I don't, I don't.

**Greg Smith (44:16):** A little bit.

**Donald Fraser (44:17):** I mean, as of now, I've just read the first paragraph or the first sentence was too fair.

**Greg Smith (44:20):** Yeah, that's a line, yeah.

**Donald Fraser (44:21):** Yeah, it. I don't know if it's necessary saying there are two tables. It's just giving a little bit more language around fixed fees I think and maybe based on some of these open questions. And what does this image say right now? Interesting fixed gross and based on. The transcript. It may decide to merge these into one. Umm. Yeah.

**Greg Smith (44:47):** So so a fixed fee. Wooden carry GST inclusive pricing. It would just carry the price.

**Donald Fraser (44:58):** Is that price including or excluding GST?

**Greg Smith (45:00):** Who will be always be excluding the GST?

**Donald Fraser (45:02):** Yeah. I think I agree with you. I think the system shouldn't include a GST price and everything. It could just should just be calculated when it needs to be calculated.

**Greg Smith (45:13):** Absolutely, because it changes.

**Donald Fraser (45:15):** [unclear]. OK.

**Greg Smith (45:27):** Now it says it's got an optional mapping to an RVG code, but would that be correct, do you think?

**Donald Fraser (45:34):** I mean, again, your mental, your technical model isn't in my head. But in my mental model, which is looks something like this. It's not really an optional thing. Every procedure will have a link to an RVG code. And.

**Greg Smith (45:52):** Yeah, it will. It will.

**Donald Fraser (45:53):** And then it maps to it. Now maybe this is referring to something in one of your old images, which I don't think it is. I specifically told it not to ingest your old document. So I think this is wrong in terms of the optional, it's not.

**Greg Smith (46:06):** Yeah, the. Yeah, it's mandatory, isn't it?

**Donald Fraser (46:10):** Well, it's not even like it.

**Greg Smith (46:10):** Because that's what it's doing, isn't it?

**Donald Fraser (46:12):** It just has it like again in the in the world where this user story and the one above it where we just read, they should. They're basically one story together. This isn't really saying anything new at this stage. But there's a time band. There is a flag marking it as an add on. I don't know about that.

**Greg Smith (46:33):** No, I don't think so.

**Donald Fraser (46:34):** And a quantity rule I don't know about that.

**Greg Smith (46:37):** No.

**Donald Fraser (46:38):** Yeah. So I'm just going to delete those so that this sits a little more slim. And I suspect based on that transcript, it might review these two and merge them. Yeah, the optional RVG mapping matters because it lets the. BTM still be recorded against an RVG code even when the pricing itself comes from the fixed fee schedule line. Again, it's not optional. There will always be an RVG attached, so I'm going to delete that line. The holders own code is kept as a reference and searchable. When picking a contract procedure or contract pair can therefore carry both. Yep, that's fine. So essentially if. Christchurch Eye Surgery, you know, have a procedure that comes in and there's a code that the admin team know because they see it on the PDF or they're super smart 'cause. They just always do it all the time. They can search against that code as well and have it show up.

**Greg Smith (47:21):** Yep. Absolutely.

**Donald Fraser (47:39):** OK. We won't look at these open Krish.

**Greg Smith (47:41):** I mean of the search should probably be some sort of composite where they like a modern search where you can type it in and figure out where it is and find it.


## Required booking inputs, prepayment and anaesthetist-specific contracts

**Donald Fraser (47:50):** Yep, Yep. I'm with you there. OK. Required booking inputs admins to clear which booking which per booking inputs a contract requires from. Invoice e-mail billable party, a prepaid amount and insurer member number claim reference. Interesting so. Admins will declare, in my mind on a contract, but they'll change the settings to say, you know. Who the billable party is, or if it's unknown, it's inferred, or the patient and that sort of stuff, like those sorts of settings. They will also. I don't think. The Admins will define. What the prepaid amount is going to be, but I don't think there's any options to define whether or not a prepaid amount can be defined. You know, per booking or per anaesthetist, you know, whatever. It's just like a contract has a prepaid amount set on it and that's what it is. So again, this is a story I'm not really understanding what it's describing and probably just needs to be rolled up into something else.

**Greg Smith (49:00):** Actually, I was thinking last night that we could use the. Correct construct to capture those cosmetic prepayments for individual anaesthetists. The mechanism will work really well, so you know how we have. The surgeon has a fixed price.

**Donald Fraser (49:17):** Yeah, this this is already captured, right?

**Greg Smith (49:17):** For appraise.

**Donald Fraser (49:19):** That's what this whole first party and this is contract is for.

**Greg Smith (49:19):** It's. Yeah. So it's all that's all really nicely captured there and it's just at that point, it's a fixed price contract and the admin just selects that contract done.

**Donald Fraser (49:25):** Exactly. Exactly right. Exactly right. Yep. And Ben said it. Well, or maybe it was Nick. If anaesthetist want to be prepaid for something, they will need to define what the fixed price is for that procedure.

**Greg Smith (49:44):** Yes, they have to. Yep.

**Donald Fraser (49:44):** And so this means that they're ultimately needs to be a function in the anaesthetist app, the web app, or the mobile app to allow them to manage all of their own. Fixed fee contracts, which are attached to procedures, yeah.

**Greg Smith (50:01):** Yeah. Or they could behave like any other contract holder and just give the officer schedule.

**Donald Fraser (50:06):** But they obviously could do that and the admin team could do it, you know, on their behalf, yes.

**Greg Smith (50:11):** I think it would be a better way to start and it saves doing a whole lot of work.

**Donald Fraser (50:16):** Yeah, I mean. Potentially. Yep.

**Greg Smith (50:20):** And it might be a bit away in the future because it means the office stays in control of contracts. And I think that's probably a good principle. Oh.

**Donald Fraser (50:29):** Yeah, I mean. Based on what I've been hearing. I believe some anaesthetists would want to be able to manage that themselves or review it themselves. Make sure it's right. But. I guess that's something we can figure out, yeah.

**Greg Smith (50:48):** Yeah. Yeah, I'm. Yeah, I was just thinking about just thinking generally about workload in terms of building version one. You know, if we just completely, you know, after the conversation last night, I reckon we could just.

**Donald Fraser (51:03):** Yeah.

**Greg Smith (51:04):** Pretty much forget about modifiers and we're trying to do any assistant work and modifiers and no one would mind. And similarly here if we made the. Anaesthetists just use our schedule to lodge their contract prices once a year or whatever they do. That would work fine too. And then we wouldn't have to build anything in the app to do it. And we could revisit that some other time.

**Donald Fraser (51:32):** Yep, no, it's very cool. Certainly not something that would be needed for the version one.

**Greg Smith (51:36):** No.

**Donald Fraser (51:37):** OK, returning to this story then. Administer clear which per booking inputs a contract requires. Again, I think this story just needs to be rolled up with the ones before it.

**Greg Smith (51:48):** Well, can I just unpack that for a minute so? Consistent with my earlier comment, there wouldn't be an invoice e-mail and he there'd be a billable party. But I think it would be a good idea to have a flag in the contract master for is pre payable because that would be the trigger if the office selects that contract then the system would then know oh this is a prepaid. I'll raise an invoice because we haven't covered that situation yet.

**Donald Fraser (52:14):** Uh. We have covered it because as the as the requirements currently understand it, that is a setting that exists on an anaesthetist, not on a procedure or a contract.

**Greg Smith (52:27):** But that's not right either, because it's only when that assists that anaesthetist does those cosmetic work.

**Donald Fraser (52:36):** Uh-huh.

**Greg Smith (52:36):** That he prepays. There are lots of other things he'll do that are not cosmetic.

**Donald Fraser (52:42):** It's. Correct me if I'm wrong here, but. Thera. Might be like socially a role. There needs to all basically decide that cosmetic surgeries are prepaid, right? But it's not actually like an industry defined rule that it has to be. Cosmetics and there may be other particular procedures that they also may want to have prepaid.

**Greg Smith (53:12):** Any any anaesthetist can opt to be prepaid for any procedure, right? But the prep the practise is that it mainly works for cosmetics, because that's an area that's problematic to collect.

**Donald Fraser (53:17):** Exactly right. Exactly right. Yeah. So we're aligned on that.

**Greg Smith (53:28):** So therefore the flag belongs with the contract, not with the anaesthetist.

**Donald Fraser (53:33):** Well, that's the part that we're not aligned on, so. A contract defines. Who panel? Let's go back, right, so. You got better to the top one here. A contractor finds how it is priced. Not have three things House price. What rules apply and who gets the invoice? So how it's priced is?

**Greg Smith (53:56):** So what are the rules you're alluding to there?

**Donald Fraser (53:58):** Yes, Sir. So how it's priced right? That's saying is it RVG? Is it fixed? Does it have a custom rate? That's the how it's priced. The rules, you know, define. Can I have a discount? Can't have a discount.

**Greg Smith (54:06):** Yep.

**Donald Fraser (54:10):** You know all basically the rules of how it basically is priced and then who gets the invoice. You know the billable party. But it doesn't. The contract doesn't define. It's invoiced. So. They can be. In theory, the exact same contract. Let's just call it the RVG. No contract for now. They could be the exact same contract that defines the base units and basically nothing else because they all inherited from the parents above, right?

**Greg Smith (54:42):** Yep.

**Donald Fraser (54:42):** Their exact contract between an esis A&B. And he says a May define that that contract is prepaid and they just be made a fine, that it's not prepaid. And that's defined as a decision of the anaesthetist on the anaesthetist profile, not on the contract.

**Greg Smith (55:04):** I would set up two contracts for that because. On was envisaging when we had the conversation a few minutes ago.

**Donald Fraser (55:09):** Oh yeah. Yeah, sorry. Yes, you're right. You're totally right. We'd already talked about the fact that it needs to can have a. Need to have a first a first party contract for themselves.

**Greg Smith (55:19):** First party contract. Yeah. And they are the contract holder.

**Donald Fraser (55:24):** Yep. Yep, Yep. Yep. Yep. I.

**Greg Smith (55:26):** And then under that there is the schedule of procedures that are prepaid.

**Donald Fraser (55:33):** Uh. Hold. Yeah. The particular mechanisms there do you have a? Do you have a single contract procedure or per RVG code?

**Greg Smith (55:51):** No.

**Donald Fraser (55:51):** I'm I'm talking out loud here.

**Greg Smith (55:52):** Oh, yes, yeah, yeah, you do, yeah.

**Donald Fraser (55:55):** Right. Or I think it's. I think it's still got to be.

**Greg Smith (55:58):** Oh, I'm sorry. Can I just change the language? You have a. You have a contract line for each procedure.

**Donald Fraser (56:05):** Yeah, your particular language of contract line isn't something I've quite grocked yet. And so, because of the particular technical parts of your diagram. Umm.

**Greg Smith (56:17):** Just think of it like a price list.

**Donald Fraser (56:19):** Yeah, yeah. But again, it's essentially it's one contract per. Or one contract that could be attached to many procedures. Or an RVG code, yes.

**Greg Smith (56:31):** Yes.

**Donald Fraser (56:32):** Yeah. Yeah. OK. So I'm going to pass over this particular story and ask Claude based on our transcript. To do the appropriate cleaning up of this section. And then move on over to the next one here.

**Greg Smith (56:50):** Right.

**Donald Fraser (56:50):** OK, admin set how a contract invoice looks. And how they had delivered the invoice layout, contract holder or patient since the two are laid out differently, the delivery method. E-mail portal upload for the direct insurer. So basically for nib in that scenario and then the GST treatment. This is so every invoice under a contract is laid out, delivered and taxed in the same way without the office staff need to choose these settings booking by booking.

**Greg Smith (57:10):** Skip.

**Donald Fraser (57:22):** So this is saying that these are set out or defined in the contract, which seems right to me.


## Invoice presentation, GST treatment and price effective dates

**Greg Smith (57:27):** Yeah.

**Donald Fraser (57:27):** The GST treatment part. Let's go back to let's see in the future what that's talking about.

**Greg Smith (57:32):** Please speak.

**Donald Fraser (57:33):** The system holds every price GST exclusive and derives its GST inclusive amount from it. This is because the fee schedule is published. Both ways are published both ways and NSAID to report GST on their invoices. That's fine. I think what that's defining there is appropriate.

**Greg Smith (57:51):** Devices on the Christchurch eyes contract schedule that they have inclusive and exclusive pricing. I'm from.

**Donald Fraser (57:57):** Some of them, some of them, do not. All of them. So let's take a look here.

**Greg Smith (58:00):** Yeah. So I think the rule for the system is that everything internally is. Exclusive and then the GST goes on the bottom of the invoice. That's how we will want to.

**Donald Fraser (58:10):** Yep. Yep, we're we're aligned on that.

**Greg Smith (58:13):** Yeah.

**Donald Fraser (58:14):** OK. Cool pricing effective from a date. Every price a contract holds carries an effective from date. Each fixed fee, schedule line, and a contract rate, or a discount percentage. Defeat it relative. So it's like from date. What is it saying here? Each price a contract holds. Every price a contract holds carries an effective from date. OK, so I think the idea here is that. Uh. There might be a standard cataract procedure. Again, I know there's a hundred different ways to do a cataract, we're told, but it's just run with it. For this example, there could be a standard Christchurch eye. Fixed price for a cataract. Procedure. And I think what this is saying is that when a new. price list for that procedure comes out. You don't literally make a new contract within the contract. You could see basically a different time bands for prices. So you would have that full history on that contract to say? 2000 and three 2000 until 2004, you've got price a 2004 to 2026, you've got price B and then the last one might be from this date 2026, July 1st. To blank you've got Price C. So this is basically saying that a single contract can hold multiple prices. I think that's what they're saying. I don't know what it's talking about here in terms of a discount percentage. I. Don't know.

**Greg Smith (59:55):** You see, I had envisaged that the contract would be dated, but the lines wouldn't because the lines are all children of the contract.

**Donald Fraser (1:00:06):** OK. Well, I maybe this is a case with. What your understanding is and what this these requirements are saying are out of sync because we need to have your updated sort of document. But I think.

**Greg Smith (1:00:21):** It raises an interesting. It raises an interesting point though, because. Hello. If you've got. Add dated. If you've also got a dated line. Is sort of. That line stops being a. Child of the. You're in contract. It's sort of got like a life of its own. Where is the idea of the contract was an organisational. Structure that allowed you to group the details of a pricing schedule under a single thing.

**Donald Fraser (1:00:55):** Yeah.

**Greg Smith (1:00:56):** So by definition, they all need to move together as a unit.

**Donald Fraser (1:01:01):** Yup.

**Greg Smith (1:01:02):** All right, so.

**Donald Fraser (1:01:05):** What they would propose here, I think, is that. We know that pricing needs to be affected from a date. The particular way that a system the system defines this, I don't know what that is going to be. You've got some ideas and so I really think you should propose what those are, but in the end it'll be up to the actual developers to take what you have defined and say that fits really well. Or actually I think it should be a little bit different, but.

**Greg Smith (1:01:24):** Yeah.

**Donald Fraser (1:01:34):** We do know what effectively the outcome should be, which is that. Pricing on a procedure. From a contract needs to have an effective date, so I think.

**Greg Smith (1:01:44):** Yeah, you notice it's got itself all fouled up here too by referencing fixed fee schedule line again and then talking about it's it's just a bit confused about this.

**Donald Fraser (1:01:50):** Yeah. Yeah, I think all of this wording here is not great. And so I won't mark this as confirmed. But the sooner you can. You do your technical document. I will then pass in the human language. Document your technical document and ask it to update all of these based on those. OK.

**Greg Smith (1:02:16):** Yeah.

**Donald Fraser (1:02:17):** So we'll keep pushing forward here combination.

**Greg Smith (1:02:20):** But just can I just? I know you're desperate to get through this, general, but this this.

**Donald Fraser (1:02:21):** Yeah.


## Contract schedule uploads, tabular controls and office checking

**Greg Smith (1:02:26):** Touches the conversation. Oh, that a feature we looked at earlier, which was the ability to load a contract schedule either as a delta or a full set. But I think.

**Donald Fraser (1:02:38):** Which we I think determined was out of scope now.

**Greg Smith (1:02:41):** Yeah. Well, I think that it. I'm. I'm just reflecting on how this might work. A delta could be problematic, so we might just go with a complete overwrite which says. Here's the new contracts and this is everything. So you basically Mark, Mark all the old contracts as finished.

**Donald Fraser (1:02:55):** What? Yeah. Again, I think what what? Nick was saying last night, which I absolutely agree with. The infrequency with which these contracts are updated means that. At my expectation and next expectation is that all of these will be. Updated manually when they come in by the admin team rather than any sort of automated structure to do deltas or updates and things like that.

**Greg Smith (1:03:25):** I don't share that view for for. A control point reason. But that's OK. Let's move on.

**Donald Fraser (1:03:32):** Well. Do you think?

**Greg Smith (1:03:35):** As I did say to Nick that the admin team would create the spreadsheet and he said yes.

**Donald Fraser (1:03:40):** Uh-huh. But I heard him.

**Greg Smith (1:03:41):** So that that, that you're gone.

**Donald Fraser (1:03:43):** Well, I mean. I. I don't want to. I actually don't really mind which way, right? And so when you originally described, hey, let's get the system to output a spreadsheet and send that to all of the other third parties and get them to fill it in. That made sense to me, but I specifically remember Nick saying last night. That will be a job we're going to ask somebody else to do, and it's hard to enforce that. We don't want to get into the method of trying to get them to dance our dance. They already have a system for producing price lists, and they'll send it to us like they always do.

**Greg Smith (1:04:23):** Yes, he did, and I agreed with them on that.

**Donald Fraser (1:04:24):** Yeah. OK.

**Greg Smith (1:04:26):** And then I said so the admin team will create the spreadsheet and he said yes.

**Donald Fraser (1:04:32):** OK. And what do you think? Well, what do you mean by that?

**Greg Smith (1:04:36):** That there'll be a spreadsheet upload mechanism as a way to update a contract schedule. And there's a reason for that.

**Donald Fraser (1:04:42):** As opposed to you is in the GUI.

**Greg Smith (1:04:45):** It is a reason for that outside the system in terms of control and check, right? And so it. I don't mind how it's affected or built so effectively. There will be one format for a contract. Upload that the Admin team will use for any contract that comes in. So that. It can be uploaded in a consistent way. And it's been pre-approved.

**Donald Fraser (1:05:21):** MMM.

**Greg Smith (1:05:21):** I mean, you can just create chaos when you load stuff up. That's wrong, right? So it's a.

**Donald Fraser (1:05:26):** Yeah, I agree.

**Greg Smith (1:05:28):** It's a it's a point of. There's a point of data discipline here about checking that the contract details are correct before they are uploaded into the system. However, that's done.

**Donald Fraser (1:05:43):** That's right. But at least maybe I'm missing a beat here, but. Imagine we had a spreadsheet. And then anisus fill it in. Sorry, AA star. Fill it in and then you upload it into the system. The system needs to do cheques to make sure that is, you know it obeys all the rules of the input.

**Greg Smith (1:05:55):** Yeah.

**Donald Fraser (1:06:01):** I don't understand why those exact same rules won't already be in the system. Within the contract management screens. Such.

**Greg Smith (1:06:11):** The system can't check that the. The system can't check that the line price is right.

**Donald Fraser (1:06:15):** Neither can the spreadsheet ingest.

**Greg Smith (1:06:19):** It's an external process. There needs to be a process in the office itself where. The data being uploaded is checked.

**Donald Fraser (1:06:34):** Yeah. So this you're talking about a human process outside of the system, right?

**Greg Smith (1:06:35):** You don't get that. Yes, I am. Yes, I am.

**Donald Fraser (1:06:39):** Yeah. So so regardless of whether or not that human process is looking at a spreadsheet or it's somebody whose job it is to on a given day, open the contracts manager. Sorry. I mean, let's go in here just for some sort of. Example, so contracts again. This is a bad example because this isn't quite true, but just imagine that there's some screen where an AA admin staff is going through and saying oh, this company has come in and they have a new fixed cost for this contract on this day and they save it right the human process. Whether it's done within a GUI versus it's done within Excel import. I don't think. I don't think one Trump's the other in terms of. Security audit or you know, whatever the case may be.

**Greg Smith (1:07:40):** Well, I don't agree with you about that. So what's to stop that user transposing a figure in that upload?

**Donald Fraser (1:07:47):** Transposing is in making a mistake. When they type it in.

**Greg Smith (1:07:50):** Yeah, yeah.

**Donald Fraser (1:07:52):** Nothing is stopping them from doing that, but also nothing is stopping them from typing the wrong details into a cell in a spreadsheet.

**Greg Smith (1:07:54):** That's right. Yeah, there is because it gets checked by a second person before it gets uploaded.

**Donald Fraser (1:08:02):** So you will just. OK, so you're talking about. A human process.

**Greg Smith (1:08:05):** We're talking about office controls. You you're just not listening, right?

**Donald Fraser (1:08:07):** Yeah, yeah.

**Greg Smith (1:08:09):** There's a there's a process requirement about. Quality of the data that's needed before the data hits the system, right?

**Donald Fraser (1:08:14):** Yeah. MMM MMM.

**Greg Smith (1:08:18):** And there's a great flaw in having an individual sit in front of a screen and type, and that is that it's an invitation to error and you can't pick them up because nobody has crossed checking that the data is correct, right?

**Donald Fraser (1:08:32):** Yeah. So if I play back what you're saying, you're describing that [unclear contract holder] submits a new price list. Admin staff member A would open up the formatted import spreadsheet and transpose the data from the PDF into the spreadsheet. Then staff member B looks at that spreadsheet and the PDF and checks the numbers. Once they're both happy, either one of those staff members initiates the spreadsheet import process. Is that right?

**Greg Smith (1:09:15):** Yep, Yep.

**Donald Fraser (1:09:15):** Great.

**Greg Smith (1:09:15):** And it's a formal process.

**Donald Fraser (1:09:16):** Yes, sure. So that's a process that exists outside of the system, and the only part the system cares about is the ultimate spreadsheet that arrives.

**Greg Smith (1:09:24):** Yes. And what I'm saying is we need the system to support that style of upload so that we can implement those office disciplines which do not currently exist and cause problems every day.

**Donald Fraser (1:09:25):** Great. Nice. So what I'm trying to say is that. That same scenario could still exist where admin a price list comes from Christchurch I. Office admin staff A. Looks at it. Edits a contract in the system. And then staff member bead looks at it and says yes, that looks correct. And they hit save.


## Disagreement over the upload requirement and clarification of intent

**Greg Smith (1:10:00):** Now, now look, stop. Stop being a prick, Donald. This is an important feature and it's not appropriate for you to sit here arguing about it, right? I need it as a requirement. And I don't see why you don't put it into the requirements.

**Donald Fraser (1:10:15):** OK.

**Greg Smith (1:10:16):** What is your problem?

**Donald Fraser (1:10:18):** I'm. This is some. I'm. I'm really sorry, Greg. I don't know what's happened here. Umm. I. I am absolutely not trying to be AA prick. I'm. I don't know what to say mate. Umm.

**Greg Smith (1:10:40):** I've tried to articulate the argument why. Is a feature. Supports a sound office process, right?

**Donald Fraser (1:10:47):** Yeah, yeah, yeah.

**Greg Smith (1:10:48):** And you are adamantly opposed to it. And every time I try and explain why it supports that feature you're trying to. Come up with an alternative reason why it's not needed and I just don't think I'm being heard. In fact, I'm not being heard at all and I don't understand why. When I'm asking for something to be part of a process. I can't be put in the requirements.

**Donald Fraser (1:11:17):** Yeah. I'm Greg. I'm sorry mate, I. What? What am I saying?

**Greg Smith (1:11:30):** I mean there there is another way to do this, which is that you we could create some sort of a tabular upload. Strategy where that data could be put into a table format screen which allowed some. cross-checking or check-digit type calculation/manipulation of the data to make sure that the data typed in was the same as the data on the external schedule and that would effectively be the same as a spreadsheet strategy in that you end up with a tabular representation of a schedule of data to be upload that it would allow. That would sit there and draft and allow a second person. To go through that data. So that's sort of a hybrid of you saying that two people are going to sit together and look at the data as it's typed in, which is actually not the same as having a tabular view where a second person. It's not the same human process in terms of the human psychology of the checking. Of the tabular data, where for instance, you might just run a total of the numbers in the column, even though they're meaningless to compare the total of the numbers in the schedule that arrived, so that you've got some form of. Uh, crosscheck of the validity of the total list of numbers. Because actually it's not. It's quite difficult to type in a list of numbers. Correctly. If you've got like 100 lines and you're trying to type those in, the chances of you getting every line perfect in the first cut are not that good actually. So this is the process is designed to consider how to minimise the errors in the in what happens when when sets of sets of data get uploaded rather than just single lines.

**Donald Fraser (1:13:29):** Yeah. So. In my head right now, when I think about the system and how it comes together and how it gets maintained. They will already need to be some sort of gooey screen in the application. That allows the AA admin staff to define all of the rules for all of the appropriate contracts, right? That will be built and they can create a contract.

**Greg Smith (1:13:55):** Yes.

**Donald Fraser (1:13:57):** They can edit a contract. You know, a few stories ago we were discussing. Whether or not. The contract itself has, I think what you were calling contract lines that define, you know, time bands. So I don't know if that's the right way or you ultimately do create different versions of them.

**Greg Smith (1:14:16):** No, just I'm defining. The contract. The purpose of the contract is effectively to group in a time band, a set of line of of. Procedure allowance that are subject to this agreement for this period of time, right?

**Donald Fraser (1:14:31):** Yeah. So that's what I'm saying. Like I don't know whether or not those band time bands exist within one contract, or you make multiple contracts, each one having their own time band, right? I don't know about the correct way that that is shaped and handled in the back end, but essentially there will be some sort of functionality within the application that needs to exist to allow the AA staff to manage these. And so that has to be built for the system to exist. I can see the value and what you're describing in some other sort of. Process to do some bulk uploads from time to time. Bulk edit from time to time. Umm. I think. The part that I'm, uh. Trying to question. Is. Does that bulk upload feature? Have to exist. Maybe on day one versus later on. And I'm saying that. It's conceivable that the system. Can still be supported without using that. Having that bulk upload feature. Because the human processes that happen outside of the system itself. You know, I can talk to Vanessa about and you can talk to Vanessa about and we can encourage them to have some diligence and whatever around that. But ultimately, the system will still just accept what the user gives them, whether that be via. Spreadsheet or via somebody editing a screen.


## Contract structure, technical modelling and prototype requirements

**Greg Smith (1:16:13):** Disagree with you, but I did suggest that that upload could be handled by using a tabular format and I don't think you're hooked into that idea either.

**Donald Fraser (1:16:21):** Yeah. So. I don't sure if I have a good picture in my head as to what that means. Can you help me understand?

**Greg Smith (1:16:30):** Well, I think look, the reason I'm so ready about contracts is because I don't think you've really got the picture inside your head at the moment as to how a contract works. And I'm concerned about that in terms of. How it might reflect on the design, so I'm just trying to. When the specifics come up, go through all the details to try because.

**Donald Fraser (1:16:54):** MMM.

**Greg Smith (1:16:56):** To try and clarify where I think you're still. A little bit hazy about how these structures work and and I think my view is that it's really important for me to try and convey to you this understanding of the nature of the structure because you so many you draw, you will necessarily have to draw so many conclusions from our. So if we have that, then that means this. So I think from from.

**Donald Fraser (1:17:23):** Mm-hmm.

**Greg Smith (1:17:26):** A business perspective about what is a contract and how do we think about a contract? I'm not hearing in your language or in.

**Donald Fraser (1:17:34):** MMM.

**Greg Smith (1:17:35):** Towards language that you've really got this model sorted and I'm concerned about that because it drives so much else around this particular part of the system.

**Donald Fraser (1:17:36):** MMM.

**Greg Smith (1:17:45):** And in many ways, it's the guts of why the system's being built. So it's really important that everybody is has a really clear understanding of it and it's quite clear that Claude doesn't understand it this morning and I'm, I'm sorry to be pedantic, but I think it's very important.

**Donald Fraser (1:17:52):** MMM. Yeah, yeah. I agree with you that the stuff is important and the language in these requirements as we're reading them right now, do exist from the context of our meetings last week, not in some of the things that have happened before then since then. And so there are some gaps here that we're kind of working through and translating as we talk. Because those new recent artefacts have not been kind of set in stone as the wrong word, but basically confirmed to a point that they can be absorbed. And these can be updated. And I will absolutely own that. I. And picturing outcomes for interactions in the system. And I have maybe a. Let's say let's call it a high level. View as to. What the? Database structure. All the rules and relationships between these different entities might look like, you know, high level and you bring a level of experience that has forced you in a great way to unpack and define those rules more clearly, right? For me and my angle, some of this I can.

**Greg Smith (1:19:00):** Yeah. So. MMM.

**Donald Fraser (1:19:14):** My hope is that I'm defining the outcomes. That we want and Claude, for the sake of the prototype, will determine the technical makeup and then down the road, the actual developers, if they know what the outcome needs to be, can define what they believe the technical makeup's going to be. We're lucky to have you on this process and you're bringing that brain to it. And these inputs, that or these outputs we create for the system and for the developers will be stronger because you're bringing that technical lens. And so yeah, I think. the ways you're trying to think about the problems and the way you have the plumbing in your head for how they connect to each other is a great thing to bring to this. Yeah. So I don't. I'm not. I'm not trying to say that. I'm right. And you're wrong because I'm. I'm ready to take your. You know the way you wanna shape that to make this stronger?

**Greg Smith (1:20:18):** And in discussing this with you. Just now by talking it through 5. Of. Recognise that eventually it doesn't have to be a spreadsheet, but there needs to be a tabular control in the way this data is uploaded. But. I don't know whether Claude needs sorting out, or whether we just need to have AA slight. Side conversation here about what is a contract, so I'm looking at this page here. And it's got a contract definition that'll square up the and it talks about that. What I'm looking at the screen you're showing me in the middle of this is contract definition. And down there it's got pricing effective date, right, so.

**Donald Fraser (1:20:54):** Which page is this? Sorry. Oh, yeah, yeah, yeah. Oh yeah, so this feature. Yes.

**Greg Smith (1:21:07):** These are all these are all characteristics of the of the contact rather than the contract line. I'm assuming. Is that right?

**Donald Fraser (1:21:17):** Well, again, this is the language of a contract line. These requirements have never heard this because those are from a document that. Umm. Have since been ingested into the system.

**Greg Smith (1:21:32):** Oh, OK.

**Donald Fraser (1:21:32):** So.

**Greg Smith (1:21:32):** Well, that explains why it's mixing all this stuff up together.

**Donald Fraser (1:21:35):** Yeah, so so.

**Greg Smith (1:21:36):** Because it hasn't unpacked it.

**Donald Fraser (1:21:37):** If we go into the artefacts here you can see all of the transcripts of the meetings we had last week or earlier this week and you know the notes that were made made because of those.

**Greg Smith (1:21:43):** Yeah. Well, so those are all subsequent to this.

**Donald Fraser (1:21:49):** Umm. So since then you created that document. You know, I think we looked at on Monday or Tuesday, whatever it was Monday, you created that pricing document.

**Greg Smith (1:21:56):** Yeah, yeah.

**Donald Fraser (1:22:01):** That was your homework. You were going to do on the weekend, you know, because we were obviously not aligned on some of this contract stuff last week.

**Greg Smith (1:22:06):** Yep.

**Donald Fraser (1:22:07):** You're like Donald.

**Greg Smith (1:22:08):** Yep.

**Donald Fraser (1:22:08):** Give me some time. I'm going to go away and think about it. And so over the weekend you created a document I you and I spent two hours reading that document on Monday. And.

**Greg Smith (1:22:18):** Yep.

**Donald Fraser (1:22:19):** There was lots of stuff in there that I challenged because it didn't align with things that you and I had previously talked about for how the system was going to work. But there was obviously some good Nuggets in there in terms of how you were picturing the relationships between these entities, which was an element of this that I was not bringing to the table. But any of that document. Hasn't been ingested and incorporated into the requirements we're reading right now. And so like we were saying a bit earlier. It'd be really important for you to go ahead and. You know, tell me if you accept everything that's written in the human language part of the document, and then the second document, which is the technical one, go and, you know, make that what you believe it needs to be.

**Greg Smith (1:22:59):** Yep.

**Donald Fraser (1:23:05):** And I can't really not really interested in going in and contesting the technical parts of this. And we can bring that in here and have these requirements be updated to reflect that.

**Greg Smith (1:23:19):** Yeah, that's fine. And I'm quite happy to leave this spreadsheet conversation alone if we just have a requirement that says to be a mechanism to support the upload of a schedule.

**Donald Fraser (1:23:31):** I see. Yeah. I mean maybe what could help you is that? After you and I read through these requirements and again, if we look at the map down here, we're still only at about 1/3. Once we finish going through all of them, that's not going to be the full stop on these requirements.

**Greg Smith (1:23:44):** Yep.

**Donald Fraser (1:23:49):** You know, all of these can continue to be iterated on and after I make, I have to. Claude does. All because I really, I think it's really important that I can get this prototype caught up to where we are at, caught up to where these requirements are at.

**Greg Smith (1:24:03):** Yep.

**Donald Fraser (1:24:04):** So that then we can then make easier, cheaper, smaller changes as we go. You can say in a meeting, Donald. I want you to change the way the screen looks. So that you can. Edit or multiple, you know, edit multiple procedures or contracts at once and then we can just have that run while we're talking and then iterate on it, right? Like none of it is like a full stop. And so the particulars here of what the system absolutely must have, which is contracts need an effective from date. That's if we can just hold on to that for this moment and say we agree that this is something the system needs to support and model. And how we choose to make an experience to update that later? I think once we can see what? Claude is gonna bring back to us. I would love to sit down with you and get your thoughts on how you think that could be easier and better.

**Greg Smith (1:25:01):** OK. Well, the context of this being prior to that I had forgotten. So that changes how I'm viewing this, right? So let's let's move on.


## Working relationship reset and returning to the requirements

**Donald Fraser (1:25:10):** Nice. Nice. I feel like we have really turned a corner in our relationship, Greg, now that you've called me a prick. I. It's it's quite discouraging to me mate that. You felt like you were pushed to the edge where you needed to do that. How do you think we should move forward?

**Greg Smith (1:25:38):** Well, I just, it's very frustrated by. By. Not being listened to so.

**Donald Fraser (1:25:48):** Yeah, yeah.

**Greg Smith (1:25:48):** And I'm talking about a feature that's needed and I was getting no engagement or sympathy. I was just getting an argument as to why it wasn't going to be done, and to me that's unacceptable as a client that you're just telling me something can't happen without offering me a solution that I find acceptable and you weren't doing that.

**Donald Fraser (1:26:07):** Uh. OK.

**Greg Smith (1:26:09):** Well, I think you've got, you need to respect the fact that you know, I'm representing the customer and there is a need for the office to sort out its processes. And I was trying to explain to you that I needed some sort of a tabular or schedule update and you just.

**Donald Fraser (1:26:10):** OK.

**Greg Smith (1:26:27):** You weren't hearing me, and it's fine that you're not hearing me, but I got an argument as to why it wasn't needed, and that's that's just saying you're still not hearing me and you're still not hearing me.

**Donald Fraser (1:26:29):** Yeah.

**Greg Smith (1:26:38):** And you know, there was a very easy reconciliation to that, which is that we just need to say in the requirements here that we'll need to support some sort of schedule upload, right.

**Donald Fraser (1:26:38):** OK. OK. OK. Well, how about we do this then? OK. And we can. Fill in the details of that.

**Greg Smith (1:27:19):** 4 contracts just just for contracts, right?

**Donald Fraser (1:27:21):** Yeah, this sets up something to already within the contract sort of section here.

**Greg Smith (1:27:23):** OK. That's fine.

**Donald Fraser (1:27:27):** In fact, this probably would need to be sorry this it's there instead actually. OK. Let me just look at the calendar here. We have about an hour until our meeting with AA.

**Greg Smith (1:27:49):** Oh yeah.

**Donald Fraser (1:27:50):** Umm. I wonder. Wonder if we pause here. Do you think it would be possible for you to use the time between now and that meeting to work on the technical document?

**Greg Smith (1:28:14):** I probably need to be a bit calmer, to be honest. I think I think.

**Donald Fraser (1:28:18):** OK.

**Greg Smith (1:28:22):** If you're OK, I'd prefer to just keep going on this and just see if we can knock off some more of these stories. But if you want to stop for a coffee or something, that's fine.

**Donald Fraser (1:28:30):** OK. Well, my original plan, I talked about the beginning of this call was that we would finish reading through the contracts EPIC and then go through the outstanding items, kind of the questions that are outstanding, some of which I think we have answers for now. So let's let's push on with that then.

**Greg Smith (1:28:51):** OK. Yeah.


## Combination contracts and bundled fixed-fee procedures

**Donald Fraser (1:28:55):** Combination contracts. The Master procedure list. Holds standard single procedures. A combination is just a fixed fee contract under a procedure, not a separate procedure. For example, [unclear: likely “Merivale Plastic Surgery”] set-fee schedule. Uh. Solo self-funded bill to patient prices for facelift at $3565 or facelift, plus one add-on. 3900, and [unclear third amount]. Going forward, blah blah blah. All three are fixed fee contracts under the facelift procedure and the latter 2 are just combinations. A combination of several procedures, for example in. Abdominoplasty breast lift and liposuction is one contract sitting against its parent procedures, so picking any of them offers it. So if you were to pick from the procedure list this, this or this. You would see the single contract that was attached to all of them. Pause that in for comment. Are we aligned aligned on that?

**Greg Smith (1:30:13):** I'm just wondering if this is getting. I don't know the answer, but I'm just wondering if this is getting into the territory where. Ben's talking about there are an infinite number of procedures, and so you're never gonna know what the patient's gonna ask for and what the surgeon's gonna write on this description. So. The I think the question is. We're going to get this descriptive text from the booking. And deemed the first job is the admins got to figure out what that means in terms of. How she wants to create this? Booking procedure. Story so.

**Donald Fraser (1:30:55):** Mm-hmm. Mm-hmm.

**Greg Smith (1:30:58):** Umm. That's the point I'm trying to make here is there just may not be. A contract. Line. That specifies these three things together, because it's never happened before. And that will and to my argument would be. This is going to be a continuing scenario where some novel combination of. Some novel combination of. Procedures is bundled. Into a line. Or is it? Or are we talking about a prearranged bundle that has a fixed price on it?

**Donald Fraser (1:31:45):** We're talking about a bundle. What? Well, basically there is a you know Azure language is there's a price book or a price list. It's given to AA from a third party and they have a bundled fixed price for a set of procedures. And so again, it's the contract that defines who is paid, how they're paid, how much all that sort of stuff. And the procedure is a way to essentially more easily. Find all of those together, right? And you might remember we were in the office last week in the room that has a window to the hotel being renovated across the street. And I drew on the table the different scenarios on the whiteboard, you know, on the table of how you might shape this or how the system might.

**Greg Smith (1:32:32):** MMM.

**Donald Fraser (1:32:35):** Display it and also kind of manage it in the back end and we decided that. We would have. A single instance of a contract that could link to multiple parent procedures so that you could find that fixed fee contract on any which angle you came at it from.

**Greg Smith (1:33:02):** It's a really complicated construct, doesn't it? Because it introduced us.

**Donald Fraser (1:33:07):** Just.

**Greg Smith (1:33:07):** Remember I talked about. I made a comment on my original document about. You could make procedures children of other procedures, but it was complicated.

**Donald Fraser (1:33:20):** MMM.

**Greg Smith (1:33:20):** And wasn't suggesting we did it. So I'm just thinking again of doing this, Donald. I'm thinking through to the implementation model and thinking my goodness that's going to be an expensive feature because it changes the design of the whole system. And I'm wondering if it would be easier for the Admin, just a deconstructed into three. Uh. Umm. 3 lines just a second. I'll be back in a minute. Sorry, we're just taking coffee orders. That's important.

**Donald Fraser (1:34:09):** Are you at home at the moment?

**Greg Smith (1:34:09):** Yeah. So I've just got to drive down to AA to talk to Vanessa and being at, you know, 1110 in about an hour. So I'm just thinking about. How to economically construct this requirement? Because it could end up being. My space available wants the code. It doesn't matter. And then they want them. Some of them want them split out, so I'm just wondering if we should always split them out.

**Donald Fraser (1:34:44):** So. In the model, in the mental model that. I have in my head and that we've talked about and I thought we were. You and I were aligned on. Any given sign. What is there a dog at my door? Come on mate. Any given? Contract by default it's just billed to the single person, but the admin team have the ability to split them as they need as they see fit, right? And so somewhere in our transcripts for previous calls, I mean, actually let's just go. Split. Pump Sage are split between two payers. So on a booking the user presses a button against a procedures contract line to split the invoice fee from that contract between several billable parties. The billing invoice engine defines divides the line item and invoices each party and its share as a separate invoice. For example, the insurer for their portion and a patient for the gap. So the system already has the ability. Should it need to happen? But it doesn't always need to happen. To. Split. This up if they needed to, but. The heavy path and maybe the default path is that. The way that you would see this from the front end is you would select A procedure you would see below that procedure there would be a contract for a combination of procedures and you would select the combination procedure contract and then. The anaesthetist turns up on the day they see their list. They see a booking. In that booking they can see that the contract is for multiple procedures paid for all at once, and then they would go ahead and do that and record their time. BT and M or not BTM or the recorders they want it to but in fact they don't need to because the fixed one. And they would just go ahead and do that procedure. And the one billable party would receive the bill.

**Greg Smith (1:36:50):** So when we split. Are we just splitting it by saying? Actually there are three procedures here? Or are we doing at financial split?

**Donald Fraser (1:37:01):** This this isn't this is not talking about splitting it at all. So splitting is talked about in another story.

**Greg Smith (1:37:07):** OK.

**Donald Fraser (1:37:07):** This is just saying that. On. A. There there exists contracts in the system, you know, and the free text field for that contract will name all of the you know, the things that the. price list defines so this scenario here facelift plus one add-on or facelift, +2 add-ons and there's a fixed price attached to that contract. And. You know all three. Our fixed fee contracts under the facelift, right? So these three options, there's a contract, a. Is a contract. B. And then where's the other one here? Ha ha.

**Greg Smith (1:37:57):** The other conflict. So yeah, this contract see.

**Donald Fraser (1:37:58):** Yeah, yeah, yeah. So all three of those are just three separate fixed price contracts.

**Greg Smith (1:37:59):** Yeah.

**Donald Fraser (1:38:02):** So it would all have the same parent or parents because you know, whatever ones there might be appropriately attached to.

**Greg Smith (1:38:17):** So. Is the value the sum of the three underlying contracts, or is the combination the combination is priced right?

**Donald Fraser (1:38:25):** No, so this is not so. That's right. So. So there's there'll be situations with a price list if you combine the three procedures individually, that would have a higher price. But they have a set price when they're combined together, so the system would display contracts for individual items and also display contracts for the combination.

**Greg Smith (1:38:41):** Yes, of course.

**Donald Fraser (1:38:48):** And as far as the system is concerned, it doesn't actually know what it is. It's just a free text field contract that has a title that has a parent, multiple parents maybe, and it's got a fixed fee.

**Greg Smith (1:39:03):** OK, but it is made-up of three procedures, right?

**Donald Fraser (1:39:06):** Yeah. I mean in the room. They would be proved 3 procedures happening.

**Greg Smith (1:39:11):** Yeah. OK. That's cool. So. Yeah, 'cause, the pricing comes from the contract. Now at the moment. If we have a look at that other little diagram you flicked to which you said, I thought we had agreement on this, we do. Can you go back to that?

**Donald Fraser (1:39:25):** Yeah, cool. This one here.

**Greg Smith (1:39:27):** Yeah. At the moment, right. Is a 1 to one relationship between the procedure and the pricing. So what we're thinking about doing is having say contract A, but three procedures, right? It's a differe.

**Donald Fraser (1:39:41):** Oh, it's it wouldn't. It wouldn't be 3 procedures, right? Contract a just has a name, and that name happens to say facelift plus one extra.

**Greg Smith (1:39:49):** Yeah, I get that. So what is the scenario we're trying to kind to address here?

**Donald Fraser (1:39:55):** Yeah, cool. So let me bring up an image or document just to make sure we've got something visible to look at. 20 minutes would be one second. OK. Yeah. That's actually perfect. OK. So. [unclear: likely “Merivale Plastic Surgery”] is exactly the scenario. So.

**Greg Smith (1:40:29):** Oh good.

**Donald Fraser (1:40:30):** This is a price list that comes from [unclear: likely “Merivale Plastic Surgery”]. Under. Abdominoplasty abdominoplasty. It would be two contracts, one for simple, one for complex breast reduction. Simple, complex, right?

**Greg Smith (1:40:47):** Yep. Yeah.

**Donald Fraser (1:40:49):** Down here, you know there if you searched up the procedure. mastopexy mastopexy.

**Greg Smith (1:40:57):** mastopexy.

**Donald Fraser (1:40:58):** Yeah, nice. If you looked up the procedure from the master procedure list mastopexy, you would see a contract for this fixed fee. For this fixed fee. For this one and this one. All of these, like this one box here combined mano mastopexy, breast reduction, and abdominoplasty. Simple that there is a contract and the text of the contract describes multiple things being done in the room. But it's paid.

**Greg Smith (1:41:29):** Yep, correct.

**Donald Fraser (1:41:29):** It's paid for as a single contract and so as far as our system is concerned, it would be one main procedure which.

**Greg Smith (1:41:32):** It is.

**Donald Fraser (1:41:38):** Pick your poison. It's breast reduction. It's a abdominoplasty. It's whatever it is, but the contract itself would define or record what's actually been done in the room and how it's getting paid for. So all all that the requirement is describing is just what I said to you, which is that's how in this complex world of the health system, when combination contracts exist.

**Greg Smith (1:41:59):** The.

**Donald Fraser (1:42:10):** There is an alternative version of a solution to solve this, which might be trying to have some system where you take all the individual puzzle pieces of different procedures and piece them together, and then have the system automatically. Give you. Then you combined price but that. Assumes a lot of things that are really nice and clean, but the health system isn't nice and clean. We already determined that because 10,000 procedures, 40 RVG codes, you know we can't make something that's always so neat and tidy. But we do need a solution to allow everybody involved to understand that the system is doing the right thing and so this is just saying that in the world where there are combined contracts. The year will be the way to find those is what I've just described.

**Greg Smith (1:43:05):** It's the little P sentence after the first paragraph that. Pondering about?

**Donald Fraser (1:43:12):** You mean this part here that we haven't talked about yet?

**Greg Smith (1:43:13):** Yeah.

**Donald Fraser (1:43:14):** Yep, OK.

**Greg Smith (1:43:15):** I get that so I get that.

**Donald Fraser (1:43:15):** So yeah.

**Greg Smith (1:43:20):** I mean, it's easy at that high level, right? You've got an. You've got a contract line that says facelift plus one. And that's 3900 dollars. Piece of cake, right. And you can. You can just pick. the the description will be coming from the. Booking anyway. So all you're trying to do is associate. That contract with that procedure and you're done. The complete the complex and and it's really simple.

**Donald Fraser (1:43:52):** Yeah.

**Greg Smith (1:43:53):** It's nothing complicated about it at all. Something complicated is happening under the covers, but we don't. It's out of scope because. It's just the fact that they're doing 2 procedures at the same time. It's sort of irrelevant because we're just doing a fixed price contract and. But the. Issue is. If the billable party then wants those split. That construct doesn't support splitting them.


## Splitting combination-contract charges and generic invoice lines

**Donald Fraser (1:44:24):** Well, this is where this next part comes in, right? So yeah, and I thought we did talk about this last week. So the way this is handled, so the scenario that Vanessa gave was that. Accommodation procedure has been. Selected and it's build to the patient, but then after the fact. Maybe even after the patient is paid for it. But let's just assume before that right after the procedure but before it's been paid for. It turns out that insurance is going to cover it. And winner is the patient pain. They don't care that they just see a single line item of a combined fixed price, but when it's Southern Cross who's going to submit it to insurance on their behalf? They require all the three individual line items priced separately. And So what? I believe we've described the way to to resolve that.

**Greg Smith (1:45:18):** Yes.

**Donald Fraser (1:45:22):** Is that a credit note would be raised for the original invoice. And then attached to that same procedure, additional invoices would be raised that just have free text boxes that can allow them to define a description, maybe a quantity. I don't really sure, but certainly a price. And then those invoices are sent. To whoever needs them. And then when you look at that procedure and you want traceability on everything that's happened, you would see all of those events in the list. And so you'd see the original thing got credited and the system created the general the define split out invoices to the other parties and in those particular scenarios I asked Vanessa at the point when you would split it out.

**Greg Smith (1:45:52):** OK.

**Donald Fraser (1:46:05):** Would you use the previously uncombined? Fixed prices and she said no. We would just figure out it the right way to split it. You know, based on some conversations or knowledge that they had, which is why it needs to be just a free form way to resolve their problem.

**Greg Smith (1:46:18):** Cool. Yeah, I'm with you.

**Donald Fraser (1:46:23):** OK. So this keeps the master procedure list.

**Greg Smith (1:46:25):** What? What's the? Excuse me, Donald. What's the? Chris. There's a good chance that this would get caught before it was invoiced, so you wouldn't have to raise the credit. So at that point.

**Donald Fraser (1:46:39):** Mm-hmm. Mm-hmm.

**Greg Smith (1:46:44):** You basically you want to be able to add the generic invoice lines into the booking. And you're actually what you actually want to do is override. The fixed fixed price and split it right.

**Donald Fraser (1:46:56):** Yeah. Yeah, yeah, you're totally right. Yep, and that scenario.

**Greg Smith (1:47:02):** So.

**Donald Fraser (1:47:04):** Maybe we need.

**Greg Smith (1:47:04):** It sort of contravenes contravenes. Air cannot change price law. But that's fine. Maybe we should just leave things open and they can adjust the price of the first procedure and add one or two more whatever is required.

**Donald Fraser (1:47:11):** Yeah. Yeah, that's kind of an interesting concept, I think. Maybe you could display a pending invoice. And then you could cancel that pending invoice and create your own freeform invoices after the fact. Something like that maybe?

**Greg Smith (1:47:35):** Yeah, well. It's probably a routine thing that on these on these. Chart sort of jobs.

**Donald Fraser (1:47:47):** Yeah.

**Greg Smith (1:47:49):** If if it's paid for by an insurer, it may be a requirement that's constant. We could check that with Vanessa today. I suspect that there's an element of predictability about whether this needs to be done or not, and we could preamp that predictability.

**Donald Fraser (1:48:03):** Yeah. Well, from our transcripts I'll ask. You know Claude can pick up the kind of the scenario we've just described, but I think in essence you and I are aligned that you know the combination part of this. Is understood and the proposed way of handling that is accepted by us at the very least, and the additional invoices and stuff like that after the fact can be we can tackle that when we get there.

**Greg Smith (1:48:29):** Yeah. It's just a generic invoice, yeah. Yeah. And just yeah, that's fine.

**Donald Fraser (1:48:36):** OK.

**Greg Smith (1:48:37):** That's fine.


## Feature 4.3 — Selecting a governing contract for a procedure

**Donald Fraser (1:48:39):** Okie dokie. Let's close that out. OK. Now we're moving up to the 4th feature, which is. Feature three so 4.3. Contract selection on a procedure. Every procedure must have exactly 1 governing contract before its booking can be treated as complete admins and anaesthetist. Pick the procedure, then choose the contract from those set against the procedure narrowed by the hospital's list, which is always known. Again, that particular line the. I think. Is a bit of a detailed app. May have changed since this was originally written because we had some concepts here around these different types of third party contracts that might exist. And again, I think we can kind of probably ignore that for now. And assume it would be rewritten once. Once we get your document and my document.

**Greg Smith (1:49:34):** Just, yeah. It'll just be written as budget holders and then it's still valid.

**Donald Fraser (1:49:40):** Yep, the patient's insurer or funding source is not a filter. Neither the patient nor the booking holds it. Some of that saying that we don't know which insurance the patient might ultimately have in our system maybe doesn't need to hold that. Funding source. This is interesting. I mean, once we know what data the system does have, we can figure out what filters might need to be handy after the fact. I'm not really sure why it's specifically or how it's specifically pulled out this this particular area. But it might be right because the procedures contract says who's pays.

**Greg Smith (1:50:21):** Uh. Yeah. Yeah, no. And the booking does hold the funding source. That's where it's meant to be defined. It's part of our problem here.

**Donald Fraser (1:50:32):** Yeah. OK. Well, I'll go ahead and delete that line out of here for now. And again, I'll probably be revised and further updates.

**Greg Smith (1:50:41):** Yeah.

**Donald Fraser (1:50:49):** Is nothing more. We're nothing more specific. Applies the procedure defaults to the RVG default. Hospital contract for the lists hospital. So there is never a case where procedure is left without a contract. So again, I think the idea that there was a hospital specific RVGs is something that we talked about a while ago, but now we think it's really not really doesn't really exist. It would just be the no contract contract.

**Greg Smith (1:51:15):** No, no, it doesn't exist.

**Donald Fraser (1:51:18):** Yeah. OK. So let's. Nothing more setting applies. Procedure defaults to the default. It's going to delete hospital from there.

**Greg Smith (1:51:29):** Yep, and we're good.

**Donald Fraser (1:51:32):** Tracked. So it's never a case when actually just left. Great. OK. So that's just the feature that is kind of trying to incorporate everything below it. So let's read on the actual stories here, 4 point 3.1. Exactly 1 contract per procedure. The scheduling engine requires every procedure to reference exactly 1 contract before its booking can be marked complete. This guarantees each procedure always has pricing rules and an invoice recipient already attached, so nothing is left unresolved when billing runs.

**Greg Smith (1:52:09):** That's true. You're poorly.

**Donald Fraser (1:52:10):** OK.

**Greg Smith (1:52:11):** I won't worry about when and how that's true.


## Contract filtering and what users should see

**Donald Fraser (1:52:14):** OK. Admins, an anaesthetist, picking a contract for a procedure only. See the contracts relevant to it. Those. Set against the procedure picked under the Master procedure list. A combination contract sits under each of its parent procedures, narrowed by the list hospital, possibly surgeon raising in passing and not settled. Don't know what that raised, raised and not settled. Contracts are showing in groups.

**Greg Smith (1:52:44):** Umm. I think. Wilted contract list. That the terminology here is pre our discussion where it's using contracts to describe both contract and contract line, but and therefore it doesn't really have the idea of a contract holder to work with yet.

**Donald Fraser (1:52:56):** Yeah.

**Greg Smith (1:53:11):** So it'll this will get reworked I think.

**Donald Fraser (1:53:11):** Yeah. Yeah.

**Greg Smith (1:53:17):** Umm. There's a entry again. The idea that a combination procedure can be included under multiple. Procedure. Types. Is that what? It's a bit problematic, but I think we should just leave that and see how it looks when it a bit further down the road.

**Donald Fraser (1:53:40):** OK. So contracts are shown in groups. Again, I picture this would all be within some sort of drop down, but the particular design implementation can be finessed in the future, but RVG contracts. Default hospital RV GS is something that doesn't really exist anymore. But essentially what this is trying to describe is something similar to this diagram here, right? That there are different types of contracts that will exist under a procedure.

**Greg Smith (1:54:14):** Sorry, Cathy. Different contracts under procedure.

**Donald Fraser (1:54:22):** So this is we're looking at facelift here and everything, everything that is relevant to that, you would be able to see and specifically you know you wouldn't see all the anaesthetists first party contracts, just the anaesthetists that's attached to it in that example.

**Greg Smith (1:54:22):** Yes, absolutely. Absolutely yes, absolutely. Yeah, I think. My mental model of this inverts this in that. I think that, you know, back to Ben's discussion about who is the billable party. I think you can't start usefully. Start. You'll never you can. You can start your navigation two ways. You can just traverse the raw RVG tree that we were looking at. Because you're doing an RVG procedure or you need to know who the contract holder is and that provides you. Once you know that, that provides you with the natural filters of what contracts are available, right?

**Donald Fraser (1:55:16):** That's right. Yeah.

**Greg Smith (1:55:18):** But but this is written in advance of perhaps understanding it.

**Donald Fraser (1:55:23):** That's right. And so I won't rewrite it too much because I suspect it will be updated based on transcripts and new documents.

**Greg Smith (1:55:26):** No.

**Donald Fraser (1:55:30):** But the essence of what it's saying is true, which is that there will be, you know, you wouldn't see every contract that exists in the world.

**Greg Smith (1:55:30):** Yeah.

**Donald Fraser (1:55:38):** You would see the ones that are most appropriate based on your previously defined procedures.

**Greg Smith (1:55:39):** Great. ABS. Absolutely.

**Donald Fraser (1:55:44):** Umm. This keeps the picker short and relevant rather than showing every contract AA holds.

**Greg Smith (1:55:51):** So just. Just a note on this. Bing. Emphasised last night that. Most of the contracts are still RV G so for instance Southern Cross. Have a number of different contracts that they hold.

**Donald Fraser (1:56:11):** Mm-hmm.

**Greg Smith (1:56:11):** But those are almost like identifiers for their billing. And they are actually, they are just still RVG contracts and there's nothing underneath them, right?

**Donald Fraser (1:56:15):** That's right.

**Greg Smith (1:56:22):** They just fall through.

**Donald Fraser (1:56:22):** That's right.

**Greg Smith (1:56:23):** That is a contract, but it falls through to the default values.

**Donald Fraser (1:56:25):** It would be. That's exactly right. So it would be an RVG contract and it would probably be grouped by Southern Cross in the scenario, but it wouldn't be a fixed price, it would be the RVG price.

**Greg Smith (1:56:35):** Yeah.

**Donald Fraser (1:56:39):** The difference is that it's invoiced to. In this case, it says the insurer. In this case it says hospital again, they could set whoever the default billable party is for it. Yep, exactly.

**Greg Smith (1:56:45):** Correct. That's right. Exactly. So there are a lot of hospital RVG contracts.

**Donald Fraser (1:56:53):** Wonderful. That's fine. The system can support that. Uh. I think I need to go on about 20 minutes actually.

**Greg Smith (1:57:06):** Vehicle.

**Donald Fraser (1:57:07):** OK. We're no. Oh, sorry. Default hospital contract arrived from location. This I feel like should just be rolled up into the previous one. But this is where we kind of said there's not really anyway where there's no contract applies to a procedure, the scheduling engine defaults it to the RVG default contract. For the hospitals, this hospital.

**Greg Smith (1:57:30):** Will it just take? A hospital and it's sort of correct.

**Donald Fraser (1:57:36):** Yeah. The Contra this contract is derived automatically from the list's location, so a procedure is never left without pricing rules to fall back on. Yeah, so.

**Greg Smith (1:57:46):** Yeah. And we've already talked about the fact that the RVG contract will always be at the top of the list, right?

**Donald Fraser (1:57:52):** Yes, we're really kind of pretty clearly defined in a few places that's mentioned here. And it's mentioned somewhere else over here that.

**Greg Smith (1:58:02):** Yeah. So if we just take the word hospital out of that, then it's good. It's still relevant. It's still pretty good.

**Donald Fraser (1:58:08):** Yeah, I would say my current understanding is that the default no contract contract. Will always default to delaying the patient with these contracts. Default to billing the hospital and so. Or whoever else the billable party may be so.

**Greg Smith (1:58:30):** Yeah, I'd like to have a think about that, because you're right, you're absolutely right. Just in terms of. How that works, I'll come back to you on that. We're good.

**Donald Fraser (1:58:40):** OK. Well, we'll just move on from this one, but we think it's. Mostly the concept of it is understood and agreed. Admin sets contracts at booking setup. Admins apply the contract to each procedure at booking setup. When the booking is created or matched ahead of the day of the procedure. So you and I talked about that earlier that matching screen or that flow might look like this is different from the RFP's original design where billing route and its contract were only resolved by the engine once the list was authored, setting the contract at booking setup instead means that the office staff can see and check before the procedure happens.

**Greg Smith (1:59:04):** Yep. Absolutely.

**Donald Fraser (1:59:22):** OK.

**Greg Smith (1:59:24):** In fact, we've made it mandatory, right?

**Donald Fraser (1:59:26):** Yeah.

**Greg Smith (1:59:26):** It's going to sit on that admin. It's going to sit on that admin list until they sort it out.

**Donald Fraser (1:59:31):** When a list becomes authorised, the billing engine snapshots the version of each procedure's selected contract into the procedure. Onto that procedure. Lock it in. This means that later edits to the contract can never change. An invoice that has already been raised from it. Each procedure keeps exactly what applied at the moment it was authorised.

**Greg Smith (1:59:56):** Yep. Good.


## Future hospital integration and unmatched contract-schedule cases

**Donald Fraser (2:00:00):** Hospital data sets the contract in the future. The hospital defines the contract when it's inbound data. The daily sheet later and integration says which contract. A procedure is under. The system sets the contract on the procedure and the office store reviews it at the submitted review. Hospitals know mildly outposts. Pause for comment.

**Greg Smith (2:00:29):** Yeah, well, good catch. I think what I'd like to see that process be is that if a hospital update changes data in a booking, it should go onto an admin queue.

**Donald Fraser (2:00:46):** Yeah, I think what we both missed or I missed here, I'll speak to myself. This is the 6th. Use a story in this list, but it's actually jumped to the end, which is a future phase of work.

**Greg Smith (2:00:56):** Yeah.

**Donald Fraser (2:00:58):** So I think we actually just skip past this.

**Greg Smith (2:00:59):** Yeah.

**Donald Fraser (2:01:00):** This is like an integration detail for the future.

**Greg Smith (2:01:01):** Yeah. OK.

**Donald Fraser (2:01:04):** OK. Procedure not on the contracts schedule. We are a hospital. Sheet says that a procedure is under contract but the procedure. Is not on. That contracts schedule. I'll keep reading. An admin can still set the contract on the procedure and mark it to confirm with the hospital. This is the quote 13th operation in the new arrangement. The hospital has introduced that AA does not have a file on yet. I don't understand what this is saying.

**Greg Smith (2:01:39):** No, I think we that should be saying it just defaults to RVG because it has to be checked by an admin anyway.

**Donald Fraser (2:01:40):** So. Yeah.

**Greg Smith (2:01:46):** It's an error condition. Should just stop.

**Donald Fraser (2:01:50):** Yeah, I mean, we're saying that when the MVP is developed, there's gonna be kind of no. Probably no contract selection. Sort of. Smarts happening. Umm, you know, they would read what the hospital said they would find or create the matching contract in our system and then it's accepted and put onto a list or a book, you know, a list. Be a draft or not.

**Greg Smith (2:02:04):** The. Yep, Yep. Yeah.

**Donald Fraser (2:02:16):** So.

**Greg Smith (2:02:18):** Definitely a future. It's I don't agree with it, but I don't think we need to sort it out today. We just could kick it down the road. Make it future.


## Feature 4.4 — Default contracts and RVG as the baseline

**Donald Fraser (2:02:24):** Yeah. OK. Cool. Let's do that, then. OK. And then the last few ones here. This is a feature. Feature. 4.4. Default contracts for hospitals, insurers and procedures every hospital. And every direct billing insurer needs a default contract already in place. I don't agree with this, but let's get rid of it. This closes off any pathway procedure done at a hospital or billed to an insurer has no contract price against it. So we this seems like it's got some concept of every single group having a default, but we've said every procedure has a default which is the RVG and everything else on top of that is a contract that needs to be selected.

**Greg Smith (2:03:16):** Yeah. So I think it's got this upside down. I agree with you, the RVG is the default starting place for everything.

**Donald Fraser (2:03:21):** Yep.

**Greg Smith (2:03:22):** And then you change it.

**Donald Fraser (2:03:23):** OK, so I will not update this and get the transcriptor updated. I'll just keep reading though. Every procedure on the master procedure list also has one default RVG contract which holds the base units plus any further named RVG stock contracts.

**Greg Smith (2:03:28):** Yeah.

**Donald Fraser (2:03:38):** Yeah. OK. So I think we, you and I net words and in the documents we will pass this. Will correct this.

**Greg Smith (2:03:47):** I agree.

**Donald Fraser (2:03:48):** OK. So this is just the feature. These next ones I think will also be wrong, but let's read through them. When Admin creates a hospital or a direct billing creates a hospital or direct billing insurer, the system creates its default contract automatically. No, this is not a thing. This basically just needs to be deleted. I think I might even just archive this so there's never.

**Greg Smith (2:04:09):** Well, it's an interesting year. It's an interesting idea because that's where I thought we were going to have to be. But there's got to be a better way to do it. So I agree. I think we should not do this.

**Donald Fraser (2:04:19):** OK. I'll just read the next one and then I might go back and archive all three of these default RVG contract for every procedure, every procedure on the master procedure list has one default RVG contract based on RVG guide. Yes and flagged default.

**Greg Smith (2:04:34):** Uh. Search. Oh. Sort of. What is the default of easy contract?

**Donald Fraser (2:04:48):** That's that's this one right here, right. The no contract contract.

**Greg Smith (2:04:52):** Yeah. OK. See you all right. That the procedure doesn't have the contract. The booking has the contract, right? It's.

**Donald Fraser (2:05:08):** So in this image here a procedure has exactly 1 contract and this image here describes searching down a procedure list and seeing the and seeing the contracts that are attached to that and so everything.

**Greg Smith (2:05:15):** OK. OK, sorry. Can you go back and reread that for me? I must have misread it.

**Donald Fraser (2:05:25):** Yeah, yeah.

**Greg Smith (2:05:26):** I've got an upside down somewhere.

**Donald Fraser (2:05:27):** Every procedure on the master procedure list has one RVG has one default RVG contract based on the RVG guide, right?

**Greg Smith (2:05:32):** Ah.


## Procedure/RVG search paths and contract import/seeding

**Donald Fraser (2:05:37):** And so you know what this doesn't say? Is that at the beginning of this transcript and last night we talked about being able to search either by the procedure list or the RVG list.

**Greg Smith (2:05:42):** Yeah. Yeah.

**Donald Fraser (2:05:46):** So if we just kind of fill that in here what it's saying? Is that whatever path you go down when you get to the point where you're selecting a contract, there will always be at least one contract which is the. No, no-contract RVG.

**Greg Smith (2:06:02):** Yeah, yeah.

**Donald Fraser (2:06:02):** Yeah.

**Greg Smith (2:06:03):** Like I think I can live with the first paragraph. Yeah, that's alright.

**Donald Fraser (2:06:07):** AA can add any number of further custom RVG style contracts to a procedure, each with its own name base units. For example RVG custom facelift complex with ten base units and the New Zealand Society of Anaesthetists' RVG H4 complex procedures is 10 to 12 units.

**Greg Smith (2:06:17):** True.

**Donald Fraser (2:06:27):** RVG style contracts are always offered in the contract picker. The default RVG contracts are imported from spreadsheets at the start. And then maintained by hand. So a rare change to an RVG unit is applied by hand. Custom RVG style contracts are created by AA as needed.

**Greg Smith (2:06:51):** I don't think we need to do that, do you?

**Donald Fraser (2:06:53):** So yeah this.

**Greg Smith (2:06:53):** This is one area where I'd agree with you. They can just type it in by hand. It's such a rare. Event.

**Donald Fraser (2:07:01):** Yeah, yeah. So this is again. I'll have the transcripts of these. It's OK that we may have changed our mind, but when you and I previously talked about this, you asked how how we gonna get contracts in the system and I described how traditionally which Stratos makes systems for people. We don't often build a large infrastructure for importing. Spreadsheets into the system and that sort of stuff. And So what? What this is saying is that.

**Greg Smith (2:07:26):** Oh, what's the contract? RVG contracts.

**Donald Fraser (2:07:31):** Umm. You know, to make it easier when we seed the system with data when it has zero contracts. Like absolutely. Let's go ahead and give Vanessa some sort of spreadsheet and get her to fill all of it in that she wants to, and then we can see to the system with that as base data. And that would ingesting or importing a spreadsheet would be something done kind of directly against the database or other such sort of process. And then after that any changes are.

**Greg Smith (2:07:57):** Just stop going to stop you for a minute here.

**Donald Fraser (2:07:59):** Yeah.

**Greg Smith (2:07:59):** I think there's a difference here between. I don't think. If there's there isn't an RVG default contract except for a header in the system that says. I'm an RVG default contract. That's all there is. There is an RVG guide. We had that discussion about the guide right? But this is talking about default RVG contracts. But there aren't any, are there? This one.

**Donald Fraser (2:08:28):** So.

**Greg Smith (2:08:28):** This one line.

**Donald Fraser (2:08:31):** So in our system. We have talked about matching. Some intermediate list of procedures. To an RVG. This is something that.

**Greg Smith (2:08:46):** Yeah.

**Donald Fraser (2:08:47):** Vanessa says she already does, right? She could know looking at a contract that, you know, a description of a procedure that comes in, which is the most appropriate RVG code to apply to it, and therefore which base units that will receive. So that is something that, you know, the AA admin staff already have knowledge of. And So what this is saying is under every single. Procedure in the system. The system will generate and always have a no contract contract which inherits any base units or modifiers from that parent, and you've had that wonderful diagram that showed the relationship and how that works. And so this is just saying exactly the same thing.

**Greg Smith (2:09:42):** Just let me read it carefully. Yeah. Yeah, that's right. Yeah, I did that. Country. For every procedure. Yeah, it's just the language is a bit meshed up. I think I miss. Relationship, right? The default RVG relationship for every procedure. It's not a contract. Because we hold all these relationships and we derive the value. At the time we look it up. So the contract sort of going the other way. So if you set up all these standard procedures, which we're going to do. They have a relationship, a one to one relationship with the RVG, and that's where they derive their value from. Do you agree with that?

**Donald Fraser (2:10:53):** Yeah. Yep. We've talked about all of that. Maybe we are running?

**Greg Smith (2:10:55):** OK. So that's that's not, that's not a default RVG contract. It's a default RVG relationship.

**Donald Fraser (2:11:04):** Yeah, I think maybe we might be getting in trouble here is. We use. You know, outside of the system. These different health organisations have a concept of what a contract is and then within our system we talk about what a contract is. Umm. I. Believe what we've already talked about and it sounds really good to me. And maybe maybe what we're talking about here maybe is semantics. I'm not sure is that. In the worst case scenario. When you select A procedure and then you click on that drop down to select how it's gonna be paid, there's always going to be at least one option and that one option is using the RVG guide to determine.

**Greg Smith (2:11:50):** Yes.

**Donald Fraser (2:11:51):** The base units and modifiers and then when it gets in front of an anaesthetist, they fill in their time and they are invoiced based on the base units multiplied by their rate. That's what I believe this is saying. There's always going to be something you pick. You can always system will make sure it's not even like a I would. In my view, it's not even like a hand authored procedure that. AA staff edit. It's just a pre system defined one that's there and they want to make different style of RVG style contracts. On top of that or beside that they can for the particular scenarios here where something is complex and it has a different you know. Thing, but the system will always generate at least one contract that can be selected.

**Greg Smith (2:12:43):** It will always generate one contract that can be selected. I think the language is very mingled to us.

**Donald Fraser (2:12:52):** OK, well.

**Greg Smith (2:12:53):** That's my view.

**Donald Fraser (2:12:53):** We can.

**Greg Smith (2:12:54):** We'll see if it fixes it up.

**Donald Fraser (2:12:54):** Inevitably. Yeah, we will. You and I will have to go through and look at all of this again after we've got the those documents in.

**Greg Smith (2:13:00):** Yeah.


## Wrap-up

**Donald Fraser (2:13:06):** So. This next line here just talks about the one-time import at the beginning of the project seeding the database and whatnot. And then the next one here, this is so that base units living in contracts with sizes. So that base units live in contracts. Every procedure always has a standard price. To start from OK. Cool.

**Greg Smith (2:13:31):** Yeah, that's fine.

**Donald Fraser (2:13:31):** OK. I'm going to leave this as verified now, but I think we mostly agree with this. I'm going to go back to this one. And retire it. Use retire item. I think I might move this default contract procedure story we just read. Over to the contract catalogue, because that's really where I think it lives and I think I'll archive this feature that was previously here because we don't have default contracts for hospitals, insurers or procedures.

**Greg Smith (2:13:57):** Yeah. Yep. Yep.

**Donald Fraser (2:14:07):** Cool. OK. I've got 3 minutes until I need to go to my next thing. So this seems like a good place to stop, I reckon.

**Greg Smith (2:14:16):** Yep, cool.

**Donald Fraser (2:14:17):** I'm going to go ahead and stop the recording.

## Reconciliation notes

- Speaker attribution and timestamps follow the Microsoft Word transcript, which consistently identified Donald Fraser and Greg Smith.
- The second transcript was aligned against the Word transcript across the recording. It substantially agreed with the Word source and supplied one meaningful phrase that the Word transcript had dropped in the discussion about the audience and purpose of the requirements documents.
- Repeated ASR substitutions were normalised where the intended project term was clear: **RVG**, **AA**, **admin/admins**, **anaesthetist(s)**, **billable party**, **GST**, **filter(s)**, and **Christchurch Eye Surgery**.
- A small number of words or names remain uncertain. These are marked inline, including the plastic-surgery provider name and one price in the combination-contract example.