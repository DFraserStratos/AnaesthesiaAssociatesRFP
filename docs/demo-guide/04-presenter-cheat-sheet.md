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
  time 14, 08:30 to 11:30). A free-text charge is a billing event, a fixed amount only.
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
  data → RVG groups holds the RVG time rule; the office edits its tiers, and a part interval always
  rounds up). The anaesthetist enters start and finish only.

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
- The anaesthetist's GST report (web Accounts, GST report) is monthly and on a cash basis: one row per
  payment AA passed to her in the month, with its GST from the invoice's own GST. A month picker
  (July 2026 back to January 2026), Download (CSV), Print and Email to me; a receipt alone adds no
  row. There is no GST period anywhere.
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
- An invoiced Booking's price, split or payee changes only by a credit note and rebill (S4 Beat 2b).

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
- Weekly run by ISO week: close, check, approve, schedule; negatives net; remittance per run. A
  released payable waits for the week's run; the week closes on Friday and is reconciled to the bank
  download, Monday is for the checks (an anomaly is fixed or **held out**, and rolls into next week),
  the office approves the week's BCTIs, and on Tuesday the payment schedule goes to the accountant
  (catch-up Phase 39a). A negative invoice (a credit after payout) nets against the anaesthetist's
  positives in the same run, and every run leaves a remittance advice per anaesthetist; every payment
  carries its week. The 20th-of-the-month payment is not part of it (that is AA's separate monthly fee
  cycle), and the cycle is Greg's proposal, still with AA's accountant (OQ-47).
- The payment itself is made in Xero: the accountant pays the schedule, and the Billing Engine detects
  each disbursement by the bill-paid webhook, or at the daily reconciliation poll if the webhook is
  missed, and records it. On the Billing monitor the **Payment cycle** panel (Week 30 on a fresh
  reset) holds the four steps; its **Run payables in Xero** is badged **Simulated Xero** and reads "Nothing scheduled to
  pay" until the week is closed, approved and scheduled.
- Every call to Xero goes through the **Xero sync queue** first and retries with growing gaps, so an
  outage never loses a financial event or blocks authorising; **Retry now** on a queue row retries at
  once. Voids and edits made directly in Xero are flagged at the poll (**Changed directly in Xero**,
  Resolve moves no money, provisional). Admin Day's **Reconciliation** card reads **Books square** or
  **Out of balance**, with each item to resolve and its age (catch-up Phase 37).
- A prepayment's ACCPAY credits the AA Holding account instead, and is never paid itself; the money is
  transferred to the anaesthetist when the List is authorised (section 8 below). The prepaid amount is
  the price: nothing further is invoiced or credited automatically. A cancelled prepayment is credited
  and, if paid, refunded in full to the payer from the AA Holding account there and then; the refund
  is paid in Xero (catch-up Phase 41).
- A partial payment releases the payable for exactly the amount received; the rest stays outstanding.
- A correction is a trail, never an edit: the original's debit, the credit note's credit, the contra (a
  negative invoice to the anaesthetist) and the new invoice's debit (catch-up Phase 39).
- The negative invoice (`CN-2026-nnnn-P`) always reverses the anaesthetist's payable: offset against it
  while unpaid, netted in her next weekly payment run once paid. The Ledger shows **Credits held for
  payers** and **Negative invoices to net**; Xero gets an ACCRECCREDIT.
