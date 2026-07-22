# Phase 10 — Xero & payments simulation

**Requirements covered:** X1–X5, M11 live, D9 enforcement, remainder of W1/W4 data
**Depends on:** Phase 09.
**Estimated:** 1 session.

## Goal

The money story completes: a simulated Xero AR/banking instance receives ACCREC/ACCPAY pairs,
payments arrive by webhook or reconciliation poll, ACCPAYs authorise and disburse via payables
runs, and the anaesthetist-facing balance/GST views go live. The trust-account two-state model
(paid-in vs disbursed) is visibly demoable.

## Work items

1. **Xero simulator surface** (`/demo/xero`, demo-badged): tabs —
   - **Contacts**: ContactID, ContactNumber, name, type (organisation / patient / billable party), archived flag. **NHI must not appear anywhere on this surface** (convention 8). The callout must present this as the RFP contradiction it is: Appendix 1 wants the NHI as a searchable cross-reference field on the Xero contact, Appendix 2 says it never enters Xero — **the prototype implements Appendix 2 (stricter data minimisation), and this needs an AA ruling in discovery**, not a settled requirement.
   - **Invoices**: ACCREC list (contact, invoice number, reference, status AUTHORISED/PAID, amount) and ACCPAY list (anaesthetist, status DRAFT/AUTHORISED/PAID, amount) with the GUID pairing visible via the billing-case link. ACCREC/ACCPAY numbers visibly similar (AA preference). A callout notes Xero's **duplicate-invoice-number-prevention org setting** as a mandated-configuration discovery item (an RFP "open item carried forward").
2. **Handoff from billing** (replaces Phase 08's stub): on invoice generation, contact resolution
   splits by counterparty type —
   - **Organisational payers** (hospitals/contract holders, the direct insurer): persistent, named
     organisation contacts resolved by counterparty id — no hidden-ID workflow, never archived
     (they're the ~50% of invoices going to a few majors; the archiving strategy exists for the
     one-time-patient tail, not for them).
   - **Patient/Billable-Party payers**: the RFP Appendix 2 workflow — cached ContactID → lookup by
     ContactNumber (= hidden internal ID) → create. Each payer identity resolves by its **own**
     hidden ID: a guardian/BillableParty record gets its own contact, distinct from the patient's
     (NHI-driven dedupe applies to patients only — guardians hold no NHI, so they dedupe by hidden
     ID alone; noted as a demo reading). **If the matched contact is archived**, invoice
     against it and surface the "unarchive step TBC in sandbox" note from Appendix 2 (demo: the
     archived contact visibly returns to use).
   Then create the ACCREC (to payer) + DRAFT ACCPAY (to anaesthetist, undiscounted payable) linked
   by GUIDs on the BillingCase. The billing monitor's Xero stage goes live (success/failure per
   invoice; one triggerable failure + retry).
