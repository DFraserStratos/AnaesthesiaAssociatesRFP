# Prototype screenshot report

Written by `npm run capture` (requirements-board/scripts/capture.ts) on a full run. Do not edit by hand.

Scope: every story plus every feature with no stories (194 items, 194 stories). Features with stories are captured only when they have an overview screen.

| | Items | Stories |
|---|---:|---:|
| Captured | 119 | 108 |
| Partial | 62 | 62 |
| Absent from the prototype | 24 | 24 |
| Failed recipe | 0 | 0 |
| No recipe | 0 | 0 |

401 screenshots. Items per app: admin 109, web 61, mobile 56, simulator 36.

## Failed recipes (0)

None.

## Absent from the prototype (24)

- **US-02.1.3** Show differences on match · No field-level difference view. When a surgeon PDF row or HL7 message matches an existing Card, the prototype only notes "Already booked on this List · will update, not duplicate" and applies the update; time, patient and procedure differences are never shown side by side before applying. Searched the Integrations screen (Surgeon PDFs, Messages), ingestPdfRow and the integration apply path for a diff or compare view.
- **US-02.5.6** Concurrent edits · No concurrency handling is shown. The prototype is a single in-browser store where writes apply in order (last write wins, each audited); there is no conflict detection, locking or merge UI. Searched store/ and apps/ for concurrency, stale or version-conflict handling.
- **US-03.2.2** Anyone with edit rights can set the primary · The first procedure on a card is its fixed anchor (it cannot be removed and there is no control to make another procedure primary). Searched CardDetailBody, BtmCaptureBlock, EditProcedureSheet, AdminCardDetail and the store for a primary switch.
- **US-04.1.3** Contract audit and versioning · Contracts are edited in place; no version history is kept. Contract edits are audited, and an invoice already raised is a snapshot that later contract edits do not change, but there is nothing to show or restore an earlier version. Searched domain/types.ts (Contract), store/contractActions.ts and apps/admin/flows/ContractEditSheet.tsx.
- **US-04.2.3** Base unit override · A contract cannot override base units for an RVG code or group. Base units always come from the RVG code master; a Type 3 contract prices a code with a fixed price instead. Searched domain/types.ts (Contract, ContractPrice), domain/billing/fee.ts and ContractEditSheet.tsx.
- **US-04.2.6** Adjustment and override permissions · The contract has no settings for whether the anaesthetist may discount or set a final price, or whether the office may override. Its only permission flag is "Permits individual arrangement (Method 3)", which gates rate times time lines. Searched domain/types.ts (Contract), ContractEditSheet.tsx, OverrideCard.tsx and PriceOverrideSheet.tsx.
- **US-04.2.7** Required booking inputs · A contract cannot declare required booking inputs. Completion checks come from the billing route and fixed validator rules, not from the contract. Searched domain/types.ts (Contract), domain/billing/validateCardForBilling.ts and ContractEditSheet.tsx.
- **US-04.2.8** Invoice presentation and delivery · Invoice layout, delivery method and GST treatment are not contract settings. The invoice recipient follows the billing route, delivery is a simulated email, and GST is a fixed 15%. Searched domain/types.ts (Contract), ContractEditSheet.tsx and apps/admin/screens/InvoiceDocument.tsx.
- **US-05.1.2** Add AA codes · The RVG code master is view only: codes cannot be added, and there is no AA sourced marker. Searched apps/admin/screens/MasterData.tsx (RvgCodesView), domain/types.ts (RvgCode) and domain/seed/rvgCodes.ts.
- **US-05.3.3** Modifier split above four units · The prototype keeps all modifier units on the first procedure and charges additional procedures for time only; there is no four unit threshold or equal split of modifiers across procedures. Searched domain/billing (fee.ts, modifierUnits.ts) and the capture UnitsCard.
- **US-06.1.1** Tick codes or groups · No prepaid settings exist on the anaesthetist profile. Searched the mobile More screen, the web app and admin Master data for prepaid or pre-payment settings: the prototype triggers pre-payment from a per-procedure payment category instead of anaesthetist-chosen RVG codes or groups.
- **US-06.1.2** Admin can maintain on behalf · No prepaid settings exist to maintain. Admin Master data holds each anaesthetist's unit value, contact, GST period and active flag, but no prepaid RVG codes or groups; pre-payment is set per procedure in the card's office billing setup instead.
- **US-06.4.2** Credit or refund when prepaid exceeds final · No credit or refund path exists. Searched the billing domain, store and apps for credit note, refund and overpayment: when a pre-payment exceeds the final amount the balance run refuses the invoice as a negative amount for office review instead of raising a credit (invoiceBuild.ts). The refund mechanism is open (OQ-03).
- **US-08.6.2** Credit note and re-issue · No credit note, payable reversal or re-issue flow. Searched the prototype source for credit note, reverse and re-issue; none exist. Invoiced bookings can only take a post-op addendum.
- **US-10.2.4** Bulk remittance stays in Xero · Bulk remittance and bank reconciliation stay in Xero by design, so the prototype has no screen for them. Searched the Xero simulator, admin and control panel for remittance and bank reconciliation; only a note on the Xero simulator mentions remittance matching.
- **US-11.2.3** Invoice email required for patient-direct · No invoice email is captured or required for patient-direct billing; searched the add card form, billing setup sheet, patient edit sheet and billing guards for an invoice email field or rule.
- **US-11.3.1** Patient outstanding bills view · There is no patient view listing a patient's invoices across anaesthetists; the admin Invoices screen lists invoices without a per-patient view, and the web and mobile accounts show only the anaesthetist's own payables.
- **US-12.1.3** Prepaid procedures · The anaesthetist profile holds no prepaid RVG codes or groups (see US-06.1.1). Searched the mobile More screen, the web app and admin Master data; pre-payment is a per-procedure payment category in the prototype.
- **US-12.1.5** Bank details for disbursement · No bank account is held for anaesthetists. Searched apps, shared and domain types for bank: Master data holds unit value, contact, GST period and HPI only, and the payables run is a simulated Xero ACCPAY with no account details. Where these live is open (OQ-14).
- **US-13.2.1** Whole-ledger balance · No whole-ledger view. Receivables, receipts held, payables due, disbursed and imbalance are never totalled for the office; the billing monitor shows only the payables due for the next payables run, and each invoice shows its own paid and disbursed state. Searched apps/admin and apps/demo for ledger, balance, receivable and disbursed.
- **US-13.2.2** Per-patient balance · No patient profile or per-patient balance in the Admin app. The only patient balance signal is the "Prior balance" flag on a billing monitor row. Searched apps/admin for patient balance and patient profile screens.
- **US-13.2.3** Per-anaesthetist balance · No per-anaesthetist ledger view for the office. Each anaesthetist sees their own balances in the Anaesthetist app (web Accounts, mobile Balances), but the Admin app has no equivalent. Searched apps/admin for balance and receivable views.
- **US-15.0.4** Volumes · Not demonstrated. The prototype runs on a small seeded in-browser data set (14 anaesthetists, a few weeks of lists); scale is only narrated in copy on the admin day grid and the Xero simulation, never simulated or load tested.
- **US-15.0.5** Testable billing rules · No screen shows this. It is met in the prototype's code rather than its UI: fee, unit, route and split logic is pure and deterministic in aa-prototype/src/domain/billing with Vitest suites of worked examples.

