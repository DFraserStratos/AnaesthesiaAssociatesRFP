# Anaesthesia Associates — Meeting with Accountant, 10 November 2026

## Reconciled Transcript

> Reconciled from three automatic transcripts of the same meeting. The speaker-labelled source was used for the dialogue sequence and attribution, then checked against the other two sources to improve unclear phrasing. Speech has been lightly cleaned for readability, not rewritten into a meeting summary. Where meaningful wording could not be established, it is marked **[unclear]**. Topic headings are editorial navigation aids; the conversation remains chronological.

**Participants identifiable in the transcript:** Donald, Greg, Sam, Michael, and Ben. Vanessa is discussed but is not identified as a speaker.

## Introductions and purpose of the meeting

**Donald:** Obviously, I'm not too sure what you guys had on your agenda for today. I mostly didn't prepare too much, but when you and I last spoke about the Xero...

**Greg:** Sam.

**Donald:** Hi, Sam. Hi, Sam.

**Greg:** Sorry, Michael.

**Michael:** Sam, how are you?

**Ben:** Hello, Ben. Nice to meet you.

**Donald:** Nice to meet you. I was just saying that when you and I spoke, and you were kind of unpacking how some of the Xero stuff worked, it was really valuable to have some of the visuals you had. And I've recreated those in a way that we can step through. And so I don't know if at any point that becomes relevant, I can plug in the computer and we can take a look at it.

**Greg:** Okay. My intent today was that we all get together, which I thought was a great idea, just to have a common discussion. We've spent a lot of time, Donald and I, so far on understanding the mechanisms behind the bookings and the scheduling for the system. And we're not done, but we've reached the point where I think we've done enough for the time being, and I'm keen to move into the other half of the system, which is how the money works, basically, through all the cash and banking and the receivables, and the distinction between the billing of the patients and the payments to the anaesthetists and so on. So I wanted to just talk to you today about the broad process that we're going to run down from here. My view is that while there's an amount of detail in the RFP, it doesn't drill into the really nasty bits of how it's all actually going to hang together, and will it actually hang together. And Sam and I are going to spend a few days, or whatever it takes, to draw some process diagrams about how that cash flow, or how those flows, work across the two systems backwards and forwards, but on the basis that Xero is really acting as an add-on to the AA application. It doesn't have a name, so I'm just calling it AA. And therefore Xero's just sitting there as a cash and banking servant, really. It does the payments, does the receipts, does the reconciliations, remittances, and so on. And we wanted to talk to you about the controls that are in place now or will need to be in place, or what we're thinking of doing, and also some suggestions for how we'd like to reorganise how that cash management works. So maybe I'll jump in there.

**Ben:** But also to get Michael's perspective as well because he's got a lot of expertise and he knows how the business works as well.

**Greg:** Yeah, absolutely. So I'll brief you on what we're thinking of doing, and I'd be very keen to get feedback about anything you think might be [unclear], because it's a new system, it's a new process. It's deliberately being designed to try and manage some of the weaknesses in the controls in the current system. And so what we're planning on doing is putting these diagrams together that describe the processes. And then before I hand them over to Donald to say, 'This is a good definition of what we're trying to achieve in terms of flows and information,' get you to critique it. We'll walk through it step by step with you and get you to critique it, see if it makes sense to you. And Sam and I spent the morning doing T-accounts and looking at the various limitations of Xero and where our tasks need to be done to try and make sure all the bits hang together properly. So the first thing we've got to do is do a draft of how we think it works. Then we need you to have a head scratch with us and see if you think that's all going to hang together. And then give it over to Donald, and then Sam's going to work with Donald, like I have with him so far on the scheduling, around the accounting, and they're going to put that into the work item definitions. It's a DevOps-type strategy with cards and breakdowns in it. And then Donald can take that through to some sort of prototype and/or finished product development with the dev team. Have I got that right?

**Donald:** Yeah, I mean, I can't imagine that we would be very opinionated about how this works, because it just has to do what you guys need it to do. There's not really space for, at least my understanding, too much playing around with it or being cute about the experience, because it's pretty mechanical.

## Scope of the accounting workflow and current trust-account payments

**Greg:** I mean, this is very much the mechanical side of the system. That's structured, and it has to do this and it has to do that. And there's almost no UI in the middle. It's just the integration. I'm taking that for granted, because it's well defined by Xero, it's well known by Stratos. It's what happens at each end that we're more interested in. So we did have some questions from this morning's conversation about how the process currently works. Maybe I can ask you to walk us through how that works. We're interested in the process, the delegations, the controls, and just how generally it works today. And we have a proposal that we'd like to change the cadence or rhythm of the payments cycle and change it to maybe a weekly bounded cycle, just move it one day so that effectively a week becomes a period and we can account for that to a fully reconciled amount before the payment run. So the payment run is always presented with a full reconciliation before the payments go out. So that's our target state. But maybe you could just tell us how it goes now.

**Michael:** I don't know if we'll get through all that today. Well, you're really talking about how the current system works in terms of Solutions Plus, really?

**Greg:** Yeah, from the cash and banking side. So you start with an invoice from there carrying on. So Don and I have worked up to the point where we have an invoice effectively. So we're picking the process up from there and going, okay, so what do we do now?

**Michael:** Yeah. I'm probably thinking in terms of how, probably, we would see it going in Xero.

**Greg:** Yeah.

**Michael:** Might be better rather than trying to think how it goes through Solutions Plus. And then, because I've mentioned to you when you were in last group that, you know, we've had some clients that we use Xero with add-ons, and also we have some clients that are using Xero to reconcile their trust accounts. So the way we, I guess, on a kind of fundamental level, probably start there: the money comes into the trust account.

**Ben:** Well, sometimes it gets paid directly into our bank account as well. Which we're going to change that.

**Michael:** Well, it'll all have to go through the one account. I don't, I can't see it working. It's just making it too hard.

**Ben:** It's a mess at the moment, but yeah, so we'll go through to the trust account.

**Greg:** That's the source of the mess, right? So we have to stop doing that. It will have to. I don't really care how much any of the anaesthetists moan and groan. It has to go through the one account if you want to be able to reconcile it.

**Ben:** Well, we did do that for a little while because we recognized the fact that we needed to be able to follow the money a little bit more effectively. But then Vanessa became completely overwhelmed with the banking because of the system. So we were like, okay, well, until we get the software, we'll go back to where we were.

**Greg:** Because there's a lot of transactions.

**Ben:** There's a lot of transactions, and she's literally going line by line, crossing them off.

**Sam:** So it's not going to be a shock if we suddenly say, 'No, you're not going to get directly paid; it'll come through the trust account.'

**Ben:** No, it's not a shock. I mean, it's been socialised and we were doing it. There were some people that would complain because it resulted in a couple of days delay in them getting their money, but they got over that pretty quickly.

**Sam:** Just thinking from change management, Good to know they've really done it before. It's fine.

**Ben:** It's not gonna be a problem. Well, it's not a problem, because the thing, it's better, because I'll have better visualisation of, you know, through the new software and through Xero, at the moment it's very opaque, it's very opaque.

## Invoice generation, Xero bank feeds and regular payments

**Michael:** Well, yeah, it's got lots of problems, hasn't it? So, I mean, the invoices are issued. We've spoken about that. The invoice would be issued through Stratos. Is that right? And then that would flow through into Xero, and then it would be emailed to the patient.

**Ben:** Can I ask a question? Yeah. Will the invoice be sent through Xero? Or through the software.

**Michael:** Well, I thought it was going to be through Stratos.

**Greg:** I'm proposing that it goes through the Stratos app because Xero hasn't got quite enough intelligence to do what we want to do with designing the various invoices we need to put through. So it would be easier to manipulate them in a customer.

**Michael:** Yeah, because the invoices need the anaesthetist's name and GST number, in theory, and have their details. Except their addresses will all be the same, but there's just some uniqueness about it, I would have thought, with AA's bank account.

