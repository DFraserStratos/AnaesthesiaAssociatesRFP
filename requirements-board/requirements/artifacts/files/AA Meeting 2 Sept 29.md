# Anaesthesia Associates --- Reconciled Client Meeting Transcript

> **Reconciliation note:** This transcript combines two independent
> automatic transcriptions of the same meeting. Speaker attribution
> follows the Microsoft Word transcript. Wording has been reconciled
> against the Voice Memos transcript where one recording is clearly more
> intelligible. Obvious transcription errors have been corrected (for
> example, *anaesthetist*, *RVG*, *Xero*, *Solutions Plus*,
> *Christchurch Eye*, *DHB*, *HPI*, *NHI*, *McMurray Centre*). Where the
> underlying words remain uncertain, the text is marked **\[unclear\]**
> rather than guessed. The dialogue remains a transcript: proposals and
> questions are not rewritten as agreed requirements.

## Opening and post-submission office review

**Donald:** Yeah, that's right. I'm just going to record this. The
recording last time was actually pretty bad, so I'm going to try a
different way this time. Yeah, anyway.

**Vanessa:** Only if you've got an iPhone, not those stupid Samsungs.
Have you got a Samsung?

**Donald:** No.

**Vanessa:** Oh, phew.

**Donald:** I've got a Mac. Cool. So where were we? Let's start with
some other questions I've got in my list here, and then we can go
through a different set of questions and talk about some of those
documents you sent me, which were somewhat confusing.

When you guys are approving a list for an anaesthetist after they've
submitted it, I think I know the answer based on what you've said to me,
but I just want to double-check: what exactly are you looking for when
you're reviewing them?

**Vanessa:** What do you mean, approving?

**Donald:** Greg described a workflow where, in the current system, the
anaesthetist has all their cards in a list --- we call them bookings now
--- and they submit that list. Then it comes to you guys and you review
it before it's approved for invoicing. Is that something that happens
now, or is that a future state?

**Vanessa:** We enter the lists, then they go up to the anaesthetist. Is
that what you're talking about?

**Donald:** I'm talking about post-procedure. They've done all their
procedures in that list, right? They hit submit and it comes back to you
guys. Greg described a step where you take a look at it and say, "Is
this right?" before you approve it for invoicing.

**Vanessa:** Yeah. We're looking at the e-cards to make sure the
addresses are correct, whether it goes to contract, whether insurance
needs to be added, whether anything is wrong, email addresses, all of
that kind of stuff. If it's a Miss under 18 or a Master under 18, it
needs to go under the adults --- Mr or Mrs --- it can't go to a child.
So all that kind of stuff needs to be changed.

**Donald:** Yeah, okay.

**Vanessa:** So stuff like that. That's where we come into it. Things
get missed, operations don't get filled out correctly. That's what we're
checking before it gets submitted off to the hospital and to the
patient.

## Incorrect invoices, refunds, credits and payment runs

**Donald:** When an invoice is wrong, what do you guys do? Would you
retract that invoice and send an updated one? Would you send a credit or
an additional invoice?

**Vanessa:** We fix the invoice and send it again.

**Donald:** Okay, so retract and update it.

**Vanessa:** Unless the patient's paid. Then we have to do a whole lot
of work --- journal it, or the anaesthetist... It's difficult, because
if the anaesthetist has already been paid, then the anaesthetist has to
pay the patient. But if the patient's paid before a Wednesday, we can
refund it because it's still sitting within AA.

**Donald:** Sure. So if it hasn't been paid by the billable party, you
can retract it and send an update. But if it has been paid and the
anaesthetist has already been paid, the anaesthetist handles the refund.
When they handle it, are they engaging their own accountant, or do they
come back to you and say, "Do something for me"?

**Vanessa:** We have to make a note within our billing for the
accountants that come to us, but they also have to make a note in their
billing for their accountant, because it shows on our books but it also
shows on their books that they've had to refund this patient.

**Donald:** I imagine that might be something that sits outside our
system as a manual thing and somehow connects with references or
whatever.

**Greg:** It sounds pretty ugly to me. I'm sure we could do a better job
by being able to raise a credit note and do the contra within the system
rather than getting everyone involved.

**Donald:** Yeah. This is where some Xero expertise is beyond what I
currently understand, but if people have recommendations for how to
engineer that, that's fine.

**Greg:** In terms of the internal process, Vanessa, I think it's well
worth looking at whether we can bring it back into the office. The
office could issue the refund, offset the anaesthetist account, and then
it just nets out on the next payment run.

