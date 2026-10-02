# Anaesthesia Associates Requirements Review — Reconciled Transcript

> Reconciled from two automatic transcriptions of the same recording. Speaker attribution follows the speaker-labelled transcript and wording has been cross-checked against the second transcription. Obvious ASR substitutions and established project terminology have been corrected; genuine uncertainties are marked rather than guessed.

## Admin oversight — scheduling dashboard

**Donald:** It's nothing to just, hopefully not, if we agree that what it's saying is correct, we don't have to fight about it. So admins see every anaesthetist AM and PM slots for a single day together, each with its availability status and where a list sits in it. It shows hospital, surgeon and booking count. Draft lists for that day appear too. They're shown as unassigned, no anaesthetist yet. From there, admins can drill into any list and see the detail. So there are screenshots here of what it looks like in the current prototype, but all the features that are described there are not represented. But we know that this is something that is a requirement for the application. This is all under the, let's go back a couple of steps. So this epic right here.

**Greg:** Yeah, what's the epic?

**Donald:** The admin app is where the AA staff runs the day-to-day operation: a one-day dashboard across every anaesthetist's schedule, monitoring of the billing flow into Xero, tools to see how far out of balance the ledger is, management of all the system's master data, and warnings that make up the office's to-do list. The ledger balance tools cover the ledger as a whole and the position for a single anaesthetist or a single patient. So that's kind of the epic that all these are under. We've got all these different features. The first feature we're talking about here is the scheduling dashboard: a one-day view across every anaesthetist's schedule.

**Greg:** Does it say anywhere that that dashboard is horizontally scrollable so they can run through, or it's got a calendar?

**Donald:** I don't think that needs to be written because the prototype already presents that.

**Greg:** It presents it, yeah. Okay, cool.

**Donald:** And then the feature itself, which doesn't have a, okay, let's go back. So anyway, we're gonna say that this is confirmed, this epic. That's good. And we'll say this feature here, one-day view across every anaesthetist's schedule with drill-down; it drills down into any list for details. This is the office's main working view for checking the day schedule and answering availability queries since the slot is the unit of availability.

**Greg:** Now, before you hit anything there, that comment pre-op review of tomorrow, what's that? Under stories, two.

**Donald:** Oh, this is the two stories we're going to read, so we're going to get to there. This is parent, child, two children underneath that. So I'm going to say this feature

**Greg:** where that came from.

**Donald:** Yeah, this feature is confirmed. We definitely want this.

**Greg:** Did you build this or is this a tool you're using?

**Donald:** I built this.

**Greg:** How long did it take to build it?

**Donald:** Well, the first iteration of it was only a couple of hours and I've tweaked it a little bit since then. But yeah, cool. Now this morning I added the feature to be able to like just keep this panel open and for it to navigate through the epic feature and stories so we didn't have to keep clicking out and clicking in. So, we talked about this dashboard we believe this to be confirmed, so I'm going to mark it as confirmed. Next one here, pre-op review of tomorrow. Admins review tomorrow's lists in the same day view as part of their normal operation procedures. This view carries no tracked state in the system. There's no gate or step for the office to complete. So nothing blocks the list of progress if the check is skipped.

**Greg:** I don't understand what that's saying.

**Donald:** I don't know why this is written either. And so maybe it's somewhere between the, well let's see the sources. RFP page 30. So if we bring our handy RFP up here. It's not there anymore. Okay, let's go over to here.

**Greg:** I would hate to think what this process would have taken to get to here using traditional methods if it was built to this level of quality of cross-reference and documentation. Phenomenal.

**Donald:** Where are we? We are data requirements. There's the RFP document. So go down to page 30. 35. 30. Design proposed decisions. [unclear ASR]. I think This is not really describing anything unique other than you can just look ahead to the future.

**Greg:** Yeah, I'm not sure why it says tomorrow.

**Donald:** Yeah.

**Greg:** That's the thing I'm struggling with. It gave me a context that it's scrollable. This thing that we talked about.

**Donald:** Yeah.

**Greg:** And as you said, that's implicit in the first screen view.

## Ledger balance tools

**Donald:** Okay. Claude, from the transcript, actually you've started recording? Yeah, good. From the transcript, can you please update 13.1.3 user story to be a bit of more of a general requirement about being able to review all of the days in the future up until slots are created. Okay, next one here, ledger balance tools. So this is Epic here, right? Admin oversight and master data. So clear tools show how far out of balance the ledger is overall and for a single patient or anaesthetist. So the story is here. Admins see the ledger's position at 2 scopes, the whole ledger and a single anaesthetist. At the whole ledger scope, this covers receivables outstanding, receipts held, payments due, amounts distributed, and any imbalances between these. At the anaesthetist scope, admins see that anaesthetist's own ledger position, what is owing to them, what they owe, they in this scenario I'm assuming what AA is owed. Although it's saying what's owing to them and what they owe, the they and them is unclear in this. This is the same balance view as the whole ledger scoped to a single anaesthetist. This gives the office one place to check whether the ledger is in balance overall and for a single anaesthetist. In essence, that's true.

**Greg:** Yes, I'm just thinking about how it would validate that the ledger was imbalanced for a single. Would you? Could you? Yes, you should. Yeah, you should be able to. Yep, you should. Yep.

**Donald:** OK, we're good. Acceptance criteria: per anaesthetist, admins see each anaesthetist's own ledger position. What is owing to them, what they owe using the same balance view as the whole ledger scope to a single anaesthetist. I mean, there probably needs to be an AC here also for just what the screen looks like, but again, this will be built out in a prototype in the future.

**Greg:** It's just a list.

**Donald:** Yeah, so that's 13.2.1. Looking at 13.2.2 per patient balance, admins can see a patient's outstanding balance from their profile, the same balance described under patients and billable parties, which is an epic later on. So this is just saying they can see it.

**Greg:** Is it worth mentioning that the balances are always shown as attributable to the patient, doesn't care about the billable party. It's a patient-centric view.

**Donald:** Say that again.

**Greg:** Well, technically, if you've got a guardian, then technically the balance would be due from the guardian, but actually...

**Donald:** Oh, yeah, it's on the patient though.

**Greg:** The view is that it's the patient.

**Donald:** Yep, yep, yep, that's true.

**Greg:** And it would be the same for an insurance claim, right? That would be the patient. Because that's just a billable, that's just available as well. Just a different billable part.

**Donald:** So what do you want me to

**Greg:** say? What does it say? Patients outstanding balance from their profile.

**Donald:** I'll just put a note. I'll just put a note here.

**Greg:** That's fine. Hang on. This is showing up the shop. Hello.

## Billing flow monitoring

**Donald:** Okay, what are we looking at? The feature billing flow monitoring. Admins monitor the billing flow as it moves from list through to billing engine to Xero, seeing what has completed and what has failed. Putting this monitoring in the admin app rather than a separate billing engine console is our proposal. The RFP left open where the surface would live.

**Greg:** Fine.

**Donald:** Seems fine to me too. So that's the feature, the details underneath it. Admins see every authorized list, whether it has been invoiced, sent to the billable party, or mirrored into Xero. This is in the processing view. Obviously, they can see all lists if they went and found them in a different place. But there's a specific view for authorized lists.

**Greg:** I noticed that's by anaesthetist. Do we want that ordered by anaesthetist?

**Donald:** No, this isn't ordered by anaesthetist. it is grouped by anaesthetist.

**Greg:** Yes.

**Donald:** Those are details we can update as.

**Greg:** I think the one thing that I'd want to see there is a filter that says just show me the problems.

**Donald:** Well, this specifically is them. This is where they see the authorized list to then approve them to be going further down the flow.

**Greg:** Oh, that's fine.

**Donald:** Yeah.

**Greg:** That's absolutely fine.

**Donald:** Yeah. And so this here is a list from Dr. Kate Morgan, which has all these different procedures within it.

**Greg:** Could we ask for that to be a filter so that you could choose all or one?

## Master data and cutover

**Donald:** Yeah, so let's say the screen needs to have filters. This list will get quite large, and the prototype's current styling needs to be updated. With that update we would expect standard sorting and filtering features. Cool. Manual intervention. When an item has failed, admins can resolve the issue and try again. This gives office staff a manual intervention path for anything the automated billing flow could not process on its own. So this shows an example of resolve and retry. And this shows [unclear UI label] — that's an interesting tag. After resolving, you try booking invoices handoff, so that's like I guess showing the before and after. Yeah, okay. These have... A little less implementation detail than I would have expected. And so that's something that I think in the future when we're happy with the prototype, I can go through a phase where it then actually looks at the final prototype's implementation and writes those details in. So it's written as well as screenshots. Master data management feature, admins maintain all of the systems relevant data. Now where appropriate, we've added information into a technical discussion field. from the RFP document. We won't really read those here. This is for the dev team, and they can add to it, remove it, whatever.