**Ben:** AA's bank account. Yeah, okay. So the invoice is sent by the Stratos app, yep, and then the money goes...

**Michael:** The money is paid into the trust account. Then I would have thought that at that stage, because when the money is paid into the trust account, it's going to appear in Xero as part of the bank feed. So the day after—the way Xero bank feeds work, they go in overnight, and appear the next day. Then those payments will need to be matched to the invoice, which will be in Xero, and then that will also flow back to Stratos to be, well I'm going to say 'credited'—to be matched up, let's say, with the invoice sitting in Stratos. So that kind of deals with that sort of it. And then the actual cash will need to be paid to the anaesthetist. So again that becomes a payment, and I think that's going to work quite well, because Xero can set up batch payments. Then those batch payments can be exported into BNZ and just approved, and then they're gone. So that will take away quite a bit of time, I would have thought, because the way I understand it, [unclear: Cordy] knows more than me how the existing system works, but at the moment I think they have to do it kind of line by line. What we do in Xero normally is set up a ledger for every person. So we'd set up a ledger for every anaesthetist, and you would see the payment, from a cash point of view, going into that ledger when it's received, and then when it's paid out it would be going out. So in theory that ledger should balance down to nil, or if the staff want to dig down into why it hasn't gone to nil, they would be able to see the payments coming in and the payments going out and there would be a mismatch somewhere.

## Walkthrough of the standard invoice and payable example

**Donald:** I was going to say, this might be a good time to kind of step through this, because at least from what I'm hearing you say, again, this is really a weak area for me, but this is very much in line with what Greg had described the system was going to do. Right, so at the very beginning here we've got a procedure. This is what Greg was saying, where our system handles everything up until the invoice. And so from that invoice you see the patient getting a receivable invoice and Dr Nick getting a payable. So then you would see that—now this is where you guys need to check the work here; this all just comes from a transcript from a conversation Greg and I had—but the debt goes into the debtors account here, and the patient gets, you know, a debt record of $100, and then similarly the credit for Nick exists here. Stepping through again, the patient will finally pay that invoice. Then the credit goes to Nick's account up here. I guess that's the end of a real standard payment, right, in a situation where we don't have any prepaid stuff. And this next set here goes through a... Just pause a second. Does that fit what you're saying?

**Michael:** Can we just go back? We just need to step through this a little.

**Donald:** Totally. Let's go from the very beginning again. So the procedure in our system is created, the customer needs to pay $100, and so we would create some invoices.

**Ben:** So there's an invoice created by your system.

**Donald:** Yeah.

**Michael:** And that goes to the patient.

**Donald:** So there would be two, there's kind of like, there's two here, I guess. One is the receivable going to the patient and once the payable going out to an inesthetist. So. Again, there are records created. Yep, a credit here and a credit here against Nick. And so this is if I scroll here. Yeah, cool.

**Michael:** Sorry, so the debtor here, I agree with. I'm looking over here.

**Donald:** Yes, cool.

**Michael:** Yeah. So that's that's right. So that's. So that flows through from your system into Xero. And then, yeah, the other leg of it is going to be credit as well. It's really accounts payable. And yeah, that's right. And that could be, so I'm looking down here.

**Donald:** Yes.

**Michael:** So that could be, you can do in Xero, you can do like sub, you know, like Sub-accounts.

**Donald:** Sub-ledgers, is that what this is over here, right?

**Michael:** Yeah. Yep.

**Donald:** Yeah.

**Michael:** Yeah, sub-ledger for Dr Nick.

**Donald:** Yep.

**Michael:** Because I would have thought that we'd want the staff to be also to be able to dig down into that as well if they had to.

**Donald:** So one of the things Greg has really stressed is that Xero is quite bad at reconciliation. The idea is that our system will be holding the balance and mirroring everything that's going on in Xero, and there'll be no kind of private patient information in Xero that links back to what a procedure might be. But basically both our system and Xero need to be in sync, and all of the tools to give the admin staff or accountants or whoever else that visibility should exist in our system to show the balance of things. Does that sound right?

**Michael:** Yeah, yeah. Yeah, I agree.

**Donald:** Yeah.

**Michael:** Yeah.

**Donald:** And so obviously these, the plumbing in here on the zero side, the different accounts, if that's the correct term, you know, that's the particulars that obviously you're helping to advise on.

**Michael:** Yeah.

**Donald:** And you tell us if the right way yourself as well, you know, how this all needs to move and flow.

**Michael:** Yeah. Yeah.

**Donald:** But yeah, it will also be in our system.

**Michael:** Yeah. So I think that's all right up to there.

**Donald:** Okay.

**Michael:** And then the next part. That will be when the money hits the bank account.

**Donald:** Yeah, so that's here.

**Michael:** And then that will, so that will need to go against the, to be matched up against Dr.

**Donald:** So we see the debt, so step five there, we see the debt coming to here—the debit, rather—and the credit's gone here.

**Michael:** Yep, and then it will need to be paid from the bank account to the patient, to the doctor, I beg your pardon?

**Donald:** Isn't that what's just happened here? The step right here, is that money going into Dr Nick's bank up in the top right corner here? Out of the trust account? Maybe.

**Michael:** No, because we've got a step where the money comes into the trust account and that will need to be matched against the accounts payable.

**Donald:** Okay.

**Michael:** And then the actual cash is going to go to the doctor And is there another leg of that?

**Donald:** No, I think this one stops here and we move on to a prepaid patient, which we can I guess talk.

**Michael:** About in a moment. That's what I'm just talking about in Xero.

**Donald:** Oh, yeah, sure. So I kind of mostly expected some of this to be wrong, right? So poke any holes in it or tell us anything that needs to change.

## Separate the process flow from the accounting entries

**Sam:** I think you just moved a little quick.

**Greg:** Yeah, and I think you've gone too quick because we need to write this down so we have an agreed process and then you can model it. So That's what we're trying to do is to provide you with this complex and we need to get this process right and give you the process so that you can then build this model to see it working.

**Sam:** Because there's two sides. There's the process, and then there's the accounting. And quite often lots of people try and mash them together, but you need to keep them separate and actually agree the process and then check the accounting. So I find it easier to sort of map it out, the T-accounts on one side and then the actual process flow in a different diagram, and then you can see where it's going and see what the financial implications are of each step. I think that's what Greg and I were hoping to get, so that you've got like a wee pack of the flow and the accounting. And then you can actually see and follow it through.

**Greg:** Because there's about four or six key process types: the standard invoice, the prepaid invoice, and then some variations around how to roll back transactions or adjust transactions. And then we've got to think about some issues with the lack of controls in Xero, where it's very easy to pay an account by mistake. Because we can't post stuff into Xero and have it go on hold. If it's posted, it's actually been approved. The only way to have a posted transaction in Xero is to approve it for payment, and then it's like having your finger on the trigger. And if one of those records gets paid manually out of Xero, then the two systems stop balancing. So we're going to need to work out how we're going to repair things like that.

## Unidentified receipts, bulk remittances and patient identifiers

**Michael:** I think a big issue is going to be sometimes the money will come into the bank account, but they don't know where it belongs, who it belongs to.

**Greg:** Yes.

**Sam:** And also if the doctor changes on the day or something like that, when he's just, there's a few different.

**Donald:** Yeah, I mean, our side of the system is already expecting to handle that particular scenario.

**Michael:** Because sometimes they get these bulk payments from the insurers or the hospitals, and they can basically they know where 90% of it who belongs, but then..

**Sam:** The extra 10% you might want.

**Ben:** Is it to do with the reference numbers not matching or something?

**Michael:** Yeah, it can be, and also sometimes they might receive a payment from the police credit union. That's all it says.

**Ben:** And that's all it says.

**Michael:** Yeah, there's no patient number, there's no nothing.

**Ben:** How does a reconciliation work at the moment? So you're saying that there would be no patient data in Xero. So do you then, with this invoice, will each invoice get an invoice number?

**Greg:** And it's a billable party. And a lot of those private items will be the patient or the guardian.

