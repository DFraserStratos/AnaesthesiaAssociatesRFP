# Demo Script — S1 to S5

The canonical presenter run-sheet. Each scenario has a one-click **stage it** step on the demo control
panel, then beats with **Click** (where to go), **Say** (one line tying the moment to the RFP need it
demonstrates) and **Expected** (what you should see). Every scenario resets first, so you can start any
scenario cold and recover from any mistake by re-staging.

The whole flow is clickable. Nothing below is narrate-only.

## The one continuous object

Where a scenario needs a worked example, use one recognisable business object:

> Dr Melanie Souter's operating Lists, at Southern Cross, St George's and Forte Health.

The seed keeps her design-day tableau (Tue 21 Jul), a split-billing List (Mon 20 Jul), a submitted
review-queue List, forward Lists for the integration bookings (Tue 28 Jul), and the unfinished Margaret
Ellison Card designed for live capture.

## Pre-demo setup

1. Open the prototype at a desktop resolution wide enough for the web and admin layouts.
2. From the app switcher, open **Demo: Control Panel**.
3. Under **Clock & reset**, select **Reset demo data**, then **Confirm reset**.
4. Confirm the demo clock reads Tuesday 21 July 2026, 8:00.
5. Keep this document (or the master HTML) open in a second tab. Do not present from the Data Inspector.

The control panel is grouped: **Clock & reset**, **Scenario jumps (S1 to S5)**, **Booking & integration
events**, and **Billing, money & exceptions**. Each scenario jump confirms first, resets the data,
stages the scenario, and prints where to go next with one-click navigation.

## How to read the readiness

Everything in S1 to S5 is built (Phases 00 to 12). The only remaining phase, Phase 13, is a subtle
mobile background and changes nothing here.

---

## S1 · Booking to theatre

**Serves:** the RFP's near-real-time hospital integration, the Card as the billing anchor, and BTM
capture. **Time:** 5 to 6 minutes.

**Stage it:** control panel, Scenario jumps, **S1 · Booking to theatre → Jump → Confirm jump**. This
resets, then fires St George's S12 new-booking message. Use the panel's **Go to Integrations** and
**Go to Mobile app** buttons as prompts.

### Beat 1: the booking arrives from the hospital

- **Click:** Go to Integrations (the badged simulator). Show the fired St George's message: raw HL7 v2
  on the left, the mapped FHIR-style internal representation on the right.
- **Say:** "Existing hospitals may still send HL7 v2, but the target is FHIR-native. Messages are
  mapped per hospital, processed near real time, and audited. This booking created a patient Card
  without anyone re-keying it."
- **Expected:** the message shows as processed; a new Card for Sarah Mitchell now belongs to Dr
  Souter's Tue 28 Jul AM List. Her NHI matched an existing record, so intake reused it, no duplicate.

### Beat 2: the Card fills over the days before theatre

- **Click:** return to the control panel. Under Clock & reset, select **Procedure day · 28 Jul** to
  jump the clock forward to the operating day.
- **Say:** "Between booking and theatre, patient and booking data can change right up to the day. The
  canvas rolls forward deterministically as the clock advances."
- **Expected:** the clock reads Tuesday 28 July 2026, 8:00.

### Beat 3: capture BTM on mobile and submit

- **Click:** switch to the **Anaesthetist Mobile App**, open the Tue 28 Jul St George's List, open Sarah
  Mitchell's Card, scroll to the BTM section. Select the RVG code, set start and **Finish now**, then
  **Mark complete**. When every active Card is complete, **Mark list completed**, then **Submit to
  office**.
- **Say:** "The anaesthetist captures the billing inputs, not just a dollar figure. The fee is Base plus
  tiered Time plus Modifiers at her own value per unit. Once every active Card is complete she submits
  the whole List; it is now read-only to her and editable only by the office."
- **Expected:** the Card gains the completed tick, the fee updates live, and the List moves to
  `SUBMITTED` and into the office Review queue.

