# AA Meeting with Greg — 28 October 2026 (Part B) — Reconciled Transcript

> Reconciled from three automatic transcriptions of “AA Meeting with Greg 28th Oct B.mp3”. The version containing Donald, Greg and Ben speaker labels was used as the primary attribution source; independent transcripts were used to check wording. This is a lightly cleaned spoken transcript, not a meeting summary. Genuine uncertainties are marked `[unclear]`. The conversation is retained in chronological order, including proposals later questioned or revised.

**Speakers:** Donald, Greg; Ben joins by phone partway through the meeting.

## Returning to the requirements review

**Donald:** Yes, it's hard sometimes.

**Greg:** All right, where do we get to on this?

**Donald:** I think we finished it.

**Greg:** We're good.

## 6.3.2–6.3.4 — Tracking outstanding prepayments

**Donald:** So the next one here, we're reading 6.3.2, track prepayment status and alert when outstanding. For each upcoming booking that needs prepayment, the admin can see whether it is unpaid, part-paid, or paid in full. As the procedure date gets closer, the admin is alerted if a prepayment is still outstanding. This gives the admin a chance to follow up, and then just decide to cancel the booking instead. Seems like that one we've talked about.

**Greg:** That's all fine.

**Donald:** Cool. Recheck after each receipt. After each prepayment receipt is reconciled, the billing/invoice engine rechecks whether the booking's prepayment requirement is still outstanding. This is probably a bit technical. Like, the system should probably do this. [unclear]

**Greg:** I can see an overnight run being set up here, something on a cron job that just, you know, runs through and makes sure everything's tickety-boo. Do a daily rec and make sure it's right.

## 6.3.5 — Contract and payer changes before a procedure

**Donald:** Yeah. But in essence, yes, this is something the system probably should do. How it does it is, can be... Yeah. Okay, 6.3.5, recheck when booking changes. Whenever a booking's procedures, contract, or payer change before the procedure takes place, the billing/invoice engine rechecks the prepayment requirement. For example, if the procedure contract changes to one not flagged as prepayment, the requirement is cleared.

**Greg:** That's not that simple.

**Donald:** I mean, we've not really talked at all, I don't think, about the idea of a prepayment being received and then the contract changing.

**Greg:** I'd rather see that deleted and rebooked, really. That's just too bloody hard. When a booking's procedures, contract or payer change... The anaesthetist could change, right? The payer change.

**Donald:** Yeah, so I thought that where this is going to go, and it may still go there, was everything we know about. There's more in here about prepayment, but no, this is probably the place for it.

**Greg:** I think the last sentence is a problem.

**Donald:** This one here.

**Greg:** No, the last sentence.

**Donald:** We read. Yeah. Okay, let's come back to that. A move is not one of these changes. The system has no logic to detect a list or booking moving to another anaesthetist, and a move re-triggers no prepayment or invoice recalculation. The money sits in the holding account and nothing in the ledger changes, and then your anaesthetist claims no more than the prepaid [amount].

**Greg:** That should say the prepaid amount, right? That goes back to what Ben was saying the other day, the deals are deals.

**Donald:** Yeah.

**Greg:** Does that say no more than the prepaid amount?

**Donald:** It was saying no more of the prepaid amount. It was an automatic correction.

**Greg:** I'm not sure about more or less. I mean a prepayment's a prepayment.

**Donald:** I think that's, I think that's right as far as I understand. That's separate, that's the whole separate thing, right? So in terms of automatic logic, when a procedure changes from one anaesthetist to another, even in a situation where both of them may have different prices, especially in situations where both of them have different prices for a given prepaid procedure, there's no automatic trigger or resolution to adjust the amount.

**Greg:** No, so why say 'no more'? Why not just say 'claims the prepaid amount'? Because that's what it means.

**Donald:** Okay.

**Greg:** Okay, cool. Simpler logic for them too.

**Donald:** This is so the booking that no longer needs... Okay, so this is so a booking that no longer needs prepayment, for example because its contract changed, that has cleared automatically rather than this stuff. Okay, so this line here and this line here are raising questions that we've not engaged with, and make assumptions on what the answers are.

**Greg:** Yes it does.

**Donald:** So for the sake of a recording, I'll just read them out again. For example, if a procedures contract changes to one not flagged as prepaid, that requirement is cleared. I don't know what that means. And then this is so a booking that no longer needs a prepayment, for example, because it's contract changed. is cleared automatically. So in terms of what it's rechecking here, it's talking about rechecking if more needs to be paid. And in some sense it's right in saying that we no longer need to check whether or not prepayment is needed because we've moved to a contract that doesn't need prepayment. But it leaves out the hole, which is what the hell are you going to do for money that's already been collected, if it's been collected. So I think this needs to be made more clear. Or actually probably just need a whole another separate story to to talk about this exact condition, which is that before a procedure takes place, if prepayment has been received and you change the contract, what do you do with that money? I like what you've said, which is that in that case, complete credit and refund, and then they get a separate invoice for the procedure when it's done, invoice after it's done. And then separately, also there needs to be some sort of logic to say if a prepayment goes out to somebody, but a prepayment hasn't been received, and then the contract changes, do you void that invoice or do you give them a credit? You wouldn't give them a credit if, I don't know the right way to officially accountingly address that.

**Greg:** Theoretically you could issue them a credit, but it just creates more work, I think, than just doing a refund and just starting again. You can raise it with Ben. And I can't think of a circumstance where, oh yes, well I could see that a prepaid booking might be cancelled.

**Donald:** Yes.

**Greg:** And they could die, right? There will be times when a booking is cancelled and refunded. So we'll need to have a cancel refund process. But I can't imagine, and I've never come across a discussion where a prepayment was converted to an insurance job.

**Donald:** Sure, but it's a condition that will exist in the system. Even if it doesn't exist in real life, the system has to decide what it does in that condition.

**Greg:** Well, we might say that you can't change a prepaid book. Oh, can you change? You've got the booking. The booking really belongs to the surgeon. You can't just delete it.

**Donald:** So I think what you said makes sense to me, that if it's already been paid, you refund, and then just The rest of the happy path continues. In a situation, but the thing I don't know is that in a situation where a prepayment was sent out, but a prepayment hasn't been received, right? So the patient gets the invoice, but they haven't paid it yet. And then we change it. What's the correct thing you do to handle that?

**Greg:** Yeah, that's a good question.

**Donald:** Is it avoiding of the invoice? Or is it a credit note raised such that the balance is zeroed? And then what happens if they try to pay it?

**Greg:** If you've sent them an invoice, you can't actually stop them sending you money.

**Donald:** Is it an e-mail notice to say, please don't pay it if you have? We will resolve it with a credit.

**Greg:** Or you go a step further and say, we have cancelled your booking and repayment will be made.

**Donald:** Even before they pay? Well, how about this? Claude, we know we need you to make a new requirement for this odd condition. Take our context from this conversation to write that up, but then also create a new question for Vanessa and Ben about how they expect these to be handled. We'll just go from that. So in terms of 6.3.5, we like everything in here except for those two lines. So I'm going to go and delete those, and it keeps the story a lot simpler. So whenever a booking's procedure, contract or payer changes before the procedure takes place, the billing engine rechecks the prepayment requirement. A move is not one of these changes. The system has no logic to [unclear]. I think the only thing I'd want Claude to update this with is to just be a little more explicit about the draft payer—the draft payable to the anaesthetist gets updated. Maybe that's already been accounted for in other stories somewhere, but yeah, that's something I'm thinking about here.

**Greg:** Well, we haven't talked about credits. We've talked about banking that always. So this is... This is the billing.

## Prepayment letter templates

**Donald:** Okay, well, I'm gonna leave this as open and we can come back to it later. Prepayment letter templates. When an admin approves a generated prepayment invoice to send, they pick one of a small set of standard letter templates instead of writing each letter by hand. I actually probably imagine it should be one standard template for this action, but every template states the prepayment amount as the price payable for the procedure, the anaesthetist's own fixed price. The template may say if the procedure turns out very different from what was printed, the anaesthetist may raise a further invoice or credit. The letter is filled in from the booking, patient and procedure, and goes out with the prepayment invoices, because the office writes every prepayment letter by hand today. Is that true?

**Greg:** Yes, I believe so.

## 6.4 — Prepayment settlement and price flexibility

**Donald:** Okay. Claude maybe just tweaked this based on our conversation here to say that there's at least some sort of template that is related to the prepayment letter. It doesn't need to be many of them. And earlier on, I think in the previous transcript, we discussed whether or not these prepayment invoices to patients should list the anaesthetist on the job or not. Or just list AA. Moving on to feature 6.4, settlement after the procedure. After a prepaid procedure, Prepaid amount is the price by default and the BTM recorded on the day is only for reference. The system calculates nothing further and raises nothing automatically in either direction. That's true. This is quite a large feature when there's only one story underneath it, but let's keep going. No additional invoice if the work was more than expected, no credit refund if it was less, no threshold about how large the difference. Same holds for every fixed priced contract for a pre-paid procedure this is the build position until Ben answers whether a pre-paid price may change or whether part of it may be credited which we answered the other day with Ben but didn't write down in here.