**Ben:** Yeah, because at the moment, So the hospitals with their remittances might use the hospital number or something like that.

**Greg:** We're not going to bring the NHI number over into Xero. Otherwise, all the patient information will be there.

**Michael:** What about the name of the patient?

**Greg:** Yeah, we'll have to address the invoice to the patient name. So we'll need a name and an e-mail. And there may be more that would..

**Ben:** I guess that's my point, is that in here, is the reconciliation happening in here or in here or both?

**Greg:** The reconciliation is a function in Xero.

**Ben:** Yeah, but if it doesn't have the NHI or a recognizable..

**Greg:** It's got an invoice number.

**Ben:** Yeah, but if the hospitals are not recognizing, because we may put an invoice number on the invoice and the hospital will just ignore that.

**Greg:** Well that could get interesting if you get a single check from Southern Cross and it has well that.

**Ben:** Yeah, I need to have a look at what the reconciliations look like.

**Greg:** How many procedures a month would you would AA do at Southern Cross?

**Ben:** Yeah, lots. Let's have a look at some Southern Cross reconciliations, yeah.

**Greg:** So yeah I agree with you Michael reconciliation is a big deal and We can't let it slide. You've got to get every, you've got to nail it every week.

**Sam:** Do they send, sorry, you go.

**Greg:** No, that's all right.

**Sam:** Do they send you a remittance when they send the payment?

**Ben:** By e-mail, yeah. And it'll be a PDF with, yeah.

**Michael:** Yeah. Typically, yeah. In theory, but like I say, there are instances where a left field provider, like the police correct union or something like that, I think the New Zealand military is another one where they don't.

**Ben:** Oh, is that right? They just.

**Michael:** Yeah, they often don't know who that they've received the money, but they don't actually know who it belongs to.

**Greg:** Does it send them the statement? Or just, they just get a voucher and notices?

**Michael:** Who's that from?

**Greg:** Does AA send the Police Credit Union?

**Michael:** Or they would send this. No, I don't know, actually, in terms of statements. So they'll definitely obviously send an invoice.

**Greg:** They're just paying, yeah, so they're just paying invoices as they get them. They wouldn't know whether that was for them or not.

**Michael:** But that invoice could be from three months ago or something crazy. Yeah. But maybe, sorry, if we just go back to... I just need to think about this. So when the cash comes in, that's going to [unclear accounting explanation]. And then you're going to pay the doctor, so the credit, I think... [unclear]. We're going to have accounts payable, so we've...

## The matched invoice-and-bill pair and clearing account

**Greg:** We've got to bring the bill in for the doctor. We're expecting that we're going to generate a [unclear acronym: buyer-generated tax invoice]. So we'll generate the invoice—sorry, the buyer-generated tax invoice. We'll generate the invoice on behalf of the [unclear]. And then that will become the payable, and we'll load that as a bill. So you've got the invoice and the bill as a matching pair.

**Michael:** Yep. So from that, from here we're going to generate the bill. So a bill in Xero really equals accounts payable.

**Greg:** Yeah. And instead of having a sales or expense account, we thought we'd create a current asset called a clearing account, because the bills and the invoice should always run to zero. But we need a posting account for the Xero transaction, so we'll use a clearing account that should run to zero.

**Sam:** Okay, And then it's also a sign if there's money in it, you know, that something hasn't worked.

**Greg:** Yeah, it's an instant flag that there's something else.

**Sam:** Yeah, something's not worked.

**Greg:** Yeah, okay. So basically, when the invoice comes in, we're going to debit the debtor and credit the control account. And we're going to credit the creditor, the anaesthetist, and debit the control account. So you end up with the anaesthetist and the patient in terms of payer and payee, and the clearing control account should always be zero.

**Michael:** Yep.

**Sam:** Sort of the quickest way to say you're out of sync.

**Michael:** Yeah.

## Prepayments and possible holding-account approaches

**Greg:** So it's one of your quick checks. The other thing we've been nutting out is how to manage prepays, because we want to change the current prepay scheme, where the anaesthetist gets paid when the money arrives, to one where it's held in the trust account and paid when the procedure is executed. And the reason for that is that sometimes the anaesthetist changes or the procedure gets cancelled and needs to be refunded. And if that's in an anaesthetist's account, it gets really messy. So we just put that in another clearing account, effectively. And to do that, we thought we'd create a supplier called 'prepay account' and never pay it. So when we invoice for a prepay, we bill the patient. When the money comes back we credit the patient, but we debit—instead of debiting the anaesthetist, because then he'd end up getting the money—we debit the prepay account and it sits there and is released by the subsequent [unclear].

**Michael:** In those prepayments, there's no Is there it must be an invoice that is sent to the.

**Greg:** So it's a normal invoice.

**Michael:** So it's a normal invoice, but the contra the money is when the money is received.

**Donald:** Yeah, we can step through it just a minute.

**Greg:** And then instead of it going straight to the anaesthetist, we park it in a holding account. And rather than using a GL control account for that, we're using a creditor's account for that, because Xero [unclear: only lets us operate one control account].

**Michael:** I don't know the ins and outs, but would it be better to having that go to not go to an accounts payable amount?

**Greg:** Well, it would be better if it sat in current assets, but you still need a breakdown of it, right? Or current liabilities, actually. But you still need a breakdown of it, and so you want the analysis of, okay, we've got X thousand dollars in prepayments, but who does it belong to?

**Michael:** So in say in Dr Nick's account, it would be sitting there as a credit.

**Sam:** This is where we're sort of still fine tuning the details of it. Because if we use the creditor account, then we still need a reference to the surgeon or the, sorry, the anaesthetist.

**Michael:** I would need to sit under that anaesthetist.

**Sam:** Yeah, that's the question we had for you. Because that might slightly change what, how we treat it. Because the issue is if we have it in Xero, then it's, and to post it, it's authorized. But if it's authorized, it's going to come through on the payment run. So, but you don't want to pay it because it's obviously the operation hasn't happened yet.

**Greg:** So it's sort of an accident waiting to happen.

**Sam:** So yeah.

**Donald:** And the anaesthetist could change.

**Ben:** Do you credit it to a, yeah, well you're saying another entity.

**Sam:** So we're saying we sort of put in like a sundry anaesthetist and it would sit under there until that's been happened. And then it gets assigned to the anaesthetist.

**Michael:** Yeah. Well, it could, should it be I'm just wondering whether it should be sitting in another liability. Until it's ready to be paid out.

**Greg:** Well, you could park it in a GL account.

**Michael:** Yeah, sorry, this one.

**Greg:** You haven't got any analysis on it. Oh, when you get the analysis from the AA, it's just another account you need to reconcile. So that's what we would.

**Sam:** Yeah, this is what we were sort of tossing at about this morning.

**Ben:** What about if the, it's a slightly different process. What if, so the prepay, the patient pays the prepaid, it gets put into the trust account, okay. Then the trust account, we could set up another bank account, pays it into another bank account under AA. You could. So then you've got to do zero at the end of your banking run. So it's this, so we have another, you know, an 05 account or whatever. And then on the day of the procedure, the anaesthetist then generates another card or generates the card or a card. And that's effectively invoicing AA to say, hey, give me my money. Exactly. And so then, and then it could go back through this process and then that I don't know.

**Michael:** Yeah, but I suppose it becomes another bank account to manage and control and reconcile as well.

**Sam:** And you've also got to align the whole if, I guess it's prepaid, so the money's already in the account.

**Greg:** Yeah, but it's two bank accounts. It solves one problem because it creates separation, but it creates other problems because it's separate.

**Michael:** Yeah, that's right, it does, yeah. And I think, I mean, I'm always telling these jobs, yeah, remember a trust account, okay? The company is holding the money on trust. That's not the company's money. It's holding it on trust on behalf of someone else. So we're kind of parking it within the account for someone else. But the issue that we've got is that there's need to be some control around that account and how that is managed.

