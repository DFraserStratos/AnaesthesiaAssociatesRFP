# Presenter Cheat Sheet

One page to glance at during the workshop. The run sheet (`03-demo-script.md`) has the clicks and the figures; this sheet has the words, the rules and the answers. Where the two differ, the run sheet wins.

## The 30-second explanation

> Anaesthesia Associates books and bills for about 85 independent anaesthetists. The system keeps a
> rolling schedule of AM and PM sessions, keeps each patient's Booking current, and lets the
> anaesthetist record what the bill needs. The office checks and authorises each finished List, and
> the Billing Engine raises the invoices. Xero handles receivables and banking. The Billing Engine's
> own ledger is what each anaesthetist sees.

## The five nouns to remember

| Term | Meaning |
|---|---|
| Session | An anaesthetist's AM or PM (or an evening Out-of-hours session). Every session exists, Free by default, and holds a status or a List. |
| List | One anaesthetist's operating List in one session: one hospital, one surgeon. A Draft List has no anaesthetist yet; the office assigns it. |
| Booking | One patient's appointment on a List. |
| Procedure | One booked item on a Booking. Each carries exactly one Contract and its own payer. |
| Contract | One priced item, held by a Party. It decides who is invoiced and how the price is worked out. |

The words around them:

| Term | Meaning |
|---|---|
| Party | Anyone who holds a Contract: a hospital, an insurer, a funder, a surgeon or surgeon group, an anaesthetist, or AA. Insurers are Parties like any other. |
| No contract · RVG | The backstop every invoice destination offers: the anaesthetist's own rate per unit, invoiced to the payer on the Procedure. |
| No contract · Fixed price | The other backstop: an amount typed on the Procedure. It has no price of its own. |
| Invoice destination | Where a Procedure's invoice goes: Patient, the List's hospital, or Special. Worked out from the Contract. Until a Contract is set the Procedure reads "Needs an invoice destination". |
| Paid by | The line on each Procedure naming who pays: the patient, or a parent, guardian, benefactor or family trust. |
| RVG group and RVG code | The NZSA RVG list, held once in Master data. The anaesthetist finds the code by typing. |
| BTM | Base units + Time units + Modifier units. |
| Event | Anything billed against a Procedure after setup: a pre-op or post-op event, a billing event (a free-text charge or credit), an additional invoice or a credit note. |
| AA Holding account | Where a prepaid amount waits until the office authorises the List. A transfer then moves it to the anaesthetist. |

## Terms not to use

| Avoid | Say instead | Why |
|---|---|---|
| Slot | Session, AM or PM | The app never says slot. |
| Shift, claim a shift | List; move your own List | Anaesthetists move their own Lists. Nobody picks up open shifts. |
| Swap | Move | A List or a Booking moves. |
| Permanent List | Recurring booking | Recurring bookings fill the schedule ahead. |
| Surgeon TBC List, a List being prepared | Draft List | One name for a List with no anaesthetist. |
| DRAFT or Open for an assigned List | ACTIVE | DRAFT is only for a Draft List. |
| Timesheet | Start and finish | The anaesthetist records start and finish times. |
| Handover | Start and finish | Same reason. |
| Card (for a Booking) | Booking | "The physical booking card" is the paper one. |
| Copy booking | Add Booking | There is no copy. |
| Addendum | Event | A post-op charge is an event on the Procedure. |
| Blacklist | Not preferred | A pairing warns and never blocks. |
| Type 1/2/3, billing route | The Contract | The Contract decides where the invoice goes. |
| Default hospital Contract, default RVG Contract | No contract · RVG, or the hospital's own Contract | Each priced item is its own Contract. |
| Contract lines, Contract versions | One Contract per priced item; price ranges | A fixed price changes by a dated price range. |
| No contract (RVG), Needs a Contract | No contract · RVG; Needs an invoice destination | The app's own words. |
| Contract holder | The holder, a Party | Every holder is a Party. |
| Funder allocation, two-funder | The insurer or funder on the Booking | It never changes who is invoiced. |
| The payer on the Booking | The payer on each Procedure, its Paid by line | Each Procedure has its own payer. |
| Estimate, deposit | The prepaid amount | The prepaid amount is the price. |
| Trust account | The AA Holding account | Its own name. |
| Balance invoice | An additional invoice, raised by hand | Nothing is invoiced automatically after a prepaid procedure. |
| Part credit | Credit note | A credit note always covers the whole invoice. |
| Surgeons' rooms (as a record) | The surgeon's office contacts | Contacts sit on the surgeon. |
| Public List | A Public session | Public is a session status. |
| Hospital sync, Simulate sync | Import | The office imports each hospital file. |
| Hospital reference | The procedure date and surgeon | The invoice cross-matches on those. |
| SSA | Anaesthetist | SSA does not appear in the RFP. |
| Delete Booking | Cancel Booking | History is kept. |
| Send back to the anaesthetist | Phone, then correct it | There is no returned state. |
| Xero calculates the invoice | The Billing Engine raises it | Xero holds receivables and banking. |