**Greg:** Well we didn't quite because the question that Ben was asked was If a prepaid procedure is transferred to another anaesthetist, can that anaesthetist change the price and Ben said no, a deal's a deal. But that's not quite the same as sending out a prepayment letter with a caveat of it that says this is an estimate which may be changed. So there's a bit of a conflict to resolve there.

**Donald:** I agree with what you're saying. We've made some jumps there, but your statement applies to the previous story, not the one we're on.

**Greg:** What is that?

**Donald:** Well, this is the prepayment letter that talks about the estimate.

**Greg:** It doesn't use the word estimate.

**Donald:** It may say if the procedure is different, the anaesthetist may raise a credit or invoice. So...

**Greg:** That's fine. But what Ben was saying is, we've got two scenarios that don't fit very well together, right? One says it's an estimate, you can change it. And the other scenario, when it transfers, anaesthetist says you can't change it.

**Donald:** Who says it's an estimate and you can change it?

**Greg:** Sure.

**Donald:** I understand the conflict, but it's just, this is basically some butt covering Like, hey, this is how much we think the prepayment is needed. We're telling you in most scenarios it's going to be 100%. There may be more or less. It's just like when a builder gives you.

**Greg:** Well, I think the issue from Ben's perspective is that it's firmer than that, and that it would require a significant change in events for that to occur. So the threshold—it's not time and material—the threshold needs to be quite significant before [unclear].

**Donald:** But as far as our system is concerned, I don't think I need to stress about this right now. Whatever wording is going to be in that template, it's not going to come from me. It's going to be something that AA will write.

**Greg:** Yeah, but the consequences of this are that the amounts can be changed. The question we asked Ben perhaps was not quite comprehensive enough about perhaps we should generalize it and say in what circumstances could a prepaid amount be altered.

**Donald:** Well I think in the way our system has talked about handling it is that the prepaid amount stays the prepaid amount and a credit is raised additionally or an invoice is raised additionally if whatever reason is needed.

**Greg:** We're both talking about the same thing.

**Donald:** Yeah yeah yeah.

**Greg:** Yeah and that's what version 6 of the document says as well.

**Donald:** So where are we in conflict?

**Greg:** No, there's a conflict between two things Ben is saying. Because he's saying in one circumstance it's not changeable, which is when it gets transferred from one anaesthetist to another. Because the anaesthetist might have different rates, and the anaesthetist will go, well, I'll do it for that price. And Ben's saying that's not how this works. But on the other hand, they do have a get out of jail clause, which says And I think he's talking about a policy around in what circumstances it's used, rather than us worrying about how it's enforced.

**Donald:** So we can move on.

**Greg:** So we should say it's the situation we had before, which is: it is changeable, applies.

**Donald:** Technically.

**Greg:** It may not be policy, but technically it's changeable.

**Donald:** Yeah, I mean, okay, technically everything's changeable because the office can put any price they want. And as far as the system is concerned, if the anaesthetist moves, the system does not automatically try to claw back or credit any difference in what those prices would be.

**Greg:** It does not. Well, that's not what drives it. That's not the trigger. It can move, and the price moves, right? The fixed price moves.

**Donald:** I don't think so. That's not what I've been told.

**Greg:** Yeah, so if you've got a prepay invoice for two grand, and anaesthetist A is sick, and he gets anaesthetist B to do it, the price is two grand.

**Donald:** Yes. Yeah, yes, yes.

**Greg:** But there's another scenario that says the price is two grand. It took an hour longer. I'm going to charge more.

**Donald:** Yes, both of those are true.

**Greg:** Well, yes, so.

**Donald:** Again, but in terms of the rules that our system build and functions and that sort of stuff, I don't think, I think what you're saying, like, okay, it could be confusing or customers might be upset if they get an additional invoice that they're not expecting. I would say that is a problem to be solved in the wording of a template that somebody else would write.

**Greg:** Yes.

**Donald:** But if I was us moving through these requirements and saying what the system needs to do, I think we're fine.

**Greg:** Yeah, I think in summary I'm saying it is editable even if policy says it isn't. That's what I'm saying.

**Donald:** Okay.

**Greg:** So because there are these weird circumstances where... and that's just, that aligns with... And you could lock it down on the app, so it's not editable in the app. The admin can do it. That's one way of thinking about it.

## Admin price changes versus configurable price overrides

**Donald:** Well, as of now, we've said that only AA admin staff can do some sort of free text price change on any contract, regardless of the rules of the contract.

**Greg:** No, because we've got a flag on the contract that says editable.

**Donald:** That's different. That's different.

**Greg:** Or is it different?

**Donald:** Okay, let's... Admin price change. What's the right thing? 'Office can change any price.' Here we go.

**Greg:** Yeah, that's fine.

**Donald:** So we, our system, we've got contracts, contracts have a bunch of rules, custom rate, RVG, fixed price, price overrideable or not, all that sort of stuff, right? And so in a world where the price is overridable, AA admin staff and the anaesthetists themselves could apply any discounts or fixed price overrides they want to do in both applications or any applications. Outside of that, this story describes a situation where even if you've got a contract with Southern Cross and it says it's $2,000, But for whatever reason, the office need to actually change it to be $1,900. They can just do that.

**Greg:** Yeah, they can. Agreed.

**Donald:** Where are we out of alignment?

**Greg:** The scenario where the anaesthetist has their own price list. They're fixed prices. So they're fixed prices, but they're editable. So when he does his timesheet, he can change it.

**Donald:** I agree with that.

**Greg:** Right. So I have a... Fixed price for a facelift, $2,000. It's editable. I'm sick. Goes to a different anaesthetist. Ben is saying it shouldn't be edited. But maybe there are circumstances where it should be.

**Donald:** I see what you're saying. Yeah, so, okay, so just to repeat you what you're saying there. Ben's prepaid contract for a facelift is $2,000. And because it's his contract, he says it could be edited. Even though he knows by the nature of the simplicity of the system, the entire reason that contract exists in the system is to make it easy to bill it with a fixed price. For whatever reason, he's decided on the day I may decide I want to make it cheaper, or more expensive, because I don't like the look of the guy's face. That patient pays for that procedure in advance, and then Ben gets sick and somebody else takes it on. The rules that Ben has stated is that there is a culture, an agreement within AA that if somebody else takes on that prepaid procedure, the price that was prepaid is the price the patient is going to get. Unless there's some wild exception, which is handled by additional invoicing events or crediting events.

**Greg:** And actually, I'll just remember the context of the question you asked Ben was, Let's say the price has changed.

**Donald:** That's right.

**Greg:** Date wise. That's right. It doesn't matter.

**Donald:** That's right.

**Greg:** Yep. So the question is who can make the change in that scenario, right? Second, in this list, wildly different outcome, half the work, twice the work. It is: can they change it?

## Changed anaesthetist, unchanged contract and issued invoices

**Donald:** Does the system prevent them from editing it? Presumably in this, I guess there's a couple of paths to account for here. Because the prepayment doesn't go out automatically, it has a gate where the admin staff need to approve it, that's what we've said. The rules on this could change depending on what's happened. If the invoice has not gone through the gate and another anaesthetist has changed, the anaesthetist has changed and they have a different price, the system could force that prepayment to honor the new anaesthetist's new contract. Does the contract change or does anaesthetist just change?

**Greg:** Contract doesn't change, it's just who-.

**Donald:** It's the same, it's still Ben's contract, but with a different anaesthetist? Yeah. Okay.

**Greg:** My view is that we should separate policy from enforcement.

**Donald:** Okay.

**Greg:** And the system should be permissive, but the policies don't change it.

**Donald:** Sure. So, okay, in this scenario, if Ben's contract and moves to another anaesthetist, if it hasn't gone through the gate, presumably, assume.

**Greg:** It's been prepaid, otherwise it wouldn't be done.

**Donald:** I guess it depends on the timing of all these events.

**Greg:** If it wasn't prepaid, the only way it would get done is if they changed it to some sort of RVG, or whether the patient just pays it on the day.

**Donald:** So I'm still imagining that in this hypothetical scenario we're talking about here, we're still talking about a prepayment procedure. So.

**Greg:** Well, we're on prepayment, so we're talking about prepayments.

**Donald:** We are talking about prepayments.

**Greg:** Yeah, okay.