**Greg:** So we thought that the simplest way for Xero was to have one bank account, but to have a sundry creditor, which is the holding account, effectively. So instead of having a holding account at the GL level, we've got it at the sub-ledger level.

**Ben:** So it's GL level.

**Greg:** As a main general ledger account for Xero.

**Michael:** I think it will end up being a general ledger account rather than a sub-account, a sub-account of, it'll just be a sub-account of, or a sub-account for that anaesthetist. Is that what you're really thinking?

**Greg:** We weren't going to use the Xero GL sub-accounts. We're just going to use the GL creditors to create the sub-accounts, because that's where all the activity occurs, and it's where you receive money to and pay accounts from. It's more of a natural fit to have the creditor as the sub-ledger entity rather than actually have a GL sub-account.

**Michael:** Within the bills.

**Greg:** Yeah, because it's a simpler construct for Xero. Otherwise you've got to move stuff around by journals and actually you can't raise journals easily through the API, through the connection. You have to do that in Xero. So then you're back to a whole lot of manual pushing.

**Michael:** Well, that's where I was actually just coming to, as an issue, because if If we parked it in another account, then it'll probably have to be cash journaled from that account against the bill.

**Greg:** That's right. Whereas if you put it in a sundry account, we can deal with it automatically and just move it basically.

**Michael:** So potentially every anaesthetist might have a prepaid sub-account.

**Donald:** Can you move? Is there any issues with moving between those sub-accounts, the money around?

**Michael:** I don't know, I'd have to go back there.

**Sam:** Would you need that on an anaesthetist level, the prepaid, or could you have one big?

**Michael:** Well, strictly speaking, I don't know, because really it's going to come back down to the volume of transactions. If we're talking one prepay a week, Well it's only 50 odd a year, well then that's not going to be a problem. If we're talking 100 prepays a week.

**Ben:** Probably about 20 prepays a week, I think.

## AA as the master system; Xero as the banking and accounting service

**Greg:** The other aspect here is that some of this balance management needs to happen in the AA application. So Xero is always thinking about the patient in terms of where the money's coming from. It doesn't have an analysis, if you like, of what is owed to the anaesthetists, and that's going to be held in the AA app. So we could have the prepaid amount managed in the AA app, because the intent is that when the anaesthetists look at their ledger status—what they've earned, what's outstanding, what's prepaid—that query will go to the AA app and get that information. And what's happening under the covers is that it's always being synchronised and reconciled with Xero so that they're right. So we want some fairly straightforward, very obvious controls on a dashboard that show that all of the accounts that should balance to zero are balancing to zero. So you've got this little reconciliation box that says, 'Yeah, we're good,' or 'No, we're not.'

**Michael:** Yeah, which will just sit on the dashboard at Xero.

**Greg:** Yeah, that's on the dashboard of the AA app, actually.

**Michael:** But it'll have to be reflected somehow, because the cash would have gone into Xero.

**Greg:** I mean, ironically, Xero's rather dumb for what we want to do here, so we'll treat the AA app as the master and Xero will just do what it's told. That way we haven't got any logic operating in Xero. We're not trying to build any smarts in Xero; we're just using its standard out-of-the-box features, and all the smarts are living on the AA side.

**Michael:** So getting back to your question, Sam, the transactions, of course, a user could go on and edit the transaction. Edit the first match of where the money has gone to. Look, if it's gone to Dr Nick, as his prepayment when it should be Dr. Ben later, that transaction can be just simply edited. And again, we need to think about controls around that.

**Sam:** I think the main thing we were discussing this morning was potentially doing those changes in AA and getting them to pull across into Xero. So then you can lock down Xero a bit more, so the actual transactions aren't [unclear]. Yeah, that's what we were discussing, wasn't it?

**Greg:** They don't do any manipulation in Xero. It just is always reflecting what AA is telling them to do. Okay, right. But the thing you do do in Xero is, I'm imagining that Vanessa will sit down and do the bank reconciliation every day, and there'll be automated tools there to help that reconciliation work. So when she gets the big reconciliations from the hospitals and so on, anything that's matchable will match, and it'll do that really quickly, and then it will just leave her the bits and pieces to clean up.

**Michael:** But what we've found is that, you know, the user would have to check that the matches make, that they make sense.

**Greg:** Well, it'll be reference and amount.

**Michael:** Yeah.

**Greg:** There's usually three things.

**Michael:** Yeah, we have to say, I think Xero's on three [unclear].

**Sam:** Yeah, three [unclear].

## Daily reconciliation and existing payment approvals

**Greg:** So we're planning on using an English Xero add-on that specialises in reconciliation, that will pull in the remittance from the hospital, read that remittance, and then match to the banking and do the initial matching. So that's all automated, and then present Vanessa with, 'Well, this is all matched, and this is all unmatched. Can you help me with these ones?' She'll go through and sort all that out, and then when she presses it, it will create the matching journals and off it goes. And then she'll do that every day. She can check that the bank is all reconciled. And I'm working on the assumption that the payments are going to be made out of here. So that's a second step where the cash out will come from someone other than Vanessa. And we're going to ask you what the current delegations and authorisation process is for how you do your weekly payments, what controls you've got around that.

**Michael:** Really the controls are that it's just separation of duties. So that's all done in the office. We don't have any involvement. So it's just separation of duties within the office?

**Greg:** So someone does the banking and someone else does the payments.

**Michael:** Yes, yes. And then it goes to one of the directors to authorize. And then, but I don't, sorry Ben, I don't think you would look at it, if you're authorizing it, you wouldn't look at it that closely. What do you get?

**Greg:** What do you get? When that weekly payment comes through.

**Ben:** I get basically asking to authorize a weekly payment and I can then click through and then I can scroll and to see if there's anything unusual. But you know, normally something unusual would be like a bank account that's not like an unusual bank account or something like that.

**Greg:** And you'd look for that.

**Ben:** Well, I scroll to see if there's any names that are.

**Greg:** Oh, okay. One of ours. Yeah, sure.

**Ben:** But somebody could say Ben [unclear surname] and put a different bank account, and I wouldn't...

**Greg:** No. And of course, once you've created the bank account, you can even you know.

**Ben:** But the only people who can create the bank accounts is the directors. Like at the moment, so when there's a new and it just comes on, I'm the only person I think that can actually Create the bank account.

**Greg:** Yeah, okay.

**Ben:** So yeah, so Vanessa can't.

**Greg:** That's good.

**Ben:** So Vanessa can't. Yeah, okay.

**Greg:** But so you've really got better all to check. There's not a lot you can cross-check in terms of whether that schedule has any quality in it, right? Because there's not a lot you can control.

**Ben:** I don't have the capacity to check it. It's just basically, I'll press it.

**Greg:** You're not given anything to check, are you? I mean, you're given a list.

**Ben:** A list of payments.

**Michael:** Well, you're given a final schedule, it's so you can't actually go back.

**Greg:** No, so while you've got some physical separation-of-duties controls, you haven't really got any controls around that process. Because there's nothing that can tell you all is well and you should be okay to pay that. And I think that's what we've been specifically driving towards: to provide you with some sort of ledger, key accounts in a ledger, that would automatically identify if anything was out of balance that should be in balance. Because one of the things we want is to stop a payment run going through if the ledger isn't reconciled, because you're just starting to compound the problem. And it might be inconvenient or difficult, but basically you want Vanessa to be in a position where she's not allowed to present you with a payment run that doesn't have a reconciliation statement with it, that says all these accounts are square and we're good.

**Ben:** Or they wouldn't ever get paid.

**Greg:** Part of the changeover is that we're not bringing any of this crap over. So a new account, a new process, and clear from day one, and never allowed to [unclear].

**Ben:** Classic, I was chasing up an account just earlier this week, actually just on Monday. I just said, right, the accounts team, so they crossed it on notice as an account that hasn't been paid. Since February it's still appearing on my screen, that it's, you know, can you just have a quick look at that? And he emailed me and said, Oh yeah, that was paid in April. And I'm like, Oh, okay. So it's obviously sitting there in the trust account and.. That's what it's for. Yeah, so it hasn't been allocated because it hasn't been ticked off. It's obviously just been a line that was missed.