2a. **Intake checks** (Appendix 2's front half, demoed at billing/booking time): a repeat patient
   **deduplicates via NHI** in the practice system (one hidden ID → one Xero contact for life —
   seeded repeat patients prove it), and before billing a new episode the system surfaces any
   **outstanding unpaid balances** from prior episodes for staff attention (banner on the card /
   billing monitor row).
3. **Payment detection**:
   - Demo control **"Payment received"** (pick an open ACCREC; full or partial amount) = the Xero webhook; handler checks invoice state, flips ACCPAY DRAFT→AUTHORISED (pro-rata for partials), idempotent by InvoiceID.
   - **Daily reconciliation poll** runs on clock advance and catches a seeded "webhook missed" payment (idempotency provable: fire webhook then advance clock — no double effect).
4. **Payables run & disbursement**: demo/office action "Run payables" — pays all AUTHORISED
   ACCPAYs, creating Disbursement records (payablesRunId). Every invoice's money state readable as
   two independent flags with dates: paid-into-AA / disbursed-to-anaesthetist (trust-account
   behaviour).
5. **Contact archiving job**: clock-advance-triggered (and manually runnable) job archiving
   **individual contacts only — patients and billable parties alike** (the RFP asks how "Patient
   and Billable Party records" are deduplicated and archived at scale; guardians belong to the
   same one-time-client tail) once fully paid + inactive for a **configurable window** (a named
   constant/setting, seeded at 90 days as the RFP's own illustrative figure — the RFP presents 90
   days as "e.g.", not a fixed rule, so don't hardcode it as gospel; expose it as an editable value
   in the master-data or control-panel surface so the demo can show a different AA-chosen window
   without a code change) (organisational contacts are exempt); archived count visible with the
   ~10k soft-limit rationale in a callout that also carries the RFP's volume story as **seeded
   aggregate counters** (≈28k invoices/yr, ~99% one-time clients, an active-contact count seeded
   near the soft limit) which the archive job visibly reduces — scale is narrated with counters,
   not simulated records (N4/§10); archived contacts retain history; repeat patients reuse
   their contact.
5a. **Automated money events are audited** (N3/A7; RFP: "audit trails of manual and automated
   actions are required"): Xero handoff outcomes, webhook/poll payment updates, ACCPAY flips,
   payables-run disbursements and archive-job actions all write audit entries with source=system,
   visible in the Phase 07 audit viewer alongside manual actions.
6. **Anaesthetist views go live** — all reading the **billing engine's own mirror, never the
   Xero-sim slice** (RFP: the app never queries Xero; the Billing Engine's database is the sole
   source, kept in sync by the webhook/poll writes). Structurally: view selectors import from
   `billing`, never from `xero` — greppable, and Xero-sim state changes reach the apps only via
   the sync handlers.
   - Mobile + web **Outstanding balances**: flat list of the anaesthetist's **individual ACCPAY invoices — one row per invoice, no Card-level or other rollup** (the RFP's "line item(s)" phrasing refers to these rows; queries about a row go to office staff, not drill-downs), appearing the **next day** after invoice generation (clock rule) — demo: generate → not visible → advance day → visible.
   - Receivables aging + Overdue page compute from the mirror's invoice/payment states (the anaesthetist-perspective view of what remains uncollected).
   - **GST-period activity summary**: date-ranged received amounts + GST component per the anaesthetist's GST-period setting (already on the master from Phase 02's seed).
7. **Tests**: NHI-never-in-Xero (assert the Xero slice's serialised state contains no seeded NHI
   strings); webhook idempotency; partial-payment pro-rata; archive-job criteria (incl.
   organisational contacts never archived; a fully-paid, inactive billable-party contact IS
   eligible); repeat-patient dedupe (one contact across episodes);
   next-day visibility rule.

## Out of scope

Real Xero API shapes beyond what the demo needs; bulk remittance/bank rec (RFP: stays in Xero,
out of scope); integrations (11).

## Manual test checklist

- [ ] Authorise → invoices → Xero tab shows the right contact per counterparty type: a hospital invoice hits its persistent organisation contact (no hidden ID), a patient invoice runs the hidden-ID workflow (repeat patient reuses; NHI nowhere) — and the ACCREC + DRAFT ACCPAY pair carries similar numbers.
- [ ] A repeat patient with an unpaid prior episode surfaces the outstanding-balance banner before the new episode bills; invoicing a patient whose contact was archived brings it back into use with the unarchive-TBC note.
- [ ] Full payment webhook flips the paired ACCPAY to AUTHORISED; a partial payment authorises pro-rata and Overdue shows the remaining balance.
- [ ] Paying a pre-payment pre-invoice via the payment webhook clears that card's completion block without an override (closes Phase 09's deferred verification of the pre-payment gate).
- [ ] Webhook + poll double-delivery causes no duplicate effect.
- [ ] Payables run pays AUTHORISED ACCPAYs; the invoice shows paid-in ✓ / disbursed ✓ as separate states with dates.
- [ ] Anaesthetist balances appear only after advancing to the next day; GST summary totals match payments received in the period.
- [ ] The audit viewer reconstructs one invoice's automated trail end-to-end: billing run → Xero handoff → payment webhook → ACCPAY flip → payables run (all source=system entries).
- [ ] Archive job archives eligible contacts only; count and rationale visible; changing the inactivity-window setting changes what's eligible on the next run (proving it's not hardcoded).
- [ ] `npm run build` + `npx vitest run` green (incl. the no-NHI-in-Xero test).

## PROGRESS.md updates

Status row + entry; log the NHI reading (Appendix 2's never-in-Xero over Appendix 1's cross-reference field) as a Decision with the RFP-contradiction note.