## Partial (62)

- **US-01.1.2** Horizon rolls forward daily · The canvas is pre-generated from Permanent Lists, but the daily roll-forward of the horizon is a background job that has no screen in the prototype.
- **US-01.1.3** New anaesthetist gets a populated canvas · Adding an anaesthetist generates their forward Lists in the store (confirmed on save), but the admin day grid shows only the seeded roster, so the new rows are not visible there.
- **US-01.1.4** List default times · Start and end times can be overridden per List, but the AM and PM defaults (07:30 to 12:30, 13:00 to 17:30) are fixed in code with no admin setting.
- **US-01.2.1** Anaesthetist sets half-day availability · The mobile app sets each own session to Free or Block only; available for emergency and on leave are not offered. The web app shows own availability in the grid but cannot change it.
- **US-01.2.2** List status master data · The List status table is shown in master data (key, label, description) but is view only: statuses cannot be added or renamed, and colour is not editable.
- **US-01.4.1** Reassign a List with its bookings · Reassignment moves the List and its cards to a colleague with a free session; the preserved status history and audit trail are shown elsewhere (Audit), not on this flow.
- **US-01.4.3** Anaesthetist requests a swap · From the availability view an anaesthetist can ask a colleague to cover a free session, or offer their own free session. Requesting that one of their own booked Lists be swapped to a colleague, and the office confirming that reassignment, are not in the prototype.
- **US-01.5.2** Conflict flagging · Conflicts are flagged as advisory warnings (hard block versus soft warning is still open, OQ-09). The web app shows no conflict for the anaesthetist.
- **US-01.5.3** Anaesthetist availability calendar · Availability is set per session on the mobile app, on the List itself, not as a separate calendar independent of Lists (OQ-27). The web app cannot change availability.
- **US-02.1.1** Import a hospital booking download · No hospital booking file import. The nearest analogue is surgeon-emailed PDF operating lists, whose extracted rows are reviewed beside the document and ingested.
- **US-02.1.2** Match rows to Lists and Bookings · No hospital download matching screen. The nearest analogue is the surgeon PDF review: the office picks the target List, and a row whose NHI is already booked on that List updates the existing Card instead of duplicating it. There is no option to create a new List or to reject a row.
- **US-02.1.4** Unmatched queue · There are no hospital download rows, so there is no unmatched-row queue. The analogue shown is the integration message log: messages that cannot be applied (dead-letter, or manual intervention when the target List is already submitted) are retained for the office to fix and reprocess, never dropped.
- **US-02.3.1** Create or amend a Booking · The office can amend any Booking (patient, procedure, times, billing setup), each change audited against the user. It can create a Booking only on a Free, empty List through the phone-advice booking; there is no way for the office to add a Booking to a List that already has one.
- **US-02.5.4** Changes accepted until the procedure · Inbound changes are applied to any DRAFT List, including today's, so late bookings are supported. The cut-off is List submission rather than session start: a change addressing a submitted List is not applied and parks for manual intervention, as shown.
- **US-03.1.2** See the Contract on each Procedure · The applied Contract is shown read-only on each procedure of the card, but not on the List view before the session.
- **US-03.1.3** Attachments · Photos can be attached to a Booking (card) on web and mobile. Other file types and attachments on a List are not in the prototype.
- **US-03.2.3** Add additional Procedures · Anaesthetists add procedures on web and mobile; each carries its own billing route, but the Contract is not chosen separately per added procedure. Admin adding procedures is covered by the admin card screen, not shot here.
- **US-03.3.6** Other billing lines · Non-BTM lines are added as a fixed amount with a description; there is no typed list of line kinds (HDU review, nerve catheter and so on) and no service date on a line. Charges dated after the procedure are handled as a post-op event on a locked card, not shot here.
- **US-03.4.1** Anaesthetist can change the Contract · The anaesthetist can change the billing route, insurer and billing reference (audited in card history), which decides the Contract, but cannot pick the Contract itself from a filtered list, and the change is not flagged for office review.
- **US-03.5.1** Adjustment field appears when permitted · The dollar adjustment and fixed charge fields are always offered, not only when the Contract allows adjustment, and a percentage discount is set by the office rather than the anaesthetist.
- **US-04.1.1** Contract categories · Contracts are typed by the RFP pricing types (Type 1 units, Type 2 rate, Type 3 fixed) plus a holder type (hospital, insurer, surgeon, organisation, billable party). The seven named categories (RVG Default Post-paid, Pre-paid, Hospital, Surgeon Solo, Surgeon Group, Insurance) are not offered as categories.
- **US-04.1.2** Create, edit, retire Contracts · Contracts can be created, edited, end-dated and deleted with effective from and to dates. There is no review date, and editing changes the contract in place rather than creating a new version.
- **US-04.2.1** Holder and applicability scope · A contract records its holder (hospital, insurer, surgeon, organisation or billable party) and an organisational or individual scope. Applicability by hospitals, surgeons, insurers, RVG codes or groups and funding source cannot be set.
- **US-04.2.4** Fixed fee schedule lines · Type 3 fee schedule rows hold an optional RVG code, an optional procedure ordinal and a price only. The holder's own code, description, GST inclusive price, time band, add-on flag and quantity rule are not captured.
- **US-04.2.5** Multi-procedure rule per Contract · Only a Type 3 contract can price additional procedures, through a fee schedule row keyed to the procedure ordinal (for example a second procedure price). The RVG default, percentage of second code, add-on fee and not billable options cannot be chosen per contract.
- **US-04.3.1** Exactly one Contract per Procedure · Each procedure holds a single governing contract, set by the office. A procedure with no contract is not blocked from completion: it falls back to default pricing and the hospital default contract is resolved at billing.
- **US-04.3.2** Filtered Contract list · The office picks the governing contract from every contract in master data; the list is not filtered by the hospital, surgeon, insurer, funding or RVG code. The anaesthetist apps show the contract read-only and have no contract picker.
- **US-04.3.3** Default hospital Contract derived from location · Seeded hospital procedures carry the hospital default contract, and billing falls back to the protected hospital default when no other contract is in effect. A new procedure is not stamped with the default when it is created; it is resolved at billing.
- **US-05.1.3** Group codes · Codes are grouped by anatomical site from the guide, and the code picker lists them under those groups. AA groups such as cosmetic, dental or plastics cannot be defined, and codes cannot be selected as a set.
- **US-05.1.5** Modifier code master · The modifier code master holds the A, AI, AS, ASE, OB, P, PA and post-op codes with unit values, view only. VM1, TTE1 to TTE2, PACU1, EAA1, POC1 to POC3 and NC1 to NC2 are not in the set.
- **US-05.2.5** Fixed fee schedule pricing · A Type 3 card is priced from the matched fixed price row (by RVG code, surgeon and procedure ordinal) and BTM is still recorded. Schedule lines have no time band or add-on fee to match on.
- **US-05.4.1** Apply anaesthetist adjustment · The anaesthetist can apply a dollar adjustment or a fixed charge with a reason, and the card shows the fee before the override. It is not gated by the contract, and percentage discounts are office only.
- **US-05.5.2** ACC pre-op flat fee codes · An ACC pre-operative assessment is added as an ancillary fixed amount line, with the code typed into the description. CS250, CS260 and CS70 are not a code set to pick from, and their rates are not held.
- **US-06.2.1** Detect prepayment requirement · The prototype flags a card as needing pre-payment when a procedure's patient payment category is set to self funded pre-payment. There is no per-anaesthetist prepaid set of RVG codes or groups to match against.
- **US-06.2.2** Set the prepaid amount · Full versus deposit and the deposit amount are stored on the procedure and drive the pre-procedure invoice, but they are seeded only: no screen lets an admin or anaesthetist set or change the prepaid amount.
- **US-06.2.3** Prepayment is an estimate · The full pre-payment is raised as an estimate from the fee calculator and the invoice says so. The case where the final amount comes out more or less than the estimate is not demonstrated with seeded data.
- **US-06.3.2** Track prepayment status · Status is shown per card (required, outstanding, overridden, received) and as a flag on the admin day grid. There is no part paid status and no list of all upcoming prepaid bookings.
- **US-06.3.3** Alert on unpaid prepayment · An unpaid pre-payment is flagged on the admin day grid and on the card, and completion is blocked. There is no time-based alert or notification as the procedure date approaches.
- **US-06.3.5** Re-check when the Booking changes · The pre-payment requirement is re-derived live whenever the procedure's payment category changes, as shown. The prepaid amount is not recalculated when procedures or the Contract change: the deposit or full-fee type is fixed on the procedure.
- **US-08.2.3** Split one Procedure's fee between two payers · The split is set by the office allocating billing lines to funders on the card, not by a covered amount or percentage defined on the Contract. The seeded example splits between an insurer and the hospital, not an insurer portion and a patient gap.
- **US-08.3.3** Patient-linked history survives Xero archiving · Archiving is simulated for Xero contacts only; purging a contact is not shown.
- **US-08.3.4** Money in and money out · Receipts and disbursements are tracked per invoice and shown per card, but there is no equilibrium view for AA overall, per anaesthetist or per patient.
- **US-08.3.5** Per-anaesthetist ledger position · Each anaesthetist sees their own position in the web and mobile apps, but there is no office view of a chosen anaesthetist's ledger position, and the mobile app shows only what is outstanding, not collected or paid out.
- **US-08.4.2** Send to the invoice email · Emailing is simulated and records only the time sent; the invoice does not show or use an invoice email address captured on the booking, so sending to a guardian's address is not shown. Portal upload for an insurer is shown.
- **US-08.4.4** Invoice reproducibility · Invoices are stored as snapshots that later contract edits do not change, but there is no action to regenerate a past invoice from the locked data and contract version.
- **US-08.4.5** Anaesthetist as supplier, AA as agent · The invoice names the anaesthetist and states AA bills as agent, but it does not show the anaesthetist as supplier with their GST number.
- **US-08.6.1** Supplementary invoice for late billing lines · The post-op charge becomes a new linked addendum card on the anaesthetist's free session today and bills when that list is authorised, rather than raising a supplementary invoice directly against the invoiced booking. It needs a free session that day.
- **US-09.1.4** ACCPAY as buyer-created tax invoice · The ACCPAY to the anaesthetist exists with payee, bill number and the AA service fee, but it carries no buyer-created tax invoice wording or the details that treatment requires (open question OQ-29).
- **US-09.4.1** Dedicated Xero organisation · The simulator models a single Xero organisation used only for receivables, payables and payments, but no organisation setup or separation from general accounting is shown.
- **US-09.4.2** Duplicate invoice number prevention · The Xero setting is only described in a note on the simulator; it is not modelled as a configurable or enforced setting (open question OQ-11).
- **US-10.3.1** Generate AA fee invoices · No separate AA fee invoice to the anaesthetist. The prototype deducts an illustrative AA service fee from each payable instead, the nearest analogue.
- **US-10.3.2** AA fee visible to the anaesthetist · No AA fee invoices or their payment status: the web app shows the fee deducted from each payment. The mobile app does not show the AA fee.
- **US-11.1.1** Patient keyed on NHI · Patient details show on each card; there is no standalone patient record screen, and ethnicity is held but not shown on the patient panel.
- **US-11.1.4** Patient without NHI · A patient can be created without an NHI (the add card form leaves it optional) and shows as NHI pending, but there is no way to attach the NHI later: Edit patient details has no NHI field.
- **US-11.2.2** Guardian or other override · Admin only: the office sets a guardian or other payer in the billing setup. There is no invoice email for the billable party, and the anaesthetist apps show the billable party read-only without a way to change it.
- **US-11.3.2** Alert on booking a patient with unpaid bills · The unpaid prior balance is flagged in the billing monitor once the list is authorised, not as an alert when the booking is created or matched.
- **US-11.3.3** Follow-up tools · An invoice can be emailed from the invoice document, but once sent there is no re-send, and there is no way to record follow-up actions against a patient's outstanding items.
- **US-12.1.1** Dollar value per unit · Each anaesthetist's dollar value per unit is held and editable, but only by the office in admin Master data. The anaesthetist cannot set it in the mobile or web app.
- **US-12.1.2** GST period · The GST period is held on the anaesthetist but set by the office in admin Master data, not by the anaesthetist. The web GST view defaults to it and can be switched for viewing only; the mobile app shows the current month only.
- **US-13.4.1** Maintain reference tables · Anaesthetists, Contracts, Permanent Lists and hospitals with their holiday calendars are editable. Surgeons, insurers, organisations, RVG codes, modifier codes and list statuses are view only. There are no surgeon groups or RVG groups, and public holidays are held per hospital with no separate master calendar.
- **US-14.4.1** NHI lookup via Digital Services Hub · The NHI lookup is simulated against a small set of demo records, not the NHI FHIR API, and anaesthetists carry an HPI only as an optional field; nothing is validated against HPI.
- **US-15.0.1** Ease of use · Ease of use is a quality that screenshots can only suggest: the shots show the calm, large-target capture screen and the operational day view. Whether people not comfortable with modern systems find it intuitive needs usability testing, which the prototype has not had.