**Donald:** So what you've just raised is Let's say I need a facelift at short notice. It's Monday and I go to my surgeon and he says, sure, I can do it tomorrow. He submits it to AA. The surgeon submits it to AA. Ben is selected as an anaesthetist. So it's Ben's contract. The system would have automatically drafted, I guess, the prepayments, but before the admin staff have said send it out to the patient, Ben gets hit by a bus. And it's still Ben's contract and a new anaesthetist needs to be assigned. In this scenario, if Ben's prepayment contract allows price overrides, then the anaesthetist B, let's call him Nick, looks at his list and sees that Donald's getting a facelift and you can see what the prepaid price was on Nix and the price override fields are accessible because we've allowed price overrides and he decides to make it $2,100. In this scenario, very unlikely, before it goes through the approval gate, I would say that that pre-approved invoice would get updated and then once the admin team approve it, it goes out with Nick's price override. If it's after the invoice has gone out and been approved, then Ben gets hit by a bus and the surgeon, the procedure gets passed on to Nick. At that point, the patient, Donald, has already received the invoice at $2,000 and if Nick wants to override it, you're saying the system should allow him, sure, let's say it does, he's allowed to override it. Then what?

**Greg:** I should get another bill for $100.

**Donald:** Okay. I can see this going either way. Actually, I do basically think your general philosophy of the system being permissive is very freeing. and allow us to support a lot of wacky conditions that could appear.

**Greg:** We could end up tying ourselves in some really expensive knots, and I'm not sure it's worth it.

**Donald:** Yeah.

**Greg:** That's what the admins are for, really, to intervene. And remember that if they take the booking and they make it an anaesthetist prepayment, when they hit return, that's it, right?

**Donald:** When they hit approve, you mean?

**Greg:** Yeah, when they lodge the booking in the system.

**Donald:** Who does that, sorry.

**Greg:** The admin.

**Donald:** Yeah, yeah, yeah.

**Greg:** That's it. I mean, the pre-payment.

**Donald:** The wheels of motion.

**Greg:** Yeah, the pre-payment check may not be there. It might just go. Ben doesn't want them stopped and checked. He wants them just sent out.

**Donald:** Cool.

**Greg:** He's looking for automation.

**Donald:** Okay, so after all of that, I think I just heard you say maybe this is more pain than it's worth. Is that what you're saying?

**Greg:** Yeah, make it permissive. Let's not get hung up about the fine details.

**Donald:** But I would say the permissive part of it is that the system still needs some predictable rules of what it needs to follow.

**Greg:** Yes.

**Donald:** And so I would say the predictable rule is that if Nick wants to change the price after the prepayment has gone out or before, I would say the correct way to enforce that or to rectify that would be additional events, invoice events. as opposed to some sort of rules that try to catch it mid-flow or send an additional thing and recheck a thing. I agree.

**Greg:** And the answer is already built into the system because he fills in his timesheet when he's done the procedure and he just makes it 2,100. You're done.

**Donald:** Well, not quite. Filling in the timesheet on a prepayment-- oh, sorry. Filling out a timesheet on a fixed procedure is purely informational. We've already determined in the system.

**Greg:** When I say timesheet, I mean he's got the form and he changes the price.

**Donald:** That would be a price override.

**Greg:** Yes. So he fills in the timesheet with a price override and hits submit and you're done. The system will then generate an invoice for another $100.

**Donald:** Okay, well let's summarize that for the transcript. If fixed price contracts allow price overrides, or if fixed-price contracts get overridden by the admin staff, both of them essentially have the same idea, then the system needs to account for that and issue credits or additional invoices.

**Greg:** Correct. That's in version six of the document. So we're just following That workflow, simple workflow.

**Donald:** Simple.

**Greg:** If they want to lock it down, they can make the prepays non-editable, non-price overrideable.

**Donald:** And even then, the admin staff could still do something if they needed to.

**Greg:** And maybe that's appropriate. So that's just a policy issue about how they can figure the contract.

**Donald:** Yeah.

**Greg:** And then we don't have to worry about it.

**Donald:** Okay, let's keep moving.

**Greg:** Good discussion though. I think it just, you know, there's all sorts of gotchas in there.

## 6.4.1 — No automatic invoice or credit: discussion of exceptions

**Donald:** Okay, so what is this actually talking about? No automatic invoice or credit after a prepaid procedure. Once a list is authorized, a prepaid procedure is priced in the prepaid amount, the price listed on the prepaid invoice taken from the prepaid contracts line. Is priced at the prepaid amount, yes. The price is on its issued prepayment invoice taken from the prepaid contract line, yes. Okay. BTM units are recorded on the day of reference only, nothing's calculated, yes. No invoice or credit note is automatically raised whether the work turned out to be more or less than expected and there is no threshold, where no one where one is needed, for example, because only half of the done or raises an ad hoc additional invoice or credit note by hand.

**Greg:** I don't agree with that. That was the point is that.

**Donald:** Well, this is actually true, right? Like this is what we've said, the system, and we've said this in front of Nick and Ben and they've agreed, right? That if whatever reason they only get one breast something done, they wouldn't charge for the entire thing and they would raise a credit. And I would say the right way the system would recommend you to solve that is by additional invoicing events, not by some sort of price override. There is an odd scenario that you've said the system could allow, which is fixed price with a price override, and we've already just talked about that, but this is the normal recommended path.

**Greg:** We're actually saying the same thing but using different language and it's taking us down different roads. So my argument here is that by overriding the price at the time of the procedure, the anaesthetist is initiating a price adjustment event, either an additional invoice or a refund. That's what it does.

**Donald:** We've said that already.

**Greg:** There isn't any more complexity to it. It's going to go to the admin. It's going to be flagged as a change. It's going to eyeball it and decide if that's okay. That is the procedure.

**Donald:** We're talking about fixed price procedures that have had a price override done on them. We expect that most of the time that wouldn't be allowed, but the system does allow such a configuration to exist.

**Greg:** Yes, that's the policy part of the conversation. So if it's allowed, it can happen and that would be the mechanism that would trigger what you're calling additional invoicing events. They can be automated because they're just the difference from the original amount to the changed amount.

**Donald:** Yeah, you're saying that in the reality they both present in the same way that this additional invoice or this credit which is done automatically. That's the difference here. You are describing a scenario you think should be supported and at this stage I'm not saying you're wrong but it requires the system to account for this and have logic to catch it automatically.

**Greg:** But it has to be there anyway because this is not.

**Donald:** You can nip all of this in the bud.

**Greg:** This is not a behavior related to prepays. It's a logic that's related to changes to anything, any information on the booking that's made by the anaesthetist. And then there's just a single flow after that.

**Donald:** The problem is specific to prepayment though, because I mean it's not a prepayment and somebody decides to override the price for whatever reason. It's easy, the thing that's on the invoice is just the new price that was set. It's the standard line on an invoice, but in the situation where it's a prepaid.

**Greg:** It's the difference.

**Donald:** I know it's the difference, but it's a new invoice that has to be reconciled after the procedure. So it's different in that way.

**Greg:** But the second invoice is a regular invoice, right?

**Donald:** Yes.

**Greg:** So my argument is it's a standard process. It just flows through the standard process.

**Donald:** Yeah, I'm not arguing through there. I'm just saying that if you wanted to build this system and reach the same outcomes but pay less money to build it, you would put a rule in the system to say prepaid, sorry, fixed price contracts can't have a price override. And then Anything, any exceptions in the system that have to be accounted for are solved by ad hoc invoicing events. But in an ideal world where it costs nothing to build everything, the system is keeping track and calculating and accounting for all these different rules and complexities. And then in the scenarios where it all falls in the right or wrong way, then it catches that and does a credit or additional invoice.

**Greg:** I don't buy your argument, but I hear what you're saying.

**Donald:** Yeah.

**Greg:** I'm not convinced at all that actually one path would be significantly more expensive than the other, so I'm happy to have the conversation later in the project, if you like.

**Donald:** Yeah. In terms of the text that I've highlighted in blue here, if we excuse the scenario in which a fixed price contract has a price override applied to it and the system need to catch that, this is still true, which is that, and it probably just needs more conditions around it, which is to say in the scenario when a fixed price contract is selected and no price override is applied, No credit or invoice is raised automatically whether the work turned out to be more expensive or less, and there's no threshold that tries to determine or guess that. Where one is needed, as in when a credit note or additional invoice is needed, for example, because half of the work was done or the procedure took far longer, the anaesthetist or the office can raise an ad hoc additional invoice or credit by hand. They could do that.

**Greg:** Well, they can always do that.

**Donald:** Yeah.

**Greg:** Sounds like an argument about semantics, but it's more than that. I think the only way you would know whether the job took longer or not would be that the anaesthetist said so. Because there's a price and he's going to go, well, that's my price for an hour and actually it took two hours or whatever. So that's not going to show up in any of the information that we have got about this particular arrangement. The only thing we know is it's $2,000 arrangement. And then this just wants to change it.

