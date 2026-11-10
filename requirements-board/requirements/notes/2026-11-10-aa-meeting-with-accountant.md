# AA meeting with AA's accountant, 2026-11-10

- **Who:** Michael (AA's accountant, Notes 2026-10-27 · AA meeting with Ben and Vanessa #13), Greg
  Smith (RFP author, Peritia), Sam (working with Greg on the accounting process, and to work with
  Donald on it next), Ben (AA principal) and Donald Fraser (Stratos, product owner). Vanessa is
  discussed but not present (L7).
- **Covered:** the money half of the system, picked up from the point an invoice exists (L39): all
  money through the one trust account; who sends invoices; the bank feed and matching in Xero; the
  invoice and bill as a matching pair through a clearing account; holding prepayments until the
  procedure is done; AA's system as the master and Xero as its "cash and banking servant"; the daily
  bank reconciliation and a remittance add-on; payment approvals and controls today; a weekly cycle
  with a clean reconciliation before every payment run; receipts nobody can place; credit notes and
  re-invoicing; online payment links; overs and unders; part payments and split bills; the trust
  account at year end; and the next steps. Donald stepped the group through the trust account
  diagram ([AR-63](../artifacts/AR-63.md)), and Sam found its gap: the Sales side is never cleared.
  No items or questions were edited during the meeting.
- **Inputs gathered here:** one reconciled transcript,
  [AA Meeting with Accountant 10th Nov Reconciled Transcript](<../artifacts/files/AA Meeting with Accountant 10th Nov Reconciled Transcript.md>),
  registered as artifact [AR-64](../artifacts/AR-64.md), reconciled from three automatic
  transcriptions of the recording (the raw audio is not in the catalogue).

Cite a point as `"Notes 2026-11-10 · AA meeting with accountant #n"`. Points are numbered once across
the whole note. Speakers' wording is kept in short quotes (spelling fixed, filler dropped); the
summaries around them are paraphrase, with the transcript as the authority. Positions are transcript
line numbers ("L467-487" is lines 467 to 487). The transcript's own reconciliation notes (L1079) say
that the prepay creditor, a second bank account, per-anaesthetist prepayment sub-accounts, the weekly
cadence, payment links and adjustments "describe options under discussion, not necessarily final
decisions"; this note follows that reading. Greg and Sam are now drawing the process maps and
T-accounts for each use case, for Michael to check (point 2): most of what follows is input to those
maps rather than a decision. The acronym for the buyer-created tax invoice (L261) and the payment file
label (L697) are indistinct in every source (L1077-1078).

## Questions answered

1. **OQ-47, the weekly payment cycle: the accountant wants more time before payment; Greg now
   proposes paying on Thursday.** No
   board answer. Greg opened with the proposal: "change the cadence or rhythm of the payments cycle
   and change it to maybe a weekly bounded cycle... so that effectively a week becomes a period and we
   can account for that to a fully reconciled amount before the payment run. So the payment run is
   always presented with a full reconciliation before the payments go out." (L35) Michael came back to
   it: "one thing that could be brought in would be to change the timeline of the payments to give
   them more time." (L467) Greg: "align the cycles with European weeks... use week number as a counter
   through the year... I was going to say Mondays to do the reconciliation and Tuesdays to do the
   payments... But it could be Monday, Tuesday to do the reconciliation and Wednesday to do the
   payments. It wouldn't really matter, because it's just a one-time shift." (L469) Michael: "we've
   got to build the right expectation in the anaesthetist." (L471) Greg: "I'd say Thursday... Monday
   to Sunday." Michael: "And pay it on Thursday. It gives you four days." Greg: "so if something's
   wrong, you've got time to dig down and find it." (L477-481) Ben: fixing a problem "might take a few
   days, because it might take a bit of emailing" the hospitals' accounts departments (L483). Greg:
   "we don't want to carry forward items in a reconciliation. We want a clean reconciliation." (L487)
   So Michael raised moving the payment day later himself and suggested Thursday, but did not speak
   to the weekly cycle or the week numbers as such; Greg's proposal moves from the catalogue's Friday
   close and Tuesday payment towards a Monday to Sunday week (Greg also said "from the Friday"),
   reconciliation from Monday, and payment on Thursday (or Wednesday, L469). The days are not agreed:
   the transcript lists the weekly cadence as an option under discussion (L1079), and Greg and Sam's
   process maps (point 2) will set it out. Greg also: "You've got to nail it every week." (L231) Bears on
   US-10.2.7, FT-10.2, US-10.2.1 and US-10.2.6.

## Other points

2. **Next step: Greg and Sam draw a process map and T-accounts for each use case.** Greg: he and Sam
   will "draw some process diagrams about how that cash flow, or how those flows, work across the two
   systems", walk Michael through them "step by step... to critique it", then hand them to Donald;
   "Sam's going to work with Donald, like I have with him so far on the scheduling, around the
   accounting, and they're going to put that into the work item definitions." (L25-29) Sam: "There's
   the process, and then there's the accounting... you need to keep them separate and actually agree
   the process and then check the accounting... a wee pack of the flow and the accounting." (L175)
   Greg: "there's about four or six key process types: the standard invoice, the prepaid invoice, and
   then some variations around how to roll back transactions or adjust transactions." (L177) On
   Donald's diagram: "I think you're jumping ahead too fast here, Donald. I think it'd be better if you
   just let us get it all documented out, because it is quite subtle." (L663) Greg: "little process
   flow diagrams for each use case, and then Donald can build them and we can step through them on the
   screen... that's what goes to the development team" (L889); about a week, with Michael's check, and
   "it will take what it takes" (L893-905). Sam: "We're not expecting the diagrams to be perfect first
   time." (L977) No requirement change; the trust account diagram is redrawn from their maps when they
   arrive (point 28).

3. **AA's system is the master; Xero does only what it is told.** Greg: Xero is "an add-on to the AA
   application... just sitting there as a cash and banking servant, really. It does the payments, does
   the receipts, does the reconciliations, remittances" (L25); "we'll treat the AA app as the master
   and Xero will just do what it's told. That way we haven't got any logic operating in Xero... all
   the smarts are living on the AA side." (L377) The integration itself is "well defined by Xero, it's
   well known by Stratos"; "there's almost no UI in the middle" (L35). Michael: a user "could go on
   and edit the transaction" in Xero, for example move a prepayment matched to Dr Nick that should go
   to Dr Ben, "and again, we need to think about controls around that." (L379) Sam: "doing those
   changes in AA and getting them to pull across into Xero. So then you can lock down Xero a bit more"
   (L381). Greg: "They don't do any manipulation in Xero. It just is always reflecting what AA is
   telling them to do." (L383) Donald: our system holds the balance and mirrors Xero, with no private
   patient information in Xero, and the visibility tools live in our system; Michael: "Yeah, I agree."
   (L123-125) Bears on US-08.3.2 and US-09.4.1; no change to their rule.

4. **Every receipt goes through the one trust account.** Ben: today money "sometimes... gets paid
   directly into our bank account as well. Which we're going to change." Michael: "it'll all have to
   go through the one account... It's just making it too hard." (L47-49) Greg: "It has to go through
   the one account if you want to be able to reconcile it." (L53) Ben: AA did this for a while, but
   Vanessa "became completely overwhelmed with the banking because of the system", so they went back
   until the new software (L55-59); "it's been socialised"; some anaesthetists complained about "a
   couple of days delay in them getting their money, but they got over that pretty quickly." (L63)
   Bears on US-10.1.1: consistent with its single payment path, though it does not yet say that every
   receipt lands in the one trust account.

5. **Who sends the invoice: Greg proposes our system, but Xero's payment link is a rival.** Michael:
   "The invoice would be issued through Stratos... then that would flow through into Xero, and then it
   would be emailed to the patient." Ben: "Will the invoice be sent through Xero? Or through the
   software." Greg: "I'm proposing that it goes through the Stratos app because Xero hasn't got quite
   enough intelligence to do what we want to do with designing the various invoices." (L71-77)
   Michael: "the invoices need the anaesthetist's name and GST number... with AA's bank account."
   (L79) Later Greg raised the other side: "if we raised or dispatched invoices out of Xero, you could
   use the credit card payment feature that's in Xero... and that really nails down the
   cross-reference problem" (L783); Ben: "that is actually a pretty nice feature" (L785) and asked
   whether the app could have a merchant facility instead, "team up with Paymark" (L789-793), so a
   patient can pay online and the payment is "matched to an invoice" (L797-801). Michael: "the main one
   Xero uses is their Stripe." (L807) Greg: Xero's option "is all there and it all works and it comes
   straight back in", fees unknown (L809-813); whether to invoice from Xero is "one of the things we
   have to decide." (L817) Sam: "a decision... we need to look at pros and cons"; with "Pay Now... it's
   already matched it to the invoice" (L819-823). Michael: "whatever you pay in fees, it would come
   back in productivity." (L821) Not decided. Bears on US-08.4.1, US-08.4.2, FT-08.4 and
   Notes 2026-10-28 · AA meeting with Greg #50.

6. **A receipt arrives by bank feed, is matched in Xero, and AA is told.** Michael: the payment "is
   going to appear in Xero as part of the bank feed... they go in overnight, and appear the next day.
   Then those payments will need to be matched to the invoice, which will be in Xero, and then that
   will also flow back to Stratos... to be matched up... with the invoice sitting in Stratos." (L83)
   Greg: "anytime a transaction is touched in the banking, it notifies AA that there's been a change
   and AA goes and does the syncing." (L691) Matching is by "reference and amount" (L387). Bears on
   US-09.2.1, US-09.2.2 and US-10.2.3; consistent with them.

7. **A sub-ledger for every anaesthetist that should run to nil.** Michael: "What we do in Xero
   normally is set up a ledger for every person... you would see the payment... going into that
   ledger when it's received, and then when it's paid out it would be going out. So in theory that
   ledger should balance down to nil", and staff can see where a mismatch is (L83). On the diagram's
   sub-ledgers, "sub-ledger for Dr Nick... we'd want the staff to be also to be able to dig down into
   that as well." (L111-121) Bears on US-08.3.5 and US-13.2.1.

8. **The invoice and the bill post through a clearing account that should always be zero.** Greg:
   "instead of having a sales or expense account, we thought we'd create a current asset called a
   clearing account, because the bills and the invoice should always run to zero. But we need a
   posting account for the Xero transaction." (L265) Sam: "it's also a sign if there's money in it...
   that something hasn't worked." Greg: "it's an instant flag." (L267-269) Greg: "when the invoice
   comes in, we're going to debit the debtor and credit the control account. And we're going to credit
   the creditor, the anaesthetist, and debit the control account. So you end up with the anaesthetist
   and the patient in terms of payer and payee, and the clearing control account should always be
   zero." Michael: "Yep." Sam: "the quickest way to say you're out of sync." (L273-277) Greg: "it's one
   of your quick checks." (L283) Greg and Sam's proposal, with Michael's assent in the room; part of
   the maps of point 2. Bears on US-08.3.1, US-09.1.1, US-13.2.1 and the trust account diagram
   (point 28).

9. **The bill is the buyer-created tax invoice, loaded as a matching pair.** Greg: "We've got to
   bring the bill in for the doctor. We're expecting that we're going to generate a [buyer-generated
   tax invoice]... We'll generate the invoice on behalf of the [unclear]. And then that will become the
   payable, and we'll load that as a bill. So you've got the invoice and the bill as a matching pair."
   Michael: "So a bill in Xero really equals accounts payable." (L261-263) The acronym is indistinct
   (L1077). Michael did not comment on the agency treatment or the document's name. Bears on OQ-29
   (question 2), US-09.1.4 and US-08.3.1.

10. **A posted bill in Xero is an approved bill.** Greg: "we can't post stuff into Xero and have it go
    on hold. If it's posted, it's actually been approved. The only way to have a posted transaction in
    Xero is to approve it for payment, and then it's like having your finger on the trigger. And if
    one of those records gets paid manually out of Xero, then the two systems stop balancing. So we're
    going to need to work out how we're going to repair things like that." (L177) Sam, of the
    prepayment's bill: "to post it, it's authorized. But if it's authorized, it's going to come through
    on the payment run... you don't want to pay it because... the operation hasn't happened yet." Greg:
    "an accident waiting to happen." (L305-307) This sits against the catalogue's draft bill to the
    anaesthetist, authorised only when the receivable is paid (US-09.1.1, US-10.2.1): a draft does not
    post, so it would not clear the clearing account of point 8. Not resolved. Bears on US-09.1.1,
    US-10.2.1 and US-06.5.1.

11. **Prepayments are held until the procedure is done, in one prepay creditor that is never paid.**
    Greg: "we want to change the current prepay scheme, where the anaesthetist gets paid when the money
    arrives, to one where it's held in the trust account and paid when the procedure is executed...
    sometimes the anaesthetist changes or the procedure gets cancelled and needs to be refunded... we
    thought we'd create a supplier called 'prepay account' and never pay it." (L283) Michael: "So it's
    a normal invoice." Greg: "instead of it going straight to the anaesthetist, we park it in a holding
    account. And rather than using a GL control account for that, we're using a creditor's account."
    (L285-293) Ben: "the account, to me, means a bank account, but it's not a bank account." Greg:
    "It's not even a Xero account; it's a Xero creditor. So it's the equivalent of an anaesthetist."
    One, not one per anaesthetist, for now: Greg, "No, just one"; Donald, "We did propose the idea that
   maybe one per anaesthetist, but this model's just having one at the moment"; Sam: "something we
   probably need to have a look at in more detail and actually see it working before we make a
   decision." (L581-599) Greg on when it is posted: "When the
    money comes back we credit the patient, but... instead of debiting the anaesthetist, because then
    he'd end up getting the money, we debit the prepay account and it sits there" (L283); the wording
    is muddled in the transcript, and whether the prepay account's bill is posted with the invoice or
    on receipt is not settled (OQ-80 has it with the invoice). Volume, Ben: "Probably about 20 prepays
    a week." (L365) Michael had said it depends on volume: one a week "is not going to be a problem",
   100 a week might be (L363). Bears on US-06.5.1, US-06.3.1 and OQ-80.

12. **Other ways to hold prepayments were weighed, and none was chosen.** Michael: "would it be
    better... not go to an accounts payable" (L295); "I'm just wondering whether it should be sitting
    in another liability. Until it's ready to be paid out." (L317) Greg: "it would be better if it sat
    in... current liabilities... But you still need a breakdown of it... who does it belong to?" (L297);
    a GL account has no analysis and is "just another account you need to reconcile" (L319-323). Ben
    suggested a second AA bank account the prepayment is paid into, with the anaesthetist invoicing AA
    on the day (L327); Michael: "it becomes another bank account to manage and control and reconcile";
    Greg: "It solves one problem because it creates separation, but it creates other problems." (L329-333)
    Michael expected a general ledger account or a sub-account for each anaesthetist (L343), and that
    money parked in another account "will probably have to be cash journaled from that account against
    the bill" (L351); "potentially every anaesthetist might have a prepaid sub-account" (L355). Greg on why a
    creditor: "Otherwise you've got to move stuff around by journals and actually you can't raise
    journals easily through the API... Whereas if you put it in a sundry account, we can deal with it
    automatically and just move it basically." (L349-353) Michael: "a trust account... That's not the
    company's money... there's need to be some control around that account." (L335) Sam: "It's
    something we probably need to have a look at in more detail and actually see it working before we
    make a decision." (L599) Bears on US-06.5.1.

13. **Anaesthetists read their balances from AA's system, and a reconciliation box says "we're good".**
    Greg: Xero "doesn't have an analysis... of what is owed to the anaesthetists, and that's going to
    be held in the AA app... when the anaesthetists look at their ledger status, what they've earned,
    what's outstanding, what's prepaid, that query will go to the AA app... always being synchronised
    and reconciled with Xero... we want some fairly straightforward, very obvious controls on a
    dashboard that show that all of the accounts that should balance to zero are balancing to zero. So
    you've got this little reconciliation box that says, 'Yeah, we're good,' or 'No, we're not.'"
    (L369) Michael: "which will just sit on the dashboard at Xero." Greg: "that's on the dashboard of
    the AA app, actually." (L371-373) Bears on US-08.3.2, US-12.2.1 and FT-13.2.

14. **Greg expects Vanessa to reconcile the bank daily in Xero, helped by a remittance add-on.**
    Greg: "I'm imagining that Vanessa will
    sit down and do the bank reconciliation every day, and there'll be automated tools there to help...
    anything that's matchable will match... and then it will just leave her the bits and pieces to
    clean up." (L383) "We're planning on using an English Xero add-on that specialises in
    reconciliation, that will pull in the remittance from the hospital, read that remittance, and then
    match to the banking... present Vanessa with, 'Well, this is all matched, and this is all
    unmatched'... when she presses it, it will create the matching journals... she'll do that every
    day." (L399) Remittances arrive by email as PDFs (L237-239); the add-on reads them from "a new
    inbox" (L693-695). For a receipt with no reference, "it's going to bring you up every transaction
    with that value that's unreconciled." (L761) Greg: "The reconciliation is a function in Xero."
    (L215) Michael: "the user would have to check that... the matches make sense"; Greg: "it'll be
    reference and amount... There's usually three things." (L385-391) Bears on US-10.2.4 and
    US-09.2.2.

15. **Greg's working assumption: payments are made in Xero, through a bulk payment add-on, by
    someone other than Vanessa.** Michael:
    "Xero can set up batch payments. Then those batch payments can be exported into BNZ and just
    approved." (L83) Greg: "I'm working on the assumption that the payments are going to be made out of
    here. So that's a second step where the cash out will come from someone other than Vanessa." (L399)
    Greg: "we need to double check. Last time I was using Xero it... made a pretty awful job of bulk payments. So we've got another small add-on from
    Australia... it does bulk payments... a much nicer screen." (L695) Michael: AA's own bills are paid
    today by ticking them in Xero, which "generates a file that's imported into BNZ" (L697). Consistent
    with OQ-111's answer. Bears on FT-10.2 and US-09.2.4.

16. **Today's payment controls are separation of duties and a director's click.** Michael: "Really the
    controls are that it's just separation of duties... within the office" (L401); someone does the
    banking and someone else the payments, "And then it goes to one of the directors to authorize."
    (L403-405) Ben: he is asked to authorise "a weekly payment" and scrolls for "anything unusual",
    such as "an unusual bank account" or names he doesn't know (L409-413), but "somebody could say Ben
    [unclear surname] and put a different bank account, and I wouldn't..." (L417); "the only people who
    can create the bank accounts is the directors... So Vanessa can't." (L421-429) Ben: "I don't have
    the capacity to check it. It's just basically, I'll press it." (L433) Greg: "while you've got some
    physical separation-of-duties controls, you haven't really got any controls around that process.
    Because there's nothing that can tell you all is well." (L441) Michael: "it's all about getting
    these reconciliations right as the internal control. And with the separation of duties as well."
    (L949-953) Bears on FT-10.2, US-12.1.4 and US-12.1.5.

17. **Greg's baseline: no payment run without a reconciliation that balances.** Greg: "one of the things we want is to
    stop a payment run going through if the ledger isn't reconciled, because you're just starting to
    compound the problem... you want Vanessa to be in a position where she's not allowed to present
    you with a payment run that doesn't have a reconciliation statement with it, that says all these
    accounts are square and we're good." (L441) Ben: "Or they wouldn't ever get paid." (L443) "That's why I was saying Vanessa's standing orders:
    don't give me a reconciliation that's not zero... once we put a new system in, I think it's one of
    our baselines... it has to operate this way." (L513-517) On a receipt nobody can place: "that would
    be my bottom line. I'd want to know what the problem was before I was happy to make payments."
    (L733) Greg: "the good news is that... You're always on the right side of the equation in terms of
    not being able to pay more than you've actually got in a bank account." (L737) Michael: controls "do need to be strengthened", but "the office is trying to get the money
    out", and staff "might sometimes get under pressure" (L451). Ben: "I get phone calls going, where's
    my money?" (L457) This restates Notes 2026-10-28 · AA meeting with Greg #64. Bears on FT-10.2,
    US-10.2.7 and US-13.2.1.

18. **A clean start: nothing old comes across.** Greg: "Part of the changeover is that we're not
    bringing any of this crap over. So a new account, a new process, and clear from day one" (L445).
    Ben's example: an account flagged unpaid since February that "was paid in April... it hasn't been
    allocated because it hasn't been ticked off." (L447) How the old trust balances are closed off was
    not discussed. Bears on EP-14.

19. **Receipts nobody can place: unmatched receipts must be parked and cleared, not left to grow.**
    Michael: "sometimes the money will come into the bank account, but they don't know where it
    belongs" (L181); bulk payments from insurers or hospitals where "they know where 90% of it...
    belongs" (L189); "a payment from the police credit union. That's all it says... there's no patient
    number" (L195-199); the New Zealand military is another (L241). Ben: hospitals "may put an invoice
    number on the invoice and the hospital will just ignore that" (L221); he will look at some Southern
    Cross reconciliations (L225-229). Ben: patients pay "without a reference" or the wrong amount, "a
    $1800 bill and they pop in 1200" (L755-775). Greg: "you need a good process for parking it... at
    some point, you've got to go back and clear that and not just let it compound." (L493-497) Two
    ways: Michael, to a holding account in Xero, so "they see that the bank account is reconciled, but
    they've still got to clear up all these amounts" (L723); Greg, "you can leave them open on the
    reconciliation" (L725); Michael: "The bank account would be unreconciled." Greg: "That's exactly
    correct." (L727-729) Donald: "our side of the system is already expecting to handle that particular
    scenario" (L187). Not decided. Greg will look at Vanessa's reconciliations and remittances to
    see how big the problem is (L741); the Forte remittance Ben showed has "a reference number and an
    amount on every" line, "So that's not where the problem is" (L743-753). Sam: "design a sort of a what to do for Vanessa... if it doesn't
    work, what do you do?" (L763) Bears on US-10.2.4.

20. **Greg proposes a dashboard alert for each unresolved item; who must act on it was debated.**
    Greg: "part of this weekly payment cycle is an examination of... what is unreconciled and why...
    why is it 3 weeks since this was carried in the reconciliation and why hasn't it been resolved?"
    (L501) Michael: "Can that come through on some kind of calendar basis on the AA side?" Greg: "it
    should come up in the dashboard as an alert that it's an item to be resolved. But then it's up to a
    management role... how are we managing this down to zero?" (L503-505) Michael: resolving them is
    management, not governance: "The management, they've got to fix it." (L507-511); Greg: "responsibility lines with who's signing the check
    because they're the gatekeeper that says... why am I signing this check with all of this
    unallocated funds sitting over here?" (L509) Greg: "you want the staff to be highly motivated to get
    that sorted and not just park it because they're busy. It's got to be a priority for somebody."
    (L737) Bears on FT-13.2, FT-13.7 and US-13.7.2.

21. **Credits and corrections: credit out the whole invoice and re-invoice, raised in AA and sent to
    Xero.** Michael: credits do not flow reliably between Xero and its add-ons ("If we put a credit
    through... in Xero Practice Manager, that doesn't flow through"; Fergus invoices likewise)
    (L521-525); "the credit is
    generated in AA" and must flow to Xero (L535-539). A credit arises when "an invoice was generated
    today to the wrong account... or the wrong amount" (L545), or, Donald, "a prepay that got
    cancelled" (L547). Michael: "best way to go, put through a credit note, take out the whole invoice,
    and we'll start again." (L551) Donald: "we believe the safest is to credit, start again." Michael:
    "It's the most correct way to do it for sure." (L553-555) Greg: "we're going to put it through a
    demo system and test it." (L557) A hardship deal ("we'll just pay half"): Greg, "credit out and
    reinvoice" (L569-573); Michael, "roll back the invoices and recharge the agreed amount" (L875); a
    change normally happens "before it gets into Xero" (Donald, L567). Bears on US-08.6.2 and
    FT-08.6. Michael: in Xero "all the history is tracked by user" (L575).

22. **Adjustments other than credit and re-invoice: Michael is to think of cases.** Michael: "I think
    it would be good to have the ability to do some kind of adjustments", but asked for a case, "I
    can't." (L867-871) "99% of the time I think it would be a credit back and reinvoice the amount."
    (L883) Sam: think of the use cases, and "it might be worth putting some policy around it" (L881);
    Michael: it "might be more of a question for Vanessa... is it better to build in that ability now?"
    (L957-965) Sam: "most times it'll be a credit and recharge... the cleanest, tidiest way." (L969-973)
    Sam asked Michael to email any cases; Michael: "I'll have a think as well." (L955, L975) Bears on FT-08.6.

23. **Small overs and unders: a rounding account cleared from AA's trading account, under a
    threshold.** Greg: "small differences in payment. How do you handle them, overs and unders?" (L787,
    L827) Michael: in a trading business they "usually just get put into a rounding account", but
    "Here we've got a trust account where we've got a specific amount... do we... need the ability to
    adjust the invoice up or down? I don't know." (L829) Today, if it's a few cents, "it gets taken
    into the client's main trading account." (L837) Greg: "maybe once a month you just accumulate them
    into an [overs-and-unders] account, and then at the end of the month you do a transfer from your
    trading account and it keeps the trust account zero"; Michael: probably to "bank fees" in the
    operating account (L839-841). Greg: "a policy threshold about what you do for anything over $9, or
    whatever... It's not worth sending out a refund." (the figure as transcribed; it may be misheard) Michael: "under $0.10, it's not worth worrying
    about... what would be a material amount?" (L843-849) Not decided. Bears on US-10.2.1 and
    US-10.2.3.

24. **Payment plans: each payment reduces the balance.** Ben: "people who want to pay $50 a week...
    Is that easy to sort out?" Greg: "It is for us... we're putting in the payable for the
    anaesthetist, like $1,000, and if there's a plan in place, as each payment comes in that's paid, and
    the balance is just reduced." (L851-857) Bears on US-10.2.1; consistent with it.

25. **An insurer's part payment found later: roll back and reissue as a split.** Ben: "you might bill
    an insurance company and then there's a little bit left over that needs another invoice raised to
    the patient." (L859) Greg: the 80/20 case "is normally two bills... something Vanessa would do"
    (L861); found only later, "that's when you roll back, roll back the original transaction, and
    reissue a split one... our universal solution is roll it back and start again" (L863-865). Bears on
    US-08.2.3, US-08.6.4 and US-08.6.2; consistent with them.

26. **What goes to Xero about a patient: a name and an email, never the NHI.** Greg: "We're not going
    to bring the NHI number over into Xero. Otherwise, all the patient information will be there."
    Michael: "What about the name of the patient?" Greg: "we'll have to address the invoice to the
    patient name. So we'll need a name and an e-mail." (L207-211) Matching keys on the invoice number
    (L219). Every Xero record carries "identifiers in them that link them straight back to an entry in
    the AA side... it's all cross-linked, so it goes both ways" (L691). Bears on US-09.3.1, US-09.3.2 and
    US-09.1.1; consistent with them.

27. **A separate Xero for the trust account, brought into AA's accounts only at balance date.**
    Michael: "we were talking about having a separate instance of Xero just for the trust account."
    Sam: how is it brought into the main accounts? Michael: "we don't bring it in because remember, the
    trust money is actually not the company's money... Only at balance day, only the 31st of March. We
    bring the bank account in as an asset and we bring in a liability being the equal amount. But we
    don't bring it in for management reporting." (L927-935) Bears on US-09.4.1; consistent with it.

28. **The trust account diagram: Sales is never cleared; add the bill at step 3 and more steps.**
    Donald stepped through [AR-63](../artifacts/AR-63.md). Michael agreed the debtor entry and the
    creditor entry for Dr Nick, and the sub-ledgers: "So I think that's all right up to there." (L101-141)
    At the receipt, Michael: "that will need to go against... to be matched up" (L149); "we've got a
    step where the money comes into the trust account and that will need to be matched against the
    accounts payable... And then the actual cash is going to go to the doctor." (L157-161) Sam: "you've
    missed a step... see how you've got sales? Yeah, it should lead off to zero." (L611) "before it's
    paid, you need to bring the bill in... that's what should come in to your creditors and it should
    be like a negative sales... in Xero is a bill, step three... you've only got one side." (L619-631)
    "you're out of sync. So you've got your AR as your debtor and your sales... But you don't have
    another side to your accounts payable." (L639-647) Donald: "I did catch throughout all of this
    that this here did not get levelled out." (L677) Michael: "They all need to be consistent with what
    we see in Xero... accounts payable, that's really called a bill... it'd be good to use the Xero
    language." (L669) Greg: "slow the animation down... step through each step to see how the journals
    work." (L683) Michael: "we also want to think about the detail in those journals... what ends up
    showing in the ledgers?" (L687) Donald on prepayments: "this model's just having one [holding
    account] at the moment." (L595) Donald on what releases the transfer: when the anaesthetist marks
    the procedure done "it goes to the office. And when the office says approved", it is released
    (L603-605), the catalogue's reading (OQ-125). Bears on AR-63.

29. **A workshop with AA, tentatively Friday 11 December.** Donald: send "the prototype to everyone to play with in
    advance and then kind of go through it together in person and try and have some of those
    conversations around scope. And what's in MVP." (L1025-1041) Ben: "we've probably got that date in
    December... 11th, I think... That was a Friday" (L1027-1035), "just Vanessa and then a couple of us"; Michael is not
    needed (L1059-1065). No requirement change.
