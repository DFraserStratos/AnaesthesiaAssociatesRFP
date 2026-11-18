# Presenter Cheat Sheet

## The 30-second explanation

> Anaesthesia Associates coordinates bookings and billing for about 85 independent anaesthetists.
> The system maintains a rolling AM/PM schedule, keeps patient Bookings current, lets anaesthetists
> capture BTM billing data, lets the office check and authorise completed Lists, then calculates and
> issues invoices. Xero is used for receivables and banking, while the Billing Engine remains the
> system that translates financial events back into each anaesthetist's view.

## The five nouns to remember

| Term | Meaning |
|---|---|
| Schedule | The rolling four-month calendar |
| List | One anaesthetist's half-day AM or PM operating session; every List has exactly one hospital and one surgeon (AA rooms is a location) |
| Draft List | A List with no anaesthetist yet, state DRAFT; the office assigns it |
| Booking | One patient appointment inside a List |
| Procedure | One clinical procedure inside a Booking; each carries exactly one Contract |
| Invoice destination | Where a Procedure's invoice goes: the patient, the List's hospital, or a special Contract's holder. Worked out from the Contract, never stored; a Procedure with no Contract shows "Needs an invoice destination" |
| No contract | The heading every Contract list starts with: the destination's two backstops, No contract · RVG (the anaesthetist's RVG rate, invoiced to that destination) and No contract · Fixed price (an amount typed on the Procedure) |
| BTM | Base units + Time units + Modifier units |

## Terms not to use

| Avoid | Use instead | Why |
|---|---|---|
| SSA | Anaesthetist | SSA does not appear in the RFP |
| Shift | List or AM/PM session | List is the RFP's scheduling unit |
| Claim/sign up for a shift | Move your own List to a colleague's free session or back to the office, at once; office reassigns the List | Self-service claiming is not specified |
| Delete Booking | Soft-cancel Booking | History and audit must be retained |
| Send back to anaesthetist | Resolve by phone; office corrects | There is no Returned state |
| Surgeon TBC List | Draft List | A List with no anaesthetist yet has a name and a state |
| Slot | Session (AM or PM) | The app never says slot |
| Blacklist | Not preferred | The pairing warns and never blocks |
| Open or DRAFT for an assigned List | Active | DRAFT is only for a Draft List |
| A List being prepared (for a Draft List) | Draft List | One name for it |
| Xero calculates the invoice | Billing Engine calculates/issues; Xero provides AR/banking | The RFP explicitly puts the Billing Engine at the centre |
| ACC route | A holder's Contract carrying the ACC funding tag, such as ACC orthopaedic services | ACC is a funding tag, not a billing route or a kind of Contract |

## The lifecycle

```text
ACTIVE -> SUBMITTED -> AUTHORISED -> Billing run completed
```

- `ACTIVE`: anaesthetist and office may update; a hospital row changes a Booking only when the office
  applies it on the matching screen.
- `SUBMITTED`: the office reviews and corrects; the anaesthetist sees it less prominent ("Done ·
  unbilled") and can still change it until it is authorised. The last change stands, and Review
  shows "Changed since submitted".
- `AUTHORISED`: Bookings are locked, and each Procedure's Contract and price are locked onto it ("Contract
  locked at authorise"); the whole List hands to billing. The List leaves the anaesthetist's main view
  at once, its invoices show in their balances at once, and search finds it.
- Billing-run completion: the prototype stamps `billedAt` for the office's billing monitor; it no
  longer decides what the anaesthetist sees.
- There is no `RETURNED` state.
- `DRAFT` means a Draft List with no anaesthetist yet (catch-up Phase 31); an assigned List is never DRAFT.

## Permission matrix

| Action | Anaesthetist | Office | System/integration |
|---|---:|---:|---:|
| View own Lists/Bookings | Yes | Yes, all | As needed |
| View colleague patient details | No | Yes | As needed |
| Edit a Booking on an `ACTIVE` List | Yes, own | Yes | No; brings rows in, never changes a Booking |
| Edit a `SUBMITTED` Booking | Yes, own, until authorised | Yes | No; brings rows in, never changes a Booking |
| Edit an `AUTHORISED` Booking | No | No | No |
| Submit a List | Yes, own | No; office receives it after submission | No |
| Authorise a List | No | Yes | No |
| Reassign a whole List | No | Yes | No |
| Edit own rate per unit | Yes, own | Yes | No |
| Edit master data | No | Yes | No |
| Monitor billing/integrations | No | Yes | Automated events write status |

## The billing rules most likely to be questioned

### Fee calculation

```text
Fee = (Base + Time + Modifier units) x anaesthetist's own dollar value per unit
```

- The anaesthetist Booking shows what the price comes to as she records, on every Contract: a quiet
  **Price** card in the capture ("4 units x $26.50 = $106.00") and the Booking total above Mark complete
  (the phone's dock strip, the web rail panel), rising as she claims a modifier or adds time, with no
  prompt. She types a price only where an RVG Contract allows it (No contract · RVG, Forte Health RVG),
  or the amount on No contract · Fixed price; no reason is asked. Elsewhere the figures are read-only:
  "Set by {Contract}. To use a different price, change the Contract or alert the office." Admin
  Bookings retain the full billing view.
- Aria Skin and Laser Clinic is RVG at the Contract's rate, $26.50 a unit, which the anaesthetist
  cannot change: Dr Fitzgerald's Wed 15 Jul Aria Booking is 22 units x $26.50 = $583.00 (A5 base 8 +
  time 14, 08:30 to 11:30). An added billing line is a fixed amount only.
- A price typed at $0.00 keeps the RVG detail recorded ("This gives a no-charge invoice."). Review
  shows a **No charge** pill, and authorising raises a $0.00 "No charge" invoice: no payable, no BCTI.
- Each Contract has one of five pricing kinds (RVG at the anaesthetist's rate, RVG at the Contract's
  rate, RVG less the Contract's discount, a fixed price from its range in force, or an open price typed
  on the Procedure). A Procedure's price follows its Contract (the range in force, the rate or discount
  as they stand) until a typed price, a prepayment invoice or AUTHORISED holds it; else "Needs a price".
  The office can type any price until AUTHORISED, a prepaid one only until its invoice is raised; no
  reason. Admin → Booking → **Change price** shows the computed price beside the field.
- **Reset → Confirm reset** in the shared top bar restores the pristine data and clock from any app
  while keeping the current app.