Just a curiosity question: your payment runs are done on Tuesdays, is
that right?

**Vanessa:** Banking is done on a Wednesday, but it's Tuesday to
Tuesday. So we're a day behind.

**Greg:** So the anaesthetists get paid on Wednesday, up to Tuesday?

**Vanessa:** Yeah. So we're always a day behind.

**Greg:** That doesn't give you much room to make adjustments. Is there
any particular reason why it's paid on a Wednesday?

**Vanessa:** I wouldn't have a clue. It's always been done like that.
The old manager and the old director, I think, were the ones who made
that decision and it just stuck. You'd have to ask Ben, to tell you the
truth. I'm sure Ben can change it.

**Greg:** I haven't proposed the idea or talked about it at all, but
I've been thinking it would be tidier if you had a billing cycle from
Monday to Friday and it lined up with an ISO week number --- week 46,
for example --- and then week 46 becomes an accounting unit. Do you have
any particular requirements around month-end reporting in terms of how
you do payments?

**Vanessa:** We just have the 20th of the month. Michael does all the
outgoing money. We don't see any of that.

**Greg:** I'd be wanting to lobby that we change the billing cycle to,
for instance, Monday to Friday, paid on Tuesday. That gives the office
Monday to look at everything, reconcile it and unwind any problems, then
pay last week's week on Tuesday. Combined with that, I'd look at
bringing the administration of payment anomalies back within the office
so they get rolled into that cycle. If an anaesthetist has already been
paid, for instance, the office can pay the patient and offset that as a
credit in the next payment run.

What are typical reasons why an invoice gets rolled back?

**Vanessa:** We get a lot where NIB or insurance companies pay twice, or
the patient pays and the insurance company pays --- that kind of stuff.

**Donald:** I'm not an expert in this stuff, but in the invoicing work
I've done at Stratos, the accountants always recommend issuing credits
or new invoices to level out the books rather than retracting things. At
least then it would all be visible and traceable in the system.

**Greg:** It should be credits. The language has been "retract", but the
practice should be a credit note. Credit notes are a bit of a weak spot
in Xero, so we'll have to go through that. You can raise a credit note
in Xero, but it doesn't send it out to the customer for some stupid
reason.

**Donald:** Okay. I'm sure there must be an extension or something.

**Greg:** But I agree. There should be a clear document that says:
that's the debit, that's the credit; contra it out, carry on, do a new
debit.

**Donald:** You said Monday to Friday, but I assume you meant Monday to
Sunday, because there could be procedures on the weekend.

**Greg:** I'm talking about an accounting close-off on Friday. Maybe it
would be Saturday to Friday, if you want to look at it that way. You're
basically treating Friday like a mini month-end. You've got an
accounting period, you take a snapshot of the ledger at that point, do a
complete reconciliation, have a working day to sort it out, and then
give Michael a payment schedule for Tuesday.

**Donald:** Michael's the accountant?

**Greg:** Yeah.

**Donald:** Cool. Seems right to me.

**Greg:** It doesn't particularly matter what the period is. But if you
have the concept of a week, all calendars have week numbers now, so you
can give the week a name and say, "That was a painful week 47," and find
it easily. You could get a bank statement every Friday --- you'll have
daily downloads --- and reconcile it.

**Donald:** Nice. If somebody cancels a booking, say the day before or
the day of, is there any concept of cancellation fees?

**Vanessa:** No. You just take the loss.

## Prepayment estimates and automated calculation

**Donald:** Let's look at these questions. Some might be duplicates. We
talked last week about prepaid estimates. Sometimes procedures are paid
personally by the patient and the anaesthetist wants them prepaid. They
give a prepaid amount, but if the anaesthetist has an easier or harder
job, there needs to be an invoice or credit note afterwards to account
for the difference. We know all that.

**Greg:** Come back to that question, because there's an interesting
question about how those estimates are calculated.

**Donald:** Is the default prepaid amount a contract's fixed fee, an RVG
estimate at the anaesthetist's rate, or is it always entered by hand?

**Vanessa:** It's done by the RVG guide and our calculations. We have a
guide.

**Donald:** So if a patient rings and says they're going into theatre
for, say, a facelift ---

**Vanessa:** It's a 10, and you know it's a 10 because of the guide. Or
an 8, depending on the procedure. Then the time might be a 6, which is
90 minutes. But we can do 90 minutes as a 7 if we want to.

**Donald:** Are those base units, or some sort of base-plus-time figure?

**Vanessa:** It's time. Those are our time estimates. We get the base
from the RVG; these are time.

