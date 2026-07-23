# Demo Storyboard

## Recommended narrative

Use one continuous business object:

> Dr Melanie Souter's Tuesday 21 July PM List at Southern Cross with Ms Patel.

The seeded List contains four useful Cards:

- a Hospital/contract-holder route;
- a direct Insurer route;
- a Billable Party route with a manually adjusted time value; and
- Margaret Ellison, the unfinished Card designed for live BTM capture.

This one List can demonstrate mobile work, submission, office review, authorisation, several billing
routes and the point at which the List disappears from Dr Souter's view.

## Readiness labels

- **READY:** formally recorded complete and suitable for the main demo.
- **IN FLIGHT:** code exists but the phase is not yet recorded complete; verify before using.
- **PLANNED:** target-state story only until its phase is complete.

## Pre-demo setup

1. Open the prototype at a desktop resolution wide enough for the web/admin layouts.
2. Open **Demo: Control Panel** from the app switcher.
3. Select **Reset demo data** and confirm.
4. Confirm the demo clock reads Tuesday 21 July 2026, 08:00.
5. If using live `Finish now`, advance the demo clock to 17:15:
   - select **+1 hour** nine times;
   - select **+15 min** once.
6. Return to the app switcher.
7. Phase 08 billing and invoices are recorded complete; include them in the main path.
8. Do not open Balances, Billing Monitor, Xero or Integrations in the main demo until their phases
   are complete.

## Core demo: assured path through authorisation

Target length: 10 to 12 minutes

### Beat 1: establish the office control tower

- **Readiness:** READY
- **Actor:** Kirsty W.
- **Surface:** Admin Web App, Day view
- **Time:** 2 minutes

#### Click

1. Switch to **Admin Web App**.
2. Stay on **Day view** for Tuesday 21 July.
3. Point to Dr Souter's AM and PM blocks.
4. Point to the status legend and Rutherford at Forte, the seeded full-day two-block booking.
5. Optionally open Dr Souter's PM List and then close the drawer.

#### Say

> The schedule is a rolling four-month canvas. Every active anaesthetist has exactly two half-day
> Lists every day, AM and PM. The List already exists; recurring arrangements, availability,
> hospital, surgeon and patient Cards are applied to it. The office manages the whole day and
> handles the exceptions.

#### Expected result

The audience understands the difference between the fixed List structure and the changing booking
data.

### Beat 2: show the anaesthetist's wider web context

- **Readiness:** READY
- **Actor:** Dr Melanie Souter
- **Surface:** Anaesthetist Web App
- **Time:** 1 minute

#### Click

1. Switch to **Anaesthetist Web App**.
2. Briefly show **Dashboard**.
3. Point to the week strip and current workload.
4. Open **Availability** and use the Free-only filter if useful.
5. Return to Dashboard or move directly to mobile.

#### Say

> This is the same anaesthetist and the same underlying data as mobile. Web is the wider planning
> view: upcoming Lists, availability and financial summaries. Mobile is the procedure-day tool.

#### Expected result

The audience understands that mobile and web are not different personas.

#### Caveat

The current receivables, productivity and overdue figures are seeded. Live payment-driven figures
arrive with Phase 10.

### Beat 3: complete Margaret Ellison's Card on mobile

- **Readiness:** READY
- **Actor:** Dr Melanie Souter
- **Surface:** Anaesthetist Mobile App
- **Time:** 4 minutes

#### Click

1. Switch to **Anaesthetist Mobile App**.
2. In Lists, open the row containing **Southern Cross**.
3. Open **Margaret Ellison**.
4. Scroll to the BTM section.
5. Point to:
   - ASA;
   - RVG code;
   - start and finish;
   - Base, Time and Modifier units;
   - calculated fee.
6. Select **Finish now**.
7. Select **Mark complete**.
8. Wait for the completion overlay to return to the List.

#### Say

> The anaesthetist captures the billing inputs, not just a final dollar figure. The fee is Base plus
> tiered Time plus Modifiers, multiplied by Dr Souter's own value per unit. The software validates
> and calculates; it does not pretend to infer the correct clinical code.

#### Expected result

Ellison gains the completed tick and the List becomes eligible for submission.

#### Optional details if asked

- Time is 1 unit per 15 minutes for the first two hours, then 1 per 10 minutes.
- ASA seeds the Modifier value but remains overridable.
- Range codes require the anaesthetist to choose an in-range value.
- A positioning modifier is blocked if the base code already absorbs it.
- A copied/additional Procedure is time-only to prevent double charging.