**Donald:** Yeah, they want some more money or they think that it's fair to the customer that they get some money, patient that they get money back. The problem you raised exists outside of the unfortunate narrow condition that we talked about, right? The fixed price plus price override allowed because the system already pre-presumes that the admin staff at any point can always just set whatever price they want. So I'm saying this to tell you that you're raising good points. And all of this just becomes more complicated. Clearly, there's lots of complication in the system because of prepayments. If prepayments didn't exist, also lots of this would be so much easier. But because prepayments exist, there's complexity. and in a situation where a customer needs to prepay on Ben's contract of $2,000, and after the procedure is done, I guess in the normal happy path, no new invoice will be created because there's nothing more for the admin staff to approve.

**Greg:** Exactly.

**Donald:** And in that case, then the admin staff would have to create additional invoice. So maybe it is still avoidable.

## Normal prepaid settlement versus exceptional adjustments

**Greg:** I think that's dead right, that the normal case is—well, my understanding, what I've been told is that if the procedure is not prepaid, it's cancelled. If the payment isn't...

**Donald:** Received, the payment is not received.

**Greg:** Yeah, if a prepayment procedure payment is not received, it's cancelled. It doesn't happen. So that's that part. So we can safely assume that the scenario we're talking about is always that the payment has been received. So then the question is, how does the system handle the scenarios that come out of the procedure? So the normal one is there's no change There's no invoice issued to the customer patient because they've already paid and it goes through that holding account transfer process. If there is a change, then it branches and does two things. It invoices or credits the difference and it also goes through the transfer process and transfers from the holding account to the anaesthetist as it would have if the amount had been not changed. So all we're saying here is whether we want to take on automating the second invoice or not.

**Donald:** Yeah, and so what are the scenarios with which the system needs to be watching and having rules to catch and automatically invoice differences?

**Greg:** Well, it's got a prepayment amount.

**Donald:** It's only if it's prepaid, right?

**Greg:** Yeah, otherwise it's irrelevant.

**Donald:** If it's not prepaid, then everything else downstream catches it in the regular invoicing process. And if a regular procedures invoice goes out and after the fact they find they want to do more, the price wasn't right, that would still be caught by the ad hoc invoices workflow.

**Greg:** Yes, it would. So they can either roll it back and reinvoice it or they can build the difference.

**Donald:** And so I think there's two scenarios then that we've just identified. In a prepaid procedure, either changes to a new anaesthetist. No, sorry, let's be more simple. In a prepaid procedure, that the...

**Greg:** If the quoted price has changed on a prepaid procedure, that's all we need to know. It doesn't matter how it happened.

**Donald:** Yeah, so if a payment was prepaid, $2,000, and the admin staff want to change it after the procedure happens, or before, I guess, doesn't really matter, before or after the procedure happens?

**Greg:** Okay.

**Donald:** Then in this scenario you're saying the system should detect that and invoice the difference. So that's one scenario. And the other scenario is prepaid procedure with a fixed price that allows a price override. And then any anaesthetist, be it the same anaesthetist or a new anaesthetist, decides to override the price, then the system should detect the difference.

**Greg:** Same process.

**Donald:** Same process, yeah. Those are the two scenarios.

**Greg:** Only one process. There's only one logical process.

**Donald:** Yeah, yeah, yeah.

**Greg:** You're just changing who did it.

**Donald:** Yep, you're right, you're right. Is there a reason why you feel strongly that the system automatically detecting those Has to be the solution.

**Greg:** Because Ben's chasing automation.

**Donald:** Yeah.

**Greg:** He's trying to take all of the manual shit out of the system. So I think that paragraph isn't helping us get to that goal, because all we're trying to say here is that if a prepaid price has changed—if a prepaid price is not changed, no action's required regarding invoicing. Otherwise, if it is changed, we do this.

**Donald:** Yeah, yeah, okay.

**Greg:** I don't think it's any more complicated than that.

**Donald:** Yeah, I think we just need to talk to Ben about it then. I think a lot of pain and time could be saved by not trying to catch this, or at least not catch it during the MVP. And in the scenarios where this is something that people want to do, solving, answering that question with the tools that are already there. But if they feel strongly about it, then we've just got to do it. Yeah. But it's some weird edge cases that result in a lot more cost, I think.

**Greg:** Ask them.

**Donald:** Yeah.

**Greg:** I don't agree with you, but ask them.

## Question for Ben and transition to trust accounting

**Donald:** Okay, okay. Claude, we started talking about 6.4.1 and have obviously done a lot of unpacking here. Could you try and summarize this into a more succinct question? that we can then ask Ben. I just texted him to see if he was available. I'm not sure if he's working today. Okay, moving forward, using the abilities of the system already has 3D procedure, yes. This is the build position until Ben answers whether or not prepaid price can be feeling better. Let's see. Are you up for a call? I'm here with Greg. Let's see what he says. This is the business tool Ben answers whether or not a prepaid price can be changed or whether part of the prepayment may be credited. Can the price be changed on a pre-procedure? So I think we asked this the other day, can the nieces In 20 minutes, he says. Okay. Can the NSS change the price on a prepaid procedure or is any difference handled only by ad hoc invoice or raise my hand? I think this is one we asked him about yesterday. Okay. What else is in here? This is...

**Greg:** The answer to the question is whether you want changes to prepaids automated.

**Donald:** Totally, that's right. This is payment for a pre-procedure is not a new invoice to the patient, it's a transfer. That's what you were saying before. This is so a prepaid patient has a stable amount. Okay, cool. Well, this is left as verify and so we can keep moving. Trust account and cancellation refunds. Prepayment money is not paid to anaesthetist. It is held in a prepaid holding account with an AAS trust accounting. and is moved to the anaesthetist who did the list only once the procedure is done. It is handled centrally by the office rather than by an anaesthetist. A cancelled bookings.

**Greg:** Hang on a minute. And moved to the anaesthetist who did the list once the procedure is done. I wouldn't agree with the next sentence. It's not handled centrally by the office. It's just paid to whoever did the procedure.

**Donald:** Yeah, I would say maybe, if I think I understand what this is saying, it should say something like transfers to new anaesthetists.

**Greg:** Well, the booking would have been transferred, right?

**Donald:** Yeah, but this is being more explicit about the draft payable. record I think.

**Greg:** The draft payable record is AA holding account.

**Donald:** Correct me if I'm wrong. Receivables money coming in, payables out money going out. So we've said already that a receivable invoice goes to the patient, maybe without naming an anaesthetist. And at the same time a draft payable invoice is created for the anaesthetist will ultimately get paid.

**Greg:** The holding account. So the holding account...

**Donald:** So the money comes into the holding account. Yes.

## Trust bank account versus accounts payable holding account

**Greg:** Don't confuse a holding account with a trust account. So a trust account is a bank account. It goes to a bank account. That bank account is analysed out into which anaesthetists are due to be paid. What we're saying is we're going to create a fake anaesthetist called holding account.

**Donald:** Keep going.

**Greg:** So that fake anaesthetist receives money and pays out, transfers money to other anaesthetists, but never actually gets paid itself.

**Donald:** Oh, this wasn't.

**Greg:** That's the difference. It's not a ledger, it's not a Xero ledger. It's actually a creditor, right? So every anaesthetist is in the system as a creditor. That is someone we owe money to, right? And we also have this creditor called AA Holding Account.

**Donald:** Okay, so just to be clear then. So in the standard happy path, we've got AA in the middle, right? That's this box. We've got the patient over here. Money comes here.

**Greg:** Into the trust account.

**Donald:** To AA.

**Greg:** To the trust account.

**Donald:** Okay.

**Greg:** Trust.

**Donald:** And then out of here.

**Greg:** To the anaesthetist.

**Donald:** To the anaesthetist.

**Greg:** Okay.

**Donald:** It's making them a triangle. And presumably it's out of the trust account.

**Greg:** Yes.

**Donald:** And so that is the same happy path.

**Greg:** Yes.

**Donald:** Sorry, the green isn't very good. Let's try blue. In the situation, and this would happen kind of automatically, right? Like the moment this money comes in, this money goes out. But in the situation where it's pre-paid and the procedure may be cancelled, the procedure might move to somebody else, all that sort of faff, AA still receives the money From the patient.

**Greg:** Yes.

**Donald:** Into the.

**Greg:** The trust account, the bank account.

**Donald:** That's the trust, okay?

**Greg:** Yeah.

**Donald:** And I've always understood that the money does not go to the anaesthetist until the procedure is done and the money is released. That's right. But a draft invoice is set up to say you're going to get this money.

**Greg:** No. That's what happens in the first case, by the way. The two diagrams are actually the same. There's a time here. Do you know what T accounts are?

**Donald:** No.

**Greg:** Okay. They're quite a simple concept, but they can be hard to get your head around until it's like, oh **** that's too easy.