## Lifecycle and permissions

```text
DRAFT (a Draft List) -> ACTIVE -> SUBMITTED -> AUTHORISED
```

- **DRAFT**: a Draft List, with no anaesthetist yet. Only the office assigns it.
- **ACTIVE**: the anaesthetist and the office both edit it. A hospital row changes a Booking only when the office applies it on **Matching**.
- **SUBMITTED**: the office reviews it. The anaesthetist can still change it until the office authorises it. The last change stands, and Review shows "Changed since submitted". On her main view it reads "Done · unbilled".
- **AUTHORISED**: every Booking is locked, and each Procedure's pricing is locked onto it. The invoices are raised in the same step. The List leaves the anaesthetist's main view, and search finds it.
- There is no returned state. If something needs clarifying, the office phones and corrects it.

| Action | Anaesthetist | Office |
|---|---|---|
| See Lists and Bookings | Her own | All |
| Edit a Booking on an ACTIVE or SUBMITTED List | Her own, until authorised | Yes, until authorised |
| Edit an AUTHORISED Booking | No | No: events, credit notes and additional invoices instead |
| Submit a List | Her own | No |
| Authorise a List | No | Yes |
| Set a Procedure's Contract | Change it until authorised; flagged at review; never Prepaid | Yes, through the step rail |
| Change a price | Only where an RVG Contract allows it, or the amount on No contract · Fixed price | Any price, until authorised or until a prepayment invoice is raised |
| Move a List, or one Booking | Her own, at once | Any, at any time before authorise |
| Assign a Draft List | No | Yes |
| See tiers and pairing preferences | No | Yes |
| Add an event, create an additional invoice or a credit note | On her own Procedure | Yes |
| Approve events | No | Yes, on **Review queue → Events** |
| Change her rate per unit | Yes, her own | Yes |
| Edit master data | No | Yes, every change audited |

## Who to contact

- **Surgeon contacts:** each surgeon holds one personal contact and one or more office contacts (name, email, phone), with the practice name as plain text. Admin staff enter them, and the HPI CPN, which a surgeon can be saved without. Each List keeps the address it came from. The update email and the request for a missing NHI go to that sender, else to the surgeon's first office contact with an email.
- **Public sessions:** the anaesthetist marks them on her calendar, with a note such as CPH. Before a List can go there, the office asks her to make the session available.
- **Help line and product support:** anyone using the apps calls the help line (0800 787 286, fictional) or presses **Help**. AA raises incidents, fixes, changes and new features with Stratos through **Product support** on Admin.

## Contracts and pricing

The plain words below follow the contract model (AR-58) and its ERD (AR-61), as the app builds them.

### Parties, specialties and funding tags

- Every Contract is held by a Party. Parties live on **Contracts → Parties**, each with its own page: its billing name, how its invoices are delivered (email or post) and the Contracts it holds. A surgeon group is a Party whose surgeons are linked on its Contracts; there is no separate group record.
- A Contract carries none or more specialties (none means every specialty) and at most one funding tag: SXAP, HNZ or ACC. Together with who it bills, the tag decides where the step rail offers it.
- ACC is a funding tag. St George's Contract "ACC elective services via St George's" carries it.
- The office keeps the specialties in **People → Specialties** (each with a page listing the surgeons and Contracts that hold it) and the funding tags on **Contracts → Funding tags**. Every change is audited.

### One Contract per priced item

- Each priced item is its own Contract, with AA's own code (for example `MER-001`), an invoice description and an optional default RVG code.
- A combination such as Merivale's Facelift plus 1 add on is its own Contract. Fee extras (a GA add-on fee, per 15 minutes over 120, per area) are billing events.
- A fixed price has price ranges. The range in force on the procedure date gives the price. A new range can start in the past: everything not yet authorised, prepaid or priced by hand re-prices at once. An authorised Booking keeps its price.
- Every other change is an edit in place on the Contract's page, audited with the values before and after. A change that must start on a date is **Replace from a date**: one step makes the new Contract from the change date, moves the ticked Procedures from that date onto it, and either disables the old one now or leaves it active with a to-do on the change date to disable it. Nothing is deleted.
- **No contract · RVG** and one Fixed price Contract for every place an invoice can go are made by the system and marked System. They are always there.
- On **Contracts**, find a Contract by typing its name, its code, a word of its invoice description or its default RVG code, and group the catalogue by kind, holder, funding tag, surgeon, where the invoice goes or pricing. **New contract** is its own page.