### Beat 4: submit the whole List

- **Readiness:** READY
- **Actor:** Dr Melanie Souter
- **Surface:** Anaesthetist Mobile App
- **Time:** 1 minute

#### Click

1. Select **Mark list completed**.
2. Review the confirmation.
3. Select **Submit to office**.
4. Tap **Back** to return to Forward Lists.
5. Open the **Done** filter and show Southern Cross remains visible before billing.

#### Say

> Approval state belongs to the whole List. Once every active Card is complete, Dr Souter submits
> it. It is now read-only to her and editable only by the office. There is no send-back state.

#### Expected result

The List is `SUBMITTED`, appears under Done as completed/unbilled and is available in the office
Review queue.

### Beat 5: perform the office sanity-check

- **Readiness:** READY
- **Actor:** Kirsty W.
- **Surface:** Admin Web App, Review queue
- **Time:** 3 minutes

#### Click

1. Switch to **Admin Web App**.
2. Open **Review queue**.
3. Open the Souter/Southern Cross submitted List.
4. Point to:
   - total Cards, units and fee;
   - billing route;
   - Contract and reference;
   - the manual time-adjustment flag;
   - row lock/readiness status.
5. Optionally open **History** for a Card.
6. Optionally select **Log phone note**.
7. Select **Authorise for billing**.
8. Confirm the action.

#### Say

> The office reviews the Cards as a set. This is a human sanity check around Contract, Insurer,
> references and unusual values. If something needs clarification, office staff phone the
> anaesthetist and correct it here. The List is never returned. Authorisation locks every Card and
> hands the whole List to the Billing Engine.

#### Expected result

The authorisation banner appears, rows lock and the Review queue count falls.

## Extension: invoice generation

Target extra time: 3 minutes

- **Readiness:** READY Phase 08

### Beat 6: show the billing result

- **Actor:** Kirsty W. and Billing Engine
- **Surface:** Admin Web App, Invoices

#### Click

1. From the authorisation result, select **View invoices**.
2. Show the newly raised invoice rows.
3. Open a contract-holder invoice.
4. Point to:
   - unique InvoiceNumber;
   - internal CaseReference;
   - payer and line items;
   - units, GST and total;
   - "AA as agent for" wording.
5. Select **Email invoice** to show the simulated-send state.
6. Mention browser print without opening the operating-system dialog during the demo.
7. If staged, open a patient-layout invoice and a direct-Insurer upload-portal row.

#### Say

> The Billing Engine is the centre of the design. It resolves the explicit payer per Procedure,
> applies the governing Contract and groups charges by counterparty. The invoice is produced by
> the Billing Engine, not Xero. Xero follows as the receivables and banking service.

#### Expected result

The audience sees that billing is derived from the same captured data, with different layouts for a
contract holder and patient.

### Beat 7: prove the List disappears at billing-run completion

**Readiness:** READY Phase 08

#### Click

1. Switch to **Anaesthetist Mobile App**.
2. Open the **Done** filter.
3. Confirm the billed Southern Cross List is no longer present.

#### Say

> The prototype uses completion of the billing run as the event that removes the List from the
> anaesthetist's work view. The RFP asks for this exact trigger to be confirmed during discovery.

#### Expected result

The List is absent because it has `billedAt`, not merely because it was authorised.

## Target-state extension: collection and disbursement

Target extra time: 3 minutes

**Readiness:** PLANNED Phase 10

Narrate only until built.

### Beat 8: Xero pair

1. Open the simulated Xero surface.
2. Select one invoice.
3. Show its:
   - `ACCREC` collection invoice;
   - draft `ACCPAY` to the anaesthetist;
   - linked GUIDs;
   - similar human-readable numbers.

Say:

> AA receives all money into one account. The ACCREC records what the payer owes AA; the ACCPAY
> records what AA owes the anaesthetist.

### Beat 9: payment and payables

1. Fire a full or partial payment webhook.
2. Show paid-in state update.
3. Show the related payable become authorised, proportionally for a partial.
4. Run payables.
5. Show disbursed state separately.
6. Advance the demo clock one day.
7. Open Dr Souter's flat Balances list and GST activity.

Say:

> Paid into AA and disbursed to the anaesthetist are two separate states. The anaesthetist apps
> read the Billing Engine's mirror; they never query Xero directly.

## Target-state extension: booking integration

Target extra time: 2 minutes

**Readiness:** PLANNED Phase 11

Narrate or omit until built.

### Beat 10: late hospital booking