**Greg:** Yeah, okay. So one of the things we'll do is..

**Michael:** We need to think about those controls I'm keen to think about those controls quite carefully, because they do need to be strengthened. And we've just got to think about, from a practical point of view, what the best way is to approach that, because remember, the office is trying to get the money out to be an advertist. And I often, just the feeling I get, they might sometimes get under pressure. The payments, we need it to get it by to one of the directors by, X time. And there's not much time in between.

**Donald:** Ben gets really angry.

**Michael:** Yeah. Well, and I'm just picking up on that.

**Ben:** I get phone calls going, where's my money? Sometimes.

**Greg:** I'm sure you do.

**Ben:** Yeah, it's like, well, there's been a delay because of X, Y and Z, you know, the Solutions Plus system's gone down, so we've had to [unclear].

**Greg:** Yeah, Vanessa's in South America.

## Proposed weekly accounting and payment cycle

**Michael:** But just picking up on, Greg, what you said right at the get-go, was that I think there's one thing that could be brought in would be to change the the timeline of the payments to give them more time.

**Greg:** Yes. So what I'd like to do is align the cycles with European weeks. So basically, we don't use it much here, but it's very common in the States and Europe to use week number as a counter through the year. And it's in the diary, you know, it turns up in Outlook diaries. So basically that's your start and end period, and then I was going to say Mondays to do the reconciliation and Tuesdays to do the payments. If the system is running clean, that should be enough time. But it could be Monday, Tuesday to do the reconciliation and Wednesday to do the payments. It wouldn't really matter, because it's just a one-time shift.

**Michael:** Yeah, I know, but we've got to build the right expectation in the anaesthetist.

**Greg:** Yes.

**Michael:** Because otherwise... Yeah, yeah, but it's a one-off. So I don't know.

**Greg:** I'd say Thursday, you know, from the Friday or the Monday to Sunday. Monday to Sunday.

**Michael:** Yeah. And pay it on Thursday. It gives you four days.

**Greg:** Yeah, so if something's wrong, you've got time to dig down and find it. Yeah, I mean, you'll find out it's wrong on Monday, but then you've got to fix it.

**Ben:** It might take a few days, because it might take a bit of emailing. The various accounts departments of the different hospitals.

**Michael:** And sometimes that goes merely well, and other times if someone's away or it's not being..

**Greg:** One of the issues is we don't want to carry forward items in a reconciliation. We want a clean reconciliation.

## Handling unresolved payments and reconciliation exceptions

**Michael:** Well, I think that needs to be addressed as well in terms of the money comes in that is un.. We don't, they don't know who it belongs to.

**Greg:** Well, you need a good process for parking it, that's for sure.

**Michael:** Yeah.

**Greg:** Because you've got to, at some point, you've got to go back and clear that and not just let it compound.

**Michael:** Yeah. So that process, we'll need to talk about that process as well.

**Greg:** I think part of this weekly payment cycle is an examination of, you know, what is unreconciled and why and what's happened about it. You know, and why is it 3 weeks since this was carried in the reconciliation and why hasn't it been resolved?

**Michael:** Can that come through on some kind of calendar basis on the AA side of it?

**Greg:** Well, it should come up in the dashboard as an alert that it's an item to be resolved. But then it's up to a management role to say, well, to have that information available. It's one thing to scan the payments going out, but it's another thing to say, well, actually, if we've got a reconciliation item here, how are we managing this down to zero? What's happening? And Ben or someone else has to start getting on the phone and ringing hospitals and so on to say, 'We need this reference,' because it's always a payment reference. It's not a debt collection, it's always an incoming—although that's not always true, but...

**Michael:** But well, I'm for more of a split between governance and management. So I think that really falls in the management side of things, do you? Yeah, rather than rather than wanting to do it.

**Greg:** It depends who's signing the check. I'm saying responsibility lines with who's signing the check because they're the gatekeeper that says, you know, why am I signing this check with all of this unallocated funds sitting over here?

**Michael:** Yeah, but then that goes back to.. The management, they've got to fix it.

**Greg:** That's why I was saying Vanessa's standing orders: don't give me a reconciliation that's not zero. And that's a culture of expectation that's been lost at the moment, and that has to be reinstated.

**Ben:** Well, it's just that they don't have the capabilities to the systems in place to be able to achieve it. So that's not their fault.

**Greg:** No, I'm not saying it's their fault. I think the system is impossible for them to win at the moment. But once we put a new system in, I think it's one of our baselines, you know: it has to operate this way.

## Credit notes, reversals and invoice corrections

**Michael:** The other thing that Xero is not good at is dealing with credits and adjustments flowing back into AA, if you like. And we see it all the time, because we use an add-on even internally here for doing invoices and things. If we put a credit through for a client in Xero Practice Manager, that doesn't flow through to...

**Donald:** Even with your extension, you're saying.

**Michael:** No, no, it just doesn't flow through. And I know in other add-ons as well. We've got clients—there's a construction add-on called Fergus, and that's the same thing. They generate invoices from Fergus, but that won't flow through back into Xero, what we call blue Xero, into normal Xero. The one with the blue banner on it.

**Donald:** Yeah.

**Greg:** I've never understood how Xero got away with this. It's an accounting system that can't handle credit notes.

**Michael:** No, yeah, it's real pain. Yeah, it is. And that's a very common question from clients: Well, why aren't we reconciling? Yeah, and that's the reason normally.

**Donald:** So, what's your recommendation for how to solve that?

**Michael:** Well, I don't know. It needs to be able to flow through.

**Donald:** Yeah, sorry, it sounded like you were saying the trouble is Xero communicating back, but now you're talking about the system speaking to Xero?

**Michael:** System speaking to Xero. Yeah, so normally when we talk about an add-on, we usually talk about the add-on, Xero being the main source of the universe. Yeah, that's right. So it is for accounts, I suppose, but the credit is generated in AA.

**Donald:** Yes.

**Ben:** Yeah, what context would a credit be?

**Michael:** If an invoice was generated today to the wrong account, to the wrong account or the wrong amount.

**Donald:** A prepay that got cancelled.

**Ben:** Okay.

**Michael:** So it would need to be credited out because we're.. We're not, when we're talking to clients, we're not telling them to make an adjustment per se. We're saying, best way to go, put through a credit note, take out the whole invoice, and we'll start again.

**Donald:** And that's what Greg and I have been talking about as well in the system, is that there could be a number of different scenarios that get you into a configuration that's wrong, and we believe the safest is to credit, start again.

**Michael:** It's the most correct way to do it for sure. So I don't know.

**Greg:** I've done, we've done some research on it, but we're going to test it. We're going to put it through a demo system and test it to make sure that it's going to work.

**Michael:** Yeah. Okay. Yeah.

**Sam:** We haven't forgotten about credits.

**Ben:** Then adjustments. So if I want to adjust someone's invoice.

**Michael:** Yeah, I was, that's right.

**Donald:** Normally that would happen before it gets into Xero.

**Ben:** Yeah, but somebody might ring up and say, some tale of woe about how they can't afford it to pay. They say, well, okay, we'll just pay half and that would be fine, you know, something like that.

**Michael:** Yeah. So there needs to be a procedure around that.

**Greg:** Yeah, credit out and reinvoice.

**Michael:** Yeah. And then it's all trackable, it's all like in Xero, it's all tracked, all the history is tracked by user, so you can kind of look back through that, but hopefully you won't need to do that because that'll all be reconciled out.

## Walkthrough of the prepaid scenario and correcting the diagrams

**Donald:** Perhaps just for my benefit, could we step through the prepaid process, and then you just stop me where my current understanding is wrong? You guys have said some stuff today that I didn't fully follow, and that's okay. You guys are here to have those answers. So, second procedure here, this one's prepaid. Our system would create the receivable invoice to the patient, record that against the patient's debt in the debtors ledger, and then the patient pays. That one moved quite quickly; we'll do it again. The patient pays, so the debt comes in here. And then I guess at this point there is a credit coming into this credit account and going into the holding account. So that's the prepayment coming in.