**Donald:** In some ways, I don't care about this because it's not really like, if somebody says the way it has to work has to work this way, there's not really a place to be like, is it the right way? At least not [unclear].

**Greg:** Well, the reason you need to care about it is because you have to specify it for the developers.

**Donald:** Yes, no, no, certainly.

**Greg:** But otherwise, you know, it's a bit esoteric.

**Donald:** But can you help me understand why the money goes into somewhere else first?

**Greg:** Yes.

**Donald:** And what is that something else?

## Greg’s accounting walkthrough: ordinary post-procedure billing

**Greg:** Yes. It's the... okay. On this side, there's a stick missing. So I might use T-accounts now. This will look a bit horrible, but if you can follow it, it's an accounting game, right? It's like the shell game, right? So in Xero, we'll say this is Xero here, right? We've got an account here called the Trust, and it's a bank account, all right.

**Donald:** So what is the dotted box?

**Greg:** This is the Xero system. The Xero system. Okay. So, and we've got a, this is debits and credits, left and right. So this is debtors. This is people who owe us money and that's called accounts payable. And this is creditors and that's accounts receivable. So we'll call it sales for that. So the first thing comes along and we've got scenario number one, it's a straight invoice.

**Donald:** Postpaid, after procedure, regular invoice.

**Greg:** Yeah, invoice $100, right? What happens here is we say we've got $100 here, that's a credit to sales, and it's owed to us by the patient down there. All right.

**Donald:** This is helpful.

**Greg:** Then they pay the invoice, right? So they pay it. Let's keep it simple. $100, right? So we've also raised an amount here. Nothing's happened to the bank yet. That's transaction one. And then transaction 2, forget about, don't assign any meaning to the cover. We're going to say that we also want to recognize that if we are owed 100 bucks by the patient, then we owe 100 bucks to the anaesthetist. And we need to offset that support. Where does that go?

**Donald:** We need to offset it.

**Greg:** Well, this is the patient—the patients. This is who we're owed money from, and this is the anaesthetists. So this says we owe the anaesthetist, if we raise an invoice for that, then we owe [unclear], and we'll put $100 on this side. So this crosses out and it means that we've got, in our ledger, our ledger comes to zero.

**Donald:** Sorry, I missed a step. So the money came in, step two.

**Greg:** Step two, the money, oh, sorry, we haven't done that. Sorry.

**Donald:** So where does the money, oh, okay.

**Greg:** This is, that's the invoice and this is the payable or the bill, right?

**Donald:** Okay, so I'll just step you through where we're at so far. So an invoice is sent to the customer, and that is recording $100 of sales. And then also records $100 in the debtors to say, this patient owes us $100. So this is a record of the work done. This is who owes the money, and this is who will essentially get the money. That's all established at step one.

**Greg:** That's it.

**Donald:** Then step 2.

**Greg:** What step? Yes, those are our first two legs of the transaction.

**Donald:** Sorry, where did this come from? Where did this, what happened here? Okay, so the moment...

**Greg:** There's always a counter entry and a counter, so everything on one side has to be somewhere else as well. Okay, so what we're left with is just we owed that and we owe this, but our agreement is we never owe this until this is paid, so it's always, from a time point of view, it's fine. Now then they pay $100, right? So they pay $100 into here. And that means that we no longer owe them. They no longer owe anything, right? That's step three, right? And step four, this is another two-legged, right? They pay us and we pay We pay the anaesthetist, right?

**Donald:** Sure. Yeah, so all of this was kind of much more simple of like one big bucket of money, stuff comes in and out, and there was another system that was keeping track of it. But this makes sense to me. Thank you for doing this.

**Greg:** Yeah, so where'd $100 go? So there's our $100. We paid it to the anaesthetist. Where did that go? Then we pay out the $100, right, to the anaesthetist. So that's all gone. So then we end up with nothing again because we billed $100, we've received $100, and we paid it back out.

**Donald:** Okay.

**Greg:** Now, this is called the debtor's ledger, and they have this wonderful thing here called a sub-ledger. So you could call this, it's like a control account. So this is anaesthetist one, anaesthetist two, anaesthetist three.

**Donald:** Wouldn't that be patient 123?

**Greg:** Yeah, sorry.

**Donald:** Cool, okay.

**Greg:** And the same thing down here.

**Donald:** Thank you. Cool. Yep.

**Greg:** Same thing down here.

**Donald:** Thank you.

## Control accounts, sub-ledgers and the holding creditor

**Greg:** So these are called control accounts because they just have a total in them. And these are called the sub-ledgers because they provide the details. And the sub-ledger accounting reconciliation at the end of the month always has to equal the control account. Otherwise you've made a mistake. So this is just a number that says this is how much you've got. So every time something happens in here, something happens on one of these. Now, so these are the creditors, aren't they? So there's Ben.

**Donald:** Nick, Rod.

**Greg:** Nick. But we've also got one here called Holding.

**Donald:** This is where it's all coming together. Why?

**Greg:** Because it's a place where stuff sits.

**Donald:** But at the moment we get...

**Greg:** So if you...

**Donald:** This is because you always want these things to equal out.

**Greg:** Yes, you have to park them somewhere. Well, it's called a holding account. You'll hold it there. Okay, Right, so what happens is, let's do another scenario. Let's just clean this up a bit.

**Donald:** Oh, hold on. Go back a minute. I'm going to take a photo.

**Greg:** Okay. I'll put it back here.

**Donald:** Thank you. Do you want to step away for just a moment there? Let's do one of these. Thank you. Okay, now I mess it up.

## Accounting walkthrough: prepaid procedure and holding transfer

**Greg:** Okay, so we'll just, it gets a bit, I'll change the color, that'll do. So our second scenario is a prepay. So we do, one, we do an invoice, and the invoice is the same as this. So we put one in sales, 200, and we put one here on the other side, 200. So that is, we send them the invoice for 200. And then they said they pay it. Actually, I'll just, I'll just say that that one's gone They pay the 200. So.

**Donald:** 200 comes in.

**Greg:** Into the bank, debit the bank, 200.

**Donald:** On the left, is it.

**Greg:** Yeah, we credit, we debit assets, so credit the debtor, 200, there we go. So that's squared away. And then because you've done that, you then So we're going to put 200 in here and we're going to put 200 in here to say we now owe the anaesthetist 200, but we don't know which anaesthetist, so we're going to stick it in there.

**Donald:** Yeah, so we have to put it in the holding account so that everything in the dotted box is...

**Greg:** The sub equals the [unclear]. And then the last one is... So we get paid.

**Donald:** This is why it's a transfer.

**Greg:** This way we pay the anaesthetist.

**Donald:** Transfer.

**Greg:** Yes. So we transfer $200. So we want that to go to that. So actually we're not doing anything here. We're just moving that.

**Donald:** To there. Can you draw me that line?

**Greg:** Yeah, I can. And we do that by going 200, 200. And what that does is it moves it out of there into there. So we credit this one and we debit that one. We're just moving it. That's an accounting move. So now we've got that we owe Ben 200 instead of the holding account. All right.

**Donald:** Speaking to Ben.

**Greg:** And then we pay Ben.

## Phone call with Ben: manual handling of exceptional charges

**Donald:** Hello, Ben.

**Ben:** Yeah, hi, Donald. How are you?

**Donald:** I'm good. I'm good. I'm getting an accounting lesson from Greg.

**Ben:** An accounting lesson.

**Donald:** Yeah, just trying to talk about prepayments for anaesthetists going into holding accounts and just some particulars of Xero stuff. So anyway, it's good.

**Ben:** Okay, yeah, great. Excellent.

**Donald:** Cool.

**Ben:** What can I do for you?

**Donald:** Yeah, so we've had lots of conversations with, you and I, a couple conversations now, I guess, talking about prepayments. Prepayments are really important to AA. They facilitate a bunch of, you know, we solve a bunch of problems for you guys, but it does create a bunch of problems on our end, right? So just little bits of complexity that needs to be accounted for. And so yesterday when we caught up, I raised to you the scenario where if a prepaid procedure has its price changed after it was paid, but before the procedure happens, and you said, Donald, in that situation, we honor the prepaid price as it was. And then in other conversations you've said, hey, if Ben gets sick and his prepaid procedure needs to move to Nick, then the policy within AA generally is that Nick would honor that original prepaid price. And so all of that is pretty simple. But there is a couple of weird edge cases in the system, as we understand it at the moment, that could create some problems. And so you in your conversations with Greg, as you've sat down with him, to talk about the different settings and conditions that could be on a contract. You may remember that it was an idea that a contract could be a fixed price or not, as well as contracts that can allow a price override or not. Does this all ring a bell? Yeah. Yes. So there exists a condition, theoretically, where a contract could be set up to be a prepaid could also be allowed to have a price override. And so you could imagine the scenario where you create a contract for a facelift and let's say it was $2,000, keep it simple. And just because you want flexibility, you decide you want the option to allow it to have a price override.

