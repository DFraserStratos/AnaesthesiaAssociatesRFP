# AA client meeting, 2026-09-29

- **Who:** Donald Fraser, Greg (RFP author), Vanessa (AA administrator).
- **Covered:** office review at SUBMITTED, wrong invoices and credits, payment runs, cancellation
  fees, prepayment estimates, availability conflicts, anaesthetist profile, office overrides,
  Contracts and billable party, hospital integrations and rollout, outbound notifications,
  unallocated Lists, surgeon profiles and the blacklist, NHI, supplementary billing, Solutions
  Plus data quality, combined cosmetic procedures, RVG mapping.
- **Inputs gathered here:**
  - the reconciled transcript, `../../../Meeting Recordings/AA Meeting 2 Sept 29.md` (audio
    alongside);
  - the answers Donald recorded against open questions in the Requirements Board after the meeting;
  - Donald's own notes written outside the board after the meeting.

Cite a point as `"Notes 2026-09-29 · AA client meeting #n"`. Points are numbered once across the
whole note. Quoted answers and Donald's notes keep his wording (spelling fixed, filler words
dropped); the transcript summaries are paraphrase, with the transcript as the authority.

## Questions answered

The board answer is quoted first, then what the transcript adds.

1. **OQ-01 Cancellation fees.** Answer: "Nope". Vanessa: "No. You just take the loss."
2. **OQ-04 Prepaid amount source.** Answer: "Base + time + 2 mod * anaesthetist's unit value".
   - Base units come from the RVG; the estimated duration comes from the surgeon's rooms (email,
     phone or PDF).
   - Two modifier units are always added as a contingency, "because something can go wrong".
   - The rate is the anaesthetist's own rate for both base and time, not an AA rate.
   - Today the office converts duration to time units from a local table and picks six or seven
     units for 90 minutes depending on whether the anaesthetist's rate is high or low. Agreed to
     drop that heuristic: the system calculates time units from the duration using the standard
     RVG rule, and the estimate is calculated automatically.
   - The prepayment request is always worded as an estimate (patients query a higher final
     amount). Vanessa writes each letter by hand today ("I did nine prepays yesterday") and wants
     a small set of standard templates.
3. **OQ-09 Holiday and availability conflicts.** Answer: "Soft warning".
   - Greg: blocking creates more problems than it solves. Let it book, then flag a booking on an
     unavailable List.
   - Vanessa wants "a dashboard with colour", replacing the report she runs today and the
     print, annotate, reprint cycle.
   - Same mechanism as a short-notice sickness: the Booking stays, an availability conflict
     appears and changes colour.
   - Private hospitals close on statutory holidays and over their Christmas shutdowns; emergency
     work goes to public, which is out of scope.
   - Short notice, the anaesthetist usually finds their own cover; if they can't, they ring the
     office to help cover.
4. **OQ-14 Anaesthetist bank details.** Answer: "Yes, in our system. On the anaesthetist's
   profile." Vanessa: everything lives in the system (addresses, details). Greg: trust-account
   payments will be made out of the new system.
5. **OQ-16 Office adjustment at review.** Answer: "The office can always override". Vanessa: the
   office can change a Booking after the anaesthetist has filled in their details. This extends to
   fixed fees: normally a fixed fee stays fixed, but it must not be hard-coded as unchangeable
   (authorised override).
6. **OQ-21 Deposit refund on cancellation.** Answer: "This money would return to a trust account.
   Always refunded. The next anaesthetist activates another prepaid process."
   - Today: if the anaesthetist has already been paid, they refund the patient themselves, or pay
     the replacement anaesthetist directly. Lots of back and forth, and differing rates make
     moving the payment between anaesthetists awkward.
   - Greg's proposal, which Vanessa welcomed: handle it centrally through the trust account.
     Always refund the original prepayment, then raise a new prepayment for the replacement
     anaesthetist.
   - Trade-off: the patient may get two different estimates because rates differ.
   - A proposed process change; to be confirmed with AA's financial authority.
7. **OQ-22 Who may set the Contract from hospital data.** Answer: "The hospital can define the
   contract in the future state." Vanessa: hospitals know the contracts and send sheets every day
   saying which applies. The current integration sometimes carries the contract and patient
   details and sometimes doesn't, so the office adds it. Insurance comes from the sheets or the
   surgeon's secretaries and is entered separately.