**Greg:** Yeah, and look, I'm quite happy for them to sort out what's master data, what I need to do for them.

**Donald:** Admins maintain all of the systems reference data in one place. Hospitals each with a contact email for booking updates. Surgeons, surgeons groups, surgeons rooms, insurers, anaesthetist slot availability statuses, recurring bookings. the master, quote unquote, public holiday calendar, and each hospital's own holiday calendar. RVG codes and groups, modifier codes, contracts.

**Greg:** Now, I'm being picky here, but I wouldn't call those reference tables. Some of those are definitely master data.

**Donald:** Okay. Wouldn't, I mean... It says here, this table right here says master data. This is master data, the resident system refers to it by reference rather than by copying it. So a change here is reflected everywhere it's used.

**Greg:** Okay.

**Donald:** Cool. So I never played around with the stuff in the prototype, but there's some version of this already exists with made up data in the prototype. So that's good. That's cool. That's already there. Eight screenshots. Cool. Confirmed. Moving on. Clean cut start, not full migration. AA starts on a new system with a clean cut rather than a full migration or Solutions Plus. Before go live, AA decides which data is useful and only that is loaded, cleaned and checked. Nothing comes across just because it exists in Solutions Plus. This is because Solutions Plus data is not migration ready and will not export. Its unit values are not reliable and it holds junk data entries.

**Greg:** Absolutely agree with that.

**Donald:** Yeah. Acceptance criteria given data given in Solutions Plus that AA has not approved. when go live is loaded, didn't load, okay, yeah, that's fine, okay, approved.

**Greg:** I talked about control spreadsheets, so we're all good.

**Donald:** Reference data loaded from control spreadsheets. This system's reference data is loaded at cutover from control spreadsheets that AA owns and has checked not from Solutions Plus records, whether admins can reload later, it's to be decided, the spreadsheet cover, spreadsheets cover Hospital surgeons, surgeons rooms, procedures, RVG mapping and base units, modifiers and the units, fixed fee schedules and any other contract specific overrides.

**Greg:** Do you think we should try and be loading [unclear] calendars out of the spreadsheets or do you think we should do that live? They're both options probably. Hang on, she's in the middle of.

**Donald:** You gotta call her. OK, so we're reading.

**Greg:** Yes, so my question was, should we load schedule data from the spreadsheet?

**Donald:** Oh, calendar specifically, you said?

**Greg:** Yes.

**Donald:** I don't know. If they have some clean way to extract that, I'm sure in the future when we do integrations or, you know, the data import, we can take that.

**Greg:** Well, the problem with putting that sort of data in my hand is if you need to do it again into a test system or whatever, you've got to do it again. So I'd much rather do it in a spreadsheet.

**Donald:** Sure. I mean, whatever way, if they can give it to us in a way, we will import it either directly outside of the system or some other way. But yes, yeah.

**Greg:** So I just think it would be worth noting there that we'll, and it says fixed fee schedules and any contract specific overrides. I think that's not very clear language. If you actually want to say contract detail, just contract details.

**Donald:** Cool. Okay. I will update that. I basically agree with you. Like it's kind of confusing a few ideas here. Because we know there'll be procedures with their list, modifiers will be their own list. This just needs to be just contracts.

**Greg:** Contracts, yeah. And it doesn't need to say fixed fee schedules because contract isn't necessarily a fixed fee.

**Donald:** Yeah, [unclear]. Oh, it's the mail.

**Greg:** Yeah.

**Donald:** So.

**Greg:** And do we want to make a note that there will also be calendar schedules?

## Roles, permissions, authentication and audit

**Donald:** Why can't I select this right now? Hold on a second. No, I don't think we need to worry about that. Cool. Okay, moving on to the next roles, permissions and audit feature. Access is controlled by role and every manual automated action is fully audited. So that's kind of what this feature is talking about, role-based access. So this is 13.5.1. View, edit, and approval rights are granted by roles such as anaesthetist or office admin with further roles added as needed rather than individual users. This is so permission can stay consistent for everybody in the same role and access is easy to manage as staff, join, and leave and change roles.

**Greg:** Yep, agreed. And there'll be a very small number of roles.

**Donald:** Cool. Audit trail.

**Greg:** Let's talk about. Authentication. So what's the experience going to be when the anaesthetist brings up the app on the phone?

**Donald:** I don't know.

**Greg:** Okay, will we get to it, do you think?

**Donald:** This doesn't describe that at all.

**Greg:** Okay, cool. We'll touch on that later.

**Donald:** Yeah. I'll make a note.

**Greg:** I guess that's another thing about the native app, right? Is that you can't use something like face ID.

**Donald:** Native app definitely can use face ID. PWA: unclear.

**Greg:** Yeah, so that's...

**Donald:** Standard PWA, no. There are different features enabled on different platforms, but the safest assumption is that that biometric sort of stuff is probably not accessible.

**Greg:** So what does Android use instead of face ID?

**Donald:** Well, some Android devices will have a face ID, others will have a fingerprint sensor, but all of it comes under some sort of biometric access.

**Greg:** Okay, just a note.

**Donald:** Check what?

**Greg:** What we can do and what the experience will be.

**Donald:** Well, first we need to define this type of deployable platform we're going to be supporting, and then from there we can discuss any sort of experience, but at the very least,

**Greg:** I don't know anything about Android or its variations and how you define this.

**Donald:** Yeah, as of now, our assumption is that there's going to be a PWA for the anaesthetists at the beginning. So it will need to be some sort of account login.

**Greg:** Yes.

**Donald:** Stratos' default would be using Auth0 for accounts. It's a really good platform and it handles MFA, passwords, all this sort of stuff. There are higher tiers of Auth0 that enable single sign on with like a Google account or something else. But anyway, I've just left a note to say we need to define what a login experience may look like.

**Greg:** Okay.

**Donald:** Yep. Cool, that's permissions. Next one here. Admins can see who or what made every change in the system and when. Creates, updates, reassignments, authorisations, invoices, payments, distributions.

**Greg:** Will they make disbursements? Disbursements.

**Donald:** They won't, you're saying?

**Greg:** No, they won't.

**Donald:** I don't know. What is a disbursement?

**Greg:** Payment.

**Donald:** Okay. Then what? Well, do we have payments or what's the difference?

**Greg:** So you've got invoices and credit notes, but not disbursements or payment. Yeah, disbursements.

**Donald:** Okay.

**Greg:** Or receipts when you think about it. It's done in Xero.

**Donald:** This gives a complete audit trail across both manual action and automated ones so that any change can be traced back to its source. So proposed RFP, audit/change history as a SQL system. I know in the past with other projects when people have talked about wanting to have every action audited, there's different levels of what this could look like and that will need to be discussed in some sort of developer context. But we do know that there is a requirement to audit actions to what level will be determined?

**Greg:** I don't want to be buying a TB of month to keep it.

## Surgeons, surgeons' rooms and blacklists

**Donald:** Exactly. Yeah. Surgeons and surgeons' rooms are master data. Oh, this is a sorry, moved on a new feature.

**Greg:** Yep.

**Donald:** Master data, not free text names. Each surgeon belongs to a room and has a profile page and can be on a blacklist against a particular anaesthetist. This is so system can hold each surgeon's identity numbers, knowing who to contact for a room and flag anaesthetist and surgeon pairings that should not be matched. Vanessa will supply this. Cool. So that's what the Epic is, the feature is saying. Surgeons' room master data, admins maintain a master list of surgeons' rooms, each one holds its name, contact number, surgeons that belong to them. So it's just same idea.

**Greg:** Yes, I mean, that's where the office team will need to be referenced in terms of contact details. So it'll have a contact list in it, a short contact list, and then as children, it will have the surgeon's primary.

**Donald:** Whichever the relationship may look like.

**Greg:** Or it could have a more generic relationship in that you've got an actor that has a role of either admin or surgeon, whatever, something like that.

**Donald:** Cool. Next one, surgeon's profile. Every surgeon has a profile page in the admin app held in the surgeons' master list. Surgeon's name, the room they belong to, medical registration number, HPI, CPN, and the blacklist. The surgeon is identified as one identity recorded rather than free text. So what we've already determined. Some surgeons do not want to work with other anaesthetists. So blacklist of anaesthetists and surgeon pairing. Admin staff can record each pairing on a blacklist maintained on the surgeon's profile. The blacklist could also be shown on the anaesthetist profile. Each entry is one anaesthetist and one surgeon; recommended: allow an optional reason. admin staff can see and maintain the blacklist. They already keep it today. This is how the system knows what pairings the office keeps in its head today and can warn about matches.

**Greg:** Yeah, good.

**Donald:** Now, there's an open question about two lists versus one, which will determine we've deferred to [unclear: person/name]. So this will be updated in the future should we get an answer on that.

**Greg:** I'd preempt that by saying, from a design point of view, we should allow the list to be have that double view. And the surgeon may say, I don't want to work with that anaesthetist.

