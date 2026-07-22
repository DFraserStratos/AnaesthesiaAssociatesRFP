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
   - **Resolve route** per procedure: Hospital/Contract-Holder / Billable Party / Insurer. On the Contract-Holder route, resolution is **by contract holder, not literally by hospital** — the governing contract is usually hospital-held but may be surgeon- or group-held (bariatric, TMJ, orthopaedic groups like COS; `holderType` in the model). The default-contract guarantee is **scoped exactly as the RFP states it**: every *Hospital* and *direct-billing Insurer* holds a protected default Type 1, and an expired/absent negotiated (Type 2/3) contract for those counterparties **falls back to their default** (standard rates) — no "no contract" branch there. Surgeon-, group- or organisation-held contracts carry **no mandated default**: missing/expired there resolves to a billing exception (Phase 09's failure demo). Billable Party has no contract unless an individual-arrangement contract exists (nullable, per the Data-Model reading).
   - **Rate** via the Phase 01 pure functions: RVG/BTM, fixed fee (Type 3 + price-list incl. 2nd-procedure ordinal), rate×time (contract-permitted), Type 2 agreed rate/discount, typed overrides with reason. The seeded **surgeon-held bariatric contract must be exercised** by at least one runnable card (proving non-hospital contract holders rate correctly), and the seeded **rate×time card** must bill hours × the agreed rate (Method 3, contract-permitted).
   - **Enforce split billing**: `isAdditional` procedures contribute time units only (the calculator guarantees it — the run must not bypass it); per-funder billing lines split into separate counterparty groups (one procedure, two funders → two invoices).
   - **Group by counterparty per Card** → create Invoices (+ lines with snapshot amounts) and a BillingCase per invoice. One Card → potentially many invoices; same-counterparty procedures share one. **Labelled reading** (REQUIREMENTS §11): the RFP's Split Billing section says "two separate invoices must be generated" in either split scenario, while its grouping sections twice say same-counterparty procedures are "billed together on a single invoice" — resolved by the RFP's own cross-reference: the split-billing two-invoice outcome arises because the additional procedure has a *different funder*. Note the reading in UI copy on the invoice/monitor surface and keep it as a discovery question.
   - **The run is audited like any manual action** (N3/A7; RFP: "audit trails of manual and
     automated actions are required"): invoice creation, `billedAt`, and per-card outcomes write
     audit entries with source=system/billing, reconstructable in the Phase 07 audit viewer.
   - Set `billedAt` on the List — the trigger that removes it from the anaesthetist views (the RFP's proposed reading: invoice generation, not AUTHORISED, not payment). Define it precisely as **completion of the List's billing run** — the "unambiguous system event" the RFP asks to be confirmed: a per-card failure (Phase 09 isolation) doesn't hold the List on screen (its invoice lands on retry), and a Xero handoff failure (Phase 10) doesn't restore visibility — the billing monitor owns both.
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
   **default fallback** (a hospital's Type 2 contract effective-dated out → rating falls back to
   that hospital's default Type 1 at standard rates, no failure);
   the run writes audit entries (source=system) for invoice creation and `billedAt`;
   same-counterparty grouping.

## Out of scope

Pre-payment, post-op addendum, billing monitor, failure/retry (Phase 09). Xero records (10).

## Manual test checklist

- [ ] Authorise a seeded SUBMITTED list → invoices appear grouped by counterparty; the List disappears from mobile/web Lists views while SUBMITTED ones remain.
- [ ] The split-billing card produces two invoices; the additional procedure's lines are time-only.
- [ ] The seeded rate×time card bills hours × its contract's agreed rate, and its invoice line shows chargeBasis rate×time.
- [ ] A multi-procedure same-counterparty card produces ONE invoice with grouped lines (the §11 labelled reading of the RFP's split-billing/grouping tension — the two-invoice rule applies when funders differ).
- [ ] Invoice previews: contract-holder vs patient layouts differ appropriately; unique invoice numbers; case reference shown; fee maths spot-checks against the mobile BTM capture (units × that anaesthetist's unit value).
- [ ] All three patient payment categories bill correctly with distinct invoice wording: the self-funded-post-procedure patient, and the insured-reimbursement patient (invoice to the patient, "claim from your insurer" wording — not addressed to the insurer).
- [ ] Change the governing contract's rate after billing → the stored invoice is unchanged (effective-dating/snapshot story).
- [ ] `npm run build` + `npx vitest run` green (new billing-run tests included).

## Adversarial review (after build)

After the manual test checklist and `npm run build` / `npx vitest run` are green — and before writing the PROGRESS entry — run the standard **adversarial review-and-fix pass (PROGRESS convention 18)**: fan out a few independent Opus review subagents (one each for **quality**, **bugs/correctness** and **plan adherence** — scale the fan-out up for this load-bearing money phase), then this session independently verifies every finding against the source docs and the code, fixes the confirmed ones, re-greens build + tests, and records the pass in the phase entry. Do not re-raise anything already settled in the Decisions log.

**Steer this phase's reviewers at:**
- Route resolution is by contract HOLDER (hospital / surgeon / group / organisation), and the default fallback is scoped exactly to Hospitals + direct-billing Insurers (fall back to their protected Type 1); surgeon/group/organisation holders have NO mandated default → a genuine exception, never a silent fallback.
- Split billing holds: `isAdditional` procedures contribute time units only (the run must not bypass the calculator); per-funder lines split into separate counterparty groups (two funders → two invoices); same-counterparty procedures share one invoice (the §11 labelled reading).
- `billedAt` = completion of the billing run (not AUTHORISED, not payment) and drives the anaesthetist-view disappearance; snapshot immunity holds (mutating a contract after billing leaves the stored invoice unchanged).
- The run is audited source=system/billing; invoice numbers are unique; no NHI reaches invoice or Xero-bound data; fee maths matches the mobile BTM capture (units × that anaesthetist's own rate).

## PROGRESS.md updates

Status row + entry; log the billedAt-trigger reading and the two-funder modelling (per-line funder) in the Decisions log.
