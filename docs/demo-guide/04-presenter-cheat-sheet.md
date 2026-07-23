# Presenter Cheat Sheet

## The 30-second explanation

> Anaesthesia Associates coordinates bookings and billing for about 85 independent anaesthetists.
> The system maintains a rolling AM/PM schedule, keeps patient Cards current, lets anaesthetists
> capture BTM billing data, lets the office check and authorise completed Lists, then calculates and
> issues invoices. Xero is used for receivables and banking, while the Billing Engine remains the
> system that translates financial events back into each anaesthetist's view.

## The five nouns to remember

| Term | Meaning |
|---|---|
| Schedule | The rolling four-month calendar |
| List | One anaesthetist's half-day AM or PM operating session |
| Card | One patient appointment inside a List |
| Procedure | One clinical procedure inside a Card; each resolves its own billing route |
| BTM | Base units + Time units + Modifier units |

## Terms not to use

| Avoid | Use instead | Why |
|---|---|---|
| SSA | Anaesthetist | SSA does not appear in the RFP |
| Shift | List or AM/PM session | List is the RFP's scheduling unit |
| Claim/sign up for a shift | Request/offer cover; office reassigns the List | Self-service claiming is not specified |
| Delete Card | Soft-cancel Card | History and audit must be retained |
| Send back to anaesthetist | Resolve by phone; office corrects | There is no Returned state |
| Xero calculates the invoice | Billing Engine calculates/issues; Xero provides AR/banking | The RFP explicitly puts the Billing Engine at the centre |
| ACC route | Contract-holder route with ACC-related context | ACC is not a separate billing route |

## The lifecycle

```text
DRAFT -> SUBMITTED -> AUTHORISED -> Billing run completed
```

- `DRAFT`: anaesthetist, office and integrations may update.
- `SUBMITTED`: office-only edits; anaesthetist sees completed/unbilled.
- `AUTHORISED`: Cards are locked; the whole List hands to billing.
- Billing-run completion: the prototype stamps `billedAt` and removes the List from the
  anaesthetist's work view.
- There is no `RETURNED` state.

## Permission matrix

| Action | Anaesthetist | Office | System/integration |
|---|---:|---:|---:|
| View own Lists/Cards | Yes | Yes, all | As needed |
| View colleague patient details | No | Yes | As needed |
| Edit a `DRAFT` Card | Yes, own | Yes | Yes |
| Edit a `SUBMITTED` Card | No | Yes | No, park for intervention |
| Edit an `AUTHORISED` Card | No | No | No |
| Submit a List | Yes, own | No; office receives it after submission | No |
| Authorise a List | No | Yes | No |
| Reassign a whole List | No | Yes | No |
| Edit master data | No | Yes | No |
| Monitor billing/integrations | No | Yes | Automated events write status |

## The billing rules most likely to be questioned

### Fee calculation

```text
Fee = (Base + Time + Modifier units) x anaesthetist's own dollar value per unit
```

- Time: 1 unit per 15 minutes for the first two hours.
- Time after two hours: 1 unit per 10 minutes.
- Each anaesthetist has an independent dollar value per unit.
- The anaesthetist selects the RVG code; the system does not automatically infer it.
- Some RVG codes are ranges and require professional judgement.
- Positioning cannot be charged again if the base code already includes it.
- The RFP does not define partial-interval rounding; the prototype rounds up per started interval as
  a discovery assumption.

### Three billing routes

1. Hospital or other contract holder
2. Billable Party, usually the patient
3. Direct-claim Insurer

The route is explicit per Procedure. It is not inferred from flags.

### Patient insurance distinction

- **Direct Insurer route:** AA invoices the one insurer that accepts direct claims.
- **Insured reimbursement:** AA invoices the patient; the patient seeks reimbursement from their
  insurer.

Do not treat these as the same workflow.

### Split billing

- A second/additional Procedure in the same episode is time-only.
- Base and Modifiers cannot be charged again.
- One Procedure may allocate conserved lines across two funders.
- The prototype groups lines by counterparty; different funders create separate invoices.

### Contracts

- Type 1: reference only; standard anaesthetist rate.
- Type 2: agreed rate or discount.
- Type 3: fixed price.
- Every hospital and direct-billing insurer must have a protected default Type 1.
- Surgeon/group/organisation-held contracts do not have that guaranteed fallback in the prototype.

## The money model

```text
Payer -> ACCREC -> AA account -> ACCPAY -> Anaesthetist
```

- `ACCREC`: money AA is collecting.
- `ACCPAY`: money AA owes the anaesthetist.
- Paid into AA and disbursed to the anaesthetist are separate states.
- Partial payments authorise proportional disbursement.
- The mobile/web app reads the Billing Engine's mirror, never Xero directly.
- Outstanding balances are flat individual payable rows, not a Card-level rollup and not amounts the
  anaesthetist personally owes.

## What each app is for

### Anaesthetist Mobile