## No recipe (0)

None.

## Captured (119)

- **FT-02.2** Surgeon PDF list ingest · admin
- **FT-04.1** Contract catalogue · admin
- **FT-05.1** RVG code master · admin
- **FT-07.2** SUBMITTED · admin
- **FT-08.4** Invoice generation and despatch · admin
- **FT-08.5** Processing status and failures · admin
- **FT-09.1** Invoice pair creation · simulator
- **FT-09.3** Contact management and archiving · simulator
- **FT-13.1** Schedule dashboard · admin
- **FT-13.3** Billing flow monitoring · admin
- **FT-13.4** Master data management · admin
- **US-01.1.1** Two Lists per anaesthetist per day · admin, web, mobile
- **US-01.2.3** Status is independent of bookings · admin, web
- **US-01.3.1** Assigned List pairing rule · admin
- **US-01.3.2** Permanent Lists drive most assignments · admin
- **US-01.3.3** Manual List assignment · admin
- **US-01.3.4** AM and PM can differ · admin, web, mobile
- **US-01.4.2** Availability finder · admin, web, mobile
- **US-01.5.1** Hospital holiday calendar · admin
- **US-02.2.1** Read a PDF list · admin
- **US-02.2.2** Edit then ingest · admin
- **US-02.4.1** Add a Booking from scratch · web, mobile
- **US-02.4.2** Photo capture of the physical card · web, mobile
- **US-02.4.3** Copy a Booking · web, mobile
- **US-02.5.1** Apply a modification · simulator, admin
- **US-02.5.2** Apply a reschedule · simulator, web
- **US-02.5.3** Record a cancellation · simulator, web
- **US-02.5.5** Append-only change history · admin
- **US-03.1.1** Schedule to List to Booking drill-down · web, mobile
- **US-03.1.4** Web app parity · web, mobile
- **US-03.2.1** One primary Procedure · web, mobile
- **US-03.3.1** Select an RVG code · web, mobile
- **US-03.3.2** Override a ranged base code · web, mobile
- **US-03.3.3** Record anaesthetic start and handover times · web, mobile
- **US-03.3.4** ASA seeds the modifier field · web, mobile
- **US-03.3.5** Itemise modifiers · web, mobile
- **US-03.3.7** Rate x time capture · web, mobile
- **US-03.5.2** BTM still recorded in full · web, mobile
- **US-03.5.3** Adjustment reason · web, mobile
- **US-03.6.1** Mark a Booking complete · web, mobile
- **US-03.6.2** Incomplete Bookings listed · web, mobile
- **US-04.2.2** Pricing basis · admin
- **US-04.2.9** Organisational and individual Contracts · admin
- **US-04.3.4** Admin sets Contracts at booking setup · admin
- **US-04.3.5** Contract locked at AUTHORISED · admin
- **US-04.4.1** Mandatory default Contract · admin
- **US-05.1.1** Load NZSA RVG codes · admin
- **US-05.1.4** Absorbed modifiers · admin, web, mobile
- **US-05.2.1** Per-anaesthetist unit value · admin, web, mobile
- **US-05.2.2** Tiered time units · web, mobile
- **US-05.2.3** Conditional positioning modifier · web, mobile
- **US-05.2.4** Contract rate or discount · admin
- **US-05.2.6** Rate x time pricing · web, mobile
- **US-05.2.7** GST · admin
- **US-05.3.1** Base units on primary only · web, mobile
- **US-05.3.2** Time units on every Procedure · web, mobile
- **US-05.3.4** Contract-specific second-procedure rules · admin
- **US-05.3.5** Ledger tracks each Procedure's share · web, mobile
- **US-05.4.2** Office price override · admin
- **US-05.5.1** ACC through the holder's Contract · admin
- **US-06.3.1** Raise the prepayment invoice · admin, simulator
- **US-06.3.4** Re-check after each receipt · admin
- **US-06.4.1** Invoice the remaining balance · admin
- **US-07.1.1** Submit a completed List · web, mobile
- **US-07.1.2** Cannot submit an incomplete List · web, mobile
- **US-07.2.1** Anaesthetist loses edit access · web, mobile, simulator
- **US-07.2.2** Office review of Contracts and references · admin
- **US-07.2.3** Office corrections · admin
- **US-07.3.1** Authorise the List · admin
- **US-07.3.2** Immutable after AUTHORISED · admin, simulator
- **US-07.4.1** List disappears on invoice generation · mobile, web
- **US-08.1.1** Process an AUTHORISED List · admin
- **US-08.1.2** Contract already resolved · admin
- **US-08.2.1** Group by billable party · admin
- **US-08.2.2** Net prepayments · admin
- **US-08.3.1** Linked receivable and payable pair · simulator, admin
- **US-08.3.2** Ledger is the system of record · web, mobile
- **US-08.4.1** Generate invoice documents · admin
- **US-08.4.3** Unique invoice numbers · simulator
- **US-08.5.1** Report processing status · admin
- **US-08.5.2** Booking-level vs List-level failure · admin
- **US-09.1.1** Create ACCREC and draft ACCPAY · simulator, admin
- **US-09.1.2** InvoiceNumber and Reference · simulator
- **US-09.1.3** Prepayment invoices also paired · simulator
- **US-09.2.1** Webhook on INVOICE events · simulator
- **US-09.2.2** Daily reconciliation poll · simulator
- **US-09.2.3** Idempotent by InvoiceID · simulator
- **US-09.2.4** Detect disbursement · simulator, admin
- **US-09.3.1** Hidden ID in ContactNumber · simulator
- **US-09.3.2** NHI never sent to Xero · simulator
- **US-09.3.3** Scheduled archiving · admin, simulator
- **US-09.3.4** Invoice against an archived contact · simulator
- **US-10.1.1** All payments into AA · simulator
- **US-10.1.2** Two payment states · admin
- **US-10.2.1** Full payment releases the payable · simulator, admin
- **US-10.2.2** Partial payment releases exactly that amount · simulator
- **US-10.2.3** Reconcile back to the ledger · web, simulator
- **US-11.1.2** Dual-format NHI validation · admin
- **US-11.1.3** Deduplicate on NHI · web, mobile
- **US-11.2.1** Default billable party is the patient · admin
- **US-11.4.1** Insurer master data · admin
- **US-11.4.2** Insured patient who forwards the invoice · admin
- **US-12.1.4** Identity and contact · admin
- **US-12.2.1** Outstanding balances list · web, mobile
- **US-12.2.2** Activity summary for GST · web, mobile
- **US-12.2.3** Dashboard · web
- **US-13.1.1** One-day dashboard · admin
- **US-13.1.2** Pre-op review of tomorrow · admin
- **US-13.3.1** Processing monitor · admin
- **US-13.3.2** Manual intervention · admin
- **US-13.5.1** Role-based access · admin, simulator
- **US-13.5.2** Audit trail of all actions · admin
- **US-14.1.1** Parse SIU messages · simulator, admin
- **US-14.2.1** FHIR-native internal model · simulator
- **US-14.3.1** Real-time processing · simulator
- **US-14.5.1** Integration failure visibility · admin
- **US-15.0.2** Mobile-first for anaesthetists · mobile, web
- **US-15.0.3** Enter once · web, admin
- **US-15.0.6** Privacy and data minimisation · simulator