**Greg:** So it's base plus a time estimate.

**Donald:** You could put time brackets around those to determine what
they are. It sounds like the same calculations we already do.

**Greg:** It is. It's just a schedule/table that shortcuts it.

**Donald:** Then there's a rate applied. Can we assume the same
anaesthetist rate is used for both the base and time units in the
estimate?

**Vanessa:** Yes. Every anaesthetist is different with their rate.

**Greg:** It's the anaesthetist's rate.

**Donald:** Right. So for something prepaid, like a cosmetic facelift,
imagine the anaesthetist's profile says that facelift is a prepaid
procedure. The system has the base units, the estimated time units, and
multiplies those by that anaesthetist's rate. It's not an AA rate; it's
the rate on the anaesthetist.

**Greg:** What are the modifiers?

**Vanessa:** We always add two.

**Donald:** Plus two modifier units?

**Vanessa:** Two modifiers. No matter what, we always add two, just
because something can go wrong.

**Greg:** So it's base plus time plus two.

**Vanessa:** Yep. Anything can happen.

**Greg:** Somewhere we'll set that up as a table. That means the
estimate calculation should be automated. Now, does that estimate
invoice have its own text explaining that it's an estimate and payable
before the procedure, or is there a covering letter?

**Vanessa:** We write it ourselves.

**Greg:** Would you want to start from a template?

**Vanessa:** We would like a template.

**Donald:** A template for what?

**Greg:** The letter.

**Donald:** Oh yeah, we'll handle that. Hand wave, hand wave.

**Greg:** You could have a small number of standard letters/templates.

**Vanessa:** Yeah. We do a lot of prepays now and we're just forever
writing them.

**Donald:** If I call and say I want a facelift, how do you know the
estimated duration?

**Vanessa:** The surgeon's rooms tell us.

**Donald:** So the surgeon's PDF might say, "Facelift for Donald,
estimated 40 minutes." We have the procedure and the estimated time,
which gives us base plus time. How do we get from time to units?

**Vanessa:** If the surgeon's rooms email or phone us and say 90
minutes, we look on our table. It might be a six or a seven. We take
that, then do the base --- say 10.

**Donald:** But the RVG is doing the underlying calculation. At the top
it says eight units for the first two hours --- one unit per 15 minutes
--- and then after that the interval changes. This local table is
basically a shortcut.

**Greg:** That's standard RVG. My question is: how do you decide whether
90 minutes is six units or seven units?

**Vanessa:** You look at who the anaesthetist is. If they're on a
smaller rate or a higher rate, then you go six or seven.

**Donald:** But if the future system just calculates the time units from
the actual duration using the standard rule, we can get rid of that.

**Vanessa:** That would be so much easier.

**Greg:** So currently there's a heuristic: higher-rate anaesthetists
get fewer time units and lower-rate anaesthetists get more. But we can
remove that and use the standard calculation.

**Donald:** Exactly.

**Vanessa:** If an anaesthetist on the lower rate wanted a higher rate,
they would have set a higher rate. They want to charge what they charge.

**Greg:** So the current practice is a bit weird.

**Vanessa:** It's very weird.

**Greg:** Good. We'll remove that manual heuristic. We're trying to
automate repetitive work wherever it can be done reliably.

**Vanessa:** There's a lot of repetitive work here. I did nine prepays
yesterday. It was over and over again.

## Holidays, leave and availability conflicts

**Donald:** In the future, when an anaesthetist says they're
unavailable, or a private hospital is closed on a given day, should the
system block you from assigning a list/booking, or should it allow it
but show a warning?

**Vanessa:** At the moment I run a report that tells me which surgeon
needs to be covered and which anaesthetist is away. I don't mind what
happens in the future. I would just love an easier system.

**Greg:** Good. No reports then. Private hospitals are closed on
statutory holidays and their Christmas shutdowns.

**Donald:** What if there's emergency surgery and they need an
anaesthetist?

**Vanessa:** That goes to public. Private don't operate.

**Greg:** Public isn't in scope here. The next case is an anaesthetist
who has a permanent Tuesday booking and books annual leave but forgets
to block the day. The list is sitting there and eventually someone
notices the anaesthetist isn't available. Or they did block the day, but
a surgeon books them anyway. You want a visible conflict to resolve ---
a dashboard with colour or a to-do list.

**Vanessa:** A dashboard with colour.

**Donald:** The prototype already shows an example of a warning around a
list. So should it completely block, or soft-warn?