- Procedure-day Lists and Cards
- BTM capture
- Complete Card and submit List
- Add/copy/missing Card
- Availability and cover
- Later: balances

### Anaesthetist Web

- Wider dashboard and date ranges
- Same List/Card detail and capture functions
- Availability and cover
- Accounts and GST activity

### Admin Web

- Whole-day operational control
- Phone/manual changes
- Move one Card
- Reassign a whole List
- Correct billing setup
- Review and authorise
- Master data and audit
- Later: billing and integration monitoring

## Strong phrases to use

- "The List is the unit of availability and approval."
- "The fixed canvas exists even when there is no activity."
- "Status, hospital, surgeon and Cards are painted onto the canvas."
- "The office handles exceptions; the system removes repetitive work."
- "The Billing Engine references the Card; it does not duplicate the scheduling record."
- "The captured inputs remain reproducible, not just the final total."
- "AA tracks collection and disbursement as two separate states."
- "This is a candidate design we would validate during discovery."

## Statements to avoid

- "Anaesthetists pick up open shifts."
- "The app automatically chooses the clinical RVG code."
- "ACC has its own billing route."
- "Every insured patient is billed to an insurer."
- "Authorisation means the patient has paid."
- "Xero is the source for the mobile balance view."
- "The prototype is connected to live hospital, Xero, NHI, email or OCR services."
- "This workflow is final" when the RFP explicitly leaves it open.

## Prototype readiness

### Safe now

- Mobile Lists, Cards, BTM, completion and submission
- Web dashboard, Lists, availability and seeded accounts views
- Admin day view, changes, cover, review, authorisation, masters and audit
- Phase 08 billing run, invoice documents and billed-List disappearance

### Do not click as completed functionality yet

- Balances driven by real payments
- Billing Monitor
- Xero/payment simulator
- Integration simulator
- Scenario jump controls

These are planned for Phases 09 to 12.

## RFP ambiguities: present as discovery decisions

### 1. NHI in Xero

- One RFP section says NHI can be a searchable Xero contact cross-reference.
- Appendix 2 says NHI never leaves the practice system.
- The prototype chooses the stricter no-NHI-in-Xero reading.

Say:

> We have chosen the stricter data-minimisation interpretation for the prototype and would confirm
> that with AA.

### 2. Exact List disappearance trigger

- One table implies disappearance at `AUTHORISED`.
- The following text says invoice generation should be the precise trigger and requires
  confirmation.
- The prototype uses completion of the billing run.

### 3. Billing failure isolation

- The RFP asks whether one failed Card blocks the whole List.
- The planned prototype isolates the failed Card and bills the others.

### 4. Monitoring location

- The RFP leaves Admin Web versus a separate Billing Engine screen open.
- The prototype places monitoring in Admin Web.

### 5. List reassignment mechanics

- Reassignment is required.
- Free-target, absorb target and regenerate vacated slot is the prototype's proposal.

### 6. Availability and holiday conflicts

- The RFP asks whether these are hard constraints or warnings.
- The prototype uses advisory conflict flags.

### 7. Split-billing invoice count

- RFP grouping text says same-counterparty Procedures share an invoice.
- Split-billing text says two invoices in both split cases.
- The prototype groups by counterparty, with two invoices when funders differ.

### 8. Pre-payment

- The RFP requires payment before the procedure.
- It does not specify how pre-procedure invoicing fits the normal authorised-List billing trigger or
  whether an override exists.
- The planned prototype uses a visible completion block and a reasoned office override.

### 9. Concurrency

- Several sources can change a Card.
- The RFP asks how concurrent updates should be handled.
- The prototype is single-user and uses audited last-write-wins behaviour; production concurrency is
  a discovery topic.

### 10. Modifier values and time rounding

- The RFP names example modifier ranges, not a certified full NZSA table.
- The prototype values are demo-plausible and must not be described as authoritative.
- Partial time-interval rounding is a prototype assumption.

## Likely evaluator questions

### "Who actually uses mobile versus web?"

The same anaesthetist. Mobile is the primary in-theatre/on-the-move interface; web provides a wider
planning and accounts view.

### "Who creates the shifts?"

The system creates AM and PM Lists on the rolling canvas. Permanent Lists supply recurring defaults.
Office staff reserve and amend Lists and handle exceptions. "Shift" is not the RFP term.

### "Can an anaesthetist edit after submission?"

No. Submitted Cards are read-only to the anaesthetist and editable only by office. Authorised Cards
are immutable.

### "What happens when the office finds a mistake?"

Office staff phone for clarification and make the correction. There is no Returned state.

### "Why is Xero not doing all the billing?"

AA has agency-specific billing rules and needs Procedure-level calculation, grouping and
anaesthetist-facing views. Xero is the AR and banking add-on.

### "How do late hospital changes work?"

While the List is `DRAFT`, mapped hospital messages can update the Card in near real time. Once the
List is `SUBMITTED` or `AUTHORISED`, an inbound change must park for manual intervention.

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