- Closing things: **Escape** closes only the top layer (a sheet over a drawer closes first, then the
  drawer) and returns focus to what opened it. Every web and Admin dialog has a corner **X** (Close) at
  its top right. A phone sheet has no X: its handle or a tap on the scrim closes it. The Demo actions
  pill, live clock, Reset popup and app switcher also close on Escape or an outside click.
- Time: 1 unit per 15 minutes for the first two hours.
- Time after two hours: 1 unit per 10 minutes.
- Each anaesthetist has an independent dollar value per unit.
- The anaesthetist picks the RVG code by typing; it is optional, and the system does not infer it.
- A ranged group starts at its starting figure; any value is accepted, and one outside the guide raises
  a warning for the office after the procedure, never a block.
- Base units sit on the RVG group alone; a Contract states none and may only name a default RVG code.
  Choosing a Contract fills an empty RVG code from its default; a Procedure that has one keeps it.
- P1 (non-supine positioning) is included, pre-applied at 0 (removable), on every Neurosurgery and
  Spine code, so it cannot be added twice; the age modifier is pre-applied from the date of birth,
  removable. Every other modifier, ASA included, is claimed with a short reason.
- A part interval always rounds up (confirmed with AA); the tiers are held as data (Admin → Master
  data → RVG groups shows the RVG time rule, read only). The anaesthetist enters start and finish only.

### One Contract per Procedure, on the step rail

1. **Where does the invoice go?** Patient, the List's hospital, or Special, each with its count.
2. **Then the payment type:** Standard, then Prepaid, always asked under Patient; the hospital's funding
   tags; Special's holders.
3. **The Contract**, typed to search, under a **No contract** heading with No contract · RVG and
   No contract · Fixed price first. Patient › Standard alone picks No contract · RVG at once, with
   **RVG code | Fixed price**.

The office sets it at booking setup; the anaesthetist sees the same rail and can finish or change it
until the List is authorised, never onto or off a prepaid Contract. A Contract bills its holder or the
Procedure's payer as it says. A patient with insurance who pays AA is on No contract · RVG (or a
price list) and claims back themselves; nib is billed only through nib's own Contract.

### The payer and the insurer or funder (catch-up Phase 21)

- **Who is billed** is each Contract's own setting: its holder Party when it bills its holder, otherwise
  the **Procedure's payer**. No contract · RVG, No contract · Fixed price, a surgeon's fixed
  price (Mr Doyle's bariatric list), an anaesthetist's own price list and every prepaid Contract bill
  the payer. One invoice per billable party per Booking: Procedures sharing a payer share one invoice, and a Split
  gives one per share.
- **The payer is on each Procedure**, on its **Paid by** line, filled from the patient (the patient
  record). **Change** opens the Paid by sheet to name anyone else who pays: a parent, a guardian, a
  benefactor or a family trust. The office and the anaesthetist change it until the List is authorised
  (a bottom sheet on the phone, a dialog on web). Changing one Procedure's payer offers the change to
  the Booking's other Procedures with the same payer, each ticked (untick to keep): Grace Park's two Procedures do this. A Procedure added later
  copies the payer the others share, else the patient. With no Contract the line reads "Payer: not
  billed yet". There is no Booking-level Payer card any more. Two payers typed separately (two ids,
  same name and email) are never merged: "payers are never matched on name or email". Settled (D85).
- A billed payer needs an **email or an NZ Post postal address**; a postal address alone is enough
  (that invoice is marked **To post**). Missing both shows **Email or postal address needed** on the
  Paid by line and at Review; it never blocks.
- **Insurer or funder:** stays on the Booking (empty state "None"); it names one (a Party: NIB and Southern Cross Health Society are
  insurers; ACC and Health NZ are funders) and holds the **approval number**. The office records them;
  the anaesthetist sees the number and may change it on the day. A missing number on an insurer is the
  only insurance warning, shown to the office and the anaesthetist. The funder never decides who is
  billed and never narrows the Contracts: it only marks one path **Suggested** on the step rail.
- The AIA patient (Marcus Webb) is invoiced under No contract · RVG like any patient, AIA named as the
  insurer with a number, no warning.

### What a Procedure asks for, and Mark complete (catch-up Phase 21a)

- **The form follows the Contract's pricing kind.** On an RVG price (No contract · RVG and the RVG rate
  and discount kinds) the RVG code, start and finish times and the modifiers step are required, each
  with a **Required** caption; **None apply** answers the modifiers step (then **No modifiers claimed ·
  Change**), as does claiming a modifier. On a fixed or open price: no times, units or modifiers, and the
  RVG code is optional, "for reference".
- **Mark complete checks exactly three things:** a Contract; the RVG detail on an RVG price; a price,
  not **Needs a price**. Not checked: the RVG code on a fixed price, the payer's contact, the approval
  number, out-of-range base units. Times are "start" and "finish", never "handover".
- What only the office can fix points to **Alert the office**; submit still needs every Booking complete.
- Seeded on Dr Souter's Mon 10 Aug PM: Miriam Holloway (Merivale fixed price) completes with no times;
  Graham Pulley (No contract · Fixed price) shows **Needs a price** until an amount is typed.

### Review flags (never block) and the one blocker

- Review shows, per row, each Procedure's stack (procedure text, Contract with who is invoiced, RVG code)
  with its flags under it; each Procedure's payer ("Patient pays", "Paid by nib") and the insurer or funder with approval number (**Change** opens the
  Admin Booking); an open alert with a Resolve tick; open warnings with Clear; **Changed** for edits since
  submit.
- Flags: **Changed by Dr X: was** the old Contract (**Approve** or **Correct**, then **Approved** with
  the time); **Price typed: $X (computed $Y)**; **Contract not offered on this List**; **Needs a price**;
  **Needs an invoice destination**; **Not marked completed**; **Email or postal address needed**;
  manual B/T/M notes. A Disabled Contract raises a flag, never a block: a Procedure not yet authorised and dated on or after the day its Contract was disabled reads **Contract disabled on <day>**; earlier-dated ones are not flagged, and **Make active** clears it. In this List Margaret Ellery's cataract, on Christchurch Eye Surgery 2025 rate (disabled Fri 10 Jul by Kirsty W.), reads **Contract disabled on Fri 10 Jul**.
- One thing blocks authorise: a Procedure that still **Needs a price**. **Authorise for billing** stays
  disabled and names it, with an **Open** link, until a price is typed (Dr Chen's Tue 14 Jul AM List:
  Hemi Walker, No contract · Fixed price). Every other flag and warning never blocks.