- Both Xero records carry the InvoiceNumber (the ACCPAY's ends `-P`) and the case Reference.
- The mobile/web app reads the Billing Engine's own ledger, AA's system of record, never Xero
  directly. Xero mirrors the ledger for receivables and banking.
- Outstanding balances are flat individual payable rows, oldest first with no ageing buckets, not a
  Booking-level rollup and not amounts the anaesthetist personally owes. A row stays ("Paid in, due to
  you") after the billable party pays, until AA pays the anaesthetist, and each row opens its Booking.
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

### Patient balance warning (catch-up Phase 40)

- One of the routine's warnings, raised when a Booking is created or matched for a patient who is the payer
  on the Booking and owes AA money on invoices billed to them. Mild within the threshold, strong over it
  (90 days from the invoice date, one admin field in Master data); a patient in credit is mild. Yellow and red.
- Other payers' bills (the hospital, an insurer) do not count toward the warning, though the patient
  record's balance shows them under Other payers. It never blocks a Booking.
- The office works it from the to-do list and the patient record (Log call, Resend, Clear). The
  anaesthetist sees the colour on their List, mild as yellow, without amounts.
- Seed: Sarah Mitchell strong ($610.00, Dr Sharma's AA-2026-HS01, 98 days); Losa Tuilagi mild ($380.00, 30
  days); Heather Sinclair in credit ($260.00, credited 2 June).
- Shared notes: anyone writes a note on a List or Booking, everyone sees it.
- **The NHI is mandatory:** no Booking without one. A row without an NHI waits (Admin, Patients, Waiting for
  NHI), the anaesthetist sees a stub, and the office adds the NHI.

### Internal ledger (catch-up Phase 36)

```text
Receipts held = payables due + the AA Holding account  ->  In balance
```

- **Pairs:** every invoice is a pair in the Billing Engine's own ledger, created with the invoice
  (before and whatever happens at the Xero handoff): a receivable from whoever pays and a payable to the
  anaesthetist (the invoice number, and the same number with `-P`). A prepayment's payable is to the AA
  Holding account; authorising the List adds a transfer row to whoever did it. An AA fee invoice is a
  pair with no payable, outside the balance. Xero mirrors the pairs; a pair not yet in Xero is counted
  ("Not yet in Xero").
- **The equation:** receipts held less payables due and the AA Holding account is $0.00 when in
  balance. Fresh seed: Receipts held $1,380.00 = Payables due $0.00 + AA Holding account $1,380.00
  (Priya Nair's prepayment); Receivables outstanding $11,350.50, Disbursed $27,220.00, AA fees
  outstanding $580.75 (Dr Souter's unpaid June fee invoice), Not yet in Xero 1.
- **Two scopes:** the whole ledger, and one anaesthetist. Dr Souter on a fresh seed: AA owes Dr Souter
  $11,350.50 (due now $0.00, awaiting collection $11,350.50), Dr Souter owes AA $580.75, Collected
  $27,220.00, Paid out $27,220.00.
- **The out-of-balance list:** "Anaesthetists out of balance", just a list, each with the amount, the
  reason and Open. Empty: "Every anaesthetist's ledger is in balance."
- **The trigger:** **Demo actions → Inject unmatched receipt** on the Ledger, a $120.00 bank receipt that
  matches no invoice. **Names Dr Souter** (the default): out of balance by $120.00 and Dr Souter on the
  list. **Names no one**: out by $120.00, the list stays empty. The office clears it with **Allocate to
  invoice** or **Mark refunded**; the trigger is disabled ("Resolve the held receipt first") while one
  is held.
- **Where it lives:** **Admin → Ledger** (`/admin/ledger`, an amber badge counting what puts it out of balance; one
  anaesthetist at `/admin/ledger/anaesthetists/34821`), linked from the Billing monitor (**Open the
  ledger**) and each invoice's **Ledger** card. The anaesthetist sees her position on web **Accounts**
  (Your position), the web dashboard (Financial position) and mobile **Balances** ("Collected $X",
  "Paid out to you $Y"); on a handset the Demo sheet's
  **Office runs this week's payment cycle** (office stand-in) closes the week, approves it and sends
  the schedule, and the accountant pays it in Xero. The Xero sim's pair detail shows
  **Ledger pair (the system of record)** with **Matches the ledger**.
- Note: Dr Souter's outstanding total is $11,350.50 on a fresh seed (it was $7,785.50 before Phase 36),
  because the seeded AA-2026-S2401 ($3,565.00, Thu 16 Jul Face lift) is now counted though it is not
  yet in Xero.

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
- Sees each procedure's Contract, who is invoiced and the price they may change; never Contract
  set-up, tiers or preferences
- Signs in to the PWA once with their account (simulated; Dr Souter's demo account
  `m.souter@aa-associates.example`), with **Sign out** on More
- Later: balances

### Anaesthetist Web

- Dashboard with your financial position (owed to you, collected, paid out to you) beside Who's free
- A main view from today with earlier un-authorised Lists, and past work by patient name, NHI or date
- Same List/Booking detail and capture functions
- Availability and cover: mark Free, On holiday, Unavailable or Public (with an optional note) ahead,
  repeating days off, change or delete one occurrence (My availability, the same form as the phone)
- Move a List to a colleague or the office; hand one Booking to a free colleague (Move to a colleague)
- Accounts (Outstanding, Payments, AA fees) and GST report (by month)
- Profile (her name and avatar in the top nav): rate per unit editable, the rest read-only
- Sees each procedure's Contract, who is invoiced and the price they may change; never Contract
  set-up, tiers or preferences

### Admin Web

- **Patients** (catch-up Phase 40): patient search and records, Waiting for NHI, and the follow-up list for
  patients who owe

- Whole-day operational control
- Phone/manual changes
- **Explicit save on the Admin Booking** (catch-up Phase 35): every edit (Contract, step rail, price,
  payer, Split, Make primary, time, notes, NHI on Edit patient) is a draft until **Save changes**. A
  sticky amber bar counts and names them ("2 unsaved changes · Notes · Time", **Discard** beside it);
  sheets read **Apply** inside the draft. Leaving asks "Leave without saving?" (**Keep editing** or
  **Discard and leave**). A save is one change set: the green strip "Saved · 2 changes · 08:00 ·
  Kirsty W." with its id (CS0001), one grouped **Saved by** row in History, and **View as at** on any
  History row shows the Booking as it was then. The text as received is never edited. Warnings and the
  prepayment panel follow on Save, not while drafting. When another user's save lands on a Booking
  that is open (the office's save on the anaesthetist's phone, or the other office user's), one line
  says so ("Kirsty W. saved changes to this Booking: Time. View history")
- **The update email, on demand** (catch-up Phase 35): **Draft update email** on every Admin Booking
  (it waits while there are unsaved changes: "Save your changes first. The email uses saved
  changes."), on the List drawer once the List has a change of anaesthetist, and **Draft cover-change
  email** on a Notifications row for an anaesthetist's own move to a colleague (a single-Booking move
  she told the office about offers Draft update email). The composer lists the saved changes to pick
  (several picked net to one line, "Time: was 15:10, now 15:30"; notes never go in), a template, Send
  to (Surgeon's office, Hospital or Both) and a preview with its length (of 2,000 characters). It goes
  to the List's sender when the List came from a rooms' PDF, else the surgeon's first office contact
  with an email, the others offered; a cover change goes to the hospital. **Open in mail client**: the
  system never sends it, and no prompt follows a save (OQ-82)
- **Master data · Email templates** (`/admin/masters?view=emailTemplates`): Change of anaesthetist
  (Hospital), Cancellation, Correction of an error and Booking change (Surgeon's office); Add
  template, Edit, Retire and History; a placeholder the system does not know is refused on Save
- **Add Booking** on any List the office may edit, booked or not, until it is authorised: the same
  form with the **Procedure description** (kept exactly as typed, Told by Phone or Email)
- Move one Booking
- Reassign a whole List
- Draft Lists: Lists with no anaesthetist yet, soonest first; assign one from a grouped, tier-ordered picker
- Correct billing setup
- Review and authorise
- Master data (every master in one place, kept by hand after a one-off load from AA's controlled
  spreadsheets, every change audited, go-live load) and audit
- Master data's sub-nav is grouped: People and places, Schedule, Billing, Settings, Go-live
- Anaesthetist profiles: rate per unit, contact details, registration number, HPI CPN, bank account
  (masked) and GST number on each record (**Edit details** on the Profile card) and in the
  Anaesthetists table; the HPI CPN and bank details are mandatory, every change audited
- Surgeon profiles: the system keeps no surgeons' rooms. Each surgeon holds one or more specialties
  from AA's list (required; a save with none is refused), a practice name (plain text; Mr N.
  Wainwright, at two practices, holds both names), one personal contact and one or more office
  contacts (practice manager, PA or shared inbox: name, email, phone, blanks allowed) entered on the
  Edit details sheet's plus and minus form ("Add office contact" adds a set, a minus removes an extra
  set, one set always shows; a two-practice surgeon holds one for each practice); surgeons can belong
  to groups. The HPI CPN is filled in by admin staff (unique when held; a surgeon saves and is booked
  without one, shown as "No HPI CPN yet": Dr P. Whaanga, Dr B. Osei and Dr Selwyn). The office's
  emails go to the first office contact with an email (pill "Office emails go here first"), the others
  offered, never every contact and never the personal contact (Dr H. Dalgety's PA Bev:
  `/admin/masters/surgeons/S-DALGETY`). The list is AA's address book of surgeons (columns Name,
  Specialties, Practice, Office contact, HPI CPN, Pairings)
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
- Intake (one side-nav item under Day view; `/admin/intake`): tabs **Matching**, **PDF lists**, **Data
  quality** and **Validators**. Hospital files from St George's and Southern Cross and the rooms' PDF
  lists arrive here, every row waiting for the office's decision; nothing syncs
- Later: billing monitoring and the rows still waiting on Intake

## Strong phrases to use

- "The List is the unit of availability and approval."
- "Every session exists even when there is no activity; a List shows in its place when assigned."
- "The status lives on the session; the List, its hospital, surgeon and Bookings are put into it."
- "The office handles exceptions; the system removes repetitive work."
- "The Billing Engine references the Booking; it does not duplicate the scheduling record."
- "The captured inputs remain reproducible, not just the final total."
- "AA tracks collection and disbursement as two separate states."
- "Nothing is paid until the week's BCTIs are approved."
- "Every payment carries its week number."
- "Bulk remittances are matched in Xero, not by the engine."
- "Approval stays on Review, one path with all its checks; the monitor shows what is waiting and takes
  you there."
- "Everything after setup is an event on the Procedure, reviewed once and invoiced in the next run."
- "Extra work after a fixed price is billed by hand, by the anaesthetist or the office."
- "We never edit an issued invoice; we credit it in full and rebill."
- "One review step for everything recorded against a procedure."
- "A split must add up to what was credited."
- "Nothing comes across because it exists in Solutions Plus."
- "The NHI never leaves the core platform, no personal information goes to Xero, and we check it."
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
- "The system emails the hospital (or the surgeon's office) automatically." (The office drafts it on
  demand and sends it from its own mail client, OQ-82.)
- "The app replaces the emailed lists." (The rooms' emailed Lists stay; OQ-124 is open.)
- "The anaesthetist raises a post-op Booking." (A post-op charge is an event on the Procedure, never a
  new Booking.)
- "The system invoices the balance." (Nothing is billed automatically after a prepaid or fixed price.)
- "A BCTI credit." (The anaesthetist's payable is reversed by a negative invoice.)
- "A credit note is a refund." (It is not; money paid on a credited invoice is held for the payer. The
  one automatic refund is a cancelled prepayment, refunded from the AA Holding account.)
- "The system credits the difference automatically." (Nothing is credited automatically: a person
  decides, and the invoice is credited in full, never by the difference.)
- "The accountant has signed off the weekly cycle." (It is Greg's proposal, Proposed and still with
  AA's accountant, OQ-47.)
- "The 20th is part of this run." (It is the separate monthly fee cycle.)
- "The system chases a departed anaesthetist." (With no later payment to net against, AA settles a
  negative invoice with the anaesthetist outside the system, OQ-71.)
- "The system pays the anaesthetist." (Payments are made in Xero; the system approves, records and
  tracks them.)
- "Events need a separate approval." (One review step, Review → Events, for every event, D13.)
- "These are the ACC codes." (CS250, CS260 and CS70 are provisional; OQ-12 is open.)
- "ACC pre-op has its own fixed-fee Contract." (Answered no: it follows the generic event rules.)
- "Vanessa has confirmed how events are billed." (OQ-121 is Donald's answer for the build.)
- "A unit x rate line or an add-on fee." (Both are removed from the requirements.)
- "Billing lines." (They are billing events: a free-text charge or credit on the Procedure.)

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
- Prepayment letter, cancellation and differences by hand (catch-up Phase 41): the letter with **Approve
  and send** and its **Preview letter**, Master data · Prepayment letters, **Send prepayment
  reminder**, the **Prepaid settlement** block (nothing further but by hand: a whole-invoice credit
  note and an additional invoice), automatic credit or refund on cancel (the holding card's Credited
  and Refunded rows, the Xero refund), the move rule with its honour line and the optional **Email
  patient: anaesthetist changed**, and **Rebook with another anaesthetist** at the new anaesthetist's
  own price
- Pre-payment from a prepaid Contract (catch-up Phase 27), held in the AA Holding account and transferred to the anaesthetist when the List is authorised (catch-up Phase 27a), events and additional invoices (office and anaesthetist, catch-up Phase 38b) and billing monitor with per-booking isolation and retry (Phase 09); since catch-up Phase 37 the monitor is grouped by anaesthetist, sorts and filters (one anaesthetist, hospital, dates, **Problems only**, all in the URL), and lists each anaesthetist's Lists awaiting approval with **Open in Review** (approval itself stays on Review)
- Pre-op and post-op events (catch-up Phase 39b): the anaesthetist's **Add pre-op or post-op event**
  (its own date, a time or fixed fee, the invoice tick, the "same as" party) and **Add billing event**
  (a free-text charge or credit) on mobile and web, the ACC pre-op event (CS250, CS260, CS70), Contract
  event fees (St George's ACC, STGACC-PAIN), one review on Review, Events, and the next run: dated lines
  on the party's invoice ("+3 event lines") or an invoice of its own ("+1 event invoice")
- Credit notes (catch-up Phase 39): the office's **Credit note**, **Credit in full and rebill** (from a
  copy of the original's lines) and **Split into additional invoices** (Left to allocate to $0.00) on
  the invoice's **Correct this invoice** card, and the anaesthetist's **Credit note** on her own
  Procedure; each reviewed on Review, Events and issued in the next run, with its negative invoice,
  the credit note document, the Credited original and the Xero credit note
- Contract locked at authorise, the run and the invoice document reading only the lock, Regenerate
  from locked data, and each Contract's History tab (catch-up Phase 25)
- Xero collection/payable pairs, payments, reconciliation poll, payables, live balances and GST (Phase 10)
- The weekly payment cycle (catch-up Phase 39a): close the week (reconciled to the bank download),
  the Monday checks with **Hold out of this run**, **Approve week 30's BCTIs** (nothing is paid
  without it), the payment schedule sent to the accountant, and **Run payables in Xero**; negative
  invoices netted in the run, each run's page and remittance advice per anaesthetist, the week on
  every payment, and the anaesthetist's **Remittances** in web Accounts
- Xero resilience (catch-up Phase 37): the payment made in Xero with each disbursement recorded by
  webhook or poll, the Xero sync queue with backoff and **Retry now**, voids and edits made in Xero
  flagged at the poll, bulk remittances matched in Xero's Bank reconciliation, and the Reconciliation
  card on Admin Day
- The internal ledger with an in-balance view: Admin Ledger (the whole ledger and one anaesthetist),
  the out-of-balance list, unmatched receipts allocated or refunded, and the anaesthetist's position on
  web Accounts and mobile Balances (catch-up Phase 36)
- The anaesthetist's profile: own rate per unit editable on mobile and web, the office's Profile card and
  Anaesthetists columns, HPI CPN and bank details mandatory, the bank number masked (catch-up Phase 26)
- NHI lookup and identity standards (catch-up Phase 40a): on every **Add a booking** the NHI is
  validated in both formats as it is typed ("Valid NHI", or "The check digit does not match."), and
  **Look up** stays disabled until it is valid, so an invalid NHI is never sent to the Hub; Look up
  pre-fills the patient from the NHI register, still editable. Practitioners are referenced by their
  HPI CPN, the one name and format everywhere, and NHI use is purpose-limited: the note under the field
  reads "Looked up on behalf of Dr Melanie Souter (HPI CPN 10SOUM), only to identify this patient.
  Health Information Privacy Code 2020." The office refreshes a patient from the register (Admin,
  patient record, **Refresh from NHI register**, Keep or Use register per field, audited, never sent to
  Xero), and the Add NHI sheet shows the register's name and DOB
- Hospital file import and the matching screen (Admin, Intake, Matching): wording as received, field
  differences, create a Booking, a List or a Draft List, the unmatched queue (catch-up Phase 33)
- The rooms' PDF lists (Admin, Intake, PDF lists): upload with the address it came from, correct a
  row beside the facsimile, Send to matching; every List records where it came from and who replies go
  to; a re-sent list's differences wait for approval (catch-up Phase 34)
- S1 in one line: import the St George's file, match Sarah Mitchell (`lap appy ?conv to open`) onto Dr
  Souter's Tue 28 Jul AM List, answer "Where does the invoice go?" with Patient, then No contract ·
  RVG, a no-NHI row waiting as a stub, Mr Okafor's PDF list keeping its sender, then capture A3 live
- The HL7/FHIR simulator, message log (retry and dead-letter) and feed mapping are built but Future
  scope, on their own demo surface
- Explicit save on the Admin Booking (one change set a save, History grouped, View as at), Switch
  office user, the on-demand update email and its composer, and Master data · Email templates
  (catch-up Phase 35)
- The demo control panel with S1 to S5 scenario jumps (Phase 12), now the index of the per-screen
  Demo actions (catch-up Phase 14)
- The PWA's simulated sign-in (catch-up Phase 43a): the sign-in screen with Dr Souter's demo account
  filled in and a **Provisional** caption (OQ-83), "Signed in as" and **Sign out** on More, and one
  audit row per sign-in, refused attempt and sign-out (Entity type **account**). The framed prototype
  always opens signed in.
- Point-of-need help (catch-up Phase 43a): an info sign beside section labels on Booking capture
  (bottom sheets on the phone, popovers on the web), Admin Day (status legend, Draft Lists, Needs an
  invoice destination, To-do) and Admin Review (Flags, Procedures, Fee, Authorise for billing)
- Welcome cards (catch-up Phase 43a): one per app on first visit (mobile Lists, web Dashboard, Admin
  Day), dismissed with **Got it**, back after Reset or with **Demo actions → Show first-run hints
  again**

### Present but honestly demo-only (keep the badge in view)

- The Xero simulator, integration simulator and the control panel are labelled "demo simulation":
  they simulate external systems and are not proposed end-user product screens.
- The billing monitor itself is proposed product UI; only its simulation triggers are badged. It is
  grouped by anaesthetist, sorts and filters (one anaesthetist, hospital, dates, **Problems only**),
  and lists Lists awaiting approval with **Open in Review**; approval itself stays on Review.
- The Xero triggers (catch-up Phase 37): **Simulate Xero outage** and **Restore Xero** (Billing monitor
  and the Xero tabs); on a Xero pair, **Void this invoice in Xero**, **Edit this invoice's total in
  Xero** ($20.00 lower) and **Pay anaesthetist in Xero (payables run)** (the bill-paid webhook delivers,
  or is missed and the poll catches it); **Simulate bulk hospital remittance** (Xero Invoices and Bank
  reconciliation). The Billing monitor's **Run payables in Xero** is not a demo action but carries the
  **Simulated Xero** badge: once the week is closed, approved and scheduled, it stands in for the
  accountant paying the schedule in Xero, and the Billing Engine records each payment it reports. The
  cycle's staging triggers, **Stage a payment week** and **Stage a bank mismatch**, are Billing monitor
  demo actions.
- The prepayment follow-up triggers (catch-up Phase 41): **Stage longer prepaid procedure** (Admin
  Review of a submitted List with a sent prepayment: lengthens the prepaid procedure so Authorise can
  show it raises nothing), **Payment arrives after the credit note** (Admin Booking detail of a
  cancelled, credited, unpaid prepayment: the late payment is refunded at once), **Change Contract after
  prepayment sent** (Admin Booking detail: the office's Contract change, credited and refunded), and on
  a handset Booking **Office sends a prepayment reminder** (badged "Office stand-in"). **Send
  prepayment reminder**, **Rebook with another anaesthetist** and **Email patient: anaesthetist
  changed** are product actions.
- Master data's **Seed load** and **Go-live load** views are badged demo: they stand in for the
  developer's one-off load from AA's controlled spreadsheets (every row checked by the manual add's
  rules, rejected rows listed with reasons), not office screens. The office never loads master data.
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
  The chip also holds **Sign out** (PWA only), which returns the handset to the sign-in screen with
  the account filled in.
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
- Hospital triggers: on **Admin, Intake, Matching**, **Demo actions → Import hospital file** (St
  George's or Southern Cross; the same as the screen's own **Import hospital file** button) and **Send
  update for a matched Booking** (Diane Foster by default). On a handset's Lists, List or Booking,
  **Hospital file imported and my booking matched** (badged "Office stand-in"), choice **St George's
  file, Tue 28 Jul AM (S1)**, imports the file, decides the rows for that List and sets No contract ·
  RVG on Sarah's new Booking; then it reads **Nothing new from the hospital for your Lists**.
- PDF lists: **Upload PDF list** picks from sample files (badged Sample files; the reading is
  simulated, no OCR, no mailbox) with the sender's address entered; on **Admin, Intake, PDF lists**,
  **Demo actions → Receive updated PDF from rooms** plays the rooms re-sending a list already sent, once
  per reset.
- **Future scope** badges (grey, telescope icon) mark the HL7 v2 and FHIR tooling, now on its own
  demo surface, **Demo: Future scope, HL7 and FHIR** (`/demo/integrations`, with
  `/demo/integrations/log` and `/demo/integrations/mapping`). **Fire hospital message** and **Replay
  last message (dedupe)** run only there, never from a Booking or Mobile Lists. Christchurch Public is
  not integrated today. Say so plainly: in scope today is the office importing hospital files and the
  rooms' PDF lists into Intake; a fired message only lands on Admin Intake as a row.
- **Switch office user** (catch-up Phase 35; **Demo actions** on the Admin Day view and Booking
  detail): stands in for each office user signing in as themselves. The Admin app then acts as the
  other named user, Kirsty W. or Sam T. ("The office is now Sam T."), so two users' saves show named in
  one Booking's History. Disabled while the Booking has unsaved changes. The top bar keeps reading
  Kirsty W.; the save strip, History and the email's sign-off name who saved.
- On a handset Booking, **Office edits this Booking** (badged "Office stand-in", PWA only): Kirsty W.
  saves the time 30 minutes later as one change set ("The office moved this Booking to 15:40."), and
  the phone shows "Kirsty W. saved changes to this Booking: Time. View history". In the framed build
  make the change on the Admin Booking and save it.
- **Play the office** (PWA More tab) is off by default and badged "Simulated office" while on. It
  auto-authorises every submitted List and is a scaffold, not the proposed flow: use **Office
  authorises this List** instead.
- Optional Admin Audit aside: **Demo actions → Simulate sign-in attempts** adds five audited rows
  (account provisioned with no admin access to credentials, Admin sign-in with MFA, a failed attempt,
  a self-service password reset, an Apple social-login sign-in on mobile). Set Entity type to
  **account** to see them together. The identity service (Auth0 or Entra External ID) is simulated.
- **Load full-scale data** (catch-up Phase 43; **Demo actions** on Admin Day view and Invoices, with a
  confirm): builds the whole practice in memory from the same seed (85 anaesthetists, 21,080 sessions,
  28,268 invoices) with a banner reading "saving paused" and a **Timings** disclosure. It is a demo
  stand-in for production volume, not a product feature: move with the side nav while it is loaded, and
  **Reset** or a reload returns to the demo data.
- **Scan for NHI leaks** (Data Inspector, `/demo/data`; **Scan now**, or **Scan with a planted test
  leak (proves the scan finds one)**): checks the Xero records and their sync queue for any NHI or
  personal detail, and the diagnostic log and failure reasons for anything that looks like an NHI. The
  planted choice adds one test line to that scan only, to prove the scan finds one.
- **View raw row as another role** (Admin, Intake, Matching; **As Dr Melanie Souter** or **As the
  hospital feed**): plays someone other than the office asking for a raw hospital row, so the refusal
  ("Refused: only office staff can view a raw hospital row") and its audit entry, **Raw row view
  refused**, show. **View raw row** itself, with its reason and masking, is proposed product UI; the
  masking policy is for AA to agree.

- The **Digital Services Hub** (catch-up Phase 40a) is simulated over a deterministic synthetic NHI
  register (every seeded patient, four named register-only people and a generated pool), with three
  demo states: **Demo actions → Hub: Available / Slow / Unavailable**, shown only while Add a booking,
  the patient refresh panel or the Add NHI sheet is open (on a handset, on the Demo sheet). Unavailable
  shows "The Digital Services Hub is not answering. Enter the details by hand, or try again." with
  **Retry** and an amber **Hub simulated as Unavailable** badge; the details can still be typed and
  saved with a valid NHI. Slow is a long wait with **Stop waiting**. The mode stays set until changed
  or Reset.

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
  the lock, such as the Xero hand-off (S4 Beat 3). A hand-off that fails waits in the Xero sync queue,
  which retries it by itself; the office can use **Retry now** on its queue row (the booking row's
  **Retry**, which rebuilds from the locked record, stays for a failed billing run), and the fix never
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
- Public holidays come from one master calendar (Master data → Public holidays: Labour Day Mon 26 Oct
  and Canterbury Anniversary Day Fri 13 Nov 2026, then Christmas to Waitangi Day 2027): each closes every
  hospital not listed open that day, shows on each hospital card and read-only on its calendar, and flags
  a List there like any closure. AA rooms is listed open only on Labour Day and Canterbury Anniversary Day
  (PH001, PH002); the later holidays close it too.
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
- The letter (catch-up Phase 41): Approve and send names the **Standard prepayment letter**, with
  **Preview letter**. It states the prepaid amount as the price ("The anaesthetic fee is $1,380.00,
  payable before your procedure.") and says the anaesthetist may send a further invoice or a credit if
  the procedure turns out very different; the invoice document carries it as a cover section, and with
  approval off the automatic send carries the default letter. The office keeps the templates on
  Master data, Prepayment letters (Standard prepayment letter, Prepayment reminder, Anaesthetist
  changed; one default per kind; estimate wording refused).
- Reminders: **Send prepayment reminder** on the Booking's prepayment panel (office, while unpaid or
  part paid) sends the amount still to pay; the panel reads "Reminder sent 21 Jul 10:04 to" the
  address, and the Admin Day rail row "Reminded 21 Jul".
- The AA Holding account is a payables creditor, kept like an anaesthetist's account: not a bank account
  (the money sits in the trust bank account), not a Xero ledger account, and never paid itself. Money
  leaves it only by a transfer or a refund the system raises. Admin → Billing monitor shows its card:
  the balance, the prepaid Bookings it holds for, and its Received, Transferred, Credited and Refunded
  entries (fresh reset: $1,380.00, Priya Nair, AA-2026-0001).
- Two steps: the payer's money is **collected into the AA Holding account** (nothing is paid to the
  anaesthetist; no payment run pays it), then **transferred** automatically when the office
  authorises the List, with no office step. The transfer is not a payment: no new invoice, no GST
  movement; the Xero simulator shows it as a manual journal (MJ-0001 for Nair), and how it posts in
  Xero is still to be confirmed. The next weekly payment run pays the anaesthetist; the payment itself is made
  in Xero (OQ-111). The trigger is provisional (OQ-125: Greg said "confirmed and submitted").
- Money paid after the transfer goes straight to the anaesthetist's payable; a part-paid prepayment
  moves in full and is released as money arrives. Two payers mean two invoices, two payables to the
  AA Holding account and two transfers.
- A prepayment's payable is not counted as a BCTI for AA's fee (provisional, OQ-29).
- AA decided not to block (OQ-57): an unpaid prepayment is a warning in both apps that escalates as the
  date nears (mild, then strong from two days before; D5), and completing, submitting and authorising
  all go through. There is no override.
- After the procedure the prepaid amount is the price: the prepaid Procedure is left off the final
  invoice and nothing further is invoiced or credited automatically. Once the List is authorised its
  **Prepaid settlement** block shows the prepaid price, the recorded BTM for reference only, the move
  from the AA Holding account, and "Nothing is invoiced or credited automatically." If the work turned
  out very different, the anaesthetist or the office raises an additional invoice or a credit note by
  hand. A credit on a prepayment invoice is always the whole invoice ($1,380.00 against AA-2026-0001);
  anything still owed is a fresh additional invoice, its payable to the anaesthetist (OQ-97). Before
  authorise only the office credits it, and Authorise then bills the Procedure normally.
- A move changes nothing: the patient is not billed again, nothing is repointed, and whoever does the
  procedure claims the prepaid amount. Every move step carries the honour line (the office's: "The
  prepayment keeps its agreed amount. Whoever the office assigns claims it."); the Admin Booking reads
  "Prepayment kept at the agreed amount · now with Dr Beaumont", with an optional **Email patient:
  anaesthetist changed** (Provisional, OQ-120).
- A cancel settles it there and then, whoever cancels, and the cancel sheet says what will happen: an
  unpaid invoice is credited in full (the patient is not chased); a paid one is credited and refunded
  in full to the payer from the AA Holding account (the refund paid in Xero, "Refund paid from AA trust
  account"; our reading of "all payments", to confirm with Greg); a payment that arrives after the
  credit is refunded at once (a reading). A Contract changed off prepaid after sending is settled the
  same way, then the Procedure bills under the new Contract (OQ-119).
- A true rebook (**Rebook with another anaesthetist** on the cancelled Booking) starts a fresh
  prepayment at the new anaesthetist's own price ($1,350.00 for Dr Beaumont), awaiting approval; both
  Bookings show the history ("Earlier prepayment · Dr Souter · $1,200.00 ex GST · refunded"), so the patient
  may see two amounts.
- Demo seed: Annette Riley (awaiting approval, $1,200.00 plus GST) and Priya Nair (the mixed case, paid,
  AA-2026-0001); Dr Beaumont's own price list (Rhinoplasty $1,350.00). Demo actions: Payment received ·
  half / full, Move to 2 days before procedure, Add prepaid Booking (One payer / Two payers), Stage
  longer prepaid procedure (Admin Review), Payment arrives after the credit note and Change Contract
  after prepayment sent (Admin Booking detail), and the PWA's Office sends a prepayment reminder.
- Warnings: one routine; a To-do card and a Pre-payments card in Admin; a small triangle on Bookings in
  all three apps; the warning at the top of the Booking when it opens. Never a block, and no confirm
  step at submit.
- Catch-up Phase 21 adds two mild before-procedure rules: a **child as the payer** (under 18 on the
  List date, the patient paying for a Procedure billed to the payer; none when another payer is named
  or the Contract bills its holder; it shows on each Procedure, with one to-do row per Booking) and an **insurer with no approval number** (NIB or Southern Cross
  Health Society only; never ACC or Health NZ). Both clear from the To-do card.

### 9. Concurrency

- Several sources can change a Booking: the office, the anaesthetist and, later, the hospital feeds.
- The office saves explicitly, and every save is one change set, named for who made it (two named
  office users show in one History with **Switch office user**).
- Handling two sources editing at once is Future Work in the catalogue, with the automated
  integrations (US-02.5.6). The prototype applies each save in order, each audited, and tells an open
  screen when someone else has saved.

### 10. Modifier values

- The modifier table is the NZSA RVG 2021 table as printed (30 codes, Admin → Master data →
  Modifiers); values that are not plain numbers ("2 + Time", "4-6") are entered at capture.
- Only the age modifier and a modifier the base units include are pre-applied, and both can be
  removed; nothing else is pre-filled. The age bands are settled (OQ-95 answered, D29).
- Modifiers stack with no limit (a policy matter for AA, not a system rule); the same modifier is
  never added twice. AA's own modifiers are master data the office adds, edits, retires and
  reinstates.

### 11. Open versus genuinely overdue prior balances

- The "Prior balance" intake flag is retired (Phase 40); the patient balance warning replaces it (see
  "Patient balance warning").
- The RFP asks whether to separately distinguish "open" from "genuinely overdue"; the prototype uses a
  mild warning inside the threshold and a strong one over it, and holds the threshold as a discovery
  question.

### 12. ACC pre-op flat-fee codes (CS250, CS260, CS70)

- ACC is not a billing route or a kind of Contract: ACC work bills through a holder's Contract carrying the ACC funding tag, such as ACC orthopaedic services, priced like any other.
- ACC pre-operative assessment has its own code set (CS250, CS260, CS70); the prototype offers these
  as preconfigured pre-op events under the generic event and pricing rules (a time recorded or a fixed
  fee, no fixed-fee Contract, ACC being a funding tag on the Contract, not a Contract kind). Each is
  its own invoice line ("Pre-op event · ACC pre-op assessment · CS250 · 13 Jul 2026"). The codes are
  provisional, to confirm with AA's accountant (OQ-12).
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

### 15. Surgeon contacts and practice (no surgeons' rooms)

- Answered for the build (OQ-127 and OQ-126; Donald, not yet seen by AA): no surgeons' rooms are kept;
  each surgeon holds a practice name, one personal contact and one or more office contacts, and a
  surgeon at two practices holds an office contact for each.
- Superseded (OQ-128): a surgeon belonging to more than one room, as there are no rooms.
- Answered for the build (OQ-129): the HPI CPN is filled in by admin staff; a surgeon can be saved and
  booked without one ("No HPI CPN yet"). Open (OQ-143): the default is that it never becomes required.

### 16. Refreshing from the NHI register (catch-up Phase 40a)

- The refresh is on demand, by the office, and marked **Provisional** (to confirm with AA). Should it
  run on a schedule? Hospitals get updates twice a day.
- Should an NHI entered while the Hub is down be marked unverified? Today it saves as typed, as long as
  it is valid.

## Recoveries: the save and the email

- If a draft gets stuck, **Discard** in the save bar (a demo **Reset** also discards it).
- The email is always on the Booking and the List drawer: nothing is lost by skipping it.
- Nothing is sent automatically: AA chose manual for the first release, so the office keeps a check
  while trust builds; automatic sending is a later phase (OQ-82, US-02.3.5).

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
weekly payment run. The payment itself is made in Xero (OQ-111). Authorisation as the trigger is provisional
(OQ-125).

### "How do late hospital changes work?"

Hospital rows land on the matching screen with their wording exactly as received. A later update is
matched to its Booking by date, surgeon, hospital and session and waits for the office to approve it;
the office can apply rows up to `AUTHORISED` (a row for an authorised List cannot be applied). Nothing
applies itself, and the hospital never sets the Contract. Applying hospital changes automatically comes
after the first release (US-02.5.1 to US-02.5.4).

### "What if the patient has no NHI?"

The RFP is internally inconsistent: one section treats NHI as the unique patient identifier, another
says "where available". The prototype makes the NHI mandatory: no Booking and no patient without one,
and a hidden internal ID stays the invariant.

A hospital row with no NHI waits at intake on Admin, Intake, Matching; no patient or Booking is made. So the
anaesthetist still sees the case, a stub stands on the List in its place: a dashed amber row, "Waiting
at intake: no NHI · The office is resolving this", with the time, name and wording as received. A stub
is never a Booking: it is never counted ("n of n complete · 1 waiting at intake"), and it never blocks
submit or authorise. When the office adds the NHI on Matching, the Booking takes the stub's place;
rejecting the row removes the stub. On Reset, Matching already holds Mere Tipene's row (Southern Cross,
Dr Souter's Tue 4 Aug PM List): type the NHI **ZQA1024** and press **Add NHI**. The Southern Cross
import's Tama Henare takes **ZQA1008**. How a stub reads, and that the Booking takes its place, are our
readings, to confirm with AA.

### "Who do updates go to?"

The List's sender when the List came from a rooms' PDF (the address it arrived from, shown as "Replies
go to" on the List and its Bookings); otherwise the surgeon's first office contact with an email, the
others offered. A cover change goes to the hospital. The office drafts the email when it matters, from
the Booking, the List drawer or the pool notification, picks the changes and a template, and sends it
from its own mail client: nothing is sent automatically in the first release (OQ-82). A re-sent PDF from a newer address, once applied, makes that address the sender, the
earlier one kept in History.

### "Is the demo using real patient or integration data?"

No. Point at the **Synthetic data only** badge: it is in the top bar, the Admin side nav, the web top
nav and the mobile More card ("All patients, NHIs, Lists and figures are synthetic."). All names and
data are fictional. The hospital files and the rooms' PDF lists are sample files,
their procedure wording illustrative (AI-made, not AA's); NHI, email, Xero and payment events are
simulated in-browser. Nothing syncs with a hospital: the office imports each file.

### "Can it handle 85 anaesthetists and 28,000 invoices a year?"

Show it: **Admin → Day view → Demo actions → Load full-scale data → Confirm** builds the whole practice
in the browser from the same seed in about 2 seconds: 85 anaesthetists, 21,080 sessions over the
scheduling horizon (four months by default) and 28,268 invoices in the last 12 months. The Day view,
Invoices, Audit, the Billing monitor and the Ledger page through it, and the banner's **Timings** shows
each screen's render time at demo size and at full size (most about a tenth of a second or less; the
Billing monitor, the heaviest, about a quarter of a second). The honest caveat: these are timings in
one browser on one laptop, with no server; formal performance testing is a Testing-milestone task.
**Reset** (or a reload) returns to the demo data. The script's "Full scale" aside after S2 is the click
path.

### "How will people who are not comfortable with new systems cope?"

Large controls and one clear action on each screen. Each procedure is shown the same way in every app:
the descriptions as received, then its Contract and RVG code. The anaesthetist's screens hold only what
they need, with Contract set-up left to the office, and stay close to the mobile app they use today.
Help sits beside each heading on the daily screens (tap the info sign), a welcome card greets each app
on first visit, and training runs per user group before go-live.

### "How do anaesthetists sign in?"

With an account login on the PWA, shown simulated: the account is filled in and a **Provisional**
caption says how anaesthetists sign in is deferred to the end of discovery (OQ-83). The identity
provider, MFA, single sign-on and biometrics are still to be decided. The audit logs every sign-in, refusal and sign-out:
"Signed in", "Sign-in failed" and "Signed out" rows on Admin Audit (Entity type **account**).

## One-line close

> The prototype demonstrates a single audited flow from a changing theatre schedule to captured
> clinical billing inputs, controlled office authorisation, reliable invoicing and transparent
> collection and disbursement.
