# Demo Script — S1 to S5

The canonical presenter run-sheet. Each scenario has a **stage it** step, then beats with **Click**
(presenter choreography only), **Say** (the story to tell between actions), and **Expected** (what you
should see). The Click lists deliberately contain only navigation, selections, button presses, and
useful pauses. Every scenario resets first, so you can start cold and recover from a mistake.

The whole flow is clickable. Nothing below is narrate-only.

## The one continuous object

Where a scenario needs a worked example, use one recognisable business object:

> Dr Melanie Souter's operating Lists, at Southern Cross, St George's and Forte Health.

The seed keeps her design-day tableau (Tue 21 Jul), the split-billing and two-funder Lists (Mon 20
Jul), a submitted review-queue List, forward Lists for the integration bookings (Tue 28 Jul), and the
unfinished Margaret Ellison Booking designed for live capture.

## Pre-demo setup

1. Open the prototype at a desktop resolution wide enough for the web and admin layouts.
2. From the app switcher, open **Demo: Control Panel**.
3. Under **Clock & reset**, select **Reset demo data**, then **Confirm reset**.
4. Confirm the demo clock reads Tuesday 21 July 2026, 8:00.
5. Keep this document (or the master HTML) open in a second tab. Do not present from the Data Inspector.

The control panel is the **index**, grouped: **Clock & reset**, **Scenario jumps (S1 to S5)** and
**Demo actions by screen**. Each scenario jump confirms first, resets the data, applies any extra
preparation needed, and prints where to go next with one-click navigation. S1 to S4 can instead begin
from the ordinary Reset control. Use the live clock immediately to the right of the app switcher to
advance time without leaving the screen you are presenting.

**Demo actions live on their screen.** A simulated event (a hospital message, a payment webhook, a
billing failure, a job run) is fired from the screen it belongs to: open **Demo actions** in the top
bar, beside the app switcher, and select **Run** on the entry. The pill only appears on screens that
have demo actions, and the menu stays open after a run so you can read the result. On a handset (the
installed PWA) the same actions are in a small amber **Demo** chip that opens a sheet. The control
panel's **Demo actions by screen** lists every one with an **Open screen** link.

## Direct URLs

Every screen inside the three apps has its own address, so you can jump straight to a beat instead of
clicking in, and a refresh or the browser back button keeps your place. The three app roots still
work as entry points: `/mobile`, `/web` and `/admin` open the Lists tab, the dashboard and today's day
view respectively.

| Anaesthetist Mobile App | URL |
|---|---|
| Forward Lists | `/mobile/lists` |
| List detail | `/mobile/lists/<listId>` |
| Booking detail | `/mobile/lists/<listId>/bookings/<bookingId>` |
| Availability | `/mobile/availability` |
| Balances | `/mobile/balances` |
| More | `/mobile/more` |

| Anaesthetist Web App | URL |
|---|---|
| Dashboard | `/web` (another week: `/web?week=2026-07-27`) |
| Lists table | `/web/lists` |
| List detail | `/web/lists/<listId>` |
| Booking detail | `/web/lists/<listId>/bookings/<bookingId>` |
| Availability grid | `/web/availability` |
| Accounts, outstanding | `/web/accounts/overdue` |
| Accounts, GST activity | `/web/accounts/gst` |

| Admin Web App | URL |
|---|---|
| Day view | `/admin/day/2026-07-21` (A to Z order: add `?sort=az`) |
| Booking detail | `/admin/day/2026-07-21/bookings/<bookingId>` |
| Review queue | `/admin/review` |
| One List under review | `/admin/review/<listId>` |
| Invoices | `/admin/invoices` |
| One invoice document | `/admin/invoices/<invoiceId>` |
| Billing monitor | `/admin/billing` |
| Integration monitor | `/admin/integrations` |
| Master data | `/admin/masters` |
| Audit | `/admin/audit` |

The demo surfaces are `/demo/control`, `/demo/xero`, `/demo/integrations` and `/demo/data`. The
Xero invoice-pair list is `/demo/xero/invoices`; one pair is
`/demo/xero/invoices/<accRecId>`.