8. **OQ-24 Billing lines after AUTHORISED.** Answer: "The system needs to be able to create
   additional invoices which are attached to a booking > procedure."
   - Today Solutions Plus uses "next account": another account/invoice with its own number (the
     "six number" and "three number"), attached back to the original.
   - The anaesthetist emails the office (e.g. "I did a post-op review, saw the patient for 15
     minutes"); the office opens the original invoice and creates another from it.
   - Supplementary charges use time units and/or modifiers.
   - See also points 18 and 23.
9. **OQ-28 Correction after invoicing.** Answer: "Credit everything in full, then rebill."
   - Today: the office fixes the invoice and sends it again, unless the patient has paid. Paid
     before the Wednesday payment run, AA can refund because the money is still with AA. Paid and
     the anaesthetist already paid out, the anaesthetist refunds the patient, and both AA's and
     the anaesthetist's books need a note for the accountants.
   - Typical causes: an insurer (e.g. NIB) pays twice, or both patient and insurer pay.
   - Greg and Donald: it should be credit notes, not retraction. A clear debit, credit, contra,
     new debit trail. Bring refunds into the office: the office refunds the patient and offsets
     the anaesthetist in the next payment run.
   - Xero can raise a credit note but won't send it to the customer; needs a workaround.
   - Greg: do the business logic in the app and tell Xero the answer.
10. **OQ-33 Unpaid-patient alert threshold.** Answer: "A 90 day threshold". Patients are allowed
    90 days and AA raises around 100 invoices a day, so an invoice isn't a problem before then.
    Some are six months to two years old when the patient returns. Greg: make it configurable.
    Start at 90 days; confirm with Ben.
11. **OQ-31 Event that removes a List from the anaesthetist's view.** Still open, owner now "Donald
    to ask Ben". Vanessa: the anaesthetists' call, though they need to see their own work. Greg's
    reason for keeping it visible until approval: a List should move from unbilled to
    billed/processed, not simply vanish.

## Donald's notes after the meeting

12. **Wrong invoice.** "What happens now when an invoice is wrong? Rollback and reissue or
    credit/additional invoice." (Compare OQ-28's answer in point 9, and point 34.)
13. **Outbound data.** "Do any other health systems read data from AA? No, maybe something for the
    future." The transcript adds that the data hospitals would want most is a change of the
    anaesthetist on a List; Vanessa spends a lot of time emailing cover changes. See point 19.
14. **Integrations.** The current matching screen has integrations from St George's and Southern
    Cross. In Christchurch there are other providers: Forte Health, Burwood, Christchurch Eye,
    Southern Endo and McMurray Centre.
    - Transcript: Forte has an export but it never worked with Solutions Plus. Burwood is public,
      but AA handles outsourced private theatre work there (plastics, orthopaedics). McMurray has
      only a couple of Lists. Everything not integrated is entered by hand.
    - Daily hospital sheets come from Forte, Southern Cross, St George's and Christchurch Eye. The
      office checks them against the system: who is on the List, double bookings, changed times,
      patients disappearing and appearing.
    - Solutions Plus imports from hospitals only.
    - Rollout (Greg and Donald agreed): deliver the core system first with a manual
      matching/review process like today's, then automate integrations in a second phase once the
      incoming data shapes are understood.
15. **Surgeon profiles (new feature).** Vanessa is going to give us a master list of surgeons'
    rooms and surgeons, so we can create a profile page for each surgeon. This will record their
    HPI number and CPN number, and it's where the blacklist feature will be.
    - Transcript: surgeons already have a profile page in Solutions Plus holding their NZ medical
      registration number, HPI number and CPN number. Surgeons belong to rooms; Greg expects a
      master list of rooms as well as surgeons.
    - HPI (Health Practitioner Index) identifies practitioners and facilities; it is not NHI. The
      full name of CPN wasn't established; Vanessa linked it to prescribing and the practising
      certificate.
16. **Blacklist.** Some surgeons don't want to work with some anaesthetists, so we need a system to
    record this. In one of the questions we talk about soft warnings rather than blocking actions
    (OQ-09, point 3); I see this as the same. The system should make it clear to separate
    blacklisted surgeons from others, but still allow admin staff to select a blacklisted surgeon,
    and present a warning when they do.
    - Transcript: Greg calls it the "naughty list" of anaesthetist and surgeon pairings that
      shouldn't be matched; the system should know them and flag a no-match. Donald: an
      anaesthetist profile could hold the surgeons they don't work with. Needs a surgeon master
      list, not free-text names.
17. **Draft Lists and naming.** The system is designed to create what we've been calling a blank
    list, but it's more like a slot for a List to exist, on a four-month rolling basis. You could
    look three months ahead and see that an anaesthetist has an AM or PM gap with no List attached.
    We need a better name, because the requirements currently call that a List, and a List that
    has been assigned and has Bookings in it is also a List. It turns out we need to support three
    different things:
    1. a slot for a List to exist;
    2. a List assigned to an anaesthetist;
    3. a draft List not assigned to anybody.

    The draft List needs to exist somewhere visible in the admin interface, alert the admin staff
    that it is a List being prepared, and ultimately they need to assign it to somebody.
    - Transcript: Greg raised "unallocated lists". Beyond permanent Lists there are many extra
      Lists, not covered by a permanent booking, that need an anaesthetist allocated. Requests
      arrive daily, including from surgeons' rooms and secretaries. Donald: these enter the
      matching process and need someone assigned.
18. **Additional invoices on a procedure.** In the transcript we talk about additional invoices in
    relation to the three numbers and six numbers and the way Solutions Plus handles this. We need
    something similar, not with the numbers, but a way to generate an additional invoice attached
    to a Procedure, in a Booking, on a List. It needs to be flexible, allowing AA staff and admins
    to do anything they want. Use cases:
    - additional post-op care given to a patient after the Procedure's invoice has already been
      sent;
    - a combined Procedure with a fixed cost that one billable party or another asks to be split
      into multiple smaller invoices they can account for (see point 29).

    On any Booking you select a Procedure, and for that Procedure you also have to select a
    Contract; in reality you're adding an additional invoice to a Contract. There needs to be a
    button in the interface to create it, and the additional invoice must link through to, and be
    traceable to, the original Procedure.
19. **Button to draft a booking update email.** When an admin updates a Booking in the AA system,
    the hospital system or admin team would like to be alerted. Integrations are hard and writing
    emails is time consuming. When a change is made to a Booking in the admin portal and the page
    is saved (we need to add support for saving), a button opens a compose window in the default
    mail client, prefilled with a boilerplate message, a list of the changes, a subject, and
    perhaps the To field.
    - Transcript: Donald proposed a pre-filled Outlook email for the office to review and send,
      even before a true outbound integration; Vanessa: "They would love that." The main trigger
      is cover changes (a new anaesthetist on a List).

## Other points from the transcript

20. **Office review at SUBMITTED.** The office checks addresses, whether it goes to a Contract,
    whether insurance needs adding, email addresses and anything missed or filled out wrongly. A
    patient under 18 (Miss or Master) must be billed to an adult (Mr or Mrs), never the child.
21. **Payment runs today.** Tuesday to Tuesday, banked on Wednesday, so a day behind. Outgoing
    money is on the 20th of the month and handled by Michael (the accountant). Why Wednesday is
    unknown; ask Ben, who can change it.
22. **Proposed weekly accounting cycle (Greg).** An accounting week aligned to ISO week numbers
    (e.g. "week 46") as the unit, with a Friday close: snapshot the ledger, reconcile (daily bank
    downloads), a working day on Monday to sort out problems, and a payment schedule to Michael
    for Tuesday. Payment anomalies are handled in the office and rolled into the cycle. A proposal,
    not a confirmed requirement.
23. **Supplementary billing link.** The office creates supplementary billing from the
    anaesthetist's time and modifiers, attached to the original (see points 8 and 18).
24. **Contracts and billable party.** When a procedure is selected, show only the relevant
    Contracts (not St George's Contracts on a List at another hospital), plus the default RVG
    arrangement.
    - Christchurch Eye has fixed-price arrangements, with several per procedure (e.g. Southern
      Cross, ACC, other funded work) plus a standard rate.
    - A procedure not on a hospital's schedule (the "13th operation") may be under a new Contract
      the office doesn't know about yet. If the hospital sheet says it's under contract, it goes
      under contract, and Vanessa checks with the hospital (Lesley at Christchurch Eye) before
      billing the patient.
    - The billable party can change independently of pricing: default RVG pricing with the
      invoice going to Christchurch Eye instead of the patient. For Southern Cross-insured cases
      at Christchurch Eye, the invoice can go to Christchurch Eye, which is reimbursed by the
      insurer.
    - The "default contract" is the "no special contract" Contract: normal RVG base, time and
      modifiers, with no agreed fixed price or modifier rules.
    - On a fixed-rate Contract the anaesthetist still records base, time and modifiers; the charge
      is the fixed rate. Prepayment overlays this as a separate lifecycle.
25. **Contract pricing changes over time.** An annual schedule/rate card, with additions emailed
    during the year (especially as outsourced DHB Lists change), usually with an effective date
    and sometimes a few weeks' notice. Pricing records need an effective-from date, and one
    procedure can have different prices under different funding arrangements.
26. **NHI as the patient ID.** Duplicate patients are a recurring problem in Solutions Plus
    because NHI isn't the unique ID.
    - NHI doesn't always come through on the booking: some surgeons' rooms' PDFs omit it, so it may
      only arrive with the daily hospital/theatre list.
    - Overseas patients are pre-billed and normally have an NHI.
    - Agreed direction: NHI is required. A missing NHI becomes a visible exception (problem list)
      that must be resolved, and the office emails the surgeon's rooms for it. The anaesthetist
      also needs the NHI to look the patient up in Health Connect.
    - Whether the Booking exists in a provisional state or can't be created without an NHI is
      undecided (see point 35).
27. **Solutions Plus data quality.** Solutions Plus won't export, so Vanessa printed and scanned
    the operation list.
    - Its unit values (e.g. base 6.2, zeros) are not canonical: use it for operation names only.
    - It contains junk entries, such as "10% discount" saved as a permanent operation.
    - Reference data will be reworked and loaded from new controlled spreadsheets; a clean cut is
      preferred to a full migration.
    - The database may be SQL Server hosted on AWS (to confirm). Carol at Solutions Plus may help
      obtain data. Decide what is useful rather than migrating everything.
28. **Hospital and surgeon reference data.** There are few enough hospitals and surgeons that clean
    reference data could be rebuilt from a controlled spreadsheet if needed.
29. **Combined cosmetic procedures.** Cosmetic combinations (e.g. abdominoplasty plus breast lift
    plus liposuction) are generally prepaid or fixed-price and billed as one combined operation.
    They are only split when a billable party asks, e.g. the patient gets the invoice and Southern
    Cross asks for it split three ways. The office then creates additional "three-number" entries.
    The component prices may not add up to the bundle price, because the bundle can carry a
    discount.
30. **RVG mapping.** There are far fewer RVG entries than operation names; each procedure is placed
    under the RVG code/category it belongs to, even if the guide doesn't name it. Gaps will be
    mapped by hand, and Vanessa can help.
    - The same RVG code can appear with different values (e.g. minor vs simple), so the RVG code
      alone can't derive base units: authoritative base-unit data is needed per procedure.
    - Position loadings (sitting/beach-chair, prone) are modifiers, not base units. The simple
      guide doesn't list them all; Vanessa has a fuller source.
    - Contracts can override the default RVG base units for a hospital or funder arrangement.

## Follow-ups

31. **From Vanessa:**
    - the base units sheet for the operations AA actually uses;
    - the fuller modifier list with units;
    - contract-specific overrides and other contract material;
    - the master list of surgeons' rooms and surgeons;
    - one example of each kind of surgeon/hospital PDF (these contain patient details, and there
      is no NDA in place yet);
    - old emails about the existing integrations, including the Forte material.
32. **For Ben:** the payment day and cycle (points 21 and 22), the 90-day threshold (point 10),
    OQ-31 (point 11).
33. **For Greg:** Carol at Solutions Plus about obtaining data.

## Unresolved or in tension

34. **Correcting a wrong invoice.** Three readings:
    - Vanessa's current practice: fix and resend;
    - Donald's note: rollback and reissue, or credit/additional invoice (point 12);
    - the OQ-28 answer: credit in full, then rebill (point 9).

    The meeting's direction was credit notes over retraction, for traceability.
35. **Open from the transcript's reconciliation notes:**
    - whether "+2 modifiers" is literally two modifier units or an estimate-only buffer;
    - the exact RVG time rule after two hours (take it from the RVG material);
    - what the Solutions Plus three- and six-number identifiers mean;
    - the expansion of CPN;
    - whether a Booking missing an NHI is provisional or blocked;
    - how combined procedures are modelled (bundle, distinct procedure, or invoice-only split);
    - the weekly cycle (point 22) and central prepayment refund (point 6) are proposals to confirm.
36. **Naming.** The slot, the assigned List and the draft List (point 17) need distinct names in
    the catalogue and `domain-model.md`.