**Donald:** So it's two lists. That makes sense to me.

**Greg:** It could be the one list. It's just...

**Donald:** If it's the one list, then both sides can see it. And what I think you're getting at is that if the surgeon does it, do we want the anaesthetist to know it?

**Greg:** Yeah, okay. Implementation detail.

**Donald:** Let's, yeah, let's, we'll defer it.

**Greg:** We'll call it two lists. Yeah. That's fine. Yeah, I'm with you. Okay. It's more flexible.

## Warnings and to-do list

**Donald:** Final feature in this epic, warnings and to-do list. One warning routine checks bookings, raises warnings rather than blocks. The admin dashboard is the to-do list of things that need attention, and the anaesthetist sees the warnings on their own bookings. This is so problems are seen and dealt with in time without stopping the work. Greg, this concept of the to-do list is really important. Okay, first user story in here, which is 13.7.1. A standard routine checks bookings and billing parties on them for known conditions and raises a warning for each one it finds. Each warning carries text saying what is wrong and the booking can carry more than one. Warnings come in two kinds and two strengths, before procedure and after procedure, by when the condition matters, and mild or strong. Staff can always go ahead and a warning never blocks. The current warnings are an unpaid prepayment — kind/strength not yet set, a patient with an amount owing, mild under the alert threshold, strong over it, A child as the billable party — mild; kind not yet set.

**Greg:** Yep.

**Donald:** And base units outside the RVG's range [unclear]; an after-procedure warning for the office, strength not set.

**Greg:** Yep.

**Donald:** This is so every check works the same way through one routine. Yep. Cool.

**Greg:** Now, the only comment I've made about that is Has it included the notifications concept or just this?

**Donald:** Notifications is different to a warning, so I.

**Greg:** Would it be down here somewhere in this?

**Donald:** Well, let's see if it's been updated since this morning. Shared notification pool is later on.

**Greg:** Okay, cool.

**Donald:** Yep. Okay, where was I?

**Greg:** The warnings are a pool as well, aren't they? Oh no, they, no, they are.

**Donald:** They're timely on their thing you're on.

**Greg:** They flag the thing you're on. Yeah, they don't come up. Yeah, okay.

**Donald:** Yeah, okay, here we go. So next one here, warnings on the dashboard. To-do list, the admin dashboard lists open warnings from the warning routine as a to-do list of things that need attention. An admin can clear a warning from the to-do list once it has been dealt with. Clearing is optional for a mild warning. This is so the office has one place to see what needs doing.

**Greg:** All right. When they clear it, is it going to clear it? Will it clear it from the base element as well? So it would normally be out of booking.

**Donald:** I don't know.

**Greg:** What do you think? Don't worry about it.

**Donald:** Yeah. Warning flag on booking. A booking with a warning from the warning routine shows a small warning triangle. like Excel's, both the anaesthetist app and the admin app. Tapping the triangle shows the warning text. Okay, I don't actually want the implementation detail of the Excel warning. Much like the prototype does today.

**Greg:** What does it do today?

**Donald:** See.

**Greg:** Oh yes, yes, absolutely. I've forgotten about that.

**Donald:** I've not forgotten. I see it all. Okay. Much like the prototype does today. See Ferguson and Emma on July 21st PM. The outline, the outline of the admin day view already gives lists with warnings extends down to bookings. I don't know if I mangled this up. Am I rewriting? The outline of the admin day view already gives lists with warnings. extends down to bookings. Okay, so it's saying that lists already have the ability to have a warning, much like the thing I've just highlighted. And this is saying the same idea will go down to a booking. When the anaesthetist submits a booking that carries a warning, a short confirm step shows before it goes through.

**Greg:** Do we want to do that?

**Donald:** When the anaesthetist submits a booking.

**Greg:** Do we want to get in their way?

**Donald:** No, I think this is confusing that we talked about the anaesthetist seeing the warning on the booking itself, but we don't need to get in the way of the submitting.

**Greg:** No, and we don't need a pop up saying, do you know what you're doing? Because we'll just **** them off. I think we'll just, because then it comes up and Vanessa will see it. So if they can see the warning and they ignore it, there's a second check.

**Donald:** When an anaesthetist opens a booking that carries a warning, it is visually clear to the user. This is so they see the problem such as an unpaid prepayment before surgery starts while the surgeon can still be told. Cool. I think we're happy with that.

**Greg:** Yeah, because they'd see that the night before because they always check.

**Donald:** Now this one has been moved into a future work phase.

**Greg:** Yeah.

**Donald:** I don't know why, but let's find out. A settings page in the admin app where AA can set thresholds for warnings. So this is all the kind of ability for them to edit it if they want to. So we're saying maybe in the future.

**Greg:** Yeah, okay, so you'll set it up as a constant worry about it later.

## Shared notifications and moving work

**Donald:** Final feature on this epic, the admin app holds one pool of notifications shared by the whole AA admin team, not one per user for things that happened and need no action. Things have happened and need no action. It is separate from the to-do list of warnings that need action. Anyone logged in sees it. If you log in, you see it. The first source of notification is an anaesthetist moving their own list. Several may move each morning and maybe someone wants to know. This is so that office knows what's been changed without needing, without each change needing to become a task.

**Greg:** Yeah, really good.

**Donald:** Okay. See the team's notifications. The admin app shows the shared notification pool. Newest first; scroll back through it, Greg. Just let them scroll. Each notification says what happened and when; each logged-on admin sees the same pool.

**Greg:** My only question about that is how big is this list going to be? I guess it's a roller, right? So you've got to.

**Donald:** It'll paginate, I think, isn't it? Yeah.

**Greg:** So that's fine. It's only going to have to hold while it sees, right?

**Donald:** That's right.

**Greg:** The rest of it's just a log file.

**Donald:** Oh, yeah.

**Greg:** We may put some archive rules around that later, kill it off after a week or something.

**Donald:** When an anaesthetist moves their own list to the office or into a colleague's free slot, including when they hand a list on rather than marking its slot unavailable, And a notification posts to the shared pool which says which list moved and to whom. The office can then send the cover charge update e-mail. This is so the office knows about every list moved without them and they can tell their parties.

**Greg:** Okay, a couple of things here. The anaesthetist needs to be able to move up booking.

**Donald:** Booking or list, you say?

**Greg:** Both. They need to be able to move at the list level or at the booking level, because there may be one thing that they're gonna do or not do, or they may be moving a list. There's also what behavior you want when that full list gets moved. What is the status? You've basically got your slot. You're left with your slot, right? So we need to give that slot a default status.

**Donald:** One moment, sir.

**Greg:** I didn't use the right language.

**Donald:** We're done, we're done. [unclear] Bugger what we were just talking about.

**Greg:** Choose to move a list, a whole, a full list, or a single booking.

**Donald:** Oh yeah, we can move lists or bookings in the system. Moving a list is something that's kind of pretty well defined because the system keeps track of which anaesthetists are available to receive a full list. They've got an empty slot. I don't quite picture in my head exactly what the experience would look like to move a booking, but I'm sure it could be done. You just, you have to, at that point, you, it can't.

**Greg:** Actually, that's a very interesting question.

**Donald:** It couldn't show you all of the lists. You'd kind of want it to just have a search box to search by an anaesthetist.

**Greg:** You do, because the example being gave me about Charity Hospital was some, well no, [unclear paediatric example] was that he was on leave that day and he went in and did this procedure. So actually he wouldn't be showing on the available list.

**Donald:** That's what I'm saying.

**Greg:** Whereas if somebody wants to, I guess we could negotiate in a roundabout sort of way by saying, can you, you could ring Ben and say, could you do this? Could you open your list for me and then you can move it? Because that's the sort of thing where an anaesthetist would know that Ben was pediatric. So that's the other way to handle it, isn't it?

**Donald:** What's that?

**Greg:** To move a procedure, to move a booking onto a list of someone who was technically on leave. So they're not going to show up in the available list. Are you listening?

**Donald:** No.

**Greg:** I want to move the booking onto a list of someone who's on leave. So they're not on the available lookup filter. Do you ring them and get them to change their status?

**Donald:** Yeah, so at that point, You presume what the anaesthetist is doing is that they know someone who should be free, but they see they're not in their list. And so they could call the admin staff and the admin can make them available, but the admin staff would be asking the same question, are you sure? We want to confirm with the other anaesthetist before we release, change their slot status. And so you really want to be, if what you say is true that they've got the other anaesthetist on the phone, I think we have to force the anaesthetist to change their status to available again.

**Greg:** I think so, because the process would be that the first anaesthetist would ring the second anaesthetist to say, could you do this for me?

**Donald:** Yeah.

**Greg:** And there'd be a conversation. It's like, yeah, I can do that.

**Donald:** Because then if they move themselves, then that's their declaration that they accept responsibility to do the work.

**Greg:** Yeah. And the other option is they ring Vanessa.