**Greg:** Blocking creates more problems than it solves.

**Donald:** Okay, soft warning.

**Greg:** Let it book, then show a flag saying you've got a booking on
an unavailable list.

**Vanessa:** I'm happy with that, as long as it's not what I do now:
printing paper, writing on paper, covering it, then printing it again to
check. You're constantly checking.

**Greg:** It can be the same mechanism as a short-notice sickness: the
booking remains, an availability conflict appears, and it changes
colour.

**Vanessa:** Yeah.

**Greg:** Most of the time, if it's short notice, the anaesthetist will
reassign the list themselves --- they'll find someone else.

**Vanessa:** Short notice, yes, but not long notice. If they wake up
sick they'll call another anaesthetist themselves. If they can't get
anyone, they might ring us and say, "I couldn't get hold of anyone. No
one can do my list. I'm not well for the afternoon. Can you help cover
it?"

## Anaesthetist profile and office overrides

**Donald:** Do anaesthetist bank account details live in Solutions Plus
/ the future system?

**Vanessa:** Everything lives in the system --- addresses, details,
everything.

**Greg:** Trust-account payments will be made out of the new system.

**Donald:** Okay. Can the office apply or change an adjustment or price
override during the submitted review, or does it need permission?

**Greg:** You're talking about overriding the contract, right?

**Donald:** I guess so.

**Vanessa:** Yes, we can do that.

**Donald:** So after a booking is created, the procedure is completed
and the anaesthetist has filled in their details, can the office still
change it as needed?

**Vanessa:** Yes, we can.

## Contracts, Christchurch Eye and billable party

**Donald:** Greg and I have been developing a particular meaning for
"contract". The idea is that a procedure can have multiple relevant
contracts --- different fixed rates, base-unit rules, insurers,
hospitals, etc. When a procedure is selected, the system would show only
the relevant contracts. You wouldn't see St George's contracts on a list
at a different hospital, but you might see the default RVG arrangement
for a patient-funded case.

**Greg:** Christchurch Eye has fixed-price arrangements. In the future,
the anaesthetist's booking knows the hospital and procedure, so it could
offer a drop-down of relevant Christchurch Eye contracts for that
procedure. There may be multiple arrangements --- for example Southern
Cross, ACC, or other funded work --- plus a standard/default rate. What
happens when the procedure isn't on Christchurch Eye's standard
operations schedule?

**Vanessa:** If the surgeon/hospital sheet says it's under contract, we
put it under contract, but I would contact Lesley at Christchurch Eye to
make sure. I wouldn't send it to the patient if the hospital sheet says
it's under contract, because then the patient might pay and we'd have to
refund it.

**Greg:** So the "13th operation" --- one not on the schedule --- might
actually be under a new contract you don't know about yet.

**Vanessa:** Exactly. Hospitals bring out new contracts all the time. I
always check.

**Donald:** And if Christchurch Eye confirms there is no fixed contract
fee for that procedure, they might say to use RVG/default pricing
instead.

**Vanessa:** Yes. Sometimes the instruction says "no insurance, send it
to the patient", then later we get an email saying the patient called
and Christchurch Eye wants the invoice sent to them instead. It might
not be on the contracted-rate sheet yet, but they've added it as a new
arrangement.

**Donald:** So our system's "contract" concept also needs to distinguish
the billable party. In that example, the pricing may remain default RVG,
but the billable party changes from the patient to Christchurch Eye.

**Greg:** Correct. You're changing the billable party. That may be
independent of the charges.

**Vanessa:** For Southern Cross-insured cases at Christchurch Eye, the
invoice can go to Christchurch Eye, and Christchurch Eye gets reimbursed
by the insurer.

**Donald:** So in the "13th procedure" scenario it could remain the
default RVG contract --- base, time and modifiers --- while the invoice
recipient/billable party changes to Christchurch Eye.

**Greg:** Yes. We've used "default contract" to mean the system always
has some pricing rule. The default contract is effectively the "no
special contract" contract: normal RVG pricing, with no specially agreed
fixed price or modifier rules.

**Donald:** If one of Christchurch Eye's fixed-fee procedures is used,
would you ever override the price afterwards, or is fixed fee simply
fixed fee?

**Vanessa:** Normally, if it's a fixed fee, it's a fixed fee.

**Greg:** We should still preserve flexibility, because earlier Vanessa
said the office can change anything.

**Donald:** Okay. So don't hard-code "fixed fee can never be changed";
it needs authorised flexibility.

