# Phase 22 · Invoice presentation and delivery

**Requirements covered:**
[US-04.2.8](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-04.2.8.md) Invoice presentation and delivery (Proposed) ·
[FT-08.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.4.md) Invoice generation and despatch (Proposed) ·
[US-08.4.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.2.md) Send to the invoice email (Confirmed) ·
[US-08.4.5](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.5.md) Anaesthetist as supplier, AA as agent (Proposed, [OQ-29](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-29.md)) ·
[US-08.2.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.2.3.md) Split one Procedure's fee between two payers (Proposed, [OQ-23](../../../discovery-reference/Updated%20Requirements/catalogue/questions/OQ-23.md)) ·
[US-09.1.4](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-09.1.4.md) ACCPAY as buyer-created tax invoice (Proposed, OQ-29) ·
[DM-23](../analysis/domain-model-delta.md#dm-23) Invoice entity: supplier and agent presentation, email, delivery and lineage ·
[DM-24](../analysis/domain-model-delta.md#dm-24) how one Procedure splits between two payers (the grouping half closed in Phase 21).
No RV finding is closed here ([reverse-check.md](../analysis/reverse-check.md) has none on this
surface). The settled July rulings superseded are the `funderOverride` conservation split (fifth
review #4), the counterparty-kind layout and the manual "Email invoice" send (Phase 08 decisions),
listed under PROGRESS.md updates.
**Depends on:** Phase 21 (the Booking's billable party and invoice email, `Invoice.invoiceEmail`
snapshotted by the run, grouping by billable party, and `funderOverride` left as the interim split).
Also relies on 14 (trigger registry and the PWA "Office authorises this List" stand-in), 15 (Booking
vocabulary), 16 (the payable equals the receivable; `invoiceNumber` and `reference` stored on both
Xero records), 17 (hospital and surgeon rooms contact emails) and 18 to 20 (the Contract shape:
category, holder, scope, pricing basis, the Master data Contract sheet, one Contract per Procedure,
insurer on the Booking).
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

A Contract may declare a **covered amount or covered percentage** (US-08.2.3). The holder or insurer
is invoiced for the covered portion and the Booking's billable party for the gap, as two invoices.
This replaces the line-level `funderOverride` and the office's Funder allocation sheet entirely. The
seeded Prentice Booking moves onto a nib cover Contract and still raises **AA-2026-0005 · nib ·
$152.38** and **AA-2026-0006 · St George's · $91.43**, so S3 Beat 1 keeps its figures.

The **ACCPAY** in the Xero simulation carries provisional **buyer-created tax invoice** wording with
the supplier (anaesthetist, GST number) and agent (AA, GST number) details (US-09.1.4). The Invoice
gains the fields DM-23 lists: recipient email (21's snapshot), delivery method and status, supplier,
agent, Procedure links and lineage.

## Before you start: drift check

1. Diff the catalogue for this phase's items against the snapshot:

   ```
   git diff 1f067a8 -- "docs/discovery-reference/Updated Requirements/catalogue" "docs/discovery-reference/Updated Requirements/domain-model.md"
   ```

   Read the hunks for US-04.2.8, FT-08.4, US-08.4.2, US-08.4.5, US-08.2.3, US-09.1.4, the items they
   lean on (US-08.4.1 two layouts, US-05.2.7 prices held GST exclusive, US-11.4.1 direct insurer,
   US-11.2.2 billable party override, US-08.4.3 the `-P` suffix, FT-08.2 grouping, FT-09.1 the pair),
   OQ-29 and OQ-23, and the domain-model lines on `coveredAmount / coveredPercent`, `invoiceLayout`,
   `deliveryMethod`, `gstTreatment`, "Invoices are issued in the anaesthetist's name with AA as
   agent" and the Invoice email glossary entry.
2. If an item changed, re-read it in full and adjust the work items. If an item is now Retired or
   Future, drop it and say so in the PROGRESS entry. In particular, if US-08.2.3 is retired or OQ-23
   is answered "not a real case", still remove `funderOverride` (it is retired behaviour either way)
   but move Prentice onto the plain St George's default Contract and re-baseline S3 Beat 1 to one
   invoice; tell the owner first, because the S3 two-invoice beat goes.
3. **Open questions, and the safe interim if still open.**
   - **OQ-29 (GST agency treatment).** Build the recommended reading: supplier = the anaesthetist
     with their GST number, AA named as agent, and the ACCPAY labelled a buyer-created tax invoice.
     Every surface that shows this wording carries a small neutral "Provisional (OQ-29)" pill and one
     caption: "Supplier, agent and buyer-created wording are provisional until AA's accountant
     confirms the GST agency treatment." The wording lives in one module (work item 2) so the answer
     changes one file. If OQ-29 is answered, use the accountant's wording and drop the pill.
   - **OQ-23 (partial-cover mechanism).** Build the domain model's own reading: `cover` (amount or
     percent) on the Contract, one Contract per Procedure, the covered portion to the holder and the
     gap to the billable party. Label the cover fields in the Contract sheet "Proposed mechanism
     (OQ-23)". If OQ-23 is answered "a second Contract on the Procedure" or "a second billing line",
     stop and tell the owner: that contradicts one Contract per Procedure (Confirmed) and needs a
     catalogue change first.
4. **Read what 18 to 21 actually left** (their PROGRESS entries): the Contract field names and the
   Master data Contract sheet (18), where the insurer and member number live (20, 21), the names of
   `billablePartyForProcedure`, `invoiceEmailFor` and `Invoice.invoiceEmail` (21), whether 21's
   `defaultInvoiceEmailFor` already reads the hospital and rooms contact emails from 17, and how
   `funderOverride` survived 20 and 21 (it should be untouched). Also note where 16 stored
   `invoiceNumber` and `reference` on the Xero records, how 16 shows the AA fee invoice (it is
   exempt here), which List holds 21's guardian Booking (Grace Park), where 14 put the PWA "Office
   authorises this List" body, and the current `PERSIST_VERSION` (13 at the snapshot; 14 to 21 will
   have bumped it).
5. Record the result (changed items, OQ status, what the earlier phases left) in the PROGRESS entry.

## Reference

**Design (convention 17).** No mockup covers the invoice document, the Invoices list, the Contract
sheet or the Xero simulation, so extend the existing screens' own patterns and
[Design Language.dc.html](../../../design/Design%20Language.dc.html): teal `#0D6E63` for Resend and
Send; pill radius 999 on semantic tokens for delivery states (success tint for Emailed, neutral for
Queued for portal and Not sent, warning tint for No invoice email), never the six schedule status
colours; Spline Sans Mono with tabular-nums for every amount, GST number and invoice number. Crimson
stays identity only: the AA logo moves into the invoice's agent block (still identity), and nothing
new is crimson. [Admin Review.dc.html](../../../design/Admin%20Review.dc.html) is the layout for the
authorise banner and action bar whose copy changes. The 2026-07-28 invoice workspace decision (760px
document, 264px sticky rail) stands.

**Catalogue.** The covered items above, plus
[US-08.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.1.md) (two layouts),
[US-05.2.7](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-05.2.7.md) (prices held GST exclusive, inclusive derived),
[US-11.4.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.4.1.md) (the direct insurer and its portal),
[US-11.2.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-11.2.2.md) (billable party and invoice email override),
[US-08.4.3](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/US-08.4.3.md) (unique numbers, `-P`),
[FT-08.2](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-08.2.md) (one invoice per billable party),
[FT-09.1](../../../discovery-reference/Updated%20Requirements/catalogue/requirements/FT-09.1.md) (the ledger pair mirrored to Xero), and
[domain-model.md](../../../discovery-reference/Updated%20Requirements/domain-model.md) (the Contract table rows named above and the Internal ledger bullets).
The catalogue screenshots for US-08.2.3 (nib and St George's) and US-08.4.2 (ready, emailed, portal)
show the July UI; grade against the text.

**Analysis.**
- [GAP-ANALYSIS.md](../GAP-ANALYSIS.md): Summary theme 1 (Contract becomes the whole pricing
  decision, which lists US-04.2.8), theme 8 (Money side), the Uncertainty bullet on OQ-18 and OQ-29,
  the DM-23 and DM-24 rows, and the EP-04, EP-08 and EP-09 tables. Per-gap detail:
  [epics/EP-08.md](../epics/EP-08.md) (header note items 4 and 5, and US-08.2.3, US-08.4.2, FT-08.4,
  US-08.4.5), [epics/EP-04.md](../epics/EP-04.md) (US-04.2.8), [epics/EP-09.md](../epics/EP-09.md)
  (US-09.1.4).
- [analysis/domain-model-delta.md](../analysis/domain-model-delta.md) DM-23, DM-24.
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
handoff item **P3 GST per-invoice rounding on funder splits** (still true of covered splits).

**Code entry points** (paths under `aa-prototype/src/`, names as at the snapshot; use the Booking
names 15 gave them and the shapes 18 to 21 left).
- Types, `domain/types.ts`: `Anaesthetist` (~141, no GST number), `Contract` (~216, reshaped by 18),
  `BillingLine.funderOverride` (~512-530), `Invoice` (~662: `layout`, `kind`, `emailedAtISO`, 21's
  `invoiceEmail`), `InvoiceLine` (~678), `XeroAccPay` (~780, reshaped by 16).
- Pure billing: `domain/billing/invoiceBuild.ts` (`GST_RATE` ~39, `layoutFor` ~216, the
  `funderOverride` branch and `allocationStale` ~329-358, `prepaidFunderOverride` ~300, grouping
  ~397, `buildPrePaymentInvoiceForCard` ~456), `domain/billing/fee.ts` (`FeeLine.funderOverride`
  ~143, ~248), `domain/billing/validateCardForBilling.ts` (the conservation branch ~248), the billing
  index; 21's `domain/billing/billableParty.ts`.
- Store: `store/billingRun.ts` (`runBillingForList` invoice build ~182-230, `retryBillingCase`
  ~336-362, `markInvoiceEmailed` ~398), `store/prepaymentActions.ts` (`raisePreProcedureInvoice`
  ~53-130), `store/billingLineActions.ts` (`setBillingLineAllocation` ~138,
  `setProcedureFunderAllocation` ~218, `FunderAllocationEntry`, the remove guard ~311),
  `store/cardActions.ts` (~503 guard), `store/xeroHandoff.ts` (`handoffCase` ACCPAY ~234),
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
  `defaultType1`, nib default), `domain/seed/cards.ts` (Prentice two-funder Booking ~586-618),
  `domain/seed/history.ts` (historical invoices ~240-275 and ACCPAYs), `domain/seed/billing.ts`
  (seeded prepayment invoice ~170-205), `domain/seed/audit.ts` (~139 `funderOverride`),
  `domain/seed/index.ts` (`SEED_MARKERS.twoFunderCard` ~564), `domain/seed/seed.test.ts` (~259,
  ~366).
- UI: `apps/admin/screens/InvoiceDocument.tsx` (masthead ~100-145, GST caption ~216, rail
  `InvoiceInfoRail` ~225-320), `apps/admin/screens/InvoicesScreen.tsx` (Layout and Status columns
  ~210-220), `apps/admin/screens/BillingMonitorScreen.tsx` (stage strip), `apps/admin/screens/ReviewScreen.tsx`
  (authorise banner), `apps/admin/screens/MasterData.tsx`, `apps/admin/flows/ContractEditSheet.tsx`,
  `apps/admin/flows/EditAnaesthetistSheet.tsx`, `apps/admin/flows/AddAnaesthetistFlow.tsx`,
  `shared/card/OfficeBillingSetup.tsx` (Funders row ~46, ~91), `shared/capture/BillingLinesCard.tsx`
  (~91-103), `shared/flows/FunderAllocationSheet.tsx` and `shared/flows/index.ts`,
  `shared/audit/fieldLabels.ts` (~132 `funderOverride`, ~146 `emailedAtISO`) and `actionLabels.ts`,
  `apps/demo/DemoXero.tsx` (`AccPayCard` ~456), `apps/demo/xeroPairView.ts`,
  `apps/demo/DemoControlPanel.tsx` (S3 scenario text ~395-410).
- Tests that pin today's behaviour: `domain/billing/invoiceBuild.test.ts` (~293, ~379),
  `domain/billing/prePaymentInvoice.test.ts` (~194), `domain/billing/validateCardForBilling.test.ts`
  (~260), `store/billingRun.test.ts` (~244-300, ~411, ~455-492), `store/phase06Actions.test.ts`
  (~120-195), `store/captureActions.test.ts` (~267, ~423), `store/demoScenarios.test.ts` (~85-105),
  `shared/audit/auditNarrative.test.ts` (~125), `visual/admin-phase08.spec.ts` (~142, ~176-201,
  ~359-405), `visual/xero-pair.spec.ts`.

## Work items

1. **Model** (`domain/types.ts`). DM-23 and DM-24.
   - `Anaesthetist.gstNumber: string`, required, so the compiler finds every creator. US-08.4.5
     ("with the anaesthetist's GST number").
   - `ContractInvoicing`: `{ invoiceLayout: 'contractHolder' | 'patient'; deliveryMethod: 'email' |
     'portal' | 'none'; portalName?: string; gstTreatment: 'exclusive' | 'inclusive' }`, and
     `Contract.invoicing: ContractInvoicing`, required. The field names are the domain model's
     Contract table rows (`invoiceLayout`, `deliveryMethod`, `gstTreatment`), which Phase 25's lock
     copies as `presentation`. `gstTreatment` is how the invoice presents GST; the stored amounts
     stay GST exclusive either way (US-05.2.7), so the totals never differ. US-04.2.8.
   - `ContractCover = { kind: 'amount'; amountExGst: number } | { kind: 'percent'; percent: number }`
     and `Contract.cover?: ContractCover` (the domain model's `coveredAmount / coveredPercent` as one
     union, so a Contract cannot carry both). Absent means no partial cover. US-08.2.3.
   - On `Invoice`:
     - `procedureIds: ProcedureId[]` (the Procedure links, in Booking order);
     - `supplier: { anaesthetistId; name; gstNumber }` and `agent: { name; gstNumber }`, snapshots
       taken at the run;
     - `gstTreatment` (snapshot of the Contract's);
     - `portion?: 'covered' | 'gap'` (set only on the two halves of a covered split);
     - `lineage?: { role: 'balanceOfPrepayment' | 'gapOfCover'; invoiceId: InvoiceId }[]` (Phase 39
       adds credit and additional roles; Phase 27 may add the balance kind);
     - `delivery: InvoiceDelivery`, a discriminated union:
       `{ method: 'email'; status: 'sent'; sentAtISO; sends: { atISO; to; by }[] }`,
       `{ method: 'email'; status: 'noAddress' }`,
       `{ method: 'portal'; status: 'queued'; portalName; queuedAtISO }`,
       `{ method: 'none'; status: 'notSent' }`.
     - The recipient address is 21's `invoiceEmail` snapshot (DM-23's "recipientEmail"); do not add
       a second copy.
     - Remove `emailedAtISO`.
   - Remove `BillingLine.funderOverride` (and `FeeLine.funderOverride` in `fee.ts`).
   - On `XeroAccPay`: `taxInvoice: BuyerCreatedTaxInvoice` = `{ kind: 'buyerCreated'; wording;
     supplierName; supplierGstNumber; agentName; agentGstNumber; relatesToInvoiceNumber; provisional:
     true }`, required. US-09.1.4.
2. **Pure presentation rules** in a new `src/domain/billing/invoicePresentation.ts`, re-exported from
   the billing index, all Vitest-covered (convention 9):
   - `AA_AGENT`: `{ name: 'Anaesthesia Associates Limited', gstNumber }` with a synthetic GST number,
     and `OQ29_CAPTION`, the one provisional caption from the drift check. The only place either
     lives.
   - `GST_RATE` moves here from `invoiceBuild.ts` (15%, the NZ standard rate; no longer described as
     an assumption, since US-05.2.7 makes GST-exclusive storage the rule). Update its importers
     (`seed/history.ts`, `store/paymentActions.ts`, `InvoiceDocument`, `invoiceBuild.test.ts`, and
     anything 16 added for the AA fee GST).
   - `isValidGstNumber(value)` (8 or 9 digits once spaces and hyphens are stripped) and
     `formatGstNumber` (`NN-NNN-NNN` or `NNN-NNN-NNN`). Format only, no IRD check digit.
   - `supplierFor(anaesthetist)`.
   - `invoiceLayoutFor(contract, party, portion)`: the Contract's `invoiceLayout` when the invoice goes to
     the Contract's own default party (its holder, or the patient on a patient-direct Contract) and is
     not a gap; otherwise the recipient's class (a person party gets the patient layout, an
     organisation the contract-holder layout). A gap invoice to the patient is always the patient
     layout. US-04.2.8 with US-11.2.2 (a Booking override can send a patient-direct Contract's
     invoice to a hospital).
   - `deliveryPlanFor(contract, party, portion, invoiceEmail)`: `portal` only when the Contract's
     `deliveryMethod` is portal and the invoice goes to the holder (never the gap); `none` when the Contract says none;
     otherwise `email` to `invoiceEmail`, or `noAddress` when it is empty. Returns the plan, not a
     stamped state, so the run stamps the time. US-08.4.2 ("where the Contract instead specifies
     portal upload, the engine queues the invoice").
   - `presentGstLines(lines, subtotal, gst, treatment)`: for `exclusive`, the lines as stored plus
     Subtotal, GST and Total; for `inclusive`, each line shown GST inclusive with the invoice's GST
     allocated across lines by largest remainder, so the shown lines sum to the stored total to the
     cent, and a "Total includes GST of $x" footer. Negative lines (the prepayment and cover
     deductions) allocate with their sign.
   - `buyerCreatedTaxInvoiceFor(invoice, accPayNumber)`: the ACCPAY snapshot. Wording (dash-free):
     "Buyer-created tax invoice. Issued by Anaesthesia Associates Limited, GST {aa}, as agent, for the
     supplier {name}, GST {number}, covering services invoiced on {invoiceNumber}."
   - Tests: layout for holder, patient-direct, a hospital override on a patient-direct Contract and a
     gap; delivery for portal holder, portal Contract with a gap invoice (email), none, email with
     and without an address; inclusive allocation sums to the total for 1, 2 and 7 lines, with a
     negative deduction line, and is identical on repeat; GST number validation and formatting; the
     wording has no en or em dash and names both GST numbers.
3. **Pure covered split** in a new `src/domain/billing/coveredSplit.ts`:
   - `splitCoveredFee(feeExGst, cover)` returns `{ covered, gap }` in cents-exact dollars:
     amount cover pays `min(amountExGst, fee)`; percent cover pays `roundToCents(fee * percent /
     100)`; `gap = fee - covered`. Refuses a non-positive amount, or a percent outside 0 to 100
     exclusive, with a reason (the Contract editor shows the same message).
   - `coverLabel(cover)`: "Covers up to $132.50" or "Covers 62.5%".
   - Tests: Prentice (`$212.00` with amount `$132.50` gives `132.50 / 79.50`); a fee under the
     covered amount gives a zero gap; 62.5% of $212.00 gives the same split; odd cents conserve
     (`covered + gap === fee` over a sweep of fees and percents); invalid covers refuse.
4. **Invoice build uses the Contract** (`invoiceBuild.ts`, the post-15 Booking builder):
   - Drop the whole `funderOverride` branch, `allocationStale` and the conservation re-check.
   - For a Procedure whose Contract has `cover`, split its final fee (after any office override)
     with `splitCoveredFee`:
     - **Covered portion** to the Contract's **holder**, always (the cover is the holder's
       commitment, so a Booking billable-party override never moves it). One line: "{description},
       covered portion under {Contract} ({coverLabel}, fee ${fee})".
     - **Gap** to the Booking's **billable party** override if set, else the patient (the catalogue:
       "the patient (the billable party)"). The gap invoice itemises the full fee lines as usual,
       then a visible deduction line "Less covered by {holder}" for the covered amount, so the
       patient sees the whole calculation (the same pattern as the prepayment deduction).
     - A zero gap raises no gap invoice.
     - Change 21's `defaultBillablePartyFor` so a covered Contract's default party is the patient
       (the holder already takes its portion); keep the override rule unchanged.
   - `prepaidFunderOverride` becomes `prepaidCoveredSplit` (a prepaid Procedure on a cover Contract
     fails to review, message reworded). Phase 27 decides whether the deposit nets off the gap.
   - Each `DraftInvoice` carries `contractId` (of its first Procedure in Booking order),
     `procedureIds`, `portion` and `lineage` hints (a gap draft points at its covered sibling by
     index; the run resolves ids). Grouping stays one invoice per distinct party per Booking (FT-08.2,
     21's rule). The covered draft is emitted before its gap draft, so numbering is covered then gap.
     A party's invoice that spans Procedures on Contracts with different invoicing settings takes
     the first Procedure's (labelled reading, test-pinned).
   - `layoutFor(counterparty)` is deleted; drafts use `invoiceLayoutFor`.
   - Tests: the Prentice reproduction at domain level ($132.50 to nib, $79.50 to the override, then
     $152.38 and $91.43 after GST); gap to the patient when there is no override; cover at or above
     the fee gives one invoice; an office override splits on the overridden fee; prepaid plus cover
     fails; layout and delivery come from the Contract; a mixed-Contract group takes the first
     Procedure's settings; the retired branch's tests in `invoiceBuild.test.ts` and
     `prePaymentInvoice.test.ts` are rewritten, not skipped.
5. **Remove `funderOverride` everywhere** (retired behaviour, replaced by item 4):
   - `store/billingLineActions.ts`: delete `setBillingLineAllocation`, `setProcedureFunderAllocation`,
     `FunderAllocationEntry` and the `allocationNotConserved` refusals; the anaesthetist remove guard
     (~311) and `cardActions.ts` (~503) lose their funder clause. Remove the exports from
     `store/index.ts`.
   - `validateCardForBilling.ts`: delete the conservation branch.
   - `shared/flows/FunderAllocationSheet.tsx`: delete, with its export. `OfficeBillingSetup`: the
     Funders row goes; a read-only **Cover** row appears only on a cover Contract: "{holder} covers up
     to $132.50 · gap to {party}" (office only, amounts from the pure split on the current fee).
   - `BillingLinesCard`: the "Billed to" chip and its remove-hiding go.
   - `fieldLabels.ts`, `auditNarrative.test.ts`, `seed/audit.ts`: drop `funderOverride`.
   - Tests: rewrite `phase06Actions.test.ts` (the allocation blocks go), `captureActions.test.ts`
     (~267, ~423) and `billingRun.test.ts` (~259-300, ~455-492: the "rerouting to the patient"
     cases become "set the billable party to the patient", the stale-allocation case goes).
   - Grep `src` and `visual` for `funderOverride|FunderAllocation|allocationNotConserved|allocationStale|Funder allocation`:
     zero hits.
6. **The run sends each invoice** (`store/billingRun.ts`, `store/prepaymentActions.ts`):
   - Extract one store helper, `materialiseInvoices(state-in-mutate, drafts, bookingId, atISO,
     counters)`, used by `runBillingForList`, `retryBillingCase` and `raisePreProcedureInvoice`, so
     the three paths cannot drift. It allocates ids and numbers, builds each `Invoice` with
     `supplier` (from the List's anaesthetist), `agent` (`AA_AGENT`), `gstTreatment`, `procedureIds`,
     `portion`, `lineage` (a gap invoice links its covered sibling; a post-prepayment balance invoice
     links the prepayment invoice(s) it nets, found through `prePaidByProcedure`, which gains the
     invoice id), 21's `invoiceEmail`, and **stamps `delivery` from `deliveryPlanFor` at the run's
     clock time**, in the same `mutate()` as the invoices.
   - Audit, per invoice, source system, actor "Billing run": `invoice.sent` (after: `to`, `atISO`),
     `invoice.portalQueued` (after: `portalName`), `invoice.notSent` (after: `reason: 'noAddress' |
     'deliveryNone'`). The `list.billed` audit gains `sentCount`, `queuedCount`, `notSentCount`.
   - A missing address never fails the run or the case: the invoice is raised with
     `delivery.status: 'noAddress'` and shows in the monitor (item 11).
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
   - `xeroPairView` passes `taxInvoice` through; no view-time derivation.
   - Tests: the snapshot names the invoice's supplier and AA; it survives a later GST number edit
     (snapshot, not a lookup); `xeroNhi.test.ts` still passes (no NHI and no patient name in the
     wording). US-09.1.4.
8. **Masters and their actions** (`store/mastersActions.ts`, `store/contractActions.ts`):
   - `editAnaesthetist` gains `gstNumber` (refuses an invalid one: "Enter a GST number of 8 or 9
     digits."); `addAnaesthetist` requires it. Audit field label "GST number".
   - `createContract` and `editContract` (`store/contractActions.ts`, as 18 reshaped them) gain
     `invoicing` and `cover`, validated: `portal` only for an insurer holder that accepts direct
     claims (US-04.2.8: "portal upload for the direct insurer"), and needs a `portalName`; `cover`
     only on a Contract with an organisation holder (a patient-direct Contract cannot cover itself),
     validated by `splitCoveredFee`'s rules. `setInsurerDirectClaims(false)` on an insurer whose
     Contracts deliver by portal switches them to email, audited, so no Contract is left invalid.
   - A pure `defaultInvoicingFor(holderKind, category)` gives new Contracts their settings: patient
     layout and email for a patient-direct Contract; contract-holder layout and portal for a
     direct-claims insurer; contract-holder layout and email otherwise; GST exclusive throughout.
     `createHospital` and `setInsurerDirectClaims` use it for the default Contracts they create.
   - Tests for each validation and the defaults.
9. **Seed** (determinism, convention 5), then **bump `PERSIST_VERSION`** by one:
   - `cast.ts`: a deterministic, synthetic 9-digit GST number for all 14 anaesthetists (derived
     from the seeded RNG or the registration number, labelled synthetic in a comment); Dr Souter's
     is the one the demo guide quotes.
   - `contracts.ts`: `invoicing` on every Contract via `defaultInvoicingFor`; the nib Contracts
     `portal` with `portalName: 'nib provider'`; one published fixed-schedule Contract (the Doyle
     bariatric schedule, or whichever 18 seeded as a GST-inclusive schedule) set to `inclusive`, so
     the inclusive presentation is demoable off the scripted beats.
   - A new **nib partial cover** Contract (id `CT-NIB-COVER`, name "nib partial cover (demo)"):
     holder nib, category Insurance, scope insurer nib, RVG units at the anaesthetist's rate,
     `cover: { kind: 'amount', amountExGst: 132.5 }`, portal delivery, contract-holder layout. It
     declares the same required inputs 21 gave the nib Insurance Contract (insurer member number).
   - `cards.ts` Prentice (Souter Mon 20 PM): the two stored lines go; the Procedure's Contract
     becomes `CT-NIB-COVER`; the Booking's insurer is nib with a member number (20, 21); the
     Booking's `billableParty` is St George's hospital, set by the office (seeded audit entry), so
     the gap invoice goes to St George's as today. The fee is still 8 units x $26.50 = $212.00.
     The Procedure description "Knee arthroscopy, funding split with nib" becomes "Knee
     arthroscopy", the seed comment above it is rewritten, and the `scenario.twoFunder` key becomes
     `coveredSplit`.
   - `history.ts` and `billing.ts`: every seeded invoice gets `procedureIds`, `supplier`, `agent`,
     `gstTreatment` and a `delivery` stamped at its `raisedAtISO` (email to the party's seeded
     address, or portal for nib); every seeded ACCPAY gets its `taxInvoice`.
   - `index.ts`: `SEED_MARKERS.twoFunderCard` becomes `coveredSplitBooking` ("One procedure, nib cover
     and gap"); update every reference.
   - Tests (`seed.test.ts`, `demoScenarios.test.ts`): two builds deep-equal; every anaesthetist's
     GST number is valid and unique; every Contract has `invoicing`; no seeded line carries a funder;
     `authoriseList` on both S3 Lists raises **AA-2026-0002 Brian Holt Forte Health $396.18**,
     **AA-2026-0005 Alan Prentice nib $152.38 (queued for portal)** and **AA-2026-0006 Alan Prentice
     St George's $91.43 (emailed)**, with every S3 invoice `sent` or `queued` and none `noAddress`.
   - Re-green `npm run build`, `npm run build:pwa` and `npx vitest run` here (the stop point).
10. **Admin invoice document** (`apps/admin/screens/InvoiceDocument.tsx`). US-08.4.5, US-08.4.1,
    US-04.2.8.
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
    - **Portion note:** a covered invoice reads "Covered portion of a fee of $212.00 under nib
      partial cover. The balance is invoiced separately." with a link to the gap invoice; a gap
      invoice reads "{holder} covers ${covered} of this fee under {Contract}." with a link to the
      covered invoice. Both labelled "Proposed mechanism (OQ-23)".
    - **Rail, Delivery card** from `invoice.delivery`: Emailed to {to} at {time} (success, DemoBadge
      "Simulated send", with the send history when resent); Queued for {portal} portal (neutral,
      DemoBadge "Simulated portal queue"); No invoice email (warning, an inline email field and a
      teal **Send**); Not sent (neutral, with **Send** once an address is typed). A secondary
      **Resend** on sent email invoices; Print stays. No Email invoice button anywhere.
    - **Rail, Related invoices** card when `lineage` is present (covered and gap siblings, the
      prepayment invoice a balance nets).
    - `data-shot` hooks: `invoice-supplier`, `invoice-agent-block`, `invoice-delivery`,
      `invoice-portion-note`.
    - AA fee invoices (16) keep AA's own masthead and wording: no supplier block, no agent block,
      no OQ-29 pill, no Delivery card.
11. **Invoices list, Billing monitor and Review banner.**
    - `InvoicesScreen.tsx`: the Status column becomes **Delivery** (pills from
      `invoiceDeliveryLabel`: Emailed, Queued for portal, No invoice email, Not sent), Layout reads
      the snapshot, and the Counterparty cell gains a small "Covered" or "Gap" chip. Keep the table's
      min width. `data-shot` `invoice-list-delivery`. FT-08.4 ("with layout and delivery status").
    - `BillingMonitorScreen.tsx`: the stage strip shows "Sent or queued" with item 6's detail, and a
      row with `noAddressCount > 0` links to its first such invoice.
    - `ReviewScreen.tsx`: the post-authorise banner reads "{n} invoices raised. {e} emailed, {q}
      queued for portal." (plus "{m} need an invoice email." when any).
12. **Master data** (`MasterData.tsx`, `ContractEditSheet.tsx`, `EditAnaesthetistSheet.tsx`,
    `AddAnaesthetistFlow.tsx`). US-04.2.8.
    - The Contract sheet gains an **Invoicing** section: Layout (segmented: Contract holder,
      Patient), Delivery (segmented: Email, Portal upload, None; Portal disabled with the reason unless
      the holder is a direct-claims insurer; a Portal name field), GST on invoices (segmented: Plus
      GST, GST inclusive, with the caption "Prices are held GST exclusive; this only changes how the
      invoice shows GST.").
    - A **Partial cover** section: None, Covered amount ($, ex GST), Covered percent (%), with the
      caption "The holder is invoiced for the covered part and the Booking's billable party for the
      gap, as two invoices." and the "Proposed mechanism (OQ-23)" pill. Hidden for patient-direct
      Contracts.
    - The Contracts table gains Delivery and Cover columns (text, not pills).
    - The Anaesthetists table gains a mono **GST number** column; Edit and Add sheets gain the field.
13. **Xero simulation** (`apps/demo/DemoXero.tsx`, `AccPayCard`). US-09.1.4.
    - A **Buyer-created tax invoice** block beneath the meta grid: the wording, then Supplier
      ({name}, GST {number}) and Agent (Anaesthesia Associates Limited, GST {aa}) as `MetaItem`s,
      with the "Provisional (OQ-29)" pill and caption. `data-shot` `xero-accpay-buyer-created`.
    - The ACCPAY money-flow card copy gains "Held as a buyer-created tax invoice from the
      anaesthetist." The old note that the RFP does not specify GST treatment goes.
14. **Copy, labels and shots.**
    - `actionLabels.ts`: `invoice.sent` "Invoice emailed", `invoice.portalQueued` "Invoice queued for
      portal", `invoice.notSent` "Invoice not sent", `invoice.resend` "Invoice resent"; remove
      `invoice.email`. `fieldLabels.ts`: `gstNumber`, `invoicing`, `cover`, `delivery`; remove
      `emailedAtISO` and `funderOverride`.
    - Sweep `src` for "Email invoice", "Upload portal", "Billed by Anaesthesia Associates as agent",
      "two-funder", "funder" in copy, and the GST assumption caption: each is replaced or gone.
    - No en or em dashes in any new string.
    - Playwright: `visual/admin-phase08.spec.ts` (the agent text, no Email invoice button, the
      Delivery card says Emailed to the Forte address, the Prentice rows show Queued for portal and
      Emailed, the insurer rail has no Resend), `visual/xero-pair.spec.ts` (the buyer-created block),
      a Master data shot of the Invoicing and Partial cover sections.
15. **Re-green:** `npm run build`, `npm run build:pwa`, `npx vitest run`, `npm run shots`.

## Demo triggers

This phase adds **no new harness-bar button**. The sends are automatic engine behaviour, and they
become visible on an existing product action, as the gap analysis recommends:

| Label | Screen | Surface | Effect |
|---|---|---|---|
| **Authorise for billing** (existing product action, not a trigger) | Admin Review (`/admin/review/:listId`) | Product UI | Runs the billing run, which now raises and sends every invoice: the banner counts emailed and queued, and each invoice's rail shows its delivery stamp |
| **Resend** / **Send** (existing rail, reworked; product office action) | Admin invoice (`/admin/invoices/:invoiceId`) | Product UI | `resendInvoice` on the invoice in the URL |

**Re-pointed:** the Billing monitor's resolve-and-retry and the prepayment raise now send as they
raise. Phase 14's re-homed "billing failure" trigger (wherever it lives) needs no change, but check
its retried invoice is stamped.

**PWA equivalent:** none new. The mobile app has no invoice surface, and the only mobile beat that
waits on the office here (authorising a List) already has Phase 14's PWA-only **"Office authorises
this List"**, which calls the same guarded `authoriseList` and so runs the same sending run. The
kept "Play the office" auto-authorise (`pwa/officeSimulation.ts`, RV-22) also calls
`runBillingForList`, so it sends too. Confirm both with the store-level tests in item 6 and by
checking Admin, Audit after a PWA authorise.

## Out of scope

- Real email or PDF generation, and the portal upload itself (who uploads and when, and an
  "uploaded" state). The queued state is where the engine's job ends in the demo; note it as a
  discovery question.
- Anaesthetist-facing GST number editing (the Phase 26 profile picks up `gstNumber`) and any mobile
  or web view of invoice delivery.
- Locking the Contract's invoicing settings and cover at AUTHORISED (Phase 25; the invoice
  snapshots are enough until then).
- The primary Procedure and Booking-level pricing (23); the anaesthetist adjustment (24); whether a
  prepayment nets off a covered gap (27, which replaces `prepaidCoveredSplit`).
- Credit-note, additional and balance invoice kinds (39, 27); `lineage` leaves room for them.
- The internal ledger (36): receivable and payable legs will read these invoices.
- US-08.6.4 (split a combined Procedure by additional invoices): parked on OQ-53.
- The final OQ-29 wording and any tax-code mapping on the Xero records.
- AA fee invoices (16): AA's own invoices in AA's name. They keep their wording and get no supplier,
  agent, delivery or buyer-created block (16's handoff asks for this exemption).

## Manual test checklist

- [ ] Reset. Admin, Master data, Anaesthetists: every row shows a GST number; editing Dr Souter's to
      "12" refuses with the GST message; a valid one saves and shows in History.
- [ ] Master data, Contracts: nib partial cover shows Portal delivery and "Covers up to $132.50";
      Portal is disabled with its reason on a hospital Contract; a patient-direct Contract hides
      Partial cover.
- [ ] S3 Beat 1: authorise Forte AM, then St George's PM. The banner counts emailed and queued.
      AA-2026-0002 Brian Holt Forte Health $396.18 shows "Emailed to" Forte's address in the rail,
      with the Simulated send badge; there is no Email invoice button.
- [ ] AA-2026-0005 Alan Prentice nib $152.38: contract-holder layout, Queued for nib provider portal,
      the covered-portion note linking to AA-2026-0006. AA-2026-0006 St George's $91.43: the full fee
      lines, "Less covered by nib", Emailed to St George's accounts address, linked back.
- [ ] Every invoice shows Dr Souter as supplier with her GST number, the agent block with AA's GST
      number, and the Provisional (OQ-29) pill.
- [ ] Optional aside: reset, set Alan Prentice as the billable party on his Booking (21's sheet),
      authorise the PM List: the gap invoice goes to Alan on the patient layout, emailed to his
      address; the nib invoice is unchanged.
- [ ] A party with no address: after a reset, clear St George's contact email in Master data (17),
      then authorise Dr Morrison's Mon 20 St George's List. Its invoices are raised with "No invoice
      email" (a person party cannot get here, because 21 blocks completion without an email); the
      monitor stage is partial with a link; typing an address and Send stamps it Emailed.
- [ ] Guardian: authorise the List holding Grace Park's Booking (21's guardian case). Her invoice
      is addressed to the guardian and "Emailed to" the guardian's address, not the patient's.
- [ ] Resend on a sent invoice adds a second send to the history; the nib invoice offers no Resend.
- [ ] An AA fee invoice (16) still reads as AA's own invoice: no supplier, agent or OQ-29 pill.
- [ ] The GST-inclusive Contract's invoice (stage one through its Booking, or authorise a List that
      has one) shows inclusive lines that add to the same total, with "includes GST of".
- [ ] Office billing setup on Prentice's Booking shows the read-only Cover row and no Funders row;
      no "Funder allocation" or "Billed to" text anywhere in the three apps.
- [ ] Xero simulation, AA-2026-0005 pair: the ACCPAY shows the Buyer-created tax invoice block with
      Dr Souter's and AA's GST numbers and the provisional pill; no NHI or patient name appears.
- [ ] Admin, Audit shows `invoice.sent`, `invoice.portalQueued` and `invoice.resend` with the right
      actor and source.
- [ ] PWA: "Office authorises this List" on a submitted List, then in the framed build Admin, Audit
      shows that List's invoices sent by the Billing run.
- [ ] No en or em dashes in any new app copy; teal is the only action colour; crimson only in the
      logo and existing identity.
- [ ] `npm run build`, `npm run build:pwa`, `npx vitest run` and `npm run shots` all green.

## Demo guide updates

Patch in the same session: `docs/demo-guide/03-demo-script.md`, `04-presenter-cheat-sheet.md`,
`02-workflows-and-handoffs.md`, `01-personas-and-responsibilities.md`, the same sections of
`master-demo-guide.html` (the S3 details block, the billing-run workflow paragraph and the cheat
sheet's Split billing and money sections) and the S3 scenario text in `DemoControlPanel.tsx`.

- **S3 Beat 1:**
  - Click: drop "Email invoice, All invoices"; instead "Pause on the Delivery card: the run already
    emailed it", then open AA-2026-0005 (Queued for nib's portal) and AA-2026-0006.
  - Say: "The Billing Engine, not Xero, produces and sends every invoice as part of the run, in Dr
    Souter's name with her GST number and AA as agent. Each Contract decides the layout, whether it
    goes by email or to an insurer portal, and how GST shows. Alan's Procedure sits on a nib cover
    Contract: nib is invoiced for the covered $132.50 plus GST, and the gap goes to the Booking's
    billable party, here St George's." Name the agent wording as provisional (OQ-29) and the cover
    mechanism as proposed (OQ-23).
  - Expected: figures unchanged ($396.18; $152.38 and $91.43); each invoice shows its delivery stamp.
  - Optional aside: replace the Funder allocation aside with "set Alan as the billable party before
    authorising the PM List to show the gap invoice on the patient layout, emailed to him".
  - "Covered portion" replaces "two-funder" in the beat and in "Stage it".
- **S3 Beat 2:** add one line: the ACCPAY carries provisional buyer-created tax invoice wording naming
  Dr Souter as supplier and AA as agent.
- **Discovery points (S3):** add the OQ-29 wording, the OQ-23 cover mechanism and portal upload
  ownership; drop the funder-split wording.
- **Cheat sheet:** Split billing bullets become "A Contract with a covered amount or percent splits
  one Procedure: holder for the covered part, billable party for the gap (proposed, OQ-23)"; add an
  "Invoices" block (anaesthetist as supplier, AA as agent, sent by the run to email or portal,
  Resend on the rail).
- **Workflows doc:** the billing-run steps 5, 8 and 9 (no conserved allocations; Contract-driven
  layout; the run sends or queues each invoice, the office resends only).
- **Personas doc:** the office no longer emails invoices; it resends, and fixes a missing invoice
  email.
- **Control Panel S3 text:** "the two-funder Card" becomes "the nib cover Booking"; mention the run
  sends the invoices.
- Not a milestone phase; no full consistency read (Phase 25 closes the "After 25" milestone).

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
- **Conservation.** For every covered Procedure, `covered + gap === fee` to the cent, after an office
  override too; the Prentice figures are exactly $152.38 and $91.43; a zero gap raises no invoice; no
  line is billed twice or dropped when a party's invoice spans several Procedures.
- **Who gets what.** The covered portion always goes to the holder, whatever the Booking override;
  the gap goes to the override or the patient; `defaultBillablePartyFor` changed only for covered
  Contracts, and every other seeded payer is unchanged from Phase 21.
- **No residue.** Zero hits for `funderOverride`, `FunderAllocation`, `allocationNotConserved`,
  `allocationStale`, `markInvoiceEmailed`, `emailedAtISO` and "Email invoice"; no dead exports; no
  test skipped instead of rewritten.
- **Sending.** Every invoice path (run, retry, prepayment raise) goes through the one materialiser and
  stamps delivery in the same `mutate()` with a system audit entry; `noAddress` never fails a run;
  portal only for a direct-claims insurer holder and never for a gap; `resendInvoice` is office-only
  and audited.
- **Snapshots.** Supplier, agent, GST treatment, invoice email and the ACCPAY `taxInvoice` are
  snapshots, so editing a GST number, a Contract's invoicing or an email after the run changes no
  raised invoice; no NHI or patient name reaches the ACCPAY wording (`xeroNhi.test.ts`).
- **GST presentation.** Inclusive lines sum to the stored total to the cent, including negative
  deduction lines; stored amounts stay GST exclusive; `GST_RATE` lives in one place.
- **Provisional labels.** Every surface with the agent or buyer-created wording shows the OQ-29 pill,
  and every cover surface the OQ-23 label; the wording lives only in `invoicePresentation.ts`. AA fee
  invoices (16) carry none of it.
- **Recipient.** A guardian-billed Booking is emailed to the guardian's address (US-08.4.2).
- **Discipline.** Every write through `mutate()`; `PERSIST_VERSION` bumped; seed deep-equal across
  builds; the PWA sends through 14's trigger with no new PWA entry; design tokens (teal actions,
  semantic pills, mono GST numbers, crimson only as identity); no en or em dashes in app copy; the
  demo guide figures match the running app.

## PROGRESS.md updates

- **Status table:** a catch-up row for Phase 22.
- **Phase entry:** the drift check result (catalogue diff, OQ-29 and OQ-23 status, what 18 to 21
  left), files and actions added and removed, the `PERSIST_VERSION` bump, the tests added and
  rewritten, the manual checklist item by item, and the review pass.
- **Decisions log:**
  - Supersede **2026-07-22 fifth external review #4**: `BillingLine.funderOverride` and its
    conservation rule are removed; one Procedure splits between two payers only through the
    Contract's `cover` (US-08.2.3), provisional on OQ-23.
  - Supersede **Phase 08 decision (2)**'s layout rule: layout comes from the Contract, falling back
    to the recipient's class only for an override or a gap (US-04.2.8), and **decision (4)**'s GST
    caption: prices held GST exclusive is now the catalogue rule (US-05.2.7), and GST presentation
    is a Contract setting.
  - Supersede Phase 08 work item 2's manual "Email invoice": the run sends or queues each invoice
    (US-08.4.2); the office only resends. Note the 2026-07-28 rail layout stands with Resend in the
    Email slot.
  - New readings: the covered portion always goes to the holder; a party's multi-Contract invoice
    takes the first Procedure's invoicing settings; portal only for a direct-claims insurer holder;
    a missing invoice email raises the invoice unsent rather than failing it; the OQ-29 supplier,
    agent and buyer-created wording is provisional.
  - Handoff item P3 (GST per-invoice rounding on splits) now reads "covered splits".
- **Handoff notes:** Phase 25 locks `invoicing` and `cover` with the Contract version; Phase 26's
  profile shows and edits `gstNumber`; Phase 27 replaces `prepaidCoveredSplit` and may add the
  balance kind using `lineage`; Phase 36's ledger legs read `procedureIds` and `lineage`; Phase 39
  adds credit and additional lineage roles; portal upload ownership and the OQ-29 wording are
  questions for AA; the stale catalogue screenshots for US-08.2.3, US-08.4.2 and US-09.1.4 need
  re-shooting by the owner.
