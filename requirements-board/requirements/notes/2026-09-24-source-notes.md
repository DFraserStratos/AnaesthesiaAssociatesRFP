# Source notes, 2026-09-24

Raw inputs behind the `catalogue/` and `domain-model.md`, kept so every "Meeting notes" and
"Q&A" citation resolves to something in the repo. Lightly formatted; wording is Donald's.

## Meeting notes (AA lead administrator)

- Cards are now bookings.
- Bookings have a primary procedure. These can be set by everyone.
- In a booking, modifiers are still only applied to the first procedure, but if there are more
  than 4, they are split across all procedures in a booking, with remaining rounded up to the
  primary procedure.
- The system needs to keep a record of each patient, with NHI number being the unique ID.
- Admins need a view of outstanding bills for a patient.
- Anaesthetists need a profile with settings for which RVGs (procedure codes) are pre-paid.

## Future-state diagrams supplied

1. High level AA process: Scheduling Engine creates rolling lists → Booking information inbound →
   Scheduling Engine ingests Lists and Bookings → Anaesthetist performs work and completes
   procedure details → Office reviews and authorises List → Billing/Invoice Engine → (Invoice sent
   to Billable Party) and (Financial records sent to Xero → Payment collected into AA →
   Anaesthetist paid).
2. Entity infographic: a List is 1 anaesthetist + 1 surgeon + 1 hospital + 1 day + 1 session. AM
   and PM Lists may be for different surgeons and/or hospitals. List contains Bookings; Booking
   contains Procedures, one marked Primary; each Procedure selects one Contract; Contract defines
   billing rules, pricing and invoice recipient. Hierarchy: Day → List → Booking → Procedure →
   Contract.
3. Mid level process with notes: booking sources are Hospital Systems, Surgeon's Rooms (emailed
   PDFs), Anaesthetist ad hoc (with photo ingest), AA Admin Team (manual). Anaesthetist app: view
   schedule/Lists/Bookings, perform procedure, complete procedure + billing details (times, BTM,
   other billable details), submit completed List. Admin app: review submitted List, correct or
   resolve billing information (Contract, Insurer, reference), authorise List (locks Bookings).
   Billing Engine: receive AUTHORISED List, resolve who gets billed (Contract Holder, Insurer,
   Patient), calculate charges (Contract, RVG, fixed price, override), generate invoices grouped
   by counterparty. Xero: AR + payable records, payment collected into AA, payment to anaesthetist
   via payment run.
4. Booking / List update process: incoming information from surgeon's rooms, hospital system, AA
   office, anaesthetist → can it be interpreted, validated and applied? No → surface for manual
   review, correct, retry. Yes → change type: new booking / modification / reschedule (date, List
   and/or time) / cancellation → apply to Scheduling Engine → record source, change and audit
   history → schedule reflects latest → loop until procedure.
5. Booking and List lifecycle: DRAFT (List exists, Booking created, editable, procedure takes
   place, anaesthetist finalises procedure + billing, required data complete? → Booking complete →
   all Bookings complete? → mark List SUBMITTED). SUBMITTED (anaesthetist loses edit access, List
   visible as completed/unbilled, office reviews Contracts/Insurer/references, corrections by
   office, office marks AUTHORISED). AUTHORISED (Bookings locked, whole List to Billing Engine,
   invoices generated for each billable party on Booking).
6. Billing route / who gets billed, four swimlanes:
   1. Card & Contract Setup: Booking created → contains 1+ Procedures → Procedures have a Contract
      (Contract currently assumed to define: base units, rate / fixed rate, fixed price where
      applicable, whether discount / price override allowed, billable party, invoice email,
      pre-paid amount where applicable) → is any required prepayment outstanding? Yes → prepayment
      path (below).
   2. Procedure Completion & Approval: procedure takes place → anaesthetist finalises actual
      procedure data → record clinical billing data (base / time / modifiers + other billing
      lines) → review selected Contract → Contract allows anaesthetist adjustment? Yes → optional %
      discount or fixed final price → Booking & Procedure billing data complete → List SUBMITTED →
      office sanity check Procedures / Contracts / references → List AUTHORISED → Cards and
      Procedures locked.
   3. Billing / Invoicing Engine: read each locked Procedure and selected Contract → additional
      Procedure in same anaesthetic episode? Yes → apply additional procedure rules to define
      billing split; No → normal charge → calculate final Procedure amount from recorded data +
      Contract → determine remaining amount to invoice → create pair of linked financial records
      in internal ledger (must track $ in and $ out so AA can track equilibrium) → generate
      invoices for each billable party on Booking → create pair of linked records in Xero
      (receivable to billable party, payable to anaesthetist). Prepayment path: create linked pair
      in internal ledger → generate prepayment invoice → create Xero pair.
   4. Payments, Xero & Reconciliation: create matching Xero records (ACCREC, ACCPAY draft) → send
      receivable invoice to billable party → payment received into AA account → reconciled back
      to internal ledger → full or partial? Full → authorise / release matching anaesthetist
      payable; Partial → authorise / release payable for exactly the amount received → update
      internal ledger position → receivable balance remaining? No → obligation settled; Yes →
      remaining stays outstanding. Prepayment path: send prepayment invoice → prepayment received
      → reconciled → re-check prepayment requirement.