**Donald:** But Vanessa would probably need to verify herself, I think. She wouldn't.

**Greg:** She could tell them. what Ben was doing that day.

**Donald:** If Ben was unavailable, why would you know what she's doing?

**Greg:** Because it'll be marked, it could be marked as annually or it could be marked as not available.

**Donald:** Sure, but I would have to assume that she would not feel confident to assign a list to somebody else. at the risk that the other person doesn't know about it, and then a bunch of things fall over.

**Greg:** I agree with you. I don't think she should do that.

**Donald:** Okay, so the system was already designed to handle this.

**Greg:** It is, so we're good.

**Donald:** Okay.

**Greg:** As long as it can move a booking as well as a whole list.

**Donald:** Yep, and we've recorded that as something that's needed.

**Greg:** Okay, I'm just thinking through it.

## Schedule canvas, slots and lists

**Donald:** Cool. So, what was that question here? I'm not going to read it again. We said we haven't answered it, so we'll come back to it. Okay. New epic. Schedule canvas, slots and lists. Buckle in, buddy. AA runs a rolling four-month schedule. Every active anaesthetist has an AM and PM slot on every day of that window, whether or not anything is booked.

**Greg:** Stop. Slot. Did you say slot?

**Donald:** It is a slot AM slot PM slot and every day of that window whether or not anything is booked. A slot is a box or a container. It has a status and it can be empty. Every new slot starts as free and a list is put into that slot. A list is assigned to an anaesthetist, sits in one of their slots and holds bookings.

**Greg:** I think we could be more explicit to say that. Because the trigger for the list being put into the slot is that the first booking is made, right? So when a booking is created.

**Donald:** Maybe, maybe not though, because recurring bookings is a booking without, is a list without bookings.

**Greg:** Okay, fine, I agree. Okay, I agree.

**Donald:** Okay, I need to not revel in this as much because it's not very becoming. Okay, so where were we? A list is assigned to an anaesthetist, sits in one of their slots and holds bookings. Once a list is assigned, it belongs to exactly 1 surgeon, one hospital. It probably needs to also note the other things that we've said.

**Greg:** One anaesthetist for a day for a slot.

**Donald:** I guess these things are already being implied. Implied, yeah. Okay. One anaesthetist, one surgeon, and one hospital was missing.

**Greg:** That is a definition of. when you can create a list, right? It has to have those three things.

**Donald:** It can't be assigned until it has all those things.

**Greg:** No, that's correct.

**Donald:** It could be drafted.

**Greg:** It's drafted.

**Donald:** Okay.

**Greg:** We haven't talked about drafted.

**Donald:** So, one surgeon. Oh, this belongs to one surgeon. Oh, it's okay. It already says anaesthetist. One surgeon. One anaesthetist. What hospital?

**Greg:** Okay.

**Donald:** Where were we? Right here. No hospital. A draft list is a list carried with no anaesthetist. It's surgeon, day, hospital, session known. Only the anaesthetist is missing. That's your definition. I'm happy to keep it there. I still reckon potentially a draft could miss some of those things, but that's something we can figure out in the future. A day holds its slots and lists; both belong to the day. A list is put into a slot and holds bookings. A booking holds a procedure; a procedure holds a contract, and contracts may be split. Each slot carries its own availability. This keeps the calendar complete and gapless, whatever is or isn't booked yet. This is the settled logical model. Is this a confirmed question? It is. Okay. A day holds an AM, a PM slot for every active anaesthetist. A slot is a box. The status is just repeating itself. Okay. So this is what are we reading right now? We're reading the epic. Now we can go into the feature. Rolling canvas generation. The scheduling engine pre-generates the schedule day, anaesthetist and slot structure for four months ahead on a rolling basis.

**Greg:** I think we should make that X months ahead because they extended at Christmas.

**Donald:** This is a fixed canvas. Every active anaesthetist has its place. So the four months, was that defined by you?

**Greg:** That was defined by Vanessa. That's their normal practice. But over Christmas they stretch it.

**Donald:** Well, I could review the transcript, I guess. But I thought I heard Vanessa say that, I heard you say, here's what it is, I heard you say the only reason it's four months is because of Christmas, not because they extended a different amount of time at Christmas. Regardless, I think X months is fine. Like the system shouldn't care how many months it is. I would just say four months ahead for now. Um, four months is the setting today, is it?

**Greg:** Current practice.

**Donald:** Okay, it isn't the current disc. But the system should be flexible enough to have any number of months. I mean, at some point, maybe there would be performance issues if you said, you know, 36 months in advance. But who knows, different practices may have a different number of months they want, and I don't see a problem with that.

**Greg:** Actually, changing that is a real pig's job.

**Donald:** Why?

**Greg:** What if they want to shorten it? I guess you just drop all the future days.

**Donald:** That's okay. That's a good point. It's sort of a thing you wouldn't want to change very often.

**Greg:** And if we extend it, you've got to heal a little, right?

**Donald:** Oh, that's easy. That's the system already has rules for that. But going backwards, you have lots and lots of problems.

**Greg:** Or you just chop, you just chop it.

**Donald:** Yeah, but there could be, you just, I would say this, anyway, we don't have to worry about it for now. Okay. Okay, that's the feature, Epic.

**Greg:** Okay.

**Donald:** We have read, so user story, reading 1.1.1. So this was previously the first story in the list, but I moved the other one in front of it. The scheduling engine will create exactly two slots for every active anaesthetist in the system on a daily basis, four months in advance, AM/PM. It does this even when no list is attached and nothing is booked. Each new slot starts as free. Slots are created even when blah blah blah. This is so the admin team have somewhere they can make bookings and the calendar shows a complete picture, no gaps. Confirmed. Horizon rolls forward daily. Each day, the scheduling engine extends the four-month horizon forward and projects the anaesthetist's recurring bookings into newly added days. This means standing arrangements appear on the calendar automatically without admin re-entering them. Heck yes. I never mentioned anything in there for new anaesthetists. Oh, the prototype already has permanent lists. It's right there. I can't. Trust me.

**Greg:** Do you want to say anything in here about when a new anaesthetist is added?

**Donald:** Well, how about we just read the next story? New anaesthetist gets populated canvas. When an admin adds a new anaesthetist, the scheduling engine creates their slots from their start date across the four-month horizon. This is how the canvas is ready to accept bookings from day one with no gaps. Easy. Is this already presented in here? Add anaesthetist, GST period, and then phone. Okay, that's just their rates and stuff. Anyway, there'll be more appropriate screenshots in the future. Well, this defines that there is.

**Greg:** Okay, cool.

**Donald:** Slot default times. Oh, interesting. Yes, admins set default start and end times for AM and PM slots. Each slot can override these details individually. A booking that runs all day simply uses the AM and PM slot rather than a separate all-day type.

**Greg:** You know, I've been thinking about this and one way of looking at this is that the list time A slot time has a default time, which is your 8 or 12 and whatever. But at the end of the day, the real time for the slot is the starting time of the first procedure and the ending time of the last procedure. It's all a bit moot and it doesn't actually matter.

**Donald:** Yeah, you could in theory have the different views respect that. It may just be a little bit visually confusing if the list is shortened artificially And some people might, if they weren't paying attention, think that they couldn't add new bookings to it after that time. So I think respecting the standard sort of shape is probably best for everyone involved.

**Greg:** I agree. Even if there's just one booking in it.

## Slot availability status and calendars

**Donald:** Yeah. Okay. Next feature, slot availability status. So this is feature 1.2. Availability is a status held on the half-day slot.

**Greg:** I'll stop you for a moment because I just thought of something.

**Donald:** Shall we going back?

**Greg:** Just in this use case where an anaesthetist does a single booking as a favor, for instance. So the scenario says he's on leave, he gets a call, he agrees to take a special case, he accepts the booking, opens this list, accepts the booking, right? That does not mean that he's prepared to send.

**Donald:** He accepts a list and that list only has one booking.

**Greg:** No, no, no. He changes his slot status to available and his colleague pushes a booking to him.

**Donald:** I guess in that case, yeah, okay. So in that case, it would generate him a list on the fly with just that booking.

**Greg:** Yes. Well, it can create the list. That's fine.

**Donald:** The bookings exist within a list, but that list is only one booking.

**Greg:** Yeah, and it might have a standard start and end time. That's fine. But the question is, he doesn't want anybody else jumping in and adding bookings into it.

**Donald:** Yes.

**Greg:** So maybe there's a sort of, well, there's a status not mentioned status here about I've got a booking, but I'm still not available.

**Donald:** Who adds to those, who adds a list, a booking to a list?

**Greg:** Admin.