**Ben:** What do you mean by holding account? Is the account, is that just within Xero or is that?

**Greg:** Sundry creditor in Xero.

**Ben:** It's in Xero, right? Because the account, to me, means a bank account, but it's not a bank account. No, it's not a bank account. It's a Xero...

**Greg:** It's not even a Xero account; it's a Xero creditor. So it's the equivalent of an anaesthetist. It's just a...

**Ben:** So it's getting into a holding back. Yeah. And you were saying that you could have that for each individual anaesthetist or you could have just a general..

**Greg:** No, just one.

**Ben:** Just one.

**Donald:** We did propose the idea that maybe one per anaesthetist, but this model's just having one at the moment.

**Michael:** Yeah, I wonder, but again, we come back to here, how we..

**Sam:** It's something we probably need to have a look at in more detail and actually see it working before we make a decision.

**Donald:** Yeah. And then moving on here, once the procedure is done, you see it transfer from the prepaid over to being here.

**Ben:** So then when I, so practically from my point of view on my app, when I do the procedure, I go, yep, done. And then the message will get through somehow through the system.

**Donald:** Yeah, so when you hit done, it goes to the office. And when the office says approved, that's when it comes into what you're seeing on screen here. So if we play that bag all the way, so the procedure is booked, the patient is sent an invoice.

**Ben:** The invoice comes in.

**Donald:** So that is, I guess, the invoice going out. Or I guess it says submitted to Xero. Again, there's probably some steps in here that'd be nice, but yeah, I guess that's the idea is that Xero receives it.

**Sam:** When you create your invoice though, you've missed a step, because you've got—see how you've got sales? Yeah, it should lead off to zero.

**Donald:** This was back in this one here and Greg, when he demoed it, again, I did this very quickly before the meeting here, but Greg made it very clear, like all of these things are meant to even out and I don't know what step in invoice one here or procedure one, it's missed.

**Sam:** Yeah, so it's when you bring in your bill.

**Donald:** This one here, you're saying? Maybe? It's paid to Nick.

**Sam:** No, so before it's paid, you need to bring the bill in.

**Donald:** Sure, okay.

**Sam:** So that's what should come in to your creditors and it should be like a negative sales.

**Donald:** Nice, here it's step four, I guess. So paid and release a payment.

**Sam:** But in Xero is a bill, step three.

**Donald:** Okay, you're saying back here.

**Sam:** So see, you've only got one side. You've only got it going into the debit.

**Donald:** That's right. So let's go back to the beginning here. So we're back on a regular procedure, not prepaid. And so the procedure is authorized. Invoices are created, receivable and payable for the patient and for Nick.

**Greg:** Invoice and bill.

**Donald:** Invoice and bill. Yep. Thank you. Then at this stage is submitted to Xero. So you see.

**Sam:** So you're already, you're out of sync. So you've got your AR as your debtor and your sales.

**Donald:** Here.

**Sam:** Yeah.

**Donald:** Okay.

**Sam:** But you don't have another side to your accounts payable, so your creditor.

**Donald:** You're saying there should be one here?

**Sam:** No, there should be another.. Oh, here.

**Donald:** Sure, okay, it's step three. Okay.

**Sam:** Yeah.

**Donald:** Cool.

**Sam:** Would it be better if we went through this together first?

**Donald:** I mean, you guys are going to go and do all that.

**Greg:** I think you're jumping ahead too fast here, Donald. I think it'd be better if you just let us get it all documented out, because it is quite subtle.

**Michael:** And you're just going to go through it step by step.

**Greg:** And then you can just put it in here and nail it. And I look forward to seeing this work.

**Michael:** It's quite a good tool, what Donald's using there. They all need to be consistent with what we see in Xero. Like I was saying about accounts payable, that's really called a bill, you know. So it'd be good to use the Xero language.

**Greg:** Absolutely. Yeah.

**Donald:** This is custom. So we just made this. So yeah, I think it's for me, obviously things that are..

**Greg:** A tutorial on T-accounts, so well done.

**Donald:** Yeah, I think everything in here is just based on a transcript from what Greg was explaining to me on a whiteboard. And so to me, stuff that's visual is really important, and so I wanted to see these things moving around. And you're totally right that I did catch throughout all of this that this here did not get levelled out.

**Sam:** Out.

**Donald:** But I guess the particulars here in terms of it coming into a holding account before it gets moved. Let's go back a step and do it again, until it gets moved to bins. And then when it's all evened out, you see everything even except for all these steps in the sale stuff at the end here.

**Greg:** So when we give you the process, this will be a great tool to step through. If you can slow the animation down, be good. To step through each step to see how the journals work. Then it will be a very good tool at that point.

**Sam:** That'd be great.

**Michael:** Because we also want to think about the detail in those journals as well. What are showing in the, ends up showing in the ledges?

## Cross-linked records, Xero add-ons and batch payments

**Greg:** The other thing is this is all, these have all got identifiers in them that link them straight back to an entry in the AA side. So you can go back and when you click on here, can go back to AA and pull up the source document. The anaesthetist is going to be able to see their documents for their month or their GST period and get a report. And that'll all be housed in AA. So this is, if you like, a reflection of what's happening in AA. And it's all cross-linked, so it goes both ways. And how this works is that, especially with the banking, anytime a transaction is touched in the banking, it notifies AA that there's been a change and AA goes and does the syncing. So AA is where all the smarts live. And this is just very mechanical on the Xero side, except that we're going planning on putting two add-ons in, one for being able to digest the remittance advices and analyze them to automate the bank reconciliations.

**Ben:** So will that go straight from like an e-mail inbox or something? Or we create a new inbox.

**Greg:** Yep, just add a new inbox and it will go straight into the cloud somewhere, and then push it back to Xero. The other one is, we need to double check. Last time I was using Xero it couldn't do—it made a pretty awful job of bulk payments. So we've got another small add-on from Australia. I can't remember which one's English and which one's Australian, but it does bulk payments. So it's a much nicer screen to work with that lets you manage your payments that need to be done, and then you can send that off and it will be...

**Michael:** Yeah, and... Do you use it at all? No, we don't, because it sits in the bills section of Xero, and then you're basically ticking which bills you're paying and it generates a file that's imported into BNZ. So yeah, that's how we do the creditors or the bills for AA at the moment. It just comes through as an [unclear: 'A5'] file.

**Ben:** Yeah.

**Michael:** And then it's just paid from there. I keep thinking about things.

**Greg:** That's the idea.

## What to do with receipts that cannot be matched

**Michael:** Yeah. So for example, if on the main dashboard of Xero, if the bank account, if the If everything is not matched, it comes up as not being reconciled. Yes, that's right. So I think that's, I'm just wondering as a concept, we're trying to sell to the staff that everything needs to be reconciled. So they need a place to put every, even if they're dissecting an amount coming in, They need a place to.

**Donald:** So who's the they?

**Michael:** The staff, sorry.

**Donald:** So anaesthetists looking at their apps.

**Michael:** No, the office staff.

**Donald:** Office staff, the admin staff, okay.

**Michael:** They would need, I suppose I'm coming back to it a wee bit, the amounts that they don't know where it belongs.

**Donald:** Unaccounted for.

**Michael:** Unaccounted. Yeah. So then if they put that to an account in Xero, a holding account or whatever you want to call it—probably that's not the right description—but if it goes to a holding account, then okay, they see that the bank account is reconciled, but they've still got to clear up all these amounts that they don't actually know who they belong to.

**Greg:** Or you can leave them open on the reconciliation, because that's our [unclear].

**Michael:** Or that would be unreconciled. The bank account would be unreconciled.

**Greg:** That's exactly correct, isn't it?

**Ben:** Well, you're saying you wouldn't do the banking until it's still reconciled?