## Q&A with Donald, 2026-09-24

1. **Modifier split.** More than four modifier units (not procedures) triggers the split. This
   replaces the RFP statement that secondary procedures charge time only. Secondary procedures
   never charge base units, still charge time, and may now carry some modifier units.
2. **Contract list (idea, to be fleshed out):** RVG Default Contract Post-paid (invoice email,
   price override); RVG Default Contract Pre-paid (invoice email, new field for pre-paid amount,
   price override); RVG Default Hospital Contract; Hospital; Surgeon solo; Surgeon group; Insurance
   Contracts. The bullets are fields that must be filled by hospital, AA staff, anaesthetist etc.
   because they cannot be derived; the RVG Default Hospital Contract can be derived from the
   List's location. The RVG list is the NZSA standard base units per procedure; there are more
   procedures than the NZSA document covers, so the system needs a function to create and manage
   contracts, each procedure needs an RVG default contract with base units, and AA fills in what
   NZSA does not. Single surgeons may have custom contracts, as may surgeon groups, and insurers.
   The contract list shown for a procedure is filtered to those relevant to the procedure,
   location, surgeon etc.
3. **Contract structure.** To be worked out; Claude to recommend a structure. Each contract has
   settings for base units, custom rate, fixed cost, and whether the anaesthetist may apply a
   discount. If discount is allowed, a field appears in the app for a fixed cost or percentage
   discount.
4. **Integrations.** No hospital or surgeon integration exists today. The "integration" is a manual
   download of bookings from the hospital into a matching screen where AA staff match or create
   bookings and lists. Admin staff apply and manage contracts; anaesthetists can also override or
   edit them and see them in the app; AA staff approve before submitting a list.
5. **Prepayment.** Vanessa (AA administrator): specific RVG codes are known by anaesthetists as
   ones they want prepaid, basically always 100%, typically cosmetic (plastics, dental). System
   should group RVGs for searchability. Prepaid is a property of the procedure choice (tick all
   cosmetics, or specific ones), not of the contract. An amount is needed: Greg (RFP author)
   believes some act as deposits; Vanessa said even a "full" prepayment is an estimate because
   duration and complications are unknown, so shorter surgery means a discount and longer means an
   additional invoice. There is a suggested fixed amount to apply.
6. **Adjustment.** Anaesthetists still record base, time and modifiers in full; afterwards they may
   discount the whole thing, e.g. 100% for a colleague's spouse.
7. **Lists.** The scheduling system creates blank lists; a list can be unassigned (not working, or
   working with no list assigned). Once a list is active or assigned, the one surgeon, one
   hospital rule applies.
8. **AA fee.** The prototype implied a fee taken when AA pays the anaesthetist; that was wrong. AA
   produces a separate invoice to the anaesthetist, outside the procedure's receivable and
   payable. The system should manage this too.
9. **Ledger.** Xero is not built to be a ledger of this kind, especially linking to patients, since
   patient contacts may be purged from Xero while the patient must remain in our ledger. Vanessa:
   if a patient has something unpaid, a further procedure would probably be cancelled, or at least
   AA wants to be alerted; features needed to make this visible for follow-up.
10. **Cancellation fees.** None known; Donald will ask.
11. **Terminology.** Card replaced with Booking; engine is Billing/Invoice Engine for now.
12. **Admin monitoring.** Not in diagrams but required: clear tools in the admin app showing how out
    of balance the whole ledger is, or a given patient's profile. Detail to be worked out.
13. **Invoice email.** Expected to come from the hospital, surgeon rooms or AA's records. It differs
    from the patient because the patient may be a child and the billable party or invoice contact
    the guardian.
14. **Format.** Requirements should live in the repo in a form Claude can read and update as truth,
    and be easy to copy into Miro (user stories, features, epics and their relationships). A flat
    markdown document will not work; a spreadsheet or CSV will. Donald may also look at an MCP
    connection to GitHub or Azure DevOps.