**Donald:** Admins people do it. There's already the ability to put notes on lists. Maybe it's handled in a bit more of a soft way. In the future, again, this is sort of stuff that like once people are living with it, they will work around the problem and if the problem becomes big enough, you build for it. It's a fair point though. There we go, okay. So availability is a status held on the half day slot and anaesthetist AM and PM slots on the same day carry different statuses independent of whether the slot holds a list or a booking. The anaesthetist keeps the status up from their own calendar, see anaesthetist availability calendar. I can click on that and it'll go to it. And then I should be able to go back to where I was. Nice. Wait, I've already been to that one. Curses. Okay, let's go. Out here to... Oh no, where was I? Well, just... over here, around here. this one. There we go. So the slot status and calendar are one mechanism, not two to reconcile. Once a list is put into a slot, the list shows in place of the status.

**Greg:** Hang on, what does that mean?

**Donald:** So I'd said words in the transcript to say that as of now, the box above all of this stuff, right, the day slot, you know, slash list, the slot itself can have an unavailable status or on holiday status or whatever, but once a list is in there, we don't currently have the concept of a list having a status. You just mentioned it as a potential idea, but as of now, When I look at this page and I look at all these St George, Forte Health, Southern Cross lists, there's no like. status in here other than like it says draft but I don't think this prototype knows what it means draft what that means compared to what we think it means yeah well the list there is such a thing as a draft list but once it's on a person and in a slot A list is a list. There's no version of it which is like a pending assigned list.

**Greg:** There's only versions of a slot. So you could say that the slot.

**Donald:** The slot has status, but the list doesn't.

**Greg:** The list, once a list is added, slot can only have one status, right?

**Donald:** Well, it's.

**Greg:** Which is active or something, whatever, doesn't matter.

**Donald:** Yeah, on holiday, unavailable, I mean, what's all the things down here? The colors represent private, public, but like, yep, what's pre-op assessment? Where did this come from, I wonder?

**Greg:** I don't know.

**Donald:** Yeah, it's made-up stuff. Okay.

**Greg:** Yeah, okay, we'll worry about that later.

**Donald:** Yep.

**Greg:** This general idea. It's a slot holds the status.

**Donald:** Cool, and that's the feature. Now we go to the stories.

**Greg:** Yeah, and all I'm trying to say is that once a list, what you were saying, which is once a list is there, it has priority in terms of what status is.

**Donald:** Yeah, I mean, in theory, the slots list status or whatever is, it has a list. I don't even want to say that out loud because that's not really the mental model. It's just a list is a list. Currently, lists do not have any sort of status that denote any other change of functionality. Cool. Okay, reading 1.2.2. Admins maintain a list availability status table, RFP list status directly. The statuses are a user maintained list, not fixed in code. Each status has a fixed internal ID and editable fields. I think this got updated by what we just talked about earlier. That's yesterday. That's today. Yeah. Awesome.

**Greg:** Okay, cool.

**Donald:** It has a fixed internal ID, an editable label, an editable color. Any rule that depends on a status reads its ID, not its label. This means statuses can be added, renamed without any code changes, and new customers can have different statuses. Greg, much better than an enum.

**Greg:** Well, funnily enough, I was using an ERP that had a major module added to it. where the statuses were written in as an enum and it caused horrendous problems because that statuses really needed to be changed and it was like a rewrite to get them out. And the author admitted that it was a big design mistake. It's interesting.

**Donald:** Yeah, I mean, I like to have sympathy for people in these situations, especially stratos. Often we're building things for people and they want it done cheap. And sometimes you want to build in contingencies and flexibility in the system to support expected future change, but people don't want you to do that because it costs more money, and that's what we call technical debt. This is the availability status, not the draft submitted authorized approval states. An anaesthetist needs to set half-day availability from the app. They need to set the availability of each of their slots. A slot is free by default, and the anaesthetist changes it. For example, on holiday or unavailable. This is so the office can see the availability immediately. Great. The scheduling engine never derives a slot status from its booking activity. Once a list is in a slot, the list shows in place of a status. This means that a status such as on leave Tuesday PM stays meaningful even when a slot holds a list or booking. Interesting interpretation of our previous requirements, and that covers what you were saying before, that someone could still have a list and be marked as unavailable. Do we want to change this or are we happy with it?

**Greg:** There's something been missed here, unless it's in another story, and that is that, can you go back one?

**Donald:** Images or stories?

**Greg:** Stories. Right, so the anaesthetist is setting their availability, which is then used by, but it's used by the engine to say what's going on. But that can set up a conflict. This is effectively what I'm calling the anaesthetist calendar. The surgeon also has a calendar of recurring appointments. So is that recurring appointment going to be on the anaesthetist calendar or the surgeon's calendar?

**Donald:** I would say that an anaesthetist would see their recurring bookings in there, what do we call it here? In their list, right? When they look at their view of lists, they would see all the recurring bookings coming in there, but they would not see a choosing calendar in their own calendar. A calendar is essentially, and you're using the word calendar, I'm not sure if I would necessarily use that. It would be some other function, but maybe it is a calendar. Anyway, there needs to be some functionality for an anaesthetist just to mark the availability Basically, you would block out periods of time or occurring, you know, block.

**Greg:** So there are three potentially three parties here, all of whom have calendars, right? The hospitals have a calendar. It's normally only their closed days. So they'll put all their stat holidays in there. The surgeons, do the surgeons have a calendar? The anaesthetist has a calendar, which represents their personal view of their own time. The question is, do we want to drive the recurring, the agreements for recurring appointments as an anaesthetist owned entity or as a surgeon owned entity? Because if the surgeons...

**Donald:** Or there's both.

**Greg:** Well, maybe there isn't, because maybe the surgeons don't have a calendar. Because it's an agreement with the anaesthetist and he puts it in every second Tuesday.

**Donald:** I see what you're saying. The only place that falls over is if whatever reason a secretary from a surgeon's office calls AA and says, hey, can you tell me what your system has in terms of recurring bookings for Suzanne, the surgeon? And if there's no central place to see it for Suzanne, the surgeon, AA would have to go into every anaesthetist and look at the bookings on [unclear].

**Greg:** Well, maybe the surgeon page just shows, maybe they're just views of the same data element, right?

**Donald:** Implementation detail.

**Greg:** It's important though, because you could potentially change it from both ends, or you could make one read only.

**Donald:** The way I view it.

**Greg:** You could say that I use a shared calendar element.

**Donald:** Let's put it this way. This bedroom right here, this office rather, this meeting room rather, it has a calendar.

**Greg:** Yes.

**Donald:** Which everyone in the office can see.

**Greg:** Yes.

**Donald:** Is this the right analogy? I don't know. I'm gonna keep going.

**Greg:** Keep going.

**Donald:** No, I'm just gonna use a real example here. A surgeon can set one-off events for when they're on holiday or recurring events for when they want to block out a day they're not working.

**Greg:** Yes.

**Donald:** And those two sets of rules, kind of like creating a series in Outlook, are things that a surgeon can do. And so when I imagine a GUI, I imagine them setting up these rules, whether it be, or these events, which they are one-off or are occurring. And then once we have those rules, we can present them on some sort of calendar for a surgeon, but we really only care about the

**Greg:** Yeah, I mean, I agree that the calendar that I'm discussing is the calendar view of an underlying set of data, right? It's obviously going to be kept in a much more compact form.

**Donald:** But I'm saying regardless of, I'm saying if we got rid of the concept of actually a visual calendar that we show in an app, we just show the rules, then the surgeon has their own rules for recurring or fixed blockouts or meetings. The anaesthetist has their own one as well, and the shared view is the list. That's where they come together.

**Greg:** There's a conflict though. There's a conflict in that. Is there a conflict? How are you going to flag the situation where either the, see the surgeon might get ahead of his four month window or the surgeon, one of them says I'm going to be on holiday that day and it's in February, right? So they put in the fact they're going to Japan for two weeks.

**Donald:** One year out, yep.

**Greg:** Six months out.

**Donald:** Yep.

**Greg:** So that's all tickety boo until you come along to populate those days.

**Donald:** That's fine. The system already supports that, which is to say the day rolls over, the system creates all the blank slots for the anaesthetist, then the next step in the system or another process in the system then looks at any recurring things that need to be created.

**Greg:** Yes.

**Donald:** And it probably creates the anaesthetist, applies the anaesthetist availability first, Because you wouldn't want to have a situation where the anaesthetist is busy, but the surgeon's recurring booking gets created first. So I would say you would create the anaesthetist block out first, and then the next process after that would apply all of the surgeon's recurring bookings. So if you had a situation where a recurring surgeon booking meets a blocked-out anaesthetist slot, then that becomes a draft list or a notification to the admin team. Okay. We were reading this one and then we started reading this one. Status is independent of bookings. But the part of this that I don't really like at this stage is the part where it says it means a status such as on leave Tuesday stays meaningful when that slot holds no list or bookings. That's part, what was I here? What's the list? That's fine. Was there another one? No, it's one reason I thought I read.

**Greg:** Actually, I think that's redundant. Well, that's not true, because if you've got a booking, the status can only be one thing, right? Because you've got a list.