### The step rail

The office sets the Contract when it sets up the Booking, in three steps:

1. **Where does the invoice go?** Patient, the List's hospital, or Special, each with its count.
2. **Then the payment type or tag.** Under Patient, "Standard or prepaid?" is always asked. Under the hospital, its funding tag. Under Special, "Which holder?".
3. **The Contract**, typed to search. The list opens on the **No contract** heading, with No contract · RVG and No contract · Fixed price first, then the holder's own Contracts.

- Patient › Standard has one Contract, No contract · RVG, with **RVG code** and **Fixed price** beside it.
- A patient paying for themselves is on No contract · RVG. A patient insured with nib is billed to nib only under nib's own Contract.
- "Suggested" marks the path that fits the insurer or funder on the Booking. With none named, it marks Patient and Standard. It never hides a path.
- An RVG-priced Contract leaves the RVG code to the anaesthetist.
- The anaesthetist sees the same rail and can change the Contract until the office authorises the List. Each change reads "Awaiting office approval" and is flagged at review. She never picks Prepaid.

### Who is invoiced

- Each Contract says whether it bills its holder or the payer on the Procedure. A prepaid Contract always bills the payer.
- The payer is on each Procedure, in its **Paid by** line, filled from the patient. **Change** names someone else: a parent, a guardian, a benefactor or a family trust. A change is offered to the Booking's other Procedures with the same payer.
- A payer needs an email or a postal address. A postal address alone is enough, and the invoice is then marked **To post** (provisional, OQ-122).
- The insurer or funder sits on the Booking with its approval number. It never changes who is invoiced.
- One invoice per billable party per Booking. Procedures with the same payer share one. A Split gives one invoice per share.

### Units and the RVG code

- **Base** comes from the RVG group, on the primary Procedure only.
- **Time** comes from start and finish: 1 unit per 15 minutes for the first two hours, then 1 per 10 minutes. A part interval rounds up. The office keeps the tiers in **Master data → RVG groups**.
- **Modifiers** are a step the anaesthetist answers, even with **None apply**. The age modifier, and P1 where the base units include it, come in applied and can be removed. Anything else she claims needs a short reason, ASA included.
- Base units outside the RVG guide raise a warning. It never blocks.

### The price rules

- Five pricing kinds: RVG at the anaesthetist's rate, RVG at the Contract's rate, RVG less a discount, a fixed price from its range, and an amount typed on the Procedure.
- A price follows its Contract until a typed price, a prepayment invoice or authorise holds it. If nothing gives a price, the Procedure reads **Needs a price**.
- The anaesthetist sees what the price comes to as she records ("4 units x $26.50 = $106.00"). She can type her own price only where an RVG Contract allows it, such as No contract · RVG, and she types the amount on No contract · Fixed price.
- Elsewhere the price is read only: "Set by Forte Health RVG less 10%. To use a different price, change the Contract or alert the office."
- The office can change any price until the List is authorised, or until a prepayment invoice is raised. Nobody gives a reason.
- A discount prints as its own line: $159.00 less 10% ($15.90) is $143.10.
- A price typed at $0.00 keeps the RVG detail and raises a $0.00 "No charge" invoice, with nothing to pay or pay out.

### What a Procedure asks for, and Mark complete

- On an RVG price the form asks for the RVG code, start and finish, and the modifiers step. On a fixed price it asks for none of them, and the RVG code is "for reference".
- **Mark complete** checks three things: a Contract; on an RVG price, the RVG code, both times and the modifiers step, with a reason for each claimed modifier; and a price. A warning never stops it.
- **Submit to office** needs every Booking complete. The confirm reads "Submit this list to the office?", with **Submit to office** and **Not yet**.

### The Split

- **Split** sits on each Procedure's Paid by line. The office, or the anaesthetist on her own Booking, uses it until the List is authorised.
- Each share is typed in $ or %, one party takes the rest, and a share can go to another person. Each party gets its own invoice. The Contract has no split setting.
- Alan Prentice: nib $132.50, Alan $79.50 (the rest) of $212.00.

### The multi-procedure rule

- One primary per Booking, listed first. **Make primary** changes it, until the List is authorised.
- Base units on the primary. Time on every Procedure. Modifiers on the primary up to 4 units; above 4 they split equally across the RVG-priced Procedures, the remainder to the primary. Graeme Tullett's 7 modifier units split 3 · 2 · 2, $636.00; making the umbilical hernia primary gives $583.00.
- One rule for every Booking, with no switch.
- A fixed price keeps its price and takes no share. When the primary has a fixed price, no base units bill (provisional, OQ-132).

### The pricing snapshot at authorise