**Vanessa:** There are a lot of Christchurch Eye fixed fees, and there
are DHB/outsourced arrangements as well. They email us changes. There's
an annual schedule/rate card, but additions come through during the year
--- particularly as outsourced lists change. They usually give an
effective date, sometimes with a few weeks' notice.

**Donald:** So pricing records need an effective-from date. And
Christchurch Eye might have different prices for the same procedure
depending on the funding arrangement.

**Greg:** Right.

**Donald:** I think the model is: some contracts have a fixed rate. The
anaesthetist still records base, time and modifiers as clinical/billing
record data, but the charge is the fixed rate. Other contracts calculate
the charge from RVG base + time + modifiers. Authorised adjustments may
still be possible.

**Greg:** And then prepayments overlay that model as another
lifecycle/process.

## Prepayment wording, cancellation and reassignment

**Greg:** How do you word the patient communication to make clear that a
prepayment is an estimate? Is it always an estimate, or can it be fixed?

**Vanessa:** We always word it as an estimate. Patients can get quite
grumpy if it goes over and want to know why the final amount is higher
and what happened in theatre. So we make clear that it's an estimate.

**Donald:** If somebody prepays and then the procedure is cancelled, how
do you process it?

**Vanessa:** It's tricky. If the patient gets sick, they don't always
end up on the same anaesthetist's list later. A lot of the time the
patient wants a refund, so if the anaesthetist has already been paid,
the anaesthetist has to refund the patient. We talked ages ago about
putting the money into a different account, but that didn't happen.
Sometimes one anaesthetist will just pay the replacement anaesthetist.

**Greg:** I would prefer to see all of that handled centrally through
the trust/accounting process. Otherwise reconciliation gets too loose.
If you always refund the original prepayment and then create a new
prepayment for the new anaesthetist, it's clean.

**Vanessa:** That would be much easier for us. There's a lot of toing
and froing now. And anaesthetists have different rates, which makes
moving the original payment between them tricky.

**Donald:** So the proposed future process is: refund the original
prepayment, then create a new prepayment against the replacement
anaesthetist.

**Greg:** The trade-off is that the patient may receive two different
estimates because the anaesthetists have different rates. In the current
informal process, the replacement can sometimes effectively inherit the
first anaesthetist's amount.

## Hospital integrations and rollout strategy

**Donald:** When integrations exist in the future, can inbound hospital
data set or suggest the contract, or is that always an AA decision?

**Vanessa:** The hospitals. They know the contracts and tell us. They
send hospital sheets every day telling us the contracts.

**Greg:** Is that an integration now?

**Vanessa:** Sometimes the hospital contract comes through the
integration and sometimes it doesn't, so we have to add it. The
integration includes the contract and patient details. Insurance
information comes from the sheets/secretaries and we enter that
separately.

We get hospital sheets from Forte, Southern Cross, St George's and
Christchurch Eye every day and check them against our system to see
which anaesthetist is on the list and make sure things haven't been
double-booked. Times change, patients disappear and new patients appear.

**Donald:** That's going to be a whole rat's nest to understand. Given
the build approach, we don't need to understand every integration
perfectly at the beginning. We can navigate our way through it.

**Greg:** The better rollout may be to deliver the core system earlier
without deep integrations, move AA onto the improved workflow and
reconciliation model, then tackle integrations as a second phase.

**Donald:** I agree. Build the whole system with a matching/manual
review process similar to today. Once we understand the incoming data
shapes better, automate more of the updates and matching.

**Donald:** Does Solutions Plus currently import from anything other
than hospitals?

**Vanessa:** Just hospitals.

**Donald:** Which hospitals are actually integrated now?

**Vanessa:** St George's and Southern Cross. Forte tried, but they could
never get it working with Solutions Plus. Nectar, Solutions Plus and
someone from Forte tried for months.

**Greg:** Forte does have an export; they just couldn't get it talking
to Solutions Plus.

**Vanessa:** We also deal with Burwood, Christchurch Eye, Forte,
Southern Endo and McMurray Centre. McMurray only has a couple of lists.
We manually enter everything that isn't integrated.

**Greg:** Burwood is public, but some of the work AA handles there is
effectively private/outsourced theatre work, including plastics and
orthopaedics under outsourced funding arrangements.

**Donald:** Have you received documentation about how the existing
integrations work?

**Vanessa:** A few emails years ago, but nothing substantial. I can dig
them out, including the Forte material.

**Greg:** Carol from Solutions Plus may be helpful. I'm hoping we may be
able to obtain some of the Solutions Plus data. I think the database is
SQL Server hosted on Amazon, but we need to confirm what data is useful
rather than assuming we migrate everything.