**Greg:** Well, that would be my bottom line. I'd want to know what the problem was before I was happy to make payments.

**Michael:** It would have to be like a known, you know?

**Greg:** Yeah. I mean, the good news is that because of the nature of the problem, You're always on the right side of the equation in terms of not being able to pay more than you've actually got in a bank account. But then the problem is you've got all this money floating around in the trust account that you don't want to deal with. And you really don't want to let that run for too long. So you want the staff to be highly motivated to get that sorted and not just park it because they're busy. It's got to be a priority for somebody.

**Michael:** There need to be a.

**Greg:** I'm going to go back to Vanessa about, I'll have a look at some of these recs and remittances to see how bad the problem is in terms of the remittance advice is not being specific enough to match. And that's the first thing we need to try and sort out is how big a contributor is that factor and see if we can get that done. Because that's just laziness at the hospitals even, basically.

**Ben:** Well, the main, like these are, this is an example of remittance advice. So you just have, you know, names, a reference number.

**Greg:** Yeah, but what about the remittance advice you get from Christchurch? Oh, you don't get it, do you? Oh, do you get a remittance advice from someone like that? Who's that from? Sorry.

**Ben:** That was Forte.

**Greg:** Oh, that's all right. Sorry. I dismissed that wrong. Can I have another look?

**Ben:** Yeah. There's very.

**Greg:** Little in there that you couldn't reconcile because it's got a reference number and an amount on every dollar. So that's not where the problem is.

**Ben:** No, it's not. I think it's just, as you say, sometimes money just pops in without a remittance advice or maybe a line in the remittance advice was missed.

**Greg:** Well, yeah, patients are notorious at that. I mean, that was a massive problem at Pacific Radiology, where the patient will not always deposit...

**Ben:** Yeah, without a reference number.

**Greg:** But what this remittance tool is going to do is it's going to bring you up every transaction with that value that's unreconciled. So that just helps you narrow the list down.

**Sam:** We also probably want to design a sort of a what to do for Vanessa. So, you know, the steps. So if it doesn't work, what do you do?

**Greg:** Yeah, well, again, I think it could well be that the problem is your patient..

**Ben:** The patient's just popping in money without a reference.

**Greg:** Yes.

**Ben:** Yeah, and then also if it's not the correct amount as well.

**Greg:** Yeah.

**Ben:** They might have a $1800 bill and they pop in 1200 or something.

## Online patient payments and invoice payment links

**Greg:** So there are two questions that came out of that we had.

**Ben:** How do you, how do you work that out?

**Greg:** Yes, two questions we had this morning out of that topic. One was, if we raised or dispatched invoices out of Xero, you could use the credit card payment feature that's in Xero for retail, and that really nails down the cross-reference problem, because you can't put in [unclear].

**Ben:** I must say that is actually a pretty nice feature.

**Greg:** And the other one is small differences in payment. How do you handle them, overs and unders?

**Ben:** Could we get a merchant account feature on the Stratos app?

**Greg:** Yeah we do we could do that.

**Ben:** You know, just team up with Paymark, or whatever it's called.

**Donald:** And so what, who, what's the use case, sorry.

**Ben:** I'm just thinking in terms of a patient wanting to pay, you know, like having an online payment portal.

**Donald:** Oh, sure.

**Ben:** You know, and then that would be, from our point of view, if it's matched to an invoice, then it's all...

**Sam:** Done.

**Donald:** You don't need to rely on the patient to put their ID in, do you?

**Michael:** Yeah, the main one Xero uses is their Stripe.

**Greg:** So the thing about the Xero option is it's all there and it all works and it comes straight back in.

**Ben:** Yeah, I've seen the Xero ones.

**Greg:** So I don't know what the fees are like, but it's a nice feature for our retail customer.

**Ben:** But you're saying that you wouldn't invoice using Xero?

**Greg:** Well, I'm saying that's one of the things we have to decide.

**Sam:** That's probably a decision, yeah, that we need to look at pros and cons.

**Michael:** I'm sure whatever you pay in fees, it would come back in productivity, you know?

**Sam:** Yeah, because as soon as you hit that Pay Now, it's already matched it to the invoice and things, so your reconciliation is a whole lot easier.

## Rounding differences, partial payments and split billing

**Greg:** So when you get small unders and overs, how do you deal with them?

**Michael:** They usually just get put into a rounding account. But then, of course, the thing is, in a normal situation that's a trading business, where if it's under or over it will get written off, so it comes off their sales effectively, or written on and gets added to their sales. Here we've got a trust account where we've got a specific amount. So do we, if it's by a couple of cents or something, need the ability to adjust the invoice up or down? I don't know. Sorry, I'm just putting it out there.

**Sam:** No, that's why we were sort of asking what you do now.

**Michael:** Well, yeah, that's what happens now.

**Sam:** Sorry, now you adjust the invoice, or you just put it into your [unclear]?

**Michael:** I'm just trying to think from a trust account point of view. If it's only a few cents, we would... Well, we just usually get rid of it, and it gets taken into the client's main trading account.

**Greg:** Yes, that's what I was talking about. So maybe once a month you just accumulate them into an [unclear: overs-and-unders] account, and then at the end of the month you do a transfer from your trading account and it keeps the trust account zero.

**Michael:** And it would probably go to somewhere like bank fees in the in the operating account of in or out of..

**Greg:** And you just need a policy threshold about what you do for anything over $9, or whatever.

**Michael:** Yes, yeah, it would make a bit, yeah.

**Greg:** It's not worth it, it's not worth sending out a refund.

**Michael:** If you're talking, yeah, you know, like under $0.10, it's not worth worrying about. I don't know where's the threshold, what would be a material amount?

**Ben:** What about partial payment plans? There's one thing the room spoke about: people who want to pay $50 a week or something. Is that easy to sort out?

**Greg:** It is for us.

**Michael:** Yeah.

**Greg:** Because we're putting in the payable for the anaesthetist, like $1,000, and if there's a plan in place, as each payment comes in that's paid, and the balance is just reduced.

**Ben:** Or another thing that happens is a partial payment by the insurance company. So you might bill an insurance company and then there's a little bit left over that needs another invoice raised to the patient.

**Greg:** Yeah, so we have asked about that before. I mean there was a lot of 80/20 going on in radiology and that's normally two bills. So you would raise an invoice to the insurer and you'd raise an invoice for the balance to the, and that would be something Vanessa would do.

**Ben:** Yeah, sometimes it's only in retrospect you realize that they're going to get a..

**Greg:** So that's when you roll back, roll back the original transaction, and reissue a split one. We've talked about that quite a bit. Yeah, but I think, really just commenting on what Donald said earlier, our universal solution is roll it back and start again, and I think that's cleaner. You can see the contra and then you just see it in your account.

**Michael:** Yeah. But the system would still need the ability to do. There might be situations, I don't know what that would be, but I think it would be good to have the ability to do some kind of adjustments.

**Greg:** Minor adjustments or just general adjustments you're talking about? Can you give us some use cases?

**Michael:** Yeah, good. Yeah, no, I can't.

**Sam:** Are you thinking like what Ben was saying is someone rings up with a sob story?

**Michael:** So in that situation, but in that situation, I think we'd be saying roll back the invoices and recharge the agreed amount.

## Next steps for process diagrams and accounting review

**Greg:** I need to go for a 3 o'clock appointment, but I think it's worth continuing the meeting if you've still got a few more questions.

**Sam:** Yeah, I'm that's all my sort of questions, but was there anything? So, if you could think of some of your adjustment use cases, but it might be worth putting some policy around it though, so you can adjust if.

**Michael:** I just probably need to think it through a bit more, because 99% of the time I think it would be a credit back and reinvoice the amount.

**Greg:** So, next steps, we're gonna draw some process maps to outline all of the use cases we know about, run them by you, just to make sure that.

**Michael:** So that'll be in the form of like those charts that you did in the RFP.