Two things worth knowing. The seed is deterministic, so the ids in a URL you copied stay valid across
a **Reset demo data** — you can bookmark a beat and re-open it after every reset. And a URL that has
gone stale (an id the current data no longer holds) falls back to its parent screen rather than
showing a blank page.

Sheets and drawers are deliberately **not** in the URL: the capture sheets, the cover request and the
admin List drawer are overlays, so the back button closes a screen rather than a sheet.

## How to read the readiness

Everything in S1 to S5 is built (Phases 00 to 12). The only remaining phase, Phase 13, is a subtle
mobile background and changes nothing here.

---

## S1 · Booking to theatre

**Serves:** the RFP's near-real-time hospital integration, the Booking as the billing anchor, and BTM
capture. **Time:** 5 to 6 minutes.

> **Caveat: HL7 v2 and FHIR are Future scope; present Beat 1 as an illustration of intake.** The
> in-scope path, a hospital download matched by the office, arrives in a later build. The Integrations
> simulator and the Admin Integrations Messages and Feed config tabs are badged **Future scope**.

**Stage it:** use **Reset → Confirm reset**, then open the Anaesthetist Mobile App. The Tue 28 Jul
St George's AM List holds three booked, not-yet-captured cases, so the hospital booking arrives into a
working List rather than an empty one.

### Beat 1: the booking arrives from the hospital

- **Click:**
  - In Mobile Lists, open the Tue 28 Jul St George's AM session and read its three booked cases
    (07:45 knee arthroscopy, 09:45 shoulder arthroscopy, 11:15 wrist ORIF).
  - Back on Mobile Lists, open **Demo actions** in the top bar → **Fire hospital message** → choose
    **S12 · New booking · MSG-STG-1001** → **Run**. (Alternative: **Demo: Integrations → S12 · New
    booking → Replay**, which shows the raw HL7 and FHIR panes.)
  - Pause on the result line.
  - Reopen the Tue 28 Jul AM List.
- **Say:** "Existing hospitals may still send HL7 v2, but the target is FHIR-native. Messages are
  mapped per hospital, processed near real time, and audited. This booking created a patient Booking
  without anyone re-keying it."
- **Expected:** the message shows as processed; the List now carries a fourth Booking for Sarah Mitchell,
  slotted into her 08:30 place between the first two cases. Her NHI matched an existing record, so
  intake reused it, no duplicate.

### Beat 2: the Booking fills over the days before theatre

- **Click:**
  - Open the live clock beside the app switcher.
  - Select **Procedure day · 28 Jul → +1 hour** so live capture starts at 09:00.
- **Say:** "Between booking and theatre, patient and booking data can change right up to the day. The
  canvas rolls forward deterministically as the clock advances."
- **Expected:** the clock reads Tuesday 28 July 2026, 9:00.
- **Optional aside:** open the List (Mobile or Web) and point at **List attachments**: the seeded
  theatre-list PDF from St George's sits on the List as a whole. **Add attachment** opens the simulated
  file picker (badged), and a photo or file can go on a single Booking the same way.

### Beat 3: capture BTM on mobile

- **Click:**
  - Go to **Anaesthetist Mobile App → Tue 28 Jul St George's List → Sarah Mitchell**.
  - Choose procedure **20950 — Appendicectomy, laparoscopic → Start now**.
  - Without leaving Sarah, select **live clock → +1 hour**, close the popup, then select
    **Finish now**.
  - Select **Mark complete**.
  - Optional, to show the completion gate: back on the List, select
    **Mark list completed · 3 to finish**.
- **Say:** "The anaesthetist captures the billing inputs, not just a dollar figure. The fee is Base plus
  tiered Time plus Modifiers at her own value per unit. The List only goes to the office once every
  active Booking is complete, so one captured Booking out of four submits nothing yet. That gate is the
  reason the List is the unit of approval, not the Booking."