**Donald:** A clean cut might actually be better for some of this.

**Greg:** There aren't so many hospitals and surgeons that the clean
reference data couldn't be rebuilt from a controlled spreadsheet if
necessary.

## Outbound notifications and unallocated lists

**Donald:** Do hospitals ingest any data from AA today, or is everything
one-way into AA?

**Vanessa:** Today it's basically one-way. But the data hospitals would
probably like from us is when the anaesthetist assigned to a list
changes. I spend a lot of time emailing them about cover changes.

**Donald:** Even before a true outbound integration, the system could
generate a pre-filled Outlook email for the office to review and send.

**Vanessa:** They would love that.

**Greg:** There's another topic we haven't covered much: unallocated
lists. We know about permanent lists, but there are lots of extra lists
that need an anaesthetist allocated to them.

**Donald:** So a list can exist without being attached to an
anaesthetist?

**Greg:** Yeah, lots of them. They're not covered by a permanent
booking.

**Donald:** My mental model was that each anaesthetist has rolling AM/PM
list slots generated four months ahead, with recurring/permanent
bookings pre-filled. But you're describing another object: a
list/request that exists before an anaesthetist is assigned.

**Vanessa:** We get those requests daily, including from surgeons'
rooms/secretaries.

**Donald:** So these are effectively unallocated/draft lists that enter
the matching process and need someone assigned.

## Surgeon profiles, rooms and "naughty list" matching rules

**Greg:** We also need to make sure we haven't forgotten the blacklist
--- or "naughty list" --- of combinations that shouldn't be matched.

**Donald:** We haven't explicitly programmed that into the model yet. We
discussed whether the system should know those relationships or whether
the office would just manage them manually.

**Greg:** My view is that it would be very helpful for the office if the
system knew them. It can flag a no-match.

**Donald:** So an anaesthetist profile could contain surgeons they don't
work with.

**Greg:** Yes. It's combinations --- particular anaesthetist/surgeon
pairings that don't work together for whatever reason.

**Donald:** That means we need a master list/profile of surgeons, not
just free-text surgeon names.

**Greg:** Yes, and probably a master list of surgeons' rooms as well,
with surgeons associated with rooms. There's structure there.

**Vanessa:** In the current system, surgeons already have an
admin/profile page like anaesthetists do. A surgeon has their New
Zealand medical registration number, their HPI number and a CPN number.

**Greg:** HPI is the Health Practitioner Index.

**Donald:** Right.

> **Reconciliation correction:** The meeting then incorrectly equated
> HPI with NHI. They are distinct identifiers. HPI identifies health
> practitioners/organisations/facilities; NHI identifies patients. The
> meeting does, however, clearly establish that **HPI and CPN are fields
> held on the surgeon profile**. Vanessa described CPN as a number
> associated with prescribing/script details and appearing on the
> practitioner's New Zealand medical certificate. The exact expansion of
> "CPN" was not established in the meeting.

## Patient identity and NHI

**Greg:** One of the current system's recurring identity problems is
that NHI isn't being used as the patient unique identifier. If you've
got a solid ID, then changes to phone number, address or name spelling
are just updates to the same person instead of creating duplicates.

**Donald:** I think there are NHI APIs as well.

**Greg:** Would the NHI always come through on the booking?

**Vanessa:** Not necessarily. Some surgeons' rooms don't include it.
Their systems should hold the data, but the PDFs they send us don't
always pass it through. We may have to wait until the daily
hospital/theatre list to pick up the NHI.

**Greg:** In public health there can also be tourists or itinerant
workers where identity handling is different, although that's less
relevant here.

**Vanessa:** Normally when we get overseas patients they have
everything, because they need to be pre-billed. I've never personally
come across one at the relevant stage that doesn't have an NHI.

**Donald:** So can we require NHI before the booking can proceed?

**Vanessa:** I think so.

**Greg:** If it's missing, it could sit on an exception/problem list
until it's fixed.

**Vanessa:** Then we'd email the surgeon's rooms to get it. The
anaesthetist also needs the NHI to look the patient up in Health
Connect, so if we don't have it we're not doing our job.

**Donald:** So rather than silently creating duplicates, missing NHI
becomes a visible issue that must be resolved.

## Supplementary post-operative billing

**Donald:** Post-op ward/HDU reviews, nerve-catheter days and pain
consults can happen after the original list has already been invoiced.
If authorised bookings are immutable after they've left the app, how do
you bill those later events?