- Authorising locks each Procedure's pricing onto it: the Contract's settings, the price range in force, the units, the rate, the price, who is billed and who is paid.
- The invoice is raised from that lock. A later Contract edit, a new price range or a rate change never reaches it.
- An ACTIVE Booking still follows its Contract.
- **Demo actions → Regenerate from locked data** rebuilds the invoice from the lock and reads "identical".
- An invoiced Booking changes only by a credit note and a new invoice.

### The descriptions, kept apart

- **The procedure text** is the latest plain text received, exactly as sent. The hospital's text replaces the rooms' text, and the rooms' words stay in the Booking's history. A Booking added by hand keeps what was typed or told.
- **The Contract and the RVG code** sit in the Billing section below it.
- **The invoice description** starts as the text received. Where the Contract has its own invoice description, the invoice prints that. It is not edited on a Booking screen.
- The procedure wording in the demo data is illustrative (AR-35), not AA's.

## Warnings, never blocks

- Six warning rules: an unpaid prepayment, base units outside the RVG guide, a child as the payer, an insurer with no approval number, a split that no longer fits the fee, and a patient who owes AA.
- Mild ones can wait. Strong ones need action before the procedure.
- They land on the office's **To-do** list. A triangle marks the Booking in every app, and the warning shows when the Booking opens.
- Nothing stops completing, submitting or authorising.
- A patient who owes AA: mild within the threshold, strong over it (90 days from the invoice date, set in **Master data → Patient balance warning**). The anaesthetist sees "This patient owes AA money. The office is following up.", with no amounts.
- At review, flags point at what needs a look: "Changed by Dr X: was" the old Contract (**Approve** or **Correct**), "Price typed: $X (computed $Y)", "Contract not offered on this List", "Contract disabled on" a day, "Email or postal address needed", **Needs a price**.
- Two things hold up authorising: a Procedure with no price, and a Booking reopened and not completed again. **Authorise for billing** names it, with **Open**.

## The notification pool and the to-do list

- Admin Day's right rail holds one work card with two tabs: **To-do** and **Notifications**, one pool the whole office shares.
- Every move by an anaesthetist posts a notice. So does **Alert the office**, with her note.
- A notice is active or resolved. When anyone ticks it resolved, it goes for everyone. **Show resolved** brings it back with who and when. Nothing expires.
- Nothing in the pool needs approving. The cover-change email is drafted from the notice.

## Preferences and tiers, admin only