- **Approve all N Contract changes** in the action bar; authorising approves any still waiting (the
  confirm says how many). The anaesthetist sees **Awaiting office approval**, then **Approved by the
  office** with the time.
- No move ever resets a Procedure's Contract or typed price; a Contract that does not fit the new List
  is flagged at review.
- Seeded: Dr Chen's Tue 14 Jul AM at Christchurch Eye Surgery (`/admin/review/L-45178-2026-07-14-AM`)
  shows each flag; the Review queue holds 9 seeded submitted Lists.

### Procedure text and the invoice description

- **Procedure text:** the latest plain text received, exactly as sent. The hospital's replaces the
  surgeon's rooms' when it arrives (no switching between them), and the original stays in the Booking's
  history; a hand-entered Booking keeps what was typed or told. Nobody edits it.
- **On every Booking screen:** a small Procedure card with that text, when and where it came from. The
  Contract is in the Billing card and the RVG code in its own card below it. The anaesthetist sees what
  the price comes to in a quiet Price card.
- **Invoice description:** shows on the invoice only: the procedure text, or a filled-in Contract
  invoice description on top; never the RVG code. The office's own wording always wins.
- No attachments on Bookings or Lists. The demo's procedure wording is illustrative (AI-made), not AA's.

### Multi-procedure rule

- **One primary per Booking**, always listed first, with a neutral **Primary** pill when there are two
  or more. Anyone with edit rights can make another Procedure primary (**Make primary**, teal; a bottom
  sheet on the phone, a dialog on desktop: "Make this the primary procedure?"): the anaesthetist on her
  own List until it is authorised (she amends a completed Booking first), the office on `ACTIVE` and
  `SUBMITTED` Lists, a hospital feed on `ACTIVE` Lists only. Removing the primary is refused; nothing is
  promoted silently.
- **Base** on the primary only, from its RVG group or the value recorded; none when the primary is on a
  fixed or open price (OQ-132).
- **Time** on every Procedure, from its own times.
- **Modifiers** recorded once for the Booking, on the primary: all on the primary at 4 units or fewer;
  above 4, split equally across the RVG-priced Procedures with the remainder to the primary (7 over 3 =
  3 / 2 / 2, agreed with AA on 7 October), whichever Contracts the Procedures are on.
- The rule adjusts RVG-priced Procedures only: a fixed or open price keeps its price and takes no share,
  and on a mixed Booking whose primary is a fixed price no base units are billed (provisional, OQ-132).
- AA confirmed the rule on 19 October (OQ-90): one rule system-wide, no switch. Which Procedure is
  primary is not settled (Vanessa: the most expensive; Greg: the first in the list), so the first
  stays primary until someone changes it.
- Seeded: Brian Holt (Dr Souter's Mon 20 AM, Forte, the S3 multi-procedure Booking): additional line
  "Additional procedure: Time 2 units at $26.50", total rows "Primary · B + T" and "Additional · T",
  one invoice. Mr Doyle's bariatric Booking (Tue 14 Jul, `BK0028`) is the mixed Booking: $2,800 fixed
  primary ("Primary · fixed price"), its hernia repair on its own time units ($61), "No base units
  billed (provisional, OQ-132)". Graeme Tullett (Dr Souter's Mon 13 Jul AM, Forte Health, in the
  Review queue, `/admin/day/2026-07-13/bookings/BK0184`): three Procedures, 7 modifier units split
  3 · 2 · 2, $636.00; Make primary on the umbilical hernia gives $583.00.
- Demo actions: **Load 3-procedure Booking (7 modifier units)** (the same Booking, not complete, on
  Dr Souter's next open List) and **Hospital feed changes the primary** (refused on a submitted List).

### Splitting a Procedure's fee

- **Split** is pressed in the Billing card's Paid by line, on its right (it opens the Paid by sheet with the split alone; **Change**, beside the payer's name, opens it with who pays) on each Procedure of a Booking, for the office or the
  anaesthetist (on her own Booking, phone and web, until the List is authorised). Each party's share is
  typed in $ or %, one party can take the rest, a share can go to **Another person** (name and an
  email or postal address), and each party gets its own invoice. No split setting
  on the Contract.
- Alan Prentice (Dr Souter's Mon 20 PM List, the S3 fee-split Booking): Paid by "nib $132.50, Alan Prentice $79.50 (the rest)" of a $212.00 fee; 62.5% for nib is the same split.
- One invoice per billable party per Booking; a Split gives one invoice per share.

### Invoices

- Every invoice is issued in the anaesthetist's name as supplier, with her GST number ("GST number
  104-348-211" for Dr Souter; blank prints "GST number not held"), and AA as agent ("Issued by
  Anaesthesia Associates Limited as agent for ...", AA GST number 102-345-678). The agent wording is
  **Provisional (OQ-29)**.
- The GST number is a field on the Admin anaesthetist record (Master data, Anaesthetists), not on the
  anaesthetist's own profile.
- The anaesthetist's GST activity (web Accounts, GST activity) is monthly: the calendar month to date
  ("Month (1 Jul to 21 Jul 2026)"), with no period switch. There is no GST period anywhere.
- Layout follows the Contract: the holder's layout when it bills its holder (each line's invoice
  description, the BTM breakdown, a cross-match strip of procedure date and surgeon (no hospital reference),
  and the Contract's holder reference code as **Your reference**, for example SGANAES01 or NIBAN2026),
  otherwise the patient's (no BTM breakdown or strip). Master data, Contracts shows Layout and Delivery
  read-only.
- Prices are held GST exclusive; GST (15%) is added at the foot of every invoice.
- Delivery is the Party's (email or post). The billing run sends each invoice: emailed (**Simulated
  send**), or marked **To post** for a payer with only a postal address (**Simulated posting**,
  **Provisional (OQ-122)**). A payer with neither raises **No invoice address**: the office types one
  and selects **Send**.
- The invoice rail's Delivery card shows the stamp ("Emailed to ... at 08:00"), **Resend** and
  **Print**; there is no Email invoice button. The Billing monitor's stage is **Sent or to post**.
- Each Xero ACCPAY carries one **buyer-created tax invoice** per invoice, the same value, naming the
  anaesthetist as supplier and AA as agent (**Provisional (OQ-29)**).

### Contracts

- Every Contract is one priced item held by a **Party**: a hospital, insurer, funder, surgeon or
  surgeon group, an anaesthetist, or AA. Parties live in Master data, Parties, with their billing
  name and how their invoices are delivered (email or post).