**Ben:** Well, I guess the thing is, is that say, yeah, I mean, I could say somebody goes in for a facelift, does the prepaid for $2,000, but no, we're going to do a facelift and we're going to do some liposuction as well. Yes. And that's kind of decided on the day.

**Donald:** Yeah.

**Ben:** And then you might go, oh, actually, in that case, here you are. So yeah. And so I guess in my mind, in that scenario, you'd raise a second invoice.

**Donald:** Yes. So what you've kind of identified there is pretty good, right? There's an idea already exists within the system where we talk about Look, the health industry is complicated. And so at any time we want to be able to ad hocly raise an invoice or raise a credit for whatever given reason we need to. So that the system already kind of understands that. We've talked about that. But specifically what I'm trying to raise here is not quite what you've described, which was an add on event. You just maybe have a situation where one day you decide, even though with pre invoice this customer $2,000, either you or maybe the next anaesthetist that wants to change that price decides to.

**Greg:** That might take a lot longer, right?

**Donald:** Yeah, totally. It takes exactly one and a half to two times longer and that anaesthetist feels like it's fair that they get more money. I mean, all of this comes down to a couple of really specific scenarios, and it's specific around a fixed price contract also allowing a price override, and a price override is separate to an ad hoc invoice event. Regardless, the system will always allow you to raise an ad hoc invoice event, but in some of these unique scenarios where either you decide to make your fixed price contract have a price override and you decide actually you want $2,100 or in a situation where for whatever reason the admin office decides to override the price because we've decided that the admins can always override a price because they need to sometimes. The question is how do we handle that? And so Greg and I were throwing that idea back and forth pretty rigorously and There's some pretty good ways we could do this, but really the factor here is the cost of the build.

**Ben:** And so- Can I just ask, is it a simple solution, not just to raise another invoice?

**Donald:** Yeah, yep. So that's, I think that could totally be the solution here, but I guess between Greg and I, we have heard from you that automation is important as well. And so under the condition where we do, let's make it more simple. I've done enough preamble.

**Ben:** Can I just correct you on that point? Automation is important, but there will always be the exceptional cases where automation doesn't need, not everything needs to be automated because we're talking about a rare event here. So a rare event can have some manual input.

**Donald:** Yeah, okay. I think that basically gives us the direction Greg and I need. Does that make sense? [Another speaker: "Yes, it absolutely does make sense."]

**Ben:** Because I think there would be an unusual situation whereby, you know, like if you're using your facelift, then something happens. But I also think it's a little bit like You know, doctors are very bad. Well, anaesthetists are very bad at getting the informed financial consent. And I would imagine that if somebody says it's $2,000 for your facelift anesthetic, and then they turn around and say, oh, look, you know, this and this and this, we're going to charge you $3,000. It's like getting somebody to install a toilet and then saying it's going to cost you $2,000, but then it ends up costing you. You'd be like, hang on a minute. No, no, no, the quote was $2,000.

**Donald:** Absolutely, yeah.

**Ben:** You know, and I think my personal philosophy is that you just have to wear that, you know, and just win somebody lose some sort of thing. But but I understand that, yes, there might be some situations or some people that may want to override the original.

**Donald:** Yeah.

**Ben:** But but I think it's then in that case, it would be reasonable to discuss with the patient and say, look, I'm going to give you an extra invoice for X. Yeah.

**Donald:** We decided, we found out you had two faces and we thought we only had one, so we needed to double it up. Yeah.

**Ben:** But we didn't know that you had a previous operation which made this operation a lot more difficult or something like that.

**Donald:** Yeah, Hey, thanks for your time. I mean, I think you've unlocked it for us here, which is that we could have the system try to detect some of these edge cases and automatically generate these invoices, and you could see a future where maybe you want that. But at the get-go, let's handle those exceptions by exception.

**Ben:** Yeah, I think so. I mean, you know, because we do have admin staff to do that, you know, so, yeah. I mean, I think we don't have to do much to make the job a whole lot easier, right?

**Donald:** Yeah.

**Ben:** Does that make sense?

**Donald:** Yeah. Greg, is there any more you want to say?

**Greg:** No, it's good. It's good. The argument we were having was about the value of automating it, but if it's really rare like that, then it's not worth it.

**Ben:** No, I don't think so.

**Donald:** Thank you, Ben.

**Greg:** Okay, cheers.

## Revisiting the holding-account requirements after the call

**Donald:** All the best, mate. Bye. Cool. Let's finish this thought. This helps a lot. And so if I, I don't think I've changed anything here, so if I cancel this and we read this original, feature here. Prepayment money is not paid to anaesthetist, it's held in a prepaid holding account, bottom right corner there, very nicely, within AA's trust accounting and moved to the anaesthetist who did the list only once the procedure's done. You've really nicely explained that to me. It's handled essentially by the office rather than by the anaesthetist. I'm not sure what that line there is doing. I should plug in, sorry, you know, you can't see this. Cool, I think that makes sense to me now. And I understand the need. So what I would?

**Greg:** Expect the Xero automation to do, it'll just do it.

**Donald:** Yeah. How many conversations have you had with the accountant as of now?

**Greg:** Oh, only one, only one.

**Donald:** Do you know what their Xero experience is like?

**Greg:** Oh, I would expect them to be very competent at Xero.

**Donald:** Yeah. Yeah. I mean, I'm sure they would look at those and be like, duh.

**Greg:** Oh yeah, it's 101.

**Donald:** Yeah, cool, because I guess they would be our subject matter expert when we come to actually build it to say, Is this exactly what you need? Not that, because everything you've said makes all the sense in the world to me. The way we ultimately implement it, they will say, yes, that's right, because they're going to be responsible. OK, cool. OK, so there's this last little sentence here. It is handled essentially by the office rather than the anaesthetist. I mean, I don't think that's quite right. It sounds to me that the system is manually handling this sort of stuff. so automatically I mean this sort of stuff.

**Greg:** Payment money is not paid to the anaesthetist, it is held, I'd say it is credited to the accounts payable prepay account. That would clearly describe, so instead of it is held in a prepay holding account, you could say it is credited to, no, that's the second sentence.

**Donald:** I know that, I was just moving that.

**Greg:** It is credited to a payables account called AA holding account. Okay, so it's one of those guys on the right.

**Donald:** Okay.

**Greg:** It's a software account. So that's. And the rest of it makes sense. None of that's handled centrally. It's just automated.

**Donald:** Yeah, that's right. Cool. Save. A cancelled booking's prepayment is always refunded in full from the holding account. A booking that moves to another anaesthetist keeps its prepayment... the pay... okay, hold on... keeps the prepayment... yes, okay. I kind of want to make that a little bit more specific. A booking that moves to another anaesthetist keeps its prepayment price.

**Greg:** Yeah.

**Donald:** The payable is the holding account.

**Greg:** Yeah.

**Donald:** Okay. So it does not move. Nothing is recalculated. The prepaid price is the price. So the patient sees a stable amount. Okay. Today, if the anaesthetist has already been paid, they refund the patient themselves or that's not really needed for this. Cool. Okay, so before we move on to the rest of these payment account things, let's go back a step to this guy. Settlement after the procedure. After procedure, the prepaid amount is the price by default and the BTM units recorded on the day of reference only, the system calculates nothing further and raises nothing automatically in either direction. We're agreed on that now. No additional invoice if the work was more than expected, no credit or refund if it was less, no threshold. The system holds for every fixed contract. This is the same hold to fixed contract.

## Revising settlement and contract editability wording

**Greg:** I don't know about that. I think we're confusing here, fixed price and editable contracts, I think. We're agreeing that there are no changes to these contracts that will be handled by separate invoice, right? So what we are saying is that prepaid contracts must be set up as not editable. That locks all this down.

**Donald:** Yes.

**Greg:** So then you don't need the bullet, you just say copy edited.

**Donald:** Yep.

**Greg:** And that's it.

**Donald:** Yep, okay. So yeah, reading feature 6.4. This obviously sits within the epic of prepayment, but this line here is, as you say, potentially can be misconstrued. The same holds for every fixed price contract for a prepaid procedure, this is the build position until Ben answers; he's already answered. where the work turns out very different. Yeah, okay, so who already answered that sort of stuff in the calls? So when we go down to the actual story, that says mostly the same thing. Once a list is authorized, the prepaid procedure is priced at the prepaid amount. The price on its issued prepayment invoice taken from the prepaid contract line. BTMs are recorded only for reference. No invoice credit note is raised automatically. Whether the work turned out to be more or less than expected, and there's no threshold. When one is needed, for example, only half of it was done or the procedure took far longer, the anaesthetist or the office raises an ad hoc invoice or credit note by hand using the ability the system already has for this procedure.