**Donald:** That's not what this is saying, I don't think. I'll read it again. The scheduling engine never derives a slot's status from its booking activity. Once a list is put in the slot, the list shows in place of any status. So it means the status is gone.

**Greg:** I wouldn't have said that. I would have said the status. The status might not be displayed, but the status is determined. The list takes precedence in setting the status of the slot.

**Donald:** Yeah, this is where we were kind of muddling our words. I was muddling my words before. I was like, the list becomes the status of the slot.

**Greg:** Yes, exactly. Well, it sets the status of the slot.

**Donald:** Well, it's not even a status. It's just like the concept of a status disappears and you don't even see the slot anymore. You just see the list. But I think it's just implementation detail. I think what this is saying is true.

**Greg:** Okay.

## List assignment and blacklist warnings

**Donald:** Yeah. Okay. Cool. List assignment. A slot with no list attached has no surgeon and no hospital. A list sits in one slot. Once assigned, belongs to exactly one anaesthetist, one surgeon, one hospital, one day, one session. Session is a word we haven't used too much in our conversations, but it was the word that was previously used to define an AM or a PM. A draft list, this is a feature, right? So we'll talk about the user stories after this. A draft list has a surgeon, hospital, day, but no anaesthetist. So we've agreed on this. Assigned list pairing rule. The scheduling engine enforces an assigned list has exactly one surgeon, one hospital. Because this pairing is per list rather than day, anaesthetist AM and PM slots on the same day need not match. Admins can assign them to different surgeons, different hospitals or both. This is so every booking on a list inherits an unambiguous location in surgeon. Yep. Oh, happy days. Okay, now we're reading 2.3.2, recurring bookings drive most assignments. Not sure about the most, but we'll go on. Admins maintain recurring bookings, the standing intersection of hospital and anaesthetist and surgeon on a day of a week and an AM or PM session. painted into lists. A recurring booking creates a list against the anaesthetist, surgeon, hospital, day and session four months ahead before any bookings exist. So a list can exist with no bookings. This is roughly 80% of assignments. This is so roughly 80% of assignments populate automatically from the pattern rather than needing to be assigned by hand each time. Seems right to me.

**Greg:** It's an empty list.

**Donald:** It's an empty list. There's an open question here to ask Greg. [unclear reference], this is new since earlier this morning. We can't come back to it. They won't mark this as confirmed yet. I'll mark it as verify. But we agree with this language here. When the surgeon's room calls, With an ad hoc request, an admin assigns a surgeon and hospital to an available slot directly, which creates its list. This is so sessions that fall outside any recurring bookings are still captured on the schedule. So the idea is that you would-?

**Greg:** It's a draft list at that stage, right?

**Donald:** Well, I think you could go about it both ways, right? I think what this is describing is that the hospital phones requested So if a surgeon's room phoned and said, I need an assist for this day, the slot. They move the calendar to that day. They look who's available and they pick one and they can create it.

**Greg:** Not how they work at the moment, but they could.

**Donald:** They could. So let's put a note down here. We may delete this once we find another story that covers it, but state that new lists can be created by finding an anaesthetist on a day — let's be more accurate: day, slot, anaesthetist. But we also need to support making a list as a draft, not attached to an anaesthetist, which can later be assigned.

**Greg:** It's an interesting behavior because it may be one of these areas where it's sort of like too hard to do it later. Whereas actually if you do it now it's done.

**Donald:** Yeah, and again, you were saying that this is not how they work today in terms of finding the day. But that could be because the system doesn't make that easy.

**Greg:** No, and also they have to go and look in the black book.

**Donald:** Yeah. So here's a fun thing I just want to show off. There's a history thing here that shows all the changes to this user story based on the Git history. So you can even expand this and see all the before and after screenshots. How good is that, mate?

**Greg:** I'm still figuring out how you write this at least in a working day.

**Donald:** Okay, so that's the manual list assignment.

**Greg:** It's an indication of how powerful these technologies have gone to them.

**Donald:** Yes.

**Greg:** Because up until now, Microsoft would have sold you DevOps to do this, and it wouldn't have been half.

## List reassignment and locum search

**Donald:** As good. I know, we would not be here today. We would be weeks away from being this ready. Okay, now reading 1.3.5. When an admin assigns a list or a draft list, assigns a list or a draft list to an anaesthetist and the surgeon and anaesthetist are on the blacklist, the system shows a warning. This is a soft warning. The admins can still go ahead. The pickers also separate the blacklisted options from the others. Choosing a surgeon for anaesthetist slot, the surgeons blacklisted for anaesthetist, sitting their own clearly labeled group. Choosing an anaesthetist for a draft list, the anaesthetist blacklist for the surgeon in their own clearly labeled group. This is so the office sees a bad pairing before committing it without a hard block. That would also, that would be worked around, without a hard block that would be worked around. The same way availability conflicts only warn. This seems right to me. Separated blacklist options appear. Still selectable, warn on both paths. Yep, cool. Confirmed. Cool. Next feature here, list reassignment and locum search. A list can move from one anaesthetist to another at short notice of illness or other late cover without disturbing its bookings, status history or audit trail. That's the feature theme. We agree that this is something that the system needs to do. Excuse me. An admin can reassign a list together with all of its bookings to another anaesthetist. The list's booking status history and audit trail all carry over intact. Nothing is re-keyed and no history is lost. Some technical details. I still think it's so cool that we talked about this morning and we went to lunch and it's all updated. Okay, now we're finding reading 1.4.2. Admins and anaesthetists can see AM and PM availability across every anaesthetist on a given day. This is so locum can be found quickly to cover illness. Again, this is something already basically covered in an earlier story, but it's just putting it under here with this theme as well, I think. It shows some free only sort of settings here, so nice. I think we'll stop in about 30 minutes for a little break and then keep going. In the app, it needs to just move their own list. In the app, it needs to select one of their lists and start a move, then either moves it to the office where it becomes a draft or uses the availability view to push it into a free slot of a colleague. The colleague does not need to accept. The office does not confirm the office move. This is a high trust system. Anaesthetists who withdraw from a list also return it to the draft list, to a draft list so it can be assigned to somebody else.

**Greg:** Yep, good.

**Donald:** This has got some open questions, same open question from before, I think. Yep. So when an anaesthetist moves one of their lists to a colleague's free slot, that colleague is on the, and that colleague is on the blacklist for that list's surgeon, the app shows the same soft warning as when the office assigns. The anaesthetist can still go ahead. This is so a bad pairing is caught at the point the anaesthetist arranges cover, not only when the office assigns. See assignment warning for mechanism. I'm going to leave this as proposed or verify because we're probably, I still think I want to hear from Ben directly about sensitivity of knowing these blacklists. I'm sure there's like a [unclear] sort of thing where everyone just talks about it, but I'm sure this will work this way. I just don't want to mark it as confirmed just yet.

**Greg:** Fine. Good question.

**Donald:** The lists anaesthetist did its procedures? okay. Whoever submits a list is the anaesthetist who did every procedure on it. If another anaesthetist does a booking, the booking is moved to that anaesthetist list.

**Greg:** Before the procedure.

## Hospital holidays, anaesthetist availability and conflicts

**Donald:** OK, let's put that in. Booking is moved to that list. Before the procedure. even if it's the only booking on it. An anaesthetist never does a procedure on another anaesthetist list. This is almost like company rules, but the system, like up to this point, I don't imagine the system could create the state, but yeah, Anyway, this is kind of self-evident, but it's fine that it's spoken out. What's the question? Obviously a new question from after our meeting, which is open and assigned to ask Greg, so we'll come back to it later. Okay, new feature. Hospital holiday calendar and conflicts. Each hospital keeps its own calendar of closures, holidays. The system reconciles it against the schedule, canvas and flags any lists that conflicts. We say that that is true. Hospital Holiday calendar. Admins maintain. That was the feature. I don't know, this is the story. Admins maintain each hospital's closure date, closure dates on its own calendar, independent of any other hospitals. Simple. And what do you know, it's actually already in the prototype.

**Greg:** It's very what?

**Donald:** Already in the prototype.

**Greg:** Yeah, good.

**Donald:** Next. Anaesthetist availability calendar. From a calendar in their app, an anaesthetist keeps their own slots' availability up to date, independent of any list arrangement. They may mark days off. They may create a series; recurring days off are a rule in the calendar. They can edit or delete one instance of a series. For the anaesthetist, this is a status, not a list. Marking unavailable a slot that already holds a list asks the anaesthetist to return the list to the office or reassign it to a colleague.

**Greg:** Now, it's worth saying here that there are several versions of unavailable, all of which have the same effect. So it could be unavailable, it could be public hospital, it could be annual leave, but they all have the same effect.

**Donald:** Yep, that's right.

**Greg:** But it's for information.