- It bills its holder or the Procedure's payer (a prepaid Contract always the payer).
- It has a pricing kind (RVG at the anaesthetist's rate, RVG at the Contract's rate, RVG less a
  discount, or a fixed price), an optional override on RVG kinds, prepaid or not, and is Active or
  Disabled.
- It is edited in place with an audit, never deleted; a change that must start on a date is a new
  Contract, and the old one is disabled, except a fixed price, which changes through price ranges.
- Contract change warnings (Master data, Contracts): **Disable** lists the not-yet-authorised Procedures still on the Contract (Merivale's Face lift: Sophie Matthews, Paula Westerman, Fiona Lattimer, Dr Souter's Mon 10 Aug PM List), each with **Open**; nothing moves, and review flags each as **Contract disabled on <day>**. A new Contract with **Replaces** and **From** lists the Procedures dated on or after that date still on the old one, and stores nothing. The backdated-range demo reports "1 authorised Procedure kept its old price: Judith Calloway, $3,100.00."
- Each priced item is a Contract of its own, with a holder reference code, an invoice description and
  a default RVG code. A fixed price has price ranges: the range in force on the procedure date gives
  the price, and a new range, even backdated, re-prices everything not yet authorised, prepaid or
  priced by hand; an authorised Booking and its invoices never change (they keep their lock). A combination such as Merivale's Facelift
  plus 1 add on is its own Contract; fee extras (a GA add-on fee, per 15 minutes over 120, per area)
  are events, not Contracts. An anaesthetist's price list is one prepaid Contract per item, kept by
  the office, every price above zero (Dr Souter's). Prices are ex GST, GST at the invoice foot.
- No Contract prices an additional procedure by its own rule: Doyle's bariatric hernia bills at RVG
  under No contract · RVG on its own time units, under the multi-procedure rule.
- **No contract · RVG**, held by AA, is always there.
- Every Contract has AA's own code (for example `COS-001`).
- A Contract carries none or more **specialties** from AA's list (none means every specialty) and at
  most one **funding tag** (SXAP, HNZ, ACC). With who it bills, the tag decides where it is offered:
  billed to the payer, under Patient; billed to a hospital that holds it and tagged, under that
  hospital and tag; anything else, under Special. The editor shows this live ("Offered under
  Southern Cross › SXAP").
- Specialties and funding tags are lists the office keeps in Master data, each change audited, in
  their own tabs.
- The system keeps one **Fixed price** Contract for every place an invoice can go (No contract ·
  Fixed price, Prepaid · Fixed price, one per hospital and tag, one per Special holder), marked
  System. Tagging a hospital's first Contract with a new tag makes its Fixed price Contract at once.
  They are never disabled; only their name, AA code and invoice description change. Nothing is priced on them yet.
- Tip: find a Contract by typing its name, AA code, holder reference code, a word of its invoice
  description or its default RVG code ("CAT" finds the cataract items, "H3" Merivale's
  combinations); filter by holder or funding tag.

### Lock at authorise

- Authorising a List locks each Procedure's Contract onto it: the Contract's settings, the price range
  in force, the units, the rate and discount, the price, who is billed (with the patient and payer
  details as they stood), the split and who is paid. The Booking shows **Contract locked at authorise**
  ("Locked Tue 21 Jul, 08:00 by Kirsty W."); Review shows the lock glyph in the Contract column and
  "@ $26.50/unit (locked)"; the Admin Booking's Office billing setup turns read only.
- A Procedure that still **Needs a price** blocks authorise (our reading of US-04.3.5).
- The billing run prices from the lock alone. There is no fallback: nothing is swapped for a default
  or another Contract, and a later Contract edit, Disable, backdated range, unit-value or RVG group
  change never reaches an authorised Booking. An ACTIVE Booking still follows its Contract.
- The invoice keeps its recipe: the invoice document prints from the lock (the invoice rail's
  **Locked record** card), and **Demo actions → Regenerate from locked data** rebuilds it from the lock
  and says "identical". It is the recipe, not a replay of the data as at a date.
- Which fields are frozen is Donald's proposal (AR-58 2.8), still to confirm with AA (US-15.0.3).
- An invoiced Booking's price, split or payee changes only by a credit note and rebill (later build).

### Contract history

- A Contract is edited in place, every change audited with its values before and after, who and when;
  nothing is deleted (a Contract is Disabled, never removed). There are no versions, no staged or
  submitted price review and no upload.
- The Contract panel's **History** tab lists each change (for example "Contract updated · Kirsty W. ·
  office · Pricing: RVG at $23.00 per unit → RVG at $24.00 per unit"), then **Procedures locked
  against this Contract**, each linked to its Booking and invoice. A seeded Contract reads "No changes
  yet" until it is edited. Parties and RVG groups have their own History too.

## The money model

```text
Payer -> ACCREC -> AA account -> ACCPAY (full amount) -> Anaesthetist
```

- `ACCREC`: money AA is collecting.
- `ACCPAY`: the full amount AA owes the anaesthetist; it equals the ACCREC. AA's own fee is never
  deducted from it (it is invoiced to the anaesthetist separately).
- Paid into AA and disbursed to the anaesthetist are separate states.
- A prepayment's ACCPAY credits the AA Holding account instead, and is never paid itself; the money is
  transferred to the anaesthetist when the List is authorised (section 8 below).
- A partial payment releases the payable for exactly the amount received; the rest stays outstanding.
- Both Xero records carry the InvoiceNumber (the ACCPAY's ends `-P`) and the case Reference.
- The mobile/web app reads the Billing Engine's mirror, never Xero directly.
- Outstanding balances are flat individual payable rows, not a Booking-level rollup and not amounts the
  anaesthetist personally owes.
- Bank details are master data: the office holds them on each anaesthetist's record (mandatory, with the
  HPI CPN), the anaesthetist sees them masked and read-only, and the payment itself is made in Xero. The
  app never pays from them.

### AA's monthly fee

```text
Month end: fee settings + BCTIs paid that month -> AA-FEE invoice (ACCREC) -> Anaesthetist pays AA's own account; never netted
```

- Admin → Billing monitor → **Open AA fee invoices**: Fee settings (fixed items plus a charge per BCTI)
  and **Run monthly fee invoices** (one AA-FEE invoice per active anaesthetist per month).
- Seeded sample: $350.00 + $150.00 fixed, $5.00 per BCTI. "Seed a month of BCTIs" then the run gives Dr
  Rutherford $500 + $5 x 40 = $700.00 before GST, $805.00 with GST.
- Caveat: the fixed schedule, the paid-only count and BCTI granularity (per invoice or per procedure) are
  with AA's accountant; amounts are held ex GST, with GST at the foot of the fee invoice.

## What each app is for

### Anaesthetist Mobile

- Procedure-day Lists and Bookings
- A main view from today with earlier un-authorised Lists, and past work by patient name, NHI or date
- BTM capture
- Complete Booking and submit List
- Add a missing Booking
- Photo of the booking card: Future Work (Demo actions, badged)
- Availability and cover: mark Free, On holiday, Unavailable or Public (with an optional note) ahead,
  repeating days off, change or delete one occurrence (My calendar, a bottom sheet)
- Move a List to a colleague or the office; hand one Booking to a free colleague (Move to a colleague)
- Profile (More tab): her rate per unit, which she changes with **Change**; contact details, HPI CPN and
  bank account (masked) read-only with a lock
- Later: balances

### Anaesthetist Web

- Wider dashboard and date ranges
- A main view from today with earlier un-authorised Lists, and past work by patient name, NHI or date
- Same List/Booking detail and capture functions
- Availability and cover: mark Free, On holiday, Unavailable or Public (with an optional note) ahead,
  repeating days off, change or delete one occurrence (My availability, the same form as the phone)
- Move a List to a colleague or the office; hand one Booking to a free colleague (Move to a colleague)
- Accounts and GST activity (the calendar month to date)
- Profile (her name and avatar in the top nav): rate per unit editable, the rest read-only

### Admin Web

- Whole-day operational control
- Phone/manual changes
- Move one Booking
- Reassign a whole List
- Draft Lists: Lists with no anaesthetist yet, soonest first; assign one from a grouped, tier-ordered picker
- Correct billing setup
- Review and authorise
- Master data and audit
- Anaesthetist profiles: rate per unit, contact details, registration number, HPI CPN, bank account
  (masked) and GST number on each record (**Edit details** on the Profile card) and in the
  Anaesthetists table; the HPI CPN and bank details are mandatory, every change audited
- Surgeon profiles: the HPI CPN is each surgeon's unique index (not the patient's NHI), each surgeon
  holds one or more specialties from AA's list (required; a save with none is refused), belongs to one
  or more surgeons' rooms (the first the main room, a room card each; Mr N. Wainwright is at two), and
  surgeons can belong to groups; a room's email and phone are optional and a room may hold none ("No
  email held", Mr B. Yeoman's room); practice manager and PA contacts show on the profile beside each
  room card, the office adds, edits and removes them, and a contact is never the To of an office email
  (Dr H. Dalgety's PA Bev: `/admin/masters/surgeons/S-DALGETY`)
- Pairing preferences and priority tiers: kept on both the surgeon profile and the anaesthetist
  record, admin only; a not-preferred pairing warns and never blocks; cover suggestions run in tier
  order, shuffled within a tier; seeded: Ms A. Reid prefers not to work with Dr Sharma, and Mr J.
  Whitford prefers to work with Dr Sharma
- Sessions and Lists: every active anaesthetist has an AM and a PM session a day from their start date
  over a configurable horizon (four months); the status is on the session, Free by default, and a List
  put into it shows in its place; default session times are one setting, sessions can have their own
- Find available (Day header): office only; the free anaesthetists for a session in tier order,
  shuffled within a tier, with not-preferred pairings apart once a surgeon is chosen; picking one opens
  Assign List
- Availability statuses (Master data): four to start (Free, On holiday, Unavailable, Public); rename, recolour or add a status and every app follows; rules
  read the status's ID; it is availability only, never a List's state (Active, Submitted or
  Authorised, or Draft for a Draft List)
- Out-of-hours sessions: **Open out-of-hours session** on an anaesthetist's Day row (hover the name or
  Tab to it) opens an evening session after PM for any day from today, one a day, 18:00 to 21:00 by
  default; it works like any session: Assign List, a Draft List for the evening (session Out-of-hours),
  availability and the finders; an empty one closes from its drawer (US-01.1.6)
- The app never says "slot": it says session, AM, PM or Out-of-hours
- Later: billing and integration monitoring

## Strong phrases to use

- "The List is the unit of availability and approval."
- "Every session exists even when there is no activity; a List shows in its place when assigned."
- "The status lives on the session; the List, its hospital, surgeon and Bookings are put into it."
- "The office handles exceptions; the system removes repetitive work."
- "The Billing Engine references the Booking; it does not duplicate the scheduling record."
- "The captured inputs remain reproducible, not just the final total."
- "AA tracks collection and disbursement as two separate states."
- "This is a candidate design we would validate during discovery."

## Statements to avoid

- "Anaesthetists pick up open shifts."
- "The app automatically chooses the clinical RVG code."
- "ACC has its own billing route." (ACC is a funding tag on a Contract.)
- "Every insured patient is billed to an insurer." (Only a Contract held by the insurer bills it.)
- "Choose a billing route." (There is none: the Contract decides where the invoice goes.)
- "Authorisation means the patient has paid."
- "Xero is the source for the mobile balance view."
- "The prototype is connected to live hospital, Xero, NHI, email or OCR services."
- "This workflow is final" when the RFP explicitly leaves it open.

## Prototype readiness

Snapshot date: **24 July 2026**. Phases 00 to 12 are built and clickable. Phase 13, a subtle
mobile atmospheric background, is the only remaining phase and is purely visual.

### Built and clickable

- Mobile Lists, Bookings, BTM, completion and submission
- Web dashboard, Lists, availability and accounts views
- Admin day view, changes, cover, review, authorisation, masters and audit
- Draft Lists, including recurring clashes
- Billing run and invoice documents (Phase 08); invoices in the anaesthetist's name with AA as agent,
  layout from the Contract, sent by the run by email or marked To post, and a fee Split on the Booking
  (catch-up Phase 22)
- The anaesthetist's edit window to `AUTHORISED`, the main view from today, and search by patient
  name, NHI or date over months of history (catch-up Phase 38a)
- Pre-payment from a prepaid Contract (catch-up Phase 27), held in the AA Holding account and transferred to the anaesthetist when the List is authorised (catch-up Phase 27a), post-op addendum and billing monitor with per-booking isolation and retry (Phase 09)
- Contract locked at authorise, the run and the invoice document reading only the lock, Regenerate
  from locked data, and each Contract's History tab (catch-up Phase 25)
- Xero collection/payable pairs, payments, reconciliation poll, payables, live balances and GST (Phase 10)
- The anaesthetist's profile: own rate per unit editable on mobile and web, the office's Profile card and
  Anaesthetists columns, HPI CPN and bank details mandatory, the bank number masked (catch-up Phase 26)
- Hospital file import and the matching screen (Admin, Matching): wording as received, field
  differences, create a Booking, a List or a Draft List, the unmatched queue (catch-up Phase 33)
- Surgeon PDF ingestion (Phase 11); the HL7/FHIR integration monitor, mapping fix and dedupe are
  built but Future scope
- The demo control panel with S1 to S5 scenario jumps (Phase 12), now the index of the per-screen
  Demo actions (catch-up Phase 14)

### Present but honestly demo-only (keep the badge in view)

- The Xero simulator, integration simulator and the control panel are labelled "demo simulation":
  they simulate external systems and are not proposed end-user product screens.
- The billing monitor itself is proposed product UI; only its simulation triggers are badged.
- **Demo actions** (the pill in the top bar, beside the app switcher) holds the simulated events for
  the screen you are on, each badged "Demo trigger". It appears only on screens that have one. The
  control panel is now the index of them, with an **Open screen** link per entry (catch-up Phase 14).
- On a handset, the amber **Demo** chip opens the same actions as a sheet. Its **Office authorises
  this List** is badged "Office stand-in": the phone has no Admin app, so it plays the office for one
  submitted List. On Lists, **Office assigns a List to my next free session** (also an office
  stand-in) assigns a List to Dr Souter's earliest free session, which then shows as a booked List.
  On Availability, **Colleague moves a List into my free session** (badged "Colleague stand-in")
  plays a colleague handing one of their Lists on to her, so the Moved to you notice shows. On Lists,
  **Colleague moves a Booking to me** (also "Colleague stand-in", with a choice per candidate) plays a
  colleague handing her one Booking as a new List in a session she is free in; a session she is not
  available in is offered only after she sets it available in My calendar (her acceptance).
- On **Admin Day** and **Notifications**, **Demo actions → Colleague moves a List to the office**
  stages another anaesthetist's own return (One move), or **A busy morning (8 moves)** to show the
  Notifications page paging. Nothing waits for the office, so there is no office stand-in for it.
- On **Admin Day**, **Demo actions → Colleague hands a Booking to Dr Souter** (catch-up Phase 32a):
  a colleague moves one of their Bookings into her free session as a new List, with the office notice
  ticked, so the new List and the pool row show without switching persona. The move itself is plain
  product use: **Move to a colleague** on any of her Bookings (S2 Beat 3d).
- On **Admin Day** and **Conflicts**, **Demo actions → Simulate sickness** (catch-up Phase 32b) records
  a phoned-in sickness as the office: pick a List "to the office" or "to Dr X" and the List goes there
  in the same step, never a conflict.
- In the Admin **Assign Draft List** and **Reassign** pickers, each colleague marked unavailable shows
  read only with **Ask Dr X to make this session available** (badged "Colleague stand-in"): it plays
  that anaesthetist freeing the session, so the row becomes assignable. On a handset List or Booking,
  **Office resolves this alert** (badged "Office stand-in") plays the office ticking her alert. On her
  handset Lists, **The office adds an out-of-hours List for me tonight** (badged "Office stand-in")
  opens tonight's out-of-hours session and puts a List in it, at the hospital and with the surgeon of
  her latest List; in the framed build play the office with **Open out-of-hours session** on Admin Day.
  **Alert the office**, the tick and **Show resolved** are product actions, not demo actions.
- Hospital triggers: on **Admin, Matching**, **Demo actions → Import hospital file** (St George's or
  Southern Cross) and **Send update for a matched Booking** (Diane Foster by default); elsewhere the
  Future-scope **Fire hospital message**, which only stages a row on Matching. On a handset's Lists or Booking,
  **Hospital row arrives and the office matches it** (badged "Office stand-in") plays the import and
  the office's decision in one step.
- **Future scope** badges (grey, telescope icon) mark the HL7 v2 and FHIR tooling: the Integrations
  simulator, the Admin Integrations Messages and Feed config tabs, and **Fire hospital message** and
  **Replay last message** (bar only). Say so plainly: in scope today is the hospital import into the
  matching screen; a fired message is only sent to matching, and the simulator's pane 3 reads "Sent to
  matching".
- **Play the office** (PWA More tab) is off by default and badged "Simulated office" while on. It
  auto-authorises every submitted List and is a scaffold, not the proposed flow: use **Office
  authorises this List** instead.
- Optional Admin Audit aside: **Demo actions → Simulate sign-in attempts** adds five audited rows
  (account provisioned with no admin access to credentials, Admin sign-in with MFA, a failed attempt,
  a self-service password reset, an Apple social-login sign-in on mobile). Set Entity type to
  **account** to see them together. The identity service (Auth0 or Entra External ID) is simulated.

### Still upcoming

- Phase 13 adds one brand-derived atmospheric gradient behind the in-phone mobile canvas, plus a
  clearly badged tuning lab in the grey area outside the phone. It changes nothing in the workflows,
  data, web or admin apps.

## RFP ambiguities: present as discovery decisions

### 1. NHI in Xero (settled)

- One RFP section said NHI could be a searchable Xero contact cross-reference; Appendix 2 said NHI
  never leaves the practice system.
- Confirmed with AA: no NHI or other personal information in Xero, patient names included. Patient and
  payer contacts are named only by their hidden internal ID.

Say:

> AA confirmed the rule: Xero holds no NHI and no patient name, only a hidden ID that links each
> transaction back to the billing system.

### 2. Exact List disappearance trigger (answered)

- A List leaves the anaesthetist's main view when the office authorises it (OQ-31, 16 October), not
  at submit, not when billed, not on payment.
- Its invoices show in their balances at once (Xero returns the ID straight away).
- Older work is found by search on patient name, NHI or date; there is no calendar archive.

### 3. Billing failure isolation (answered)

- The RFP asked whether one failed Booking blocks the whole List. Answered (OQ-05): failure is per
  Booking, and a List never fails as a whole. A failed Booking is held back (both invoices of a split
  Booking with it) while the rest of the List bills.
- The run prices only from the lock, so a Contract edit cannot fail it; what can still fail is outside
  the lock, such as the Xero hand-off (S4 Beat 3). The office retries once from the Billing monitor
  (**Resolve & retry** for a hand-off; **Retry** rebuilds from the locked record), and the fix never
  edits a Contract or any other master.

### 4. Monitoring location

- The RFP leaves Admin Web versus a separate Billing Engine screen open.
- The prototype places monitoring in Admin Web.

### 5. List reassignment mechanics

- Settled by US-01.4.1: the List moves into the colleague's free session, keeping its id, Bookings and
  history; nothing about billing is recalculated.
- Answered (D60, OQ-84): whoever moves a List, the anaesthetist or the office, chooses what the
  vacated session becomes, Free or Unavailable, on every path; Free is chosen first, and when the move
  comes from marking the session unavailable, that status is chosen first.
- Answered (D7, OQ-39): an anaesthetist moves her own List at once, back to the office (a Draft List)
  or into a colleague's free session. Nobody accepts and the office does not confirm.
- Answered (D15, OQ-65): every such move posts to one shared notification pool in the Admin App, the
  same for every admin, separate from the to-do list.
- Answered (D58, OQ-79): notices are active or resolved. An admin ticks one (the same tick as a to-do's
  Clear) and it is hidden for the whole office; **Show resolved** brings it back with who and when;
  nothing expires. An anaesthetist's **Alert the office** with a note joins the pool. Whether an
  alerted Booking may still be submitted is open (the prototype allows it).
- Answered (OQ-102's 19 October note, D54): the office's pickers order free colleagues by tier, then
  preferred pairing; the anaesthetist apps stay by availability alone. The tier names are answered
  (OQ-102, D36).
- Answered (D44, OQ-43): no warning on the anaesthetist's own move. She sees colleagues by
  availability alone; pairing preferences are the office's alone and warn only on the office's paths.
- Answered (D61, OQ-85; D54, OQ-113): she can also move a single Booking, to a colleague free in
  that session, found by typing a name or from the free list in name order (never by tier or
  pairing). It always becomes a new List in their session, never added to an existing List (the rule
  for now; it may change if it does not work in practice). Telling the office is her option.
- Answered (D38, OQ-80): the payable follows the Booking; a prepaid Booking's payable stays the AA
  Holding account, nothing is recalculated or repointed, and the transfer when the List is authorised
  pays whoever did it. Whoever submits a List did every procedure on it (the doer rule).

### 6. Hospital-closure conflicts (unavailability is never one)

- Answered (OQ-09): a soft warning. Nothing blocks the office; the List is accepted and flagged.
- A conflict is a List at a closed hospital. An anaesthetist's unavailability, short-notice sickness
  included, is never a conflict (D59, OQ-81 part 3 answered): whoever marks a booked session
  unavailable, the office included, returns the List to the office or hands it to a colleague there
  and then.
- The List changes colour (amber, with its kind's bar and a reason line) and shows on the Conflicts
  screen across every date.
- It clears when the clash goes (the closure moved or deleted, or the List's hospital changed) or when
  the office clears it, with an optional note and "Flag again".
- The office never assigns or moves a List onto an unavailable session: it is made available first,
  with the anaesthetist's agreement (US-01.6.3).
- Not conflicts: a recurring booking landing on an unavailable session becomes a Draft List (Phase 31),
  and anyone who marks a booked session unavailable is asked first whether the List returns to the
  office or goes to a colleague (US-01.5.5).

### 7. Multi-procedure invoice count

- RFP grouping text says same-counterparty Procedures share an invoice.
- The RFP's "Split Billing" section says two invoices, both for multiple procedures in one episode and
  for a partly covered procedure.
- Invoices group by billable party: one invoice per billable party per Booking, so a multi-procedure
  Booking with one payer is one invoice and one BCTI. A Split on the Booking (Paid by in a Procedure's Billing card, each party's share in $ or %, one party taking the rest) gives one
  invoice per share. No split setting on the Contract.

### 8. Pre-payment

- The RFP requires payment before the procedure. The trigger is Patient › Payment type: Prepaid, picked
  by the office, per Procedure. It is invoiced to the Procedure's payer: one prepayment invoice per
  payer, and each payer is locked once theirs is raised.
- The amount is the Procedure's price when the invoice is raised, in full and read-only after; or an
  amount the office types on No contract · Fixed price, at the top of the Prepaid list (the "just make
  it two grand" case).
- Approve and send is a switchable step (Admin Invoices, "Prepayment approval", on by default):
  approving generates the invoice to the payer, its pair, and sends it. The payable credits the AA
  Holding account, not the anaesthetist.
- The AA Holding account is a payables creditor, kept like an anaesthetist's account: not a bank account
  (the money sits in the trust bank account), not a Xero ledger account, and never paid itself. Money
  leaves it only by a transfer or a refund the system raises (the refund is Phase 41). Admin → Billing
  monitor shows its card: the balance, the prepaid Bookings it holds for, and its Received and
  Transferred entries (fresh reset: $1,380.00, Priya Nair, AA-2026-0001).
- Two steps: the payer's money is **collected into the AA Holding account** (nothing is paid to the
  anaesthetist; Run payables pays nothing), then **transferred** automatically when the office
  authorises the List, with no office step. The transfer is not a payment: no new invoice, no GST
  movement; the Xero simulator shows it as a manual journal (MJ-0001 for Nair), and how it posts in
  Xero is still to be confirmed. The next payables run pays the anaesthetist; the payment itself is made
  in Xero (OQ-111). The trigger is provisional (OQ-125: Greg said "confirmed and submitted").
- Money paid after the transfer goes straight to the anaesthetist's payable; a part-paid prepayment
  moves in full and is released as money arrives. Two payers mean two invoices, two payables to the
  AA Holding account and two transfers.
- A prepayment's payable is not counted as a BCTI for AA's fee (provisional, OQ-29).
- AA decided not to block (OQ-57): an unpaid prepayment is a warning in both apps that escalates as the
  date nears (mild, then strong from two days before; D5), and completing, submitting and authorising
  all go through. There is no override.
- After the procedure the prepaid Procedure is left off the final invoice with nothing deducted, and
  nothing more happens automatically. A move to a colleague changes nothing in the books: nothing is
  repointed, the transfer pays whoever did the List, and the old anaesthetist never sees it.
- Demo seed: Annette Riley (awaiting approval, $1,200.00 plus GST) and Priya Nair (the mixed case, paid,
  AA-2026-0001). Demo actions: Payment received · half / full, Move to 2 days before procedure, Add
  prepaid Booking (One payer / Two payers).
- Warnings: one routine; a To-do card and a Pre-payments card in Admin; a small triangle on Bookings in
  all three apps; the warning at the top of the Booking when it opens. Never a block, and no confirm
  step at submit.
- Catch-up Phase 21 adds two mild before-procedure rules: a **child as the payer** (under 18 on the
  List date, the patient paying for a Procedure billed to the payer; none when another payer is named
  or the Contract bills its holder; it shows on each Procedure, with one to-do row per Booking) and an **insurer with no approval number** (NIB or Southern Cross
  Health Society only; never ACC or Health NZ). Both clear from the To-do card.

### 9. Concurrency

- Several sources can change a Booking.
- The RFP asks how concurrent updates should be handled.
- The prototype is single-user and uses audited last-write-wins behaviour; production concurrency is
  a discovery topic.

### 10. Modifier values

- The modifier table is the NZSA RVG 2021 table as printed (30 codes, Admin → Master data →
  Modifiers); values that are not plain numbers ("2 + Time", "4-6") are entered at capture.
- Only the age modifier and a modifier the base units include are pre-applied, and both can be
  removed; nothing else is pre-filled. The age bands are settled (OQ-95 answered, D29).
- Modifiers stack with no limit (a policy matter for AA, not a system rule); the same modifier is
  never added twice. AA's own modifiers (Vanessa's list) are not loaded yet; the office can add one.

### 11. Open versus genuinely overdue prior balances

- The billing monitor's "Prior balance" intake flag reads any open (unpaid) prior episode.
- The RFP asks whether to separately distinguish "open" from "genuinely overdue" in this check; the
  prototype flags any open balance and holds the distinction as a discovery question.
- Invoices carry a raised date but no due date, so aging is derived, not contractual.

### 12. ACC pre-op flat-fee codes (CS250, CS260, CS70)

- ACC is not a billing route or a kind of Contract: ACC work bills through a holder's Contract carrying the ACC funding tag, such as ACC orthopaedic services, priced like any other.
- ACC pre-operative assessment has its own flat-fee code set (CS250, CS260, CS70); the prototype
  captures these as ancillary fixed-amount billing lines with the code named in the description.
- The RFP flags the code set as a special pre-assessment case to confirm with AA billing.

### 13. Specialties and funding tags (for AA to confirm)

- The starting specialties are the catalogue's nine plus Neurosurgery, Vascular surgery and Oral and
  maxillofacial surgery, because the specialist list holds surgeons in them. Subspecialties fold in:
  Colorectal, Breast, Upper GI and HPB under General surgery, Fertility under Gynaecology. AA's
  spreadsheet replaces the list.
- A surgeon can hold more than one specialty (Ben said this is "not a thing"; built as a list, usually
  one, for AA to confirm). A Contract is offered when it shares any one of them.
- Each funding tag may name its funder (Southern Cross Health Society for SXAP, Health NZ for HNZ,
  ACC for ACC), for suggesting a path later.
- A specialty or tag in use cannot be removed; rename it instead.

### 14. The Contract's invoice description on top (not yet put to AA)

- Ben and Vanessa agreed the hospital's text replaces the rooms' (5 November). The Contract's own
  invoice description taking precedence over both on the invoice (D37, extended 5 November) has not
  been put to Ben and Vanessa yet; present it as a discovery point.

### 15. Surgeons' rooms and practice contacts

- Open (OQ-127): whether practice manager and PA contacts belong to the room or to the surgeon, and
  which room's apply to a surgeon at several rooms. Built provisionally: held on the room, optionally
  named for one surgeon, every room's contacts shown on the profile, the main room's email the To; the
  profile says this is to be confirmed with AA.
- Answered (OQ-128): a surgeon can belong to more than one room.

## Likely evaluator questions

### "Who actually uses mobile versus web?"

The same anaesthetist. Mobile is the primary in-theatre/on-the-move interface; web provides a wider
planning and accounts view.

### "Who creates the shifts?"

The system creates AM and PM sessions on the rolling canvas. Recurring bookings supply recurring
defaults, painted after the anaesthetist's own calendar. "Apply to canvas now" repopulates the schedule
ahead after a change, without touching booked Lists. Office staff reserve and amend Lists and handle
exceptions. "Shift" is not the RFP term.

### "What about cases after six?"

The office opens an out-of-hours session after PM for the anaesthetist, even the same evening, and puts
a List in it: a new one, or a request already waiting as a Draft List for that evening. It is a session
like AM and PM, one a day, 18:00 to 21:00 by default: the anaesthetist can mark it available or not, the
finders offer it while it is free, and its Bookings are captured, submitted and billed like any List
(S2 Beat 3e).

### "What about public work?"

Public hospital sessions are a status on the session, with an optional note such as CPH, set by the
anaesthetist on their calendar or by the office from the Day view (Change status). It is never a kind
of List and is never billed. Public is not open for bookings or cover; changing it back to Free
reopens the session. What else the office needs to know about public sessions is a discovery point
(OQ-139).

### "Can an anaesthetist edit after submission?"

Yes, until the office authorises the List. A submitted List stays on the anaesthetist's main view, less
prominent, and they can still change it; every change is audited and Review shows "Changed since
submitted". The last change stands, and a Booking reopened after submit must be completed again before
the office can authorise. Authorised Bookings are immutable.

### "What happens when the office finds a mistake?"

Office staff phone for clarification and make the correction. There is no Returned state; the
anaesthetist can also correct it themselves until the office authorises it.

### "Why is Xero not doing all the billing?"

AA has agency-specific billing rules and needs Procedure-level calculation, grouping and
anaesthetist-facing views. Xero is the AR and banking add-on.

### "Does the anaesthetist get paid before the procedure?"

No. A prepayment is held in the AA Holding account until the office authorises the List, then
transferred to the anaesthetist who did it automatically, with no office step, and paid by the next
payables run. The payment itself is made in Xero (OQ-111). Authorisation as the trigger is provisional
(OQ-125).

### "How do late hospital changes work?"

Hospital rows land on the matching screen with their wording exactly as received. A later update is
matched to its Booking by date, surgeon, hospital and session and waits for the office to approve it;
the office can apply rows up to `AUTHORISED` (a row for an authorised List cannot be applied). Nothing
applies itself, and the hospital never sets the Contract. Applying hospital changes automatically comes
after the first release (US-02.5.1 to US-02.5.4).

### "What if the patient has no NHI?"

The RFP is internally inconsistent: one section treats NHI as the unique patient identifier, another
says "where available". The prototype uses a hidden internal ID as the invariant and allows a
provisional NHI-pending patient.

### "Is the demo using real patient or integration data?"

No. All names and data are fictional. Hospital, PDF/OCR, NHI, email, Xero and payment events are
simulated in-browser.

## One-line close

> The prototype demonstrates a single audited flow from a changing theatre schedule to captured
> clinical billing inputs, controlled office authorisation, reliable invoicing and transparent
> collection and disbursement.