- A surgeon can prefer, or prefer not, to work with an anaesthetist. The office sees it on both pages in **People**.
- Priority tiers (the **Rate and tier** card on the anaesthetist's page; the Anaesthetists list filters by tier) order who the office's pickers offer: tier, then preferred pairing. Not preferred sits apart with a warning, and the office can still go ahead.
- Anaesthetists never see tiers, pairings or Draft Lists. Their own moves show colleagues by availability alone.
- Seeded: Ms A. Reid prefers not to work with Dr Sharma; Mr J. Whitford prefers Dr Sharma.

## The money model

```text
Payer -> ACCREC -> AA's bank account -> ACCPAY (the same amount) -> Anaesthetist
```

- Every invoice is a pair in AA's own ledger: a receivable from whoever pays, and a payable to the anaesthetist for the same amount. AA passes on everything.
- Each invoice is issued in the anaesthetist's name, with her GST number, and AA as her agent (provisional, OQ-29).
- Prices are held without GST. GST, at 15 per cent, goes on at the foot of the invoice.
- Each Party's invoices go by email or by post (OQ-114). The billing run sends them as it raises them.
- The ACCPAY is the buyer-created tax invoice, one per invoice. The count is provisional (OQ-29, OQ-60).
- Xero holds no NHI and no patient name. It knows each patient or payer by a hidden ID ("Patient PT0005").
- Every call to Xero waits in the **Xero sync queue** and retries by itself. An outage never stops authorising.
- A part payment releases the anaesthetist's payable for exactly the amount received.
- Billing fails per Booking. The rest of the List bills.

### The weekly payment run

- Each run is named by its ISO week. The week closes on Friday and is checked against the bank download. Monday is for sorting out anything odd: fix it, or **Hold out of this run** and it rolls into next week.
- The office approves the week's BCTIs. Nothing is paid without that. On Tuesday the payment schedule goes to the accountant, who pays it in Xero.
- The Billing Engine records each payment when Xero reports it. Every payment carries its week, and every run leaves a remittance advice per anaesthetist.
- A negative invoice from a credit nets against the anaesthetist's next run.
- The weekly cycle is proposed (OQ-47).

### AA's monthly fee

- AA invoices each anaesthetist once a month: fixed charges plus a charge per BCTI paid that month. The sample: $350.00 + $150.00, and $5.00 per BCTI. Dr Rutherford with 40 BCTIs: $700.00 before GST, $805.00 with it.
- It is always a separate invoice, paid into AA's own account, and never taken out of a payment to the anaesthetist.
- Only paid BCTIs count, so a moved Booking is never charged twice. The count is provisional (OQ-29, OQ-60). The demo raises it at month end (OQ-112).

### The ledger balances

```text
Receipts held = payables due + the AA Holding account + credits held for payers - negative invoices to net
```

- On a fresh reset: Receivables outstanding $12,630.50, Receipts held $1,640.00, Payables due $0.00, Disbursed $27,760.00.
- A receipt nobody can match puts it out of balance, with a name on it. The office allocates it to an invoice or marks it refunded.
- The anaesthetist sees her position on web **Accounts**, the web Dashboard and mobile **Balances**, from the same ledger.

### Credit notes

- An issued invoice is never edited. A credit note always covers the whole invoice.
- **Credit in full and rebill** starts the new invoice from a copy of the original's lines. **Split into additional invoices** must add up to what was credited.
- If the anaesthetist was already paid, a negative invoice reverses her payable and nets in her next run.
- Money paid on a credited invoice is held for the payer. The credit sheet says "A credit note is not a refund."

## Prepayment

- The office sets Patient › Prepaid and picks the anaesthetist's own prepaid Contract, from the price list the office keeps for her. The prepaid amount is her fixed price, in full.
- A prepaid Contract bills only a person paying, never an organisation (awaiting AA's confirmation, OQ-73). Each payer gets their own prepayment invoice.
- The invoice waits for an admin to approve it. AA can switch that step off. Approving sends it with a letter.
- The money is held in the AA Holding account. When the office authorises the List, a transfer moves it to whoever did the List: no invoice and no GST (provisional, OQ-125).
- The prepaid Procedure stays off the final invoice. Nothing is deducted, and nothing more is invoiced or credited automatically. A difference is an additional invoice or a credit note, raised by hand.
- An unpaid prepayment is a warning that turns strong two days before the procedure. It never blocks.
- Cancelling settles it at once: an unpaid invoice is credited, so nobody chases the patient; a paid one is credited and refunded from the AA Holding account. Moving the Procedure off a prepaid Contract after sending is settled the same way.
- A move changes nothing. Whoever does the procedure is paid the prepaid amount.
- **Rebook with another anaesthetist** starts a fresh prepayment at the new anaesthetist's own price ($1,350.00 for Dr Beaumont), so the patient may see two amounts.

## Events

- Events sit on the Procedure, on no List: pre-op and post-op events (a time or a fixed fee, with their own date), billing events (a free-text charge or credit), additional invoices and credit notes.
- The office or the anaesthetist raises them. Each goes through one review step, **Review queue → Events**, and bills in the next billing run.
- An event joins an invoice to the same party in that run where it can, otherwise it gets its own.
- ACC pre-op assessments are preconfigured pre-op events with codes CS250, CS260 and CS70 (to confirm, OQ-12).

## What each app is for

### Anaesthetist Mobile

- Her Lists and Bookings, from today, with earlier Lists not yet authorised. Past work by patient name, NHI or date.
- Capture: the RVG code by typing, start and finish, modifiers, Mark complete, submit.
- Add a missing Booking, Paid by and Split, insurer and approval number, events, credit notes.
- My calendar: Free, On holiday, Unavailable or Public, with a note.
- Move a List to the office or a free colleague; move one Booking to a free colleague. **Alert the office**.
- More: her rate per unit (she changes it), her contact details, HPI CPN and masked bank account (read only), **Get help**, **Sign out**.

### Anaesthetist Web

- Dashboard with her financial position beside who is free.
- The same Lists, Bookings and capture as mobile.
- My availability, the same form as the phone.
- **Accounts**: Outstanding, Payments, Remittances, GST report (monthly, cash basis) and AA fees.
- **Help** in the top nav.

### Admin Web

- **Day view**: every session and List, in pages or one scrolling list, with the Books square and Pre-payments tiles and one work card for the To-do list (the Bookings needing an invoice destination among it) and Notifications.
- **Intake**: hospital files and the rooms' PDF lists, every row waiting for the office on **Matching**.
- **Intake** also holds **Waiting for NHI**.
- **Draft Lists**, **Conflicts** (hospital closures only), **Notifications**, **Review queue**, **Invoices**, **Billing monitor**, **Ledger**, **Audit**.
- **People**: anaesthetists, surgeons, specialties and patients, each with a page edited one card at a time. An anaesthetist is made inactive from a last day there.
- **Contracts**: the catalogue, each Contract's page, **New contract**, **Replace from a date**, **Parties** and **Funding tags**.
- The Admin Booking saves on purpose: each **Save changes** is one change set with a name, and History can show the Booking as it stood at any save.
- **Draft update email** on demand, opened in the office's mail client. The system never sends it.
- **Open out-of-hours session** on an anaesthetist's Day row opens an evening session after PM.
- **Master data**: places, schedule, billing and settings, every change audited.
- **Help** at the foot of the side nav: **Help line** and **Product support**.

## Strong phrases to use

- "The List is the unit of availability and approval."
- "Every session exists, even when nothing is booked."
- "The office handles exceptions. The system takes the repetitive work."
- "Each Procedure's Contract decides who is invoiced."
- "The price follows the Contract until something holds it."
- "Authorising locks the pricing, and the invoice comes from the lock."
- "A warning never stops anyone."
- "We never edit an issued invoice. We credit it in full and rebill."
- "One review step for everything recorded against a Procedure."
- "Nothing is paid until the week's BCTIs are approved."
- "Every payment carries its week number."
- "The NHI never leaves the core platform, and no personal information goes to Xero."
- "This is a candidate design we would validate during discovery."

## Statements to avoid

- "Anaesthetists pick up open shifts."
- "The app chooses the RVG code." (The anaesthetist picks it.)
- "ACC is a kind of Contract." (ACC is a funding tag on a Contract.)
- "Every insured patient is billed to the insurer." (Only the insurer's own Contract bills it.)
- "Authorisation means the patient has paid."
- "Xero is the source for the balances." (The Billing Engine's ledger is.)
- "The prototype is connected to live hospital, Xero, NHI or email services."
- "The system emails the surgeon's office automatically." (The office drafts it and sends it from its own mail client.)
- "The app replaces the emailed Lists." (OQ-124 is open.)
- "The system invoices the difference." (Nothing is billed automatically after a prepaid or fixed price.)
- "A credit note is a refund." (Money paid on a credited invoice is held for the payer.)
- "The accountant has signed off the weekly cycle." (It is proposed, OQ-47.)
- "The 20th is part of this run." (AA's fee is a separate monthly invoice.)
- "The system pays the anaesthetist." (The accountant pays in Xero; the system records it.)
- "Events need a separate approval." (One review step for every event.)
- "These are the ACC codes." (CS250, CS260 and CS70 are to confirm, OQ-12.)

## Present but honestly demo-only

- **Demo actions** (the pill beside the app switcher) holds the simulated events for the screen you are on, each badged "Demo trigger". The Control Panel lists them all under **Demo actions by screen**.
- On a handset, the amber **Demo** chip opens the **Demo sheet**. Entries badged "Office stand-in" or "Colleague stand-in" play the people who are not on the phone, such as **Demo sheet → Office authorises this List**.
- **Play the office** on the handset's More screen is off by default. Leave it off.
- **Switch office user** stands in for two office users signing in as themselves.
- The Xero simulation and the Control Panel are badged demo surfaces. The Billing monitor is product UI; only its triggers are badged. **Run payables in Xero** carries a **Simulated Xero** badge: it stands in for the accountant paying the schedule.
- **Seed load** and **Go-live load** stand in for a developer's one-off load of AA's controlled spreadsheets.
- The everyday data is already AA's whole practice, 85 anaesthetists. **Load full-scale data** adds a full year of invoices in memory, for timing only. **Reset** returns to the demo data.
- The Digital Services Hub is simulated: **Demo actions → Hub: Available / Slow / Unavailable** shows the fallback.
- **Help** carries a **Simulated** badge: how Stratos' support works is the real service's.
- The sign-in screen stands in for the real one, with a **Provisional** pill (OQ-83).
- Future scope, badged with a telescope: automatic hospital feeds over HL7 v2 and FHIR (**Demo: Future scope, HL7 and FHIR**), and **Demo actions → Photo capture (Future scope)** for a paper booking.
- The procedure wording in the demo data is illustrative demo data (AR-35), not AA's.
- Point at the **Synthetic data only** badge: "All patients, NHIs, Lists and figures are synthetic."

## Open questions to raise

Each is built with a default, labelled on screen where the app shows it. Raise the one a beat touches. Each "Our recommendation" is our proposal for AA to decide, not a settled answer.

| OQ | Question | Built | Our recommendation |
|---|---|---|---|
| OQ-12 | ACC pre-op assessment codes and fixed fee | CS250, CS260 and CS70 as preconfigured pre-op events, priced by the generic event rules | Ask AA's accountant to confirm the three codes. |
| OQ-13 | Hospital download format and fields, per hospital | Sample files per hospital, imported on Matching | Get one real file and its field list from each hospital before the integration is priced. |
| OQ-29 | GST agency treatment of the receivable and payable invoices | Invoices in the anaesthetist's name with AA as agent; the ACCPAY is the BCTI, one per invoice | Put the wording and the BCTI to AA's accountant, with the IRD's current name for it. |
| OQ-47 (proposed) | Does the accountant agree to the weekly payment cycle? | Friday close, Monday checks, Tuesday schedule, paid in Xero | Adopt it if Ben agrees, and settle the payment day with the accountant. |
| OQ-60 | What the AA per-invoice fee counts, and how the fee is paid | One paid BCTI per receivable invoice, counted once, against a sample fixed schedule | Count each BCTI once against the anaesthetist who did the procedure, and keep the fee a separate invoice. |
| OQ-73 (awaiting confirmation) | Prepayment invoice when the patient is not the billable party | A prepaid Contract always bills the person paying | Confirm that no Contract billing its holder ever needs to be prepaid. |
| OQ-83 | The anaesthetist's sign-in experience | Email and password on a stand-in screen | Settle the platforms first, then the sign-in. |
| OQ-112 | Monthly AA fee invoice: month end or the 20th? | Month end | Ask the accountant whether the 20th is the day it is raised or the day it is paid. |
| OQ-114 | How each Party's invoices are delivered | Email or post, set on the Party | Ask nib how its portal takes claims. |
| OQ-120 | Does a prepayment invoice name the anaesthetist? | Yes: the letter names Dr Souter | Show the moved-Booking case and let Vanessa or Ben choose. |
| OQ-122 | Posted invoices for payers without email | A postal address alone is accepted; the invoice is marked To post | Ask Vanessa how AA posts invoices today. |
| OQ-123 | Reporting on billing practice for contract negotiation | No reports; the data is kept | Keep the data in release one and scope the reports with Ben later. |
| OQ-124 | The app as the anaesthetist's source of truth instead of emailed Lists | Emailed Lists and the on-demand update email stay alongside the app | Keep both until Ben and Vanessa choose. |
| OQ-125 | What triggers the release of a prepayment from the holding account? | When the office authorises the List | Keep authorise: the office has checked the List by then. |
| OQ-132 | Base units on a mixed Booking whose primary has a fixed price | No base units bill | Show Ben Gareth Mills's Booking and let him pick one of the three options. |
| OQ-138 | Pre-op consults in AA's room | Not built | Ask AA to describe the case first. |
| OQ-141 | Support cover from 8:00am | Both channels open at 8:30am | Ask whether AA needs 8:00am cover, on which channel, and whether it is extra. |
| OQ-142 | Approval number and ACC claim number on the holder's invoice | Neither is printed; there is no ACC claim number field | Add them only if a holder asks. |
| OQ-143 | Surgeons without an HPI CPN or a full name | A surgeon saves and books without an HPI CPN ("No HPI CPN yet") | Warn, never refuse. |

Also open, with the default built and nothing on screen: OQ-144 (disabling a Contract from a future date; Replace from a date leaves the old one active with a to-do on the change date), OQ-145 (a hospital's untagged Contracts sit under Special on the step rail), OQ-146 (which No contract backstops each hospital and funding tag gets), OQ-147 (how an anaesthetist who has left sees later remittances; today sign-in stops after the last day) and OQ-148 (whether AA needs any record of surgeons who practise together; today a group is only a Party).

### For AA's accountant: the BCTI granularity

The app raises one BCTI per paid receivable invoice. The alternatives are one per procedure, one per payment, or one per weekly payment run. The choice changes the BCTI count, and AA's monthly fee is charged per BCTI (OQ-29, OQ-60).

## Likely evaluator questions

### "What if the office never confirms an anaesthetist's move?"

It doesn't need to. The move happens at once, and nobody accepts it. The office sees a notice in **Notifications** and resolves it when it has done what it needs, such as the cover-change email.

### "Who finds out when an anaesthetist moves a List?"

The whole office, through the shared notification pool on Admin. A colleague who receives the List sees it on their schedule straight away. The office drafts the cover-change email to the hospital from the notice.

### "Can I move just one Booking?"

Yes. The anaesthetist picks a colleague free in that session, by name or from the list. The Booking becomes a new List in their session, with its Contracts, and the colleague is paid for it. Telling the office is her choice.

### "Can a warning stop me?"

No. Warnings sit on the To-do list and on the Booking. Completing, submitting and authorising all go through. Only a Procedure with no price, or a Booking reopened and not completed again, holds up authorising.

### "Can I copy a Booking?"

No. Each Booking is added on its own: from a hospital file, from the rooms' PDF, or by hand with **Add Booking**.

### "Who decides which Contract applies?"

The office, when it sets up the Booking, through the step rail. The anaesthetist can change it until the office authorises the List. Her change is flagged at review, and the office approves or corrects it.

### "Can the anaesthetist change the price?"

Only on an RVG Contract that allows it, such as No contract · RVG, or by typing the amount on No contract · Fixed price. A hospital's or funder's fixed price is read only. To change it she changes the Contract or alerts the office.

### "What if the procedure turns out bigger than the prepaid one?"

Nothing happens automatically. The prepaid amount is the price. If more is owed, the anaesthetist or the office creates an additional invoice by hand.

### "Does the system notice when a prepaid Booking moves?"

There is nothing to notice. A move changes nothing in the ledger. When the office authorises the List, the transfer pays whoever did it.

### "Can an anaesthetist see who they are not preferred with?"

No. Pairing preferences and tiers are admin only.

### "Who uses mobile and who uses web?"

The same anaesthetist. Mobile is for the day in theatre. Web gives a wider view for planning and accounts.

### "Who sets up the sessions?"

The system. Every anaesthetist has an AM and a PM session each day, four months ahead. Her own availability goes on first, then recurring bookings fill the sessions. A recurring booking that lands on an unavailable session becomes a Draft List.

### "What about cases after six?"

The office opens an Out-of-hours session after PM, even the same evening, and puts a List in it. It works like any session.

### "What about public work?"

Public is a status on the session, with an optional note such as CPH. Nobody books into it or covers it, and it is never billed. Setting it back to Free reopens it.

### "Can an anaesthetist edit after submitting?"

Yes, until the office authorises the List. Every change is audited, the last change stands, and Review shows "Changed since submitted".

### "What happens when the office finds a mistake?"

The office phones the anaesthetist and corrects it on Review. There is no returned state.

### "Why isn't Xero doing all the billing?"

AA's rules need pricing per Procedure, invoices per payer and views for each anaesthetist. The Billing Engine does that. Xero holds receivables and banking.

### "Is the anaesthetist paid before the procedure?"

No. The prepaid amount waits in the AA Holding account until the office authorises the List. A transfer then moves it to the anaesthetist who did it, and the next weekly run pays her (the trigger is provisional, OQ-125).

### "How do late hospital changes work?"

A later row from the hospital lands on **Matching**, matched to its Booking by date, surgeon, hospital and session. It waits for the office to approve it, field by field, up to AUTHORISED. Nothing applies itself, and the hospital never sets the Contract.

### "What if the patient has no NHI?"

The NHI is mandatory. A row with no NHI waits on Matching, and a stub holds its place on the List so the anaesthetist still sees the case. When the office adds the NHI, the Booking takes the stub's place.

### "Who do the update emails go to?"

To the List's sender when it came from a rooms' PDF, else the surgeon's first office contact with an email. A cover change goes to the hospital. The office drafts the email on demand and sends it from its own mail client.

### "Is this real patient or integration data?"

No. Point at the **Synthetic data only** badge. The hospital files and PDF lists are samples. Xero, email, the NHI Hub and payments are simulated in the browser.

### "Can it handle 85 anaesthetists and 28,000 invoices a year?"

Show it: **Admin → Day view → Demo actions → Load full-scale data → Confirm**. The everyday data is already the whole practice of 85 anaesthetists; the load adds a year of invoices: 85 anaesthetists, 20,092 sessions and 28,361 invoices in the browser. The banner's **Timings** shows each screen's render time. These are timings on one laptop, with no server; formal performance testing is a Testing-milestone task. **Reset** returns to the demo data.

### "How will people who are not comfortable with new systems cope?"

One clear action on each screen, and each procedure shown the same way in every app. The info sign beside each heading explains the section. Training runs per user group before go-live.

### "How do anaesthetists sign in?"

With an account on the phone app. The screen is a stand-in, marked Provisional: how they sign in is still to be decided (OQ-83). Every sign-in, refusal and sign-out is in the audit. After the last day the office sets, an anaesthetist's sign-in is refused as no longer active.

### "What if something is not working?"

**Help** in any app: the help line's number, its hours and a request form, each request tracked to its respond-by time. AA also has **Product support** for incidents, fixes, changes and new features. Both open 8:30am to 5:00pm, Monday to Friday, outside New Zealand public holidays. Whether AA needs cover from 8:00am is open (OQ-141). After a Reset the clock reads 8:00am, so press **+1 hour** to show it open.

## Recoveries

- A stuck Admin Booking edit: **Discard** in the save bar.
- Lost your place: the Control Panel's scenario jump lists one link per beat.
- Anything else: **Reset → Confirm reset**, or the scenario's **Jump → Confirm jump**.

## One-line close

> The prototype shows one audited flow, from a changing theatre schedule to the anaesthetist's
> record, the office's authorisation, the invoices, and the money collected and paid out.