**Donald:** Yep, I think the prototype already displays that. And I'm not sure if you remember, but from the demo we did. Actually, I could easily do it here. So if I wanted to reassign this list to this person, and then ask me what do I want to mark my slot as?

**Greg:** Oh, nice. That's cool. Because I asked that question this morning. That's good.

**Donald:** Already ahead of you. Conflict flagging. When a list conflicts with a hospital's closure, or when a booking or recurring booking lands on a slot where the anaesthetist is already marked as unavailable, the scheduling engine flags it rather than simply merging the data. The flag is a soft warning, not a block. The booking stays where it is, an availability conflict appears and the list changes color so the office can see it and resolve it. See the availability conflict dashboard. Now this is interesting. um sources for this are as recent as of this morning in terms of how this story has evolved but my and do we have a new story 81 definitely have a new story okay a question but my feeling tells me that actually when the rolling calendar is healed every day when it you know it turns over I already mentioned that I think the anaesthetist bookings go in first before the surgeon's rooms recurring ones do, which is what this is describing.

**Greg:** Yes.

**Donald:** I think the system should automatically create that list as a draft rather than assigning it to an anaesthetist for someone else to come and grab.

**Greg:** So do I. Yeah.

**Donald:** So I...

**Greg:** And it should blank it.

**Donald:** Okay, I'm going to leave it as verified and I will... What's in the notes here? Some other stuff. I hope you understand that after we have gone through and read all of your stories and accepted them, we're going to have to do the same thing at least with Vanessa, maybe some subset of it with some anaesthetists themselves.

**Greg:** Absolutely.

**Donald:** Yes, very good. By that point, we will have mock-ups if we think that will be easier to communicate ideas.

**Greg:** My role here is to prepare the ground, and in a perfect world, they will agree with everything. But that's exactly why we're doing it.

**Donald:** Okay, next one here, we're reading 1.5.4. Admins see every availability conflict across the schedule in one colored view. Okay, yeah, cool. Instead of running a report and printing a report, annotating and reprinting, annotating and reprinting, a conflict is a booked list where a hospital is closed or the anaesthetist is unavailable, including short-notice sickness. Each conflict is colored and shows a reason. So what this is talking about right now, is this demo right here where it's got a little marker on it and then it says needs attention. Now I think previously the system rules as this requirement is written says that these lists stay attached to the original anaesthetist and it just gets this alert. You and I have just proposed that actually it's just forcibly pushed back to a draft so it's definitely resolved.

**Greg:** Becomes its own to do list.

**Donald:** There's another different to-do list, but it divorces itself from a list where someone definitely said they're unavailable.

**Greg:** Well, absolutely. I mean, if it's scrollable, it could stay on the site for quite some time.

**Donald:** Yeah, okay. So from a conflict, an admin can reassign. So Transcript recording: we're going to not mark 1.5.4 as confirmed, and I want you to take the context of everything we've been talking about and rewrite it. Moving on. Mark unavailable while holding a list. When an anaesthetist marks an AM or PM slot unavailable while it holds a list, the app asks what happens to the list. Return to the office where it becomes a draft list with the hospital surgeon booking for the office to resolve or assign it to an available colleague, as when they move their own list. This is so a list is never left with an anaesthetist who will not be there. See our last comment. Yep, we agree with this. Do you concur?

**Greg:** I do.

## Draft lists

**Donald:** Okay. Draft lists feature. A draft list is a list created with no anaesthetist. Surgeon, hospital, day and session are always known when it is created. Those details come first, and all four are needed to turn it into an assigned list. Beyond the recurring bookings, there are many extra lists that need an anaesthetist found, and requests arrive daily, including from surgeons' rooms and secretaries. A draft list arises when A surgeon's room needs an anaesthetist and none is available when none is assigned. An anaesthetist moves a list to the office or withdraws from it; or an anaesthetist marks a slot holding a list as unavailable and returns it to the office.

**Greg:** There's some redundancy in that second bullet. It just needs to say moves the list to the office.

**Donald:** Okay. Transcript, please write feature 1.6. draft list to be a little bit more coherent, specifically with the bullet points two and three. The system holds each one as a draft list visible to the admin team and clearly shown as unassigned. Until an admin assigns it to an anaesthetist, it's never offered to an anaesthetist. The office assigns it. So it's saying that anaesthetists can't just peruse a list and pull it in if they want to.

**Greg:** No, it's an office job.

**Donald:** That is an interesting idea though. I know there are applications for substitute teachers where they can see available bookings in Christchurch and grab one. I wouldn't be surprised if anaesthetists would want a similar thing.

**Greg:** One of my parisha partners wrote something for the same for GPs, been very successful.

**Donald:** Maybe. Transcript raise a question to ask Ben about whether or not anaesthetists would want to peruse draft lists and pull them in themselves.

**Greg:** Anaesthetists.

**Donald:** What did I say? Anaesthetists. Okay, moving on. System holds. Yeah, I think we already read all that. Okay. I think as it reads right now, we're happy with it.

**Greg:** But it's fine.

**Donald:** It gets there. This is the umbrella entity. Now let's go to the user story itself. AA staff create a draft list when a surgeon's room needs an anaesthetist and none is assigned. For example, from a call or e-mail or PDF from the surgeon's room or secretary. The hospital, surgeon, day and session are required. It has no anaesthetist, so it does not take up anaesthetist slot. So this means we can go ahead and delete this piece of text because that requirement describes that an anaesthetist can So admin staff can create it themselves.

**Greg:** So it's done that.

**Donald:** Bookings can be added to it before an anaesthetist is assigned. This is so requests enter the matching process and someone is made responsible for assigning it.

**Greg:** What does that mean?

**Donald:** I actually don't know. This is so the request enters the matching process. I think that just means the system that exists outside our system where the office staff actually decide it's your job today to match these.

**Greg:** I'm not sure of the acceptance criteria.

**Donald:** Okay, so is it no anaesthetist needed? Draft list can be saved with no anaesthetist required. A draft list cannot be saved without a hospital surgeon or day.

**Greg:** Actually, we do need that. Otherwise, they don't seem to go.

**Donald:** I mean, I advocate that maybe not all of those are required, but we're saying they are for now.

**Greg:** Well, actually, I think your point in practice they are required.

**Donald:** Great, that's fine. Bookings allowed. Bookings can be added to a draft list before it is assigned. Takes no slot. Yep, I accept all of those.

**Greg:** That's very good. It's almost like they'll be like, all right, it's good.

**Donald:** See draft list flagged in the admin app. So this is 1.6.2. Admins see every draft list in the admin app, each clearly shown as a list with no anaesthetist yet. Draft lists show prominently in the core planning view, for example, in a space reserved beside the day view. as well as their own page. Each shows its day, hospital, session and surgeon, and how long it has been waiting for an anaesthetist. This is so an unassigned list cannot be mistaken for a real one, and so nothing waits unnoticed for someone to be found. It also shows on the one day dashboard for the day it falls on. What's the one day dashboard?

**Greg:** That's the default.

**Donald:** That's the, I mean, that's what I think that was just doing a little bit of redundancy there, because.

**Greg:** The list should be sorted by date with the.

**Donald:** I mean, we could have multiple sort options. I guess, no, you're right. Yeah, it should be sorted by day. Does it say this here? I need to fix my app. I made it so when you hit control F to find, it's searching the board, but I need to make it only do that maybe when you have a card closed, because I want to go to search within this. Anyway, let's get reading. I don't think it says anything about sorting, but we can add it. Today's unassigned requests have no home. Vanessa keeps a pile of paper. And neither the current display nor the RFP shows unassigned lists, which Greg said is quite a big flaw. That's good. Happy with that. Let's add another one here. Sorting. Draft lists are sorted, ascending date order.

**Greg:** Sexy sorting.

**Donald:** Oh, did we confirm that? We did. Okay. An admin assigns a draft list to an anaesthetist by choosing the anaesthetist. The draft list becomes...

**Greg:** No, you just choose the anaesthetist because it's all everything else is already there.

**Donald:** Yeah, good call out. The AM/PM slot is predefined on the draft list.

**Greg:** You're just saying it's moved into the slot really, aren't you? But that doesn't matter, it's just language. That's fine.

**Donald:** The draft list becomes a list in that slot, keeping everything already recorded on it and stops being shown as unassigned. The availability finder helps find who is free. Yeah, so you could, since we already know everybody's availability, when you click on a list, You would actually see everybody who's potentially available in the same way anaesthetists can see other available anaesthetists.

**Greg:** Absolutely. Great.

**Donald:** An assignment to an unavailable slot or to a blacklisted pairing shows a soft warning and can still go ahead the same way conflict flagging works.

**Greg:** Is it nice to have feature in here? Can I tell you about it?

**Donald:** You're going to anyway.

**Greg:** I don't have to.

**Donald:** No, go on.

**Greg:** That surgeon will have regulars that he works with, right? If the regulars are available, it would be good if they were.