**Discovery point:** partial-interval time rounding is a prototype assumption (round up per started
interval); the RFP defines the tiers but not the rounding.

---

## S2 · Office day

**Serves:** the office as the operational control tower, exception handling, and the no-Returned-state
authorisation model. **Time:** 6 to 8 minutes.

**Stage it:** control panel, Scenario jumps, **S2 · Office day → Jump → Confirm jump** (reset only; the
day's data is already seeded). Use **Go to Admin app**.

### Beat 1: read the day

- **Click:** Admin Web App, Day view, Tuesday 21 July. Point to the AM/PM rhythm, the status legend, and
  the seeded full-day booking (two adjacent Lists for one anaesthetist).
- **Say:** "The schedule is a rolling four-month canvas. Every active anaesthetist has exactly two
  half-day Lists a day. The office manages the whole day and handles the exceptions rather than
  inventing every session."
- **Expected:** a legible status-coloured grid; every block carries its label, never colour alone.

### Beat 2: a phone-advice booking

- **Click:** find a genuinely Free List, select **Book (phone advice)**, choose the hospital, **Continue
  to add card**, **Enter manually**, complete the fields, **Save card**, **Done**.
- **Say:** "Phone and PDF remain first-class booking channels. The design improves those fallbacks
  rather than pretending they disappear."
- **Expected:** the new Card appears on that List, immediately visible in the anaesthetist's app while
  the List is `DRAFT`.

### Beat 3: illness cover, reassign a whole List

- **Click:** step to Wednesday 22 July, open a booked List that carries an availability conflict, open
  its drawer, select **Reassign list**, pick a Free target anaesthetist/session, confirm. Re-open the
  target's block to show it now owns the Cards; show the vacated anaesthetist still has an AM/PM slot;
  open History to show the reassignment.
- **Say:** "A whole-List reassignment preserves the Cards and audit trail. It is different from moving
  one patient Card. The free-target, absorb and regenerate mechanics are the prototype's proposal for
  keeping the fixed canvas intact."
- **Expected:** the List and its Cards move to the replacement; the vacated slot regenerates; the change
  is audited.

### Beat 4: authorise a submitted List

- **Click:** open the **Review queue**, open the Morrison (Mon 20) or Whitaker (Fri 17) submitted List,
  review Cards, units, fee, route, Contract, reference and any flags, then **Authorise for billing** and
  confirm.
- **Say:** "The office reviews the Cards as a set, a human sanity check, not an automatic gate. If
  something needs clarification the office phones and corrects it here. The List is never returned.
  Authorisation locks every Card and hands the whole List to the Billing Engine."
- **Expected:** the authorisation banner appears, rows lock, and the Review queue count falls.

**Discovery points:** whether availability/holiday conflicts are hard constraints or warnings (the
prototype uses advisory flags); the exact List-reassignment mechanics; and whether monitoring belongs
in Admin Web or a separate surface (the prototype places it in Admin Web).

---

## S3 · Money end-to-end

**Serves:** the Billing Engine at the centre, split billing, the Xero pair, and the two separate money
states. **Time:** 6 to 8 minutes. This is the money story's payoff, so authorise live.

**Stage it:** control panel, Scenario jumps, **S3 · Money end-to-end → Jump → Confirm jump**. This
resets and submits Dr Souter's Mon 20 Jul AM List (Forte Health, including the split-billing Card) into
the Review queue. Use **Go to Admin app**.

### Beat 1: authorise and generate invoices

- **Click:** Admin, Review queue, open the Souter/Forte submitted List, **Authorise for billing**, then
  **View invoices**. Open a contract-holder invoice: point to the unique InvoiceNumber, internal
  CaseReference, payer, line items, units, GST and total, and the "AA as agent for" wording. Show the
  split-billing Card producing separate invoices where funders differ. Use **Email invoice** to show the
  simulated-send state.
- **Say:** "The Billing Engine, not Xero, produces the invoice. It resolves the explicit payer per
  Procedure, applies the governing Contract, and groups by counterparty. Xero follows as the
  receivables and banking service."
- **Expected:** invoice rows appear, derived from the same captured data, with contract-holder and
  patient layouts.

### Beat 2: the Xero collection and payable pair

- **Click:** switch to **Demo: Billing Monitor & Xero**. Select one invoice and show its ACCREC
  collection invoice, its draft ACCPAY to the anaesthetist, and the linked identifiers.
- **Say:** "AA receives all money into one account. The ACCREC records what the payer owes AA; the
  ACCPAY records what AA owes the anaesthetist. No NHI ever crosses into Xero."
- **Expected:** a matched ACCREC plus draft ACCPAY pair per invoice.

### Beat 3: payment, balances and disbursement

- **Click:** control panel, Billing, money & exceptions, **Payment received (webhook)**: pick the
  invoice, **Full payment**, **Record payment**. Then **Replay last event** to show idempotency. Advance
  the clock **Next day** to show the reconciliation poll catch a missed webhook. Then **Run payables**
  (or run it from the Admin app). Finally switch to the **Anaesthetist Web App**, Accounts, to show the
  flat balances and GST activity update.
- **Say:** "Paid into AA and disbursed to the anaesthetist are two separate states. A partial payment
  authorises the payable proportionally. The anaesthetist apps read the Billing Engine's mirror; they
  never query Xero directly."
- **Expected:** the ACCREC shows paid, the ACCPAY becomes authorised, a duplicate webhook is ignored,
  payables records the disbursement, and the balances view reflects it.

**Discovery points:** the exact List-disappearance trigger (the prototype uses billing-run completion);
and the split-billing invoice count (the prototype groups by counterparty, two invoices when funders
differ).

---

## S4 · Exceptions

**Serves:** resilience, the RFP's hard cases, and the audited overrides that keep them honest.
**Time:** 8 to 10 minutes. Use this for a technical audience; every sub-trigger is on the panel.

**Stage it:** control panel, Scenario jumps, **S4 · Exceptions → Jump → Confirm jump** (reset). Work
top to bottom through the triggers named below.

### Beat 1: pre-payment gate

- **Click:** Anaesthetist Mobile App, open Dr Souter's Fri 24 Jul AM List, open the unpaid pre-payment
  Card. Try to mark it complete.
- **Say:** "A patient-funded pre-payment must be paid before the procedure. A browser prototype cannot
  gate a theatre list, so completion is blocked until the pre-invoice is paid or the office records a
  reasoned, audited override."
- **Expected:** completion is blocked with the pre-payment reason; the office override lifts it and is
  written to the audit trail.

### Beat 2: post-op addendum

- **Click:** control panel, the **Stage post-op scenario** card, **Stage scenario**. Then in the Admin
  Day view jump to Tue 14 Jul, open the locked Card, and use **Add post-op event**; it lands on the
  anaesthetist's free Tue 21 PM session and runs its own capture to invoice.
- **Say:** "A later pain consult or ward review can create another charge. The original authorised Card
  stays immutable; the addendum is a new linked Card with its own submit, authorise and bill cycle."
- **Expected:** a new addendum Card; the original stays locked.

### Beat 3: billing failure and retry

- **Click:** control panel, the **Trigger billing failure** card, **Trigger failure**. Then open the
  Admin billing monitor and use **Resolve & retry** on the failed Card.
- **Say:** "A Card can fail rating after the List is authorised, here because a group-held contract with
  no default fallback was dated out. The prototype isolates that Card, still invoices its clean sibling,
  then lets the office correct and retry."
- **Expected:** the failed Card shows the rating failure while its sibling is billed; retry clears it.

### Beat 4: integration dead-letter and manual fix

- **Click:** control panel, Booking & integration events, **Fire an integration message**, choose
  **MSG-CPH-2001** (Christchurch Public dead-letter). Then in the Admin Integrations monitor, fix the
  feed mapping to PID-3 and reprocess.
- **Say:** "Christchurch Public sends the NHI in PID-3, but the feed was onboarded reading PID-2. The
  bad NHI fails validation and the message dead-letters after its retries. Fixing the mapping and
  reprocessing recovers it, without creating a duplicate."
- **Expected:** the message dead-letters, then reprocesses cleanly after the mapping fix.

### Beat 5: partial payment

- **Click:** control panel, **Payment received (webhook)**, **Half (partial)**, **Record payment**. Then
  **Run payables**. Fire the balance later and run payables again.
- **Say:** "A partial payment authorises only its proportional payable share. Two payables runs across a
  part-then-balance payment prove there is no double payment."
- **Expected:** the payable authorises pro-rata; payables pays only the increment each run.

**Discovery points:** billing-failure isolation (a prototype choice; the RFP leaves it open); the
pre-payment gate and override placement; and how inbound messages targeting a submitted or authorised
List are parked for manual intervention.

---

## S5 · Compliance tour

**Serves:** audit, identity, data minimisation and contract effective-dating, the governance the
evaluators will probe. **Time:** 5 to 6 minutes.

**Stage it:** control panel, Scenario jumps, **S5 · Compliance tour → Jump → Confirm jump** (reset).
Use **Go to Admin app** and **Go to Xero sim**.

### Beat 1: the audit trail of a much-edited Card

- **Click:** open David Chen's Card and its **History**.
- **Say:** "Every Card and Procedure change, including automated ones, writes an append-only audit entry
  with who, role, source and before/after. The captured inputs stay reproducible, not just the final
  total."
- **Expected:** a full audit trail, including the manual time-unit adjustment provenance.

### Beat 2: NHI dual-format validator

- **Click:** control panel, **Fire an integration message**, choose **MSG-STG-1002** (new-format NHI),
  or add a Card manually and try both an old-format and new-format NHI.
- **Say:** "The prototype validates both NHI formats using the official check-digit algorithms. A
  new-format NHI with a mod-23 check letter validates and processes end to end."
- **Expected:** the new-format NHI validates; an invalid one is rejected with a reason.

### Beat 3: no NHI in Xero

- **Click:** open the **Demo: Billing Monitor & Xero** surface and show the contact and invoice data.
- **Say:** "The prototype takes the stricter data-minimisation reading: no NHI ever crosses to Xero.
  Contacts carry a hidden internal ID only. The RFP's Appendix 1 and Appendix 2 contradict each other
  here, so we flag it as a decision to confirm with AA."
- **Expected:** the Xero surface shows the internal ID and a visible callout of the RFP contradiction.

### Beat 4: contract effective-dating

- **Click:** in Admin master data, open a contract and effective-date it (set an end date or a new
  forward-dated price). Then open an already-raised invoice for that contract.
- **Say:** "Contracts are effective-dated. Changing a contract does not rewrite invoices already raised
  under the old terms; the invoice reproduces against what was true when it billed."
- **Expected:** the contract change is recorded; the earlier invoice is unchanged.

**Discovery points:** the NHI-in-Xero contradiction; the demo-plausible modifier values (not an
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

The most persuasive clicks are the state changes: a message or manual booking creates a Card; Finish
now changes Time units and fee; Card completion enables submission; submission changes who may edit;
authorisation locks the List; the billing run generates invoices; payment changes the payable; the
payables run records disbursement.

## Recovery from demo accidents

- Every scenario jump resets first, so the fastest recovery is to re-run the scenario you are on: control
  panel, Scenario jumps, the same **Jump → Confirm jump**.
- Or use **Clock & reset → Reset demo data → Confirm reset** to return to the pristine seed. Reset
  returns the clock to Tuesday 21 July 2026, 8:00 and restarts deterministic identifiers, so invoice
  numbers begin at the same point every time.
- If **Finish now** was stamped too early, reset and advance the clock before reopening the Card.
- Reset leaves the integration auto-retry timers scheduled, but a guard makes any stale timer a safe
  no-op; it will not disturb the fresh state.
- Keep this document or the master HTML in a second tab, not the Data Inspector.