- **Expected:** Sarah changes the List from **0 of 4 complete** to **1 of 4 complete**. The List action then reads **Mark list completed · 3 to finish**; tapping it opens the
  **Bookings still to finish** sheet, which names each remaining Booking by time and patient with what it
  needs. The List stays `ACTIVE`. S2 Beat 4 carries the submitted-to-authorised half of the handoff from
  the seeded Review queue.
- **Worth pointing at:** only **Mark complete** is pinned to the bottom of the phone; the anaesthetist
  captures inputs and sees no running fee, which the office sees on the Admin Booking in S2. Scroll down
  once and the masthead folds to a nav row to make room. If Mark complete finds missing data, the Booking
  moves directly to the first incomplete control and focuses it.

**Discovery point:** partial-interval time rounding is a prototype assumption (round up per started
interval); the RFP defines the tiers but not the rounding.

---

## S2 · Office day

**Serves:** the office as the operational control tower, exception handling, and the no-Returned-state
authorisation model. **Time:** 6 to 8 minutes.

**Stage it:** use **Reset → Confirm reset**, then go directly to the Admin app. The day's data is
already seeded.

### Beat 1: read the day

- **Click:**
  - Go to **Admin Web App → Day view → Tuesday 21 July**.
  - Pause on the day grid.
- **Say:** "The schedule is a rolling four-month canvas. Every active anaesthetist has exactly two
  half-day Lists a day. The office manages the whole day and handles the exceptions rather than
  inventing every session."
- **Expected:** a legible status-coloured grid; every block carries its label, never colour alone.

### Beat 2: a phone-advice booking

- **Click:**
  - Open **Dr Priya Sharma's Tue 21 PM Free List → Book (phone advice)**.
  - Choose **St George's Hospital** and **Mr T. Hale**; keep 13:00 to 17:00.
  - Select **Continue to add booking → Look up**.
  - Pause on the populated booking.
  - Select **Review → Save booking → Done**.
- **Say:** "Phone and PDF remain first-class booking channels. The design improves those fallbacks
  rather than pretending they disappear."
- **Expected:** the lookup fills the complete booking and leaves every field editable. The Free block
  repaints as booked on the admin day grid and the new Booking sits on that List (open the block's drawer
  to see it). The anaesthetist's own web and mobile views still label the session Free for now; if
  asked, name that honestly as an open polish item on the phone-booking path.

### Beat 3: illness cover, reassign a whole List

- **Click:**
  - Go to Wednesday 22 July and open **Dr James Rutherford's AM Christchurch Eye Surgery List**.
  - Select **Reassign list → Dr Priya Sharma → Unavailable → Confirm reassignment**.
  - Pause on the confirmation, then reopen **Sharma AM → History**.
- **Say:** "A whole-List reassignment preserves the Bookings and audit trail. It is different from moving
  one patient Booking. The free-target, absorb and regenerate mechanics are the prototype's proposal for
  keeping the fixed canvas intact."
- **Expected:** a brief **List reassigned** success moment confirms the move before the modal closes.
  The List and its Bookings move to Sharma, the vacated slot regenerates, and History records the reassignment.

### Beat 4: authorise a submitted List

- **Click:**
  - Go to **Review queue → Dr Kate Morrison, Mon 20 Jul → Review**.
  - Pause on the submitted List, then select **Authorise for billing → Confirm**.
- **Say:** "The office reviews the Bookings as a set, a human sanity check, not an automatic gate. If
  something needs clarification the office phones and corrects it here. The List is never returned.
  Authorisation locks every Booking and hands the whole List to the Billing Engine."
- **Expected:** the authorisation banner appears, rows lock, and the Review queue count falls.

**Discovery points:** whether availability/holiday conflicts are hard constraints or warnings (the
prototype uses advisory flags); the exact List-reassignment mechanics; and whether monitoring belongs
in Admin Web or a separate surface (the prototype places it in Admin Web).

---

## S3 · Money end-to-end

**Serves:** the Billing Engine at the centre, split billing, the Xero pair, the two separate money
states, and AA's own monthly fee. **Time:** 8 to 10 minutes. This is the money story's payoff, so authorise live.