**Vanessa:** In the current system we use "next account". We can create
another account/invoice. It gets another number --- we talk about the
"six number" and the "three number" --- but it's attached back to the
original.

**Donald:** I get lost with the six- and three-number terminology. What
I'm hearing is that the new system needs to support a supplementary
charge/invoice connected to an already existing procedure.

**Vanessa:** Yes. The anaesthetist might email and say they did a
post-op review and ask us to bill it. We go into the original invoice
and create another one from it.

**Greg:** Is the supplementary charge based on time?

**Vanessa:** Time and/or modifiers. It uses time units.

**Donald:** So the anaesthetist might say, "I saw Donald for 15
minutes," plus any applicable modifiers, and the office creates the
supplementary billing from that.

## Credit/reissue flow and Xero boundary

**Donald:** If an invoiced booking is wrong, what's the
credit-note/reissue flow? I think we've already covered it: credit the
incorrect financial document and generate the corrected one.

**Greg:** That raises the question of exactly how rebuilding works.

**Donald:** There are workflow diagrams where I've mostly treated Xero
as a box for now. We'll need to work through the nitty-gritty later.

**Greg:** My preference is: do the business logic in the app and tell
Xero what the answer is. Otherwise Xero falls over itself. Xero is very
good at what it deliberately does, but it keeps the core relatively
narrow and expects an ecosystem around it.

## Anaesthetist visibility after submitting a list

**Donald:** The RFP currently says that when an anaesthetist completes
and submits a list, they can still see it until the office approves it.
After office approval, it disappears from their active screen. Does that
sound right, or would they want it to disappear immediately on
submission?

**Vanessa:** You'd have to ask the anaesthetists. That's definitely
their call. I think they need to be able to see their stuff, but ask
them.

**Greg:** The reason I proposed it that way is so it doesn't just
disappear. It moves from unbilled to billed/processed rather than simply
vanishing.

## Outstanding invoice warning

**Donald:** We talked last week about warning the office when a patient
with an outstanding invoice has another procedure coming up. Should the
warning appear for any unpaid invoice, or only after it's overdue?

**Vanessa:** We have invoices six months to two years old where patients
come back and say they didn't know they had it or thought they'd paid
it. I'd like the warning after maybe 90 days.

**Greg:** You could make it a configurable warning threshold.

**Vanessa:** We invoice daily --- around 100 invoices a day --- and
patients are allowed 90 days, so you can't really treat it as a problem
before then.

**Donald:** Okay. Start with 90 days, configurable, and confirm with
Ben.

## Source data quality in Solutions Plus

**Donald:** You sent me this document, which I interpreted as an extract
from Solutions Plus. Did you have to print it, scan it and send it
because the system won't export?

**Vanessa:** Yes. It won't let us export.

**Donald:** Looking at it: does the "number" column mean how many times
the operation has been done?

**Vanessa:** I don't know. The only reason I printed it was because it
contains the operations.

**Donald:** I've been assuming base/time/modifier units are whole
numbers, but some rows say things like base 6.2 and some say zero.
Should I consider those values non-canonical?

**Vanessa:** Yes. Ignore that data. Use it for the operation names, not
the units/rates.

**Greg:** Use it for structure. The reference data will have to be
reworked and loaded from new controlled spreadsheets.

**Donald:** So I can use it as a starting list of procedure names, then
have you fill in the authoritative base units and other data.

**Vanessa:** Exactly. There is junk in the operation list too. For
example, things like "10% discount" have accidentally been saved as
permanent operations because someone clicked yes when adding them.

**Donald:** So this isn't migration-ready master data. We'll need to
clean it.

## Combined cosmetic procedures and insurer-requested splits

**Donald:** There are entries such as abdominoplasty plus breast lift
plus liposuction. In some earlier discussions we said combined
operations should be split into their individual procedures because
multiple procedures occur within one booking. But these cosmetic
schedules show a fixed price for a combination.

**Vanessa:** Cosmetics are different. These are generally prepays/fixed
arrangements. Multiple procedures can be represented as one combined
operation. It's only split out if an insurer asks for it. Sometimes the
patient receives the invoice and Southern Cross comes back asking for it
to be split three different ways, even though it all ultimately relates
to the same case.

**Donald:** In the current system, does the combined operation initially
sit as one operation?

**Vanessa:** Yes. It always goes out billed as one until we're told to
split it.

**Donald:** And if the billable party asks for the line items split
after invoicing?

**Vanessa:** We go back in and create the additional "three-number"
entries to split it.