1. Open the Integration simulator.
2. Replay an HL7 S12 new booking or S14 modification.
3. Show raw HL7 transformed into a FHIR-style internal representation.
4. Switch to mobile and show the Card immediately on the `DRAFT` List.
5. Open its History and point to source=integration.

Say:

> Existing hospitals may still send HL7 v2, but the target architecture is FHIR-native. Messages
> are processed near real time, mapped per hospital and audited. PDF and phone booking remain
> supported fallbacks.

## Recommended 15-minute target-state run order

| Time | Story beat |
|---:|---|
| 0:00 to 2:00 | Admin Day View and fixed canvas |
| 2:00 to 3:00 | Anaesthetist web overview |
| 3:00 to 7:00 | Mobile Ellison BTM capture |
| 7:00 to 8:00 | Submit List |
| 8:00 to 11:00 | Office review and authorise |
| 11:00 to 13:00 | Invoices and List disappearance |
| 13:00 to 15:00 | Xero payment/disbursement recap |

Show integration as a prelude only if the audience has explicitly prioritised it, or extend the
session to 18 minutes.

## Optional scenario A: illness at 7 a.m.

Target length: 5 minutes

**Readiness:** READY, except the future live integration event

1. Navigate to Wednesday 22 July in Admin Day View and show a booked List with an availability
   conflict.
2. Open its List drawer.
3. Select **Reassign list**.
4. Find a Free target anaesthetist/session.
5. Confirm reassignment.
6. Re-open the target anaesthetist's block after the drawer closes, then show the target now owns
   the Cards.
7. Show that the vacated anaesthetist still has an AM/PM canvas slot.
8. Open History to show the reassignment.

Say:

> A whole-List reassignment preserves the Cards and audit trail. It is different from moving one
> patient Card. The exact absorb-and-regenerate mechanics are the prototype's proposal for
> preserving the fixed canvas.

## Optional scenario B: phone booking and missing Card

Target length: 4 minutes

**Readiness:** READY

1. In Admin Day View, find a genuinely Free Dr Souter List.
2. Select **Book (phone advice)**, choose the Hospital, select **Continue to add card**, choose
   **Enter manually**, complete the fields, select **Save card**, then select **Done**.
3. Switch to the anaesthetist app and show it appears.
4. Alternatively, use **Add Card** from mobile and select the simulated photo path.
5. Choose a sample Card, review the extracted fields, select **Save card**, then select **Done**.

Say:

> Modern integrations are the goal, but the RFP is explicit that phone and PDF remain essential.
> The design improves those fallbacks rather than pretending they disappear on day one.

## Optional scenario C: complex funding and resilience

Target length: 8 to 10 minutes

**Readiness:** Mixed; billing Phase 08 is ready, exception/payment parts are planned for Phases 09 and 10

Use this for technical Q&A, not the opening story.

1. Show one Card with an additional Procedure and prove its Base and Modifier fields are disabled.
2. Show one Procedure split across two funders and the conserved line allocation.
3. Generate separate invoices where funders differ.
4. Show a pre-payment deposit and planned completion block.
5. Trigger a billing failure from an expired surgeon/group-held Contract.
6. Correct and retry only the failed Card.
7. Fire a partial payment, run payables, then receive the balance and pay only the increment.
8. Finish with audit history and the no-NHI-in-Xero callout.

## What to narrate rather than click

- The full four-month scale and production population of about 85 anaesthetists.
- The approximately 28,000 annual invoices and Xero active-contact volume.
- Health NZ's FHIR-first policy and real OAuth/Keycloak setup.
- Detailed master-data tables, unless the evaluator asks.
- Every modifier code and Contract rule.
- Real email, OCR, Xero and hospital integrations: the prototype simulates them.

The most persuasive clicks are the state changes:

- message or manual booking creates/changes a Card;
- `Finish now` changes Time units and fee;
- Card completion enables List submission;
- submission changes who may edit;
- authorisation locks the List;
- the billing run generates invoices;
- payment changes the linked payable;
- payables run records disbursement.

## Recovery from demo accidents

- Use **Demo: Control Panel -> Reset demo data** to restore the pristine seed.
- The reset returns the clock to Tuesday 21 July 2026, 08:00 and restarts deterministic identifiers.
- If `Finish now` was stamped too early, reset and advance the clock before reopening Ellison.
- Until Phase 12 adds scenario jumps, use the tested paths above rather than manually staging data in
  the inspector during a customer-facing demo.
- Keep a second browser tab on this document, not on the Data Inspector.