**Stage it:** use **Reset → Confirm reset**, then go directly to Admin. Both of Dr Souter's Mon 20 Jul
Lists are already in the Review queue: AM (Forte Health, the split-billing Booking) and PM
(St George's, the two-funder Booking). Their invoices do not exist until you authorise the Lists live.

### Beat 1: authorise and generate invoices

- **Click:**
  - Go to **Admin → Review queue**.
  - Process the two Melanie Lists: authorise Forte AM, then use **Next in queue** to authorise
    St George's PM.
  - Select **View invoices → AA-2026-0002 · Brian Holt → View**.
  - Pause on the invoice, then select **Email invoice → All invoices**.
  - Locate the fixed comparison rows and pause:
    - **AA-2026-0002 · Brian Holt · Forte Health · $396.18** is the one-invoice,
      same-funder split Booking.
    - **AA-2026-0005 · Alan Prentice · nib · $152.38** and
      **AA-2026-0006 · Alan Prentice · St George's · $91.43** are the two invoices from the same
      Booking at 14:00.
- **Say:** "The Billing Engine, not Xero, produces the invoice. It resolves the explicit payer per
  Procedure, applies the governing Contract, and groups by counterparty. Xero follows as the
  receivables and banking service."
- **Expected:** invoice rows appear for both Lists, derived from the same captured data; one invoice
  for the split-billing Booking, two for the two-funder Booking.
- **Optional aside:** to also show the patient invoice layout, reallocate part of the two-funder Booking's
  fee to the patient via **Funder allocation** before authorising the PM List.

### Beat 2: the Xero collection and payable pair

- **Click:**
  - Go to **Demo: Billing Monitor & Xero → Invoices**.
  - Open **AA-2026-0005** (payer nib).
  - Pause on the two money-flow cards, then the ACCREC and ACCPAY pair beneath them.
- **Say:** "Read the flow from left to right. The ACCREC tracks money coming from nib into AA. The
  ACCPAY tracks the full amount going from AA to Dr Souter: AA passes on everything it receives, and
  invoices its own fee separately. Both records carry the invoice number and the case reference. No
  NHI or other personal information ever crosses into Xero."
- **Expected:** a matched ACCREC plus draft ACCPAY pair per invoice, each showing its InvoiceNumber
  and Reference (the ACCPAY's number ends `-P`). The patient, Alan Prentice, is named only in the
  "Linked Billing Engine case" panel, which reads the billing system; read his name from there. On
  this pair, nib owes $152.38 and the payable to Dr Souter is $152.38.

### Beat 3: payment, balances and disbursement

- **Click:**
  - On the open **AA-2026-0005** pair, select **Simulate payment and payout**.
  - Pause on the updated ACCREC and ACCPAY states.
  - Select **View in Dr Souter's account**.
  - Pause on the highlighted **AA-2026-0005** row under **Accounts → Payments**.
- **Say:** "One demo action is standing in for two real money events: nib pays $152.38 into AA, then
  AA pays the same $152.38 to Dr Souter. In a real operation those outgoing payments are grouped into
  a payables run. We keep the paid-in and
  paid-out states separate underneath, even though this guided path advances both together. The
  anaesthetist app reads the Billing Engine's mirror; it never queries Xero directly."
- **Expected:** ACCREC shows paid, ACCPAY shows disbursed, and the Web Payments row remains visible
  with $152.38 received by AA, $152.38 released to you, $152.38 paid to you and **Paid to you**. It does not
  remain under Overdue because it is no longer outstanding.

### Beat 4: AA's monthly fee

- **Click:**
  - Go to **Admin → Billing monitor → Open AA fee invoices → Fee settings**. Pause on the two fixed
    items ($350.00 and $150.00, labelled **Sample schedule**), the **$5.00** charge per BCTI and the worked
    example: "$500.00 + $5.00 x 40 = $700.00, plus GST at the foot of the invoice".
  - Select **Fee invoices**. July 2026 is in the month picker; Dr Souter's May invoice
    (**AA-FEE-2026-H01**) is Paid and June's (**AA-FEE-2026-H02**) Unpaid.
  - Open **Demo actions → Seed a month of BCTIs → Run**: Dr Rutherford's row shows 40 BCTIs paid and
    **$700.00**.
  - Select **Run monthly fee invoices**. Every active anaesthetist gets a July fee invoice. Expand Dr
    Rutherford's: **$700.00 + GST $105.00 = $805.00**, with his 40 counted BCTIs. Dr Souter's July invoice
    counts four BCTIs, including **AA-2026-0005**, because Beat 3 paid it: **$520.00 + GST $78.00 =
    $598.00**.
  - Go to **Demo: Billing Monitor & Xero → Invoices → AA-FEE-2026-H02** (the AA fee chip). Pause on the
    money flow to **Anaesthesia Associates (AA's own account)** and the **No payable** note, then
    select **Record fee payment** and **View in Dr Souter's account**.
- **Say:** "AA's fee is AA invoicing the anaesthetist once a month, from settings the office maintains:
  fixed charges plus a charge per buyer-created tax invoice. It is always a separate invoice, paid into
  AA's own account, and never deducted from a payment to the anaesthetist, because trust law forbids
  it. Only invoices that have been paid are counted, so a Booking moved between anaesthetists is never
  charged twice. The real fixed schedule, and confirmation of the paid-only count and of one BCTI per
  invoice, are with AA's accountant."
- **Expected:** Web **Accounts → AA fees** highlights **AA-FEE-2026-H02** as Paid, with May Paid and July
  Unpaid. Payables, GST activity and Overdue do not change when a fee invoice is raised or paid. Read
  Dr Souter's July figures from the app if Beat 3 was skipped (then three BCTIs, $515.00 before GST).

**Discovery points:** the exact List-disappearance trigger (the prototype uses billing-run completion);
the split-billing invoice count (the prototype groups by counterparty, two invoices when funders
differ); and AA's fee schedule, the paid-only BCTI count and one BCTI per invoice or per procedure
(all with AA's accountant).

---

## S4 · Exceptions

**Serves:** resilience, the RFP's hard cases, and the audit trail that keeps them honest.
**Time:** 8 to 10 minutes. Use this for a technical audience; every sub-trigger is under **Demo
actions** on the screen named in its beat.

**Stage it:** use **Reset → Confirm reset**. Work top to bottom through the beats below.

### Beat 1: prepayment warning

- **Click:**
  - Go to **Anaesthetist Mobile App → Dr Souter's Fri 24 Jul AM List**. Point at the small warning
    triangle on **Annette Riley**'s row (it is a marker; tapping it does nothing of its own).
  - Open her Booking: the warning is at the top, **Prepayment required**, Before procedure, Strong,
    on screen with no scroll and no tap.
  - Select **Mark complete**: it completes. Then **Mark list completed → Submit to office**: the
    usual submit sheet, with no warning step; it goes straight through.
  - Go to **Admin Day view → Fri 24 Jul**: the Souter AM block has the red outline and the triangle.
    Open it: Annette Riley's row in the drawer carries the same outline.
  - In the right rail, the **To-do** card under the calendar lists her warning. Select **Clear**: it
    leaves the list, the outline drops, and her Booking shows who cleared it and when.
- **Say:** "A warning, never a block, and no pop-up in the way. The anaesthetist sees it when they
  open the Booking, the night before, while the surgeon can still be told; the office sees it on its
  to-do list as a second check. AA decided not to block (OQ-57)."
- **Expected:** completion and submit go through with no extra step; the warning shows in both apps
  and leaves the to-do list when cleared. There is no override any more.
- **Optional:** on **Admin Day view → Tue 21 Jul**, **Demo actions → Raise sample warnings** fills
  the To-do card with sample warnings on Dr Rutherford's Lists; **Clear sample warnings** removes them.

### Beat 2: post-op addendum

- **Click:**
  - Go to **Admin Day view → Tue 14 Jul → Dr Priya Sharma's AM List → Sarah Mitchell**.
  - Open **Demo actions → Stage post-op scenario → Run** (it shows only for this List).
  - Select **Add post-op event**.
  - Pause on the new addendum Booking.
- **Say:** "A later pain consult or ward review can create another charge. The original authorised Booking
  stays immutable; the addendum is a new linked Booking with its own submit, authorise and bill cycle."
- **Expected:** a new addendum Booking; the original stays locked.

### Beat 3: billing failure and retry

- **Click:**
  - Go to **Admin billing monitor → Demo actions → Trigger billing failure → Run**.
  - On the same screen, **Losa Tuilagi → Resolve & retry**.
- **Say:** "A Booking can fail rating after the List is authorised, here because a group-held contract with
  no default fallback was dated out. The prototype isolates that Booking, still invoices its clean sibling,
  then lets the office correct and retry."
- **Expected:** the failed Booking shows the rating failure while its sibling is billed; retry clears it.

### Beat 4: integration dead-letter and manual fix

- **Click:**
  - Go to **Admin Integrations → Demo actions → Fire hospital message → MSG-CPH-2001 → Run**.
  - Go to **Feed config → Christchurch Public**. Say that the tab is badged **Future scope**: HL7
    feeds and their mappings are not in today's scope.
  - Change **patientNhi** from **PID-2** to **PID-3**, then select **Save**.
  - Go to **Message log → MSG-CPH-2001 → Reprocess**.
- **Say:** "Christchurch Public sends the NHI in PID-3, but the feed was onboarded reading PID-2. The
  bad NHI fails validation and the message dead-letters after its retries. Fixing the mapping and
  reprocessing recovers it, without creating a duplicate."
- **Expected:** the message dead-letters, then reprocesses cleanly after the mapping fix.

### Beat 5: partial payment

- **Click:**
  - Go to **Admin Invoices → Hemi Walker · St George's** (the clean-sibling invoice from Beat 3).
  - Open **Demo actions → Payment received · half → Run**.
  - Go to **Billing monitor** and select its own **Run payables** button.
  - Back on the invoice, **Demo actions → Payment received · full → Run**, then **Run payables** again.
- **Say:** "A partial payment authorises a payable for exactly the amount received, to the cent; the
  rest stays outstanding on the invoice. Two payables runs across a part-then-balance payment prove
  there is no double payment."
- **Expected:** the payable authorises exactly the amount received; each run pays exactly what arrived,
  and the total paid out equals the invoice total, never more.

**Discovery points:** billing-failure isolation (a prototype choice; the RFP leaves it open); which
conditions warn, and how strongly; where the to-do list sits on the dashboard; and how inbound messages targeting a submitted or authorised List
are parked for manual intervention.

---

## S5 · Compliance tour

**Serves:** audit, identity, data minimisation and contract effective-dating, the governance the
evaluators will probe. **Time:** 5 to 6 minutes.

**Stage it:** control panel, Scenario jumps, **S5 · Compliance tour → Jump → Confirm jump**. This
resets to rich booking-to-clinical histories on every Booking, adds three live edits to David Chen's
trail, and authorises Dr Whitaker's Fri 17 Jul List to raise the Health NZ contract snapshot
invoices. Use **Go to Admin app** and **Go to Xero sim**.

### Beat 1: the audit trail of a much-edited Booking

- **Click:**
  - Go to **Admin Day view → Tue 21 Jul → Dr Souter PM**.
  - Open **David Chen → History**.
  - Pause on the audit trail.
- **Say:** "Every Booking and Procedure change, including automated ones, writes an append-only audit entry
  with who, role, source and before/after. The captured inputs stay reproducible, not just the final
  total."
- **Expected:** a multi-entry trail from booking and Procedure setup through capture and completion,
  followed by the staged anaesthetist and office edits. Every row shows who, role, source and
  before/after, and the manual time-unit adjustment retains overridden provenance. Any other Booking
  can also be opened to demonstrate its seeded history without staging first.

### Beat 2: NHI dual-format validator

- **Click:**
  - Go to **Admin Integrations → Demo actions → Fire hospital message → MSG-STG-1002 (new-format
    NHI) → Run**.
  - Optional: add a Booking manually and try both NHI formats.
- **Say:** "The prototype validates both NHI formats using the official check-digit algorithms. A
  new-format NHI with a mod-23 check letter validates and processes end to end."
- **Expected:** the new-format NHI validates; an invalid one is rejected with a reason.

### Beat 3: no personal information in Xero

- **Click:**
  - Open **Demo: Billing Monitor & Xero**.
  - Pause on the **No personal information in Xero** callout, then the **Contacts** tab: patient and
    guardian contacts are named only by their hidden ID ("Patient PT0017", "Billable party BP0001").
- **Say:** "No personal information goes into Xero: no NHI and no patient name, only a hidden
  internal ID that links each transaction back to the billing system. AA confirmed this rule."
- **Expected:** the callout states the confirmed rule (no RFP-contradiction callout), and no patient
  or guardian name shows on any Xero contact or record; hospitals, insurers and the anaesthetist
  payees keep their names.

### Beat 4: contract effective-dating

- **Click:**
  - Go to **Admin → Master data → Contracts → Health NZ agreed rate (Type 2)**.
  - Set **Effective to** to **16 Jul 2026**, then save.
  - Open the **Hemi Walker** Health NZ invoice from Dr Whitaker's Fri 17 Jul List.
  - Pause on the unchanged invoice.
- **Say:** "Contracts are effective-dated. Changing a contract does not rewrite invoices already raised
  under the old terms; the invoice reproduces against what was true when it billed."
- **Expected:** the contract change is recorded; the earlier invoice is unchanged.

**Discovery points:** the demo-plausible modifier values (not an
authoritative NZSA schedule); and the concurrency model (single-user by design, audited
last-write-wins, with the multi-source reality shown via the audit trail and live integration updates).

---

## Recommended run orders

| Audience | Order | Time |
|---|---|---:|
| General evaluation | S1, S2, S3 | 15 to 18 min |
| Finance-led | S3, S4 (money beats), S5 | 15 min |
| Integration-led | S1, S4 (integration beat), S2 | 15 min |
| Full deep-dive | S1 through S5 | 30 to 35 min |

## What to narrate rather than click

- The full four-month scale and the production population of about 85 anaesthetists.
- The roughly 28,000 annual invoices and Xero active-contact volume (the archive job reduces a seeded
  aggregate counter to make the point).
- Health NZ's FHIR-first policy and real OAuth/Keycloak setup.
- Real email, OCR, Xero and hospital integrations: the prototype simulates them in-browser.

The most persuasive clicks are the state changes: a message or manual booking creates a Booking; Finish
now changes Time units and fee; Booking completion enables submission; submission changes who may edit;
authorisation locks the List; the billing run generates invoices; the invoice-detail shortcut records
payment and payout; the Web Payments history keeps the settled invoice visible.

## Recovery from demo accidents

- S1 to S4 start from the common reset seed, so the fastest recovery is **Reset → Confirm reset**.
  S5 still has scenario-specific preparation, so recover it through its **Jump → Confirm jump**.
- Or use **Reset → Confirm reset** in the shared top bar from any app. The same control remains under
  **Clock & reset** in the control panel. Reset returns the clock to Tuesday 21 July 2026, 8:00 and
  restarts deterministic identifiers, so invoice numbers begin at the same point every time.
- The Integration simulator also has **Reset demo data → Confirm reset** beside Start live feed. It
  performs the same whole-demo reset without making you return to the control panel.
- Lost the screen a demo action lives on? The control panel's **Demo actions by screen** has an
  **Open screen** link for every entry (with a hint where a tab is needed, such as Surgeon PDFs).
- If **Finish now** was stamped too early, reset and advance the clock before reopening the Booking.
- A stray refresh is no longer a problem: it returns you to the same screen. If you have clicked
  somewhere unexpected, the browser back button retraces your steps, or paste the beat's address from
  **Direct URLs** above.
- Reset leaves the integration auto-retry timers scheduled, but a guard makes any stale timer a safe
  no-op; it will not disturb the fresh state.
- Keep this document or the master HTML in a second tab, not the Data Inspector.