**Donald:** You're talking about a whitelist as well as a black list? It's like, well, it's not a preferred list, essentially.

**Greg:** It's like, yeah, it's like a, it's like a white list. There is a white list, but you can derive one.

**Donald:** Yeah, let's not, let's not.

**Greg:** It's too hard.

**Donald:** Yeah.

**Greg:** The admins will know.

**Donald:** Yeah, you've got my brain racing how I would implement that. I would implement that by having if a surgeon makes a recurring schedule with you for every Wednesday morning, then makes a second recurring schedule with me every Wednesday morning. The system will always pick you before it picks me.

**Greg:** It doesn't have to auto-pick, it just might put them first, so the admin can see them. Who are the you just have?

**Donald:** A list of, you know, that would just be more recurring meetings, I think, or events of what language you've used.

**Greg:** Yeah, it's the intersection of recurring appointments.

**Donald:** Yeah, And so if they match up in everybody, but anaesthetist, the list is ordered, and so it would do an order, and if someone's not available, it goes to the next one.

**Greg:** Yeah, Should we put it in? It'll be a huge benefit.

**Donald:** Hold on. You don't know if it'll be a huge benefit. We may spend some thousands of dollars making it, and some people would enjoy it, but it wouldn't necessarily change the needle of...

**Greg:** Make a blind bit of difference.

**Donald:** Yeah. Sorry, I think you're overselling the value a little.

**Greg:** Okay, cool.

**Donald:** So this is where some of this AI development will prove itself, because We found that in our previous system that my team made, SCID, we spent a lot of time building the foundation and the model — the domain of the app — ourselves without AI. And once we had done that and lived with it for a little bit, we then heavily, heavily used AI to build features on top of that. And so I have to expect that we will do a similar pattern here where we will build a very strong foundation and then rapidly move on from there. And this is the thing you just described as the sort of thing that would, I imagine, not too difficult to build upon. Okay. Okay.

**Greg:** We accept that.

**Donald:** Okay.

**Greg:** That's fine.

**Donald:** I haven't finished reading all of it. So this is how you just end up with that. Okay, cool. Yep, verify. Remove or redate an unfilled draft list when the surgeon's office cancels the request behind a draft list. Cool, interesting. If no anaesthetist can be found, an admin removes the draft list or edits its date.

**Greg:** Yep.

**Donald:** Nice, because it can't exist without one of the two.

**Greg:** Yep. That happens all the time.

## Booking intake and change handling

**Donald:** Okay, we're out to epic number three, booking intake and change handling. Bookings reach the scheduling engine from four sources, hospital download, surgeon PDF list, admin entry, and anaesthetist own ad hoc entry. To be clear, we're talking about bookings, not lists. Every change, whether it is a new, a modification, a reschedule, or a cancellation, is applied to the schedule with its source recorded right up to the procedure itself.

**Greg:** Shouldn't that say it's applied to the booking?

**Donald:** What does it say here? It's applied to the schedule. What is a schedule in this sense?

**Greg:** Exactly. List.

**Donald:** Yeah, every change, whether it's a new booking or not, is applied to the...

**Greg:** It's either applied to the booking or the list, however you want to view it.

## Hospital booking import and matching

**Donald:** What should it say — list/booking? with its source recorded. If it's a new booking, that goes to the list, but if it's an update of an existing one, it edits the booking. Yep. nice. Okay, first feature, feature 2.1, hospital booking download and matching screen. Today, AA staff take bookings from the hospital's daily sheets and downloads them and to match them to lists. and bookings on the matching screen. Only St George and Southern Cross are integrated with the current system. Everything from other providers is entered by hand. This manual download and match is a real pathway the system supports and today it carries the most bookings. So it is the priority intake pathway. The first release keeps the matching/manual admin review and adds an automatic sync from St George and Southern Cross into the screen. More hospital feeds and automatic matching are future work. So that's the feature. Let's go to the stories. Admins import hospital booking data into the system. This is so its rows appear in the matching screen ready to be matched. Now we don't know what the format of that is, but we just know there'll be some functionality to import.

**Greg:** I have one issue with that. That's only true for HL7 version two, not for version four, because version four is a REST architecture.

**Donald:** Which specific part are you in conflict?

**Greg:** Whereas actually it should be.

**Donald:** Yeah, again, when it comes to the integration. The team will investigate exactly what everybody's hospitals are going to provide and figure out the right way to do that. We just know that it's going to come in. I would love it if somewhere else in a user story, we might see it here. I did mistakenly describe the process it should take in terms of how that download happens. In terms of like, oh, it happens every so often, but also when you go on the screen, but also there's a button. And I realize it's all details that we need somebody else to figure out.

**Greg:** Import hospital booking details.

**Donald:** Okay, just Get rid of "files".

**Greg:** And take out a downloader, just import.

**Donald:** Don't do details, just bookings, hospital bookings.

**Greg:** That's what I have. Yeah, bookings.

**Donald:** Yeah.

**Greg:** And take downloader now, because it's not downloaded. It's just imported.

**Donald:** Yeah, hospital bookings and system.

**Greg:** Yeah, sure.

**Donald:** I mean, honestly, the system imports them, but... Let's keep moving. Cool. Next one here. For each row imported from a hospital download, let's just leave it as it is, the admin decides what happens to it. They can match it to an existing list or booking, create a new booking on an existing list, create a new list in an anaesthetist slot or a draft list when nobody has been assigned yet, or they can reject it. Really, they really ought to make this.

**Greg:** I do not understand why this is a manual task. Because it's obvious which one it needs to be.

**Donald:** Maybe I'm being a bit too bold here, but I don't think we should assume we understand at this stage how confident we can be about automatically matching anything. So we've said. that we will have a matching system and basically an import gate similar to the system today. If we echo what you said about Ben, he said we can live without integrations to get a version of this entire thing, which gives a lot of value out first and then after that come to figure out how we're going to do some automated importing.

**Greg:** Okay.

**Donald:** Yeah. Okay. So this is describing what the MVP is going to have. There'll be some stories, I'm sure, down below here, and there's further ones down here under integration. So just to make you happy, over here we have possible system integrations, and there's a bunch of epics, so features that have no details, but the stories are down here in the future work stuff. So we shall get there. Cool. So those are the things that they can do on this list. This is so our schedule always reflects the hospital data, blah, blah, blah, blah, accepted. Next, show differences on match. When an imported row matches an existing booking, the admin sees the field level differences such as time, patient, procedure before applying them. This is how admins can check exactly what the hospital update changes before applying them to the schedule.

**Greg:** I would love you for that.

**Donald:** Yeah. And so I guess the idea here is On the first instance, when a new booking comes in, it's manually matched. But in the future, when that booking gets an update, it still has to go through an approval step, but they just see what the difference is and accept it. I think that's what this is describing.

**Greg:** Yeah, it is. I mean, if it's a new booking, they just accept it.

**Donald:** If it's, no, if it's a previous booking, we can say they just accept it.

**Greg:** Yeah, but they're effectively accepting it as a new record, right?

**Donald:** There's no match. Yeah. Okay. In that case, this here is describing an update to an existing booking. It's still a manual thing that the admin staff have to do, not something that's automated.

**Greg:** Yeah, that's fine.

**Donald:** Okay. As I'm reading it now, I'm feeling like it wouldn't take too much for us to automate it after it's been matched the first time. But let's leave this in here for now and we'll see how it all shakes out. Unmatched queue: rows that can't be matched automatically stay in a queue. There you go. It talks about some sort of automatic thing for manual intervention. This is so nothing from hospital downloads is silently dropped.

**Greg:** Yeah, good.

**Donald:** Let's show some examples there. Cool. Okay. Automatic sync from St George and Southern Cross. The system pulls booking data from St George and Southern Cross, the two hospitals integrated today, into the matching screen. So admin no longer has to download it by hand. It pulls. On an automatic schedule, each time the admin... Oh, this is what I was saying before. I got into the weeds of describing how it should work, and I'm now realizing that that's a bit overkill. Like, I don't really know exactly the right way it should work.

**Greg:** Let's leave it out. Let's leave it out rather than trying to find it.

**Donald:** Yeah.

**Greg:** Because there's probably a better way they're doing it now and we can work it out as we go.

**Donald:** Okay. I'm just going to leave it as it is now. It's got an open question. And transcript, please update 2.1.5 to remove all of the faff about. all of the buttons and automatic schedules and opening, refreshing automatically on screen refresh and just update the story to state that St George and Southern Cross are in scope and the particulars of their technical implementation are yet to come. With that, you and I have—

## Reconciliation notes

- The recording/transcripts end mid-sentence after the discussion of St George and Southern Cross integration scope.
- A referenced person/name in the blacklist discussion could not be recovered reliably from either transcript and is marked `[unclear: person/name]`.
- A few short UI labels/examples and incidental phrases that remain genuinely unrecoverable are marked `[unclear]` rather than inferred.
