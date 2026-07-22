# Phase 08 — Billing engine: run & invoices

**Requirements covered:** B1–B6, B9, B10
**Depends on:** Phase 07 (the `listAuthorised` trigger) and Phase 01 (the calculator).
**Estimated:** 1 session.

## Goal

The billing engine's core, with undivided focus: authorising a List runs per-procedure route
resolution, contract lookup, rating via the Phase 01 calculator, split-billing enforcement, and
grouping into invoice documents. Exception flows (pre-payment, post-op) and the monitor surface
follow in Phase 09.

## Work items

1. **Billing run** (`src/store/billingRun.ts`, consuming `listAuthorised` — replace Phase 07's
   placeholder queue): per the RFP's Billing Engine Integration Point —
   - Iterate the List's Cards → Procedures.
   - **Resolve route** per procedure: Hospital/Contract-Holder / Billable Party / Insurer. On the Contract-Holder route, resolution is **by contract holder, not literally by hospital** — the governing contract is usually hospital-held but may be surgeon- or group-held (bariatric, TMJ, orthopaedic groups like COS; `holderType` in the model). Contract-Holder and Insurer routes always resolve a governing contract (default Type 1 guaranteed — no "no contract" branch); Billable Party has no contract unless an individual-arrangement contract exists (nullable, per the Data-Model reading).
   - **Rate** via the Phase 01 pure functions: RVG/BTM, fixed fee (Type 3 + price-list incl. 2nd-procedure ordinal), rate×time (contract-permitted), Type 2 agreed rate/discount, typed overrides with reason. The seeded **surgeon-held bariatric contract must be exercised** by at least one runnable card (proving non-hospital contract holders rate correctly).
   - **Enforce split billing**: `isAdditional` procedures contribute time units only (the calculator guarantees it — the run must not bypass it); per-funder billing lines split into separate counterparty groups (one procedure, two funders → two invoices).
   - **Group by counterparty per Card** → create Invoices (+ lines with snapshot amounts) and a BillingCase per invoice. One Card → potentially many invoices; same-counterparty procedures share one.
   - Set `billedAt` on the List — the trigger that removes it from the anaesthetist views (the RFP's proposed reading: invoice generation, not AUTHORISED, not payment).
2. **Invoice documents**: on-screen invoice preview — two layouts per the RFP: contract-holder and
   patient (header, addressee, case reference, line items with units/rate/amount, GST, total;
   agency wording: billed by AA as agent for Dr X). On the patient layout, reflect the Procedure's
   `patientPaymentCategory` in the wording/workflow badge: post-procedure ("Payment due on
   receipt"), pre-payment ("Deposit due before your procedure" / balance invoice), or
   insured-reimbursement ("You may claim this from your insurer" — the patient, not AA, forwards
   it; distinct from an `Insurer`-route invoice, which is addressed to the insurer directly).
   Unique `invoiceNumber` sequence;
   `caseReference` displayed as internal reference only. Delivery per the RFP ("printed and
   emailed from the Billing Engine"): "Email invoice" = mark emailed-at (demo-badge the send
   step); **"Print"** = browser print of the invoice document via a print stylesheet (no PDF
   library); invoices to the direct-claim insurer (nib) instead show a **"present via nib upload
   portal"** workflow status (stub — the RFP notes their presentation runs through an upload
   portal). Xero handoff renders as a "pending Phase 10" stub state.
3. **Anaesthetist-view effects**: billed lists disappear from mobile/web Lists views (the
   `billedAt` selector Phases 03–04 left in place); SUBMITTED lists still visible. Receivables/
   Overdue pages may now read generated invoices with an honest "awaiting Xero sync" state where
   payment data doesn't exist yet.
4. **Tests** (Vitest, on the run orchestration): one-card-multi-counterparty → multiple invoices;
   split-billing pair (time-only on the additional procedure's lines); one-procedure-two-funders →
   two invoices; type 2 discount and type 3 fixed-price runs; a **surgeon-held contract resolves
   and rates** (non-hospital holder); override applied with reason snapshotted; **snapshot
   immunity** (mutating the contract after billing doesn't change the stored invoice);
   same-counterparty grouping.

## Out of scope

Pre-payment, post-op addendum, billing monitor, failure/retry (Phase 09). Xero records (10).

## Manual test checklist

- [ ] Authorise a seeded SUBMITTED list → invoices appear grouped by counterparty; the List disappears from mobile/web Lists views while SUBMITTED ones remain.
- [ ] The split-billing card produces two invoices; the additional procedure's lines are time-only.
- [ ] A multi-procedure same-counterparty card produces ONE invoice with grouped lines.
- [ ] Invoice previews: contract-holder vs patient layouts differ appropriately; unique invoice numbers; case reference shown; fee maths spot-checks against the mobile BTM capture (units × that anaesthetist's unit value).
- [ ] All three patient payment categories bill correctly with distinct invoice wording: the self-funded-post-procedure patient, and the insured-reimbursement patient (invoice to the patient, "claim from your insurer" wording — not addressed to the insurer).
- [ ] Change the governing contract's rate after billing → the stored invoice is unchanged (effective-dating/snapshot story).
- [ ] `npm run build` + `npx vitest run` green (new billing-run tests included).

## PROGRESS.md updates

Status row + entry; log the billedAt-trigger reading and the two-funder modelling (per-line funder) in the Decisions log.
