# Phase 22 · Invoice presentation, delivery and the payment setting

**Requirements covered:**
[US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md) Invoice presentation and delivery (Proposed) ·
[US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md) Payment setting: full payment or split (Verify, [OQ-68](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-68.md)) ·
[FT-08.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.4.md) Invoice generation and despatch (Proposed) ·
[US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md) Send to the invoice email (Confirmed) ·
[US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md) Anaesthetist as supplier, AA as agent (Proposed, [OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md)) ·
[US-08.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.3.md) Split one Procedure's fee between two payers (Verify, OQ-68; mechanism settled by [OQ-23](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-23.md)) ·
[US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md) ACCPAY as buyer-created tax invoice (Proposed, OQ-29; graded Contradicts) ·
[DM-27](../analysis/domain-model-delta.md#dm-27) Invoice entity: numbering, supplier and agent presentation, email, delivery and lineage ·
[DM-28](../analysis/domain-model-delta.md#dm-28) a Contract payment setting (full or split) drives a second invoice (grouping by billable party is already aligned).
No RV finding is closed here ([reverse-check.md](../analysis/reverse-check.md) has none on this
surface). The settled July rulings superseded are the `funderOverride` conservation split (fifth
review #4), the counterparty-kind layout and the manual "Email invoice" send (Phase 08 decisions),
listed under PROGRESS.md updates.
**Depends on:** Phase 21 (the Booking's billable party and invoice email, `Invoice.invoiceEmail`
snapshotted by the run, grouping by billable party, the required inputs including the insurer member
number, and `funderOverride` left as the interim split). Also relies on 14 (trigger registry and the
PWA "Office authorises this List" stand-in, `authoriseAsSimulatedOffice` in `src/store/officeStandIn.ts`),
15 (Booking vocabulary), 16 (the payable equals the receivable; `invoiceNumber` and `reference` stored
on both Xero records; `bctisFor` in `domain/billing/bcti.ts`, the one pure BCTI count the monthly AA
fee run uses, fed only by the `bctiRecords(state)` selector, one record per procedure ACCPAY), 17 (hospital and surgeon rooms contact emails) and 18 to 20
(the Contract shape: category, holder, scope, pricing basis and `aaCode`, the Master data Contract
sheet, one Contract per Procedure, and no insurer or funding source on the Booking or Procedure, D2:
the Contract's holder is who it bills).
**Estimated:** 1 session (a full one, and a heavy one: about 40 files and many rewritten tests). If
it runs long, the natural stop point is after work item 9 (model, split, sending run, Xero wording
and seed all green); items 10 to 15 are UI and fit a short second session.

## Goal

Every receivable invoice is **issued in the anaesthetist's name**, with their GST number, and names
**AA as agent**, not supplier (US-08.4.5). Each Contract carries its own **invoicing settings**:
layout (contract holder or patient), delivery method (email, portal upload, or none) and GST
treatment, so every invoice raised under it looks, travels and is taxed the same way without the
office choosing booking by booking (US-04.2.8).

The Billing/Invoice Engine now **sends each invoice itself** as part of the billing run (FT-08.4,
US-08.4.2). Authorising a List in Admin Review raises the invoices and stamps each one "Emailed to
<address>" (to the invoice email on the Booking, which may be a guardian's) or "Queued for <insurer>
portal". The office's manual "Email invoice" button goes; a single-invoice **Resend** stays on the
invoice rail.

Each Contract gets a **payment setting** (US-04.2.12, AA's answer to OQ-23): **Full payment** (the
assigned billable party pays the whole line) or **Split** (the line item is divided between parties,
with an invoice to each, US-08.2.3). Under Split, the Contract's holder (for example the insurer) is
invoiced its **share** and the Booking's billable party (the patient by default) the rest. The share
is a **typed value in $ or %**, entered by the office on the Booking and defaulting from the
Contract: OQ-68's recommendation (Greg: "you could type in a dollar sign in 48, or you could type in
48%"), built as that and labelled provisional (OQ-68) in one pure module. This replaces the
line-level `funderOverride` and the office's Funder allocation sheet entirely. The seeded Prentice
Booking moves onto a nib split Contract, with nib's share typed as $132.50, and still raises
**AA-2026-0005 · nib · $152.38** and **AA-2026-0006 · St George's · $91.43**, so S3 Beat 1 keeps its
figures.

The **ACCPAY** in the Xero simulation carries provisional **buyer-created tax invoice** wording with
the supplier (anaesthetist, GST number) and agent (AA, GST number) details (US-09.1.4). It stays
**one BCTI per receivable invoice, the same value as its receivable** (OQ-42; Phase 16 already
removed the 5% fee, which was the Contradicts half of US-09.1.4's grade). A Split setting therefore
gives two invoices and two BCTIs, counted by Phase 16's count function, which this phase does not
change; the catalogue's "one per procedure" stays unresolved beside it (ROADMAP, BCTI granularity).
The Invoice gains the fields DM-27 lists: recipient email (21's snapshot), delivery method and
status, supplier, agent, Procedure links and lineage.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the snapshot:

   ```
   git diff 501b0b8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks for US-04.2.8, US-04.2.12, FT-08.4, US-08.4.2, US-08.4.5, US-08.2.3, US-09.1.4,
   the items they lean on (US-08.4.1 two layouts, US-05.2.7 prices held GST exclusive, US-11.4.1
   direct insurer and its split, US-11.2.2 billable party override, US-08.4.3 the `-P` suffix,
   FT-08.2 grouping, FT-09.1 the pair), OQ-29, OQ-68, OQ-67 (whether the per-Booking override
   stays), OQ-42 (BCTI the same value as its receivable), OQ-60 (what the AA fee counts) and OQ-73
   (prepayment only for a paying patient), and the domain-model lines on `paymentSetting`,
   `invoiceLayout`, `deliveryMethod`, `gstTreatment`, the Internal ledger bullet "Invoices are issued
   in the anaesthetist's name with AA as agent; the ACCPAY is a buyer-created tax invoice" and the
   Invoice email glossary entry.
2. If an item changed, re-read it in full and adjust the work items. If an item is now Retired or
   Future, drop it and say so in the PROGRESS entry. If US-08.2.3 or US-04.2.12 is retired, still
   remove `funderOverride` (it is retired behaviour either way) but move Prentice onto the plain St
   George's default Contract and re-baseline S3 Beat 1 to one invoice; tell the owner first, because
   the S3 two-invoice beat goes.
3. **Open questions, and what to build if still open.**
   - **OQ-23 is answered** (the payment setting, full or split, on the Contract). Build it as the
     answer: no provisional label on the Full / Split setting itself.
   - **OQ-68 (split basis).** Build its recommendation: a typed value in $ or % for the holder's
     share, set on the Booking, defaulting from the Contract, with the Booking's billable party paying
     the rest (so two parties always total 100%). Every surface showing the share carries a small
     neutral "Provisional (OQ-68)" pill and the one caption `OQ68_CAPTION` (work item 3). If OQ-68 is
     answered, build the answer in the same module: "percentage only" drops the $ form of the parser;
     "set on the Contract only" drops the Booking share and its action; more than two parties, or
     shares that must be entered to total 100, needs a list of shares: tell the owner before building
     that, because it reshapes the setup row and the seed.
   - **OQ-29 (GST agency treatment, and IRD's new name for the buyer-created tax invoice).** Build
     the recommended reading: supplier = the anaesthetist with their GST number, AA named as agent,
     and the ACCPAY labelled a buyer-created tax invoice. Every surface that shows this wording
     carries a small neutral "Provisional (OQ-29)" pill and one caption: "Supplier, agent and
     buyer-created wording are provisional until AA's accountant confirms the GST agency treatment
     and IRD's current name for this document." The wording and the document's name live in one
     module (work item 2), so the answer changes one file. If OQ-29 is answered, use the
     accountant's wording and name and drop the pill.
   - **BCTI granularity.** The catalogue says "one per procedure" (US-09.1.4 note, OQ-29) beside
     "the same value as its receivable" (OQ-42). Build one per receivable invoice and leave Phase
     16's count function and its tests untouched. If AA's accountant has confirmed "one per
     procedure", stop and tell the owner: the count function, the $700 seed and the S3 and S4
     figures re-baseline in one place first (ROADMAP).
   - **OQ-67 (who a Contract belongs to; the per-Booking override).** Its recommendation keeps the
     per-Booking override beside Contract-defined billable parties, which Prentice's remainder to St
     George's relies on. If OQ-67 removes the override, tell the owner: Prentice's remainder party
     then needs its own Contract arrangement and S3 Beat 1 changes.
4. **Read what 16 and 18 to 21 actually left** (their PROGRESS entries): the Contract field names
   and the Master data Contract sheet (18), where the insurer member number lives (21's required
   inputs; D2 means no `insurerId` on the Booking or Procedure), the names of
   `billablePartyForProcedure`, `defaultBillablePartyFor`, `invoiceEmailFor` and
   `Invoice.invoiceEmail` (21), whether 21's `defaultInvoiceEmailFor` already reads the hospital and
   rooms contact emails from 17, whether 21's `invoiceEmailFor` applies the Booking's invoice email
   override to every party's invoice (item 4 narrows it to the Booking's billable party), and how
   `funderOverride` survived 20 and 21 (it should be untouched). Also note where 16 stored
   `invoiceNumber` and `reference` on the Xero records, that 16's count is `bctisFor` over
   `bctiRecords` and what `bctiRecords` reads (planned: one record per procedure ACCPAY), how 16
   shows the AA fee invoice (it is exempt here), which List holds 21's guardian Booking (Grace Park),
   that 14's PWA "Office authorises this List" body is `authoriseAsSimulatedOffice`, and the current
   `PERSIST_VERSION` (13 at the snapshot; 14 to 21 will have bumped it).
5. Pick the seeded nib Booking for the Full / Split demo (work item 9): a Booking on nib's standard
   Contract, on a submitted, unauthorised List that no scripted beat uses. At the snapshot only six
   Lists are seeded SUBMITTED (`morrisonMon20`, `whitakerFri17`, the two S3 Souter Lists,
   `billingFailure` and `integrationLocked`), and the generated filler nib Bookings sit on past Lists
   that stay DRAFT, so expect none to exist: seed a dedicated one (work item 9) rather than relying
   on an RNG-drawn filler. Also check how the GST-inclusive Contract's invoice is reached: the Doyle
   Booking (`SEED_MARKERS.bariatricType3Card`, Dr Fitzgerald's Tue 14 Jul List) is not on a SUBMITTED
   List at the snapshot.
6. Record the result (changed items, OQ status, what the earlier phases left) in the PROGRESS entry.

## Reference

**Design (convention 17).** No mockup covers the invoice document, the Invoices list, the Contract
sheet or the Xero simulation, so extend the existing screens' own patterns and
[Design Language.dc.html](../../../design/Design%20Language.dc.html): teal `#0D6E63` for Resend and
Send; pill radius 999 on semantic tokens for delivery states (success tint for Emailed, neutral for
Queued for portal and Not sent, warning tint for No invoice email), never the six schedule status
colours; Spline Sans Mono with tabular-nums for every amount, share, GST number and invoice number.
Crimson stays identity only: the AA logo moves into the invoice's agent block (still identity), and
nothing new is crimson. [Admin Review.dc.html](../../../design/Admin%20Review.dc.html) is the layout
for the authorise banner and action bar whose copy changes. The 2026-07-28 invoice workspace
decision (760px document, 264px sticky rail) stands.

**Catalogue.** The covered items above, plus
[US-08.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.1.md) (two layouts),
[US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md) (prices held GST exclusive, inclusive derived),
[US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md) (the direct insurer, its portal, and the split now on the Contract),
[US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md) (billable party and invoice email override; Open on OQ-67),
[US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md) (unique numbers, `-P`),
[FT-08.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.2.md) (one invoice per billable party),
[FT-09.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-09.1.md) (the ledger pair mirrored to Xero),
[OQ-42](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-42.md) (each BCTI the same value as its receivable), and
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md) (the Contract table rows named above and the Internal ledger bullets).
The evidence is [notes/2026-10-01-aa-meeting-with-greg.md](../../../discovery-reference/Updated%20Requirements/catalogue/notes/2026-10-01-aa-meeting-with-greg.md)
#12, #18, #37, #41, #54 and #58. The catalogue screenshots for US-08.2.3 (nib and St George's),
US-08.4.2 (ready, emailed, portal) and US-09.1.4 (the fee panel) show the July UI; grade against
the text.

**Analysis.**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary theme 3 (Contract replaces the billing route, which
  includes the payment setting) and theme 7 (Money model: ledger, AA fee, corrections, which includes
  the BCTI), the Uncertainty bullets on OQ-67 and OQ-68 and on OQ-29, the DM-27 and DM-28 rows, and
  the EP-04, EP-08 and EP-09 tables. Per-gap detail: [epics/EP-08.md](../epics/EP-08.md) (header note,
  and US-08.2.3, US-08.4.2, FT-08.4, US-08.4.5), [epics/EP-04.md](../epics/EP-04.md) (US-04.2.8,
  US-04.2.12), [epics/EP-09.md](../epics/EP-09.md) (US-09.1.4).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-27, DM-28, and DM-22 for the
  BCTI cardinality note.
- [analysis/prototype-map-domain.md](../analysis/prototype-map-domain.md) (`Invoice`, `BillingLine`,
  `Anaesthetist`, `invoiceBuild.ts`), [prototype-map-store-seed.md](../analysis/prototype-map-store-seed.md)
  (`billingRun.ts`, `billingLineActions.ts`, `mastersActions.ts`, seed cast and cards),
  [prototype-map-admin.md](../analysis/prototype-map-admin.md) (Invoices screen, InvoiceDocument,
  Master data), [prototype-map-shared.md](../analysis/prototype-map-shared.md) (`OfficeBillingSetup`,
  `BillingLinesCard`, `FunderAllocationSheet`), [prototype-map-shell-demo-pwa.md](../analysis/prototype-map-shell-demo-pwa.md)
  (Xero simulation, DemoBadge uses, PWA purity).

**PROGRESS.md.** Binding conventions 4, 5, 7, 8, 9, 13, 17 and 18. Decisions log: **2026-07-22
fifth external review #4** (`BillingLine.funderOverride` and the conservation rule, superseded),
**2026-07-23 Phase 08 build decisions** (2) layout by counterparty kind and (4) the GST caption,
both superseded, and Phase 08 work item 2's "Email invoice = mark emailed-at", **2026-07-28 Invoice
preview centred with a sticky information rail** (kept; its Email control becomes Resend), and the
handoff item **P3 GST per-invoice rounding on funder splits** (still true of split payments).

**Code entry points** (paths under `aa-prototype/src/`, names as at the snapshot; use the Booking
names 15 gave them and the shapes 16 and 18 to 21 left).
- Types, `domain/types.ts`: `Anaesthetist` (~141, no GST number), `Contract` (~216, reshaped by 18),
  `PrepaymentDetail` (~427, the prepayment's own `'full' | 'split'`, a different concept: do not
  reuse or rename it), `BillingLine.funderOverride` (~512-530), `Invoice` (~662: `layout`, `kind`,
  `emailedAtISO`, 21's `invoiceEmail`), `InvoiceLine` (~678), `XeroAccPay` (~780, reshaped by 16).
- Pure billing: `domain/billing/invoiceBuild.ts` (`GST_RATE` ~39, `layoutFor` ~216, the
  `funderOverride` branch ~329-370, `prepaidFunderOverride` ~300, grouping in
  `buildInvoicesForCard` ~264, `buildPrePaymentInvoiceForCard` ~456), `domain/billing/fee.ts`
  (`FeeLine.funderOverride` ~143, ~248), `domain/billing/validateCardForBilling.ts` (the conservation
  branch ~248), the billing index; 21's `domain/billing/billableParty.ts`; 16's BCTI count function.
- Store: `store/billingRun.ts` (`runBillingForList` invoice build ~182-230, `retryBillingCase`
  ~336-362, `markInvoiceEmailed` ~398), `store/prepaymentActions.ts` (`raisePreProcedureInvoice`
  ~53-130), `store/billingLineActions.ts` (`setBillingLineAllocation` ~138,
  `setProcedureFunderAllocation` ~218, `FunderAllocationEntry`, the remove guard ~311),
  `store/cardActions.ts` (~503 guard), `store/xeroHandoff.ts` (`handoffCase` ACCPAY ~199-234),
  `store/mastersActions.ts` (`editAnaesthetist` ~185, `addAnaesthetist` ~241, `createHospital` ~45
  and `setInsurerDirectClaims` ~102, which mint the default Contracts through the local builder
  ~28), `store/contractActions.ts` (`createContract` ~53, `editContract` ~106, as reshaped by 18),
  `store/selectors.ts` (monitor `emailed` stage ~503-528, `MonitorListRow.emailedCount` ~415,
  `prePaidByProcedure` ~345), `store/index.ts` exports.
- PWA: `pwa/officeSimulation.ts` (the "Play the office" auto-authorise, RV-22, kept: it calls
  `authoriseList` then `runBillingForList` ~144, so it sends too) with `pwa/officeSimulation.test.ts`,
  and wherever 14 put its "Office authorises this List" trigger body.
- AA fee invoices (16): `AaFeeInvoice`, `billing.aaFeeInvoices`, `XeroAccRec.kind: 'aaFee'`, and
  their Admin and Xero views. They are AA's own invoices and are exempt from this phase (16's
  handoff).
- Seed: `domain/seed/cast.ts` (14 anaesthetists), `domain/seed/contracts.ts` (`CONTRACT` ids,
  `defaultType1`, `nibDefault` `CT-NIB-D1` ~54, or 18's renames), `domain/seed/cards.ts` (Prentice
  two-funder Booking ~586-618 on Souter Mon 20 PM; filler nib Bookings ~1150), `domain/seed/history.ts`
  (historical invoices ~240-275 and ACCPAYs), `domain/seed/billing.ts` (seeded prepayment invoice
  ~170-205), `domain/seed/audit.ts` (~139 `funderOverride`), `domain/seed/index.ts`
  (`SEED_MARKERS.twoFunderCard` ~564), `domain/seed/seed.test.ts` (~259, ~366).
- UI: `apps/admin/screens/InvoiceDocument.tsx` (masthead ~100-145, GST caption ~216, rail
  `InvoiceInfoRail` ~225-320), `apps/admin/screens/InvoicesScreen.tsx` (Layout and Status columns
  ~210-220), `apps/admin/screens/BillingMonitorScreen.tsx` (stage strip), `apps/admin/screens/ReviewScreen.tsx`
  (authorise banner), `apps/admin/screens/MasterData.tsx`, `apps/admin/flows/ContractEditSheet.tsx`,
  `apps/admin/flows/EditAnaesthetistSheet.tsx`, `apps/admin/flows/AddAnaesthetistFlow.tsx`,
  `shared/card/OfficeBillingSetup.tsx` (Funders row ~46, ~78-91), `shared/capture/BillingLinesCard.tsx`
  (~91-103), `shared/flows/FunderAllocationSheet.tsx` and `shared/flows/index.ts`,
  `shared/audit/fieldLabels.ts` (~132 `funderOverride`, ~146 `emailedAtISO`) and `actionLabels.ts`,
  `apps/demo/DemoXero.tsx` (`AccPayCard` ~456), `apps/demo/xeroPairView.ts`,
  `apps/demo/DemoControlPanel.tsx` (S3 scenario text ~395-410).
- Tests that pin today's behaviour: `domain/billing/invoiceBuild.test.ts` (~293, ~379),
  `domain/billing/prePaymentInvoice.test.ts` (~194), `domain/billing/validateCardForBilling.test.ts`
  (~260), `store/billingRun.test.ts` (~244-300, ~411, ~455-492), `store/phase06Actions.test.ts`
  (~120-195), `store/captureActions.test.ts` (~267, ~423), `store/demoScenarios.test.ts` (~85-105),
  `shared/audit/auditNarrative.test.ts` (~125), `visual/admin-phase08.spec.ts` (~142, ~176-201,
  ~359-405), `visual/xero-pair.spec.ts`; and 16's BCTI count tests, which must stay green unchanged.

## Work items

1. **Model** (`domain/types.ts`). DM-27 and DM-28.
   - `Anaesthetist.gstNumber: string`, required, so the compiler finds every creator. US-08.4.5
     ("with the anaesthetist's GST number").
   - `ContractInvoicing`: `{ invoiceLayout: 'contractHolder' | 'patient'; deliveryMethod: 'email' |
     'portal' | 'none'; portalName?: string; gstTreatment: 'exclusive' | 'inclusive' }`, and
     `Contract.invoicing: ContractInvoicing`, required. The field names are the domain model's
     Contract table rows (`invoiceLayout`, `deliveryMethod`, `gstTreatment`), which Phase 25's lock
     copies as `presentation`. `gstTreatment` is how the invoice presents GST; the stored amounts
     stay GST exclusive either way (US-05.2.7), so the totals never differ. US-04.2.8.
   - **Payment setting** (the domain model's `paymentSetting`, `FULL` or `SPLIT`):
     `Contract.paymentSetting: 'full' | 'split'`, required, and `Contract.defaultSplitShare?:
     SplitShare`, present exactly when the setting is `split`. `SplitShare = { kind: 'amount';
     amountExGst: number } | { kind: 'percent'; percent: number }` is **the holder's share**; the
     Booking's billable party pays the rest. US-04.2.12.
   - `Booking.splitShares?: Partial<Record<ProcedureId, SplitShare>>`: the office's typed share for
     a Procedure on a split Contract (OQ-68's "set on the Booking, defaulting from the Contract").
     Keyed by Procedure because a Booking can hold several Procedures on different Contracts; Phase
     23 re-keys it if Booking-level pricing moves the priced line. Absent means use the Contract's
     default. Ignored while the Contract is `full`.
   - On `Invoice`:
     - `procedureIds: ProcedureId[]` (the Procedure links, in Booking order);
     - `supplier: { anaesthetistId; name; gstNumber }` and `agent: { name; gstNumber }`, snapshots
       taken at the run;
     - `gstTreatment` (snapshot of the Contract's);
     - `portion?: 'holderShare' | 'remainder'` (set only on the two halves of a split);
     - `lineage?: { role: 'balanceOfPrepayment' | 'remainderOfSplit'; invoiceId: InvoiceId }[]`
       (Phase 39 adds credit and additional roles; Phase 27 may add the balance kind);
     - `delivery: InvoiceDelivery`, a discriminated union:
       `{ method: 'email'; status: 'sent'; sentAtISO; sends: { atISO; to; by }[] }`,
       `{ method: 'email'; status: 'noAddress' }`,
       `{ method: 'portal'; status: 'queued'; portalName; queuedAtISO }`,
       `{ method: 'none'; status: 'notSent' }`.
     - The recipient address is 21's `invoiceEmail` snapshot (DM-27's "recipientEmail"); do not add
       a second copy.
     - Remove `emailedAtISO`.
   - Remove `BillingLine.funderOverride` (and `FeeLine.funderOverride` in `fee.ts`).
   - On `XeroAccPay`: `taxInvoice: BuyerCreatedTaxInvoice` = `{ kind: 'buyerCreated'; documentName;
     wording; supplierName; supplierGstNumber; agentName; agentGstNumber; relatesToInvoiceNumber;
     provisional: true }`, required. One per ACCPAY, so one per receivable invoice. US-09.1.4.
2. **Pure presentation rules** in a new `src/domain/billing/invoicePresentation.ts`, re-exported from
   the billing index, all Vitest-covered (convention 9):
   - `AA_AGENT`: `{ name: 'Anaesthesia Associates Limited', gstNumber }` with a synthetic GST number;
     `BCTI_DOCUMENT_NAME = 'Buyer-created tax invoice'` (IRD has renamed it, new name unknown: this
     constant is the only place the name lives); and `OQ29_CAPTION`, the one provisional caption from
     the drift check. The only place any of them lives.
   - `GST_RATE` moves here from `invoiceBuild.ts` (15%, the NZ standard rate; no longer described as
     an assumption, since US-05.2.7 makes GST-exclusive storage the rule). Update its importers
     (`seed/history.ts`, `store/paymentActions.ts`, `InvoiceDocument`, `invoiceBuild.test.ts`, and
     anything 16 added for the AA fee GST).
   - `isValidGstNumber(value)` (8 or 9 digits once spaces and hyphens are stripped) and
     `formatGstNumber` (`NN-NNN-NNN` or `NNN-NNN-NNN`). Format only, no IRD check digit.
   - `supplierFor(anaesthetist)`.
   - `invoiceLayoutFor(contract, party, portion)`: the Contract's `invoiceLayout` when the invoice
     goes to the Contract's own default party (its holder, or the patient on a patient-direct
     Contract) and is not a split remainder; otherwise the recipient's class (a person party gets the
     patient layout, an organisation the contract-holder layout). A remainder invoice to the patient
     is always the patient layout. US-04.2.8 with US-11.2.2 (a Booking override can send a
     patient-direct Contract's invoice to a hospital).
   - `deliveryPlanFor(contract, party, portion, invoiceEmail)`: `portal` only when the Contract's
     `deliveryMethod` is portal and the invoice goes to the holder (never a split remainder); `none`
     when the Contract says none; otherwise `email` to `invoiceEmail`, or `noAddress` when it is
     empty. Returns the plan, not a stamped state, so the run stamps the time. US-08.4.2 ("where the
     Contract instead specifies portal upload, the engine queues the invoice").
   - `presentGstLines(lines, subtotal, gst, treatment)`: for `exclusive`, the lines as stored plus
     Subtotal, GST and Total; for `inclusive`, each line shown GST inclusive with the invoice's GST
     allocated across lines by largest remainder, so the shown lines sum to the stored total to the
     cent, and a "Total includes GST of $x" footer. Negative lines (the prepayment deduction and the
     split's "Less paid by" line) allocate with their sign.
   - `buyerCreatedTaxInvoiceFor(invoice, accPayNumber)`: the ACCPAY snapshot. Wording (dash-free):
     "{BCTI_DOCUMENT_NAME}. Raised by Anaesthesia Associates Limited, GST {aa}, as agent, on behalf
     of the supplier {name}, GST {number}, for services invoiced on {invoiceNumber}."
   - Tests: layout for holder, patient-direct, a hospital override on a patient-direct Contract and a
     remainder; delivery for portal holder, portal Contract with a remainder invoice (email), none,
     email with and without an address; inclusive allocation sums to the total for 1, 2 and 7 lines,
     with a negative deduction line, and is identical on repeat; GST number validation and
     formatting; the wording has no en or em dash, names both GST numbers and uses
     `BCTI_DOCUMENT_NAME`.
3. **Pure split** in a new `src/domain/billing/splitShare.ts` (the one home of OQ-68's basis):
   - `OQ68_CAPTION`: "The split basis is provisional until AA confirms it: the office types the
     holder's share in $ or %, and the billable party pays the rest."
   - `parseSplitShare(text)`: "$132.50" or "132.50" is an amount ex GST, "62.5%" a percent; returns
     the share or a reason ("Type an amount such as $48 or a percentage such as 48%."). A bare
     number reads as dollars (labelled reading, test-pinned).
   - `validateSplitShare(share)`: refuses a non-positive amount, or a percent outside 0 to 100
     exclusive, with a reason (the Contract editor and the Booking field show the same message).
   - `splitFee(feeExGst, share)` returns `{ holderShare, remainder }` in cents-exact dollars: an
     amount pays `min(amountExGst, fee)`; a percent pays `roundToCents(fee * percent / 100)`;
     `remainder = fee - holderShare`. Two parties, so the shares total 100% by construction.
   - `effectiveSplitShareFor(booking, procedureId, contract)`: `undefined` when the Contract is
     `full`; otherwise `{ share, source: 'booking' | 'contract' }`, the Booking's typed share else the
     Contract's default.
   - `splitShareLabel(share)`: "$132.50" or "62.5%".
   - Tests: Prentice (`$212.00` with amount `$132.50` gives `132.50 / 79.50`); 60% of $212.00 gives
     `127.20 / 84.80`; a fee under the typed amount gives a zero remainder; 62.5% of $212.00 gives the
     Prentice split; odd cents conserve (`holderShare + remainder === fee` over a sweep of fees and
     percents); invalid shares refuse; the parser for "$48", "48", "48%", "48.5 %", "" and "abc"; a
     `full` Contract ignores a stored Booking share; the Booking share beats the Contract default.
4. **Invoice build uses the Contract** (`invoiceBuild.ts`, the post-15 Booking builder):
   - Drop the whole `funderOverride` branch, `allocationStale` and the conservation re-check.
   - **Full** (the default for every Contract): unchanged from 21, the whole line to the
     Procedure's billable party (21's `billablePartyForProcedure`).
   - **Split**: take `effectiveSplitShareFor`, split the Procedure's final fee (after any office
     override) with `splitFee`:
     - **Holder's share** to the Contract's **holder**, always (it is the holder's commitment under
       the Contract, so a Booking billable-party override never moves it). One line: "{description},
       {holder}'s share under {Contract} ({splitShareLabel}, fee ${fee})". Its invoice email is the
       holder's own (21's `defaultInvoiceEmailFor(holder)`), never the Booking's invoice email
       override: that override belongs to the Booking's billable party (the domain model's "Invoice
       email belongs to the billable party"), so a guardian's address can never reach a hospital's
       share. Generally, the Booking's invoice email override applies only to the invoice addressed to
       the Booking's effective billable party; narrow 21's `invoiceEmailFor` if it does not already.
     - **Remainder** to the Booking's **billable party** override if set, else the patient (the
       catalogue's "the patient for the gap"). The remainder invoice itemises the full fee lines as
       usual, then a visible deduction line "Less paid by {holder}" for the holder's share, so the
       patient sees the whole calculation (the same pattern as the prepayment deduction).
     - A zero remainder raises no remainder invoice.
     - If the Booking override names the holder itself, both halves group into one invoice to it
       (FT-08.2's one invoice per party), with no `portion` and no lineage (labelled reading,
       test-pinned).
     - Change 21's `defaultBillablePartyFor` so a split Contract's default party is the patient
       (the holder already takes its share); keep the override rule unchanged.
   - `prepaidFunderOverride` becomes `prepaidSplit` (a prepaid Procedure on a split Contract fails
     to review, message reworded). Phase 27 decides how a prepayment meets a split (OQ-73: a
     prepayment is only for a paying patient).
   - Each `DraftInvoice` carries `contractId` (of its first Procedure in Booking order),
     `procedureIds`, `portion` and `lineage` hints (a remainder draft points at its holder-share
     sibling by index; the run resolves ids). Grouping stays one invoice per distinct party per
     Booking (FT-08.2, 21's rule). The holder-share draft is emitted before its remainder draft, so
     numbering is holder then remainder. A party's invoice that spans Procedures on Contracts with
     different invoicing settings takes the first Procedure's (labelled reading, test-pinned).
   - `layoutFor(counterparty)` is deleted; drafts use `invoiceLayoutFor`.
   - **One BCTI per receivable invoice.** Each draft becomes one invoice and so one ACCPAY at
     handoff. Do not split payables per Procedure and do not touch 16's count function.
   - Tests: the Prentice reproduction at domain level ($132.50 to nib, $79.50 to the override, then
     $152.38 and $91.43 after GST); the remainder to the patient when there is no override; the
     Contract default used when the Booking has no share; a share at or above the fee gives one
     invoice; an office price override splits on the overridden fee; a `full` Contract gives one
     invoice to the billable party; override equals holder gives one grouped invoice; a Booking
     invoice email override reaches the remainder invoice and not the holder-share invoice; prepaid
     plus split fails; layout and delivery come from the Contract; a mixed-Contract group takes the first
     Procedure's settings; the retired branch's tests in `invoiceBuild.test.ts` and
     `prePaymentInvoice.test.ts` are rewritten, not skipped.
5. **Remove `funderOverride` everywhere; add the Booking share action** (retired behaviour, replaced
   by item 4):
   - `store/billingLineActions.ts`: delete `setBillingLineAllocation`, `setProcedureFunderAllocation`,
     `FunderAllocationEntry` and the `allocationNotConserved` refusals; the anaesthetist remove guard
     (~311) and `cardActions.ts` (~503) lose their funder clause. Remove the exports from
     `store/index.ts`.
   - New `setBookingSplitShare(api, actor, bookingId, procedureId, share | null)` (in the Booking
     actions 15 named), through `mutate()`: office only (anaesthetist screens stay free of Contract
     complexity, US-15.0.1); refuses `contractNotSplit` ("This Contract bills one party in full.") and
     an invalid share with `validateSplitShare`'s reason; `null` returns to the Contract's default;
     refused once the List is authorised (21's lifecycle guard). Audit `booking.splitShare` (before,
     after). Export from `store/index.ts`.
   - `validateCardForBilling.ts`: delete the conservation branch.
   - `shared/flows/FunderAllocationSheet.tsx`: delete, with its export. `OfficeBillingSetup`: the
     Funders row goes; a **Split** row appears only on a Procedure whose Contract is `split`:
     "{holder} pays {share} · rest to {party}", amounts from `splitFee` on the current fee, with an
     inline text field (placeholder "$ or %") parsed by `parseSplitShare`, a "From the Contract" hint
     when defaulted, a "Use the Contract's share" link when typed, and the "Provisional (OQ-68)" pill.
     Office only.
   - `BillingLinesCard`: the "Billed to" chip and its remove-hiding go.
   - `fieldLabels.ts`, `auditNarrative.test.ts`, `seed/audit.ts`: drop `funderOverride`; add
     `splitShares` ("Split share").
   - Tests: rewrite `phase06Actions.test.ts` (the allocation blocks go; `setBookingSplitShare`
     rights, refusals, reset to default and audit come in), `captureActions.test.ts` (~267, ~423) and
     `billingRun.test.ts` (~259-300, ~455-492: the "rerouting to the patient" cases become "set the
     billable party to the patient", the stale-allocation case goes).
   - Grep `src` and `visual` for `funderOverride|FunderAllocation|allocationNotConserved|allocationStale|Funder allocation`:
     zero hits.
6. **The run sends each invoice** (`store/billingRun.ts`, `store/prepaymentActions.ts`):
   - Extract one store helper, `materialiseInvoices(state-in-mutate, drafts, bookingId, atISO,
     counters)`, used by `runBillingForList`, `retryBillingCase` and `raisePreProcedureInvoice`, so
     the three paths cannot drift. It allocates ids and numbers, builds each `Invoice` with
     `supplier` (from the List's anaesthetist), `agent` (`AA_AGENT`), `gstTreatment`, `procedureIds`,
     `portion`, `lineage` (a remainder invoice links its holder-share sibling; a post-prepayment
     balance invoice links the prepayment invoice(s) it nets, found through `prePaidByProcedure`,
     which gains the invoice id), 21's `invoiceEmail`, and **stamps `delivery` from
     `deliveryPlanFor` at the run's clock time**, in the same `mutate()` as the invoices. Keep the
     stamping a separate step inside the helper (for example a `send` option, always true here), so
     Phase 27 can raise the generated prepayment invoice unsent and send it on admin approval (owner
     decision D6) without a second materialiser. Today the office raises the prepayment invoice
     itself, so sending at raise is the approval for now.
   - Audit, per invoice, source system, actor "Billing run": `invoice.sent` (after: `to`, `atISO`),
     `invoice.portalQueued` (after: `portalName`), `invoice.notSent` (after: `reason: 'noAddress' |
     'deliveryNone'`). The `list.billed` audit gains `sentCount`, `queuedCount`, `notSentCount`.
   - A missing address never fails the run or the Booking (OQ-05's per-Booking failure is about a
     failed billable party, not a send): the invoice is raised with `delivery.status: 'noAddress'`
     and shows in the monitor (item 11).
   - Replace `markInvoiceEmailed` with `resendInvoice(api, actor, invoiceId, { to? })`:
     office only; email delivery appends a send (to `to` if given, which must pass the invoice email
     shape check from 21, else to the snapshot address) and moves `noAddress` to `sent`; `none`
     becomes a manual email send once an address is given; `portal` refuses with `portalDelivery`
     ("This invoice is queued for the {portal} upload portal."). Audit `invoice.resend`, source
     office. Update `store/index.ts`.
   - Selectors: the monitor's `emailed` stage becomes **"Sent or queued"**: done when every standard
     invoice is `sent` or `queued`, partial when any is `noAddress`, detail "3 emailed, 1 queued for
     portal, 1 needs an address." `MonitorListRow.emailedCount` becomes `deliveredCount` and
     `noAddressCount`. Add `invoiceDeliveryLabel(invoice)` (pure, in `invoicePresentation.ts`):
     "Emailed to {to} {hh:mm}", "Queued for {portal} portal", "No invoice email", "Not sent".
   - AA fee invoices (16's `AaFeeInvoice`) do not go through the materialiser and gain no
     `supplier`, `agent` or `delivery`: they are AA's own invoices in AA's name.
   - Tests: every invoice from an authorised List is stamped at the clock time; the three audit
     actions and counts; `noAddress` raises the invoice; retry and prepayment raise stamp delivery
     too; lineage links resolve to real invoice ids; a guardian-billed Booking (21's Grace Park) is
     emailed to the guardian's address, not the patient's (US-08.4.2); `resendInvoice` rights, the
     portal refusal, the `noAddress` recovery and idempotent send history; PWA "Office authorises
     this List" (14) and the kept "Play the office" auto-authorise (`officeSimulation.test.ts`) run
     the same send (store-level tests calling their bodies); an AA fee run is unchanged.
7. **Xero: the buyer-created ACCPAY** (`store/xeroHandoff.ts`, `apps/demo/xeroPairView.ts`):
   - `handoffCase` stores `taxInvoice = buyerCreatedTaxInvoiceFor(invoice, accPayNumber)` on the
     ACCPAY (16's `-P` number) and adds `taxInvoiceProvisional: true` to the `xero.pairCreated` audit.
     The ACCPAY's amount stays the receivable's total (16), so each split half has its own BCTI of
     the same value.
   - `xeroPairView` passes `taxInvoice` through; no view-time derivation.
   - Tests: the snapshot names the invoice's supplier and AA; it survives a later GST number edit
     (snapshot, not a lookup); both Prentice ACCPAYs carry their own `taxInvoice` and equal their
     receivables ($152.38 and $91.43); 16's `bctisFor` over `bctiRecords`, unchanged, counts them as two and its
     own tests pass untouched; `store/xeroNhi.test.ts` still passes (no NHI and no patient name in the
     wording, OQ-30). US-09.1.4.
8. **Masters and their actions** (`store/mastersActions.ts`, `store/contractActions.ts`):
   - `editAnaesthetist` gains `gstNumber` (refuses an invalid one: "Enter a GST number of 8 or 9
     digits."); `addAnaesthetist` requires it. Audit field label "GST number".
   - `createContract` and `editContract` (`store/contractActions.ts`, as 18 reshaped them) gain
     `invoicing`, `paymentSetting` and `defaultSplitShare`, validated: `portal` only for an insurer
     holder that accepts direct claims (US-04.2.8: "portal upload for the direct insurer"), and needs
     a `portalName`; `split` only on a Contract with an organisation holder (a patient-direct Contract
     cannot split with itself), and not on an insurer holder that takes no direct claims (21 already
     bills the patient in full there, who claims from the insurer, US-11.4.2), and needs a
     `defaultSplitShare` that passes `validateSplitShare`; switching to `full` drops the default
     share. `setInsurerDirectClaims(false)` on an insurer switches its portal Contracts to email and
     its split Contracts to full, each audited, so no Contract is left invalid.
   - A pure `defaultInvoicingFor(holderKind, category)` gives new Contracts their settings: patient
     layout and email for a patient-direct Contract; contract-holder layout and portal for a
     direct-claims insurer; contract-holder layout and email otherwise; GST exclusive throughout.
     New Contracts default to `paymentSetting: 'full'`. `createHospital` and `setInsurerDirectClaims`
     use them for the default Contracts they create.
   - Tests for each validation and the defaults, and for `setInsurerDirectClaims(false)` on nib
     leaving `CT-NIB-SPLIT` full and email.
9. **Seed** (determinism, convention 5), then **bump `PERSIST_VERSION`** by one:
   - `cast.ts`: a deterministic, synthetic 9-digit GST number for all 14 anaesthetists (derived
     from the seeded RNG or the registration number, labelled synthetic in a comment); Dr Souter's
     is the one the demo guide quotes.
   - `contracts.ts`: `invoicing` and `paymentSetting: 'full'` on every Contract via the defaults; the
     nib Contracts `portal` with `portalName: 'nib provider'`; one published fixed-schedule Contract
     (the Doyle bariatric schedule, or whichever 18 seeded as a GST-inclusive schedule) set to
     `inclusive`, so the inclusive presentation is demoable off the scripted beats. It must govern a
     Booking that can be authorised after a reset: if none sits on a SUBMITTED, unscripted List
     (drift check step 5), seed one on the same spare List as the `nibFullBooking` below, and record
     it as `SEED_MARKERS.gstInclusiveBooking`.
   - A new **nib split** Contract (id `CT-NIB-SPLIT`, name "nib split payment (demo)", with 18's
     `aaCode`): holder nib, category Insurance, scope insurer nib, RVG units at the anaesthetist's
     rate, `paymentSetting: 'split'`, `defaultSplitShare: { kind: 'percent', percent: 60 }`, portal
     delivery, contract-holder layout. It declares the same required inputs 21 gave the nib
     Insurance Contract (insurer member number).
   - `cards.ts` Prentice (Souter Mon 20 PM): the two stored lines go; the Procedure's Contract
     becomes `CT-NIB-SPLIT`; the Booking carries the nib member number the Contract requires (21's
     input; no insurer field on the Booking, D2); the Booking's `splitShares` holds `{ kind:
     'amount', amountExGst: 132.5 }` for the Procedure and its `billableParty` is St George's
     hospital, both set by the office (seeded `booking.splitShare` and billable party audit
     entries), so nib's share and the remainder to St George's are as today. The fee is still 8
     units x $26.50 = $212.00. The Procedure description "Knee arthroscopy, funding split with nib"
     becomes "Knee arthroscopy", the seed comment above it is rewritten, and the
     `scenario.twoFunder` key becomes `splitPayment`.
   - The **Full / Split demo Booking** picked at the drift check (a nib Booking on nib's standard
     Contract, on a submitted, unauthorised, unscripted List). If none exists, seed a dedicated,
     completed one with fixed times (not an RNG-drawn filler) on a past spare List that `index.ts`
     marks SUBMITTED, recorded in `SEED_LIST_IDS` and kept out of S1 to S5. Record the Booking as
     `SEED_MARKERS.nibFullBooking`. It carries every input 21 requires for nib's Contract (the member
     number) so it completes, and its patient has a seeded email so a switched remainder is emailed.
   - `history.ts` and `billing.ts`: every seeded invoice gets `procedureIds`, `supplier`, `agent`,
     `gstTreatment` and a `delivery` stamped at its `raisedAtISO` (email to the party's seeded
     address, or portal for nib); every seeded ACCPAY gets its `taxInvoice`.
   - `index.ts`: `SEED_MARKERS.twoFunderCard` becomes `splitPaymentBooking` ("One procedure, nib's
     share and the rest"); update every reference.
   - Tests (`seed.test.ts`, `demoScenarios.test.ts`): two builds deep-equal; every anaesthetist's
     GST number is valid and unique; every Contract has `invoicing` and a `paymentSetting`, and only
     `CT-NIB-SPLIT` is `split`; no seeded line carries a funder; `authoriseList` on both S3 Lists
     raises **AA-2026-0002 Brian Holt Forte Health $396.18**, **AA-2026-0005 Alan Prentice nib
     $152.38 (queued for portal)** and **AA-2026-0006 Alan Prentice St George's $91.43 (emailed)**,
     with every S3 invoice `sent` or `queued` and none `noAddress`; clearing Prentice's typed share
     gives $146.28 and $97.52 (60%); switching nib's standard Contract to split at 60% gives the
     `nibFullBooking` two invoices, and back to full one; authorising the List holding the
     GST-inclusive Booking succeeds and its invoice has `gstTreatment: 'inclusive'`.
   - Re-green `npm run build`, `npm run build:pwa` and `npx vitest run` here (the stop point).
10. **Admin invoice document** (`apps/admin/screens/InvoiceDocument.tsx`). US-08.4.5, US-08.4.1,
    US-04.2.8, US-08.2.3.
    - **Masthead:** the supplier on the left: the anaesthetist's name (from `invoice.supplier`, not
      the live master), "GST number {formatted}" in mono. On the right: "TAX INVOICE" and the number.
    - **Agent block**, beneath the addressee: the small AA `Logo` with "Issued by Anaesthesia
      Associates Limited as agent for {supplier}. AA GST number {aa}." and the "Provisional (OQ-29)"
      pill with `OQ29_CAPTION`. The old italic agency line goes (`data-shot` `invoice-agency-line`
      moves to the block).
    - **Addressee:** the party, "Attn: Accounts" on the contract-holder layout, and 21's invoice
      email in small mono.
    - **Lines and totals** from `presentGstLines`: exclusive shows Subtotal, "GST (15%)", Total due;
      inclusive shows GST-inclusive lines and "Total due, includes GST of $x". The old "GST ... is a
      demo assumption" footer goes.
    - **Split note:** a holder-share invoice reads "nib's share ($132.50) of a fee of $212.00 under
      nib split payment. The rest is invoiced separately." with a link to the remainder invoice; a
      remainder invoice reads "{holder} pays ${share} of this fee under {Contract}." with a link to
      the holder-share invoice. The split itself is unlabelled (OQ-23 answered); the share carries
      the "Provisional (OQ-68)" pill.
    - **Rail, Delivery card** from `invoice.delivery`: Emailed to {to} at {time} (success, DemoBadge
      "Simulated send", with the send history when resent); Queued for {portal} portal (neutral,
      DemoBadge "Simulated portal queue"); No invoice email (warning, an inline email field and a
      teal **Send**); Not sent (neutral, with **Send** once an address is typed). A secondary
      **Resend** on sent email invoices; Print stays. No Email invoice button anywhere.
    - **Rail, Related invoices** card when `lineage` is present (the split's two halves, the
      prepayment invoice a balance nets).
    - `data-shot` hooks: `invoice-supplier`, `invoice-agent-block`, `invoice-delivery`,
      `invoice-split-note`.
    - AA fee invoices (16) keep AA's own masthead and wording: no supplier block, no agent block,
      no OQ-29 pill, no Delivery card.
11. **Invoices list, Billing monitor and Review banner.**
    - `InvoicesScreen.tsx`: the Status column becomes **Delivery** (pills from
      `invoiceDeliveryLabel`: Emailed, Queued for portal, No invoice email, Not sent), Layout reads
      the snapshot, and the Counterparty cell gains a small "Share" or "Rest" chip on split halves.
      Keep the table's min width. `data-shot` `invoice-list-delivery`. FT-08.4 ("with layout and
      delivery status").
    - `BillingMonitorScreen.tsx`: the stage strip shows "Sent or queued" with item 6's detail, and a
      row with `noAddressCount > 0` links to its first such invoice.
    - `ReviewScreen.tsx`: the post-authorise banner reads "{n} invoices raised. {e} emailed, {q}
      queued for portal." (plus "{m} need an invoice email." when any).
12. **Master data** (`MasterData.tsx`, `ContractEditSheet.tsx`, `EditAnaesthetistSheet.tsx`,
    `AddAnaesthetistFlow.tsx`). US-04.2.8, US-04.2.12.
    - The Contract sheet gains an **Invoicing** section: Layout (segmented: Contract holder,
      Patient), Delivery (segmented: Email, Portal upload, None; Portal disabled with the reason unless
      the holder is a direct-claims insurer; a Portal name field), GST on invoices (segmented: Plus
      GST, GST inclusive, with the caption "Prices are held GST exclusive; this only changes how the
      invoice shows GST.").
    - A **Payment** section: segmented **Full payment** / **Split**, with the caption "Full: the
      billable party pays the whole fee. Split: {holder} is invoiced its share and the Booking's
      billable party the rest, as two invoices." Under Split, a "Default share for {holder}" field
      taking $ or % (`parseSplitShare`) with the caption "The office can type a different share on
      the Booking." and the "Provisional (OQ-68)" pill on the share field only. Split is disabled with
      its reason on patient-direct Contracts.
    - The Contracts table gains Delivery and Payment columns (text, not pills: "Full", "Split, 60%").
    - The Anaesthetists table gains a mono **GST number** column; Edit and Add sheets gain the field.
13. **Xero simulation** (`apps/demo/DemoXero.tsx`, `AccPayCard`). US-09.1.4.
    - A **{BCTI_DOCUMENT_NAME}** block beneath the meta grid: the wording, then Supplier ({name},
      GST {number}) and Agent (Anaesthesia Associates Limited, GST {aa}) as `MetaItem`s, with the
      "Provisional (OQ-29)" pill and caption. `data-shot` `xero-accpay-buyer-created`.
    - The ACCPAY money-flow card copy gains "Held as a buyer-created tax invoice from the
      anaesthetist, one for each invoice and the same value." The old note that the RFP does not
      specify GST treatment goes (16 already removed the fee panel).
14. **Copy, labels and shots.**
    - `actionLabels.ts`: `invoice.sent` "Invoice emailed", `invoice.portalQueued` "Invoice queued for
      portal", `invoice.notSent` "Invoice not sent", `invoice.resend` "Invoice resent",
      `booking.splitShare` "Split share set"; remove `invoice.email`. `fieldLabels.ts`: `gstNumber`,
      `invoicing`, `paymentSetting`, `defaultSplitShare`, `splitShares`, `delivery`; remove
      `emailedAtISO` and `funderOverride`.
    - Sweep `src` for "Email invoice", "Upload portal", "Billed by Anaesthesia Associates as agent",
      "two-funder", "funder" in copy, "cover" used for the split, and the GST assumption caption:
      each is replaced or gone.
    - No en or em dashes in any new string.
    - Playwright: `visual/admin-phase08.spec.ts` (the agent text, no Email invoice button, the
      Delivery card says Emailed to the Forte address, the Prentice rows show Queued for portal and
      Emailed, the insurer rail has no Resend, the split note), `visual/xero-pair.spec.ts` (the
      buyer-created block), a Master data shot of the Invoicing and Payment sections, and an Office
      billing setup shot of the Split row on Prentice's Booking.
15. **Re-green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`.

## Demo triggers

This phase adds **no new harness-bar button**. The sends and the split are product behaviour, and
they become visible on existing product actions, as the gap analysis recommends:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| **Authorise for billing** (existing product action, not a trigger) | Admin Review (`/admin/review/:listId`) | Product UI | Runs the billing run, which now raises and sends every invoice: the banner counts emailed and queued, and each invoice's rail shows its delivery stamp |
| **Resend** / **Send** (existing rail, reworked; product office action) | Admin invoice (`/admin/invoices/:invoiceId`) | Product UI | `resendInvoice` on the invoice in the URL; single-invoice Resend stays on the rail |
| **Payment: Full / Split** (Contract editor, product admin action) | Admin Master data, Contracts (the Contract sheet) | Product UI | Switching nib's standard Contract to Split (default share typed, e.g. 60%) makes the `nibFullBooking` List's next authorise raise two invoices (nib's share, the rest to the patient); back to Full raises one |
| **Split share** field (product office action) | Admin Booking detail (`/admin/day/:dateISO/cards/:cardId` at the snapshot, under 15's Booking route name), Office billing setup | Product UI | `setBookingSplitShare` on the Booking in the URL: type "$132.50" or "62.5%", or return to the Contract's share |

**Re-pointed:** the Billing monitor's resolve-and-retry and the prepayment raise now send as they
raise. Phase 14's re-homed `billing-failure` trigger ("Trigger billing failure", Admin Billing
monitor) needs no change, but check its retried invoice is stamped.

**PWA equivalent:** none new. The mobile app has no invoice or Contract surface (the split share is
office only, US-15.0.1), and the only mobile beat that waits on the office here (authorising a List)
already has Phase 14's PWA-only **"Office authorises this List"**, which calls the same guarded
`authoriseList` and so runs the same sending run. The kept "Play the office" auto-authorise
(`pwa/officeSimulation.ts`, RV-22) also calls `runBillingForList`, so it sends too. Confirm both with
the store-level tests in item 6 and by checking Admin, Audit after a PWA authorise.

## Out of scope

- Real email or PDF generation, and the portal upload itself (who uploads and when, and an
  "uploaded" state). The queued state is where the engine's job ends in the demo; note it as a
  discovery question.
- A split between more than two parties, or a share list that must be entered to total 100 (OQ-68;
  the drift check says what to do if it is answered that way).
- One BCTI per Procedure (unresolved; ROADMAP "BCTI granularity") and a BCTI document separate from
  the ACCPAY record (left ambiguous at the meeting; built as the ACCPAY). Approving a period's BCTIs
  for payment (US-10.2.6) is Phase 39a's.
- Anaesthetist-facing GST number editing (the Phase 26 profile picks up `gstNumber`), any mobile or
  web view of invoice delivery, and any anaesthetist view of the split (43a keeps those screens free
  of Contract complexity).
- Locking the Contract's invoicing settings, payment setting and the Booking's split share at
  AUTHORISED (Phase 25; the invoice snapshots are enough until then).
- The primary Procedure and Booking-level pricing (23); the anaesthetist adjustment (24); how a
  prepayment meets a split (27, which replaces `prepaidSplit`).
- Credit-note, additional and balance invoice kinds (39, 27); `lineage` leaves room for them.
- The internal ledger (36): receivable and payable legs will read these invoices, one payable leg
  per receivable, with a parity test against 16's count function.
- US-08.6.4 (split a combined Procedure by additional invoices): Phase 39's, on 23's combination
  Contract.
- The final OQ-29 wording, IRD's current name for the document, and any tax-code mapping on the
  Xero records.
- AA fee invoices (16): AA's own invoices in AA's name. They keep their wording and get no supplier,
  agent, delivery or buyer-created block (16's handoff asks for this exemption).

## Manual test checklist

- [ ] Reset. Admin, Master data, Anaesthetists: every row shows a GST number; editing Dr Souter's to
      "12" refuses with the GST message; a valid one saves and shows in History.
- [ ] Master data, Contracts: every row shows Delivery and Payment; nib split payment shows Portal
      delivery and "Split, 60%"; Portal is disabled with its reason on a hospital Contract; Split is
      disabled with its reason on a patient-direct Contract; the share field carries the Provisional
      (OQ-68) pill and the Full / Split setting does not.
- [ ] S3 Beat 1: authorise Forte AM, then St George's PM. The banner counts emailed and queued.
      AA-2026-0002 Brian Holt Forte Health $396.18 shows "Emailed to" Forte's address in the rail,
      with the Simulated send badge; there is no Email invoice button.
- [ ] AA-2026-0005 Alan Prentice nib $152.38: contract-holder layout, Queued for nib provider portal,
      the split note ("nib's share ($132.50) of a fee of $212.00") linking to AA-2026-0006.
      AA-2026-0006 St George's $91.43: the full fee lines, "Less paid by nib", Emailed to St George's
      accounts address, linked back.
- [ ] Every invoice shows Dr Souter as supplier with her GST number, the agent block with AA's GST
      number, and the Provisional (OQ-29) pill.
- [ ] Office billing setup on Prentice's Booking (before authorising, after a reset): the Split row
      reads "nib pays $132.50 · rest to St George's"; typing "62.5%" gives the same amounts; "abc"
      refuses with the parser's message; "Use the Contract's share" shows "From the Contract", 60%,
      and authorising then raises nib $146.28 and St George's $97.52. No Funders row.
- [ ] Optional aside: reset, set Alan Prentice as the billable party on his Booking (21's sheet),
      authorise the PM List: the remainder invoice goes to Alan on the patient layout, emailed to his
      address; the nib invoice is unchanged.
- [ ] Full / Split: reset, open nib's standard Contract, switch Payment to Split with "60%", save;
      authorise the `nibFullBooking` List: two invoices (nib's share queued for portal, the rest
      emailed to the patient). Reset, leave it Full: one nib invoice for the whole fee.
- [ ] A party with no address: after a reset, clear St George's contact email in Master data (17),
      then authorise Dr Morrison's Mon 20 St George's List. Its invoices are raised with "No invoice
      email" (a person party cannot get here, because 21 blocks completion without an email); the
      monitor stage is partial with a link; typing an address and Send stamps it Emailed.
- [ ] Guardian: authorise the List holding Grace Park's Booking (21's guardian case). Her invoice
      is addressed to the guardian and "Emailed to" the guardian's address, not the patient's.
- [ ] Resend on a sent invoice adds a second send to the history; the nib invoice offers no Resend.
- [ ] An AA fee invoice (16) still reads as AA's own invoice: no supplier, agent or OQ-29 pill; the
      next fee run counts the two Prentice BCTIs as two, as 16's count function did before.
- [ ] Reset, authorise the List holding the GST-inclusive Contract's Booking (item 9): its invoice
      shows inclusive lines that add to the same total, with "includes GST of".
- [ ] No "Funder allocation", "Billed to" or "covered portion" text anywhere in the three apps.
- [ ] Xero simulation, AA-2026-0005 and AA-2026-0006 pairs: each ACCPAY shows its own Buyer-created
      tax invoice block with Dr Souter's and AA's GST numbers and the provisional pill, and equals
      its receivable; no NHI or patient name appears.
- [ ] Admin, Audit shows `invoice.sent`, `invoice.portalQueued`, `invoice.resend` and
      `booking.splitShare` with the right actor and source.
- [ ] PWA: "Office authorises this List" on a submitted List, then in the framed build Admin, Audit
      shows that List's invoices sent by the Billing run.
- [ ] No en or em dashes in any new app copy; teal is the only action colour; crimson only in the
      logo and existing identity.
- [ ] Catalogue screenshots: the recipes for US-04.2.8, US-04.2.12, US-08.4.2, US-08.4.1, US-08.4.3, US-08.4.4, US-08.4.5, US-08.2.3 and US-09.1.4 are created or updated, any recipe this phase broke is re-pointed, a full `npm run capture` ends with no failed recipe and no story without a recipe, the covered items' new shots are checked by eye, and `npm run verify:board` is green.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots` and `npm run verify:board` all green.

## Demo guide updates

Patch in the same session: `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`, the same sections of
`master-demo-guide.html` (the S3 details block, the billing-run workflow paragraph and the cheat
sheet's Split billing and money sections) and the S3 scenario text in `DemoControlPanel.tsx`.

- **Seed overview** (the script's opening, which names "the split-billing and two-funder Lists"):
  "two-funder" becomes "split payment".
- **S3 Beat 1:**
  - Click: drop "Email invoice, All invoices"; instead "Pause on the Delivery card: the run already
    emailed it", then open AA-2026-0005 (Queued for nib's portal) and AA-2026-0006.
  - Say: "The Billing Engine, not Xero, produces and sends every invoice as part of the run, in Dr
    Souter's name with her GST number and AA as agent. Each Contract decides the layout, whether it
    goes by email or to an insurer portal, and how GST shows, and whether one party pays in full or
    the fee is split. Alan's Procedure sits on a nib Contract set to Split: the office typed nib's
    share as $132.50, nib is invoiced that plus GST, and the rest goes to the Booking's billable
    party, here St George's." Name the agent and buyer-created wording as provisional (OQ-29) and the
    $-or-% share as provisional (OQ-68); the Full or Split setting is AA's own answer.
  - Expected: figures unchanged ($396.18; $152.38 and $91.43); each invoice shows its delivery stamp.
  - Optional asides: replace the Funder allocation aside with "set Alan as the billable party before
    authorising the PM List to show the remainder invoice on the patient layout, emailed to him", and
    add "type 62.5% instead of $132.50 in the Split row: same split".
  - "Split payment" replaces "two-funder" in the beat and in "Stage it".
- **S3 Beat 2:** add one line: each ACCPAY carries provisional buyer-created tax invoice wording
  naming Dr Souter as supplier and AA as agent, one per invoice and the same value, so Alan's split
  gives two.
- **Discovery points (S3):** add the OQ-29 wording and IRD's new name for the document, the OQ-68
  split basis (percentage only, $ or %, set on the Contract or the Booking), BCTI granularity (one
  per invoice built, "one per procedure" to confirm with the accountant) and portal upload
  ownership; drop the funder-split wording.
- **Cheat sheet:** Split billing bullets become "A Contract's payment setting is Full or Split.
  Split invoices the holder its share (typed $ or % on the Booking, defaulting from the Contract,
  provisional OQ-68) and the billable party the rest"; add an "Invoices" block (anaesthetist as
  supplier, AA as agent, sent by the run to email or portal, Resend on the rail, one BCTI per
  invoice).
- **Workflows doc:** the billing-run steps 5, 8 and 9 (no conserved allocations; the payment setting
  and share; Contract-driven layout; the run sends or queues each invoice, the office resends only).
- **Personas doc:** the office no longer emails invoices; it resends, fixes a missing invoice email,
  sets a Contract's payment setting and types a Booking's split share.
- **Control Panel S3 text:** "the two-funder Card" becomes "the nib split Booking"; mention the run
  sends the invoices.
- Not a milestone phase; no full consistency read (Phase 25 closes the "After 25" milestone).

## Catalogue screenshots

The standing step in [ROADMAP.md](../ROADMAP.md#catalogue-screenshots) (PROGRESS convention 19),
run after the review pass and before the PROGRESS.md entry. Re-run
`node docs/prototype-build/catch-up/tools/recipe-status.mjs 22` first: earlier phases may have
changed these recipes since this plan was written.

**Covered items.** When the phase is done, each recipe in `requirements-board/capture/recipes/`
matches what was built:

| Item | Recipe at plan time | When this phase is done |
|---|---|---|
| [US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md) Invoice presentation and delivery | absent | Captured. Create a recipe, admin: `contract-invoicing` on Master data, Contracts, the Contract sheet's Invoicing section (layout, delivery, GST treatment; highlight the section); `contracts-table` with the new Delivery and Payment columns; `gst-inclusive` on the invoice raised for `SEED_MARKERS.gstInclusiveBooking` (after authorising its List) showing "Total due, includes GST of $x". Caption: layout, delivery and GST treatment are set on the Contract, not booking by booking. |
| [US-04.2.12](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.12.md) Payment setting: full payment or split | none (create it) | Create, captured. Admin: `contract-payment` states `full` and `split` on the Contract sheet's Payment section (the "Default share for {holder}" field and the "Provisional (OQ-68)" pill); `booking-split-share` on Alan Prentice's Booking (Souter Mon 20 PM, split Contract `CT-NIB-SPLIT`, typed share $132.50) in the office billing setup. Caption in the catalogue's words: full payment invoices one party for the whole line, split invoices each party its share. |
| [US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md) Send to the invoice email | partial · admin-email-invoice (ready, emailed), admin-portal-upload | Captured. The billing run now sends, so the manual "Email invoice" click goes. Keep the shot `name`s: `admin-email-invoice` states `ready` (the authorise banner "{n} invoices raised. {e} emailed, {q} queued") and `emailed` (the Delivery card "Emailed to {address}", `invoice-delivery`); add a `guardian` state on a guardian-addressed invoice emailed to the Booking's own invoice email (Phase 21's Grace Park Booking); `admin-portal-upload` shows Prentice's nib invoice "Queued for nib provider portal". Drop the partial reason. |
| [US-08.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.1.md) Two invoice layouts | captured · admin-patient-layout, admin-contract-holder-layout | Stays captured. Re-shoot both: the layout now comes from the Contract and the masthead shows the anaesthetist as supplier with the agent block. Re-check `INV0001` is still the patient-layout invoice and fix the start if numbering moved. |
| [US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md) Unique invoice numbers | captured · simulator-xero-numbers | Stays captured. Verify only: the numbers (AA-2026-0002, 0005, 0006) must not move; re-shoot if the ACCPAY rows or the first four rows changed. |
| [US-08.4.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.4.md) Invoice reproducibility | partial · admin-snapshot-invoice | Stays partial. Re-shoot `admin-snapshot-invoice` on the new document (it now stores supplier, agent, GST treatment and delivery on the snapshot). Keep the partial reason, naming Phase 25 as the phase that builds the regenerate action from the locked data and Contract version. |
| [US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md) Anaesthetist as supplier, AA as agent | partial · admin-agent-line | Captured. Re-point `admin-agent-line` from `invoice-agency-line` to `invoice-agent-block` ("Issued by Anaesthesia Associates Limited as agent for {supplier}") and add `admin-supplier` on `invoice-supplier` (the anaesthetist's name and GST number in the masthead). The "Provisional (OQ-29)" pill sits in the highlight. Drop the partial reason. |
| [US-08.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.3.md) Split one Procedure's fee between two payers | partial · admin-split-invoices, admin-insured-portion, admin-remaining-portion | Captured. Re-shoot the three on the Contract-driven split: Prentice's nib share (AA-2026-0005, `invoice-split-note` "nib's share ($132.50) of a fee of $212.00") and the St George's remainder (AA-2026-0006, "Less paid by nib"). Add a `patient-gap` state: switch nib's standard Contract to Split at 60% in Master data, authorise `SEED_MARKERS.nibFullBooking`'s List, and shoot the insurer portion and the patient remainder in the Invoices list (`invoice-list-delivery`, "Share" and "Rest" chips). Drop the partial reason. |
| [US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md) ACCPAY as buyer-created tax invoice | partial · simulator-accpay-record | Captured, labelled provisional (OQ-29). Re-point `simulator-accpay-record` (`/demo/xero/invoices/XRH01`) to `xero-accpay-buyer-created`: the buyer-created wording with Supplier (name, GST) and Agent (AA, GST). Caption: the ACCPAY is held as a buyer-created tax invoice, one for each invoice and the same value. Drop the partial reason. |

**Recipes this phase breaks.**
- `US-11.3.3` clicks `role=button[name="Email invoice"]` on `/admin/invoices/INV0002`; the button goes (work item 14). Re-point it to the Delivery card's Resend, or shoot the stamped state the run now leaves, keeping its shot `name`.
- `US-08.4.2` clicks the same button (covered above).
- `US-05.2.7` shoots `/admin/invoices/INV0001` for the GST lines; the GST footer and the layout change (work item 10), so re-check its highlight.
- `US-08.2.1`, `US-08.2.2`, `US-08.3.1` and `US-10.1.2` authorise a List and then pick rows (`tr:has-text("Alan Prentice")`, `"Brian Holt"`, the `invoice-info-rail` "Xero handoff" section) in the Invoices list; the Status column becomes Delivery and Prentice's two rows are now Contract-driven. Re-check the row text and the rail section titles.
- `FT-08.4`, `US-06.2.2`, `US-06.2.3`, `US-06.3.1`, `US-06.4.1`, `US-09.1.1` start on `/admin/invoices`; the `--dry` run is the check that they still resolve.
- Every `/demo/xero` recipe that highlights `xero-accpay-card` (`US-08.3.1`, `US-09.1.1`): the card gains the buyer-created block.

**ATLAS.md.** Update Seed data (the `CT-NIB-SPLIT` Contract and Prentice's move onto it, `SEED_MARKERS.nibFullBooking`, `gstInclusiveBooking`, `splitPaymentBooking` replacing `twoFunderCard`), Existing hooks (`invoice-supplier`, `invoice-agent-block`, `invoice-delivery`, `invoice-split-note`, `invoice-list-delivery`, `xero-accpay-buyer-created`; `invoice-agency-line` removed) and the Overlays section where the Contract sheet gains the Invoicing and Payment sections.

## Adversarial review (after build)

After the manual test checklist and `npm run build`, `npm run build:pwa`, `npx vitest run` and
`npm run shots` are green, and before writing the PROGRESS entry, run the standard
**adversarial review-and-fix pass (PROGRESS convention 18)**: fan out independent Opus review
subagents for **quality**, **bugs/correctness** and **plan adherence**, plus a fourth on **money
conservation and determinism**, since this phase changes how one Procedure's fee is split between
invoices. This session then verifies every finding against the catalogue and the code, fixes the
confirmed ones with a test where a bug had none, re-greens, and records the pass. Do not re-raise
anything settled in the Decisions log, except the rulings this phase explicitly supersedes.

**Steer this phase's reviewers at:**
- **Conservation.** For every split Procedure, `holderShare + remainder === fee` to the cent, after
  an office price override too, for both $ and % shares; the Prentice figures are exactly $152.38
  and $91.43 from the typed $132.50 and from 62.5%; a zero remainder raises no invoice; no line is
  billed twice or dropped when a party's invoice spans several Procedures.
- **Who gets what.** The holder's share always goes to the holder, whatever the Booking override;
  the remainder goes to the override or the patient; a `full` Contract ignores a stored share and
  bills one party; `defaultBillablePartyFor` changed only for split Contracts, and every other
  seeded payer is unchanged from Phase 21.
- **One home for the open readings.** The split basis (parser, validation, the Booking share beating
  the Contract default, two parties totalling 100%) lives only in `splitShare.ts` with `OQ68_CAPTION`;
  the OQ-68 pill sits on share surfaces only, never on the Full / Split setting (OQ-23 is answered).
- **BCTI count.** One ACCPAY and one `taxInvoice` per receivable invoice, each the same value as its
  receivable; no per-Procedure payable; Phase 16's count function and its tests are unchanged and
  count a split as two.
- **No residue.** Zero hits for `funderOverride`, `FunderAllocation`, `allocationNotConserved`,
  `allocationStale`, `markInvoiceEmailed`, `emailedAtISO`, "Email invoice" and the dropped
  "cover" wording; no dead exports; no test skipped instead of rewritten.
- **Sending.** Every invoice path (run, retry, prepayment raise) goes through the one materialiser and
  stamps delivery in the same `mutate()` with a system audit entry; `noAddress` never fails a run;
  portal only for a direct-claims insurer holder and never for a remainder; `resendInvoice` and
  `setBookingSplitShare` are office-only and audited.
- **Snapshots.** Supplier, agent, GST treatment, invoice email and the ACCPAY `taxInvoice` are
  snapshots, so editing a GST number, a Contract's invoicing or payment setting, or an email after
  the run changes no raised invoice; no NHI or patient name reaches the ACCPAY wording
  (`xeroNhi.test.ts`).
- **GST presentation.** Inclusive lines sum to the stored total to the cent, including negative
  deduction lines; stored amounts stay GST exclusive; `GST_RATE` lives in one place.
- **Provisional labels.** Every surface with the agent or buyer-created wording shows the OQ-29 pill;
  the wording and `BCTI_DOCUMENT_NAME` live only in `invoicePresentation.ts`. AA fee invoices (16)
  carry none of it.
- **Recipient.** A guardian-billed Booking is emailed to the guardian's address (US-08.4.2).
- **Discipline.** Every write through `mutate()`; `PERSIST_VERSION` bumped; seed deep-equal across
  builds; no insurer field reintroduced on the Booking or Procedure (D2); the PWA sends through 14's
  trigger with no new PWA entry; design tokens (teal actions, semantic pills, mono GST numbers and
  shares, crimson only as identity); no en or em dashes in app copy; the demo guide figures match
  the running app.

## PROGRESS.md updates

- **Status table:** a catch-up row for Phase 22.
- **Phase entry:** the drift check result (catalogue diff from 501b0b8, OQ-29, OQ-68 and OQ-67
  status, BCTI granularity, what 16 and 18 to 21 left), files and actions added and removed, the
  `PERSIST_VERSION` bump, the tests added and rewritten, the manual checklist item by item, and the
  review pass.
- **Decisions log:**
  - Supersede **2026-07-22 fifth external review #4**: `BillingLine.funderOverride` and its
    conservation rule are removed; one Procedure splits between two payers only through the
    Contract's payment setting, Full or Split (US-04.2.12, US-08.2.3; OQ-23 answered 2026-10-01).
    The share as a typed $ or % on the Booking, defaulting from the Contract, with the billable
    party paying the rest, is provisional on OQ-68.
  - Supersede **Phase 08 decision (2)**'s layout rule: layout comes from the Contract, falling back
    to the recipient's class only for an override or a split remainder (US-04.2.8), and **decision
    (4)**'s GST caption: prices held GST exclusive is now the catalogue rule (US-05.2.7), and GST
    presentation is a Contract setting.
  - Supersede Phase 08 work item 2's manual "Email invoice": the run sends or queues each invoice
    (US-08.4.2); the office only resends. Note the 2026-07-28 rail layout stands with Resend in the
    Email slot.
  - New readings: the holder's share always goes to the holder, at the holder's own invoice email
    (the Booking's invoice email override is the billable party's only); an override naming the
    holder groups both halves into one invoice; no split with an insurer that takes no direct claims;
    `gstTreatment` is read as how the invoice presents GST (plus GST or GST inclusive) on prices held
    GST exclusive, not whether GST applies; a bare number typed as a share reads as dollars; a party's
    multi-Contract invoice takes the first Procedure's invoicing settings; portal only for a
    direct-claims insurer holder; a missing invoice email raises the invoice unsent rather than
    failing it; one BCTI per receivable invoice (so a split gives two), with "one per procedure"
    still to confirm; the OQ-29 supplier, agent and buyer-created wording and the document's name are
    provisional.
  - Handoff item P3 (GST per-invoice rounding on splits) now reads "split payments".
- **Handoff notes:** Phase 23 re-keys `Booking.splitShares` if Booking-level pricing moves the priced
  line; Phase 25 locks `invoicing`, `paymentSetting` and the effective split share with the Contract
  version; Phase 26's profile shows and edits `gstNumber`; Phase 27 replaces `prepaidSplit`, may
  add the balance kind using `lineage`, and raises the generated prepayment invoice unsent and sends
  it on admin approval (D6) through `materialiseInvoices`' separate send step; Phase 36's ledger legs read `procedureIds` and `lineage`, one
  payable leg per receivable, with its parity test against 16's count; Phase 39 adds credit and
  additional lineage roles; portal upload ownership, the OQ-29 wording and the document's new name,
  the OQ-68 split basis and BCTI granularity are questions for AA.
- **Catalogue screenshots.** The step's result: recipes created (US-04.2.12) and changed (US-04.2.8,
  US-08.4.2, US-08.4.1, US-08.4.3, US-08.4.4, US-08.4.5, US-08.2.3, US-09.1.4, plus US-11.3.3,
  US-05.2.7 and any other recipe the step broke), the `capture/REPORT.md` counts (captured, partial,
  absent, failed) before and after, and any partial reason handed to a later phase (US-08.4.4 stays
  partial until Phase 25).