**Greg:** While this is all correct, it's very noisy. I think it'd be easier to just leave it out and just say nothing, you know, once the procedure is done, nothing further occurs. The system does no further operation on it, apart from the transfer to the anaesthetist. So it doesn't do this, right? It just stops. Maybe we should completely rewrite this to say you can't change it. It's already paid.

**Donald:** I think there's a fair case to be made here that this feature, which currently only has one story, could probably be dissolved and its story moved into another section here, because it is just answering an edge case that previously was left unaccounted for, right?

**Greg:** And the edge case was.

**Donald:** What happens if there's, like, Claude at the beginning was asking, like, if something costs more, is there some sort of calculation? You remember there was that whole spreadsheet, or that table that Vanessa brought out in front of us, and we said, okay, these numbers for prices for times, is this made up? Is this true to the BTMs? And we found out what it was. Like, [unclear]. So I still think this particular story has value in the fact that it just makes it very explicit that there's no special logic in the system to account for anything else, and it probably just needs to be dissolved. In this particular line here.

**Greg:** However in order for this to operate correctly the contract must be non-editable otherwise you're going to break the system.

**Donald:** I like that so let's make that a clear rule that if a contract is set to be fixed it can't have a price override allowed.

**Greg:** However, in order for this to operate correctly, the contract must be non-editable. Otherwise you're going to break the system.

**Donald:** Prepaid contracts, okay. Yeah, no, okay, I think you're more correct there. Yes, prepaid contracts can't also have the setting of being allowed to have a price override. Cool, I like that.

**Greg:** Oh yeah.

## 6.5 — Accounts payable holding-account detail and reconciliation

**Donald:** It's not the most handy place. It was there earlier on. I probably need to move it up here, so yeah. Cool, okay. So that's addressed those two. I guess I'll mark this one as agreed. And the other one will get removed. Okay. We've done the feature and we've accepted the feature. Agreed. Let's talk about prepay holding account. A prepayment is not paid to the anaesthetist. It is held in a prepay holding account. Good.

**Greg:** Yes, but that's can be an accountant would read that and wouldn't know specifically what your design was because they have holding accounts all over the place, including in their chart of accounts and we're not talking about that.

**Donald:** Okay.

**Greg:** We're talking about an accounts payable holding account.

**Donald:** Okay.

**Greg:** So call it held in an accounts payable prepay account.

**Donald:** Like that?

**Greg:** Yeah, that's cool.

**Donald:** Cool. And based on the transcript and these images, We already asked Claude to make a new artifact to make some of this more clear, separate to the flowchart, and we'll get you to put your eyes over that too. Which the internal ledger treats as the anaesthetist's account. True, so our app will take...

**Greg:** It thinks the holding account is an anaesthetist.

**Donald:** I guess so, yeah.

**Greg:** That's fine. It doesn't know.

**Donald:** The other side of the prepayment invoice pair is the holding account instead of the anaesthetist. Its balance is all of the deposits received for procedures not yet done. The holding account sits within AA's trust accounting, which is the dotted line.

**Greg:** Yep.

**Donald:** Cool. Prepayment is two steps. First, the money is collected into the holding account. Then, once the procedure is done and the office authorizes the list statement, a second pair moves the money from the holding account to whichever anaesthetist did the list, in place of another invoice to the patient. I like a good line break.

**Greg:** I'm not sure that that's more noise to me talking about the other invoice to the patient. It's just that's where it moves it.

**Donald:** Okay, let's remove that then. Thank you. Cancelled prepayment is refunded to the patient from the holding account, refund or cancellation, and payments out of it are made from the system, not by hand outside of it.

**Greg:** That's important. Otherwise, the balance breaks.

**Donald:** Okay.

**Greg:** You end up with a reconciliation imbalance because you've paid [unclear].

**Donald:** Cool. This is so refunds and prepayments are reconciled in one place instead of loosely across AA's books. And each anaesthetist, so a prepaid booking that changes anaesthetist never... there's nothing to amend.

**Greg:** So this... This is a list of all, this is all the data, these are all the patients in hospitals, right? We'll just call it patients, right? So that total there, if we go over here to the system, whatever we're going to call it, and that's by patient, right? Patient one, patient two, patient three, right? We've got this mirrored in our app. and it's the same list or the same value, right? And that has the equal.

**Donald:** Yeah, that's when I talk about internal ledger, that's exactly the thing on the right there, which is us mirroring what Xero sees and keeping track of everything.

**Greg:** So every time they do a payment run before they make the payments, I'll be putting a system in where the accountant or Vanessa has to demonstrate that all of these critical numbers balance. If they don't balance, stop.

## Cancellation, credit notes, refunds and replacement bookings

**Donald:** OK. Very good. Cool. I think we read everything there, and we agree. OK, we're good. Refund a prepayment on cancellation. When a booking with a prepayment is cancelled before the procedure, the system always refunds the original payment in full, the money is held in the prepaid holding account until the procedure, so it has not reached the anaesthetist and it is refunded to the patient from there. The refund is recorded in the ledger as a credit against the prepayment invoice that reverses its receivable and its payable into the account Nothing is reversed against the anaesthetist who was never paid. So the trail stays visible.

**Greg:** Yep, that's fine. It's just a normal account. That's just a normal refund transaction.

**Donald:** Cool. The office handles the refund. The anaesthetist is no longer left to refund the patient or pay a replacement anaesthetist directly.

**Greg:** You might want to put in there a comma as is the current practice.

**Donald:** Or we just remove it all together like we did the other one. It's good for us to know. Cool. Agreed. Prepayment for a replacement anaesthetist when a prepayment booking is cancelled and then the procedure is later rebooked as a new booking with a different anaesthetist. The new booking starts its own prepayment and the system raises a new prepayment for the new anaesthetist at the new anaesthetist's own fixed price for the procedure from their own price list. So booking A is cancelled and a whole new instance is created and the two don't know about each other. The original prepayment is refunded, not moved between anaesthetists, so the patient may see two different amounts if it's been paid. The booking that moves to another anaesthetist without being cancelled keeps its prepayment instead of...

**Greg:** I was mentioning here that if you're going to cancel a prepaid booking, you need to reverse the invoice. It's not owed anymore.

**Donald:** Okay, so on this one here.

**Greg:** So it should probably be...

**Donald:** I thought you were saying earlier that once you send someone an invoice, you can't stop them from paying you.

**Greg:** No, but you can send them a credit note. And if they pay you anyway, you send the money back again. It's a double transaction.

**Donald:** Sure. Okay. I'll say whatever you want me to say.

**Greg:** So I think this is only if, okay. Maybe we should call this cancellation of prepayment procedures.

**Donald:** Okay.

**Greg:** Then we can pick up both these scenarios, right? So I think, no it's not a refund because it may not be. So scenario one is they haven't paid, so you raise a credit note and it nullifies the transaction. Scenario two, they've paid you refund. That should be as part of the booking cancellations process. So if you press cancel, it should automatically do this. Okay, scenario two. How long have we got until three or four?

**Donald:** Four, unless you want to stop at three. Cool, I think the rest of it remains true. Does that sound good to you? Okay, let's add a little bit of spice to this. Okay, cool. Now we're talking about this one again. Prepayment for a replacement anaesthetist. So when a prepaid booking is cancelled, And the procedure is later rebooked. You know, those are two new separate things. The original payment, prepayment is refunded, refund on cancellation. Not moved between anaesthetists, so the patient may see two different prices. Yes, the booking that moves from another anaesthetist without being cancelled keeps its prepayment instead. Yes, that's already understood. Cool. That seems right to me.

**Greg:** Yeah.

## 6.5.4 — Reassignment to another anaesthetist

**Donald:** When a prepaid booking moves to, oh sorry, prepaid booking moved to another anaesthetist. Here we go. When a prepaid booking moved to another anaesthetist before the procedure, nothing changes in the ledger and the patient is not billed again. I guess it needs to presume it's been paid. Well actually, even though it hasn't been paid yet, no, it doesn't matter. The payable does not move. The payable does not move because it is the prepaid holding account, not the anaesthetist. Nothing is recalculated. The price prepaid when the booking was created and the prepaid invoice went out as the same price. The new anaesthetist wears the benefits from any difference in their own price and claims no more for the procedure than what's prepaid. unless they decide they want to and Ben already just described that. Whichever anaesthetist does the list is paid from the holding account at the second step. Once the procedure is done, the system may send the patient an information or e-mail saying the anaesthetist has changed, the payment stays the same and they need to do nothing. The wording is an AAS choice. The patient did not know who then this would be in the first place, so no emails required. It's kind of just contradicted itself a little bit.

**Greg:** Absolutely. I think it's reflecting a conversation that we did not resolve for it.

**Donald:** Yes, and we-- Did.