**Donald:** So for the future model, a predefined combined cosmetic
procedure could remain a valid master procedure/bundle with a fixed
price. If it later needs to be split for billing, the system needs a way
to create supplementary/replacement invoice components. The individual
component prices may not simply add to the bundled price, because the
bundle can carry a discount.

**Vanessa:** Correct.

## RVG mapping, base units and modifiers

**Donald:** I had assumed every standard operation name ---
appendectomy, for example --- would have its own RVG code. But there
aren't nearly enough RVG entries for every operation name.

**Vanessa:** No. You pick the RVG category/code that the procedure
belongs under. The exact operation name may not appear verbatim in the
guide.

**Donald:** So in our master procedure list, every procedure should map
to an appropriate RVG code/category where applicable, even if the RVG
doesn't explicitly name that procedure. There will be gaps to map
manually.

**Vanessa:** Yes. I can help map them.

**Donald:** I also see what looks like the same RVG code --- T2, for
example --- associated with different values.

**Vanessa:** One may be minor and one simple. I'll check how it is
represented in our system; I've come across that before.

**Donald:** So we shouldn't assume that the RVG code alone is enough to
derive the stored base units. We need authoritative base-unit data as
well.

**Vanessa:** Yes.

**Donald:** There are also notes such as "add two units if sitting
position" or loading for prone position. Those are modifiers rather than
base units, right?

**Vanessa:** Yes. Beach-chair/sitting position and similar things are
modifiers. The simple guide doesn't list all of them. I have a
book/source with the fuller modifier list and can send you the modifiers
and their units.

**Donald:** And there can be contracts where the default RVG base units
for a procedure are overridden for a particular hospital/funder
arrangement?

**Vanessa:** Yes. I haven't sent you all of those yet, but I have the
material.

**Donald:** Great. So the reference-data work will need authoritative
procedure names, RVG mappings, base units, modifier rules, fixed-fee
schedules, and any contract-specific overrides.

## Follow-up material

**Vanessa:** I've got a sheet with the base units for the operations we
actually use. I'll send that to you, along with the other
contract/modifier material.

**Donald:** Great.

**Vanessa:** Do you want copies of the different surgeon/hospital sheets
as examples?

**Donald:** Yes --- one example of each kind of PDF would be useful.

**Vanessa:** They have patient details on them, though.

**Donald:** I've not signed an NDA.

------------------------------------------------------------------------

## Reconciliation notes / remaining uncertainties

The following points were intentionally **not** silently resolved
because the meeting itself did not establish them with enough
confidence:

-   **CPN:** Confirmed by the user as a surgeon-profile field alongside
    HPI. Vanessa associated it with prescribing/script information, but
    the meeting did not establish the full name or exact semantics.
-   **"+2 modifiers" on prepayment estimates:** The meeting consistently
    describes adding two as a contingency. It remains worth confirming
    whether these are literally recorded as modifier units, an
    estimation-only two-unit buffer, or two specific modifier units.
-   **RVG time rule after two hours:** The speakers clearly agree that
    the standard RVG time calculation should replace the current
    six-versus-seven heuristic, but the exact post-two-hour
    interval/rule should be taken from the authoritative RVG material
    rather than this transcript.
-   **Three-number / six-number terminology:** These are current-system
    identifiers in Solutions Plus. The business meaning is clear enough
    to infer linkage between original and supplementary billing, but the
    exact numbering semantics should be documented from the current
    system rather than guessed.
-   **Fixed-fee overrides:** Vanessa first describes fixed fee as fixed,
    while the broader discussion says office staff need flexibility to
    change charges. The safe requirement is authorised override
    capability, with the normal/default behaviour preserving the fixed
    fee.
-   **Missing NHI:** The desired future process is clearer than the
    current process: missing NHI should become a visible exception that
    must be resolved. Whether a booking is technically created in a
    provisional state or prevented from being created at all remains a
    design decision.
-   **Combined procedures:** The current workflow supports combined
    cosmetic operations that may later be split for insurer
    presentation. Whether the future domain model represents these as a
    procedure bundle, a distinct combined procedure, or invoice-only
    decomposition remains a design decision.
-   **Weekly payment-cycle redesign:** Greg's Friday close / Tuesday
    payment model is a proposed future-state accounting process, not a
    confirmed current requirement.
-   **Centralised prepayment refund/rebuild:** The meeting strongly
    prefers this as a cleaner future process, but it is a proposed
    process change and should be confirmed with the appropriate
    financial/accounting authority.