**Greg:** Yeah, just little process flow diagrams for each use case, and then Donald can build them and we can step through them on the screen. Make sure they're right, because that's what goes to the development team to say, This is how it works.

**Donald:** What sort of timeline is reasonable for everything you guys want to do?

**Greg:** I'm hoping we'll do it in a few days, but I'm probably, it's probably gonna, we're probably gonna need a week to do that, get that process done and give you those back.

**Donald:** Give those to Michael, what you're saying.

**Greg:** By the time we've done them and had Michael check them, I think it'll be a week. Okay, great.

**Donald:** That's amazing.

**Michael:** Yeah, I know, I know. The caveat is..

**Sam:** Can we all remember it's a public holiday this weekend?

**Greg:** Sorry, the caveat is it will take what it takes.

**Sam:** Okay, good.

**Michael:** Yeah, yeah.

**Sam:** It might be a very rough.

**Michael:** Copy, but I'm sorry to be rude. So as long as, Sam, as long as it is, yeah, all those things before.

**Sam:** Thanks, Greg.

**Michael:** Thanks, Greg. It's consistent, but all the terminology is consistent, we really [unclear]. So do you use Xero, or do you...?

**Sam:** I no longer do proper accounting.

**Michael:** Oh, okay. But you've got access to the demo? Yeah.

**Sam:** Yeah. I actually specialised in NetSuite and BC, but NetSuite does American terminology, and it really drove me nuts. So I understand that. Yeah, that's fine.

## Separate Xero trust-account instance and year-end treatment

**Michael:** And so we were talking about having a separate instance of Xero just for the trust account.

**Sam:** Yes. Actually, one of my questions was, how are you going to bring that into the main set of accounts, so into the main instance? Are you going to do that weekly or?

**Michael:** Monthly? Well, we don't bring it in because remember, the trust money is actually not the company's money.

**Sam:** This does not report on the bank account?

**Michael:** Only at balance day, only the 31st of March. We bring the bank account in as an asset and we bring in a liability being the equal amount. But we don't bring it in for management reporting or anything.

**Sam:** That was my question because that's the only thing I was thinking about. But if you only do it annually, that should be fine.

**Michael:** Yeah.

**Sam:** Cool.

**Michael:** Yeah.

**Sam:** Okay.

## Controls, adjustments and continued design review

**Michael:** So really, it's all about getting these reconciliations right as the internal control.

**Sam:** Yeah.

**Michael:** And with the separation of duties as well. Yeah. Yeah.

**Sam:** Perfect. Yeah, so if you want to have a think of your adjustments and maybe flip me an e-mail.

**Michael:** Well, I think that's probably, it might be more of a question for Vanessa.

**Sam:** Okay.

**Michael:** I'll ask [unclear: Claudia] here, but I think she would... I suppose what I'm thinking is, is it better to build in that ability now?

**Sam:** In case you need it later on.

**Michael:** In case, you know, 'cause we don't want to be coming back later and saying, oh. It'd be great.

**Donald:** Inevitably there'll be lots of stuff where we'll need to come back and make changes. But yes, obviously knowing as much up front as possible is great.

**Sam:** Look, I think most times it'll be a credit and recharge.

**Michael:** Yeah, definitely.

**Sam:** That's definitely the cleanest, tidiest way to do it. But yeah, if you think of anything, let me know.

**Michael:** I'll have a think as well. Yeah, it'll just be, yeah, it'll just be a matter of just going through, on those charts to see where the entries flow through Xero, how they flow through Xero.

**Sam:** We're not expecting the diagrams to be perfect first time because like you go through it and you're suddenly like, oh, what about this scenario or what about that? So it'd be good to get something down and then if we can talk it through with you and then you think of things as that comes up and then we've got a way to fix it.

**Michael:** Yep, I've got someone who loves flowcharts, so it's good.

**Sam:** Okay.

## Development handoff and scoping workshop planning

**Ben:** And from your point of view, Donald, that's all pretty..

**Donald:** Like I said, by no means is Stratos an expert when it comes to the particular accounting plumbing of this stuff. And so it was always going to be relying on you guys.

**Ben:** Once you've got that process, you'll be like, yep, we can plug it in.

**Donald:** That's our expectation.

**Ben:** Yeah. Cool. Excellent. Wow.

**Donald:** Perfect.

**Ben:** Good, productive meeting. Other stuff, Donald, you want to talk about that's not related to Xero and accounting?

**Donald:** Yeah, I've got some questions here, I think.

**Ben:** Yeah. Anything that we should finish up with the Xero accounting stuff? Or do you have more things?

**Sam:** That's all I have.

**Michael:** I will have more things later, I'm sure.

**Sam:** Yeah, feel free to flip me an e-mail or give me a call.

**Michael:** Yeah.

**Sam:** And we can, or Greg.

**Michael:** Yeah, that's all good. Yeah.

**Ben:** Cool. Excellent. All right. No, I'm saying I've got a couple of questions specifically for Michael.

**Donald:** I haven't prepared to talk about them, so I'm gonna read them right now.

**Ben:** Have you got any questions for me?

**Donald:** No great burning questions.

**Ben:** No great burning questions.

**Donald:** Yeah, my expectation at this stage, after everything we've talked about, is that you've shared lots of challenges about getting everyone together for some sort of workshop, and so we're thinking about ways to get past that. And we know that going forward in the project we will need to have some version of the directors or Vanessa or a combination engaged as the build is going on. And so potentially with the updated prototype, if you guys basically give your sense-check on that, and we'll figure out what stuff in the requirements feels most consequential to get wrong right away. So yeah, anyway, I'm going to do that work.

**Ben:** Like I said, we've probably got that date in December. I think we're probably getting, but I'm hoping next time.

**Donald:** What was that date again?

**Ben:** 11th, I think.

**Donald:** 11th.

**Ben:** That was a Friday.

**Donald:** Okay, cool.

**Ben:** Hopefully you.

**Donald:** Yeah, that'd be great. And then we can kind of, what we could do is send through the prototype to everyone to play with in advance and then kind of go through it together in person and try and have some of those conversations around scope. And what's in MVP and that sort of stuff, because there's probably a version of this that we need to understand the fullness of what you want so we can have those commercial conversations with that level of mind and then figure out what will release right away and then what will come later. Yeah.

**Michael:** Cool. Cool.

**Donald:** Maybe let's hold off on these questions for yourself, Michael. Let's just stick with that part of our brain right now, since I've not written them in advance just yet.

**Michael:** Oh, okay.

**Donald:** We can hold off. Yeah.

**Michael:** Are you sure?

**Donald:** Yeah, I think so.

**Michael:** Yeah.

**Donald:** Yeah. Yeah. We'll see each other again.

**Michael:** Yeah, yeah. Well, do you want me at the meeting on the 11th? I'm just thinking...

**Ben:** No.

**Michael:** I've got, okay, that's right.

**Ben:** No, I think that would just be Vanessa and then a couple of us.

**Michael:** Yeah.

**Ben:** Just to, yeah, yeah.

**Michael:** No, we're just...

## Reconciliation notes

- The speaker-labelled source is strongest for attribution. Several short, overlapping greetings at the beginning remain difficult to attribute with complete confidence; the source labels have been retained.
- **Xero**, **Stratos**, **AA**, **BNZ**, **NHI**, **T-accounts**, **GL**, and **NetSuite** have been normalised where the recording clearly supports those names. References to a *zero balance* still mean the number zero.
- The phrase around the buyer-generated tax invoice is particularly indistinct across all three transcriptions. The spoken description is preserved, but the acronym and a fragment of the sentence remain uncertain.
- The payment-file label is indistinct (the speaker-labelled version resembles “A5”); it is not asserted as a confirmed banking format.
- References to a prepayment supplier/creditor, a second bank account, separate anaesthetist prepayment sub-accounts, a weekly payment cadence, payment links, and adjustment capabilities describe **options under discussion**, not necessarily final decisions.
- The source recording ends in an incomplete sentence. No missing conclusion has been invented.