**Greg:** We decide we wouldn't bother sending an e-mail? Well-- What do we need to ask?

## 12 — Anaesthetist profile and reporting

**Donald:** We already, yeah, so Claude, we're reading 6.5.4. You've already heard earlier in the conversation today that we need to ask AA, Vanessa or Ben or both. if the prepaid invoice that goes to the patient is only, does it name an anaesthetist or not? And based on the answer of that, this story will update. So this middle paragraph here is a little bit muddled. And then finally, this keeps the amount stable for the patient, leaves nothing to be meant. We agree with that. So I'm just going to mark this as Basically agreed and we can let their later story change it if needed. Okay. Honestly, I think we've really broken the back of the most difficult parts here. Do you need to catch your breath? I'm good. Okay. Anaesthetist profile and reporting. Epic 12. Each anaesthetist has a profile, their dollar value per unit as specified in the RVG. which is the only setting that drives their billing and their contact and bank details. Claude, that's a very messy sentence, it kind of just goes straight into things that will be included. Anaesthetists also have two reporting needs of their own, a list of balances still going to them, a monthly GST report, a list of payments AA has passed on to them in the month, and the GST components for each for the GST return. Okay so far I'm thinking that this is a bit confusing but now when I look at the two features I can see what it's done here. There's a whole bunch of like admins side profile settings that list a bunch of stuff including probably is missing here I think is some of that preferred list block list stuff. Who do I want to work with? Who do I not want to work with? So that exists on the admin side. Separate to that is all of the reporting to the anaesthetists. And I don't know how much of this, it feels a little bit muddled because I think there's some stories later on that actually talk about the different web apps and bits and pieces. But let's push on.

**Greg:** They need a report because they send a PDF to their account.

**Donald:** Maybe that's what this is doing here then, so it's still all admin functions. Okay.

**Greg:** The thing they're missing out here, I mean, it doesn't talk about my profile settings. Let's see what we've got.

## 12.1 — Profile fields and anaesthetist unit rate

**Donald:** Okay, I'll leave it open for now. Profile settings. The settings, so this is 12.1, the settings held against each anaesthetist, their dollar value per unit, only one that matters to billing, their contact details and their bank account for reimbursement. So also missing here is practitioner number. And I think, like I said earlier, that block list, preferred list stuff. So, let's see if that's picked up somewhere else. Yes, yep, their tier, exactly. Each dollar value per unit, 12.1.1. Each anaesthetist sets their own dollar value per unit, the unit as specified in the RVG. cannot collectively agree on price under the Commerce Act. So the system stores this as a setting per anaesthetist rather than a shared price.

**Greg:** Sure. It's got the technical discussion. Anaesthetist rate and unit value, that's actually the same thing. It's just the anaesthetist unit rate.

**Donald:** Yeah, I think you're right there. So after I brought in your requirements to make early versions of this, at some point soon after that, much time before you and I really started working together on talking through it all, I also said read Stratos' RFP response and apply the technical discussion to any stories you think makes sense. So this has pulled it from our technical discussion, but I would expect this to be overwritten when a dev finally gets to look at it. Yeah. Well, actually, Claude should just update it based on this. So propose an RFP response when a list is finalized. The anaesthetist rate and unit value, you're right, are the same thing. Contract terms, party details. Okay, Claude, go ahead and update that. Other than this, yes, we do display dollar unit, dollar value per unit.

**Greg:** And it's picked up the missing fields, is it? Claude will do that, that we talked about before.

**Donald:** I would like to think it will make new stories for that, or at the very least link in the feature the other places those stories are captured. Anaesthetist identity, contract, contact and bank details. Admins hold each anaesthetist's master record for their contact details, registration number—there you go—and, where available, bank details.

**Greg:** Well, not we're available, it's mandatory.

## Anaesthetist reporting: outstanding balances

**Donald:** Yeah, it is mandatory, isn't it? This is so the anaesthetist identity can be referenced consistently across the system in line with blah, blah, blah, blah, blah, so the AA has what it needs to pay them. Bank details are used for the payables run, disbursement of funds from AA's account to the anaesthetist once their receivable is paid. Okay, sure. Reporting for anaesthetists. Anaesthetists get 2 reports of their own, a flat list of what's owed to them, and a monthly GST report of the payments AA passed to them. Both read from the billing/invoice engine's own ledger, not from Xero directly, since that ledger is the system of record of what is owed.

**Greg:** Sort of by... up here, by patients—just say by patients and insurers, by patients and contract holders. That'll do.

**Donald:** Cool. So that's the feature. Let's go to the story. Each anaesthetist sees a flat list of their own unpaid payables. On your list up there, which ones are payables?

**Greg:** Well it depends whose eyes you've got. If you're AA, an anaesthetist has a payable because you owe them money. If you're the anaesthetist, you have a receivable because you're owed money.

**Donald:** Typically around 100 rows, oldest first. The list carries no roll up or grouping, no aging buckets or no age chips. I think it's just some UI stuff that I think eventually got removed. If an anaesthetist has a query about a specific line, they contact office staff for detail rather than getting an answer from the app. Okay.

**Greg:** Has that got, is there a way to go back to the booking ID if you click that?

**Donald:** In here.

**Greg:** Probably would be very helpful.

**Donald:** Yeah, I think there should be traceability.

**Greg:** You want to click through for booking, it doesn't have to be shown. Just needs to jump.

**Donald:** Yep.

**Greg:** I'm sure it's there. It's just I'm talking about a user feature.

## Monthly GST reporting and buyer-created tax invoices

**Donald:** Yeah, I think it's a fair expectation. Cool. Next, GST report. Each month, each anaesthetist gets a list of the payments AA has passed on to them in the month with GST component for each, so they know the income and its GST for their GST return. It lists payments, not invoices sent. because an invoice may be paid in part. Some of the payments pay off a bill on a repayment plan, for example, 500 a month. Anything still outstanding falls into the later month. It is something to download, e-mail, or print, so it suits the web app.

**Greg:** I think it lists payments made by AA to the anaesthetist. the next paragraph down where it says it lists payments. Oh yeah, it says on the first paragraph, doesn't it? I thought so. A list of payments has passed to them. And then in the next paragraph, it sort of starts falling over itself. It really doesn't need that. It's saying it lists payments, right? But what we haven't talked about here is that We're going to generate a buyer-generated tax invoice for each of these payments to save the anaesthetists having to do it. But there'll only be one raised a week, because it'll be [unclear]. We haven't talked about that. It hasn't talked about that anywhere, has it?

**Donald:** BCTI? Yeah. Approve the period's BCTI for payment. We haven't gotten to it yet. Okay.

**Greg:** It's over there. You know we talked about that second pier.

**Donald:** Yes.

**Greg:** The second pair is the buyer-generated tax invoice. That's what it is.

**Donald:** So you're talking about the three and four at the top, or three and four under the prepaid scenario?

**Greg:** It mimics the anaesthetist sending AA an invoice for that amount.

**Donald:** Okay. We'll do it for them. Okay.

**Greg:** So, the question is, do we need to do it? We can get smart about this. We could do it, if we did a weekly run, we could generate one BCTI for the run, which had all the lines on it that we were paying. It's like a [unclear]. And actually, we could just send them back; they get [unclear] and they can add them up [unclear]. Anyway, I don't think we've covered it anywhere in the... Okay. So it talks about a BCTI, but it never said where it came from.

## Anaesthetist web dashboard and meeting close

**Donald:** Okay, last one here. Each anaesthetist's own web app opens on a dashboard that summarises their calendar, their financial position and locum availability. This gives them a single overview of their week's bookings, what they're owed, who's available to cover, without navigating to each in turn. And I think this is just an interpretation or regeneration of this screenshot. Okay. I think I'm actually at my capacity. And I can then take the next few hours to process this and hopefully update things for our meeting tomorrow.

**Greg:** Now I have to cancel tomorrow's meeting. Well, I can't do it in the morning.

## Reconciliation notes

- The named-speaker transcript supplies the speaker turns. A few interjections within long blocks cannot be securely assigned from the three written transcriptions; one such interjection is labelled “Another speaker”.
- `[unclear]` identifies short spans where the transcriptions are garbled or disagree without a reliable reconstruction. No missing financial or requirements logic has been silently invented to fill those spans.
- The accounting walkthrough includes verbal slips while explaining debtors, creditors and Xero accounts. Those spoken explanations have been preserved as dialogue rather than silently “corrected” to a textbook description. The meeting itself returns to the distinction between the trust bank account and the accounts-payable holding account.
- “BCTI” is used consistently where the recordings appear to refer to a buyer-created/buyer-generated tax invoice. Some surrounding wording remains uncertain.
- The phone call with Ben occurs within this recording; his comments about rare exceptions clarify the earlier discussion, but prior questions and proposals are intentionally retained.
